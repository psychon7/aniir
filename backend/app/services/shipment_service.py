"""
Shipment Service (legacy logistics).

Provides business logic for:
- Shipment CRUD operations mapped to TM_LGS_Logistic
- Status management
- Tracking information
- Delivery scheduling
- Statistics
"""
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

from app.database import get_db
from app.models.logistics import Logistic
from app.models.consignee import Consignee
from app.models.supplier import Supplier
from app.repositories.shipment_repository import ShipmentRepository
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentSearchParams,
    ShipmentResponse, ShipmentDetailResponse, ShipmentListResponse, ShipmentListItemResponse,
    BulkStatusUpdateRequest, BulkStatusUpdateResponse,
    TrackingEvent, TrackingResponse,
    CarrierListItemResponse, CarrierResponse,
    LogisticsActionResponse,
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class ShipmentServiceError(Exception):
    """Base exception for shipment service errors."""
    def __init__(self, message: str, code: str = "SHIPMENT_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ShipmentNotFoundError(ShipmentServiceError):
    """Raised when shipment is not found."""
    def __init__(self, shipment_id: int):
        super().__init__(
            f"Shipment with ID {shipment_id} not found",
            code="SHIPMENT_NOT_FOUND",
            details={"shipment_id": shipment_id}
        )


class ShipmentReferenceNotFoundError(ShipmentServiceError):
    """Raised when shipment is not found by reference."""
    def __init__(self, reference: str):
        super().__init__(
            f"Shipment with reference '{reference}' not found",
            code="SHIPMENT_REFERENCE_NOT_FOUND",
            details={"reference": reference}
        )


class ShipmentTrackingNotFoundError(ShipmentServiceError):
    """Raised when shipment is not found by tracking number."""
    def __init__(self, tracking_number: str):
        super().__init__(
            f"Shipment with tracking number '{tracking_number}' not found",
            code="SHIPMENT_TRACKING_NOT_FOUND",
            details={"tracking_number": tracking_number}
        )


class ShipmentValidationError(ShipmentServiceError):
    """Raised when shipment validation fails."""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, code="SHIPMENT_VALIDATION_ERROR", details=details)


class ShipmentStatusError(ShipmentServiceError):
    """Raised when shipment status transition is invalid."""
    def __init__(self, message: str, current_status: int, target_status: int):
        super().__init__(
            message,
            code="SHIPMENT_STATUS_ERROR",
            details={"current_status": current_status, "target_status": target_status}
        )


class ShipmentDeleteError(ShipmentServiceError):
    """Raised when shipment cannot be deleted."""
    def __init__(self, shipment_id: int, reason: str):
        super().__init__(
            f"Cannot delete shipment {shipment_id}: {reason}",
            code="SHIPMENT_DELETE_ERROR",
            details={"shipment_id": shipment_id, "reason": reason}
        )


class LogisticsActionError(ShipmentServiceError):
    """Raised when a logistics action (send/receive/stock-in) is invalid."""
    def __init__(self, message: str, shipment_id: int, action: str):
        super().__init__(
            message,
            code="LOGISTICS_ACTION_ERROR",
            details={"shipment_id": shipment_id, "action": action}
        )


# ==========================================================================
# Shipment Service
# ==========================================================================

class ShipmentService:
    """Service for managing shipments (legacy logistics)."""

    # Status IDs mapping
    STATUS_PENDING = 1
    STATUS_IN_TRANSIT = 2
    STATUS_DELIVERED = 3
    STATUS_EXCEPTION = 4
    STATUS_RETURNED = 5
    STATUS_CANCELLED = 6

    STATUS_LABELS = {
        STATUS_PENDING: "pending",
        STATUS_IN_TRANSIT: "in_transit",
        STATUS_DELIVERED: "delivered",
        STATUS_EXCEPTION: "exception",
        STATUS_RETURNED: "returned",
        STATUS_CANCELLED: "cancelled",
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ShipmentRepository(db)

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    def _derive_status(self, shipment: Logistic) -> Tuple[int, str]:
        if shipment.lgs_is_stockin or shipment.lgs_is_received or shipment.lgs_d_arrive:
            return self.STATUS_DELIVERED, self.STATUS_LABELS[self.STATUS_DELIVERED]
        if shipment.lgs_is_send or shipment.lgs_d_send:
            return self.STATUS_IN_TRANSIT, self.STATUS_LABELS[self.STATUS_IN_TRANSIT]
        return self.STATUS_PENDING, self.STATUS_LABELS[self.STATUS_PENDING]

    def _combine_address(self, *parts: Optional[str]) -> Optional[str]:
        cleaned = [part.strip() for part in parts if part and part.strip()]
        return ", ".join(cleaned) if cleaned else None

    def _format_full_address(self, address: Optional[str], city: Optional[str], country: Optional[str]) -> str:
        return ", ".join([part for part in [address, city, country] if part])

    def _calculate_line_totals(self, shipment: Logistic) -> Tuple[Optional[int], Optional[Decimal], Optional[Decimal]]:
        lines = shipment.lines or []
        if not lines:
            return None, None, None

        packages = len(lines)
        total_qty = Decimal("0")
        total_cost = Decimal("0")

        for line in lines:
            if line.lgs_quantity is not None:
                total_qty += Decimal(line.lgs_quantity)
            if line.lgs_total_price is not None:
                total_cost += Decimal(line.lgs_total_price)
            elif line.lgs_unit_price is not None and line.lgs_quantity is not None:
                total_cost += Decimal(line.lgs_unit_price) * Decimal(line.lgs_quantity)

        weight = total_qty if total_qty > 0 else None
        cost = total_cost if total_cost > 0 else None
        return packages, weight, cost

    def _base_payload(self, shipment: Logistic) -> Tuple[dict, int, str, Optional[str], Optional[str]]:
        status_id, status_name = self._derive_status(shipment)
        supplier = shipment.supplier
        consignee = shipment.consignee

        origin_address = None
        origin_city = None
        origin_country_name = None
        if supplier:
            origin_address = self._combine_address(supplier.sup_address1, supplier.sup_address2)
            origin_city = supplier.sup_city
            origin_country_name = supplier.sup_country

        destination_address = None
        destination_city = None
        destination_country_name = None
        if consignee:
            destination_address = self._combine_address(
                consignee.con_address1,
                consignee.con_address2,
                consignee.con_address3,
            )
            destination_city = consignee.con_city
            destination_country_name = consignee.con_country

        packages, weight, cost = self._calculate_line_totals(shipment)

        payload = {
            "shp_id": shipment.lgs_id,
            "shp_reference": shipment.lgs_code,
            "shp_del_id": None,
            "shp_car_id": shipment.sup_id or 0,
            "shp_tracking_number": shipment.lgs_tracking_number,
            "shp_sta_id": status_id,
            "shp_con_id": shipment.con_id,
            "shp_sod_id": shipment.sod_id,
            "shp_is_purchase": shipment.lgs_is_purchase,
            "shp_origin_address": origin_address,
            "shp_origin_city": origin_city,
            "shp_origin_country_id": None,
            "shp_destination_address": destination_address,
            "shp_destination_city": destination_city,
            "shp_destination_country_id": None,
            "shp_weight": weight,
            "shp_packages": packages,
            "shp_estimated_delivery": shipment.lgs_d_arrive_pre,
            "shp_actual_delivery": shipment.lgs_d_arrive,
            "shp_cost": cost,
            "shp_cur_id": supplier.cur_id if supplier else None,
            "shp_notes": shipment.lgs_comment,
            "shp_created_at": shipment.lgs_d_creation,
            "shp_updated_at": shipment.lgs_d_update,
        }
        return payload, status_id, status_name, origin_country_name, destination_country_name

    def _to_response(self, shipment: Logistic) -> ShipmentResponse:
        payload, _, _, _, _ = self._base_payload(shipment)
        return ShipmentResponse(**payload)

    def _to_list_item(self, shipment: Logistic) -> ShipmentListItemResponse:
        payload, status_id, status_name, _, _ = self._base_payload(shipment)
        supplier = shipment.supplier
        consignee = shipment.consignee
        return ShipmentListItemResponse(
            **payload,
            carrier_name=supplier.sup_company_name if supplier else None,
            consignee_name=consignee.con_company_name if consignee else None,
            status_name=status_name,
            is_delivered=status_id == self.STATUS_DELIVERED,
        )

    def _to_detail_response(self, shipment: Logistic) -> ShipmentDetailResponse:
        payload, status_id, status_name, origin_country_name, destination_country_name = self._base_payload(shipment)
        supplier = shipment.supplier
        consignee = shipment.consignee

        full_origin_address = self._format_full_address(
            payload.get("shp_origin_address"),
            payload.get("shp_origin_city"),
            origin_country_name,
        )
        full_destination_address = self._format_full_address(
            payload.get("shp_destination_address"),
            payload.get("shp_destination_city"),
            destination_country_name,
        )

        is_delivered = status_id == self.STATUS_DELIVERED
        is_on_time = None
        if is_delivered and shipment.lgs_d_arrive_pre and shipment.lgs_d_arrive:
            is_on_time = shipment.lgs_d_arrive <= shipment.lgs_d_arrive_pre

        return ShipmentDetailResponse(
            **payload,
            carrier_name=supplier.sup_company_name if supplier else None,
            consignee_name=consignee.con_company_name if consignee else None,
            status_name=status_name,
            currency_code=None,
            origin_country_name=origin_country_name,
            destination_country_name=destination_country_name,
            delivery_form_reference=None,
            is_delivered=is_delivered,
            is_on_time=is_on_time,
            full_origin_address=full_origin_address,
            full_destination_address=full_destination_address,
        )

    # ==========================================================================
    # CRUD Operations
    # ==========================================================================

    async def create_shipment(self, data: ShipmentCreate) -> Logistic:
        """Create a new shipment."""
        if not data.shp_car_id:
            raise ShipmentValidationError("Carrier ID is required")

        if not data.shp_sta_id:
            raise ShipmentValidationError("Status ID is required")

        try:
            shipment = await self.repository.create_shipment(data)
        except ValueError as exc:
            raise ShipmentValidationError(str(exc)) from exc

        await self.db.commit()
        return shipment

    async def get_shipment(self, shipment_id: int) -> Logistic:
        """Get shipment by ID."""
        shipment = await self.repository.get_shipment(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError(shipment_id)
        return shipment

    async def get_shipment_by_reference(self, reference: str) -> Logistic:
        """Get shipment by reference."""
        shipment = await self.repository.get_shipment_by_reference(reference)
        if not shipment:
            raise ShipmentReferenceNotFoundError(reference)
        return shipment

    async def get_shipment_by_tracking(self, tracking_number: str) -> Logistic:
        """Get shipment by tracking number."""
        shipment = await self.repository.get_shipment_by_tracking(tracking_number)
        if not shipment:
            raise ShipmentTrackingNotFoundError(tracking_number)
        return shipment

    async def update_shipment(
        self,
        shipment_id: int,
        data: ShipmentUpdate
    ) -> Logistic:
        """Update a shipment."""
        existing = await self.get_shipment(shipment_id)

        if existing and self._derive_status(existing)[0] == self.STATUS_CANCELLED:
            raise ShipmentStatusError(
                "Cannot update a cancelled shipment",
                current_status=self.STATUS_CANCELLED,
                target_status=self.STATUS_CANCELLED
            )

        try:
            shipment = await self.repository.update_shipment(shipment_id, data)
        except ValueError as exc:
            raise ShipmentValidationError(str(exc)) from exc

        await self.db.commit()
        return shipment

    async def delete_shipment(self, shipment_id: int) -> None:
        """Delete a shipment."""
        shipment = await self.get_shipment(shipment_id)

        status_id, _ = self._derive_status(shipment)
        if status_id not in [self.STATUS_PENDING, self.STATUS_CANCELLED]:
            raise ShipmentDeleteError(
                shipment_id,
                "Only pending or cancelled shipments can be deleted"
            )

        success = await self.repository.delete_shipment(shipment_id)
        if not success:
            raise ShipmentNotFoundError(shipment_id)
        await self.db.commit()

    async def search_shipments(self, params: ShipmentSearchParams) -> ShipmentListResponse:
        """Search shipments with filters and pagination."""
        items, total = await self.repository.search_shipments(params)
        total_pages = (total + params.page_size - 1) // params.page_size

        return ShipmentListResponse(
            items=[self._to_list_item(item) for item in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages,
        )

    # ==========================================================================
    # Status Management
    # ==========================================================================

    async def update_status(
        self,
        shipment_id: int,
        status_id: int,
        actual_delivery: Optional[datetime] = None
    ) -> Logistic:
        """Update shipment status."""
        shipment = await self.get_shipment(shipment_id)

        self._validate_status_transition(self._derive_status(shipment)[0], status_id)

        updated = await self.repository.update_status(
            shipment_id,
            status_id,
            actual_delivery
        )
        await self.db.commit()
        return updated

    async def bulk_update_status(
        self,
        request: BulkStatusUpdateRequest
    ) -> BulkStatusUpdateResponse:
        """Bulk update status for multiple shipments."""
        failed_ids = []
        successful_count = 0

        for shipment_id in request.shipment_ids:
            try:
                shipment = await self.repository.get_shipment(shipment_id)
                if not shipment:
                    failed_ids.append(shipment_id)
                    continue

                try:
                    self._validate_status_transition(self._derive_status(shipment)[0], request.new_status_id)
                except ShipmentStatusError:
                    failed_ids.append(shipment_id)
                    continue

                successful_count += 1
            except Exception:
                failed_ids.append(shipment_id)

        valid_ids = [sid for sid in request.shipment_ids if sid not in failed_ids]
        if valid_ids:
            await self.repository.bulk_update_status(valid_ids, request.new_status_id)
            await self.db.commit()

        return BulkStatusUpdateResponse(
            success=len(failed_ids) == 0,
            updated_count=successful_count,
            failed_ids=failed_ids,
            message=f"Updated {successful_count} shipments, {len(failed_ids)} failed"
        )

    def _validate_status_transition(self, current_status: int, target_status: int) -> None:
        """Validate status transition is allowed."""
        allowed_transitions = {
            self.STATUS_PENDING: [self.STATUS_IN_TRANSIT, self.STATUS_CANCELLED],
            self.STATUS_IN_TRANSIT: [self.STATUS_DELIVERED, self.STATUS_EXCEPTION, self.STATUS_RETURNED],
            self.STATUS_DELIVERED: [],
            self.STATUS_EXCEPTION: [self.STATUS_IN_TRANSIT, self.STATUS_RETURNED, self.STATUS_CANCELLED],
            self.STATUS_RETURNED: [self.STATUS_CANCELLED],
            self.STATUS_CANCELLED: [],
        }

        if current_status not in allowed_transitions:
            raise ShipmentStatusError(
                f"Unknown current status: {current_status}",
                current_status=current_status,
                target_status=target_status
            )

        if target_status not in allowed_transitions.get(current_status, []):
            raise ShipmentStatusError(
                f"Invalid status transition from {current_status} to {target_status}",
                current_status=current_status,
                target_status=target_status
            )

    # ==========================================================================
    # Logistics Actions (Send / Receive / Stock-In)
    # ==========================================================================

    async def send_logistics(self, shipment_id: int) -> LogisticsActionResponse:
        """
        Mark a logistics entry as sent.

        Sets lgs_is_send=True and lgs_d_send to now.
        Only allowed when the shipment has not already been sent.
        """
        shipment = await self.get_shipment(shipment_id)

        if shipment.lgs_is_send:
            raise LogisticsActionError(
                f"Logistics {shipment_id} has already been sent",
                shipment_id=shipment_id,
                action="send",
            )

        now = datetime.utcnow()
        shipment.lgs_is_send = True
        shipment.lgs_d_send = now
        shipment.lgs_d_update = now

        await self.db.flush()
        await self.db.refresh(shipment)
        await self.db.commit()

        return LogisticsActionResponse(
            success=True,
            message=f"Logistics {shipment.lgs_code} marked as sent",
            id=shipment.lgs_id,
            code=shipment.lgs_code,
            action="send",
            timestamp=now,
            isSent=shipment.lgs_is_send,
            isReceived=shipment.lgs_is_received,
            isStockedIn=shipment.lgs_is_stockin,
            sendDate=shipment.lgs_d_send,
            receiveDate=shipment.lgs_d_arrive,
            stockInDate=shipment.lgs_d_stockin,
        )

    async def receive_logistics(self, shipment_id: int) -> LogisticsActionResponse:
        """
        Mark a logistics entry as received.

        Sets lgs_is_received=True and lgs_d_arrive to now.
        Requires the shipment to have been sent first.
        Cannot receive if already received.
        """
        shipment = await self.get_shipment(shipment_id)

        if not shipment.lgs_is_send:
            raise LogisticsActionError(
                f"Logistics {shipment_id} must be sent before it can be received",
                shipment_id=shipment_id,
                action="receive",
            )

        if shipment.lgs_is_received:
            raise LogisticsActionError(
                f"Logistics {shipment_id} has already been received",
                shipment_id=shipment_id,
                action="receive",
            )

        now = datetime.utcnow()
        shipment.lgs_is_received = True
        shipment.lgs_d_arrive = now
        shipment.lgs_d_update = now

        await self.db.flush()
        await self.db.refresh(shipment)
        await self.db.commit()

        return LogisticsActionResponse(
            success=True,
            message=f"Logistics {shipment.lgs_code} marked as received",
            id=shipment.lgs_id,
            code=shipment.lgs_code,
            action="receive",
            timestamp=now,
            isSent=shipment.lgs_is_send,
            isReceived=shipment.lgs_is_received,
            isStockedIn=shipment.lgs_is_stockin,
            sendDate=shipment.lgs_d_send,
            receiveDate=shipment.lgs_d_arrive,
            stockInDate=shipment.lgs_d_stockin,
        )

    async def stock_in_logistics(self, shipment_id: int) -> LogisticsActionResponse:
        """
        Stock in a received logistics entry into warehouse inventory.

        Sets lgs_is_stockin=True and lgs_d_stockin to now.
        Requires the shipment to have been received first.
        Cannot stock-in if already stocked in.
        """
        shipment = await self.get_shipment(shipment_id)

        if not shipment.lgs_is_received:
            raise LogisticsActionError(
                f"Logistics {shipment_id} must be received before it can be stocked in",
                shipment_id=shipment_id,
                action="stock-in",
            )

        if shipment.lgs_is_stockin:
            raise LogisticsActionError(
                f"Logistics {shipment_id} has already been stocked in",
                shipment_id=shipment_id,
                action="stock-in",
            )

        now = datetime.utcnow()
        shipment.lgs_is_stockin = True
        shipment.lgs_d_stockin = now
        shipment.lgs_d_update = now

        await self.db.flush()
        await self.db.refresh(shipment)
        await self.db.commit()

        return LogisticsActionResponse(
            success=True,
            message=f"Logistics {shipment.lgs_code} stocked in",
            id=shipment.lgs_id,
            code=shipment.lgs_code,
            action="stock-in",
            timestamp=now,
            isSent=shipment.lgs_is_send,
            isReceived=shipment.lgs_is_received,
            isStockedIn=shipment.lgs_is_stockin,
            sendDate=shipment.lgs_d_send,
            receiveDate=shipment.lgs_d_arrive,
            stockInDate=shipment.lgs_d_stockin,
        )

    # ==========================================================================
    # Tracking Operations
    # ==========================================================================

    async def get_tracking_info(self, shipment_id: int) -> TrackingResponse:
        """Get tracking information for a shipment."""
        shipment = await self.get_shipment(shipment_id)

        payload, _, status_name, origin_country_name, destination_country_name = self._base_payload(shipment)
        supplier = shipment.supplier

        full_origin_address = self._format_full_address(
            payload.get("shp_origin_address"),
            payload.get("shp_origin_city"),
            origin_country_name,
        )
        full_destination_address = self._format_full_address(
            payload.get("shp_destination_address"),
            payload.get("shp_destination_city"),
            destination_country_name,
        )

        events = [
            TrackingEvent(
                timestamp=shipment.lgs_d_creation,
                status="Created",
                location=full_origin_address or "Origin",
                description="Shipment created"
            )
        ]

        if shipment.lgs_d_send:
            events.append(TrackingEvent(
                timestamp=shipment.lgs_d_send,
                status="In Transit",
                location=full_origin_address or "Origin",
                description="Shipment sent"
            ))

        if shipment.lgs_d_arrive:
            events.append(TrackingEvent(
                timestamp=shipment.lgs_d_arrive,
                status="Delivered",
                location=full_destination_address or "Destination",
                description="Shipment delivered"
            ))

        return TrackingResponse(
            shp_id=shipment.lgs_id,
            shp_reference=shipment.lgs_code,
            shp_tracking_number=shipment.lgs_tracking_number,
            carrier_name=supplier.sup_company_name if supplier else None,
            current_status=status_name,
            events=events
        )

    async def track_by_tracking_number(self, tracking_number: str) -> TrackingResponse:
        """Get tracking information by tracking number."""
        shipment = await self.get_shipment_by_tracking(tracking_number)
        return await self.get_tracking_info(shipment.lgs_id)

    # ==========================================================================
    # Delivery Scheduling
    # ==========================================================================

    async def get_shipments_by_delivery_form(
        self,
        delivery_form_id: int
    ) -> List[ShipmentResponse]:
        """Get all shipments for a delivery form."""
        shipments = await self.repository.get_shipments_by_delivery_form(delivery_form_id)
        return [self._to_response(shipment) for shipment in shipments]

    async def get_pending_deliveries(self, days_ahead: int = 7) -> List[ShipmentResponse]:
        """Get shipments with estimated delivery within the next N days."""
        shipments = await self.repository.get_pending_deliveries(days_ahead)
        return [self._to_response(shipment) for shipment in shipments]

    async def get_overdue_shipments(self) -> List[ShipmentResponse]:
        """Get shipments that are past their estimated delivery date."""
        shipments = await self.repository.get_overdue_shipments()
        return [self._to_response(shipment) for shipment in shipments]

    async def get_shipments_by_status(
        self,
        status_id: int,
        limit: int = 100
    ) -> List[ShipmentResponse]:
        """Get shipments by status."""
        shipments = await self.repository.get_shipments_by_status(status_id, limit)
        return [self._to_response(shipment) for shipment in shipments]

    # ==========================================================================
    # Statistics
    # ==========================================================================

    async def get_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get shipment statistics."""
        return await self.repository.get_shipment_statistics(start_date, end_date)

    async def get_carrier_statistics(
        self,
        carrier_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get statistics for a specific carrier."""
        params = ShipmentSearchParams(
            carrier_id=carrier_id,
            created_from=start_date,
            created_to=end_date,
            page=1,
            page_size=10000
        )
        items, total = await self.repository.search_shipments(params)

        total_cost = sum(
            (self._calculate_line_totals(item)[2] or Decimal("0"))
            for item in items
        )
        delivered = sum(1 for item in items if self._derive_status(item)[0] == self.STATUS_DELIVERED)
        on_time = sum(1 for item in items if self._derive_status(item)[0] == self.STATUS_DELIVERED)

        return {
            "carrier_id": carrier_id,
            "total_shipments": total,
            "delivered_shipments": delivered,
            "pending_shipments": total - delivered,
            "on_time_deliveries": on_time,
            "on_time_rate": (on_time / delivered * 100) if delivered > 0 else 0,
            "total_cost": total_cost,
            "average_cost": total_cost / total if total > 0 else Decimal("0")
        }

    # ==========================================================================
    # Carriers
    # ==========================================================================

    async def get_carriers(self, active_only: bool = True) -> List[CarrierListItemResponse]:
        query = select(Supplier)
        if active_only:
            query = query.where(Supplier.sup_isactive == True)
        query = query.order_by(Supplier.sup_company_name.asc())
        result = await asyncio.to_thread(self.db.execute, query)
        suppliers = list(result.scalars().all())

        return [
            CarrierListItemResponse(
                car_id=supplier.sup_id,
                car_name=supplier.sup_company_name,
                car_code=supplier.sup_ref,
                car_is_active=bool(supplier.sup_isactive),
                car_address1=supplier.sup_address1,
                car_address2=supplier.sup_address2,
                car_postcode=supplier.sup_postcode,
                car_city=supplier.sup_city,
                car_country=supplier.sup_country,
            )
            for supplier in suppliers
        ]

    async def get_carrier(self, carrier_id: int) -> CarrierResponse:
        result = await asyncio.to_thread(
            self.db.execute,
            select(Supplier).where(Supplier.sup_id == carrier_id)
        )
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise ShipmentValidationError("Carrier not found", {"carrier_id": carrier_id})

        return CarrierResponse(
            car_id=supplier.sup_id,
            car_name=supplier.sup_company_name,
            car_code=supplier.sup_ref,
            car_is_active=bool(supplier.sup_isactive),
            car_tracking_url=None,
            car_address1=supplier.sup_address1,
            car_address2=supplier.sup_address2,
            car_postcode=supplier.sup_postcode,
            car_city=supplier.sup_city,
            car_country=supplier.sup_country,
        )

    async def get_consignees(self, active_only: bool = True) -> List[dict]:
        query = select(Consignee)
        if active_only:
            query = query.where(Consignee.con_is_delivery_adr == True)
        query = query.order_by(Consignee.con_company_name.asc())
        result = await asyncio.to_thread(self.db.execute, query)
        consignees = list(result.scalars().all())

        return [
            {
                "con_id": consignee.con_id,
                "con_company_name": consignee.con_company_name,
                "con_firstname": consignee.con_firstname,
                "con_lastname": consignee.con_lastname,
                "con_address1": consignee.con_address1,
                "con_address2": consignee.con_address2,
                "con_address3": consignee.con_address3,
                "con_postcode": consignee.con_postcode,
                "con_city": consignee.con_city,
                "con_country": consignee.con_country,
                "con_tel1": consignee.con_tel1,
                "con_tel2": consignee.con_tel2,
                "con_email": consignee.con_email,
            }
            for consignee in consignees
        ]


def get_shipment_service(db: AsyncSession = Depends(get_db)) -> ShipmentService:
    """Dependency to get ShipmentService instance."""
    return ShipmentService(db)

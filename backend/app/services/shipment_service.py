"""
Shipment Service.

Provides business logic for:
- Shipment CRUD operations
- Status management
- Tracking information
- Delivery scheduling
- Statistics
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.database import get_db
from app.models.shipment import Shipment
from app.repositories.shipment_repository import ShipmentRepository
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentSearchParams,
    ShipmentResponse, ShipmentDetailResponse, ShipmentListResponse,
    BulkStatusUpdateRequest, BulkStatusUpdateResponse,
    TrackingEvent, TrackingResponse
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


# ==========================================================================
# Shipment Service
# ==========================================================================

class ShipmentService:
    """Service for managing shipments."""

    # Status IDs mapping (assumes these exist in TR_STA_Status table)
    STATUS_PENDING = 1
    STATUS_IN_TRANSIT = 2
    STATUS_DELIVERED = 3
    STATUS_EXCEPTION = 4
    STATUS_RETURNED = 5
    STATUS_CANCELLED = 6

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ShipmentRepository(db)

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    def _to_response(self, shipment: Shipment) -> ShipmentResponse:
        """Convert Shipment model to response schema."""
        return ShipmentResponse.model_validate(shipment)

    def _to_detail_response(self, shipment: Shipment) -> ShipmentDetailResponse:
        """Convert Shipment model to detail response schema with computed fields."""
        response_data = {
            "shp_id": shipment.shp_id,
            "shp_reference": shipment.shp_reference,
            "shp_del_id": shipment.shp_del_id,
            "shp_car_id": shipment.shp_car_id,
            "shp_tracking_number": shipment.shp_tracking_number,
            "shp_sta_id": shipment.shp_sta_id,
            "shp_origin_address": shipment.shp_origin_address,
            "shp_origin_city": shipment.shp_origin_city,
            "shp_origin_country_id": shipment.shp_origin_country_id,
            "shp_destination_address": shipment.shp_destination_address,
            "shp_destination_city": shipment.shp_destination_city,
            "shp_destination_country_id": shipment.shp_destination_country_id,
            "shp_weight": shipment.shp_weight,
            "shp_packages": shipment.shp_packages,
            "shp_estimated_delivery": shipment.shp_estimated_delivery,
            "shp_actual_delivery": shipment.shp_actual_delivery,
            "shp_cost": shipment.shp_cost,
            "shp_cur_id": shipment.shp_cur_id,
            "shp_notes": shipment.shp_notes,
            "shp_created_at": shipment.shp_created_at,
            "shp_updated_at": shipment.shp_updated_at,
            # Computed fields
            "is_delivered": shipment.is_delivered,
            "is_on_time": shipment.is_on_time,
            "full_origin_address": shipment.full_origin_address,
            "full_destination_address": shipment.full_destination_address,
            # Related entity names (would need joins to populate)
            "carrier_name": None,
            "status_name": None,
            "currency_code": None,
            "origin_country_name": None,
            "destination_country_name": None,
            "delivery_form_reference": None,
        }
        return ShipmentDetailResponse(**response_data)

    # ==========================================================================
    # CRUD Operations
    # ==========================================================================

    async def create_shipment(self, data: ShipmentCreate) -> Shipment:
        """Create a new shipment."""
        # Validate carrier ID exists
        if not data.shp_car_id:
            raise ShipmentValidationError("Carrier ID is required")

        # Validate status ID
        if not data.shp_sta_id:
            raise ShipmentValidationError("Status ID is required")

        shipment = await self.repository.create_shipment(data)
        await self.db.commit()
        return shipment

    async def get_shipment(self, shipment_id: int) -> Shipment:
        """Get shipment by ID."""
        shipment = await self.repository.get_shipment(shipment_id)
        if not shipment:
            raise ShipmentNotFoundError(shipment_id)
        return shipment

    async def get_shipment_by_reference(self, reference: str) -> Shipment:
        """Get shipment by reference."""
        shipment = await self.repository.get_shipment_by_reference(reference)
        if not shipment:
            raise ShipmentReferenceNotFoundError(reference)
        return shipment

    async def get_shipment_by_tracking(self, tracking_number: str) -> Shipment:
        """Get shipment by tracking number."""
        shipment = await self.repository.get_shipment_by_tracking(tracking_number)
        if not shipment:
            raise ShipmentTrackingNotFoundError(tracking_number)
        return shipment

    async def update_shipment(
        self,
        shipment_id: int,
        data: ShipmentUpdate
    ) -> Shipment:
        """Update a shipment."""
        # Verify shipment exists
        existing = await self.get_shipment(shipment_id)

        # Check if shipment can be updated (e.g., not cancelled)
        if existing.shp_sta_id == self.STATUS_CANCELLED:
            raise ShipmentStatusError(
                "Cannot update a cancelled shipment",
                current_status=existing.shp_sta_id,
                target_status=existing.shp_sta_id
            )

        shipment = await self.repository.update_shipment(shipment_id, data)
        await self.db.commit()
        return shipment

    async def delete_shipment(self, shipment_id: int) -> None:
        """Delete a shipment."""
        # Verify shipment exists
        shipment = await self.get_shipment(shipment_id)

        # Only allow deletion of pending or cancelled shipments
        if shipment.shp_sta_id not in [self.STATUS_PENDING, self.STATUS_CANCELLED]:
            raise ShipmentDeleteError(
                shipment_id,
                "Only pending or cancelled shipments can be deleted"
            )

        success = await self.repository.delete_shipment(shipment_id)
        if not success:
            raise ShipmentNotFoundError(shipment_id)
        await self.db.commit()

    async def search_shipments(self, params: ShipmentSearchParams) -> Dict[str, Any]:
        """Search shipments with filters and pagination."""
        items, total = await self.repository.search_shipments(params)

        total_pages = (total + params.page_size - 1) // params.page_size

        return {
            "items": items,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": total_pages
        }

    # ==========================================================================
    # Status Management
    # ==========================================================================

    async def update_status(
        self,
        shipment_id: int,
        status_id: int,
        actual_delivery: Optional[datetime] = None
    ) -> Shipment:
        """Update shipment status."""
        # Verify shipment exists
        shipment = await self.get_shipment(shipment_id)

        # Validate status transition
        self._validate_status_transition(shipment.shp_sta_id, status_id)

        # If marking as delivered, set actual delivery date if not provided
        if status_id == self.STATUS_DELIVERED and not actual_delivery:
            actual_delivery = datetime.utcnow()

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

                # Validate status transition
                try:
                    self._validate_status_transition(shipment.shp_sta_id, request.new_status_id)
                except ShipmentStatusError:
                    failed_ids.append(shipment_id)
                    continue

                successful_count += 1

            except Exception:
                failed_ids.append(shipment_id)

        # Perform bulk update for valid shipments
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
        # Define allowed transitions
        allowed_transitions = {
            self.STATUS_PENDING: [self.STATUS_IN_TRANSIT, self.STATUS_CANCELLED],
            self.STATUS_IN_TRANSIT: [self.STATUS_DELIVERED, self.STATUS_EXCEPTION, self.STATUS_RETURNED],
            self.STATUS_DELIVERED: [],  # Terminal state
            self.STATUS_EXCEPTION: [self.STATUS_IN_TRANSIT, self.STATUS_RETURNED, self.STATUS_CANCELLED],
            self.STATUS_RETURNED: [self.STATUS_CANCELLED],  # Can only cancel after return
            self.STATUS_CANCELLED: [],  # Terminal state
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
    # Tracking Operations
    # ==========================================================================

    async def get_tracking_info(self, shipment_id: int) -> TrackingResponse:
        """Get tracking information for a shipment."""
        shipment = await self.get_shipment(shipment_id)

        # Build tracking events (in a real system, these would come from a tracking table)
        events = []

        # Add creation event
        events.append(TrackingEvent(
            timestamp=shipment.shp_created_at,
            status="Created",
            location=shipment.full_origin_address or "Origin",
            description="Shipment created"
        ))

        # Add delivery event if delivered
        if shipment.shp_actual_delivery:
            events.append(TrackingEvent(
                timestamp=shipment.shp_actual_delivery,
                status="Delivered",
                location=shipment.full_destination_address or "Destination",
                description="Shipment delivered"
            ))

        # Get status name (would need to join with Status table)
        status_names = {
            self.STATUS_PENDING: "Pending",
            self.STATUS_IN_TRANSIT: "In Transit",
            self.STATUS_DELIVERED: "Delivered",
            self.STATUS_EXCEPTION: "Exception",
            self.STATUS_RETURNED: "Returned",
            self.STATUS_CANCELLED: "Cancelled"
        }
        current_status = status_names.get(shipment.shp_sta_id, "Unknown")

        return TrackingResponse(
            shipment_id=shipment.shp_id,
            reference=shipment.shp_reference,
            tracking_number=shipment.shp_tracking_number,
            carrier_name=None,  # Would need join
            current_status=current_status,
            estimated_delivery=shipment.shp_estimated_delivery,
            actual_delivery=shipment.shp_actual_delivery,
            events=events
        )

    async def track_by_tracking_number(self, tracking_number: str) -> TrackingResponse:
        """Get tracking information by tracking number."""
        shipment = await self.get_shipment_by_tracking(tracking_number)
        return await self.get_tracking_info(shipment.shp_id)

    # ==========================================================================
    # Delivery Scheduling
    # ==========================================================================

    async def get_shipments_by_delivery_form(
        self,
        delivery_form_id: int
    ) -> List[Shipment]:
        """Get all shipments for a delivery form."""
        return await self.repository.get_shipments_by_delivery_form(delivery_form_id)

    async def get_pending_deliveries(self, days_ahead: int = 7) -> List[Shipment]:
        """Get shipments with estimated delivery within the next N days."""
        return await self.repository.get_pending_deliveries(days_ahead)

    async def get_overdue_shipments(self) -> List[Shipment]:
        """Get shipments that are past their estimated delivery date."""
        return await self.repository.get_overdue_shipments()

    async def get_shipments_by_status(
        self,
        status_id: int,
        limit: int = 100
    ) -> List[Shipment]:
        """Get shipments by status."""
        return await self.repository.get_shipments_by_status(status_id, limit)

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
        # Filter shipments by carrier
        params = ShipmentSearchParams(
            carrier_id=carrier_id,
            created_from=start_date,
            created_to=end_date,
            page=1,
            page_size=10000  # Get all for statistics
        )
        items, total = await self.repository.search_shipments(params)

        total_cost = sum(
            s.shp_cost or Decimal("0")
            for s in items
        )
        delivered = sum(1 for s in items if s.shp_actual_delivery is not None)
        on_time = sum(
            1 for s in items
            if s.is_on_time is True
        )

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


def get_shipment_service(db: AsyncSession = Depends(get_db)) -> ShipmentService:
    """Dependency to get ShipmentService instance."""
    return ShipmentService(db)

"""
Repository for Shipment data access operations.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.shipment import Shipment
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate,
    ShipmentSearchParams
)


class ShipmentRepository:
    """Repository for shipment related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Shipment Operations
    # =====================

    async def create_shipment(self, data: ShipmentCreate) -> Shipment:
        """Create a new shipment."""
        # Handle address schemas if provided
        origin_address = data.shp_origin_address
        origin_city = data.shp_origin_city
        origin_country_id = data.shp_origin_country_id

        if data.origin_address:
            origin_address = data.origin_address.address
            origin_city = data.origin_address.city
            origin_country_id = data.origin_address.country_id

        destination_address = data.shp_destination_address
        destination_city = data.shp_destination_city
        destination_country_id = data.shp_destination_country_id

        if data.destination_address:
            destination_address = data.destination_address.address
            destination_city = data.destination_address.city
            destination_country_id = data.destination_address.country_id

        shipment = Shipment(
            shp_reference=data.shp_reference or await self._generate_reference(),
            shp_del_id=data.shp_del_id,
            shp_car_id=data.shp_car_id,
            shp_tracking_number=data.shp_tracking_number,
            shp_sta_id=data.shp_sta_id,
            shp_origin_address=origin_address,
            shp_origin_city=origin_city,
            shp_origin_country_id=origin_country_id,
            shp_destination_address=destination_address,
            shp_destination_city=destination_city,
            shp_destination_country_id=destination_country_id,
            shp_weight=data.shp_weight,
            shp_packages=data.shp_packages,
            shp_estimated_delivery=data.shp_estimated_delivery,
            shp_cost=data.shp_cost,
            shp_cur_id=data.shp_cur_id,
            shp_notes=data.shp_notes,
        )

        self.db.add(shipment)
        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def get_shipment(self, shipment_id: int) -> Optional[Shipment]:
        """Get a shipment by ID."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.shp_id == shipment_id)
        )
        return result.scalar_one_or_none()

    async def get_shipment_by_reference(self, reference: str) -> Optional[Shipment]:
        """Get a shipment by reference."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.shp_reference == reference)
        )
        return result.scalar_one_or_none()

    async def get_shipment_by_tracking(self, tracking_number: str) -> Optional[Shipment]:
        """Get a shipment by tracking number."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.shp_tracking_number == tracking_number)
        )
        return result.scalar_one_or_none()

    async def get_shipments_by_delivery_form(
        self,
        delivery_form_id: int
    ) -> List[Shipment]:
        """Get all shipments for a delivery form."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.shp_del_id == delivery_form_id)
            .order_by(Shipment.shp_created_at.desc())
        )
        return list(result.scalars().all())

    async def update_shipment(
        self,
        shipment_id: int,
        data: ShipmentUpdate
    ) -> Optional[Shipment]:
        """Update a shipment."""
        shipment = await self.get_shipment(shipment_id)
        if not shipment:
            return None

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(shipment, field):
                setattr(shipment, field, value)

        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def delete_shipment(self, shipment_id: int) -> bool:
        """Delete a shipment."""
        result = await self.db.execute(
            delete(Shipment).where(Shipment.shp_id == shipment_id)
        )
        return result.rowcount > 0

    async def search_shipments(
        self,
        params: ShipmentSearchParams
    ) -> Tuple[List[Shipment], int]:
        """Search shipments with filters and pagination."""
        query = select(Shipment)
        count_query = select(func.count(Shipment.shp_id))

        conditions = []

        # Text filters
        if params.reference:
            conditions.append(
                Shipment.shp_reference.ilike(f"%{params.reference}%")
            )
        if params.tracking_number:
            conditions.append(
                Shipment.shp_tracking_number.ilike(f"%{params.tracking_number}%")
            )
        if params.origin_city:
            conditions.append(
                Shipment.shp_origin_city.ilike(f"%{params.origin_city}%")
            )
        if params.destination_city:
            conditions.append(
                Shipment.shp_destination_city.ilike(f"%{params.destination_city}%")
            )

        # ID filters
        if params.carrier_id:
            conditions.append(Shipment.shp_car_id == params.carrier_id)
        if params.status_id:
            conditions.append(Shipment.shp_sta_id == params.status_id)
        if params.delivery_form_id:
            conditions.append(Shipment.shp_del_id == params.delivery_form_id)
        if params.origin_country_id:
            conditions.append(Shipment.shp_origin_country_id == params.origin_country_id)
        if params.destination_country_id:
            conditions.append(Shipment.shp_destination_country_id == params.destination_country_id)
        if params.currency_id:
            conditions.append(Shipment.shp_cur_id == params.currency_id)

        # Date filters
        if params.estimated_delivery_from:
            conditions.append(Shipment.shp_estimated_delivery >= params.estimated_delivery_from)
        if params.estimated_delivery_to:
            conditions.append(Shipment.shp_estimated_delivery <= params.estimated_delivery_to)
        if params.actual_delivery_from:
            conditions.append(Shipment.shp_actual_delivery >= params.actual_delivery_from)
        if params.actual_delivery_to:
            conditions.append(Shipment.shp_actual_delivery <= params.actual_delivery_to)
        if params.created_from:
            conditions.append(Shipment.shp_created_at >= params.created_from)
        if params.created_to:
            conditions.append(Shipment.shp_created_at <= params.created_to)

        # Cost filters
        if params.min_cost is not None:
            conditions.append(Shipment.shp_cost >= params.min_cost)
        if params.max_cost is not None:
            conditions.append(Shipment.shp_cost <= params.max_cost)

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        sort_column = getattr(Shipment, params.sort_by, Shipment.shp_created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def update_status(
        self,
        shipment_id: int,
        status_id: int,
        actual_delivery: Optional[datetime] = None
    ) -> Optional[Shipment]:
        """Update shipment status."""
        shipment = await self.get_shipment(shipment_id)
        if not shipment:
            return None

        shipment.shp_sta_id = status_id
        if actual_delivery:
            shipment.shp_actual_delivery = actual_delivery

        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def bulk_update_status(
        self,
        shipment_ids: List[int],
        status_id: int
    ) -> int:
        """Bulk update status for multiple shipments."""
        result = await self.db.execute(
            update(Shipment)
            .where(Shipment.shp_id.in_(shipment_ids))
            .values(shp_sta_id=status_id)
        )
        return result.rowcount

    async def _generate_reference(self) -> str:
        """Generate a unique shipment reference."""
        # Get the current max reference number
        result = await self.db.execute(
            select(func.max(Shipment.shp_reference))
            .where(Shipment.shp_reference.like("SHP-%"))
        )
        max_ref = result.scalar()

        if max_ref:
            try:
                # Extract number from SHP-XXXX format
                num = int(max_ref.replace("SHP-", ""))
                next_num = num + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1

        return f"SHP-{next_num:04d}"

    async def get_shipments_by_status(
        self,
        status_id: int,
        limit: int = 100
    ) -> List[Shipment]:
        """Get shipments by status."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.shp_sta_id == status_id)
            .order_by(Shipment.shp_created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_pending_deliveries(
        self,
        days_ahead: int = 7
    ) -> List[Shipment]:
        """Get shipments with estimated delivery within the next N days."""
        from datetime import timedelta

        now = datetime.utcnow()
        end_date = now + timedelta(days=days_ahead)

        result = await self.db.execute(
            select(Shipment)
            .where(
                and_(
                    Shipment.shp_actual_delivery.is_(None),
                    Shipment.shp_estimated_delivery.isnot(None),
                    Shipment.shp_estimated_delivery >= now,
                    Shipment.shp_estimated_delivery <= end_date
                )
            )
            .order_by(Shipment.shp_estimated_delivery.asc())
        )
        return list(result.scalars().all())

    async def get_overdue_shipments(self) -> List[Shipment]:
        """Get shipments that are past their estimated delivery date but not delivered."""
        now = datetime.utcnow()

        result = await self.db.execute(
            select(Shipment)
            .where(
                and_(
                    Shipment.shp_actual_delivery.is_(None),
                    Shipment.shp_estimated_delivery.isnot(None),
                    Shipment.shp_estimated_delivery < now
                )
            )
            .order_by(Shipment.shp_estimated_delivery.asc())
        )
        return list(result.scalars().all())

    async def get_shipment_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> dict:
        """Get shipment statistics."""
        conditions = []

        if start_date:
            conditions.append(Shipment.shp_created_at >= start_date)
        if end_date:
            conditions.append(Shipment.shp_created_at <= end_date)

        # Total count
        count_query = select(func.count(Shipment.shp_id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await self.db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Total cost
        cost_query = select(func.sum(Shipment.shp_cost))
        if conditions:
            cost_query = cost_query.where(and_(*conditions))
        cost_result = await self.db.execute(cost_query)
        total_cost = cost_result.scalar() or Decimal("0")

        # Delivered count
        delivered_conditions = conditions + [Shipment.shp_actual_delivery.isnot(None)]
        delivered_query = select(func.count(Shipment.shp_id)).where(and_(*delivered_conditions))
        delivered_result = await self.db.execute(delivered_query)
        delivered_count = delivered_result.scalar() or 0

        return {
            "total_shipments": total_count,
            "delivered_shipments": delivered_count,
            "pending_shipments": total_count - delivered_count,
            "total_cost": total_cost,
            "delivery_rate": (delivered_count / total_count * 100) if total_count > 0 else 0
        }

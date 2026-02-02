"""
Repository for Delivery Form data access operations.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.schemas.delivery import (
    DeliveryFormCreate, DeliveryFormUpdate,
    DeliveryFormLineCreate, DeliveryFormLineUpdate,
    DeliveryFormSearchParams
)


class DeliveryRepository:
    """Repository for delivery form related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Delivery Form Operations
    # =====================

    async def create_delivery(self, data: DeliveryFormCreate) -> DeliveryForm:
        """Create a new delivery form with lines."""
        delivery = DeliveryForm(
            del_reference=data.del_reference,
            del_ord_id=data.del_ord_id,
            del_cli_id=data.del_cli_id,
            del_delivery_date=data.del_delivery_date,
            del_sta_id=data.del_sta_id,
            del_car_id=data.del_car_id,
            del_tracking_number=data.del_tracking_number,
            del_shipping_address=data.del_shipping_address,
            del_shipping_city=data.del_shipping_city,
            del_shipping_postal_code=data.del_shipping_postal_code,
            del_shipping_country_id=data.del_shipping_country_id,
            del_weight=data.del_weight,
            del_packages=data.del_packages,
            del_notes=data.del_notes,
            del_created_by=data.del_created_by,
            del_created_at=datetime.utcnow()
        )

        self.db.add(delivery)
        await self.db.flush()

        # Create lines if provided
        if data.lines:
            for line_data in data.lines:
                line = DeliveryFormLine(
                    dfl_del_id=delivery.del_id,
                    dfl_orl_id=line_data.dfl_orl_id,
                    dfl_prd_id=line_data.dfl_prd_id,
                    dfl_pit_id=line_data.dfl_pit_id,
                    dfl_description=line_data.dfl_description,
                    dfl_quantity=line_data.dfl_quantity,
                    dfl_sort_order=line_data.dfl_sort_order
                )
                self.db.add(line)

        await self.db.flush()
        await self.db.refresh(delivery)
        return delivery

    async def get_delivery(self, delivery_id: int) -> Optional[DeliveryForm]:
        """Get a delivery form by ID with lines."""
        result = await self.db.execute(
            select(DeliveryForm)
            .options(selectinload(DeliveryForm.lines))
            .where(DeliveryForm.del_id == delivery_id)
        )
        return result.scalar_one_or_none()

    async def get_delivery_by_reference(self, reference: str) -> Optional[DeliveryForm]:
        """Get a delivery form by reference code."""
        result = await self.db.execute(
            select(DeliveryForm)
            .options(selectinload(DeliveryForm.lines))
            .where(DeliveryForm.del_reference == reference)
        )
        return result.scalar_one_or_none()

    async def update_delivery(
        self,
        delivery_id: int,
        data: DeliveryFormUpdate
    ) -> Optional[DeliveryForm]:
        """Update a delivery form."""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(delivery, field, value)

        delivery.del_updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(delivery)
        return delivery

    async def delete_delivery(self, delivery_id: int) -> bool:
        """Delete a delivery form and all related lines."""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            return False

        await self.db.delete(delivery)
        await self.db.flush()
        return True

    async def search_deliveries(
        self,
        params: DeliveryFormSearchParams
    ) -> Tuple[List[DeliveryForm], int]:
        """Search delivery forms with filters and pagination."""
        query = select(DeliveryForm)
        count_query = select(func.count(DeliveryForm.del_id))

        conditions = []

        # Text search across reference and tracking number
        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    DeliveryForm.del_reference.ilike(search_term),
                    DeliveryForm.del_tracking_number.ilike(search_term)
                )
            )

        if params.del_ord_id:
            conditions.append(DeliveryForm.del_ord_id == params.del_ord_id)
        if params.del_cli_id:
            conditions.append(DeliveryForm.del_cli_id == params.del_cli_id)
        if params.del_sta_id:
            conditions.append(DeliveryForm.del_sta_id == params.del_sta_id)
        if params.del_car_id:
            conditions.append(DeliveryForm.del_car_id == params.del_car_id)

        # Date range filters
        if params.date_from:
            conditions.append(DeliveryForm.del_delivery_date >= params.date_from)
        if params.date_to:
            conditions.append(DeliveryForm.del_delivery_date <= params.date_to)

        # Shipped/delivered status filters
        if params.is_shipped is not None:
            if params.is_shipped:
                conditions.append(DeliveryForm.del_shipped_at.isnot(None))
            else:
                conditions.append(DeliveryForm.del_shipped_at.is_(None))

        if params.is_delivered is not None:
            if params.is_delivered:
                conditions.append(DeliveryForm.del_delivered_at.isnot(None))
            else:
                conditions.append(DeliveryForm.del_delivered_at.is_(None))

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "del_delivery_date"
        sort_column = getattr(DeliveryForm, sort_field, DeliveryForm.del_delivery_date)
        if params.sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        # Execute queries
        result = await self.db.execute(query)
        deliveries = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return deliveries, total

    async def get_deliveries_by_order(
        self,
        order_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[DeliveryForm]:
        """Get all delivery forms for an order."""
        result = await self.db.execute(
            select(DeliveryForm)
            .where(DeliveryForm.del_ord_id == order_id)
            .order_by(DeliveryForm.del_delivery_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_deliveries_by_client(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[DeliveryForm]:
        """Get all delivery forms for a client."""
        result = await self.db.execute(
            select(DeliveryForm)
            .where(DeliveryForm.del_cli_id == client_id)
            .order_by(DeliveryForm.del_delivery_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_deliveries(
        self,
        order_id: Optional[int] = None,
        client_id: Optional[int] = None,
        status_id: Optional[int] = None
    ) -> int:
        """Count delivery forms with optional filters."""
        query = select(func.count(DeliveryForm.del_id))
        conditions = []

        if order_id:
            conditions.append(DeliveryForm.del_ord_id == order_id)
        if client_id:
            conditions.append(DeliveryForm.del_cli_id == client_id)
        if status_id:
            conditions.append(DeliveryForm.del_sta_id == status_id)

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.scalar_one()

    async def check_reference_exists(
        self,
        reference: str,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if a delivery reference already exists."""
        query = select(func.count(DeliveryForm.del_id)).where(
            DeliveryForm.del_reference == reference
        )
        if exclude_id:
            query = query.where(DeliveryForm.del_id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def mark_shipped(
        self,
        delivery_id: int,
        tracking_number: Optional[str] = None,
        carrier_id: Optional[int] = None
    ) -> Optional[DeliveryForm]:
        """Mark a delivery as shipped."""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            return None

        delivery.del_shipped_at = datetime.utcnow()
        if tracking_number:
            delivery.del_tracking_number = tracking_number
        if carrier_id:
            delivery.del_car_id = carrier_id
        delivery.del_updated_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(delivery)
        return delivery

    async def mark_delivered(
        self,
        delivery_id: int,
        signed_by: Optional[str] = None
    ) -> Optional[DeliveryForm]:
        """Mark a delivery as delivered."""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            return None

        delivery.del_delivered_at = datetime.utcnow()
        if signed_by:
            delivery.del_signed_by = signed_by
        delivery.del_updated_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(delivery)
        return delivery

    # =====================
    # Delivery Form Line Operations
    # =====================

    async def create_line(
        self,
        delivery_id: int,
        data: DeliveryFormLineCreate
    ) -> DeliveryFormLine:
        """Create a new delivery form line."""
        line = DeliveryFormLine(
            dfl_del_id=delivery_id,
            dfl_orl_id=data.dfl_orl_id,
            dfl_prd_id=data.dfl_prd_id,
            dfl_pit_id=data.dfl_pit_id,
            dfl_description=data.dfl_description,
            dfl_quantity=data.dfl_quantity,
            dfl_sort_order=data.dfl_sort_order
        )

        self.db.add(line)
        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def get_line(self, line_id: int) -> Optional[DeliveryFormLine]:
        """Get a delivery form line by ID."""
        result = await self.db.execute(
            select(DeliveryFormLine)
            .where(DeliveryFormLine.dfl_id == line_id)
        )
        return result.scalar_one_or_none()

    async def update_line(
        self,
        line_id: int,
        data: DeliveryFormLineUpdate
    ) -> Optional[DeliveryFormLine]:
        """Update a delivery form line."""
        line = await self.get_line(line_id)
        if not line:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(line, field, value)

        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def delete_line(self, line_id: int) -> bool:
        """Delete a delivery form line."""
        line = await self.get_line(line_id)
        if not line:
            return False

        await self.db.delete(line)
        await self.db.flush()
        return True

    async def get_lines_by_delivery(
        self,
        delivery_id: int
    ) -> List[DeliveryFormLine]:
        """Get all lines for a delivery form."""
        result = await self.db.execute(
            select(DeliveryFormLine)
            .where(DeliveryFormLine.dfl_del_id == delivery_id)
            .order_by(DeliveryFormLine.dfl_sort_order)
        )
        return list(result.scalars().all())

    async def delete_lines_by_delivery(self, delivery_id: int) -> int:
        """Delete all lines for a delivery form."""
        result = await self.db.execute(
            delete(DeliveryFormLine)
            .where(DeliveryFormLine.dfl_del_id == delivery_id)
        )
        await self.db.flush()
        return result.rowcount

    # =====================
    # Lookup Operations
    # =====================

    async def get_delivery_lookup(
        self,
        order_id: Optional[int] = None,
        client_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get delivery forms for dropdown/lookup.
        Returns lightweight data for search/selection.
        """
        query = select(
            DeliveryForm.del_id,
            DeliveryForm.del_reference,
            DeliveryForm.del_ord_id,
            DeliveryForm.del_cli_id,
            DeliveryForm.del_delivery_date,
            DeliveryForm.del_sta_id,
            DeliveryForm.del_tracking_number
        )

        conditions = []
        if order_id:
            conditions.append(DeliveryForm.del_ord_id == order_id)
        if client_id:
            conditions.append(DeliveryForm.del_cli_id == client_id)

        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    DeliveryForm.del_reference.ilike(search_term),
                    DeliveryForm.del_tracking_number.ilike(search_term)
                )
            )

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(DeliveryForm.del_delivery_date.desc()).limit(limit)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.del_id,
                "reference": row.del_reference,
                "order_id": row.del_ord_id,
                "client_id": row.del_cli_id,
                "delivery_date": row.del_delivery_date.isoformat() if row.del_delivery_date else None,
                "status_id": row.del_sta_id,
                "tracking_number": row.del_tracking_number,
                "display_name": f"Delivery {row.del_reference}"
            }
            for row in rows
        ]

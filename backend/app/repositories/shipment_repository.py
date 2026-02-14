"""
Repository for Shipment (legacy logistics) data access operations.
"""
from typing import Optional, List, Tuple
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.expression import false

from app.database import AsyncSessionWrapper
from app.models.logistics import Logistic
from app.models.supplier import Supplier
from app.models.consignee import Consignee
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate,
    ShipmentSearchParams
)


class ShipmentRepository:
    """Repository for shipment-related data operations mapped to legacy logistics tables."""

    def __init__(self, db: AsyncSessionWrapper):
        self.db = db

    # =====================
    # Shipment Operations
    # =====================

    async def create_shipment(self, data: ShipmentCreate) -> Logistic:
        """Create a new logistics record from shipment data."""
        supplier = None
        if data.shp_car_id:
            supplier = await self._get_supplier(data.shp_car_id)

        reference = data.shp_reference or await self._generate_reference()
        now = datetime.utcnow()

        status_id = data.shp_sta_id
        is_sent = status_id in (2, 3)
        is_received = status_id == 3
        is_stockin = status_id == 3
        send_date = now if is_sent else None
        arrive_date = data.shp_actual_delivery if is_received else None

        logistic = Logistic(
            lgs_code=reference,
            lgs_name=reference,
            lgs_is_send=is_sent,
            sup_id=data.shp_car_id,
            lgs_d_send=send_date,
            lgs_d_arrive_pre=data.shp_estimated_delivery,
            lgs_d_arrive=arrive_date,
            lgs_comment=data.shp_notes,
            soc_id=supplier.soc_id if supplier else 1,
            lgs_file=None,
            lgs_guid=None,
            lgs_is_purchase=bool(data.shp_is_purchase) if data.shp_is_purchase is not None else False,
            lgs_tracking_number=data.shp_tracking_number,
            usr_id_creator=supplier.usr_created_by if supplier else 1,
            lgs_d_creation=now,
            lgs_d_update=now,
            lgs_is_received=is_received,
            lgs_is_stockin=is_stockin,
            lgs_d_stockin=arrive_date,
            con_id=data.shp_con_id,
            sod_id=data.shp_sod_id,
        )

        self.db.add(logistic)
        await self.db.flush()
        await self.db.refresh(logistic)
        return logistic

    async def get_shipment(self, shipment_id: int, society_id: Optional[int] = None) -> Optional[Logistic]:
        """Get a shipment by ID."""
        conditions = [Logistic.lgs_id == shipment_id]
        if society_id is not None:
            conditions.append(Logistic.soc_id == society_id)

        result = await self.db.execute(
            select(Logistic)
            .options(
                selectinload(Logistic.supplier),
                selectinload(Logistic.consignee),
                selectinload(Logistic.lines),
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_shipment_by_reference(self, reference: str, society_id: Optional[int] = None) -> Optional[Logistic]:
        """Get a shipment by reference."""
        conditions = [Logistic.lgs_code == reference]
        if society_id is not None:
            conditions.append(Logistic.soc_id == society_id)

        result = await self.db.execute(
            select(Logistic)
            .options(
                selectinload(Logistic.supplier),
                selectinload(Logistic.consignee),
                selectinload(Logistic.lines),
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_shipment_by_tracking(self, tracking_number: str, society_id: Optional[int] = None) -> Optional[Logistic]:
        """Get a shipment by tracking number."""
        conditions = [Logistic.lgs_tracking_number == tracking_number]
        if society_id is not None:
            conditions.append(Logistic.soc_id == society_id)

        result = await self.db.execute(
            select(Logistic)
            .options(
                selectinload(Logistic.supplier),
                selectinload(Logistic.consignee),
                selectinload(Logistic.lines),
            )
            .where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def get_shipments_by_delivery_form(
        self,
        delivery_form_id: int
    ) -> List[Logistic]:
        """Get all shipments for a delivery form.

        Legacy logistics does not map directly to delivery forms; return empty list.
        """
        return []

    async def update_shipment(
        self,
        shipment_id: int,
        data: ShipmentUpdate
    ) -> Optional[Logistic]:
        """Update a shipment."""
        shipment = await self.get_shipment(shipment_id)
        if not shipment:
            return None

        update_data = data.model_dump(exclude_unset=True)

        if "shp_car_id" in update_data:
            shipment.sup_id = update_data["shp_car_id"]
            supplier = await self._get_supplier(update_data["shp_car_id"])
            shipment.soc_id = supplier.soc_id

        if "shp_tracking_number" in update_data:
            shipment.lgs_tracking_number = update_data["shp_tracking_number"]

        if "shp_con_id" in update_data:
            shipment.con_id = update_data["shp_con_id"]

        if "shp_sod_id" in update_data:
            shipment.sod_id = update_data["shp_sod_id"]

        if "shp_is_purchase" in update_data:
            shipment.lgs_is_purchase = bool(update_data["shp_is_purchase"])

        if "shp_estimated_delivery" in update_data:
            shipment.lgs_d_arrive_pre = update_data["shp_estimated_delivery"]

        if "shp_actual_delivery" in update_data:
            shipment.lgs_d_arrive = update_data["shp_actual_delivery"]

        if "shp_notes" in update_data:
            shipment.lgs_comment = update_data["shp_notes"]

        if "shp_sta_id" in update_data:
            self._apply_status(shipment, update_data["shp_sta_id"], update_data.get("shp_actual_delivery"))

        shipment.lgs_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def delete_shipment(self, shipment_id: int) -> bool:
        """Delete a shipment."""
        result = await self.db.execute(
            delete(Logistic).where(Logistic.lgs_id == shipment_id)
        )
        return result.rowcount > 0

    async def search_shipments(
        self,
        params: ShipmentSearchParams
    ) -> Tuple[List[Logistic], int]:
        """Search shipments with filters and pagination."""
        query = select(Logistic).options(
            selectinload(Logistic.supplier),
            selectinload(Logistic.consignee),
            selectinload(Logistic.lines),
        )
        count_query = select(func.count(Logistic.lgs_id))

        conditions = []

        # Text filters
        if params.society_id is not None:
            conditions.append(Logistic.soc_id == params.society_id)
        if params.reference:
            conditions.append(Logistic.lgs_code.ilike(f"%{params.reference}%"))
        if params.tracking_number:
            conditions.append(Logistic.lgs_tracking_number.ilike(f"%{params.tracking_number}%"))
        if params.origin_city:
            conditions.append(
                Logistic.supplier.has(Supplier.sup_city.ilike(f"%{params.origin_city}%"))
            )
        if params.destination_city:
            conditions.append(
                Logistic.consignee.has(Consignee.con_city.ilike(f"%{params.destination_city}%"))
            )

        # ID filters
        if params.carrier_id:
            conditions.append(Logistic.sup_id == params.carrier_id)
        if params.consignee_id:
            conditions.append(Logistic.con_id == params.consignee_id)
        if params.supplier_order_id:
            conditions.append(Logistic.sod_id == params.supplier_order_id)
        if params.status_id:
            status_condition = self._status_condition(params.status_id)
            conditions.append(status_condition)

        # Date filters
        if params.estimated_delivery_from:
            conditions.append(Logistic.lgs_d_arrive_pre >= params.estimated_delivery_from)
        if params.estimated_delivery_to:
            conditions.append(Logistic.lgs_d_arrive_pre <= params.estimated_delivery_to)
        if params.actual_delivery_from:
            conditions.append(Logistic.lgs_d_arrive >= params.actual_delivery_from)
        if params.actual_delivery_to:
            conditions.append(Logistic.lgs_d_arrive <= params.actual_delivery_to)
        if params.created_from:
            conditions.append(Logistic.lgs_d_creation >= params.created_from)
        if params.created_to:
            conditions.append(Logistic.lgs_d_creation <= params.created_to)

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        sort_map = {
            "shp_created_at": Logistic.lgs_d_creation,
            "shp_updated_at": Logistic.lgs_d_update,
            "shp_reference": Logistic.lgs_code,
            "shp_tracking_number": Logistic.lgs_tracking_number,
            "shp_estimated_delivery": Logistic.lgs_d_arrive_pre,
            "shp_actual_delivery": Logistic.lgs_d_arrive,
        }
        sort_column = sort_map.get(params.sort_by, Logistic.lgs_d_creation)
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
    ) -> Optional[Logistic]:
        """Update shipment status."""
        shipment = await self.get_shipment(shipment_id)
        if not shipment:
            return None

        self._apply_status(shipment, status_id, actual_delivery)
        shipment.lgs_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def bulk_update_status(
        self,
        shipment_ids: List[int],
        status_id: int
    ) -> int:
        """Bulk update status for multiple shipments (flags only)."""
        result = await self.db.execute(
            update(Logistic)
            .where(Logistic.lgs_id.in_(shipment_ids))
            .values(
                lgs_is_send=status_id in (2, 3),
                lgs_is_received=status_id == 3,
                lgs_is_stockin=status_id == 3,
            )
        )
        return result.rowcount

    async def _generate_reference(self) -> str:
        """Generate a unique logistics reference."""
        result = await self.db.execute(
            select(func.max(Logistic.lgs_code))
            .where(Logistic.lgs_code.like("LGS-%"))
        )
        max_ref = result.scalar()

        if max_ref:
            try:
                num = int(max_ref.replace("LGS-", ""))
                next_num = num + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1

        return f"LGS-{next_num:04d}"

    async def get_shipments_by_status(
        self,
        status_id: int,
        limit: int = 100
    ) -> List[Logistic]:
        """Get shipments by status."""
        status_condition = self._status_condition(status_id)
        result = await self.db.execute(
            select(Logistic)
            .options(selectinload(Logistic.supplier), selectinload(Logistic.consignee))
            .where(status_condition)
            .order_by(Logistic.lgs_d_creation.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_pending_deliveries(
        self,
        days_ahead: int = 7
    ) -> List[Logistic]:
        """Get shipments with estimated delivery within the next N days."""
        from datetime import timedelta

        now = datetime.utcnow()
        end_date = now + timedelta(days=days_ahead)

        result = await self.db.execute(
            select(Logistic)
            .options(selectinload(Logistic.supplier), selectinload(Logistic.consignee))
            .where(
                and_(
                    Logistic.lgs_d_arrive.is_(None),
                    Logistic.lgs_d_arrive_pre.isnot(None),
                    Logistic.lgs_d_arrive_pre >= now,
                    Logistic.lgs_d_arrive_pre <= end_date
                )
            )
            .order_by(Logistic.lgs_d_arrive_pre.asc())
        )
        return list(result.scalars().all())

    async def get_overdue_shipments(self) -> List[Logistic]:
        """Get shipments that are past their estimated delivery date but not delivered."""
        now = datetime.utcnow()

        result = await self.db.execute(
            select(Logistic)
            .options(selectinload(Logistic.supplier), selectinload(Logistic.consignee))
            .where(
                and_(
                    Logistic.lgs_d_arrive.is_(None),
                    Logistic.lgs_d_arrive_pre.isnot(None),
                    Logistic.lgs_d_arrive_pre < now
                )
            )
            .order_by(Logistic.lgs_d_arrive_pre.asc())
        )
        return list(result.scalars().all())

    async def get_shipment_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        society_id: Optional[int] = None,
    ) -> dict:
        """Get shipment statistics."""
        conditions = []

        if society_id is not None:
            conditions.append(Logistic.soc_id == society_id)
        if start_date:
            conditions.append(Logistic.lgs_d_creation >= start_date)
        if end_date:
            conditions.append(Logistic.lgs_d_creation <= end_date)

        delivered_condition = self._delivered_condition()
        in_transit_condition = self._in_transit_condition(delivered_condition)

        total_query = select(func.count(Logistic.lgs_id))
        delivered_query = select(func.count(Logistic.lgs_id)).where(delivered_condition)
        in_transit_query = select(func.count(Logistic.lgs_id)).where(in_transit_condition)

        if conditions:
            total_query = total_query.where(and_(*conditions))
            delivered_query = delivered_query.where(and_(*conditions))
            in_transit_query = in_transit_query.where(and_(*conditions))

        total = (await self.db.execute(total_query)).scalar() or 0
        delivered = (await self.db.execute(delivered_query)).scalar() or 0
        in_transit = (await self.db.execute(in_transit_query)).scalar() or 0
        pending = max(total - delivered - in_transit, 0)

        on_time_query = select(func.count(Logistic.lgs_id)).where(
            and_(
                delivered_condition,
                Logistic.lgs_d_arrive_pre.isnot(None),
                Logistic.lgs_d_arrive <= Logistic.lgs_d_arrive_pre
            )
        )
        if conditions:
            on_time_query = on_time_query.where(and_(*conditions))
        on_time = (await self.db.execute(on_time_query)).scalar() or 0

        on_time_percentage = (on_time / delivered * 100) if delivered > 0 else 0

        return {
            "total_shipments": total,
            "delivered": delivered,
            "in_transit": in_transit,
            "pending": pending,
            "returned": 0,
            "on_time_percentage": on_time_percentage,
            "average_delivery_time": 0,
        }

    # =====================
    # Internal helpers
    # =====================

    async def _get_supplier(self, supplier_id: int) -> Supplier:
        result = await self.db.execute(
            select(Supplier).where(Supplier.sup_id == supplier_id)
        )
        supplier = result.scalar_one_or_none()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")
        return supplier

    def _delivered_condition(self):
        return or_(
            Logistic.lgs_is_received.is_(True),
            Logistic.lgs_is_stockin.is_(True),
            Logistic.lgs_d_arrive.isnot(None),
        )

    def _in_transit_condition(self, delivered_condition=None):
        if delivered_condition is None:
            delivered_condition = self._delivered_condition()
        return and_(
            Logistic.lgs_is_send.is_(True),
            ~delivered_condition,
        )

    def _status_condition(self, status_id: int):
        delivered_condition = self._delivered_condition()
        if status_id == 3:
            return delivered_condition
        if status_id == 2:
            return self._in_transit_condition(delivered_condition)
        if status_id == 1:
            return or_(Logistic.lgs_is_send.is_(False), Logistic.lgs_is_send.is_(None))
        return false()

    def _apply_status(self, shipment: Logistic, status_id: int, actual_delivery: Optional[datetime]):
        if status_id == 3:
            shipment.lgs_is_send = True
            shipment.lgs_is_received = True
            shipment.lgs_is_stockin = True
            shipment.lgs_d_arrive = actual_delivery or datetime.utcnow()
            shipment.lgs_d_stockin = shipment.lgs_d_arrive
            if shipment.lgs_d_send is None:
                shipment.lgs_d_send = shipment.lgs_d_creation
        elif status_id == 2:
            shipment.lgs_is_send = True
            shipment.lgs_is_received = False
            shipment.lgs_is_stockin = False
            shipment.lgs_d_send = shipment.lgs_d_send or datetime.utcnow()
            shipment.lgs_d_arrive = None
            shipment.lgs_d_stockin = None
        else:
            shipment.lgs_is_send = False
            shipment.lgs_is_received = False
            shipment.lgs_is_stockin = False
            shipment.lgs_d_send = None
            shipment.lgs_d_arrive = None
            shipment.lgs_d_stockin = None

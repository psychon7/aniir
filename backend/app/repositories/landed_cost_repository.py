"""
Repository for Landed Cost data access operations.

Uses synchronous SQLAlchemy Session (pymssql) for SQL Server 2008 compatibility.
Service layer wraps calls with asyncio.to_thread() for async endpoints.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.orm import Session, selectinload

from app.models.landed_cost import (
    SupplyLot, SupplyLotItem, FreightCost, LandedCostAllocationLog,
    AllocationStrategy, LotStatus, FreightCostType
)
from app.schemas.landed_cost import (
    SupplyLotCreate, SupplyLotUpdate,
    SupplyLotItemCreate, SupplyLotItemUpdate,
    FreightCostCreate, FreightCostUpdate,
    SupplyLotSearchParams
)


class LandedCostRepository:
    """Repository for landed cost related data operations."""

    def __init__(self, db: Session):
        self.db = db

    # =====================
    # Supply Lot Operations
    # =====================

    def create_supply_lot(
        self,
        data: SupplyLotCreate,
        created_by: Optional[int] = None
    ) -> SupplyLot:
        """Create a new supply lot."""
        lot = SupplyLot(
            lot_reference=data.lot_reference,
            lot_name=getattr(data, "lot_name", None),
            lot_description=data.description,
            lot_sup_id=data.supplier_id,
            lot_status=LotStatus.DRAFT.value,
            lot_allocation_strategy=(
                data.allocation_strategy.value if data.allocation_strategy else None
            ),
            lot_total_freight_cost=data.freight_cost,
            lot_total_customs_cost=data.customs_cost,
            lot_total_insurance_cost=data.insurance_cost,
            lot_total_other_cost=data.other_cost,
            lot_created_at=datetime.utcnow(),
            lot_created_by=created_by,
        )
        self.db.add(lot)
        self.db.flush()
        self.db.refresh(lot)
        return lot

    def get_supply_lot(self, lot_id: int) -> Optional[SupplyLot]:
        """Get a supply lot by ID."""
        return (
            self.db.query(SupplyLot)
            .options(
                selectinload(SupplyLot.items),
                selectinload(SupplyLot.freight_costs),
            )
            .filter(SupplyLot.lot_id == lot_id)
            .first()
        )

    def get_supply_lot_by_reference(self, reference: str) -> Optional[SupplyLot]:
        """Get a supply lot by reference."""
        return (
            self.db.query(SupplyLot)
            .filter(SupplyLot.lot_reference == reference)
            .first()
        )

    def update_supply_lot(
        self,
        lot_id: int,
        data: SupplyLotUpdate
    ) -> Optional[SupplyLot]:
        """Update a supply lot."""
        lot = self.get_supply_lot(lot_id)
        if not lot:
            return None

        update_data = data.model_dump(exclude_unset=True)
        field_mapping = {
            "lot_reference": "lot_reference",
            "lot_date": "lot_ship_date",
            "description": "lot_description",
            "supplier_id": "lot_sup_id",
            "freight_cost": "lot_total_freight_cost",
            "customs_cost": "lot_total_customs_cost",
            "insurance_cost": "lot_total_insurance_cost",
            "other_cost": "lot_total_other_cost",
            "allocation_strategy": "lot_allocation_strategy",
        }
        for schema_field, model_field in field_mapping.items():
            if schema_field in update_data and update_data[schema_field] is not None:
                value = update_data[schema_field]
                if schema_field == "allocation_strategy" and hasattr(value, "value"):
                    value = value.value
                setattr(lot, model_field, value)

        lot.lot_updated_at = datetime.utcnow()
        self.db.flush()
        self.db.refresh(lot)
        return lot

    def delete_supply_lot(self, lot_id: int) -> bool:
        """Delete a supply lot and all related data."""
        lot = self.get_supply_lot(lot_id)
        if not lot:
            return False

        self.db.delete(lot)
        self.db.flush()
        return True

    def search_supply_lots(
        self,
        params: SupplyLotSearchParams
    ) -> Tuple[List[SupplyLot], int]:
        """Search supply lots with filters and pagination."""
        query = self.db.query(SupplyLot)
        count_query = self.db.query(func.count(SupplyLot.lot_id))

        conditions = []

        if params.reference:
            conditions.append(SupplyLot.lot_reference.ilike(f"%{params.reference}%"))
        if params.name:
            conditions.append(SupplyLot.lot_name.ilike(f"%{params.name}%"))
        if params.status:
            conditions.append(SupplyLot.lot_status == params.status.value)
        if params.supplier_id:
            conditions.append(SupplyLot.lot_sup_id == params.supplier_id)
        if params.origin_country_id:
            conditions.append(SupplyLot.lot_origin_country_id == params.origin_country_id)
        if params.destination_country_id:
            conditions.append(SupplyLot.lot_destination_country_id == params.destination_country_id)
        if params.allocation_completed is not None:
            conditions.append(SupplyLot.lot_allocation_completed == params.allocation_completed)
        if params.society_id:
            conditions.append(SupplyLot.lot_soc_id == params.society_id)
        if params.bu_id:
            conditions.append(SupplyLot.lot_bu_id == params.bu_id)

        if conditions:
            query = query.filter(and_(*conditions))
            count_query = count_query.filter(and_(*conditions))

        # Sorting
        sort_column = getattr(SupplyLot, params.sort_by, SupplyLot.lot_created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        lots = query.all()
        total = count_query.scalar() or 0

        return lots, total

    # =====================
    # Supply Lot Item Operations
    # =====================

    def add_lot_item(
        self,
        lot_id: int,
        data: SupplyLotItemCreate
    ) -> Optional[SupplyLotItem]:
        """Add an item to a supply lot."""
        lot = self.get_supply_lot(lot_id)
        if not lot:
            return None

        total_price = data.quantity * data.unit_price

        item = SupplyLotItem(
            sli_lot_id=lot_id,
            sli_prd_id=data.product_id,
            sli_pit_id=data.product_instance_id,
            sli_quantity=data.quantity,
            sli_unit_price=data.unit_price,
            sli_total_price=total_price,
            sli_weight_kg=data.weight_kg,
            sli_volume_cbm=data.volume_m3,
            sli_created_at=datetime.utcnow(),
        )
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def update_lot_item(
        self,
        item_id: int,
        data: SupplyLotItemUpdate
    ) -> Optional[SupplyLotItem]:
        """Update a supply lot item."""
        item = self.db.query(SupplyLotItem).filter(SupplyLotItem.sli_id == item_id).first()
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)
        field_mapping = {
            "product_id": "sli_prd_id",
            "product_instance_id": "sli_pit_id",
            "quantity": "sli_quantity",
            "unit_price": "sli_unit_price",
            "weight_kg": "sli_weight_kg",
            "volume_m3": "sli_volume_cbm",
        }
        for schema_field, model_field in field_mapping.items():
            if schema_field in update_data and update_data[schema_field] is not None:
                setattr(item, model_field, update_data[schema_field])

        # Recalculate total price
        item.sli_total_price = item.sli_quantity * item.sli_unit_price
        item.sli_updated_at = datetime.utcnow()
        self.db.flush()
        self.db.refresh(item)
        return item

    def delete_lot_item(self, item_id: int) -> bool:
        """Delete a supply lot item."""
        item = self.db.query(SupplyLotItem).filter(SupplyLotItem.sli_id == item_id).first()
        if not item:
            return False

        self.db.delete(item)
        self.db.flush()
        return True

    def get_lot_items(self, lot_id: int) -> List[SupplyLotItem]:
        """Get all items for a supply lot."""
        return (
            self.db.query(SupplyLotItem)
            .filter(SupplyLotItem.sli_lot_id == lot_id)
            .order_by(SupplyLotItem.sli_sort_order)
            .all()
        )

    # =====================
    # Freight Cost Operations
    # =====================

    def add_freight_cost(
        self,
        data: FreightCostCreate,
        created_by: Optional[int] = None
    ) -> Optional[FreightCost]:
        """Add a freight cost to a supply lot."""
        lot_id = data.frc_lot_id or data.supply_lot_id
        lot = self.get_supply_lot(lot_id)
        if not lot:
            return None

        cost = FreightCost(
            frc_lot_id=lot_id,
            frc_type=data.cost_type,
            frc_description=data.description,
            frc_amount=data.amount,
            frc_exchange_rate=Decimal("1"),
            frc_amount_converted=data.amount,
            frc_created_at=datetime.utcnow(),
            frc_created_by=created_by,
        )
        self.db.add(cost)
        self.db.flush()
        self.db.refresh(cost)
        return cost

    def update_freight_cost(
        self,
        cost_id: int,
        data: FreightCostUpdate
    ) -> Optional[FreightCost]:
        """Update a freight cost."""
        cost = self.db.query(FreightCost).filter(FreightCost.frc_id == cost_id).first()
        if not cost:
            return None

        update_data = data.model_dump(exclude_unset=True)
        field_mapping = {
            "cost_type": "frc_type",
            "description": "frc_description",
            "amount": "frc_amount",
            "currency": "frc_cur_id",
        }
        for schema_field, model_field in field_mapping.items():
            if schema_field in update_data and update_data[schema_field] is not None:
                setattr(cost, model_field, update_data[schema_field])

        # Recalculate converted amount
        cost.frc_amount_converted = cost.frc_amount * cost.frc_exchange_rate
        cost.frc_updated_at = datetime.utcnow()
        self.db.flush()
        self.db.refresh(cost)
        return cost

    def delete_freight_cost(self, cost_id: int) -> bool:
        """Delete a freight cost."""
        cost = self.db.query(FreightCost).filter(FreightCost.frc_id == cost_id).first()
        if not cost:
            return False

        self.db.delete(cost)
        self.db.flush()
        return True

    def get_freight_costs(self, lot_id: int) -> List[FreightCost]:
        """Get all freight costs for a supply lot."""
        return (
            self.db.query(FreightCost)
            .filter(FreightCost.frc_lot_id == lot_id)
            .order_by(FreightCost.frc_created_at)
            .all()
        )

    # =====================
    # Allocation Log Operations
    # =====================

    def create_allocation_log(
        self,
        lot_id: int,
        strategy: AllocationStrategy,
        status: str,
        totals: dict,
        items_count: int,
        error_message: Optional[str] = None,
        calculated_by: Optional[int] = None
    ) -> LandedCostAllocationLog:
        """Create an allocation log entry."""
        log = LandedCostAllocationLog(
            lcl_lot_id=lot_id,
            lcl_strategy=strategy.value,
            lcl_status=status,
            lcl_total_freight=totals.get("freight", Decimal("0")),
            lcl_total_customs=totals.get("customs", Decimal("0")),
            lcl_total_insurance=totals.get("insurance", Decimal("0")),
            lcl_total_local=totals.get("local", Decimal("0")),
            lcl_total_other=totals.get("other", Decimal("0")),
            lcl_total_allocated=totals.get("total", Decimal("0")),
            lcl_items_count=items_count,
            lcl_error_message=error_message,
            lcl_calculated_by=calculated_by,
            lcl_calculated_at=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.flush()
        return log

    def get_allocation_logs(self, lot_id: int) -> List[LandedCostAllocationLog]:
        """Get all allocation logs for a supply lot."""
        return (
            self.db.query(LandedCostAllocationLog)
            .filter(LandedCostAllocationLog.lcl_lot_id == lot_id)
            .order_by(LandedCostAllocationLog.lcl_calculated_at.desc())
            .all()
        )

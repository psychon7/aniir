"""
Repository for Landed Cost data access operations.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Supply Lot Operations
    # =====================

    async def create_supply_lot(
        self,
        data: SupplyLotCreate,
        created_by: Optional[int] = None
    ) -> SupplyLot:
        """Create a new supply lot."""
        # Create the lot
        lot = SupplyLot(
            lot_reference=data.lot_reference,
            lot_name=data.lot_name,
            lot_description=data.lot_description,
            lot_sup_id=data.lot_sup_id,
            lot_origin_country_id=data.lot_origin_country_id,
            lot_destination_country_id=data.lot_destination_country_id,
            lot_ship_date=data.lot_ship_date,
            lot_eta_date=data.lot_eta_date,
            lot_arrival_date=data.lot_arrival_date,
            lot_status=data.lot_status.value if data.lot_status else LotStatus.DRAFT.value,
            lot_cur_id=data.lot_cur_id,
            lot_soc_id=data.lot_soc_id,
            lot_bu_id=data.lot_bu_id,
            lot_notes=data.lot_notes,
            lot_created_by=created_by
        )

        self.db.add(lot)
        await self.db.flush()

        # Add items if provided
        if data.items:
            for idx, item_data in enumerate(data.items):
                await self._add_lot_item(lot.lot_id, item_data, idx)

        # Recalculate totals
        await self._recalculate_lot_totals(lot.lot_id)

        await self.db.refresh(lot)
        return lot

    async def get_supply_lot(self, lot_id: int) -> Optional[SupplyLot]:
        """Get a supply lot by ID."""
        result = await self.db.execute(
            select(SupplyLot)
            .options(selectinload(SupplyLot.items), selectinload(SupplyLot.freight_costs))
            .where(SupplyLot.lot_id == lot_id)
        )
        return result.scalar_one_or_none()

    async def get_supply_lot_by_reference(self, reference: str) -> Optional[SupplyLot]:
        """Get a supply lot by reference."""
        result = await self.db.execute(
            select(SupplyLot).where(SupplyLot.lot_reference == reference)
        )
        return result.scalar_one_or_none()

    async def update_supply_lot(
        self,
        lot_id: int,
        data: SupplyLotUpdate
    ) -> Optional[SupplyLot]:
        """Update a supply lot."""
        lot = await self.get_supply_lot(lot_id)
        if not lot:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "lot_status" and hasattr(value, "value"):
                    value = value.value
                setattr(lot, field, value)

        lot.lot_updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(lot)
        return lot

    async def delete_supply_lot(self, lot_id: int) -> bool:
        """Delete a supply lot and all related data."""
        lot = await self.get_supply_lot(lot_id)
        if not lot:
            return False

        await self.db.delete(lot)
        await self.db.flush()
        return True

    async def search_supply_lots(
        self,
        params: SupplyLotSearchParams
    ) -> Tuple[List[SupplyLot], int]:
        """Search supply lots with filters and pagination."""
        query = select(SupplyLot)
        count_query = select(func.count(SupplyLot.lot_id))

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
        if params.ship_date_from:
            conditions.append(SupplyLot.lot_ship_date >= params.ship_date_from)
        if params.ship_date_to:
            conditions.append(SupplyLot.lot_ship_date <= params.ship_date_to)
        if params.eta_date_from:
            conditions.append(SupplyLot.lot_eta_date >= params.eta_date_from)
        if params.eta_date_to:
            conditions.append(SupplyLot.lot_eta_date <= params.eta_date_to)
        if params.allocation_completed is not None:
            conditions.append(SupplyLot.lot_allocation_completed == params.allocation_completed)
        if params.society_id:
            conditions.append(SupplyLot.lot_soc_id == params.society_id)
        if params.bu_id:
            conditions.append(SupplyLot.lot_bu_id == params.bu_id)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_column = getattr(SupplyLot, params.sort_by, SupplyLot.lot_created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        # Execute queries
        result = await self.db.execute(query)
        lots = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return lots, total

    # =====================
    # Supply Lot Item Operations
    # =====================

    async def add_lot_item(
        self,
        lot_id: int,
        data: SupplyLotItemCreate
    ) -> Optional[SupplyLotItem]:
        """Add an item to a supply lot."""
        lot = await self.get_supply_lot(lot_id)
        if not lot:
            return None

        # Get next sort order
        max_order_result = await self.db.execute(
            select(func.max(SupplyLotItem.sli_sort_order))
            .where(SupplyLotItem.sli_lot_id == lot_id)
        )
        max_order = max_order_result.scalar_one() or 0

        item = await self._add_lot_item(lot_id, data, max_order + 1)
        await self._recalculate_lot_totals(lot_id)
        return item

    async def _add_lot_item(
        self,
        lot_id: int,
        data: SupplyLotItemCreate,
        sort_order: int
    ) -> SupplyLotItem:
        """Internal method to add a lot item."""
        total_price = data.sli_quantity * data.sli_unit_price

        item = SupplyLotItem(
            sli_lot_id=lot_id,
            sli_prd_id=data.sli_prd_id,
            sli_pit_id=data.sli_pit_id,
            sli_description=data.sli_description,
            sli_sku=data.sli_sku,
            sli_quantity=data.sli_quantity,
            sli_unit_price=data.sli_unit_price,
            sli_total_price=total_price,
            sli_weight_kg=data.sli_weight_kg,
            sli_volume_cbm=data.sli_volume_cbm,
            sli_unit_weight_kg=data.sli_unit_weight_kg,
            sli_unit_volume_cbm=data.sli_unit_volume_cbm,
            sli_sort_order=data.sli_sort_order if data.sli_sort_order else sort_order
        )

        self.db.add(item)
        await self.db.flush()
        return item

    async def update_lot_item(
        self,
        item_id: int,
        data: SupplyLotItemUpdate
    ) -> Optional[SupplyLotItem]:
        """Update a supply lot item."""
        result = await self.db.execute(
            select(SupplyLotItem).where(SupplyLotItem.sli_id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(item, field, value)

        # Recalculate total price if quantity or unit price changed
        if "sli_quantity" in update_data or "sli_unit_price" in update_data:
            item.sli_total_price = item.sli_quantity * item.sli_unit_price

        item.sli_updated_at = datetime.utcnow()
        await self.db.flush()

        # Recalculate lot totals
        await self._recalculate_lot_totals(item.sli_lot_id)

        await self.db.refresh(item)
        return item

    async def delete_lot_item(self, item_id: int) -> bool:
        """Delete a supply lot item."""
        result = await self.db.execute(
            select(SupplyLotItem).where(SupplyLotItem.sli_id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return False

        lot_id = item.sli_lot_id
        await self.db.delete(item)
        await self.db.flush()

        # Recalculate lot totals
        await self._recalculate_lot_totals(lot_id)
        return True

    async def get_lot_items(self, lot_id: int) -> List[SupplyLotItem]:
        """Get all items for a supply lot."""
        result = await self.db.execute(
            select(SupplyLotItem)
            .where(SupplyLotItem.sli_lot_id == lot_id)
            .order_by(SupplyLotItem.sli_sort_order)
        )
        return list(result.scalars().all())

    # =====================
    # Freight Cost Operations
    # =====================

    async def add_freight_cost(
        self,
        data: FreightCostCreate,
        created_by: Optional[int] = None
    ) -> Optional[FreightCost]:
        """Add a freight cost to a supply lot."""
        lot = await self.get_supply_lot(data.frc_lot_id)
        if not lot:
            return None

        # Calculate converted amount
        amount_converted = data.frc_amount * data.frc_exchange_rate

        cost = FreightCost(
            frc_lot_id=data.frc_lot_id,
            frc_type=data.frc_type.value,
            frc_description=data.frc_description,
            frc_amount=data.frc_amount,
            frc_cur_id=data.frc_cur_id,
            frc_exchange_rate=data.frc_exchange_rate,
            frc_amount_converted=amount_converted,
            frc_vendor_name=data.frc_vendor_name,
            frc_invoice_ref=data.frc_invoice_ref,
            frc_invoice_date=data.frc_invoice_date,
            frc_is_paid=data.frc_is_paid,
            frc_paid_date=data.frc_paid_date,
            frc_notes=data.frc_notes,
            frc_created_by=created_by
        )

        self.db.add(cost)
        await self.db.flush()

        # Recalculate lot cost totals
        await self._recalculate_lot_cost_totals(data.frc_lot_id)

        await self.db.refresh(cost)
        return cost

    async def update_freight_cost(
        self,
        cost_id: int,
        data: FreightCostUpdate
    ) -> Optional[FreightCost]:
        """Update a freight cost."""
        result = await self.db.execute(
            select(FreightCost).where(FreightCost.frc_id == cost_id)
        )
        cost = result.scalar_one_or_none()
        if not cost:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "frc_type" and hasattr(value, "value"):
                    value = value.value
                setattr(cost, field, value)

        # Recalculate converted amount if amount or exchange rate changed
        if "frc_amount" in update_data or "frc_exchange_rate" in update_data:
            cost.frc_amount_converted = cost.frc_amount * cost.frc_exchange_rate

        cost.frc_updated_at = datetime.utcnow()
        await self.db.flush()

        # Recalculate lot cost totals
        await self._recalculate_lot_cost_totals(cost.frc_lot_id)

        await self.db.refresh(cost)
        return cost

    async def delete_freight_cost(self, cost_id: int) -> bool:
        """Delete a freight cost."""
        result = await self.db.execute(
            select(FreightCost).where(FreightCost.frc_id == cost_id)
        )
        cost = result.scalar_one_or_none()
        if not cost:
            return False

        lot_id = cost.frc_lot_id
        await self.db.delete(cost)
        await self.db.flush()

        # Recalculate lot cost totals
        await self._recalculate_lot_cost_totals(lot_id)
        return True

    async def get_freight_costs(self, lot_id: int) -> List[FreightCost]:
        """Get all freight costs for a supply lot."""
        result = await self.db.execute(
            select(FreightCost)
            .where(FreightCost.frc_lot_id == lot_id)
            .order_by(FreightCost.frc_created_at)
        )
        return list(result.scalars().all())

    async def get_freight_costs_by_type(
        self,
        lot_id: int,
        cost_type: FreightCostType
    ) -> List[FreightCost]:
        """Get freight costs for a supply lot filtered by type."""
        result = await self.db.execute(
            select(FreightCost)
            .where(
                and_(
                    FreightCost.frc_lot_id == lot_id,
                    FreightCost.frc_type == cost_type.value
                )
            )
            .order_by(FreightCost.frc_created_at)
        )
        return list(result.scalars().all())

    # =====================
    # Allocation Log Operations
    # =====================

    async def create_allocation_log(
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
            lcl_calculated_by=calculated_by
        )

        self.db.add(log)
        await self.db.flush()
        return log

    async def get_allocation_logs(self, lot_id: int) -> List[LandedCostAllocationLog]:
        """Get all allocation logs for a supply lot."""
        result = await self.db.execute(
            select(LandedCostAllocationLog)
            .where(LandedCostAllocationLog.lcl_lot_id == lot_id)
            .order_by(LandedCostAllocationLog.lcl_calculated_at.desc())
        )
        return list(result.scalars().all())

    # =====================
    # Helper Methods
    # =====================

    async def _recalculate_lot_totals(self, lot_id: int) -> None:
        """Recalculate lot totals from items."""
        result = await self.db.execute(
            select(
                func.count(SupplyLotItem.sli_id).label("total_items"),
                func.coalesce(func.sum(SupplyLotItem.sli_quantity), Decimal("0")).label("total_quantity"),
                func.coalesce(func.sum(SupplyLotItem.sli_weight_kg), Decimal("0")).label("total_weight"),
                func.coalesce(func.sum(SupplyLotItem.sli_volume_cbm), Decimal("0")).label("total_volume"),
                func.coalesce(func.sum(SupplyLotItem.sli_total_price), Decimal("0")).label("total_value")
            )
            .where(SupplyLotItem.sli_lot_id == lot_id)
        )
        totals = result.one()

        await self.db.execute(
            update(SupplyLot)
            .where(SupplyLot.lot_id == lot_id)
            .values(
                lot_total_items=totals.total_items or 0,
                lot_total_quantity=totals.total_quantity or Decimal("0"),
                lot_total_weight_kg=totals.total_weight or Decimal("0"),
                lot_total_volume_cbm=totals.total_volume or Decimal("0"),
                lot_total_value=totals.total_value or Decimal("0"),
                lot_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()

    async def _recalculate_lot_cost_totals(self, lot_id: int) -> None:
        """Recalculate lot cost totals from freight costs."""
        result = await self.db.execute(
            select(
                FreightCost.frc_type,
                func.coalesce(func.sum(FreightCost.frc_amount_converted), Decimal("0")).label("total")
            )
            .where(FreightCost.frc_lot_id == lot_id)
            .group_by(FreightCost.frc_type)
        )
        cost_totals = {row.frc_type: row.total for row in result.all()}

        freight = cost_totals.get(FreightCostType.FREIGHT.value, Decimal("0"))
        customs = cost_totals.get(FreightCostType.CUSTOMS.value, Decimal("0"))
        insurance = cost_totals.get(FreightCostType.INSURANCE.value, Decimal("0"))
        local = cost_totals.get(FreightCostType.LOCAL.value, Decimal("0"))
        handling = cost_totals.get(FreightCostType.HANDLING.value, Decimal("0"))
        other = cost_totals.get(FreightCostType.OTHER.value, Decimal("0"))

        total_other = handling + other
        total_landed = freight + customs + insurance + local + total_other

        await self.db.execute(
            update(SupplyLot)
            .where(SupplyLot.lot_id == lot_id)
            .values(
                lot_total_freight_cost=freight,
                lot_total_customs_cost=customs,
                lot_total_insurance_cost=insurance,
                lot_total_local_cost=local,
                lot_total_other_cost=total_other,
                lot_total_landed_cost=total_landed,
                lot_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()

    async def update_lot_item_allocations(
        self,
        item_id: int,
        allocations: dict
    ) -> None:
        """Update allocated costs for a lot item."""
        total_allocated = (
            allocations.get("freight", Decimal("0")) +
            allocations.get("customs", Decimal("0")) +
            allocations.get("insurance", Decimal("0")) +
            allocations.get("local", Decimal("0")) +
            allocations.get("other", Decimal("0"))
        )

        await self.db.execute(
            update(SupplyLotItem)
            .where(SupplyLotItem.sli_id == item_id)
            .values(
                sli_allocated_freight=allocations.get("freight", Decimal("0")),
                sli_allocated_customs=allocations.get("customs", Decimal("0")),
                sli_allocated_insurance=allocations.get("insurance", Decimal("0")),
                sli_allocated_local=allocations.get("local", Decimal("0")),
                sli_allocated_other=allocations.get("other", Decimal("0")),
                sli_total_allocated_cost=total_allocated,
                sli_updated_at=datetime.utcnow()
            )
        )

    async def update_lot_item_landed_cost(
        self,
        item_id: int,
        landed_cost_per_unit: Decimal,
        total_landed_cost: Decimal
    ) -> None:
        """Update landed cost for a lot item."""
        await self.db.execute(
            update(SupplyLotItem)
            .where(SupplyLotItem.sli_id == item_id)
            .values(
                sli_landed_cost_per_unit=landed_cost_per_unit,
                sli_total_landed_cost=total_landed_cost,
                sli_updated_at=datetime.utcnow()
            )
        )

    async def mark_allocation_completed(
        self,
        lot_id: int,
        strategy: AllocationStrategy
    ) -> None:
        """Mark allocation as completed for a lot."""
        await self.db.execute(
            update(SupplyLot)
            .where(SupplyLot.lot_id == lot_id)
            .values(
                lot_allocation_strategy=strategy.value,
                lot_allocation_completed=True,
                lot_allocation_date=datetime.utcnow(),
                lot_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()

    async def reset_allocation(self, lot_id: int) -> None:
        """Reset allocation data for a lot and all its items."""
        # Reset lot allocation status
        await self.db.execute(
            update(SupplyLot)
            .where(SupplyLot.lot_id == lot_id)
            .values(
                lot_allocation_strategy=None,
                lot_allocation_completed=False,
                lot_allocation_date=None,
                lot_updated_at=datetime.utcnow()
            )
        )

        # Reset all items
        await self.db.execute(
            update(SupplyLotItem)
            .where(SupplyLotItem.sli_lot_id == lot_id)
            .values(
                sli_allocated_freight=Decimal("0"),
                sli_allocated_customs=Decimal("0"),
                sli_allocated_insurance=Decimal("0"),
                sli_allocated_local=Decimal("0"),
                sli_allocated_other=Decimal("0"),
                sli_total_allocated_cost=Decimal("0"),
                sli_landed_cost_per_unit=None,
                sli_total_landed_cost=Decimal("0"),
                sli_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()

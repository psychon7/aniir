"""
Landed Cost Service - Handles supply lot CRUD and cost allocation calculations.

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, and_, update, delete
from sqlalchemy.orm import Session, selectinload

from app.models.landed_cost import (
    SupplyLot, SupplyLotItem, FreightCost, LandedCostAllocationLog,
    AllocationStrategy as ModelAllocationStrategy,
    LotStatus as ModelLotStatus,
    FreightCostType as ModelFreightCostType,
)
from app.models.product import Product
from app.schemas.landed_cost import (
    AllocationStrategy,
    MixedStrategyWeights,
    StrategyOption,
    LandedCostStrategyResponse,
    LandedCostCalculationRequest,
    LandedCostCalculationResponse,
    LandedCostBreakdownResponse,
    LandedCostBreakdownItem,
    ProductAllocation,
    AllocationLogResponse,
    SupplyLotCreate,
    SupplyLotUpdate,
    SupplyLotSearchParams,
    SupplyLotDetailResponse,
    SupplyLotListResponse,
    SupplyLotItemCreate,
    SupplyLotItemUpdate,
    FreightCostCreate,
    FreightCostUpdate,
    LotStatus,
)


# =============================================================================
# Custom Exceptions
# =============================================================================

class LandedCostServiceError(Exception):
    """Base exception for landed cost service errors."""
    pass


class LotNotFoundError(LandedCostServiceError):
    """Raised when a supply lot is not found."""
    pass


class AllocationError(LandedCostServiceError):
    """Raised when cost allocation fails."""
    pass


class InsufficientDataError(LandedCostServiceError):
    """Raised when there is insufficient data for calculation."""
    pass


class LandedCostService:
    """Service for landed cost CRUD operations and calculations."""

    # Strategy options with metadata
    STRATEGY_OPTIONS: List[StrategyOption] = [
        StrategyOption(
            value=AllocationStrategy.WEIGHT,
            label="Weight-Based",
            description="Distribute costs proportionally by product weight (kg)",
            icon="Scale"
        ),
        StrategyOption(
            value=AllocationStrategy.VOLUME,
            label="Volume-Based",
            description="Distribute costs proportionally by product volume (m3)",
            icon="Box"
        ),
        StrategyOption(
            value=AllocationStrategy.VALUE,
            label="Value-Based",
            description="Distribute costs proportionally by product value",
            icon="DollarSign"
        ),
        StrategyOption(
            value=AllocationStrategy.MIXED,
            label="Mixed Strategy",
            description="Custom combination of weight, volume, and value",
            icon="Sliders"
        ),
    ]

    def __init__(self, db: Session):
        self.db = db

    # =========================================================================
    # Supply Lot CRUD (sync implementations)
    # =========================================================================

    def _sync_create_supply_lot(
        self,
        data: SupplyLotCreate,
        created_by: Optional[int] = None
    ) -> dict:
        """Create a new supply lot (sync)."""
        lot = SupplyLot(
            lot_reference=data.lot_reference,
            lot_name=getattr(data, "lot_name", None),
            lot_description=data.description,
            lot_sup_id=data.supplier_id,
            lot_status=ModelLotStatus.DRAFT.value,
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
        return self._lot_to_detail_dict(lot)

    def _sync_get_supply_lot(self, lot_id: int) -> dict:
        """Get a supply lot by ID with items and freight costs (sync)."""
        lot = (
            self.db.query(SupplyLot)
            .options(
                selectinload(SupplyLot.items),
                selectinload(SupplyLot.freight_costs),
            )
            .filter(SupplyLot.lot_id == lot_id)
            .first()
        )
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")
        return self._lot_to_detail_dict(lot)

    def _sync_search_supply_lots(self, params: SupplyLotSearchParams) -> dict:
        """Search supply lots with filters and pagination (sync)."""
        query = self.db.query(SupplyLot)
        count_query = self.db.query(func.count(SupplyLot.lot_id))

        # Apply filters
        if params.reference:
            query = query.filter(SupplyLot.lot_reference.ilike(f"%{params.reference}%"))
            count_query = count_query.filter(SupplyLot.lot_reference.ilike(f"%{params.reference}%"))
        if params.name:
            query = query.filter(SupplyLot.lot_name.ilike(f"%{params.name}%"))
            count_query = count_query.filter(SupplyLot.lot_name.ilike(f"%{params.name}%"))
        if params.status:
            query = query.filter(SupplyLot.lot_status == params.status.value)
            count_query = count_query.filter(SupplyLot.lot_status == params.status.value)
        if params.supplier_id:
            query = query.filter(SupplyLot.lot_sup_id == params.supplier_id)
            count_query = count_query.filter(SupplyLot.lot_sup_id == params.supplier_id)
        if params.origin_country_id:
            query = query.filter(SupplyLot.lot_origin_country_id == params.origin_country_id)
            count_query = count_query.filter(SupplyLot.lot_origin_country_id == params.origin_country_id)
        if params.destination_country_id:
            query = query.filter(SupplyLot.lot_destination_country_id == params.destination_country_id)
            count_query = count_query.filter(SupplyLot.lot_destination_country_id == params.destination_country_id)
        if params.allocation_completed is not None:
            query = query.filter(SupplyLot.lot_allocation_completed == params.allocation_completed)
            count_query = count_query.filter(SupplyLot.lot_allocation_completed == params.allocation_completed)
        if params.society_id:
            query = query.filter(SupplyLot.lot_soc_id == params.society_id)
            count_query = count_query.filter(SupplyLot.lot_soc_id == params.society_id)
        if params.bu_id:
            query = query.filter(SupplyLot.lot_bu_id == params.bu_id)
            count_query = count_query.filter(SupplyLot.lot_bu_id == params.bu_id)

        # Count
        total = count_query.scalar() or 0

        # Sorting
        sort_column = getattr(SupplyLot, params.sort_by, SupplyLot.lot_created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        lots = query.offset(offset).limit(params.page_size).all()

        return {
            "items": [self._lot_to_response_dict(lot) for lot in lots],
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
        }

    def _sync_update_supply_lot(self, lot_id: int, data: SupplyLotUpdate) -> dict:
        """Update a supply lot (sync)."""
        lot = self.db.query(SupplyLot).filter(SupplyLot.lot_id == lot_id).first()
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

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
        return self._lot_to_detail_dict(lot)

    def _sync_delete_supply_lot(self, lot_id: int) -> None:
        """Delete a supply lot and all related data (sync)."""
        lot = self.db.query(SupplyLot).filter(SupplyLot.lot_id == lot_id).first()
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")
        self.db.delete(lot)
        self.db.flush()

    # =========================================================================
    # Supply Lot Item CRUD (sync implementations)
    # =========================================================================

    def _sync_add_lot_item(self, lot_id: int, data: SupplyLotItemCreate) -> dict:
        """Add an item to a supply lot (sync)."""
        lot = self.db.query(SupplyLot).filter(SupplyLot.lot_id == lot_id).first()
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

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
        return self._item_to_dict(item)

    def _sync_update_lot_item(self, item_id: int, data: SupplyLotItemUpdate) -> dict:
        """Update a supply lot item (sync)."""
        item = self.db.query(SupplyLotItem).filter(SupplyLotItem.sli_id == item_id).first()
        if not item:
            raise LandedCostServiceError(f"Lot item with ID {item_id} not found")

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

        # Recalculate total
        item.sli_total_price = item.sli_quantity * item.sli_unit_price
        item.sli_updated_at = datetime.utcnow()
        self.db.flush()
        self.db.refresh(item)
        return self._item_to_dict(item)

    def _sync_delete_lot_item(self, item_id: int) -> None:
        """Delete a supply lot item (sync)."""
        item = self.db.query(SupplyLotItem).filter(SupplyLotItem.sli_id == item_id).first()
        if not item:
            raise LandedCostServiceError(f"Lot item with ID {item_id} not found")
        self.db.delete(item)
        self.db.flush()

    # =========================================================================
    # Freight Cost CRUD (sync implementations)
    # =========================================================================

    def _sync_add_freight_cost(
        self,
        data: FreightCostCreate,
        created_by: Optional[int] = None
    ) -> dict:
        """Add a freight cost to a supply lot (sync)."""
        lot_id = data.frc_lot_id or data.supply_lot_id
        if not lot_id:
            raise LandedCostServiceError("Supply lot ID is required")

        lot = self.db.query(SupplyLot).filter(SupplyLot.lot_id == lot_id).first()
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

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
        return self._freight_cost_to_dict(cost)

    def _sync_update_freight_cost(self, cost_id: int, data: FreightCostUpdate) -> dict:
        """Update a freight cost (sync)."""
        cost = self.db.query(FreightCost).filter(FreightCost.frc_id == cost_id).first()
        if not cost:
            raise LandedCostServiceError(f"Freight cost with ID {cost_id} not found")

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
        return self._freight_cost_to_dict(cost)

    def _sync_delete_freight_cost(self, cost_id: int) -> None:
        """Delete a freight cost (sync)."""
        cost = self.db.query(FreightCost).filter(FreightCost.frc_id == cost_id).first()
        if not cost:
            raise LandedCostServiceError(f"Freight cost with ID {cost_id} not found")
        self.db.delete(cost)
        self.db.flush()

    # =========================================================================
    # Landed Cost Calculation (sync)
    # =========================================================================

    def _sync_calculate_landed_cost(
        self,
        lot_id: int,
        strategy: AllocationStrategy,
        recalculate: bool = False,
        calculated_by: Optional[int] = None,
    ) -> dict:
        """Calculate and allocate landed costs for a supply lot (sync)."""
        lot = (
            self.db.query(SupplyLot)
            .options(
                selectinload(SupplyLot.items).selectinload(SupplyLotItem.product),
                selectinload(SupplyLot.freight_costs),
            )
            .filter(SupplyLot.lot_id == lot_id)
            .first()
        )
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

        if not lot.items:
            raise InsufficientDataError("No items in supply lot to allocate costs to")

        # Calculate cost totals from freight costs
        total_freight = Decimal("0")
        total_customs = Decimal("0")
        total_insurance = Decimal("0")
        total_local = Decimal("0")
        total_other = Decimal("0")

        for fc in lot.freight_costs:
            amount = fc.frc_amount_converted or fc.frc_amount or Decimal("0")
            cost_type = fc.frc_type
            if cost_type == ModelFreightCostType.FREIGHT.value:
                total_freight += amount
            elif cost_type == ModelFreightCostType.CUSTOMS.value:
                total_customs += amount
            elif cost_type == ModelFreightCostType.INSURANCE.value:
                total_insurance += amount
            elif cost_type == ModelFreightCostType.LOCAL.value:
                total_local += amount
            else:
                total_other += amount

        total_cost = total_freight + total_customs + total_insurance + total_local + total_other

        if total_cost <= 0:
            # Use lot-level cost totals as fallback
            total_freight = lot.lot_total_freight_cost or Decimal("0")
            total_customs = lot.lot_total_customs_cost or Decimal("0")
            total_insurance = lot.lot_total_insurance_cost or Decimal("0")
            total_local = lot.lot_total_local_cost or Decimal("0")
            total_other = lot.lot_total_other_cost or Decimal("0")
            total_cost = total_freight + total_customs + total_insurance + total_local + total_other

        if total_cost <= 0:
            raise InsufficientDataError("No costs to allocate")

        # Calculate totals for each metric
        total_weight = Decimal("0")
        total_volume = Decimal("0")
        total_value = Decimal("0")

        item_metrics = []
        for item in lot.items:
            qty = item.sli_quantity or 1
            weight = item.sli_weight_kg or Decimal("0")
            volume = item.sli_volume_cbm or Decimal("0")
            value = item.sli_total_price or (item.sli_unit_price * qty)

            total_weight += weight
            total_volume += volume
            total_value += value

            item_metrics.append({
                "item": item,
                "quantity": qty,
                "weight": weight,
                "volume": volume,
                "value": value,
            })

        # Build allocations
        allocations = []
        for metrics in item_metrics:
            item = metrics["item"]
            product = item.product

            # Calculate percentage shares
            weight_share = (
                (metrics["weight"] / total_weight * 100)
                if total_weight > 0 else Decimal("0")
            )
            volume_share = (
                (metrics["volume"] / total_volume * 100)
                if total_volume > 0 else Decimal("0")
            )
            value_share = (
                (metrics["value"] / total_value * 100)
                if total_value > 0 else Decimal("0")
            )

            # Calculate final share based on strategy
            final_share = self._calculate_final_share(
                strategy, None, weight_share, volume_share, value_share
            )

            share_decimal = final_share / 100
            allocated_freight = (total_freight * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_customs = (total_customs * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_insurance = (total_insurance * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_local_item = (total_local * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_other_item = (total_other * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            total_allocated = (
                allocated_freight + allocated_customs +
                allocated_insurance + allocated_local_item + allocated_other_item
            )

            qty = metrics["quantity"]
            unit_value = item.sli_unit_price or Decimal("0")
            landed_cost_per_unit = (
                unit_value + (total_allocated / qty if qty > 0 else Decimal("0"))
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            total_landed_cost_item = (metrics["value"] + total_allocated).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            # Persist allocation data on the lot item for downstream UI/reporting.
            item.sli_allocated_freight = allocated_freight
            item.sli_allocated_customs = allocated_customs
            item.sli_allocated_insurance = allocated_insurance
            item.sli_allocated_local = allocated_local_item
            item.sli_allocated_other = allocated_other_item
            item.sli_total_allocated_cost = total_allocated
            item.sli_landed_cost_per_unit = landed_cost_per_unit
            item.sli_total_landed_cost = total_landed_cost_item
            item.sli_updated_at = datetime.utcnow()

            product_ref = product.prd_ref if product else (item.sli_sku or "")
            product_name = product.prd_name if product else (item.sli_description or "")

            allocations.append(ProductAllocation(
                product_id=item.sli_prd_id or 0,
                product_reference=product_ref,
                product_name=product_name,
                weight_kg=metrics["weight"].quantize(Decimal("0.001")),
                volume_m3=metrics["volume"].quantize(Decimal("0.000001")),
                unit_value=unit_value,
                quantity=qty,
                weight_share_percent=weight_share.quantize(Decimal("0.01")),
                volume_share_percent=volume_share.quantize(Decimal("0.01")),
                value_share_percent=value_share.quantize(Decimal("0.01")),
                final_share_percent=final_share.quantize(Decimal("0.01")),
                allocated_freight=allocated_freight,
                allocated_customs=allocated_customs,
                allocated_insurance=allocated_insurance,
                allocated_other=allocated_local_item + allocated_other_item,
                total_allocated=total_allocated,
                landed_cost_per_unit=landed_cost_per_unit,
            ))

        # Log the allocation
        log = LandedCostAllocationLog(
            lcl_lot_id=lot_id,
            lcl_strategy=strategy.value,
            lcl_status="COMPLETED",
            lcl_total_freight=total_freight,
            lcl_total_customs=total_customs,
            lcl_total_insurance=total_insurance,
            lcl_total_local=total_local,
            lcl_total_other=total_other,
            lcl_total_allocated=total_cost,
            lcl_items_count=len(allocations),
            lcl_calculated_at=datetime.utcnow(),
            lcl_calculated_by=calculated_by,
        )
        self.db.add(log)

        # Mark lot allocation
        lot.lot_total_items = len(lot.items)
        lot.lot_total_quantity = sum(Decimal(str(i.sli_quantity or 0)) for i in lot.items)
        lot.lot_total_weight_kg = sum(Decimal(str(i.sli_weight_kg or 0)) for i in lot.items)
        lot.lot_total_volume_cbm = sum(Decimal(str(i.sli_volume_cbm or 0)) for i in lot.items)
        lot.lot_total_value = sum(Decimal(str(i.sli_total_price or 0)) for i in lot.items)
        lot.lot_total_freight_cost = total_freight
        lot.lot_total_customs_cost = total_customs
        lot.lot_total_insurance_cost = total_insurance
        lot.lot_total_local_cost = total_local
        lot.lot_total_other_cost = total_other
        lot.lot_total_landed_cost = lot.lot_total_value + total_cost
        lot.lot_allocation_strategy = strategy.value
        lot.lot_allocation_completed = True
        lot.lot_allocation_date = datetime.utcnow()
        lot.lot_updated_at = datetime.utcnow()
        self.db.flush()

        return {
            "strategy": strategy,
            "total_cost_to_allocate": total_cost,
            "allocations": allocations,
            "calculation_timestamp": datetime.utcnow(),
        }

    def _sync_get_landed_cost_breakdown(self, lot_id: int) -> dict:
        """Get detailed landed cost breakdown per SKU (sync)."""
        lot = (
            self.db.query(SupplyLot)
            .options(
                selectinload(SupplyLot.items).selectinload(SupplyLotItem.product),
                selectinload(SupplyLot.freight_costs),
            )
            .filter(SupplyLot.lot_id == lot_id)
            .first()
        )
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

        items = []
        for item in lot.items:
            product = item.product
            items.append(LandedCostBreakdownItem(
                item_id=item.sli_id,
                product_id=item.sli_prd_id or 0,
                product_reference=product.prd_ref if product else (item.sli_sku or ""),
                product_name=product.prd_name if product else (item.sli_description or ""),
                quantity=item.sli_quantity or 1,
                unit_price=item.sli_unit_price or Decimal("0"),
                total_value=item.sli_total_price or Decimal("0"),
                weight_kg=item.sli_weight_kg or Decimal("0"),
                volume_m3=item.sli_volume_cbm or Decimal("0"),
                freight_allocated=item.sli_allocated_freight,
                customs_allocated=item.sli_allocated_customs,
                insurance_allocated=item.sli_allocated_insurance,
                other_allocated=item.sli_allocated_other,
                total_allocated=item.sli_total_allocated_cost,
                landed_cost_per_unit=item.sli_landed_cost_per_unit or Decimal("0"),
                total_landed_cost=item.sli_total_landed_cost,
            ))

        return {
            "lot_id": lot.lot_id,
            "lot_reference": lot.lot_reference,
            "strategy": lot.lot_allocation_strategy or AllocationStrategy.VALUE.value,
            "total_product_value": lot.lot_total_value,
            "total_freight_cost": lot.lot_total_freight_cost,
            "total_customs_cost": lot.lot_total_customs_cost,
            "total_insurance_cost": lot.lot_total_insurance_cost,
            "total_local_cost": lot.lot_total_local_cost,
            "total_other_cost": lot.lot_total_other_cost,
            "total_landed_cost": lot.lot_total_landed_cost,
            "allocation_completed": lot.lot_allocation_completed,
            "items": items,
            "calculated_at": lot.lot_allocation_date,
        }

    def _sync_get_allocation_history(self, lot_id: int) -> List[dict]:
        """Get allocation history for a supply lot (sync)."""
        lot = self.db.query(SupplyLot).filter(SupplyLot.lot_id == lot_id).first()
        if not lot:
            raise LotNotFoundError(f"Supply lot with ID {lot_id} not found")

        logs = (
            self.db.query(LandedCostAllocationLog)
            .filter(LandedCostAllocationLog.lcl_lot_id == lot_id)
            .order_by(LandedCostAllocationLog.lcl_calculated_at.desc())
            .all()
        )

        return [
            {
                "id": log.lcl_id,
                "lot_id": log.lcl_lot_id,
                "strategy": log.lcl_strategy,
                "total_cost_allocated": log.lcl_total_allocated,
                "calculated_at": log.lcl_calculated_at or datetime.utcnow(),
                "calculated_by": log.lcl_calculated_by,
                "notes": log.lcl_error_message,
            }
            for log in logs
        ]

    # =========================================================================
    # Strategy options (sync, no DB needed)
    # =========================================================================

    def get_strategy_options(
        self,
        current_strategy: Optional[AllocationStrategy] = None,
        current_weights: Optional[MixedStrategyWeights] = None
    ) -> LandedCostStrategyResponse:
        """Get available strategy options with current selection."""
        return LandedCostStrategyResponse(
            strategy=current_strategy or AllocationStrategy.VALUE,
            mixed_weights=current_weights,
            strategy_options=self.STRATEGY_OPTIONS
        )

    def calculate_landed_costs(
        self,
        request: LandedCostCalculationRequest
    ) -> LandedCostCalculationResponse:
        """Calculate landed costs for products using specified strategy (standalone calculator)."""
        products = self.db.query(Product).filter(
            Product.prd_id.in_(request.product_ids or [])
        ).all()

        if not products:
            raise ValueError("No products found for calculation")

        total_weight = Decimal("0")
        total_volume = Decimal("0")
        total_value = Decimal("0")

        product_metrics = {}
        for product in products:
            qty = (request.quantities or {}).get(product.prd_id, 1)
            weight = Decimal(str(product.prd_weight or 0)) * qty

            length = Decimal(str(product.prd_length or 0)) / 100
            width = Decimal(str(product.prd_width or 0)) / 100
            height = Decimal(str(product.prd_height or 0)) / 100
            volume = length * width * height * qty

            value = Decimal(str(product.prd_purchase_price or product.prd_price or 0)) * qty

            product_metrics[product.prd_id] = {
                "product": product,
                "quantity": qty,
                "weight": weight,
                "volume": volume,
                "value": value,
            }

            total_weight += weight
            total_volume += volume
            total_value += value

        total_cost = (
            request.freight_cost +
            request.customs_cost +
            request.insurance_cost +
            request.other_cost
        )

        allocations = []
        for product_id, metrics in product_metrics.items():
            product = metrics["product"]

            weight_share = (
                (metrics["weight"] / total_weight * 100)
                if total_weight > 0 else Decimal("0")
            )
            volume_share = (
                (metrics["volume"] / total_volume * 100)
                if total_volume > 0 else Decimal("0")
            )
            value_share = (
                (metrics["value"] / total_value * 100)
                if total_value > 0 else Decimal("0")
            )

            final_share = self._calculate_final_share(
                request.strategy, request.mixed_weights,
                weight_share, volume_share, value_share
            )

            share_decimal = final_share / 100
            allocated_freight = (request.freight_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_customs = (request.customs_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_insurance = (request.insurance_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_other = (request.other_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            total_allocated = (
                allocated_freight + allocated_customs +
                allocated_insurance + allocated_other
            )

            qty = metrics["quantity"]
            unit_value = Decimal(str(product.prd_purchase_price or product.prd_price or 0))
            landed_cost_per_unit = (
                unit_value + (total_allocated / qty if qty > 0 else Decimal("0"))
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            allocations.append(ProductAllocation(
                product_id=product.prd_id,
                product_reference=product.prd_ref,
                product_name=product.prd_name,
                weight_kg=metrics["weight"].quantize(Decimal("0.001")),
                volume_m3=metrics["volume"].quantize(Decimal("0.000001")),
                unit_value=unit_value,
                quantity=qty,
                weight_share_percent=weight_share.quantize(Decimal("0.01")),
                volume_share_percent=volume_share.quantize(Decimal("0.01")),
                value_share_percent=value_share.quantize(Decimal("0.01")),
                final_share_percent=final_share.quantize(Decimal("0.01")),
                allocated_freight=allocated_freight,
                allocated_customs=allocated_customs,
                allocated_insurance=allocated_insurance,
                allocated_other=allocated_other,
                total_allocated=total_allocated,
                landed_cost_per_unit=landed_cost_per_unit,
            ))

        return LandedCostCalculationResponse(
            strategy=request.strategy,
            total_cost_to_allocate=total_cost,
            allocations=allocations,
            calculation_timestamp=datetime.utcnow()
        )

    # =========================================================================
    # Internal helper: allocation share calculation
    # =========================================================================

    def _calculate_final_share(
        self,
        strategy: AllocationStrategy,
        mixed_weights: Optional[MixedStrategyWeights],
        weight_share: Decimal,
        volume_share: Decimal,
        value_share: Decimal
    ) -> Decimal:
        """Calculate final allocation share based on strategy."""
        if strategy == AllocationStrategy.WEIGHT:
            return weight_share
        elif strategy == AllocationStrategy.VOLUME:
            return volume_share
        elif strategy == AllocationStrategy.VALUE:
            return value_share
        elif strategy == AllocationStrategy.MIXED:
            if not mixed_weights:
                return (weight_share + volume_share + value_share) / 3
            return (
                (weight_share * mixed_weights.weight_percent / 100) +
                (volume_share * mixed_weights.volume_percent / 100) +
                (value_share * mixed_weights.value_percent / 100)
            )
        return value_share

    # =========================================================================
    # Internal helpers: model -> dict serializers
    # =========================================================================

    def _lot_to_response_dict(self, lot: SupplyLot) -> dict:
        """Convert a SupplyLot to a response dict."""
        return {
            "id": lot.lot_id,
            "lot_reference": lot.lot_reference,
            "lot_date": lot.lot_ship_date or lot.lot_created_at,
            "supplier_id": lot.lot_sup_id,
            "description": lot.lot_description,
            "freight_cost": lot.lot_total_freight_cost or Decimal("0"),
            "customs_cost": lot.lot_total_customs_cost or Decimal("0"),
            "insurance_cost": lot.lot_total_insurance_cost or Decimal("0"),
            "other_cost": lot.lot_total_other_cost or Decimal("0"),
            "allocation_strategy": lot.lot_allocation_strategy,
            "created_at": lot.lot_created_at,
            "updated_at": lot.lot_updated_at,
        }

    def _lot_to_detail_dict(self, lot: SupplyLot) -> dict:
        """Convert a SupplyLot to a detail response dict."""
        base = self._lot_to_response_dict(lot)

        items = []
        if hasattr(lot, "items") and lot.items:
            items = [self._item_to_dict(item) for item in lot.items]

        freight_costs = []
        if hasattr(lot, "freight_costs") and lot.freight_costs:
            freight_costs = [self._freight_cost_to_dict(fc) for fc in lot.freight_costs]

        base.update({
            "items": items,
            "freight_costs": freight_costs,
            "total_product_value": lot.lot_total_value or Decimal("0"),
            "total_weight_kg": lot.lot_total_weight_kg or Decimal("0"),
            "total_volume_m3": lot.lot_total_volume_cbm or Decimal("0"),
            "allocation_completed": lot.lot_allocation_completed or False,
            "status": lot.lot_status,
        })
        return base

    def _item_to_dict(self, item: SupplyLotItem) -> dict:
        """Convert a SupplyLotItem to a response dict."""
        return {
            "id": item.sli_id,
            "supply_lot_id": item.sli_lot_id,
            "product_id": item.sli_prd_id,
            "product_instance_id": item.sli_pit_id,
            "quantity": item.sli_quantity,
            "unit_price": item.sli_unit_price,
            "weight_kg": item.sli_weight_kg,
            "volume_m3": item.sli_volume_cbm,
            "allocated_cost": item.sli_total_allocated_cost,
            "landed_cost_per_unit": item.sli_landed_cost_per_unit,
        }

    def _freight_cost_to_dict(self, cost: FreightCost) -> dict:
        """Convert a FreightCost to a response dict."""
        return {
            "id": cost.frc_id,
            "supply_lot_id": cost.frc_lot_id,
            "cost_type": cost.frc_type,
            "description": cost.frc_description,
            "amount": cost.frc_amount,
            "currency": "EUR",
            "created_at": cost.frc_created_at,
            "frc_lot_id": cost.frc_lot_id,
        }

    # =========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # =========================================================================

    async def create_supply_lot(
        self, data: SupplyLotCreate, created_by: Optional[int] = None
    ) -> dict:
        """Create a new supply lot (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_supply_lot, data, created_by)

    async def get_supply_lot(self, lot_id: int) -> dict:
        """Get supply lot details (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_supply_lot, lot_id)

    async def search_supply_lots(self, params: SupplyLotSearchParams) -> dict:
        """Search supply lots (async wrapper)."""
        return await asyncio.to_thread(self._sync_search_supply_lots, params)

    async def update_supply_lot(self, lot_id: int, data: SupplyLotUpdate) -> dict:
        """Update a supply lot (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_supply_lot, lot_id, data)

    async def delete_supply_lot(self, lot_id: int) -> None:
        """Delete a supply lot (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_supply_lot, lot_id)

    async def add_lot_item(self, lot_id: int, data: SupplyLotItemCreate) -> dict:
        """Add an item to a supply lot (async wrapper)."""
        return await asyncio.to_thread(self._sync_add_lot_item, lot_id, data)

    async def update_lot_item(self, item_id: int, data: SupplyLotItemUpdate) -> dict:
        """Update a lot item (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_lot_item, item_id, data)

    async def delete_lot_item(self, item_id: int) -> None:
        """Delete a lot item (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_lot_item, item_id)

    async def add_freight_cost(
        self, data: FreightCostCreate, created_by: Optional[int] = None
    ) -> dict:
        """Add a freight cost (async wrapper)."""
        return await asyncio.to_thread(self._sync_add_freight_cost, data, created_by)

    async def update_freight_cost(self, cost_id: int, data: FreightCostUpdate) -> dict:
        """Update a freight cost (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_freight_cost, cost_id, data)

    async def delete_freight_cost(self, cost_id: int) -> None:
        """Delete a freight cost (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_freight_cost, cost_id)

    async def calculate_landed_cost(
        self,
        lot_id: int,
        strategy: AllocationStrategy = AllocationStrategy.VALUE,
        recalculate: bool = False,
        calculated_by: Optional[int] = None,
    ) -> dict:
        """Calculate landed cost for a supply lot (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_calculate_landed_cost, lot_id, strategy, recalculate, calculated_by
        )

    async def get_landed_cost_breakdown(self, lot_id: int) -> dict:
        """Get landed cost breakdown (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_landed_cost_breakdown, lot_id)

    async def get_allocation_history(self, lot_id: int) -> List[dict]:
        """Get allocation history (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_allocation_history, lot_id)

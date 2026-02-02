"""
Repository for Warehouse, Stock, and Stock Movement data access operations.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.warehouse import Warehouse
from app.models.stock import Stock
from app.models.stock_movement import StockMovement, StockMovementLine
from app.models.product import Product
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseUpdate, WarehouseSearchParams,
    StockCreate, StockUpdate, StockSearchParams,
    StockMovementCreate, StockMovementUpdate, StockMovementSearchParams,
    StockMovementLineCreate, StockMovementLineUpdate,
    MovementStatus
)


class WarehouseRepository:
    """Repository for warehouse related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Warehouse Operations
    # =====================

    async def create_warehouse(self, data: WarehouseCreate) -> Warehouse:
        """Create a new warehouse."""
        warehouse = Warehouse(
            wh_code=data.wh_code,
            wh_name=data.wh_name,
            wh_address=data.wh_address,
            wh_city=data.wh_city,
            wh_country_id=data.wh_country_id,
            wh_is_default=data.wh_is_default,
            wh_is_active=data.wh_is_active
        )

        self.db.add(warehouse)
        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def get_warehouse(self, warehouse_id: int) -> Optional[Warehouse]:
        """Get a warehouse by ID."""
        result = await self.db.execute(
            select(Warehouse).where(Warehouse.wh_id == warehouse_id)
        )
        return result.scalar_one_or_none()

    async def get_warehouse_by_code(self, code: str) -> Optional[Warehouse]:
        """Get a warehouse by code."""
        result = await self.db.execute(
            select(Warehouse).where(Warehouse.wh_code == code)
        )
        return result.scalar_one_or_none()

    async def update_warehouse(
        self,
        warehouse_id: int,
        data: WarehouseUpdate
    ) -> Optional[Warehouse]:
        """Update a warehouse."""
        warehouse = await self.get_warehouse(warehouse_id)
        if not warehouse:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(warehouse, field, value)

        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def delete_warehouse(self, warehouse_id: int) -> bool:
        """Delete a warehouse."""
        warehouse = await self.get_warehouse(warehouse_id)
        if not warehouse:
            return False

        await self.db.delete(warehouse)
        await self.db.flush()
        return True

    async def search_warehouses(
        self,
        params: WarehouseSearchParams
    ) -> Tuple[List[Warehouse], int]:
        """Search warehouses with filters and pagination."""
        query = select(Warehouse)
        count_query = select(func.count(Warehouse.wh_id))

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Warehouse.wh_code.ilike(search_term),
                    Warehouse.wh_name.ilike(search_term)
                )
            )

        if params.is_active is not None:
            conditions.append(Warehouse.wh_is_active == params.is_active)
        if params.is_default is not None:
            conditions.append(Warehouse.wh_is_default == params.is_default)
        if params.city:
            conditions.append(Warehouse.wh_city.ilike(f"%{params.city}%"))
        if params.country_id:
            conditions.append(Warehouse.wh_country_id == params.country_id)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "wh_name"
        sort_column = getattr(Warehouse, sort_field, Warehouse.wh_name)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        warehouses = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return warehouses, total

    async def get_all_warehouses(
        self,
        active_only: bool = True
    ) -> List[Warehouse]:
        """Get all warehouses."""
        query = select(Warehouse).order_by(Warehouse.wh_name)
        if active_only:
            query = query.where(Warehouse.wh_is_active == True)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_default_warehouse(self) -> Optional[Warehouse]:
        """Get the default warehouse."""
        result = await self.db.execute(
            select(Warehouse).where(
                and_(
                    Warehouse.wh_is_default == True,
                    Warehouse.wh_is_active == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def count_warehouses(self, active_only: bool = False) -> int:
        """Count warehouses."""
        query = select(func.count(Warehouse.wh_id))
        if active_only:
            query = query.where(Warehouse.wh_is_active == True)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def check_code_exists(
        self,
        code: str,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if a warehouse code already exists."""
        query = select(func.count(Warehouse.wh_id)).where(
            Warehouse.wh_code == code
        )
        if exclude_id:
            query = query.where(Warehouse.wh_id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def get_warehouse_lookup(
        self,
        search: Optional[str] = None,
        active_only: bool = True,
        limit: int = 50
    ) -> List[dict]:
        """Get warehouses for dropdown/lookup."""
        query = select(
            Warehouse.wh_id,
            Warehouse.wh_code,
            Warehouse.wh_name,
            Warehouse.wh_is_default
        )

        if active_only:
            query = query.where(Warehouse.wh_is_active == True)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Warehouse.wh_code.ilike(search_term),
                    Warehouse.wh_name.ilike(search_term)
                )
            )

        query = query.order_by(Warehouse.wh_name).limit(limit)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.wh_id,
                "code": row.wh_code,
                "name": row.wh_name,
                "is_default": row.wh_is_default,
                "display_name": f"{row.wh_code} - {row.wh_name}"
            }
            for row in rows
        ]


class StockRepository:
    """Repository for stock related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_stock(self, data: StockCreate) -> Stock:
        """Create a new stock record."""
        # Calculate available quantity
        available = data.stk_quantity - data.stk_quantity_reserved

        stock = Stock(
            soc_id=data.soc_id,
            prd_id=data.prd_id,
            pit_id=data.pit_id,
            whs_id=data.whs_id,
            stk_quantity=data.stk_quantity,
            stk_quantity_reserved=data.stk_quantity_reserved,
            stk_quantity_available=available,
            stk_min_quantity=data.stk_min_quantity,
            stk_max_quantity=data.stk_max_quantity,
            stk_reorder_quantity=data.stk_reorder_quantity,
            stk_location=data.stk_location,
            stk_unit_cost=data.stk_unit_cost,
            stk_notes=data.stk_notes
        )

        # Calculate total value if unit cost provided
        if data.stk_unit_cost:
            stock.stk_total_value = data.stk_quantity * data.stk_unit_cost

        self.db.add(stock)
        await self.db.flush()
        await self.db.refresh(stock)
        return stock

    async def get_stock(self, stock_id: int) -> Optional[Stock]:
        """Get a stock record by ID with relationships."""
        result = await self.db.execute(
            select(Stock)
            .options(
                selectinload(Stock.product),
                selectinload(Stock.warehouse)
            )
            .where(Stock.stk_id == stock_id)
        )
        return result.scalar_one_or_none()

    async def get_stock_by_product_warehouse(
        self,
        prd_id: int,
        whs_id: Optional[int],
        soc_id: int,
        pit_id: Optional[int] = None
    ) -> Optional[Stock]:
        """Get stock for a specific product at a warehouse."""
        conditions = [
            Stock.prd_id == prd_id,
            Stock.soc_id == soc_id
        ]

        if whs_id is not None:
            conditions.append(Stock.whs_id == whs_id)
        else:
            conditions.append(Stock.whs_id.is_(None))

        if pit_id is not None:
            conditions.append(Stock.pit_id == pit_id)
        else:
            conditions.append(Stock.pit_id.is_(None))

        result = await self.db.execute(
            select(Stock).where(and_(*conditions))
        )
        return result.scalar_one_or_none()

    async def update_stock(
        self,
        stock_id: int,
        data: StockUpdate
    ) -> Optional[Stock]:
        """Update a stock record."""
        stock = await self.get_stock(stock_id)
        if not stock:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(stock, field, value)

        # Recalculate available and total value
        stock.stk_quantity_available = stock.stk_quantity - stock.stk_quantity_reserved
        if stock.stk_unit_cost:
            stock.stk_total_value = stock.stk_quantity * stock.stk_unit_cost

        stock.stk_d_update = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(stock)
        return stock

    async def adjust_stock_quantity(
        self,
        stock_id: int,
        adjustment: Decimal,
        reason: Optional[str] = None
    ) -> Optional[Stock]:
        """Adjust stock quantity."""
        stock = await self.get_stock(stock_id)
        if not stock:
            return None

        stock.stk_quantity += adjustment
        stock.stk_quantity_available = stock.stk_quantity - stock.stk_quantity_reserved
        stock.stk_d_last_movement = datetime.utcnow()
        stock.stk_d_update = datetime.utcnow()

        if stock.stk_unit_cost:
            stock.stk_total_value = stock.stk_quantity * stock.stk_unit_cost

        await self.db.flush()
        await self.db.refresh(stock)
        return stock

    async def reserve_stock(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> Optional[Stock]:
        """Reserve stock quantity."""
        stock = await self.get_stock(stock_id)
        if not stock:
            return None

        stock.stk_quantity_reserved += quantity
        stock.stk_quantity_available = stock.stk_quantity - stock.stk_quantity_reserved
        stock.stk_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(stock)
        return stock

    async def release_reservation(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> Optional[Stock]:
        """Release reserved stock quantity."""
        stock = await self.get_stock(stock_id)
        if not stock:
            return None

        stock.stk_quantity_reserved = max(
            Decimal("0"),
            stock.stk_quantity_reserved - quantity
        )
        stock.stk_quantity_available = stock.stk_quantity - stock.stk_quantity_reserved
        stock.stk_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(stock)
        return stock

    async def delete_stock(self, stock_id: int) -> bool:
        """Delete a stock record."""
        stock = await self.get_stock(stock_id)
        if not stock:
            return False

        await self.db.delete(stock)
        await self.db.flush()
        return True

    async def search_stock(
        self,
        params: StockSearchParams
    ) -> Tuple[List[dict], int]:
        """Search stock with filters and pagination."""
        # Build main query with joins
        query = (
            select(
                Stock,
                Product.prd_name.label("product_name"),
                Product.prd_ref.label("product_ref"),
                Warehouse.wh_name.label("warehouse_name"),
                Warehouse.wh_code.label("warehouse_code")
            )
            .outerjoin(Product, Stock.prd_id == Product.prd_id)
            .outerjoin(Warehouse, Stock.whs_id == Warehouse.wh_id)
        )

        count_query = select(func.count(Stock.stk_id))

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Product.prd_name.ilike(search_term),
                    Product.prd_ref.ilike(search_term)
                )
            )

        if params.soc_id:
            conditions.append(Stock.soc_id == params.soc_id)
        if params.whs_id:
            conditions.append(Stock.whs_id == params.whs_id)
        if params.prd_id:
            conditions.append(Stock.prd_id == params.prd_id)
        if params.is_active is not None:
            conditions.append(Stock.stk_is_active == params.is_active)

        if params.low_stock_only:
            conditions.append(
                and_(
                    Stock.stk_min_quantity.isnot(None),
                    Stock.stk_quantity_available <= Stock.stk_min_quantity
                )
            )

        if params.out_of_stock_only:
            conditions.append(Stock.stk_quantity_available <= Decimal("0"))

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "stk_id"
        if hasattr(Stock, sort_field):
            sort_column = getattr(Stock, sort_field)
        else:
            sort_column = Stock.stk_id

        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        rows = result.all()

        # Transform results
        items = []
        for row in rows:
            stock = row[0]
            items.append({
                "stk_id": stock.stk_id,
                "soc_id": stock.soc_id,
                "prd_id": stock.prd_id,
                "pit_id": stock.pit_id,
                "whs_id": stock.whs_id,
                "stk_quantity": stock.stk_quantity,
                "stk_quantity_reserved": stock.stk_quantity_reserved,
                "stk_quantity_available": stock.stk_quantity_available,
                "stk_min_quantity": stock.stk_min_quantity,
                "stk_max_quantity": stock.stk_max_quantity,
                "stk_reorder_quantity": stock.stk_reorder_quantity,
                "stk_location": stock.stk_location,
                "stk_unit_cost": stock.stk_unit_cost,
                "stk_total_value": stock.stk_total_value,
                "stk_d_last_count": stock.stk_d_last_count,
                "stk_d_last_movement": stock.stk_d_last_movement,
                "stk_d_creation": stock.stk_d_creation,
                "stk_d_update": stock.stk_d_update,
                "stk_is_active": stock.stk_is_active,
                "stk_notes": stock.stk_notes,
                "product_name": row.product_name,
                "product_ref": row.product_ref,
                "warehouse_name": row.warehouse_name,
                "warehouse_code": row.warehouse_code
            })

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return items, total

    async def get_stock_by_warehouse(
        self,
        whs_id: int,
        soc_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[Stock]:
        """Get all stock for a warehouse."""
        query = select(Stock).where(Stock.whs_id == whs_id)
        if soc_id:
            query = query.where(Stock.soc_id == soc_id)
        if active_only:
            query = query.where(Stock.stk_is_active == True)
        query = query.order_by(Stock.stk_id)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stock_by_product(
        self,
        prd_id: int,
        soc_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[Stock]:
        """Get all stock for a product."""
        query = select(Stock).where(Stock.prd_id == prd_id)
        if soc_id:
            query = query.where(Stock.soc_id == soc_id)
        if active_only:
            query = query.where(Stock.stk_is_active == True)
        query = query.order_by(Stock.whs_id)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_low_stock_items(
        self,
        soc_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Stock]:
        """Get items with low stock."""
        query = (
            select(Stock)
            .where(
                and_(
                    Stock.stk_min_quantity.isnot(None),
                    Stock.stk_quantity_available <= Stock.stk_min_quantity,
                    Stock.stk_is_active == True
                )
            )
            .order_by(Stock.stk_quantity_available.asc())
            .limit(limit)
        )

        if soc_id:
            query = query.where(Stock.soc_id == soc_id)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stock_summary(
        self,
        soc_id: Optional[int] = None,
        whs_id: Optional[int] = None
    ) -> dict:
        """Get stock level summary."""
        conditions = [Stock.stk_is_active == True]
        if soc_id:
            conditions.append(Stock.soc_id == soc_id)
        if whs_id:
            conditions.append(Stock.whs_id == whs_id)

        # Total items and quantities
        query = select(
            func.count(Stock.stk_id).label("total_items"),
            func.coalesce(func.sum(Stock.stk_quantity), Decimal("0")).label("total_quantity"),
            func.coalesce(func.sum(Stock.stk_total_value), Decimal("0")).label("total_value")
        ).where(and_(*conditions))

        result = await self.db.execute(query)
        row = result.one()

        # Low stock count
        low_stock_query = select(func.count(Stock.stk_id)).where(
            and_(
                *conditions,
                Stock.stk_min_quantity.isnot(None),
                Stock.stk_quantity_available <= Stock.stk_min_quantity
            )
        )
        low_result = await self.db.execute(low_stock_query)
        low_stock_count = low_result.scalar_one()

        # Out of stock count
        out_of_stock_query = select(func.count(Stock.stk_id)).where(
            and_(
                *conditions,
                Stock.stk_quantity_available <= Decimal("0")
            )
        )
        out_result = await self.db.execute(out_of_stock_query)
        out_of_stock_count = out_result.scalar_one()

        return {
            "total_items": row.total_items,
            "total_quantity": row.total_quantity,
            "total_value": row.total_value,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count
        }


class StockMovementRepository:
    """Repository for stock movement related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_reference(self, movement_type: str) -> str:
        """Generate a unique movement reference."""
        prefix_map = {
            "RECEIPT": "RCV",
            "SHIPMENT": "SHP",
            "TRANSFER": "TRF",
            "ADJUSTMENT": "ADJ",
            "RETURN_IN": "RTI",
            "RETURN_OUT": "RTO",
            "DAMAGE": "DMG",
            "DESTROY": "DES",
            "LOAN_OUT": "LOT",
            "LOAN_IN": "LIN"
        }
        prefix = prefix_map.get(movement_type, "STM")

        # Get the next sequence number
        result = await self.db.execute(
            select(func.count(StockMovement.stm_id))
            .where(StockMovement.stm_reference.like(f"{prefix}-%"))
        )
        count = result.scalar_one()

        return f"{prefix}-{str(count + 1).zfill(6)}"

    async def create_movement(
        self,
        data: StockMovementCreate
    ) -> StockMovement:
        """Create a new stock movement with lines."""
        reference = await self._generate_reference(data.stm_type.value)

        movement = StockMovement(
            stm_reference=reference,
            stm_type=data.stm_type.value,
            stm_status=MovementStatus.DRAFT.value,
            stm_date=data.stm_date,
            stm_description=data.stm_description,
            stm_whs_id=data.stm_whs_id,
            stm_whs_destination_id=data.stm_whs_destination_id,
            stm_cli_id=data.stm_cli_id,
            stm_sup_id=data.stm_sup_id,
            stm_external_party=data.stm_external_party,
            stm_is_loan=data.stm_is_loan,
            stm_loan_return_date=data.stm_loan_return_date,
            stm_is_return=data.stm_is_return,
            stm_return_reason=data.stm_return_reason,
            stm_source_document=data.stm_source_document,
            stm_tracking_number=data.stm_tracking_number,
            stm_carrier=data.stm_carrier,
            stm_notes=data.stm_notes,
            stm_soc_id=data.stm_soc_id
        )

        self.db.add(movement)
        await self.db.flush()

        # Create lines
        total_quantity = Decimal("0")
        total_value = Decimal("0")

        for i, line_data in enumerate(data.lines):
            line = StockMovementLine(
                sml_stm_id=movement.stm_id,
                sml_prd_id=line_data.sml_prd_id,
                sml_pit_id=line_data.sml_pit_id,
                sml_prd_ref=line_data.sml_prd_ref,
                sml_prd_name=line_data.sml_prd_name,
                sml_description=line_data.sml_description,
                sml_quantity=line_data.sml_quantity,
                sml_quantity_actual=line_data.sml_quantity_actual,
                sml_uom_id=line_data.sml_uom_id,
                sml_unit_price=line_data.sml_unit_price,
                sml_unit_cost=line_data.sml_unit_cost,
                sml_location=line_data.sml_location,
                sml_batch_number=line_data.sml_batch_number,
                sml_serial_number=line_data.sml_serial_number,
                sml_expiry_date=line_data.sml_expiry_date,
                sml_is_damaged=line_data.sml_is_damaged,
                sml_damage_notes=line_data.sml_damage_notes,
                sml_sort_order=i
            )

            # Calculate totals
            if line_data.sml_unit_price:
                line.sml_total_price = line_data.sml_quantity * line_data.sml_unit_price
            if line_data.sml_unit_cost:
                line.sml_total_cost = line_data.sml_quantity * line_data.sml_unit_cost
                total_value += line.sml_total_cost

            total_quantity += line_data.sml_quantity
            self.db.add(line)

        movement.stm_total_quantity = total_quantity
        movement.stm_total_value = total_value
        movement.stm_total_lines = len(data.lines)

        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def get_movement(self, movement_id: int) -> Optional[StockMovement]:
        """Get a stock movement by ID with lines."""
        result = await self.db.execute(
            select(StockMovement)
            .options(
                selectinload(StockMovement.lines),
                selectinload(StockMovement.warehouse),
                selectinload(StockMovement.destination_warehouse),
                selectinload(StockMovement.client)
            )
            .where(StockMovement.stm_id == movement_id)
        )
        return result.scalar_one_or_none()

    async def get_movement_by_reference(
        self,
        reference: str
    ) -> Optional[StockMovement]:
        """Get a stock movement by reference."""
        result = await self.db.execute(
            select(StockMovement)
            .options(selectinload(StockMovement.lines))
            .where(StockMovement.stm_reference == reference)
        )
        return result.scalar_one_or_none()

    async def update_movement(
        self,
        movement_id: int,
        data: StockMovementUpdate
    ) -> Optional[StockMovement]:
        """Update a stock movement."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                if field == "stm_status":
                    setattr(movement, field, value.value if hasattr(value, "value") else value)
                else:
                    setattr(movement, field, value)

        movement.stm_updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def update_movement_status(
        self,
        movement_id: int,
        status: MovementStatus,
        validated_by: Optional[int] = None
    ) -> Optional[StockMovement]:
        """Update movement status."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        movement.stm_status = status.value
        movement.stm_updated_at = datetime.utcnow()

        if status == MovementStatus.COMPLETED:
            movement.stm_is_valid = True
            movement.stm_validated_at = datetime.utcnow()
            if validated_by:
                movement.stm_validated_by = validated_by

        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def delete_movement(self, movement_id: int) -> bool:
        """Delete a stock movement and its lines."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return False

        await self.db.delete(movement)
        await self.db.flush()
        return True

    async def search_movements(
        self,
        params: StockMovementSearchParams
    ) -> Tuple[List[dict], int]:
        """Search stock movements with filters and pagination."""
        query = (
            select(
                StockMovement,
                Warehouse.wh_name.label("warehouse_name")
            )
            .outerjoin(Warehouse, StockMovement.stm_whs_id == Warehouse.wh_id)
        )

        count_query = select(func.count(StockMovement.stm_id))

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    StockMovement.stm_reference.ilike(search_term),
                    StockMovement.stm_description.ilike(search_term)
                )
            )

        if params.stm_type:
            conditions.append(StockMovement.stm_type == params.stm_type.value)
        if params.stm_status:
            conditions.append(StockMovement.stm_status == params.stm_status.value)
        if params.whs_id:
            conditions.append(StockMovement.stm_whs_id == params.whs_id)
        if params.cli_id:
            conditions.append(StockMovement.stm_cli_id == params.cli_id)
        if params.soc_id:
            conditions.append(StockMovement.stm_soc_id == params.soc_id)
        if params.date_from:
            conditions.append(StockMovement.stm_date >= params.date_from)
        if params.date_to:
            conditions.append(StockMovement.stm_date <= params.date_to)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "stm_date"
        if hasattr(StockMovement, sort_field):
            sort_column = getattr(StockMovement, sort_field)
        else:
            sort_column = StockMovement.stm_date

        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        rows = result.all()

        items = []
        for row in rows:
            movement = row[0]
            items.append({
                "stm_id": movement.stm_id,
                "stm_reference": movement.stm_reference,
                "stm_type": movement.stm_type,
                "stm_status": movement.stm_status,
                "stm_date": movement.stm_date,
                "stm_total_quantity": movement.stm_total_quantity,
                "stm_total_lines": movement.stm_total_lines,
                "warehouse_name": row.warehouse_name
            })

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return items, total

    async def get_movements_by_warehouse(
        self,
        whs_id: int,
        limit: int = 50
    ) -> List[StockMovement]:
        """Get recent movements for a warehouse."""
        result = await self.db.execute(
            select(StockMovement)
            .where(
                or_(
                    StockMovement.stm_whs_id == whs_id,
                    StockMovement.stm_whs_destination_id == whs_id
                )
            )
            .order_by(StockMovement.stm_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    # =====================
    # Movement Line Operations
    # =====================

    async def add_movement_line(
        self,
        movement_id: int,
        data: StockMovementLineCreate
    ) -> Optional[StockMovementLine]:
        """Add a line to an existing movement."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        line = StockMovementLine(
            sml_stm_id=movement_id,
            sml_prd_id=data.sml_prd_id,
            sml_pit_id=data.sml_pit_id,
            sml_prd_ref=data.sml_prd_ref,
            sml_prd_name=data.sml_prd_name,
            sml_description=data.sml_description,
            sml_quantity=data.sml_quantity,
            sml_quantity_actual=data.sml_quantity_actual,
            sml_uom_id=data.sml_uom_id,
            sml_unit_price=data.sml_unit_price,
            sml_unit_cost=data.sml_unit_cost,
            sml_location=data.sml_location,
            sml_batch_number=data.sml_batch_number,
            sml_serial_number=data.sml_serial_number,
            sml_expiry_date=data.sml_expiry_date,
            sml_is_damaged=data.sml_is_damaged,
            sml_damage_notes=data.sml_damage_notes,
            sml_sort_order=movement.stm_total_lines
        )

        if data.sml_unit_price:
            line.sml_total_price = data.sml_quantity * data.sml_unit_price
        if data.sml_unit_cost:
            line.sml_total_cost = data.sml_quantity * data.sml_unit_cost

        self.db.add(line)

        # Update movement totals
        movement.stm_total_quantity += data.sml_quantity
        if data.sml_unit_cost:
            movement.stm_total_value += data.sml_quantity * data.sml_unit_cost
        movement.stm_total_lines += 1
        movement.stm_updated_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def update_movement_line(
        self,
        line_id: int,
        data: StockMovementLineUpdate
    ) -> Optional[StockMovementLine]:
        """Update a movement line."""
        result = await self.db.execute(
            select(StockMovementLine)
            .where(StockMovementLine.sml_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(line, field, value)

        line.sml_updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def delete_movement_line(self, line_id: int) -> bool:
        """Delete a movement line."""
        result = await self.db.execute(
            select(StockMovementLine)
            .where(StockMovementLine.sml_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return False

        # Update parent movement totals
        movement = await self.get_movement(line.sml_stm_id)
        if movement:
            movement.stm_total_quantity -= line.sml_quantity
            if line.sml_total_cost:
                movement.stm_total_value -= line.sml_total_cost
            movement.stm_total_lines -= 1
            movement.stm_updated_at = datetime.utcnow()

        await self.db.delete(line)
        await self.db.flush()
        return True

    async def get_movement_lines(
        self,
        movement_id: int
    ) -> List[StockMovementLine]:
        """Get all lines for a movement."""
        result = await self.db.execute(
            select(StockMovementLine)
            .where(StockMovementLine.sml_stm_id == movement_id)
            .order_by(StockMovementLine.sml_sort_order)
        )
        return list(result.scalars().all())

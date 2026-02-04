"""
Warehouse Service for managing warehouses, stock levels, and stock movements.

This service provides business logic for:
- Warehouse CRUD operations
- Stock level management
- Stock movement tracking
- Inventory adjustments
"""
from typing import Optional, List
from decimal import Decimal
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.warehouse_repository import (
    WarehouseRepository,
    StockRepository,
    StockMovementRepository
)
from app.models.warehouse import Warehouse
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseUpdate, WarehouseSearchParams,
    WarehouseResponse, WarehouseDetailResponse, WarehouseListResponse, WarehouseListPaginatedResponse,
    WarehouseDropdownItem, WarehouseDropdownResponse,
    StockCreate, StockUpdate, StockSearchParams, StockAdjustment,
    StockResponse, StockListResponse, StockListPaginatedResponse, StockLevelSummary,
    StockMovementCreate, StockMovementUpdate, StockMovementSearchParams,
    StockMovementResponse, StockMovementWithLinesResponse,
    StockMovementListResponse, StockMovementListPaginatedResponse,
    StockMovementLineCreate, StockMovementLineUpdate, StockMovementLineResponse,
    MovementStatus, MovementType
)

logger = logging.getLogger(__name__)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class WarehouseServiceError(Exception):
    """Base exception for warehouse service errors."""
    pass


class WarehouseNotFoundError(WarehouseServiceError):
    """Raised when a warehouse is not found."""
    pass


class WarehouseDuplicateCodeError(WarehouseServiceError):
    """Raised when a warehouse code already exists."""
    pass


class StockNotFoundError(WarehouseServiceError):
    """Raised when a stock record is not found."""
    pass


class StockInsufficientError(WarehouseServiceError):
    """Raised when there is insufficient stock."""
    pass


class StockMovementNotFoundError(WarehouseServiceError):
    """Raised when a stock movement is not found."""
    pass


class StockMovementInvalidStatusError(WarehouseServiceError):
    """Raised when attempting an invalid status transition."""
    pass


class StockMovementLineNotFoundError(WarehouseServiceError):
    """Raised when a stock movement line is not found."""
    pass


# ==========================================================================
# Warehouse Service
# ==========================================================================

class WarehouseService:
    """
    Service for managing warehouses.

    Warehouses represent physical storage locations for inventory.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = WarehouseRepository(db)

    async def create_warehouse(self, data: WarehouseCreate) -> WarehouseResponse:
        """
        Create a new warehouse.

        Args:
            data: Warehouse creation data

        Returns:
            Created warehouse

        Raises:
            WarehouseDuplicateCodeError: If code already exists
        """
        if await self.repository.check_code_exists(data.wh_code):
            raise WarehouseDuplicateCodeError(
                f"Warehouse with code '{data.wh_code}' already exists"
            )

        warehouse = await self.repository.create_warehouse(data)
        return WarehouseResponse.model_validate(warehouse)

    async def get_warehouse(self, warehouse_id: int) -> WarehouseResponse:
        """
        Get a warehouse by ID.

        Args:
            warehouse_id: Warehouse ID

        Returns:
            Warehouse details

        Raises:
            WarehouseNotFoundError: If warehouse not found
        """
        warehouse = await self.repository.get_warehouse(warehouse_id)
        if not warehouse:
            raise WarehouseNotFoundError(f"Warehouse {warehouse_id} not found")
        return WarehouseResponse.model_validate(warehouse)

    async def get_warehouse_detail(self, warehouse_id: int) -> dict:
        """
        Get warehouse detail with camelCase field names for frontend.

        Args:
            warehouse_id: Warehouse ID

        Returns:
            Warehouse details as dict with camelCase field names

        Raises:
            WarehouseNotFoundError: If warehouse not found
        """
        warehouse = await self.repository.get_warehouse(warehouse_id)
        if not warehouse:
            raise WarehouseNotFoundError(f"Warehouse {warehouse_id} not found")
        return WarehouseDetailResponse.model_validate(warehouse).model_dump()

    async def get_warehouse_by_code(self, code: str) -> WarehouseResponse:
        """
        Get a warehouse by code.

        Args:
            code: Warehouse code

        Returns:
            Warehouse details

        Raises:
            WarehouseNotFoundError: If warehouse not found
        """
        warehouse = await self.repository.get_warehouse_by_code(code)
        if not warehouse:
            raise WarehouseNotFoundError(f"Warehouse with code '{code}' not found")
        return WarehouseResponse.model_validate(warehouse)

    async def update_warehouse(
        self,
        warehouse_id: int,
        data: WarehouseUpdate
    ) -> WarehouseResponse:
        """
        Update a warehouse.

        Args:
            warehouse_id: Warehouse ID
            data: Update data

        Returns:
            Updated warehouse

        Raises:
            WarehouseNotFoundError: If warehouse not found
            WarehouseDuplicateCodeError: If new code already exists
        """
        warehouse = await self.repository.get_warehouse(warehouse_id)
        if not warehouse:
            raise WarehouseNotFoundError(f"Warehouse {warehouse_id} not found")

        # Check for duplicate code if code is being updated
        if data.wh_code and data.wh_code != warehouse.wh_code:
            if await self.repository.check_code_exists(data.wh_code, exclude_id=warehouse_id):
                raise WarehouseDuplicateCodeError(
                    f"Warehouse with code '{data.wh_code}' already exists"
                )

        warehouse = await self.repository.update_warehouse(warehouse_id, data)
        return WarehouseResponse.model_validate(warehouse)

    async def delete_warehouse(self, warehouse_id: int) -> bool:
        """
        Delete a warehouse.

        Args:
            warehouse_id: Warehouse ID

        Returns:
            True if deleted

        Raises:
            WarehouseNotFoundError: If warehouse not found
        """
        deleted = await self.repository.delete_warehouse(warehouse_id)
        if not deleted:
            raise WarehouseNotFoundError(f"Warehouse {warehouse_id} not found")
        return True

    async def search_warehouses(
        self,
        params: WarehouseSearchParams
    ) -> WarehouseListPaginatedResponse:
        """
        Search warehouses with filters and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of warehouses
        """
        warehouses, total = await self.repository.search_warehouses(params)

        items = [
            WarehouseResponse.model_validate(wh) for wh in warehouses
        ]

        return WarehouseListPaginatedResponse(
            items=items,
            total=total,
            skip=params.skip,
            limit=params.limit
        )

    async def get_all_warehouses(
        self,
        active_only: bool = True
    ) -> List[WarehouseListResponse]:
        """
        Get all warehouses.

        Args:
            active_only: Only return active warehouses

        Returns:
            List of warehouses
        """
        warehouses = await self.repository.get_all_warehouses(active_only)
        return [WarehouseListResponse.model_validate(wh) for wh in warehouses]

    async def get_default_warehouse(self) -> Optional[WarehouseResponse]:
        """
        Get the default warehouse.

        Returns:
            Default warehouse or None
        """
        warehouse = await self.repository.get_default_warehouse()
        if warehouse:
            return WarehouseResponse.model_validate(warehouse)
        return None

    async def get_warehouse_lookup(
        self,
        search: Optional[str] = None,
        active_only: bool = True,
        limit: int = 50
    ) -> WarehouseDropdownResponse:
        """
        Get warehouses for dropdown/lookup.

        Args:
            search: Optional search term
            active_only: Only return active warehouses
            limit: Max results

        Returns:
            Dropdown response with items
        """
        items = await self.repository.get_warehouse_lookup(search, active_only, limit)
        default_warehouse = await self.repository.get_default_warehouse()

        dropdown_items = [
            WarehouseDropdownItem(
                wh_id=item["id"],
                wh_code=item["code"],
                wh_name=item["name"],
                wh_is_default=item["is_default"]
            )
            for item in items
        ]

        return WarehouseDropdownResponse(
            items=dropdown_items,
            default_warehouse_id=default_warehouse.wh_id if default_warehouse else None
        )

    async def count_warehouses(self, active_only: bool = False) -> int:
        """
        Count warehouses.

        Args:
            active_only: Only count active warehouses

        Returns:
            Warehouse count
        """
        return await self.repository.count_warehouses(active_only)


# ==========================================================================
# Stock Service
# ==========================================================================

class StockService:
    """
    Service for managing stock levels.

    Tracks inventory quantities at warehouse locations.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StockRepository(db)

    async def create_stock(self, data: StockCreate) -> StockResponse:
        """
        Create a new stock record.

        Args:
            data: Stock creation data

        Returns:
            Created stock record
        """
        stock = await self.repository.create_stock(data)
        return await self._stock_to_response(stock)

    async def get_stock(self, stock_id: int) -> StockResponse:
        """
        Get a stock record by ID.

        Args:
            stock_id: Stock ID

        Returns:
            Stock details

        Raises:
            StockNotFoundError: If stock not found
        """
        stock = await self.repository.get_stock(stock_id)
        if not stock:
            raise StockNotFoundError(f"Stock {stock_id} not found")
        return await self._stock_to_response(stock)

    async def get_stock_by_product(
        self,
        prd_id: int,
        whs_id: Optional[int],
        soc_id: int,
        pit_id: Optional[int] = None
    ) -> Optional[StockResponse]:
        """
        Get stock for a product at a warehouse.

        Args:
            prd_id: Product ID
            whs_id: Warehouse ID (None for unassigned)
            soc_id: Society ID
            pit_id: Product instance ID (optional)

        Returns:
            Stock record or None
        """
        stock = await self.repository.get_stock_by_product_warehouse(
            prd_id, whs_id, soc_id, pit_id
        )
        if stock:
            return await self._stock_to_response(stock)
        return None

    async def update_stock(
        self,
        stock_id: int,
        data: StockUpdate
    ) -> StockResponse:
        """
        Update a stock record.

        Args:
            stock_id: Stock ID
            data: Update data

        Returns:
            Updated stock record

        Raises:
            StockNotFoundError: If stock not found
        """
        stock = await self.repository.update_stock(stock_id, data)
        if not stock:
            raise StockNotFoundError(f"Stock {stock_id} not found")
        return await self._stock_to_response(stock)

    async def adjust_stock(
        self,
        adjustment: StockAdjustment
    ) -> StockResponse:
        """
        Adjust stock quantity.

        Args:
            adjustment: Adjustment data

        Returns:
            Updated stock record

        Raises:
            StockNotFoundError: If stock not found
            StockInsufficientError: If insufficient stock for negative adjustment
        """
        stock = await self.repository.get_stock(adjustment.stk_id)
        if not stock:
            raise StockNotFoundError(f"Stock {adjustment.stk_id} not found")

        # Check for sufficient stock on negative adjustment
        if adjustment.adjustment_quantity < 0:
            current_qty = stock.inv_quantity or Decimal("0")
            new_quantity = current_qty + adjustment.adjustment_quantity
            if new_quantity < 0:
                raise StockInsufficientError(
                    f"Insufficient stock. Available: {current_qty}, "
                    f"Adjustment: {adjustment.adjustment_quantity}"
                )

        stock = await self.repository.adjust_stock_quantity(
            adjustment.stk_id,
            adjustment.adjustment_quantity,
            adjustment.reason
        )
        return await self._stock_to_response(stock)

    async def reserve_stock(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> StockResponse:
        """
        Reserve stock quantity.

        Args:
            stock_id: Stock ID
            quantity: Quantity to reserve

        Returns:
            Updated stock record

        Raises:
            StockNotFoundError: If stock not found
            StockInsufficientError: If insufficient available stock
        """
        stock = await self.repository.get_stock(stock_id)
        if not stock:
            raise StockNotFoundError(f"Stock {stock_id} not found")

        reserved = self._get_reserved_quantity(stock)
        available = (stock.inv_quantity or Decimal("0")) - reserved
        if available < quantity:
            raise StockInsufficientError(
                f"Insufficient available stock. Available: {available}, "
                f"Requested: {quantity}"
            )

        stock = await self.repository.reserve_stock(stock_id, quantity)
        return await self._stock_to_response(stock)

    async def release_reservation(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> StockResponse:
        """
        Release reserved stock quantity.

        Args:
            stock_id: Stock ID
            quantity: Quantity to release

        Returns:
            Updated stock record

        Raises:
            StockNotFoundError: If stock not found
        """
        stock = await self.repository.release_reservation(stock_id, quantity)
        if not stock:
            raise StockNotFoundError(f"Stock {stock_id} not found")
        return await self._stock_to_response(stock)

    async def delete_stock(self, stock_id: int) -> bool:
        """
        Delete a stock record.

        Args:
            stock_id: Stock ID

        Returns:
            True if deleted

        Raises:
            StockNotFoundError: If stock not found
        """
        deleted = await self.repository.delete_stock(stock_id)
        if not deleted:
            raise StockNotFoundError(f"Stock {stock_id} not found")
        return True

    async def search_stock(
        self,
        params: StockSearchParams
    ) -> StockListPaginatedResponse:
        """
        Search stock with filters and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of stock items
        """
        items, total = await self.repository.search_stock(params)

        response_items = [
            StockListResponse(
                stk_id=item["stk_id"],
                prd_id=item["prd_id"],
                whs_id=item["whs_id"],
                stk_quantity=item["stk_quantity"],
                stk_quantity_available=item["stk_quantity_available"],
                stk_quantity_reserved=item["stk_quantity_reserved"],
                stk_is_active=item["stk_is_active"],
                product_name=item["product_name"],
                product_ref=item["product_ref"],
                warehouse_name=item["warehouse_name"]
            )
            for item in items
        ]

        return StockListPaginatedResponse(
            items=response_items,
            total=total,
            skip=params.skip,
            limit=params.limit
        )

    async def get_stock_by_warehouse(
        self,
        whs_id: int,
        soc_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[StockResponse]:
        """
        Get all stock for a warehouse.

        Args:
            whs_id: Warehouse ID
            soc_id: Optional society filter
            active_only: Only return active stock

        Returns:
            List of stock records
        """
        stocks = await self.repository.get_stock_by_warehouse(whs_id, soc_id, active_only)
        return [await self._stock_to_response(s) for s in stocks]

    async def get_low_stock_items(
        self,
        soc_id: Optional[int] = None,
        limit: int = 50
    ) -> List[StockResponse]:
        """
        Get items with low stock.

        Args:
            soc_id: Optional society filter
            limit: Max results

        Returns:
            List of low stock items
        """
        stocks = await self.repository.get_low_stock_items(soc_id, limit)
        return [await self._stock_to_response(s) for s in stocks]

    async def get_stock_summary(
        self,
        soc_id: Optional[int] = None,
        whs_id: Optional[int] = None
    ) -> StockLevelSummary:
        """
        Get stock level summary.

        Args:
            soc_id: Optional society filter
            whs_id: Optional warehouse filter

        Returns:
            Stock summary
        """
        summary = await self.repository.get_stock_summary(soc_id, whs_id)
        return StockLevelSummary(
            total_items=summary["total_items"],
            total_quantity=summary["total_quantity"],
            total_value=summary["total_value"],
            low_stock_count=summary["low_stock_count"],
            out_of_stock_count=summary["out_of_stock_count"]
        )

    async def _stock_to_response(self, stock) -> StockResponse:
        """Convert stock model to response."""
        reserved = self._get_reserved_quantity(stock)
        quantity = stock.inv_quantity or Decimal("0")
        available = quantity - reserved

        warehouse_name = None
        warehouse_code = None
        whs_id = None
        location = None
        if stock.product_shelves:
            shelf_link = stock.product_shelves[0]
            whs_id = shelf_link.whs_id
            if shelf_link.warehouse:
                warehouse_name = shelf_link.warehouse.whs_name
                warehouse_code = shelf_link.warehouse.whs_code
            if shelf_link.shelf:
                location = shelf_link.shelf.she_code

        product_name = stock.prd_name
        product_ref = stock.prd_ref
        if stock.product:
            product_name = stock.product.prd_name or product_name
            product_ref = stock.product.prd_ref or product_ref

        return StockResponse(
            stk_id=stock.inv_id,
            soc_id=0,
            prd_id=stock.prd_id or 0,
            pit_id=stock.pit_id,
            whs_id=whs_id,
            stk_quantity=quantity,
            stk_quantity_reserved=reserved,
            stk_quantity_available=available,
            stk_min_quantity=None,
            stk_max_quantity=None,
            stk_reorder_quantity=None,
            stk_location=location,
            stk_unit_cost=None,
            stk_total_value=None,
            stk_d_last_count=None,
            stk_d_last_movement=None,
            stk_d_creation=stock.inv_d_update,
            stk_d_update=stock.inv_d_update,
            stk_is_active=True,
            stk_notes=stock.inv_description,
            product_name=product_name,
            product_ref=product_ref,
            warehouse_name=warehouse_name,
            warehouse_code=warehouse_code
        )

    def _get_reserved_quantity(self, stock) -> Decimal:
        reserved = Decimal("0")
        if getattr(stock, "pre_inventory", None):
            for item in stock.pre_inventory:
                if item.piv_quantity is not None:
                    reserved += Decimal(item.piv_quantity)
        return reserved


# ==========================================================================
# Stock Movement Service
# ==========================================================================

class StockMovementService:
    """
    Service for managing stock movements.

    Tracks all inventory transactions including receipts, shipments,
    transfers, and adjustments.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StockMovementRepository(db)
        self.stock_repository = StockRepository(db)

    async def create_movement(
        self,
        data: StockMovementCreate
    ) -> StockMovementWithLinesResponse:
        """
        Create a new stock movement.

        Args:
            data: Movement creation data

        Returns:
            Created movement with lines
        """
        movement = await self.repository.create_movement(data)
        return await self._movement_to_response(movement)

    async def get_movement(
        self,
        movement_id: int
    ) -> StockMovementWithLinesResponse:
        """
        Get a stock movement by ID.

        Args:
            movement_id: Movement ID

        Returns:
            Movement details with lines

        Raises:
            StockMovementNotFoundError: If movement not found
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")
        return await self._movement_to_response(movement)

    async def get_movement_by_reference(
        self,
        reference: str
    ) -> StockMovementWithLinesResponse:
        """
        Get a stock movement by reference.

        Args:
            reference: Movement reference

        Returns:
            Movement details with lines

        Raises:
            StockMovementNotFoundError: If movement not found
        """
        movement = await self.repository.get_movement_by_reference(reference)
        if not movement:
            raise StockMovementNotFoundError(
                f"Movement with reference '{reference}' not found"
            )
        return await self._movement_to_response(movement)

    async def update_movement(
        self,
        movement_id: int,
        data: StockMovementUpdate
    ) -> StockMovementWithLinesResponse:
        """
        Update a stock movement.

        Args:
            movement_id: Movement ID
            data: Update data

        Returns:
            Updated movement

        Raises:
            StockMovementNotFoundError: If movement not found
            StockMovementInvalidStatusError: If movement is completed
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        # Don't allow updates to completed movements unless just updating status
        status = self._get_movement_status(movement)
        if status == MovementStatus.COMPLETED:
            if data.stm_status is None or data.stm_status == MovementStatus.COMPLETED:
                raise StockMovementInvalidStatusError(
                    "Cannot modify a completed movement"
                )

        movement = await self.repository.update_movement(movement_id, data)
        return await self._movement_to_response(movement)

    async def complete_movement(
        self,
        movement_id: int,
        validated_by: Optional[int] = None
    ) -> StockMovementWithLinesResponse:
        """
        Complete a stock movement and update stock levels.

        Args:
            movement_id: Movement ID
            validated_by: User ID who validated

        Returns:
            Completed movement

        Raises:
            StockMovementNotFoundError: If movement not found
            StockMovementInvalidStatusError: If movement is already completed
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        status = self._get_movement_status(movement)
        if status == MovementStatus.COMPLETED:
            raise StockMovementInvalidStatusError("Movement is already completed")

        # Update status
        movement = await self.repository.update_movement_status(
            movement_id,
            MovementStatus.COMPLETED,
            validated_by
        )

        # Note: In a full implementation, you would also update stock levels here
        # based on the movement type (inbound adds, outbound subtracts, etc.)

        return await self._movement_to_response(movement)

    async def cancel_movement(
        self,
        movement_id: int
    ) -> StockMovementWithLinesResponse:
        """
        Cancel a stock movement.

        Args:
            movement_id: Movement ID

        Returns:
            Cancelled movement

        Raises:
            StockMovementNotFoundError: If movement not found
            StockMovementInvalidStatusError: If movement is completed
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        status = self._get_movement_status(movement)
        if status == MovementStatus.COMPLETED:
            raise StockMovementInvalidStatusError(
                "Cannot cancel a completed movement"
            )

        movement = await self.repository.update_movement_status(
            movement_id,
            MovementStatus.CANCELLED
        )

        return await self._movement_to_response(movement)

    async def delete_movement(self, movement_id: int) -> bool:
        """
        Delete a stock movement.

        Args:
            movement_id: Movement ID

        Returns:
            True if deleted

        Raises:
            StockMovementNotFoundError: If movement not found
            StockMovementInvalidStatusError: If movement is completed
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        status = self._get_movement_status(movement)
        if status == MovementStatus.COMPLETED:
            raise StockMovementInvalidStatusError(
                "Cannot delete a completed movement"
            )

        deleted = await self.repository.delete_movement(movement_id)
        return deleted

    async def search_movements(
        self,
        params: StockMovementSearchParams
    ) -> StockMovementListPaginatedResponse:
        """
        Search stock movements with filters and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of movements
        """
        items, total = await self.repository.search_movements(params)

        response_items = [
            StockMovementListResponse(
                stm_id=item["stm_id"],
                stm_reference=item["stm_reference"],
                stm_type=MovementType(item["stm_type"]),
                stm_status=MovementStatus(item["stm_status"]),
                stm_date=item["stm_date"],
                stm_total_quantity=item["stm_total_quantity"],
                stm_total_lines=item["stm_total_lines"],
                warehouse_name=item["warehouse_name"]
            )
            for item in items
        ]

        return StockMovementListPaginatedResponse(
            items=response_items,
            total=total,
            skip=params.skip,
            limit=params.limit
        )

    async def add_movement_line(
        self,
        movement_id: int,
        data: StockMovementLineCreate
    ) -> StockMovementLineResponse:
        """
        Add a line to a movement.

        Args:
            movement_id: Movement ID
            data: Line data

        Returns:
            Created line

        Raises:
            StockMovementNotFoundError: If movement not found
            StockMovementInvalidStatusError: If movement is completed
        """
        movement = await self.repository.get_movement(movement_id)
        if not movement:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        status = self._get_movement_status(movement)
        if status == MovementStatus.COMPLETED:
            raise StockMovementInvalidStatusError(
                "Cannot add lines to a completed movement"
            )

        line = await self.repository.add_movement_line(movement_id, data)
        if not line:
            raise StockMovementNotFoundError(f"Movement {movement_id} not found")

        return self._line_to_response(line)

    async def update_movement_line(
        self,
        line_id: int,
        data: StockMovementLineUpdate
    ) -> StockMovementLineResponse:
        """
        Update a movement line.

        Args:
            line_id: Line ID
            data: Update data

        Returns:
            Updated line

        Raises:
            StockMovementLineNotFoundError: If line not found
        """
        line = await self.repository.update_movement_line(line_id, data)
        if not line:
            raise StockMovementLineNotFoundError(f"Line {line_id} not found")

        return self._line_to_response(line)

    async def delete_movement_line(self, line_id: int) -> bool:
        """
        Delete a movement line.

        Args:
            line_id: Line ID

        Returns:
            True if deleted

        Raises:
            StockMovementLineNotFoundError: If line not found
        """
        deleted = await self.repository.delete_movement_line(line_id)
        if not deleted:
            raise StockMovementLineNotFoundError(f"Line {line_id} not found")
        return True

    def _get_movement_status(self, movement) -> MovementStatus:
        return self.repository._infer_movement_status(movement)

    def _get_movement_type(self, movement) -> MovementType:
        return self.repository._infer_movement_type(movement)

    def _get_clean_description(self, movement) -> Optional[str]:
        description, _, _ = self.repository._extract_meta(movement.srv_description)
        return description

    async def _get_warehouse_name(self, whs_id: Optional[int]) -> Optional[str]:
        if not whs_id:
            return None
        result = await self.db.execute(
            select(Warehouse.whs_name).where(Warehouse.whs_id == whs_id)
        )
        return result.scalar_one_or_none()

    def _line_to_response(self, line) -> StockMovementLineResponse:
        quantity = line.srl_quantity or Decimal("0")
        return StockMovementLineResponse(
            sml_id=line.srl_id,
            sml_stm_id=line.srv_id,
            sml_prd_id=line.prd_id,
            sml_pit_id=line.pit_id,
            sml_prd_ref=line.srl_prd_ref,
            sml_prd_name=line.srl_prd_name,
            sml_description=line.srl_description,
            sml_quantity=quantity,
            sml_quantity_actual=line.srl_quantity_real,
            sml_uom_id=None,
            sml_unit_price=line.srl_unit_price,
            sml_unit_cost=None,
            sml_location=None,
            sml_batch_number=None,
            sml_serial_number=None,
            sml_expiry_date=None,
            sml_is_damaged=False,
            sml_damage_notes=None,
            sml_total_price=line.srl_total_price,
            sml_total_cost=None,
            sml_created_at=None,
        )

    async def _movement_to_response(
        self,
        movement
    ) -> StockMovementWithLinesResponse:
        """Convert movement model to response."""
        lines = []
        if movement.lines:
            lines = [self._line_to_response(line) for line in movement.lines]

        whs_id = movement.lines[0].whs_id if movement.lines else None
        warehouse_name = await self._get_warehouse_name(whs_id)

        total_quantity = movement.srv_total_quantity
        if total_quantity is None:
            total_quantity = sum((line.srl_quantity or Decimal("0")) for line in movement.lines) if movement.lines else Decimal("0")

        total_real = movement.srv_total_real
        if total_real is None and movement.lines:
            real_sum = Decimal("0")
            has_real = False
            for line in movement.lines:
                if line.srl_quantity_real is not None:
                    real_sum += line.srl_quantity_real
                    has_real = True
            total_real = real_sum if has_real else None

        total_value = sum((line.srl_total_price or Decimal("0")) for line in movement.lines) if movement.lines else Decimal("0")

        movement_type = self._get_movement_type(movement)
        movement_status = self._get_movement_status(movement)
        description = self._get_clean_description(movement)

        return StockMovementWithLinesResponse(
            stm_id=movement.srv_id,
            stm_reference=movement.srv_code,
            stm_type=movement_type,
            stm_status=movement_status,
            stm_date=movement.srv_time,
            stm_description=description,
            stm_whs_id=whs_id,
            stm_whs_destination_id=None,
            stm_cli_id=None,
            stm_sup_id=None,
            stm_external_party=movement.srv_client,
            stm_is_loan=movement.srv_is_lend,
            stm_loan_return_date=movement.srv_d_lend_return_pre,
            stm_is_return=bool(movement.srv_is_return_client or movement.srv_is_return_supplier),
            stm_return_reason=None,
            stm_source_document=None,
            stm_tracking_number=None,
            stm_carrier=None,
            stm_notes=None,
            stm_soc_id=None,
            stm_total_quantity=total_quantity or Decimal("0"),
            stm_total_quantity_actual=total_real,
            stm_total_value=total_value or Decimal("0"),
            stm_total_lines=len(lines),
            stm_is_valid=movement.srv_valid,
            stm_validated_at=None,
            stm_created_at=movement.srv_time,
            stm_updated_at=None,
            warehouse_name=warehouse_name,
            destination_warehouse_name=None,
            client_name=movement.srv_client,
            lines=lines
        )

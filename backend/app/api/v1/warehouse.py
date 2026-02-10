"""
Warehouse API Router.

Provides REST API endpoints for:
- Warehouse CRUD operations
- Stock level management
- Stock movement tracking
"""
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path

from app.dependencies import get_async_db
from app.services.warehouse_service import (
    WarehouseService,
    StockService,
    StockMovementService,
    ShelfService,
    WarehouseServiceError,
    WarehouseNotFoundError,
    WarehouseDuplicateCodeError,
    StockNotFoundError,
    StockInsufficientError,
    StockMovementNotFoundError,
    StockMovementInvalidStatusError,
    StockMovementLineNotFoundError,
    ShelfNotFoundError,
    ShelfDuplicateCodeError,
)
from app.schemas.warehouse import (
    # Warehouse schemas
    WarehouseCreate, WarehouseUpdate, WarehouseSearchParams,
    WarehouseResponse, WarehouseDetailResponse, WarehouseListPaginatedResponse,
    WarehouseDropdownResponse, WarehouseErrorResponse,
    # Stock schemas
    StockCreate, StockUpdate, StockSearchParams, StockAdjustment,
    StockResponse, StockListPaginatedResponse, StockLevelSummary,
    # Movement schemas
    StockMovementCreate, StockMovementUpdate, StockMovementSearchParams,
    StockMovementWithLinesResponse, StockMovementListPaginatedResponse,
    StockMovementLineCreate, StockMovementLineUpdate, StockMovementLineResponse,
    MovementType, MovementStatus,
    # Shelf schemas
    ShelfCreate, ShelfUpdate, ShelfResponse,
    ShelfListPaginatedResponse, ShelfProductResponse,
)


router = APIRouter(prefix="/warehouse", tags=["Warehouse"])


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_warehouse_service(db = Depends(get_async_db)) -> WarehouseService:
    """Get warehouse service instance."""
    return WarehouseService(db)


async def get_stock_service(db = Depends(get_async_db)) -> StockService:
    """Get stock service instance."""
    return StockService(db)


async def get_movement_service(db = Depends(get_async_db)) -> StockMovementService:
    """Get stock movement service instance."""
    return StockMovementService(db)


async def get_shelf_service(db = Depends(get_async_db)) -> ShelfService:
    """Get shelf service instance."""
    return ShelfService(db)


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_warehouse_error(error: WarehouseServiceError) -> HTTPException:
    """Convert WarehouseServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "WAREHOUSE_ERROR"

    if isinstance(error, WarehouseNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "WAREHOUSE_NOT_FOUND"
    elif isinstance(error, WarehouseDuplicateCodeError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "WAREHOUSE_DUPLICATE_CODE"
    elif isinstance(error, StockNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "STOCK_NOT_FOUND"
    elif isinstance(error, StockInsufficientError):
        status_code = status.HTTP_400_BAD_REQUEST
        error_code = "STOCK_INSUFFICIENT"
    elif isinstance(error, StockMovementNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "MOVEMENT_NOT_FOUND"
    elif isinstance(error, StockMovementInvalidStatusError):
        status_code = status.HTTP_400_BAD_REQUEST
        error_code = "MOVEMENT_INVALID_STATUS"
    elif isinstance(error, StockMovementLineNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "MOVEMENT_LINE_NOT_FOUND"
    elif isinstance(error, ShelfNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "SHELF_NOT_FOUND"
    elif isinstance(error, ShelfDuplicateCodeError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "SHELF_DUPLICATE_CODE"

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(error)
            }
        }
    )


# ==========================================================================
# Warehouse CRUD Endpoints
# ==========================================================================

@router.post(
    "/warehouses",
    response_model=WarehouseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new warehouse",
    description="Create a new warehouse/storage location."
)
async def create_warehouse(
    data: WarehouseCreate,
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Create a new warehouse."""
    try:
        return await service.create_warehouse(data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/warehouses",
    response_model=WarehouseListPaginatedResponse,
    summary="Search and list warehouses",
    description="Search warehouses with optional filters and pagination."
)
async def search_warehouses(
    search: Optional[str] = Query(None, description="Search term"),
    is_active: Optional[bool] = Query(None, description="Active filter"),
    is_default: Optional[bool] = Query(None, description="Default filter"),
    city: Optional[str] = Query(None, description="City filter"),
    country_id: Optional[int] = Query(None, description="Country ID filter"),
    skip: int = Query(0, ge=0, description="Items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max items"),
    sort_by: str = Query("wh_name", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Search and list warehouses with pagination."""
    params = WarehouseSearchParams(
        search=search,
        is_active=is_active,
        is_default=is_default,
        city=city,
        country_id=country_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_warehouses(params)


@router.get(
    "/warehouses/lookup",
    response_model=WarehouseDropdownResponse,
    summary="Get warehouses for dropdown",
    description="Get a lightweight list of warehouses for dropdown selection."
)
async def get_warehouse_lookup(
    search: Optional[str] = Query(None, description="Search term"),
    active_only: bool = Query(True, description="Active only"),
    limit: int = Query(50, ge=1, le=100, description="Max items"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Get warehouses for dropdown/lookup."""
    return await service.get_warehouse_lookup(search, active_only, limit)


@router.get(
    "/warehouses/count",
    response_model=dict,
    summary="Count warehouses",
    description="Get total count of warehouses."
)
async def count_warehouses(
    active_only: bool = Query(False, description="Count active only"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Get warehouse count."""
    count = await service.count_warehouses(active_only)
    return {"count": count}


@router.get(
    "/warehouses/default",
    response_model=Optional[WarehouseResponse],
    summary="Get default warehouse",
    description="Get the default warehouse."
)
async def get_default_warehouse(
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Get the default warehouse."""
    return await service.get_default_warehouse()


@router.get(
    "/warehouses/{warehouse_id}",
    response_model=WarehouseDetailResponse,
    summary="Get warehouse by ID",
    description="Get detailed information about a specific warehouse with camelCase field names."
)
async def get_warehouse(
    warehouse_id: int = Path(..., gt=0, description="Warehouse ID"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Get a specific warehouse by ID with camelCase field names."""
    try:
        return await service.get_warehouse_detail(warehouse_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/warehouses/by-code/{code}",
    response_model=WarehouseResponse,
    summary="Get warehouse by code",
    description="Get a warehouse by its code."
)
async def get_warehouse_by_code(
    code: str = Path(..., min_length=1, description="Warehouse code"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Get a warehouse by code."""
    try:
        return await service.get_warehouse_by_code(code)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.put(
    "/warehouses/{warehouse_id}",
    response_model=WarehouseResponse,
    summary="Update a warehouse",
    description="Update an existing warehouse's information."
)
async def update_warehouse(
    warehouse_id: int = Path(..., gt=0, description="Warehouse ID"),
    data: WarehouseUpdate = ...,
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Update an existing warehouse."""
    try:
        return await service.update_warehouse(warehouse_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.delete(
    "/warehouses/{warehouse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a warehouse",
    description="Delete a warehouse."
)
async def delete_warehouse(
    warehouse_id: int = Path(..., gt=0, description="Warehouse ID"),
    service: WarehouseService = Depends(get_warehouse_service)
):
    """Delete a warehouse."""
    try:
        await service.delete_warehouse(warehouse_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


# ==========================================================================
# Stock Level Endpoints
# ==========================================================================

@router.post(
    "/stock",
    response_model=StockResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a stock record",
    description="Create a new stock record for a product at a warehouse."
)
async def create_stock(
    data: StockCreate,
    service: StockService = Depends(get_stock_service)
):
    """Create a new stock record."""
    try:
        return await service.create_stock(data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/stock",
    response_model=StockListPaginatedResponse,
    summary="Search stock levels",
    description="Search stock with optional filters and pagination."
)
async def search_stock(
    search: Optional[str] = Query(None, description="Search term"),
    soc_id: Optional[int] = Query(None, description="Society ID"),
    whs_id: Optional[int] = Query(None, description="Warehouse ID"),
    prd_id: Optional[int] = Query(None, description="Product ID"),
    low_stock_only: bool = Query(False, description="Low stock only"),
    out_of_stock_only: bool = Query(False, description="Out of stock only"),
    is_active: Optional[bool] = Query(None, description="Active filter"),
    skip: int = Query(0, ge=0, description="Items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max items"),
    sort_by: str = Query("stk_id", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order"),
    service: StockService = Depends(get_stock_service)
):
    """Search stock with pagination."""
    params = StockSearchParams(
        search=search,
        soc_id=soc_id,
        whs_id=whs_id,
        prd_id=prd_id,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        is_active=is_active,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_stock(params)


@router.get(
    "/stock/summary",
    response_model=StockLevelSummary,
    summary="Get stock summary",
    description="Get a summary of stock levels."
)
async def get_stock_summary(
    soc_id: Optional[int] = Query(None, description="Society ID"),
    whs_id: Optional[int] = Query(None, description="Warehouse ID"),
    service: StockService = Depends(get_stock_service)
):
    """Get stock level summary."""
    return await service.get_stock_summary(soc_id, whs_id)


@router.get(
    "/stock/low-stock",
    response_model=List[StockResponse],
    summary="Get low stock items",
    description="Get items with stock below minimum threshold."
)
async def get_low_stock_items(
    soc_id: Optional[int] = Query(None, description="Society ID"),
    limit: int = Query(50, ge=1, le=100, description="Max items"),
    service: StockService = Depends(get_stock_service)
):
    """Get items with low stock."""
    return await service.get_low_stock_items(soc_id, limit)


@router.get(
    "/stock/{stock_id}",
    response_model=StockResponse,
    summary="Get stock by ID",
    description="Get detailed information about a stock record."
)
async def get_stock(
    stock_id: int = Path(..., gt=0, description="Stock ID"),
    service: StockService = Depends(get_stock_service)
):
    """Get a stock record by ID."""
    try:
        return await service.get_stock(stock_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.put(
    "/stock/{stock_id}",
    response_model=StockResponse,
    summary="Update stock",
    description="Update a stock record."
)
async def update_stock(
    stock_id: int = Path(..., gt=0, description="Stock ID"),
    data: StockUpdate = ...,
    service: StockService = Depends(get_stock_service)
):
    """Update a stock record."""
    try:
        return await service.update_stock(stock_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/stock/adjust",
    response_model=StockResponse,
    summary="Adjust stock quantity",
    description="Adjust stock quantity (positive or negative)."
)
async def adjust_stock(
    adjustment: StockAdjustment,
    service: StockService = Depends(get_stock_service)
):
    """Adjust stock quantity."""
    try:
        return await service.adjust_stock(adjustment)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/stock/{stock_id}/reserve",
    response_model=StockResponse,
    summary="Reserve stock",
    description="Reserve stock quantity for an order."
)
async def reserve_stock(
    stock_id: int = Path(..., gt=0, description="Stock ID"),
    quantity: Decimal = Query(..., gt=0, description="Quantity to reserve"),
    service: StockService = Depends(get_stock_service)
):
    """Reserve stock quantity."""
    try:
        return await service.reserve_stock(stock_id, quantity)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/stock/{stock_id}/release",
    response_model=StockResponse,
    summary="Release reservation",
    description="Release reserved stock quantity."
)
async def release_reservation(
    stock_id: int = Path(..., gt=0, description="Stock ID"),
    quantity: Decimal = Query(..., gt=0, description="Quantity to release"),
    service: StockService = Depends(get_stock_service)
):
    """Release reserved stock."""
    try:
        return await service.release_reservation(stock_id, quantity)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.delete(
    "/stock/{stock_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete stock",
    description="Delete a stock record."
)
async def delete_stock(
    stock_id: int = Path(..., gt=0, description="Stock ID"),
    service: StockService = Depends(get_stock_service)
):
    """Delete a stock record."""
    try:
        await service.delete_stock(stock_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


# ==========================================================================
# Stock Movement Endpoints
# ==========================================================================

@router.post(
    "/movements",
    response_model=StockMovementWithLinesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a stock movement",
    description="Create a new stock movement (receipt, shipment, transfer, etc.)."
)
async def create_movement(
    data: StockMovementCreate,
    service: StockMovementService = Depends(get_movement_service)
):
    """Create a new stock movement."""
    try:
        return await service.create_movement(data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/movements",
    response_model=StockMovementListPaginatedResponse,
    summary="Search stock movements",
    description="Search stock movements with optional filters and pagination."
)
async def search_movements(
    search: Optional[str] = Query(None, description="Search term"),
    stm_type: Optional[MovementType] = Query(None, description="Movement type"),
    stm_status: Optional[MovementStatus] = Query(None, description="Status"),
    whs_id: Optional[int] = Query(None, description="Warehouse ID"),
    cli_id: Optional[int] = Query(None, description="Client ID"),
    soc_id: Optional[int] = Query(None, description="Society ID"),
    date_from: Optional[datetime] = Query(None, description="Date from"),
    date_to: Optional[datetime] = Query(None, description="Date to"),
    skip: int = Query(0, ge=0, description="Items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max items"),
    sort_by: str = Query("stm_date", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Search stock movements with pagination."""
    params = StockMovementSearchParams(
        search=search,
        stm_type=stm_type,
        stm_status=stm_status,
        whs_id=whs_id,
        cli_id=cli_id,
        soc_id=soc_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_movements(params)


@router.get(
    "/movements/{movement_id}",
    response_model=StockMovementWithLinesResponse,
    summary="Get movement by ID",
    description="Get detailed information about a stock movement including lines."
)
async def get_movement(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Get a stock movement by ID."""
    try:
        return await service.get_movement(movement_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/movements/by-reference/{reference}",
    response_model=StockMovementWithLinesResponse,
    summary="Get movement by reference",
    description="Get a stock movement by its reference number."
)
async def get_movement_by_reference(
    reference: str = Path(..., min_length=1, description="Movement reference"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Get a movement by reference."""
    try:
        return await service.get_movement_by_reference(reference)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.put(
    "/movements/{movement_id}",
    response_model=StockMovementWithLinesResponse,
    summary="Update a movement",
    description="Update a stock movement."
)
async def update_movement(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    data: StockMovementUpdate = ...,
    service: StockMovementService = Depends(get_movement_service)
):
    """Update a stock movement."""
    try:
        return await service.update_movement(movement_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/movements/{movement_id}/complete",
    response_model=StockMovementWithLinesResponse,
    summary="Complete a movement",
    description="Complete a stock movement and update stock levels."
)
async def complete_movement(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    validated_by: Optional[int] = Query(None, description="Validator user ID"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Complete a stock movement."""
    try:
        return await service.complete_movement(movement_id, validated_by)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/movements/{movement_id}/cancel",
    response_model=StockMovementWithLinesResponse,
    summary="Cancel a movement",
    description="Cancel a stock movement."
)
async def cancel_movement(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Cancel a stock movement."""
    try:
        return await service.cancel_movement(movement_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.delete(
    "/movements/{movement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a movement",
    description="Delete a stock movement (only if not completed)."
)
async def delete_movement(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Delete a stock movement."""
    try:
        await service.delete_movement(movement_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


# ==========================================================================
# Movement Line Endpoints
# ==========================================================================

@router.post(
    "/movements/{movement_id}/lines",
    response_model=StockMovementLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add line to movement",
    description="Add a new line to a stock movement."
)
async def add_movement_line(
    movement_id: int = Path(..., gt=0, description="Movement ID"),
    data: StockMovementLineCreate = ...,
    service: StockMovementService = Depends(get_movement_service)
):
    """Add a line to a movement."""
    try:
        return await service.add_movement_line(movement_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.put(
    "/movements/lines/{line_id}",
    response_model=StockMovementLineResponse,
    summary="Update movement line",
    description="Update a stock movement line."
)
async def update_movement_line(
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: StockMovementLineUpdate = ...,
    service: StockMovementService = Depends(get_movement_service)
):
    """Update a movement line."""
    try:
        return await service.update_movement_line(line_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.delete(
    "/movements/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete movement line",
    description="Delete a stock movement line."
)
async def delete_movement_line(
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: StockMovementService = Depends(get_movement_service)
):
    """Delete a movement line."""
    try:
        await service.delete_movement_line(line_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


# ==========================================================================
# Shelf/Bin Endpoints
# ==========================================================================

@router.get(
    "/warehouses/{whs_id}/shelves",
    response_model=ShelfListPaginatedResponse,
    summary="List warehouse shelves",
    description="List all shelves/bins for a specific warehouse."
)
async def list_warehouse_shelves(
    whs_id: int = Path(..., gt=0, description="Warehouse ID"),
    service: ShelfService = Depends(get_shelf_service)
):
    """List all shelves for a warehouse."""
    try:
        return await service.list_shelves(whs_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.post(
    "/warehouses/{whs_id}/shelves",
    response_model=ShelfResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shelf",
    description="Create a new shelf/bin in a warehouse."
)
async def create_warehouse_shelf(
    whs_id: int = Path(..., gt=0, description="Warehouse ID"),
    data: ShelfCreate = ...,
    service: ShelfService = Depends(get_shelf_service)
):
    """Create a new shelf in a warehouse."""
    try:
        return await service.create_shelf(whs_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/shelves/{she_id}",
    response_model=ShelfResponse,
    summary="Get shelf by ID",
    description="Get detailed information about a specific shelf/bin."
)
async def get_shelf(
    she_id: int = Path(..., gt=0, description="Shelf ID"),
    service: ShelfService = Depends(get_shelf_service)
):
    """Get a specific shelf by ID."""
    try:
        return await service.get_shelf(she_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.put(
    "/shelves/{she_id}",
    response_model=ShelfResponse,
    summary="Update a shelf",
    description="Update an existing shelf/bin."
)
async def update_shelf(
    she_id: int = Path(..., gt=0, description="Shelf ID"),
    data: ShelfUpdate = ...,
    service: ShelfService = Depends(get_shelf_service)
):
    """Update an existing shelf."""
    try:
        return await service.update_shelf(she_id, data)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.delete(
    "/shelves/{she_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shelf",
    description="Delete a shelf/bin."
)
async def delete_shelf(
    she_id: int = Path(..., gt=0, description="Shelf ID"),
    service: ShelfService = Depends(get_shelf_service)
):
    """Delete a shelf."""
    try:
        await service.delete_shelf(she_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)


@router.get(
    "/shelves/{she_id}/products",
    response_model=List[ShelfProductResponse],
    summary="List products on shelf",
    description="List all products stored on a specific shelf/bin."
)
async def list_products_on_shelf(
    she_id: int = Path(..., gt=0, description="Shelf ID"),
    service: ShelfService = Depends(get_shelf_service)
):
    """List products stored on a specific shelf."""
    try:
        return await service.list_products_on_shelf(she_id)
    except WarehouseServiceError as e:
        raise handle_warehouse_error(e)

"""
Supplier Order API Router.

Provides REST API endpoints for:
- Supplier Order CRUD operations
- Order line management
- Order status management (confirm, cancel)
- Search and filtering with pagination
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.supplier_order_service import (
    SupplierOrderService,
    get_supplier_order_service,
    SupplierOrderServiceError,
    SupplierOrderNotFoundError,
    SupplierOrderLineNotFoundError,
    SupplierOrderValidationError,
    SupplierOrderStatusError
)
from app.schemas.supplier_order import (
    SupplierOrderCreate, SupplierOrderUpdate, SupplierOrderResponse,
    SupplierOrderDetailResponse, SupplierOrderListPaginatedResponse,
    SupplierOrderSearchParams,
    SupplierOrderLineCreate, SupplierOrderLineUpdate, SupplierOrderLineResponse,
    ConfirmSupplierOrderRequest, ConfirmSupplierOrderResponse,
    CancelSupplierOrderRequest, CancelSupplierOrderResponse,
    SupplierOrderAPIResponse, SupplierOrderErrorResponse
)

router = APIRouter(prefix="/supplier-orders", tags=["Supplier Orders"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_supplier_order_error(error: SupplierOrderServiceError) -> HTTPException:
    """Convert SupplierOrderServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (SupplierOrderNotFoundError, SupplierOrderLineNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, SupplierOrderValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, SupplierOrderStatusError):
        status_code = status.HTTP_409_CONFLICT

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Supplier Order CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=SupplierOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier order",
    description="""
    Create a new supplier order (purchase order) in the system.

    A unique order code will be automatically generated if not provided.
    Lines can be included in the creation request.
    """
)
async def create_supplier_order(
    data: SupplierOrderCreate,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Create a new supplier order."""
    try:
        order = await service.create_order(data)
        return order
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.get(
    "",
    response_model=SupplierOrderListPaginatedResponse,
    summary="List all supplier orders",
    description="""
    Get a paginated list of all supplier orders with optional filtering.

    Supports filtering by:
    - Text search (code, name)
    - Supplier ID
    - Society ID
    - Currency ID
    - Started status
    - Canceled status
    - Creation date range
    - Expected delivery date range
    - Total amount range
    - Creator ID
    """
)
async def list_supplier_orders(
    # Pagination (frontend style)
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    # Legacy pagination
    skip: Optional[int] = Query(None, ge=0, description="Number of records to skip (legacy)"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum records to return (legacy)"),
    # Filters
    search: Optional[str] = Query(None, max_length=100, description="Search term (code, name)"),
    supplier_id: Optional[int] = Query(None, alias="supplierId", description="Filter by supplier ID"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society ID"),
    currency_id: Optional[int] = Query(None, alias="currencyId", description="Filter by currency ID"),
    is_started: Optional[bool] = Query(None, alias="isStarted", description="Filter by started status"),
    is_canceled: Optional[bool] = Query(None, alias="isCanceled", description="Filter by canceled status"),
    date_from: Optional[datetime] = Query(None, alias="dateFrom", description="Filter by creation date from"),
    date_to: Optional[datetime] = Query(None, alias="dateTo", description="Filter by creation date to"),
    exp_delivery_from: Optional[datetime] = Query(None, alias="expDeliveryFrom", description="Filter by expected delivery from"),
    exp_delivery_to: Optional[datetime] = Query(None, alias="expDeliveryTo", description="Filter by expected delivery to"),
    min_amount: Optional[Decimal] = Query(None, alias="minAmount", ge=0, description="Filter by minimum total amount"),
    max_amount: Optional[Decimal] = Query(None, alias="maxAmount", ge=0, description="Filter by maximum total amount"),
    creator_id: Optional[int] = Query(None, alias="creatorId", description="Filter by creator ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """List all supplier orders with pagination and filtering."""
    # Convert page/pageSize to skip/limit if not using legacy params
    actual_skip = skip if skip is not None else (page - 1) * pageSize
    actual_limit = limit if limit is not None else pageSize

    search_params = SupplierOrderSearchParams(
        search=search,
        supplier_id=supplier_id,
        society_id=society_id,
        currency_id=currency_id,
        is_started=is_started,
        is_canceled=is_canceled,
        date_from=date_from,
        date_to=date_to,
        exp_delivery_from=exp_delivery_from,
        exp_delivery_to=exp_delivery_to,
        min_amount=min_amount,
        max_amount=max_amount,
        creator_id=creator_id
    )

    orders, total = await service.list_orders(
        skip=actual_skip,
        limit=actual_limit,
        search_params=search_params
    )

    # Calculate pagination info
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1

    return SupplierOrderListPaginatedResponse(
        success=True,
        data=[SupplierOrderResponse.model_validate(o) for o in orders],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )


@router.get(
    "/{order_id}",
    response_model=SupplierOrderDetailResponse,
    summary="Get supplier order by ID",
    description="Get detailed information about a specific supplier order with lines and resolved lookup names."
)
async def get_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Get a specific supplier order by ID with resolved lookup names."""
    try:
        order_detail = await service.get_order_detail(order_id)
        return order_detail
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.put(
    "/{order_id}",
    response_model=SupplierOrderResponse,
    summary="Update a supplier order",
    description="Update an existing supplier order's information."
)
async def update_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: SupplierOrderUpdate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Update an existing supplier order."""
    try:
        order = await service.update_order(order_id, data)
        return order
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier order (soft delete)",
    description="""
    Soft delete a supplier order by ID.

    This cancels the order but preserves the record for historical purposes.
    """
)
async def delete_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Soft delete (cancel) a supplier order."""
    try:
        await service.delete_order(order_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a supplier order",
    description="""
    Permanently delete a supplier order by ID.

    WARNING: This cannot be undone.
    Will also delete all related order lines.
    """
)
async def hard_delete_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Permanently delete a supplier order."""
    try:
        await service.permanent_delete_order(order_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


# ==========================================================================
# Order Line Endpoints
# ==========================================================================

@router.post(
    "/{order_id}/lines",
    response_model=SupplierOrderLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a line to a supplier order",
    description="""
    Add a new line to an existing supplier order.

    The line's pricing totals will be calculated automatically.
    The order's totals will be recalculated after adding the line.
    """
)
async def add_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: SupplierOrderLineCreate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Add a new line to a supplier order."""
    try:
        line = await service.add_line(order_id, data)
        return line
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.put(
    "/{order_id}/lines/{line_id}",
    response_model=SupplierOrderLineResponse,
    summary="Update a supplier order line",
    description="""
    Update an existing line on a supplier order.

    The line's pricing totals will be recalculated if pricing fields change.
    The order's totals will be recalculated after updating the line.
    """
)
async def update_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: SupplierOrderLineUpdate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Update an existing line on a supplier order."""
    try:
        line = await service.update_line(order_id, line_id, data)
        return line
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier order line",
    description="""
    Delete a line from a supplier order.

    The order's totals will be recalculated after deleting the line.
    """
)
async def delete_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Delete a line from a supplier order."""
    try:
        await service.delete_line(order_id, line_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


# ==========================================================================
# Order Status Endpoints
# ==========================================================================

@router.post(
    "/{order_id}/confirm",
    response_model=ConfirmSupplierOrderResponse,
    summary="Confirm a supplier order",
    description="""
    Confirm a supplier order, marking it as started.

    A confirmed order indicates it has been sent to the supplier.
    Optional notes can be added for documentation purposes.
    """
)
async def confirm_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: Optional[ConfirmSupplierOrderRequest] = None,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Confirm a supplier order."""
    try:
        notes = data.notes if data else None
        order = await service.confirm_order(order_id, notes)
        return ConfirmSupplierOrderResponse(
            success=True,
            orderId=order.sod_id,
            confirmedAt=order.sod_d_update,
            message="Order confirmed successfully"
        )
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.post(
    "/{order_id}/cancel",
    response_model=CancelSupplierOrderResponse,
    summary="Cancel a supplier order",
    description="""
    Cancel a supplier order.

    A reason for cancellation is required for documentation purposes.
    Canceled orders cannot be modified or confirmed.
    """
)
async def cancel_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: CancelSupplierOrderRequest = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Cancel a supplier order."""
    try:
        order = await service.cancel_order(order_id, data.reason)
        return CancelSupplierOrderResponse(
            success=True,
            orderId=order.sod_id,
            canceledAt=order.sod_d_update,
            reason=data.reason,
            message="Order cancelled successfully"
        )
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)

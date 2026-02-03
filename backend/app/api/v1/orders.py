"""Orders API router.

Provides REST API endpoints for:
- Order status updates with transition validation
- Order status history retrieval
- Order status workflow information
"""
import asyncio
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Body, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc

from app.database import get_db
from app.models.order import ClientOrder
from app.services.order_service import (
    OrderService,
    get_order_service,
    OrderServiceError,
    OrderNotFoundError,
    OrderStatusError,
)
from app.schemas.order import OrderDetailResponse, OrderResponse


router = APIRouter(prefix="/orders", tags=["Orders"])


# =============================================================================
# Request/Response Schemas
# =============================================================================


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    status_id: int = Field(..., ge=1, le=8, description="New status ID (1-8)")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes for the status change")


class UpdateOrderStatusResponse(BaseModel):
    """Response from updating order status."""
    success: bool = True
    order_id: int
    old_status_id: int
    old_status_name: str
    new_status_id: int
    new_status_name: str
    updated_at: Optional[datetime] = None


class StatusHistoryEntry(BaseModel):
    """A single status history entry."""
    id: int
    order_id: int
    from_status_id: Optional[int]
    from_status_name: Optional[str]
    to_status_id: int
    to_status_name: str
    changed_at: datetime
    changed_by: Optional[int] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class StatusHistoryResponse(BaseModel):
    """Response containing status history."""
    success: bool = True
    order_id: int
    history: List[StatusHistoryEntry]


class StatusTransitionInfo(BaseModel):
    """Information about a status and its allowed transitions."""
    status_id: int
    status_name: str
    allowed_transitions: List[int]
    allowed_transition_names: List[str]
    is_terminal: bool


class StatusWorkflowResponse(BaseModel):
    """Response containing status workflow information."""
    success: bool = True
    statuses: List[StatusTransitionInfo]


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: ErrorDetail


# =============================================================================
# Error Handler
# =============================================================================


def handle_order_error(error: OrderServiceError) -> HTTPException:
    """
    Map OrderService errors to HTTP responses with appropriate status codes.

    - OrderNotFoundError -> 404 Not Found
    - OrderStatusError -> 409 Conflict (invalid state transition)
    - Other OrderServiceError -> 400 Bad Request
    """
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, OrderNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, OrderStatusError):
        status_code = status.HTTP_409_CONFLICT

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details,
            },
        },
    )


# =============================================================================
# Paginated Response Schema
# =============================================================================


class OrderListPaginatedResponse(BaseModel):
    """Paginated response for order list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[OrderResponse] = Field(default_factory=list, description="List of orders")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of orders")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


# =============================================================================
# Sync Database Helper
# =============================================================================


def _sync_list_orders(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    status_id: Optional[int] = None,
    sort_by: str = "ord_created_at",
    sort_order: str = "desc"
):
    """Sync function to list orders with pagination."""
    query = select(ClientOrder)
    count_query = select(func.count(ClientOrder.ord_id))
    
    conditions = []
    
    if search:
        search_term = f"%{search}%"
        conditions.append(ClientOrder.ord_reference.ilike(search_term))
    
    if client_id:
        conditions.append(ClientOrder.ord_cli_id == client_id)
    
    if status_id:
        conditions.append(ClientOrder.ord_sta_id == status_id)
    
    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
    # Get total count
    total_result = db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply sorting
    sort_column = getattr(ClientOrder, sort_by, ClientOrder.ord_created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)
    
    result = db.execute(query)
    orders = list(result.scalars().all())
    
    return orders, total


# =============================================================================
# Endpoints
# =============================================================================


@router.get(
    "",
    response_model=OrderListPaginatedResponse,
    summary="List orders with pagination",
    description="Get a paginated list of orders with optional filters."
)
async def list_orders(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by reference"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    sort_by: str = Query("ord_created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """List orders with pagination."""
    orders, total = await asyncio.to_thread(
        _sync_list_orders, db, page, page_size, search, client_id, status_id, sort_by, sort_order
    )
    
    items = [OrderResponse.model_validate(o) for o in orders]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return OrderListPaginatedResponse(
        success=True,
        data=items,
        page=page,
        pageSize=page_size,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1
    )


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
    summary="Get order details",
    description="""
    Get detailed information about a client order by ID.

    Returns order data with resolved lookup names for:
    - Client (name, reference)
    - Society
    - Project (name, code)
    - Payment mode
    - Payment condition (name, term days)

    This endpoint uses the TM_COD_Client_Order table.
    """,
    responses={
        200: {
            "description": "Order details retrieved successfully",
            "model": OrderDetailResponse
        },
        404: {
            "description": "Order not found",
            "model": ErrorResponse
        }
    }
)
async def get_order_detail(
    order_id: int = Path(..., gt=0, description="Order ID (cod_id)"),
    db: Session = Depends(get_db),
) -> OrderDetailResponse:
    """
    Get detailed order information with resolved lookup names.

    Returns full order details from TM_COD_Client_Order with enriched
    data from related lookup tables.
    """
    service = get_order_service(db)

    try:
        order_data = await service.get_order_detail(order_id)
        return OrderDetailResponse(**order_data)
    except OrderNotFoundError as exc:
        raise handle_order_error(exc)


@router.patch(
    "/{order_id}/status",
    response_model=UpdateOrderStatusResponse,
    summary="Update order status",
    description="""
    Update the status of an order with transition validation.

    **Valid Status IDs:**
    - 1: Draft
    - 2: Pending
    - 3: Confirmed
    - 4: Processing
    - 5: Shipped
    - 6: Delivered
    - 7: Cancelled
    - 8: Refunded

    **Valid Transitions:**
    - Draft (1) -> Pending (2), Cancelled (7)
    - Pending (2) -> Confirmed (3), Cancelled (7)
    - Confirmed (3) -> Processing (4), Cancelled (7)
    - Processing (4) -> Shipped (5), Cancelled (7)
    - Shipped (5) -> Delivered (6), Refunded (8)
    - Delivered (6) -> Refunded (8)
    - Cancelled (7) -> (terminal, no transitions)
    - Refunded (8) -> (terminal, no transitions)

    Invalid transitions will return a 409 Conflict error.
    """,
    responses={
        200: {
            "description": "Status updated successfully",
            "model": UpdateOrderStatusResponse
        },
        404: {
            "description": "Order not found",
            "model": ErrorResponse
        },
        409: {
            "description": "Invalid status transition",
            "model": ErrorResponse
        },
        422: {
            "description": "Validation error",
        }
    }
)
async def update_order_status(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: UpdateOrderStatusRequest = Body(...),
    db: Session = Depends(get_db),
) -> UpdateOrderStatusResponse:
    """
    Update the status of an order.

    Validates the status transition and creates a history record.
    Returns the old and new status information.
    """
    service = get_order_service(db)

    try:
        order, old_status = await service.update_status(
            order_id,
            request.status_id,
            request.notes,
        )

        return UpdateOrderStatusResponse(
            success=True,
            order_id=order.ord_id,
            old_status_id=old_status,
            old_status_name=service._get_status_name(old_status),
            new_status_id=order.ord_sta_id,
            new_status_name=service._get_status_name(order.ord_sta_id),
            updated_at=order.ord_updated_at,
        )
    except OrderServiceError as exc:
        raise handle_order_error(exc)


@router.get(
    "/{order_id}/status/history",
    response_model=StatusHistoryResponse,
    summary="Get order status history",
    description="Retrieve the complete status change history for an order.",
    responses={
        200: {
            "description": "Status history retrieved successfully",
            "model": StatusHistoryResponse
        },
        404: {
            "description": "Order not found",
            "model": ErrorResponse
        }
    }
)
async def get_order_status_history(
    order_id: int = Path(..., gt=0, description="Order ID"),
    db: Session = Depends(get_db),
) -> StatusHistoryResponse:
    """
    Get the status change history for an order.

    Returns all status transitions with timestamps and notes.
    """
    service = get_order_service(db)

    # Verify order exists
    try:
        await service.get_order(order_id, include_lines=False)
    except OrderNotFoundError as exc:
        raise handle_order_error(exc)

    # Note: Status history table doesn't exist in the database.
    # Status changes are tracked in the internal_notes field.
    # Return empty history for now.
    return StatusHistoryResponse(
        success=True,
        order_id=order_id,
        history=[],
    )


@router.get(
    "/status/workflow",
    response_model=StatusWorkflowResponse,
    summary="Get status workflow",
    description="Get information about all statuses and their allowed transitions.",
    responses={
        200: {
            "description": "Workflow information retrieved successfully",
            "model": StatusWorkflowResponse
        }
    }
)
async def get_status_workflow() -> StatusWorkflowResponse:
    """
    Get the status workflow definition.

    Returns all statuses with their allowed transitions.
    Useful for building UI dropdowns with only valid options.
    """
    # Use a dummy service to access status names and transitions
    statuses = []

    for status_id in range(1, 9):
        status_name = OrderService.STATUS_NAMES.get(status_id, f"Unknown({status_id})")
        allowed = OrderService.ALLOWED_TRANSITIONS.get(status_id, [])
        allowed_names = [OrderService.STATUS_NAMES.get(s, f"Unknown({s})") for s in allowed]

        statuses.append(StatusTransitionInfo(
            status_id=status_id,
            status_name=status_name,
            allowed_transitions=allowed,
            allowed_transition_names=allowed_names,
            is_terminal=len(allowed) == 0,
        ))

    return StatusWorkflowResponse(
        success=True,
        statuses=statuses,
    )

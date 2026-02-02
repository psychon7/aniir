"""Orders API router.

Provides REST API endpoints for:
- Order status updates with transition validation
- Order status history retrieval
- Order status workflow information
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Path, Body, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.order_service import (
    OrderService,
    get_order_service,
    OrderServiceError,
    OrderNotFoundError,
    OrderStatusError,
)
from app.models.order import ClientOrderStatusHistory
from app.schemas.order import OrderDetailResponse


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
# Endpoints
# =============================================================================


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
    db: AsyncSession = Depends(get_db),
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
    db: AsyncSession = Depends(get_db),
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
    db: AsyncSession = Depends(get_db),
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

    # Get status history
    stmt = select(ClientOrderStatusHistory).where(
        ClientOrderStatusHistory.osh_ord_id == order_id
    ).order_by(ClientOrderStatusHistory.osh_changed_at.desc())

    result = await db.execute(stmt)
    history_records = result.scalars().all()

    history = []
    for record in history_records:
        history.append(StatusHistoryEntry(
            id=record.osh_id,
            order_id=record.osh_ord_id,
            from_status_id=record.osh_from_status_id,
            from_status_name=service._get_status_name(record.osh_from_status_id) if record.osh_from_status_id else None,
            to_status_id=record.osh_to_status_id,
            to_status_name=service._get_status_name(record.osh_to_status_id),
            changed_at=record.osh_changed_at,
            changed_by=record.osh_changed_by,
            notes=record.osh_notes,
        ))

    return StatusHistoryResponse(
        success=True,
        order_id=order_id,
        history=history,
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

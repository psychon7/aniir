"""
API endpoints for Orders management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.order_status import (
    OrderStatusUpdate,
    OrderStatusResponse,
    OrderStatusHistory,
    StatusInfo
)
from app.services.order_status_service import OrderStatusService

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.patch("/{order_id}/status", response_model=OrderStatusResponse)
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    force: bool = Query(False, description="Force status change (bypass transition rules)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update the status of an order.
    
    - **order_id**: The ID of the order to update
    - **status_update**: New status information
    - **force**: If True, bypass status transition validation (admin only)
    
    Status transitions are validated to ensure business rules are followed.
    A status change log is created for audit purposes.
    
    Returns the updated order status information including previous and new status.
    """
    service = OrderStatusService(db)
    
    # Get username from current user
    username = None
    if current_user:
        username = getattr(current_user, 'username', None) or getattr(current_user, 'email', None)
    
    return service.update_order_status(
        order_id=order_id,
        status_update=status_update,
        updated_by=username,
        force=force
    )


@router.get("/{order_id}/status/history", response_model=List[OrderStatusHistory])
async def get_order_status_history(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get the status change history for an order.
    
    - **order_id**: The ID of the order
    
    Returns a list of all status changes for the order, ordered by most recent first.
    """
    service = OrderStatusService(db)
    return service.get_status_history(order_id)


@router.get("/statuses", response_model=List[StatusInfo])
async def get_available_statuses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all available order statuses.
    
    Returns a list of all active statuses that can be applied to orders.
    """
    service = OrderStatusService(db)
    statuses = service.get_order_statuses()
    
    return [
        StatusInfo(
            id=s.Id,
            code=s.Code,
            name=s.Name,
            color_hex=s.ColorHex
        )
        for s in statuses
    ]

"""
Service for order status management.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, List
from datetime import datetime

from app.models.order import Order, OrderStatusLog
from app.models.status import Status
from app.schemas.order_status import OrderStatusUpdate, OrderStatusResponse, OrderStatusHistory


# Define valid status transitions for orders
# Key: current status code, Value: list of allowed next status codes
ORDER_STATUS_TRANSITIONS = {
    "DRAFT": ["PENDING", "CANCELLED"],
    "PENDING": ["CONFIRMED", "CANCELLED", "DRAFT"],
    "CONFIRMED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["SHIPPED", "COMPLETED", "ON_HOLD"],
    "ON_HOLD": ["IN_PROGRESS", "CANCELLED"],
    "SHIPPED": ["DELIVERED", "RETURNED"],
    "DELIVERED": ["COMPLETED", "RETURNED"],
    "COMPLETED": [],  # Terminal state
    "CANCELLED": [],  # Terminal state
    "RETURNED": ["REFUNDED"],
    "REFUNDED": [],  # Terminal state
}


class OrderStatusService:
    """Service for managing order status updates."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        """Get order by ID."""
        return self.db.query(Order).filter(Order.cp_id == order_id).first()
    
    def get_status_by_id(self, status_id: int) -> Optional[Status]:
        """Get status by ID."""
        return self.db.query(Status).filter(Status.Id == status_id).first()
    
    def get_order_statuses(self) -> List[Status]:
        """Get all valid order statuses."""
        return self.db.query(Status).filter(
            and_(
                Status.IsActive == True,
                Status.EntityType.in_(["Order", None])  # Order-specific or generic statuses
            )
        ).order_by(Status.SortOrder).all()
    
    def validate_status_transition(
        self, 
        current_status: Status, 
        new_status: Status,
        force: bool = False
    ) -> bool:
        """
        Validate if status transition is allowed.
        
        Args:
            current_status: Current order status
            new_status: Target status
            force: If True, bypass transition rules (admin only)
            
        Returns:
            True if transition is valid
            
        Raises:
            HTTPException if transition is invalid
        """
        if force:
            return True
        
        current_code = current_status.Code
        new_code = new_status.Code
        
        # Check if current status has defined transitions
        if current_code not in ORDER_STATUS_TRANSITIONS:
            # If not defined, allow any transition (flexible mode)
            return True
        
        allowed_transitions = ORDER_STATUS_TRANSITIONS.get(current_code, [])
        
        if not allowed_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order with status '{current_status.Name}' cannot be changed. It is in a terminal state."
            )
        
        if new_code not in allowed_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current_status.Name}' to '{new_status.Name}'. "
                       f"Allowed transitions: {', '.join(allowed_transitions)}"
            )
        
        return True
    
    def update_order_status(
        self,
        order_id: int,
        status_update: OrderStatusUpdate,
        updated_by: Optional[str] = None,
        force: bool = False
    ) -> OrderStatusResponse:
        """
        Update order status with validation and logging.
        
        Args:
            order_id: Order ID to update
            status_update: New status data
            updated_by: Username performing the update
            force: Bypass transition validation (admin only)
            
        Returns:
            OrderStatusResponse with update details
        """
        # Get the order
        order = self.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found"
            )
        
        # Get current status
        current_status = self.get_status_by_id(order.cp_status_id)
        if not current_status:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Current order status not found in database"
            )
        
        # Get new status
        new_status = self.get_status_by_id(status_update.status_id)
        if not new_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status with ID {status_update.status_id} not found"
            )
        
        # Check if status is active
        if not new_status.IsActive:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status '{new_status.Name}' is not active"
            )
        
        # Check if it's the same status
        if order.cp_status_id == status_update.status_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order already has this status"
            )
        
        # Validate transition
        self.validate_status_transition(current_status, new_status, force)
        
        # Store previous status info for response
        previous_status_id = order.cp_status_id
        previous_status_name = current_status.Name
        
        # Update order status
        order.cp_status_id = status_update.status_id
        order.cp_updated_at = datetime.utcnow()
        order.cp_updated_by = updated_by
        
        # Log the status change
        status_log = OrderStatusLog(
            log_order_id=order_id,
            log_from_status_id=previous_status_id,
            log_to_status_id=status_update.status_id,
            log_changed_at=datetime.utcnow(),
            log_changed_by=updated_by,
            log_notes=status_update.notes
        )
        self.db.add(status_log)
        
        # Commit changes
        try:
            self.db.commit()
            self.db.refresh(order)
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update order status: {str(e)}"
            )
        
        return OrderStatusResponse(
            id=order.cp_id,
            reference=order.cp_reference,
            previous_status_id=previous_status_id,
            previous_status_name=previous_status_name,
            new_status_id=new_status.Id,
            new_status_name=new_status.Name,
            updated_at=order.cp_updated_at,
            updated_by=updated_by
        )
    
    def get_status_history(self, order_id: int) -> List[OrderStatusHistory]:
        """
        Get status change history for an order.
        
        Args:
            order_id: Order ID
            
        Returns:
            List of status history entries
        """
        # Verify order exists
        order = self.get_order_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found"
            )
        
        logs = self.db.query(OrderStatusLog).filter(
            OrderStatusLog.log_order_id == order_id
        ).order_by(OrderStatusLog.log_changed_at.desc()).all()
        
        history = []
        for log in logs:
            from_status = self.get_status_by_id(log.log_from_status_id) if log.log_from_status_id else None
            to_status = self.get_status_by_id(log.log_to_status_id)
            
            history.append(OrderStatusHistory(
                id=log.log_id,
                order_id=log.log_order_id,
                from_status_id=log.log_from_status_id,
                from_status_name=from_status.Name if from_status else None,
                to_status_id=log.log_to_status_id,
                to_status_name=to_status.Name if to_status else "Unknown",
                changed_at=log.log_changed_at,
                changed_by=log.log_changed_by,
                notes=log.log_notes
            ))
        
        return history

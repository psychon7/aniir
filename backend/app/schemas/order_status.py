"""
Schemas for order status updates.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status_id: int = Field(..., description="New status ID")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes for status change")


class OrderStatusResponse(BaseModel):
    """Response schema after status update."""
    id: int
    reference: str
    previous_status_id: int
    previous_status_name: str
    new_status_id: int
    new_status_name: str
    updated_at: datetime
    updated_by: Optional[str] = None
    
    model_config = {"from_attributes": True}


class StatusInfo(BaseModel):
    """Status information."""
    id: int
    code: str
    name: str
    color_hex: Optional[str] = None
    
    model_config = {"from_attributes": True}


class OrderStatusHistory(BaseModel):
    """Order status change history entry."""
    id: int
    order_id: int
    from_status_id: Optional[int]
    from_status_name: Optional[str]
    to_status_id: int
    to_status_name: str
    changed_at: datetime
    changed_by: Optional[str]
    notes: Optional[str]
    
    model_config = {"from_attributes": True}

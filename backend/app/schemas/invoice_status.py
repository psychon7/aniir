"""
Invoice Status Pydantic Schemas

DTOs for invoice status calculation results.
"""

from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class InvoiceStatusResponse(BaseModel):
    """Response schema for invoice status calculation"""
    
    status_code: str = Field(..., description="Status code (PAID, PENDING, OVERDUE, etc.)")
    status_id: Optional[int] = Field(None, description="Status ID from TR_STA_Status")
    total_paid: Decimal = Field(default=Decimal("0.00"), description="Total amount paid")
    remaining_amount: Decimal = Field(default=Decimal("0.00"), description="Remaining amount to pay")
    is_overdue: bool = Field(default=False, description="Whether the invoice is overdue")
    days_overdue: int = Field(default=0, description="Number of days overdue")
    payment_percentage: Decimal = Field(default=Decimal("0.00"), description="Percentage of invoice paid")
    
    class Config:
        from_attributes = True


class InvoiceStatusUpdateRequest(BaseModel):
    """Request schema for updating invoice status"""
    
    invoice_id: int = Field(..., description="Invoice ID to update")


class BatchInvoiceStatusUpdateRequest(BaseModel):
    """Request schema for batch updating invoice statuses"""
    
    invoice_ids: Optional[list[int]] = Field(
        None, 
        description="List of invoice IDs to update. If None, updates all non-final invoices."
    )


class BatchInvoiceStatusUpdateResponse(BaseModel):
    """Response schema for batch invoice status update"""
    
    updated_count: int = Field(..., description="Number of invoices updated")
    results: dict[int, InvoiceStatusResponse] = Field(
        default_factory=dict,
        description="Map of invoice_id to status result"
    )

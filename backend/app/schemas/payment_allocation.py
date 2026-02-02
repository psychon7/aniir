"""
Pydantic schemas for payment allocation operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator


class AllocationItem(BaseModel):
    """Single allocation item - links payment to an invoice."""
    invoice_id: int = Field(..., description="ID of the invoice to allocate to")
    amount: Decimal = Field(..., gt=0, description="Amount to allocate to this invoice")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes for this allocation")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Allocation amount must be greater than zero")
        return round(v, 2)


class PaymentAllocationRequest(BaseModel):
    """Request schema for allocating a payment to invoices."""
    allocations: List[AllocationItem] = Field(
        ..., 
        min_length=1,
        description="List of invoice allocations"
    )

    @model_validator(mode="after")
    def validate_allocations(self):
        # Check for duplicate invoice IDs
        invoice_ids = [a.invoice_id for a in self.allocations]
        if len(invoice_ids) != len(set(invoice_ids)):
            raise ValueError("Duplicate invoice IDs in allocation request")
        return self


class AllocationResultItem(BaseModel):
    """Result of a single allocation."""
    invoice_id: int
    invoice_reference: str
    allocated_amount: Decimal
    invoice_balance_before: Decimal
    invoice_balance_after: Decimal
    invoice_fully_paid: bool


class PaymentAllocationResponse(BaseModel):
    """Response schema for payment allocation."""
    payment_id: int
    payment_reference: str
    total_allocated: Decimal
    remaining_unallocated: Decimal
    payment_fully_allocated: bool
    allocations: List[AllocationResultItem]
    message: str

    class Config:
        from_attributes = True


class PaymentAllocationDetail(BaseModel):
    """Detail of an existing allocation."""
    allocation_id: int
    invoice_id: int
    invoice_reference: str
    amount: Decimal
    allocated_at: datetime
    allocated_by: Optional[int]
    notes: Optional[str]

    class Config:
        from_attributes = True


class PaymentWithAllocations(BaseModel):
    """Payment with its allocations."""
    payment_id: int
    payment_reference: str
    payment_amount: Decimal
    total_allocated: Decimal
    remaining_unallocated: Decimal
    is_fully_allocated: bool
    allocations: List[PaymentAllocationDetail]

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: Optional[str] = None

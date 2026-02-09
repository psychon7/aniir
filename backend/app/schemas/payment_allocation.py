"""
Pydantic schemas for payment allocation operations.

Uses ClientInvoicePayment (TM_CPY_ClientInvoice_Payment) model.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class AllocatePaymentRequest(BaseModel):
    """Request schema for allocating a payment to an invoice."""
    invoice_id: int = Field(..., description="ID of the invoice to allocate payment to")
    amount: float = Field(..., gt=0, description="Payment amount to allocate")
    comment: Optional[str] = Field(None, max_length=400, description="Optional comment for the payment")
    payment_date: Optional[datetime] = Field(None, description="Payment date (defaults to now)")


class PaymentResponse(BaseModel):
    """Response schema for a payment record (ClientInvoicePayment)."""
    cpy_id: int = Field(..., description="Payment ID")
    cin_id: int = Field(..., description="Invoice ID")
    cpy_amount: Decimal = Field(..., description="Payment amount")
    cpy_d_create: datetime = Field(..., description="Payment creation date")
    cpy_comment: Optional[str] = Field(None, description="Payment comment")
    cpy_file: Optional[str] = Field(None, description="Attached file path")
    cpy_guid: Optional[str] = Field(None, description="External GUID reference")

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    """Response for listing payments for an invoice."""
    invoice_id: int
    payments: List[PaymentResponse]
    total_paid: float
    count: int


class UnpaidInvoiceItem(BaseModel):
    """An unpaid invoice for a client."""
    invoice_id: int
    invoice_reference: str
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    rest_to_pay: float
    total_paid: float
    is_overdue: bool


class UnpaidInvoicesResponse(BaseModel):
    """Response for client unpaid invoices."""
    client_id: int
    invoices: List[UnpaidInvoiceItem]
    total_outstanding: float
    count: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    error_code: Optional[str] = None

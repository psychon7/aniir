"""Accounting-related Pydantic schemas."""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class AgingBucket(BaseModel):
    """Represents a single aging bucket."""
    label: str = Field(..., description="Bucket label (e.g., 'Current', '1-30 days')")
    min_days: int = Field(..., description="Minimum days overdue")
    max_days: Optional[int] = Field(None, description="Maximum days overdue (None for 90+)")
    amount: Decimal = Field(default=Decimal("0.00"), description="Total amount in this bucket")
    count: int = Field(default=0, description="Number of invoices in this bucket")
    percentage: Decimal = Field(default=Decimal("0.00"), description="Percentage of total receivables")


class ClientAgingDetail(BaseModel):
    """Aging details for a single client."""
    client_id: int
    client_reference: str
    client_name: str
    current: Decimal = Field(default=Decimal("0.00"))
    days_1_30: Decimal = Field(default=Decimal("0.00"))
    days_31_60: Decimal = Field(default=Decimal("0.00"))
    days_61_90: Decimal = Field(default=Decimal("0.00"))
    days_over_90: Decimal = Field(default=Decimal("0.00"))
    total_outstanding: Decimal = Field(default=Decimal("0.00"))
    oldest_invoice_date: Optional[date] = None
    invoice_count: int = 0
    credit_limit: Optional[Decimal] = None
    credit_utilization: Optional[Decimal] = Field(None, description="Percentage of credit limit used")


class InvoiceAgingDetail(BaseModel):
    """Aging details for a single invoice."""
    invoice_id: int
    invoice_reference: str
    client_id: int
    client_name: str
    invoice_date: date
    due_date: date
    days_overdue: int
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    aging_bucket: str
    currency_code: str


class ReceivablesAgingSummary(BaseModel):
    """Summary of receivables aging."""
    as_of_date: date
    total_receivables: Decimal
    total_overdue: Decimal
    total_current: Decimal
    overdue_percentage: Decimal
    buckets: List[AgingBucket]
    average_days_outstanding: Decimal
    weighted_average_days: Decimal


class ReceivablesAgingResponse(BaseModel):
    """Complete receivables aging response."""
    summary: ReceivablesAgingSummary
    by_client: List[ClientAgingDetail]
    invoices: Optional[List[InvoiceAgingDetail]] = None
    
    class Config:
        from_attributes = True


class ReceivablesAgingFilters(BaseModel):
    """Filters for receivables aging report."""
    as_of_date: Optional[date] = Field(None, description="Report as of date (default: today)")
    society_id: Optional[int] = Field(None, description="Filter by society")
    client_id: Optional[int] = Field(None, description="Filter by specific client")
    min_amount: Optional[Decimal] = Field(None, description="Minimum outstanding amount")
    include_invoices: bool = Field(False, description="Include invoice-level details")
    currency_id: Optional[int] = Field(None, description="Filter by currency")


# =============================================================================
# Payment Allocation Schemas
# =============================================================================

class PaymentAllocationItem(BaseModel):
    """Allocation of payment to a specific invoice."""
    invoice_id: int
    amount: Decimal = Field(..., gt=0)


class AllocatePaymentRequest(BaseModel):
    """Request to allocate a payment to invoices."""
    payment_id: int
    allocations: List[PaymentAllocationItem]


class AllocatePaymentResponse(BaseModel):
    """Response for payment allocation."""
    success: bool = True
    message: str = "Payment allocated successfully"
    allocated_amount: Decimal = Decimal("0.00")
    remaining_amount: Decimal = Decimal("0.00")


# =============================================================================
# Customer Statement Schemas
# =============================================================================

class CustomerStatementRequest(BaseModel):
    """Request for customer statement."""
    client_id: int
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    include_paid: bool = False


class StatementLineItem(BaseModel):
    """Line item in customer statement."""
    date: date
    description: str
    reference: Optional[str] = None
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    balance: Decimal = Decimal("0.00")


class CustomerStatementResponse(BaseModel):
    """Response for customer statement."""
    client_id: int
    client_name: str
    client_reference: Optional[str] = None
    from_date: date
    to_date: date
    opening_balance: Decimal = Decimal("0.00")
    closing_balance: Decimal = Decimal("0.00")
    total_debits: Decimal = Decimal("0.00")
    total_credits: Decimal = Decimal("0.00")
    lines: List[StatementLineItem] = []


# =============================================================================
# Summary Schemas
# =============================================================================

class AccountingSummaryResponse(BaseModel):
    """Summary of accounting metrics."""
    total_receivables: Decimal = Decimal("0.00")
    total_payables: Decimal = Decimal("0.00")
    outstanding_invoices: int = 0
    overdue_invoices: int = 0
    pending_payments: int = 0


class UpdateInvoiceStatusesResponse(BaseModel):
    """Response for bulk invoice status update."""
    success: bool = True
    message: str = "Invoice statuses updated"
    updated_count: int = 0
    failed_count: int = 0
    errors: Optional[List[str]] = None


# =============================================================================
# API Response Wrappers
# =============================================================================

class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    message: str
    code: Optional[str] = None
    details: Optional[dict] = None

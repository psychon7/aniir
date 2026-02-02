"""
Pydantic schemas for ClientInvoice
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


# ============== Line Item Schemas ==============

class ClientInvoiceLineBase(BaseModel):
    """Base schema for invoice line items"""
    product_id: Optional[int] = None
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(default=Decimal("1.00"), ge=0)
    unit_price: Decimal = Field(..., ge=0)
    discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    vat_rate_id: Optional[int] = None


class ClientInvoiceLineCreate(ClientInvoiceLineBase):
    """Schema for creating invoice line items"""
    pass


class ClientInvoiceLineUpdate(BaseModel):
    """Schema for updating invoice line items"""
    product_id: Optional[int] = None
    description: Optional[str] = Field(default=None, max_length=500)
    quantity: Optional[Decimal] = Field(default=None, ge=0)
    unit_price: Optional[Decimal] = Field(default=None, ge=0)
    discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    vat_rate_id: Optional[int] = None


class ClientInvoiceLineResponse(ClientInvoiceLineBase):
    """Schema for invoice line item responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    invoice_id: int
    line_total: Decimal
    tax_amount: Decimal
    product_name: Optional[str] = None
    product_reference: Optional[str] = None


# ============== Invoice Schemas ==============

class ClientInvoiceBase(BaseModel):
    """Base schema for client invoices"""
    client_id: int
    society_id: int
    order_id: Optional[int] = None
    currency_id: int
    payment_term_id: Optional[int] = None
    payment_mode_id: Optional[int] = None
    invoice_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class ClientInvoiceCreate(ClientInvoiceBase):
    """Schema for creating client invoices"""
    lines: List[ClientInvoiceLineCreate] = Field(default_factory=list)
    
    # Optional: snapshot client info at creation time
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_vat_number: Optional[str] = None


class ClientInvoiceUpdate(BaseModel):
    """Schema for updating client invoices"""
    status_id: Optional[int] = None
    payment_term_id: Optional[int] = None
    payment_mode_id: Optional[int] = None
    due_date: Optional[datetime] = None
    discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Payment tracking
    amount_paid: Optional[Decimal] = Field(default=None, ge=0)
    paid_date: Optional[datetime] = None


class ClientInvoicePDFUpdate(BaseModel):
    """Schema for updating PDF-related fields"""
    pdf_url: str = Field(..., max_length=500)
    pdf_generated_at: datetime = Field(default_factory=datetime.utcnow)


class ClientInvoiceResponse(BaseModel):
    """Schema for client invoice responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reference: str
    client_id: int
    society_id: int
    order_id: Optional[int] = None
    status_id: int
    currency_id: int
    payment_term_id: Optional[int] = None
    payment_mode_id: Optional[int] = None
    
    # Dates
    invoice_date: datetime
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    
    # Amounts
    subtotal: Decimal
    discount_percent: Optional[Decimal] = None
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    
    # Client snapshot
    client_name: Optional[str] = None
    client_address: Optional[str] = None
    client_vat_number: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # PDF fields
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    has_pdf: bool = False
    
    # Computed
    is_paid: bool = False
    is_overdue: bool = False
    
    # Audit
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool = True
    
    # Nested objects (optional, loaded via relationships)
    lines: List[ClientInvoiceLineResponse] = Field(default_factory=list)
    
    # Related entity names (for display)
    client_company_name: Optional[str] = None
    society_name: Optional[str] = None
    status_name: Optional[str] = None
    status_code: Optional[str] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    payment_term_name: Optional[str] = None
    payment_mode_name: Optional[str] = None


class ClientInvoiceListResponse(BaseModel):
    """Schema for paginated invoice list"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[ClientInvoiceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientInvoiceSummary(BaseModel):
    """Summary schema for invoice lists (lighter payload)"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reference: str
    client_id: int
    client_name: Optional[str] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    total: Decimal
    balance_due: Decimal
    status_code: Optional[str] = None
    status_name: Optional[str] = None
    is_paid: bool = False
    is_overdue: bool = False
    has_pdf: bool = False
    pdf_url: Optional[str] = None

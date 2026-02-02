"""
Pydantic schemas for Quote operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field


class QuoteStatus(str, Enum):
    """Quote status options."""
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CONVERTED = "CONVERTED"
    CANCELLED = "CANCELLED"


# =====================
# QuoteLine Schemas
# =====================

class QuoteLineBase(BaseModel):
    """Base schema for QuoteLine."""
    qul_prd_id: Optional[int] = Field(None, description="Product ID")
    qul_description: str = Field(..., max_length=500, description="Line description")
    qul_quantity: Decimal = Field(..., gt=0, description="Quantity")
    qul_unit_price: Decimal = Field(..., ge=0, description="Unit price")
    qul_discount: Decimal = Field(default=Decimal("0"), ge=0, le=100, description="Discount percentage")
    qul_vat_id: int = Field(..., description="VAT rate ID")
    qul_sort_order: int = Field(default=0, description="Sort order")


class QuoteLineCreate(QuoteLineBase):
    """Schema for creating a QuoteLine."""
    pass


class QuoteLineUpdate(BaseModel):
    """Schema for updating a QuoteLine."""
    qul_prd_id: Optional[int] = None
    qul_description: Optional[str] = Field(None, max_length=500)
    qul_quantity: Optional[Decimal] = Field(None, gt=0)
    qul_unit_price: Optional[Decimal] = Field(None, ge=0)
    qul_discount: Optional[Decimal] = Field(None, ge=0, le=100)
    qul_vat_id: Optional[int] = None
    qul_sort_order: Optional[int] = None


class QuoteLineResponse(QuoteLineBase):
    """Schema for QuoteLine response."""
    model_config = ConfigDict(from_attributes=True)

    qul_id: int
    qul_quo_id: int
    qul_line_number: int
    qul_vat_amount: Decimal = Decimal("0")
    qul_line_total: Decimal = Decimal("0")

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        """Calculate subtotal before VAT."""
        base = self.qul_quantity * self.qul_unit_price
        discount_amount = base * (self.qul_discount / Decimal("100"))
        return base - discount_amount


# =====================
# Quote Schemas
# =====================

class QuoteBase(BaseModel):
    """Base schema for Quote."""
    quo_cli_id: int = Field(..., description="Client ID")
    quo_date: datetime = Field(..., description="Quote date")
    quo_valid_until: datetime = Field(..., description="Valid until date")
    quo_sta_id: int = Field(..., description="Status ID")
    quo_cur_id: int = Field(..., description="Currency ID")

    # Shipping address
    quo_shipping_address: Optional[str] = Field(None, max_length=200, description="Shipping address")
    quo_shipping_city: Optional[str] = Field(None, max_length=100, description="Shipping city")
    quo_shipping_postal_code: Optional[str] = Field(None, max_length=20, description="Shipping postal code")
    quo_shipping_country_id: Optional[int] = Field(None, description="Shipping country ID")

    # Billing address
    quo_billing_address: Optional[str] = Field(None, max_length=200, description="Billing address")
    quo_billing_city: Optional[str] = Field(None, max_length=100, description="Billing city")
    quo_billing_postal_code: Optional[str] = Field(None, max_length=20, description="Billing postal code")
    quo_billing_country_id: Optional[int] = Field(None, description="Billing country ID")

    # Discount
    quo_discount: Optional[Decimal] = Field(None, ge=0, le=100, description="Overall discount percentage")

    # Notes
    quo_notes: Optional[str] = Field(None, description="Customer-facing notes")
    quo_internal_notes: Optional[str] = Field(None, description="Internal notes")
    quo_terms_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Organization
    quo_bu_id: Optional[int] = Field(None, description="Business unit ID")
    quo_soc_id: Optional[int] = Field(None, description="Society ID")


class QuoteCreate(QuoteBase):
    """Schema for creating a Quote."""
    lines: Optional[List[QuoteLineCreate]] = Field(default=None, description="Quote lines")


class QuoteUpdate(BaseModel):
    """Schema for updating a Quote."""
    quo_cli_id: Optional[int] = None
    quo_date: Optional[datetime] = None
    quo_valid_until: Optional[datetime] = None
    quo_sta_id: Optional[int] = None
    quo_cur_id: Optional[int] = None

    # Shipping address
    quo_shipping_address: Optional[str] = Field(None, max_length=200)
    quo_shipping_city: Optional[str] = Field(None, max_length=100)
    quo_shipping_postal_code: Optional[str] = Field(None, max_length=20)
    quo_shipping_country_id: Optional[int] = None

    # Billing address
    quo_billing_address: Optional[str] = Field(None, max_length=200)
    quo_billing_city: Optional[str] = Field(None, max_length=100)
    quo_billing_postal_code: Optional[str] = Field(None, max_length=20)
    quo_billing_country_id: Optional[int] = None

    # Discount
    quo_discount: Optional[Decimal] = Field(None, ge=0, le=100)

    # Notes
    quo_notes: Optional[str] = None
    quo_internal_notes: Optional[str] = None
    quo_terms_conditions: Optional[str] = None

    # Organization
    quo_bu_id: Optional[int] = None
    quo_soc_id: Optional[int] = None


class QuoteResponse(QuoteBase):
    """Schema for Quote response."""
    model_config = ConfigDict(from_attributes=True)

    quo_id: int
    quo_reference: str

    # Totals
    quo_sub_total: Decimal = Decimal("0")
    quo_total_vat: Decimal = Decimal("0")
    quo_total_amount: Decimal = Decimal("0")

    # PDF tracking
    quo_pdf_url: Optional[str] = None
    quo_pdf_generated_at: Optional[datetime] = None

    # Conversion tracking
    quo_converted_to_order: bool = False
    quo_ord_id: Optional[int] = None
    quo_converted_at: Optional[datetime] = None

    # Audit
    quo_created_by: Optional[int] = None
    quo_created_at: datetime
    quo_updated_at: Optional[datetime] = None

    @computed_field
    @property
    def is_expired(self) -> bool:
        """Check if quote is expired."""
        return datetime.now() > self.quo_valid_until


class QuoteDetailResponse(QuoteResponse):
    """Schema for detailed Quote response with lines."""
    lines: List[QuoteLineResponse] = []

    @computed_field
    @property
    def line_count(self) -> int:
        """Get number of lines."""
        return len(self.lines)


# =====================
# Search/Filter Schemas
# =====================

class QuoteSearchParams(BaseModel):
    """Search parameters for quotes."""
    reference: Optional[str] = Field(None, description="Filter by reference (partial match)")
    client_id: Optional[int] = Field(None, description="Filter by client")
    status_id: Optional[int] = Field(None, description="Filter by status")
    date_from: Optional[datetime] = Field(None, description="Quote date from")
    date_to: Optional[datetime] = Field(None, description="Quote date to")
    valid_from: Optional[datetime] = Field(None, description="Valid until date from")
    valid_to: Optional[datetime] = Field(None, description="Valid until date to")
    converted_to_order: Optional[bool] = Field(None, description="Filter by conversion status")
    society_id: Optional[int] = Field(None, description="Filter by society")
    bu_id: Optional[int] = Field(None, description="Filter by business unit")
    min_amount: Optional[Decimal] = Field(None, ge=0, description="Minimum total amount")
    max_amount: Optional[Decimal] = Field(None, ge=0, description="Maximum total amount")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: str = Field(default="quo_created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


class QuoteListResponse(BaseModel):
    """Paginated list of quotes."""
    items: List[QuoteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# =====================
# Convert to Order Schema
# =====================

class QuoteConvertRequest(BaseModel):
    """Schema for converting quote to order."""
    include_all_lines: bool = Field(default=True, description="Include all quote lines in order")
    line_ids: Optional[List[int]] = Field(None, description="Specific line IDs to include (if not all)")
    order_date: Optional[datetime] = Field(None, description="Order date (defaults to now)")
    notes: Optional[str] = Field(None, description="Additional order notes")


class QuoteConvertResponse(BaseModel):
    """Schema for quote conversion result."""
    quote_id: int
    order_id: int
    order_reference: str
    converted_at: datetime
    lines_converted: int


# =====================
# Duplicate Quote Schema
# =====================

class QuoteDuplicateRequest(BaseModel):
    """Schema for duplicating a quote."""
    new_valid_until: Optional[datetime] = Field(None, description="New validity date")
    new_client_id: Optional[int] = Field(None, description="New client ID (defaults to same client)")


class QuoteDuplicateResponse(BaseModel):
    """Schema for quote duplication result."""
    original_quote_id: int
    new_quote_id: int
    new_quote_reference: str
    lines_copied: int

"""
Pydantic schemas for Sage X3 export API requests and responses.
Defines data structures for transforming ERP data to X3 format.
"""
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator


# ==========================================================================
# Export Status and Type Enums
# ==========================================================================

class X3ExportStatus(str, Enum):
    """Export job status."""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"  # Some records failed


class X3ExportType(str, Enum):
    """Types of data that can be exported to X3."""
    INVOICE = "INVOICE"
    CUSTOMER = "CUSTOMER"
    PRODUCT = "PRODUCT"
    PAYMENT = "PAYMENT"
    CREDIT_NOTE = "CREDIT_NOTE"


class X3DocumentType(str, Enum):
    """X3 document types for invoice exports."""
    INVOICE = "SIH"  # Sales Invoice Header
    CREDIT_NOTE = "SCN"  # Sales Credit Note
    PROFORMA = "SPF"  # Proforma Invoice


# ==========================================================================
# X3 Invoice Export Schemas
# ==========================================================================

class X3InvoiceLineExport(BaseModel):
    """Schema for X3 invoice line export format."""
    line_number: int = Field(..., description="Line number")
    product_reference: Optional[str] = Field(None, description="X3 product reference")
    description: str = Field(..., max_length=250, description="Line description")
    quantity: Decimal = Field(..., description="Quantity")
    unit_price: Decimal = Field(..., description="Unit price (excl. VAT)")
    discount_percent: Decimal = Field(default=Decimal("0"), description="Discount percentage")
    vat_code: str = Field(..., description="X3 VAT code")
    vat_rate: Decimal = Field(..., description="VAT rate percentage")
    vat_amount: Decimal = Field(..., description="VAT amount")
    net_amount: Decimal = Field(..., description="Net amount (excl. VAT)")
    gross_amount: Decimal = Field(..., description="Gross amount (incl. VAT)")
    unit_code: str = Field(default="UN", description="X3 unit code")


class X3InvoiceExport(BaseModel):
    """Schema for X3 invoice export format (SIH - Sales Invoice Header)."""
    # Header identification
    document_type: X3DocumentType = Field(default=X3DocumentType.INVOICE)
    document_number: str = Field(..., max_length=20, description="Invoice reference")
    company_code: str = Field(..., max_length=5, description="X3 company code")
    site_code: str = Field(..., max_length=5, description="X3 site code")

    # Customer information
    customer_code: str = Field(..., max_length=15, description="X3 customer code")
    customer_name: str = Field(..., max_length=35, description="Customer name")
    customer_address: Optional[str] = Field(None, max_length=50)
    customer_city: Optional[str] = Field(None, max_length=35)
    customer_postal_code: Optional[str] = Field(None, max_length=10)
    customer_country_code: Optional[str] = Field(None, max_length=3)
    customer_vat_number: Optional[str] = Field(None, max_length=20)

    # Dates
    invoice_date: date = Field(..., description="Invoice date")
    due_date: date = Field(..., description="Payment due date")
    accounting_date: Optional[date] = Field(None, description="Accounting date")

    # Currency
    currency_code: str = Field(..., max_length=3, description="ISO currency code")
    exchange_rate: Decimal = Field(default=Decimal("1"), description="Exchange rate")

    # Payment terms
    payment_term_code: Optional[str] = Field(None, max_length=10, description="X3 payment term code")

    # Totals
    total_excl_vat: Decimal = Field(..., description="Total excluding VAT")
    total_vat: Decimal = Field(..., description="Total VAT amount")
    total_incl_vat: Decimal = Field(..., description="Total including VAT")
    discount_amount: Decimal = Field(default=Decimal("0"), description="Total discount amount")

    # Notes
    header_text: Optional[str] = Field(None, max_length=250, description="Header notes")
    footer_text: Optional[str] = Field(None, max_length=250, description="Footer notes")

    # Internal references
    erp_invoice_id: int = Field(..., description="Internal ERP invoice ID")
    erp_order_id: Optional[int] = Field(None, description="Linked ERP order ID")

    # Lines
    lines: List[X3InvoiceLineExport] = Field(default=[], description="Invoice lines")

    # Export metadata
    exported_at: Optional[datetime] = None
    export_batch_id: Optional[str] = None


# ==========================================================================
# X3 Customer Export Schemas
# ==========================================================================

class X3CustomerExport(BaseModel):
    """Schema for X3 customer export format (BPC - Business Partner Customer)."""
    # Identification
    customer_code: str = Field(..., max_length=15, description="X3 customer code")
    company_code: str = Field(..., max_length=5, description="X3 company code")

    # Name and contact
    company_name: str = Field(..., max_length=35, description="Company name")
    short_name: Optional[str] = Field(None, max_length=10, description="Short name")
    contact_first_name: Optional[str] = Field(None, max_length=25)
    contact_last_name: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=80)
    phone: Optional[str] = Field(None, max_length=40)
    mobile: Optional[str] = Field(None, max_length=40)
    website: Optional[str] = Field(None, max_length=80)

    # Address
    address_line_1: Optional[str] = Field(None, max_length=50)
    address_line_2: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=35)
    country_code: Optional[str] = Field(None, max_length=3)

    # Tax and legal
    vat_number: Optional[str] = Field(None, max_length=20)
    siret: Optional[str] = Field(None, max_length=20)

    # Financial
    currency_code: str = Field(default="EUR", max_length=3)
    payment_term_code: Optional[str] = Field(None, max_length=10)
    payment_mode_code: Optional[str] = Field(None, max_length=5)
    credit_limit: Optional[Decimal] = Field(None, description="Credit limit")
    default_discount: Optional[Decimal] = Field(None, description="Default discount %")

    # Classification
    customer_category: Optional[str] = Field(None, max_length=10, description="X3 customer category")
    sales_rep_code: Optional[str] = Field(None, max_length=10, description="Sales representative")
    language_code: str = Field(default="FRA", max_length=3)

    # Status
    is_active: bool = Field(default=True)

    # Internal reference
    erp_client_id: int = Field(..., description="Internal ERP client ID")

    # Export metadata
    exported_at: Optional[datetime] = None


# ==========================================================================
# X3 Payment Export Schemas
# ==========================================================================

class X3PaymentExport(BaseModel):
    """Schema for X3 payment export format."""
    # Identification
    payment_number: str = Field(..., max_length=20, description="Payment reference")
    company_code: str = Field(..., max_length=5)

    # Customer
    customer_code: str = Field(..., max_length=15)

    # Payment details
    payment_date: date = Field(..., description="Payment date")
    payment_amount: Decimal = Field(..., description="Payment amount")
    currency_code: str = Field(..., max_length=3)
    payment_mode_code: str = Field(..., max_length=5, description="X3 payment mode")

    # Bank details (if applicable)
    bank_code: Optional[str] = Field(None, max_length=10)
    bank_reference: Optional[str] = Field(None, max_length=30)

    # Allocation
    allocated_invoices: List[Dict[str, Any]] = Field(
        default=[],
        description="List of invoice allocations [{invoice_number, amount}]"
    )

    # Internal reference
    erp_payment_id: int = Field(..., description="Internal ERP payment ID")

    # Export metadata
    exported_at: Optional[datetime] = None


# ==========================================================================
# Export Request/Response Schemas
# ==========================================================================

class X3ExportRequest(BaseModel):
    """Request schema for initiating an X3 export."""
    export_type: X3ExportType = Field(..., description="Type of data to export")

    # Filters
    date_from: Optional[date] = Field(None, description="Start date filter")
    date_to: Optional[date] = Field(None, description="End date filter")
    entity_ids: Optional[List[int]] = Field(None, description="Specific entity IDs to export")
    client_id: Optional[int] = Field(None, description="Filter by client ID")
    status_ids: Optional[List[int]] = Field(None, description="Filter by status IDs")
    society_id: Optional[int] = Field(None, description="Filter by society ID")
    bu_id: Optional[int] = Field(None, description="Filter by business unit ID")

    # Export options
    batch_size: Optional[int] = Field(None, ge=1, le=1000, description="Override default batch size")
    include_exported: bool = Field(default=False, description="Include already exported records")
    dry_run: bool = Field(default=False, description="Validate without actual export")
    output_format: str = Field(default="json", pattern="^(json|xml|csv)$", description="Output format")


class X3ExportItemResult(BaseModel):
    """Result for a single exported item."""
    erp_id: int = Field(..., description="Internal ERP entity ID")
    erp_reference: str = Field(..., description="ERP reference number")
    x3_reference: Optional[str] = Field(None, description="X3 reference (if created)")
    status: str = Field(..., description="Item export status")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    error_code: Optional[str] = Field(None, description="Error code if failed")


class X3ExportJobResponse(BaseModel):
    """Response schema for an X3 export job."""
    job_id: str = Field(..., description="Unique export job ID")
    export_type: X3ExportType
    status: X3ExportStatus

    # Progress
    total_records: int = Field(default=0, description="Total records to export")
    processed_records: int = Field(default=0, description="Records processed")
    successful_records: int = Field(default=0, description="Successfully exported")
    failed_records: int = Field(default=0, description="Failed to export")

    # Results
    results: List[X3ExportItemResult] = Field(default=[], description="Individual item results")

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Output
    output_file: Optional[str] = Field(None, description="Path to export file")

    # Errors
    error_message: Optional[str] = Field(None, description="Overall error message if job failed")

    @property
    def duration_seconds(self) -> Optional[float]:
        """Calculate job duration in seconds."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class X3ExportHistoryItem(BaseModel):
    """Schema for export history record."""
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    export_type: X3ExportType
    status: X3ExportStatus
    total_records: int
    successful_records: int
    failed_records: int
    started_at: datetime
    completed_at: Optional[datetime]
    created_by: Optional[int]


class X3ExportHistoryResponse(BaseModel):
    """Paginated export history response."""
    items: List[X3ExportHistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==========================================================================
# X3 Mapping Configuration Schemas
# ==========================================================================

class X3VatMapping(BaseModel):
    """VAT code mapping configuration."""
    erp_vat_id: int
    x3_vat_code: str
    vat_rate: Decimal


class X3PaymentTermMapping(BaseModel):
    """Payment term mapping configuration."""
    erp_payment_term_id: int
    x3_payment_term_code: str


class X3CurrencyMapping(BaseModel):
    """Currency mapping configuration."""
    erp_currency_id: int
    x3_currency_code: str


class X3MappingConfig(BaseModel):
    """Complete X3 mapping configuration."""
    vat_mappings: List[X3VatMapping] = []
    payment_term_mappings: List[X3PaymentTermMapping] = []
    currency_mappings: List[X3CurrencyMapping] = []
    default_vat_code: str = "NOR"
    default_currency_code: str = "EUR"
    default_payment_term_code: str = "30NET"


# ==========================================================================
# API Error Response
# ==========================================================================

class X3ExportErrorDetail(BaseModel):
    """Error detail for X3 export operations."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class X3ExportErrorResponse(BaseModel):
    """Standard error response for X3 export operations."""
    success: bool = False
    error: X3ExportErrorDetail

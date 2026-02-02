"""
Pydantic schemas for Invoice API
"""
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class InvoiceStatus(str, Enum):
    """Invoice status enum"""
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class InvoiceLineBase(BaseModel):
    """Base schema for invoice line"""
    line_number: int
    description: Optional[str] = None
    product_id: Optional[int] = None
    quantity: Decimal = Field(default=Decimal("1.0000"))
    unit_price: Decimal = Field(default=Decimal("0.0000"))
    discount_percent: Decimal = Field(default=Decimal("0.00"))
    vat_rate: Decimal = Field(default=Decimal("0.00"))


class InvoiceLineResponse(InvoiceLineBase):
    """Response schema for invoice line"""
    id: int
    invoice_id: int
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal
    
    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    """Base schema for invoice"""
    client_id: int
    order_id: Optional[int] = None
    society_id: Optional[int] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice"""
    lines: Optional[List[InvoiceLineBase]] = None


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice"""
    client_id: Optional[int] = None
    status_id: Optional[int] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class ClientSummary(BaseModel):
    """Embedded client info in invoice response"""
    id: int
    name: str
    reference: Optional[str] = None
    
    class Config:
        from_attributes = True


class StatusSummary(BaseModel):
    """Embedded status info in invoice response"""
    id: int
    code: str
    name: str
    color_hex: Optional[str] = None
    
    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    """Response schema for invoice"""
    id: int
    reference: str
    client_id: int
    order_id: Optional[int] = None
    society_id: Optional[int] = None
    status_id: Optional[int] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    total_ht: Decimal
    total_vat: Decimal
    total_ttc: Decimal
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Embedded relations
    client: Optional[ClientSummary] = None
    status: Optional[StatusSummary] = None
    
    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    """Response schema for invoice list item"""
    id: int
    reference: str
    client_id: int
    client_name: Optional[str] = None
    status_id: Optional[int] = None
    status_name: Optional[str] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    total_ttc: Decimal
    
    class Config:
        from_attributes = True


class PaginatedInvoiceResponse(BaseModel):
    """Paginated response for invoice list"""
    items: List[InvoiceResponse]
    page: int
    page_size: int
    total_count: int
    total_pages: int


class InvoiceSearchParams(BaseModel):
    """Search parameters for invoices"""
    search: Optional[str] = None
    client_id: Optional[int] = None
    status_id: Optional[int] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None


class InvoiceLineCreate(InvoiceLineBase):
    """Schema for creating an invoice line"""
    pass


class InvoiceLineUpdate(BaseModel):
    """Schema for updating an invoice line"""
    description: Optional[str] = None
    product_id: Optional[int] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    discount_percent: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None


class CreateInvoiceFromOrderRequest(BaseModel):
    """Request to create an invoice from an order"""
    order_id: int
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class CreateInvoiceFromOrderResponse(BaseModel):
    """Response for create invoice from order"""
    success: bool = True
    message: str = "Invoice created successfully"
    invoice: Optional[InvoiceResponse] = None


class InvoiceDetailResponse(BaseModel):
    """
    Schema for invoice detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /invoices/{invoice_id} endpoint.
    Maps from actual TM_CIN_Client_Invoice table columns.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="cin_id", description="Invoice ID")
    code: str = Field(..., validation_alias="cin_code", description="Invoice code/reference")
    name: Optional[str] = Field(None, validation_alias="cin_name", description="Invoice name/title")

    # Foreign key IDs
    orderId: Optional[int] = Field(None, validation_alias="cod_id", description="Order ID")
    clientId: int = Field(..., validation_alias="cli_id", description="Client ID")
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    projectId: Optional[int] = Field(None, validation_alias="prj_id", description="Project ID")
    deliveryFormId: Optional[int] = Field(None, validation_alias="dfo_id", description="Delivery form ID")
    invoicingContactId: Optional[int] = Field(None, validation_alias="cco_id_invoicing", description="Invoicing contact ID")
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")

    # Dates
    createdAt: Optional[datetime] = Field(None, validation_alias="cin_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="cin_d_update", description="Update timestamp")
    invoiceDate: Optional[datetime] = Field(None, validation_alias="cin_d_invoice", description="Invoice date")
    termDate: Optional[datetime] = Field(None, validation_alias="cin_d_term", description="Payment term date")
    encashmentDate: Optional[datetime] = Field(None, validation_alias="cin_d_encaissement", description="Encashment date")

    # Status flags
    isAccount: bool = Field(..., validation_alias="cin_account", description="Is account invoice")
    isInvoice: bool = Field(..., validation_alias="cin_isinvoice", description="Is invoice flag")
    isInvoiced: bool = Field(..., validation_alias="cin_invoiced", description="Is invoiced flag")
    isFullPaid: Optional[bool] = Field(None, validation_alias="cin_is_full_paid", description="Is fully paid")
    isKeyProject: Optional[bool] = Field(None, validation_alias="cin_key_project", description="Is key project")

    # Text fields
    headerText: Optional[str] = Field(None, validation_alias="cin_header_text", description="Header text")
    footerText: Optional[str] = Field(None, validation_alias="cin_footer_text", description="Footer text")
    clientComment: Optional[str] = Field(None, validation_alias="cin_client_comment", description="Client comment")
    internalComment: Optional[str] = Field(None, validation_alias="cin_inter_comment", description="Internal comment")

    # Discount and amounts
    discountPercentage: Optional[Decimal] = Field(None, validation_alias="cin_discount_percentage", description="Discount percentage")
    discountAmount: Optional[Decimal] = Field(None, validation_alias="cin_discount_amount", description="Discount amount")
    restToPay: Optional[Decimal] = Field(None, validation_alias="cin_rest_to_pay", description="Rest to pay")
    margin: Optional[Decimal] = Field(None, validation_alias="cin_margin", description="Margin")

    # File
    file: Optional[str] = Field(None, validation_alias="cin_file", description="File path")

    # Invoicing address snapshot
    invFirstname: Optional[str] = Field(None, validation_alias="cin_inv_cco_firstname", description="Invoicing address firstname")
    invLastname: Optional[str] = Field(None, validation_alias="cin_inv_cco_lastname", description="Invoicing address lastname")
    invAddress1: Optional[str] = Field(None, validation_alias="cin_inv_cco_address1", description="Invoicing address line 1")
    invAddress2: Optional[str] = Field(None, validation_alias="cin_inv_cco_address2", description="Invoicing address line 2")
    invPostcode: Optional[str] = Field(None, validation_alias="cin_inv_cco_postcode", description="Invoicing address postcode")
    invCity: Optional[str] = Field(None, validation_alias="cin_inv_cco_city", description="Invoicing address city")
    invCountry: Optional[str] = Field(None, validation_alias="cin_inv_cco_country", description="Invoicing address country")
    invPhone: Optional[str] = Field(None, validation_alias="cin_inv_cco_tel1", description="Invoicing address phone")
    invFax: Optional[str] = Field(None, validation_alias="cin_inv_cco_fax", description="Invoicing address fax")
    invMobile: Optional[str] = Field(None, validation_alias="cin_inv_cco_cellphone", description="Invoicing address mobile")
    invEmail: Optional[str] = Field(None, validation_alias="cin_inv_cco_email", description="Invoicing address email")

    # Commercial users
    commercialUser1Id: Optional[int] = Field(None, validation_alias="usr_com_1", description="Commercial user 1 ID")
    commercialUser2Id: Optional[int] = Field(None, validation_alias="usr_com_2", description="Commercial user 2 ID")
    commercialUser3Id: Optional[int] = Field(None, validation_alias="usr_com_3", description="Commercial user 3 ID")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # =====================================================
    clientName: Optional[str] = Field(None, description="Resolved client company name")
    orderReference: Optional[str] = Field(None, description="Resolved order reference code")
    societyName: Optional[str] = Field(None, description="Resolved society name")
    projectName: Optional[str] = Field(None, description="Resolved project name")
    currencyCode: Optional[str] = Field(None, description="Resolved currency code/designation")
    currencySymbol: Optional[str] = Field(None, description="Resolved currency symbol")
    paymentModeName: Optional[str] = Field(None, description="Resolved payment mode name")
    paymentConditionName: Optional[str] = Field(None, description="Resolved payment condition name")
    paymentTermDays: Optional[int] = Field(None, description="Payment term total days")

    # Lines (optional, included in detail response)
    lines: List[InvoiceLineResponse] = Field(default_factory=list, description="Invoice lines")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get invoice's display name."""
        return self.code or ""

    @computed_field
    @property
    def fullInvoicingAddress(self) -> Optional[str]:
        """Get formatted full invoicing address."""
        parts = []
        if self.invAddress1:
            parts.append(self.invAddress1)
        if self.invAddress2:
            parts.append(self.invAddress2)
        if self.invPostcode or self.invCity:
            city_line = " ".join(filter(None, [self.invPostcode, self.invCity]))
            if city_line:
                parts.append(city_line)
        if self.invCountry:
            parts.append(self.invCountry)
        return ", ".join(parts) if parts else None


# =============================================================================
# Action Schemas
# =============================================================================

class SendInvoiceRequest(BaseModel):
    """Request to send invoice via email"""
    recipient_email: Optional[str] = None
    cc_emails: Optional[List[str]] = None
    message: Optional[str] = None
    attach_pdf: bool = True


class SendInvoiceResponse(BaseModel):
    """Response for send invoice"""
    success: bool = True
    message: str = "Invoice sent successfully"
    sent_to: Optional[str] = None


class VoidInvoiceRequest(BaseModel):
    """Request to void an invoice"""
    reason: str = Field(..., min_length=1, description="Reason for voiding")


class VoidInvoiceResponse(BaseModel):
    """Response for void invoice"""
    success: bool = True
    message: str = "Invoice voided successfully"


class RecordPaymentRequest(BaseModel):
    """Request to record a payment"""
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class RecordPaymentResponse(BaseModel):
    """Response for record payment"""
    success: bool = True
    message: str = "Payment recorded successfully"
    new_balance: Optional[Decimal] = None


class GeneratePdfResponse(BaseModel):
    """Response for PDF generation"""
    success: bool = True
    message: str = "PDF generated successfully"
    pdf_url: Optional[str] = None
    file_path: Optional[str] = None


# =============================================================================
# Statistics Schemas
# =============================================================================

class InvoiceStatistics(BaseModel):
    """Invoice statistics data"""
    total_count: int = 0
    total_amount: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    pending_amount: Decimal = Decimal("0.00")
    overdue_count: int = 0
    overdue_amount: Decimal = Decimal("0.00")


class InvoiceStatisticsResponse(BaseModel):
    """Response for invoice statistics"""
    success: bool = True
    statistics: InvoiceStatistics


# =============================================================================
# API Response Wrappers
# =============================================================================

class InvoiceAPIResponse(BaseModel):
    """Standard API response wrapper for invoice operations"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[InvoiceResponse] = None


class InvoiceErrorResponse(BaseModel):
    """Error response for invoice operations"""
    success: bool = False
    message: str
    code: Optional[str] = None
    details: Optional[dict] = None

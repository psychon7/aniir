"""
Supplier Invoice Pydantic schemas for API request/response validation.

Schemas for TM_SIN_Supplier_Invoice (header) and TM_SIL_SupplierInvoice_Lines (lines).
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Supplier Invoice Line Schemas
# ==========================================================================

class SupplierInvoiceLineBase(BaseModel):
    """Base schema for supplier invoice line."""
    prd_id: Optional[int] = Field(None, description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    sol_id: Optional[int] = Field(None, description="Supplier order line ID")
    sil_order: Optional[int] = Field(None, description="Line sequence/order")
    sil_quantity: Optional[int] = Field(None, ge=0, description="Quantity")
    sil_description: Optional[str] = Field(None, max_length=4000, description="Line description")
    sil_unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    sil_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")


class SupplierInvoiceLineCreate(SupplierInvoiceLineBase):
    """Schema for creating a supplier invoice line."""
    sil_quantity: int = Field(..., ge=1, description="Quantity (required)")
    sil_unit_price: Decimal = Field(..., ge=0, description="Unit price (required)")
    sil_description: str = Field(..., min_length=1, max_length=4000, description="Line description (required)")


class SupplierInvoiceLineUpdate(BaseModel):
    """Schema for updating a supplier invoice line."""
    prd_id: Optional[int] = Field(None, description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    sol_id: Optional[int] = Field(None, description="Supplier order line ID")
    sil_order: Optional[int] = Field(None, description="Line sequence/order")
    sil_quantity: Optional[int] = Field(None, ge=1, description="Quantity")
    sil_description: Optional[str] = Field(None, max_length=4000, description="Line description")
    sil_unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    sil_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")


class SupplierInvoiceLineResponse(BaseModel):
    """Schema for supplier invoice line response - camelCase for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="sil_id", description="Line ID")
    invoiceId: int = Field(..., validation_alias="sin_id", description="Parent invoice ID")

    # Product references
    productId: Optional[int] = Field(None, validation_alias="prd_id", description="Product ID")
    productInstanceId: Optional[int] = Field(None, validation_alias="pit_id", description="Product instance ID")
    supplierOrderLineId: Optional[int] = Field(None, validation_alias="sol_id", description="Supplier order line ID")

    # Line details
    lineOrder: Optional[int] = Field(None, validation_alias="sil_order", description="Line sequence")
    quantity: Optional[int] = Field(None, validation_alias="sil_quantity", description="Quantity")
    description: Optional[str] = Field(None, validation_alias="sil_description", description="Description")

    # Pricing
    unitPrice: Optional[Decimal] = Field(None, validation_alias="sil_unit_price", description="Unit price")
    discountAmount: Optional[Decimal] = Field(None, validation_alias="sil_discount_amount", description="Discount amount")
    totalPrice: Optional[Decimal] = Field(None, validation_alias="sil_total_price", description="Total price")
    priceWithDiscount: Optional[Decimal] = Field(None, validation_alias="sil_price_with_dis", description="Price with discount")
    totalCrudePrice: Optional[Decimal] = Field(None, validation_alias="sil_total_crude_price", description="Total crude price")

    # VAT
    vatId: Optional[int] = Field(None, validation_alias="vat_id", description="VAT rate ID")

    @computed_field
    @property
    def lineTotal(self) -> Decimal:
        """Calculate line total (quantity * unit_price - discount)."""
        qty = self.quantity or 0
        price = self.unitPrice or Decimal("0")
        discount = self.discountAmount or Decimal("0")
        return Decimal(str(qty)) * price - discount


# ==========================================================================
# Supplier Invoice Base Schemas
# ==========================================================================

class SupplierInvoiceBase(BaseModel):
    """Base schema for supplier invoice."""
    sin_code: Optional[str] = Field(None, max_length=50, description="Invoice code/reference")
    sin_name: Optional[str] = Field(None, max_length=1000, description="Invoice name/description")
    sup_id: int = Field(..., description="Supplier ID")
    sco_id: Optional[int] = Field(None, description="Supplier contact ID")
    soc_id: int = Field(..., description="Society ID")
    sod_id: Optional[int] = Field(None, description="Supplier order ID (optional link)")
    cur_id: int = Field(..., description="Currency ID")
    vat_id: int = Field(..., description="VAT rate ID")
    bac_id: Optional[int] = Field(None, description="Bank account ID")
    sin_inter_comment: Optional[str] = Field(None, max_length=4000, description="Internal comment")
    sin_supplier_comment: Optional[str] = Field(None, max_length=4000, description="Comment for supplier")
    sin_file: Optional[str] = Field(None, max_length=2000, description="File attachment path")
    sin_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Invoice discount amount")


class SupplierInvoiceCreate(SupplierInvoiceBase):
    """Schema for creating a supplier invoice."""
    usr_creator_id: int = Field(..., description="Creator user ID")
    lines: List[SupplierInvoiceLineCreate] = Field(default_factory=list, description="Invoice lines")


class SupplierInvoiceUpdate(BaseModel):
    """Schema for updating a supplier invoice."""
    sin_code: Optional[str] = Field(None, max_length=50, description="Invoice code/reference")
    sin_name: Optional[str] = Field(None, max_length=1000, description="Invoice name/description")
    sup_id: Optional[int] = Field(None, description="Supplier ID")
    sco_id: Optional[int] = Field(None, description="Supplier contact ID")
    sod_id: Optional[int] = Field(None, description="Supplier order ID (optional link)")
    cur_id: Optional[int] = Field(None, description="Currency ID")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")
    bac_id: Optional[int] = Field(None, description="Bank account ID")
    sin_inter_comment: Optional[str] = Field(None, max_length=4000, description="Internal comment")
    sin_supplier_comment: Optional[str] = Field(None, max_length=4000, description="Comment for supplier")
    sin_file: Optional[str] = Field(None, max_length=2000, description="File attachment path")
    sin_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Invoice discount amount")


# ==========================================================================
# Supplier Invoice Response Schemas
# ==========================================================================

class SupplierInvoiceResponse(BaseModel):
    """Schema for supplier invoice list response - camelCase for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="sin_id", description="Invoice ID")
    code: Optional[str] = Field(None, validation_alias="sin_code", description="Invoice code/reference")
    name: Optional[str] = Field(None, validation_alias="sin_name", description="Invoice name/description")

    # Foreign keys
    supplierId: int = Field(..., validation_alias="sup_id", description="Supplier ID")
    supplierContactId: Optional[int] = Field(None, validation_alias="sco_id", description="Supplier contact ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")
    supplierOrderId: Optional[int] = Field(None, validation_alias="sod_id", description="Supplier order ID")
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT rate ID")
    bankAccountId: Optional[int] = Field(None, validation_alias="bac_id", description="Bank account ID")

    # Comments
    internalComment: Optional[str] = Field(None, validation_alias="sin_inter_comment", description="Internal comment")
    supplierComment: Optional[str] = Field(None, validation_alias="sin_supplier_comment", description="Comment for supplier")

    # Timestamps
    createdAt: datetime = Field(..., validation_alias="sin_d_creation", description="Creation timestamp")
    updatedAt: datetime = Field(..., validation_alias="sin_d_update", description="Last update timestamp")

    # File
    file: Optional[str] = Field(None, validation_alias="sin_file", description="File attachment path")

    # Amounts
    discountAmount: Optional[Decimal] = Field(None, validation_alias="sin_discount_amount", description="Invoice discount amount")

    # Payment status
    isPaid: Optional[bool] = Field(None, validation_alias="sin_is_paid", description="Is paid flag")
    bankReceiptFile: Optional[str] = Field(None, validation_alias="sin_bank_receipt_file", description="Bank receipt file path")
    bankReceiptNumber: Optional[str] = Field(None, validation_alias="sin_bank_receipt_number", description="Bank receipt number")

    # Production tracking
    productionStarted: Optional[bool] = Field(None, validation_alias="sin_start_production", description="Production started flag")
    productionStartDate: Optional[datetime] = Field(None, validation_alias="sin_d_start_production", description="Production start date")
    productionCompletePreDate: Optional[datetime] = Field(None, validation_alias="sin_d_complete_production_pre", description="Production complete pre date")
    productionCompleteDate: Optional[datetime] = Field(None, validation_alias="sin_d_complete_production", description="Production complete date")
    productionComplete: Optional[bool] = Field(None, validation_alias="sin_complete_production", description="Production complete flag")
    allProductStored: Optional[bool] = Field(None, validation_alias="sin_all_product_stored", description="All products stored flag")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get invoice display name (code + name if available)."""
        if self.name:
            return f"{self.code or 'N/A'} - {self.name}"
        return self.code or f"Invoice #{self.id}"

    @computed_field
    @property
    def paymentStatus(self) -> str:
        """Get human-readable payment status."""
        return "Paid" if self.isPaid else "Unpaid"


class SupplierInvoiceDetailResponse(SupplierInvoiceResponse):
    """Schema for supplier invoice detail response with lines and resolved lookups."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Invoice lines
    lines: List[SupplierInvoiceLineResponse] = Field(default_factory=list, description="Invoice lines")

    # Resolved lookup names (populated by service layer)
    supplierName: Optional[str] = Field(None, description="Resolved supplier company name")
    supplierReference: Optional[str] = Field(None, description="Resolved supplier reference")
    societyName: Optional[str] = Field(None, description="Resolved society name")
    currencyCode: Optional[str] = Field(None, description="Resolved currency code")
    currencySymbol: Optional[str] = Field(None, description="Resolved currency symbol")
    vatRate: Optional[Decimal] = Field(None, description="Resolved VAT rate")
    creatorName: Optional[str] = Field(None, description="Resolved creator name")
    supplierOrderCode: Optional[str] = Field(None, description="Resolved supplier order code")

    # Calculated totals
    totalHt: Optional[Decimal] = Field(None, description="Total excluding tax")
    totalTtc: Optional[Decimal] = Field(None, description="Total including tax")

    @computed_field
    @property
    def lineCount(self) -> int:
        """Get number of lines."""
        return len(self.lines)

    @computed_field
    @property
    def totalQuantity(self) -> int:
        """Get total quantity across all lines."""
        if not self.lines:
            return 0
        return sum(line.quantity or 0 for line in self.lines)


# ==========================================================================
# Paginated Response Schemas
# ==========================================================================

class SupplierInvoiceListPaginatedResponse(BaseModel):
    """Schema for paginated supplier invoice list response."""
    success: bool = True
    data: List[SupplierInvoiceResponse] = Field(default_factory=list)
    page: int = Field(1, ge=1, description="Current page number")
    pageSize: int = Field(20, ge=1, description="Items per page")
    totalCount: int = Field(0, ge=0, description="Total number of items")
    totalPages: int = Field(0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(False, description="Has next page")
    hasPreviousPage: bool = Field(False, description="Has previous page")


# ==========================================================================
# Search/Filter Parameters
# ==========================================================================

class SupplierInvoiceSearchParams(BaseModel):
    """Schema for supplier invoice search/filter parameters."""
    search: Optional[str] = Field(None, max_length=100, description="Search term (code, name)")
    supplier_id: Optional[int] = Field(None, description="Filter by supplier ID")
    society_id: Optional[int] = Field(None, description="Filter by society ID")
    currency_id: Optional[int] = Field(None, description="Filter by currency ID")
    supplier_order_id: Optional[int] = Field(None, description="Filter by supplier order ID")
    is_paid: Optional[bool] = Field(None, description="Filter by paid status")
    production_started: Optional[bool] = Field(None, description="Filter by production started")
    production_complete: Optional[bool] = Field(None, description="Filter by production complete")
    date_from: Optional[datetime] = Field(None, description="Filter by creation date from")
    date_to: Optional[datetime] = Field(None, description="Filter by creation date to")
    min_amount: Optional[Decimal] = Field(None, ge=0, description="Filter by minimum total amount")
    max_amount: Optional[Decimal] = Field(None, ge=0, description="Filter by maximum total amount")
    creator_id: Optional[int] = Field(None, description="Filter by creator ID")


# ==========================================================================
# Payment Action Request/Response Schemas
# ==========================================================================

class MarkPaidRequest(BaseModel):
    """Request to mark a supplier invoice as paid."""
    bank_receipt_number: Optional[str] = Field(None, max_length=100, description="Bank receipt number")
    bank_receipt_file: Optional[str] = Field(None, max_length=2000, description="Bank receipt file path")
    notes: Optional[str] = Field(None, max_length=4000, description="Optional notes for payment")


class MarkPaidResponse(BaseModel):
    """Response from marking a supplier invoice as paid."""
    success: bool = True
    invoiceId: int
    paidAt: datetime
    bankReceiptNumber: Optional[str] = None
    message: str = "Invoice marked as paid successfully"


class MarkUnpaidRequest(BaseModel):
    """Request to mark a supplier invoice as unpaid."""
    reason: str = Field(..., min_length=5, max_length=4000, description="Reason for marking unpaid")


class MarkUnpaidResponse(BaseModel):
    """Response from marking a supplier invoice as unpaid."""
    success: bool = True
    invoiceId: int
    unmarkedAt: datetime
    reason: str
    message: str = "Invoice marked as unpaid successfully"


# ==========================================================================
# Production Status Request/Response Schemas
# ==========================================================================

class StartProductionRequest(BaseModel):
    """Request to mark production as started."""
    notes: Optional[str] = Field(None, max_length=4000, description="Optional notes")


class StartProductionResponse(BaseModel):
    """Response from starting production."""
    success: bool = True
    invoiceId: int
    startedAt: datetime
    message: str = "Production started successfully"


class CompleteProductionRequest(BaseModel):
    """Request to mark production as complete."""
    notes: Optional[str] = Field(None, max_length=4000, description="Optional notes")


class CompleteProductionResponse(BaseModel):
    """Response from completing production."""
    success: bool = True
    invoiceId: int
    completedAt: datetime
    message: str = "Production completed successfully"


# ==========================================================================
# Error Response Schemas
# ==========================================================================

class SupplierInvoiceErrorDetail(BaseModel):
    """Error detail information."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class SupplierInvoiceErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: SupplierInvoiceErrorDetail


# ==========================================================================
# Generic API Response
# ==========================================================================

class SupplierInvoiceAPIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None

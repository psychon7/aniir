"""
Supplier Order Pydantic schemas for API request/response validation.

Schemas for TM_SOD_Supplier_Order (header) and TM_SOL_SupplierOrder_Lines (lines).
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Supplier Order Line Schemas
# ==========================================================================

class SupplierOrderLineBase(BaseModel):
    """Base schema for supplier order line."""
    prd_id: Optional[int] = Field(None, description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    pil_id: Optional[int] = Field(None, description="Purchase intent line ID")
    sol_order: Optional[int] = Field(None, description="Line sequence/order")
    sol_quantity: Optional[int] = Field(None, ge=0, description="Quantity")
    sol_description: Optional[str] = Field(None, max_length=4000, description="Line description")
    sol_unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    sol_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")


class SupplierOrderLineCreate(SupplierOrderLineBase):
    """Schema for creating a supplier order line."""
    sol_quantity: int = Field(..., ge=1, description="Quantity (required)")
    sol_unit_price: Decimal = Field(..., ge=0, description="Unit price (required)")
    sol_description: str = Field(..., min_length=1, max_length=4000, description="Line description (required)")


class SupplierOrderLineUpdate(BaseModel):
    """Schema for updating a supplier order line."""
    prd_id: Optional[int] = Field(None, description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    sol_order: Optional[int] = Field(None, description="Line sequence/order")
    sol_quantity: Optional[int] = Field(None, ge=1, description="Quantity")
    sol_description: Optional[str] = Field(None, max_length=4000, description="Line description")
    sol_unit_price: Optional[Decimal] = Field(None, ge=0, description="Unit price")
    sol_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Discount amount")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")


class SupplierOrderLineResponse(BaseModel):
    """Schema for supplier order line response - camelCase for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="sol_id", description="Line ID")
    orderId: int = Field(..., validation_alias="sod_id", description="Parent order ID")

    # Product references
    productId: Optional[int] = Field(None, validation_alias="prd_id", description="Product ID")
    productInstanceId: Optional[int] = Field(None, validation_alias="pit_id", description="Product instance ID")
    purchaseIntentLineId: Optional[int] = Field(None, validation_alias="pil_id", description="Purchase intent line ID")

    # Line details
    lineOrder: Optional[int] = Field(None, validation_alias="sol_order", description="Line sequence")
    quantity: Optional[int] = Field(None, validation_alias="sol_quantity", description="Quantity")
    description: Optional[str] = Field(None, validation_alias="sol_description", description="Description")

    # Pricing
    unitPrice: Optional[Decimal] = Field(None, validation_alias="sol_unit_price", description="Unit price")
    discountAmount: Optional[Decimal] = Field(None, validation_alias="sol_discount_amount", description="Discount amount")
    totalPrice: Optional[Decimal] = Field(None, validation_alias="sol_total_price", description="Total price")
    priceWithDiscount: Optional[Decimal] = Field(None, validation_alias="sol_price_with_dis", description="Price with discount")
    totalCrudePrice: Optional[Decimal] = Field(None, validation_alias="sol_total_crude_price", description="Total crude price")

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
# Supplier Order Base Schemas
# ==========================================================================

class SupplierOrderBase(BaseModel):
    """Base schema for supplier order."""
    sod_code: Optional[str] = Field(None, max_length=50, description="Order code/reference")
    sod_name: Optional[str] = Field(None, max_length=1000, description="Order name/description")
    sup_id: int = Field(..., description="Supplier ID")
    sco_id: Optional[int] = Field(None, description="Supplier contact ID")
    soc_id: int = Field(..., description="Society ID")
    cur_id: int = Field(..., description="Currency ID")
    vat_id: int = Field(..., description="VAT rate ID")
    sod_inter_comment: Optional[str] = Field(None, max_length=4000, description="Internal comment")
    sod_supplier_comment: Optional[str] = Field(None, max_length=4000, description="Comment for supplier")
    sod_d_exp_delivery: Optional[datetime] = Field(None, description="Expected delivery date")
    sod_file: Optional[str] = Field(None, max_length=2000, description="File attachment path")
    sod_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Order discount amount")
    pin_id: Optional[int] = Field(None, description="Purchase intent ID")


class SupplierOrderCreate(SupplierOrderBase):
    """Schema for creating a supplier order."""
    usr_creator_id: int = Field(..., description="Creator user ID")
    lines: List[SupplierOrderLineCreate] = Field(default_factory=list, description="Order lines")


class SupplierOrderUpdate(BaseModel):
    """Schema for updating a supplier order."""
    sod_code: Optional[str] = Field(None, max_length=50, description="Order code/reference")
    sod_name: Optional[str] = Field(None, max_length=1000, description="Order name/description")
    sup_id: Optional[int] = Field(None, description="Supplier ID")
    sco_id: Optional[int] = Field(None, description="Supplier contact ID")
    cur_id: Optional[int] = Field(None, description="Currency ID")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")
    sod_inter_comment: Optional[str] = Field(None, max_length=4000, description="Internal comment")
    sod_supplier_comment: Optional[str] = Field(None, max_length=4000, description="Comment for supplier")
    sod_d_exp_delivery: Optional[datetime] = Field(None, description="Expected delivery date")
    sod_file: Optional[str] = Field(None, max_length=2000, description="File attachment path")
    sod_discount_amount: Optional[Decimal] = Field(None, ge=0, description="Order discount amount")
    pin_id: Optional[int] = Field(None, description="Purchase intent ID")


# ==========================================================================
# Supplier Order Response Schemas
# ==========================================================================

class SupplierOrderResponse(BaseModel):
    """Schema for supplier order list response - camelCase for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="sod_id", description="Order ID")
    code: Optional[str] = Field(None, validation_alias="sod_code", description="Order code/reference")
    name: Optional[str] = Field(None, validation_alias="sod_name", description="Order name/description")

    # Foreign keys
    supplierId: int = Field(..., validation_alias="sup_id", description="Supplier ID")
    supplierContactId: Optional[int] = Field(None, validation_alias="sco_id", description="Supplier contact ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")
    purchaseIntentId: Optional[int] = Field(None, validation_alias="pin_id", description="Purchase intent ID")
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT rate ID")

    # Comments
    internalComment: Optional[str] = Field(None, validation_alias="sod_inter_comment", description="Internal comment")
    supplierComment: Optional[str] = Field(None, validation_alias="sod_supplier_comment", description="Comment for supplier")

    # Timestamps
    createdAt: datetime = Field(..., validation_alias="sod_d_creation", description="Creation timestamp")
    updatedAt: datetime = Field(..., validation_alias="sod_d_update", description="Last update timestamp")
    expectedDeliveryDate: Optional[datetime] = Field(None, validation_alias="sod_d_exp_delivery", description="Expected delivery date")

    # File
    file: Optional[str] = Field(None, validation_alias="sod_file", description="File attachment path")

    # Amounts
    discountAmount: Optional[Decimal] = Field(None, validation_alias="sod_discount_amount", description="Order discount amount")
    needToPay: Optional[Decimal] = Field(None, validation_alias="sod_need2pay", description="Amount to pay")
    paidAmount: Optional[Decimal] = Field(None, validation_alias="sod_paid", description="Amount paid")
    totalHt: Optional[Decimal] = Field(None, validation_alias="sod_total_ht", description="Total excluding tax")
    totalTtc: Optional[Decimal] = Field(None, validation_alias="sod_total_ttc", description="Total including tax")

    # Status
    isStarted: Optional[bool] = Field(None, validation_alias="sod_started", description="Order started flag")
    isCanceled: Optional[bool] = Field(None, validation_alias="sod_canceled", description="Order canceled flag")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get order display name (code + name if available)."""
        if self.name:
            return f"{self.code or 'N/A'} - {self.name}"
        return self.code or f"Order #{self.id}"

    @computed_field
    @property
    def balanceDue(self) -> Decimal:
        """Calculate remaining balance to pay."""
        need = self.needToPay or Decimal("0")
        paid = self.paidAmount or Decimal("0")
        return need - paid


class SupplierOrderDetailResponse(SupplierOrderResponse):
    """Schema for supplier order detail response with lines and resolved lookups."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Order lines
    lines: List[SupplierOrderLineResponse] = Field(default_factory=list, description="Order lines")

    # Resolved lookup names (populated by service layer)
    supplierName: Optional[str] = Field(None, description="Resolved supplier company name")
    supplierReference: Optional[str] = Field(None, description="Resolved supplier reference")
    societyName: Optional[str] = Field(None, description="Resolved society name")
    currencyCode: Optional[str] = Field(None, description="Resolved currency code")
    currencySymbol: Optional[str] = Field(None, description="Resolved currency symbol")
    vatRate: Optional[Decimal] = Field(None, description="Resolved VAT rate")
    creatorName: Optional[str] = Field(None, description="Resolved creator name")

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

class SupplierOrderListPaginatedResponse(BaseModel):
    """Schema for paginated supplier order list response."""
    success: bool = True
    data: List[SupplierOrderResponse] = Field(default_factory=list)
    page: int = Field(1, ge=1, description="Current page number")
    pageSize: int = Field(20, ge=1, description="Items per page")
    totalCount: int = Field(0, ge=0, description="Total number of items")
    totalPages: int = Field(0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(False, description="Has next page")
    hasPreviousPage: bool = Field(False, description="Has previous page")


# ==========================================================================
# Search/Filter Parameters
# ==========================================================================

class SupplierOrderSearchParams(BaseModel):
    """Schema for supplier order search/filter parameters."""
    search: Optional[str] = Field(None, max_length=100, description="Search term (code, name)")
    supplier_id: Optional[int] = Field(None, description="Filter by supplier ID")
    society_id: Optional[int] = Field(None, description="Filter by society ID")
    currency_id: Optional[int] = Field(None, description="Filter by currency ID")
    is_started: Optional[bool] = Field(None, description="Filter by started status")
    is_canceled: Optional[bool] = Field(None, description="Filter by canceled status")
    date_from: Optional[datetime] = Field(None, description="Filter by creation date from")
    date_to: Optional[datetime] = Field(None, description="Filter by creation date to")
    exp_delivery_from: Optional[datetime] = Field(None, description="Filter by expected delivery from")
    exp_delivery_to: Optional[datetime] = Field(None, description="Filter by expected delivery to")
    min_amount: Optional[Decimal] = Field(None, ge=0, description="Filter by minimum total amount")
    max_amount: Optional[Decimal] = Field(None, ge=0, description="Filter by maximum total amount")
    creator_id: Optional[int] = Field(None, description="Filter by creator ID")


# ==========================================================================
# Action Request/Response Schemas
# ==========================================================================

class ConfirmSupplierOrderRequest(BaseModel):
    """Request to confirm a supplier order."""
    notes: Optional[str] = Field(None, max_length=4000, description="Optional notes for confirmation")


class ConfirmSupplierOrderResponse(BaseModel):
    """Response from confirming a supplier order."""
    success: bool = True
    orderId: int
    confirmedAt: datetime
    message: str = "Order confirmed successfully"


class CancelSupplierOrderRequest(BaseModel):
    """Request to cancel a supplier order."""
    reason: str = Field(..., min_length=5, max_length=4000, description="Reason for cancellation")


class CancelSupplierOrderResponse(BaseModel):
    """Response from cancelling a supplier order."""
    success: bool = True
    orderId: int
    canceledAt: datetime
    reason: str
    message: str = "Order cancelled successfully"


# ==========================================================================
# Error Response Schemas
# ==========================================================================

class SupplierOrderErrorDetail(BaseModel):
    """Error detail information."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class SupplierOrderErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: SupplierOrderErrorDetail


# ==========================================================================
# Generic API Response
# ==========================================================================

class SupplierOrderAPIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None

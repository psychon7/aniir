"""
Order Pydantic schemas for API request/response validation.
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Enums
# ==========================================================================

class OrderStatus(str, Enum):
    """Order status enum."""
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class FulfillmentStatus(str, Enum):
    """Shopify fulfillment status."""
    UNFULFILLED = "unfulfilled"
    PARTIAL = "partial"
    FULFILLED = "fulfilled"
    RESTOCKED = "restocked"


class FinancialStatus(str, Enum):
    """Shopify financial status."""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    PARTIALLY_REFUNDED = "partially_refunded"
    REFUNDED = "refunded"
    VOIDED = "voided"


class SyncStatus(str, Enum):
    """Order sync status."""
    PENDING = "pending"
    SYNCED = "synced"
    ERROR = "error"


# ==========================================================================
# Order Line Schemas
# ==========================================================================

class OrderLineBase(BaseModel):
    """Base order line schema."""
    orl_description: str = Field(..., min_length=1, max_length=500)
    orl_quantity: Decimal = Field(..., gt=0)
    orl_unit_price: Decimal = Field(..., ge=0)
    orl_discount: Decimal = Field(default=Decimal("0"), ge=0)
    orl_discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    orl_vat_id: Optional[int] = None
    orl_tax_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)
    orl_taxable: bool = True
    orl_prd_id: Optional[int] = None
    orl_sku: Optional[str] = Field(default=None, max_length=100)
    orl_variant_title: Optional[str] = Field(default=None, max_length=200)
    orl_sort_order: int = 0
    orl_notes: Optional[str] = None


class OrderLineCreate(OrderLineBase):
    """Schema for creating an order line."""
    # Shopify fields (optional)
    orl_shopify_line_id: Optional[str] = None
    orl_shopify_variant_id: Optional[str] = None
    orl_shopify_product_id: Optional[str] = None


class OrderLineUpdate(BaseModel):
    """Schema for updating an order line."""
    orl_description: Optional[str] = Field(default=None, max_length=500)
    orl_quantity: Optional[Decimal] = Field(default=None, gt=0)
    orl_unit_price: Optional[Decimal] = Field(default=None, ge=0)
    orl_discount: Optional[Decimal] = Field(default=None, ge=0)
    orl_discount_percent: Optional[Decimal] = Field(default=None, ge=0, le=100)
    orl_vat_id: Optional[int] = None
    orl_tax_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)
    orl_taxable: Optional[bool] = None
    orl_prd_id: Optional[int] = None
    orl_sku: Optional[str] = Field(default=None, max_length=100)
    orl_variant_title: Optional[str] = Field(default=None, max_length=200)
    orl_fulfilled_quantity: Optional[Decimal] = Field(default=None, ge=0)
    orl_fulfillment_status: Optional[str] = None
    orl_sort_order: Optional[int] = None
    orl_notes: Optional[str] = None


class OrderLineResponse(OrderLineBase):
    """Schema for order line response."""
    model_config = ConfigDict(from_attributes=True)

    orl_id: int
    orl_ord_id: int
    orl_line_number: int
    orl_vat_amount: Decimal
    orl_line_total: Decimal
    orl_fulfilled_quantity: Decimal
    orl_fulfillment_status: Optional[str] = None

    # Shopify fields
    orl_shopify_line_id: Optional[str] = None
    orl_shopify_variant_id: Optional[str] = None
    orl_shopify_product_id: Optional[str] = None

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        """Calculate subtotal before VAT (quantity * unit_price - discount)."""
        base = self.orl_quantity * self.orl_unit_price
        return base - self.orl_discount

    @computed_field
    @property
    def is_fully_fulfilled(self) -> bool:
        """Check if line is fully fulfilled."""
        return self.orl_fulfilled_quantity >= self.orl_quantity

    @computed_field
    @property
    def remaining_quantity(self) -> Decimal:
        """Get remaining quantity to fulfill."""
        return self.orl_quantity - self.orl_fulfilled_quantity


# ==========================================================================
# Address Schemas
# ==========================================================================

class AddressSchema(BaseModel):
    """Address schema for orders."""
    address: Optional[str] = Field(default=None, max_length=200)
    address2: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    country_id: Optional[int] = None
    country_code: Optional[str] = Field(default=None, max_length=3)


# ==========================================================================
# Order Schemas
# ==========================================================================

class OrderBase(BaseModel):
    """Base order schema."""
    ord_cli_id: int
    ord_date: datetime
    ord_expected_delivery_date: Optional[datetime] = None
    ord_cur_id: int
    ord_pay_mode_id: Optional[int] = None
    ord_notes: Optional[str] = None
    ord_internal_notes: Optional[str] = None
    ord_bu_id: Optional[int] = None
    ord_soc_id: Optional[int] = None

    # Customer info
    ord_customer_email: Optional[str] = Field(default=None, max_length=200)
    ord_customer_phone: Optional[str] = Field(default=None, max_length=50)
    ord_customer_first_name: Optional[str] = Field(default=None, max_length=100)
    ord_customer_last_name: Optional[str] = Field(default=None, max_length=100)


class OrderCreate(OrderBase):
    """Schema for creating an order."""
    ord_reference: Optional[str] = Field(default=None, max_length=50)

    # Addresses
    shipping_address: Optional[AddressSchema] = None
    billing_address: Optional[AddressSchema] = None

    # Order lines
    lines: List[OrderLineCreate] = Field(default_factory=list)

    # Shopify fields (optional, for sync)
    ord_shopify_id: Optional[str] = None
    ord_shopify_name: Optional[str] = None
    ord_shopify_created_at: Optional[datetime] = None
    ord_shopify_updated_at: Optional[datetime] = None
    ord_fulfillment_status: Optional[str] = None
    ord_financial_status: Optional[str] = None

    # Totals (optional, will be calculated if not provided)
    ord_sub_total: Optional[Decimal] = None
    ord_total_vat: Optional[Decimal] = None
    ord_total_amount: Optional[Decimal] = None
    ord_discount: Optional[Decimal] = None
    ord_shipping_amount: Optional[Decimal] = None
    ord_tax_amount: Optional[Decimal] = None


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    ord_cli_id: Optional[int] = None
    ord_sta_id: Optional[int] = None
    ord_expected_delivery_date: Optional[datetime] = None
    ord_delivery_date: Optional[datetime] = None
    ord_fulfillment_status: Optional[str] = None
    ord_financial_status: Optional[str] = None
    ord_pay_mode_id: Optional[int] = None
    ord_notes: Optional[str] = None
    ord_internal_notes: Optional[str] = None

    # Addresses
    shipping_address: Optional[AddressSchema] = None
    billing_address: Optional[AddressSchema] = None

    # Customer info
    ord_customer_email: Optional[str] = Field(default=None, max_length=200)
    ord_customer_phone: Optional[str] = Field(default=None, max_length=50)
    ord_customer_first_name: Optional[str] = Field(default=None, max_length=100)
    ord_customer_last_name: Optional[str] = Field(default=None, max_length=100)

    # Shopify sync fields
    ord_shopify_updated_at: Optional[datetime] = None
    ord_synced_at: Optional[datetime] = None
    ord_sync_status: Optional[str] = None
    ord_sync_error: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    model_config = ConfigDict(from_attributes=True)

    ord_id: int
    ord_reference: str
    ord_cli_id: int
    ord_date: datetime
    ord_expected_delivery_date: Optional[datetime] = None
    ord_delivery_date: Optional[datetime] = None
    ord_sta_id: int
    ord_fulfillment_status: Optional[str] = None
    ord_financial_status: Optional[str] = None
    ord_cur_id: int

    # Totals
    ord_sub_total: Decimal
    ord_total_vat: Decimal
    ord_total_amount: Decimal
    ord_discount: Optional[Decimal] = None
    ord_shipping_amount: Optional[Decimal] = None
    ord_tax_amount: Optional[Decimal] = None

    # Shopify
    ord_shopify_id: Optional[str] = None
    ord_shopify_name: Optional[str] = None
    ord_shopify_created_at: Optional[datetime] = None
    ord_shopify_updated_at: Optional[datetime] = None

    # Shipping
    ord_shipping_address: Optional[str] = None
    ord_shipping_city: Optional[str] = None
    ord_shipping_postal_code: Optional[str] = None
    ord_shipping_country_code: Optional[str] = None

    # Billing
    ord_billing_address: Optional[str] = None
    ord_billing_city: Optional[str] = None
    ord_billing_postal_code: Optional[str] = None
    ord_billing_country_code: Optional[str] = None

    # Customer
    ord_customer_email: Optional[str] = None
    ord_customer_phone: Optional[str] = None
    ord_customer_first_name: Optional[str] = None
    ord_customer_last_name: Optional[str] = None

    # Sync
    ord_synced_at: Optional[datetime] = None
    ord_sync_status: Optional[str] = None

    # Flags
    ord_is_cancelled: bool
    ord_cancelled_at: Optional[datetime] = None

    # Organization
    ord_bu_id: Optional[int] = None
    ord_soc_id: Optional[int] = None

    # Notes
    ord_notes: Optional[str] = None

    # Audit
    ord_created_at: datetime
    ord_updated_at: Optional[datetime] = None

    @computed_field
    @property
    def is_shopify_order(self) -> bool:
        """Check if this order originated from Shopify."""
        return self.ord_shopify_id is not None

    @computed_field
    @property
    def customer_full_name(self) -> Optional[str]:
        """Get customer full name."""
        if self.ord_customer_first_name and self.ord_customer_last_name:
            return f"{self.ord_customer_first_name} {self.ord_customer_last_name}"
        return self.ord_customer_first_name or self.ord_customer_last_name

    @computed_field
    @property
    def balance_due(self) -> Decimal:
        """Calculate remaining balance (for orders, typically the total amount)."""
        return self.ord_total_amount


class OrderDetailResponseLegacy(OrderResponse):
    """Schema for order detail response with lines (legacy Shopify order format)."""
    lines: List[OrderLineResponse] = Field(default_factory=list)

    @computed_field
    @property
    def line_count(self) -> int:
        """Get number of lines."""
        return len(self.lines)

    @computed_field
    @property
    def total_quantity(self) -> Decimal:
        """Get total quantity across all lines."""
        if not self.lines:
            return Decimal("0")
        return sum(line.orl_quantity for line in self.lines)


# ==========================================================================
# Client Order Detail Response (TM_COD_Client_Order - camelCase)
# ==========================================================================


class OrderDetailResponse(BaseModel):
    """
    Schema for client order detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /orders/{order_id} endpoint.
    Maps to TM_COD_Client_Order table.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="cod_id", description="Order ID")
    code: str = Field(..., validation_alias="cod_code", description="Order code/reference")
    name: Optional[str] = Field(None, validation_alias="cod_name", description="Order name/description")

    # Timestamps
    createdAt: datetime = Field(..., validation_alias="cod_d_creation", description="Creation timestamp")
    updatedAt: datetime = Field(..., validation_alias="cod_d_update", description="Last update timestamp")
    preDeliveryFrom: Optional[datetime] = Field(None, validation_alias="cod_d_pre_delivery_from", description="Pre-delivery date from")
    preDeliveryTo: Optional[datetime] = Field(None, validation_alias="cod_d_pre_delivery_to", description="Pre-delivery date to")
    endWorkDate: Optional[datetime] = Field(None, validation_alias="cod_d_end_work", description="End of work date")

    # Foreign key IDs
    clientId: int = Field(..., validation_alias="cli_id", description="Client ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT rate ID")
    projectId: int = Field(..., validation_alias="prj_id", description="Project ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    costPlanId: Optional[int] = Field(None, validation_alias="cpl_id", description="Cost plan/quote ID")
    invoicingContactId: Optional[int] = Field(None, validation_alias="cco_id_invoicing", description="Invoicing contact ID")

    # Header/footer text
    headerText: Optional[str] = Field(None, validation_alias="cod_header_text", description="Header text")
    footerText: Optional[str] = Field(None, validation_alias="cod_footer_text", description="Footer text")

    # Comments
    clientComment: Optional[str] = Field(None, validation_alias="cod_client_comment", description="Comment visible to client")
    internalComment: Optional[str] = Field(None, validation_alias="cod_inter_comment", description="Internal comment")

    # Discounts
    discountPercentage: Optional[Decimal] = Field(None, validation_alias="cod_discount_percentage", description="Discount percentage")
    discountAmount: Optional[Decimal] = Field(None, validation_alias="cod_discount_amount", description="Discount amount")

    # File attachment
    file: Optional[str] = Field(None, validation_alias="cod_file", description="Attached file path")

    # Key project flag
    keyProject: Optional[bool] = Field(None, validation_alias="cod_key_project", description="Key project flag")

    # Creator and commercial users
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")
    commercialUser1Id: Optional[int] = Field(None, validation_alias="usr_com_1", description="Commercial user 1 ID")
    commercialUser2Id: Optional[int] = Field(None, validation_alias="usr_com_2", description="Commercial user 2 ID")
    commercialUser3Id: Optional[int] = Field(None, validation_alias="usr_com_3", description="Commercial user 3 ID")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # These are not from the ORM directly but enriched data
    # =====================================================
    clientName: Optional[str] = Field(None, description="Resolved client company name")
    clientReference: Optional[str] = Field(None, description="Resolved client reference")
    societyName: Optional[str] = Field(None, description="Resolved society name")
    projectName: Optional[str] = Field(None, description="Resolved project name")
    projectCode: Optional[str] = Field(None, description="Resolved project code")
    paymentModeName: Optional[str] = Field(None, description="Resolved payment mode name")
    paymentConditionName: Optional[str] = Field(None, description="Resolved payment condition name")
    paymentTermDays: Optional[int] = Field(None, description="Payment term total days")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get order's display name (code + name if available)."""
        if self.name:
            return f"{self.code} - {self.name}"
        return self.code


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class OrderSearchParams(BaseModel):
    """Schema for order search/filter parameters."""
    reference: Optional[str] = None
    client_id: Optional[int] = None
    status_id: Optional[int] = None
    fulfillment_status: Optional[str] = None
    financial_status: Optional[str] = None
    shopify_id: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    currency_id: Optional[int] = None
    society_id: Optional[int] = None
    bu_id: Optional[int] = None
    is_cancelled: Optional[bool] = None
    sync_status: Optional[str] = None

    # Pagination
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = "ord_created_at"
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class OrderListResponse(BaseModel):
    """Schema for paginated order list response."""
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==========================================================================
# Shopify Order Webhook Schemas
# ==========================================================================

class ShopifyAddress(BaseModel):
    """Shopify address from webhook."""
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    zip: Optional[str] = None
    country_code: Optional[str] = None
    country: Optional[str] = None
    province: Optional[str] = None
    province_code: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None


class ShopifyLineItem(BaseModel):
    """Shopify line item from webhook."""
    id: int
    variant_id: Optional[int] = None
    product_id: Optional[int] = None
    title: str
    variant_title: Optional[str] = None
    sku: Optional[str] = None
    quantity: int
    price: str  # Shopify sends as string
    discount_allocations: List[dict] = Field(default_factory=list)
    tax_lines: List[dict] = Field(default_factory=list)
    taxable: bool = True
    fulfillable_quantity: int = 0
    fulfillment_status: Optional[str] = None


class ShopifyCustomer(BaseModel):
    """Shopify customer from webhook."""
    id: int
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class ShopifyOrderWebhook(BaseModel):
    """Schema for Shopify order webhook payload."""
    id: int
    name: str  # Order number like "#1001"
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: str
    updated_at: str
    currency: str
    financial_status: Optional[str] = None
    fulfillment_status: Optional[str] = None
    total_price: str
    subtotal_price: str
    total_tax: str
    total_discounts: str
    total_shipping_price_set: Optional[dict] = None
    line_items: List[ShopifyLineItem] = Field(default_factory=list)
    shipping_address: Optional[ShopifyAddress] = None
    billing_address: Optional[ShopifyAddress] = None
    customer: Optional[ShopifyCustomer] = None
    note: Optional[str] = None
    cancelled_at: Optional[str] = None
    cancel_reason: Optional[str] = None
    tags: Optional[str] = None


# ==========================================================================
# Task Result Schemas
# ==========================================================================

class OrderSyncResult(BaseModel):
    """Result of order sync operation."""
    success: bool
    order_id: Optional[int] = None
    shopify_id: str
    action: str  # "created" or "updated"
    message: Optional[str] = None
    error: Optional[str] = None


# ==========================================================================
# Order Action Schemas
# ==========================================================================

class CancelOrderRequest(BaseModel):
    """Request to cancel an order."""
    reason: str = Field(..., min_length=5, max_length=500, description="Reason for cancellation")
    notify_customer: bool = Field(default=False, description="Whether to notify the customer")


class CancelOrderResponse(BaseModel):
    """Response from cancelling an order."""
    success: bool = True
    order_id: int
    cancelled_at: datetime
    reason: str


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    status_id: int = Field(..., description="New status ID")
    notes: Optional[str] = Field(None, description="Optional notes for the status change")


class UpdateOrderStatusResponse(BaseModel):
    """Response from updating order status."""
    success: bool = True
    order_id: int
    old_status_id: int
    new_status_id: int
    updated_at: datetime


class ConvertOrderToInvoiceRequest(BaseModel):
    """Request to convert an order to an invoice."""
    invoice_date: Optional[datetime] = Field(None, description="Invoice date (defaults to now)")
    due_date: Optional[datetime] = Field(None, description="Invoice due date")
    include_all_lines: bool = Field(default=True, description="Include all order lines")
    line_ids: Optional[List[int]] = Field(None, description="Specific line IDs to include")
    notes: Optional[str] = Field(None, description="Additional invoice notes")


class ConvertOrderToInvoiceResponse(BaseModel):
    """Response from converting order to invoice."""
    success: bool = True
    order_id: int
    invoice_id: int
    invoice_reference: str
    converted_at: datetime
    lines_converted: int


class DuplicateOrderRequest(BaseModel):
    """Request to duplicate an order."""
    new_client_id: Optional[int] = Field(None, description="New client ID (defaults to same client)")
    new_date: Optional[datetime] = Field(None, description="New order date (defaults to now)")


class DuplicateOrderResponse(BaseModel):
    """Response from duplicating an order."""
    success: bool = True
    original_order_id: int
    new_order_id: int
    new_order_reference: str
    lines_copied: int


class FulfillOrderLineRequest(BaseModel):
    """Request to fulfill order lines."""
    line_id: int = Field(..., description="Order line ID to fulfill")
    quantity: Decimal = Field(..., gt=0, description="Quantity to fulfill")


class FulfillOrderRequest(BaseModel):
    """Request to fulfill multiple order lines."""
    lines: List[FulfillOrderLineRequest] = Field(..., min_length=1, description="Lines to fulfill")
    tracking_number: Optional[str] = Field(None, max_length=100, description="Tracking number")
    carrier: Optional[str] = Field(None, max_length=100, description="Shipping carrier")


class FulfillOrderResponse(BaseModel):
    """Response from fulfilling order."""
    success: bool = True
    order_id: int
    fulfilled_lines: int
    fulfillment_status: str
    tracking_number: Optional[str] = None


# ==========================================================================
# Order Statistics Schema
# ==========================================================================

class OrderStatistics(BaseModel):
    """Order statistics."""
    total_orders: int = 0
    total_amount: Decimal = Decimal("0")
    total_cancelled: int = 0
    count_by_status: Dict[str, int] = {}
    count_by_fulfillment_status: Dict[str, int] = {}
    count_by_financial_status: Dict[str, int] = {}
    average_order_amount: Decimal = Decimal("0")
    shopify_orders: int = 0
    manual_orders: int = 0


class OrderStatisticsResponse(BaseModel):
    """Response for order statistics."""
    success: bool = True
    statistics: OrderStatistics
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    filters: Dict[str, Any] = {}


# ==========================================================================
# Error Response Schema
# ==========================================================================

class OrderErrorDetail(BaseModel):
    """Error detail information."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class OrderErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: OrderErrorDetail


# ==========================================================================
# Generic API Response
# ==========================================================================

class OrderAPIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None

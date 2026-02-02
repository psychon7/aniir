"""
Pydantic schemas for CostPlan (Quote) operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field


class CostPlanStatus(str, Enum):
    """CostPlan status options."""
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CONVERTED = "CONVERTED"
    CANCELLED = "CANCELLED"


# =====================
# CostPlanLine Schemas
# =====================

class CostPlanLineBase(BaseModel):
    """Base schema for CostPlanLine."""
    cpl_prd_id: Optional[int] = Field(None, description="Product ID (optional for free-text lines)")
    cpl_description: str = Field(..., max_length=500, description="Line description")
    cpl_quantity: Decimal = Field(..., gt=0, description="Quantity")
    cpl_unit_price: Decimal = Field(..., ge=0, description="Unit price")
    cpl_discount: Decimal = Field(default=Decimal("0"), ge=0, le=100, description="Discount percentage")
    cpl_vat_id: int = Field(..., description="VAT rate ID")
    cpl_sort_order: int = Field(default=0, description="Sort order for display")


class CostPlanLineCreate(CostPlanLineBase):
    """Schema for creating a CostPlanLine."""
    pass


class CostPlanLineUpdate(BaseModel):
    """Schema for updating a CostPlanLine."""
    cpl_prd_id: Optional[int] = None
    cpl_description: Optional[str] = Field(None, max_length=500)
    cpl_quantity: Optional[Decimal] = Field(None, gt=0)
    cpl_unit_price: Optional[Decimal] = Field(None, ge=0)
    cpl_discount: Optional[Decimal] = Field(None, ge=0, le=100)
    cpl_vat_id: Optional[int] = None
    cpl_sort_order: Optional[int] = None


class CostPlanLineResponse(CostPlanLineBase):
    """Schema for CostPlanLine response."""
    model_config = ConfigDict(from_attributes=True)

    cpl_id: int
    cpl_cp_id: int
    cpl_line_number: int
    cpl_vat_amount: Decimal = Decimal("0")
    cpl_line_total: Decimal = Decimal("0")

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        """Calculate subtotal before VAT."""
        base = self.cpl_quantity * self.cpl_unit_price
        if self.cpl_discount and self.cpl_discount > 0:
            discount_amount = base * (self.cpl_discount / Decimal("100"))
            return base - discount_amount
        return base


# =====================
# CostPlan Schemas
# =====================

class CostPlanBase(BaseModel):
    """Base schema for CostPlan."""
    cp_cli_id: int = Field(..., description="Client ID")
    cp_date: datetime = Field(..., description="Cost plan date")
    cp_valid_until: Optional[datetime] = Field(None, description="Valid until date")
    cp_sta_id: int = Field(..., description="Status ID")
    cp_cur_id: int = Field(..., description="Currency ID")

    # Shipping address
    cp_shipping_address: Optional[str] = Field(None, max_length=200, description="Shipping address")
    cp_shipping_city: Optional[str] = Field(None, max_length=100, description="Shipping city")
    cp_shipping_postal_code: Optional[str] = Field(None, max_length=20, description="Shipping postal code")
    cp_shipping_country_id: Optional[int] = Field(None, description="Shipping country ID")

    # Billing address
    cp_billing_address: Optional[str] = Field(None, max_length=200, description="Billing address")
    cp_billing_city: Optional[str] = Field(None, max_length=100, description="Billing city")
    cp_billing_postal_code: Optional[str] = Field(None, max_length=20, description="Billing postal code")
    cp_billing_country_id: Optional[int] = Field(None, description="Billing country ID")

    # Discount
    cp_discount: Optional[Decimal] = Field(None, ge=0, le=100, description="Overall discount percentage")

    # Notes
    cp_notes: Optional[str] = Field(None, description="Customer-facing notes")
    cp_internal_notes: Optional[str] = Field(None, description="Internal notes (not visible to customer)")
    cp_terms_conditions: Optional[str] = Field(None, description="Terms and conditions")

    # Organization
    cp_bu_id: Optional[int] = Field(None, description="Business unit ID")
    cp_soc_id: Optional[int] = Field(None, description="Society ID")


class CostPlanCreate(CostPlanBase):
    """Schema for creating a CostPlan."""
    lines: Optional[List[CostPlanLineCreate]] = Field(default=None, description="Cost plan lines")


class CostPlanUpdate(BaseModel):
    """Schema for updating a CostPlan."""
    cp_cli_id: Optional[int] = None
    cp_date: Optional[datetime] = None
    cp_valid_until: Optional[datetime] = None
    cp_sta_id: Optional[int] = None
    cp_cur_id: Optional[int] = None

    # Shipping address
    cp_shipping_address: Optional[str] = Field(None, max_length=200)
    cp_shipping_city: Optional[str] = Field(None, max_length=100)
    cp_shipping_postal_code: Optional[str] = Field(None, max_length=20)
    cp_shipping_country_id: Optional[int] = None

    # Billing address
    cp_billing_address: Optional[str] = Field(None, max_length=200)
    cp_billing_city: Optional[str] = Field(None, max_length=100)
    cp_billing_postal_code: Optional[str] = Field(None, max_length=20)
    cp_billing_country_id: Optional[int] = None

    # Discount
    cp_discount: Optional[Decimal] = Field(None, ge=0, le=100)

    # Notes
    cp_notes: Optional[str] = None
    cp_internal_notes: Optional[str] = None
    cp_terms_conditions: Optional[str] = None

    # Organization
    cp_bu_id: Optional[int] = None
    cp_soc_id: Optional[int] = None


class CostPlanResponse(CostPlanBase):
    """Schema for CostPlan response."""
    model_config = ConfigDict(from_attributes=True)

    cp_id: int
    cp_reference: str

    # Totals
    cp_sub_total: Decimal = Decimal("0")
    cp_total_vat: Decimal = Decimal("0")
    cp_total_amount: Decimal = Decimal("0")

    # PDF tracking
    cp_pdf_url: Optional[str] = None
    cp_pdf_generated_at: Optional[datetime] = None

    # Conversion tracking
    cp_converted_to_order: bool = False
    cp_ord_id: Optional[int] = None
    cp_converted_at: Optional[datetime] = None

    # Audit
    cp_created_by: Optional[int] = None
    cp_created_at: datetime
    cp_updated_at: Optional[datetime] = None

    @computed_field
    @property
    def is_expired(self) -> bool:
        """Check if cost plan is expired."""
        if self.cp_valid_until is None:
            return False
        return datetime.now() > self.cp_valid_until

    @computed_field
    @property
    def can_convert_to_order(self) -> bool:
        """Check if cost plan can be converted to an order."""
        return not self.cp_converted_to_order and not self.is_expired


class CostPlanDetailResponseLegacy(CostPlanResponse):
    """Schema for detailed CostPlan response with lines (legacy format)."""
    lines: List[CostPlanLineResponse] = []

    @computed_field
    @property
    def line_count(self) -> int:
        """Get number of lines."""
        return len(self.lines)


# ==========================================================================
# Quote (CostPlan) Detail Response - camelCase with validation_alias
# ==========================================================================


class QuoteDetailResponse(BaseModel):
    """
    Schema for quote/cost plan detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /quotes/{quote_id} endpoint.
    Maps to TM_CPL_Cost_Plan table.

    This follows the same pattern as ClientDetailResponse.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="cpl_id", description="Quote/Cost Plan ID")
    code: str = Field(..., validation_alias="cpl_code", description="Quote code/reference")
    name: Optional[str] = Field(None, validation_alias="cpl_name", description="Quote name/description")

    # Status
    statusId: int = Field(..., validation_alias="cst_id", description="Cost status ID")

    # Timestamps
    createdAt: datetime = Field(..., validation_alias="cpl_d_creation", description="Creation timestamp")
    updatedAt: datetime = Field(..., validation_alias="cpl_d_update", description="Last update timestamp")
    validityDate: datetime = Field(..., validation_alias="cpl_d_validity", description="Validity date")
    preDeliveryDate: Optional[datetime] = Field(None, validation_alias="cpl_d_pre_delivery", description="Pre-delivery date")
    endWorkDate: Optional[datetime] = Field(None, validation_alias="cpl_d_end_work", description="End of work date")

    # Foreign key IDs
    clientId: int = Field(..., validation_alias="cli_id", description="Client ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT rate ID")
    projectId: int = Field(..., validation_alias="prj_id", description="Project ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    invoicingContactId: Optional[int] = Field(None, validation_alias="cco_id_invoicing", description="Invoicing contact ID")

    # Header/footer text
    headerText: Optional[str] = Field(None, validation_alias="cpl_header_text", description="Header text")
    footerText: Optional[str] = Field(None, validation_alias="cpl_footer_text", description="Footer text")

    # Comments
    clientComment: Optional[str] = Field(None, validation_alias="cpl_client_comment", description="Comment visible to client")
    internalComment: Optional[str] = Field(None, validation_alias="cpl_inter_comment", description="Internal comment")

    # Discounts
    discountPercentage: Optional[Decimal] = Field(None, validation_alias="cpl_discount_percentage", description="Discount percentage")
    discountAmount: Optional[Decimal] = Field(None, validation_alias="cpl_discount_amount", description="Discount amount")

    # File attachment
    file: Optional[str] = Field(None, validation_alias="cpl_file", description="Attached file path")

    # Key project flag
    keyProject: Optional[bool] = Field(None, validation_alias="cpl_key_project", description="Key project flag")

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
        """Get quote's display name (code + name if available)."""
        if self.name:
            return f"{self.code} - {self.name}"
        return self.code

    @computed_field
    @property
    def isExpired(self) -> bool:
        """Check if quote is expired based on validity date."""
        return datetime.now() > self.validityDate


# Alias for backward compatibility - QuoteDetailResponse is the same as CostPlanDetailResponse
CostPlanDetailResponse = QuoteDetailResponse


# =====================
# Search/Filter Schemas
# =====================

class CostPlanSearchParams(BaseModel):
    """Search parameters for cost plans."""
    reference: Optional[str] = Field(None, description="Filter by reference (partial match)")
    client_id: Optional[int] = Field(None, description="Filter by client")
    status_id: Optional[int] = Field(None, description="Filter by status")
    date_from: Optional[datetime] = Field(None, description="Cost plan date from")
    date_to: Optional[datetime] = Field(None, description="Cost plan date to")
    valid_from: Optional[datetime] = Field(None, description="Valid until date from")
    valid_to: Optional[datetime] = Field(None, description="Valid until date to")
    converted_to_order: Optional[bool] = Field(None, description="Filter by conversion status")
    is_expired: Optional[bool] = Field(None, description="Filter by expiration status")
    society_id: Optional[int] = Field(None, description="Filter by society")
    bu_id: Optional[int] = Field(None, description="Filter by business unit")
    min_amount: Optional[Decimal] = Field(None, ge=0, description="Minimum total amount")
    max_amount: Optional[Decimal] = Field(None, ge=0, description="Maximum total amount")
    created_by: Optional[int] = Field(None, description="Filter by creator")
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: str = Field(default="cp_created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


class CostPlanListResponse(BaseModel):
    """Paginated list of cost plans."""
    items: List[CostPlanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# =====================
# Convert to Order Schema
# =====================

class CostPlanConvertRequest(BaseModel):
    """Schema for converting cost plan to order."""
    include_all_lines: bool = Field(default=True, description="Include all cost plan lines in order")
    line_ids: Optional[List[int]] = Field(None, description="Specific line IDs to include (if not all)")
    order_date: Optional[datetime] = Field(None, description="Order date (defaults to now)")
    notes: Optional[str] = Field(None, description="Additional order notes")


class CostPlanConvertResponse(BaseModel):
    """Schema for cost plan conversion result."""
    cost_plan_id: int
    order_id: int
    order_reference: str
    converted_at: datetime
    lines_converted: int


# =====================
# Duplicate CostPlan Schema
# =====================

class CostPlanDuplicateRequest(BaseModel):
    """Schema for duplicating a cost plan."""
    new_valid_until: Optional[datetime] = Field(None, description="New validity date")
    new_client_id: Optional[int] = Field(None, description="New client ID (defaults to same client)")
    include_lines: bool = Field(default=True, description="Include lines in duplicate")


class CostPlanDuplicateResponse(BaseModel):
    """Schema for cost plan duplication result."""
    original_cost_plan_id: int
    new_cost_plan_id: int
    new_cost_plan_reference: str
    lines_copied: int


# =====================
# Summary/Stats Schemas
# =====================

class CostPlanSummary(BaseModel):
    """Summary statistics for cost plans."""
    total_count: int = Field(..., description="Total number of cost plans")
    draft_count: int = Field(default=0, description="Number of draft cost plans")
    sent_count: int = Field(default=0, description="Number of sent cost plans")
    accepted_count: int = Field(default=0, description="Number of accepted cost plans")
    rejected_count: int = Field(default=0, description="Number of rejected cost plans")
    expired_count: int = Field(default=0, description="Number of expired cost plans")
    converted_count: int = Field(default=0, description="Number of converted cost plans")
    total_value: Decimal = Field(default=Decimal("0"), description="Total value of all cost plans")
    average_value: Decimal = Field(default=Decimal("0"), description="Average cost plan value")
    conversion_rate: Decimal = Field(default=Decimal("0"), description="Conversion rate percentage")

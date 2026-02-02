"""
Pydantic schemas for Delivery API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Delivery Form Line Schemas
# ==========================================================================

class DeliveryFormLineBase(BaseModel):
    """Base schema for DeliveryFormLine."""
    dfl_orl_id: int = Field(
        ...,
        description="Order line ID"
    )
    dfl_prd_id: Optional[int] = Field(
        None,
        description="Product ID"
    )
    dfl_pit_id: Optional[int] = Field(
        None,
        description="Product instance ID"
    )
    dfl_description: Optional[str] = Field(
        None,
        max_length=500,
        description="Line item description"
    )
    dfl_quantity: Decimal = Field(
        ...,
        ge=0,
        description="Quantity to deliver"
    )
    dfl_sort_order: int = Field(
        default=0,
        ge=0,
        description="Sort order for display"
    )


class DeliveryFormLineCreate(DeliveryFormLineBase):
    """Schema for creating a DeliveryFormLine."""
    pass


class DeliveryFormLineUpdate(BaseModel):
    """Schema for updating a DeliveryFormLine."""
    dfl_orl_id: Optional[int] = Field(
        None,
        description="Order line ID"
    )
    dfl_prd_id: Optional[int] = Field(
        None,
        description="Product ID"
    )
    dfl_pit_id: Optional[int] = Field(
        None,
        description="Product instance ID"
    )
    dfl_description: Optional[str] = Field(
        None,
        max_length=500,
        description="Line item description"
    )
    dfl_quantity: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Quantity to deliver"
    )
    dfl_sort_order: Optional[int] = Field(
        None,
        ge=0,
        description="Sort order for display"
    )


class DeliveryFormLineResponse(DeliveryFormLineBase):
    """Schema for DeliveryFormLine response."""
    model_config = ConfigDict(from_attributes=True)

    dfl_id: int = Field(..., description="Delivery form line ID")
    dfl_del_id: int = Field(..., description="Parent delivery form ID")


class DeliveryFormLineListResponse(BaseModel):
    """Schema for listing delivery form lines (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    dfl_id: int = Field(..., description="Delivery form line ID")
    dfl_del_id: int = Field(..., description="Parent delivery form ID")
    dfl_orl_id: int = Field(..., description="Order line ID")
    dfl_description: Optional[str] = Field(None, description="Description")
    dfl_quantity: Decimal = Field(..., description="Quantity")


# ==========================================================================
# Delivery Form Base Schemas
# ==========================================================================

class DeliveryFormBase(BaseModel):
    """Base schema for DeliveryForm."""
    del_reference: str = Field(
        ...,
        max_length=20,
        description="Delivery form reference number"
    )
    del_ord_id: int = Field(
        ...,
        description="Order ID"
    )
    del_cli_id: int = Field(
        ...,
        description="Client ID"
    )
    del_delivery_date: datetime = Field(
        ...,
        description="Expected delivery date"
    )
    del_sta_id: int = Field(
        ...,
        description="Status ID (Pending, Shipped, Delivered)"
    )
    del_car_id: Optional[int] = Field(
        None,
        description="Carrier ID"
    )
    del_tracking_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Tracking number"
    )
    del_shipping_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Shipping address"
    )
    del_shipping_city: Optional[str] = Field(
        None,
        max_length=100,
        description="Shipping city"
    )
    del_shipping_postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Shipping postal code"
    )
    del_shipping_country_id: Optional[int] = Field(
        None,
        description="Shipping country ID"
    )
    del_weight: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Total weight"
    )
    del_packages: int = Field(
        default=1,
        ge=1,
        description="Number of packages"
    )
    del_notes: Optional[str] = Field(
        None,
        description="Additional notes"
    )


class DeliveryFormCreate(DeliveryFormBase):
    """Schema for creating a DeliveryForm."""
    del_created_by: Optional[int] = Field(
        None,
        description="User ID of creator"
    )
    lines: List[DeliveryFormLineCreate] = Field(
        default_factory=list,
        description="Delivery form lines"
    )


class DeliveryFormUpdate(BaseModel):
    """Schema for updating a DeliveryForm."""
    del_reference: Optional[str] = Field(
        None,
        max_length=20,
        description="Delivery form reference number"
    )
    del_delivery_date: Optional[datetime] = Field(
        None,
        description="Expected delivery date"
    )
    del_sta_id: Optional[int] = Field(
        None,
        description="Status ID"
    )
    del_car_id: Optional[int] = Field(
        None,
        description="Carrier ID"
    )
    del_tracking_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Tracking number"
    )
    del_shipping_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Shipping address"
    )
    del_shipping_city: Optional[str] = Field(
        None,
        max_length=100,
        description="Shipping city"
    )
    del_shipping_postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Shipping postal code"
    )
    del_shipping_country_id: Optional[int] = Field(
        None,
        description="Shipping country ID"
    )
    del_weight: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Total weight"
    )
    del_packages: Optional[int] = Field(
        None,
        ge=1,
        description="Number of packages"
    )
    del_notes: Optional[str] = Field(
        None,
        description="Additional notes"
    )
    del_signed_by: Optional[str] = Field(
        None,
        max_length=100,
        description="Signature of recipient"
    )


class DeliveryFormResponse(DeliveryFormBase):
    """Schema for DeliveryForm response."""
    model_config = ConfigDict(from_attributes=True)

    del_id: int = Field(..., description="Delivery form ID")
    del_shipped_at: Optional[datetime] = Field(None, description="Shipped timestamp")
    del_delivered_at: Optional[datetime] = Field(None, description="Delivered timestamp")
    del_signed_by: Optional[str] = Field(None, description="Signed by")
    del_created_by: Optional[int] = Field(None, description="Creator user ID")
    del_created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    del_updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name."""
        return f"Delivery {self.del_reference}"

    @computed_field
    @property
    def is_shipped(self) -> bool:
        """Check if delivery has been shipped."""
        return self.del_shipped_at is not None

    @computed_field
    @property
    def is_delivered(self) -> bool:
        """Check if delivery has been completed."""
        return self.del_delivered_at is not None

    @computed_field
    @property
    def full_shipping_address(self) -> str:
        """Get formatted shipping address."""
        parts = []
        if self.del_shipping_address:
            parts.append(self.del_shipping_address)
        if self.del_shipping_city:
            parts.append(self.del_shipping_city)
        if self.del_shipping_postal_code:
            parts.append(self.del_shipping_postal_code)
        return ", ".join(parts) if parts else ""


class DeliveryFormWithLinesResponse(DeliveryFormResponse):
    """Schema for DeliveryForm response with lines."""
    lines: List[DeliveryFormLineResponse] = Field(
        default_factory=list,
        description="Delivery form lines"
    )

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
        return sum(line.dfl_quantity for line in self.lines)


class DeliveryDetailResponse(BaseModel):
    """
    Schema for delivery form detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /deliveries/{delivery_id} endpoint.
    Maps from actual TM_DFO_Delivery_Form table columns.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="dfo_id", description="Delivery form ID")
    code: str = Field(..., validation_alias="dfo_code", description="Delivery form code/reference")

    # Foreign key IDs
    orderId: int = Field(..., validation_alias="cod_id", description="Order ID")
    clientId: int = Field(..., validation_alias="cli_id", description="Client ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")

    # Dates
    createdAt: datetime = Field(..., validation_alias="dfo_d_creation", description="Creation timestamp")
    updatedAt: datetime = Field(..., validation_alias="dfo_d_update", description="Update timestamp")
    deliveryDate: datetime = Field(..., validation_alias="dfo_d_delivery", description="Delivery date")

    # Status flags
    isDelivered: bool = Field(..., validation_alias="dfo_deliveried", description="Is delivered flag")
    useClientAddress: Optional[bool] = Field(None, validation_alias="dfo_client_adr", description="Use client address flag")

    # Text fields
    headerText: Optional[str] = Field(None, validation_alias="dfo_header_text", description="Header text")
    footerText: Optional[str] = Field(None, validation_alias="dfo_footer_text", description="Footer text")
    deliveryComment: Optional[str] = Field(None, validation_alias="dfo_delivery_comment", description="Delivery comment")
    internalComment: Optional[str] = Field(None, validation_alias="dfo_inter_comment", description="Internal comment")

    # Delivery address snapshot
    dlvFirstname: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_firstname", description="Delivery address firstname")
    dlvLastname: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_lastname", description="Delivery address lastname")
    dlvAddress1: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_address1", description="Delivery address line 1")
    dlvAddress2: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_address2", description="Delivery address line 2")
    dlvPostcode: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_postcode", description="Delivery address postcode")
    dlvCity: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_city", description="Delivery address city")
    dlvCountry: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_country", description="Delivery address country")
    dlvPhone: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_tel1", description="Delivery address phone")
    dlvFax: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_fax", description="Delivery address fax")
    dlvMobile: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_cellphone", description="Delivery address mobile")
    dlvEmail: Optional[str] = Field(None, validation_alias="dfo_dlv_cco_email", description="Delivery address email")

    # File
    file: Optional[str] = Field(None, validation_alias="dfo_file", description="File path")

    # Google Docs number
    gdocNumber: Optional[int] = Field(None, validation_alias="dfo_gdoc_nb", description="Google Docs number")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # =====================================================
    clientName: Optional[str] = Field(None, description="Resolved client company name")
    orderReference: Optional[str] = Field(None, description="Resolved order reference code")
    societyName: Optional[str] = Field(None, description="Resolved society name")

    # Lines (included in detail response)
    lines: List[DeliveryFormLineResponse] = Field(default_factory=list, description="Delivery form lines")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get delivery form's display name."""
        return self.code or ""

    @computed_field
    @property
    def fullDeliveryAddress(self) -> Optional[str]:
        """Get formatted full delivery address."""
        parts = []
        if self.dlvAddress1:
            parts.append(self.dlvAddress1)
        if self.dlvAddress2:
            parts.append(self.dlvAddress2)
        if self.dlvPostcode or self.dlvCity:
            city_line = " ".join(filter(None, [self.dlvPostcode, self.dlvCity]))
            if city_line:
                parts.append(city_line)
        if self.dlvCountry:
            parts.append(self.dlvCountry)
        return ", ".join(parts) if parts else None

    @computed_field
    @property
    def contactFullName(self) -> Optional[str]:
        """Get full contact name."""
        if self.dlvFirstname and self.dlvLastname:
            return f"{self.dlvFirstname} {self.dlvLastname}"
        return self.dlvFirstname or self.dlvLastname


class DeliveryFormListResponse(BaseModel):
    """Schema for listing delivery forms (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    del_id: int = Field(..., description="Delivery form ID")
    del_reference: str = Field(..., description="Reference number")
    del_ord_id: int = Field(..., description="Order ID")
    del_cli_id: int = Field(..., description="Client ID")
    del_delivery_date: datetime = Field(..., description="Expected delivery date")
    del_sta_id: int = Field(..., description="Status ID")
    del_tracking_number: Optional[str] = Field(None, description="Tracking number")
    del_shipped_at: Optional[datetime] = Field(None, description="Shipped timestamp")
    del_delivered_at: Optional[datetime] = Field(None, description="Delivered timestamp")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name."""
        return f"Delivery {self.del_reference}"

    @computed_field
    @property
    def is_shipped(self) -> bool:
        """Check if shipped."""
        return self.del_shipped_at is not None

    @computed_field
    @property
    def is_delivered(self) -> bool:
        """Check if delivered."""
        return self.del_delivered_at is not None


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class DeliveryFormListPaginatedResponse(BaseModel):
    """Paginated response for delivery form list."""
    items: List[DeliveryFormListResponse] = Field(
        ...,
        description="List of delivery forms"
    )
    total: int = Field(
        ...,
        description="Total count of delivery forms"
    )
    skip: int = Field(
        ...,
        description="Number of items skipped"
    )
    limit: int = Field(
        ...,
        description="Maximum items returned"
    )


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class DeliveryFormSearchParams(BaseModel):
    """Search parameters for delivery form list."""
    search: Optional[str] = Field(None, description="Search term (reference, tracking number)")
    del_ord_id: Optional[int] = Field(None, description="Filter by order ID")
    del_cli_id: Optional[int] = Field(None, description="Filter by client ID")
    del_sta_id: Optional[int] = Field(None, description="Filter by status ID")
    del_car_id: Optional[int] = Field(None, description="Filter by carrier ID")
    date_from: Optional[datetime] = Field(None, description="Delivery date from")
    date_to: Optional[datetime] = Field(None, description="Delivery date to")
    is_shipped: Optional[bool] = Field(None, description="Filter by shipped status")
    is_delivered: Optional[bool] = Field(None, description="Filter by delivered status")
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum items to return")
    sort_by: Optional[str] = Field(default="del_delivery_date", description="Sort field")
    sort_order: Optional[str] = Field(default="desc", description="Sort order (asc/desc)")


# ==========================================================================
# Status Update Schemas
# ==========================================================================

class DeliveryShipRequest(BaseModel):
    """Request schema for marking a delivery as shipped."""
    del_tracking_number: Optional[str] = Field(
        None,
        max_length=100,
        description="Tracking number"
    )
    del_car_id: Optional[int] = Field(
        None,
        description="Carrier ID"
    )


class DeliveryDeliverRequest(BaseModel):
    """Request schema for marking a delivery as delivered."""
    del_signed_by: Optional[str] = Field(
        None,
        max_length=100,
        description="Name of person who signed for delivery"
    )


# ==========================================================================
# API Response Schemas
# ==========================================================================

class DeliveryFormAPIResponse(BaseModel):
    """Standard API response wrapper for delivery form operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[DeliveryFormResponse] = Field(
        None,
        description="Delivery form data"
    )


class DeliveryFormLineAPIResponse(BaseModel):
    """Standard API response wrapper for delivery form line operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[DeliveryFormLineResponse] = Field(
        None,
        description="Delivery form line data"
    )


class DeliveryFormErrorResponse(BaseModel):
    """Error response for delivery form operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

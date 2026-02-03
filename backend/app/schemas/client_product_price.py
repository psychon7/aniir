"""
Pydantic schemas for Client Product Price API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Client Product Price Base Schemas
# ==========================================================================

class ClientProductPriceBase(BaseModel):
    """Base schema for Client Product Price."""
    cpp_cli_id: int = Field(
        ...,
        description="Client ID (FK to TM_CLI_Client)"
    )
    cpp_prd_id: int = Field(
        ...,
        description="Product ID (FK to TM_PRD_Product)"
    )
    cpp_unit_price: Decimal = Field(
        ...,
        ge=0,
        description="Unit price for this client"
    )
    cpp_discount_percent: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Discount percentage"
    )
    cpp_min_quantity: Optional[int] = Field(
        None,
        ge=1,
        description="Minimum quantity for this price"
    )
    cpp_max_quantity: Optional[int] = Field(
        None,
        ge=1,
        description="Maximum quantity for this price"
    )
    cpp_cur_id: Optional[int] = Field(
        None,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    cpp_valid_from: Optional[datetime] = Field(
        None,
        description="Price valid from date"
    )
    cpp_valid_to: Optional[datetime] = Field(
        None,
        description="Price valid to date"
    )
    cpp_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Notes about this price"
    )
    cpp_is_active: bool = Field(
        True,
        description="Whether this price is active"
    )


class ClientProductPriceCreate(ClientProductPriceBase):
    """Schema for creating a Client Product Price."""
    cpp_created_by: Optional[int] = Field(
        None,
        description="User ID who created the price"
    )


class ClientProductPriceUpdate(BaseModel):
    """Schema for updating a Client Product Price (all fields optional)."""
    cpp_unit_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Unit price for this client"
    )
    cpp_discount_percent: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Discount percentage"
    )
    cpp_min_quantity: Optional[int] = Field(
        None,
        ge=1,
        description="Minimum quantity for this price"
    )
    cpp_max_quantity: Optional[int] = Field(
        None,
        ge=1,
        description="Maximum quantity for this price"
    )
    cpp_cur_id: Optional[int] = Field(
        None,
        description="Currency ID"
    )
    cpp_valid_from: Optional[datetime] = Field(
        None,
        description="Price valid from date"
    )
    cpp_valid_to: Optional[datetime] = Field(
        None,
        description="Price valid to date"
    )
    cpp_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Notes about this price"
    )
    cpp_is_active: Optional[bool] = Field(
        None,
        description="Whether this price is active"
    )
    cpp_updated_by: Optional[int] = Field(
        None,
        description="User ID who updated the price"
    )


class ClientProductPriceResponse(ClientProductPriceBase):
    """Schema for Client Product Price response."""
    model_config = ConfigDict(from_attributes=True)

    cpp_id: int = Field(..., description="Price ID")
    cpp_soc_id: Optional[int] = Field(None, description="Society ID")
    cpp_d_creation: Optional[datetime] = Field(None, description="Creation timestamp")
    cpp_d_update: Optional[datetime] = Field(None, description="Last update timestamp")
    cpp_created_by: Optional[int] = Field(None, description="Created by user ID")
    cpp_updated_by: Optional[int] = Field(None, description="Updated by user ID")

    @computed_field
    @property
    def is_valid_now(self) -> bool:
        """Check if the price is currently valid."""
        if not self.cpp_is_active:
            return False
        now = datetime.utcnow()
        if self.cpp_valid_from and now < self.cpp_valid_from:
            return False
        if self.cpp_valid_to and now > self.cpp_valid_to:
            return False
        return True


class ClientProductPriceListResponse(BaseModel):
    """Schema for listing client product prices (with product info)."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Price fields
    id: int = Field(..., validation_alias="cpp_id", description="Price ID")
    clientId: int = Field(..., validation_alias="cpp_cli_id", description="Client ID")
    productId: int = Field(..., validation_alias="cpp_prd_id", description="Product ID")
    unitPrice: Decimal = Field(..., validation_alias="cpp_unit_price", description="Unit price")
    discountPercent: Optional[Decimal] = Field(None, validation_alias="cpp_discount_percent", description="Discount %")
    minQuantity: Optional[int] = Field(None, validation_alias="cpp_min_quantity", description="Min quantity")
    maxQuantity: Optional[int] = Field(None, validation_alias="cpp_max_quantity", description="Max quantity")
    currencyId: Optional[int] = Field(None, validation_alias="cpp_cur_id", description="Currency ID")
    validFrom: Optional[datetime] = Field(None, validation_alias="cpp_valid_from", description="Valid from")
    validTo: Optional[datetime] = Field(None, validation_alias="cpp_valid_to", description="Valid to")
    isActive: bool = Field(..., validation_alias="cpp_is_active", description="Is active")
    notes: Optional[str] = Field(None, validation_alias="cpp_notes", description="Notes")

    # Resolved product info (populated by service)
    productReference: Optional[str] = Field(None, description="Product reference")
    productName: Optional[str] = Field(None, description="Product name")
    currencyCode: Optional[str] = Field(None, description="Currency code")

    @computed_field
    @property
    def isValidNow(self) -> bool:
        """Check if the price is currently valid."""
        if not self.isActive:
            return False
        now = datetime.utcnow()
        if self.validFrom and now < self.validFrom:
            return False
        if self.validTo and now > self.validTo:
            return False
        return True


# ==========================================================================
# Pagination Schemas
# ==========================================================================

class ClientProductPriceListPaginatedResponse(BaseModel):
    """Paginated response for client product price list."""
    success: bool = Field(default=True)
    data: List[ClientProductPriceListResponse] = Field(..., description="List of prices")
    page: int = Field(..., description="Current page")
    pageSize: int = Field(..., description="Items per page")
    totalCount: int = Field(..., description="Total count")
    totalPages: int = Field(..., description="Total pages")
    hasNextPage: bool = Field(..., description="Has next page")
    hasPreviousPage: bool = Field(..., description="Has previous page")


# ==========================================================================
# API Response Schemas
# ==========================================================================

class ClientProductPriceAPIResponse(BaseModel):
    """Standard API response wrapper for client product price operations."""
    success: bool = Field(True)
    message: Optional[str] = Field(None)
    data: Optional[ClientProductPriceResponse] = Field(None)


class ClientProductPriceBulkCreateRequest(BaseModel):
    """Request for bulk creating client product prices."""
    prices: List[ClientProductPriceCreate] = Field(..., min_length=1, description="List of prices to create")


class ClientProductPriceBulkResponse(BaseModel):
    """Response for bulk operations."""
    success: bool = Field(True)
    created_count: int = Field(..., description="Number of prices created")
    failed_count: int = Field(0, description="Number of failures")
    errors: List[str] = Field(default_factory=list, description="Error messages")

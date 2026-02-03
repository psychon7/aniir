"""
Pydantic schemas for Supplier Product Price API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Supplier Product Price Base Schemas
# ==========================================================================

class SupplierProductPriceBase(BaseModel):
    """Base schema for Supplier Product Price."""
    spp_sup_id: int = Field(
        ...,
        description="Supplier ID (FK to TM_SUP_Supplier)"
    )
    spp_prd_id: int = Field(
        ...,
        description="Product ID (FK to TM_PRD_Product)"
    )
    spp_unit_cost: Decimal = Field(
        ...,
        ge=0,
        description="Unit cost from this supplier"
    )
    spp_supplier_ref: Optional[str] = Field(
        None,
        max_length=100,
        description="Supplier's product reference (their SKU)"
    )
    spp_supplier_name: Optional[str] = Field(
        None,
        max_length=200,
        description="Supplier's product name"
    )
    spp_discount_percent: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Discount percentage"
    )
    spp_min_order_qty: Optional[int] = Field(
        None,
        ge=1,
        description="Minimum order quantity"
    )
    spp_lead_time_days: Optional[int] = Field(
        None,
        ge=0,
        description="Lead time in days"
    )
    spp_cur_id: Optional[int] = Field(
        None,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    spp_valid_from: Optional[datetime] = Field(
        None,
        description="Price valid from date"
    )
    spp_valid_to: Optional[datetime] = Field(
        None,
        description="Price valid to date"
    )
    spp_priority: int = Field(
        1,
        ge=1,
        description="Priority for selecting among suppliers (1 = highest)"
    )
    spp_is_preferred: bool = Field(
        False,
        description="Whether this is the preferred supplier for this product"
    )
    spp_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Notes about this price"
    )
    spp_is_active: bool = Field(
        True,
        description="Whether this price is active"
    )


class SupplierProductPriceCreate(SupplierProductPriceBase):
    """Schema for creating a Supplier Product Price."""
    spp_created_by: Optional[int] = Field(
        None,
        description="User ID who created the price"
    )


class SupplierProductPriceUpdate(BaseModel):
    """Schema for updating a Supplier Product Price (all fields optional)."""
    spp_unit_cost: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Unit cost from this supplier"
    )
    spp_supplier_ref: Optional[str] = Field(
        None,
        max_length=100,
        description="Supplier's product reference"
    )
    spp_supplier_name: Optional[str] = Field(
        None,
        max_length=200,
        description="Supplier's product name"
    )
    spp_discount_percent: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Discount percentage"
    )
    spp_min_order_qty: Optional[int] = Field(
        None,
        ge=1,
        description="Minimum order quantity"
    )
    spp_lead_time_days: Optional[int] = Field(
        None,
        ge=0,
        description="Lead time in days"
    )
    spp_cur_id: Optional[int] = Field(
        None,
        description="Currency ID"
    )
    spp_valid_from: Optional[datetime] = Field(
        None,
        description="Price valid from date"
    )
    spp_valid_to: Optional[datetime] = Field(
        None,
        description="Price valid to date"
    )
    spp_priority: Optional[int] = Field(
        None,
        ge=1,
        description="Priority for selecting among suppliers"
    )
    spp_is_preferred: Optional[bool] = Field(
        None,
        description="Whether this is the preferred supplier"
    )
    spp_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Notes about this price"
    )
    spp_is_active: Optional[bool] = Field(
        None,
        description="Whether this price is active"
    )
    spp_updated_by: Optional[int] = Field(
        None,
        description="User ID who updated the price"
    )


class SupplierProductPriceResponse(SupplierProductPriceBase):
    """Schema for Supplier Product Price response."""
    model_config = ConfigDict(from_attributes=True)

    spp_id: int = Field(..., description="Price ID")
    spp_soc_id: Optional[int] = Field(None, description="Society ID")
    spp_d_creation: Optional[datetime] = Field(None, description="Creation timestamp")
    spp_d_update: Optional[datetime] = Field(None, description="Last update timestamp")
    spp_created_by: Optional[int] = Field(None, description="Created by user ID")
    spp_updated_by: Optional[int] = Field(None, description="Updated by user ID")

    @computed_field
    @property
    def is_valid_now(self) -> bool:
        """Check if the price is currently valid."""
        if not self.spp_is_active:
            return False
        now = datetime.utcnow()
        if self.spp_valid_from and now < self.spp_valid_from:
            return False
        if self.spp_valid_to and now > self.spp_valid_to:
            return False
        return True


class SupplierProductPriceListResponse(BaseModel):
    """Schema for listing supplier product prices (with product info)."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Price fields
    id: int = Field(..., validation_alias="spp_id", description="Price ID")
    supplierId: int = Field(..., validation_alias="spp_sup_id", description="Supplier ID")
    productId: int = Field(..., validation_alias="spp_prd_id", description="Product ID")
    unitCost: Decimal = Field(..., validation_alias="spp_unit_cost", description="Unit cost")
    supplierRef: Optional[str] = Field(None, validation_alias="spp_supplier_ref", description="Supplier ref")
    supplierProductName: Optional[str] = Field(None, validation_alias="spp_supplier_name", description="Supplier name")
    discountPercent: Optional[Decimal] = Field(None, validation_alias="spp_discount_percent", description="Discount %")
    minOrderQty: Optional[int] = Field(None, validation_alias="spp_min_order_qty", description="Min order qty")
    leadTimeDays: Optional[int] = Field(None, validation_alias="spp_lead_time_days", description="Lead time days")
    currencyId: Optional[int] = Field(None, validation_alias="spp_cur_id", description="Currency ID")
    validFrom: Optional[datetime] = Field(None, validation_alias="spp_valid_from", description="Valid from")
    validTo: Optional[datetime] = Field(None, validation_alias="spp_valid_to", description="Valid to")
    priority: int = Field(..., validation_alias="spp_priority", description="Priority")
    isPreferred: bool = Field(..., validation_alias="spp_is_preferred", description="Is preferred")
    isActive: bool = Field(..., validation_alias="spp_is_active", description="Is active")
    notes: Optional[str] = Field(None, validation_alias="spp_notes", description="Notes")

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
# Supplier Products View Schema (products supplied by a supplier)
# ==========================================================================

class SupplierProductResponse(BaseModel):
    """Schema for supplier's product (combines price and product info)."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    priceId: int = Field(..., description="Price record ID")
    productId: int = Field(..., description="Product ID")
    productReference: Optional[str] = Field(None, description="Product reference")
    productName: Optional[str] = Field(None, description="Product name")
    supplierRef: Optional[str] = Field(None, description="Supplier's product reference")
    supplierProductName: Optional[str] = Field(None, description="Supplier's product name")
    unitCost: Decimal = Field(..., description="Unit cost")
    discountPercent: Optional[Decimal] = Field(None, description="Discount %")
    minOrderQty: Optional[int] = Field(None, description="Min order qty")
    leadTimeDays: Optional[int] = Field(None, description="Lead time days")
    currencyCode: Optional[str] = Field(None, description="Currency code")
    isPreferred: bool = Field(..., description="Is preferred supplier")
    priority: int = Field(..., description="Priority")
    isActive: bool = Field(..., description="Is active")


# ==========================================================================
# Pagination Schemas
# ==========================================================================

class SupplierProductPriceListPaginatedResponse(BaseModel):
    """Paginated response for supplier product price list."""
    success: bool = Field(default=True)
    data: List[SupplierProductPriceListResponse] = Field(..., description="List of prices")
    page: int = Field(..., description="Current page")
    pageSize: int = Field(..., description="Items per page")
    totalCount: int = Field(..., description="Total count")
    totalPages: int = Field(..., description="Total pages")
    hasNextPage: bool = Field(..., description="Has next page")
    hasPreviousPage: bool = Field(..., description="Has previous page")


class SupplierProductListPaginatedResponse(BaseModel):
    """Paginated response for supplier products list."""
    success: bool = Field(default=True)
    data: List[SupplierProductResponse] = Field(..., description="List of supplier products")
    page: int = Field(..., description="Current page")
    pageSize: int = Field(..., description="Items per page")
    totalCount: int = Field(..., description="Total count")
    totalPages: int = Field(..., description="Total pages")
    hasNextPage: bool = Field(..., description="Has next page")
    hasPreviousPage: bool = Field(..., description="Has previous page")


# ==========================================================================
# API Response Schemas
# ==========================================================================

class SupplierProductPriceAPIResponse(BaseModel):
    """Standard API response wrapper for supplier product price operations."""
    success: bool = Field(True)
    message: Optional[str] = Field(None)
    data: Optional[SupplierProductPriceResponse] = Field(None)


class SupplierProductPriceBulkCreateRequest(BaseModel):
    """Request for bulk creating supplier product prices."""
    prices: List[SupplierProductPriceCreate] = Field(..., min_length=1, description="List of prices to create")


class SupplierProductPriceBulkResponse(BaseModel):
    """Response for bulk operations."""
    success: bool = Field(True)
    created_count: int = Field(..., description="Number of prices created")
    failed_count: int = Field(0, description="Number of failures")
    errors: List[str] = Field(default_factory=list, description="Error messages")


# ==========================================================================
# Best Price Query Schema
# ==========================================================================

class BestSupplierPriceResponse(BaseModel):
    """Response for finding best supplier price for a product."""
    success: bool = Field(True)
    productId: int = Field(..., description="Product ID")
    supplierId: int = Field(..., description="Best supplier ID")
    supplierName: Optional[str] = Field(None, description="Supplier name")
    unitCost: Decimal = Field(..., description="Unit cost")
    leadTimeDays: Optional[int] = Field(None, description="Lead time days")
    isPreferred: bool = Field(..., description="Is preferred supplier")
    priceId: int = Field(..., description="Price record ID")

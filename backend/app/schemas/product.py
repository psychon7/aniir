"""
Pydantic schemas for Product API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Product Instance Schemas
# ==========================================================================

class ProductInstanceBase(BaseModel):
    """Base schema for ProductInstance."""
    pit_ref: Optional[str] = Field(
        None,
        max_length=100,
        description="Instance SKU/reference code"
    )
    pit_description: Optional[str] = Field(
        None,
        description="Instance description"
    )
    pit_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Instance selling price"
    )
    pit_purchase_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Instance purchase/cost price"
    )
    pit_inventory_threshold: int = Field(
        default=0,
        ge=0,
        description="Minimum inventory threshold"
    )


class ProductInstanceCreate(ProductInstanceBase):
    """Schema for creating a ProductInstance."""
    prd_id: int = Field(
        ...,
        description="Parent product ID"
    )
    pty_id: Optional[int] = Field(
        None,
        description="Product type ID"
    )


class ProductInstanceUpdate(BaseModel):
    """Schema for updating a ProductInstance."""
    pit_ref: Optional[str] = Field(
        None,
        max_length=100,
        description="Instance SKU/reference code"
    )
    pit_description: Optional[str] = Field(
        None,
        description="Instance description"
    )
    pit_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Instance selling price"
    )
    pit_purchase_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Instance purchase/cost price"
    )
    pit_inventory_threshold: Optional[int] = Field(
        None,
        ge=0,
        description="Minimum inventory threshold"
    )
    pty_id: Optional[int] = Field(
        None,
        description="Product type ID"
    )


class ProductInstanceResponse(ProductInstanceBase):
    """Schema for ProductInstance response."""
    model_config = ConfigDict(from_attributes=True)

    pit_id: int = Field(..., description="Instance ID")
    prd_id: int = Field(..., description="Parent product ID")
    pty_id: Optional[int] = Field(None, description="Product type ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name for the instance."""
        if self.pit_ref and self.pit_description:
            return f"{self.pit_ref} - {self.pit_description}"
        return self.pit_ref or f"Instance #{self.pit_id}"


class ProductInstanceListResponse(BaseModel):
    """Schema for listing product instances (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    pit_id: int = Field(..., description="Instance ID")
    prd_id: int = Field(..., description="Parent product ID")
    pit_ref: Optional[str] = Field(None, description="Instance SKU/reference")
    pit_description: Optional[str] = Field(None, description="Instance description")
    pit_price: Optional[Decimal] = Field(None, description="Instance price")


# ==========================================================================
# Product Dimension Schemas
# ==========================================================================

class ProductDimensions(BaseModel):
    """Schema for product physical dimensions."""
    length: Optional[Decimal] = Field(None, description="Product length")
    width: Optional[Decimal] = Field(None, description="Product width")
    height: Optional[Decimal] = Field(None, description="Product height")
    weight: Optional[Decimal] = Field(None, description="Product weight")
    outside_diameter: Optional[Decimal] = Field(None, description="Outside diameter")
    interior_length: Optional[Decimal] = Field(None, description="Interior length")
    interior_width: Optional[Decimal] = Field(None, description="Interior width")
    opening_diameter: Optional[Decimal] = Field(None, description="Opening diameter")
    thickness: Optional[Decimal] = Field(None, description="Thickness")
    hole_size: Optional[Decimal] = Field(None, description="Hole size")
    depth: Optional[Decimal] = Field(None, description="Depth")


class ProductUnitDimensions(BaseModel):
    """Schema for unit dimensions."""
    length: Optional[Decimal] = Field(None, description="Unit length")
    width: Optional[Decimal] = Field(None, description="Unit width")
    height: Optional[Decimal] = Field(None, description="Unit height")
    weight: Optional[Decimal] = Field(None, description="Unit weight")


class ProductCartonDimensions(BaseModel):
    """Schema for carton/packaging dimensions."""
    length: Optional[Decimal] = Field(None, description="Carton length")
    width: Optional[Decimal] = Field(None, description="Carton width")
    height: Optional[Decimal] = Field(None, description="Carton height")
    weight: Optional[Decimal] = Field(None, description="Carton weight")
    quantity_each: Optional[int] = Field(None, description="Quantity per carton")


# ==========================================================================
# Product Base Schemas
# ==========================================================================

class ProductBase(BaseModel):
    """Base schema for Product."""
    prd_ref: str = Field(
        ...,
        max_length=100,
        description="Product reference code"
    )
    prd_name: str = Field(
        ...,
        max_length=200,
        description="Product name"
    )
    prd_sub_name: Optional[str] = Field(
        None,
        max_length=200,
        description="Product sub-name/family"
    )
    prd_description: Optional[str] = Field(
        None,
        description="Product description"
    )
    prd_code: Optional[str] = Field(
        None,
        max_length=100,
        description="Product code"
    )
    prd_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Selling price"
    )
    prd_purchase_price: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Purchase/cost price"
    )
    pty_id: int = Field(
        ...,
        description="Product type ID"
    )


class ProductCreate(ProductBase):
    """Schema for creating a Product."""
    soc_id: int = Field(
        ...,
        description="Society/company ID"
    )
    # Physical dimensions
    prd_outside_diameter: Optional[Decimal] = Field(None, description="Outside diameter")
    prd_interior_length: Optional[Decimal] = Field(None, description="Interior length")
    prd_interior_width: Optional[Decimal] = Field(None, description="Interior width")
    prd_opening_diameter: Optional[Decimal] = Field(None, description="Opening diameter")
    prd_thickness: Optional[Decimal] = Field(None, description="Thickness")
    prd_length: Optional[Decimal] = Field(None, description="Product length")
    prd_width: Optional[Decimal] = Field(None, description="Product width")
    prd_height: Optional[Decimal] = Field(None, description="Product height")
    prd_hole_size: Optional[Decimal] = Field(None, description="Hole size")
    prd_depth: Optional[Decimal] = Field(None, description="Depth")
    prd_weight: Optional[Decimal] = Field(None, description="Weight")
    # Unit dimensions
    prd_unit_length: Optional[Decimal] = Field(None, description="Unit length")
    prd_unit_width: Optional[Decimal] = Field(None, description="Unit width")
    prd_unit_height: Optional[Decimal] = Field(None, description="Unit height")
    prd_unit_weight: Optional[Decimal] = Field(None, description="Unit weight")
    # Carton dimensions
    prd_quantity_each_carton: Optional[int] = Field(None, description="Quantity per carton")
    prd_carton_length: Optional[Decimal] = Field(None, description="Carton length")
    prd_carton_width: Optional[Decimal] = Field(None, description="Carton width")
    prd_carton_height: Optional[Decimal] = Field(None, description="Carton height")
    prd_carton_weight: Optional[Decimal] = Field(None, description="Carton weight")
    # File reference
    prd_file_name: Optional[str] = Field(None, max_length=500, description="File/image name")
    # Specifications (XML)
    prd_specifications: Optional[str] = Field(None, description="Product specifications (XML)")


class ProductUpdate(BaseModel):
    """Schema for updating a Product."""
    prd_ref: Optional[str] = Field(None, max_length=100, description="Product reference code")
    prd_name: Optional[str] = Field(None, max_length=200, description="Product name")
    prd_sub_name: Optional[str] = Field(None, max_length=200, description="Product sub-name/family")
    prd_description: Optional[str] = Field(None, description="Product description")
    prd_code: Optional[str] = Field(None, max_length=100, description="Product code")
    prd_price: Optional[Decimal] = Field(None, ge=0, description="Selling price")
    prd_purchase_price: Optional[Decimal] = Field(None, ge=0, description="Purchase/cost price")
    pty_id: Optional[int] = Field(None, description="Product type ID")
    # Physical dimensions
    prd_outside_diameter: Optional[Decimal] = Field(None, description="Outside diameter")
    prd_interior_length: Optional[Decimal] = Field(None, description="Interior length")
    prd_interior_width: Optional[Decimal] = Field(None, description="Interior width")
    prd_opening_diameter: Optional[Decimal] = Field(None, description="Opening diameter")
    prd_thickness: Optional[Decimal] = Field(None, description="Thickness")
    prd_length: Optional[Decimal] = Field(None, description="Product length")
    prd_width: Optional[Decimal] = Field(None, description="Product width")
    prd_height: Optional[Decimal] = Field(None, description="Product height")
    prd_hole_size: Optional[Decimal] = Field(None, description="Hole size")
    prd_depth: Optional[Decimal] = Field(None, description="Depth")
    prd_weight: Optional[Decimal] = Field(None, description="Weight")
    # Unit dimensions
    prd_unit_length: Optional[Decimal] = Field(None, description="Unit length")
    prd_unit_width: Optional[Decimal] = Field(None, description="Unit width")
    prd_unit_height: Optional[Decimal] = Field(None, description="Unit height")
    prd_unit_weight: Optional[Decimal] = Field(None, description="Unit weight")
    # Carton dimensions
    prd_quantity_each_carton: Optional[int] = Field(None, description="Quantity per carton")
    prd_carton_length: Optional[Decimal] = Field(None, description="Carton length")
    prd_carton_width: Optional[Decimal] = Field(None, description="Carton width")
    prd_carton_height: Optional[Decimal] = Field(None, description="Carton height")
    prd_carton_weight: Optional[Decimal] = Field(None, description="Carton weight")
    # File reference
    prd_file_name: Optional[str] = Field(None, max_length=500, description="File/image name")
    # Specifications (XML)
    prd_specifications: Optional[str] = Field(None, description="Product specifications (XML)")


class ProductResponse(ProductBase):
    """Schema for Product response."""
    model_config = ConfigDict(from_attributes=True)

    prd_id: int = Field(..., description="Product ID")
    soc_id: int = Field(..., description="Society/company ID")
    prd_d_creation: Optional[datetime] = Field(None, description="Creation timestamp")
    prd_d_update: Optional[datetime] = Field(None, description="Last update timestamp")
    prd_file_name: Optional[str] = Field(None, description="File/image name")

    # Physical dimensions
    prd_outside_diameter: Optional[Decimal] = Field(None, description="Outside diameter")
    prd_interior_length: Optional[Decimal] = Field(None, description="Interior length")
    prd_interior_width: Optional[Decimal] = Field(None, description="Interior width")
    prd_opening_diameter: Optional[Decimal] = Field(None, description="Opening diameter")
    prd_thickness: Optional[Decimal] = Field(None, description="Thickness")
    prd_length: Optional[Decimal] = Field(None, description="Product length")
    prd_width: Optional[Decimal] = Field(None, description="Product width")
    prd_height: Optional[Decimal] = Field(None, description="Product height")
    prd_hole_size: Optional[Decimal] = Field(None, description="Hole size")
    prd_depth: Optional[Decimal] = Field(None, description="Depth")
    prd_weight: Optional[Decimal] = Field(None, description="Weight")

    # Unit dimensions
    prd_unit_length: Optional[Decimal] = Field(None, description="Unit length")
    prd_unit_width: Optional[Decimal] = Field(None, description="Unit width")
    prd_unit_height: Optional[Decimal] = Field(None, description="Unit height")
    prd_unit_weight: Optional[Decimal] = Field(None, description="Unit weight")

    # Carton dimensions
    prd_quantity_each_carton: Optional[int] = Field(None, description="Quantity per carton")
    prd_carton_length: Optional[Decimal] = Field(None, description="Carton length")
    prd_carton_width: Optional[Decimal] = Field(None, description="Carton width")
    prd_carton_height: Optional[Decimal] = Field(None, description="Carton height")
    prd_carton_weight: Optional[Decimal] = Field(None, description="Carton weight")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name combining reference and name."""
        return f"{self.prd_ref} - {self.prd_name}"


class ProductWithInstancesResponse(ProductResponse):
    """Schema for Product response with instances."""
    instances: List[ProductInstanceResponse] = Field(
        default_factory=list,
        description="Product instances/variants"
    )

    @computed_field
    @property
    def has_instances(self) -> bool:
        """Check if product has instances."""
        return len(self.instances) > 0

    @computed_field
    @property
    def instance_count(self) -> int:
        """Get number of instances."""
        return len(self.instances)


class ProductListResponse(BaseModel):
    """Schema for listing products (lightweight) — camelCase output for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="prd_id", description="Product ID")
    reference: str = Field(..., validation_alias="prd_ref", description="Product reference")
    name: str = Field(..., validation_alias="prd_name", description="Product name")
    description: Optional[str] = Field(None, validation_alias="prd_description", description="Product description")
    code: Optional[str] = Field(None, validation_alias="prd_code", description="Product code")
    unitPrice: Optional[Decimal] = Field(None, validation_alias="prd_price", description="Selling price")
    costPrice: Optional[Decimal] = Field(None, validation_alias="prd_purchase_price", description="Purchase price")
    productTypeId: int = Field(..., validation_alias="pty_id", description="Product type ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    createdAt: Optional[datetime] = Field(None, validation_alias="prd_d_creation", description="Creation date")

    # Fields the frontend expects but don't exist as direct DB columns
    # Populated by the service layer via enrichment
    categoryName: Optional[str] = Field(None, description="Category name")
    brandName: Optional[str] = Field(None, description="Brand name")
    stockQuantity: Optional[int] = Field(None, description="Stock quantity")
    isActive: bool = Field(True, description="Whether the product is active")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get display name."""
        return f"{self.reference} - {self.name}"


class ProductDetailResponse(BaseModel):
    """
    Schema for product detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /products/{product_id} endpoint.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="prd_id", description="Product ID")
    reference: str = Field(..., validation_alias="prd_ref", description="Product reference code")
    name: str = Field(..., validation_alias="prd_name", description="Product name")
    subName: Optional[str] = Field(None, validation_alias="prd_sub_name", description="Product sub-name/family")
    description: Optional[str] = Field(None, validation_alias="prd_description", description="Product description")
    supDescription: Optional[str] = Field(None, validation_alias="prd_sup_description", description="Supplementary description")
    code: Optional[str] = Field(None, validation_alias="prd_code", description="Product code")
    tmpRef: Optional[str] = Field(None, validation_alias="prd_tmp_ref", description="Temporary reference")

    # Foreign key IDs
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    productTypeId: int = Field(..., validation_alias="pty_id", description="Product type ID")

    # Pricing
    price: Optional[Decimal] = Field(None, validation_alias="prd_price", description="Selling price")
    purchasePrice: Optional[Decimal] = Field(None, validation_alias="prd_purchase_price", description="Purchase/cost price")

    # File
    fileName: Optional[str] = Field(None, validation_alias="prd_file_name", description="File/image name")

    # Timestamps
    createdAt: Optional[datetime] = Field(None, validation_alias="prd_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="prd_d_update", description="Last update timestamp")

    # Physical dimensions
    outsideDiameter: Optional[Decimal] = Field(None, validation_alias="prd_outside_diameter", description="Outside diameter")
    interiorLength: Optional[Decimal] = Field(None, validation_alias="prd_interior_length", description="Interior length")
    interiorWidth: Optional[Decimal] = Field(None, validation_alias="prd_interior_width", description="Interior width")
    openingDiameter: Optional[Decimal] = Field(None, validation_alias="prd_opening_diameter", description="Opening diameter")
    thickness: Optional[Decimal] = Field(None, validation_alias="prd_thickness", description="Thickness")
    length: Optional[Decimal] = Field(None, validation_alias="prd_length", description="Product length")
    width: Optional[Decimal] = Field(None, validation_alias="prd_width", description="Product width")
    height: Optional[Decimal] = Field(None, validation_alias="prd_height", description="Product height")
    weight: Optional[Decimal] = Field(None, validation_alias="prd_weight", description="Product weight")
    depth: Optional[Decimal] = Field(None, validation_alias="prd_depth", description="Product depth")
    holeSize: Optional[Decimal] = Field(None, validation_alias="prd_hole_size", description="Hole size")

    # Unit dimensions
    unitLength: Optional[Decimal] = Field(None, validation_alias="prd_unit_length", description="Unit length")
    unitWidth: Optional[Decimal] = Field(None, validation_alias="prd_unit_width", description="Unit width")
    unitHeight: Optional[Decimal] = Field(None, validation_alias="prd_unit_height", description="Unit height")
    unitWeight: Optional[Decimal] = Field(None, validation_alias="prd_unit_weight", description="Unit weight")

    # Carton dimensions
    quantityEachCarton: Optional[int] = Field(None, validation_alias="prd_quantity_each_carton", description="Quantity per carton")
    cartonLength: Optional[Decimal] = Field(None, validation_alias="prd_carton_length", description="Carton length")
    cartonWidth: Optional[Decimal] = Field(None, validation_alias="prd_carton_width", description="Carton width")
    cartonHeight: Optional[Decimal] = Field(None, validation_alias="prd_carton_height", description="Carton height")
    cartonWeight: Optional[Decimal] = Field(None, validation_alias="prd_carton_weight", description="Carton weight")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # These are not from the ORM directly but enriched data
    # =====================================================
    societyName: Optional[str] = Field(None, description="Resolved society name")
    productTypeName: Optional[str] = Field(None, description="Resolved product type name")
    categoryName: Optional[str] = Field(None, description="Category name (product type name)")
    stockQuantity: Optional[int] = Field(None, description="Total stock from inventory")

    # Product instances (populated by service layer)
    instances: List["ProductInstanceResponse"] = Field(default_factory=list, description="Product instances/variants")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get display name combining reference and name."""
        return f"{self.reference} - {self.name}"

    @computed_field
    @property
    def hasInstances(self) -> bool:
        """Check if product has instances."""
        return len(self.instances) > 0

    @computed_field
    @property
    def instanceCount(self) -> int:
        """Get number of instances."""
        return len(self.instances)


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class ProductListPaginatedResponse(BaseModel):
    """Paginated response for product list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[ProductListResponse] = Field(default_factory=list, description="List of products")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of products")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


class ProductInstanceListPaginatedResponse(BaseModel):
    """Paginated response for product instance list."""
    items: List[ProductInstanceListResponse] = Field(
        ...,
        description="List of product instances"
    )
    total: int = Field(
        ...,
        description="Total count of instances"
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

class ProductSearchParams(BaseModel):
    """Search parameters for product list."""
    search: Optional[str] = Field(None, description="Search term (name, reference, code)")
    pty_id: Optional[int] = Field(None, description="Filter by product type ID")
    soc_id: Optional[int] = Field(None, description="Filter by society ID")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Maximum items to return")
    sort_by: Optional[str] = Field(default="prd_name", description="Sort field")
    sort_order: Optional[str] = Field(default="asc", description="Sort order (asc/desc)")


# ==========================================================================
# API Response Schemas
# ==========================================================================

class ProductAPIResponse(BaseModel):
    """Standard API response wrapper for product operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[ProductResponse] = Field(
        None,
        description="Product data"
    )


class ProductInstanceAPIResponse(BaseModel):
    """Standard API response wrapper for product instance operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[ProductInstanceResponse] = Field(
        None,
        description="Product instance data"
    )


class ProductErrorResponse(BaseModel):
    """Error response for product operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

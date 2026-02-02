"""
Pydantic schemas for ShopifyLocationMap model.

These schemas handle validation and serialization for the Shopify location mapping API.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ShopifyLocationMapBase(BaseModel):
    """Base schema with common fields."""
    
    shopify_location_id: int = Field(
        ...,
        description="Shopify's location ID (numeric part of GID)",
        gt=0
    )
    shopify_location_name: str = Field(
        ...,
        description="Name of the location in Shopify",
        min_length=1,
        max_length=200
    )
    internal_location_code: Optional[str] = Field(
        None,
        description="Internal ERP stock location code",
        max_length=50
    )
    internal_location_id: Optional[int] = Field(
        None,
        description="Internal ERP stock location ID"
    )
    sync_inventory: bool = Field(
        True,
        description="Whether to sync inventory to this location"
    )
    is_default: bool = Field(
        False,
        description="Whether this is the default location for the store"
    )
    is_fulfillment_location: bool = Field(
        True,
        description="Whether this location can fulfill orders"
    )
    priority: int = Field(
        0,
        description="Priority for inventory allocation (0 = highest)",
        ge=0
    )
    is_active: bool = Field(
        True,
        description="Whether this mapping is active"
    )


class ShopifyLocationMapCreate(ShopifyLocationMapBase):
    """Schema for creating a new location mapping."""
    
    shopify_store_id: int = Field(
        ...,
        description="ID of the Shopify store",
        gt=0
    )


class ShopifyLocationMapUpdate(BaseModel):
    """Schema for updating an existing location mapping."""
    
    shopify_location_name: Optional[str] = Field(
        None,
        description="Name of the location in Shopify",
        min_length=1,
        max_length=200
    )
    internal_location_code: Optional[str] = Field(
        None,
        description="Internal ERP stock location code",
        max_length=50
    )
    internal_location_id: Optional[int] = Field(
        None,
        description="Internal ERP stock location ID"
    )
    sync_inventory: Optional[bool] = Field(
        None,
        description="Whether to sync inventory to this location"
    )
    is_default: Optional[bool] = Field(
        None,
        description="Whether this is the default location for the store"
    )
    is_fulfillment_location: Optional[bool] = Field(
        None,
        description="Whether this location can fulfill orders"
    )
    priority: Optional[int] = Field(
        None,
        description="Priority for inventory allocation (0 = highest)",
        ge=0
    )
    is_active: Optional[bool] = Field(
        None,
        description="Whether this mapping is active"
    )


class ShopifyLocationMapInDB(ShopifyLocationMapBase):
    """Schema for location mapping as stored in database."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Unique identifier")
    shopify_store_id: int = Field(..., description="ID of the Shopify store")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    created_by: Optional[int] = Field(None, description="User who created this mapping")
    updated_by: Optional[int] = Field(None, description="User who last updated this mapping")
    
    # Computed property
    shopify_location_gid: Optional[str] = Field(
        None,
        description="Full Shopify GraphQL ID for the location"
    )


class ShopifyLocationMapResponse(ShopifyLocationMapInDB):
    """Schema for API response with additional computed fields."""
    
    # Include store name for display purposes
    store_name: Optional[str] = Field(
        None,
        description="Name of the associated Shopify store"
    )


class ShopifyLocationMapList(BaseModel):
    """Schema for paginated list of location mappings."""
    
    items: list[ShopifyLocationMapResponse] = Field(
        default_factory=list,
        description="List of location mappings"
    )
    total: int = Field(..., description="Total number of mappings")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(20, description="Number of items per page")
    
    @property
    def total_pages(self) -> int:
        """Calculate total number of pages."""
        if self.page_size <= 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


class ShopifyLocationFromAPI(BaseModel):
    """Schema for location data received from Shopify API."""
    
    id: str = Field(..., description="Shopify location GID")
    name: str = Field(..., description="Location name")
    is_active: bool = Field(True, description="Whether location is active in Shopify")
    fulfills_online_orders: bool = Field(
        True,
        description="Whether location fulfills online orders"
    )
    address: Optional[dict] = Field(None, description="Location address")
    
    @property
    def numeric_id(self) -> int:
        """Extract numeric ID from Shopify GID."""
        # GID format: gid://shopify/Location/12345678
        if self.id.startswith("gid://"):
            return int(self.id.split("/")[-1])
        return int(self.id)


class BulkLocationMapCreate(BaseModel):
    """Schema for bulk creating/updating location mappings from Shopify sync."""
    
    shopify_store_id: int = Field(..., description="ID of the Shopify store")
    locations: list[ShopifyLocationFromAPI] = Field(
        ...,
        description="List of locations from Shopify API"
    )
    auto_map_default: bool = Field(
        True,
        description="Automatically set first location as default if none exists"
    )

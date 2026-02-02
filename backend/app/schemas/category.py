"""
Pydantic schemas for Category API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Category Base Schemas
# ==========================================================================

class CategoryBase(BaseModel):
    """Base schema for Category."""
    cat_code: str = Field(
        ...,
        max_length=20,
        description="Category code (e.g., LED, DOMOTICS)"
    )
    cat_name: str = Field(
        ...,
        max_length=100,
        description="Category name"
    )
    cat_parent_id: Optional[int] = Field(
        None,
        description="Parent category ID for hierarchical structure"
    )
    cat_is_active: bool = Field(
        default=True,
        description="Whether the category is active"
    )


class CategoryCreate(CategoryBase):
    """Schema for creating a Category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a Category."""
    cat_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Category code"
    )
    cat_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Category name"
    )
    cat_parent_id: Optional[int] = Field(
        None,
        description="Parent category ID"
    )
    cat_is_active: Optional[bool] = Field(
        None,
        description="Whether the category is active"
    )


class CategoryResponse(CategoryBase):
    """Schema for Category response."""
    model_config = ConfigDict(from_attributes=True)

    cat_id: int = Field(..., description="Category ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get category display name."""
        return self.cat_name

    @computed_field
    @property
    def is_root(self) -> bool:
        """Check if this is a root/top-level category."""
        return self.cat_parent_id is None


class CategoryListResponse(BaseModel):
    """Schema for listing categories (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    cat_id: int = Field(..., description="Category ID")
    cat_code: str = Field(..., description="Category code")
    cat_name: str = Field(..., description="Category name")
    cat_parent_id: Optional[int] = Field(None, description="Parent category ID")
    cat_is_active: bool = Field(..., description="Whether the category is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get category display name."""
        return self.cat_name


class CategoryWithChildrenResponse(CategoryResponse):
    """Schema for Category response with children."""
    children: List["CategoryWithChildrenResponse"] = Field(
        default_factory=list,
        description="Child categories"
    )


# Self-reference for recursive model
CategoryWithChildrenResponse.model_rebuild()


class CategoryTreeResponse(BaseModel):
    """Schema for hierarchical category tree response."""
    categories: List[CategoryWithChildrenResponse] = Field(
        ...,
        description="List of root categories with nested children"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class CategoryListPaginatedResponse(BaseModel):
    """Paginated response for category list."""
    items: List[CategoryResponse] = Field(
        ...,
        description="List of categories"
    )
    total: int = Field(
        ...,
        description="Total count of categories"
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
# API Response Schemas
# ==========================================================================

class CategoryAPIResponse(BaseModel):
    """Standard API response wrapper for category operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[CategoryResponse] = Field(
        None,
        description="Category data"
    )


class CategoryErrorResponse(BaseModel):
    """Error response for category operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

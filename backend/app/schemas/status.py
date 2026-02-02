"""
Pydantic schemas for Status API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Status Base Schemas
# ==========================================================================

class StatusBase(BaseModel):
    """Base schema for Status."""
    sta_code: str = Field(
        ...,
        max_length=20,
        description="Status code (e.g., ACTIVE, INACTIVE, DRAFT)"
    )
    sta_name: str = Field(
        ...,
        max_length=50,
        description="Status display name"
    )
    sta_entity_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Entity type this status applies to (Client, Order, Invoice, Quote). NULL for generic statuses."
    )
    sta_color_hex: Optional[str] = Field(
        None,
        max_length=7,
        pattern=r"^#[0-9A-Fa-f]{6}$",
        description="Badge/chip color in hex format (e.g., #22C55E)"
    )
    sta_sort_order: int = Field(
        default=0,
        description="Sort order for display"
    )
    sta_is_active: bool = Field(
        default=True,
        description="Whether the status is active"
    )


class StatusCreate(StatusBase):
    """Schema for creating a Status."""
    pass


class StatusUpdate(BaseModel):
    """Schema for updating a Status."""
    sta_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Status code"
    )
    sta_name: Optional[str] = Field(
        None,
        max_length=50,
        description="Status display name"
    )
    sta_entity_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Entity type this status applies to"
    )
    sta_color_hex: Optional[str] = Field(
        None,
        max_length=7,
        pattern=r"^#[0-9A-Fa-f]{6}$",
        description="Badge/chip color in hex format"
    )
    sta_sort_order: Optional[int] = Field(
        None,
        description="Sort order for display"
    )
    sta_is_active: Optional[bool] = Field(
        None,
        description="Whether the status is active"
    )


class StatusResponse(StatusBase):
    """Schema for Status response."""
    model_config = ConfigDict(from_attributes=True)

    sta_id: int = Field(..., description="Status ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get status display name."""
        return self.sta_name

    @computed_field
    @property
    def is_generic(self) -> bool:
        """Check if this is a generic status (usable by any entity)."""
        return self.sta_entity_type is None


class StatusListResponse(BaseModel):
    """Schema for listing statuses (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    sta_id: int = Field(..., description="Status ID")
    sta_code: str = Field(..., description="Status code")
    sta_name: str = Field(..., description="Status name")
    sta_entity_type: Optional[str] = Field(None, description="Entity type")
    sta_color_hex: Optional[str] = Field(None, description="Badge color")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get status display name."""
        return self.sta_name


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class StatusListPaginatedResponse(BaseModel):
    """Paginated response for status list."""
    items: List[StatusResponse] = Field(
        ...,
        description="List of statuses"
    )
    total: int = Field(
        ...,
        description="Total count of statuses"
    )
    skip: int = Field(
        ...,
        description="Number of items skipped"
    )
    limit: int = Field(
        ...,
        description="Maximum items returned"
    )


class StatusByEntityTypeResponse(BaseModel):
    """Response schema for statuses grouped by entity type."""
    entity_type: Optional[str] = Field(
        None,
        description="Entity type (NULL for generic)"
    )
    statuses: List[StatusListResponse] = Field(
        ...,
        description="List of statuses for this entity type"
    )


# ==========================================================================
# API Response Schemas
# ==========================================================================

class StatusAPIResponse(BaseModel):
    """Standard API response wrapper for status operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[StatusResponse] = Field(
        None,
        description="Status data"
    )


class StatusErrorResponse(BaseModel):
    """Error response for status operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

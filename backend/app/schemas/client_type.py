"""
Pydantic schemas for ClientType API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# ClientType Base Schemas
# ==========================================================================

class ClientTypeBase(BaseModel):
    """Base schema for ClientType."""
    ct_description: str = Field(
        ...,
        max_length=100,
        description="Client type description (e.g., 'Client', 'Prospect')"
    )
    ct_is_active: bool = Field(
        True,
        description="Whether the client type is active"
    )


class ClientTypeCreate(ClientTypeBase):
    """Schema for creating a ClientType."""
    pass


class ClientTypeUpdate(BaseModel):
    """Schema for updating a ClientType."""
    ct_description: Optional[str] = Field(
        None,
        max_length=100,
        description="Client type description"
    )
    ct_is_active: Optional[bool] = Field(
        None,
        description="Whether the client type is active"
    )


class ClientTypeResponse(ClientTypeBase):
    """Schema for ClientType response."""
    model_config = ConfigDict(from_attributes=True)

    ct_id: int = Field(..., description="Client type ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get client type's display name."""
        return self.ct_description


class ClientTypeListResponse(BaseModel):
    """Schema for listing client types (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    ct_id: int = Field(..., description="Client type ID")
    ct_description: str = Field(..., description="Client type description")
    ct_is_active: bool = Field(..., description="Whether the client type is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get client type's display name."""
        return self.ct_description


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class ClientTypeListPaginatedResponse(BaseModel):
    """Paginated response for client type list."""
    items: List[ClientTypeResponse] = Field(
        ...,
        description="List of client types"
    )
    total: int = Field(
        ...,
        description="Total count of client types"
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

class ClientTypeAPIResponse(BaseModel):
    """Standard API response wrapper for client type operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[ClientTypeResponse] = Field(
        None,
        description="Client type data"
    )


class ClientTypeErrorResponse(BaseModel):
    """Error response for client type operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

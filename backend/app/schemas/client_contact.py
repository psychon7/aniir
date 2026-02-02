"""
Pydantic schemas for ClientContact API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# ClientContact Base Schemas
# ==========================================================================

class ClientContactBase(BaseModel):
    """Base schema for ClientContact."""
    cco_first_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Contact first name"
    )
    cco_last_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Contact last name"
    )
    cco_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    cco_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    cco_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    cco_job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="Job title"
    )
    cco_department: Optional[str] = Field(
        None,
        max_length=100,
        description="Department"
    )
    cco_is_primary: bool = Field(
        False,
        description="Whether this is the primary contact"
    )
    cco_notes: Optional[str] = Field(
        None,
        description="Notes about the contact"
    )


class ClientContactCreate(ClientContactBase):
    """Schema for creating a ClientContact."""
    cco_cli_id: int = Field(
        ...,
        description="Client ID (FK to TM_CLI_Client)"
    )


class ClientContactUpdate(BaseModel):
    """Schema for updating a ClientContact (all fields optional)."""
    cco_first_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Contact first name"
    )
    cco_last_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Contact last name"
    )
    cco_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    cco_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    cco_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    cco_job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="Job title"
    )
    cco_department: Optional[str] = Field(
        None,
        max_length=100,
        description="Department"
    )
    cco_is_primary: Optional[bool] = Field(
        None,
        description="Whether this is the primary contact"
    )
    cco_notes: Optional[str] = Field(
        None,
        description="Notes about the contact"
    )


class ClientContactResponse(ClientContactBase):
    """Schema for ClientContact response."""
    model_config = ConfigDict(from_attributes=True)

    cco_id: int = Field(..., description="Contact ID")
    cco_cli_id: int = Field(..., description="Client ID")

    @computed_field
    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        return f"{self.cco_first_name} {self.cco_last_name}"


class ClientContactListResponse(BaseModel):
    """Schema for listing contacts (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    cco_id: int = Field(..., description="Contact ID")
    cco_cli_id: int = Field(..., description="Client ID")
    cco_first_name: str = Field(..., description="First name")
    cco_last_name: str = Field(..., description="Last name")
    cco_email: Optional[str] = Field(None, description="Email address")
    cco_phone: Optional[str] = Field(None, description="Phone number")
    cco_job_title: Optional[str] = Field(None, description="Job title")
    cco_is_primary: bool = Field(..., description="Whether primary contact")

    @computed_field
    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        return f"{self.cco_first_name} {self.cco_last_name}"


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class ClientContactListPaginatedResponse(BaseModel):
    """Paginated response for contact list."""
    items: List[ClientContactListResponse] = Field(
        ...,
        description="List of contacts"
    )
    total: int = Field(
        ...,
        description="Total count of contacts matching criteria"
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

class ClientContactAPIResponse(BaseModel):
    """Standard API response wrapper for contact operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[ClientContactResponse] = Field(
        None,
        description="Contact data"
    )


class ClientContactErrorResponse(BaseModel):
    """Error response for contact operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

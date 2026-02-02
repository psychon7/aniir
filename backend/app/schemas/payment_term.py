"""
Pydantic schemas for PaymentTerm API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# PaymentTerm Base Schemas
# ==========================================================================

class PaymentTermBase(BaseModel):
    """Base schema for PaymentTerm."""
    payt_designation: str = Field(
        ...,
        max_length=500,
        description="Payment term designation/name (e.g., 'Net 30', '30 days end of month')"
    )
    payt_active: bool = Field(
        True,
        description="Whether the payment term is active"
    )
    payt_num_days: int = Field(
        0,
        ge=0,
        description="Number of days for payment"
    )
    payt_day_additional: int = Field(
        0,
        ge=0,
        description="Additional days after end of month (if applicable)"
    )
    payt_end_month: bool = Field(
        False,
        description="Whether payment is calculated from end of month"
    )


class PaymentTermCreate(PaymentTermBase):
    """Schema for creating a PaymentTerm."""
    pass


class PaymentTermUpdate(BaseModel):
    """Schema for updating a PaymentTerm."""
    payt_designation: Optional[str] = Field(
        None,
        max_length=500,
        description="Payment term designation/name"
    )
    payt_active: Optional[bool] = Field(
        None,
        description="Whether the payment term is active"
    )
    payt_num_days: Optional[int] = Field(
        None,
        ge=0,
        description="Number of days for payment"
    )
    payt_day_additional: Optional[int] = Field(
        None,
        ge=0,
        description="Additional days after end of month"
    )
    payt_end_month: Optional[bool] = Field(
        None,
        description="Whether payment is calculated from end of month"
    )


class PaymentTermResponse(PaymentTermBase):
    """Schema for PaymentTerm response."""
    model_config = ConfigDict(from_attributes=True)

    payt_id: int = Field(..., description="Payment term ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get payment term's display name."""
        return self.payt_designation

    @computed_field
    @property
    def total_days(self) -> int:
        """Get total number of days for payment."""
        return self.payt_num_days + self.payt_day_additional

    @computed_field
    @property
    def term_summary(self) -> str:
        """Get a summary description of the payment term."""
        parts = []
        if self.payt_num_days > 0:
            parts.append(f"{self.payt_num_days} days")
        if self.payt_end_month:
            parts.append("end of month")
        if self.payt_day_additional > 0:
            parts.append(f"+ {self.payt_day_additional} days")
        return " ".join(parts) if parts else "Immediate"


class PaymentTermListResponse(BaseModel):
    """Schema for listing payment terms (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    payt_id: int = Field(..., description="Payment term ID")
    payt_designation: str = Field(..., description="Payment term designation")
    payt_active: bool = Field(..., description="Whether the payment term is active")
    payt_num_days: int = Field(..., description="Number of days for payment")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get payment term's display name."""
        return self.payt_designation


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class PaymentTermListPaginatedResponse(BaseModel):
    """Paginated response for payment term list."""
    items: List[PaymentTermResponse] = Field(
        ...,
        description="List of payment terms"
    )
    total: int = Field(
        ...,
        description="Total count of payment terms"
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

class PaymentTermAPIResponse(BaseModel):
    """Standard API response wrapper for payment term operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[PaymentTermResponse] = Field(
        None,
        description="Payment term data"
    )


class PaymentTermErrorResponse(BaseModel):
    """Error response for payment term operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

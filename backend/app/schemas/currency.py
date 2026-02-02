"""
Pydantic schemas for Currency API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Currency Base Schemas
# ==========================================================================

class CurrencyBase(BaseModel):
    """Base schema for Currency."""
    cur_designation: str = Field(
        ...,
        max_length=20,
        description="Currency designation/code (e.g., USD, EUR, MAD)"
    )
    cur_ci_num: int = Field(
        ...,
        description="Currency numeric identifier"
    )
    cur_symbol: str = Field(
        ...,
        max_length=10,
        description="Currency symbol (e.g., $, €, DH)"
    )
    lng_id: int = Field(
        ...,
        description="Language ID"
    )


class CurrencyCreate(CurrencyBase):
    """Schema for creating a Currency."""
    pass


class CurrencyUpdate(BaseModel):
    """Schema for updating a Currency."""
    cur_designation: Optional[str] = Field(
        None,
        max_length=20,
        description="Currency designation/code"
    )
    cur_ci_num: Optional[int] = Field(
        None,
        description="Currency numeric identifier"
    )
    cur_symbol: Optional[str] = Field(
        None,
        max_length=10,
        description="Currency symbol"
    )
    lng_id: Optional[int] = Field(
        None,
        description="Language ID"
    )


class CurrencyResponse(CurrencyBase):
    """Schema for Currency response."""
    model_config = ConfigDict(from_attributes=True)

    cur_id: int = Field(..., description="Currency ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get currency's display name with symbol."""
        return f"{self.cur_designation} ({self.cur_symbol})"


class CurrencyListResponse(BaseModel):
    """Schema for listing currencies (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    cur_id: int = Field(..., description="Currency ID")
    cur_designation: str = Field(..., description="Currency designation")
    cur_symbol: str = Field(..., description="Currency symbol")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get currency's display name with symbol."""
        return f"{self.cur_designation} ({self.cur_symbol})"


# ==========================================================================
# Main Currency (Exchange Rate) Schemas
# ==========================================================================

class MainCurrencyBase(BaseModel):
    """Base schema for MainCurrency (exchange rate)."""
    cur_id: int = Field(
        ...,
        description="Base currency ID"
    )
    cur_id2: int = Field(
        ...,
        description="Target currency ID"
    )
    mcu_rate_in: Decimal = Field(
        ...,
        ge=0,
        decimal_places=5,
        description="Inbound exchange rate"
    )
    mcu_rate_out: Decimal = Field(
        ...,
        ge=0,
        decimal_places=5,
        description="Outbound exchange rate"
    )
    mcu_rate_date: datetime = Field(
        ...,
        description="Rate effective date"
    )
    lng_id: int = Field(
        ...,
        description="Language ID"
    )


class MainCurrencyCreate(MainCurrencyBase):
    """Schema for creating an exchange rate."""
    pass


class MainCurrencyUpdate(BaseModel):
    """Schema for updating an exchange rate."""
    cur_id: Optional[int] = Field(
        None,
        description="Base currency ID"
    )
    cur_id2: Optional[int] = Field(
        None,
        description="Target currency ID"
    )
    mcu_rate_in: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Inbound exchange rate"
    )
    mcu_rate_out: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Outbound exchange rate"
    )
    mcu_rate_date: Optional[datetime] = Field(
        None,
        description="Rate effective date"
    )
    lng_id: Optional[int] = Field(
        None,
        description="Language ID"
    )


class MainCurrencyResponse(MainCurrencyBase):
    """Schema for MainCurrency response."""
    model_config = ConfigDict(from_attributes=True)

    mcu_id: int = Field(..., description="Exchange rate ID")

    @computed_field
    @property
    def rate_info(self) -> str:
        """Get exchange rate info string."""
        return f"In: {self.mcu_rate_in}, Out: {self.mcu_rate_out} (as of {self.mcu_rate_date})"


class MainCurrencyDetailResponse(MainCurrencyResponse):
    """Detailed MainCurrency response with currency info."""
    currency: Optional[CurrencyListResponse] = Field(
        None,
        description="Base currency details"
    )
    target_currency: Optional[CurrencyListResponse] = Field(
        None,
        description="Target currency details"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class CurrencyListPaginatedResponse(BaseModel):
    """Paginated response for currency list."""
    items: List[CurrencyResponse] = Field(
        ...,
        description="List of currencies"
    )
    total: int = Field(
        ...,
        description="Total count of currencies"
    )
    skip: int = Field(
        ...,
        description="Number of items skipped"
    )
    limit: int = Field(
        ...,
        description="Maximum items returned"
    )


class MainCurrencyListPaginatedResponse(BaseModel):
    """Paginated response for exchange rate list."""
    items: List[MainCurrencyResponse] = Field(
        ...,
        description="List of exchange rates"
    )
    total: int = Field(
        ...,
        description="Total count of exchange rates"
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

class CurrencyAPIResponse(BaseModel):
    """Standard API response wrapper for currency operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[CurrencyResponse] = Field(
        None,
        description="Currency data"
    )


class CurrencyErrorResponse(BaseModel):
    """Error response for currency operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

"""
Pydantic schemas for Brand API requests and responses.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Brand Base Schemas
# ==========================================================================

class BrandBase(BaseModel):
    """Base schema for Brand."""
    bra_code: str = Field(
        ...,
        max_length=50,
        description="Brand code"
    )
    bra_name: str = Field(
        ...,
        max_length=100,
        description="Brand name"
    )
    bra_description: Optional[str] = Field(
        None,
        max_length=500,
        description="Brand description"
    )
    bra_isactive: bool = Field(
        default=True,
        description="Whether the brand is active"
    )


class BrandCreate(BrandBase):
    """Schema for creating a Brand."""
    soc_id: Optional[int] = Field(
        None,
        description="Society ID (usually set by system)"
    )


class BrandUpdate(BaseModel):
    """Schema for updating a Brand."""
    bra_code: Optional[str] = Field(
        None,
        max_length=50,
        description="Brand code"
    )
    bra_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Brand name"
    )
    bra_description: Optional[str] = Field(
        None,
        max_length=500,
        description="Brand description"
    )
    bra_isactive: Optional[bool] = Field(
        None,
        description="Whether the brand is active"
    )


# ==========================================================================
# Brand Response Schemas
# ==========================================================================

class BrandResponse(BrandBase):
    """Schema for Brand response."""
    model_config = ConfigDict(from_attributes=True)

    bra_id: int = Field(..., description="Brand ID")
    soc_id: int = Field(..., description="Society ID")
    f_id: Optional[str] = Field(None, description="Firebase ID")

    # Computed fields for frontend compatibility (camelCase)
    @computed_field
    @property
    def braId(self) -> int:
        return self.bra_id

    @computed_field
    @property
    def socId(self) -> int:
        return self.soc_id

    @computed_field
    @property
    def braCode(self) -> str:
        return self.bra_code

    @computed_field
    @property
    def braName(self) -> str:
        return self.bra_name

    @computed_field
    @property
    def braDescription(self) -> Optional[str]:
        return self.bra_description

    @computed_field
    @property
    def braIsActived(self) -> bool:
        return self.bra_isactive

    @computed_field
    @property
    def fId(self) -> Optional[str]:
        return self.f_id


class BrandListResponse(BaseModel):
    """Paginated list response for brands."""
    success: bool = True
    data: List[BrandResponse]
    page: int = 1
    pageSize: int = 20
    totalCount: int = 0
    totalPages: int = 0


class BrandAPIResponse(BaseModel):
    """Standard API response wrapper for a single brand."""
    success: bool = True
    data: BrandResponse


class BrandLookupItem(BaseModel):
    """Lightweight brand item for lookups/dropdowns."""
    key: str
    value: str

    @classmethod
    def from_brand(cls, brand) -> "BrandLookupItem":
        return cls(
            key=str(brand.bra_id),
            value=brand.bra_name
        )

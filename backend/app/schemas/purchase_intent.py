"""
Pydantic schemas for Purchase Intent API requests and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# PurchaseIntentLine Base Schemas
# ==========================================================================

class PurchaseIntentLineBase(BaseModel):
    """Base schema for PurchaseIntentLine."""
    prd_id: Optional[int] = Field(
        None,
        description="Product ID (FK to TM_PRD_Product)"
    )
    pit_id: Optional[int] = Field(
        None,
        description="Product Instance ID (FK to TM_PIT_Product_Instance)"
    )
    pil_order: Optional[int] = Field(
        None,
        description="Line order/sequence"
    )
    pil_quantity: Optional[int] = Field(
        None,
        ge=0,
        description="Quantity"
    )
    pil_description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Line description"
    )


class PurchaseIntentLineCreate(PurchaseIntentLineBase):
    """Schema for creating a PurchaseIntentLine."""
    pass


class PurchaseIntentLineUpdate(BaseModel):
    """Schema for updating a PurchaseIntentLine (all fields optional)."""
    prd_id: Optional[int] = Field(
        None,
        description="Product ID (FK to TM_PRD_Product)"
    )
    pit_id: Optional[int] = Field(
        None,
        description="Product Instance ID (FK to TM_PIT_Product_Instance)"
    )
    pil_order: Optional[int] = Field(
        None,
        description="Line order/sequence"
    )
    pil_quantity: Optional[int] = Field(
        None,
        ge=0,
        description="Quantity"
    )
    pil_description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Line description"
    )


class PurchaseIntentLineResponse(PurchaseIntentLineBase):
    """Schema for PurchaseIntentLine response."""
    model_config = ConfigDict(from_attributes=True)

    pil_id: int = Field(..., description="Line ID")
    pin_id: int = Field(..., description="Purchase Intent ID")

    # Computed camelCase properties for frontend
    @computed_field
    @property
    def id(self) -> int:
        """Line ID."""
        return self.pil_id

    @computed_field
    @property
    def purchaseIntentId(self) -> int:
        """Purchase Intent ID."""
        return self.pin_id

    @computed_field
    @property
    def productId(self) -> Optional[int]:
        """Product ID."""
        return self.prd_id

    @computed_field
    @property
    def productInstanceId(self) -> Optional[int]:
        """Product Instance ID."""
        return self.pit_id

    @computed_field
    @property
    def lineOrder(self) -> Optional[int]:
        """Line order/sequence."""
        return self.pil_order

    @computed_field
    @property
    def quantity(self) -> Optional[int]:
        """Quantity."""
        return self.pil_quantity

    @computed_field
    @property
    def description(self) -> Optional[str]:
        """Line description."""
        return self.pil_description


# ==========================================================================
# PurchaseIntent Base Schemas
# ==========================================================================

class PurchaseIntentBase(BaseModel):
    """Base schema for PurchaseIntent."""
    pin_code: Optional[str] = Field(
        None,
        max_length=50,
        description="Reference code"
    )
    pin_name: Optional[str] = Field(
        None,
        max_length=1000,
        description="Name/Description"
    )
    pin_inter_comment: Optional[str] = Field(
        None,
        max_length=4000,
        description="Internal comment"
    )
    pin_supplier_comment: Optional[str] = Field(
        None,
        max_length=4000,
        description="Comment for supplier"
    )
    soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    pin_closed: Optional[bool] = Field(
        False,
        description="Whether the intent is closed"
    )


class PurchaseIntentCreate(PurchaseIntentBase):
    """Schema for creating a PurchaseIntent."""
    pin_creator_id: Optional[int] = Field(
        None,
        description="Creator user ID (FK to TM_USR_User)"
    )
    lines: Optional[List[PurchaseIntentLineCreate]] = Field(
        default_factory=list,
        description="Lines to create with the purchase intent"
    )


class PurchaseIntentUpdate(BaseModel):
    """Schema for updating a PurchaseIntent (all fields optional)."""
    pin_code: Optional[str] = Field(
        None,
        max_length=50,
        description="Reference code"
    )
    pin_name: Optional[str] = Field(
        None,
        max_length=1000,
        description="Name/Description"
    )
    pin_inter_comment: Optional[str] = Field(
        None,
        max_length=4000,
        description="Internal comment"
    )
    pin_supplier_comment: Optional[str] = Field(
        None,
        max_length=4000,
        description="Comment for supplier"
    )
    soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    pin_closed: Optional[bool] = Field(
        None,
        description="Whether the intent is closed"
    )


class PurchaseIntentResponse(PurchaseIntentBase):
    """Schema for PurchaseIntent response."""
    model_config = ConfigDict(from_attributes=True)

    pin_id: int = Field(..., description="Purchase Intent ID")
    pin_creator_id: Optional[int] = Field(None, description="Creator user ID")
    pin_d_creation: Optional[datetime] = Field(None, description="Creation timestamp")
    pin_d_update: Optional[datetime] = Field(None, description="Last update timestamp")

    # Computed camelCase properties for frontend
    @computed_field
    @property
    def id(self) -> int:
        """Purchase Intent ID."""
        return self.pin_id

    @computed_field
    @property
    def code(self) -> Optional[str]:
        """Reference code."""
        return self.pin_code

    @computed_field
    @property
    def name(self) -> Optional[str]:
        """Name/Description."""
        return self.pin_name

    @computed_field
    @property
    def internalComment(self) -> Optional[str]:
        """Internal comment."""
        return self.pin_inter_comment

    @computed_field
    @property
    def supplierComment(self) -> Optional[str]:
        """Comment for supplier."""
        return self.pin_supplier_comment

    @computed_field
    @property
    def societyId(self) -> Optional[int]:
        """Society ID."""
        return self.soc_id

    @computed_field
    @property
    def creatorId(self) -> Optional[int]:
        """Creator user ID."""
        return self.pin_creator_id

    @computed_field
    @property
    def isClosed(self) -> Optional[bool]:
        """Whether the intent is closed."""
        return self.pin_closed

    @computed_field
    @property
    def createdAt(self) -> Optional[datetime]:
        """Creation timestamp."""
        return self.pin_d_creation

    @computed_field
    @property
    def updatedAt(self) -> Optional[datetime]:
        """Last update timestamp."""
        return self.pin_d_update


class PurchaseIntentWithLinesResponse(PurchaseIntentResponse):
    """Schema for PurchaseIntent response with lines included."""
    lines: List[PurchaseIntentLineResponse] = Field(
        default_factory=list,
        description="Purchase intent lines"
    )


class PurchaseIntentListResponse(BaseModel):
    """Schema for listing purchase intents (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    pin_id: int = Field(..., description="Purchase Intent ID")
    pin_code: Optional[str] = Field(None, description="Reference code")
    pin_name: Optional[str] = Field(None, description="Name/Description")
    soc_id: Optional[int] = Field(None, description="Society ID")
    pin_creator_id: Optional[int] = Field(None, description="Creator user ID")
    pin_closed: Optional[bool] = Field(None, description="Whether closed")
    pin_d_creation: Optional[datetime] = Field(None, description="Creation timestamp")
    pin_d_update: Optional[datetime] = Field(None, description="Last update timestamp")

    # Computed camelCase properties for frontend
    @computed_field
    @property
    def id(self) -> int:
        """Purchase Intent ID."""
        return self.pin_id

    @computed_field
    @property
    def code(self) -> Optional[str]:
        """Reference code."""
        return self.pin_code

    @computed_field
    @property
    def name(self) -> Optional[str]:
        """Name/Description."""
        return self.pin_name

    @computed_field
    @property
    def societyId(self) -> Optional[int]:
        """Society ID."""
        return self.soc_id

    @computed_field
    @property
    def creatorId(self) -> Optional[int]:
        """Creator user ID."""
        return self.pin_creator_id

    @computed_field
    @property
    def isClosed(self) -> Optional[bool]:
        """Whether the intent is closed."""
        return self.pin_closed

    @computed_field
    @property
    def createdAt(self) -> Optional[datetime]:
        """Creation timestamp."""
        return self.pin_d_creation

    @computed_field
    @property
    def updatedAt(self) -> Optional[datetime]:
        """Last update timestamp."""
        return self.pin_d_update


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class PurchaseIntentSearchParams(BaseModel):
    """Search/filter parameters for purchase intent list."""
    search: Optional[str] = Field(
        None,
        max_length=100,
        description="Search in code, name"
    )
    society_id: Optional[int] = Field(
        None,
        description="Filter by society ID"
    )
    creator_id: Optional[int] = Field(
        None,
        description="Filter by creator user ID"
    )
    is_closed: Optional[bool] = Field(
        None,
        description="Filter by closed status"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class PurchaseIntentListPaginatedResponse(BaseModel):
    """Paginated response for purchase intent list - matches frontend PagedResponse<T> format."""
    success: bool = Field(
        default=True,
        description="Whether the request was successful"
    )
    data: List[PurchaseIntentListResponse] = Field(
        ...,
        description="List of purchase intents"
    )
    page: int = Field(
        ...,
        description="Current page number (1-indexed)"
    )
    pageSize: int = Field(
        ...,
        description="Number of items per page"
    )
    totalCount: int = Field(
        ...,
        description="Total count of purchase intents matching criteria"
    )
    totalPages: int = Field(
        ...,
        description="Total number of pages"
    )
    hasNextPage: bool = Field(
        ...,
        description="Whether there is a next page"
    )
    hasPreviousPage: bool = Field(
        ...,
        description="Whether there is a previous page"
    )


# ==========================================================================
# API Response Schemas
# ==========================================================================

class PurchaseIntentAPIResponse(BaseModel):
    """Standard API response wrapper for purchase intent operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[PurchaseIntentResponse] = Field(
        None,
        description="Purchase intent data"
    )


class PurchaseIntentErrorResponse(BaseModel):
    """Error response for purchase intent operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )


class PurchaseIntentLineAPIResponse(BaseModel):
    """Standard API response wrapper for purchase intent line operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[PurchaseIntentLineResponse] = Field(
        None,
        description="Line data"
    )


# ==========================================================================
# Conversion Schemas
# ==========================================================================

class ConvertToSupplierOrderRequest(BaseModel):
    """Request schema for converting a purchase intent to a supplier order."""
    supplier_id: int = Field(
        ...,
        description="Supplier ID (FK to TM_SUP_Supplier)"
    )
    currency_id: int = Field(
        ...,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    vat_id: int = Field(
        ...,
        description="VAT rate ID (FK to TR_VAT_Vat)"
    )


class ConvertToSupplierOrderResponse(BaseModel):
    """Response schema for purchase intent to supplier order conversion."""
    supplier_order_id: int = Field(
        ...,
        description="ID of the newly created supplier order"
    )
    supplier_order_code: str = Field(
        ...,
        description="Code/reference of the newly created supplier order"
    )
    message: str = Field(
        ...,
        description="Success message"
    )

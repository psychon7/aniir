"""
Pydantic schemas for Warehouse, Stock, and Stock Movement API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Enums
# ==========================================================================

class MovementType(str, Enum):
    """Type of stock movement."""
    RECEIPT = "RECEIPT"
    SHIPMENT = "SHIPMENT"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN_IN = "RETURN_IN"
    RETURN_OUT = "RETURN_OUT"
    DAMAGE = "DAMAGE"
    DESTROY = "DESTROY"
    LOAN_OUT = "LOAN_OUT"
    LOAN_IN = "LOAN_IN"


class MovementStatus(str, Enum):
    """Status of stock movement."""
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    PARTIALLY = "PARTIALLY"


# ==========================================================================
# Warehouse Base Schemas
# ==========================================================================

class WarehouseBase(BaseModel):
    """Base schema for Warehouse."""
    wh_code: str = Field(
        ...,
        max_length=20,
        description="Warehouse code (unique identifier)"
    )
    wh_name: str = Field(
        ...,
        max_length=100,
        description="Warehouse display name"
    )
    wh_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Warehouse address line"
    )
    wh_city: Optional[str] = Field(
        None,
        max_length=100,
        description="City where the warehouse is located"
    )
    wh_country_id: Optional[int] = Field(
        None,
        description="Foreign key to Country"
    )
    wh_is_default: bool = Field(
        default=False,
        description="Whether this is the default warehouse"
    )
    wh_is_active: bool = Field(
        default=True,
        description="Whether the warehouse is active"
    )


class WarehouseCreate(WarehouseBase):
    """Schema for creating a Warehouse."""
    pass


class WarehouseUpdate(BaseModel):
    """Schema for updating a Warehouse."""
    wh_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Warehouse code"
    )
    wh_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Warehouse display name"
    )
    wh_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Warehouse address line"
    )
    wh_city: Optional[str] = Field(
        None,
        max_length=100,
        description="City where the warehouse is located"
    )
    wh_country_id: Optional[int] = Field(
        None,
        description="Foreign key to Country"
    )
    wh_is_default: Optional[bool] = Field(
        None,
        description="Whether this is the default warehouse"
    )
    wh_is_active: Optional[bool] = Field(
        None,
        description="Whether the warehouse is active"
    )


class WarehouseResponse(WarehouseBase):
    """Schema for Warehouse response."""
    model_config = ConfigDict(from_attributes=True)

    wh_id: int = Field(..., description="Warehouse ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get warehouse's display name."""
        return self.wh_name

    @computed_field
    @property
    def full_address(self) -> str:
        """Get warehouse's full address."""
        parts = [self.wh_address, self.wh_city]
        return ", ".join(p for p in parts if p)


class WarehouseDetailResponse(BaseModel):
    """
    Schema for warehouse detail response with camelCase field names for frontend.

    Uses validation_alias to map from database model fields (whs_* prefix)
    to camelCase output fields for frontend consumption.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Primary key
    id: int = Field(..., validation_alias="whs_id", description="Warehouse ID")

    # Basic Info
    name: str = Field(..., validation_alias="whs_name", description="Warehouse name")
    code: Optional[str] = Field(None, validation_alias="whs_code", description="Warehouse code")

    # Address Info
    address: Optional[str] = Field(None, validation_alias="whs_address1", description="Address line 1")
    address2: Optional[str] = Field(None, validation_alias="whs_address2", description="Address line 2")
    postalCode: Optional[str] = Field(None, validation_alias="whs_postcode", description="Postal code")
    city: Optional[str] = Field(None, validation_alias="whs_city", description="City")
    country: Optional[str] = Field(None, validation_alias="whs_country", description="Country")

    # Capacity
    volume: Optional[int] = Field(None, validation_alias="whs_volume", description="Volume capacity")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get warehouse's display name."""
        return self.name

    @computed_field
    @property
    def fullAddress(self) -> str:
        """Get warehouse's full address."""
        parts = [self.address, self.address2, self.city, self.postalCode, self.country]
        return ", ".join(p for p in parts if p)


class WarehouseListResponse(BaseModel):
    """Schema for listing warehouses (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    wh_id: int = Field(..., description="Warehouse ID")
    wh_code: str = Field(..., description="Warehouse code")
    wh_name: str = Field(..., description="Warehouse name")
    wh_city: Optional[str] = Field(None, description="City")
    wh_is_default: bool = Field(..., description="Is default warehouse")
    wh_is_active: bool = Field(..., description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get warehouse's display name."""
        return self.wh_name


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class WarehouseSearchParams(BaseModel):
    """Search parameters for warehouse list."""
    search: Optional[str] = Field(
        None,
        description="Search term (searches code and name)"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status"
    )
    is_default: Optional[bool] = Field(
        None,
        description="Filter by default flag"
    )
    city: Optional[str] = Field(
        None,
        description="Filter by city"
    )
    country_id: Optional[int] = Field(
        None,
        description="Filter by country ID"
    )
    skip: int = Field(
        default=0,
        ge=0,
        description="Number of items to skip"
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=100,
        description="Maximum items to return"
    )
    sort_by: Optional[str] = Field(
        default="wh_name",
        description="Field to sort by"
    )
    sort_order: Optional[str] = Field(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort order (asc or desc)"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class WarehouseListPaginatedResponse(BaseModel):
    """Paginated response for warehouse list."""
    items: List[WarehouseResponse] = Field(
        ...,
        description="List of warehouses"
    )
    total: int = Field(
        ...,
        description="Total count of warehouses"
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

class WarehouseAPIResponse(BaseModel):
    """Standard API response wrapper for warehouse operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[WarehouseResponse] = Field(
        None,
        description="Warehouse data"
    )


class WarehouseErrorResponse(BaseModel):
    """Error response for warehouse operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )


# ==========================================================================
# Warehouse Dropdown/Select Schemas
# ==========================================================================

class WarehouseDropdownItem(BaseModel):
    """Simplified warehouse item for dropdowns/select inputs."""
    model_config = ConfigDict(from_attributes=True)

    wh_id: int = Field(..., description="Warehouse ID")
    wh_code: str = Field(..., description="Warehouse code")
    wh_name: str = Field(..., description="Warehouse name")
    wh_is_default: bool = Field(..., description="Is default warehouse")

    @computed_field
    @property
    def label(self) -> str:
        """Get dropdown label."""
        return f"{self.wh_code} - {self.wh_name}"

    @computed_field
    @property
    def value(self) -> int:
        """Get dropdown value (ID)."""
        return self.wh_id


class WarehouseDropdownResponse(BaseModel):
    """Response for warehouse dropdown list."""
    items: List[WarehouseDropdownItem] = Field(
        ...,
        description="List of warehouses for dropdown"
    )
    default_warehouse_id: Optional[int] = Field(
        None,
        description="ID of the default warehouse"
    )


# ==========================================================================
# Stock Schemas
# ==========================================================================

class StockBase(BaseModel):
    """Base schema for Stock."""
    soc_id: int = Field(..., description="Society ID")
    prd_id: int = Field(..., description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    whs_id: Optional[int] = Field(None, description="Warehouse ID")
    stk_quantity: Decimal = Field(default=Decimal("0"), description="Quantity on hand")
    stk_quantity_reserved: Decimal = Field(default=Decimal("0"), description="Reserved quantity")
    stk_quantity_available: Decimal = Field(default=Decimal("0"), description="Available quantity")
    stk_min_quantity: Optional[Decimal] = Field(None, description="Minimum quantity threshold")
    stk_max_quantity: Optional[Decimal] = Field(None, description="Maximum quantity threshold")
    stk_reorder_quantity: Optional[Decimal] = Field(None, description="Reorder quantity")
    stk_location: Optional[str] = Field(None, max_length=100, description="Location in warehouse")
    stk_unit_cost: Optional[Decimal] = Field(None, description="Unit cost")
    stk_notes: Optional[str] = Field(None, description="Notes")


class StockCreate(StockBase):
    """Schema for creating a Stock record."""
    pass


class StockUpdate(BaseModel):
    """Schema for updating a Stock record."""
    stk_quantity: Optional[Decimal] = Field(None, description="Quantity on hand")
    stk_quantity_reserved: Optional[Decimal] = Field(None, description="Reserved quantity")
    stk_min_quantity: Optional[Decimal] = Field(None, description="Minimum quantity threshold")
    stk_max_quantity: Optional[Decimal] = Field(None, description="Maximum quantity threshold")
    stk_reorder_quantity: Optional[Decimal] = Field(None, description="Reorder quantity")
    stk_location: Optional[str] = Field(None, max_length=100, description="Location in warehouse")
    stk_unit_cost: Optional[Decimal] = Field(None, description="Unit cost")
    stk_notes: Optional[str] = Field(None, description="Notes")
    stk_is_active: Optional[bool] = Field(None, description="Is active")


class StockResponse(BaseModel):
    """Schema for Stock response."""
    model_config = ConfigDict(from_attributes=True)

    stk_id: int = Field(..., description="Stock ID")
    soc_id: int = Field(..., description="Society ID")
    prd_id: int = Field(..., description="Product ID")
    pit_id: Optional[int] = Field(None, description="Product instance ID")
    whs_id: Optional[int] = Field(None, description="Warehouse ID")
    stk_quantity: Decimal = Field(default=Decimal("0"), description="Quantity on hand")
    stk_quantity_reserved: Decimal = Field(default=Decimal("0"), description="Reserved quantity")
    stk_quantity_available: Decimal = Field(default=Decimal("0"), description="Available quantity")
    stk_min_quantity: Optional[Decimal] = Field(None, description="Minimum quantity threshold")
    stk_max_quantity: Optional[Decimal] = Field(None, description="Maximum quantity threshold")
    stk_reorder_quantity: Optional[Decimal] = Field(None, description="Reorder quantity")
    stk_location: Optional[str] = Field(None, description="Location in warehouse")
    stk_unit_cost: Optional[Decimal] = Field(None, description="Unit cost")
    stk_total_value: Optional[Decimal] = Field(None, description="Total value")
    stk_d_last_count: Optional[datetime] = Field(None, description="Last count date")
    stk_d_last_movement: Optional[datetime] = Field(None, description="Last movement date")
    stk_d_creation: Optional[datetime] = Field(None, description="Creation date")
    stk_d_update: Optional[datetime] = Field(None, description="Update date")
    stk_is_active: bool = Field(default=True, description="Is active")
    stk_notes: Optional[str] = Field(None, description="Notes")

    # Related data (optional, populated when needed)
    product_name: Optional[str] = Field(None, description="Product name")
    product_ref: Optional[str] = Field(None, description="Product reference")
    warehouse_name: Optional[str] = Field(None, description="Warehouse name")
    warehouse_code: Optional[str] = Field(None, description="Warehouse code")

    @computed_field
    @property
    def is_low_stock(self) -> bool:
        """Check if stock is below minimum."""
        if self.stk_min_quantity is None:
            return False
        return self.stk_quantity_available <= self.stk_min_quantity

    @computed_field
    @property
    def is_out_of_stock(self) -> bool:
        """Check if out of stock."""
        return self.stk_quantity_available <= Decimal("0")


class StockListResponse(BaseModel):
    """Schema for listing stock (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    stk_id: int = Field(..., description="Stock ID")
    prd_id: int = Field(..., description="Product ID")
    whs_id: Optional[int] = Field(None, description="Warehouse ID")
    stk_quantity: Decimal = Field(..., description="Quantity on hand")
    stk_quantity_available: Decimal = Field(..., description="Available quantity")
    stk_quantity_reserved: Decimal = Field(..., description="Reserved quantity")
    stk_is_active: bool = Field(default=True, description="Is active")

    # Denormalized for display
    product_name: Optional[str] = Field(None, description="Product name")
    product_ref: Optional[str] = Field(None, description="Product reference")
    warehouse_name: Optional[str] = Field(None, description="Warehouse name")


class StockListPaginatedResponse(BaseModel):
    """Paginated response for stock list."""
    items: List[StockListResponse] = Field(..., description="List of stock items")
    total: int = Field(..., description="Total count")
    skip: int = Field(..., description="Items skipped")
    limit: int = Field(..., description="Max items")


class StockSearchParams(BaseModel):
    """Search parameters for stock list."""
    search: Optional[str] = Field(None, description="Search term")
    soc_id: Optional[int] = Field(None, description="Society ID filter")
    whs_id: Optional[int] = Field(None, description="Warehouse ID filter")
    prd_id: Optional[int] = Field(None, description="Product ID filter")
    low_stock_only: bool = Field(default=False, description="Show only low stock items")
    out_of_stock_only: bool = Field(default=False, description="Show only out of stock items")
    is_active: Optional[bool] = Field(None, description="Active status filter")
    skip: int = Field(default=0, ge=0, description="Items to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Max items")
    sort_by: Optional[str] = Field(default="stk_id", description="Sort field")
    sort_order: Optional[str] = Field(default="asc", description="Sort order")


class StockAdjustment(BaseModel):
    """Schema for stock adjustment."""
    stk_id: int = Field(..., description="Stock ID to adjust")
    adjustment_quantity: Decimal = Field(..., description="Quantity to add (positive) or remove (negative)")
    reason: Optional[str] = Field(None, description="Reason for adjustment")


class StockLevelSummary(BaseModel):
    """Summary of stock levels."""
    total_items: int = Field(..., description="Total stock items")
    total_quantity: Decimal = Field(..., description="Total quantity")
    total_value: Decimal = Field(..., description="Total value")
    low_stock_count: int = Field(..., description="Items with low stock")
    out_of_stock_count: int = Field(..., description="Items out of stock")


# ==========================================================================
# Stock Movement Schemas
# ==========================================================================

class StockMovementLineBase(BaseModel):
    """Base schema for Stock Movement Line."""
    sml_prd_id: Optional[int] = Field(None, description="Product ID")
    sml_pit_id: Optional[int] = Field(None, description="Product instance ID")
    sml_prd_ref: Optional[str] = Field(None, max_length=100, description="Product reference")
    sml_prd_name: Optional[str] = Field(None, max_length=200, description="Product name")
    sml_description: Optional[str] = Field(None, max_length=500, description="Line description")
    sml_quantity: Decimal = Field(..., description="Expected quantity")
    sml_quantity_actual: Optional[Decimal] = Field(None, description="Actual quantity")
    sml_uom_id: Optional[int] = Field(None, description="Unit of measure ID")
    sml_unit_price: Optional[Decimal] = Field(None, description="Unit price")
    sml_unit_cost: Optional[Decimal] = Field(None, description="Unit cost")
    sml_location: Optional[str] = Field(None, max_length=50, description="Location")
    sml_batch_number: Optional[str] = Field(None, max_length=50, description="Batch number")
    sml_serial_number: Optional[str] = Field(None, max_length=100, description="Serial number")
    sml_expiry_date: Optional[datetime] = Field(None, description="Expiry date")
    sml_is_damaged: bool = Field(default=False, description="Is damaged")
    sml_damage_notes: Optional[str] = Field(None, max_length=500, description="Damage notes")


class StockMovementLineCreate(StockMovementLineBase):
    """Schema for creating a Stock Movement Line."""
    pass


class StockMovementLineUpdate(BaseModel):
    """Schema for updating a Stock Movement Line."""
    sml_quantity: Optional[Decimal] = Field(None, description="Expected quantity")
    sml_quantity_actual: Optional[Decimal] = Field(None, description="Actual quantity")
    sml_location: Optional[str] = Field(None, max_length=50, description="Location")
    sml_batch_number: Optional[str] = Field(None, max_length=50, description="Batch number")
    sml_serial_number: Optional[str] = Field(None, max_length=100, description="Serial number")
    sml_is_damaged: Optional[bool] = Field(None, description="Is damaged")
    sml_damage_notes: Optional[str] = Field(None, max_length=500, description="Damage notes")


class StockMovementLineResponse(StockMovementLineBase):
    """Schema for Stock Movement Line response."""
    model_config = ConfigDict(from_attributes=True)

    sml_id: int = Field(..., description="Line ID")
    sml_stm_id: int = Field(..., description="Movement ID")
    sml_total_price: Optional[Decimal] = Field(None, description="Total price")
    sml_total_cost: Optional[Decimal] = Field(None, description="Total cost")
    sml_created_at: Optional[datetime] = Field(None, description="Created at")

    @computed_field
    @property
    def quantity_variance(self) -> Optional[Decimal]:
        """Get quantity variance."""
        if self.sml_quantity_actual is None:
            return None
        return self.sml_quantity_actual - self.sml_quantity

    @computed_field
    @property
    def has_variance(self) -> bool:
        """Check if there is variance."""
        variance = self.quantity_variance
        return variance is not None and variance != Decimal("0")


class StockMovementBase(BaseModel):
    """Base schema for Stock Movement."""
    stm_type: MovementType = Field(..., description="Movement type")
    stm_date: datetime = Field(..., description="Movement date")
    stm_description: Optional[str] = Field(None, description="Description")
    stm_whs_id: Optional[int] = Field(None, description="Source warehouse ID")
    stm_whs_destination_id: Optional[int] = Field(None, description="Destination warehouse ID")
    stm_cli_id: Optional[int] = Field(None, description="Client ID")
    stm_sup_id: Optional[int] = Field(None, description="Supplier ID")
    stm_external_party: Optional[str] = Field(None, max_length=200, description="External party name")
    stm_is_loan: bool = Field(default=False, description="Is loan")
    stm_loan_return_date: Optional[datetime] = Field(None, description="Expected loan return date")
    stm_is_return: bool = Field(default=False, description="Is return")
    stm_return_reason: Optional[str] = Field(None, max_length=500, description="Return reason")
    stm_source_document: Optional[str] = Field(None, max_length=100, description="Source document reference")
    stm_tracking_number: Optional[str] = Field(None, max_length=100, description="Tracking number")
    stm_carrier: Optional[str] = Field(None, max_length=100, description="Carrier")
    stm_notes: Optional[str] = Field(None, description="Notes")
    stm_soc_id: Optional[int] = Field(None, description="Society ID")


class StockMovementCreate(StockMovementBase):
    """Schema for creating a Stock Movement."""
    lines: List[StockMovementLineCreate] = Field(
        default_factory=list,
        description="Movement lines"
    )


class StockMovementUpdate(BaseModel):
    """Schema for updating a Stock Movement."""
    stm_status: Optional[MovementStatus] = Field(None, description="Movement status")
    stm_date: Optional[datetime] = Field(None, description="Movement date")
    stm_description: Optional[str] = Field(None, description="Description")
    stm_whs_id: Optional[int] = Field(None, description="Source warehouse ID")
    stm_whs_destination_id: Optional[int] = Field(None, description="Destination warehouse ID")
    stm_cli_id: Optional[int] = Field(None, description="Client ID")
    stm_sup_id: Optional[int] = Field(None, description="Supplier ID")
    stm_external_party: Optional[str] = Field(None, max_length=200, description="External party name")
    stm_loan_return_date: Optional[datetime] = Field(None, description="Expected loan return date")
    stm_loan_returned: Optional[bool] = Field(None, description="Loan returned")
    stm_loan_return_actual_date: Optional[datetime] = Field(None, description="Actual return date")
    stm_return_reason: Optional[str] = Field(None, max_length=500, description="Return reason")
    stm_tracking_number: Optional[str] = Field(None, max_length=100, description="Tracking number")
    stm_carrier: Optional[str] = Field(None, max_length=100, description="Carrier")
    stm_notes: Optional[str] = Field(None, description="Notes")


class StockMovementResponse(StockMovementBase):
    """Schema for Stock Movement response."""
    model_config = ConfigDict(from_attributes=True)

    stm_id: int = Field(..., description="Movement ID")
    stm_reference: str = Field(..., description="Movement reference")
    stm_status: MovementStatus = Field(..., description="Movement status")
    stm_total_quantity: Decimal = Field(default=Decimal("0"), description="Total quantity")
    stm_total_quantity_actual: Optional[Decimal] = Field(None, description="Actual total quantity")
    stm_total_value: Decimal = Field(default=Decimal("0"), description="Total value")
    stm_total_lines: int = Field(default=0, description="Total lines")
    stm_is_valid: bool = Field(default=True, description="Is valid")
    stm_validated_at: Optional[datetime] = Field(None, description="Validated at")
    stm_created_at: Optional[datetime] = Field(None, description="Created at")
    stm_updated_at: Optional[datetime] = Field(None, description="Updated at")

    # Related data
    warehouse_name: Optional[str] = Field(None, description="Warehouse name")
    destination_warehouse_name: Optional[str] = Field(None, description="Destination warehouse name")
    client_name: Optional[str] = Field(None, description="Client name")

    @computed_field
    @property
    def is_inbound(self) -> bool:
        """Check if movement is inbound."""
        return self.stm_type in [
            MovementType.RECEIPT,
            MovementType.RETURN_IN,
            MovementType.LOAN_IN
        ]

    @computed_field
    @property
    def is_outbound(self) -> bool:
        """Check if movement is outbound."""
        return self.stm_type in [
            MovementType.SHIPMENT,
            MovementType.RETURN_OUT,
            MovementType.DAMAGE,
            MovementType.DESTROY,
            MovementType.LOAN_OUT
        ]

    @computed_field
    @property
    def is_transfer(self) -> bool:
        """Check if movement is transfer."""
        return self.stm_type == MovementType.TRANSFER


class StockMovementWithLinesResponse(StockMovementResponse):
    """Schema for Stock Movement response with lines."""
    lines: List[StockMovementLineResponse] = Field(
        default_factory=list,
        description="Movement lines"
    )

    @computed_field
    @property
    def line_count(self) -> int:
        """Get line count."""
        return len(self.lines)


class StockMovementListResponse(BaseModel):
    """Schema for listing stock movements (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    stm_id: int = Field(..., description="Movement ID")
    stm_reference: str = Field(..., description="Movement reference")
    stm_type: MovementType = Field(..., description="Movement type")
    stm_status: MovementStatus = Field(..., description="Movement status")
    stm_date: datetime = Field(..., description="Movement date")
    stm_total_quantity: Decimal = Field(..., description="Total quantity")
    stm_total_lines: int = Field(..., description="Total lines")
    warehouse_name: Optional[str] = Field(None, description="Warehouse name")


class StockMovementListPaginatedResponse(BaseModel):
    """Paginated response for stock movement list."""
    items: List[StockMovementListResponse] = Field(..., description="List of movements")
    total: int = Field(..., description="Total count")
    skip: int = Field(..., description="Items skipped")
    limit: int = Field(..., description="Max items")


class StockMovementSearchParams(BaseModel):
    """Search parameters for stock movement list."""
    search: Optional[str] = Field(None, description="Search term")
    stm_type: Optional[MovementType] = Field(None, description="Movement type filter")
    stm_status: Optional[MovementStatus] = Field(None, description="Status filter")
    whs_id: Optional[int] = Field(None, description="Warehouse ID filter")
    cli_id: Optional[int] = Field(None, description="Client ID filter")
    soc_id: Optional[int] = Field(None, description="Society ID filter")
    date_from: Optional[datetime] = Field(None, description="Date from")
    date_to: Optional[datetime] = Field(None, description="Date to")
    skip: int = Field(default=0, ge=0, description="Items to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Max items")
    sort_by: Optional[str] = Field(default="stm_date", description="Sort field")
    sort_order: Optional[str] = Field(default="desc", description="Sort order")


# ==========================================================================
# Stock API Response Schemas
# ==========================================================================

class StockAPIResponse(BaseModel):
    """Standard API response wrapper for stock operations."""
    success: bool = Field(True, description="Operation successful")
    message: Optional[str] = Field(None, description="Optional message")
    data: Optional[StockResponse] = Field(None, description="Stock data")


class StockMovementAPIResponse(BaseModel):
    """Standard API response wrapper for stock movement operations."""
    success: bool = Field(True, description="Operation successful")
    message: Optional[str] = Field(None, description="Optional message")
    data: Optional[StockMovementWithLinesResponse] = Field(None, description="Movement data")


# ==========================================================================
# Shelf Schemas
# ==========================================================================

class ShelfCreate(BaseModel):
    """Schema for creating a Shelf in a warehouse."""
    she_code: Optional[str] = Field(None, max_length=200, description="Shelf code/label")
    she_floor: Optional[int] = Field(None, description="Floor number")
    she_line: Optional[int] = Field(None, description="Line/aisle number")
    she_row: Optional[int] = Field(None, description="Row number")
    she_length: Optional[Decimal] = Field(None, description="Shelf length")
    she_width: Optional[Decimal] = Field(None, description="Shelf width")
    she_height: Optional[Decimal] = Field(None, description="Shelf height")
    she_available_volume: Optional[Decimal] = Field(None, description="Available volume")


class ShelfUpdate(BaseModel):
    """Schema for updating a Shelf."""
    she_code: Optional[str] = Field(None, max_length=200, description="Shelf code/label")
    she_floor: Optional[int] = Field(None, description="Floor number")
    she_line: Optional[int] = Field(None, description="Line/aisle number")
    she_row: Optional[int] = Field(None, description="Row number")
    she_length: Optional[Decimal] = Field(None, description="Shelf length")
    she_width: Optional[Decimal] = Field(None, description="Shelf width")
    she_height: Optional[Decimal] = Field(None, description="Shelf height")
    she_available_volume: Optional[Decimal] = Field(None, description="Available volume")


class ShelfResponse(BaseModel):
    """Schema for Shelf response."""
    model_config = ConfigDict(from_attributes=True)

    she_id: int = Field(..., description="Shelf ID")
    whs_id: int = Field(..., description="Warehouse ID")
    she_code: Optional[str] = Field(None, description="Shelf code/label")
    she_floor: Optional[int] = Field(None, description="Floor number")
    she_line: Optional[int] = Field(None, description="Line/aisle number")
    she_row: Optional[int] = Field(None, description="Row number")
    she_length: Optional[Decimal] = Field(None, description="Shelf length")
    she_width: Optional[Decimal] = Field(None, description="Shelf width")
    she_height: Optional[Decimal] = Field(None, description="Shelf height")
    she_available_volume: Optional[Decimal] = Field(None, description="Available volume")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get shelf display name."""
        parts = []
        if self.she_code:
            parts.append(self.she_code)
        if self.she_floor is not None:
            parts.append(f"F{self.she_floor}")
        if self.she_line is not None:
            parts.append(f"L{self.she_line}")
        if self.she_row is not None:
            parts.append(f"R{self.she_row}")
        return " - ".join(parts) if parts else f"Shelf #{self.she_id}"

    @computed_field
    @property
    def location(self) -> str:
        """Get shelf location string (floor/line/row)."""
        parts = []
        if self.she_floor is not None:
            parts.append(f"Floor {self.she_floor}")
        if self.she_line is not None:
            parts.append(f"Line {self.she_line}")
        if self.she_row is not None:
            parts.append(f"Row {self.she_row}")
        return ", ".join(parts) if parts else ""


class ShelfDetailResponse(BaseModel):
    """Schema for shelf detail response with camelCase field names for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="she_id", description="Shelf ID")
    warehouseId: int = Field(..., validation_alias="whs_id", description="Warehouse ID")
    code: Optional[str] = Field(None, validation_alias="she_code", description="Shelf code")
    floor: Optional[int] = Field(None, validation_alias="she_floor", description="Floor number")
    line: Optional[int] = Field(None, validation_alias="she_line", description="Line/aisle number")
    row: Optional[int] = Field(None, validation_alias="she_row", description="Row number")
    length: Optional[Decimal] = Field(None, validation_alias="she_length", description="Shelf length")
    width: Optional[Decimal] = Field(None, validation_alias="she_width", description="Shelf width")
    height: Optional[Decimal] = Field(None, validation_alias="she_height", description="Shelf height")
    availableVolume: Optional[Decimal] = Field(
        None, validation_alias="she_availabel_volume", description="Available volume"
    )


class ShelfListPaginatedResponse(BaseModel):
    """Paginated response for shelf list."""
    items: List[ShelfResponse] = Field(..., description="List of shelves")
    total: int = Field(..., description="Total count of shelves")


class ShelfProductResponse(BaseModel):
    """Schema for products stored on a shelf."""
    model_config = ConfigDict(from_attributes=True)

    psh_id: int = Field(..., description="Product-shelf link ID")
    inv_id: int = Field(..., description="Inventory ID")
    whs_id: int = Field(..., description="Warehouse ID")
    she_id: int = Field(..., description="Shelf ID")
    product_name: Optional[str] = Field(None, description="Product name")
    product_ref: Optional[str] = Field(None, description="Product reference")
    quantity: Optional[Decimal] = Field(None, description="Quantity on hand")


# ==========================================================================
# 3D Warehouse Layout Schemas
# ==========================================================================

class PalletSlot(BaseModel):
    """Pallet slot within a shelf in 3D layout."""
    bay: int = Field(..., ge=0, description="Bay index")
    binId: str = Field("", description="Bin location ID")
    stkId: Optional[int] = Field(None, description="Stock ID if assigned")


class ShelfConfig(BaseModel):
    """Shelf configuration in 3D layout."""
    level: int = Field(..., ge=0, description="Level index (0-based)")
    pallets: List[PalletSlot] = Field(default_factory=list, description="Pallet slots")


class RackPosition(BaseModel):
    """3D position of a rack."""
    x: float = Field(..., description="X coordinate")
    y: float = Field(0.0, description="Y coordinate (usually 0)")
    z: float = Field(..., description="Z coordinate")


class RackDimensions(BaseModel):
    """Dimensions of a rack."""
    width: float = Field(..., gt=0, description="Width in meters")
    depth: float = Field(..., gt=0, description="Depth in meters")
    height: float = Field(..., gt=0, description="Height in meters")


class RackConfig(BaseModel):
    """Rack configuration in 3D layout."""
    id: str = Field(..., description="Unique rack ID")
    position: RackPosition = Field(..., description="Position in 3D space")
    dimensions: RackDimensions = Field(..., description="Rack dimensions")
    levels: int = Field(..., ge=1, le=10, description="Number of shelf levels")
    bays: int = Field(..., ge=1, le=10, description="Number of bays per level")
    shelves: List[ShelfConfig] = Field(default_factory=list, description="Shelf configurations")


class AisleConfig(BaseModel):
    """Aisle configuration in 3D layout."""
    id: str = Field(..., description="Unique aisle ID")
    start: dict = Field(..., description="Start point {x, z}")
    end: dict = Field(..., description="End point {x, z}")
    width: float = Field(..., gt=0, description="Aisle width in meters")


class WarehouseDimensions(BaseModel):
    """Overall warehouse dimensions."""
    width: float = Field(..., gt=0, description="Width in meters")
    depth: float = Field(..., gt=0, description="Depth in meters")
    height: float = Field(..., gt=0, description="Height in meters")


class WarehouseLayoutJson(BaseModel):
    """Complete 3D warehouse layout schema (stored as JSON)."""
    version: str = Field("1.0.0", description="Schema version")
    warehouseId: Optional[int] = Field(None, description="Associated warehouse ID")
    name: Optional[str] = Field(None, description="Layout name")
    dimensions: WarehouseDimensions = Field(..., description="Warehouse dimensions")
    gridSize: float = Field(1.0, gt=0, description="Grid cell size in meters")
    racks: List[RackConfig] = Field(default_factory=list, description="Rack configurations")
    aisles: List[AisleConfig] = Field(default_factory=list, description="Aisle configurations")
    createdAt: Optional[str] = Field(None, description="Creation timestamp")
    updatedAt: Optional[str] = Field(None, description="Last update timestamp")


class WarehouseLayoutCreate(BaseModel):
    """Schema for creating a warehouse layout."""
    warehouseId: int = Field(..., description="Warehouse ID")
    name: Optional[str] = Field(None, max_length=100, description="Layout name")
    layoutJson: WarehouseLayoutJson = Field(..., description="Layout data")


class WarehouseLayoutUpdate(BaseModel):
    """Schema for updating a warehouse layout."""
    name: Optional[str] = Field(None, max_length=100, description="Layout name")
    layoutJson: WarehouseLayoutJson = Field(..., description="Layout data")


class WarehouseLayoutResponse(BaseModel):
    """Schema for warehouse layout response."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Layout ID")
    warehouseId: int = Field(..., description="Warehouse ID")
    name: Optional[str] = Field(None, description="Layout name")
    version: str = Field(..., description="Schema version")
    layoutJson: WarehouseLayoutJson = Field(..., description="Layout data")
    createdAt: str = Field(..., description="Creation timestamp")
    updatedAt: str = Field(..., description="Last update timestamp")

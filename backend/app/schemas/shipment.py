"""
Shipment Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


# ==========================================================================
# Enums
# ==========================================================================

class ShipmentStatus(str, Enum):
    """Shipment status enum."""
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    EXCEPTION = "exception"
    RETURNED = "returned"
    CANCELLED = "cancelled"


# ==========================================================================
# Address Schemas
# ==========================================================================

class ShipmentAddressSchema(BaseModel):
    """Address schema for shipment origin/destination."""
    address: Optional[str] = Field(default=None, max_length=200)
    city: Optional[str] = Field(default=None, max_length=100)
    country_id: Optional[int] = None


# ==========================================================================
# Shipment Schemas
# ==========================================================================

class ShipmentBase(BaseModel):
    """Base shipment schema with common fields."""
    shp_car_id: int = Field(..., description="Carrier ID")
    shp_tracking_number: Optional[str] = Field(default=None, max_length=100)
    shp_sta_id: int = Field(..., description="Status ID")

    # Origin address
    shp_origin_address: Optional[str] = Field(default=None, max_length=200)
    shp_origin_city: Optional[str] = Field(default=None, max_length=100)
    shp_origin_country_id: Optional[int] = None

    # Destination address
    shp_destination_address: Optional[str] = Field(default=None, max_length=200)
    shp_destination_city: Optional[str] = Field(default=None, max_length=100)
    shp_destination_country_id: Optional[int] = None

    # Package info
    shp_weight: Optional[Decimal] = Field(default=None, ge=0)
    shp_packages: Optional[int] = Field(default=None, ge=0)

    # Delivery dates
    shp_estimated_delivery: Optional[datetime] = None

    # Cost
    shp_cost: Optional[Decimal] = Field(default=None, ge=0)
    shp_cur_id: Optional[int] = None

    # Notes
    shp_notes: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    """Schema for creating a shipment."""
    shp_reference: Optional[str] = Field(default=None, max_length=20)
    shp_del_id: Optional[int] = Field(default=None, description="Delivery Form ID")

    # Addresses (alternative format)
    origin_address: Optional[ShipmentAddressSchema] = None
    destination_address: Optional[ShipmentAddressSchema] = None


class ShipmentUpdate(BaseModel):
    """Schema for updating a shipment."""
    shp_del_id: Optional[int] = None
    shp_car_id: Optional[int] = None
    shp_tracking_number: Optional[str] = Field(default=None, max_length=100)
    shp_sta_id: Optional[int] = None

    # Origin address
    shp_origin_address: Optional[str] = Field(default=None, max_length=200)
    shp_origin_city: Optional[str] = Field(default=None, max_length=100)
    shp_origin_country_id: Optional[int] = None

    # Destination address
    shp_destination_address: Optional[str] = Field(default=None, max_length=200)
    shp_destination_city: Optional[str] = Field(default=None, max_length=100)
    shp_destination_country_id: Optional[int] = None

    # Package info
    shp_weight: Optional[Decimal] = Field(default=None, ge=0)
    shp_packages: Optional[int] = Field(default=None, ge=0)

    # Delivery dates
    shp_estimated_delivery: Optional[datetime] = None
    shp_actual_delivery: Optional[datetime] = None

    # Cost
    shp_cost: Optional[Decimal] = Field(default=None, ge=0)
    shp_cur_id: Optional[int] = None

    # Notes
    shp_notes: Optional[str] = None


class ShipmentResponse(BaseModel):
    """Schema for shipment response."""
    model_config = ConfigDict(from_attributes=True)

    shp_id: int
    shp_reference: str
    shp_del_id: Optional[int] = None
    shp_car_id: int
    shp_tracking_number: Optional[str] = None
    shp_sta_id: int

    # Origin address
    shp_origin_address: Optional[str] = None
    shp_origin_city: Optional[str] = None
    shp_origin_country_id: Optional[int] = None

    # Destination address
    shp_destination_address: Optional[str] = None
    shp_destination_city: Optional[str] = None
    shp_destination_country_id: Optional[int] = None

    # Package info
    shp_weight: Optional[Decimal] = None
    shp_packages: Optional[int] = None

    # Delivery dates
    shp_estimated_delivery: Optional[datetime] = None
    shp_actual_delivery: Optional[datetime] = None

    # Cost
    shp_cost: Optional[Decimal] = None
    shp_cur_id: Optional[int] = None

    # Notes
    shp_notes: Optional[str] = None

    # Audit
    shp_created_at: datetime
    shp_updated_at: Optional[datetime] = None


class ShipmentDetailResponse(ShipmentResponse):
    """Schema for shipment detail response with related entities."""
    # Related entity names (populated from joins)
    carrier_name: Optional[str] = None
    status_name: Optional[str] = None
    currency_code: Optional[str] = None
    origin_country_name: Optional[str] = None
    destination_country_name: Optional[str] = None
    delivery_form_reference: Optional[str] = None

    # Computed properties
    is_delivered: bool = False
    is_on_time: Optional[bool] = None
    full_origin_address: str = ""
    full_destination_address: str = ""


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class ShipmentSearchParams(BaseModel):
    """Schema for shipment search/filter parameters."""
    reference: Optional[str] = None
    carrier_id: Optional[int] = None
    status_id: Optional[int] = None
    delivery_form_id: Optional[int] = None
    tracking_number: Optional[str] = None
    origin_city: Optional[str] = None
    destination_city: Optional[str] = None
    origin_country_id: Optional[int] = None
    destination_country_id: Optional[int] = None

    # Date filters
    estimated_delivery_from: Optional[datetime] = None
    estimated_delivery_to: Optional[datetime] = None
    actual_delivery_from: Optional[datetime] = None
    actual_delivery_to: Optional[datetime] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None

    # Cost filters
    min_cost: Optional[Decimal] = None
    max_cost: Optional[Decimal] = None
    currency_id: Optional[int] = None

    # Pagination
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = "shp_created_at"
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class ShipmentListResponse(BaseModel):
    """Schema for paginated shipment list response."""
    items: List[ShipmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==========================================================================
# API Response Schemas
# ==========================================================================

class ShipmentAPIResponse(BaseModel):
    """Standard API response for shipment operations."""
    success: bool
    message: str
    data: Optional[ShipmentResponse] = None


class ShipmentErrorResponse(BaseModel):
    """Error response for shipment operations."""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[dict] = None


# ==========================================================================
# Tracking Schemas
# ==========================================================================

class TrackingEvent(BaseModel):
    """Schema for a tracking event."""
    timestamp: datetime
    status: str
    location: Optional[str] = None
    description: Optional[str] = None


class TrackingResponse(BaseModel):
    """Schema for tracking information response."""
    shipment_id: int
    reference: str
    tracking_number: Optional[str] = None
    carrier_name: Optional[str] = None
    current_status: str
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    events: List[TrackingEvent] = Field(default_factory=list)


# ==========================================================================
# Bulk Operation Schemas
# ==========================================================================

class BulkStatusUpdateRequest(BaseModel):
    """Schema for bulk status update request."""
    shipment_ids: List[int] = Field(..., min_length=1)
    new_status_id: int


class BulkStatusUpdateResponse(BaseModel):
    """Schema for bulk status update response."""
    success: bool
    updated_count: int
    failed_ids: List[int] = Field(default_factory=list)
    message: str

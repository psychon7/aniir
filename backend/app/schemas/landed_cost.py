"""
Landed Cost schemas for cost allocation strategies and calculations.
"""
from enum import Enum
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class AllocationStrategy(str, Enum):
    """Cost allocation strategy types."""
    WEIGHT = "WEIGHT"
    VOLUME = "VOLUME"
    VALUE = "VALUE"
    MIXED = "MIXED"


class LotStatus(str, Enum):
    """Supply lot status types."""
    DRAFT = "DRAFT"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    CLEARED = "CLEARED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class FreightCostType(str, Enum):
    """Freight cost types."""
    FREIGHT = "FREIGHT"
    CUSTOMS = "CUSTOMS"
    INSURANCE = "INSURANCE"
    LOCAL = "LOCAL"
    HANDLING = "HANDLING"
    OTHER = "OTHER"


class MixedStrategyWeights(BaseModel):
    """Weights for mixed allocation strategy (must sum to 100)."""
    weight_percent: Decimal = Field(default=Decimal("33.33"), ge=0, le=100)
    volume_percent: Decimal = Field(default=Decimal("33.33"), ge=0, le=100)
    value_percent: Decimal = Field(default=Decimal("33.34"), ge=0, le=100)
    
    @field_validator('value_percent')
    @classmethod
    def validate_total(cls, v, info):
        """Ensure percentages sum to 100."""
        weight_pct = info.data.get('weight_percent', Decimal("0"))
        volume_pct = info.data.get('volume_percent', Decimal("0"))
        total = weight_pct + volume_pct + v
        if abs(total - Decimal("100")) > Decimal("0.01"):
            raise ValueError(f"Percentages must sum to 100, got {total}")
        return v


class StrategyOption(BaseModel):
    """Strategy option for dropdown display."""
    value: AllocationStrategy
    label: str
    description: str
    icon: str


class LandedCostStrategyRequest(BaseModel):
    """Request to set allocation strategy for a shipment/order."""
    strategy: AllocationStrategy
    mixed_weights: Optional[MixedStrategyWeights] = None
    
    @field_validator('mixed_weights')
    @classmethod
    def validate_mixed_weights(cls, v, info):
        """Mixed weights required only for MIXED strategy."""
        strategy = info.data.get('strategy')
        if strategy == AllocationStrategy.MIXED and v is None:
            raise ValueError("mixed_weights required for MIXED strategy")
        return v


class LandedCostStrategyResponse(BaseModel):
    """Response with current strategy configuration."""
    strategy: AllocationStrategy
    mixed_weights: Optional[MixedStrategyWeights] = None
    strategy_options: List[StrategyOption]


class ProductAllocation(BaseModel):
    """Allocation result for a single product."""
    product_id: int
    product_reference: str
    product_name: str
    
    # Product metrics
    weight_kg: Decimal
    volume_m3: Decimal
    unit_value: Decimal
    quantity: int
    
    # Allocation percentages
    weight_share_percent: Decimal
    volume_share_percent: Decimal
    value_share_percent: Decimal
    final_share_percent: Decimal
    
    # Allocated costs
    allocated_freight: Decimal
    allocated_customs: Decimal
    allocated_insurance: Decimal
    allocated_other: Decimal
    total_allocated: Decimal
    
    # Final landed cost
    landed_cost_per_unit: Decimal


class LandedCostCalculationRequest(BaseModel):
    """Request to calculate landed costs for products."""
    strategy: AllocationStrategy = Field(default=AllocationStrategy.VALUE)
    mixed_weights: Optional[MixedStrategyWeights] = None
    recalculate: bool = Field(default=False, description="Force recalculation")

    # Total costs to allocate
    freight_cost: Decimal = Field(default=Decimal("0"), ge=0)
    customs_cost: Decimal = Field(default=Decimal("0"), ge=0)
    insurance_cost: Decimal = Field(default=Decimal("0"), ge=0)
    other_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Product IDs to calculate for (optional for lot-based calculation)
    product_ids: Optional[List[int]] = None
    quantities: Optional[dict[int, int]] = None  # product_id -> quantity


class LandedCostCalculationResponse(BaseModel):
    """Response with calculated landed costs."""
    strategy: AllocationStrategy
    total_cost_to_allocate: Decimal
    allocations: List[ProductAllocation]
    calculation_timestamp: datetime


# =============================================================================
# Supply Lot Schemas
# =============================================================================

class SupplyLotBase(BaseModel):
    """Base schema for supply lot."""
    lot_reference: Optional[str] = Field(None, max_length=100, description="Lot reference number")
    lot_date: Optional[datetime] = Field(None, description="Lot date")
    supplier_id: Optional[int] = Field(None, description="Supplier ID")
    description: Optional[str] = Field(None, max_length=500, description="Description")

    # Costs
    freight_cost: Decimal = Field(default=Decimal("0"), ge=0)
    customs_cost: Decimal = Field(default=Decimal("0"), ge=0)
    insurance_cost: Decimal = Field(default=Decimal("0"), ge=0)
    other_cost: Decimal = Field(default=Decimal("0"), ge=0)

    # Strategy
    allocation_strategy: Optional[AllocationStrategy] = Field(None, description="Cost allocation strategy")


class SupplyLotCreate(SupplyLotBase):
    """Schema for creating a supply lot."""
    lot_reference: str = Field(..., max_length=100, description="Lot reference number")
    lot_date: datetime = Field(default_factory=datetime.utcnow, description="Lot date")


class SupplyLotUpdate(SupplyLotBase):
    """Schema for updating a supply lot."""
    pass


class SupplyLotResponse(SupplyLotBase):
    """Response schema for supply lot."""
    id: int
    lot_reference: str
    lot_date: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplyLotListResponse(BaseModel):
    """Response for list of supply lots."""
    items: List[SupplyLotResponse]
    total: int
    page: int
    page_size: int


class SupplyLotSearchParams(BaseModel):
    """Search parameters for supply lots."""
    search: Optional[str] = None
    reference: Optional[str] = None
    name: Optional[str] = None
    supplier_id: Optional[int] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    status: Optional[LotStatus] = None
    origin_country_id: Optional[int] = None
    destination_country_id: Optional[int] = None
    allocation_completed: Optional[bool] = None
    society_id: Optional[int] = None
    bu_id: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="lot_created_at")
    sort_order: str = Field(default="desc")


# =============================================================================
# Supply Lot Item Schemas
# =============================================================================

class SupplyLotItemBase(BaseModel):
    """Base schema for supply lot item."""
    product_id: Optional[int] = Field(None, description="Product ID")
    product_instance_id: Optional[int] = Field(None, description="Product instance ID")
    quantity: int = Field(default=1, ge=1, description="Quantity")
    unit_price: Decimal = Field(default=Decimal("0"), ge=0, description="Unit price")
    weight_kg: Optional[Decimal] = Field(None, ge=0, description="Weight in kg")
    volume_m3: Optional[Decimal] = Field(None, ge=0, description="Volume in m3")


class SupplyLotItemCreate(SupplyLotItemBase):
    """Schema for creating a supply lot item."""
    supply_lot_id: Optional[int] = None
    product_id: int = Field(..., description="Product ID")


class SupplyLotItemUpdate(SupplyLotItemBase):
    """Schema for updating a supply lot item."""
    pass


class SupplyLotItemResponse(SupplyLotItemBase):
    """Response schema for supply lot item."""
    id: int
    supply_lot_id: int
    allocated_cost: Optional[Decimal] = None
    landed_cost_per_unit: Optional[Decimal] = None

    class Config:
        from_attributes = True


# =============================================================================
# Freight Cost Schemas
# =============================================================================

class FreightCostBase(BaseModel):
    """Base schema for freight cost."""
    cost_type: Optional[str] = Field(None, description="Cost type (FREIGHT, CUSTOMS, INSURANCE, OTHER)")
    description: Optional[str] = Field(None, max_length=500)
    amount: Decimal = Field(default=Decimal("0"), ge=0)
    currency: str = Field(default="EUR", max_length=3)


class FreightCostCreate(FreightCostBase):
    """Schema for creating a freight cost."""
    supply_lot_id: Optional[int] = None
    frc_lot_id: Optional[int] = None  # Alias for supply_lot_id
    cost_type: str = Field(..., description="Cost type")


class FreightCostUpdate(FreightCostBase):
    """Schema for updating a freight cost."""
    pass


class FreightCostResponse(FreightCostBase):
    """Response schema for freight cost."""
    id: int
    supply_lot_id: int
    created_at: Optional[datetime] = None
    frc_lot_id: Optional[int] = None  # Alias for supply_lot_id

    class Config:
        from_attributes = True


# =============================================================================
# Detailed Response Schemas
# =============================================================================

class SupplyLotDetailResponse(SupplyLotResponse):
    """Detailed response schema for supply lot with items and costs."""
    items: List[SupplyLotItemResponse] = []
    freight_costs: List[FreightCostResponse] = []
    total_product_value: Decimal = Decimal("0")
    total_weight_kg: Decimal = Decimal("0")
    total_volume_m3: Decimal = Decimal("0")
    allocation_completed: bool = False
    status: Optional[LotStatus] = None


class LandedCostBreakdownItem(BaseModel):
    """Breakdown of landed cost for a single item."""
    item_id: int
    product_id: int
    product_reference: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total_value: Decimal
    weight_kg: Decimal
    volume_m3: Decimal
    # Allocated costs
    freight_allocated: Decimal = Decimal("0")
    customs_allocated: Decimal = Decimal("0")
    insurance_allocated: Decimal = Decimal("0")
    other_allocated: Decimal = Decimal("0")
    total_allocated: Decimal = Decimal("0")
    # Final cost
    landed_cost_per_unit: Decimal = Decimal("0")
    total_landed_cost: Decimal = Decimal("0")


class LandedCostBreakdownResponse(BaseModel):
    """Response with detailed landed cost breakdown per SKU."""
    lot_id: int
    lot_reference: str
    strategy: AllocationStrategy
    total_product_value: Decimal
    total_freight_cost: Decimal
    total_customs_cost: Decimal
    total_insurance_cost: Decimal
    total_other_cost: Decimal
    total_landed_cost: Decimal
    items: List[LandedCostBreakdownItem]
    calculated_at: Optional[datetime] = None


class AllocationLogResponse(BaseModel):
    """Response for allocation history log entry."""
    id: int
    lot_id: int
    strategy: AllocationStrategy
    total_cost_allocated: Decimal
    calculated_at: datetime
    calculated_by: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

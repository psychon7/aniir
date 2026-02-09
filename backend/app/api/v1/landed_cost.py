"""
API endpoints for Landed Cost management.

Provides REST API for:
- Supply lot CRUD operations
- Lot item management
- Freight cost management
- Landed cost calculation and allocation
- Cost breakdown and reporting
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.landed_cost_service import (
    LandedCostService,
    LandedCostServiceError,
    LotNotFoundError,
    AllocationError,
    InsufficientDataError
)
from app.schemas.landed_cost import (
    # Supply Lot
    SupplyLotCreate, SupplyLotUpdate, SupplyLotResponse,
    SupplyLotDetailResponse, SupplyLotListResponse, SupplyLotSearchParams,
    LotStatus,
    # Lot Items
    SupplyLotItemCreate, SupplyLotItemUpdate, SupplyLotItemResponse,
    # Freight Costs
    FreightCostCreate, FreightCostUpdate, FreightCostResponse,
    FreightCostType,
    # Landed Cost Calculation
    LandedCostCalculationRequest, LandedCostCalculationResponse,
    LandedCostBreakdownResponse,
    AllocationStrategy,
    # Logs
    AllocationLogResponse
)

router = APIRouter(prefix="/landed-cost", tags=["Landed Cost"])


def get_landed_cost_service(db: Session = Depends(get_db)) -> LandedCostService:
    """Dependency to get LandedCostService instance."""
    return LandedCostService(db)


# =====================
# Supply Lot Endpoints
# =====================

@router.post(
    "/supply-lots",
    response_model=SupplyLotDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supply lot",
    description="Create a new supply lot for tracking imported goods and landed costs."
)
async def create_supply_lot(
    data: SupplyLotCreate,
    service: LandedCostService = Depends(get_landed_cost_service),
):
    """Create a new supply lot."""
    try:
        return await service.create_supply_lot(data, created_by=None)
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/supply-lots",
    response_model=SupplyLotListResponse,
    summary="Search supply lots",
    description="Search and filter supply lots with pagination."
)
async def search_supply_lots(
    reference: Optional[str] = Query(None, description="Filter by reference"),
    name: Optional[str] = Query(None, description="Filter by name"),
    lot_status: Optional[LotStatus] = Query(None, alias="status", description="Filter by status"),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier"),
    origin_country_id: Optional[int] = Query(None, description="Filter by origin country"),
    destination_country_id: Optional[int] = Query(None, description="Filter by destination country"),
    allocation_completed: Optional[bool] = Query(None, description="Filter by allocation status"),
    society_id: Optional[int] = Query(None, description="Filter by society"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("lot_created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Search supply lots with filters."""
    params = SupplyLotSearchParams(
        reference=reference,
        name=name,
        status=lot_status,
        supplier_id=supplier_id,
        origin_country_id=origin_country_id,
        destination_country_id=destination_country_id,
        allocation_completed=allocation_completed,
        society_id=society_id,
        bu_id=bu_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_supply_lots(params)


@router.get(
    "/supply-lots/{lot_id}",
    response_model=SupplyLotDetailResponse,
    summary="Get supply lot details",
    description="Get a supply lot by ID with all items and freight costs."
)
async def get_supply_lot(
    lot_id: int = Path(..., description="Supply lot ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Get supply lot details."""
    try:
        return await service.get_supply_lot(lot_id)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put(
    "/supply-lots/{lot_id}",
    response_model=SupplyLotDetailResponse,
    summary="Update a supply lot",
    description="Update supply lot details."
)
async def update_supply_lot(
    lot_id: int = Path(..., description="Supply lot ID"),
    data: SupplyLotUpdate = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Update a supply lot."""
    try:
        return await service.update_supply_lot(lot_id, data)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/supply-lots/{lot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supply lot",
    description="Delete a supply lot and all related data."
)
async def delete_supply_lot(
    lot_id: int = Path(..., description="Supply lot ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Delete a supply lot."""
    try:
        await service.delete_supply_lot(lot_id)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# =====================
# Lot Item Endpoints
# =====================

@router.post(
    "/supply-lots/{lot_id}/items",
    response_model=SupplyLotItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add item to supply lot",
    description="Add a product item to a supply lot."
)
async def add_lot_item(
    lot_id: int = Path(..., description="Supply lot ID"),
    data: SupplyLotItemCreate = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Add an item to a supply lot."""
    try:
        return await service.add_lot_item(lot_id, data)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/supply-lots/items/{item_id}",
    response_model=SupplyLotItemResponse,
    summary="Update lot item",
    description="Update a supply lot item."
)
async def update_lot_item(
    item_id: int = Path(..., description="Item ID"),
    data: SupplyLotItemUpdate = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Update a lot item."""
    try:
        return await service.update_lot_item(item_id, data)
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/supply-lots/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete lot item",
    description="Delete an item from a supply lot."
)
async def delete_lot_item(
    item_id: int = Path(..., description="Item ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Delete a lot item."""
    try:
        await service.delete_lot_item(item_id)
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================
# Freight Cost Endpoints
# =====================

@router.post(
    "/supply-lots/{lot_id}/freight-costs",
    response_model=FreightCostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add freight cost",
    description="Add a freight/customs/insurance cost to a supply lot."
)
async def add_freight_cost(
    lot_id: int = Path(..., description="Supply lot ID"),
    data: FreightCostCreate = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Add a freight cost to a supply lot."""
    data.frc_lot_id = lot_id
    try:
        return await service.add_freight_cost(data, created_by=None)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/supply-lots/freight-costs/{cost_id}",
    response_model=FreightCostResponse,
    summary="Update freight cost",
    description="Update a freight cost entry."
)
async def update_freight_cost(
    cost_id: int = Path(..., description="Freight cost ID"),
    data: FreightCostUpdate = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Update a freight cost."""
    try:
        return await service.update_freight_cost(cost_id, data)
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/supply-lots/freight-costs/{cost_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete freight cost",
    description="Delete a freight cost entry."
)
async def delete_freight_cost(
    cost_id: int = Path(..., description="Freight cost ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Delete a freight cost."""
    try:
        await service.delete_freight_cost(cost_id)
    except LandedCostServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================
# Landed Cost Calculation Endpoints
# =====================

@router.post(
    "/supply-lots/{lot_id}/calculate-landed-cost",
    response_model=LandedCostCalculationResponse,
    summary="Calculate landed cost",
    description="""
    Calculate and allocate landed costs for a supply lot.

    Allocation strategies:
    - **WEIGHT**: Costs allocated proportionally by weight
    - **VOLUME**: Costs allocated proportionally by volume (CBM)
    - **VALUE**: Costs allocated proportionally by product value
    - **MIXED**: Freight by volume, customs/insurance by value, local by weight
    """
)
async def calculate_landed_cost(
    lot_id: int = Path(..., description="Supply lot ID"),
    data: LandedCostCalculationRequest = ...,
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Calculate landed cost for a supply lot."""
    try:
        return await service.calculate_landed_cost(
            lot_id=lot_id,
            strategy=data.strategy,
            recalculate=data.recalculate,
            calculated_by=None
        )
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InsufficientDataError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except AllocationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/supply-lots/{lot_id}/landed-cost-breakdown",
    response_model=LandedCostBreakdownResponse,
    summary="Get landed cost breakdown",
    description="Get detailed landed cost breakdown per SKU for a supply lot."
)
async def get_landed_cost_breakdown(
    lot_id: int = Path(..., description="Supply lot ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Get detailed landed cost breakdown."""
    try:
        return await service.get_landed_cost_breakdown(lot_id)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/supply-lots/{lot_id}/allocation-history",
    response_model=List[AllocationLogResponse],
    summary="Get allocation history",
    description="Get history of landed cost calculations for a supply lot."
)
async def get_allocation_history(
    lot_id: int = Path(..., description="Supply lot ID"),
    service: LandedCostService = Depends(get_landed_cost_service)
):
    """Get allocation history for a supply lot."""
    try:
        return await service.get_allocation_history(lot_id)
    except LotNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# =====================
# Convenience Endpoints
# =====================

@router.get(
    "/allocation-strategies",
    response_model=List[dict],
    summary="Get available allocation strategies",
    description="Get list of available cost allocation strategies with descriptions."
)
async def get_allocation_strategies():
    """Get available allocation strategies."""
    return [
        {
            "value": "WEIGHT",
            "label": "By Weight",
            "description": "All costs allocated proportionally by weight (kg)"
        },
        {
            "value": "VOLUME",
            "label": "By Volume",
            "description": "All costs allocated proportionally by volume (CBM)"
        },
        {
            "value": "VALUE",
            "label": "By Value",
            "description": "All costs allocated proportionally by product value"
        },
        {
            "value": "MIXED",
            "label": "Mixed",
            "description": "Freight by volume, customs/insurance by value, local by weight"
        }
    ]


@router.get(
    "/freight-cost-types",
    response_model=List[dict],
    summary="Get freight cost types",
    description="Get list of available freight cost types."
)
async def get_freight_cost_types():
    """Get available freight cost types."""
    return [
        {"value": "FREIGHT", "label": "Freight", "description": "Shipping and transportation costs"},
        {"value": "CUSTOMS", "label": "Customs", "description": "Customs duties and taxes"},
        {"value": "INSURANCE", "label": "Insurance", "description": "Cargo insurance"},
        {"value": "LOCAL", "label": "Local Handling", "description": "Local delivery and handling"},
        {"value": "HANDLING", "label": "Handling", "description": "Port/warehouse handling fees"},
        {"value": "OTHER", "label": "Other", "description": "Other miscellaneous costs"}
    ]


@router.get(
    "/lot-statuses",
    response_model=List[dict],
    summary="Get lot statuses",
    description="Get list of available supply lot statuses."
)
async def get_lot_statuses():
    """Get available lot statuses."""
    return [
        {"value": "DRAFT", "label": "Draft", "description": "Initial draft state"},
        {"value": "IN_TRANSIT", "label": "In Transit", "description": "Goods are being shipped"},
        {"value": "ARRIVED", "label": "Arrived", "description": "Goods have arrived at destination"},
        {"value": "CLEARED", "label": "Cleared", "description": "Customs clearance completed"},
        {"value": "COMPLETED", "label": "Completed", "description": "All processing complete"},
        {"value": "CANCELLED", "label": "Cancelled", "description": "Lot has been cancelled"}
    ]

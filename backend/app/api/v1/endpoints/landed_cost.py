"""
Landed Cost API endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.landed_cost import (
    AllocationStrategy,
    LandedCostStrategyRequest,
    LandedCostStrategyResponse,
    LandedCostCalculationRequest,
    LandedCostCalculationResponse,
    MixedStrategyWeights,
)
from app.services.landed_cost_service import LandedCostService

router = APIRouter()


@router.get("/strategies", response_model=LandedCostStrategyResponse)
def get_strategy_options(
    current_strategy: Optional[AllocationStrategy] = None,
    db: Session = Depends(get_db)
):
    """
    Get available allocation strategies with descriptions.
    
    Returns list of strategy options for UI dropdown/selector.
    """
    service = LandedCostService(db)
    return service.get_strategy_options(current_strategy)


@router.post("/calculate", response_model=LandedCostCalculationResponse)
def calculate_landed_costs(
    request: LandedCostCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate landed costs for products using specified strategy.
    
    Distributes freight, customs, insurance, and other costs
    across products based on the selected allocation strategy.
    """
    try:
        service = LandedCostService(db)
        return service.calculate_landed_costs(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate-strategy", response_model=dict)
def validate_strategy(
    request: LandedCostStrategyRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a strategy configuration.
    
    Useful for form validation before saving.
    """
    # If we get here, Pydantic validation passed
    return {
        "valid": True,
        "strategy": request.strategy,
        "message": "Strategy configuration is valid"
    }

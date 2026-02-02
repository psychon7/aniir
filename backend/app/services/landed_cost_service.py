"""
Landed Cost Service - Handles cost allocation calculations.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.schemas.landed_cost import (
    AllocationStrategy,
    MixedStrategyWeights,
    StrategyOption,
    LandedCostStrategyResponse,
    LandedCostCalculationRequest,
    LandedCostCalculationResponse,
    ProductAllocation,
)
from app.models.product import Product


# =============================================================================
# Custom Exceptions
# =============================================================================

class LandedCostServiceError(Exception):
    """Base exception for landed cost service errors."""
    pass


class LotNotFoundError(LandedCostServiceError):
    """Raised when a supply lot is not found."""
    pass


class AllocationError(LandedCostServiceError):
    """Raised when cost allocation fails."""
    pass


class InsufficientDataError(LandedCostServiceError):
    """Raised when there is insufficient data for calculation."""
    pass


class LandedCostService:
    """Service for landed cost calculations and strategy management."""
    
    # Strategy options with metadata
    STRATEGY_OPTIONS: List[StrategyOption] = [
        StrategyOption(
            value=AllocationStrategy.WEIGHT,
            label="Weight-Based",
            description="Distribute costs proportionally by product weight (kg)",
            icon="Scale"
        ),
        StrategyOption(
            value=AllocationStrategy.VOLUME,
            label="Volume-Based",
            description="Distribute costs proportionally by product volume (m³)",
            icon="Box"
        ),
        StrategyOption(
            value=AllocationStrategy.VALUE,
            label="Value-Based",
            description="Distribute costs proportionally by product value",
            icon="DollarSign"
        ),
        StrategyOption(
            value=AllocationStrategy.MIXED,
            label="Mixed Strategy",
            description="Custom combination of weight, volume, and value",
            icon="Sliders"
        ),
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_strategy_options(
        self,
        current_strategy: Optional[AllocationStrategy] = None,
        current_weights: Optional[MixedStrategyWeights] = None
    ) -> LandedCostStrategyResponse:
        """Get available strategy options with current selection."""
        return LandedCostStrategyResponse(
            strategy=current_strategy or AllocationStrategy.VALUE,
            mixed_weights=current_weights,
            strategy_options=self.STRATEGY_OPTIONS
        )
    
    def calculate_landed_costs(
        self,
        request: LandedCostCalculationRequest
    ) -> LandedCostCalculationResponse:
        """Calculate landed costs for products using specified strategy."""
        
        # Fetch products
        products = self.db.query(Product).filter(
            Product.Id.in_(request.product_ids)
        ).all()
        
        if not products:
            raise ValueError("No products found for calculation")
        
        # Calculate totals for each metric
        total_weight = Decimal("0")
        total_volume = Decimal("0")
        total_value = Decimal("0")
        
        product_metrics = {}
        for product in products:
            qty = request.quantities.get(product.Id, 1)
            weight = Decimal(str(product.Weight or 0)) * qty
            
            # Calculate volume from dimensions (L x W x H in cm -> m³)
            length = Decimal(str(product.Length or 0)) / 100
            width = Decimal(str(product.Width or 0)) / 100
            height = Decimal(str(product.Height or 0)) / 100
            volume = length * width * height * qty
            
            value = Decimal(str(product.PurchasePrice or product.SellingPrice or 0)) * qty
            
            product_metrics[product.Id] = {
                'product': product,
                'quantity': qty,
                'weight': weight,
                'volume': volume,
                'value': value,
            }
            
            total_weight += weight
            total_volume += volume
            total_value += value
        
        # Calculate shares based on strategy
        total_cost = (
            request.freight_cost + 
            request.customs_cost + 
            request.insurance_cost + 
            request.other_cost
        )
        
        allocations = []
        for product_id, metrics in product_metrics.items():
            product = metrics['product']
            
            # Calculate percentage shares
            weight_share = (
                (metrics['weight'] / total_weight * 100) 
                if total_weight > 0 else Decimal("0")
            )
            volume_share = (
                (metrics['volume'] / total_volume * 100) 
                if total_volume > 0 else Decimal("0")
            )
            value_share = (
                (metrics['value'] / total_value * 100) 
                if total_value > 0 else Decimal("0")
            )
            
            # Calculate final share based on strategy
            final_share = self._calculate_final_share(
                request.strategy,
                request.mixed_weights,
                weight_share,
                volume_share,
                value_share
            )
            
            # Allocate costs
            share_decimal = final_share / 100
            allocated_freight = (request.freight_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_customs = (request.customs_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_insurance = (request.insurance_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            allocated_other = (request.other_cost * share_decimal).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            
            total_allocated = (
                allocated_freight + 
                allocated_customs + 
                allocated_insurance + 
                allocated_other
            )
            
            # Calculate per-unit landed cost
            qty = metrics['quantity']
            unit_value = Decimal(str(product.PurchasePrice or product.SellingPrice or 0))
            landed_cost_per_unit = (
                unit_value + (total_allocated / qty if qty > 0 else Decimal("0"))
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            allocations.append(ProductAllocation(
                product_id=product.Id,
                product_reference=product.Reference,
                product_name=product.Name,
                weight_kg=metrics['weight'].quantize(Decimal("0.001")),
                volume_m3=metrics['volume'].quantize(Decimal("0.000001")),
                unit_value=unit_value,
                quantity=qty,
                weight_share_percent=weight_share.quantize(Decimal("0.01")),
                volume_share_percent=volume_share.quantize(Decimal("0.01")),
                value_share_percent=value_share.quantize(Decimal("0.01")),
                final_share_percent=final_share.quantize(Decimal("0.01")),
                allocated_freight=allocated_freight,
                allocated_customs=allocated_customs,
                allocated_insurance=allocated_insurance,
                allocated_other=allocated_other,
                total_allocated=total_allocated,
                landed_cost_per_unit=landed_cost_per_unit,
            ))
        
        return LandedCostCalculationResponse(
            strategy=request.strategy,
            total_cost_to_allocate=total_cost,
            allocations=allocations,
            calculation_timestamp=datetime.utcnow()
        )
    
    def _calculate_final_share(
        self,
        strategy: AllocationStrategy,
        mixed_weights: Optional[MixedStrategyWeights],
        weight_share: Decimal,
        volume_share: Decimal,
        value_share: Decimal
    ) -> Decimal:
        """Calculate final allocation share based on strategy."""
        
        if strategy == AllocationStrategy.WEIGHT:
            return weight_share
        
        elif strategy == AllocationStrategy.VOLUME:
            return volume_share
        
        elif strategy == AllocationStrategy.VALUE:
            return value_share
        
        elif strategy == AllocationStrategy.MIXED:
            if not mixed_weights:
                # Default equal weights
                return (weight_share + volume_share + value_share) / 3
            
            return (
                (weight_share * mixed_weights.weight_percent / 100) +
                (volume_share * mixed_weights.volume_percent / 100) +
                (value_share * mixed_weights.value_percent / 100)
            )
        
        # Default to value-based
        return value_share

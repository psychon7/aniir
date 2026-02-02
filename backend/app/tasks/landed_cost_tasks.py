"""
Landed Cost Background Tasks

Handles asynchronous processing of landed cost calculations including:
- Batch recalculation of product costs
- Scheduled cost updates
- Cost propagation after rate changes
- Import cost processing
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from decimal import Decimal
from sqlalchemy import select, update, and_, or_
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.models.product import Product
from app.models.landed_cost import (
    LandedCostProfile,
    LandedCostComponent,
    ProductLandedCost,
    LandedCostHistory
)
from app.models.supplier import Supplier, SupplierProduct

logger = logging.getLogger(__name__)


class LandedCostTaskError(Exception):
    """Custom exception for landed cost task errors."""
    pass


class LandedCostTasks:
    """
    Background task handlers for landed cost calculations.
    
    These tasks can be triggered by:
    - API endpoints (manual recalculation)
    - Scheduled jobs (periodic updates)
    - Event handlers (rate changes, new imports)
    """
    
    @staticmethod
    async def recalculate_product_landed_cost(
        product_id: int,
        db: Session,
        user_id: Optional[int] = None,
        reason: str = "Manual recalculation"
    ) -> Dict[str, Any]:
        """
        Recalculate landed cost for a single product.
        
        Args:
            product_id: Product ID to recalculate
            db: Database session
            user_id: User triggering the recalculation
            reason: Reason for recalculation
            
        Returns:
            Dict with old and new cost values
        """
        logger.info(f"Starting landed cost recalculation for product {product_id}")
        
        try:
            # Get product with current landed cost
            product = db.execute(
                select(Product).where(Product.Id == product_id)
            ).scalar_one_or_none()
            
            if not product:
                raise LandedCostTaskError(f"Product {product_id} not found")
            
            # Get current landed cost record
            current_cost = db.execute(
                select(ProductLandedCost)
                .where(ProductLandedCost.ProductId == product_id)
                .where(ProductLandedCost.IsActive == True)
            ).scalar_one_or_none()
            
            old_total = current_cost.TotalLandedCost if current_cost else Decimal("0")
            
            # Get applicable landed cost profile
            profile = await LandedCostTasks._get_applicable_profile(
                product_id, db
            )
            
            if not profile:
                logger.warning(f"No landed cost profile found for product {product_id}")
                return {
                    "product_id": product_id,
                    "status": "skipped",
                    "reason": "No applicable profile"
                }
            
            # Calculate new landed cost
            base_cost = await LandedCostTasks._get_product_base_cost(product_id, db)
            new_cost_breakdown = await LandedCostTasks._calculate_cost_components(
                base_cost, profile, db
            )
            
            new_total = sum(new_cost_breakdown.values())
            
            # Update or create landed cost record
            if current_cost:
                # Archive old record
                current_cost.IsActive = False
                current_cost.UpdatedAt = datetime.utcnow()
                current_cost.UpdatedBy = user_id
            
            # Create new record
            new_landed_cost = ProductLandedCost(
                ProductId=product_id,
                ProfileId=profile.Id,
                BaseCost=base_cost,
                FreightCost=new_cost_breakdown.get("freight", Decimal("0")),
                DutyCost=new_cost_breakdown.get("duty", Decimal("0")),
                InsuranceCost=new_cost_breakdown.get("insurance", Decimal("0")),
                HandlingCost=new_cost_breakdown.get("handling", Decimal("0")),
                OtherCosts=new_cost_breakdown.get("other", Decimal("0")),
                TotalLandedCost=new_total,
                CurrencyId=profile.CurrencyId,
                EffectiveDate=datetime.utcnow(),
                IsActive=True,
                CreatedAt=datetime.utcnow(),
                CreatedBy=user_id
            )
            db.add(new_landed_cost)
            
            # Create history record
            history = LandedCostHistory(
                ProductId=product_id,
                ProfileId=profile.Id,
                OldTotalCost=old_total,
                NewTotalCost=new_total,
                ChangeReason=reason,
                ChangedAt=datetime.utcnow(),
                ChangedBy=user_id,
                CostBreakdown=str(new_cost_breakdown)
            )
            db.add(history)
            
            db.commit()
            
            logger.info(
                f"Landed cost updated for product {product_id}: "
                f"{old_total} -> {new_total}"
            )
            
            return {
                "product_id": product_id,
                "status": "success",
                "old_total": float(old_total),
                "new_total": float(new_total),
                "change": float(new_total - old_total),
                "breakdown": {k: float(v) for k, v in new_cost_breakdown.items()}
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error recalculating landed cost for product {product_id}: {e}")
            raise LandedCostTaskError(f"Recalculation failed: {str(e)}")
    
    @staticmethod
    async def batch_recalculate_landed_costs(
        product_ids: Optional[List[int]] = None,
        profile_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        category_id: Optional[int] = None,
        user_id: Optional[int] = None,
        reason: str = "Batch recalculation"
    ) -> Dict[str, Any]:
        """
        Batch recalculate landed costs for multiple products.
        
        Args:
            product_ids: Specific product IDs (if None, uses filters)
            profile_id: Filter by landed cost profile
            supplier_id: Filter by supplier
            category_id: Filter by category
            user_id: User triggering the recalculation
            reason: Reason for recalculation
            
        Returns:
            Summary of batch operation results
        """
        logger.info("Starting batch landed cost recalculation")
        
        results = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "errors": [],
            "details": []
        }
        
        with get_db_session() as db:
            try:
                # Build query for products to process
                if product_ids:
                    products_query = select(Product.Id).where(
                        Product.Id.in_(product_ids)
                    )
                else:
                    products_query = select(Product.Id).where(Product.IsActive == True)
                    
                    if supplier_id:
                        # Get products from specific supplier
                        supplier_products = db.execute(
                            select(SupplierProduct.ProductId)
                            .where(SupplierProduct.SupplierId == supplier_id)
                        ).scalars().all()
                        products_query = products_query.where(
                            Product.Id.in_(supplier_products)
                        )
                    
                    if category_id:
                        products_query = products_query.where(
                            Product.CategoryId == category_id
                        )
                
                product_ids_to_process = db.execute(products_query).scalars().all()
                results["total"] = len(product_ids_to_process)
                
                logger.info(f"Processing {results['total']} products")
                
                # Process each product
                for pid in product_ids_to_process:
                    try:
                        result = await LandedCostTasks.recalculate_product_landed_cost(
                            product_id=pid,
                            db=db,
                            user_id=user_id,
                            reason=reason
                        )
                        
                        if result["status"] == "success":
                            results["success"] += 1
                        else:
                            results["skipped"] += 1
                        
                        results["details"].append(result)
                        
                    except Exception as e:
                        results["failed"] += 1
                        results["errors"].append({
                            "product_id": pid,
                            "error": str(e)
                        })
                        logger.error(f"Failed to process product {pid}: {e}")
                
                logger.info(
                    f"Batch recalculation complete: "
                    f"{results['success']} success, "
                    f"{results['failed']} failed, "
                    f"{results['skipped']} skipped"
                )
                
                return results
                
            except Exception as e:
                logger.error(f"Batch recalculation failed: {e}")
                raise LandedCostTaskError(f"Batch operation failed: {str(e)}")
    
    @staticmethod
    async def propagate_profile_changes(
        profile_id: int,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Propagate landed cost profile changes to all affected products.
        
        Called when a profile's rates or components are modified.
        
        Args:
            profile_id: The modified profile ID
            user_id: User who made the changes
            
        Returns:
            Summary of propagation results
        """
        logger.info(f"Propagating changes for profile {profile_id}")
        
        with get_db_session() as db:
            # Get all products using this profile
            affected_products = db.execute(
                select(ProductLandedCost.ProductId)
                .where(ProductLandedCost.ProfileId == profile_id)
                .where(ProductLandedCost.IsActive == True)
            ).scalars().all()
            
            if not affected_products:
                logger.info(f"No products affected by profile {profile_id}")
                return {
                    "profile_id": profile_id,
                    "affected_products": 0,
                    "status": "no_changes"
                }
            
            # Batch recalculate affected products
            result = await LandedCostTasks.batch_recalculate_landed_costs(
                product_ids=list(affected_products),
                user_id=user_id,
                reason=f"Profile {profile_id} updated"
            )
            
            return {
                "profile_id": profile_id,
                "affected_products": len(affected_products),
                **result
            }
    
    @staticmethod
    async def scheduled_cost_update() -> Dict[str, Any]:
        """
        Scheduled task to update landed costs based on effective dates.
        
        Runs periodically to:
        - Apply scheduled rate changes
        - Expire old cost records
        - Recalculate costs with new exchange rates
        
        Returns:
            Summary of scheduled update results
        """
        logger.info("Running scheduled landed cost update")
        
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "profiles_updated": 0,
            "products_recalculated": 0,
            "errors": []
        }
        
        with get_db_session() as db:
            try:
                # Find profiles with pending effective dates
                now = datetime.utcnow()
                
                pending_profiles = db.execute(
                    select(LandedCostProfile)
                    .where(LandedCostProfile.EffectiveFrom <= now)
                    .where(
                        or_(
                            LandedCostProfile.EffectiveTo.is_(None),
                            LandedCostProfile.EffectiveTo >= now
                        )
                    )
                    .where(LandedCostProfile.IsActive == True)
                    .where(LandedCostProfile.NeedsRecalculation == True)
                ).scalars().all()
                
                for profile in pending_profiles:
                    try:
                        propagation_result = await LandedCostTasks.propagate_profile_changes(
                            profile_id=profile.Id,
                            user_id=None  # System update
                        )
                        
                        results["profiles_updated"] += 1
                        results["products_recalculated"] += propagation_result.get(
                            "success", 0
                        )
                        
                        # Mark profile as processed
                        profile.NeedsRecalculation = False
                        profile.LastCalculatedAt = now
                        db.commit()
                        
                    except Exception as e:
                        results["errors"].append({
                            "profile_id": profile.Id,
                            "error": str(e)
                        })
                        logger.error(f"Failed to process profile {profile.Id}: {e}")
                
                logger.info(
                    f"Scheduled update complete: "
                    f"{results['profiles_updated']} profiles, "
                    f"{results['products_recalculated']} products"
                )
                
                return results
                
            except Exception as e:
                logger.error(f"Scheduled update failed: {e}")
                raise LandedCostTaskError(f"Scheduled update failed: {str(e)}")
    
    @staticmethod
    async def process_import_costs(
        import_batch_id: int,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Process landed costs for a new import batch.
        
        Called when new products are imported or purchase orders are received.
        
        Args:
            import_batch_id: The import batch to process
            user_id: User processing the import
            
        Returns:
            Processing results
        """
        logger.info(f"Processing import costs for batch {import_batch_id}")
        
        # This would integrate with the import/purchase order system
        # For now, return a placeholder structure
        
        return {
            "batch_id": import_batch_id,
            "status": "processed",
            "products_processed": 0,
            "total_landed_cost": 0.0
        }
    
    @staticmethod
    async def cleanup_expired_costs(days_old: int = 365) -> Dict[str, Any]:
        """
        Clean up old landed cost history records.
        
        Args:
            days_old: Delete records older than this many days
            
        Returns:
            Cleanup results
        """
        logger.info(f"Cleaning up landed cost records older than {days_old} days")
        
        with get_db_session() as db:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            # Count records to delete
            count = db.execute(
                select(LandedCostHistory)
                .where(LandedCostHistory.ChangedAt < cutoff_date)
            ).scalars().all()
            
            deleted_count = len(count)
            
            # Delete old history records
            db.execute(
                LandedCostHistory.__table__.delete().where(
                    LandedCostHistory.ChangedAt < cutoff_date
                )
            )
            db.commit()
            
            logger.info(f"Deleted {deleted_count} old history records")
            
            return {
                "deleted_records": deleted_count,
                "cutoff_date": cutoff_date.isoformat()
            }
    
    # Helper methods
    
    @staticmethod
    async def _get_applicable_profile(
        product_id: int,
        db: Session
    ) -> Optional[LandedCostProfile]:
        """Get the applicable landed cost profile for a product."""
        
        # First check for product-specific profile
        product_cost = db.execute(
            select(ProductLandedCost)
            .where(ProductLandedCost.ProductId == product_id)
            .where(ProductLandedCost.IsActive == True)
        ).scalar_one_or_none()
        
        if product_cost and product_cost.ProfileId:
            return db.execute(
                select(LandedCostProfile)
                .where(LandedCostProfile.Id == product_cost.ProfileId)
            ).scalar_one_or_none()
        
        # Get product details for category/supplier matching
        product = db.execute(
            select(Product).where(Product.Id == product_id)
        ).scalar_one_or_none()
        
        if not product:
            return None
        
        # Try to find profile by category
        if product.CategoryId:
            profile = db.execute(
                select(LandedCostProfile)
                .where(LandedCostProfile.CategoryId == product.CategoryId)
                .where(LandedCostProfile.IsActive == True)
                .where(LandedCostProfile.IsDefault == False)
            ).scalar_one_or_none()
            
            if profile:
                return profile
        
        # Fall back to default profile
        return db.execute(
            select(LandedCostProfile)
            .where(LandedCostProfile.IsDefault == True)
            .where(LandedCostProfile.IsActive == True)
        ).scalar_one_or_none()
    
    @staticmethod
    async def _get_product_base_cost(
        product_id: int,
        db: Session
    ) -> Decimal:
        """Get the base cost (purchase price) for a product."""
        
        # Get from primary supplier
        supplier_product = db.execute(
            select(SupplierProduct)
            .where(SupplierProduct.ProductId == product_id)
            .where(SupplierProduct.IsPrimary == True)
        ).scalar_one_or_none()
        
        if supplier_product and supplier_product.PurchasePrice:
            return Decimal(str(supplier_product.PurchasePrice))
        
        # Fall back to product's cost price
        product = db.execute(
            select(Product).where(Product.Id == product_id)
        ).scalar_one_or_none()
        
        if product and product.CostPrice:
            return Decimal(str(product.CostPrice))
        
        return Decimal("0")
    
    @staticmethod
    async def _calculate_cost_components(
        base_cost: Decimal,
        profile: LandedCostProfile,
        db: Session
    ) -> Dict[str, Decimal]:
        """Calculate individual cost components based on profile."""
        
        components = {
            "base": base_cost,
            "freight": Decimal("0"),
            "duty": Decimal("0"),
            "insurance": Decimal("0"),
            "handling": Decimal("0"),
            "other": Decimal("0")
        }
        
        # Get profile components
        profile_components = db.execute(
            select(LandedCostComponent)
            .where(LandedCostComponent.ProfileId == profile.Id)
            .where(LandedCostComponent.IsActive == True)
        ).scalars().all()
        
        for component in profile_components:
            component_type = component.ComponentType.lower()
            
            if component.CalculationType == "PERCENTAGE":
                # Calculate as percentage of base cost
                amount = base_cost * (Decimal(str(component.Rate)) / Decimal("100"))
            elif component.CalculationType == "FIXED":
                # Fixed amount
                amount = Decimal(str(component.Rate))
            elif component.CalculationType == "PER_UNIT":
                # Per unit (would need quantity, default to 1)
                amount = Decimal(str(component.Rate))
            else:
                amount = Decimal("0")
            
            # Map to component category
            if component_type in ["freight", "shipping", "transport"]:
                components["freight"] += amount
            elif component_type in ["duty", "customs", "tariff"]:
                components["duty"] += amount
            elif component_type in ["insurance"]:
                components["insurance"] += amount
            elif component_type in ["handling", "warehouse", "storage"]:
                components["handling"] += amount
            else:
                components["other"] += amount
        
        return components


# Task runner functions for external schedulers (Celery, APScheduler, etc.)

async def run_scheduled_cost_update():
    """Entry point for scheduled cost updates."""
    return await LandedCostTasks.scheduled_cost_update()


async def run_batch_recalculation(
    product_ids: Optional[List[int]] = None,
    profile_id: Optional[int] = None,
    user_id: Optional[int] = None
):
    """Entry point for batch recalculation."""
    return await LandedCostTasks.batch_recalculate_landed_costs(
        product_ids=product_ids,
        profile_id=profile_id,
        user_id=user_id
    )


async def run_cleanup(days_old: int = 365):
    """Entry point for cleanup task."""
    return await LandedCostTasks.cleanup_expired_costs(days_old=days_old)

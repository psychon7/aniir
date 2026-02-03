"""
Supplier Product Price Service Module.

Provides functionality for:
- Supplier product price CRUD operations
- Price search and filtering
- Best supplier price queries

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.supplier_product_price import SupplierProductPrice
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.currency import Currency
from app.schemas.supplier_product_price import (
    SupplierProductPriceCreate,
    SupplierProductPriceUpdate,
    SupplierProductPriceListResponse,
    SupplierProductResponse,
    BestSupplierPriceResponse,
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SupplierProductPriceServiceError(Exception):
    """Base exception for supplier product price service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SupplierProductPriceNotFoundError(SupplierProductPriceServiceError):
    """Raised when supplier product price is not found."""
    def __init__(self, price_id: int):
        super().__init__(
            code="SUPPLIER_PRODUCT_PRICE_NOT_FOUND",
            message=f"Supplier product price with ID {price_id} not found",
            details={"price_id": price_id}
        )


class NoBestPriceFoundError(SupplierProductPriceServiceError):
    """Raised when no valid supplier price is found for a product."""
    def __init__(self, product_id: int):
        super().__init__(
            code="NO_BEST_PRICE_FOUND",
            message=f"No valid supplier price found for product {product_id}",
            details={"product_id": product_id}
        )


# ==========================================================================
# Supplier Product Price Service Class
# ==========================================================================

class SupplierProductPriceService:
    """
    Service class for supplier product price operations.
    Uses asyncio.to_thread() for async compatibility.
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_prices(
        self,
        supplier_id: int,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[int] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """Synchronous list supplier product prices."""
        base_filters = [SupplierProductPrice.spp_sup_id == supplier_id]

        if active_only:
            base_filters.append(SupplierProductPrice.spp_is_active == True)

        if product_id:
            base_filters.append(SupplierProductPrice.spp_prd_id == product_id)

        # Get total count
        count_query = select(func.count(SupplierProductPrice.spp_id)).where(*base_filters)
        total = self.db.execute(count_query).scalar() or 0

        # Get prices
        query = (
            select(SupplierProductPrice)
            .where(*base_filters)
            .order_by(SupplierProductPrice.spp_priority, SupplierProductPrice.spp_prd_id)
            .offset(skip)
            .limit(limit)
        )

        result = self.db.execute(query)
        prices = list(result.scalars().all())

        # Enrich with product and currency info
        enriched_prices = []
        for price in prices:
            price_dict = SupplierProductPriceListResponse.model_validate(price).model_dump()

            # Get product info
            product = self.db.get(Product, price.spp_prd_id)
            if product:
                price_dict["productReference"] = product.prd_ref
                price_dict["productName"] = product.prd_name

            # Get currency info
            if price.spp_cur_id:
                currency = self.db.get(Currency, price.spp_cur_id)
                if currency:
                    price_dict["currencyCode"] = currency.cur_designation

            enriched_prices.append(price_dict)

        return enriched_prices, total

    def _sync_list_products(
        self,
        supplier_id: int,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """Synchronous list supplier's products (products this supplier provides)."""
        base_filters = [SupplierProductPrice.spp_sup_id == supplier_id]

        if active_only:
            base_filters.append(SupplierProductPrice.spp_is_active == True)

        # Get total count
        count_query = select(func.count(SupplierProductPrice.spp_id)).where(*base_filters)
        total = self.db.execute(count_query).scalar() or 0

        # Get prices with products
        query = (
            select(SupplierProductPrice)
            .where(*base_filters)
            .order_by(SupplierProductPrice.spp_is_preferred.desc(), SupplierProductPrice.spp_priority)
            .offset(skip)
            .limit(limit)
        )

        result = self.db.execute(query)
        prices = list(result.scalars().all())

        # Build product list with pricing info
        products = []
        for price in prices:
            product = self.db.get(Product, price.spp_prd_id)
            if not product:
                continue

            # Apply search filter if provided
            if search:
                search_lower = search.lower()
                if (search_lower not in (product.prd_ref or "").lower() and
                    search_lower not in (product.prd_name or "").lower() and
                    search_lower not in (price.spp_supplier_ref or "").lower()):
                    continue

            # Get currency
            currency_code = None
            if price.spp_cur_id:
                currency = self.db.get(Currency, price.spp_cur_id)
                if currency:
                    currency_code = currency.cur_designation

            products.append({
                "priceId": price.spp_id,
                "productId": product.prd_id,
                "productReference": product.prd_ref,
                "productName": product.prd_name,
                "supplierRef": price.spp_supplier_ref,
                "supplierProductName": price.spp_supplier_name,
                "unitCost": price.spp_unit_cost,
                "discountPercent": price.spp_discount_percent,
                "minOrderQty": price.spp_min_order_qty,
                "leadTimeDays": price.spp_lead_time_days,
                "currencyCode": currency_code,
                "isPreferred": price.spp_is_preferred,
                "priority": price.spp_priority,
                "isActive": price.spp_is_active,
            })

        return products, total

    def _sync_get_price(self, price_id: int) -> SupplierProductPrice:
        """Synchronous get price by ID."""
        result = self.db.get(SupplierProductPrice, price_id)
        if not result:
            raise SupplierProductPriceNotFoundError(price_id)
        return result

    def _sync_get_best_price(self, product_id: int, quantity: Optional[int] = None) -> dict:
        """Get the best supplier price for a product."""
        filters = [
            SupplierProductPrice.spp_prd_id == product_id,
            SupplierProductPrice.spp_is_active == True,
        ]

        # Add validity date check
        now = datetime.utcnow()
        filters.append(
            (SupplierProductPrice.spp_valid_from == None) |
            (SupplierProductPrice.spp_valid_from <= now)
        )
        filters.append(
            (SupplierProductPrice.spp_valid_to == None) |
            (SupplierProductPrice.spp_valid_to >= now)
        )

        # Add min order quantity check if provided
        if quantity:
            filters.append(
                (SupplierProductPrice.spp_min_order_qty == None) |
                (SupplierProductPrice.spp_min_order_qty <= quantity)
            )

        # Order by: preferred first, then by priority, then by cost
        query = (
            select(SupplierProductPrice)
            .where(and_(*filters))
            .order_by(
                SupplierProductPrice.spp_is_preferred.desc(),
                SupplierProductPrice.spp_priority,
                SupplierProductPrice.spp_unit_cost
            )
        )

        result = self.db.execute(query)
        best_price = result.scalars().first()

        if not best_price:
            raise NoBestPriceFoundError(product_id)

        # Get supplier name
        supplier = self.db.get(Supplier, best_price.spp_sup_id)
        supplier_name = supplier.sup_company_name if supplier else None

        return {
            "success": True,
            "productId": product_id,
            "supplierId": best_price.spp_sup_id,
            "supplierName": supplier_name,
            "unitCost": best_price.spp_unit_cost,
            "leadTimeDays": best_price.spp_lead_time_days,
            "isPreferred": best_price.spp_is_preferred,
            "priceId": best_price.spp_id,
        }

    def _sync_create_price(
        self,
        data: SupplierProductPriceCreate,
        user_id: Optional[int] = None
    ) -> SupplierProductPrice:
        """Synchronous create supplier product price."""
        price_data = data.model_dump(exclude_unset=True)

        # Set audit fields
        price_data["spp_d_creation"] = datetime.utcnow()
        price_data["spp_d_update"] = datetime.utcnow()
        if user_id:
            price_data["spp_created_by"] = user_id

        price = SupplierProductPrice(**price_data)
        self.db.add(price)
        self.db.commit()
        self.db.refresh(price)
        return price

    def _sync_update_price(
        self,
        price_id: int,
        data: SupplierProductPriceUpdate,
        user_id: Optional[int] = None
    ) -> SupplierProductPrice:
        """Synchronous update supplier product price."""
        price = self._sync_get_price(price_id)

        update_data = data.model_dump(exclude_unset=True)
        update_data["spp_d_update"] = datetime.utcnow()
        if user_id:
            update_data["spp_updated_by"] = user_id

        for field, value in update_data.items():
            setattr(price, field, value)

        self.db.commit()
        self.db.refresh(price)
        return price

    def _sync_delete_price(self, price_id: int) -> bool:
        """Synchronous soft delete supplier product price."""
        price = self._sync_get_price(price_id)
        price.spp_is_active = False
        price.spp_d_update = datetime.utcnow()
        self.db.commit()
        return True

    def _sync_hard_delete_price(self, price_id: int) -> bool:
        """Synchronous hard delete supplier product price."""
        price = self._sync_get_price(price_id)
        self.db.delete(price)
        self.db.commit()
        return True

    def _sync_set_preferred(self, price_id: int) -> SupplierProductPrice:
        """Set a supplier as preferred for a product (unsets others)."""
        price = self._sync_get_price(price_id)

        # Unset other preferred flags for this product
        update_query = (
            select(SupplierProductPrice)
            .where(
                SupplierProductPrice.spp_prd_id == price.spp_prd_id,
                SupplierProductPrice.spp_is_preferred == True,
                SupplierProductPrice.spp_id != price_id
            )
        )
        result = self.db.execute(update_query)
        for other_price in result.scalars().all():
            other_price.spp_is_preferred = False

        # Set this one as preferred
        price.spp_is_preferred = True
        price.spp_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(price)
        return price

    # ==========================================================================
    # Async Wrapper Methods
    # ==========================================================================

    async def list_prices(
        self,
        supplier_id: int,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[int] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """List supplier product prices (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_list_prices, supplier_id, skip, limit, product_id, active_only
        )

    async def list_products(
        self,
        supplier_id: int,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """List supplier's products (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_list_products, supplier_id, skip, limit, search, active_only
        )

    async def get_price(self, price_id: int) -> SupplierProductPrice:
        """Get price by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_price, price_id)

    async def get_best_price(self, product_id: int, quantity: Optional[int] = None) -> dict:
        """Get best supplier price for product (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_best_price, product_id, quantity)

    async def create_price(
        self,
        data: SupplierProductPriceCreate,
        user_id: Optional[int] = None
    ) -> SupplierProductPrice:
        """Create supplier product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_price, data, user_id)

    async def update_price(
        self,
        price_id: int,
        data: SupplierProductPriceUpdate,
        user_id: Optional[int] = None
    ) -> SupplierProductPrice:
        """Update supplier product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_price, price_id, data, user_id)

    async def delete_price(self, price_id: int) -> bool:
        """Soft delete supplier product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_price, price_id)

    async def hard_delete_price(self, price_id: int) -> bool:
        """Hard delete supplier product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_hard_delete_price, price_id)

    async def set_preferred(self, price_id: int) -> SupplierProductPrice:
        """Set supplier as preferred for product (async wrapper)."""
        return await asyncio.to_thread(self._sync_set_preferred, price_id)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_supplier_product_price_service(
    db: Session = Depends(get_db)
) -> SupplierProductPriceService:
    """Dependency to get SupplierProductPriceService instance."""
    return SupplierProductPriceService(db)

"""
Client Product Price Service Module.

Provides functionality for:
- Client product price CRUD operations
- Price search and filtering
- Best price queries

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
from app.models.client_product_price import ClientProductPrice
from app.models.product import Product
from app.models.currency import Currency
from app.schemas.client_product_price import (
    ClientProductPriceCreate,
    ClientProductPriceUpdate,
    ClientProductPriceListResponse,
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class ClientProductPriceServiceError(Exception):
    """Base exception for client product price service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ClientProductPriceNotFoundError(ClientProductPriceServiceError):
    """Raised when client product price is not found."""
    def __init__(self, price_id: int):
        super().__init__(
            code="CLIENT_PRODUCT_PRICE_NOT_FOUND",
            message=f"Client product price with ID {price_id} not found",
            details={"price_id": price_id}
        )


class DuplicateClientProductPriceError(ClientProductPriceServiceError):
    """Raised when duplicate price exists for client/product combination."""
    def __init__(self, client_id: int, product_id: int):
        super().__init__(
            code="DUPLICATE_CLIENT_PRODUCT_PRICE",
            message=f"Price already exists for client {client_id} and product {product_id}",
            details={"client_id": client_id, "product_id": product_id}
        )


# ==========================================================================
# Client Product Price Service Class
# ==========================================================================

class ClientProductPriceService:
    """
    Service class for client product price operations.
    Uses asyncio.to_thread() for async compatibility.
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_prices(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[int] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """Synchronous list client product prices."""
        base_filters = [ClientProductPrice.cpp_cli_id == client_id]

        if active_only:
            base_filters.append(ClientProductPrice.cpp_is_active == True)

        if product_id:
            base_filters.append(ClientProductPrice.cpp_prd_id == product_id)

        # Get total count
        count_query = select(func.count(ClientProductPrice.cpp_id)).where(*base_filters)
        total = self.db.execute(count_query).scalar() or 0

        # Get prices with product info
        query = (
            select(ClientProductPrice)
            .where(*base_filters)
            .order_by(ClientProductPrice.cpp_prd_id)
            .offset(skip)
            .limit(limit)
        )

        result = self.db.execute(query)
        prices = list(result.scalars().all())

        # Enrich with product and currency info
        enriched_prices = []
        for price in prices:
            price_dict = ClientProductPriceListResponse.model_validate(price).model_dump()

            # Get product info
            product = self.db.get(Product, price.cpp_prd_id)
            if product:
                price_dict["productReference"] = product.prd_ref
                price_dict["productName"] = product.prd_name

            # Get currency info
            if price.cpp_cur_id:
                currency = self.db.get(Currency, price.cpp_cur_id)
                if currency:
                    price_dict["currencyCode"] = currency.cur_designation

            enriched_prices.append(price_dict)

        return enriched_prices, total

    def _sync_get_price(self, price_id: int) -> ClientProductPrice:
        """Synchronous get price by ID."""
        result = self.db.get(ClientProductPrice, price_id)
        if not result:
            raise ClientProductPriceNotFoundError(price_id)
        return result

    def _sync_get_price_for_product(
        self,
        client_id: int,
        product_id: int,
        quantity: Optional[int] = None
    ) -> Optional[ClientProductPrice]:
        """Get the applicable price for a client/product combination."""
        filters = [
            ClientProductPrice.cpp_cli_id == client_id,
            ClientProductPrice.cpp_prd_id == product_id,
            ClientProductPrice.cpp_is_active == True,
        ]

        # Add validity date check
        now = datetime.utcnow()
        filters.append(
            (ClientProductPrice.cpp_valid_from == None) |
            (ClientProductPrice.cpp_valid_from <= now)
        )
        filters.append(
            (ClientProductPrice.cpp_valid_to == None) |
            (ClientProductPrice.cpp_valid_to >= now)
        )

        # Add quantity check if provided
        if quantity:
            filters.append(
                (ClientProductPrice.cpp_min_quantity == None) |
                (ClientProductPrice.cpp_min_quantity <= quantity)
            )
            filters.append(
                (ClientProductPrice.cpp_max_quantity == None) |
                (ClientProductPrice.cpp_max_quantity >= quantity)
            )

        query = select(ClientProductPrice).where(and_(*filters))
        result = self.db.execute(query)
        return result.scalars().first()

    def _sync_create_price(
        self,
        data: ClientProductPriceCreate,
        user_id: Optional[int] = None
    ) -> ClientProductPrice:
        """Synchronous create client product price."""
        price_data = data.model_dump(exclude_unset=True)

        # Set audit fields
        price_data["cpp_d_creation"] = datetime.utcnow()
        price_data["cpp_d_update"] = datetime.utcnow()
        if user_id:
            price_data["cpp_created_by"] = user_id

        price = ClientProductPrice(**price_data)
        self.db.add(price)
        self.db.commit()
        self.db.refresh(price)
        return price

    def _sync_update_price(
        self,
        price_id: int,
        data: ClientProductPriceUpdate,
        user_id: Optional[int] = None
    ) -> ClientProductPrice:
        """Synchronous update client product price."""
        price = self._sync_get_price(price_id)

        update_data = data.model_dump(exclude_unset=True)
        update_data["cpp_d_update"] = datetime.utcnow()
        if user_id:
            update_data["cpp_updated_by"] = user_id

        for field, value in update_data.items():
            setattr(price, field, value)

        self.db.commit()
        self.db.refresh(price)
        return price

    def _sync_delete_price(self, price_id: int) -> bool:
        """Synchronous soft delete client product price."""
        price = self._sync_get_price(price_id)
        price.cpp_is_active = False
        price.cpp_d_update = datetime.utcnow()
        self.db.commit()
        return True

    def _sync_hard_delete_price(self, price_id: int) -> bool:
        """Synchronous hard delete client product price."""
        price = self._sync_get_price(price_id)
        self.db.delete(price)
        self.db.commit()
        return True

    # ==========================================================================
    # Async Wrapper Methods
    # ==========================================================================

    async def list_prices(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[int] = None,
        active_only: bool = True,
    ) -> Tuple[List[dict], int]:
        """List client product prices (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_list_prices, client_id, skip, limit, product_id, active_only
        )

    async def get_price(self, price_id: int) -> ClientProductPrice:
        """Get price by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_price, price_id)

    async def get_price_for_product(
        self,
        client_id: int,
        product_id: int,
        quantity: Optional[int] = None
    ) -> Optional[ClientProductPrice]:
        """Get applicable price for client/product (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_get_price_for_product, client_id, product_id, quantity
        )

    async def create_price(
        self,
        data: ClientProductPriceCreate,
        user_id: Optional[int] = None
    ) -> ClientProductPrice:
        """Create client product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_price, data, user_id)

    async def update_price(
        self,
        price_id: int,
        data: ClientProductPriceUpdate,
        user_id: Optional[int] = None
    ) -> ClientProductPrice:
        """Update client product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_price, price_id, data, user_id)

    async def delete_price(self, price_id: int) -> bool:
        """Soft delete client product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_price, price_id)

    async def hard_delete_price(self, price_id: int) -> bool:
        """Hard delete client product price (async wrapper)."""
        return await asyncio.to_thread(self._sync_hard_delete_price, price_id)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_client_product_price_service(
    db: Session = Depends(get_db)
) -> ClientProductPriceService:
    """Dependency to get ClientProductPriceService instance."""
    return ClientProductPriceService(db)

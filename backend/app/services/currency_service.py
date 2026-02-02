"""
Currency Service Module.

Provides functionality for:
- Currency CRUD operations
- Exchange rate (MainCurrency) management
- Currency lookup and listing
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends

from app.database import get_db
from app.models.currency import Currency, MainCurrency
from app.schemas.currency import (
    CurrencyCreate, CurrencyUpdate,
    MainCurrencyCreate, MainCurrencyUpdate
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class CurrencyServiceError(Exception):
    """Base exception for currency service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class CurrencyNotFoundError(CurrencyServiceError):
    """Raised when currency is not found."""
    def __init__(self, currency_id: int):
        super().__init__(
            code="CURRENCY_NOT_FOUND",
            message=f"Currency with ID {currency_id} not found",
            details={"currency_id": currency_id}
        )


class ExchangeRateNotFoundError(CurrencyServiceError):
    """Raised when exchange rate is not found."""
    def __init__(self, rate_id: int):
        super().__init__(
            code="EXCHANGE_RATE_NOT_FOUND",
            message=f"Exchange rate with ID {rate_id} not found",
            details={"rate_id": rate_id}
        )


class CurrencyValidationError(CurrencyServiceError):
    """Raised when currency data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="CURRENCY_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class DuplicateCurrencyError(CurrencyServiceError):
    """Raised when currency designation already exists."""
    def __init__(self, designation: str):
        super().__init__(
            code="DUPLICATE_CURRENCY",
            message=f"Currency with designation '{designation}' already exists",
            details={"designation": designation}
        )


# ==========================================================================
# Currency Service Class
# ==========================================================================

class CurrencyService:
    """
    Service class for currency operations.

    Handles CRUD operations for currencies and exchange rates.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the currency service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Currency CRUD Operations
    # ==========================================================================

    async def create_currency(self, data: CurrencyCreate) -> Currency:
        """
        Create a new currency.

        Args:
            data: Currency creation data.

        Returns:
            Created Currency object.

        Raises:
            DuplicateCurrencyError: If currency designation already exists.
        """
        # Check for duplicate designation
        existing = await self._get_currency_by_designation(data.cur_designation)
        if existing:
            raise DuplicateCurrencyError(data.cur_designation)

        currency = Currency(**data.model_dump())
        self.db.add(currency)
        await self.db.flush()
        await self.db.refresh(currency)
        return currency

    async def get_currency(self, currency_id: int) -> Currency:
        """
        Get currency by ID.

        Args:
            currency_id: The currency ID.

        Returns:
            Currency object.

        Raises:
            CurrencyNotFoundError: If currency not found.
        """
        result = await self.db.get(Currency, currency_id)
        if not result:
            raise CurrencyNotFoundError(currency_id)
        return result

    async def get_currency_by_designation(self, designation: str) -> Optional[Currency]:
        """
        Get currency by designation code.

        Args:
            designation: Currency designation (e.g., 'USD', 'EUR').

        Returns:
            Currency object or None.
        """
        return await self._get_currency_by_designation(designation)

    async def list_currencies(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Currency], int]:
        """
        List currencies with pagination.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records to return.

        Returns:
            Tuple of (currencies list, total count).
        """
        # Get total count
        count_query = select(func.count(Currency.cur_id))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get currencies
        query = (
            select(Currency)
            .order_by(Currency.cur_designation)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        currencies = list(result.scalars().all())

        return currencies, total

    async def update_currency(
        self,
        currency_id: int,
        data: CurrencyUpdate
    ) -> Currency:
        """
        Update a currency.

        Args:
            currency_id: The currency ID.
            data: Update data.

        Returns:
            Updated Currency object.

        Raises:
            CurrencyNotFoundError: If currency not found.
            DuplicateCurrencyError: If new designation already exists.
        """
        currency = await self.get_currency(currency_id)

        # Check for duplicate designation if changing
        update_data = data.model_dump(exclude_unset=True)
        if "cur_designation" in update_data:
            existing = await self._get_currency_by_designation(
                update_data["cur_designation"]
            )
            if existing and existing.cur_id != currency_id:
                raise DuplicateCurrencyError(update_data["cur_designation"])

        # Update fields
        for field, value in update_data.items():
            setattr(currency, field, value)

        await self.db.flush()
        await self.db.refresh(currency)
        return currency

    async def delete_currency(self, currency_id: int) -> bool:
        """
        Delete a currency.

        Args:
            currency_id: The currency ID.

        Returns:
            True if deleted successfully.

        Raises:
            CurrencyNotFoundError: If currency not found.
        """
        currency = await self.get_currency(currency_id)
        await self.db.delete(currency)
        await self.db.flush()
        return True

    # ==========================================================================
    # Exchange Rate (MainCurrency) Operations
    # ==========================================================================

    async def create_exchange_rate(self, data: MainCurrencyCreate) -> MainCurrency:
        """
        Create a new exchange rate.

        Args:
            data: Exchange rate creation data.

        Returns:
            Created MainCurrency object.

        Raises:
            CurrencyNotFoundError: If base or target currency not found.
        """
        # Validate currencies exist
        await self.get_currency(data.cur_id)
        await self.get_currency(data.cur_id2)

        rate = MainCurrency(**data.model_dump())
        self.db.add(rate)
        await self.db.flush()
        await self.db.refresh(rate)
        return rate

    async def get_exchange_rate(self, rate_id: int) -> MainCurrency:
        """
        Get exchange rate by ID.

        Args:
            rate_id: The exchange rate ID.

        Returns:
            MainCurrency object.

        Raises:
            ExchangeRateNotFoundError: If exchange rate not found.
        """
        result = await self.db.get(MainCurrency, rate_id)
        if not result:
            raise ExchangeRateNotFoundError(rate_id)
        return result

    async def get_exchange_rate_for_currencies(
        self,
        base_currency_id: int,
        target_currency_id: int,
        rate_date: Optional[datetime] = None
    ) -> Optional[MainCurrency]:
        """
        Get exchange rate between two currencies.

        Args:
            base_currency_id: Base currency ID.
            target_currency_id: Target currency ID.
            rate_date: Optional date to find rate for (latest before this date).

        Returns:
            MainCurrency object or None.
        """
        query = (
            select(MainCurrency)
            .where(
                and_(
                    MainCurrency.cur_id == base_currency_id,
                    MainCurrency.cur_id2 == target_currency_id
                )
            )
            .order_by(MainCurrency.mcu_rate_date.desc())
        )

        if rate_date:
            query = query.where(MainCurrency.mcu_rate_date <= rate_date)

        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_exchange_rates(
        self,
        skip: int = 0,
        limit: int = 100,
        base_currency_id: Optional[int] = None,
        target_currency_id: Optional[int] = None
    ) -> Tuple[List[MainCurrency], int]:
        """
        List exchange rates with pagination and optional filters.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            base_currency_id: Filter by base currency.
            target_currency_id: Filter by target currency.

        Returns:
            Tuple of (exchange rates list, total count).
        """
        # Build filter conditions
        conditions = []
        if base_currency_id:
            conditions.append(MainCurrency.cur_id == base_currency_id)
        if target_currency_id:
            conditions.append(MainCurrency.cur_id2 == target_currency_id)

        # Get total count
        count_query = select(func.count(MainCurrency.mcu_id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get exchange rates
        query = (
            select(MainCurrency)
            .options(
                selectinload(MainCurrency.currency),
                selectinload(MainCurrency.target_currency)
            )
            .order_by(MainCurrency.mcu_rate_date.desc())
            .offset(skip)
            .limit(limit)
        )
        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        rates = list(result.scalars().all())

        return rates, total

    async def update_exchange_rate(
        self,
        rate_id: int,
        data: MainCurrencyUpdate
    ) -> MainCurrency:
        """
        Update an exchange rate.

        Args:
            rate_id: The exchange rate ID.
            data: Update data.

        Returns:
            Updated MainCurrency object.

        Raises:
            ExchangeRateNotFoundError: If exchange rate not found.
            CurrencyNotFoundError: If new currency IDs are invalid.
        """
        rate = await self.get_exchange_rate(rate_id)

        update_data = data.model_dump(exclude_unset=True)

        # Validate currency IDs if changing
        if "cur_id" in update_data:
            await self.get_currency(update_data["cur_id"])
        if "cur_id2" in update_data:
            await self.get_currency(update_data["cur_id2"])

        # Update fields
        for field, value in update_data.items():
            setattr(rate, field, value)

        await self.db.flush()
        await self.db.refresh(rate)
        return rate

    async def delete_exchange_rate(self, rate_id: int) -> bool:
        """
        Delete an exchange rate.

        Args:
            rate_id: The exchange rate ID.

        Returns:
            True if deleted successfully.

        Raises:
            ExchangeRateNotFoundError: If exchange rate not found.
        """
        rate = await self.get_exchange_rate(rate_id)
        await self.db.delete(rate)
        await self.db.flush()
        return True

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    async def _get_currency_by_designation(
        self,
        designation: str
    ) -> Optional[Currency]:
        """
        Get currency by designation (internal helper).

        Args:
            designation: Currency designation code.

        Returns:
            Currency object or None.
        """
        query = select(Currency).where(Currency.cur_designation == designation)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def convert_amount(
        self,
        amount: Decimal,
        from_currency_id: int,
        to_currency_id: int,
        rate_date: Optional[datetime] = None,
        direction: str = "out"
    ) -> Decimal:
        """
        Convert an amount from one currency to another.

        Args:
            amount: The amount to convert.
            from_currency_id: Source currency ID.
            to_currency_id: Target currency ID.
            rate_date: Date for which to get the exchange rate.
            direction: 'in' or 'out' to determine which rate to use.

        Returns:
            Converted amount.

        Raises:
            CurrencyValidationError: If no exchange rate found.
        """
        if from_currency_id == to_currency_id:
            return amount

        rate = await self.get_exchange_rate_for_currencies(
            from_currency_id,
            to_currency_id,
            rate_date
        )

        if not rate:
            raise CurrencyValidationError(
                f"No exchange rate found from currency {from_currency_id} to {to_currency_id}",
                details={
                    "from_currency_id": from_currency_id,
                    "to_currency_id": to_currency_id
                }
            )

        exchange_rate = rate.mcu_rate_out if direction == "out" else rate.mcu_rate_in
        return amount * exchange_rate


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_currency_service(
    db: AsyncSession = Depends(get_db)
) -> CurrencyService:
    """
    Dependency to get CurrencyService instance.

    Args:
        db: Database session from dependency.

    Returns:
        CurrencyService instance.
    """
    return CurrencyService(db)

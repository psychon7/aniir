"""
Currency API Router.

Provides REST API endpoints for:
- Currency CRUD operations
- Exchange rate (MainCurrency) management
- Currency lookup and conversion
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.currency_service import (
    CurrencyService,
    get_currency_service,
    CurrencyServiceError,
    CurrencyNotFoundError,
    ExchangeRateNotFoundError,
    CurrencyValidationError,
    DuplicateCurrencyError
)
from app.schemas.currency import (
    # Currency schemas
    CurrencyCreate, CurrencyUpdate, CurrencyResponse, CurrencyListResponse,
    CurrencyListPaginatedResponse,
    # Exchange rate schemas
    MainCurrencyCreate, MainCurrencyUpdate, MainCurrencyResponse,
    MainCurrencyDetailResponse, MainCurrencyListPaginatedResponse,
    # API response schemas
    CurrencyAPIResponse, CurrencyErrorResponse
)

router = APIRouter(prefix="/currencies", tags=["Currencies"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_currency_error(error: CurrencyServiceError) -> HTTPException:
    """Convert CurrencyServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, CurrencyNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ExchangeRateNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, CurrencyValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DuplicateCurrencyError):
        status_code = status.HTTP_409_CONFLICT

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Currency CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=CurrencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new currency",
    description="""
    Create a new currency definition.

    A currency requires a unique designation code (e.g., USD, EUR),
    a symbol (e.g., $, €), and a numeric identifier.
    """
)
async def create_currency(
    data: CurrencyCreate,
    service: CurrencyService = Depends(get_currency_service)
):
    """Create a new currency."""
    try:
        currency = await service.create_currency(data)
        return currency
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.get(
    "",
    response_model=CurrencyListPaginatedResponse,
    summary="List all currencies",
    description="""
    Get a paginated list of all currencies.

    Returns currencies ordered by designation code.
    """
)
async def list_currencies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: CurrencyService = Depends(get_currency_service)
):
    """List all currencies with pagination."""
    currencies, total = await service.list_currencies(skip=skip, limit=limit)
    return CurrencyListPaginatedResponse(
        items=currencies,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{currency_id}",
    response_model=CurrencyResponse,
    summary="Get currency by ID",
    description="Get detailed information about a specific currency."
)
async def get_currency(
    currency_id: int = Path(..., gt=0, description="Currency ID"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Get a specific currency by ID."""
    try:
        currency = await service.get_currency(currency_id)
        return currency
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.get(
    "/by-designation/{designation}",
    response_model=CurrencyResponse,
    summary="Get currency by designation",
    description="Get currency by its designation code (e.g., USD, EUR)."
)
async def get_currency_by_designation(
    designation: str = Path(..., min_length=1, max_length=20, description="Currency designation code"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Get a specific currency by designation code."""
    currency = await service.get_currency_by_designation(designation.upper())
    if not currency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "CURRENCY_NOT_FOUND",
                    "message": f"Currency with designation '{designation}' not found",
                    "details": {"designation": designation}
                }
            }
        )
    return currency


@router.put(
    "/{currency_id}",
    response_model=CurrencyResponse,
    summary="Update a currency",
    description="Update an existing currency's information."
)
async def update_currency(
    currency_id: int = Path(..., gt=0, description="Currency ID"),
    data: CurrencyUpdate = ...,
    service: CurrencyService = Depends(get_currency_service)
):
    """Update an existing currency."""
    try:
        currency = await service.update_currency(currency_id, data)
        return currency
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.delete(
    "/{currency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a currency",
    description="Delete a currency by ID."
)
async def delete_currency(
    currency_id: int = Path(..., gt=0, description="Currency ID"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Delete a currency."""
    try:
        await service.delete_currency(currency_id)
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


# ==========================================================================
# Exchange Rate Endpoints
# ==========================================================================

@router.post(
    "/exchange-rates",
    response_model=MainCurrencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new exchange rate",
    description="""
    Create a new exchange rate between two currencies.

    Requires base and target currency IDs, in/out rates, and effective date.
    """
)
async def create_exchange_rate(
    data: MainCurrencyCreate,
    service: CurrencyService = Depends(get_currency_service)
):
    """Create a new exchange rate."""
    try:
        rate = await service.create_exchange_rate(data)
        return rate
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.get(
    "/exchange-rates",
    response_model=MainCurrencyListPaginatedResponse,
    summary="List exchange rates",
    description="""
    Get a paginated list of exchange rates.

    Can be filtered by base and/or target currency.
    """
)
async def list_exchange_rates(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    base_currency_id: Optional[int] = Query(None, gt=0, description="Filter by base currency ID"),
    target_currency_id: Optional[int] = Query(None, gt=0, description="Filter by target currency ID"),
    service: CurrencyService = Depends(get_currency_service)
):
    """List exchange rates with pagination and optional filters."""
    rates, total = await service.list_exchange_rates(
        skip=skip,
        limit=limit,
        base_currency_id=base_currency_id,
        target_currency_id=target_currency_id
    )
    return MainCurrencyListPaginatedResponse(
        items=rates,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/exchange-rates/{rate_id}",
    response_model=MainCurrencyResponse,
    summary="Get exchange rate by ID",
    description="Get detailed information about a specific exchange rate."
)
async def get_exchange_rate(
    rate_id: int = Path(..., gt=0, description="Exchange rate ID"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Get a specific exchange rate by ID."""
    try:
        rate = await service.get_exchange_rate(rate_id)
        return rate
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.get(
    "/exchange-rates/lookup/{base_currency_id}/{target_currency_id}",
    response_model=MainCurrencyResponse,
    summary="Get exchange rate between currencies",
    description="""
    Get the latest exchange rate between two currencies.

    Optionally specify a date to get the rate effective at that time.
    """
)
async def get_exchange_rate_for_currencies(
    base_currency_id: int = Path(..., gt=0, description="Base currency ID"),
    target_currency_id: int = Path(..., gt=0, description="Target currency ID"),
    rate_date: Optional[datetime] = Query(None, description="Date for rate lookup"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Get exchange rate between two currencies."""
    rate = await service.get_exchange_rate_for_currencies(
        base_currency_id,
        target_currency_id,
        rate_date
    )
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "EXCHANGE_RATE_NOT_FOUND",
                    "message": f"No exchange rate found from currency {base_currency_id} to {target_currency_id}",
                    "details": {
                        "base_currency_id": base_currency_id,
                        "target_currency_id": target_currency_id
                    }
                }
            }
        )
    return rate


@router.put(
    "/exchange-rates/{rate_id}",
    response_model=MainCurrencyResponse,
    summary="Update an exchange rate",
    description="Update an existing exchange rate's information."
)
async def update_exchange_rate(
    rate_id: int = Path(..., gt=0, description="Exchange rate ID"),
    data: MainCurrencyUpdate = ...,
    service: CurrencyService = Depends(get_currency_service)
):
    """Update an existing exchange rate."""
    try:
        rate = await service.update_exchange_rate(rate_id, data)
        return rate
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


@router.delete(
    "/exchange-rates/{rate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an exchange rate",
    description="Delete an exchange rate by ID."
)
async def delete_exchange_rate(
    rate_id: int = Path(..., gt=0, description="Exchange rate ID"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Delete an exchange rate."""
    try:
        await service.delete_exchange_rate(rate_id)
    except CurrencyServiceError as e:
        raise handle_currency_error(e)


# ==========================================================================
# Currency Conversion Endpoint
# ==========================================================================

@router.get(
    "/convert",
    summary="Convert amount between currencies",
    description="""
    Convert an amount from one currency to another.

    Uses the latest exchange rate or the rate effective at the specified date.
    """
)
async def convert_currency(
    amount: Decimal = Query(..., gt=0, description="Amount to convert"),
    from_currency_id: int = Query(..., gt=0, description="Source currency ID"),
    to_currency_id: int = Query(..., gt=0, description="Target currency ID"),
    rate_date: Optional[datetime] = Query(None, description="Date for rate lookup"),
    direction: str = Query("out", regex="^(in|out)$", description="Rate direction (in or out)"),
    service: CurrencyService = Depends(get_currency_service)
):
    """Convert amount between currencies."""
    try:
        converted_amount = await service.convert_amount(
            amount=amount,
            from_currency_id=from_currency_id,
            to_currency_id=to_currency_id,
            rate_date=rate_date,
            direction=direction
        )
        return {
            "success": True,
            "original_amount": float(amount),
            "converted_amount": float(converted_amount),
            "from_currency_id": from_currency_id,
            "to_currency_id": to_currency_id,
            "direction": direction,
            "rate_date": rate_date
        }
    except CurrencyServiceError as e:
        raise handle_currency_error(e)

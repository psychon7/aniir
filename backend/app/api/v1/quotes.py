"""
API endpoints for Quote management.

Provides REST API for:
- Quote CRUD operations
- Quote line management
- Quote duplication
- Quote to order conversion
"""
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.quote_service import (
    QuoteService,
    QuoteServiceError,
    QuoteNotFoundError,
    QuoteLineNotFoundError,
    QuoteConversionError,
    QuoteDuplicateError,
    get_quote_service
)
from app.schemas.quote import (
    # Quote (legacy - disabled)
    QuoteCreate, QuoteUpdate, QuoteResponse,
    QuoteListResponse, QuoteSearchParams,
    # Quote Lines
    QuoteLineCreate, QuoteLineUpdate, QuoteLineResponse,
    # Conversion & Duplication
    QuoteConvertRequest, QuoteConvertResponse,
    QuoteDuplicateRequest, QuoteDuplicateResponse,
    # Enums
    QuoteStatus
)
# Import QuoteDetailResponse from costplan schemas (maps to TM_CPL_Cost_Plan)
from app.schemas.costplan import QuoteDetailResponse

router = APIRouter(prefix="/quotes", tags=["Quotes"])


# =====================
# Quote Endpoints
# =====================

@router.post(
    "",
    response_model=QuoteDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new quote",
    description="Create a new quote for a client. Lines can be included in the creation."
)
async def create_quote(
    data: QuoteCreate,
    service: QuoteService = Depends(get_quote_service),
    # current_user_id: int = Depends(get_current_user_id)  # TODO: Add auth dependency
):
    """Create a new quote."""
    try:
        return await service.create_quote(data, created_by=None)  # TODO: Pass current_user_id
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=QuoteListResponse,
    summary="Search quotes",
    description="Search and filter quotes with pagination."
)
async def search_quotes(
    reference: Optional[str] = Query(None, description="Filter by reference (partial match)"),
    client_id: Optional[int] = Query(None, description="Filter by client"),
    status_id: Optional[int] = Query(None, description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Quote date from"),
    date_to: Optional[datetime] = Query(None, description="Quote date to"),
    valid_from: Optional[datetime] = Query(None, description="Valid until date from"),
    valid_to: Optional[datetime] = Query(None, description="Valid until date to"),
    converted_to_order: Optional[bool] = Query(None, description="Filter by conversion status"),
    society_id: Optional[int] = Query(None, description="Filter by society"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit"),
    min_amount: Optional[Decimal] = Query(None, ge=0, description="Minimum total amount"),
    max_amount: Optional[Decimal] = Query(None, ge=0, description="Maximum total amount"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("quo_created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    service: QuoteService = Depends(get_quote_service)
):
    """Search quotes with filters."""
    params = QuoteSearchParams(
        reference=reference,
        client_id=client_id,
        status_id=status_id,
        date_from=date_from,
        date_to=date_to,
        valid_from=valid_from,
        valid_to=valid_to,
        converted_to_order=converted_to_order,
        society_id=society_id,
        bu_id=bu_id,
        min_amount=min_amount,
        max_amount=max_amount,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_quotes(params)


@router.get(
    "/{quote_id}",
    response_model=QuoteDetailResponse,
    summary="Get quote details",
    description="""
    Get detailed information about a quote (cost plan) by ID.

    Returns quote data with resolved lookup names for:
    - Client (name, reference)
    - Society
    - Project (name, code)
    - Payment mode
    - Payment condition (name, term days)

    This endpoint uses the TM_CPL_Cost_Plan table (actual quote/proposal table).
    """
)
async def get_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID (cpl_id)"),
    db: AsyncSession = Depends(get_db)
):
    """Get quote details with resolved lookup names."""
    service = get_quote_service(db)
    try:
        quote_data = await service.get_quote_detail(quote_id)
        return QuoteDetailResponse(**quote_data)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/by-reference/{reference}",
    response_model=QuoteDetailResponse,
    summary="Get quote by reference",
    description="Get a quote by its reference number."
)
async def get_quote_by_reference(
    reference: str = Path(..., description="Quote reference"),
    service: QuoteService = Depends(get_quote_service)
):
    """Get quote by reference."""
    try:
        return await service.get_quote_by_reference(reference)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put(
    "/{quote_id}",
    response_model=QuoteDetailResponse,
    summary="Update a quote",
    description="Update quote details."
)
async def update_quote(
    quote_id: int = Path(..., description="Quote ID"),
    data: QuoteUpdate = ...,
    service: QuoteService = Depends(get_quote_service)
):
    """Update a quote."""
    try:
        return await service.update_quote(quote_id, data)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{quote_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a quote",
    description="Delete a quote and all related data."
)
async def delete_quote(
    quote_id: int = Path(..., description="Quote ID"),
    service: QuoteService = Depends(get_quote_service)
):
    """Delete a quote."""
    try:
        await service.delete_quote(quote_id)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# =====================
# Quote Line Endpoints
# =====================

@router.post(
    "/{quote_id}/lines",
    response_model=QuoteLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add line to quote",
    description="Add a product line to a quote."
)
async def add_quote_line(
    quote_id: int = Path(..., description="Quote ID"),
    data: QuoteLineCreate = ...,
    service: QuoteService = Depends(get_quote_service)
):
    """Add a line to a quote."""
    try:
        return await service.add_quote_line(quote_id, data)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{quote_id}/lines",
    response_model=List[QuoteLineResponse],
    summary="Get quote lines",
    description="Get all lines for a quote."
)
async def get_quote_lines(
    quote_id: int = Path(..., description="Quote ID"),
    service: QuoteService = Depends(get_quote_service)
):
    """Get all lines for a quote."""
    try:
        return await service.get_quote_lines(quote_id)
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/lines/{line_id}",
    response_model=QuoteLineResponse,
    summary="Get quote line",
    description="Get a specific quote line."
)
async def get_quote_line(
    line_id: int = Path(..., description="Line ID"),
    service: QuoteService = Depends(get_quote_service)
):
    """Get a specific quote line."""
    try:
        return await service.get_quote_line(line_id)
    except QuoteLineNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put(
    "/lines/{line_id}",
    response_model=QuoteLineResponse,
    summary="Update quote line",
    description="Update a quote line."
)
async def update_quote_line(
    line_id: int = Path(..., description="Line ID"),
    data: QuoteLineUpdate = ...,
    service: QuoteService = Depends(get_quote_service)
):
    """Update a quote line."""
    try:
        return await service.update_quote_line(line_id, data)
    except QuoteLineNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete quote line",
    description="Delete a line from a quote."
)
async def delete_quote_line(
    line_id: int = Path(..., description="Line ID"),
    service: QuoteService = Depends(get_quote_service)
):
    """Delete a quote line."""
    try:
        await service.delete_quote_line(line_id)
    except QuoteLineNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================
# Quote Conversion & Duplication Endpoints
# =====================

@router.post(
    "/{quote_id}/convert-to-order",
    response_model=QuoteConvertResponse,
    summary="Convert quote to order",
    description="""
    Convert a quote to a client order.

    This will:
    - Create a new order from the quote
    - Copy all quote lines to the order
    - Mark the quote as converted
    """
)
async def convert_quote_to_order(
    quote_id: int = Path(..., description="Quote ID"),
    data: QuoteConvertRequest = ...,
    service: QuoteService = Depends(get_quote_service)
):
    """Convert a quote to an order."""
    try:
        return await service.convert_to_order(
            quote_id=quote_id,
            request=data,
            converted_by=None  # TODO: Pass current_user_id
        )
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteConversionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{quote_id}/duplicate",
    response_model=QuoteDuplicateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a quote",
    description="""
    Create a copy of an existing quote.

    This will:
    - Create a new quote with a new reference
    - Copy all lines from the original quote
    - Optionally set a new validity date and/or client
    """
)
async def duplicate_quote(
    quote_id: int = Path(..., description="Quote ID to duplicate"),
    data: QuoteDuplicateRequest = ...,
    service: QuoteService = Depends(get_quote_service)
):
    """Duplicate a quote."""
    try:
        return await service.duplicate_quote(
            quote_id=quote_id,
            request=data,
            created_by=None  # TODO: Pass current_user_id
        )
    except QuoteNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteDuplicateError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# =====================
# Convenience Endpoints
# =====================

@router.get(
    "/statuses/list",
    response_model=List[dict],
    summary="Get available quote statuses",
    description="Get list of available quote statuses with descriptions."
)
async def get_quote_statuses():
    """Get available quote statuses."""
    return [
        {
            "value": "DRAFT",
            "label": "Draft",
            "description": "Initial draft state"
        },
        {
            "value": "SENT",
            "label": "Sent",
            "description": "Quote has been sent to client"
        },
        {
            "value": "ACCEPTED",
            "label": "Accepted",
            "description": "Client has accepted the quote"
        },
        {
            "value": "REJECTED",
            "label": "Rejected",
            "description": "Client has rejected the quote"
        },
        {
            "value": "EXPIRED",
            "label": "Expired",
            "description": "Quote validity has expired"
        },
        {
            "value": "CONVERTED",
            "label": "Converted",
            "description": "Quote has been converted to an order"
        },
        {
            "value": "CANCELLED",
            "label": "Cancelled",
            "description": "Quote has been cancelled"
        }
    ]

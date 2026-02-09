"""
API endpoints for Quote management.

Provides REST API for:
- Quote CRUD operations
- Quote line management
- Quote duplication
- Quote to order conversion
"""
import asyncio
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc
from pydantic import BaseModel, Field, ConfigDict

from app.database import get_db
from app.dependencies import get_current_user
from app.models.costplan import CostPlan, CostPlanLine
from app.models.client import Client
from app.models.cost_plan_status import CostPlanStatus
from app.schemas.document import SendDocumentRequest, SendDocumentResponse
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
from app.schemas.costplan import QuoteDetailResponse, CostPlanResponse
from app.utils.row_level import apply_commercial_filter

router = APIRouter(prefix="/quotes", tags=["Quotes"])


# ==========================================================================
# Paginated Response Schema
# ==========================================================================


class QuoteListPaginatedResponse(BaseModel):
    """Paginated response for quote list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[CostPlanResponse] = Field(default_factory=list, description="List of quotes")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of quotes")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


class QuoteDiscountUpdateRequest(BaseModel):
    """Document-level discount update payload (supports snake_case and camelCase)."""
    model_config = ConfigDict(populate_by_name=True)

    discount_percentage: Optional[Decimal] = Field(default=None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[Decimal] = Field(default=None, ge=0, alias="discountAmount")


# ==========================================================================
# Sync Database Helper
# ==========================================================================


def _sync_list_quotes(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    project_id: Optional[int] = None,
    sort_by: str = "cpl_d_creation",
    sort_order: str = "desc",
    current_user: Optional[Any] = None,
):
    """Sync function to list quotes with pagination, joining client and status."""
    # Pre-aggregated subquery for totalAmount (runs once, not per-row)
    line_totals = (
        select(
            CostPlanLine.cpl_id,
            func.coalesce(func.sum(CostPlanLine.cln_price_with_discount_ht), 0).label("total_amount"),
        )
        .group_by(CostPlanLine.cpl_id)
        .subquery()
    )

    query = (
        select(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cli_id,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cst_id,
            CostPlan.cpl_discount_percentage,
            CostPlan.cpl_discount_amount,
            CostPlan.soc_id,
            CostPlan.cpl_name,
            CostPlan.cpl_d_update,
            Client.cli_company_name,
            CostPlanStatus.cst_designation,
            func.coalesce(line_totals.c.total_amount, 0).label("total_amount"),
        )
        .outerjoin(Client, CostPlan.cli_id == Client.cli_id)
        .outerjoin(CostPlanStatus, CostPlan.cst_id == CostPlanStatus.cst_id)
        .outerjoin(line_totals, CostPlan.cpl_id == line_totals.c.cpl_id)
    )
    count_query = select(func.count(CostPlan.cpl_id))

    conditions = []

    if search:
        search_term = f"%{search}%"
        conditions.append(CostPlan.cpl_code.ilike(search_term))

    if client_id:
        conditions.append(CostPlan.cli_id == client_id)

    if project_id:
        conditions.append(CostPlan.prj_id == project_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Row-level security for non-admin users (commercial hierarchy).
    query = apply_commercial_filter(
        query,
        CostPlan,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )
    count_query = apply_commercial_filter(
        count_query,
        CostPlan,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )

    # Get total count
    total_result = db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(CostPlan, sort_by, CostPlan.cpl_d_creation)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    result = db.execute(query)
    rows = result.all()

    return rows, total


# =====================
# Quote Endpoints
# =====================


@router.get(
    "",
    summary="List quotes with pagination",
    description="Get a paginated list of quotes with optional filters."
)
async def list_quotes(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by quote code"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    sort_by: str = Query("cpl_d_creation", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List quotes with pagination."""
    rows, total = await asyncio.to_thread(
        _sync_list_quotes, db, page, page_size, search, client_id, project_id, sort_by, sort_order, current_user
    )

    # Build camelCase response matching frontend QuoteListItem type
    items = []
    for row in rows:
        items.append({
            "id": row.cpl_id,
            "cplId": row.cpl_id,
            "reference": row.cpl_code or "",
            "clientName": row.cli_company_name or "",
            "quoteDate": row.cpl_d_creation.isoformat() if row.cpl_d_creation else None,
            "validUntil": row.cpl_d_validity.isoformat() if row.cpl_d_validity else None,
            "statusId": row.cst_id,
            "statusName": row.cst_designation or "Draft",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cpl_name,
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "success": True,
        "data": items,
        "page": page,
        "pageSize": page_size,
        "totalCount": total,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }


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
    "/search",
    response_model=QuoteListResponse,
    summary="Search quotes (legacy)",
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


def _sync_get_quote_detail(db: Session, quote_id: int):
    """Sync helper to get quote detail with lines, returning camelCase dict."""
    # Fetch quote header with client and status joins
    query = (
        select(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cli_id,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cst_id,
            CostPlan.cpl_discount_percentage,
            CostPlan.cpl_discount_amount,
            CostPlan.cpl_name,
            CostPlan.cpl_d_update,
            CostPlan.cpl_header_text,
            CostPlan.cpl_footer_text,
            Client.cli_company_name,
            CostPlanStatus.cst_designation,
        )
        .outerjoin(Client, CostPlan.cli_id == Client.cli_id)
        .outerjoin(CostPlanStatus, CostPlan.cst_id == CostPlanStatus.cst_id)
        .where(CostPlan.cpl_id == quote_id)
    )
    result = db.execute(query)
    row = result.first()
    if not row:
        return None

    # Fetch lines
    lines_query = (
        select(
            CostPlanLine.cln_id,
            CostPlanLine.cln_prd_name,
            CostPlanLine.cln_description,
            CostPlanLine.cln_ref,
            CostPlanLine.cln_quantity,
            CostPlanLine.cln_unit_price,
            CostPlanLine.cln_total_price,
            CostPlanLine.cln_price_with_discount_ht,
            CostPlanLine.cln_discount_percentage,
            CostPlanLine.cln_discount_amount,
        )
        .where(CostPlanLine.cpl_id == quote_id)
    )
    lines_result = db.execute(lines_query)
    line_rows = lines_result.all()

    # Compute totals from lines
    subtotal = sum(float(l.cln_price_with_discount_ht or l.cln_total_price or 0) for l in line_rows)
    discount_amount = float(row.cpl_discount_amount or 0)
    total_amount = subtotal - discount_amount

    # Build lines list
    lines = []
    for l in line_rows:
        lines.append({
            "id": l.cln_id,
            "productName": l.cln_prd_name or "",
            "description": l.cln_description or "",
            "productReference": l.cln_ref or "",
            "quantity": float(l.cln_quantity or 0),
            "unitPrice": float(l.cln_unit_price or 0),
            "lineTotal": float(l.cln_price_with_discount_ht or l.cln_total_price or 0),
            "discountPercentage": float(l.cln_discount_percentage or 0),
            "discountAmount": float(l.cln_discount_amount or 0),
        })

    return {
        "id": row.cpl_id,
        "reference": row.cpl_code or "",
        "name": row.cpl_name or "",
        "clientId": row.cli_id,
        "clientName": row.cli_company_name or "",
        "quoteDate": row.cpl_d_creation.isoformat() if row.cpl_d_creation else None,
        "validUntil": row.cpl_d_validity.isoformat() if row.cpl_d_validity else None,
        "statusId": row.cst_id,
        "statusName": row.cst_designation or "Draft",
        "currency": "EUR",
        "subtotal": subtotal,
        "totalAmount": total_amount,
        "discountAmount": discount_amount,
        "discountPercentage": float(row.cpl_discount_percentage or 0),
        "taxAmount": 0,
        "headerText": row.cpl_header_text or "",
        "footerText": row.cpl_footer_text or "",
        "lines": lines,
    }


def _sync_get_quotes_by_project(db: Session, project_id: int):
    """Sync helper to get quotes for a project."""
    query = (
        select(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cpl_name,
            CostPlan.cst_id,
            Client.cli_company_name,
            func.coalesce(func.sum(CostPlanLine.cln_price_with_discount_ht), 0).label("total_amount"),
        )
        .outerjoin(Client, CostPlan.cli_id == Client.cli_id)
        .outerjoin(CostPlanLine, CostPlan.cpl_id == CostPlanLine.cpl_id)
        .where(CostPlan.prj_id == project_id)
        .group_by(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cpl_name,
            CostPlan.cst_id,
            Client.cli_company_name,
        )
        .order_by(desc(CostPlan.cpl_d_creation))
    )
    rows = db.execute(query).all()
    return [
        {
            "id": row.cpl_id,
            "reference": row.cpl_code or "",
            "clientName": row.cli_company_name or "",
            "quoteDate": row.cpl_d_creation.isoformat() if row.cpl_d_creation else None,
            "validUntil": row.cpl_d_validity.isoformat() if row.cpl_d_validity else None,
            "statusId": row.cst_id,
            "statusName": "In Progress" if row.cst_id == 1 else "Quote",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cpl_name or "",
        }
        for row in rows
    ]


def _sync_get_quotes_in_progress(db: Session, recent_months_only: bool = False):
    """
    Sync helper for in-progress quotes dashboard widgets.
    Uses cst_id=1 as in-progress default, with fallback to all quotes if none.
    """
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    if now.month == 1:
        prev_month_start = datetime(now.year - 1, 12, 1)
    else:
        prev_month_start = datetime(now.year, now.month - 1, 1)

    query = (
        select(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cpl_name,
            CostPlan.cst_id,
            Client.cli_company_name,
            func.coalesce(func.sum(CostPlanLine.cln_price_with_discount_ht), 0).label("total_amount"),
        )
        .outerjoin(Client, CostPlan.cli_id == Client.cli_id)
        .outerjoin(CostPlanLine, CostPlan.cpl_id == CostPlanLine.cpl_id)
        .group_by(
            CostPlan.cpl_id,
            CostPlan.cpl_code,
            CostPlan.cpl_d_creation,
            CostPlan.cpl_d_validity,
            CostPlan.cpl_name,
            CostPlan.cst_id,
            Client.cli_company_name,
        )
        .order_by(desc(CostPlan.cpl_d_creation))
    )

    # Try strict "in progress" first
    in_progress_rows = query.where(CostPlan.cst_id == 1)
    if recent_months_only:
        in_progress_rows = in_progress_rows.where(CostPlan.cpl_d_creation >= prev_month_start)
    rows = db.execute(in_progress_rows.limit(100)).all()

    # Fallback to latest quotes if no in-progress found
    if not rows:
        fallback = query
        if recent_months_only:
            fallback = fallback.where(CostPlan.cpl_d_creation >= prev_month_start)
        rows = db.execute(fallback.limit(100)).all()

    return [
        {
            "id": row.cpl_id,
            "reference": row.cpl_code or "",
            "clientName": row.cli_company_name or "",
            "quoteDate": row.cpl_d_creation.isoformat() if row.cpl_d_creation else None,
            "validUntil": row.cpl_d_validity.isoformat() if row.cpl_d_validity else None,
            "statusId": row.cst_id,
            "statusName": "In Progress" if row.cst_id == 1 else "Quote",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cpl_name or "",
            "isCurrentMonth": bool(row.cpl_d_creation and row.cpl_d_creation >= month_start),
        }
        for row in rows
    ]


def _sync_update_quote_discount(
    db: Session,
    quote_id: int,
    discount_percentage: Optional[Decimal],
    discount_amount: Optional[Decimal],
):
    """Sync helper to apply quote-level discount."""
    quote = db.get(CostPlan, quote_id)
    if not quote:
        return None

    # Compute subtotal from lines when percentage is provided.
    line_total_stmt = select(func.coalesce(func.sum(CostPlanLine.cln_price_with_discount_ht), 0)).where(
        CostPlanLine.cpl_id == quote_id
    )
    subtotal = Decimal(str(db.execute(line_total_stmt).scalar() or 0))

    if discount_percentage is not None:
        quote.cpl_discount_percentage = discount_percentage
    if discount_amount is not None:
        quote.cpl_discount_amount = discount_amount
    elif discount_percentage is not None:
        quote.cpl_discount_amount = (subtotal * discount_percentage) / Decimal("100")

    quote.cpl_d_update = datetime.utcnow()
    db.commit()
    return _sync_get_quote_detail(db, quote_id)


@router.get(
    "/by-project/{project_id}",
    summary="Get quotes by project",
    description="Get all quotes for a given project ID.",
)
async def get_quotes_by_project(
    project_id: int = Path(..., gt=0, description="Project ID"),
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_quotes_by_project, db, project_id)


@router.get(
    "/in-progress",
    summary="Get in-progress quotes",
    description="Dashboard helper: returns in-progress quotes.",
)
async def get_in_progress_quotes(
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_quotes_in_progress, db, False)


@router.get(
    "/recent-in-progress",
    summary="Get recent in-progress quotes",
    description="Dashboard helper: returns in-progress quotes for current and previous month.",
)
async def get_recent_in_progress_quotes(
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_quotes_in_progress, db, True)


@router.get(
    "/{quote_id}/summary",
    summary="Get quote totals summary",
    description="Returns subtotal, discount and total for a quote.",
)
async def get_quote_summary(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    db: Session = Depends(get_db),
):
    detail = await asyncio.to_thread(_sync_get_quote_detail, db, quote_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quote {quote_id} not found")
    return {
        "subtotal": detail.get("subtotal", 0),
        "taxAmount": detail.get("taxAmount", 0),
        "discountAmount": detail.get("discountAmount", 0),
        "discountPercentage": detail.get("discountPercentage", 0),
        "totalAmount": detail.get("totalAmount", 0),
    }


@router.post(
    "/{quote_id}/discount",
    summary="Update quote discount",
    description="Apply or update document-level discount on a quote.",
)
async def update_quote_discount(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    request: QuoteDiscountUpdateRequest = ...,
    db: Session = Depends(get_db),
):
    updated = await asyncio.to_thread(
        _sync_update_quote_discount,
        db,
        quote_id,
        request.discount_percentage,
        request.discount_amount,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quote {quote_id} not found")
    return updated


@router.get(
    "/{quote_id}",
    summary="Get quote details",
    description="Get detailed information about a quote (cost plan) by ID."
)
async def get_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID (cpl_id)"),
    db: Session = Depends(get_db)
):
    """Get quote details with resolved lookup names."""
    result = await asyncio.to_thread(_sync_get_quote_detail, db, quote_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quote {quote_id} not found")
    return result


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
    "/{quote_id}/pdf",
    summary="Download quote PDF",
    description="Generate and download PDF for a quote.",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF file"},
        404: {"description": "Quote not found"},
    }
)
async def download_quote_pdf(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    db: Session = Depends(get_db)
):
    """Generate and return PDF for this quote."""
    import io
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import TemplatePDFService

    # Get quote detail for context
    quote_data = await asyncio.to_thread(_sync_get_quote_detail, db, quote_id)
    if not quote_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found"
        )

    reference = quote_data.get("reference", f"quote-{quote_id}")
    filename = f"{reference}.pdf"

    # Generate PDF using template service
    template_pdf = TemplatePDFService()
    pdf_content = template_pdf.generate_pdf(
        template_name="quotes/quote.html",
        context=quote_data,
    )

    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_content)),
        }
    )


@router.post(
    "/{quote_id}/send",
    summary="Send quote via email",
    description="Generate PDF and send quote via email to the specified recipient.",
    responses={
        200: {"description": "Quote sent successfully"},
        404: {"description": "Quote not found"},
    }
)
async def send_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    request: SendDocumentRequest = ...,
    db: Session = Depends(get_db)
):
    """Send quote via email with PDF attachment."""
    from app.services.email_service import EmailService
    from app.schemas.email_log import EmailLogCreate

    # Get quote detail
    quote_data = await asyncio.to_thread(_sync_get_quote_detail, db, quote_id)
    if not quote_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found"
        )

    reference = quote_data.get("reference", f"Quote-{quote_id}")
    client_name = quote_data.get("clientName", "")

    # Build email
    subject = request.subject or f"Quote {reference}"
    body = request.body or f"Please find attached quote {reference}."

    # Create email log and send
    try:
        email_service = EmailService(db)
        email_log_data = EmailLogCreate(
            recipient_email=request.to_email,
            recipient_name=client_name,
            subject=subject,
            body=body,
            entity_type="QUOTE",
            entity_id=quote_id,
        )
        email_log = await asyncio.to_thread(
            email_service.create_email_log, email_log_data
        )
        await asyncio.to_thread(email_service.send_email, email_log)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send quote email: {e}")

    return SendDocumentResponse(
        success=True,
        message="Quote sent successfully",
        document_id=quote_id,
        document_type="quote",
        sent_to=request.to_email,
        sent_at=datetime.now(),
    )


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

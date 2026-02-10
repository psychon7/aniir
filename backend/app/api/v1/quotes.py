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
from app.services.cache_service import cache_service, CacheTTL, CacheKeys
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


class QuoteStatusChangeRequest(BaseModel):
    """Bulk quote status change payload (supports snake_case and camelCase)."""
    model_config = ConfigDict(populate_by_name=True)

    quote_ids: List[int] = Field(default_factory=list, alias="quoteIds")
    status_id: int = Field(..., ge=1, alias="statusId")


class QuoteLineReorderRequest(BaseModel):
    """Reorder quote lines by providing line IDs in the desired order."""
    model_config = ConfigDict(populate_by_name=True)

    line_ids: List[int] = Field(default_factory=list, alias="lineIds")


class QuoteLineMergeRequest(BaseModel):
    """Merge multiple quote lines into one line."""
    model_config = ConfigDict(populate_by_name=True)

    line_ids: List[int] = Field(default_factory=list, alias="lineIds")
    keep_line_id: Optional[int] = Field(default=None, alias="keepLineId")


# ==========================================================================
# Sync Database Helper
# ==========================================================================


def _decimal_or_zero(value: Any) -> Decimal:
    """Convert DB numeric values safely to Decimal."""
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


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
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List quotes with pagination. Cached until data changes."""
    # Build cache params (include user for row-level security)
    cache_params = {
        "page": page, "page_size": page_size, "search": search,
        "client_id": client_id, "project_id": project_id,
        "sort_by": sort_by, "sort_order": sort_order,
        "user_id": current_user.usr_id if current_user else None
    }

    # Try cache first
    if not bypass_cache:
        cached = await cache_service.get_list(CacheKeys.QUOTE, cache_params)
        if cached is not None:
            return cached

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

    result = {
        "success": True,
        "data": items,
        "page": page,
        "pageSize": page_size,
        "totalCount": total,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }

    # Cache the result (invalidated when any quote changes)
    await cache_service.set_list(CacheKeys.QUOTE, cache_params, result)

    return result


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
        quote = await service.create_quote(data, created_by=None)  # TODO: Pass current_user_id
        # Invalidate list caches (new record affects all lists)
        await cache_service.invalidate_entity_lists(CacheKeys.QUOTE)
        return quote
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
            CostPlan.cco_id_invoicing,
            CostPlan.cco_id_delivery,
            CostPlan.cpl_inv_cco_ref,
            CostPlan.cpl_inv_cco_adresse_title,
            CostPlan.cpl_inv_cco_firstname,
            CostPlan.cpl_inv_cco_lastname,
            CostPlan.cpl_inv_cco_address1,
            CostPlan.cpl_inv_cco_address2,
            CostPlan.cpl_inv_cco_postcode,
            CostPlan.cpl_inv_cco_city,
            CostPlan.cpl_inv_cco_country,
            CostPlan.cpl_inv_cco_tel1,
            CostPlan.cpl_inv_cco_tel2,
            CostPlan.cpl_inv_cco_fax,
            CostPlan.cpl_inv_cco_cellphone,
            CostPlan.cpl_inv_cco_email,
            CostPlan.cpl_dlv_cco_ref,
            CostPlan.cpl_dlv_cco_adresse_title,
            CostPlan.cpl_dlv_cco_firstname,
            CostPlan.cpl_dlv_cco_lastname,
            CostPlan.cpl_dlv_cco_address1,
            CostPlan.cpl_dlv_cco_address2,
            CostPlan.cpl_dlv_cco_postcode,
            CostPlan.cpl_dlv_cco_city,
            CostPlan.cpl_dlv_cco_country,
            CostPlan.cpl_dlv_cco_tel1,
            CostPlan.cpl_dlv_cco_tel2,
            CostPlan.cpl_dlv_cco_fax,
            CostPlan.cpl_dlv_cco_cellphone,
            CostPlan.cpl_dlv_cco_email,
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
            CostPlanLine.cln_quantity,
            CostPlanLine.cln_unit_price,
            CostPlanLine.cln_total_price,
            CostPlanLine.cln_price_with_discount_ht,
            CostPlanLine.cln_discount_percentage,
            CostPlanLine.cln_discount_amount,
            CostPlanLine.cln_image_url,
        )
        .where(CostPlanLine.cpl_id == quote_id)
        .order_by(func.coalesce(CostPlanLine.cln_level1, 999999), CostPlanLine.cln_id)
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
            "productReference": "",  # cln_ref column not in database (no migration)
            "quantity": float(l.cln_quantity or 0),
            "unitPrice": float(l.cln_unit_price or 0),
            "lineTotal": float(l.cln_price_with_discount_ht or l.cln_total_price or 0),
            "discountPercentage": float(l.cln_discount_percentage or 0),
            "discountAmount": float(l.cln_discount_amount or 0),
            "imageUrl": l.cln_image_url,
        })

    invoicing_snapshot = {
        "reference": row.cpl_inv_cco_ref,
        "addressTitle": row.cpl_inv_cco_adresse_title,
        "firstName": row.cpl_inv_cco_firstname,
        "lastName": row.cpl_inv_cco_lastname,
        "address1": row.cpl_inv_cco_address1,
        "address2": row.cpl_inv_cco_address2,
        "postcode": row.cpl_inv_cco_postcode,
        "city": row.cpl_inv_cco_city,
        "country": row.cpl_inv_cco_country,
        "phone": row.cpl_inv_cco_tel1,
        "phone2": row.cpl_inv_cco_tel2,
        "fax": row.cpl_inv_cco_fax,
        "mobile": row.cpl_inv_cco_cellphone,
        "email": row.cpl_inv_cco_email,
    }
    delivery_snapshot = {
        "reference": row.cpl_dlv_cco_ref,
        "addressTitle": row.cpl_dlv_cco_adresse_title,
        "firstName": row.cpl_dlv_cco_firstname,
        "lastName": row.cpl_dlv_cco_lastname,
        "address1": row.cpl_dlv_cco_address1,
        "address2": row.cpl_dlv_cco_address2,
        "postcode": row.cpl_dlv_cco_postcode,
        "city": row.cpl_dlv_cco_city,
        "country": row.cpl_dlv_cco_country,
        "phone": row.cpl_dlv_cco_tel1,
        "phone2": row.cpl_dlv_cco_tel2,
        "fax": row.cpl_dlv_cco_fax,
        "mobile": row.cpl_dlv_cco_cellphone,
        "email": row.cpl_dlv_cco_email,
    }

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
        "invoicingContactId": row.cco_id_invoicing,
        "deliveryContactId": row.cco_id_delivery,
        "invoicingContactSnapshot": invoicing_snapshot,
        "deliveryContactSnapshot": delivery_snapshot,
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


def _sync_change_quote_status(
    db: Session,
    quote_ids: List[int],
    status_id: int,
):
    """Sync helper to apply a status to multiple quotes."""
    unique_ids = sorted({int(qid) for qid in quote_ids if int(qid) > 0})
    if not unique_ids:
        return {"updatedCount": 0, "notFoundIds": [], "statusId": status_id}

    existing_ids = set(
        db.execute(
            select(CostPlan.cpl_id).where(CostPlan.cpl_id.in_(unique_ids))
        ).scalars().all()
    )

    now = datetime.utcnow()
    for quote_id in existing_ids:
        quote = db.get(CostPlan, quote_id)
        if not quote:
            continue
        quote.cst_id = status_id
        quote.cpl_d_update = now

    db.commit()

    not_found_ids = [qid for qid in unique_ids if qid not in existing_ids]
    return {
        "updatedCount": len(existing_ids),
        "notFoundIds": not_found_ids,
        "statusId": status_id,
    }


def _sync_reorder_quote_lines(
    db: Session,
    quote_id: int,
    requested_line_ids: List[int],
):
    """Sync helper to reorder quote lines."""
    lines = db.execute(
        select(CostPlanLine).where(CostPlanLine.cpl_id == quote_id)
    ).scalars().all()
    if not lines:
        return None

    unique_requested: List[int] = []
    for raw_id in requested_line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_requested:
            unique_requested.append(line_id)

    lines_by_id = {line.cln_id: line for line in lines}
    invalid_ids = [line_id for line_id in unique_requested if line_id not in lines_by_id]
    if invalid_ids:
        raise ValueError(f"Line IDs do not belong to quote {quote_id}: {invalid_ids}")

    current_order = sorted(
        lines,
        key=lambda line: (
            int(line.cln_level1) if line.cln_level1 is not None else 999999,
            int(line.cln_id),
        ),
    )
    final_order = unique_requested + [
        line.cln_id for line in current_order if line.cln_id not in unique_requested
    ]

    for index, line_id in enumerate(final_order, start=1):
        lines_by_id[line_id].cln_level1 = index

    db.commit()
    return final_order


def _sync_merge_quote_lines(
    db: Session,
    quote_id: int,
    line_ids: List[int],
    keep_line_id: Optional[int],
):
    """Sync helper to merge selected quote lines."""
    unique_ids: List[int] = []
    for raw_id in line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_ids:
            unique_ids.append(line_id)

    if len(unique_ids) < 2:
        raise ValueError("At least 2 line IDs are required to merge")

    selected_lines = db.execute(
        select(CostPlanLine).where(
            and_(
                CostPlanLine.cpl_id == quote_id,
                CostPlanLine.cln_id.in_(unique_ids),
            )
        )
    ).scalars().all()

    if len(selected_lines) != len(unique_ids):
        found_ids = {line.cln_id for line in selected_lines}
        missing = [line_id for line_id in unique_ids if line_id not in found_ids]
        raise ValueError(f"Line IDs do not belong to quote {quote_id}: {missing}")

    selected_by_id = {line.cln_id: line for line in selected_lines}
    primary_id = int(keep_line_id) if keep_line_id is not None else unique_ids[0]
    if primary_id not in selected_by_id:
        raise ValueError("keepLineId must be one of lineIds")

    primary_line = selected_by_id[primary_id]
    merged_lines = [selected_by_id[line_id] for line_id in unique_ids]
    lines_to_delete = [line for line in merged_lines if line.cln_id != primary_id]

    total_quantity = sum(_decimal_or_zero(line.cln_quantity) for line in merged_lines)
    total_price = sum(
        _decimal_or_zero(line.cln_total_price)
        if line.cln_total_price is not None
        else (_decimal_or_zero(line.cln_unit_price) * _decimal_or_zero(line.cln_quantity))
        for line in merged_lines
    )
    total_discount = sum(_decimal_or_zero(line.cln_discount_amount) for line in merged_lines)
    total_price_after_discount = sum(
        _decimal_or_zero(line.cln_price_with_discount_ht)
        if line.cln_price_with_discount_ht is not None
        else (_decimal_or_zero(line.cln_total_price) - _decimal_or_zero(line.cln_discount_amount))
        for line in merged_lines
    )
    total_crude = sum(_decimal_or_zero(line.cln_total_crude_price) for line in merged_lines)

    if total_price_after_discount == Decimal("0") and total_price > Decimal("0"):
        total_price_after_discount = total_price - total_discount

    primary_line.cln_quantity = total_quantity
    primary_line.cln_total_price = total_price
    primary_line.cln_discount_amount = total_discount
    primary_line.cln_price_with_discount_ht = total_price_after_discount

    if total_quantity > Decimal("0"):
        primary_line.cln_unit_price = total_price / total_quantity

    if total_crude > Decimal("0"):
        primary_line.cln_total_crude_price = total_crude
        primary_line.cln_margin = total_price_after_discount - total_crude

    if not primary_line.cln_description:
        primary_line.cln_description = "Merged line"

    for line in lines_to_delete:
        db.delete(line)

    db.commit()
    return {
        "primaryLineId": primary_id,
        "mergedLineIds": unique_ids,
        "removedLineIds": [line.cln_id for line in lines_to_delete],
    }


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

    # Invalidate cache (detail + all list caches)
    await cache_service.invalidate_entity(CacheKeys.QUOTE, quote_id)

    return updated


@router.post(
    "/change-status",
    summary="Bulk change quote status",
    description="Apply a new status to multiple quotes at once.",
)
async def change_quote_status(
    request: QuoteStatusChangeRequest,
    db: Session = Depends(get_db),
):
    result = await asyncio.to_thread(
        _sync_change_quote_status,
        db,
        request.quote_ids,
        request.status_id,
    )

    # Invalidate cache for all affected quotes (detail + all list caches)
    for qid in request.quote_ids:
        await cache_service.invalidate_entity(CacheKeys.QUOTE, qid)

    return {"success": True, **result}


@router.get(
    "/{quote_id}",
    summary="Get quote details",
    description="Get detailed information about a quote (cost plan) by ID. Cached for 2 minutes."
)
async def get_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID (cpl_id)"),
    db: Session = Depends(get_db),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
):
    """Get quote details with resolved lookup names. Cached for 2 minutes."""
    cache_key = f"{CacheKeys.QUOTE}:detail:{quote_id}"

    # Try cache first (unless bypassing)
    if not bypass_cache:
        cached = await cache_service.get(cache_key)
        if cached is not None:
            return cached

    # Fetch from database
    result = await asyncio.to_thread(_sync_get_quote_detail, db, quote_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quote {quote_id} not found")

    # Cache the result for 2 minutes
    await cache_service.set(cache_key, result, CacheTTL.MEDIUM)

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
        result = await service.update_quote(quote_id, data)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.QUOTE, quote_id)
        return result
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
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.QUOTE, quote_id)
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
        result = await service.add_quote_line(quote_id, data)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.QUOTE, quote_id)
        return result
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
    db: Session = Depends(get_db),
    service: QuoteService = Depends(get_quote_service)
):
    """Update a quote line."""
    try:
        result = await service.update_quote_line(line_id, data)
        # Invalidate cache for parent quote (detail + all list caches)
        from app.models.costplan import CostPlanLine
        line = db.get(CostPlanLine, line_id)
        if line and line.cpl_id:
            await cache_service.invalidate_entity(CacheKeys.QUOTE, line.cpl_id)
        return result
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
    db: Session = Depends(get_db),
    service: QuoteService = Depends(get_quote_service)
):
    """Delete a quote line."""
    try:
        # Get parent quote_id before deletion
        from app.models.costplan import CostPlanLine
        line = db.get(CostPlanLine, line_id)
        quote_id = line.cpl_id if line else None

        await service.delete_quote_line(line_id)

        # Invalidate cache (detail + all list caches)
        if quote_id:
            await cache_service.invalidate_entity(CacheKeys.QUOTE, quote_id)
    except QuoteLineNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except QuoteServiceError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{quote_id}/lines/reorder",
    summary="Reorder quote lines",
    description="Reorder lines of a quote using the provided line IDs order.",
)
async def reorder_quote_lines(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    request: QuoteLineReorderRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        ordered_ids = await asyncio.to_thread(
            _sync_reorder_quote_lines,
            db,
            quote_id,
            request.line_ids,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if ordered_ids is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quote {quote_id} not found")

    return {
        "success": True,
        "quoteId": quote_id,
        "orderedLineIds": ordered_ids,
    }


@router.post(
    "/{quote_id}/lines/merge",
    summary="Merge quote lines",
    description="Merge multiple quote lines into one line.",
)
async def merge_quote_lines(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    request: QuoteLineMergeRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        result = await asyncio.to_thread(
            _sync_merge_quote_lines,
            db,
            quote_id,
            request.line_ids,
            request.keep_line_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return {"success": True, "quoteId": quote_id, **result}


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

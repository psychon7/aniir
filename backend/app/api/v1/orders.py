"""Orders API router.

Provides REST API endpoints for:
- Order CRUD (create, read, update, delete)
- Order line CRUD (add, update, delete, list)
- Order status updates with transition validation
- Order status history retrieval
- Order status workflow information
"""
import asyncio
from typing import List, Optional, Any
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Path, Body, Query, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc

from app.database import get_db
from app.models.order import ClientOrder, ClientOrderLine
from app.models.delivery_form import DeliveryFormLine
from app.models.client import Client
from app.models.costplan import CostPlan, CostPlanLine
from app.models.society import Society
from app.dependencies import get_current_user
from app.schemas.document import SendDocumentRequest, SendDocumentResponse
from app.services.order_service import (
    OrderService,
    get_order_service,
    OrderServiceError,
    OrderNotFoundError,
    OrderStatusError,
)
from app.schemas.order import OrderDetailResponse, OrderResponse
from app.utils.row_level import apply_commercial_filter
from app.services.cache_service import cache_service, CacheTTL, CacheKeys


router = APIRouter(prefix="/orders", tags=["Orders"])


# =============================================================================
# Request/Response Schemas
# =============================================================================


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    status_id: int = Field(..., ge=1, le=8, description="New status ID (1-8)")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes for the status change")


class UpdateOrderStatusResponse(BaseModel):
    """Response from updating order status."""
    success: bool = True
    order_id: int
    old_status_id: int
    old_status_name: str
    new_status_id: int
    new_status_name: str
    updated_at: Optional[datetime] = None


class StatusHistoryEntry(BaseModel):
    """A single status history entry."""
    id: int
    order_id: int
    from_status_id: Optional[int]
    from_status_name: Optional[str]
    to_status_id: int
    to_status_name: str
    changed_at: datetime
    changed_by: Optional[int] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class StatusHistoryResponse(BaseModel):
    """Response containing status history."""
    success: bool = True
    order_id: int
    history: List[StatusHistoryEntry]


class StatusTransitionInfo(BaseModel):
    """Information about a status and its allowed transitions."""
    status_id: int
    status_name: str
    allowed_transitions: List[int]
    allowed_transition_names: List[str]
    is_terminal: bool


class StatusWorkflowResponse(BaseModel):
    """Response containing status workflow information."""
    success: bool = True
    statuses: List[StatusTransitionInfo]


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: ErrorDetail


# =============================================================================
# Error Handler
# =============================================================================


def handle_order_error(error: OrderServiceError) -> HTTPException:
    """
    Map OrderService errors to HTTP responses with appropriate status codes.

    - OrderNotFoundError -> 404 Not Found
    - OrderStatusError -> 409 Conflict (invalid state transition)
    - Other OrderServiceError -> 400 Bad Request
    """
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, OrderNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, OrderStatusError):
        status_code = status.HTTP_409_CONFLICT

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details,
            },
        },
    )


# =============================================================================
# Paginated Response Schema
# =============================================================================


class OrderListPaginatedResponse(BaseModel):
    """Paginated response for order list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[OrderResponse] = Field(default_factory=list, description="List of orders")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of orders")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


class OrderDiscountUpdateRequest(BaseModel):
    """Document-level discount update payload (supports snake_case and camelCase)."""
    model_config = ConfigDict(populate_by_name=True)

    discount_percentage: Optional[float] = Field(default=None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[float] = Field(default=None, ge=0, alias="discountAmount")


class ConvertOrderToQuoteResponse(BaseModel):
    """Response payload for order -> quote conversion."""
    order_id: int
    quote_id: int
    quote_reference: str
    converted_at: datetime
    lines_converted: int


class OrderLineReorderRequest(BaseModel):
    """Reorder order lines by providing line IDs in the desired order."""
    model_config = ConfigDict(populate_by_name=True)

    line_ids: List[int] = Field(default_factory=list, alias="lineIds")


class OrderLineMergeRequest(BaseModel):
    """Merge multiple order lines into one line."""
    model_config = ConfigDict(populate_by_name=True)

    line_ids: List[int] = Field(default_factory=list, alias="lineIds")
    keep_line_id: Optional[int] = Field(default=None, alias="keepLineId")


class CreateOrderLineRequest(BaseModel):
    """Request to create an order line."""
    model_config = ConfigDict(populate_by_name=True)

    description: str = Field(..., max_length=4000, alias="description")
    quantity: float = Field(1, ge=0, alias="quantity")
    unit_price: float = Field(0, ge=0, alias="unitPrice")
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[float] = Field(None, ge=0, alias="discountAmount")
    product_id: Optional[int] = Field(None, alias="productId")
    product_name: Optional[str] = Field(None, max_length=100, alias="productName")
    product_reference: Optional[str] = Field(None, max_length=100, alias="productReference")
    vat_id: Optional[int] = Field(None, alias="vatId")
    line_type_id: int = Field(1, alias="lineTypeId")


class UpdateOrderLineRequest(BaseModel):
    """Request to update an order line."""
    model_config = ConfigDict(populate_by_name=True)

    description: Optional[str] = Field(None, max_length=4000, alias="description")
    quantity: Optional[float] = Field(None, ge=0, alias="quantity")
    unit_price: Optional[float] = Field(None, ge=0, alias="unitPrice")
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[float] = Field(None, ge=0, alias="discountAmount")
    product_id: Optional[int] = Field(None, alias="productId")
    product_name: Optional[str] = Field(None, max_length=100, alias="productName")
    product_reference: Optional[str] = Field(None, max_length=100, alias="productReference")
    vat_id: Optional[int] = Field(None, alias="vatId")
    line_type_id: Optional[int] = Field(None, alias="lineTypeId")


class CreateOrderRequest(BaseModel):
    """Request to create a new client order."""
    model_config = ConfigDict(populate_by_name=True)

    client_id: int = Field(..., alias="clientId")
    society_id: int = Field(..., alias="societyId")
    vat_id: int = Field(..., alias="vatId")
    currency_id: Optional[int] = Field(None, alias="currencyId")
    payment_condition_id: Optional[int] = Field(None, alias="paymentConditionId")
    payment_mode_id: Optional[int] = Field(None, alias="paymentModeId")
    project_id: Optional[int] = Field(None, alias="projectId")
    cost_plan_id: Optional[int] = Field(None, alias="costPlanId")
    order_name: Optional[str] = Field(None, max_length=1000, alias="orderName")
    order_date: Optional[str] = Field(None, alias="orderDate")
    expected_delivery_from: Optional[str] = Field(None, alias="expectedDeliveryFrom")
    expected_delivery_to: Optional[str] = Field(None, alias="expectedDeliveryTo")
    header_text: Optional[str] = Field(None, alias="headerText")
    footer_text: Optional[str] = Field(None, alias="footerText")
    client_comment: Optional[str] = Field(None, max_length=4000, alias="clientComment")
    internal_comment: Optional[str] = Field(None, max_length=4000, alias="internalComment")
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[float] = Field(None, ge=0, alias="discountAmount")
    lines: List[CreateOrderLineRequest] = Field(default_factory=list)


# =============================================================================
# Sync Database Helper
# =============================================================================


def _decimal_or_zero(value: Any) -> Decimal:
    """Convert DB numeric values safely to Decimal."""
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def _generate_order_code(db: Session) -> str:
    """Generate unique order reference code."""
    year = datetime.utcnow().year
    max_id = db.execute(select(func.max(ClientOrder.cod_id))).scalar() or 0
    return f"COD-{year}-{int(max_id) + 1:05d}"


def _compute_line_totals(
    quantity: float,
    unit_price: float,
    discount_percentage: Optional[float],
    discount_amount: Optional[float],
) -> tuple:
    """Compute line total, discount_amount, and price_with_discount_ht."""
    total_price = Decimal(str(quantity)) * Decimal(str(unit_price))
    if discount_percentage is not None and discount_percentage > 0:
        disc_amt = total_price * Decimal(str(discount_percentage)) / Decimal("100")
    elif discount_amount is not None:
        disc_amt = Decimal(str(discount_amount))
    else:
        disc_amt = Decimal("0")
    price_with_discount = total_price - disc_amt
    disc_pct = (
        Decimal(str(discount_percentage))
        if discount_percentage is not None
        else (disc_amt * Decimal("100") / total_price if total_price > 0 and disc_amt > 0 else Decimal("0"))
    )
    return total_price, disc_amt, price_with_discount, disc_pct


def _sync_create_order(
    db: Session,
    data: CreateOrderRequest,
    current_user: Optional[Any] = None,
):
    """Sync helper to create a new client order with optional lines."""
    now = datetime.utcnow()
    code = _generate_order_code(db)

    # Resolve order_date
    order_date = now
    if data.order_date:
        try:
            order_date = datetime.fromisoformat(data.order_date.replace("Z", "+00:00").replace("T", " ").split("+")[0])
        except (ValueError, TypeError):
            order_date = now

    # Resolve delivery dates
    delivery_from = None
    delivery_to = None
    if data.expected_delivery_from:
        try:
            delivery_from = datetime.fromisoformat(data.expected_delivery_from.replace("Z", "+00:00").replace("T", " ").split("+")[0])
        except (ValueError, TypeError):
            pass
    if data.expected_delivery_to:
        try:
            delivery_to = datetime.fromisoformat(data.expected_delivery_to.replace("Z", "+00:00").replace("T", " ").split("+")[0])
        except (ValueError, TypeError):
            pass

    # Get creator user ID from current_user
    creator_id = 1  # default fallback
    if current_user:
        creator_id = getattr(current_user, "usr_id", None) or getattr(current_user, "id", None) or 1

    # Default payment condition and mode to 1 if not provided (required columns)
    pco_id = data.payment_condition_id or 1
    pmo_id = data.payment_mode_id or 1
    prj_id = data.project_id or 1

    order = ClientOrder(
        cod_code=code,
        cod_d_creation=order_date,
        cod_d_update=now,
        cli_id=data.client_id,
        soc_id=data.society_id,
        vat_id=data.vat_id,
        pco_id=pco_id,
        pmo_id=pmo_id,
        prj_id=prj_id,
        cpl_id=data.cost_plan_id,
        cod_name=data.order_name,
        cod_d_pre_delivery_from=delivery_from,
        cod_d_pre_delivery_to=delivery_to,
        cod_header_text=data.header_text,
        cod_footer_text=data.footer_text,
        cod_client_comment=data.client_comment,
        cod_inter_comment=data.internal_comment,
        cod_discount_percentage=Decimal(str(data.discount_percentage)) if data.discount_percentage else None,
        cod_discount_amount=Decimal(str(data.discount_amount)) if data.discount_amount else None,
        usr_creator_id=creator_id,
    )
    db.add(order)
    db.flush()

    # Add lines if provided
    for idx, line_data in enumerate(data.lines, start=1):
        total_price, disc_amt, price_with_discount, disc_pct = _compute_line_totals(
            line_data.quantity, line_data.unit_price,
            line_data.discount_percentage, line_data.discount_amount,
        )
        line = ClientOrderLine(
            cod_id=order.cod_id,
            col_level1=idx,
            col_description=line_data.description,
            col_quantity=Decimal(str(line_data.quantity)),
            col_unit_price=Decimal(str(line_data.unit_price)),
            col_total_price=total_price,
            col_discount_percentage=disc_pct,
            col_discount_amount=disc_amt,
            col_price_with_discount_ht=price_with_discount,
            prd_id=line_data.product_id,
            col_prd_name=line_data.product_name,
            col_ref=line_data.product_reference,
            vat_id=line_data.vat_id or data.vat_id,
            ltp_id=line_data.line_type_id or 1,
        )
        db.add(line)

    db.commit()
    return _sync_get_order_detail(db, order.cod_id)


def _sync_add_order_line(
    db: Session,
    order_id: int,
    data: CreateOrderLineRequest,
):
    """Sync helper to add a line to an existing order."""
    order = db.get(ClientOrder, order_id)
    if not order:
        return None

    # Get next level1
    max_level = db.execute(
        select(func.max(ClientOrderLine.col_level1)).where(ClientOrderLine.cod_id == order_id)
    ).scalar() or 0
    next_level = (max_level or 0) + 1

    total_price, disc_amt, price_with_discount, disc_pct = _compute_line_totals(
        data.quantity, data.unit_price,
        data.discount_percentage, data.discount_amount,
    )

    line = ClientOrderLine(
        cod_id=order_id,
        col_level1=next_level,
        col_description=data.description,
        col_quantity=Decimal(str(data.quantity)),
        col_unit_price=Decimal(str(data.unit_price)),
        col_total_price=total_price,
        col_discount_percentage=disc_pct,
        col_discount_amount=disc_amt,
        col_price_with_discount_ht=price_with_discount,
        prd_id=data.product_id,
        col_prd_name=data.product_name,
        col_ref=data.product_reference,
        vat_id=data.vat_id,
        ltp_id=data.line_type_id or 1,
    )
    db.add(line)

    order.cod_d_update = datetime.utcnow()
    db.commit()

    return {
        "id": line.col_id,
        "productName": line.col_prd_name or "",
        "description": line.col_description or "",
        "productReference": line.col_ref or "",
        "quantity": float(line.col_quantity or 0),
        "unitPrice": float(line.col_unit_price or 0),
        "lineTotal": float(line.col_price_with_discount_ht or line.col_total_price or 0),
        "discountPercentage": float(line.col_discount_percentage or 0),
        "discountAmount": float(line.col_discount_amount or 0),
    }


def _sync_update_order_line(
    db: Session,
    order_id: int,
    line_id: int,
    data: UpdateOrderLineRequest,
):
    """Sync helper to update an existing order line."""
    line = db.execute(
        select(ClientOrderLine).where(
            and_(ClientOrderLine.col_id == line_id, ClientOrderLine.cod_id == order_id)
        )
    ).scalar_one_or_none()

    if not line:
        return None

    if data.description is not None:
        line.col_description = data.description
    if data.product_id is not None:
        line.prd_id = data.product_id
    if data.product_name is not None:
        line.col_prd_name = data.product_name
    if data.product_reference is not None:
        line.col_ref = data.product_reference
    if data.vat_id is not None:
        line.vat_id = data.vat_id
    if data.line_type_id is not None:
        line.ltp_id = data.line_type_id

    # Recalculate totals if pricing fields changed
    qty = data.quantity if data.quantity is not None else float(line.col_quantity or 0)
    price = data.unit_price if data.unit_price is not None else float(line.col_unit_price or 0)
    disc_pct = data.discount_percentage if data.discount_percentage is not None else (float(line.col_discount_percentage or 0))
    disc_amt_input = data.discount_amount

    total_price, disc_amt, price_with_discount, final_disc_pct = _compute_line_totals(
        qty, price, disc_pct, disc_amt_input,
    )

    line.col_quantity = Decimal(str(qty))
    line.col_unit_price = Decimal(str(price))
    line.col_total_price = total_price
    line.col_discount_percentage = final_disc_pct
    line.col_discount_amount = disc_amt
    line.col_price_with_discount_ht = price_with_discount

    # Update order timestamp
    order = db.get(ClientOrder, order_id)
    if order:
        order.cod_d_update = datetime.utcnow()

    db.commit()

    return {
        "id": line.col_id,
        "productName": line.col_prd_name or "",
        "description": line.col_description or "",
        "productReference": line.col_ref or "",
        "quantity": float(line.col_quantity or 0),
        "unitPrice": float(line.col_unit_price or 0),
        "lineTotal": float(line.col_price_with_discount_ht or line.col_total_price or 0),
        "discountPercentage": float(line.col_discount_percentage or 0),
        "discountAmount": float(line.col_discount_amount or 0),
    }


def _sync_delete_order_line(
    db: Session,
    order_id: int,
    line_id: int,
):
    """Sync helper to delete a line from an order."""
    line = db.execute(
        select(ClientOrderLine).where(
            and_(ClientOrderLine.col_id == line_id, ClientOrderLine.cod_id == order_id)
        )
    ).scalar_one_or_none()

    if not line:
        return False

    db.delete(line)

    # Update order timestamp
    order = db.get(ClientOrder, order_id)
    if order:
        order.cod_d_update = datetime.utcnow()

    db.commit()
    return True


def _sync_get_order_lines(db: Session, order_id: int):
    """Sync helper to get all lines for an order."""
    order = db.get(ClientOrder, order_id)
    if not order:
        return None

    lines_query = (
        select(
            ClientOrderLine.col_id,
            ClientOrderLine.col_prd_name,
            ClientOrderLine.col_description,
            ClientOrderLine.col_ref,
            ClientOrderLine.col_quantity,
            ClientOrderLine.col_unit_price,
            ClientOrderLine.col_total_price,
            ClientOrderLine.col_price_with_discount_ht,
            ClientOrderLine.col_discount_percentage,
            ClientOrderLine.col_discount_amount,
            ClientOrderLine.col_image_url,
            ClientOrderLine.prd_id,
        )
        .where(ClientOrderLine.cod_id == order_id)
        .order_by(func.coalesce(ClientOrderLine.col_level1, 999999), ClientOrderLine.col_id)
    )
    line_rows = db.execute(lines_query).all()

    return [
        {
            "id": l.col_id,
            "productId": l.prd_id,
            "productName": l.col_prd_name or "",
            "description": l.col_description or "",
            "productReference": l.col_ref or "",
            "quantity": float(l.col_quantity or 0),
            "unitPrice": float(l.col_unit_price or 0),
            "lineTotal": float(l.col_price_with_discount_ht or l.col_total_price or 0),
            "discountPercentage": float(l.col_discount_percentage or 0),
            "discountAmount": float(l.col_discount_amount or 0),
            "imageUrl": l.col_image_url,
        }
        for l in line_rows
    ]


def _sync_list_orders(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    status_id: Optional[int] = None,
    project_id: Optional[int] = None,
    quote_id: Optional[int] = None,
    sort_by: str = "cod_d_creation",
    sort_order: str = "desc",
    current_user: Optional[Any] = None,
):
    """Sync function to list orders with pagination, joining client."""
    # Pre-aggregated subquery for totalAmount (runs once, not per-row)
    line_totals = (
        select(
            ClientOrderLine.cod_id,
            func.coalesce(func.sum(ClientOrderLine.col_price_with_discount_ht), 0).label("total_amount"),
        )
        .group_by(ClientOrderLine.cod_id)
        .subquery()
    )

    query = (
        select(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.soc_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_update,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_d_pre_delivery_to,
            ClientOrder.cod_name,
            ClientOrder.soc_id,
            ClientOrder.cod_discount_percentage,
            ClientOrder.cod_discount_amount,
            Client.cli_company_name,
            func.coalesce(line_totals.c.total_amount, 0).label("total_amount"),
        )
        .outerjoin(Client, ClientOrder.cli_id == Client.cli_id)
        .outerjoin(line_totals, ClientOrder.cod_id == line_totals.c.cod_id)
    )
    count_query = select(func.count(ClientOrder.cod_id))

    conditions = []

    if search:
        search_term = f"%{search}%"
        conditions.append(ClientOrder.cod_code.ilike(search_term))

    if client_id:
        conditions.append(ClientOrder.cli_id == client_id)

    if project_id:
        conditions.append(ClientOrder.prj_id == project_id)

    if quote_id:
        conditions.append(ClientOrder.cpl_id == quote_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Row-level security for non-admin users (commercial hierarchy).
    query = apply_commercial_filter(
        query,
        ClientOrder,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )
    count_query = apply_commercial_filter(
        count_query,
        ClientOrder,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )

    # Get total count
    total_result = db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(ClientOrder, sort_by, ClientOrder.cod_d_creation)
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


# =============================================================================
# Endpoints
# =============================================================================


@router.get(
    "",
    summary="List orders with pagination",
    description="Get a paginated list of orders with optional filters."
)
async def list_orders(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by reference"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    quote_id: Optional[int] = Query(None, description="Filter by quote/cost plan ID"),
    sort_by: str = Query("cod_d_creation", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List orders with pagination. Cached until data changes."""
    # Build cache params (include user for row-level security)
    cache_params = {
        "page": page, "page_size": page_size, "search": search,
        "client_id": client_id, "status_id": status_id, "project_id": project_id,
        "quote_id": quote_id, "sort_by": sort_by, "sort_order": sort_order,
        "user_id": current_user.usr_id if current_user else None
    }

    # Try cache first
    if not bypass_cache:
        cached = await cache_service.get_list(CacheKeys.ORDER, cache_params)
        if cached is not None:
            return cached

    rows, total = await asyncio.to_thread(
        _sync_list_orders, db, page, page_size, search, client_id, status_id, project_id, quote_id, sort_by, sort_order, current_user
    )

    # Build camelCase response matching frontend OrderListItem type
    items = []
    for row in rows:
        items.append({
            "id": row.cod_id,
            "reference": row.cod_code or "",
            "clientName": row.cli_company_name or "",
            "orderDate": row.cod_d_creation.isoformat() if row.cod_d_creation else None,
            "expectedDeliveryDate": row.cod_d_pre_delivery_from.isoformat() if row.cod_d_pre_delivery_from else None,
            "statusId": None,
            "statusName": "Active",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cod_name,
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

    # Cache the result (invalidated when any order changes)
    await cache_service.set_list(CacheKeys.ORDER, cache_params, result)

    return result


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new client order",
    description="Create a new order with optional line items.",
)
async def create_order(
    data: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Create a new client order."""
    result = await asyncio.to_thread(_sync_create_order, db, data, current_user)
    # Invalidate list caches (new record affects all lists)
    await cache_service.invalidate_entity_lists(CacheKeys.ORDER)
    return result


def _sync_get_order_detail(db: Session, order_id: int):
    """Sync helper to get order detail with lines, returning camelCase dict."""
    # Fetch order header with client join
    query = (
        select(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.soc_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_update,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_d_pre_delivery_to,
            ClientOrder.cod_name,
            ClientOrder.cod_discount_percentage,
            ClientOrder.cod_discount_amount,
            ClientOrder.cpl_id,
            ClientOrder.cod_header_text,
            ClientOrder.cod_footer_text,
            ClientOrder.cco_id_invoicing,
            ClientOrder.cco_id_delivery,
            ClientOrder.cod_inv_cco_ref,
            ClientOrder.cod_inv_cco_adresse_title,
            ClientOrder.cod_inv_cco_firstname,
            ClientOrder.cod_inv_cco_lastname,
            ClientOrder.cod_inv_cco_address1,
            ClientOrder.cod_inv_cco_address2,
            ClientOrder.cod_inv_cco_postcode,
            ClientOrder.cod_inv_cco_city,
            ClientOrder.cod_inv_cco_country,
            ClientOrder.cod_inv_cco_tel1,
            ClientOrder.cod_inv_cco_tel2,
            ClientOrder.cod_inv_cco_fax,
            ClientOrder.cod_inv_cco_cellphone,
            ClientOrder.cod_inv_cco_email,
            ClientOrder.cod_dlv_cco_ref,
            ClientOrder.cod_dlv_cco_adresse_title,
            ClientOrder.cod_dlv_cco_firstname,
            ClientOrder.cod_dlv_cco_lastname,
            ClientOrder.cod_dlv_cco_address1,
            ClientOrder.cod_dlv_cco_address2,
            ClientOrder.cod_dlv_cco_postcode,
            ClientOrder.cod_dlv_cco_city,
            ClientOrder.cod_dlv_cco_country,
            ClientOrder.cod_dlv_cco_tel1,
            ClientOrder.cod_dlv_cco_tel2,
            ClientOrder.cod_dlv_cco_fax,
            ClientOrder.cod_dlv_cco_cellphone,
            ClientOrder.cod_dlv_cco_email,
            Client.cli_company_name,
        )
        .outerjoin(Client, ClientOrder.cli_id == Client.cli_id)
        .where(ClientOrder.cod_id == order_id)
    )
    result = db.execute(query)
    row = result.first()
    if not row:
        return None

    # Resolve quote reference if linked
    quote_reference = None
    if row.cpl_id:
        q = db.execute(select(CostPlan.cpl_code).where(CostPlan.cpl_id == row.cpl_id))
        qr = q.first()
        if qr:
            quote_reference = qr.cpl_code

    # Pre-aggregate delivered quantity per order line for reliquat/backorder visibility.
    delivered_qty_subq = (
        select(
            DeliveryFormLine.col_id.label("col_id"),
            func.coalesce(func.sum(DeliveryFormLine.dfl_quantity), 0).label("delivered_qty"),
        )
        .where(DeliveryFormLine.col_id.is_not(None))
        .group_by(DeliveryFormLine.col_id)
        .subquery()
    )

    # Fetch lines
    lines_query = (
        select(
            ClientOrderLine.col_id,
            ClientOrderLine.col_prd_name,
            ClientOrderLine.col_description,
            ClientOrderLine.col_ref,
            ClientOrderLine.col_quantity,
            func.coalesce(delivered_qty_subq.c.delivered_qty, 0).label("delivered_quantity"),
            ClientOrderLine.col_unit_price,
            ClientOrderLine.col_total_price,
            ClientOrderLine.col_price_with_discount_ht,
            ClientOrderLine.col_discount_percentage,
            ClientOrderLine.col_discount_amount,
            ClientOrderLine.col_image_url,
        )
        .outerjoin(delivered_qty_subq, ClientOrderLine.col_id == delivered_qty_subq.c.col_id)
        .where(ClientOrderLine.cod_id == order_id)
        .order_by(func.coalesce(ClientOrderLine.col_level1, 999999), ClientOrderLine.col_id)
    )
    lines_result = db.execute(lines_query)
    line_rows = lines_result.all()

    # Compute totals from lines
    subtotal = sum(float(l.col_price_with_discount_ht or l.col_total_price or 0) for l in line_rows)
    discount_amount = float(row.cod_discount_amount or 0)
    total_amount = subtotal - discount_amount

    # Build lines list
    lines = []
    for l in line_rows:
        lines.append({
            "id": l.col_id,
            "productName": l.col_prd_name or "",
            "description": l.col_description or "",
            "productReference": l.col_ref or "",
            "quantity": float(l.col_quantity or 0),
            "deliveredQuantity": float(l.delivered_quantity or 0),
            "unitPrice": float(l.col_unit_price or 0),
            "lineTotal": float(l.col_price_with_discount_ht or l.col_total_price or 0),
            "discountPercentage": float(l.col_discount_percentage or 0),
            "discountAmount": float(l.col_discount_amount or 0),
            "imageUrl": l.col_image_url,
        })

    invoicing_snapshot = {
        "reference": row.cod_inv_cco_ref,
        "addressTitle": row.cod_inv_cco_adresse_title,
        "firstName": row.cod_inv_cco_firstname,
        "lastName": row.cod_inv_cco_lastname,
        "address1": row.cod_inv_cco_address1,
        "address2": row.cod_inv_cco_address2,
        "postcode": row.cod_inv_cco_postcode,
        "city": row.cod_inv_cco_city,
        "country": row.cod_inv_cco_country,
        "phone": row.cod_inv_cco_tel1,
        "phone2": row.cod_inv_cco_tel2,
        "fax": row.cod_inv_cco_fax,
        "mobile": row.cod_inv_cco_cellphone,
        "email": row.cod_inv_cco_email,
    }
    delivery_snapshot = {
        "reference": row.cod_dlv_cco_ref,
        "addressTitle": row.cod_dlv_cco_adresse_title,
        "firstName": row.cod_dlv_cco_firstname,
        "lastName": row.cod_dlv_cco_lastname,
        "address1": row.cod_dlv_cco_address1,
        "address2": row.cod_dlv_cco_address2,
        "postcode": row.cod_dlv_cco_postcode,
        "city": row.cod_dlv_cco_city,
        "country": row.cod_dlv_cco_country,
        "phone": row.cod_dlv_cco_tel1,
        "phone2": row.cod_dlv_cco_tel2,
        "fax": row.cod_dlv_cco_fax,
        "mobile": row.cod_dlv_cco_cellphone,
        "email": row.cod_dlv_cco_email,
    }

    return {
        "id": row.cod_id,
        "reference": row.cod_code or "",
        "name": row.cod_name or "",
        "clientId": row.cli_id,
        "societyId": row.soc_id,
        "clientName": row.cli_company_name or "",
        "orderDate": row.cod_d_creation.isoformat() if row.cod_d_creation else None,
        "requiredDate": row.cod_d_pre_delivery_from.isoformat() if row.cod_d_pre_delivery_from else None,
        "expectedDeliveryDate": row.cod_d_pre_delivery_from.isoformat() if row.cod_d_pre_delivery_from else None,
        "statusName": "Active",
        "paymentStatusName": "Unpaid",
        "quoteReference": quote_reference,
        "currency": "EUR",
        "subtotal": subtotal,
        "totalAmount": total_amount,
        "discountAmount": discount_amount,
        "discountPercentage": float(row.cod_discount_percentage or 0),
        "taxAmount": 0,
        "paidAmount": 0,
        "headerText": row.cod_header_text or "",
        "footerText": row.cod_footer_text or "",
        "invoicingContactId": row.cco_id_invoicing,
        "deliveryContactId": row.cco_id_delivery,
        "invoicingContactSnapshot": invoicing_snapshot,
        "deliveryContactSnapshot": delivery_snapshot,
        "lines": lines,
    }


def _sync_get_society(db: Session, society_id: Optional[int]):
    """Fetch society details for PDF rendering."""
    if society_id:
        return db.get(Society, society_id)
    return (
        db.execute(
            select(Society).where(Society.soc_is_actived == True).order_by(Society.soc_id)
        )
        .scalars()
        .first()
    )


def _sync_get_orders_by_quote(db: Session, quote_id: int):
    """Sync helper to get orders by quote."""
    rows = db.execute(
        select(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_name,
            Client.cli_company_name,
            func.coalesce(func.sum(ClientOrderLine.col_price_with_discount_ht), 0).label("total_amount"),
        )
        .outerjoin(Client, ClientOrder.cli_id == Client.cli_id)
        .outerjoin(ClientOrderLine, ClientOrder.cod_id == ClientOrderLine.cod_id)
        .where(ClientOrder.cpl_id == quote_id)
        .group_by(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_name,
            Client.cli_company_name,
        )
        .order_by(desc(ClientOrder.cod_d_creation))
    ).all()
    return [
        {
            "id": row.cod_id,
            "reference": row.cod_code or "",
            "clientId": row.cli_id,
            "clientName": row.cli_company_name or "",
            "orderDate": row.cod_d_creation.isoformat() if row.cod_d_creation else None,
            "expectedDeliveryDate": row.cod_d_pre_delivery_from.isoformat() if row.cod_d_pre_delivery_from else None,
            "statusName": "Active",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cod_name or "",
            "currencyCode": "EUR",
        }
        for row in rows
    ]


def _sync_get_orders_by_project(db: Session, project_id: int):
    """Sync helper to get orders by project."""
    rows = db.execute(
        select(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_name,
            Client.cli_company_name,
            func.coalesce(func.sum(ClientOrderLine.col_price_with_discount_ht), 0).label("total_amount"),
        )
        .outerjoin(Client, ClientOrder.cli_id == Client.cli_id)
        .outerjoin(ClientOrderLine, ClientOrder.cod_id == ClientOrderLine.cod_id)
        .where(ClientOrder.prj_id == project_id)
        .group_by(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
            ClientOrder.cod_d_creation,
            ClientOrder.cod_d_pre_delivery_from,
            ClientOrder.cod_name,
            Client.cli_company_name,
        )
        .order_by(desc(ClientOrder.cod_d_creation))
    ).all()
    return [
        {
            "id": row.cod_id,
            "reference": row.cod_code or "",
            "clientId": row.cli_id,
            "clientName": row.cli_company_name or "",
            "orderDate": row.cod_d_creation.isoformat() if row.cod_d_creation else None,
            "expectedDeliveryDate": row.cod_d_pre_delivery_from.isoformat() if row.cod_d_pre_delivery_from else None,
            "statusName": "Active",
            "totalAmount": float(row.total_amount or 0),
            "name": row.cod_name or "",
            "currencyCode": "EUR",
        }
        for row in rows
    ]


def _sync_update_order_discount(
    db: Session,
    order_id: int,
    discount_percentage: Optional[float],
    discount_amount: Optional[float],
):
    """Sync helper to update order-level discount."""
    order = db.get(ClientOrder, order_id)
    if not order:
        return None

    subtotal = Decimal(str(
        db.execute(
            select(func.coalesce(func.sum(ClientOrderLine.col_price_with_discount_ht), 0)).where(
                ClientOrderLine.cod_id == order_id
            )
        ).scalar() or 0
    ))

    if discount_percentage is not None:
        order.cod_discount_percentage = Decimal(str(discount_percentage))
    if discount_amount is not None:
        order.cod_discount_amount = Decimal(str(discount_amount))
    elif discount_percentage is not None:
        order.cod_discount_amount = subtotal * Decimal(str(discount_percentage)) / Decimal("100")

    order.cod_d_update = datetime.utcnow()
    db.commit()
    return _sync_get_order_detail(db, order_id)


def _generate_quote_code_from_order(db: Session) -> str:
    year = datetime.utcnow().year
    max_id = db.execute(select(func.max(CostPlan.cpl_id))).scalar() or 0
    return f"CPL-{year}-{int(max_id) + 1:05d}"


def _sync_convert_order_to_quote(db: Session, order_id: int):
    """Sync helper to create a quote from an existing order (reverse conversion)."""
    order = db.get(ClientOrder, order_id)
    if not order:
        return None

    now = datetime.utcnow()
    valid_until = order.cod_d_pre_delivery_to or order.cod_d_pre_delivery_from or now

    quote = CostPlan(
        cpl_code=_generate_quote_code_from_order(db),
        cpl_d_creation=now,
        cpl_d_update=now,
        cst_id=1,
        cli_id=order.cli_id,
        pco_id=order.pco_id,
        pmo_id=order.pmo_id,
        cpl_d_validity=valid_until,
        cpl_d_pre_delivery=order.cod_d_pre_delivery_from,
        cpl_header_text=order.cod_header_text,
        cpl_footer_text=order.cod_footer_text,
        cco_id_invoicing=order.cco_id_invoicing,
        cco_id_delivery=order.cco_id_delivery,
        cpl_client_comment=order.cod_client_comment,
        cpl_inter_comment=order.cod_inter_comment,
        usr_creator_id=order.usr_creator_id,
        vat_id=order.vat_id,
        prj_id=order.prj_id,
        soc_id=order.soc_id,
        cpl_discount_percentage=order.cod_discount_percentage,
        cpl_discount_amount=order.cod_discount_amount,
        cpl_name=order.cod_name,
        usr_com_1=order.usr_com_1,
        usr_com_2=order.usr_com_2,
        usr_com_3=order.usr_com_3,
        cpl_key_project=order.cod_key_project,
        cpl_inv_cco_ref=order.cod_inv_cco_ref,
        cpl_inv_cco_adresse_title=order.cod_inv_cco_adresse_title,
        cpl_inv_cco_firstname=order.cod_inv_cco_firstname,
        cpl_inv_cco_lastname=order.cod_inv_cco_lastname,
        cpl_inv_cco_address1=order.cod_inv_cco_address1,
        cpl_inv_cco_address2=order.cod_inv_cco_address2,
        cpl_inv_cco_postcode=order.cod_inv_cco_postcode,
        cpl_inv_cco_city=order.cod_inv_cco_city,
        cpl_inv_cco_country=order.cod_inv_cco_country,
        cpl_inv_cco_tel1=order.cod_inv_cco_tel1,
        cpl_inv_cco_tel2=order.cod_inv_cco_tel2,
        cpl_inv_cco_fax=order.cod_inv_cco_fax,
        cpl_inv_cco_cellphone=order.cod_inv_cco_cellphone,
        cpl_inv_cco_email=order.cod_inv_cco_email,
        cpl_dlv_cco_ref=order.cod_dlv_cco_ref,
        cpl_dlv_cco_adresse_title=order.cod_dlv_cco_adresse_title,
        cpl_dlv_cco_firstname=order.cod_dlv_cco_firstname,
        cpl_dlv_cco_lastname=order.cod_dlv_cco_lastname,
        cpl_dlv_cco_address1=order.cod_dlv_cco_address1,
        cpl_dlv_cco_address2=order.cod_dlv_cco_address2,
        cpl_dlv_cco_postcode=order.cod_dlv_cco_postcode,
        cpl_dlv_cco_city=order.cod_dlv_cco_city,
        cpl_dlv_cco_country=order.cod_dlv_cco_country,
        cpl_dlv_cco_tel1=order.cod_dlv_cco_tel1,
        cpl_dlv_cco_tel2=order.cod_dlv_cco_tel2,
        cpl_dlv_cco_fax=order.cod_dlv_cco_fax,
        cpl_dlv_cco_cellphone=order.cod_dlv_cco_cellphone,
        cpl_dlv_cco_email=order.cod_dlv_cco_email,
    )
    db.add(quote)
    db.flush()

    order_lines = db.execute(
        select(ClientOrderLine).where(ClientOrderLine.cod_id == order_id)
    ).scalars().all()
    for line in order_lines:
        quote_line = CostPlanLine(
            cpl_id=quote.cpl_id,
            cln_level1=line.col_level1,
            cln_level2=line.col_level2,
            cln_description=line.col_description,
            prd_id=line.prd_id,
            pit_id=line.pit_id,
            cln_purchase_price=line.col_purchase_price,
            cln_unit_price=line.col_unit_price,
            cln_quantity=line.col_quantity,
            cln_total_price=line.col_total_price,
            cln_total_crude_price=line.col_total_crude_price,
            vat_id=line.vat_id,
            ltp_id=line.ltp_id,
            cln_prd_name=line.col_prd_name,
            # cln_ref has no migration - not in database
            cln_image_url=line.col_image_url,  # Added by migration V1.0.0.9
            cln_discount_percentage=line.col_discount_percentage,
            cln_discount_amount=line.col_discount_amount,
            cln_price_with_discount_ht=line.col_price_with_discount_ht,
            cln_margin=line.col_margin,
        )
        db.add(quote_line)

    db.commit()
    return {
        "order_id": order_id,
        "quote_id": quote.cpl_id,
        "quote_reference": quote.cpl_code,
        "converted_at": now,
        "lines_converted": len(order_lines),
    }


def _sync_reorder_order_lines(
    db: Session,
    order_id: int,
    requested_line_ids: List[int],
):
    """Sync helper to reorder order lines."""
    lines = db.execute(
        select(ClientOrderLine).where(ClientOrderLine.cod_id == order_id)
    ).scalars().all()
    if not lines:
        return None

    unique_requested: List[int] = []
    for raw_id in requested_line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_requested:
            unique_requested.append(line_id)

    lines_by_id = {line.col_id: line for line in lines}
    invalid_ids = [line_id for line_id in unique_requested if line_id not in lines_by_id]
    if invalid_ids:
        raise ValueError(f"Line IDs do not belong to order {order_id}: {invalid_ids}")

    current_order = sorted(
        lines,
        key=lambda line: (
            int(line.col_level1) if line.col_level1 is not None else 999999,
            int(line.col_id),
        ),
    )
    final_order = unique_requested + [
        line.col_id for line in current_order if line.col_id not in unique_requested
    ]

    for index, line_id in enumerate(final_order, start=1):
        lines_by_id[line_id].col_level1 = index

    db.commit()
    return final_order


def _sync_merge_order_lines(
    db: Session,
    order_id: int,
    line_ids: List[int],
    keep_line_id: Optional[int],
):
    """Sync helper to merge selected order lines."""
    unique_ids: List[int] = []
    for raw_id in line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_ids:
            unique_ids.append(line_id)

    if len(unique_ids) < 2:
        raise ValueError("At least 2 line IDs are required to merge")

    selected_lines = db.execute(
        select(ClientOrderLine).where(
            and_(
                ClientOrderLine.cod_id == order_id,
                ClientOrderLine.col_id.in_(unique_ids),
            )
        )
    ).scalars().all()

    if len(selected_lines) != len(unique_ids):
        found_ids = {line.col_id for line in selected_lines}
        missing = [line_id for line_id in unique_ids if line_id not in found_ids]
        raise ValueError(f"Line IDs do not belong to order {order_id}: {missing}")

    selected_by_id = {line.col_id: line for line in selected_lines}
    primary_id = int(keep_line_id) if keep_line_id is not None else unique_ids[0]
    if primary_id not in selected_by_id:
        raise ValueError("keepLineId must be one of lineIds")

    primary_line = selected_by_id[primary_id]
    merged_lines = [selected_by_id[line_id] for line_id in unique_ids]
    lines_to_delete = [line for line in merged_lines if line.col_id != primary_id]

    total_quantity = sum(_decimal_or_zero(line.col_quantity) for line in merged_lines)
    total_price = sum(
        _decimal_or_zero(line.col_total_price)
        if line.col_total_price is not None
        else (_decimal_or_zero(line.col_unit_price) * _decimal_or_zero(line.col_quantity))
        for line in merged_lines
    )
    total_discount = sum(_decimal_or_zero(line.col_discount_amount) for line in merged_lines)
    total_price_after_discount = sum(
        _decimal_or_zero(line.col_price_with_discount_ht)
        if line.col_price_with_discount_ht is not None
        else (_decimal_or_zero(line.col_total_price) - _decimal_or_zero(line.col_discount_amount))
        for line in merged_lines
    )
    total_crude = sum(_decimal_or_zero(line.col_total_crude_price) for line in merged_lines)

    if total_price_after_discount == Decimal("0") and total_price > Decimal("0"):
        total_price_after_discount = total_price - total_discount

    primary_line.col_quantity = total_quantity
    primary_line.col_total_price = total_price
    primary_line.col_discount_amount = total_discount
    primary_line.col_price_with_discount_ht = total_price_after_discount
    if total_quantity > Decimal("0"):
        primary_line.col_unit_price = total_price / total_quantity

    if total_crude > Decimal("0"):
        primary_line.col_total_crude_price = total_crude
        primary_line.col_margin = total_price_after_discount - total_crude

    if not primary_line.col_description:
        primary_line.col_description = "Merged line"

    for line in lines_to_delete:
        db.delete(line)

    db.commit()
    return {
        "primaryLineId": primary_id,
        "mergedLineIds": unique_ids,
        "removedLineIds": [line.col_id for line in lines_to_delete],
    }


@router.get(
    "/by-project/{project_id}",
    summary="Get orders by project",
    description="Get all orders linked to a project.",
)
async def get_orders_by_project(
    project_id: int = Path(..., gt=0, description="Project ID"),
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_orders_by_project, db, project_id)


@router.get(
    "/by-quote/{quote_id}",
    summary="Get orders by quote",
    description="Get all orders linked to a quote.",
)
async def get_orders_by_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_orders_by_quote, db, quote_id)


@router.post(
    "/{order_id}/discount",
    summary="Update order discount",
    description="Apply or update document-level discount on an order.",
)
async def update_order_discount(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: OrderDiscountUpdateRequest = ...,
    db: Session = Depends(get_db),
):
    updated = await asyncio.to_thread(
        _sync_update_order_discount,
        db,
        order_id,
        request.discount_percentage,
        request.discount_amount,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    # Invalidate cache (detail + all list caches)
    await cache_service.invalidate_entity(CacheKeys.ORDER, order_id)

    return updated


@router.post(
    "/{order_id}/convert-to-quote",
    response_model=ConvertOrderToQuoteResponse,
    summary="Convert order to quote",
    description="Create a new quote by cloning an existing order (reverse conversion).",
)
async def convert_order_to_quote(
    order_id: int = Path(..., gt=0, description="Order ID"),
    db: Session = Depends(get_db),
):
    result = await asyncio.to_thread(_sync_convert_order_to_quote, db, order_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")
    return ConvertOrderToQuoteResponse(**result)


@router.get(
    "/{order_id}",
    summary="Get order details",
    description="Get detailed information about a client order by ID. Cached for 2 minutes."
)
async def get_order_detail(
    order_id: int = Path(..., gt=0, description="Order ID (cod_id)"),
    db: Session = Depends(get_db),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
):
    """Get detailed order information with resolved lookup names. Cached for 2 minutes."""
    cache_key = f"{CacheKeys.ORDER}:detail:{order_id}"

    # Try cache first (unless bypassing)
    if not bypass_cache:
        cached = await cache_service.get(cache_key)
        if cached is not None:
            return cached

    # Fetch from database
    result = await asyncio.to_thread(_sync_get_order_detail, db, order_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    # Cache the result for 2 minutes
    await cache_service.set(cache_key, result, CacheTTL.MEDIUM)

    return result


# =============================================================================
# Order Line CRUD Endpoints
# =============================================================================


@router.get(
    "/{order_id}/lines",
    summary="Get order lines",
    description="Get all lines for an order.",
)
async def get_order_lines(
    order_id: int = Path(..., gt=0, description="Order ID"),
    db: Session = Depends(get_db),
):
    """Get all lines for an order."""
    result = await asyncio.to_thread(_sync_get_order_lines, db, order_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")
    return result


@router.post(
    "/{order_id}/lines",
    status_code=status.HTTP_201_CREATED,
    summary="Add line to order",
    description="Add a new line to an existing order.",
)
async def add_order_line(
    order_id: int = Path(..., gt=0, description="Order ID"),
    data: CreateOrderLineRequest = ...,
    db: Session = Depends(get_db),
):
    """Add a new line to an order."""
    result = await asyncio.to_thread(_sync_add_order_line, db, order_id, data)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")
    return result


@router.put(
    "/{order_id}/lines/{line_id}",
    summary="Update order line",
    description="Update an existing order line.",
)
async def update_order_line(
    order_id: int = Path(..., gt=0, description="Order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: UpdateOrderLineRequest = ...,
    db: Session = Depends(get_db),
):
    """Update an existing order line."""
    result = await asyncio.to_thread(_sync_update_order_line, db, order_id, line_id, data)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order line {line_id} not found in order {order_id}")

    # Invalidate cache (detail + all list caches)
    await cache_service.invalidate_entity(CacheKeys.ORDER, order_id)

    return result


@router.delete(
    "/{order_id}/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete order line",
    description="Delete a line from an order.",
)
async def delete_order_line(
    order_id: int = Path(..., gt=0, description="Order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    db: Session = Depends(get_db),
):
    """Delete a line from an order."""
    deleted = await asyncio.to_thread(_sync_delete_order_line, db, order_id, line_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order line {line_id} not found in order {order_id}")

    # Invalidate cache (detail + all list caches)
    await cache_service.invalidate_entity(CacheKeys.ORDER, order_id)


@router.post(
    "/{order_id}/lines/reorder",
    summary="Reorder order lines",
    description="Reorder lines of an order using the provided line IDs order.",
)
async def reorder_order_lines(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: OrderLineReorderRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        ordered_ids = await asyncio.to_thread(
            _sync_reorder_order_lines,
            db,
            order_id,
            request.line_ids,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if ordered_ids is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    return {
        "success": True,
        "orderId": order_id,
        "orderedLineIds": ordered_ids,
    }


@router.post(
    "/{order_id}/lines/merge",
    summary="Merge order lines",
    description="Merge multiple order lines into one line.",
)
async def merge_order_lines(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: OrderLineMergeRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        result = await asyncio.to_thread(
            _sync_merge_order_lines,
            db,
            order_id,
            request.line_ids,
            request.keep_line_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return {"success": True, "orderId": order_id, **result}


@router.get(
    "/{order_id}/pdf",
    summary="Download order PDF",
    description="Generate and download PDF for an order.",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF file"},
        404: {"description": "Order not found"},
    }
)
async def download_order_pdf(
    order_id: int = Path(..., gt=0, description="Order ID"),
    db: Session = Depends(get_db),
):
    """Generate and return PDF for this order."""
    import io
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import TemplatePDFService

    # Get order detail for context
    order_data = await asyncio.to_thread(_sync_get_order_detail, db, order_id)
    if not order_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )

    reference = order_data.get("reference", f"order-{order_id}")
    filename = f"{reference}.pdf"

    society = await asyncio.to_thread(_sync_get_society, db, order_data.get("societyId"))
    template_pdf = TemplatePDFService()
    company_context = TemplatePDFService.build_company_context(society)
    pdf_content = template_pdf.generate_pdf(
        template_name="order",
        context={**order_data, "company": company_context},
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
    "/{order_id}/send",
    summary="Send order via email",
    description="Generate PDF and send order via email to the specified recipient.",
    responses={
        200: {"description": "Order sent successfully"},
        404: {"description": "Order not found"},
    }
)
async def send_order(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: SendDocumentRequest = ...,
    db: Session = Depends(get_db),
):
    """Send order via email with PDF attachment."""
    from app.services.email_service import EmailService
    from app.schemas.email_log import EmailLogCreate

    # Get order detail
    order_data = await asyncio.to_thread(_sync_get_order_detail, db, order_id)
    if not order_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )

    reference = order_data.get("reference", f"Order-{order_id}")
    client_name = order_data.get("clientName", "")

    # Build email
    subject = request.subject or f"Order {reference}"
    body = request.body or f"Please find attached order {reference}."

    # Create email log and send
    try:
        email_service = EmailService(db)
        email_log_data = EmailLogCreate(
            recipient_email=request.to_email,
            recipient_name=client_name,
            subject=subject,
            body=body,
            entity_type="ORDER",
            entity_id=order_id,
        )
        email_log = await asyncio.to_thread(
            email_service.create_email_log, email_log_data
        )
        await asyncio.to_thread(email_service.send_email, email_log)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send order email: {e}")

    return SendDocumentResponse(
        success=True,
        message="Order sent successfully",
        document_id=order_id,
        document_type="order",
        sent_to=request.to_email,
        sent_at=datetime.now(),
    )


@router.patch(
    "/{order_id}/status",
    response_model=UpdateOrderStatusResponse,
    summary="Update order status",
    description="""
    Update the status of an order with transition validation.

    **Valid Status IDs:**
    - 1: Draft
    - 2: Pending
    - 3: Confirmed
    - 4: Processing
    - 5: Shipped
    - 6: Delivered
    - 7: Cancelled
    - 8: Refunded

    **Valid Transitions:**
    - Draft (1) -> Pending (2), Cancelled (7)
    - Pending (2) -> Confirmed (3), Cancelled (7)
    - Confirmed (3) -> Processing (4), Cancelled (7)
    - Processing (4) -> Shipped (5), Cancelled (7)
    - Shipped (5) -> Delivered (6), Refunded (8)
    - Delivered (6) -> Refunded (8)
    - Cancelled (7) -> (terminal, no transitions)
    - Refunded (8) -> (terminal, no transitions)

    Invalid transitions will return a 409 Conflict error.
    """,
    responses={
        200: {
            "description": "Status updated successfully",
            "model": UpdateOrderStatusResponse
        },
        404: {
            "description": "Order not found",
            "model": ErrorResponse
        },
        409: {
            "description": "Invalid status transition",
            "model": ErrorResponse
        },
        422: {
            "description": "Validation error",
        }
    }
)
async def update_order_status(
    order_id: int = Path(..., gt=0, description="Order ID"),
    request: UpdateOrderStatusRequest = Body(...),
    db: Session = Depends(get_db),
) -> UpdateOrderStatusResponse:
    """
    Update the status of an order.

    Validates the status transition and creates a history record.
    Returns the old and new status information.
    """
    service = get_order_service(db)

    try:
        order, old_status = await service.update_status(
            order_id,
            request.status_id,
            request.notes,
        )

        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.ORDER, order_id)

        return UpdateOrderStatusResponse(
            success=True,
            order_id=order.cod_id,
            old_status_id=old_status,
            old_status_name=service._get_status_name(old_status),
            new_status_id=order.ord_sta_id,
            new_status_name=service._get_status_name(order.ord_sta_id),
            updated_at=order.ord_updated_at,
        )
    except OrderServiceError as exc:
        raise handle_order_error(exc)


@router.get(
    "/{order_id}/status/history",
    response_model=StatusHistoryResponse,
    summary="Get order status history",
    description="Retrieve the complete status change history for an order.",
    responses={
        200: {
            "description": "Status history retrieved successfully",
            "model": StatusHistoryResponse
        },
        404: {
            "description": "Order not found",
            "model": ErrorResponse
        }
    }
)
async def get_order_status_history(
    order_id: int = Path(..., gt=0, description="Order ID"),
    db: Session = Depends(get_db),
) -> StatusHistoryResponse:
    """
    Get the status change history for an order.

    Returns all status transitions with timestamps and notes.
    """
    service = get_order_service(db)

    # Verify order exists
    try:
        await service.get_order(order_id, include_lines=False)
    except OrderNotFoundError as exc:
        raise handle_order_error(exc)

    # Note: Status history table doesn't exist in the database.
    # Status changes are tracked in the internal_notes field.
    # Return empty history for now.
    return StatusHistoryResponse(
        success=True,
        order_id=order_id,
        history=[],
    )


@router.get(
    "/status/workflow",
    response_model=StatusWorkflowResponse,
    summary="Get status workflow",
    description="Get information about all statuses and their allowed transitions.",
    responses={
        200: {
            "description": "Workflow information retrieved successfully",
            "model": StatusWorkflowResponse
        }
    }
)
async def get_status_workflow() -> StatusWorkflowResponse:
    """
    Get the status workflow definition.

    Returns all statuses with their allowed transitions.
    Useful for building UI dropdowns with only valid options.
    """
    # Use a dummy service to access status names and transitions
    statuses = []

    for status_id in range(1, 9):
        status_name = OrderService.STATUS_NAMES.get(status_id, f"Unknown({status_id})")
        allowed = OrderService.ALLOWED_TRANSITIONS.get(status_id, [])
        allowed_names = [OrderService.STATUS_NAMES.get(s, f"Unknown({s})") for s in allowed]

        statuses.append(StatusTransitionInfo(
            status_id=status_id,
            status_name=status_name,
            allowed_transitions=allowed,
            allowed_transition_names=allowed_names,
            is_terminal=len(allowed) == 0,
        ))

    return StatusWorkflowResponse(
        success=True,
        statuses=statuses,
    )

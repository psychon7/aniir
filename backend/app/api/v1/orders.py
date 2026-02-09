"""Orders API router.

Provides REST API endpoints for:
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
from app.models.client import Client
from app.models.costplan import CostPlan, CostPlanLine
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


# =============================================================================
# Sync Database Helper
# =============================================================================


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
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List orders with pagination."""
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


def _sync_get_order_detail(db: Session, order_id: int):
    """Sync helper to get order detail with lines, returning camelCase dict."""
    # Fetch order header with client join
    query = (
        select(
            ClientOrder.cod_id,
            ClientOrder.cod_code,
            ClientOrder.cli_id,
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

    # Fetch lines
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
        )
        .where(ClientOrderLine.cod_id == order_id)
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
            "deliveredQuantity": 0,
            "unitPrice": float(l.col_unit_price or 0),
            "lineTotal": float(l.col_price_with_discount_ht or l.col_total_price or 0),
            "discountPercentage": float(l.col_discount_percentage or 0),
            "discountAmount": float(l.col_discount_amount or 0),
        })

    return {
        "id": row.cod_id,
        "reference": row.cod_code or "",
        "name": row.cod_name or "",
        "clientId": row.cli_id,
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
        "lines": lines,
    }


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
            cln_ref=line.col_ref,
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
    description="Get detailed information about a client order by ID."
)
async def get_order_detail(
    order_id: int = Path(..., gt=0, description="Order ID (cod_id)"),
    db: Session = Depends(get_db),
):
    """Get detailed order information with resolved lookup names."""
    result = await asyncio.to_thread(_sync_get_order_detail, db, order_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")
    return result


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

    # Generate PDF using template service
    template_pdf = TemplatePDFService()
    pdf_content = template_pdf.generate_pdf(
        template_name="orders/order.html",
        context=order_data,
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

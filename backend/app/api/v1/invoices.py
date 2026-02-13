"""
Invoice API Router.

Provides REST API endpoints for:
- Invoice CRUD operations
- Invoice line management
- Invoice actions (send, void, cancel)
- Payment recording
- Invoice statistics
- Invoice PDF preview/generation
"""
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional, List, Any
from pathlib import Path as FilePath
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, Field

from app.database import get_db
from app.dependencies import get_current_user
from app.services.cache_service import cache_service, CacheTTL, CacheKeys
from app.models.invoice import ClientInvoice
from app.models.client_invoice_line import ClientInvoiceLine
from app.models.client import Client
from app.models.currency import Currency
from app.models.order import ClientOrder, ClientOrderLine
from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.models.society import Society
from app.services.invoice_service import (
    InvoiceService,
    get_invoice_service,
    InvoiceServiceError,
    InvoiceNotFoundError,
    InvoiceLineNotFoundError,
    InvoiceValidationError,
    InvoiceStatusError,
    OrderNotFoundForInvoiceError,
    OrderConversionError
)
from app.schemas.invoice import (
    # Invoice schemas
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceDetailResponse,
    InvoiceSearchParams, InvoiceListResponse, InvoiceStatus,
    # Invoice line schemas
    InvoiceLineCreate, InvoiceLineUpdate, InvoiceLineResponse,
    # Action schemas
    SendInvoiceRequest, SendInvoiceResponse,
    VoidInvoiceRequest, VoidInvoiceResponse,
    RecordPaymentRequest, RecordPaymentResponse,
    GeneratePdfResponse,
    # Statistics
    InvoiceStatistics, InvoiceStatisticsResponse,
    # Response schemas
    InvoiceAPIResponse, InvoiceErrorResponse,
    # Create from order schemas
    CreateInvoiceFromOrderRequest, CreateInvoiceFromOrderResponse,
    # Credit note schemas
    CreditNoteResponse,
)
from app.utils.row_level import apply_commercial_filter

router = APIRouter(prefix="/invoices", tags=["Invoices"])


# ==========================================================================
# Paginated Response Schema
# ==========================================================================


class InvoiceListPaginatedResponse(BaseModel):
    """Paginated response for invoice list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[InvoiceResponse] = Field(default_factory=list, description="List of invoices")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of invoices")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


class InvoiceDiscountUpdateRequest(BaseModel):
    """Document-level discount update payload (supports snake_case and camelCase)."""
    model_config = {"populate_by_name": True}

    discount_percentage: Optional[Decimal] = Field(default=None, ge=0, le=100, alias="discountPercentage")
    discount_amount: Optional[Decimal] = Field(default=None, ge=0, alias="discountAmount")


class CreateInvoiceFromDeliveriesRequest(BaseModel):
    """Bulk delivery-to-invoice payload."""
    delivery_ids: Optional[List[int]] = Field(default=None, description="Optional list of delivery IDs")
    include_all_lines: bool = Field(default=True, alias="includeAllLines")


class DeliveryInvoiceItemResponse(BaseModel):
    """Single delivery->invoice creation result."""
    delivery_id: int
    invoice_id: int
    invoice_reference: str
    already_exists: bool = False


class DeliveryInvoiceBulkResponse(BaseModel):
    """Bulk delivery->invoice creation response."""
    success: bool = True
    created: List[DeliveryInvoiceItemResponse] = Field(default_factory=list)
    skipped: List[dict] = Field(default_factory=list)


class InvoiceLineReorderRequest(BaseModel):
    """Reorder invoice lines by providing line IDs in the desired order."""
    model_config = {"populate_by_name": True}

    line_ids: List[int] = Field(default_factory=list, alias="lineIds")


class InvoiceLineMergeRequest(BaseModel):
    """Merge multiple invoice lines into one line."""
    model_config = {"populate_by_name": True}

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


def _sync_get_society_pricing_coefficient(db: Session, soc_id: Optional[int]) -> Decimal:
    """Read configurable SO->Invoice pricing coefficient from society settings."""
    if not soc_id:
        return Decimal("1")

    coefficient = db.execute(
        select(Society.soc_pricing_coefficient_sod_cin).where(Society.soc_id == soc_id)
    ).scalar()
    value = _decimal_or_zero(coefficient)
    return value if value > 0 else Decimal("1")


def _sync_list_invoices(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    project_id: Optional[int] = None,
    order_id: Optional[int] = None,
    sort_by: str = "cin_d_creation",
    sort_order: str = "desc",
    current_user: Optional[Any] = None,
):
    """Sync function to list invoices with pagination, joining Client and Currency."""
    # Pre-aggregated subquery for totalAmount (runs once, not per-row)
    line_totals = (
        select(
            ClientInvoiceLine.cin_id,
            func.coalesce(func.sum(ClientInvoiceLine.cii_price_with_discount_ht), 0).label("total_amount"),
        )
        .group_by(ClientInvoiceLine.cin_id)
        .subquery()
    )

    query = (
        select(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cli_id,
            ClientInvoice.cod_id,
            ClientInvoice.cin_d_creation,
            ClientInvoice.cin_d_update,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            ClientInvoice.cin_discount_percentage,
            ClientInvoice.cin_discount_amount,
            ClientInvoice.cur_id,
            ClientInvoice.soc_id,
            ClientInvoice.cin_name,
            Client.cli_company_name,
            Currency.cur_designation.label("currency_code"),
            func.coalesce(line_totals.c.total_amount, 0).label("total_amount"),
        )
        .outerjoin(Client, ClientInvoice.cli_id == Client.cli_id)
        .outerjoin(Currency, ClientInvoice.cur_id == Currency.cur_id)
        .outerjoin(line_totals, ClientInvoice.cin_id == line_totals.c.cin_id)
    )
    count_query = select(func.count(ClientInvoice.cin_id))

    conditions = []

    if search:
        search_term = f"%{search}%"
        conditions.append(ClientInvoice.cin_code.ilike(search_term))

    if client_id:
        conditions.append(ClientInvoice.cli_id == client_id)

    if project_id:
        conditions.append(ClientInvoice.prj_id == project_id)

    if order_id:
        conditions.append(ClientInvoice.cod_id == order_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Row-level security for non-admin users (commercial hierarchy).
    query = apply_commercial_filter(
        query,
        ClientInvoice,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )
    count_query = apply_commercial_filter(
        count_query,
        ClientInvoice,
        current_user,
        ("usr_com_1", "usr_com_2", "usr_com_3", "usr_creator_id"),
    )

    # Get total count
    total_result = db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(ClientInvoice, sort_by, ClientInvoice.cin_d_creation)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    result = db.execute(query)
    rows = list(result.all())

    return rows, total


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_invoice_error(error: InvoiceServiceError) -> HTTPException:
    """Convert InvoiceServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, InvoiceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, InvoiceLineNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, OrderNotFoundForInvoiceError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, InvoiceValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, InvoiceStatusError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(error, OrderConversionError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

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
# Currency designation to ISO 4217 code mapping
# ==========================================================================

_CURRENCY_ISO_MAP = {
    "EURO": "EUR",
    "DOLLAR": "USD",
    "DIRHAM": "MAD",
    "LIVRE": "GBP",
    "FRANC": "CHF",
    "YEN": "JPY",
    "YUAN": "CNY",
    "ROUPIE": "INR",
    "REAL": "BRL",
    "COURONNE": "SEK",
    "DINAR": "TND",
    "RAND": "ZAR",
    "DOLLAR CANADIEN": "CAD",
    "DOLLAR AUSTRALIEN": "AUD",
}


def _to_iso_currency(designation: Optional[str]) -> str:
    """Convert currency designation (e.g. 'EURO') to ISO 4217 code (e.g. 'EUR')."""
    if not designation:
        return "EUR"
    upper = designation.strip().upper()
    # Check if it's already a valid 3-letter code
    if len(upper) == 3 and upper.isalpha():
        return upper
    return _CURRENCY_ISO_MAP.get(upper, "EUR")


def _derive_invoice_status_name(row: Any) -> str:
    """Derive a frontend-friendly invoice status from invoice flags."""
    if getattr(row, "cin_is_full_paid", False):
        return "Paid"
    if getattr(row, "cin_invoiced", False):
        return "Sent"
    if getattr(row, "cin_isinvoice", True):
        return "Draft"
    return "Credit Note"


def _generate_invoice_code(db: Session) -> str:
    """Generate a deterministic invoice code using max invoice ID."""
    year = datetime.utcnow().year
    max_id = db.execute(select(func.max(ClientInvoice.cin_id))).scalar() or 0
    return f"CIN-{year}-{int(max_id) + 1:05d}"


def _sync_get_invoices_by_project(db: Session, project_id: int):
    """Sync helper to get invoices by project."""
    rows = db.execute(
        select(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cli_id,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_name,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            Client.cli_company_name,
            Currency.cur_designation.label("currency_code"),
            func.coalesce(func.sum(ClientInvoiceLine.cii_price_with_discount_ht), 0).label("total_amount"),
        )
        .outerjoin(Client, ClientInvoice.cli_id == Client.cli_id)
        .outerjoin(Currency, ClientInvoice.cur_id == Currency.cur_id)
        .outerjoin(ClientInvoiceLine, ClientInvoice.cin_id == ClientInvoiceLine.cin_id)
        .where(ClientInvoice.prj_id == project_id)
        .group_by(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cli_id,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_name,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            Client.cli_company_name,
            Currency.cur_designation,
            ClientInvoice.cin_d_creation,
        )
        .order_by(desc(ClientInvoice.cin_d_creation))
    ).all()

    items = []
    for row in rows:
        total_amount = float(row.total_amount or 0)
        paid_amount = (
            float(total_amount - (row.cin_rest_to_pay or 0))
            if row.cin_rest_to_pay is not None
            else 0.0
        )
        items.append(
            {
                "id": row.cin_id,
                "reference": row.cin_code or "",
                "clientId": row.cli_id,
                "clientName": row.cli_company_name or "",
                "invoiceDate": row.cin_d_invoice.isoformat() if row.cin_d_invoice else None,
                "dueDate": row.cin_d_term.isoformat() if row.cin_d_term else None,
                "totalAmount": total_amount,
                "paidAmount": paid_amount,
                "currency": _to_iso_currency(row.currency_code),
                "statusName": _derive_invoice_status_name(row),
                "name": row.cin_name or "",
            }
        )
    return items


def _sync_get_invoices_by_quote(db: Session, quote_id: int):
    """Sync helper to get invoices linked to a quote through orders."""
    rows = db.execute(
        select(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cli_id,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_name,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            Client.cli_company_name,
            Currency.cur_designation.label("currency_code"),
            func.coalesce(func.sum(ClientInvoiceLine.cii_price_with_discount_ht), 0).label("total_amount"),
        )
        .join(ClientOrder, ClientInvoice.cod_id == ClientOrder.cod_id)
        .outerjoin(Client, ClientInvoice.cli_id == Client.cli_id)
        .outerjoin(Currency, ClientInvoice.cur_id == Currency.cur_id)
        .outerjoin(ClientInvoiceLine, ClientInvoice.cin_id == ClientInvoiceLine.cin_id)
        .where(ClientOrder.cpl_id == quote_id)
        .group_by(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cli_id,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_name,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            Client.cli_company_name,
            Currency.cur_designation,
            ClientInvoice.cin_d_creation,
        )
        .order_by(desc(ClientInvoice.cin_d_creation))
    ).all()

    items = []
    for row in rows:
        total_amount = float(row.total_amount or 0)
        paid_amount = (
            float(total_amount - (row.cin_rest_to_pay or 0))
            if row.cin_rest_to_pay is not None
            else 0.0
        )
        items.append(
            {
                "id": row.cin_id,
                "reference": row.cin_code or "",
                "clientId": row.cli_id,
                "clientName": row.cli_company_name or "",
                "invoiceDate": row.cin_d_invoice.isoformat() if row.cin_d_invoice else None,
                "dueDate": row.cin_d_term.isoformat() if row.cin_d_term else None,
                "totalAmount": total_amount,
                "paidAmount": paid_amount,
                "currency": _to_iso_currency(row.currency_code),
                "statusName": _derive_invoice_status_name(row),
                "name": row.cin_name or "",
            }
        )
    return items


def _sync_update_invoice_discount(
    db: Session,
    invoice_id: int,
    discount_percentage: Optional[Decimal],
    discount_amount: Optional[Decimal],
):
    """Sync helper to update document-level invoice discount."""
    invoice = db.get(ClientInvoice, invoice_id)
    if not invoice:
        return None

    subtotal = Decimal(
        str(
            db.execute(
                select(func.coalesce(func.sum(ClientInvoiceLine.cii_price_with_discount_ht), 0)).where(
                    ClientInvoiceLine.cin_id == invoice_id
                )
            ).scalar()
            or 0
        )
    )

    old_discount = Decimal(str(invoice.cin_discount_amount or 0))
    old_total = subtotal - old_discount
    old_rest = Decimal(str(invoice.cin_rest_to_pay or 0))
    already_paid = Decimal("0") if old_rest > old_total else old_total - old_rest

    if discount_percentage is not None:
        invoice.cin_discount_percentage = discount_percentage
    if discount_amount is not None:
        invoice.cin_discount_amount = discount_amount
    elif discount_percentage is not None:
        invoice.cin_discount_amount = (subtotal * discount_percentage) / Decimal("100")

    new_discount = Decimal(str(invoice.cin_discount_amount or 0))
    new_total = subtotal - new_discount
    if invoice.cin_is_full_paid:
        invoice.cin_rest_to_pay = Decimal("0")
    else:
        remaining = new_total - already_paid
        invoice.cin_rest_to_pay = remaining if remaining > 0 else Decimal("0")

    invoice.cin_d_update = datetime.utcnow()
    db.commit()
    return _sync_get_invoice_detail(db, invoice_id)


def _sync_create_invoice_from_delivery(db: Session, delivery_id: int):
    """
    Sync helper to create an invoice from a delivery note.

    Idempotent: returns existing invoice if one already exists for the delivery.
    """
    existing = db.execute(
        select(ClientInvoice.cin_id, ClientInvoice.cin_code).where(ClientInvoice.dfo_id == delivery_id)
    ).first()
    if existing:
        return {
            "delivery_id": delivery_id,
            "invoice_id": existing.cin_id,
            "invoice_reference": existing.cin_code,
            "already_exists": True,
        }

    delivery = db.get(DeliveryForm, delivery_id)
    if not delivery:
        return None

    order = db.get(ClientOrder, delivery.cod_id) if delivery.cod_id else None
    client = db.get(Client, delivery.cli_id) if delivery.cli_id else None

    now = datetime.utcnow()
    invoice_date = delivery.dfo_d_delivery or now
    due_date = invoice_date + timedelta(days=30)

    invoice = ClientInvoice(
        cin_code=_generate_invoice_code(db),
        cin_name=(order.cod_name if order else f"Invoice from delivery {delivery.dfo_code}")[:1000],
        cli_id=delivery.cli_id,
        cod_id=delivery.cod_id,
        cin_d_creation=now,
        cin_d_update=now,
        cin_d_invoice=invoice_date,
        usr_creator_id=(delivery.usr_creator_id or (order.usr_creator_id if order else 1)),
        cin_header_text=(order.cod_header_text if order else None),
        cin_footer_text=(order.cod_footer_text if order else None),
        cur_id=((client.cur_id if client else None) or 1),
        cin_account=False,
        cin_d_term=due_date,
        pco_id=((order.pco_id if order else None) or (client.pco_id if client else None) or 1),
        pmo_id=((order.pmo_id if order else None) or (client.pmo_id if client else None) or 1),
        cco_id_invoicing=(order.cco_id_invoicing if order else None),
        cin_isinvoice=True,
        vat_id=((order.vat_id if order else None) or (client.vat_id if client else None) or 1),
        prj_id=(order.prj_id if order else None),
        dfo_id=delivery_id,
        soc_id=(delivery.soc_id or (order.soc_id if order else None) or (client.soc_id if client else None) or 1),
        cin_invoiced=False,
        cin_is_full_paid=False,
        cin_discount_percentage=Decimal("0"),
        cin_discount_amount=Decimal("0"),
        cin_rest_to_pay=Decimal("0"),
        cin_inv_cco_firstname=delivery.dfo_dlv_cco_firstname,
        cin_inv_cco_lastname=delivery.dfo_dlv_cco_lastname,
        cin_inv_cco_address1=delivery.dfo_dlv_cco_address1,
        cin_inv_cco_address2=delivery.dfo_dlv_cco_address2,
        cin_inv_cco_postcode=delivery.dfo_dlv_cco_postcode,
        cin_inv_cco_city=delivery.dfo_dlv_cco_city,
        cin_inv_cco_country=delivery.dfo_dlv_cco_country,
        cin_inv_cco_tel1=delivery.dfo_dlv_cco_tel1,
        cin_inv_cco_fax=delivery.dfo_dlv_cco_fax,
        cin_inv_cco_cellphone=delivery.dfo_dlv_cco_cellphone,
        cin_inv_cco_email=delivery.dfo_dlv_cco_email,
        usr_com_1=(order.usr_com_1 if order else None),
        usr_com_2=(order.usr_com_2 if order else None),
        usr_com_3=(order.usr_com_3 if order else None),
    )
    db.add(invoice)
    db.flush()

    delivery_lines = db.execute(
        select(DeliveryFormLine).where(DeliveryFormLine.dfo_id == delivery_id)
    ).scalars().all()

    pricing_coefficient = _sync_get_society_pricing_coefficient(db, invoice.soc_id)
    total_ht = Decimal("0")
    for d_line in delivery_lines:
        order_line = None
        if d_line.col_id:
            order_line = db.get(ClientOrderLine, d_line.col_id)

        quantity = _decimal_or_zero(d_line.dfl_quantity or (order_line.col_quantity if order_line else 0))
        purchase_price = _decimal_or_zero(order_line.col_purchase_price if order_line else 0)
        unit_price = _decimal_or_zero(
            order_line.col_unit_price if order_line and order_line.col_unit_price is not None else 0
        )
        if order_line and purchase_price > 0 and (unit_price <= 0 or unit_price == purchase_price):
            unit_price = (purchase_price * pricing_coefficient).quantize(Decimal("0.0001"))

        line_total = quantity * unit_price
        discount_pct = _decimal_or_zero(
            order_line.col_discount_percentage if order_line and order_line.col_discount_percentage is not None else 0
        )
        discount_amt = _decimal_or_zero(
            order_line.col_discount_amount if order_line and order_line.col_discount_amount is not None else 0
        )
        if discount_amt == 0 and discount_pct > 0 and line_total > 0:
            discount_amt = (line_total * discount_pct) / Decimal("100")
        discounted_total = line_total - discount_amt

        invoice_line = ClientInvoiceLine(
            cin_id=invoice.cin_id,
            cii_level1=(order_line.col_level1 if order_line else None),
            cii_level2=(order_line.col_level2 if order_line else None),
            cii_description=(d_line.dfl_description or (order_line.col_description if order_line else None)),
            prd_id=(order_line.prd_id if order_line else None),
            cii_ref=(order_line.col_ref if order_line else None),
            cii_unit_price=unit_price,
            cii_quantity=quantity,
            cii_total_price=line_total,
            vat_id=((order_line.vat_id if order_line else None) or (order.vat_id if order else None)),
            dfl_id=d_line.dfl_id,
            cii_purchase_price=(purchase_price if purchase_price > 0 else None),
            cii_total_crude_price=(order_line.col_total_crude_price if order_line else None),
            cii_prd_name=(order_line.col_prd_name if order_line else None),
            cii_discount_percentage=discount_pct,
            cii_discount_amount=discount_amt,
            cii_price_with_discount_ht=discounted_total,
            cii_margin=(order_line.col_margin if order_line else None),
            pit_id=(order_line.pit_id if order_line else None),
            ltp_id=((order_line.ltp_id if order_line else None) or 1),
            cii_prd_des=(order_line.col_prd_des if order_line else None),
            col_id=(order_line.col_id if order_line else d_line.col_id),
        )
        db.add(invoice_line)
        total_ht += discounted_total

    invoice.cin_rest_to_pay = total_ht
    db.commit()

    return {
        "delivery_id": delivery_id,
        "invoice_id": invoice.cin_id,
        "invoice_reference": invoice.cin_code,
        "already_exists": False,
    }


def _sync_create_invoice_from_order(
    db: Session,
    order_id: int,
    request: Optional[CreateInvoiceFromOrderRequest],
):
    """Sync helper to create an invoice from an order."""
    order = db.get(ClientOrder, order_id)
    if not order:
        return None

    order_lines = db.execute(
        select(ClientOrderLine)
        .where(ClientOrderLine.cod_id == order_id)
        .order_by(func.coalesce(ClientOrderLine.col_level1, 999999), ClientOrderLine.col_id)
    ).scalars().all()

    if not order_lines:
        raise ValueError("Cannot create invoice from an order with no lines")

    client = db.get(Client, order.cli_id) if order.cli_id else None

    invoice_date = (request.invoice_date if request and request.invoice_date else datetime.utcnow())
    due_date = (request.due_date if request and request.due_date else invoice_date + timedelta(days=30))

    invoice = ClientInvoice(
        cin_code=_generate_invoice_code(db),
        cin_name=(order.cod_name or f"Invoice from order {order.cod_code}")[:1000],
        cli_id=order.cli_id,
        cod_id=order.cod_id,
        cin_d_creation=datetime.utcnow(),
        cin_d_update=datetime.utcnow(),
        cin_d_invoice=invoice_date,
        usr_creator_id=order.usr_creator_id or 1,
        cin_header_text=order.cod_header_text,
        cin_footer_text=order.cod_footer_text,
        cur_id=((client.cur_id if client else None) or 1),
        cin_account=False,
        cin_d_term=due_date,
        pco_id=order.pco_id or ((client.pco_id if client else None) or 1),
        pmo_id=order.pmo_id or ((client.pmo_id if client else None) or 1),
        cco_id_invoicing=order.cco_id_invoicing,
        cin_isinvoice=True,
        vat_id=order.vat_id or ((client.vat_id if client else None) or 1),
        prj_id=order.prj_id,
        soc_id=order.soc_id or ((client.soc_id if client else None) or 1),
        cin_invoiced=False,
        cin_is_full_paid=False,
        cin_discount_percentage=(order.cod_discount_percentage or Decimal("0")),
        cin_discount_amount=(order.cod_discount_amount or Decimal("0")),
        cin_rest_to_pay=Decimal("0"),
        cin_client_comment=(request.notes if request and request.notes else None),
        cin_inv_cco_firstname=order.cod_inv_cco_firstname,
        cin_inv_cco_lastname=order.cod_inv_cco_lastname,
        cin_inv_cco_address1=order.cod_inv_cco_address1,
        cin_inv_cco_address2=order.cod_inv_cco_address2,
        cin_inv_cco_postcode=order.cod_inv_cco_postcode,
        cin_inv_cco_city=order.cod_inv_cco_city,
        cin_inv_cco_country=order.cod_inv_cco_country,
        cin_inv_cco_tel1=order.cod_inv_cco_tel1,
        cin_inv_cco_fax=order.cod_inv_cco_fax,
        cin_inv_cco_cellphone=order.cod_inv_cco_cellphone,
        cin_inv_cco_email=order.cod_inv_cco_email,
        usr_com_1=order.usr_com_1,
        usr_com_2=order.usr_com_2,
        usr_com_3=order.usr_com_3,
    )
    db.add(invoice)
    db.flush()

    pricing_coefficient = _sync_get_society_pricing_coefficient(db, invoice.soc_id)
    total_ht = Decimal("0")

    for order_line in order_lines:
        quantity = _decimal_or_zero(order_line.col_quantity)
        purchase_price = _decimal_or_zero(order_line.col_purchase_price)
        unit_price = _decimal_or_zero(order_line.col_unit_price)
        if purchase_price > 0 and (unit_price <= 0 or unit_price == purchase_price):
            unit_price = (purchase_price * pricing_coefficient).quantize(Decimal("0.0001"))

        line_total = quantity * unit_price
        discount_pct = _decimal_or_zero(order_line.col_discount_percentage)
        discount_amt = _decimal_or_zero(order_line.col_discount_amount)
        if discount_amt == 0 and discount_pct > 0 and line_total > 0:
            discount_amt = (line_total * discount_pct) / Decimal("100")

        discounted_total = line_total - discount_amt

        invoice_line = ClientInvoiceLine(
            cin_id=invoice.cin_id,
            cii_level1=order_line.col_level1,
            cii_level2=order_line.col_level2,
            cii_description=order_line.col_description,
            prd_id=order_line.prd_id,
            cii_ref=order_line.col_ref,
            cii_unit_price=unit_price,
            cii_quantity=quantity,
            cii_total_price=line_total,
            vat_id=(order_line.vat_id or order.vat_id),
            cii_purchase_price=(purchase_price if purchase_price > 0 else None),
            cii_total_crude_price=order_line.col_total_crude_price,
            cii_prd_name=order_line.col_prd_name,
            cii_discount_percentage=discount_pct,
            cii_discount_amount=discount_amt,
            cii_price_with_discount_ht=discounted_total,
            cii_margin=order_line.col_margin,
            pit_id=order_line.pit_id,
            ltp_id=(order_line.ltp_id or 1),
            cii_prd_des=order_line.col_prd_des,
            cii_image_url=order_line.col_image_url,
            col_id=order_line.col_id,
        )
        db.add(invoice_line)
        total_ht += discounted_total

    invoice.cin_rest_to_pay = total_ht
    db.commit()
    db.refresh(invoice)
    return invoice


def _sync_create_invoices_from_deliveries(
    db: Session,
    delivery_ids: Optional[List[int]],
):
    """Sync helper to create invoices from many deliveries."""
    if delivery_ids:
        target_ids = [int(x) for x in delivery_ids if int(x) > 0]
    else:
        target_ids = list(
            db.execute(
                select(DeliveryForm.dfo_id)
                .outerjoin(ClientInvoice, ClientInvoice.dfo_id == DeliveryForm.dfo_id)
                .where(ClientInvoice.cin_id.is_(None))
                .order_by(desc(DeliveryForm.dfo_d_creation))
                .limit(200)
            ).scalars().all()
        )

    created: List[dict] = []
    skipped: List[dict] = []
    for d_id in target_ids:
        result = _sync_create_invoice_from_delivery(db, d_id)
        if result is None:
            skipped.append({"delivery_id": d_id, "reason": "Delivery not found"})
            continue
        created.append(result)

    return {"success": True, "created": created, "skipped": skipped}


# ==========================================================================
# Invoice CRUD Endpoints
# ==========================================================================


@router.get(
    "",
    summary="List invoices with pagination",
    description="Get a paginated list of invoices with optional filters."
)
async def list_invoices(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by invoice code"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    order_id: Optional[int] = Query(None, description="Filter by order ID"),
    sort_by: str = Query("cin_d_creation", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """List invoices with pagination. Cached until data changes."""
    # Build cache params (include user for row-level security)
    cache_params = {
        "page": page, "page_size": page_size, "search": search,
        "client_id": client_id, "project_id": project_id, "order_id": order_id,
        "sort_by": sort_by, "sort_order": sort_order,
        "user_id": current_user.usr_id if current_user else None
    }

    # Try cache first
    if not bypass_cache:
        cached = await cache_service.get_list(CacheKeys.INVOICE, cache_params)
        if cached is not None:
            return cached

    rows, total = await asyncio.to_thread(
        _sync_list_invoices,
        db,
        page,
        page_size,
        search,
        client_id,
        project_id,
        order_id,
        sort_by,
        sort_order,
        current_user,
    )

    # Build camelCase response matching frontend InvoiceListItem type
    items = []
    for row in rows:
        # Derive status from flags
        if row.cin_is_full_paid:
            status_name = "Paid"
        elif row.cin_invoiced:
            status_name = "Sent"
        elif row.cin_isinvoice:
            status_name = "Draft"
        else:
            status_name = "Credit Note"

        items.append({
            "id": row.cin_id,
            "reference": row.cin_code or "",
            "clientId": row.cli_id,
            "clientName": row.cli_company_name or "",
            "invoiceDate": row.cin_d_invoice.isoformat() if row.cin_d_invoice else None,
            "dueDate": row.cin_d_term.isoformat() if row.cin_d_term else None,
            "totalAmount": float(row.total_amount or 0),
            "paidAmount": float((row.total_amount or 0) - (row.cin_rest_to_pay or 0)) if row.cin_rest_to_pay is not None else 0,
            "currency": _to_iso_currency(row.currency_code),
            "statusName": status_name,
            "name": row.cin_name,
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

    # Cache the result (invalidated when any invoice changes)
    await cache_service.set_list(CacheKeys.INVOICE, cache_params, result)

    return result


@router.post(
    "",
    response_model=InvoiceDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new invoice",
    description="""
    Create a new invoice with optional line items.

    The invoice is created in DRAFT status. Line items can be included
    in the request or added separately using the line endpoints.

    Invoice reference is auto-generated if not provided.
    """
)
async def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    # current_user_id: int = Depends(get_current_user_id)  # TODO: Add auth
):
    """Create a new invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.create_invoice(data, created_by=None)  # TODO: current_user_id
        # Invalidate list caches (new record affects all lists)
        await cache_service.invalidate_entity_lists(CacheKeys.INVOICE)
        return invoice
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/from-order/{order_id}",
    response_model=CreateInvoiceFromOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create invoice from order",
    description="""
    Create a new invoice from an existing order.

    The invoice is created in DRAFT status with line items copied from the order.
    You can choose to include all order lines or select specific lines by their IDs.

    - If `include_all_lines` is true (default), all order lines are converted to invoice lines.
    - If `include_all_lines` is false, you must specify `line_ids` to select which lines to include.

    The invoice will be linked to the source order via `inv_ord_id`.
    """,
    responses={
        201: {"description": "Invoice created successfully"},
        404: {"model": InvoiceErrorResponse, "description": "Order not found"},
        422: {"model": InvoiceErrorResponse, "description": "Cannot create invoice from order"}
    }
)
async def create_invoice_from_order(
    order_id: int = Path(..., description="Order ID to create invoice from"),
    request: Optional[CreateInvoiceFromOrderRequest] = None,
    db: Session = Depends(get_db),
    # current_user_id: int = Depends(get_current_user_id)  # TODO: Add auth
):
    """Create an invoice from an existing order."""
    # Use default request if none provided
    if request is None:
        request = CreateInvoiceFromOrderRequest(order_id=order_id)

    try:
        invoice = await asyncio.to_thread(
            _sync_create_invoice_from_order,
            db,
            order_id,
            request,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")

    # Invalidate list caches (new record affects all lists)
    await cache_service.invalidate_entity_lists(CacheKeys.INVOICE)

    return CreateInvoiceFromOrderResponse(
        success=True,
        message=f"Invoice {invoice.cin_code} created successfully from order {order_id}",
        invoice=invoice,
    )


@router.get(
    "/search",
    response_model=InvoiceListResponse,
    summary="Search invoices",
    description="Search and filter invoices with pagination."
)
async def search_invoices(
    reference: Optional[str] = Query(None, description="Filter by reference (partial match)"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    order_id: Optional[int] = Query(None, description="Filter by order ID"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    date_from: Optional[date] = Query(None, description="Invoice date from"),
    date_to: Optional[date] = Query(None, description="Invoice date to"),
    due_date_from: Optional[date] = Query(None, description="Due date from"),
    due_date_to: Optional[date] = Query(None, description="Due date to"),
    is_overdue: Optional[bool] = Query(None, description="Filter overdue invoices"),
    is_paid: Optional[bool] = Query(None, description="Filter paid invoices"),
    min_amount: Optional[Decimal] = Query(None, ge=0, description="Minimum total amount"),
    max_amount: Optional[Decimal] = Query(None, ge=0, description="Maximum total amount"),
    currency_id: Optional[int] = Query(None, description="Filter by currency ID"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("inv_created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """Search invoices with filters and pagination."""
    service = get_invoice_service(db)

    params = InvoiceSearchParams(
        reference=reference,
        client_id=client_id,
        order_id=order_id,
        status_id=status_id,
        date_from=date_from,
        date_to=date_to,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        is_overdue=is_overdue,
        is_paid=is_paid,
        min_amount=min_amount,
        max_amount=max_amount,
        currency_id=currency_id,
        society_id=society_id,
        bu_id=bu_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )

    result = await service.search_invoices(params)
    return result


def _sync_get_invoice_detail(db: Session, invoice_id: int):
    """Sync helper to get invoice detail with lines, returning camelCase dict."""
    # Fetch invoice header with client + currency + order joins
    query = (
        select(
            ClientInvoice.cin_id,
            ClientInvoice.cin_code,
            ClientInvoice.cin_name,
            ClientInvoice.cli_id,
            ClientInvoice.cod_id,
            ClientInvoice.soc_id,
            ClientInvoice.cin_d_creation,
            ClientInvoice.cin_d_update,
            ClientInvoice.cin_d_invoice,
            ClientInvoice.cin_d_term,
            ClientInvoice.cin_d_encaissement,
            ClientInvoice.cin_isinvoice,
            ClientInvoice.cin_invoiced,
            ClientInvoice.cin_is_full_paid,
            ClientInvoice.cin_rest_to_pay,
            ClientInvoice.cin_discount_percentage,
            ClientInvoice.cin_discount_amount,
            ClientInvoice.cin_header_text,
            ClientInvoice.cin_footer_text,
            ClientInvoice.cco_id_invoicing,
            ClientInvoice.cin_inv_cco_firstname,
            ClientInvoice.cin_inv_cco_lastname,
            ClientInvoice.cin_inv_cco_address1,
            ClientInvoice.cin_inv_cco_address2,
            ClientInvoice.cin_inv_cco_postcode,
            ClientInvoice.cin_inv_cco_city,
            ClientInvoice.cin_inv_cco_country,
            ClientInvoice.cin_inv_cco_tel1,
            ClientInvoice.cin_inv_cco_fax,
            ClientInvoice.cin_inv_cco_cellphone,
            ClientInvoice.cin_inv_cco_email,
            ClientInvoice.cur_id,
            Client.cli_company_name,
            Currency.cur_designation.label("currency_code"),
            ClientOrder.cod_code.label("order_code"),
        )
        .outerjoin(Client, ClientInvoice.cli_id == Client.cli_id)
        .outerjoin(Currency, ClientInvoice.cur_id == Currency.cur_id)
        .outerjoin(ClientOrder, ClientInvoice.cod_id == ClientOrder.cod_id)
        .where(ClientInvoice.cin_id == invoice_id)
    )
    result = db.execute(query)
    row = result.first()
    if not row:
        return None

    # Fetch lines
    lines_query = (
        select(
            ClientInvoiceLine.cii_id,
            ClientInvoiceLine.cii_level1,
            ClientInvoiceLine.cii_prd_name,
            ClientInvoiceLine.cii_description,
            ClientInvoiceLine.cii_ref,
            ClientInvoiceLine.cii_quantity,
            ClientInvoiceLine.cii_unit_price,
            ClientInvoiceLine.cii_total_price,
            ClientInvoiceLine.cii_price_with_discount_ht,
            ClientInvoiceLine.cii_discount_percentage,
            ClientInvoiceLine.cii_discount_amount,
            ClientInvoiceLine.cii_image_url,
        )
        .where(ClientInvoiceLine.cin_id == invoice_id)
        .order_by(func.coalesce(ClientInvoiceLine.cii_level1, 999999), ClientInvoiceLine.cii_id)
    )
    lines_result = db.execute(lines_query)
    line_rows = lines_result.all()

    # Compute totals from lines
    subtotal = sum(float(l.cii_price_with_discount_ht or l.cii_total_price or 0) for l in line_rows)
    discount_amount = float(row.cin_discount_amount or 0)
    total_amount = subtotal - discount_amount
    rest_to_pay = float(row.cin_rest_to_pay or 0)
    paid_amount = total_amount - rest_to_pay if row.cin_rest_to_pay is not None else 0

    # Derive status
    if row.cin_is_full_paid:
        status_name = "Paid"
    elif row.cin_invoiced:
        status_name = "Sent"
    elif row.cin_isinvoice:
        status_name = "Draft"
    else:
        status_name = "Credit Note"

    # Build lines list
    lines = []
    for l in line_rows:
        lines.append({
            "id": l.cii_id,
            "productName": l.cii_prd_name or "",
            "description": l.cii_description or "",
            "productReference": l.cii_ref or "",
            "quantity": float(l.cii_quantity or 0),
            "unitPrice": float(l.cii_unit_price or 0),
            "vatRate": 0,
            "lineTotal": float(l.cii_price_with_discount_ht or l.cii_total_price or 0),
            "discountPercentage": float(l.cii_discount_percentage or 0),
            "discountAmount": float(l.cii_discount_amount or 0),
            "imageUrl": l.cii_image_url,
        })

    invoicing_snapshot = {
        "firstName": row.cin_inv_cco_firstname,
        "lastName": row.cin_inv_cco_lastname,
        "address1": row.cin_inv_cco_address1,
        "address2": row.cin_inv_cco_address2,
        "postcode": row.cin_inv_cco_postcode,
        "city": row.cin_inv_cco_city,
        "country": row.cin_inv_cco_country,
        "phone": row.cin_inv_cco_tel1,
        "fax": row.cin_inv_cco_fax,
        "mobile": row.cin_inv_cco_cellphone,
        "email": row.cin_inv_cco_email,
    }

    return {
        "id": row.cin_id,
        "reference": row.cin_code or "",
        "name": row.cin_name or "",
        "clientId": row.cli_id,
        "societyId": row.soc_id,
        "clientName": row.cli_company_name or "",
        "invoiceDate": row.cin_d_invoice.isoformat() if row.cin_d_invoice else None,
        "dueDate": row.cin_d_term.isoformat() if row.cin_d_term else None,
        "createdAt": row.cin_d_creation.isoformat() if row.cin_d_creation else None,
        "orderReference": row.order_code,
        "statusName": status_name,
        "currency": _to_iso_currency(row.currency_code),
        "subtotal": subtotal,
        "totalAmount": total_amount,
        "vatAmount": 0,
        "discountAmount": discount_amount,
        "discountPercentage": float(row.cin_discount_percentage or 0),
        "paidAmount": paid_amount,
        "paidAt": row.cin_d_encaissement.isoformat() if row.cin_d_encaissement else None,
        "paymentReference": None,
        "headerText": row.cin_header_text or "",
        "footerText": row.cin_footer_text or "",
        "invoicingContactId": row.cco_id_invoicing,
        "invoicingContactSnapshot": invoicing_snapshot,
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


def _sync_reorder_invoice_lines(
    db: Session,
    invoice_id: int,
    requested_line_ids: List[int],
):
    """Sync helper to reorder invoice lines."""
    lines = db.execute(
        select(ClientInvoiceLine).where(ClientInvoiceLine.cin_id == invoice_id)
    ).scalars().all()
    if not lines:
        return None

    unique_requested: List[int] = []
    for raw_id in requested_line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_requested:
            unique_requested.append(line_id)

    lines_by_id = {line.cii_id: line for line in lines}
    invalid_ids = [line_id for line_id in unique_requested if line_id not in lines_by_id]
    if invalid_ids:
        raise ValueError(f"Line IDs do not belong to invoice {invoice_id}: {invalid_ids}")

    current_order = sorted(
        lines,
        key=lambda line: (
            int(line.cii_level1) if line.cii_level1 is not None else 999999,
            int(line.cii_id),
        ),
    )
    final_order = unique_requested + [
        line.cii_id for line in current_order if line.cii_id not in unique_requested
    ]

    for index, line_id in enumerate(final_order, start=1):
        lines_by_id[line_id].cii_level1 = index

    db.commit()
    return final_order


def _sync_merge_invoice_lines(
    db: Session,
    invoice_id: int,
    line_ids: List[int],
    keep_line_id: Optional[int],
):
    """Sync helper to merge selected invoice lines."""
    unique_ids: List[int] = []
    for raw_id in line_ids:
        line_id = int(raw_id)
        if line_id > 0 and line_id not in unique_ids:
            unique_ids.append(line_id)

    if len(unique_ids) < 2:
        raise ValueError("At least 2 line IDs are required to merge")

    selected_lines = db.execute(
        select(ClientInvoiceLine).where(
            and_(
                ClientInvoiceLine.cin_id == invoice_id,
                ClientInvoiceLine.cii_id.in_(unique_ids),
            )
        )
    ).scalars().all()

    if len(selected_lines) != len(unique_ids):
        found_ids = {line.cii_id for line in selected_lines}
        missing = [line_id for line_id in unique_ids if line_id not in found_ids]
        raise ValueError(f"Line IDs do not belong to invoice {invoice_id}: {missing}")

    selected_by_id = {line.cii_id: line for line in selected_lines}
    primary_id = int(keep_line_id) if keep_line_id is not None else unique_ids[0]
    if primary_id not in selected_by_id:
        raise ValueError("keepLineId must be one of lineIds")

    primary_line = selected_by_id[primary_id]
    merged_lines = [selected_by_id[line_id] for line_id in unique_ids]
    lines_to_delete = [line for line in merged_lines if line.cii_id != primary_id]

    total_quantity = sum(_decimal_or_zero(line.cii_quantity) for line in merged_lines)
    total_price = sum(
        _decimal_or_zero(line.cii_total_price)
        if line.cii_total_price is not None
        else (_decimal_or_zero(line.cii_unit_price) * _decimal_or_zero(line.cii_quantity))
        for line in merged_lines
    )
    total_discount = sum(_decimal_or_zero(line.cii_discount_amount) for line in merged_lines)
    total_price_after_discount = sum(
        _decimal_or_zero(line.cii_price_with_discount_ht)
        if line.cii_price_with_discount_ht is not None
        else (_decimal_or_zero(line.cii_total_price) - _decimal_or_zero(line.cii_discount_amount))
        for line in merged_lines
    )
    total_crude = sum(_decimal_or_zero(line.cii_total_crude_price) for line in merged_lines)

    if total_price_after_discount == Decimal("0") and total_price > Decimal("0"):
        total_price_after_discount = total_price - total_discount

    primary_line.cii_quantity = total_quantity
    primary_line.cii_total_price = total_price
    primary_line.cii_discount_amount = total_discount
    primary_line.cii_price_with_discount_ht = total_price_after_discount
    if total_quantity > Decimal("0"):
        primary_line.cii_unit_price = total_price / total_quantity

    if total_crude > Decimal("0"):
        primary_line.cii_total_crude_price = total_crude
        primary_line.cii_margin = total_price_after_discount - total_crude

    if not primary_line.cii_description:
        primary_line.cii_description = "Merged line"

    for line in lines_to_delete:
        db.delete(line)

    db.commit()
    return {
        "primaryLineId": primary_id,
        "mergedLineIds": unique_ids,
        "removedLineIds": [line.cii_id for line in lines_to_delete],
    }


def _sync_get_invoice_inspection_payload(db: Session, invoice_id: int):
    """Build inspection form payload for an invoice."""
    invoice_data = _sync_get_invoice_detail(db, invoice_id)
    if not invoice_data:
        return None

    lines = invoice_data.get("lines") or []
    inspection_lines = [
        line for line in lines
        if (line.get("productName") or line.get("description") or line.get("productReference"))
    ]

    return {
        "available": bool(inspection_lines),
        "lineCount": len(inspection_lines),
        "reference": invoice_data.get("reference"),
        "clientName": invoice_data.get("clientName"),
        "invoiceDate": invoice_data.get("invoiceDate"),
        "societyId": invoice_data.get("societyId"),
        "lines": inspection_lines,
    }


@router.get(
    "/by-project/{project_id}",
    summary="Get invoices by project",
    description="Get all invoices linked to a project.",
)
async def get_invoices_by_project(
    project_id: int = Path(..., gt=0, description="Project ID"),
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_invoices_by_project, db, project_id)


@router.get(
    "/by-quote/{quote_id}",
    summary="Get invoices by quote",
    description="Get all invoices linked to a quote through orders.",
)
async def get_invoices_by_quote(
    quote_id: int = Path(..., gt=0, description="Quote ID"),
    db: Session = Depends(get_db),
):
    return await asyncio.to_thread(_sync_get_invoices_by_quote, db, quote_id)


@router.post(
    "/from-delivery/{delivery_id}",
    response_model=DeliveryInvoiceItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create invoice from a delivery",
    description="Create an invoice from a delivery note (idempotent).",
)
async def create_invoice_from_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery ID"),
    db: Session = Depends(get_db),
):
    result = await asyncio.to_thread(_sync_create_invoice_from_delivery, db, delivery_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Delivery {delivery_id} not found")
    return DeliveryInvoiceItemResponse(**result)


@router.post(
    "/from-deliveries",
    response_model=DeliveryInvoiceBulkResponse,
    summary="Create invoices from deliveries in bulk",
    description="Create invoices from selected deliveries or all uninvoiced deliveries.",
)
async def create_invoices_from_deliveries(
    request: Optional[CreateInvoiceFromDeliveriesRequest] = None,
    db: Session = Depends(get_db),
):
    payload = request or CreateInvoiceFromDeliveriesRequest()
    result = await asyncio.to_thread(_sync_create_invoices_from_deliveries, db, payload.delivery_ids)
    return DeliveryInvoiceBulkResponse(**result)


@router.get(
    "/{invoice_id}",
    summary="Get invoice details",
    description="Get an invoice by ID with all line items and resolved lookup names. Cached for 2 minutes.",
    responses={
        200: {"description": "Invoice found"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"}
    }
)
async def get_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
):
    """Get invoice by ID with resolved lookup names. Cached for 2 minutes."""
    cache_key = f"{CacheKeys.INVOICE}:detail:{invoice_id}"

    # Try cache first (unless bypassing)
    if not bypass_cache:
        cached = await cache_service.get(cache_key)
        if cached is not None:
            return cached

    # Fetch from database
    result = await asyncio.to_thread(_sync_get_invoice_detail, db, invoice_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice {invoice_id} not found")

    # Cache the result for 2 minutes
    await cache_service.set(cache_key, result, CacheTTL.MEDIUM)

    return result


@router.get(
    "/reference/{reference}",
    response_model=InvoiceDetailResponse,
    summary="Get invoice by reference",
    description="Get an invoice by its reference number.",
    responses={
        200: {"description": "Invoice found"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"}
    }
)
async def get_invoice_by_reference(
    reference: str = Path(..., description="Invoice reference"),
    db: Session = Depends(get_db)
):
    """Get invoice by reference."""
    service = get_invoice_service(db)

    try:
        return await service.get_invoice_by_reference(reference)
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.put(
    "/{invoice_id}",
    response_model=InvoiceDetailResponse,
    summary="Update an invoice",
    description="""
    Update invoice details.

    Cannot update paid, voided, or cancelled invoices.
    """,
    responses={
        200: {"description": "Invoice updated"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"},
        409: {"model": InvoiceErrorResponse, "description": "Status conflict"}
    }
)
async def update_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    data: InvoiceUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update an invoice."""
    service = get_invoice_service(db)

    try:
        result = await service.update_invoice(invoice_id, data)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.INVOICE, invoice_id)
        return result
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an invoice",
    description="""
    Delete an invoice and all its line items.

    Only draft invoices can be deleted.
    """,
    responses={
        204: {"description": "Invoice deleted"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"},
        409: {"model": InvoiceErrorResponse, "description": "Status conflict"}
    }
)
async def delete_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db)
):
    """Delete an invoice."""
    service = get_invoice_service(db)

    try:
        await service.delete_invoice(invoice_id)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.INVOICE, invoice_id)
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


# ==========================================================================
# Invoice Line Endpoints
# ==========================================================================

@router.post(
    "/{invoice_id}/lines",
    response_model=InvoiceLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add line to invoice",
    description="""
    Add a line item to an invoice.

    Only draft or sent invoices can have lines added.
    """
)
async def add_invoice_line(
    invoice_id: int = Path(..., description="Invoice ID"),
    data: InvoiceLineCreate = ...,
    db: Session = Depends(get_db)
):
    """Add a line to an invoice."""
    service = get_invoice_service(db)

    try:
        return await service.add_invoice_line(invoice_id, data)
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.put(
    "/lines/{line_id}",
    response_model=InvoiceLineResponse,
    summary="Update invoice line",
    description="Update an invoice line item."
)
async def update_invoice_line(
    line_id: int = Path(..., description="Line ID"),
    data: InvoiceLineUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update an invoice line."""
    service = get_invoice_service(db)

    try:
        result = await service.update_invoice_line(line_id, data)
        # Invalidate cache for parent invoice (detail + all list caches)
        if hasattr(result, 'inl_inv_id') and result.inl_inv_id:
            await cache_service.invalidate_entity(CacheKeys.INVOICE, result.inl_inv_id)
        return result
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.delete(
    "/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete invoice line",
    description="Delete an invoice line item."
)
async def delete_invoice_line(
    line_id: int = Path(..., description="Line ID"),
    db: Session = Depends(get_db)
):
    """Delete an invoice line."""
    service = get_invoice_service(db)

    try:
        # Get the invoice_id before deletion for cache invalidation
        from app.models.client_invoice_line import ClientInvoiceLine
        line = db.get(ClientInvoiceLine, line_id)
        invoice_id = line.cin_id if line else None

        await service.delete_invoice_line(line_id)

        # Invalidate cache for parent invoice (detail + all list caches)
        if invoice_id:
            await cache_service.invalidate_entity(CacheKeys.INVOICE, invoice_id)
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/lines/reorder",
    summary="Reorder invoice lines",
    description="Reorder lines of an invoice using the provided line IDs order.",
)
async def reorder_invoice_lines(
    invoice_id: int = Path(..., gt=0, description="Invoice ID"),
    request: InvoiceLineReorderRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        ordered_ids = await asyncio.to_thread(
            _sync_reorder_invoice_lines,
            db,
            invoice_id,
            request.line_ids,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if ordered_ids is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice {invoice_id} not found")

    # Invalidate cache (detail + all list caches)
    await cache_service.invalidate_entity(CacheKeys.INVOICE, invoice_id)

    return {
        "success": True,
        "invoiceId": invoice_id,
        "orderedLineIds": ordered_ids,
    }


@router.post(
    "/{invoice_id}/lines/merge",
    summary="Merge invoice lines",
    description="Merge multiple invoice lines into one line.",
)
async def merge_invoice_lines(
    invoice_id: int = Path(..., gt=0, description="Invoice ID"),
    request: InvoiceLineMergeRequest = ...,
    db: Session = Depends(get_db),
):
    try:
        result = await asyncio.to_thread(
            _sync_merge_invoice_lines,
            db,
            invoice_id,
            request.line_ids,
            request.keep_line_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return {"success": True, "invoiceId": invoice_id, **result}


@router.get(
    "/{invoice_id}/inspection-form-pdf",
    summary="Download invoice inspection form PDF",
    description="Generate and download inspection form PDF for an invoice.",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF file"},
        404: {"description": "Invoice or inspection data not found"},
    },
)
async def download_invoice_inspection_form_pdf(
    invoice_id: int = Path(..., gt=0, description="Invoice ID"),
    db: Session = Depends(get_db),
):
    """Generate and return inspection form PDF for this invoice."""
    import io
    from app.services.pdf_service import TemplatePDFService

    payload = await asyncio.to_thread(_sync_get_invoice_inspection_payload, db, invoice_id)
    if not payload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice {invoice_id} not found")
    if not payload.get("available"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No inspection data available for invoice {invoice_id}",
        )

    reference = payload.get("reference") or f"invoice-{invoice_id}"
    filename = f"{reference}-inspection-form.pdf"

    template_pdf = TemplatePDFService()
    society = await asyncio.to_thread(_sync_get_society, db, payload.get("societyId"))
    company_context = TemplatePDFService.build_company_context(society)
    pdf_content = template_pdf.generate_pdf(
        template_name="inspection-form",
        context={**payload, "company": company_context},
    )

    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_content)),
        },
    )


# ==========================================================================
# Invoice Action Endpoints
# ==========================================================================

@router.post(
    "/{invoice_id}/send",
    response_model=SendInvoiceResponse,
    summary="Send invoice",
    description="""
    Mark invoice as sent and optionally email to client.

    Changes invoice status from DRAFT to SENT.
    If email_to is provided, generates PDF and sends it via email.
    """
)
async def send_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    request: Optional[SendInvoiceRequest] = None,
    db: Session = Depends(get_db)
):
    """Send an invoice."""
    service = get_invoice_service(db)

    try:
        # Get invoice detail for reference and client info
        invoice_data = await asyncio.to_thread(_sync_get_invoice_detail, db, invoice_id)
        if not invoice_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invoice {invoice_id} not found"
            )

        email_to = None
        if request and request.recipient_email:
            email_to = request.recipient_email
        elif request and hasattr(request, 'email_to') and request.email_to:
            email_to = request.email_to

        # Send email with PDF if email address is provided
        if email_to:
            try:
                from app.services.invoice_pdf_service import InvoicePDFService
                from app.services.email_service import EmailService
                from app.schemas.email_log import EmailLogCreate

                # Generate PDF
                pdf_service = InvoicePDFService(db)
                pdf_content = await asyncio.to_thread(pdf_service.generate_pdf, invoice_id)

                # Build email subject and body
                reference = invoice_data.get("reference", f"Invoice-{invoice_id}")
                subject = f"Invoice {reference}"
                body = request.message if request and request.message else (
                    f"Please find attached invoice {reference}."
                )

                # Create email log and send
                email_service = EmailService(db)
                email_log_data = EmailLogCreate(
                    recipient_email=email_to,
                    recipient_name=invoice_data.get("clientName", ""),
                    subject=subject,
                    body=body,
                    entity_type="INVOICE",
                    entity_id=invoice_id,
                )
                email_log = await asyncio.to_thread(
                    email_service.create_email_log, email_log_data
                )
                await asyncio.to_thread(email_service.send_email, email_log)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to send invoice email: {e}")

        return SendInvoiceResponse(
            success=True,
            invoice_id=invoice_id,
            sent_to=email_to or "N/A",
            sent_at=datetime.now(),
            message="Invoice sent successfully" if email_to else "Invoice marked as sent"
        )
    except HTTPException:
        raise
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/void",
    response_model=VoidInvoiceResponse,
    summary="Void invoice",
    description="""
    Void an invoice.

    Cannot void paid invoices.
    """
)
async def void_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    request: VoidInvoiceRequest = ...,
    db: Session = Depends(get_db)
):
    """Void an invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.void_invoice(invoice_id, request.reason)

        return VoidInvoiceResponse(
            success=True,
            invoice_id=invoice.inv_id,
            voided_at=datetime.now(),
            reason=request.reason
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/cancel",
    response_model=InvoiceAPIResponse,
    summary="Cancel invoice",
    description="""
    Cancel an invoice.

    Only draft or sent invoices can be cancelled.
    """
)
async def cancel_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    reason: str = Query(..., min_length=5, description="Cancellation reason"),
    db: Session = Depends(get_db)
):
    """Cancel an invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.cancel_invoice(invoice_id, reason)

        return InvoiceAPIResponse(
            success=True,
            message=f"Invoice {invoice.inv_reference} cancelled",
            data={"invoice_id": invoice.inv_id, "status": "CANCELLED"}
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/credit-note",
    response_model=CreditNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create credit note from invoice",
    description="""
    Create a credit note (avoir) from an existing invoice.

    The credit note:
    - Has code prefixed with "AV-" (e.g., AV-INV-2025-00001)
    - Is linked to the original invoice via cin_avoir_id
    - Has cin_isinvoice=False (marks it as a credit note)
    - Clones all lines with negated quantities and amounts
    - Cannot be created if a credit note already exists for this invoice
    """,
    responses={
        201: {"description": "Credit note created"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"},
        422: {"model": InvoiceErrorResponse, "description": "Validation error"}
    }
)
async def create_credit_note(
    invoice_id: int = Path(..., description="Original invoice ID"),
    db: Session = Depends(get_db),
    # current_user_id: int = Depends(get_current_user_id)  # TODO: Add auth
):
    """Create a credit note from an existing invoice."""
    service = get_invoice_service(db)

    try:
        credit_note = await service.create_credit_note(
            invoice_id=invoice_id,
            user_id=1  # TODO: Replace with current_user_id when auth is enabled
        )

        return CreditNoteResponse(
            success=True,
            message=f"Credit note {credit_note.cin_code} created successfully",
            credit_note_id=credit_note.cin_id,
            credit_note_reference=credit_note.cin_code,
            original_invoice_id=invoice_id,
            original_invoice_reference=credit_note.cin_code.replace("AV-", "", 1),
            created_at=credit_note.cin_d_creation,
            lines_count=len(credit_note.lines) if credit_note.lines else 0,
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/discount",
    summary="Update invoice discount",
    description="Apply or update document-level discount on an invoice.",
)
async def update_invoice_discount(
    invoice_id: int = Path(..., gt=0, description="Invoice ID"),
    request: InvoiceDiscountUpdateRequest = ...,
    db: Session = Depends(get_db),
):
    updated = await asyncio.to_thread(
        _sync_update_invoice_discount,
        db,
        invoice_id,
        request.discount_percentage,
        request.discount_amount,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice {invoice_id} not found")
    return updated


@router.post(
    "/{invoice_id}/payments",
    response_model=RecordPaymentResponse,
    summary="Record payment",
    description="""
    Record a payment against an invoice.

    Updates invoice amounts and status automatically.
    """
)
async def record_payment(
    invoice_id: int = Path(..., description="Invoice ID"),
    request: RecordPaymentRequest = ...,
    db: Session = Depends(get_db)
):
    """Record a payment on an invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.record_payment(
            invoice_id=invoice_id,
            amount=request.amount,
            payment_date=request.payment_date,
            payment_reference=request.payment_reference
        )

        return RecordPaymentResponse(
            success=True,
            invoice_id=invoice.inv_id,
            amount_paid=invoice.inv_amount_paid,
            new_balance=invoice.inv_amount_due or Decimal("0"),
            is_fully_paid=invoice.inv_amount_paid >= invoice.inv_total_amount,
            payment_date=request.payment_date
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.post(
    "/{invoice_id}/generate-pdf",
    response_model=GeneratePdfResponse,
    summary="Generate PDF",
    description="Generate PDF for an invoice."
)
async def generate_pdf(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db)
):
    """Generate PDF for an invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.get_invoice(invoice_id, include_lines=False)

        # TODO: Actually generate PDF
        pdf_url = f"/api/v1/invoices/{invoice_id}/pdf"

        return GeneratePdfResponse(
            success=True,
            invoice_id=invoice.inv_id,
            pdf_url=pdf_url,
            generated_at=datetime.now()
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.get(
    "/{invoice_id}/pdf",
    summary="Download invoice PDF",
    description="Generate and download PDF for an invoice.",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF file"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"},
    }
)
async def download_invoice_pdf(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db)
):
    """Generate and return PDF for this invoice."""
    import io
    from fastapi.responses import StreamingResponse
    from app.services.invoice_pdf_service import InvoicePDFService

    try:
        pdf_service = InvoicePDFService(db)
        pdf_content = await asyncio.to_thread(pdf_service.generate_pdf, invoice_id)

        # Get invoice reference for filename
        invoice_data = await asyncio.to_thread(_sync_get_invoice_detail, db, invoice_id)
        if not invoice_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Invoice {invoice_id} not found"
            )
        reference = invoice_data.get("reference", f"invoice-{invoice_id}")
        filename = f"{reference}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_content)),
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating PDF for invoice {invoice_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


# ==========================================================================
# Statistics Endpoint
# ==========================================================================

@router.get(
    "/stats/summary",
    response_model=InvoiceStatisticsResponse,
    summary="Get invoice statistics",
    description="Get invoice statistics with optional filters."
)
async def get_statistics(
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    date_from: Optional[date] = Query(None, description="Date range start"),
    date_to: Optional[date] = Query(None, description="Date range end"),
    db: Session = Depends(get_db)
):
    """Get invoice statistics."""
    service = get_invoice_service(db)

    stats = await service.get_statistics(
        society_id=society_id,
        bu_id=bu_id,
        date_from=date_from,
        date_to=date_to
    )

    return InvoiceStatisticsResponse(
        success=True,
        statistics=InvoiceStatistics(**stats),
        period_from=date_from,
        period_to=date_to,
        filters={"society_id": society_id, "bu_id": bu_id}
    )


# ==========================================================================
# Convenience Endpoints
# ==========================================================================

@router.get(
    "/statuses/list",
    response_model=List[dict],
    summary="Get invoice statuses",
    description="Get list of available invoice statuses."
)
async def get_invoice_statuses():
    """Get available invoice statuses."""
    return [
        {"value": "DRAFT", "label": "Draft", "description": "Invoice is being prepared"},
        {"value": "SENT", "label": "Sent", "description": "Invoice sent to client"},
        {"value": "PARTIAL", "label": "Partial", "description": "Partially paid"},
        {"value": "PAID", "label": "Paid", "description": "Fully paid"},
        {"value": "OVERDUE", "label": "Overdue", "description": "Past due date"},
        {"value": "CANCELLED", "label": "Cancelled", "description": "Invoice cancelled"},
        {"value": "VOID", "label": "Void", "description": "Invoice voided"}
    ]


# ==========================================================================
# Invoice Preview/HTML Endpoints
# ==========================================================================

# Initialize Jinja2 environment
_templates_dir = FilePath(__file__).parent.parent.parent / "templates"
_jinja_env = Environment(
    loader=FileSystemLoader(_templates_dir),
    autoescape=select_autoescape(['html', 'xml'])
)


@router.get(
    "/{invoice_id}/preview",
    response_class=HTMLResponse,
    summary="Preview invoice HTML",
    description="""
    Get a rendered HTML preview of an invoice.

    This endpoint renders the invoice using the Jinja2 template and returns
    the HTML content. This can be used for preview in a browser or as
    input for PDF generation.
    """,
    responses={
        200: {"description": "HTML preview of the invoice", "content": {"text/html": {}}},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"}
    }
)
async def preview_invoice_html(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db)
):
    """Get HTML preview of an invoice."""
    service = get_invoice_service(db)

    try:
        invoice = await service.get_invoice(invoice_id, include_lines=True)

        # Map status ID to status name
        status_map = {
            1: "DRAFT",
            2: "SENT",
            3: "PARTIAL",
            4: "PAID",
            5: "OVERDUE",
            6: "CANCELLED",
            7: "VOID"
        }
        status_name = status_map.get(invoice.inv_sta_id, "DRAFT")

        # Load the invoice template
        template = _jinja_env.get_template("invoice.html")

        # Render the template with invoice data
        html_content = template.render(
            invoice=invoice,
            lines=invoice.lines if invoice.lines else [],
            client=getattr(invoice, 'client', None),
            company=None,  # Will be loaded separately if needed
            status=status_name,
            currency_symbol="$",  # Default currency symbol
            payment_terms=None
        )

        return HTMLResponse(content=html_content, status_code=200)

    except InvoiceNotFoundError as e:
        raise handle_invoice_error(e)


@router.get(
    "/preview/sample",
    response_class=HTMLResponse,
    summary="Preview sample invoice",
    description="Get a sample invoice preview with mock data for template testing."
)
async def preview_sample_invoice():
    """Get a sample invoice HTML preview with mock data."""
    from decimal import Decimal
    from datetime import datetime, timedelta

    # Create mock invoice data for testing
    class MockInvoice:
        inv_id = 1
        inv_reference = "INV-2025-00001"
        inv_date = datetime.now()
        inv_due_date = datetime.now() + timedelta(days=30)
        inv_sta_id = 1
        inv_billing_address = "123 Client Street"
        inv_billing_city = "Paris"
        inv_billing_postal_code = "75001"
        inv_billing_country_id = 1
        inv_sub_total = Decimal("1000.00")
        inv_total_vat = Decimal("200.00")
        inv_total_amount = Decimal("1200.00")
        inv_discount = Decimal("0")
        inv_amount_paid = Decimal("0")
        inv_amount_due = Decimal("1200.00")
        inv_notes = "Thank you for your business. Payment is due within 30 days."
        inv_payment_reference = "REF-123456"
        balance_due = Decimal("1200.00")
        is_overdue = False

    class MockLine:
        def __init__(self, line_num, desc, qty, price, vat_amt, total):
            self.inl_id = line_num
            self.inl_line_number = line_num
            self.inl_description = desc
            self.inl_quantity = qty
            self.inl_unit_price = price
            self.inl_discount = Decimal("0")
            self.inl_vat_amount = vat_amt
            self.inl_line_total = total
            self.product_code = f"PRD-{line_num:03d}"

    class MockClient:
        cli_company_name = "Acme Corporation"
        cli_first_name = "John"
        cli_last_name = "Doe"
        cli_address = "456 Business Avenue"
        cli_address2 = "Suite 100"
        cli_postal_code = "75008"
        cli_city = "Paris"
        cli_email = "john.doe@acme.com"
        cli_phone = "+33 1 23 45 67 89"
        cli_vat_number = "FR12345678901"

    class MockCompany:
        soc_society_name = "Your Company SARL"
        soc_address1 = "789 Corporate Boulevard"
        soc_address2 = None
        soc_postcode = "75016"
        soc_city = "Paris"
        soc_county = "France"
        soc_tel = "+33 1 98 76 54 32"
        soc_email = "contact@yourcompany.com"
        soc_site = "www.yourcompany.com"
        soc_siret = "123 456 789 00012"
        soc_tva_intra = "FR12 123 456 789"
        soc_rcs = "Paris B 123 456 789"
        soc_capital = "10,000 EUR"
        soc_rib_name = "BNP Paribas"
        soc_rib_code_iban = "FR76 1234 5678 9012 3456 7890 123"
        soc_rib_code_bic = "BNPAFRPP"

    mock_lines = [
        MockLine(1, "Professional Services - Web Development", Decimal("10"), Decimal("50.00"), Decimal("100.00"), Decimal("600.00")),
        MockLine(2, "Design Services - UI/UX Design", Decimal("5"), Decimal("60.00"), Decimal("60.00"), Decimal("360.00")),
        MockLine(3, "Consulting - Technical Architecture Review", Decimal("2"), Decimal("100.00"), Decimal("40.00"), Decimal("240.00"))
    ]

    # Load the invoice template
    template = _jinja_env.get_template("invoice.html")

    # Render the template with mock data
    html_content = template.render(
        invoice=MockInvoice(),
        lines=mock_lines,
        client=MockClient(),
        company=MockCompany(),
        status="DRAFT",
        currency_symbol="\u20ac",  # Euro symbol
        payment_terms="Net 30 days"
    )

    return HTMLResponse(content=html_content, status_code=200)

"""
Supplier Invoice API Router.

Provides REST API endpoints for:
- Supplier Invoice CRUD operations
- Invoice line management
- Payment tracking (mark paid/unpaid)
- Production status management
- Search and filtering with pagination
"""
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, desc, and_

from app.database import get_db
from app.models.supplier_invoice import SupplierInvoice, SupplierInvoiceLine
from app.models.supplier_order import SupplierOrder
from app.models.supplier import Supplier
from app.models.currency import Currency
from app.models.vat_rate import VatRate
from app.models.society import Society
from app.models.user import User
from app.services.supplier_invoice_service import (
    SupplierInvoiceService,
    get_supplier_invoice_service,
    SupplierInvoiceServiceError,
    SupplierInvoiceNotFoundError,
    SupplierInvoiceLineNotFoundError,
    SupplierInvoiceValidationError,
    SupplierInvoiceStatusError
)
from app.schemas.supplier_invoice import (
    SupplierInvoiceCreate, SupplierInvoiceUpdate,
    SupplierInvoiceLineCreate, SupplierInvoiceLineUpdate, SupplierInvoiceLineResponse,
    MarkPaidRequest, MarkPaidResponse,
    MarkUnpaidRequest, MarkUnpaidResponse,
    StartProductionRequest, StartProductionResponse,
    CompleteProductionRequest, CompleteProductionResponse,
)

router = APIRouter(prefix="/supplier-invoices", tags=["Supplier Invoices"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_supplier_invoice_error(error: SupplierInvoiceServiceError) -> HTTPException:
    """Convert SupplierInvoiceServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (SupplierInvoiceNotFoundError, SupplierInvoiceLineNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, SupplierInvoiceValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, SupplierInvoiceStatusError):
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
# Sync Database Helpers (bypass model_validate)
# ==========================================================================


def _sync_list_supplier_invoices(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    supplier_id: Optional[int] = None,
    is_paid: Optional[bool] = None,
    production_started: Optional[bool] = None,
    production_complete: Optional[bool] = None,
):
    """Sync helper to list supplier invoices with pagination, joining supplier + currency."""
    query = (
        select(
            SupplierInvoice.sin_id,
            SupplierInvoice.sin_code,
            SupplierInvoice.sin_name,
            SupplierInvoice.sup_id,
            SupplierInvoice.sod_id,
            SupplierInvoice.sin_d_creation,
            SupplierInvoice.sin_d_update,
            SupplierInvoice.sin_is_paid,
            SupplierInvoice.sin_start_production,
            SupplierInvoice.sin_complete_production,
            SupplierInvoice.sin_bank_receipt_number,
            SupplierInvoice.sin_discount_amount,
            SupplierInvoice.cur_id,
            Supplier.sup_company_name,
            Currency.cur_designation,
        )
        .outerjoin(Supplier, SupplierInvoice.sup_id == Supplier.sup_id)
        .outerjoin(Currency, SupplierInvoice.cur_id == Currency.cur_id)
    )
    count_query = select(func.count(SupplierInvoice.sin_id))

    conditions = []
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                SupplierInvoice.sin_code.ilike(search_term),
                SupplierInvoice.sin_name.ilike(search_term),
            )
        )
    if supplier_id is not None:
        conditions.append(SupplierInvoice.sup_id == supplier_id)
    if is_paid is not None:
        conditions.append(SupplierInvoice.sin_is_paid == is_paid)
    if production_started is not None:
        conditions.append(SupplierInvoice.sin_start_production == production_started)
    if production_complete is not None:
        conditions.append(SupplierInvoice.sin_complete_production == production_complete)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.execute(count_query).scalar() or 0

    query = query.order_by(desc(SupplierInvoice.sin_d_creation))
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    rows = db.execute(query).all()
    return rows, total


def _sync_get_supplier_invoice_detail(db: Session, invoice_id: int):
    """Sync helper to get supplier invoice detail with lines, returning camelCase dict."""
    query = (
        select(
            SupplierInvoice.sin_id,
            SupplierInvoice.sin_code,
            SupplierInvoice.sin_name,
            SupplierInvoice.sup_id,
            SupplierInvoice.sod_id,
            SupplierInvoice.sin_d_creation,
            SupplierInvoice.sin_d_update,
            SupplierInvoice.sin_is_paid,
            SupplierInvoice.sin_start_production,
            SupplierInvoice.sin_d_start_production,
            SupplierInvoice.sin_complete_production,
            SupplierInvoice.sin_d_complete_production,
            SupplierInvoice.sin_bank_receipt_number,
            SupplierInvoice.sin_discount_amount,
            SupplierInvoice.sin_inter_comment,
            SupplierInvoice.sin_supplier_comment,
            SupplierInvoice.usr_creator_id,
            SupplierInvoice.cur_id,
            SupplierInvoice.vat_id,
            SupplierInvoice.soc_id,
            Supplier.sup_company_name,
            Currency.cur_designation,
        )
        .outerjoin(Supplier, SupplierInvoice.sup_id == Supplier.sup_id)
        .outerjoin(Currency, SupplierInvoice.cur_id == Currency.cur_id)
        .where(SupplierInvoice.sin_id == invoice_id)
    )
    row = db.execute(query).first()
    if not row:
        return None

    # Resolve additional lookups
    vat_rate = None
    if row.vat_id:
        vat = db.get(VatRate, row.vat_id)
        if vat:
            vat_rate = float(vat.vat_rate) if vat.vat_rate else None

    society_name = None
    if row.soc_id:
        society = db.get(Society, row.soc_id)
        if society:
            society_name = society.soc_society_name

    creator_name = None
    if row.usr_creator_id:
        user = db.get(User, row.usr_creator_id)
        if user:
            creator_name = f"{user.usr_first_name or ''} {user.usr_name or ''}".strip()

    # Resolve supplier order code if linked
    supplier_order_code = None
    if row.sod_id:
        sod = db.get(SupplierOrder, row.sod_id)
        if sod:
            supplier_order_code = sod.sod_code

    # Fetch lines
    lines_query = (
        select(
            SupplierInvoiceLine.sil_id,
            SupplierInvoiceLine.sil_description,
            SupplierInvoiceLine.sil_quantity,
            SupplierInvoiceLine.sil_unit_price,
            SupplierInvoiceLine.sil_discount_amount,
            SupplierInvoiceLine.sil_total_price,
            SupplierInvoiceLine.sil_price_with_dis,
            SupplierInvoiceLine.sil_order,
            SupplierInvoiceLine.prd_id,
        )
        .where(SupplierInvoiceLine.sin_id == invoice_id)
        .order_by(SupplierInvoiceLine.sil_order)
    )
    line_rows = db.execute(lines_query).all()

    lines = []
    total_ht = Decimal("0")
    for l in line_rows:
        line_total = l.sil_price_with_dis or l.sil_total_price or Decimal("0")
        total_ht += line_total
        lines.append({
            "id": l.sil_id,
            "description": l.sil_description or "",
            "quantity": l.sil_quantity or 0,
            "unitPrice": float(l.sil_unit_price or 0),
            "discountAmount": float(l.sil_discount_amount or 0),
            "lineTotal": float(line_total),
            "totalPrice": float(l.sil_total_price or 0),
            "lineOrder": l.sil_order,
        })

    total_ht_float = float(total_ht)
    discount = float(row.sin_discount_amount or 0)
    # Estimate TTC as totalHt * (1 + vatRate/100) if vatRate known
    total_ttc = total_ht_float - discount
    if vat_rate:
        total_ttc = (total_ht_float - discount) * (1 + vat_rate / 100)

    return {
        "id": row.sin_id,
        "code": row.sin_code or "",
        "displayName": row.sin_code or f"#{row.sin_id}",
        "name": row.sin_name or "",
        "supplierId": row.sup_id,
        "supplierName": row.sup_company_name or "",
        "createdAt": row.sin_d_creation.isoformat() if row.sin_d_creation else None,
        "updatedAt": row.sin_d_update.isoformat() if row.sin_d_update else None,
        "isPaid": bool(row.sin_is_paid),
        "productionStarted": bool(row.sin_start_production),
        "productionComplete": bool(row.sin_complete_production),
        "productionStartDate": row.sin_d_start_production.isoformat() if row.sin_d_start_production else None,
        "productionCompleteDate": row.sin_d_complete_production.isoformat() if row.sin_d_complete_production else None,
        "bankReceiptNumber": row.sin_bank_receipt_number or "",
        "totalHt": total_ht_float,
        "discountAmount": discount,
        "totalTtc": total_ttc,
        "currencyCode": row.cur_designation or "EUR",
        "currencySymbol": row.cur_designation or "EUR",
        "vatRate": vat_rate,
        "societyName": society_name or "",
        "creatorName": creator_name or "",
        "supplierOrderCode": supplier_order_code or "",
        "internalComment": row.sin_inter_comment or "",
        "supplierComment": row.sin_supplier_comment or "",
        "lineCount": len(lines),
        "lines": lines,
    }


# ==========================================================================
# Supplier Invoice CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier invoice",
)
async def create_supplier_invoice(
    data: SupplierInvoiceCreate,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Create a new supplier invoice."""
    try:
        invoice = await service.create_invoice(data)
        return invoice
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.get(
    "",
    summary="List all supplier invoices",
)
async def list_supplier_invoices(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search term (code, name)"),
    supplier_id: Optional[int] = Query(None, alias="supplierId"),
    is_paid: Optional[bool] = Query(None, alias="isPaid"),
    production_started: Optional[bool] = Query(None, alias="productionStarted"),
    production_complete: Optional[bool] = Query(None, alias="productionComplete"),
    db: Session = Depends(get_db),
):
    """List all supplier invoices with pagination and filtering."""
    rows, total = await asyncio.to_thread(
        _sync_list_supplier_invoices, db, page, pageSize, search,
        supplier_id, is_paid, production_started, production_complete
    )

    items = []
    for row in rows:
        items.append({
            "id": row.sin_id,
            "code": row.sin_code or "",
            "displayName": row.sin_code or f"#{row.sin_id}",
            "name": row.sin_name or "",
            "supplierName": row.sup_company_name or "",
            "createdAt": row.sin_d_creation.isoformat() if row.sin_d_creation else None,
            "updatedAt": row.sin_d_update.isoformat() if row.sin_d_update else None,
            "isPaid": bool(row.sin_is_paid),
            "productionStarted": bool(row.sin_start_production),
            "productionComplete": bool(row.sin_complete_production),
            "bankReceiptNumber": row.sin_bank_receipt_number or "",
            "currencyCode": row.cur_designation or "EUR",
            "currencySymbol": row.cur_designation or "EUR",
            "discountAmount": float(row.sin_discount_amount or 0),
        })

    total_pages = (total + pageSize - 1) // pageSize if total > 0 else 0

    return {
        "success": True,
        "data": items,
        "page": page,
        "pageSize": pageSize,
        "totalCount": total,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }


@router.get(
    "/{invoice_id}",
    summary="Get supplier invoice by ID",
)
async def get_supplier_invoice(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    db: Session = Depends(get_db),
):
    """Get a specific supplier invoice by ID with resolved lookup names."""
    result = await asyncio.to_thread(_sync_get_supplier_invoice_detail, db, invoice_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier invoice {invoice_id} not found"
        )
    return result


@router.put(
    "/{invoice_id}",
    summary="Update a supplier invoice",
)
async def update_supplier_invoice(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: SupplierInvoiceUpdate = ...,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Update an existing supplier invoice."""
    try:
        invoice = await service.update_invoice(invoice_id, data)
        return invoice
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier invoice",
    description="""
    Delete a supplier invoice by ID.

    This will also delete all associated invoice lines.
    """
)
async def delete_supplier_invoice(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Delete a supplier invoice."""
    try:
        await service.delete_invoice(invoice_id)
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


# ==========================================================================
# Invoice Line Endpoints
# ==========================================================================

@router.post(
    "/{invoice_id}/lines",
    response_model=SupplierInvoiceLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a line to a supplier invoice",
    description="""
    Add a new line to an existing supplier invoice.

    The line's pricing totals will be calculated automatically.
    """
)
async def add_supplier_invoice_line(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: SupplierInvoiceLineCreate = ...,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Add a new line to a supplier invoice."""
    try:
        line = await service.add_line(invoice_id, data)
        return line
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.put(
    "/{invoice_id}/lines/{line_id}",
    response_model=SupplierInvoiceLineResponse,
    summary="Update a supplier invoice line",
    description="""
    Update an existing line on a supplier invoice.

    The line's pricing totals will be recalculated if pricing fields change.
    """
)
async def update_supplier_invoice_line(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: SupplierInvoiceLineUpdate = ...,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Update an existing line on a supplier invoice."""
    try:
        line = await service.update_line(invoice_id, line_id, data)
        return line
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.delete(
    "/{invoice_id}/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier invoice line",
    description="Delete a line from a supplier invoice."
)
async def delete_supplier_invoice_line(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Delete a line from a supplier invoice."""
    try:
        await service.delete_line(invoice_id, line_id)
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


# ==========================================================================
# Payment Status Endpoints
# ==========================================================================

@router.post(
    "/{invoice_id}/mark-paid",
    response_model=MarkPaidResponse,
    summary="Mark a supplier invoice as paid",
    description="""
    Mark a supplier invoice as paid.

    Optionally provide bank receipt information for documentation.
    """
)
async def mark_supplier_invoice_paid(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: Optional[MarkPaidRequest] = None,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Mark a supplier invoice as paid."""
    try:
        bank_receipt_number = data.bank_receipt_number if data else None
        bank_receipt_file = data.bank_receipt_file if data else None
        notes = data.notes if data else None

        invoice = await service.mark_paid(
            invoice_id,
            bank_receipt_number=bank_receipt_number,
            bank_receipt_file=bank_receipt_file,
            notes=notes
        )
        return MarkPaidResponse(
            success=True,
            invoiceId=invoice.sin_id,
            paidAt=invoice.sin_d_update,
            bankReceiptNumber=invoice.sin_bank_receipt_number,
            message="Invoice marked as paid successfully"
        )
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.post(
    "/{invoice_id}/mark-unpaid",
    response_model=MarkUnpaidResponse,
    summary="Mark a supplier invoice as unpaid",
    description="""
    Mark a supplier invoice as unpaid.

    A reason for unmarking as paid is required for documentation.
    """
)
async def mark_supplier_invoice_unpaid(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: MarkUnpaidRequest = ...,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Mark a supplier invoice as unpaid."""
    try:
        invoice = await service.mark_unpaid(invoice_id, data.reason)
        return MarkUnpaidResponse(
            success=True,
            invoiceId=invoice.sin_id,
            unmarkedAt=invoice.sin_d_update,
            reason=data.reason,
            message="Invoice marked as unpaid successfully"
        )
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


# ==========================================================================
# Production Status Endpoints
# ==========================================================================

@router.post(
    "/{invoice_id}/start-production",
    response_model=StartProductionResponse,
    summary="Start production for a supplier invoice",
    description="""
    Mark production as started for a supplier invoice.

    This indicates that the supplier has begun manufacturing/processing the items.
    """
)
async def start_invoice_production(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: Optional[StartProductionRequest] = None,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Start production for a supplier invoice."""
    try:
        notes = data.notes if data else None
        invoice = await service.start_production(invoice_id, notes)
        return StartProductionResponse(
            success=True,
            invoiceId=invoice.sin_id,
            startedAt=invoice.sin_d_start_production,
            message="Production started successfully"
        )
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.post(
    "/{invoice_id}/complete-production",
    response_model=CompleteProductionResponse,
    summary="Complete production for a supplier invoice",
    description="""
    Mark production as complete for a supplier invoice.

    Production must have been started first.
    """
)
async def complete_invoice_production(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    data: Optional[CompleteProductionRequest] = None,
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Complete production for a supplier invoice."""
    try:
        notes = data.notes if data else None
        invoice = await service.complete_production(invoice_id, notes)
        return CompleteProductionResponse(
            success=True,
            invoiceId=invoice.sin_id,
            completedAt=invoice.sin_d_complete_production,
            message="Production completed successfully"
        )
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)

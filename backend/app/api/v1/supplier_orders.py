"""
Supplier Order API Router.

Provides REST API endpoints for:
- Supplier Order CRUD operations
- Order line management
- Order status management (confirm, cancel)
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
from app.models.supplier_order import SupplierOrder, SupplierOrderLine
from app.models.supplier import Supplier
from app.models.currency import Currency
from app.models.vat_rate import VatRate
from app.models.society import Society
from app.models.user import User
from app.services.supplier_order_service import (
    SupplierOrderService,
    get_supplier_order_service,
    SupplierOrderServiceError,
    SupplierOrderNotFoundError,
    SupplierOrderLineNotFoundError,
    SupplierOrderValidationError,
    SupplierOrderStatusError
)
from app.schemas.supplier_order import (
    SupplierOrderCreate, SupplierOrderUpdate,
    SupplierOrderSearchParams,
    SupplierOrderLineCreate, SupplierOrderLineUpdate,
    ConfirmSupplierOrderRequest, ConfirmSupplierOrderResponse,
    CancelSupplierOrderRequest, CancelSupplierOrderResponse,
)

router = APIRouter(prefix="/supplier-orders", tags=["Supplier Orders"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_supplier_order_error(error: SupplierOrderServiceError) -> HTTPException:
    """Convert SupplierOrderServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (SupplierOrderNotFoundError, SupplierOrderLineNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, SupplierOrderValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, SupplierOrderStatusError):
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


def _sync_list_supplier_orders(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    supplier_id: Optional[int] = None,
    is_started: Optional[bool] = None,
    is_canceled: Optional[bool] = None,
):
    """Sync helper to list supplier orders with pagination, joining supplier + currency."""
    query = (
        select(
            SupplierOrder.sod_id,
            SupplierOrder.sod_code,
            SupplierOrder.sod_name,
            SupplierOrder.sup_id,
            SupplierOrder.sod_d_creation,
            SupplierOrder.sod_d_update,
            SupplierOrder.sod_d_exp_delivery,
            SupplierOrder.sod_total_ht,
            SupplierOrder.sod_total_ttc,
            SupplierOrder.sod_started,
            SupplierOrder.sod_canceled,
            SupplierOrder.sod_paid,
            SupplierOrder.sod_need2pay,
            SupplierOrder.cur_id,
            Supplier.sup_company_name,
            Currency.cur_designation,
        )
        .outerjoin(Supplier, SupplierOrder.sup_id == Supplier.sup_id)
        .outerjoin(Currency, SupplierOrder.cur_id == Currency.cur_id)
    )
    count_query = select(func.count(SupplierOrder.sod_id))

    conditions = []
    if search:
        search_term = f"%{search}%"
        conditions.append(
            or_(
                SupplierOrder.sod_code.ilike(search_term),
                SupplierOrder.sod_name.ilike(search_term),
            )
        )
    if supplier_id is not None:
        conditions.append(SupplierOrder.sup_id == supplier_id)
    if is_started is not None:
        conditions.append(SupplierOrder.sod_started == is_started)
    if is_canceled is not None:
        conditions.append(SupplierOrder.sod_canceled == is_canceled)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    total = db.execute(count_query).scalar() or 0

    query = query.order_by(desc(SupplierOrder.sod_d_creation))
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    rows = db.execute(query).all()
    return rows, total


def _sync_get_supplier_order_detail(db: Session, order_id: int):
    """Sync helper to get supplier order detail with lines, returning camelCase dict."""
    # Fetch order header with joins
    query = (
        select(
            SupplierOrder.sod_id,
            SupplierOrder.sod_code,
            SupplierOrder.sod_name,
            SupplierOrder.sup_id,
            SupplierOrder.sod_d_creation,
            SupplierOrder.sod_d_update,
            SupplierOrder.sod_d_exp_delivery,
            SupplierOrder.sod_total_ht,
            SupplierOrder.sod_total_ttc,
            SupplierOrder.sod_discount_amount,
            SupplierOrder.sod_started,
            SupplierOrder.sod_canceled,
            SupplierOrder.sod_paid,
            SupplierOrder.sod_need2pay,
            SupplierOrder.sod_inter_comment,
            SupplierOrder.sod_supplier_comment,
            SupplierOrder.usr_creator_id,
            SupplierOrder.pin_id,
            SupplierOrder.cur_id,
            SupplierOrder.vat_id,
            SupplierOrder.soc_id,
            Supplier.sup_company_name,
            Currency.cur_designation,
        )
        .outerjoin(Supplier, SupplierOrder.sup_id == Supplier.sup_id)
        .outerjoin(Currency, SupplierOrder.cur_id == Currency.cur_id)
        .where(SupplierOrder.sod_id == order_id)
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

    # Fetch lines
    lines_query = (
        select(
            SupplierOrderLine.sol_id,
            SupplierOrderLine.sol_description,
            SupplierOrderLine.sol_quantity,
            SupplierOrderLine.sol_unit_price,
            SupplierOrderLine.sol_discount_amount,
            SupplierOrderLine.sol_total_price,
            SupplierOrderLine.sol_price_with_dis,
            SupplierOrderLine.sol_order,
            SupplierOrderLine.prd_id,
        )
        .where(SupplierOrderLine.sod_id == order_id)
        .order_by(SupplierOrderLine.sol_order)
    )
    line_rows = db.execute(lines_query).all()

    lines = []
    total_quantity = 0
    for l in line_rows:
        qty = l.sol_quantity or 0
        total_quantity += qty
        lines.append({
            "id": l.sol_id,
            "description": l.sol_description or "",
            "productName": l.sol_description or "",
            "quantity": qty,
            "unitPrice": float(l.sol_unit_price or 0),
            "discountAmount": float(l.sol_discount_amount or 0),
            "lineTotal": float(l.sol_price_with_dis or l.sol_total_price or 0),
            "totalPrice": float(l.sol_total_price or 0),
            "lineOrder": l.sol_order,
        })

    return {
        "id": row.sod_id,
        "code": row.sod_code or "",
        "displayName": row.sod_code or f"#{row.sod_id}",
        "name": row.sod_name or "",
        "supplierId": row.sup_id,
        "supplierName": row.sup_company_name or "",
        "createdAt": row.sod_d_creation.isoformat() if row.sod_d_creation else None,
        "updatedAt": row.sod_d_update.isoformat() if row.sod_d_update else None,
        "expectedDeliveryDate": row.sod_d_exp_delivery.isoformat() if row.sod_d_exp_delivery else None,
        "totalHt": float(row.sod_total_ht or 0),
        "totalTtc": float(row.sod_total_ttc or 0),
        "discountAmount": float(row.sod_discount_amount or 0),
        "paidAmount": float(row.sod_paid or 0),
        "balanceDue": float(row.sod_need2pay or 0),
        "isStarted": bool(row.sod_started),
        "isCanceled": bool(row.sod_canceled),
        "currencyCode": row.cur_designation or "EUR",
        "vatRate": vat_rate,
        "societyName": society_name or "",
        "creatorName": creator_name or "",
        "purchaseIntentId": row.pin_id,
        "internalComment": row.sod_inter_comment or "",
        "supplierComment": row.sod_supplier_comment or "",
        "lineCount": len(lines),
        "totalQuantity": total_quantity,
        "lines": lines,
    }


# ==========================================================================
# Supplier Order CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier order",
)
async def create_supplier_order(
    data: SupplierOrderCreate,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Create a new supplier order."""
    try:
        order = await service.create_order(data)
        return order
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.get(
    "",
    summary="List all supplier orders",
)
async def list_supplier_orders(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    supplier_id: Optional[int] = Query(None, alias="supplierId"),
    is_started: Optional[bool] = Query(None, alias="isStarted"),
    is_canceled: Optional[bool] = Query(None, alias="isCanceled"),
    db: Session = Depends(get_db),
):
    """List all supplier orders with pagination and filtering."""
    rows, total = await asyncio.to_thread(
        _sync_list_supplier_orders, db, page, pageSize, search, supplier_id, is_started, is_canceled
    )

    items = []
    for row in rows:
        items.append({
            "id": row.sod_id,
            "code": row.sod_code or "",
            "displayName": row.sod_code or f"#{row.sod_id}",
            "name": row.sod_name or "",
            "supplierName": row.sup_company_name or "",
            "createdAt": row.sod_d_creation.isoformat() if row.sod_d_creation else None,
            "updatedAt": row.sod_d_update.isoformat() if row.sod_d_update else None,
            "expectedDeliveryDate": row.sod_d_exp_delivery.isoformat() if row.sod_d_exp_delivery else None,
            "totalHt": float(row.sod_total_ht or 0),
            "totalTtc": float(row.sod_total_ttc or 0),
            "isStarted": bool(row.sod_started),
            "isCanceled": bool(row.sod_canceled),
            "currencyCode": row.cur_designation or "EUR",
            "paidAmount": float(row.sod_paid or 0),
            "balanceDue": float(row.sod_need2pay or 0),
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
    "/{order_id}",
    summary="Get supplier order by ID",
)
async def get_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    db: Session = Depends(get_db),
):
    """Get a specific supplier order by ID with resolved lookup names."""
    result = await asyncio.to_thread(_sync_get_supplier_order_detail, db, order_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplier order {order_id} not found"
        )
    return result


@router.put(
    "/{order_id}",
    summary="Update a supplier order",
)
async def update_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: SupplierOrderUpdate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Update an existing supplier order."""
    try:
        order = await service.update_order(order_id, data)
        return order
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier order (soft delete)",
)
async def delete_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Soft delete (cancel) a supplier order."""
    try:
        await service.delete_order(order_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a supplier order",
)
async def hard_delete_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Permanently delete a supplier order."""
    try:
        await service.permanent_delete_order(order_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


# ==========================================================================
# Order Line Endpoints
# ==========================================================================

@router.post(
    "/{order_id}/lines",
    status_code=status.HTTP_201_CREATED,
    summary="Add a line to a supplier order",
)
async def add_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: SupplierOrderLineCreate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Add a new line to a supplier order."""
    try:
        line = await service.add_line(order_id, data)
        return line
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.put(
    "/{order_id}/lines/{line_id}",
    summary="Update a supplier order line",
)
async def update_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: SupplierOrderLineUpdate = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Update an existing line on a supplier order."""
    try:
        line = await service.update_line(order_id, line_id, data)
        return line
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.delete(
    "/{order_id}/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier order line",
)
async def delete_supplier_order_line(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Delete a line from a supplier order."""
    try:
        await service.delete_line(order_id, line_id)
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


# ==========================================================================
# Order Status Endpoints
# ==========================================================================

@router.post(
    "/{order_id}/confirm",
    response_model=ConfirmSupplierOrderResponse,
    summary="Confirm a supplier order",
)
async def confirm_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: Optional[ConfirmSupplierOrderRequest] = None,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Confirm a supplier order."""
    try:
        notes = data.notes if data else None
        order = await service.confirm_order(order_id, notes)
        return ConfirmSupplierOrderResponse(
            success=True,
            orderId=order.sod_id,
            confirmedAt=order.sod_d_update,
            message="Order confirmed successfully"
        )
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)


@router.post(
    "/{order_id}/cancel",
    response_model=CancelSupplierOrderResponse,
    summary="Cancel a supplier order",
)
async def cancel_supplier_order(
    order_id: int = Path(..., gt=0, description="Supplier order ID"),
    data: CancelSupplierOrderRequest = ...,
    service: SupplierOrderService = Depends(get_supplier_order_service)
):
    """Cancel a supplier order."""
    try:
        order = await service.cancel_order(order_id, data.reason)
        return CancelSupplierOrderResponse(
            success=True,
            orderId=order.sod_id,
            canceledAt=order.sod_d_update,
            reason=data.reason,
            message="Order cancelled successfully"
        )
    except SupplierOrderServiceError as e:
        raise handle_supplier_order_error(e)

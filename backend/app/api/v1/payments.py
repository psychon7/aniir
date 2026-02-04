"""
Payments API Router.

Uses legacy payment tables:
- TM_CPY_ClientInvoice_Payment (client payments)
- TR_SPR_SupplierOrder_Payment_Record (supplier payments)
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app.services.payment_service import PaymentService, get_payment_service
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentAPIResponse,
    PaymentListPaginatedResponse,
    PaymentType,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "",
    response_model=PaymentAPIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payment",
    description="Record a new client or supplier payment."
)
async def create_payment(
    data: PaymentCreate,
    service: PaymentService = Depends(get_payment_service),
):
    payment = service.create_payment(data)
    return PaymentAPIResponse(success=True, data=payment)


@router.get(
    "",
    response_model=PaymentListPaginatedResponse,
    summary="List payments",
    description="Get a paginated list of payments with optional filtering."
)
async def list_payments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by reference or invoice/order code"),
    client_id: Optional[int] = Query(None, alias="clientId", description="Filter by client ID"),
    supplier_id: Optional[int] = Query(None, alias="supplierId", description="Filter by supplier ID"),
    invoice_id: Optional[int] = Query(None, alias="invoiceId", description="Filter by invoice ID"),
    payment_type: Optional[PaymentType] = Query(None, alias="paymentType", description="Filter by payment type"),
    payment_mode_id: Optional[int] = Query(None, alias="paymentModeId", description="Filter by payment mode"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society ID"),
    date_from: Optional[datetime] = Query(None, alias="dateFrom", description="Payments from date"),
    date_to: Optional[datetime] = Query(None, alias="dateTo", description="Payments to date"),
    min_amount: Optional[Decimal] = Query(None, alias="minAmount", description="Minimum amount"),
    max_amount: Optional[Decimal] = Query(None, alias="maxAmount", description="Maximum amount"),
    sort_by: str = Query("paymentDate", alias="sortBy", description="Sort field"),
    sort_order: str = Query("desc", alias="sortOrder", pattern="^(asc|desc)$", description="Sort order"),
    service: PaymentService = Depends(get_payment_service),
):
    payments, total = service.list_payments(
        page=page,
        page_size=page_size,
        search=search,
        client_id=client_id,
        supplier_id=supplier_id,
        invoice_id=invoice_id,
        payment_type=payment_type,
        payment_mode_id=payment_mode_id,
        society_id=society_id,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return PaymentListPaginatedResponse(
        success=True,
        data=payments,
        page=page,
        pageSize=page_size,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1,
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentAPIResponse,
    summary="Get payment by ID",
    description="Retrieve a single payment by its ID."
)
async def get_payment(
    payment_id: int,
    service: PaymentService = Depends(get_payment_service),
):
    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found",
        )
    return PaymentAPIResponse(success=True, data=payment)


@router.get(
    "/by-reference/{reference}",
    response_model=PaymentAPIResponse,
    summary="Get payment by reference",
    description="Retrieve a single payment by its reference."
)
async def get_payment_by_reference(
    reference: str,
    service: PaymentService = Depends(get_payment_service),
):
    payment = service.get_payment_by_reference(reference)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with reference {reference} not found",
        )
    return PaymentAPIResponse(success=True, data=payment)


@router.put(
    "/{payment_id}",
    response_model=PaymentAPIResponse,
    summary="Update a payment",
    description="Update an existing payment record."
)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    service: PaymentService = Depends(get_payment_service),
):
    payment = service.update_payment(payment_id, data)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found",
        )
    return PaymentAPIResponse(success=True, data=payment)


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a payment",
    description="Delete a payment record."
)
async def delete_payment(
    payment_id: int,
    service: PaymentService = Depends(get_payment_service),
):
    if not service.delete_payment(payment_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found",
        )
    return None


@router.get(
    "/export",
    summary="Export payments to CSV",
    description="Export payments to CSV with optional filters.",
)
async def export_payments_csv(
    search: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None, alias="clientId"),
    supplier_id: Optional[int] = Query(None, alias="supplierId"),
    invoice_id: Optional[int] = Query(None, alias="invoiceId"),
    payment_type: Optional[PaymentType] = Query(None, alias="paymentType"),
    payment_mode_id: Optional[int] = Query(None, alias="paymentModeId"),
    society_id: Optional[int] = Query(None, alias="societyId"),
    date_from: Optional[datetime] = Query(None, alias="dateFrom"),
    date_to: Optional[datetime] = Query(None, alias="dateTo"),
    min_amount: Optional[Decimal] = Query(None, alias="minAmount"),
    max_amount: Optional[Decimal] = Query(None, alias="maxAmount"),
    service: PaymentService = Depends(get_payment_service),
):
    payments, _ = service.list_payments(
        page=1,
        page_size=100000,
        search=search,
        client_id=client_id,
        supplier_id=supplier_id,
        invoice_id=invoice_id,
        payment_type=payment_type,
        payment_mode_id=payment_mode_id,
        society_id=society_id,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        sort_by="paymentDate",
        sort_order="desc",
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Reference",
        "Type",
        "Client/Supplier",
        "Invoice",
        "Supplier Order",
        "Amount",
        "Currency",
        "Payment Date",
        "Payment Mode",
        "Status",
        "Society",
        "Notes",
    ])

    for p in payments:
        writer.writerow([
            p.reference,
            p.paymentType.value if hasattr(p.paymentType, "value") else p.paymentType,
            p.clientName or p.supplierName or "",
            p.invoiceReference or "",
            p.supplierOrderReference or "",
            f"{p.amount}",
            p.currencyCode or "",
            p.paymentDate.isoformat() if p.paymentDate else "",
            p.paymentModeName or "",
            p.statusName or "",
            p.societyName or "",
            p.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payments-export.csv"},
    )

"""
Accounting payment allocation endpoints.

These routes are module-scoped variants of payment allocation APIs and map to
ClientInvoicePayment records via PaymentAllocationService.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.payment_allocation import (
    AllocatePaymentRequest,
    PaymentListResponse,
    PaymentResponse,
    UnpaidInvoicesResponse,
    UnpaidInvoiceItem,
)
from app.services.payment_allocation_service import (
    PaymentAllocationService,
    PaymentAllocationError,
)

router = APIRouter(prefix="/accounting/payments", tags=["accounting-payments"])


@router.post(
    "/{invoice_id}/allocate",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Allocate payment to invoice",
    description="Create a payment allocation against one client invoice.",
)
async def allocate_payment(
    invoice_id: int,
    payload: AllocatePaymentRequest,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    service = PaymentAllocationService(db)
    target_invoice_id = payload.invoice_id or invoice_id
    if target_invoice_id != invoice_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path invoice_id and payload.invoice_id must match",
        )

    try:
        payment = service.allocate_payment(
            invoice_id=target_invoice_id,
            amount=payload.amount,
            comment=payload.comment,
            payment_date=payload.payment_date,
        )
        return PaymentResponse.model_validate(payment)
    except PaymentAllocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": exc.message, "error_code": exc.error_code},
        ) from exc


@router.get(
    "/invoice/{invoice_id}",
    response_model=PaymentListResponse,
    summary="List invoice payments",
    description="List all payments recorded for an invoice.",
)
async def list_invoice_payments(
    invoice_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    service = PaymentAllocationService(db)
    payments = service.list_payments_for_invoice(invoice_id)
    total_paid = service.get_total_paid_for_invoice(invoice_id)

    return PaymentListResponse(
        invoice_id=invoice_id,
        payments=[PaymentResponse.model_validate(item) for item in payments],
        total_paid=float(total_paid),
        count=len(payments),
    )


@router.get(
    "/clients/{client_id}/unpaid",
    response_model=UnpaidInvoicesResponse,
    summary="List client unpaid invoices",
    description="Return unpaid invoices and outstanding total for one client.",
)
async def list_client_unpaid_invoices(
    client_id: int,
    include_zero_balance: bool = Query(False, description="Include zero-balance invoices"),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    service = PaymentAllocationService(db)
    invoices = service.get_client_unpaid_invoices(client_id)

    if not include_zero_balance:
        invoices = [item for item in invoices if item["rest_to_pay"] > 0]

    return UnpaidInvoicesResponse(
        client_id=client_id,
        invoices=[UnpaidInvoiceItem(**item) for item in invoices],
        total_outstanding=sum(item["rest_to_pay"] for item in invoices),
        count=len(invoices),
    )

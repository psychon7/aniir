"""
Accounting API Router.

Provides endpoints for:
- Receivables aging report
- Payment allocation to invoices
- Payment retrieval
- Client unpaid invoices
- Customer statements

Uses synchronous Session with asyncio.to_thread() pattern.
"""
import asyncio
from datetime import date
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.accounting_service import AccountingService, get_accounting_service
from app.services.payment_allocation_service import (
    PaymentAllocationService,
    PaymentAllocationError,
    get_payment_allocation_service,
)
from app.services.statement_service import (
    StatementService,
    StatementServiceError,
    ClientNotFoundError,
    get_statement_service,
)
from app.schemas.accounting import (
    ReceivablesAgingResponse,
    CustomerStatementResponse,
)
from app.schemas.payment_allocation import (
    AllocatePaymentRequest,
    PaymentResponse,
    PaymentListResponse,
    UnpaidInvoicesResponse,
    UnpaidInvoiceItem,
)

router = APIRouter(prefix="/accounting", tags=["Accounting"])


# ==========================================================================
# Receivables Aging Report
# ==========================================================================

@router.get(
    "/receivables/aging",
    response_model=ReceivablesAgingResponse,
    summary="Get accounts receivable aging report",
    description="""
    Generate accounts receivable aging report.

    Categorizes outstanding receivables into aging buckets:
    - Current (not yet due)
    - 1-30 days past due
    - 31-60 days past due
    - 61-90 days past due
    - Over 90 days past due

    Returns summary totals and breakdown by client.
    """
)
async def get_receivables_aging(
    as_of_date: Optional[date] = Query(None, description="Calculate aging as of this date (default: today)"),
    society_id: Optional[int] = Query(None, description="Filter by company/society ID"),
    client_id: Optional[int] = Query(None, description="Filter by specific client"),
    min_amount: Optional[Decimal] = Query(None, description="Minimum outstanding amount"),
    include_invoices: bool = Query(False, description="Include invoice-level details"),
    currency_id: Optional[int] = Query(None, description="Filter by currency"),
    service: AccountingService = Depends(get_accounting_service),
):
    """Get accounts receivable aging report."""
    def _sync():
        return service.get_receivables_aging(
            as_of_date=as_of_date,
            society_id=society_id,
            client_id=client_id,
            min_amount=min_amount,
            include_invoices=include_invoices,
            currency_id=currency_id,
        )

    return await asyncio.to_thread(_sync)


# ==========================================================================
# Payment Allocation Endpoints
# ==========================================================================

@router.post(
    "/payments/allocate",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Allocate payment to invoice",
    description="""
    Record a payment against a specific invoice.

    Creates a ClientInvoicePayment record and updates the invoice's
    remaining balance and payment status.

    Validation rules:
    - Amount must be positive
    - Amount cannot exceed invoice remaining balance
    - Invoice must exist
    """
)
async def allocate_payment(
    request: AllocatePaymentRequest,
    service: PaymentAllocationService = Depends(get_payment_allocation_service),
):
    """Allocate a payment to an invoice."""
    def _sync():
        return service.allocate_payment(
            invoice_id=request.invoice_id,
            amount=request.amount,
            comment=request.comment,
            payment_date=request.payment_date,
        )

    try:
        payment = await asyncio.to_thread(_sync)
        return PaymentResponse.model_validate(payment)
    except PaymentAllocationError as e:
        if e.error_code == "INVOICE_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": e.message, "error_code": e.error_code}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "error_code": e.error_code}
        )


@router.get(
    "/payments/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment by ID",
    description="Retrieve a single payment record by its ID.",
    responses={
        200: {"description": "Payment found"},
        404: {"description": "Payment not found"},
    }
)
async def get_payment(
    payment_id: int = Path(..., description="Payment ID"),
    service: PaymentAllocationService = Depends(get_payment_allocation_service),
):
    """Get a payment by ID."""
    def _sync():
        return service.get_payment(payment_id)

    payment = await asyncio.to_thread(_sync)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )
    return PaymentResponse.model_validate(payment)


@router.get(
    "/invoices/{invoice_id}/payments",
    response_model=PaymentListResponse,
    summary="List payments for invoice",
    description="Get all payment records for a specific invoice.",
)
async def list_payments_for_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    service: PaymentAllocationService = Depends(get_payment_allocation_service),
):
    """List all payments for an invoice."""
    def _sync():
        payments = service.list_payments_for_invoice(invoice_id)
        total_paid = service.get_total_paid_for_invoice(invoice_id)
        return payments, total_paid

    payments, total_paid = await asyncio.to_thread(_sync)
    return PaymentListResponse(
        invoice_id=invoice_id,
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total_paid=float(total_paid),
        count=len(payments),
    )


# ==========================================================================
# Client Unpaid Invoices
# ==========================================================================

@router.get(
    "/clients/{client_id}/unpaid-invoices",
    response_model=UnpaidInvoicesResponse,
    summary="Get unpaid invoices for client",
    description="""
    Get all unpaid invoices for a specific client.

    Returns invoice details including remaining balance,
    total paid, and overdue status.
    """,
)
async def get_client_unpaid_invoices(
    client_id: int = Path(..., description="Client ID"),
    service: PaymentAllocationService = Depends(get_payment_allocation_service),
):
    """Get unpaid invoices for a client."""
    def _sync():
        return service.get_client_unpaid_invoices(client_id)

    invoices = await asyncio.to_thread(_sync)
    total_outstanding = sum(inv["rest_to_pay"] for inv in invoices)

    return UnpaidInvoicesResponse(
        client_id=client_id,
        invoices=[UnpaidInvoiceItem(**inv) for inv in invoices],
        total_outstanding=total_outstanding,
        count=len(invoices),
    )


# ==========================================================================
# Customer Statement
# ==========================================================================

@router.get(
    "/clients/{client_id}/statement",
    summary="Generate customer statement",
    description="""
    Generate a customer account statement for a date range.

    Includes:
    - Opening balance at start of period
    - All invoices issued during period (debits)
    - All payments received during period (credits)
    - Running balance after each transaction
    - Closing balance at end of period
    - Aging summary for outstanding invoices
    """,
    responses={
        200: {"description": "Statement generated successfully"},
        404: {"description": "Client not found"},
    }
)
async def get_customer_statement(
    client_id: int = Path(..., description="Client ID"),
    from_date: date = Query(..., description="Start date of statement period"),
    to_date: date = Query(..., description="End date of statement period"),
    include_paid: bool = Query(True, description="Include fully paid invoices"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    service: StatementService = Depends(get_statement_service),
):
    """Generate customer account statement."""
    def _sync():
        return service.generate_customer_statement(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date,
            include_paid_invoices=include_paid,
            society_id=society_id,
        )

    try:
        return await asyncio.to_thread(_sync)
    except ClientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found"
        )
    except StatementServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code}
        )

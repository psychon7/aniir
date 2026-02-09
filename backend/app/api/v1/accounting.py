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
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.database import get_db
from app.services.accounting_service import AccountingService, get_accounting_service
from app.services.payment_allocation_service import (
    PaymentAllocationService,
    PaymentAllocationError,
    get_payment_allocation_service,
)
from app.models.client import Client
from app.models.costplan import CostPlan
from app.models.order import ClientOrderLine
from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.models.invoice import ClientInvoice
from app.models.logistics import Logistic
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


@router.get(
    "/clients/{client_id}/statement/export/csv",
    summary="Export customer statement as CSV",
    description="Generate and export customer statement in CSV format for the selected period.",
    responses={
        200: {"description": "CSV exported successfully", "content": {"text/csv": {}}},
        404: {"description": "Client not found"},
    },
)
async def export_customer_statement_csv(
    client_id: int = Path(..., description="Client ID"),
    from_date: date = Query(..., description="Start date of statement period"),
    to_date: date = Query(..., description="End date of statement period"),
    include_paid: bool = Query(True, description="Include fully paid invoices"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    service: StatementService = Depends(get_statement_service),
):
    """Export customer statement as CSV."""
    def _sync():
        return service.export_customer_statement_csv(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date,
            include_paid_invoices=include_paid,
            society_id=society_id,
        )

    try:
        csv_result = await asyncio.to_thread(_sync)
        return Response(
            content=csv_result["data"],
            media_type=csv_result["content_type"],
            headers={"Content-Disposition": f'attachment; filename="{csv_result["filename"]}"'},
        )
    except ClientNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with ID {client_id} not found",
        )
    except StatementServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": e.message, "code": e.code},
        )


def _sync_dashboard_kpis(db: Session) -> dict:
    """
    Compute dashboard KPI counters for legacy widget parity.

    Includes:
    - active clients
    - quotes in progress (overall + current/previous month)
    - backorder lines
    - pending deliveries + pending invoicing
    - unpaid invoices + unpaid proformas
    - unshipped/arriving containers
    """
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    prev_month_start = datetime(now.year - 1, 12, 1) if now.month == 1 else datetime(now.year, now.month - 1, 1)

    active_clients = (
        db.execute(select(func.count(Client.cli_id)).where(Client.cli_isactive == True)).scalar() or 0
    )
    quotes_in_progress = (
        db.execute(select(func.count(CostPlan.cpl_id)).where(CostPlan.cst_id == 1)).scalar() or 0
    )
    quotes_recent_in_progress = (
        db.execute(
            select(func.count(CostPlan.cpl_id)).where(
                and_(CostPlan.cst_id == 1, CostPlan.cpl_d_creation >= prev_month_start)
            )
        ).scalar()
        or 0
    )

    delivered_qty_subq = (
        select(
            DeliveryFormLine.col_id.label("col_id"),
            func.coalesce(func.sum(DeliveryFormLine.dfl_quantity), 0).label("delivered_qty"),
        )
        .where(DeliveryFormLine.col_id.is_not(None))
        .group_by(DeliveryFormLine.col_id)
        .subquery()
    )
    backorder_lines = (
        db.execute(
            select(func.count(ClientOrderLine.col_id)).outerjoin(
                delivered_qty_subq, ClientOrderLine.col_id == delivered_qty_subq.c.col_id
            ).where(
                func.coalesce(ClientOrderLine.col_quantity, 0) > func.coalesce(delivered_qty_subq.c.delivered_qty, 0)
            )
        ).scalar()
        or 0
    )

    pending_deliveries = (
        db.execute(
            select(func.count(DeliveryForm.dfo_id)).where(
                func.coalesce(DeliveryForm.dfo_deliveried, False) == False
            )
        ).scalar()
        or 0
    )

    pending_invoicing = (
        db.execute(
            select(func.count(DeliveryForm.dfo_id))
            .outerjoin(ClientInvoice, ClientInvoice.dfo_id == DeliveryForm.dfo_id)
            .where(ClientInvoice.cin_id.is_(None))
        ).scalar()
        or 0
    )

    unpaid_invoices = (
        db.execute(
            select(func.count(ClientInvoice.cin_id)).where(
                and_(
                    ClientInvoice.cin_isinvoice == True,
                    func.coalesce(ClientInvoice.cin_rest_to_pay, 0) > 0,
                )
            )
        ).scalar()
        or 0
    )

    # Legacy parity approximation: unpaid proformas are non-invoice docs with outstanding balance.
    unpaid_proformas = (
        db.execute(
            select(func.count(ClientInvoice.cin_id)).where(
                and_(
                    ClientInvoice.cin_isinvoice == False,
                    func.coalesce(ClientInvoice.cin_rest_to_pay, 0) > 0,
                )
            )
        ).scalar()
        or 0
    )

    unshipped_containers = (
        db.execute(
            select(func.count(Logistic.lgs_id)).where(
                func.coalesce(Logistic.lgs_is_send, False) == False
            )
        ).scalar()
        or 0
    )
    arriving_containers = (
        db.execute(
            select(func.count(Logistic.lgs_id)).where(
                and_(
                    func.coalesce(Logistic.lgs_is_send, False) == True,
                    func.coalesce(Logistic.lgs_is_received, False) == False,
                )
            )
        ).scalar()
        or 0
    )

    quote_status_rows = db.execute(
        select(CostPlan.cst_id, func.count(CostPlan.cpl_id).label("count"))
        .group_by(CostPlan.cst_id)
        .order_by(CostPlan.cst_id)
    ).all()

    return {
        "generatedAt": now.isoformat(),
        "activeClients": int(active_clients),
        "quotesInProgress": int(quotes_in_progress),
        "quotesRecentInProgress": int(quotes_recent_in_progress),
        "backorderLines": int(backorder_lines),
        "pendingDeliveries": int(pending_deliveries),
        "pendingInvoicing": int(pending_invoicing),
        "unpaidInvoices": int(unpaid_invoices),
        "unpaidProformas": int(unpaid_proformas),
        "unshippedContainers": int(unshipped_containers),
        "arrivingContainers": int(arriving_containers),
        "quoteStatusBreakdown": [
            {"statusId": int(r.cst_id), "count": int(r.count)} for r in quote_status_rows
        ],
    }


@router.get(
    "/dashboard/kpis",
    summary="Get dashboard KPI summary",
    description="Returns legacy-style dashboard KPI counters for widgets.",
)
async def get_dashboard_kpis(
    db: Session = Depends(get_db),
):
    """Get dashboard KPI summary used by the main dashboard widgets."""
    return await asyncio.to_thread(_sync_dashboard_kpis, db)

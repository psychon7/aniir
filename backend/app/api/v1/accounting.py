"""
Accounting API Router.

Provides endpoints for:
- Payment allocation to invoices
- Auto-allocation using FIFO
- Accounts receivable aging report
- Customer statements
- Accounting summary/dashboard
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.accounting_service import AccountingService, get_accounting_service
from app.schemas.accounting import (
    AllocatePaymentRequest,
    AllocatePaymentResponse,
    ReceivablesAgingResponse,
    CustomerStatementRequest,
    CustomerStatementResponse,
    AccountingSummaryResponse,
    UpdateInvoiceStatusesResponse,
    ErrorResponse,
    APIResponse
)
from app.utils.exceptions import (
    BusinessError,
    EntityNotFoundError,
    InsufficientFundsError,
    AllocationError,
    InvoiceAlreadyPaidError,
    ValidationError
)

router = APIRouter(prefix="/accounting", tags=["Accounting"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_business_error(error: BusinessError) -> HTTPException:
    """Convert BusinessError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, EntityNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, InsufficientFundsError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, (AllocationError, InvoiceAlreadyPaidError)):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(error, ValidationError):
        status_code = status.HTTP_400_BAD_REQUEST

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
# Payment Allocation Endpoints
# ==========================================================================

@router.post(
    "/payments/{payment_id}/allocate",
    response_model=AllocatePaymentResponse,
    responses={
        200: {"description": "Payment allocated successfully"},
        404: {"model": ErrorResponse, "description": "Payment or invoice not found"},
        409: {"model": ErrorResponse, "description": "Allocation conflict"},
        422: {"model": ErrorResponse, "description": "Insufficient funds"}
    },
    summary="Allocate payment to invoices",
    description="""
    Allocate a payment to one or more invoices.

    The allocation will:
    - Deduct from the payment's unallocated amount
    - Add to each invoice's paid amount
    - Update invoice status based on payment coverage

    Validation rules:
    - Total allocation cannot exceed payment's unallocated amount
    - Individual allocation cannot exceed invoice's balance due
    - Cannot allocate to fully paid invoices
    """
)
async def allocate_payment(
    payment_id: int,
    request: AllocatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Allocate a payment to one or more invoices."""
    service = get_accounting_service(db)

    try:
        allocations = [
            {"invoice_id": a.invoice_id, "amount": a.amount}
            for a in request.allocations
        ]
        result = await service.allocate_payment(
            payment_id=payment_id,
            allocations=allocations,
            user_id=None  # TODO: current_user.id
        )

        return AllocatePaymentResponse(
            success=True,
            **result
        )

    except BusinessError as e:
        raise handle_business_error(e)


@router.post(
    "/payments/{payment_id}/auto-allocate",
    response_model=AllocatePaymentResponse,
    responses={
        200: {"description": "Payment auto-allocated successfully"},
        404: {"model": ErrorResponse, "description": "Payment not found"}
    },
    summary="Auto-allocate payment using FIFO",
    description="""
    Automatically allocate payment to the client's oldest unpaid invoices.

    Uses FIFO (First-In, First-Out) strategy:
    - Starts with the oldest unpaid invoice
    - Allocates as much as possible
    - Continues to next oldest until payment is fully allocated
    """
)
async def auto_allocate_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Auto-allocate payment to oldest unpaid invoices."""
    service = get_accounting_service(db)

    try:
        result = await service.auto_allocate_payment(
            payment_id=payment_id,
            user_id=None  # TODO: current_user.id
        )

        return AllocatePaymentResponse(
            success=True,
            **result
        )

    except BusinessError as e:
        raise handle_business_error(e)


# ==========================================================================
# Receivables Aging Report
# ==========================================================================

@router.get(
    "/receivables-aging",
    response_model=ReceivablesAgingResponse,
    summary="Get accounts receivable aging report",
    description="""
    Generate accounts receivable aging report.

    Categorizes outstanding receivables into aging buckets:
    - Current (0-30 days past due)
    - 31-60 days past due
    - 61-90 days past due
    - Over 90 days past due

    Returns summary totals and breakdown by client.
    """
)
async def get_receivables_aging(
    company_id: Optional[int] = Query(None, description="Filter by company/society ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    as_of_date: Optional[date] = Query(None, description="Calculate aging as of this date (default: today)"),
    db: AsyncSession = Depends(get_db)
):
    """Get accounts receivable aging report."""
    service = get_accounting_service(db)

    result = await service.get_receivables_aging(
        company_id=company_id,
        bu_id=bu_id,
        as_of_date=as_of_date
    )

    return ReceivablesAgingResponse(
        success=True,
        **result
    )


# ==========================================================================
# Customer Statement
# ==========================================================================

@router.get(
    "/customers/{client_id}/statement",
    response_model=CustomerStatementResponse,
    responses={
        200: {"description": "Statement generated successfully"},
        404: {"model": ErrorResponse, "description": "Client not found"}
    },
    summary="Generate customer statement",
    description="""
    Generate a customer account statement for a date range.

    Includes:
    - Opening balance at start of period
    - All invoices issued during period (debits)
    - All payments received during period (credits)
    - Running balance after each transaction
    - Closing balance at end of period
    """
)
async def get_customer_statement(
    client_id: int,
    from_date: date = Query(..., description="Start date of statement period"),
    to_date: date = Query(..., description="End date of statement period"),
    db: AsyncSession = Depends(get_db)
):
    """Generate customer account statement."""
    service = get_accounting_service(db)

    try:
        result = await service.get_customer_statement(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date
        )

        return CustomerStatementResponse(
            success=True,
            **result
        )

    except EntityNotFoundError as e:
        raise handle_business_error(e)


@router.post(
    "/customers/{client_id}/statement/email",
    response_model=APIResponse,
    responses={
        200: {"description": "Statement email queued"},
        404: {"model": ErrorResponse, "description": "Client not found"}
    },
    summary="Email customer statement",
    description="Generate customer statement and email it to the client."
)
async def email_customer_statement(
    client_id: int,
    from_date: date = Query(..., description="Start date of statement period"),
    to_date: date = Query(..., description="End date of statement period"),
    db: AsyncSession = Depends(get_db)
):
    """Generate and email customer statement."""
    service = get_accounting_service(db)

    try:
        # Verify client exists
        result = await service.get_customer_statement(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date
        )

        # TODO: Queue email task with statement PDF
        # from app.tasks.email_tasks import send_statement_email
        # send_statement_email.delay(client_id, from_date, to_date)

        return APIResponse(
            success=True,
            message=f"Statement email queued for {result['client']['company_name']}"
        )

    except EntityNotFoundError as e:
        raise handle_business_error(e)


# ==========================================================================
# Accounting Summary / Dashboard
# ==========================================================================

@router.get(
    "/summary",
    response_model=AccountingSummaryResponse,
    summary="Get accounting dashboard summary",
    description="""
    Get key accounting metrics for the dashboard.

    Returns:
    - Total outstanding receivables
    - Total overdue amount
    - Unallocated payments
    - Invoice counts by status
    - Collection rate percentage
    """
)
async def get_accounting_summary(
    company_id: Optional[int] = Query(None, description="Filter by company/society ID"),
    bu_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get accounting dashboard summary."""
    service = get_accounting_service(db)

    result = await service.get_accounting_summary(
        company_id=company_id,
        bu_id=bu_id
    )

    return AccountingSummaryResponse(
        success=True,
        **result
    )


# ==========================================================================
# Invoice Status Management
# ==========================================================================

@router.get(
    "/invoices/{invoice_id}/status",
    response_model=APIResponse,
    responses={
        200: {"description": "Status calculated successfully"},
        404: {"model": ErrorResponse, "description": "Invoice not found"}
    },
    summary="Calculate invoice status",
    description="""
    Calculate and return the current status of an invoice.

    Status logic:
    - DRAFT: Not yet sent
    - SENT: Sent but not paid
    - PARTIAL: Partially paid
    - PAID: Fully paid
    - OVERDUE: Past due date and not fully paid
    """
)
async def get_invoice_status(
    invoice_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Calculate current invoice status."""
    service = get_accounting_service(db)

    try:
        status = await service.calculate_invoice_status(invoice_id)

        return APIResponse(
            success=True,
            data={"invoice_id": invoice_id, "status": status}
        )

    except EntityNotFoundError as e:
        raise handle_business_error(e)


@router.post(
    "/invoices/update-statuses",
    response_model=UpdateInvoiceStatusesResponse,
    summary="Bulk update invoice statuses",
    description="""
    Update statuses for all unpaid invoices.

    This endpoint should be called daily via scheduled task to:
    - Mark overdue invoices as OVERDUE
    - Update partial payment statuses
    - Mark fully paid invoices as PAID
    """
)
async def update_invoice_statuses(
    db: AsyncSession = Depends(get_db)
):
    """Bulk update invoice statuses."""
    service = get_accounting_service(db)

    result = await service.update_invoice_statuses()

    total_updated = sum(result.values())

    return UpdateInvoiceStatusesResponse(
        success=True,
        updated_counts=result,
        message=f"Updated {total_updated} invoices"
    )

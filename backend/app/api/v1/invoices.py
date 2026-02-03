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
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pathlib import Path as FilePath
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.invoice import ClientInvoice
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
    CreateInvoiceFromOrderRequest, CreateInvoiceFromOrderResponse
)

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


# ==========================================================================
# Sync Database Helper
# ==========================================================================


def _sync_list_invoices(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    status_id: Optional[int] = None,
    sort_by: str = "cin_d_creation",
    sort_order: str = "desc"
):
    """Sync function to list invoices with pagination."""
    query = select(ClientInvoice)
    count_query = select(func.count(ClientInvoice.cin_id))
    
    conditions = []
    
    if search:
        search_term = f"%{search}%"
        conditions.append(ClientInvoice.cin_code.ilike(search_term))
    
    if client_id:
        conditions.append(ClientInvoice.cli_id == client_id)
    
    if status_id:
        conditions.append(ClientInvoice.sta_id == status_id)
    
    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
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
    invoices = list(result.scalars().all())
    
    return invoices, total


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
# Invoice CRUD Endpoints
# ==========================================================================


@router.get(
    "",
    response_model=InvoiceListPaginatedResponse,
    summary="List invoices with pagination",
    description="Get a paginated list of invoices with optional filters."
)
async def list_invoices(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, description="Search by invoice code"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    sort_by: str = Query("cin_d_creation", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """List invoices with pagination."""
    invoices, total = await asyncio.to_thread(
        _sync_list_invoices, db, page, page_size, search, client_id, status_id, sort_by, sort_order
    )
    
    items = [InvoiceResponse.model_validate(inv) for inv in invoices]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return InvoiceListPaginatedResponse(
        success=True,
        data=items,
        page=page,
        pageSize=page_size,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1
    )


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
    service = get_invoice_service(db)

    # Use default request if none provided
    if request is None:
        request = CreateInvoiceFromOrderRequest()

    try:
        invoice, order_reference = await service.create_invoice_from_order(
            order_id=order_id,
            request=request,
            created_by=None  # TODO: current_user_id
        )

        return CreateInvoiceFromOrderResponse(
            success=True,
            invoice_id=invoice.inv_id,
            invoice_reference=invoice.inv_reference,
            order_id=order_id,
            order_reference=order_reference,
            created_at=invoice.inv_created_at,
            lines_converted=len(invoice.lines) if invoice.lines else 0,
            total_amount=invoice.inv_total_amount,
            message=f"Invoice {invoice.inv_reference} created successfully from order {order_id}"
        )
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


@router.get(
    "",
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


@router.get(
    "/{invoice_id}",
    response_model=InvoiceDetailResponse,
    summary="Get invoice details",
    description="Get an invoice by ID with all line items and resolved lookup names.",
    responses={
        200: {"description": "Invoice found"},
        404: {"model": InvoiceErrorResponse, "description": "Invoice not found"}
    }
)
async def get_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    db: Session = Depends(get_db)
):
    """Get invoice by ID with resolved lookup names."""
    service = get_invoice_service(db)

    try:
        return await service.get_invoice_detail(invoice_id)
    except InvoiceNotFoundError as e:
        raise handle_invoice_error(e)


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
        return await service.update_invoice(invoice_id, data)
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
        return await service.update_invoice_line(line_id, data)
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
        await service.delete_invoice_line(line_id)
    except InvoiceServiceError as e:
        raise handle_invoice_error(e)


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
        invoice = await service.send_invoice(invoice_id)

        # TODO: Actually send email if requested
        email_to = request.email_to if request else "client@example.com"

        return SendInvoiceResponse(
            success=True,
            invoice_id=invoice.inv_id,
            sent_to=email_to,
            sent_at=datetime.now(),
            message="Invoice marked as sent"
        )
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

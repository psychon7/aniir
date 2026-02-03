"""
Supplier Invoice API Router.

Provides REST API endpoints for:
- Supplier Invoice CRUD operations
- Invoice line management
- Payment tracking (mark paid/unpaid)
- Production status management
- Search and filtering with pagination
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
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
    SupplierInvoiceCreate, SupplierInvoiceUpdate, SupplierInvoiceResponse,
    SupplierInvoiceDetailResponse, SupplierInvoiceListPaginatedResponse,
    SupplierInvoiceSearchParams,
    SupplierInvoiceLineCreate, SupplierInvoiceLineUpdate, SupplierInvoiceLineResponse,
    MarkPaidRequest, MarkPaidResponse,
    MarkUnpaidRequest, MarkUnpaidResponse,
    StartProductionRequest, StartProductionResponse,
    CompleteProductionRequest, CompleteProductionResponse,
    SupplierInvoiceAPIResponse, SupplierInvoiceErrorResponse
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
# Supplier Invoice CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=SupplierInvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier invoice",
    description="""
    Create a new supplier invoice in the system.

    A unique invoice code will be automatically generated if not provided.
    Lines can be included in the creation request.
    Optionally link to an existing supplier order via sod_id.
    """
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
    response_model=SupplierInvoiceListPaginatedResponse,
    summary="List all supplier invoices",
    description="""
    Get a paginated list of all supplier invoices with optional filtering.

    Supports filtering by:
    - Text search (code, name)
    - Supplier ID
    - Society ID
    - Currency ID
    - Supplier order ID
    - Payment status
    - Production status
    - Creation date range
    - Creator ID
    """
)
async def list_supplier_invoices(
    # Pagination (frontend style)
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    # Legacy pagination
    skip: Optional[int] = Query(None, ge=0, description="Number of records to skip (legacy)"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum records to return (legacy)"),
    # Filters
    search: Optional[str] = Query(None, max_length=100, description="Search term (code, name)"),
    supplier_id: Optional[int] = Query(None, alias="supplierId", description="Filter by supplier ID"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society ID"),
    currency_id: Optional[int] = Query(None, alias="currencyId", description="Filter by currency ID"),
    supplier_order_id: Optional[int] = Query(None, alias="supplierOrderId", description="Filter by supplier order ID"),
    is_paid: Optional[bool] = Query(None, alias="isPaid", description="Filter by paid status"),
    production_started: Optional[bool] = Query(None, alias="productionStarted", description="Filter by production started"),
    production_complete: Optional[bool] = Query(None, alias="productionComplete", description="Filter by production complete"),
    date_from: Optional[datetime] = Query(None, alias="dateFrom", description="Filter by creation date from"),
    date_to: Optional[datetime] = Query(None, alias="dateTo", description="Filter by creation date to"),
    creator_id: Optional[int] = Query(None, alias="creatorId", description="Filter by creator ID"),
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """List all supplier invoices with pagination and filtering."""
    # Convert page/pageSize to skip/limit if not using legacy params
    actual_skip = skip if skip is not None else (page - 1) * pageSize
    actual_limit = limit if limit is not None else pageSize

    search_params = SupplierInvoiceSearchParams(
        search=search,
        supplier_id=supplier_id,
        society_id=society_id,
        currency_id=currency_id,
        supplier_order_id=supplier_order_id,
        is_paid=is_paid,
        production_started=production_started,
        production_complete=production_complete,
        date_from=date_from,
        date_to=date_to,
        creator_id=creator_id
    )

    invoices, total = await service.list_invoices(
        skip=actual_skip,
        limit=actual_limit,
        search_params=search_params
    )

    # Calculate pagination info
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1

    return SupplierInvoiceListPaginatedResponse(
        success=True,
        data=[SupplierInvoiceResponse.model_validate(i) for i in invoices],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )


@router.get(
    "/{invoice_id}",
    response_model=SupplierInvoiceDetailResponse,
    summary="Get supplier invoice by ID",
    description="Get detailed information about a specific supplier invoice with lines and resolved lookup names."
)
async def get_supplier_invoice(
    invoice_id: int = Path(..., gt=0, description="Supplier invoice ID"),
    service: SupplierInvoiceService = Depends(get_supplier_invoice_service)
):
    """Get a specific supplier invoice by ID with resolved lookup names."""
    try:
        invoice_detail = await service.get_invoice_detail(invoice_id)
        return invoice_detail
    except SupplierInvoiceServiceError as e:
        raise handle_supplier_invoice_error(e)


@router.put(
    "/{invoice_id}",
    response_model=SupplierInvoiceResponse,
    summary="Update a supplier invoice",
    description="Update an existing supplier invoice's information."
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

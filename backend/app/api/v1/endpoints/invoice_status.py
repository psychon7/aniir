"""
Invoice Status API Endpoints

Endpoints for calculating and updating invoice statuses.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.invoice_status_service import (
    calculate_invoice_status,
    update_invoice_status,
    batch_update_invoice_statuses,
    InvoiceStatusResult
)
from app.schemas.invoice_status import (
    InvoiceStatusResponse,
    InvoiceStatusUpdateRequest,
    BatchInvoiceStatusUpdateRequest,
    BatchInvoiceStatusUpdateResponse
)

router = APIRouter()


@router.get("/{invoice_id}", response_model=InvoiceStatusResponse)
def get_invoice_status(
    invoice_id: int,
    db: Session = Depends(get_db)
) -> InvoiceStatusResponse:
    """
    Calculate the current status of an invoice.
    
    Returns the calculated status based on payment state and due date,
    without updating the database.
    """
    try:
        result = calculate_invoice_status(db, invoice_id)
        return InvoiceStatusResponse(
            status_code=result.status_code.value,
            status_id=result.status_id,
            total_paid=result.total_paid,
            remaining_amount=result.remaining_amount,
            is_overdue=result.is_overdue,
            days_overdue=result.days_overdue,
            payment_percentage=result.payment_percentage
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{invoice_id}/update", response_model=InvoiceStatusResponse)
def update_single_invoice_status(
    invoice_id: int,
    db: Session = Depends(get_db)
) -> InvoiceStatusResponse:
    """
    Calculate and update the status of a single invoice.
    
    Updates the invoice's status_id in the database based on
    current payment state and due date.
    """
    try:
        result = update_invoice_status(db, invoice_id)
        return InvoiceStatusResponse(
            status_code=result.status_code.value,
            status_id=result.status_id,
            total_paid=result.total_paid,
            remaining_amount=result.remaining_amount,
            is_overdue=result.is_overdue,
            days_overdue=result.days_overdue,
            payment_percentage=result.payment_percentage
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/batch-update", response_model=BatchInvoiceStatusUpdateResponse)
def batch_update_statuses(
    request: BatchInvoiceStatusUpdateRequest,
    db: Session = Depends(get_db)
) -> BatchInvoiceStatusUpdateResponse:
    """
    Update statuses for multiple invoices.
    
    If invoice_ids is not provided, updates all invoices that are not
    in final states (PAID, CANCELLED, CREDITED).
    """
    results = batch_update_invoice_statuses(db, request.invoice_ids)
    
    response_results = {
        inv_id: InvoiceStatusResponse(
            status_code=result.status_code.value,
            status_id=result.status_id,
            total_paid=result.total_paid,
            remaining_amount=result.remaining_amount,
            is_overdue=result.is_overdue,
            days_overdue=result.days_overdue,
            payment_percentage=result.payment_percentage
        )
        for inv_id, result in results.items()
    }
    
    return BatchInvoiceStatusUpdateResponse(
        updated_count=len(results),
        results=response_results
    )

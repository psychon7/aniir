"""
Payments API Router.

Provides REST API endpoints for:
- Payment CRUD operations
- Payment search and filtering
- Payment statistics
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.payment_service import PaymentService, get_payment_service
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


# ==========================================================================
# CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new payment",
    description="Record a new payment for a client or supplier."
)
async def create_payment(
    data: PaymentCreate,
    service: PaymentService = Depends(get_payment_service)
):
    """Create a new payment record."""
    payment = service.create_payment(data)
    return payment


@router.get(
    "",
    response_model=PaymentListResponse,
    summary="List payments",
    description="Get a paginated list of payments with optional filtering."
)
async def list_payments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier ID"),
    payment_type: Optional[str] = Query(None, pattern="^(CLIENT|SUPPLIER)$", description="Filter by payment type"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    date_from: Optional[datetime] = Query(None, description="Filter payments from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter payments until this date"),
    service: PaymentService = Depends(get_payment_service)
):
    """List payments with pagination and filtering."""
    payments, total = service.list_payments(
        page=page,
        page_size=page_size,
        client_id=client_id,
        supplier_id=supplier_id,
        payment_type=payment_type,
        society_id=society_id,
        date_from=date_from,
        date_to=date_to
    )

    total_pages = (total + page_size - 1) // page_size

    return PaymentListResponse(
        items=payments,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get payment by ID",
    description="Retrieve a single payment by its ID."
)
async def get_payment(
    payment_id: int,
    service: PaymentService = Depends(get_payment_service)
):
    """Get a payment by ID."""
    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )
    return payment


@router.get(
    "/by-reference/{reference}",
    response_model=PaymentResponse,
    summary="Get payment by reference",
    description="Retrieve a single payment by its reference number."
)
async def get_payment_by_reference(
    reference: str,
    service: PaymentService = Depends(get_payment_service)
):
    """Get a payment by reference."""
    payment = service.get_payment_by_reference(reference)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with reference {reference} not found"
        )
    return payment


@router.put(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Update a payment",
    description="Update an existing payment record."
)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    service: PaymentService = Depends(get_payment_service)
):
    """Update a payment."""
    from app.models.payment import Payment

    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(payment, field):
            setattr(payment, field, value)

    payment.pay_updated_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)

    return payment


@router.delete(
    "/{payment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a payment",
    description="Delete a payment record."
)
async def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    service: PaymentService = Depends(get_payment_service)
):
    """Delete a payment."""
    from app.models.payment import Payment

    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found"
        )

    db.delete(payment)
    db.commit()

    return None


# ==========================================================================
# Statistics Endpoints
# ==========================================================================

@router.get(
    "/stats/summary",
    summary="Get payment statistics",
    description="Get summary statistics for payments."
)
async def get_payment_stats(
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    date_from: Optional[datetime] = Query(None, description="Start date for statistics"),
    date_to: Optional[datetime] = Query(None, description="End date for statistics"),
    db: Session = Depends(get_db)
):
    """Get payment statistics."""
    from sqlalchemy import func
    from app.models.payment import Payment

    query = db.query(
        func.count(Payment.pay_id).label('total_count'),
        func.sum(Payment.pay_amount).label('total_amount'),
    )

    if society_id:
        query = query.filter(Payment.pay_society_id == society_id)
    if date_from:
        query = query.filter(Payment.pay_date >= date_from)
    if date_to:
        query = query.filter(Payment.pay_date <= date_to)

    result = query.first()

    # Get breakdown by type
    type_query = db.query(
        Payment.pay_type,
        func.count(Payment.pay_id).label('count'),
        func.sum(Payment.pay_amount).label('amount'),
    ).group_by(Payment.pay_type)

    if society_id:
        type_query = type_query.filter(Payment.pay_society_id == society_id)
    if date_from:
        type_query = type_query.filter(Payment.pay_date >= date_from)
    if date_to:
        type_query = type_query.filter(Payment.pay_date <= date_to)

    type_breakdown = {
        row.pay_type: {'count': row.count, 'amount': float(row.amount or 0)}
        for row in type_query.all()
    }

    return {
        'total_count': result.total_count or 0,
        'total_amount': float(result.total_amount or 0),
        'by_type': type_breakdown
    }


# ==========================================================================
# Client Payment Endpoints
# ==========================================================================

@router.get(
    "/client/{client_id}",
    response_model=PaymentListResponse,
    summary="Get payments for a client",
    description="Get all payments for a specific client."
)
async def get_client_payments(
    client_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: PaymentService = Depends(get_payment_service)
):
    """Get payments for a specific client."""
    payments, total = service.list_payments(
        page=page,
        page_size=page_size,
        client_id=client_id,
        payment_type="CLIENT"
    )

    total_pages = (total + page_size - 1) // page_size

    return PaymentListResponse(
        items=payments,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# ==========================================================================
# Supplier Payment Endpoints
# ==========================================================================

@router.get(
    "/supplier/{supplier_id}",
    response_model=PaymentListResponse,
    summary="Get payments for a supplier",
    description="Get all payments for a specific supplier."
)
async def get_supplier_payments(
    supplier_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: PaymentService = Depends(get_payment_service)
):
    """Get payments for a specific supplier."""
    payments, total = service.list_payments(
        page=page,
        page_size=page_size,
        supplier_id=supplier_id,
        payment_type="SUPPLIER"
    )

    total_pages = (total + page_size - 1) // page_size

    return PaymentListResponse(
        items=payments,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

"""
Payment API endpoints including allocation.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.schemas.payment_allocation import (
    PaymentAllocationRequest,
    PaymentAllocationResponse,
    PaymentWithAllocations,
    ErrorResponse,
)
from app.services.payment_allocation_service import (
    PaymentAllocationService,
    PaymentAllocationError,
)

router = APIRouter(prefix="/accounting/payments", tags=["accounting-payments"])


@router.post(
    "/{id}/allocate",
    response_model=PaymentAllocationResponse,
    status_code=status.HTTP_200_OK,
    summary="Allocate payment to invoices",
    description="""
    Allocate a payment to one or more invoices.
    
    **Business Rules:**
    - Total allocation cannot exceed the payment amount
    - Each invoice allocation cannot exceed the invoice's balance due
    - Invoice must belong to the same client as the payment
    - Payment is marked as fully allocated when all funds are distributed
    - Invoice balances are automatically updated
    
    **Example Request:**
    
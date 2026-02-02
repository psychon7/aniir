"""
Payment Allocation Service.
Handles business logic for allocating payments to invoices.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentAllocation
from app.models.invoice import ClientInvoice
from app.schemas.payment_allocation import (
    PaymentAllocationRequest,
    PaymentAllocationResponse,
    AllocationResultItem,
    AllocationItem,
    PaymentWithAllocations,
    PaymentAllocationDetail,
)


class PaymentAllocationError(Exception):
    """Custom exception for payment allocation errors."""
    def __init__(self, message: str, error_code: str = "ALLOCATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class PaymentAllocationService:
    """Service for managing payment allocations."""

    def __init__(self, db: Session):
        self.db = db

    def get_payment_by_id(self, payment_id: int) -> Optional[Payment]:
        """Retrieve a payment by ID."""
        stmt = select(Payment).where(Payment.pay_id == payment_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_invoice_by_id(self, invoice_id: int) -> Optional[ClientInvoice]:
        """Retrieve an invoice by ID."""
        stmt = select(ClientInvoice).where(ClientInvoice.inv_id == invoice_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_total_allocated_for_payment(self, payment_id: int) -> Decimal:
        """Get total amount already allocated for a payment."""
        stmt = select(func.coalesce(func.sum(PaymentAllocation.pal_amount), Decimal("0.00"))).where(
            PaymentAllocation.pal_payment_id == payment_id
        )
        result = self.db.execute(stmt)
        return result.scalar() or Decimal("0.00")

    def get_payment_allocations(self, payment_id: int) -> List[PaymentAllocation]:
        """Get all allocations for a payment."""
        stmt = select(PaymentAllocation).where(
            PaymentAllocation.pal_payment_id == payment_id
        ).order_by(PaymentAllocation.pal_allocated_at)
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def validate_allocation_request(
        self, 
        payment: Payment, 
        request: PaymentAllocationRequest
    ) -> Tuple[Decimal, List[Tuple[ClientInvoice, AllocationItem]]]:
        """
        Validate the allocation request.
        Returns total allocation amount and list of (invoice, allocation_item) tuples.
        Raises PaymentAllocationError on validation failure.
        """
        # Calculate total requested allocation
        total_requested = sum(a.amount for a in request.allocations)
        
        # Get current allocated amount
        already_allocated = self.get_total_allocated_for_payment(payment.pay_id)
        available_amount = payment.pay_amount - already_allocated
        
        # Check if payment has enough unallocated funds
        if total_requested > available_amount:
            raise PaymentAllocationError(
                f"Requested allocation ({total_requested}) exceeds available payment amount ({available_amount})",
                "INSUFFICIENT_PAYMENT_AMOUNT"
            )
        
        # Validate each invoice and collect them
        invoice_allocations: List[Tuple[ClientInvoice, AllocationItem]] = []
        
        for alloc_item in request.allocations:
            invoice = self.get_invoice_by_id(alloc_item.invoice_id)
            
            if not invoice:
                raise PaymentAllocationError(
                    f"Invoice with ID {alloc_item.invoice_id} not found",
                    "INVOICE_NOT_FOUND"
                )
            
            # Verify invoice belongs to same client as payment
            if invoice.inv_client_id != payment.pay_client_id:
                raise PaymentAllocationError(
                    f"Invoice {invoice.inv_reference} does not belong to the same client as the payment",
                    "CLIENT_MISMATCH"
                )
            
            # Check if allocation amount exceeds invoice balance
            if alloc_item.amount > invoice.inv_balance_due:
                raise PaymentAllocationError(
                    f"Allocation amount ({alloc_item.amount}) exceeds invoice {invoice.inv_reference} balance ({invoice.inv_balance_due})",
                    "EXCEEDS_INVOICE_BALANCE"
                )
            
            invoice_allocations.append((invoice, alloc_item))
        
        return total_requested, invoice_allocations

    def allocate_payment(
        self, 
        payment_id: int, 
        request: PaymentAllocationRequest,
        user_id: Optional[int] = None
    ) -> PaymentAllocationResponse:
        """
        Allocate a payment to one or more invoices.
        
        Business Rules:
        1. Payment must exist
        2. Total allocation cannot exceed payment amount
        3. Each invoice allocation cannot exceed invoice balance
        4. Invoice must belong to same client as payment
        5. Updates invoice paid amount and balance
        6. Marks payment as fully allocated when appropriate
        """
        # Get payment
        payment = self.get_payment_by_id(payment_id)
        if not payment:
            raise PaymentAllocationError(
                f"Payment with ID {payment_id} not found",
                "PAYMENT_NOT_FOUND"
            )
        
        # Validate request
        total_requested, invoice_allocations = self.validate_allocation_request(payment, request)
        
        # Get current allocation state
        already_allocated = self.get_total_allocated_for_payment(payment_id)
        
        # Process allocations
        allocation_results: List[AllocationResultItem] = []
        
        for invoice, alloc_item in invoice_allocations:
            balance_before = invoice.inv_balance_due
            
            # Create allocation record
            allocation = PaymentAllocation(
                pal_payment_id=payment_id,
                pal_invoice_id=invoice.inv_id,
                pal_amount=alloc_item.amount,
                pal_allocated_at=datetime.utcnow(),
                pal_allocated_by=user_id,
                pal_notes=alloc_item.notes
            )
            self.db.add(allocation)
            
            # Update invoice amounts
            invoice.inv_amount_paid = invoice.inv_amount_paid + alloc_item.amount
            invoice.inv_balance_due = invoice.inv_balance_due - alloc_item.amount
            invoice.inv_updated_at = datetime.utcnow()
            
            # Check if invoice is fully paid and update status if needed
            invoice_fully_paid = invoice.inv_balance_due <= Decimal("0.00")
            
            # Add to results
            allocation_results.append(AllocationResultItem(
                invoice_id=invoice.inv_id,
                invoice_reference=invoice.inv_reference,
                allocated_amount=alloc_item.amount,
                invoice_balance_before=balance_before,
                invoice_balance_after=invoice.inv_balance_due,
                invoice_fully_paid=invoice_fully_paid
            ))
        
        # Calculate new totals
        new_total_allocated = already_allocated + total_requested
        remaining_unallocated = payment.pay_amount - new_total_allocated
        payment_fully_allocated = remaining_unallocated <= Decimal("0.00")
        
        # Update payment allocation status
        payment.pay_is_allocated = payment_fully_allocated
        payment.pay_updated_at = datetime.utcnow()
        payment.pay_updated_by = user_id
        
        # Commit transaction
        self.db.commit()
        
        return PaymentAllocationResponse(
            payment_id=payment_id,
            payment_reference=payment.pay_reference,
            total_allocated=new_total_allocated,
            remaining_unallocated=remaining_unallocated,
            payment_fully_allocated=payment_fully_allocated,
            allocations=allocation_results,
            message=f"Successfully allocated {total_requested} to {len(allocation_results)} invoice(s)"
        )

    def get_payment_with_allocations(self, payment_id: int) -> Optional[PaymentWithAllocations]:
        """Get payment details with all its allocations."""
        payment = self.get_payment_by_id(payment_id)
        if not payment:
            return None
        
        allocations = self.get_payment_allocations(payment_id)
        total_allocated = sum(a.pal_amount for a in allocations)
        
        allocation_details = []
        for alloc in allocations:
            invoice = self.get_invoice_by_id(alloc.pal_invoice_id)
            allocation_details.append(PaymentAllocationDetail(
                allocation_id=alloc.pal_id,
                invoice_id=alloc.pal_invoice_id,
                invoice_reference=invoice.inv_reference if invoice else "Unknown",
                amount=alloc.pal_amount,
                allocated_at=alloc.pal_allocated_at,
                allocated_by=alloc.pal_allocated_by,
                notes=alloc.pal_notes
            ))
        
        return PaymentWithAllocations(
            payment_id=payment.pay_id,
            payment_reference=payment.pay_reference,
            payment_amount=payment.pay_amount,
            total_allocated=total_allocated,
            remaining_unallocated=payment.pay_amount - total_allocated,
            is_fully_allocated=payment.pay_is_allocated,
            allocations=allocation_details
        )

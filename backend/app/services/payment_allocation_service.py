"""
Payment Allocation Service.
Handles business logic for allocating payments to invoices.

Uses the legacy ClientInvoicePayment model (TM_CPY_ClientInvoice_Payment table).
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, selectinload
from fastapi import Depends

from app.database import get_db
from app.models.client_invoice_payment import ClientInvoicePayment
from app.models.invoice import ClientInvoice
from app.models.client import Client


class PaymentAllocationError(Exception):
    """Custom exception for payment allocation errors."""
    def __init__(self, message: str, error_code: str = "ALLOCATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class PaymentAllocationService:
    """Service for managing payment allocations using ClientInvoicePayment."""

    def __init__(self, db: Session):
        self.db = db

    def allocate_payment(
        self,
        invoice_id: int,
        amount: float,
        comment: Optional[str] = None,
        payment_date: Optional[datetime] = None,
    ) -> ClientInvoicePayment:
        """
        Allocate a payment to an invoice by creating a ClientInvoicePayment record.

        Args:
            invoice_id: ID of the invoice to allocate payment to.
            amount: Payment amount.
            comment: Optional comment/note for the payment.
            payment_date: Optional payment date (defaults to now).

        Returns:
            The created ClientInvoicePayment record.

        Raises:
            PaymentAllocationError: If validation fails.
        """
        # Validate invoice exists
        invoice = self.db.query(ClientInvoice).filter(
            ClientInvoice.cin_id == invoice_id
        ).first()

        if not invoice:
            raise PaymentAllocationError(
                f"Invoice with ID {invoice_id} not found",
                "INVOICE_NOT_FOUND"
            )

        # Validate amount
        if amount <= 0:
            raise PaymentAllocationError(
                "Payment amount must be greater than zero",
                "INVALID_AMOUNT"
            )

        # Check remaining balance
        rest_to_pay = float(invoice.cin_rest_to_pay or 0)
        if amount > rest_to_pay and rest_to_pay > 0:
            raise PaymentAllocationError(
                f"Payment amount ({amount}) exceeds remaining balance ({rest_to_pay})",
                "EXCEEDS_BALANCE"
            )

        # Create payment record
        payment = ClientInvoicePayment(
            cin_id=invoice_id,
            cpy_amount=Decimal(str(amount)),
            cpy_d_create=payment_date or datetime.now(),
            cpy_comment=comment,
        )
        self.db.add(payment)

        # Update invoice payment status
        new_rest = Decimal(str(rest_to_pay)) - Decimal(str(amount))
        invoice.cin_rest_to_pay = max(new_rest, Decimal("0"))
        if invoice.cin_rest_to_pay <= 0:
            invoice.cin_is_full_paid = True
            invoice.cin_d_encaissement = payment_date or datetime.now()

        invoice.cin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_payment(self, payment_id: int) -> Optional[ClientInvoicePayment]:
        """Retrieve a payment by ID."""
        return self.db.query(ClientInvoicePayment).filter(
            ClientInvoicePayment.cpy_id == payment_id
        ).first()

    def list_payments_for_invoice(self, invoice_id: int) -> List[ClientInvoicePayment]:
        """Get all payments for a specific invoice."""
        return self.db.query(ClientInvoicePayment).filter(
            ClientInvoicePayment.cin_id == invoice_id
        ).order_by(ClientInvoicePayment.cpy_d_create.desc()).all()

    def get_total_paid_for_invoice(self, invoice_id: int) -> Decimal:
        """Get total amount paid for an invoice."""
        result = self.db.query(
            func.coalesce(func.sum(ClientInvoicePayment.cpy_amount), Decimal("0.00"))
        ).filter(
            ClientInvoicePayment.cin_id == invoice_id
        ).scalar()
        return result or Decimal("0.00")

    def get_client_unpaid_invoices(self, client_id: int) -> List[Dict[str, Any]]:
        """
        Get all unpaid invoices for a client.

        Returns list of dicts with invoice info and remaining balance.
        """
        invoices = self.db.query(ClientInvoice).filter(
            and_(
                ClientInvoice.cli_id == client_id,
                ClientInvoice.cin_isinvoice == True,
                ClientInvoice.cin_is_full_paid != True,
            )
        ).order_by(ClientInvoice.cin_d_invoice.asc()).all()

        result = []
        for inv in invoices:
            total_paid = self.get_total_paid_for_invoice(inv.cin_id)
            result.append({
                "invoice_id": inv.cin_id,
                "invoice_reference": inv.cin_code,
                "invoice_date": inv.cin_d_invoice,
                "due_date": inv.cin_d_term,
                "rest_to_pay": float(inv.cin_rest_to_pay or 0),
                "total_paid": float(total_paid),
                "is_overdue": (
                    inv.cin_d_term is not None
                    and inv.cin_d_term < datetime.now()
                ),
            })

        return result


# =============================================================================
# Dependency Function
# =============================================================================

def get_payment_allocation_service(
    db: Session = Depends(get_db),
) -> PaymentAllocationService:
    """Dependency for getting payment allocation service."""
    return PaymentAllocationService(db)

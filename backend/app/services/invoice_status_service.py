"""
Invoice Status Calculation Service

Calculates the appropriate status for client invoices based on:
- Payment state (paid, partially paid, unpaid)
- Due date (overdue detection)
- Invoice lifecycle state (draft, validated, cancelled)
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func

# Use the correct model from invoice.py
from app.models.invoice import ClientInvoice
from app.models.client_invoice_payment import ClientInvoicePayment
from app.models.status import Status


class InvoiceStatusCode(str, Enum):
    """Invoice status codes matching TR_STA_Status entries"""
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"
    CREDITED = "CREDITED"


class InvoiceStatusResult:
    """Result of invoice status calculation"""
    
    def __init__(
        self,
        status_code: InvoiceStatusCode,
        status_id: Optional[int] = None,
        total_paid: Decimal = Decimal("0.00"),
        remaining_amount: Decimal = Decimal("0.00"),
        is_overdue: bool = False,
        days_overdue: int = 0,
        payment_percentage: Decimal = Decimal("0.00")
    ):
        self.status_code = status_code
        self.status_id = status_id
        self.total_paid = total_paid
        self.remaining_amount = remaining_amount
        self.is_overdue = is_overdue
        self.days_overdue = days_overdue
        self.payment_percentage = payment_percentage
    
    def to_dict(self) -> dict:
        return {
            "status_code": self.status_code.value,
            "status_id": self.status_id,
            "total_paid": float(self.total_paid),
            "remaining_amount": float(self.remaining_amount),
            "is_overdue": self.is_overdue,
            "days_overdue": self.days_overdue,
            "payment_percentage": float(self.payment_percentage)
        }


def get_total_payments(db: Session, invoice_id: int) -> Decimal:
    """
    Get total amount paid for an invoice.
    
    Args:
        db: Database session
        invoice_id: The invoice ID
        
    Returns:
        Total amount paid as Decimal
    """
    result = db.execute(
        select(func.coalesce(func.sum(ClientInvoicePayment.pay_amount), Decimal("0.00")))
        .where(ClientInvoicePayment.pay_invoice_id == invoice_id)
        .where(ClientInvoicePayment.pay_is_cancelled == False)
    ).scalar()
    
    return Decimal(str(result)) if result else Decimal("0.00")


def get_status_id_by_code(db: Session, status_code: str, entity_type: str = "Invoice") -> Optional[int]:
    """
    Get status ID from status code.
    
    Args:
        db: Database session
        status_code: The status code (e.g., 'PAID', 'OVERDUE')
        entity_type: The entity type filter
        
    Returns:
        Status ID or None if not found
    """
    result = db.execute(
        select(Status.sta_id)
        .where(Status.sta_code == status_code)
        .where(
            (Status.sta_entity_type == entity_type) | 
            (Status.sta_entity_type.is_(None))
        )
        .where(Status.sta_is_active == True)
    ).scalar()
    
    return result


def calculate_invoice_status(
    db: Session,
    invoice_id: int,
    *,
    reference_date: Optional[date] = None
) -> InvoiceStatusResult:
    """
    Calculate the appropriate status for a client invoice.
    
    This function determines the invoice status based on:
    1. Current invoice state (draft, cancelled, credited)
    2. Payment status (total payments vs invoice total)
    3. Due date comparison (overdue detection)
    
    Args:
        db: Database session
        invoice_id: The invoice ID to calculate status for
        reference_date: Date to use for overdue calculation (defaults to today)
        
    Returns:
        InvoiceStatusResult with calculated status and payment details
        
    Raises:
        ValueError: If invoice not found
    """
    # Get the invoice
    invoice = db.execute(
        select(ClientInvoice).where(ClientInvoice.inv_id == invoice_id)
    ).scalar_one_or_none()
    
    if not invoice:
        raise ValueError(f"Invoice with ID {invoice_id} not found")
    
    # Use today if no reference date provided
    if reference_date is None:
        reference_date = date.today()
    
    # Get current status code if available
    current_status_code = None
    if invoice.inv_status_id:
        current_status = db.execute(
            select(Status.sta_code).where(Status.sta_id == invoice.inv_status_id)
        ).scalar()
        current_status_code = current_status
    
    # Check for special states first
    if current_status_code == InvoiceStatusCode.CANCELLED.value:
        return InvoiceStatusResult(
            status_code=InvoiceStatusCode.CANCELLED,
            status_id=invoice.inv_status_id,
            total_paid=Decimal("0.00"),
            remaining_amount=invoice.inv_total_ttc or Decimal("0.00"),
            is_overdue=False,
            days_overdue=0,
            payment_percentage=Decimal("0.00")
        )
    
    if current_status_code == InvoiceStatusCode.CREDITED.value:
        return InvoiceStatusResult(
            status_code=InvoiceStatusCode.CREDITED,
            status_id=invoice.inv_status_id,
            total_paid=Decimal("0.00"),
            remaining_amount=Decimal("0.00"),
            is_overdue=False,
            days_overdue=0,
            payment_percentage=Decimal("100.00")
        )
    
    if current_status_code == InvoiceStatusCode.DRAFT.value:
        return InvoiceStatusResult(
            status_code=InvoiceStatusCode.DRAFT,
            status_id=invoice.inv_status_id,
            total_paid=Decimal("0.00"),
            remaining_amount=invoice.inv_total_ttc or Decimal("0.00"),
            is_overdue=False,
            days_overdue=0,
            payment_percentage=Decimal("0.00")
        )
    
    # Calculate payment status
    total_ttc = invoice.inv_total_ttc or Decimal("0.00")
    total_paid = get_total_payments(db, invoice_id)
    remaining_amount = total_ttc - total_paid
    
    # Calculate payment percentage
    payment_percentage = Decimal("0.00")
    if total_ttc > 0:
        payment_percentage = (total_paid / total_ttc * 100).quantize(Decimal("0.01"))
    
    # Check if overdue
    is_overdue = False
    days_overdue = 0
    if invoice.inv_due_date and reference_date > invoice.inv_due_date:
        is_overdue = True
        days_overdue = (reference_date - invoice.inv_due_date).days
    
    # Determine status based on payment state
    # Tolerance for floating point comparison (0.01 EUR)
    tolerance = Decimal("0.01")
    
    if remaining_amount <= tolerance:
        # Fully paid
        status_code = InvoiceStatusCode.PAID
        is_overdue = False  # Paid invoices are not overdue
        days_overdue = 0
    elif total_paid > tolerance:
        # Partially paid
        if is_overdue:
            status_code = InvoiceStatusCode.OVERDUE
        else:
            status_code = InvoiceStatusCode.PARTIALLY_PAID
    else:
        # Not paid at all
        if is_overdue:
            status_code = InvoiceStatusCode.OVERDUE
        else:
            status_code = InvoiceStatusCode.PENDING
    
    # Get the status ID
    status_id = get_status_id_by_code(db, status_code.value)
    
    return InvoiceStatusResult(
        status_code=status_code,
        status_id=status_id,
        total_paid=total_paid,
        remaining_amount=max(remaining_amount, Decimal("0.00")),
        is_overdue=is_overdue,
        days_overdue=days_overdue,
        payment_percentage=min(payment_percentage, Decimal("100.00"))
    )


def calculate_invoice_status_by_values(
    total_ttc: Decimal,
    total_paid: Decimal,
    due_date: Optional[date],
    current_status_code: Optional[str] = None,
    reference_date: Optional[date] = None
) -> Tuple[InvoiceStatusCode, bool, int]:
    """
    Calculate invoice status from values without database access.
    
    Useful for batch processing or when invoice data is already loaded.
    
    Args:
        total_ttc: Total invoice amount including VAT
        total_paid: Total amount already paid
        due_date: Invoice due date
        current_status_code: Current status code (for special states)
        reference_date: Date to use for overdue calculation
        
    Returns:
        Tuple of (status_code, is_overdue, days_overdue)
    """
    if reference_date is None:
        reference_date = date.today()
    
    # Check special states
    if current_status_code in [
        InvoiceStatusCode.CANCELLED.value,
        InvoiceStatusCode.CREDITED.value,
        InvoiceStatusCode.DRAFT.value
    ]:
        return (InvoiceStatusCode(current_status_code), False, 0)
    
    # Calculate overdue
    is_overdue = False
    days_overdue = 0
    if due_date and reference_date > due_date:
        is_overdue = True
        days_overdue = (reference_date - due_date).days
    
    # Calculate remaining
    remaining = total_ttc - total_paid
    tolerance = Decimal("0.01")
    
    if remaining <= tolerance:
        return (InvoiceStatusCode.PAID, False, 0)
    elif total_paid > tolerance:
        if is_overdue:
            return (InvoiceStatusCode.OVERDUE, True, days_overdue)
        return (InvoiceStatusCode.PARTIALLY_PAID, False, 0)
    else:
        if is_overdue:
            return (InvoiceStatusCode.OVERDUE, True, days_overdue)
        return (InvoiceStatusCode.PENDING, False, 0)


def update_invoice_status(db: Session, invoice_id: int, commit: bool = True) -> InvoiceStatusResult:
    """
    Calculate and update the invoice status in the database.
    
    Args:
        db: Database session
        invoice_id: The invoice ID to update
        commit: Whether to commit the transaction
        
    Returns:
        InvoiceStatusResult with the new status
    """
    result = calculate_invoice_status(db, invoice_id)
    
    if result.status_id:
        db.execute(
            ClientInvoice.__table__.update()
            .where(ClientInvoice.inv_id == invoice_id)
            .values(inv_status_id=result.status_id)
        )
        
        if commit:
            db.commit()
    
    return result


def batch_update_invoice_statuses(
    db: Session,
    invoice_ids: Optional[list[int]] = None,
    commit: bool = True
) -> dict[int, InvoiceStatusResult]:
    """
    Update statuses for multiple invoices.
    
    Args:
        db: Database session
        invoice_ids: List of invoice IDs to update (None = all non-final invoices)
        commit: Whether to commit the transaction
        
    Returns:
        Dictionary mapping invoice_id to InvoiceStatusResult
    """
    results = {}
    
    if invoice_ids is None:
        # Get all invoices that are not in final states
        final_status_codes = [
            InvoiceStatusCode.CANCELLED.value,
            InvoiceStatusCode.CREDITED.value,
            InvoiceStatusCode.PAID.value
        ]
        
        final_status_ids = db.execute(
            select(Status.sta_id)
            .where(Status.sta_code.in_(final_status_codes))
        ).scalars().all()
        
        invoices = db.execute(
            select(ClientInvoice.inv_id)
            .where(
                (ClientInvoice.inv_status_id.not_in(final_status_ids)) |
                (ClientInvoice.inv_status_id.is_(None))
            )
        ).scalars().all()
        
        invoice_ids = list(invoices)
    
    for invoice_id in invoice_ids:
        try:
            result = update_invoice_status(db, invoice_id, commit=False)
            results[invoice_id] = result
        except ValueError:
            # Invoice not found, skip
            continue
    
    if commit:
        db.commit()
    
    return results

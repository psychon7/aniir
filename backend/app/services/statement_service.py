"""
Statement Service Module.

Provides functionality for:
- Customer (Client) statement generation with running balance
- Vendor (Supplier) statement generation
- Statement export in multiple formats (PDF, Excel, CSV)
- Bank reconciliation support
- Statement scheduling and batch generation

Uses ClientInvoicePayment (TM_CPY_ClientInvoice_Payment) for payment data.
Uses synchronous Session with asyncio.to_thread() pattern.
"""
import csv
import io
from datetime import datetime, date, timedelta
from decimal import Decimal
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload
from fastapi import Depends

from app.database import get_db
from app.models.invoice import ClientInvoice, ClientInvoiceLine
from app.models.client_invoice_payment import ClientInvoicePayment
from app.models.client import Client
from app.models.supplier import Supplier


# ==========================================================================
# Enums and Constants
# ==========================================================================

class StatementType(str, Enum):
    """Statement type enumeration."""
    CUSTOMER = "customer"
    VENDOR = "vendor"
    BANK_RECONCILIATION = "bank_reconciliation"


class ExportFormat(str, Enum):
    """Export format enumeration."""
    PDF = "pdf"
    EXCEL = "xlsx"
    CSV = "csv"
    JSON = "json"


class TransactionType(str, Enum):
    """Transaction type for statement lines."""
    OPENING_BALANCE = "OPENING_BALANCE"
    INVOICE = "INVOICE"
    CREDIT_NOTE = "CREDIT_NOTE"
    PAYMENT = "PAYMENT"
    ADJUSTMENT = "ADJUSTMENT"
    CLOSING_BALANCE = "CLOSING_BALANCE"


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class StatementServiceError(Exception):
    """Base exception for statement service errors."""
    def __init__(self, message: str, code: str = "STATEMENT_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class ClientNotFoundError(StatementServiceError):
    """Raised when client is not found."""
    def __init__(self, client_id: int):
        super().__init__(
            f"Client with ID {client_id} not found",
            code="CLIENT_NOT_FOUND",
            details={"client_id": client_id}
        )


class SupplierNotFoundError(StatementServiceError):
    """Raised when supplier is not found."""
    def __init__(self, supplier_id: int):
        super().__init__(
            f"Supplier with ID {supplier_id} not found",
            code="SUPPLIER_NOT_FOUND",
            details={"supplier_id": supplier_id}
        )


class InvalidDateRangeError(StatementServiceError):
    """Raised when date range is invalid."""
    def __init__(self, from_date: date, to_date: date):
        super().__init__(
            f"Invalid date range: from_date ({from_date}) must be before or equal to to_date ({to_date})",
            code="INVALID_DATE_RANGE",
            details={"from_date": str(from_date), "to_date": str(to_date)}
        )


class ExportError(StatementServiceError):
    """Raised when export fails."""
    def __init__(self, message: str, export_format: str):
        super().__init__(
            message,
            code="EXPORT_ERROR",
            details={"export_format": export_format}
        )


# ==========================================================================
# Data Classes for Statement Structure
# ==========================================================================

class StatementTransaction:
    """Represents a single transaction in a statement."""
    def __init__(
        self,
        transaction_date: date,
        transaction_type: TransactionType,
        reference: str,
        description: str,
        debit: Decimal = Decimal("0"),
        credit: Decimal = Decimal("0"),
        balance: Decimal = Decimal("0"),
        due_date: Optional[date] = None,
        document_id: Optional[int] = None,
        days_overdue: int = 0
    ):
        self.transaction_date = transaction_date
        self.transaction_type = transaction_type
        self.reference = reference
        self.description = description
        self.debit = debit
        self.credit = credit
        self.balance = balance
        self.due_date = due_date
        self.document_id = document_id
        self.days_overdue = days_overdue

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "date": self.transaction_date.isoformat() if self.transaction_date else None,
            "type": self.transaction_type.value if isinstance(self.transaction_type, TransactionType) else self.transaction_type,
            "reference": self.reference,
            "description": self.description,
            "debit": float(self.debit),
            "credit": float(self.credit),
            "balance": float(self.balance),
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "document_id": self.document_id,
            "days_overdue": self.days_overdue
        }


# ==========================================================================
# Statement Service Class
# ==========================================================================

class StatementService:
    """
    Service class for generating and managing financial statements.

    Handles customer statements, vendor statements, and supports
    multiple export formats including PDF, Excel, and CSV.

    Uses synchronous Session (pymssql driver).
    """

    def __init__(self, db: Session):
        """
        Initialize the statement service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Customer Statement Generation
    # ==========================================================================

    def generate_customer_statement(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        include_paid_invoices: bool = True,
        society_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive customer statement.

        Creates a statement of account showing all invoices and payments
        within the date range, with opening balance, running balance,
        and closing balance.

        Args:
            client_id: ID of the client.
            from_date: Start date of statement period.
            to_date: End date of statement period.
            include_paid_invoices: Whether to include fully paid invoices.
            society_id: Optional society/company ID filter.

        Returns:
            Dict containing complete statement data.

        Raises:
            ClientNotFoundError: If client does not exist.
            InvalidDateRangeError: If date range is invalid.
        """
        # Validate date range
        if from_date > to_date:
            raise InvalidDateRangeError(from_date, to_date)

        # Get client info
        client = self._get_client(client_id)
        if not client:
            raise ClientNotFoundError(client_id)

        # Calculate opening balance
        opening_balance = self._calculate_client_balance_as_of(
            client_id,
            from_date - timedelta(days=1),
            society_id,
        )

        # Get invoices in date range
        invoices = self._get_client_invoices_in_period(
            client_id,
            from_date,
            to_date,
            include_paid_invoices,
            society_id,
        )

        # Get payments in date range
        payments = self._get_client_payments_in_period(
            client_id,
            from_date,
            to_date
        )

        # Build transactions list
        transactions: List[StatementTransaction] = []
        today = date.today()

        for invoice in invoices:
            invoice_date = invoice.cin_d_invoice.date() if isinstance(invoice.cin_d_invoice, datetime) else (invoice.cin_d_invoice or invoice.cin_d_creation.date())
            due_date = invoice.cin_d_term.date() if isinstance(invoice.cin_d_term, datetime) else invoice.cin_d_term
            days_overdue = max(0, (today - due_date).days) if due_date and today > due_date else 0

            # Compute total from lines
            line_total = sum(
                float(line.cii_price_with_discount_ht or line.cii_total_price or 0)
                for line in (invoice.lines or [])
            )

            tx_type = TransactionType.CREDIT_NOTE if not invoice.cin_isinvoice else TransactionType.INVOICE
            debit = Decimal(str(line_total)) if invoice.cin_isinvoice else Decimal("0")
            credit = Decimal(str(abs(line_total))) if not invoice.cin_isinvoice else Decimal("0")

            transactions.append(StatementTransaction(
                transaction_date=invoice_date,
                transaction_type=tx_type,
                reference=invoice.cin_code,
                description=f"{'Invoice' if invoice.cin_isinvoice else 'Credit Note'} {invoice.cin_code}",
                debit=debit,
                credit=credit,
                due_date=due_date,
                document_id=invoice.cin_id,
                days_overdue=days_overdue
            ))

        for payment in payments:
            payment_date = payment.cpy_d_create.date() if isinstance(payment.cpy_d_create, datetime) else payment.cpy_d_create

            transactions.append(StatementTransaction(
                transaction_date=payment_date,
                transaction_type=TransactionType.PAYMENT,
                reference=f"PAY-{payment.cpy_id}",
                description=f"Payment {payment.cpy_comment or ''}".strip(),
                debit=Decimal("0"),
                credit=payment.cpy_amount,
                document_id=payment.cpy_id
            ))

        # Sort transactions by date, then by type (invoices before payments on same day)
        transactions.sort(key=lambda x: (x.transaction_date, x.transaction_type == TransactionType.PAYMENT))

        # Calculate running balance
        running_balance = opening_balance
        for tx in transactions:
            running_balance = running_balance + tx.debit - tx.credit
            tx.balance = running_balance

        closing_balance = running_balance

        # Calculate totals
        total_debits = sum(tx.debit for tx in transactions)
        total_credits = sum(tx.credit for tx in transactions)

        # Calculate aging summary for outstanding invoices
        aging_summary = self._calculate_client_aging_summary(
            client_id,
            today,
            society_id,
        )

        return {
            "statement_type": StatementType.CUSTOMER.value,
            "client": {
                "id": client.cli_id,
                "reference": client.cli_ref,
                "company_name": client.cli_company_name,
                "address": client.cli_address1,
                "city": client.cli_city,
                "postal_code": client.cli_postcode,
                "country": client.cli_country,
                "email": client.cli_email,
            },
            "period": {
                "from_date": from_date.isoformat(),
                "to_date": to_date.isoformat()
            },
            "opening_balance": float(opening_balance),
            "transactions": [tx.to_dict() for tx in transactions],
            "totals": {
                "total_debits": float(total_debits),
                "total_credits": float(total_credits),
                "net_change": float(total_debits - total_credits),
                "transaction_count": len(transactions)
            },
            "closing_balance": float(closing_balance),
            "aging_summary": aging_summary,
            "filters": {
                "include_paid_invoices": include_paid_invoices,
                "society_id": society_id,
            },
            "generated_at": datetime.now().isoformat()
        }

    # ==========================================================================
    # Vendor Statement Generation
    # ==========================================================================

    def generate_vendor_statement(
        self,
        supplier_id: int,
        from_date: date,
        to_date: date,
        society_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a vendor/supplier statement.

        Note:
            This is a placeholder for vendor statement functionality.
            Full implementation requires vendor invoice and payment models.
        """
        # Validate date range
        if from_date > to_date:
            raise InvalidDateRangeError(from_date, to_date)

        # Get supplier info
        supplier = self._get_supplier(supplier_id)
        if not supplier:
            raise SupplierNotFoundError(supplier_id)

        return {
            "statement_type": StatementType.VENDOR.value,
            "supplier": {
                "id": supplier.sup_id,
                "reference": supplier.sup_ref,
                "company_name": supplier.sup_company_name,
                "address": supplier.sup_address1,
                "city": supplier.sup_city,
                "postal_code": supplier.sup_postcode,
                "country": supplier.sup_country,
                "email": supplier.sup_email
            },
            "period": {
                "from_date": from_date.isoformat(),
                "to_date": to_date.isoformat()
            },
            "opening_balance": 0.0,
            "transactions": [],
            "totals": {
                "total_debits": 0.0,
                "total_credits": 0.0,
                "net_change": 0.0,
                "transaction_count": 0
            },
            "closing_balance": 0.0,
            "message": "Vendor statement generation requires supplier invoice and payment tracking models",
            "filters": {
                "society_id": society_id
            },
            "generated_at": datetime.now().isoformat()
        }

    # ==========================================================================
    # Export Methods
    # ==========================================================================

    def export_customer_statement_csv(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        include_paid_invoices: bool = True,
        society_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Export a customer statement in CSV format."""
        statement = self.generate_customer_statement(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date,
            include_paid_invoices=include_paid_invoices,
            society_id=society_id,
        )

        output = io.StringIO()
        writer = csv.writer(output)

        # Header information
        client = statement.get("client", {})
        writer.writerow(["Customer Statement"])
        writer.writerow([])
        writer.writerow(["Client:", client.get("company_name", "")])
        writer.writerow(["Reference:", client.get("reference", "")])
        writer.writerow(["Period:", f"{statement['period']['from_date']} to {statement['period']['to_date']}"])
        writer.writerow(["Generated:", statement.get("generated_at", "")])
        writer.writerow([])

        # Opening balance
        writer.writerow(["Opening Balance:", statement.get("opening_balance", 0)])
        writer.writerow([])

        # Transaction headers
        writer.writerow(["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance", "Due Date"])

        # Transactions
        for tx in statement.get("transactions", []):
            writer.writerow([
                tx.get("date", ""),
                tx.get("type", ""),
                tx.get("reference", ""),
                tx.get("description", ""),
                tx.get("debit", 0),
                tx.get("credit", 0),
                tx.get("balance", 0),
                tx.get("due_date", "")
            ])

        writer.writerow([])

        # Totals
        totals = statement.get("totals", {})
        writer.writerow(["Total Debits:", totals.get("total_debits", 0)])
        writer.writerow(["Total Credits:", totals.get("total_credits", 0)])
        writer.writerow(["Net Change:", totals.get("net_change", 0)])
        writer.writerow([])
        writer.writerow(["Closing Balance:", statement.get("closing_balance", 0)])

        csv_content = output.getvalue()
        output.close()

        filename = f"statement_{client.get('reference', 'unknown')}_{statement['period']['from_date']}_{statement['period']['to_date']}.csv"

        return {
            "format": "csv",
            "content_type": "text/csv",
            "data": csv_content,
            "filename": filename
        }

    # ==========================================================================
    # Private Helper Methods
    # ==========================================================================

    def _get_client(self, client_id: int) -> Optional[Client]:
        """Get client by ID."""
        return self.db.query(Client).filter(Client.cli_id == client_id).first()

    def _get_supplier(self, supplier_id: int) -> Optional[Supplier]:
        """Get supplier by ID."""
        return self.db.query(Supplier).filter(Supplier.sup_id == supplier_id).first()

    def _calculate_client_balance_as_of(
        self,
        client_id: int,
        as_of_date: date,
        society_id: Optional[int] = None,
    ) -> Decimal:
        """
        Calculate client balance as of a specific date.

        Balance = Total invoiced amounts - Total payments up to that date.
        Uses ClientInvoicePayment for payment data.
        """
        # Sum of invoices up to date (from invoice lines)
        invoice_conditions = [
            ClientInvoice.cli_id == client_id,
            ClientInvoice.cin_isinvoice == True,
        ]
        # Filter by invoice date or creation date
        invoice_conditions.append(
            or_(
                and_(ClientInvoice.cin_d_invoice != None, ClientInvoice.cin_d_invoice <= as_of_date),
                and_(ClientInvoice.cin_d_invoice == None, ClientInvoice.cin_d_creation <= as_of_date),
            )
        )
        if society_id:
            invoice_conditions.append(ClientInvoice.soc_id == society_id)

        # Get sum of line totals for invoices up to date
        invoices_total = self.db.query(
            func.coalesce(
                func.sum(ClientInvoiceLine.cii_price_with_discount_ht),
                Decimal("0")
            )
        ).join(
            ClientInvoice, ClientInvoiceLine.cin_id == ClientInvoice.cin_id
        ).filter(
            and_(*invoice_conditions)
        ).scalar() or Decimal("0")

        # Sum of payments up to date (join through invoice to filter by client)
        payments_total = self.db.query(
            func.coalesce(func.sum(ClientInvoicePayment.cpy_amount), Decimal("0"))
        ).join(
            ClientInvoice, ClientInvoicePayment.cin_id == ClientInvoice.cin_id
        ).filter(
            and_(
                ClientInvoice.cli_id == client_id,
                ClientInvoicePayment.cpy_d_create <= as_of_date,
            )
        ).scalar() or Decimal("0")

        return Decimal(str(invoices_total)) - Decimal(str(payments_total))

    def _get_client_invoices_in_period(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        include_paid: bool = True,
        society_id: Optional[int] = None,
    ) -> List[ClientInvoice]:
        """Get client invoices within date range."""
        conditions = [
            ClientInvoice.cli_id == client_id,
            or_(
                and_(ClientInvoice.cin_d_invoice != None, ClientInvoice.cin_d_invoice >= from_date, ClientInvoice.cin_d_invoice <= to_date),
                and_(ClientInvoice.cin_d_invoice == None, ClientInvoice.cin_d_creation >= from_date, ClientInvoice.cin_d_creation <= to_date),
            ),
        ]

        if not include_paid:
            conditions.append(ClientInvoice.cin_is_full_paid != True)

        if society_id:
            conditions.append(ClientInvoice.soc_id == society_id)

        return self.db.query(ClientInvoice).options(
            selectinload(ClientInvoice.lines)
        ).filter(
            and_(*conditions)
        ).order_by(ClientInvoice.cin_d_invoice.asc()).all()

    def _get_client_payments_in_period(
        self,
        client_id: int,
        from_date: date,
        to_date: date
    ) -> List[ClientInvoicePayment]:
        """Get client payments within date range using ClientInvoicePayment."""
        return self.db.query(ClientInvoicePayment).join(
            ClientInvoice, ClientInvoicePayment.cin_id == ClientInvoice.cin_id
        ).filter(
            and_(
                ClientInvoice.cli_id == client_id,
                ClientInvoicePayment.cpy_d_create >= from_date,
                ClientInvoicePayment.cpy_d_create <= to_date
            )
        ).order_by(ClientInvoicePayment.cpy_d_create.asc()).all()

    def _calculate_client_aging_summary(
        self,
        client_id: int,
        as_of_date: date,
        society_id: Optional[int] = None,
    ) -> Dict[str, float]:
        """
        Calculate aging buckets for client's outstanding invoices.

        Returns amounts in each aging bucket:
        - current: 0-30 days
        - days_31_60: 31-60 days
        - days_61_90: 61-90 days
        - over_90: 90+ days
        """
        conditions = [
            ClientInvoice.cli_id == client_id,
            ClientInvoice.cin_isinvoice == True,
            ClientInvoice.cin_is_full_paid != True,
        ]
        if society_id:
            conditions.append(ClientInvoice.soc_id == society_id)

        invoices = self.db.query(ClientInvoice).filter(
            and_(*conditions)
        ).all()

        buckets = {
            "current": Decimal("0"),
            "days_31_60": Decimal("0"),
            "days_61_90": Decimal("0"),
            "over_90": Decimal("0")
        }

        for invoice in invoices:
            due_date = invoice.cin_d_term
            if due_date and isinstance(due_date, datetime):
                due_date = due_date.date()

            days_overdue = (as_of_date - due_date).days if due_date else 0
            balance = Decimal(str(invoice.cin_rest_to_pay or 0))

            if days_overdue <= 30:
                buckets["current"] += balance
            elif days_overdue <= 60:
                buckets["days_31_60"] += balance
            elif days_overdue <= 90:
                buckets["days_61_90"] += balance
            else:
                buckets["over_90"] += balance

        return {k: float(v) for k, v in buckets.items()}

    def _determine_credit_status(
        self,
        balance: Decimal,
        aging_summary: Dict[str, float]
    ) -> str:
        """
        Determine credit status based on balance and aging.

        Returns:
            Status string: "GOOD", "WATCH", "WARNING", "CRITICAL"
        """
        if balance <= 0:
            return "GOOD"

        over_60 = aging_summary.get("days_61_90", 0) + aging_summary.get("over_90", 0)
        over_90 = aging_summary.get("over_90", 0)

        if over_90 > 0:
            return "CRITICAL"
        elif over_60 > 0:
            return "WARNING"
        elif aging_summary.get("days_31_60", 0) > 0:
            return "WATCH"
        else:
            return "GOOD"


# ==========================================================================
# Factory Function
# ==========================================================================

def get_statement_service(db: Session = Depends(get_db)) -> StatementService:
    """
    Factory function to create StatementService instance.

    Args:
        db: Database session.

    Returns:
        StatementService instance.
    """
    return StatementService(db)

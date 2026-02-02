"""
Statement Service Module.

Provides functionality for:
- Customer (Client) statement generation with running balance
- Vendor (Supplier) statement generation
- Statement export in multiple formats (PDF, Excel, CSV)
- Bank reconciliation support
- Statement scheduling and batch generation
"""
import csv
import io
from datetime import datetime, date, timedelta
from decimal import Decimal
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import Depends

from app.database import get_db
from app.models.invoice import ClientInvoice, ClientInvoiceLine
from app.models.payment import Payment, PaymentAllocation
from app.models.client import Client
from app.models.supplier import Supplier
from app.config import get_settings, InvoiceStatus


settings = get_settings()


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
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the statement service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Customer Statement Generation
    # ==========================================================================

    async def generate_customer_statement(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        include_paid_invoices: bool = True,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
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
            bu_id: Optional business unit ID filter.

        Returns:
            Dict containing complete statement data:
            - client: Client information
            - period: Statement period details
            - opening_balance: Balance at start of period
            - transactions: List of all transactions with running balance
            - totals: Summary totals (debits, credits, net change)
            - closing_balance: Balance at end of period
            - aging_summary: Outstanding amounts by aging bucket
            - generated_at: Timestamp of generation

        Raises:
            ClientNotFoundError: If client does not exist.
            InvalidDateRangeError: If date range is invalid.
        """
        # Validate date range
        if from_date > to_date:
            raise InvalidDateRangeError(from_date, to_date)

        # Get client info
        client = await self._get_client(client_id)
        if not client:
            raise ClientNotFoundError(client_id)

        # Calculate opening balance
        opening_balance = await self._calculate_client_balance_as_of(
            client_id,
            from_date - timedelta(days=1),
            society_id,
            bu_id
        )

        # Get invoices in date range
        invoices = await self._get_client_invoices_in_period(
            client_id,
            from_date,
            to_date,
            include_paid_invoices,
            society_id,
            bu_id
        )

        # Get payments in date range
        payments = await self._get_client_payments_in_period(
            client_id,
            from_date,
            to_date
        )

        # Build transactions list
        transactions: List[StatementTransaction] = []
        today = date.today()

        for invoice in invoices:
            invoice_date = invoice.inv_date.date() if isinstance(invoice.inv_date, datetime) else invoice.inv_date
            due_date = invoice.inv_due_date.date() if isinstance(invoice.inv_due_date, datetime) else invoice.inv_due_date
            days_overdue = max(0, (today - due_date).days) if due_date and today > due_date else 0

            transactions.append(StatementTransaction(
                transaction_date=invoice_date,
                transaction_type=TransactionType.INVOICE,
                reference=invoice.inv_reference,
                description=f"Invoice {invoice.inv_reference}",
                debit=invoice.inv_total_amount,
                credit=Decimal("0"),
                due_date=due_date,
                document_id=invoice.inv_id,
                days_overdue=days_overdue
            ))

        for payment in payments:
            payment_date = payment.pay_date.date() if isinstance(payment.pay_date, datetime) else payment.pay_date

            transactions.append(StatementTransaction(
                transaction_date=payment_date,
                transaction_type=TransactionType.PAYMENT,
                reference=payment.pay_reference,
                description=f"Payment {payment.pay_reference} ({payment.pay_method})",
                debit=Decimal("0"),
                credit=payment.pay_amount,
                document_id=payment.pay_id
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
        aging_summary = await self._calculate_client_aging_summary(
            client_id,
            today,
            society_id,
            bu_id
        )

        return {
            "statement_type": StatementType.CUSTOMER.value,
            "client": {
                "id": client.cli_id,
                "reference": client.cli_reference,
                "company_name": client.cli_company_name,
                "address": client.cli_address,
                "city": client.cli_city,
                "postal_code": client.cli_postal_code,
                "country": getattr(client, 'cli_country', None),
                "email": client.cli_email,
                "phone": getattr(client, 'cli_phone', None)
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
                "business_unit_id": bu_id
            },
            "generated_at": datetime.now().isoformat()
        }

    async def generate_customer_statement_summary(
        self,
        client_id: int,
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Generate a summary customer statement showing current balance and aging.

        Args:
            client_id: ID of the client.
            as_of_date: Date to calculate balance as of (default: today).

        Returns:
            Dict with summary balance information and aging.
        """
        if as_of_date is None:
            as_of_date = date.today()

        client = await self._get_client(client_id)
        if not client:
            raise ClientNotFoundError(client_id)

        # Get current balance
        current_balance = await self._calculate_client_balance_as_of(client_id, as_of_date)

        # Get outstanding invoices count
        outstanding_stmt = (
            select(func.count(ClientInvoice.inv_id))
            .where(
                and_(
                    ClientInvoice.inv_cli_id == client_id,
                    ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
                )
            )
        )
        outstanding_result = await self.db.execute(outstanding_stmt)
        outstanding_count = outstanding_result.scalar() or 0

        # Get aging summary
        aging_summary = await self._calculate_client_aging_summary(client_id, as_of_date)

        # Get last payment
        last_payment_stmt = (
            select(Payment)
            .where(Payment.pay_cli_id == client_id)
            .order_by(Payment.pay_date.desc())
            .limit(1)
        )
        last_payment_result = await self.db.execute(last_payment_stmt)
        last_payment = last_payment_result.scalar_one_or_none()

        return {
            "client_id": client_id,
            "client_name": client.cli_company_name,
            "as_of_date": as_of_date.isoformat(),
            "current_balance": float(current_balance),
            "outstanding_invoice_count": outstanding_count,
            "aging_summary": aging_summary,
            "last_payment": {
                "date": last_payment.pay_date.isoformat() if last_payment else None,
                "amount": float(last_payment.pay_amount) if last_payment else None,
                "reference": last_payment.pay_reference if last_payment else None
            } if last_payment else None,
            "credit_status": self._determine_credit_status(current_balance, aging_summary),
            "generated_at": datetime.now().isoformat()
        }

    # ==========================================================================
    # Vendor Statement Generation
    # ==========================================================================

    async def generate_vendor_statement(
        self,
        supplier_id: int,
        from_date: date,
        to_date: date,
        society_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate a vendor/supplier statement.

        Shows all purchase orders, invoices from supplier, and payments
        made to the supplier within the date range.

        Args:
            supplier_id: ID of the supplier.
            from_date: Start date of statement period.
            to_date: End date of statement period.
            society_id: Optional society/company ID filter.

        Returns:
            Dict containing complete vendor statement data.

        Raises:
            SupplierNotFoundError: If supplier does not exist.
            InvalidDateRangeError: If date range is invalid.

        Note:
            This is a placeholder for vendor statement functionality.
            Full implementation requires vendor invoice and payment models.
        """
        # Validate date range
        if from_date > to_date:
            raise InvalidDateRangeError(from_date, to_date)

        # Get supplier info
        supplier = await self._get_supplier(supplier_id)
        if not supplier:
            raise SupplierNotFoundError(supplier_id)

        # Note: Full vendor statement requires supplier invoice and payment models
        # This provides the structure for when those models are available

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
            "transactions": [],  # Will be populated when vendor invoice models are available
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
    # Batch Statement Generation
    # ==========================================================================

    async def generate_batch_customer_statements(
        self,
        client_ids: List[int],
        from_date: date,
        to_date: date,
        include_paid_invoices: bool = True,
        only_with_balance: bool = False,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate statements for multiple customers in batch.

        Args:
            client_ids: List of client IDs to generate statements for.
            from_date: Start date of statement period.
            to_date: End date of statement period.
            include_paid_invoices: Whether to include fully paid invoices.
            only_with_balance: Only include clients with non-zero balance.
            society_id: Optional society/company ID filter.
            bu_id: Optional business unit ID filter.

        Returns:
            Dict with batch results including success/failure for each client.
        """
        results = {
            "success": [],
            "errors": [],
            "summary": {
                "total_requested": len(client_ids),
                "successful": 0,
                "failed": 0,
                "skipped": 0
            }
        }

        for client_id in client_ids:
            try:
                statement = await self.generate_customer_statement(
                    client_id=client_id,
                    from_date=from_date,
                    to_date=to_date,
                    include_paid_invoices=include_paid_invoices,
                    society_id=society_id,
                    bu_id=bu_id
                )

                # Skip if only_with_balance and balance is zero
                if only_with_balance and statement["closing_balance"] == 0:
                    results["summary"]["skipped"] += 1
                    continue

                results["success"].append({
                    "client_id": client_id,
                    "client_name": statement["client"]["company_name"],
                    "closing_balance": statement["closing_balance"],
                    "transaction_count": statement["totals"]["transaction_count"]
                })
                results["summary"]["successful"] += 1

            except Exception as e:
                results["errors"].append({
                    "client_id": client_id,
                    "error": str(e),
                    "error_code": getattr(e, 'code', 'UNKNOWN_ERROR')
                })
                results["summary"]["failed"] += 1

        results["generated_at"] = datetime.now().isoformat()
        return results

    async def generate_statements_for_all_active_clients(
        self,
        from_date: date,
        to_date: date,
        only_with_balance: bool = True,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate statements for all active clients.

        Args:
            from_date: Start date of statement period.
            to_date: End date of statement period.
            only_with_balance: Only include clients with non-zero balance.
            society_id: Optional society/company ID filter.
            bu_id: Optional business unit ID filter.

        Returns:
            Dict with batch results.
        """
        # Get all active clients
        stmt = select(Client.cli_id).where(Client.cli_isactive == True)
        if society_id:
            stmt = stmt.where(Client.cli_soc_id == society_id)

        result = await self.db.execute(stmt)
        client_ids = [row[0] for row in result.all()]

        return await self.generate_batch_customer_statements(
            client_ids=client_ids,
            from_date=from_date,
            to_date=to_date,
            only_with_balance=only_with_balance,
            society_id=society_id,
            bu_id=bu_id
        )

    # ==========================================================================
    # Export Methods
    # ==========================================================================

    async def export_customer_statement(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        export_format: ExportFormat = ExportFormat.PDF,
        include_paid_invoices: bool = True,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Export a customer statement in the specified format.

        Args:
            client_id: ID of the client.
            from_date: Start date of statement period.
            to_date: End date of statement period.
            export_format: Format to export (PDF, Excel, CSV, JSON).
            include_paid_invoices: Whether to include fully paid invoices.
            society_id: Optional society/company ID filter.
            bu_id: Optional business unit ID filter.

        Returns:
            Dict containing export result with file data or reference.
        """
        # Generate statement data
        statement = await self.generate_customer_statement(
            client_id=client_id,
            from_date=from_date,
            to_date=to_date,
            include_paid_invoices=include_paid_invoices,
            society_id=society_id,
            bu_id=bu_id
        )

        if export_format == ExportFormat.CSV:
            return await self._export_statement_to_csv(statement)
        elif export_format == ExportFormat.JSON:
            return {
                "format": "json",
                "content_type": "application/json",
                "data": statement,
                "filename": f"statement_{client_id}_{from_date}_{to_date}.json"
            }
        elif export_format == ExportFormat.PDF:
            return await self._export_statement_to_pdf(statement)
        elif export_format == ExportFormat.EXCEL:
            return await self._export_statement_to_excel(statement)
        else:
            raise ExportError(f"Unsupported export format: {export_format}", export_format.value)

    async def _export_statement_to_csv(self, statement: Dict[str, Any]) -> Dict[str, Any]:
        """
        Export statement to CSV format.

        Args:
            statement: Statement data dictionary.

        Returns:
            Dict with CSV content and metadata.
        """
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

    async def _export_statement_to_pdf(self, statement: Dict[str, Any]) -> Dict[str, Any]:
        """
        Export statement to PDF format.

        Uses the PDF service for rendering.

        Args:
            statement: Statement data dictionary.

        Returns:
            Dict with PDF generation instructions/data.
        """
        # Build HTML content for PDF generation
        client = statement.get("client", {})
        period = statement.get("period", {})
        totals = statement.get("totals", {})

        # Build transactions table rows
        transactions_rows = ""
        for tx in statement.get("transactions", []):
            transactions_rows += f"""
            <tr>
                <td>{tx.get('date', '')}</td>
                <td>{tx.get('type', '')}</td>
                <td>{tx.get('reference', '')}</td>
                <td>{tx.get('description', '')}</td>
                <td class="text-right">{tx.get('debit', 0):.2f}</td>
                <td class="text-right">{tx.get('credit', 0):.2f}</td>
                <td class="text-right">{tx.get('balance', 0):.2f}</td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Customer Statement - {client.get('company_name', '')}</title>
            <style>
                body {{ font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }}
                .header {{ margin-bottom: 30px; }}
                .title {{ font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }}
                .client-info {{ margin-bottom: 20px; }}
                .period {{ margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 4px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }}
                th {{ background-color: #1e40af; color: white; font-weight: 600; }}
                .text-right {{ text-align: right; }}
                .totals {{ margin-top: 20px; background: #f9fafb; padding: 15px; border-radius: 4px; }}
                .total-row {{ font-size: 14px; font-weight: bold; margin-top: 10px; }}
                .aging {{ margin-top: 20px; }}
                .aging-table {{ width: auto; }}
                .aging-table td {{ padding: 5px 15px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">CUSTOMER STATEMENT</div>
            </div>

            <div class="client-info">
                <strong>{client.get('company_name', '')}</strong><br>
                {client.get('address', '') or ''}<br>
                {client.get('city', '') or ''} {client.get('postal_code', '') or ''}<br>
                {client.get('email', '') or ''}
            </div>

            <div class="period">
                <strong>Statement Period:</strong> {period.get('from_date', '')} to {period.get('to_date', '')}<br>
                <strong>Opening Balance:</strong> {statement.get('opening_balance', 0):.2f}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th class="text-right">Debit</th>
                        <th class="text-right">Credit</th>
                        <th class="text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions_rows if transactions_rows else '<tr><td colspan="7" style="text-align: center;">No transactions in this period</td></tr>'}
                </tbody>
            </table>

            <div class="totals">
                <div>Total Debits: {totals.get('total_debits', 0):.2f}</div>
                <div>Total Credits: {totals.get('total_credits', 0):.2f}</div>
                <div>Net Change: {totals.get('net_change', 0):.2f}</div>
                <div class="total-row">Closing Balance: {statement.get('closing_balance', 0):.2f}</div>
            </div>

            <div class="aging">
                <strong>Aging Summary:</strong>
                <table class="aging-table">
                    <tr>
                        <td>Current (0-30 days):</td>
                        <td>{statement.get('aging_summary', {}).get('current', 0):.2f}</td>
                    </tr>
                    <tr>
                        <td>31-60 days:</td>
                        <td>{statement.get('aging_summary', {}).get('days_31_60', 0):.2f}</td>
                    </tr>
                    <tr>
                        <td>61-90 days:</td>
                        <td>{statement.get('aging_summary', {}).get('days_61_90', 0):.2f}</td>
                    </tr>
                    <tr>
                        <td>Over 90 days:</td>
                        <td>{statement.get('aging_summary', {}).get('over_90', 0):.2f}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 30px; font-size: 10px; color: #6b7280;">
                Generated: {statement.get('generated_at', '')}
            </div>
        </body>
        </html>
        """

        filename = f"statement_{client.get('reference', 'unknown')}_{period.get('from_date', '')}_{period.get('to_date', '')}.pdf"

        return {
            "format": "pdf",
            "content_type": "application/pdf",
            "html_content": html_content,
            "filename": filename,
            "requires_pdf_service": True,
            "message": "Use PDFService.html_to_pdf() to convert HTML to PDF"
        }

    async def _export_statement_to_excel(self, statement: Dict[str, Any]) -> Dict[str, Any]:
        """
        Export statement to Excel format.

        Args:
            statement: Statement data dictionary.

        Returns:
            Dict with Excel generation instructions.
        """
        client = statement.get("client", {})
        period = statement.get("period", {})

        # Prepare data structure for Excel generation
        excel_data = {
            "header": {
                "title": "Customer Statement",
                "client_name": client.get("company_name", ""),
                "client_reference": client.get("reference", ""),
                "period_from": period.get("from_date", ""),
                "period_to": period.get("to_date", ""),
                "generated_at": statement.get("generated_at", "")
            },
            "opening_balance": statement.get("opening_balance", 0),
            "transactions": statement.get("transactions", []),
            "totals": statement.get("totals", {}),
            "closing_balance": statement.get("closing_balance", 0),
            "aging_summary": statement.get("aging_summary", {})
        }

        filename = f"statement_{client.get('reference', 'unknown')}_{period.get('from_date', '')}_{period.get('to_date', '')}.xlsx"

        return {
            "format": "xlsx",
            "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "data": excel_data,
            "filename": filename,
            "requires_excel_library": True,
            "message": "Use openpyxl or xlsxwriter to generate Excel file from data"
        }

    # ==========================================================================
    # Outstanding Balance Methods
    # ==========================================================================

    async def get_client_outstanding_balance(
        self,
        client_id: int,
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get current outstanding balance for a client.

        Args:
            client_id: ID of the client.
            as_of_date: Date to calculate balance as of (default: today).

        Returns:
            Dict with balance details.
        """
        if as_of_date is None:
            as_of_date = date.today()

        client = await self._get_client(client_id)
        if not client:
            raise ClientNotFoundError(client_id)

        balance = await self._calculate_client_balance_as_of(client_id, as_of_date)

        # Get outstanding invoices
        outstanding_stmt = (
            select(
                func.count(ClientInvoice.inv_id).label("count"),
                func.sum(ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid).label("total")
            )
            .where(
                and_(
                    ClientInvoice.inv_cli_id == client_id,
                    ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
                )
            )
        )
        result = await self.db.execute(outstanding_stmt)
        row = result.one()

        return {
            "client_id": client_id,
            "client_name": client.cli_company_name,
            "as_of_date": as_of_date.isoformat(),
            "total_balance": float(balance),
            "outstanding_invoices": {
                "count": row.count or 0,
                "total": float(row.total or Decimal("0"))
            }
        }

    async def get_all_clients_outstanding(
        self,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None,
        min_balance: Optional[Decimal] = None
    ) -> List[Dict[str, Any]]:
        """
        Get outstanding balances for all clients.

        Args:
            society_id: Optional society/company ID filter.
            bu_id: Optional business unit ID filter.
            min_balance: Minimum balance to include (default: include all).

        Returns:
            List of clients with their outstanding balances.
        """
        # Query for outstanding invoices grouped by client
        stmt = (
            select(
                ClientInvoice.inv_cli_id,
                Client.cli_reference,
                Client.cli_company_name,
                func.count(ClientInvoice.inv_id).label("invoice_count"),
                func.sum(ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid).label("outstanding")
            )
            .join(Client, Client.cli_id == ClientInvoice.inv_cli_id)
            .where(
                ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
            )
            .group_by(
                ClientInvoice.inv_cli_id,
                Client.cli_reference,
                Client.cli_company_name
            )
        )

        if society_id:
            stmt = stmt.where(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            stmt = stmt.where(ClientInvoice.inv_bu_id == bu_id)
        if min_balance:
            stmt = stmt.having(func.sum(ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid) >= min_balance)

        stmt = stmt.order_by(func.sum(ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid).desc())

        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "client_id": row.inv_cli_id,
                "client_reference": row.cli_reference,
                "client_name": row.cli_company_name,
                "outstanding_invoice_count": row.invoice_count,
                "outstanding_balance": float(row.outstanding)
            }
            for row in rows
        ]

    # ==========================================================================
    # Private Helper Methods
    # ==========================================================================

    async def _get_client(self, client_id: int) -> Optional[Client]:
        """Get client by ID."""
        stmt = select(Client).where(Client.cli_id == client_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_supplier(self, supplier_id: int) -> Optional[Supplier]:
        """Get supplier by ID."""
        stmt = select(Supplier).where(Supplier.sup_id == supplier_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _calculate_client_balance_as_of(
        self,
        client_id: int,
        as_of_date: date,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> Decimal:
        """
        Calculate client balance as of a specific date.

        Balance = Total invoices - Total payments up to that date.
        """
        # Sum of invoices up to date
        invoices_conditions = [
            ClientInvoice.inv_cli_id == client_id,
            ClientInvoice.inv_date <= as_of_date
        ]
        if society_id:
            invoices_conditions.append(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            invoices_conditions.append(ClientInvoice.inv_bu_id == bu_id)

        invoices_stmt = (
            select(func.sum(ClientInvoice.inv_total_amount))
            .where(and_(*invoices_conditions))
        )
        invoices_result = await self.db.execute(invoices_stmt)
        total_invoices = invoices_result.scalar() or Decimal("0")

        # Sum of payments up to date
        payments_stmt = (
            select(func.sum(Payment.pay_amount))
            .where(
                and_(
                    Payment.pay_cli_id == client_id,
                    Payment.pay_date <= as_of_date
                )
            )
        )
        payments_result = await self.db.execute(payments_stmt)
        total_payments = payments_result.scalar() or Decimal("0")

        return total_invoices - total_payments

    async def _get_client_invoices_in_period(
        self,
        client_id: int,
        from_date: date,
        to_date: date,
        include_paid: bool = True,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
    ) -> List[ClientInvoice]:
        """Get client invoices within date range."""
        conditions = [
            ClientInvoice.inv_cli_id == client_id,
            ClientInvoice.inv_date >= from_date,
            ClientInvoice.inv_date <= to_date
        ]

        if not include_paid:
            conditions.append(ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount)

        if society_id:
            conditions.append(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            conditions.append(ClientInvoice.inv_bu_id == bu_id)

        stmt = (
            select(ClientInvoice)
            .where(and_(*conditions))
            .order_by(ClientInvoice.inv_date.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def _get_client_payments_in_period(
        self,
        client_id: int,
        from_date: date,
        to_date: date
    ) -> List[Payment]:
        """Get client payments within date range."""
        stmt = (
            select(Payment)
            .where(
                and_(
                    Payment.pay_cli_id == client_id,
                    Payment.pay_date >= from_date,
                    Payment.pay_date <= to_date
                )
            )
            .order_by(Payment.pay_date.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def _calculate_client_aging_summary(
        self,
        client_id: int,
        as_of_date: date,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None
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
            ClientInvoice.inv_cli_id == client_id,
            ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
        ]
        if society_id:
            conditions.append(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            conditions.append(ClientInvoice.inv_bu_id == bu_id)

        stmt = (
            select(
                ClientInvoice.inv_due_date,
                (ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid).label("balance")
            )
            .where(and_(*conditions))
        )
        result = await self.db.execute(stmt)
        invoices = result.all()

        buckets = {
            "current": Decimal("0"),
            "days_31_60": Decimal("0"),
            "days_61_90": Decimal("0"),
            "over_90": Decimal("0")
        }

        for invoice in invoices:
            due_date = invoice.inv_due_date.date() if isinstance(invoice.inv_due_date, datetime) else invoice.inv_due_date
            days_overdue = (as_of_date - due_date).days if due_date else 0
            balance = invoice.balance

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

def get_statement_service(db: AsyncSession = Depends(get_db)) -> StatementService:
    """
    Factory function to create StatementService instance.

    Args:
        db: Database session.

    Returns:
        StatementService instance.
    """
    return StatementService(db)

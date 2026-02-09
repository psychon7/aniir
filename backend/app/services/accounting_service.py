"""Service layer for accounting operations."""
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.repositories.accounting_repository import AccountingRepository
from app.schemas.accounting import (
    ReceivablesAgingResponse,
    ReceivablesAgingSummary,
    AgingBucket,
    ClientAgingDetail,
    InvoiceAgingDetail
)


class AccountingService:
    """Service for accounting business logic."""

    # Aging bucket definitions
    AGING_BUCKETS = [
        {"label": "Current", "min_days": -999999, "max_days": 0},
        {"label": "1-30 days", "min_days": 1, "max_days": 30},
        {"label": "31-60 days", "min_days": 31, "max_days": 60},
        {"label": "61-90 days", "min_days": 61, "max_days": 90},
        {"label": "90+ days", "min_days": 91, "max_days": None},
    ]

    def __init__(self, db: Session):
        self.db = db
        self.repository = AccountingRepository(db)

    def _calculate_days_overdue(self, due_date: date, as_of_date: date) -> int:
        """Calculate days overdue (negative means not yet due)."""
        return (as_of_date - due_date).days

    def _get_aging_bucket_label(self, days_overdue: int) -> str:
        """Determine which aging bucket an invoice belongs to."""
        if days_overdue <= 0:
            return "Current"
        elif days_overdue <= 30:
            return "1-30 days"
        elif days_overdue <= 60:
            return "31-60 days"
        elif days_overdue <= 90:
            return "61-90 days"
        else:
            return "90+ days"

    def _round_decimal(self, value: Decimal, places: int = 2) -> Decimal:
        """Round decimal to specified places."""
        return value.quantize(Decimal(10) ** -places, rounding=ROUND_HALF_UP)

    def get_receivables_aging(
        self,
        as_of_date: Optional[date] = None,
        society_id: Optional[int] = None,
        client_id: Optional[int] = None,
        min_amount: Optional[Decimal] = None,
        include_invoices: bool = False,
        currency_id: Optional[int] = None
    ) -> ReceivablesAgingResponse:
        """
        Generate receivables aging report.

        Args:
            as_of_date: Report date (default: today)
            society_id: Filter by society
            client_id: Filter by specific client
            min_amount: Minimum outstanding amount
            include_invoices: Include invoice-level details
            currency_id: Filter by currency

        Returns:
            Complete receivables aging response
        """
        if as_of_date is None:
            as_of_date = date.today()

        # Get all unpaid invoices (returns named-tuple rows)
        invoices = self.repository.get_unpaid_invoices(
            as_of_date=as_of_date,
            society_id=society_id,
            client_id=client_id,
            currency_id=currency_id,
            min_amount=min_amount
        )

        # Initialize bucket totals
        bucket_totals: Dict[str, Dict] = {
            bucket["label"]: {"amount": Decimal("0.00"), "count": 0}
            for bucket in self.AGING_BUCKETS
        }

        # Initialize client aging data
        client_aging: Dict[int, Dict] = {}

        # Process each invoice
        invoice_details: List[InvoiceAgingDetail] = []
        total_weighted_days = Decimal("0.00")
        total_overdue_count = 0

        for invoice in invoices:
            # Extract due_date
            raw_due = invoice.due_date
            if raw_due is None:
                # If no due date, treat as current
                due_dt = as_of_date
            elif isinstance(raw_due, datetime):
                due_dt = raw_due.date()
            else:
                due_dt = raw_due

            days_overdue = self._calculate_days_overdue(due_dt, as_of_date)
            bucket_label = self._get_aging_bucket_label(days_overdue)
            remaining = Decimal(str(invoice.remaining_amount or 0))

            # Update bucket totals
            bucket_totals[bucket_label]["amount"] += remaining
            bucket_totals[bucket_label]["count"] += 1

            # Update client aging
            c_id = invoice.client_id
            if c_id not in client_aging:
                client_aging[c_id] = {
                    "client_id": c_id,
                    "client_reference": invoice.client_reference or "",
                    "client_name": invoice.client_name or "",
                    "current": Decimal("0.00"),
                    "days_1_30": Decimal("0.00"),
                    "days_31_60": Decimal("0.00"),
                    "days_61_90": Decimal("0.00"),
                    "days_over_90": Decimal("0.00"),
                    "total_outstanding": Decimal("0.00"),
                    "oldest_invoice_date": None,
                    "invoice_count": 0,
                    "credit_limit": None,
                }

            # Add to appropriate bucket for client
            if bucket_label == "Current":
                client_aging[c_id]["current"] += remaining
            elif bucket_label == "1-30 days":
                client_aging[c_id]["days_1_30"] += remaining
            elif bucket_label == "31-60 days":
                client_aging[c_id]["days_31_60"] += remaining
            elif bucket_label == "61-90 days":
                client_aging[c_id]["days_61_90"] += remaining
            else:
                client_aging[c_id]["days_over_90"] += remaining

            client_aging[c_id]["total_outstanding"] += remaining
            client_aging[c_id]["invoice_count"] += 1

            # Track oldest invoice
            raw_inv_date = invoice.invoice_date
            if raw_inv_date:
                invoice_date = raw_inv_date.date() if isinstance(raw_inv_date, datetime) else raw_inv_date
                if (client_aging[c_id]["oldest_invoice_date"] is None or
                        invoice_date < client_aging[c_id]["oldest_invoice_date"]):
                    client_aging[c_id]["oldest_invoice_date"] = invoice_date
            else:
                invoice_date = None

            # Calculate weighted days for average
            if days_overdue > 0:
                total_weighted_days += remaining * days_overdue
                total_overdue_count += 1

            # Build invoice detail if requested
            if include_invoices:
                invoice_details.append(InvoiceAgingDetail(
                    invoice_id=invoice.invoice_id,
                    invoice_reference=invoice.invoice_reference or "",
                    client_id=c_id,
                    client_name=invoice.client_name or "",
                    invoice_date=invoice_date or as_of_date,
                    due_date=due_dt,
                    days_overdue=max(0, days_overdue),
                    total_amount=Decimal(str(invoice.total_amount or 0)),
                    paid_amount=Decimal(str((invoice.total_amount or 0) - (invoice.remaining_amount or 0))),
                    remaining_amount=remaining,
                    aging_bucket=bucket_label,
                    currency_code=invoice.currency_code or "EUR"
                ))

        # Calculate totals
        total_receivables = sum(b["amount"] for b in bucket_totals.values())
        total_current = bucket_totals["Current"]["amount"]
        total_overdue = total_receivables - total_current

        # Build aging buckets response
        aging_buckets: List[AgingBucket] = []
        for bucket_def in self.AGING_BUCKETS:
            label = bucket_def["label"]
            bucket_data = bucket_totals[label]
            percentage = (
                self._round_decimal((bucket_data["amount"] / total_receivables) * 100)
                if total_receivables > 0 else Decimal("0.00")
            )
            aging_buckets.append(AgingBucket(
                label=label,
                min_days=bucket_def["min_days"],
                max_days=bucket_def["max_days"],
                amount=self._round_decimal(bucket_data["amount"]),
                count=bucket_data["count"],
                percentage=percentage
            ))

        # Calculate averages
        total_invoice_count = sum(b["count"] for b in bucket_totals.values())
        average_days = (
            self._round_decimal(Decimal(str(total_overdue_count)))
            if total_invoice_count > 0 else Decimal("0.00")
        )
        weighted_average = (
            self._round_decimal(total_weighted_days / total_overdue)
            if total_overdue > 0 else Decimal("0.00")
        )

        # Build summary
        summary = ReceivablesAgingSummary(
            as_of_date=as_of_date,
            total_receivables=self._round_decimal(total_receivables),
            total_overdue=self._round_decimal(total_overdue),
            total_current=self._round_decimal(total_current),
            overdue_percentage=(
                self._round_decimal((total_overdue / total_receivables) * 100)
                if total_receivables > 0 else Decimal("0.00")
            ),
            buckets=aging_buckets,
            average_days_outstanding=average_days,
            weighted_average_days=weighted_average
        )

        # Build client aging details
        client_details: List[ClientAgingDetail] = []
        for client_data in client_aging.values():
            client_details.append(ClientAgingDetail(
                client_id=client_data["client_id"],
                client_reference=client_data["client_reference"],
                client_name=client_data["client_name"],
                current=self._round_decimal(client_data["current"]),
                days_1_30=self._round_decimal(client_data["days_1_30"]),
                days_31_60=self._round_decimal(client_data["days_31_60"]),
                days_61_90=self._round_decimal(client_data["days_61_90"]),
                days_over_90=self._round_decimal(client_data["days_over_90"]),
                total_outstanding=self._round_decimal(client_data["total_outstanding"]),
                oldest_invoice_date=client_data["oldest_invoice_date"],
                invoice_count=client_data["invoice_count"],
                credit_limit=client_data["credit_limit"],
                credit_utilization=None
            ))

        # Sort clients by total outstanding (descending)
        client_details.sort(key=lambda x: x.total_outstanding, reverse=True)

        # Sort invoices by days overdue (descending) if included
        if include_invoices:
            invoice_details.sort(key=lambda x: x.days_overdue, reverse=True)

        return ReceivablesAgingResponse(
            summary=summary,
            by_client=client_details,
            invoices=invoice_details if include_invoices else None
        )



# =============================================================================
# Dependency Function
# =============================================================================

def get_accounting_service(db: Session = Depends(get_db)) -> AccountingService:
    """Dependency for getting accounting service."""
    return AccountingService(db)

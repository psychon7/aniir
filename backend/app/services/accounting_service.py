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
        
        # Get all unpaid invoices
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
        total_days = 0
        
        for invoice in invoices:
            days_overdue = self._calculate_days_overdue(
                invoice.DueDate.date() if isinstance(invoice.DueDate, datetime) else invoice.DueDate,
                as_of_date
            )
            bucket_label = self._get_aging_bucket_label(days_overdue)
            remaining = Decimal(str(invoice.RemainingAmount))
            
            # Update bucket totals
            bucket_totals[bucket_label]["amount"] += remaining
            bucket_totals[bucket_label]["count"] += 1
            
            # Update client aging
            client_id_key = invoice.ClientId
            if client_id_key not in client_aging:
                client = invoice.client
                client_aging[client_id_key] = {
                    "client_id": client_id_key,
                    "client_reference": client.Reference,
                    "client_name": client.Name,
                    "current": Decimal("0.00"),
                    "days_1_30": Decimal("0.00"),
                    "days_31_60": Decimal("0.00"),
                    "days_61_90": Decimal("0.00"),
                    "days_over_90": Decimal("0.00"),
                    "total_outstanding": Decimal("0.00"),
                    "oldest_invoice_date": None,
                    "invoice_count": 0,
                    "credit_limit": Decimal(str(client.CreditLimit)) if client.CreditLimit else None
                }
            
            # Add to appropriate bucket for client
            if bucket_label == "Current":
                client_aging[client_id_key]["current"] += remaining
            elif bucket_label == "1-30 days":
                client_aging[client_id_key]["days_1_30"] += remaining
            elif bucket_label == "31-60 days":
                client_aging[client_id_key]["days_31_60"] += remaining
            elif bucket_label == "61-90 days":
                client_aging[client_id_key]["days_61_90"] += remaining
            else:
                client_aging[client_id_key]["days_over_90"] += remaining
            
            client_aging[client_id_key]["total_outstanding"] += remaining
            client_aging[client_id_key]["invoice_count"] += 1
            
            # Track oldest invoice
            invoice_date = invoice.InvoiceDate.date() if isinstance(invoice.InvoiceDate, datetime) else invoice.InvoiceDate
            if (client_aging[client_id_key]["oldest_invoice_date"] is None or 
                invoice_date < client_aging[client_id_key]["oldest_invoice_date"]):
                client_aging[client_id_key]["oldest_invoice_date"] = invoice_date
            
            # Calculate weighted days for average
            if days_overdue > 0:
                total_weighted_days += remaining * days_overdue
                total_days += days_overdue
            
            # Build invoice detail if requested
            if include_invoices:
                invoice_details.append(InvoiceAgingDetail(
                    invoice_id=invoice.Id,
                    invoice_reference=invoice.Reference,
                    client_id=invoice.ClientId,
                    client_name=invoice.client.Name,
                    invoice_date=invoice_date,
                    due_date=invoice.DueDate.date() if isinstance(invoice.DueDate, datetime) else invoice.DueDate,
                    days_overdue=max(0, days_overdue),
                    total_amount=Decimal(str(invoice.TotalTTC)),
                    paid_amount=Decimal(str(invoice.PaidAmount)),
                    remaining_amount=remaining,
                    aging_bucket=bucket_label,
                    currency_code=invoice.currency.Code if invoice.currency else "EUR"
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
            self._round_decimal(Decimal(str(total_days)) / total_invoice_count)
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
            credit_utilization = None
            if client_data["credit_limit"] and client_data["credit_limit"] > 0:
                credit_utilization = self._round_decimal(
                    (client_data["total_outstanding"] / client_data["credit_limit"]) * 100
                )
            
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
                credit_utilization=credit_utilization
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

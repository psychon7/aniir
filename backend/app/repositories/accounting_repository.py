"""Repository for accounting-related database operations."""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func, case, and_, or_
from sqlalchemy.orm import Session, joinedload

# Use the correct model from invoice.py
from app.models.invoice import ClientInvoice
from app.models.client import Client


class AccountingRepository:
    """Repository for accounting data access."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_unpaid_invoices(
        self,
        as_of_date: date,
        society_id: Optional[int] = None,
        client_id: Optional[int] = None,
        currency_id: Optional[int] = None,
        min_amount: Optional[Decimal] = None
    ) -> List[ClientInvoice]:
        """
        Get all unpaid invoices as of a specific date.
        
        Args:
            as_of_date: The date to calculate aging from
            society_id: Optional filter by society
            client_id: Optional filter by client
            currency_id: Optional filter by currency
            min_amount: Optional minimum remaining amount
            
        Returns:
            List of unpaid invoices with related data
        """
        query = self.db.query(ClientInvoice).options(
            joinedload(ClientInvoice.client),
            joinedload(ClientInvoice.currency),
            joinedload(ClientInvoice.status)
        ).filter(
            ClientInvoice.IsActive == True,
            ClientInvoice.RemainingAmount > 0,
            ClientInvoice.InvoiceDate <= as_of_date
        )
        
        if society_id:
            query = query.filter(ClientInvoice.SocietyId == society_id)
        
        if client_id:
            query = query.filter(ClientInvoice.ClientId == client_id)
        
        if currency_id:
            query = query.filter(ClientInvoice.CurrencyId == currency_id)
        
        if min_amount:
            query = query.filter(ClientInvoice.RemainingAmount >= min_amount)
        
        return query.all()
    
    def get_aging_summary_by_bucket(
        self,
        as_of_date: date,
        society_id: Optional[int] = None,
        currency_id: Optional[int] = None
    ) -> List[Tuple]:
        """
        Get aggregated aging data by bucket directly from database.
        
        Returns tuples of (bucket_name, total_amount, invoice_count)
        """
        # Calculate days overdue
        days_overdue = func.datediff(
            as_of_date,
            ClientInvoice.DueDate
        )
        
        # Define bucket cases
        bucket_case = case(
            (days_overdue <= 0, 'Current'),
            (and_(days_overdue >= 1, days_overdue <= 30), '1-30 days'),
            (and_(days_overdue >= 31, days_overdue <= 60), '31-60 days'),
            (and_(days_overdue >= 61, days_overdue <= 90), '61-90 days'),
            else_='90+ days'
        )
        
        query = self.db.query(
            bucket_case.label('bucket'),
            func.sum(ClientInvoice.RemainingAmount).label('total_amount'),
            func.count(ClientInvoice.Id).label('invoice_count')
        ).filter(
            ClientInvoice.IsActive == True,
            ClientInvoice.RemainingAmount > 0,
            ClientInvoice.InvoiceDate <= as_of_date
        )
        
        if society_id:
            query = query.filter(ClientInvoice.SocietyId == society_id)
        
        if currency_id:
            query = query.filter(ClientInvoice.CurrencyId == currency_id)
        
        return query.group_by(bucket_case).all()
    
    def get_client_with_credit_info(self, client_id: int) -> Optional[Client]:
        """Get client with credit limit information."""
        return self.db.query(Client).filter(
            Client.Id == client_id,
            Client.IsActive == True
        ).first()
    
    def get_clients_with_outstanding(
        self,
        as_of_date: date,
        society_id: Optional[int] = None
    ) -> List[Tuple]:
        """
        Get all clients with outstanding balances.
        
        Returns tuples of (client_id, client_reference, client_name, total_outstanding, credit_limit)
        """
        query = self.db.query(
            Client.Id,
            Client.Reference,
            Client.Name,
            func.sum(ClientInvoice.RemainingAmount).label('total_outstanding'),
            Client.CreditLimit
        ).join(
            ClientInvoice, Client.Id == ClientInvoice.ClientId
        ).filter(
            Client.IsActive == True,
            ClientInvoice.IsActive == True,
            ClientInvoice.RemainingAmount > 0,
            ClientInvoice.InvoiceDate <= as_of_date
        )
        
        if society_id:
            query = query.filter(ClientInvoice.SocietyId == society_id)
        
        return query.group_by(
            Client.Id,
            Client.Reference,
            Client.Name,
            Client.CreditLimit
        ).all()

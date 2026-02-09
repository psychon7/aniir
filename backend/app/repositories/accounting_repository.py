"""Repository for accounting-related database operations."""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func, case, and_, or_
from sqlalchemy.orm import Session, joinedload

from app.models.invoice import ClientInvoice
from app.models.client_invoice_line import ClientInvoiceLine
from app.models.client import Client
from app.models.currency import Currency


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
    ) -> List:
        """
        Get all unpaid invoices as of a specific date.

        Returns list of row-like objects with invoice + client + currency data.
        """
        # Subquery for line totals per invoice
        line_totals = (
            self.db.query(
                ClientInvoiceLine.cin_id,
                func.coalesce(
                    func.sum(ClientInvoiceLine.cii_price_with_discount_ht),
                    Decimal("0")
                ).label("total_amount"),
            )
            .group_by(ClientInvoiceLine.cin_id)
            .subquery()
        )

        query = (
            self.db.query(
                ClientInvoice.cin_id.label("invoice_id"),
                ClientInvoice.cin_code.label("invoice_reference"),
                ClientInvoice.cli_id.label("client_id"),
                ClientInvoice.cin_d_invoice.label("invoice_date"),
                ClientInvoice.cin_d_term.label("due_date"),
                ClientInvoice.cin_rest_to_pay.label("remaining_amount"),
                ClientInvoice.cin_is_full_paid.label("is_full_paid"),
                ClientInvoice.soc_id.label("society_id"),
                ClientInvoice.cur_id.label("currency_id"),
                func.coalesce(line_totals.c.total_amount, Decimal("0")).label("total_amount"),
                Client.cli_ref.label("client_reference"),
                Client.cli_company_name.label("client_name"),
                Currency.cur_designation.label("currency_code"),
            )
            .outerjoin(Client, ClientInvoice.cli_id == Client.cli_id)
            .outerjoin(Currency, ClientInvoice.cur_id == Currency.cur_id)
            .outerjoin(line_totals, ClientInvoice.cin_id == line_totals.c.cin_id)
            .filter(
                ClientInvoice.cin_isinvoice == True,
                ClientInvoice.cin_is_full_paid != True,
                or_(
                    and_(ClientInvoice.cin_d_invoice != None, ClientInvoice.cin_d_invoice <= as_of_date),
                    and_(ClientInvoice.cin_d_invoice == None, ClientInvoice.cin_d_creation <= as_of_date),
                ),
            )
        )

        if society_id:
            query = query.filter(ClientInvoice.soc_id == society_id)

        if client_id:
            query = query.filter(ClientInvoice.cli_id == client_id)

        if currency_id:
            query = query.filter(ClientInvoice.cur_id == currency_id)

        if min_amount:
            query = query.filter(ClientInvoice.cin_rest_to_pay >= min_amount)

        return query.all()

    def get_clients_with_outstanding(
        self,
        as_of_date: date,
        society_id: Optional[int] = None
    ) -> List[Tuple]:
        """
        Get all clients with outstanding balances.

        Returns tuples of (client_id, client_reference, client_name, total_outstanding)
        """
        query = self.db.query(
            Client.cli_id,
            Client.cli_ref,
            Client.cli_company_name,
            func.sum(ClientInvoice.cin_rest_to_pay).label('total_outstanding'),
        ).join(
            ClientInvoice, Client.cli_id == ClientInvoice.cli_id
        ).filter(
            ClientInvoice.cin_isinvoice == True,
            ClientInvoice.cin_is_full_paid != True,
            or_(
                and_(ClientInvoice.cin_d_invoice != None, ClientInvoice.cin_d_invoice <= as_of_date),
                and_(ClientInvoice.cin_d_invoice == None, ClientInvoice.cin_d_creation <= as_of_date),
            ),
        )

        if society_id:
            query = query.filter(ClientInvoice.soc_id == society_id)

        return query.group_by(
            Client.cli_id,
            Client.cli_ref,
            Client.cli_company_name,
        ).all()

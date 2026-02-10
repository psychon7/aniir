"""
Client Activity Service.
Aggregates quotes, orders, deliveries, invoices, and payments
into a unified timeline for a specific client.
"""
import asyncio
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.schemas.client_activity import ActivityItem, ActivityResponse


class ClientActivityService:
    def __init__(self, db: Session):
        self.db = db

    def _sync_get_activity(
        self,
        client_id: int,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[str] = None,
    ) -> ActivityResponse:
        """Fetch aggregated activity for a client."""
        items: List[ActivityItem] = []

        # Import models here to avoid circular imports
        from app.models.costplan import CostPlan
        from app.models.order import ClientOrder
        from app.models.delivery_form import DeliveryForm
        from app.models.invoice import ClientInvoice
        from app.models.client_invoice_payment import ClientInvoicePayment

        # Quotes (CostPlan)
        if not entity_type or entity_type == "quote":
            if not getattr(CostPlan, '__disabled__', False):
                try:
                    query = select(CostPlan).where(CostPlan.cli_id == client_id)
                    result = self.db.execute(query)
                    for row in result.scalars().all():
                        items.append(ActivityItem(
                            id=row.cpl_id,
                            entityType="quote",
                            reference=getattr(row, 'cpl_code', None),
                            date=getattr(row, 'cpl_d_creation', None) or getattr(row, 'cpl_d_update', None),
                            amount=None,
                            status=None,
                            description=getattr(row, 'cpl_name', None),
                        ))
                except Exception:
                    pass  # Table may not exist

        # Orders (ClientOrder)
        if not entity_type or entity_type == "order":
            if not getattr(ClientOrder, '__disabled__', False):
                try:
                    query = select(ClientOrder).where(ClientOrder.cli_id == client_id)
                    result = self.db.execute(query)
                    for row in result.scalars().all():
                        items.append(ActivityItem(
                            id=row.cod_id,
                            entityType="order",
                            reference=getattr(row, 'cod_code', None),
                            date=getattr(row, 'cod_d_creation', None),
                            amount=None,
                            status=None,
                            description=getattr(row, 'cod_name', None),
                        ))
                except Exception:
                    pass

        # Deliveries (DeliveryForm)
        if not entity_type or entity_type == "delivery":
            if not getattr(DeliveryForm, '__disabled__', False):
                try:
                    query = select(DeliveryForm).where(DeliveryForm.cli_id == client_id)
                    result = self.db.execute(query)
                    for row in result.scalars().all():
                        items.append(ActivityItem(
                            id=row.dfo_id,
                            entityType="delivery",
                            reference=getattr(row, 'dfo_code', None),
                            date=getattr(row, 'dfo_d_creation', None),
                            amount=None,
                            status=None,
                            description=None,
                        ))
                except Exception:
                    pass

        # Invoices (ClientInvoice)
        if not entity_type or entity_type == "invoice":
            if not getattr(ClientInvoice, '__disabled__', False):
                try:
                    query = select(ClientInvoice).where(ClientInvoice.cli_id == client_id)
                    result = self.db.execute(query)
                    for row in result.scalars().all():
                        items.append(ActivityItem(
                            id=row.cin_id,
                            entityType="invoice",
                            reference=getattr(row, 'cin_code', None),
                            date=getattr(row, 'cin_d_creation', None),
                            amount=None,
                            status=None,
                            description=getattr(row, 'cin_name', None),
                        ))
                except Exception:
                    pass

        # Payments (linked via invoice -> client)
        if not entity_type or entity_type == "payment":
            if not getattr(ClientInvoicePayment, '__disabled__', False):
                try:
                    if not getattr(ClientInvoice, '__disabled__', False):
                        query = (
                            select(ClientInvoicePayment)
                            .join(
                                ClientInvoice,
                                ClientInvoicePayment.cin_id == ClientInvoice.cin_id,
                            )
                            .where(ClientInvoice.cli_id == client_id)
                        )
                        result = self.db.execute(query)
                        for row in result.scalars().all():
                            items.append(ActivityItem(
                                id=row.cpy_id,
                                entityType="payment",
                                reference=None,
                                date=getattr(row, 'cpy_d_create', None),
                                amount=float(getattr(row, 'cpy_amount', 0) or 0),
                                status=None,
                                description=getattr(row, 'cpy_comment', None),
                            ))
                except Exception:
                    pass

        # Sort by date descending
        items.sort(key=lambda x: x.date if x.date else datetime.min, reverse=True)

        # Paginate
        total_count = len(items)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_items = items[start:end]

        return ActivityResponse(
            success=True,
            data=paginated_items,
            totalCount=total_count,
            page=page,
            pageSize=page_size,
            hasMore=end < total_count,
        )

    async def get_activity(
        self,
        client_id: int,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[str] = None,
    ) -> ActivityResponse:
        """Async wrapper for activity aggregation."""
        return await asyncio.to_thread(
            self._sync_get_activity, client_id, page, page_size, entity_type
        )


def get_client_activity_service(
    db: Session = Depends(get_db),
) -> ClientActivityService:
    return ClientActivityService(db)

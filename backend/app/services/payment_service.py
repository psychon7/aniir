"""
Payment service - uses legacy payment tables.

Client payments: TM_CPY_ClientInvoice_Payment
Supplier payments: TR_SPR_SupplierOrder_Payment_Record
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Tuple
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, or_, desc, asc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.currency import Currency
from app.models.invoice import ClientInvoice
from app.models.client_invoice_payment import ClientInvoicePayment
from app.models.payment_mode import PaymentMode
from app.models.society import Society
from app.models.supplier import Supplier
from app.models.supplier_order import SupplierOrder
from app.models.supplier_order_payment_record import SupplierOrderPaymentRecord
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentType,
)


class PaymentService:
    """Service class for payment business logic."""

    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _reference_from_client_payment(payment: ClientInvoicePayment) -> str:
        if payment.cpy_guid:
            return payment.cpy_guid
        return f"CPY-{payment.cpy_id}"

    @staticmethod
    def _reference_from_supplier_payment(payment: SupplierOrderPaymentRecord) -> str:
        if payment.spr_payment_code:
            return payment.spr_payment_code
        if payment.spr_guid:
            return payment.spr_guid
        return f"SPR-{payment.spr_id}"

    def _build_client_payment_response(
        self,
        payment: ClientInvoicePayment,
        invoice: Optional[ClientInvoice] = None,
        client: Optional[Client] = None,
        currency: Optional[Currency] = None,
        payment_mode: Optional[PaymentMode] = None,
        society: Optional[Society] = None,
    ) -> PaymentResponse:
        return PaymentResponse(
            id=payment.cpy_id,
            reference=self._reference_from_client_payment(payment),
            paymentType=PaymentType.CLIENT,
            clientId=invoice.cli_id if invoice else None,
            clientName=client.cli_company_name if client else None,
            supplierId=None,
            supplierName=None,
            invoiceId=payment.cin_id,
            invoiceReference=invoice.cin_code if invoice else None,
            supplierOrderId=None,
            supplierOrderReference=None,
            amount=payment.cpy_amount,
            currencyId=invoice.cur_id if invoice else None,
            currencyCode=currency.cur_designation if currency else None,
            paymentDate=payment.cpy_d_create,
            paymentModeId=invoice.pmo_id if invoice else None,
            paymentModeName=payment_mode.pmo_designation if payment_mode else None,
            statusId=1,
            statusName="Paid",
            businessUnitId=None,
            businessUnitName=None,
            societyId=invoice.soc_id if invoice else None,
            societyName=society.soc_society_name if society else None,
            notes=payment.cpy_comment,
            createdAt=payment.cpy_d_create,
            updatedAt=None,
            isReconciled=False,
        )

    def _build_supplier_payment_response(
        self,
        payment: SupplierOrderPaymentRecord,
        order: Optional[SupplierOrder] = None,
        supplier: Optional[Supplier] = None,
        currency: Optional[Currency] = None,
        society: Optional[Society] = None,
    ) -> PaymentResponse:
        return PaymentResponse(
            id=payment.spr_id,
            reference=self._reference_from_supplier_payment(payment),
            paymentType=PaymentType.SUPPLIER,
            clientId=None,
            clientName=supplier.sup_company_name if supplier else None,
            supplierId=supplier.sup_id if supplier else None,
            supplierName=supplier.sup_company_name if supplier else None,
            invoiceId=None,
            invoiceReference=None,
            supplierOrderId=payment.sod_id,
            supplierOrderReference=order.sod_code if order else None,
            amount=payment.spr_amount,
            currencyId=order.cur_id if order else None,
            currencyCode=currency.cur_designation if currency else None,
            paymentDate=payment.spr_d_payment,
            paymentModeId=None,
            paymentModeName=None,
            statusId=1,
            statusName="Paid",
            businessUnitId=None,
            businessUnitName=None,
            societyId=order.soc_id if order else None,
            societyName=society.soc_society_name if society else None,
            notes=payment.spr_comment,
            createdAt=payment.spr_d_creation,
            updatedAt=payment.spr_d_update,
            isReconciled=False,
        )

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def _query_client_payments(
        self,
        search: Optional[str],
        client_id: Optional[int],
        invoice_id: Optional[int],
        payment_mode_id: Optional[int],
        society_id: Optional[int],
        date_from: Optional[datetime],
        date_to: Optional[datetime],
        min_amount: Optional[Decimal],
        max_amount: Optional[Decimal],
    ) -> List[PaymentResponse]:
        stmt = (
            select(
                ClientInvoicePayment,
                ClientInvoice,
                Client,
                Currency,
                PaymentMode,
                Society,
            )
            .join(ClientInvoice, ClientInvoice.cin_id == ClientInvoicePayment.cin_id)
            .join(Client, Client.cli_id == ClientInvoice.cli_id)
            .join(Currency, Currency.cur_id == ClientInvoice.cur_id)
            .join(PaymentMode, PaymentMode.pmo_id == ClientInvoice.pmo_id)
            .join(Society, Society.soc_id == ClientInvoice.soc_id)
        )

        if search:
            term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    ClientInvoice.cin_code.ilike(term),
                    ClientInvoicePayment.cpy_guid.ilike(term),
                )
            )
        if client_id:
            stmt = stmt.where(ClientInvoice.cli_id == client_id)
        if invoice_id:
            stmt = stmt.where(ClientInvoice.cin_id == invoice_id)
        if payment_mode_id:
            stmt = stmt.where(ClientInvoice.pmo_id == payment_mode_id)
        if society_id:
            stmt = stmt.where(ClientInvoice.soc_id == society_id)
        if date_from:
            stmt = stmt.where(ClientInvoicePayment.cpy_d_create >= date_from)
        if date_to:
            stmt = stmt.where(ClientInvoicePayment.cpy_d_create <= date_to)
        if min_amount is not None:
            stmt = stmt.where(ClientInvoicePayment.cpy_amount >= min_amount)
        if max_amount is not None:
            stmt = stmt.where(ClientInvoicePayment.cpy_amount <= max_amount)

        rows = self.db.execute(stmt).all()
        return [
            self._build_client_payment_response(row[0], row[1], row[2], row[3], row[4], row[5])
            for row in rows
        ]

    def _query_supplier_payments(
        self,
        search: Optional[str],
        supplier_id: Optional[int],
        society_id: Optional[int],
        date_from: Optional[datetime],
        date_to: Optional[datetime],
        min_amount: Optional[Decimal],
        max_amount: Optional[Decimal],
    ) -> List[PaymentResponse]:
        stmt = (
            select(
                SupplierOrderPaymentRecord,
                SupplierOrder,
                Supplier,
                Currency,
                Society,
            )
            .join(SupplierOrder, SupplierOrder.sod_id == SupplierOrderPaymentRecord.sod_id)
            .join(Supplier, Supplier.sup_id == SupplierOrder.sup_id)
            .join(Currency, Currency.cur_id == SupplierOrder.cur_id)
            .join(Society, Society.soc_id == SupplierOrder.soc_id)
        )

        if search:
            term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    SupplierOrder.sod_code.ilike(term),
                    SupplierOrderPaymentRecord.spr_payment_code.ilike(term),
                    SupplierOrderPaymentRecord.spr_guid.ilike(term),
                )
            )
        if supplier_id:
            stmt = stmt.where(SupplierOrder.sup_id == supplier_id)
        if society_id:
            stmt = stmt.where(SupplierOrder.soc_id == society_id)
        if date_from:
            stmt = stmt.where(SupplierOrderPaymentRecord.spr_d_payment >= date_from)
        if date_to:
            stmt = stmt.where(SupplierOrderPaymentRecord.spr_d_payment <= date_to)
        if min_amount is not None:
            stmt = stmt.where(SupplierOrderPaymentRecord.spr_amount >= min_amount)
        if max_amount is not None:
            stmt = stmt.where(SupplierOrderPaymentRecord.spr_amount <= max_amount)

        rows = self.db.execute(stmt).all()
        return [
            self._build_supplier_payment_response(row[0], row[1], row[2], row[3], row[4])
            for row in rows
        ]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def list_payments(
        self,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        client_id: Optional[int] = None,
        supplier_id: Optional[int] = None,
        invoice_id: Optional[int] = None,
        payment_type: Optional[PaymentType] = None,
        payment_mode_id: Optional[int] = None,
        society_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        min_amount: Optional[Decimal] = None,
        max_amount: Optional[Decimal] = None,
        sort_by: str = "paymentDate",
        sort_order: str = "desc",
    ) -> tuple[List[PaymentResponse], int]:
        items: List[PaymentResponse] = []

        if payment_type in (None, PaymentType.CLIENT):
            items.extend(
                self._query_client_payments(
                    search=search,
                    client_id=client_id,
                    invoice_id=invoice_id,
                    payment_mode_id=payment_mode_id,
                    society_id=society_id,
                    date_from=date_from,
                    date_to=date_to,
                    min_amount=min_amount,
                    max_amount=max_amount,
                )
            )

        if payment_type in (None, PaymentType.SUPPLIER):
            items.extend(
                self._query_supplier_payments(
                    search=search,
                    supplier_id=supplier_id,
                    society_id=society_id,
                    date_from=date_from,
                    date_to=date_to,
                    min_amount=min_amount,
                    max_amount=max_amount,
                )
            )

        reverse = sort_order.lower() != "asc"
        if sort_by == "amount":
            items.sort(key=lambda item: item.amount or Decimal("0"), reverse=reverse)
        elif sort_by == "reference":
            items.sort(key=lambda item: item.reference or "", reverse=reverse)
        else:
            items.sort(key=lambda item: item.paymentDate or datetime.min, reverse=reverse)

        total = len(items)
        offset = (page - 1) * page_size
        paged = items[offset : offset + page_size]
        return paged, total

    def create_payment(self, data: PaymentCreate) -> PaymentResponse:
        if data.paymentType == PaymentType.CLIENT:
            if not data.invoiceId:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="invoiceId is required for client payments",
                )

            invoice = self.db.execute(
                select(ClientInvoice).where(ClientInvoice.cin_id == data.invoiceId)
            ).scalar_one_or_none()
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Invoice {data.invoiceId} not found",
                )

            payment = ClientInvoicePayment(
                cin_id=data.invoiceId,
                cpy_amount=data.amount,
                cpy_d_create=data.paymentDate,
                cpy_comment=data.notes,
                cpy_file=data.filePath,
                cpy_guid=data.guid or data.transactionId or data.bankReference or uuid4().hex,
            )
            self.db.add(payment)
            self.db.commit()
            self.db.refresh(payment)

            client = self.db.execute(
                select(Client).where(Client.cli_id == invoice.cli_id)
            ).scalar_one_or_none()
            currency = self.db.execute(
                select(Currency).where(Currency.cur_id == invoice.cur_id)
            ).scalar_one_or_none()
            payment_mode = self.db.execute(
                select(PaymentMode).where(PaymentMode.pmo_id == invoice.pmo_id)
            ).scalar_one_or_none()
            society = self.db.execute(
                select(Society).where(Society.soc_id == invoice.soc_id)
            ).scalar_one_or_none()

            return self._build_client_payment_response(payment, invoice, client, currency, payment_mode, society)

        if not data.supplierOrderId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="supplierOrderId is required for supplier payments",
            )

        order = self.db.execute(
            select(SupplierOrder).where(SupplierOrder.sod_id == data.supplierOrderId)
        ).scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Supplier order {data.supplierOrderId} not found",
            )

        payment_code = data.paymentCode or data.transactionId or data.bankReference or data.checkNumber
        payment = SupplierOrderPaymentRecord(
            spr_d_creation=datetime.utcnow(),
            spr_d_payment=data.paymentDate,
            spr_amount=data.amount,
            spr_comment=data.notes,
            sod_id=data.supplierOrderId,
            sol_id=data.supplierOrderLineId,
            spr_file=data.filePath,
            spr_payment_code=payment_code,
            spr_guid=data.guid or uuid4().hex,
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)

        supplier = self.db.execute(
            select(Supplier).where(Supplier.sup_id == order.sup_id)
        ).scalar_one_or_none()
        currency = self.db.execute(
            select(Currency).where(Currency.cur_id == order.cur_id)
        ).scalar_one_or_none()
        society = self.db.execute(
            select(Society).where(Society.soc_id == order.soc_id)
        ).scalar_one_or_none()

        return self._build_supplier_payment_response(payment, order, supplier, currency, society)

    def get_payment_by_id(self, payment_id: int) -> Optional[PaymentResponse]:
        payment_row = self.db.execute(
            select(ClientInvoicePayment, ClientInvoice, Client, Currency, PaymentMode, Society)
            .join(ClientInvoice, ClientInvoice.cin_id == ClientInvoicePayment.cin_id)
            .join(Client, Client.cli_id == ClientInvoice.cli_id)
            .join(Currency, Currency.cur_id == ClientInvoice.cur_id)
            .join(PaymentMode, PaymentMode.pmo_id == ClientInvoice.pmo_id)
            .join(Society, Society.soc_id == ClientInvoice.soc_id)
            .where(ClientInvoicePayment.cpy_id == payment_id)
        ).first()

        if payment_row:
            return self._build_client_payment_response(*payment_row)

        supplier_row = self.db.execute(
            select(SupplierOrderPaymentRecord, SupplierOrder, Supplier, Currency, Society)
            .join(SupplierOrder, SupplierOrder.sod_id == SupplierOrderPaymentRecord.sod_id)
            .join(Supplier, Supplier.sup_id == SupplierOrder.sup_id)
            .join(Currency, Currency.cur_id == SupplierOrder.cur_id)
            .join(Society, Society.soc_id == SupplierOrder.soc_id)
            .where(SupplierOrderPaymentRecord.spr_id == payment_id)
        ).first()

        if supplier_row:
            return self._build_supplier_payment_response(*supplier_row)

        return None

    def get_payment_by_reference(self, reference: str) -> Optional[PaymentResponse]:
        if reference.upper().startswith("CPY-"):
            try:
                payment_id = int(reference.split("-", 1)[1])
                return self.get_payment_by_id(payment_id)
            except (ValueError, IndexError):
                pass
        if reference.upper().startswith("SPR-"):
            try:
                payment_id = int(reference.split("-", 1)[1])
                return self.get_payment_by_id(payment_id)
            except (ValueError, IndexError):
                pass

        payment_row = self.db.execute(
            select(ClientInvoicePayment, ClientInvoice, Client, Currency, PaymentMode, Society)
            .join(ClientInvoice, ClientInvoice.cin_id == ClientInvoicePayment.cin_id)
            .join(Client, Client.cli_id == ClientInvoice.cli_id)
            .join(Currency, Currency.cur_id == ClientInvoice.cur_id)
            .join(PaymentMode, PaymentMode.pmo_id == ClientInvoice.pmo_id)
            .join(Society, Society.soc_id == ClientInvoice.soc_id)
            .where(ClientInvoicePayment.cpy_guid == reference)
        ).first()
        if payment_row:
            return self._build_client_payment_response(*payment_row)

        supplier_row = self.db.execute(
            select(SupplierOrderPaymentRecord, SupplierOrder, Supplier, Currency, Society)
            .join(SupplierOrder, SupplierOrder.sod_id == SupplierOrderPaymentRecord.sod_id)
            .join(Supplier, Supplier.sup_id == SupplierOrder.sup_id)
            .join(Currency, Currency.cur_id == SupplierOrder.cur_id)
            .join(Society, Society.soc_id == SupplierOrder.soc_id)
            .where(
                or_(
                    SupplierOrderPaymentRecord.spr_payment_code == reference,
                    SupplierOrderPaymentRecord.spr_guid == reference,
                )
            )
        ).first()
        if supplier_row:
            return self._build_supplier_payment_response(*supplier_row)

        return None

    def update_payment(self, payment_id: int, data: PaymentUpdate) -> Optional[PaymentResponse]:
        payment_type = data.paymentType

        if payment_type in (None, PaymentType.CLIENT):
            payment = self.db.execute(
                select(ClientInvoicePayment).where(ClientInvoicePayment.cpy_id == payment_id)
            ).scalar_one_or_none()
            if payment:
                if data.amount is not None:
                    payment.cpy_amount = data.amount
                if data.paymentDate is not None:
                    payment.cpy_d_create = data.paymentDate
                if data.notes is not None:
                    payment.cpy_comment = data.notes
                if data.filePath is not None:
                    payment.cpy_file = data.filePath
                if data.guid is not None:
                    payment.cpy_guid = data.guid

                self.db.commit()
                self.db.refresh(payment)
                return self.get_payment_by_id(payment_id)

        payment = self.db.execute(
            select(SupplierOrderPaymentRecord).where(SupplierOrderPaymentRecord.spr_id == payment_id)
        ).scalar_one_or_none()
        if not payment:
            return None

        if data.amount is not None:
            payment.spr_amount = data.amount
        if data.paymentDate is not None:
            payment.spr_d_payment = data.paymentDate
        if data.notes is not None:
            payment.spr_comment = data.notes
        if data.paymentCode is not None:
            payment.spr_payment_code = data.paymentCode
        if data.filePath is not None:
            payment.spr_file = data.filePath
        if data.guid is not None:
            payment.spr_guid = data.guid
        payment.spr_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(payment)
        return self.get_payment_by_id(payment_id)

    def delete_payment(self, payment_id: int) -> bool:
        payment = self.db.execute(
            select(ClientInvoicePayment).where(ClientInvoicePayment.cpy_id == payment_id)
        ).scalar_one_or_none()
        if payment:
            self.db.delete(payment)
            self.db.commit()
            return True

        payment = self.db.execute(
            select(SupplierOrderPaymentRecord).where(SupplierOrderPaymentRecord.spr_id == payment_id)
        ).scalar_one_or_none()
        if payment:
            self.db.delete(payment)
            self.db.commit()
            return True

        return False


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)

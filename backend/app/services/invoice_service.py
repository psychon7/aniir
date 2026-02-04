"""
Invoice Service.

Provides business logic for:
- Invoice CRUD operations
- Invoice line management
- Payment recording
- Invoice status management
- PDF generation
- Statistics
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload, Session
from fastapi import Depends
from typing import Union

from datetime import timedelta

from app.database import get_db

from app.models.invoice import ClientInvoice, ClientInvoiceLine
from app.models.order import ClientOrder, ClientOrderLine
from app.models.client import Client
from app.models.society import Society
from app.models.currency import Currency
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.models.project import Project
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceSearchParams,
    InvoiceLineCreate, InvoiceLineUpdate,
    InvoiceStatus, CreateInvoiceFromOrderRequest, InvoiceDetailResponse
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class InvoiceServiceError(Exception):
    """Base exception for invoice service errors."""
    def __init__(self, message: str, code: str = "INVOICE_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class InvoiceNotFoundError(InvoiceServiceError):
    """Raised when invoice is not found."""
    def __init__(self, invoice_id: int):
        super().__init__(
            f"Invoice with ID {invoice_id} not found",
            code="INVOICE_NOT_FOUND",
            details={"invoice_id": invoice_id}
        )


class InvoiceLineNotFoundError(InvoiceServiceError):
    """Raised when invoice line is not found."""
    def __init__(self, line_id: int):
        super().__init__(
            f"Invoice line with ID {line_id} not found",
            code="INVOICE_LINE_NOT_FOUND",
            details={"line_id": line_id}
        )


class InvoiceValidationError(InvoiceServiceError):
    """Raised when invoice validation fails."""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, code="INVOICE_VALIDATION_ERROR", details=details)


class InvoiceStatusError(InvoiceServiceError):
    """Raised when invoice status transition is invalid."""
    def __init__(self, message: str, current_status: str, target_status: str):
        super().__init__(
            message,
            code="INVOICE_STATUS_ERROR",
            details={"current_status": current_status, "target_status": target_status}
        )


class OrderNotFoundForInvoiceError(InvoiceServiceError):
    """Raised when order is not found for invoice creation."""
    def __init__(self, order_id: int):
        super().__init__(
            f"Order with ID {order_id} not found",
            code="ORDER_NOT_FOUND",
            details={"order_id": order_id}
        )


class OrderConversionError(InvoiceServiceError):
    """Raised when order cannot be converted to invoice."""
    def __init__(self, message: str, order_id: int, details: Optional[Dict] = None):
        error_details = {"order_id": order_id}
        if details:
            error_details.update(details)
        super().__init__(message, code="ORDER_CONVERSION_ERROR", details=error_details)


# ==========================================================================
# Invoice Service
# ==========================================================================

class InvoiceService:
    """Service for managing invoices."""

    # Status IDs mapping (assumes these exist in TR_STA_Status table)
    STATUS_DRAFT = 1
    STATUS_SENT = 2
    STATUS_PARTIAL = 3
    STATUS_PAID = 4
    STATUS_OVERDUE = 5
    STATUS_CANCELLED = 6
    STATUS_VOID = 7

    def __init__(self, db: Session):
        self.db = db

    async def _generate_reference(self) -> str:
        """Generate unique invoice reference."""
        year = datetime.now().year
        prefix = f"INV-{year}-"

        # Get the max reference for this year
        stmt = select(func.max(ClientInvoice.inv_reference)).where(
            ClientInvoice.inv_reference.like(f"{prefix}%")
        )
        result = await self.db.execute(stmt)
        max_ref = result.scalar()

        if max_ref:
            # Extract number and increment
            try:
                num = int(max_ref.replace(prefix, "")) + 1
            except ValueError:
                num = 1
        else:
            num = 1

        return f"{prefix}{num:05d}"

    async def _calculate_line_totals(
        self,
        quantity: Decimal,
        unit_price: Decimal,
        discount: Decimal,
        vat_rate: Decimal = Decimal("0")
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Calculate line totals: subtotal, vat_amount, line_total."""
        subtotal = quantity * unit_price * (1 - discount / 100)
        vat_amount = subtotal * vat_rate / 100
        line_total = subtotal + vat_amount
        return subtotal, vat_amount, line_total

    async def _recalculate_invoice_totals(self, invoice_id: int) -> None:
        """Recalculate invoice totals from lines."""
        # Get all lines
        stmt = select(ClientInvoiceLine).where(
            ClientInvoiceLine.inl_inv_id == invoice_id
        )
        result = await self.db.execute(stmt)
        lines = result.scalars().all()

        sub_total = Decimal("0")
        total_vat = Decimal("0")

        for line in lines:
            sub_total += line.inl_line_total - line.inl_vat_amount
            total_vat += line.inl_vat_amount

        # Get invoice and update
        stmt = select(ClientInvoice).where(ClientInvoice.inv_id == invoice_id)
        result = await self.db.execute(stmt)
        invoice = result.scalar_one_or_none()

        if invoice:
            invoice.inv_sub_total = sub_total
            invoice.inv_total_vat = total_vat

            # Apply overall discount
            discount_amount = sub_total * (invoice.inv_discount or Decimal("0")) / 100
            invoice.inv_total_amount = sub_total + total_vat - discount_amount

            # Update amount due
            invoice.inv_amount_due = invoice.inv_total_amount - invoice.inv_amount_paid

            await self.db.flush()

    async def _update_invoice_status(self, invoice: ClientInvoice) -> None:
        """Update invoice status based on payment and due date."""
        if invoice.inv_amount_paid >= invoice.inv_total_amount:
            invoice.inv_sta_id = self.STATUS_PAID
            invoice.inv_paid_at = datetime.now()
        elif invoice.inv_amount_paid > 0:
            invoice.inv_sta_id = self.STATUS_PARTIAL
        elif datetime.now() > invoice.inv_due_date:
            invoice.inv_sta_id = self.STATUS_OVERDUE

    # ==========================================================================
    # CRUD Operations
    # ==========================================================================

    async def create_invoice(
        self,
        data: InvoiceCreate,
        created_by: Optional[int] = None
    ) -> ClientInvoice:
        """Create a new invoice with optional lines."""
        # Generate reference if not provided
        reference = data.inv_reference or await self._generate_reference()

        # Create invoice
        invoice = ClientInvoice(
            inv_reference=reference,
            inv_cli_id=data.inv_cli_id,
            inv_ord_id=data.inv_ord_id,
            inv_date=data.inv_date,
            inv_due_date=data.inv_due_date,
            inv_sta_id=self.STATUS_DRAFT,
            inv_cur_id=data.inv_cur_id,
            inv_billing_address=data.inv_billing_address,
            inv_billing_city=data.inv_billing_city,
            inv_billing_postal_code=data.inv_billing_postal_code,
            inv_billing_country_id=data.inv_billing_country_id,
            inv_discount=data.inv_discount,
            inv_notes=data.inv_notes,
            inv_payment_reference=data.inv_payment_reference,
            inv_bu_id=data.inv_bu_id,
            inv_soc_id=data.inv_soc_id,
            inv_created_by=created_by,
            inv_sub_total=Decimal("0"),
            inv_total_vat=Decimal("0"),
            inv_total_amount=Decimal("0"),
            inv_amount_paid=Decimal("0"),
            inv_amount_due=Decimal("0"),
        )

        self.db.add(invoice)
        await self.db.flush()

        # Add lines if provided
        if data.lines:
            for idx, line_data in enumerate(data.lines, start=1):
                await self.add_invoice_line(invoice.inv_id, line_data, line_number=idx)

        await self.db.refresh(invoice)
        return invoice

    async def get_invoice(self, invoice_id: int, include_lines: bool = True) -> ClientInvoice:
        """Get invoice by ID."""
        if include_lines:
            stmt = select(ClientInvoice).options(
                selectinload(ClientInvoice.lines)
            ).where(ClientInvoice.inv_id == invoice_id)
        else:
            stmt = select(ClientInvoice).where(ClientInvoice.inv_id == invoice_id)

        result = await self.db.execute(stmt)
        invoice = result.scalar_one_or_none()

        if not invoice:
            raise InvoiceNotFoundError(invoice_id)

        return invoice

    async def get_invoice_by_reference(self, reference: str) -> ClientInvoice:
        """Get invoice by reference."""
        stmt = select(ClientInvoice).options(
            selectinload(ClientInvoice.lines)
        ).where(ClientInvoice.inv_reference == reference)

        result = await self.db.execute(stmt)
        invoice = result.scalar_one_or_none()

        if not invoice:
            raise InvoiceServiceError(
                f"Invoice with reference '{reference}' not found",
                code="INVOICE_NOT_FOUND"
            )

        return invoice

    def _sync_get_invoice_detail(self, invoice_id: int) -> dict:
        """
        Get invoice by ID with resolved lookup names (sync version).
        Returns a dict suitable for InvoiceDetailResponse.
        """
        # Get invoice with lines
        stmt = select(ClientInvoice).options(
            selectinload(ClientInvoice.lines)
        ).where(ClientInvoice.cin_id == invoice_id)

        result = self.db.execute(stmt)
        invoice = result.scalar_one_or_none()

        if not invoice:
            raise InvoiceNotFoundError(invoice_id)

        # Build base response from ORM object
        response_data = InvoiceDetailResponse.model_validate(invoice).model_dump()

        # Resolve lookup names
        # Client
        if invoice.cli_id:
            stmt = select(Client).where(Client.cli_id == invoice.cli_id)
            result = self.db.execute(stmt)
            client = result.scalar_one_or_none()
            if client:
                response_data["clientName"] = client.cli_company_name

        # Order (if linked)
        if invoice.cod_id:
            stmt = select(ClientOrder).where(ClientOrder.cod_id == invoice.cod_id)
            result = self.db.execute(stmt)
            order = result.scalar_one_or_none()
            if order:
                response_data["orderReference"] = order.cod_code

        # Society
        if invoice.soc_id:
            stmt = select(Society).where(Society.soc_id == invoice.soc_id)
            result = self.db.execute(stmt)
            society = result.scalar_one_or_none()
            if society:
                response_data["societyName"] = society.soc_society_name

        # Project (if linked)
        if invoice.prj_id:
            stmt = select(Project).where(Project.prj_id == invoice.prj_id)
            result = self.db.execute(stmt)
            project = result.scalar_one_or_none()
            if project:
                response_data["projectName"] = project.prj_name

        # Currency
        if invoice.cur_id:
            stmt = select(Currency).where(Currency.cur_id == invoice.cur_id)
            result = self.db.execute(stmt)
            currency = result.scalar_one_or_none()
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # Payment Mode
        if invoice.pmo_id:
            stmt = select(PaymentMode).where(PaymentMode.pmo_id == invoice.pmo_id)
            result = self.db.execute(stmt)
            payment_mode = result.scalar_one_or_none()
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Payment Condition (Term)
        if invoice.pco_id:
            stmt = select(PaymentTerm).where(PaymentTerm.pco_id == invoice.pco_id)
            result = self.db.execute(stmt)
            payment_term = result.scalar_one_or_none()
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        return response_data

    async def get_invoice_detail(self, invoice_id: int) -> dict:
        """
        Get invoice by ID with resolved lookup names.
        Returns a dict suitable for InvoiceDetailResponse.
        """
        import asyncio
        return await asyncio.to_thread(self._sync_get_invoice_detail, invoice_id)

    async def update_invoice(
        self,
        invoice_id: int,
        data: InvoiceUpdate
    ) -> ClientInvoice:
        """Update an invoice."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        # Check if invoice can be updated
        if invoice.inv_sta_id in [self.STATUS_PAID, self.STATUS_VOID, self.STATUS_CANCELLED]:
            raise InvoiceStatusError(
                "Cannot update a paid, voided, or cancelled invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="updated"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(invoice, field):
                setattr(invoice, field, value)

        invoice.inv_updated_at = datetime.now()

        # Recalculate totals if discount changed
        if "inv_discount" in update_data:
            await self._recalculate_invoice_totals(invoice_id)

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def delete_invoice(self, invoice_id: int) -> None:
        """Delete an invoice and its lines."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        # Only allow deletion of draft invoices
        if invoice.inv_sta_id != self.STATUS_DRAFT:
            raise InvoiceStatusError(
                "Only draft invoices can be deleted",
                current_status=str(invoice.inv_sta_id),
                target_status="deleted"
            )

        # Delete lines first (cascade should handle this, but being explicit)
        stmt = select(ClientInvoiceLine).where(
            ClientInvoiceLine.inl_inv_id == invoice_id
        )
        result = await self.db.execute(stmt)
        lines = result.scalars().all()
        for line in lines:
            await self.db.delete(line)

        await self.db.delete(invoice)
        await self.db.flush()

    async def search_invoices(self, params: InvoiceSearchParams) -> Dict[str, Any]:
        """Search invoices with filters and pagination."""
        stmt = select(ClientInvoice)

        # Apply filters
        conditions = []

        if params.reference:
            conditions.append(ClientInvoice.inv_reference.ilike(f"%{params.reference}%"))

        if params.client_id:
            conditions.append(ClientInvoice.inv_cli_id == params.client_id)

        if params.order_id:
            conditions.append(ClientInvoice.inv_ord_id == params.order_id)

        if params.status_id:
            conditions.append(ClientInvoice.inv_sta_id == params.status_id)

        if params.date_from:
            conditions.append(ClientInvoice.inv_date >= datetime.combine(params.date_from, datetime.min.time()))

        if params.date_to:
            conditions.append(ClientInvoice.inv_date <= datetime.combine(params.date_to, datetime.max.time()))

        if params.due_date_from:
            conditions.append(ClientInvoice.inv_due_date >= datetime.combine(params.due_date_from, datetime.min.time()))

        if params.due_date_to:
            conditions.append(ClientInvoice.inv_due_date <= datetime.combine(params.due_date_to, datetime.max.time()))

        if params.is_overdue:
            conditions.append(
                and_(
                    ClientInvoice.inv_due_date < datetime.now(),
                    ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
                )
            )

        if params.is_paid is not None:
            if params.is_paid:
                conditions.append(ClientInvoice.inv_amount_paid >= ClientInvoice.inv_total_amount)
            else:
                conditions.append(ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount)

        if params.min_amount:
            conditions.append(ClientInvoice.inv_total_amount >= params.min_amount)

        if params.max_amount:
            conditions.append(ClientInvoice.inv_total_amount <= params.max_amount)

        if params.currency_id:
            conditions.append(ClientInvoice.inv_cur_id == params.currency_id)

        if params.society_id:
            conditions.append(ClientInvoice.inv_soc_id == params.society_id)

        if params.bu_id:
            conditions.append(ClientInvoice.inv_bu_id == params.bu_id)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(ClientInvoice, params.sort_by, ClientInvoice.inv_created_at)
        if params.sort_order == "desc":
            stmt = stmt.order_by(desc(sort_column))
        else:
            stmt = stmt.order_by(asc(sort_column))

        # Apply pagination
        offset = (params.page - 1) * params.page_size
        stmt = stmt.offset(offset).limit(params.page_size)

        result = await self.db.execute(stmt)
        invoices = result.scalars().all()

        total_pages = (total + params.page_size - 1) // params.page_size

        return {
            "items": invoices,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": total_pages
        }

    # ==========================================================================
    # Invoice Line Operations
    # ==========================================================================

    async def add_invoice_line(
        self,
        invoice_id: int,
        data: InvoiceLineCreate,
        line_number: Optional[int] = None
    ) -> ClientInvoiceLine:
        """Add a line to an invoice."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        # Check invoice status
        if invoice.inv_sta_id not in [self.STATUS_DRAFT, self.STATUS_SENT]:
            raise InvoiceStatusError(
                "Cannot add lines to a paid, voided, or cancelled invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="line_added"
            )

        # Get next line number if not provided
        if line_number is None:
            stmt = select(func.max(ClientInvoiceLine.inl_line_number)).where(
                ClientInvoiceLine.inl_inv_id == invoice_id
            )
            result = await self.db.execute(stmt)
            max_line = result.scalar() or 0
            line_number = max_line + 1

        # TODO: Get actual VAT rate from vat_id
        vat_rate = Decimal("20")  # Default VAT rate

        # Calculate totals
        subtotal, vat_amount, line_total = await self._calculate_line_totals(
            data.inl_quantity,
            data.inl_unit_price,
            data.inl_discount,
            vat_rate
        )

        line = ClientInvoiceLine(
            inl_inv_id=invoice_id,
            inl_line_number=line_number,
            inl_prd_id=data.inl_prd_id,
            inl_description=data.inl_description,
            inl_quantity=data.inl_quantity,
            inl_unit_price=data.inl_unit_price,
            inl_discount=data.inl_discount,
            inl_vat_id=data.inl_vat_id,
            inl_vat_amount=vat_amount,
            inl_line_total=line_total,
            inl_sort_order=data.inl_sort_order
        )

        self.db.add(line)
        await self.db.flush()

        # Recalculate invoice totals
        await self._recalculate_invoice_totals(invoice_id)

        await self.db.refresh(line)
        return line

    async def update_invoice_line(
        self,
        line_id: int,
        data: InvoiceLineUpdate
    ) -> ClientInvoiceLine:
        """Update an invoice line."""
        stmt = select(ClientInvoiceLine).where(ClientInvoiceLine.inl_id == line_id)
        result = await self.db.execute(stmt)
        line = result.scalar_one_or_none()

        if not line:
            raise InvoiceLineNotFoundError(line_id)

        # Get invoice to check status
        invoice = await self.get_invoice(line.inl_inv_id, include_lines=False)

        if invoice.inv_sta_id not in [self.STATUS_DRAFT, self.STATUS_SENT]:
            raise InvoiceStatusError(
                "Cannot update lines on a paid, voided, or cancelled invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="line_updated"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(line, field):
                setattr(line, field, value)

        # Recalculate line totals if quantity, price, or discount changed
        if any(f in update_data for f in ["inl_quantity", "inl_unit_price", "inl_discount"]):
            vat_rate = Decimal("20")  # TODO: Get from vat_id
            subtotal, vat_amount, line_total = await self._calculate_line_totals(
                line.inl_quantity,
                line.inl_unit_price,
                line.inl_discount,
                vat_rate
            )
            line.inl_vat_amount = vat_amount
            line.inl_line_total = line_total

        await self.db.flush()

        # Recalculate invoice totals
        await self._recalculate_invoice_totals(line.inl_inv_id)

        await self.db.refresh(line)
        return line

    async def delete_invoice_line(self, line_id: int) -> None:
        """Delete an invoice line."""
        stmt = select(ClientInvoiceLine).where(ClientInvoiceLine.inl_id == line_id)
        result = await self.db.execute(stmt)
        line = result.scalar_one_or_none()

        if not line:
            raise InvoiceLineNotFoundError(line_id)

        invoice_id = line.inl_inv_id

        # Get invoice to check status
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        if invoice.inv_sta_id not in [self.STATUS_DRAFT, self.STATUS_SENT]:
            raise InvoiceStatusError(
                "Cannot delete lines from a paid, voided, or cancelled invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="line_deleted"
            )

        await self.db.delete(line)
        await self.db.flush()

        # Recalculate invoice totals
        await self._recalculate_invoice_totals(invoice_id)

    # ==========================================================================
    # Invoice Actions
    # ==========================================================================

    async def send_invoice(self, invoice_id: int) -> ClientInvoice:
        """Mark invoice as sent."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        if invoice.inv_sta_id != self.STATUS_DRAFT:
            raise InvoiceStatusError(
                "Only draft invoices can be sent",
                current_status=str(invoice.inv_sta_id),
                target_status="SENT"
            )

        invoice.inv_sta_id = self.STATUS_SENT
        invoice.inv_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def void_invoice(self, invoice_id: int, reason: str) -> ClientInvoice:
        """Void an invoice."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        # Cannot void already paid invoices
        if invoice.inv_sta_id == self.STATUS_PAID:
            raise InvoiceStatusError(
                "Cannot void a paid invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="VOID"
            )

        invoice.inv_sta_id = self.STATUS_VOID
        invoice.inv_notes = f"{invoice.inv_notes or ''}\n\nVOIDED: {reason}".strip()
        invoice.inv_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def cancel_invoice(self, invoice_id: int, reason: str) -> ClientInvoice:
        """Cancel an invoice."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        if invoice.inv_sta_id not in [self.STATUS_DRAFT, self.STATUS_SENT]:
            raise InvoiceStatusError(
                "Only draft or sent invoices can be cancelled",
                current_status=str(invoice.inv_sta_id),
                target_status="CANCELLED"
            )

        invoice.inv_sta_id = self.STATUS_CANCELLED
        invoice.inv_notes = f"{invoice.inv_notes or ''}\n\nCANCELLED: {reason}".strip()
        invoice.inv_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def record_payment(
        self,
        invoice_id: int,
        amount: Decimal,
        payment_date: datetime,
        payment_reference: Optional[str] = None
    ) -> ClientInvoice:
        """Record a payment on an invoice."""
        invoice = await self.get_invoice(invoice_id, include_lines=False)

        if invoice.inv_sta_id in [self.STATUS_VOID, self.STATUS_CANCELLED]:
            raise InvoiceStatusError(
                "Cannot record payment on a voided or cancelled invoice",
                current_status=str(invoice.inv_sta_id),
                target_status="payment_recorded"
            )

        # Update payment amount
        invoice.inv_amount_paid += amount
        invoice.inv_amount_due = invoice.inv_total_amount - invoice.inv_amount_paid

        if payment_reference:
            invoice.inv_payment_reference = payment_reference

        # Update status based on payment
        await self._update_invoice_status(invoice)

        invoice.inv_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def get_statistics(
        self,
        society_id: Optional[int] = None,
        bu_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get invoice statistics."""
        conditions = []

        if society_id:
            conditions.append(ClientInvoice.inv_soc_id == society_id)
        if bu_id:
            conditions.append(ClientInvoice.inv_bu_id == bu_id)
        if date_from:
            conditions.append(ClientInvoice.inv_date >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            conditions.append(ClientInvoice.inv_date <= datetime.combine(date_to, datetime.max.time()))

        # Base query
        base_stmt = select(ClientInvoice)
        if conditions:
            base_stmt = base_stmt.where(and_(*conditions))

        # Total invoices and amounts
        stats_stmt = select(
            func.count(ClientInvoice.inv_id).label("total_invoices"),
            func.sum(ClientInvoice.inv_total_amount).label("total_amount"),
            func.sum(ClientInvoice.inv_amount_paid).label("total_paid"),
            func.avg(ClientInvoice.inv_total_amount).label("avg_amount")
        )
        if conditions:
            stats_stmt = stats_stmt.where(and_(*conditions))

        result = await self.db.execute(stats_stmt)
        row = result.one()

        total_invoices = row.total_invoices or 0
        total_amount = Decimal(str(row.total_amount or 0))
        total_paid = Decimal(str(row.total_paid or 0))
        avg_amount = Decimal(str(row.avg_amount or 0))

        # Overdue amount
        overdue_stmt = select(func.sum(ClientInvoice.inv_total_amount - ClientInvoice.inv_amount_paid)).where(
            and_(
                ClientInvoice.inv_due_date < datetime.now(),
                ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount,
                *conditions
            )
        )
        overdue_result = await self.db.execute(overdue_stmt)
        total_overdue = Decimal(str(overdue_result.scalar() or 0))

        # Count by status
        status_stmt = select(
            ClientInvoice.inv_sta_id,
            func.count(ClientInvoice.inv_id)
        )
        if conditions:
            status_stmt = status_stmt.where(and_(*conditions))
        status_stmt = status_stmt.group_by(ClientInvoice.inv_sta_id)

        status_result = await self.db.execute(status_stmt)
        count_by_status = {str(row[0]): row[1] for row in status_result.all()}

        return {
            "total_invoices": total_invoices,
            "total_amount": total_amount,
            "total_paid": total_paid,
            "total_outstanding": total_amount - total_paid,
            "total_overdue": total_overdue,
            "count_by_status": count_by_status,
            "average_invoice_amount": avg_amount,
            "average_days_to_payment": None  # TODO: Calculate from payment dates
        }

    # ==========================================================================
    # Create Invoice from Order
    # ==========================================================================

    async def create_invoice_from_order(
        self,
        order_id: int,
        request: CreateInvoiceFromOrderRequest,
        created_by: Optional[int] = None
    ) -> Tuple[ClientInvoice, str]:
        """
        Create a new invoice from an existing order.

        Args:
            order_id: The ID of the order to create the invoice from
            request: Request parameters for the invoice creation
            created_by: ID of the user creating the invoice

        Returns:
            Tuple of (created ClientInvoice with lines, order reference)

        Raises:
            OrderNotFoundForInvoiceError: If the order doesn't exist
            OrderConversionError: If the order cannot be converted
        """
        # Fetch the order with lines
        stmt = select(ClientOrder).options(
            selectinload(ClientOrder.lines)
        ).where(ClientOrder.ord_id == order_id)

        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise OrderNotFoundForInvoiceError(order_id)

        # Store order reference before any operations
        order_reference = order.ord_reference

        # Check if order is cancelled
        if order.ord_is_cancelled:
            raise OrderConversionError(
                "Cannot create invoice from a cancelled order",
                order_id=order_id
            )

        # Check if order has lines
        if not order.lines:
            raise OrderConversionError(
                "Cannot create invoice from an order with no lines",
                order_id=order_id
            )

        # Determine which lines to include
        lines_to_convert = []
        if request.include_all_lines:
            lines_to_convert = order.lines
        elif request.line_ids:
            line_ids_set = set(request.line_ids)
            lines_to_convert = [line for line in order.lines if line.orl_id in line_ids_set]
            if not lines_to_convert:
                raise OrderConversionError(
                    "No matching order lines found for the specified IDs",
                    order_id=order_id,
                    details={"requested_line_ids": request.line_ids}
                )
        else:
            raise OrderConversionError(
                "Either include_all_lines must be true or line_ids must be specified",
                order_id=order_id
            )

        # Determine invoice dates
        invoice_date = request.invoice_date or datetime.now()
        due_date = request.due_date or (invoice_date + timedelta(days=30))

        # Generate invoice reference
        reference = await self._generate_reference()

        # Create the invoice
        invoice = ClientInvoice(
            inv_reference=reference,
            inv_cli_id=order.ord_cli_id,
            inv_ord_id=order.ord_id,
            inv_date=invoice_date,
            inv_due_date=due_date,
            inv_sta_id=self.STATUS_DRAFT,
            inv_cur_id=order.ord_cur_id,
            # Copy billing address from order
            inv_billing_address=order.ord_billing_address,
            inv_billing_city=order.ord_billing_city,
            inv_billing_postal_code=order.ord_billing_postal_code,
            inv_billing_country_id=order.ord_billing_country_id,
            # Apply any discount from the order
            inv_discount=order.ord_discount or Decimal("0"),
            inv_notes=request.notes,
            inv_bu_id=request.inv_bu_id or order.ord_bu_id,
            inv_soc_id=request.inv_soc_id or order.ord_soc_id,
            inv_created_by=created_by,
            # Initialize totals - will be recalculated
            inv_sub_total=Decimal("0"),
            inv_total_vat=Decimal("0"),
            inv_total_amount=Decimal("0"),
            inv_amount_paid=Decimal("0"),
            inv_amount_due=Decimal("0"),
        )

        self.db.add(invoice)
        await self.db.flush()

        # Convert order lines to invoice lines
        for idx, order_line in enumerate(lines_to_convert, start=1):
            invoice_line = ClientInvoiceLine(
                inl_inv_id=invoice.inv_id,
                inl_line_number=idx,
                inl_prd_id=order_line.orl_prd_id,
                inl_description=order_line.orl_description,
                inl_quantity=order_line.orl_quantity,
                inl_unit_price=order_line.orl_unit_price,
                inl_discount=order_line.orl_discount_percent or Decimal("0"),
                inl_vat_id=order_line.orl_vat_id or 1,  # Default VAT ID if not set
                inl_vat_amount=order_line.orl_vat_amount,
                inl_line_total=order_line.orl_line_total,
                inl_sort_order=order_line.orl_sort_order or idx,
            )
            self.db.add(invoice_line)

        await self.db.flush()

        # Recalculate invoice totals from the lines
        await self._recalculate_invoice_totals(invoice.inv_id)

        # Refresh to get updated totals and lines
        await self.db.refresh(invoice)

        # Load the lines for the response
        stmt = select(ClientInvoice).options(
            selectinload(ClientInvoice.lines)
        ).where(ClientInvoice.inv_id == invoice.inv_id)
        result = await self.db.execute(stmt)
        invoice = result.scalar_one()

        return invoice, order_reference


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    """Dependency to get InvoiceService instance."""
    return InvoiceService(db)

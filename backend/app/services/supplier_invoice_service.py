"""
Supplier Invoice Service Module.

Provides functionality for:
- Supplier Invoice CRUD operations
- Invoice line management
- Payment tracking (mark paid/unpaid)
- Production status management
- Invoice totals calculation
- Search and filtering

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session, selectinload
from fastapi import Depends

from app.database import get_db
from app.models.supplier_invoice import SupplierInvoice, SupplierInvoiceLine
from app.models.supplier import Supplier
from app.models.supplier_order import SupplierOrder
from app.models.society import Society
from app.models.currency import Currency
from app.models.vat_rate import VatRate
from app.models.user import User
from app.schemas.supplier_invoice import (
    SupplierInvoiceCreate, SupplierInvoiceUpdate, SupplierInvoiceSearchParams,
    SupplierInvoiceLineCreate, SupplierInvoiceLineUpdate,
    SupplierInvoiceDetailResponse, SupplierInvoiceLineResponse
)
from loguru import logger


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SupplierInvoiceServiceError(Exception):
    """Base exception for supplier invoice service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SupplierInvoiceNotFoundError(SupplierInvoiceServiceError):
    """Raised when supplier invoice is not found."""
    def __init__(self, invoice_id: int):
        super().__init__(
            code="SUPPLIER_INVOICE_NOT_FOUND",
            message=f"Supplier invoice with ID {invoice_id} not found",
            details={"invoice_id": invoice_id}
        )


class SupplierInvoiceLineNotFoundError(SupplierInvoiceServiceError):
    """Raised when supplier invoice line is not found."""
    def __init__(self, line_id: int):
        super().__init__(
            code="SUPPLIER_INVOICE_LINE_NOT_FOUND",
            message=f"Supplier invoice line with ID {line_id} not found",
            details={"line_id": line_id}
        )


class SupplierInvoiceValidationError(SupplierInvoiceServiceError):
    """Raised when supplier invoice data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="SUPPLIER_INVOICE_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class SupplierInvoiceStatusError(SupplierInvoiceServiceError):
    """Raised when supplier invoice status operation is invalid."""
    def __init__(self, message: str, current_status: str, target_action: str):
        super().__init__(
            code="SUPPLIER_INVOICE_STATUS_ERROR",
            message=message,
            details={"current_status": current_status, "target_action": target_action}
        )


# ==========================================================================
# Supplier Invoice Service Class
# ==========================================================================

class SupplierInvoiceService:
    """
    Service class for supplier invoice operations.

    Handles CRUD operations, line management, and payment/production status
    updates for supplier invoices.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    # Default VAT rate percentage (used if VAT lookup fails)
    DEFAULT_VAT_RATE = Decimal("20.0")

    def __init__(self, db: Session):
        """
        Initialize the supplier invoice service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    def _generate_invoice_code(self) -> str:
        """Generate unique invoice code."""
        year = datetime.now().year
        month = datetime.now().month
        prefix = f"SIN-{year}{month:02d}-"

        # Get the max code for this month
        query = select(func.max(SupplierInvoice.sin_code)).where(
            SupplierInvoice.sin_code.like(f"{prefix}%")
        )
        result = self.db.execute(query)
        max_code = result.scalar()

        if max_code:
            try:
                num = int(max_code.replace(prefix, "")) + 1
            except ValueError:
                num = 1
        else:
            num = 1

        return f"{prefix}{num:05d}"

    def _calculate_line_totals(
        self,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal = Decimal("0")
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calculate line totals.

        Args:
            quantity: Line quantity
            unit_price: Unit price
            discount: Discount amount

        Returns:
            Tuple of (total_crude_price, price_with_discount, total_price)
        """
        total_crude_price = Decimal(str(quantity)) * unit_price
        price_with_discount = total_crude_price - discount
        total_price = price_with_discount  # Same for now, VAT calculated at invoice level
        return total_crude_price, price_with_discount, total_price

    def _recalculate_invoice_totals(self, invoice: SupplierInvoice) -> Tuple[Decimal, Decimal]:
        """
        Recalculate invoice totals from lines.

        Args:
            invoice: The supplier invoice to recalculate

        Returns:
            Tuple of (total_ht, total_ttc)
        """
        total_ht = Decimal("0")

        for line in invoice.lines:
            line_total = line.sil_total_price or Decimal("0")
            total_ht += line_total

        # Apply invoice-level discount
        invoice_discount = invoice.sin_discount_amount or Decimal("0")
        total_ht = total_ht - invoice_discount

        # Get VAT rate
        vat_rate = self.DEFAULT_VAT_RATE
        if invoice.vat_id:
            vat = self.db.get(VatRate, invoice.vat_id)
            if vat:
                vat_rate = vat.vat_rate or self.DEFAULT_VAT_RATE

        # Calculate total TTC (including VAT)
        vat_amount = total_ht * vat_rate / Decimal("100")
        total_ttc = total_ht + vat_amount

        logger.debug(f"Recalculated invoice {invoice.sin_id} totals: HT={total_ht}, TTC={total_ttc}")
        return total_ht, total_ttc

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_invoices(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierInvoiceSearchParams] = None
    ) -> Tuple[List[SupplierInvoice], int]:
        """Synchronous list invoices implementation."""
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        SupplierInvoice.sin_code.ilike(search_term),
                        SupplierInvoice.sin_name.ilike(search_term),
                    )
                )

            if search_params.supplier_id is not None:
                base_filters.append(SupplierInvoice.sup_id == search_params.supplier_id)

            if search_params.society_id is not None:
                base_filters.append(SupplierInvoice.soc_id == search_params.society_id)

            if search_params.currency_id is not None:
                base_filters.append(SupplierInvoice.cur_id == search_params.currency_id)

            if search_params.supplier_order_id is not None:
                base_filters.append(SupplierInvoice.sod_id == search_params.supplier_order_id)

            if search_params.is_paid is not None:
                base_filters.append(SupplierInvoice.sin_is_paid == search_params.is_paid)

            if search_params.production_started is not None:
                base_filters.append(SupplierInvoice.sin_start_production == search_params.production_started)

            if search_params.production_complete is not None:
                base_filters.append(SupplierInvoice.sin_complete_production == search_params.production_complete)

            if search_params.date_from is not None:
                base_filters.append(SupplierInvoice.sin_d_creation >= search_params.date_from)

            if search_params.date_to is not None:
                base_filters.append(SupplierInvoice.sin_d_creation <= search_params.date_to)

            if search_params.creator_id is not None:
                base_filters.append(SupplierInvoice.usr_creator_id == search_params.creator_id)

        # Get total count
        count_query = select(func.count(SupplierInvoice.sin_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get invoices
        query = (
            select(SupplierInvoice)
            .order_by(SupplierInvoice.sin_d_creation.desc())
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = self.db.execute(query)
        invoices = list(result.scalars().all())

        return invoices, total

    def _sync_get_invoice(self, invoice_id: int, include_lines: bool = True) -> SupplierInvoice:
        """Synchronous get invoice by ID."""
        if include_lines:
            query = (
                select(SupplierInvoice)
                .options(selectinload(SupplierInvoice.lines))
                .where(SupplierInvoice.sin_id == invoice_id)
            )
            result = self.db.execute(query)
            invoice = result.scalars().first()
        else:
            invoice = self.db.get(SupplierInvoice, invoice_id)

        if not invoice:
            raise SupplierInvoiceNotFoundError(invoice_id)
        return invoice

    def _sync_get_invoice_detail(self, invoice_id: int) -> dict:
        """
        Synchronous get invoice by ID with resolved lookup names.
        Returns a dict suitable for SupplierInvoiceDetailResponse.
        """
        # Get invoice with lines
        query = (
            select(SupplierInvoice)
            .options(selectinload(SupplierInvoice.lines))
            .where(SupplierInvoice.sin_id == invoice_id)
        )
        result = self.db.execute(query)
        invoice = result.scalars().first()

        if not invoice:
            raise SupplierInvoiceNotFoundError(invoice_id)

        # Calculate totals from lines
        total_ht, total_ttc = self._recalculate_invoice_totals(invoice)

        # Build base response from invoice ORM object
        # First convert lines
        lines_data = [
            SupplierInvoiceLineResponse.model_validate(line).model_dump()
            for line in invoice.lines
        ]

        response_data = SupplierInvoiceDetailResponse.model_validate(invoice).model_dump()
        response_data["lines"] = lines_data
        response_data["totalHt"] = total_ht
        response_data["totalTtc"] = total_ttc

        # Resolve lookup names
        # Supplier
        if invoice.sup_id:
            supplier = self.db.get(Supplier, invoice.sup_id)
            if supplier:
                response_data["supplierName"] = supplier.sup_company_name
                response_data["supplierReference"] = supplier.sup_ref

        # Society
        if invoice.soc_id:
            society = self.db.get(Society, invoice.soc_id)
            if society:
                response_data["societyName"] = society.soc_society_name

        # Currency
        if invoice.cur_id:
            currency = self.db.get(Currency, invoice.cur_id)
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # VAT
        if invoice.vat_id:
            vat = self.db.get(VatRate, invoice.vat_id)
            if vat:
                response_data["vatRate"] = vat.vat_rate

        # Creator
        if invoice.usr_creator_id:
            user = self.db.get(User, invoice.usr_creator_id)
            if user:
                response_data["creatorName"] = f"{user.usr_first_name or ''} {user.usr_name or ''}".strip()

        # Supplier Order
        if invoice.sod_id:
            order = self.db.get(SupplierOrder, invoice.sod_id)
            if order:
                response_data["supplierOrderCode"] = order.sod_code

        logger.debug(f"Fetched supplier invoice detail for sin_id={invoice_id}")
        return response_data

    def _sync_create_invoice(self, data: SupplierInvoiceCreate) -> SupplierInvoice:
        """Synchronous create invoice."""
        now = datetime.now()

        # Generate code if not provided
        code = data.sin_code or self._generate_invoice_code()

        invoice = SupplierInvoice(
            sin_code=code,
            sin_name=data.sin_name,
            sup_id=data.sup_id,
            sco_id=data.sco_id,
            soc_id=data.soc_id,
            usr_creator_id=data.usr_creator_id,
            sod_id=data.sod_id,
            cur_id=data.cur_id,
            vat_id=data.vat_id,
            bac_id=data.bac_id,
            sin_inter_comment=data.sin_inter_comment,
            sin_supplier_comment=data.sin_supplier_comment,
            sin_d_creation=now,
            sin_d_update=now,
            sin_file=data.sin_file,
            sin_discount_amount=data.sin_discount_amount or Decimal("0"),
            sin_is_paid=False,
            sin_start_production=False,
            sin_complete_production=False,
            sin_all_product_stored=False,
        )

        self.db.add(invoice)
        self.db.flush()

        # Add lines if provided
        if data.lines:
            for idx, line_data in enumerate(data.lines, start=1):
                self._sync_add_line_internal(invoice, line_data, line_order=idx)

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Created supplier invoice {invoice.sin_id} with code {invoice.sin_code}")
        return invoice

    def _sync_update_invoice(self, invoice_id: int, data: SupplierInvoiceUpdate) -> SupplierInvoice:
        """Synchronous update invoice."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(invoice, field):
                setattr(invoice, field, value)

        invoice.sin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Updated supplier invoice {invoice_id}")
        return invoice

    def _sync_delete_invoice(self, invoice_id: int) -> bool:
        """Synchronous soft delete invoice."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        # For soft delete, we don't have a canceled flag like orders
        # So we'll do a hard delete but log it
        # If business requirements need soft delete, we can add a flag later

        # Get invoice with lines for deletion
        invoice = self._sync_get_invoice(invoice_id, include_lines=True)

        # Delete lines first
        for line in invoice.lines:
            self.db.delete(line)

        self.db.delete(invoice)
        self.db.commit()

        logger.info(f"Deleted supplier invoice {invoice_id}")
        return True

    # ==========================================================================
    # Line Methods (Sync Internal)
    # ==========================================================================

    def _sync_add_line_internal(
        self,
        invoice: SupplierInvoice,
        data: SupplierInvoiceLineCreate,
        line_order: Optional[int] = None
    ) -> SupplierInvoiceLine:
        """Internal method to add line to an invoice (no commit)."""
        # Get next line order if not provided
        if line_order is None:
            max_order = 0
            for line in invoice.lines:
                if line.sil_order and line.sil_order > max_order:
                    max_order = line.sil_order
            line_order = max_order + 1

        # Calculate line totals
        total_crude, price_with_dis, total_price = self._calculate_line_totals(
            data.sil_quantity,
            data.sil_unit_price,
            data.sil_discount_amount or Decimal("0")
        )

        line = SupplierInvoiceLine(
            sin_id=invoice.sin_id,
            prd_id=data.prd_id,
            pit_id=data.pit_id,
            sol_id=data.sol_id,
            sil_order=line_order,
            sil_quantity=data.sil_quantity,
            sil_description=data.sil_description,
            sil_unit_price=data.sil_unit_price,
            sil_discount_amount=data.sil_discount_amount or Decimal("0"),
            sil_total_crude_price=total_crude,
            sil_price_with_dis=price_with_dis,
            sil_total_price=total_price,
            vat_id=data.vat_id,
        )

        self.db.add(line)
        invoice.lines.append(line)
        return line

    def _sync_add_line(self, invoice_id: int, data: SupplierInvoiceLineCreate) -> SupplierInvoiceLine:
        """Synchronous add line to invoice."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=True)

        line = self._sync_add_line_internal(invoice, data)
        self.db.flush()

        invoice.sin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)

        logger.info(f"Added line {line.sil_id} to supplier invoice {invoice_id}")
        return line

    def _sync_update_line(self, invoice_id: int, line_id: int, data: SupplierInvoiceLineUpdate) -> SupplierInvoiceLine:
        """Synchronous update line."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=True)

        # Find the line
        line = None
        for l in invoice.lines:
            if l.sil_id == line_id:
                line = l
                break

        if not line:
            raise SupplierInvoiceLineNotFoundError(line_id)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(line, field):
                setattr(line, field, value)

        # Recalculate line totals if pricing fields changed
        if any(f in update_data for f in ["sil_quantity", "sil_unit_price", "sil_discount_amount"]):
            total_crude, price_with_dis, total_price = self._calculate_line_totals(
                line.sil_quantity or 0,
                line.sil_unit_price or Decimal("0"),
                line.sil_discount_amount or Decimal("0")
            )
            line.sil_total_crude_price = total_crude
            line.sil_price_with_dis = price_with_dis
            line.sil_total_price = total_price

        invoice.sin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)

        logger.info(f"Updated line {line_id} on supplier invoice {invoice_id}")
        return line

    def _sync_delete_line(self, invoice_id: int, line_id: int) -> bool:
        """Synchronous delete line."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=True)

        # Find the line
        line = None
        for l in invoice.lines:
            if l.sil_id == line_id:
                line = l
                break

        if not line:
            raise SupplierInvoiceLineNotFoundError(line_id)

        invoice.lines.remove(line)
        self.db.delete(line)

        invoice.sin_d_update = datetime.now()

        self.db.commit()

        logger.info(f"Deleted line {line_id} from supplier invoice {invoice_id}")
        return True

    # ==========================================================================
    # Payment Status Methods (Sync)
    # ==========================================================================

    def _sync_mark_paid(
        self,
        invoice_id: int,
        bank_receipt_number: Optional[str] = None,
        bank_receipt_file: Optional[str] = None,
        notes: Optional[str] = None
    ) -> SupplierInvoice:
        """Synchronous mark invoice as paid."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        if invoice.sin_is_paid:
            raise SupplierInvoiceStatusError(
                "Invoice is already marked as paid",
                current_status="paid",
                target_action="mark_paid"
            )

        invoice.sin_is_paid = True
        invoice.sin_bank_receipt_number = bank_receipt_number
        invoice.sin_bank_receipt_file = bank_receipt_file
        invoice.sin_d_update = datetime.now()

        if notes:
            current_comment = invoice.sin_inter_comment or ""
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            invoice.sin_inter_comment = f"{current_comment}\n[{timestamp}] Paid: {notes}".strip()

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Marked supplier invoice {invoice_id} as paid")
        return invoice

    def _sync_mark_unpaid(self, invoice_id: int, reason: str) -> SupplierInvoice:
        """Synchronous mark invoice as unpaid."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        if not invoice.sin_is_paid:
            raise SupplierInvoiceStatusError(
                "Invoice is not marked as paid",
                current_status="unpaid",
                target_action="mark_unpaid"
            )

        invoice.sin_is_paid = False
        invoice.sin_d_update = datetime.now()

        # Add reason to internal comment
        current_comment = invoice.sin_inter_comment or ""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        invoice.sin_inter_comment = f"{current_comment}\n[{timestamp}] Marked unpaid: {reason}".strip()

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Marked supplier invoice {invoice_id} as unpaid: {reason}")
        return invoice

    # ==========================================================================
    # Production Status Methods (Sync)
    # ==========================================================================

    def _sync_start_production(self, invoice_id: int, notes: Optional[str] = None) -> SupplierInvoice:
        """Synchronous start production."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        if invoice.sin_start_production:
            raise SupplierInvoiceStatusError(
                "Production has already started",
                current_status="production_started",
                target_action="start_production"
            )

        now = datetime.now()
        invoice.sin_start_production = True
        invoice.sin_d_start_production = now
        invoice.sin_d_update = now

        if notes:
            current_comment = invoice.sin_inter_comment or ""
            timestamp = now.strftime("%Y-%m-%d %H:%M")
            invoice.sin_inter_comment = f"{current_comment}\n[{timestamp}] Production started: {notes}".strip()

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Started production for supplier invoice {invoice_id}")
        return invoice

    def _sync_complete_production(self, invoice_id: int, notes: Optional[str] = None) -> SupplierInvoice:
        """Synchronous complete production."""
        invoice = self._sync_get_invoice(invoice_id, include_lines=False)

        if not invoice.sin_start_production:
            raise SupplierInvoiceStatusError(
                "Production has not started yet",
                current_status="production_not_started",
                target_action="complete_production"
            )

        if invoice.sin_complete_production:
            raise SupplierInvoiceStatusError(
                "Production is already complete",
                current_status="production_complete",
                target_action="complete_production"
            )

        now = datetime.now()
        invoice.sin_complete_production = True
        invoice.sin_d_complete_production = now
        invoice.sin_d_update = now

        if notes:
            current_comment = invoice.sin_inter_comment or ""
            timestamp = now.strftime("%Y-%m-%d %H:%M")
            invoice.sin_inter_comment = f"{current_comment}\n[{timestamp}] Production complete: {notes}".strip()

        self.db.commit()
        self.db.refresh(invoice)

        logger.info(f"Completed production for supplier invoice {invoice_id}")
        return invoice

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_invoices(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierInvoiceSearchParams] = None
    ) -> Tuple[List[SupplierInvoice], int]:
        """List supplier invoices with pagination and filtering (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_invoices, skip, limit, search_params)

    async def get_invoice(self, invoice_id: int, include_lines: bool = True) -> SupplierInvoice:
        """Get supplier invoice by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_invoice, invoice_id, include_lines)

    async def get_invoice_detail(self, invoice_id: int) -> dict:
        """Get supplier invoice by ID with resolved lookup names (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_invoice_detail, invoice_id)

    async def create_invoice(self, data: SupplierInvoiceCreate) -> SupplierInvoice:
        """Create a new supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_invoice, data)

    async def update_invoice(self, invoice_id: int, data: SupplierInvoiceUpdate) -> SupplierInvoice:
        """Update a supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_invoice, invoice_id, data)

    async def delete_invoice(self, invoice_id: int) -> bool:
        """Delete a supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_invoice, invoice_id)

    # Line async wrappers
    async def add_line(self, invoice_id: int, data: SupplierInvoiceLineCreate) -> SupplierInvoiceLine:
        """Add line to supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_add_line, invoice_id, data)

    async def update_line(self, invoice_id: int, line_id: int, data: SupplierInvoiceLineUpdate) -> SupplierInvoiceLine:
        """Update supplier invoice line (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_line, invoice_id, line_id, data)

    async def delete_line(self, invoice_id: int, line_id: int) -> bool:
        """Delete supplier invoice line (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_line, invoice_id, line_id)

    # Payment status async wrappers
    async def mark_paid(
        self,
        invoice_id: int,
        bank_receipt_number: Optional[str] = None,
        bank_receipt_file: Optional[str] = None,
        notes: Optional[str] = None
    ) -> SupplierInvoice:
        """Mark supplier invoice as paid (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_mark_paid, invoice_id, bank_receipt_number, bank_receipt_file, notes
        )

    async def mark_unpaid(self, invoice_id: int, reason: str) -> SupplierInvoice:
        """Mark supplier invoice as unpaid (async wrapper)."""
        return await asyncio.to_thread(self._sync_mark_unpaid, invoice_id, reason)

    # Production status async wrappers
    async def start_production(self, invoice_id: int, notes: Optional[str] = None) -> SupplierInvoice:
        """Start production for supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_start_production, invoice_id, notes)

    async def complete_production(self, invoice_id: int, notes: Optional[str] = None) -> SupplierInvoice:
        """Complete production for supplier invoice (async wrapper)."""
        return await asyncio.to_thread(self._sync_complete_production, invoice_id, notes)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_supplier_invoice_service(
    db: Session = Depends(get_db)
) -> SupplierInvoiceService:
    """
    Dependency to get SupplierInvoiceService instance.
    """
    return SupplierInvoiceService(db)

"""
Supplier Order Service Module.

Provides functionality for:
- Supplier Order CRUD operations
- Order line management
- Order status management (confirm, cancel)
- Order totals calculation
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
from app.models.supplier_order import SupplierOrder, SupplierOrderLine
from app.models.supplier import Supplier
from app.models.society import Society
from app.models.currency import Currency
from app.models.vat_rate import VatRate
from app.models.user import User
from app.schemas.supplier_order import (
    SupplierOrderCreate, SupplierOrderUpdate, SupplierOrderSearchParams,
    SupplierOrderLineCreate, SupplierOrderLineUpdate,
    SupplierOrderDetailResponse, SupplierOrderLineResponse
)
from loguru import logger


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SupplierOrderServiceError(Exception):
    """Base exception for supplier order service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SupplierOrderNotFoundError(SupplierOrderServiceError):
    """Raised when supplier order is not found."""
    def __init__(self, order_id: int):
        super().__init__(
            code="SUPPLIER_ORDER_NOT_FOUND",
            message=f"Supplier order with ID {order_id} not found",
            details={"order_id": order_id}
        )


class SupplierOrderLineNotFoundError(SupplierOrderServiceError):
    """Raised when supplier order line is not found."""
    def __init__(self, line_id: int):
        super().__init__(
            code="SUPPLIER_ORDER_LINE_NOT_FOUND",
            message=f"Supplier order line with ID {line_id} not found",
            details={"line_id": line_id}
        )


class SupplierOrderValidationError(SupplierOrderServiceError):
    """Raised when supplier order data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="SUPPLIER_ORDER_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class SupplierOrderStatusError(SupplierOrderServiceError):
    """Raised when supplier order status operation is invalid."""
    def __init__(self, message: str, current_status: str, target_action: str):
        super().__init__(
            code="SUPPLIER_ORDER_STATUS_ERROR",
            message=message,
            details={"current_status": current_status, "target_action": target_action}
        )


# ==========================================================================
# Supplier Order Service Class
# ==========================================================================

class SupplierOrderService:
    """
    Service class for supplier order operations.

    Handles CRUD operations, line management, and status updates for supplier orders.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    # Default VAT rate percentage (used if VAT lookup fails)
    DEFAULT_VAT_RATE = Decimal("20.0")

    def __init__(self, db: Session):
        """
        Initialize the supplier order service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    def _generate_order_code(self) -> str:
        """Generate unique order code."""
        year = datetime.now().year
        month = datetime.now().month
        prefix = f"SOD-{year}{month:02d}-"

        # Get the max code for this month
        query = select(func.max(SupplierOrder.sod_code)).where(
            SupplierOrder.sod_code.like(f"{prefix}%")
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
        total_price = price_with_discount  # Same for now, VAT calculated at order level
        return total_crude_price, price_with_discount, total_price

    def _recalculate_order_totals(self, order: SupplierOrder) -> None:
        """
        Recalculate order totals from lines.

        Args:
            order: The supplier order to recalculate
        """
        total_ht = Decimal("0")

        for line in order.lines:
            line_total = line.sol_total_price or Decimal("0")
            total_ht += line_total

        # Apply order-level discount
        order_discount = order.sod_discount_amount or Decimal("0")
        total_ht = total_ht - order_discount

        # Get VAT rate
        vat_rate = self.DEFAULT_VAT_RATE
        if order.vat_id:
            vat = self.db.get(VatRate, order.vat_id)
            if vat:
                vat_rate = vat.vat_rate or self.DEFAULT_VAT_RATE

        # Calculate total TTC (including VAT)
        vat_amount = total_ht * vat_rate / Decimal("100")
        total_ttc = total_ht + vat_amount

        # Update order totals
        order.sod_total_ht = total_ht
        order.sod_total_ttc = total_ttc
        order.sod_need2pay = total_ttc - (order.sod_paid or Decimal("0"))

        logger.debug(f"Recalculated order {order.sod_id} totals: HT={total_ht}, TTC={total_ttc}")

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_orders(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierOrderSearchParams] = None
    ) -> Tuple[List[SupplierOrder], int]:
        """Synchronous list orders implementation."""
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        SupplierOrder.sod_code.ilike(search_term),
                        SupplierOrder.sod_name.ilike(search_term),
                    )
                )

            if search_params.supplier_id is not None:
                base_filters.append(SupplierOrder.sup_id == search_params.supplier_id)

            if search_params.society_id is not None:
                base_filters.append(SupplierOrder.soc_id == search_params.society_id)

            if search_params.currency_id is not None:
                base_filters.append(SupplierOrder.cur_id == search_params.currency_id)

            if search_params.is_started is not None:
                base_filters.append(SupplierOrder.sod_started == search_params.is_started)

            if search_params.is_canceled is not None:
                base_filters.append(SupplierOrder.sod_canceled == search_params.is_canceled)

            if search_params.date_from is not None:
                base_filters.append(SupplierOrder.sod_d_creation >= search_params.date_from)

            if search_params.date_to is not None:
                base_filters.append(SupplierOrder.sod_d_creation <= search_params.date_to)

            if search_params.exp_delivery_from is not None:
                base_filters.append(SupplierOrder.sod_d_exp_delivery >= search_params.exp_delivery_from)

            if search_params.exp_delivery_to is not None:
                base_filters.append(SupplierOrder.sod_d_exp_delivery <= search_params.exp_delivery_to)

            if search_params.min_amount is not None:
                base_filters.append(SupplierOrder.sod_total_ttc >= search_params.min_amount)

            if search_params.max_amount is not None:
                base_filters.append(SupplierOrder.sod_total_ttc <= search_params.max_amount)

            if search_params.creator_id is not None:
                base_filters.append(SupplierOrder.usr_creator_id == search_params.creator_id)

        # Get total count
        count_query = select(func.count(SupplierOrder.sod_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get orders
        query = (
            select(SupplierOrder)
            .order_by(SupplierOrder.sod_d_creation.desc())
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = self.db.execute(query)
        orders = list(result.scalars().all())

        return orders, total

    def _sync_get_order(self, order_id: int, include_lines: bool = True) -> SupplierOrder:
        """Synchronous get order by ID."""
        if include_lines:
            query = (
                select(SupplierOrder)
                .options(selectinload(SupplierOrder.lines))
                .where(SupplierOrder.sod_id == order_id)
            )
            result = self.db.execute(query)
            order = result.scalars().first()
        else:
            order = self.db.get(SupplierOrder, order_id)

        if not order:
            raise SupplierOrderNotFoundError(order_id)
        return order

    def _sync_get_order_detail(self, order_id: int) -> dict:
        """
        Synchronous get order by ID with resolved lookup names.
        Returns a dict suitable for SupplierOrderDetailResponse.
        """
        # Get order with lines
        query = (
            select(SupplierOrder)
            .options(selectinload(SupplierOrder.lines))
            .where(SupplierOrder.sod_id == order_id)
        )
        result = self.db.execute(query)
        order = result.scalars().first()

        if not order:
            raise SupplierOrderNotFoundError(order_id)

        # Build base response from order ORM object
        # First convert lines
        lines_data = [
            SupplierOrderLineResponse.model_validate(line).model_dump()
            for line in order.lines
        ]

        response_data = SupplierOrderDetailResponse.model_validate(order).model_dump()
        response_data["lines"] = lines_data

        # Resolve lookup names
        # Supplier
        if order.sup_id:
            supplier = self.db.get(Supplier, order.sup_id)
            if supplier:
                response_data["supplierName"] = supplier.sup_company_name
                response_data["supplierReference"] = supplier.sup_ref

        # Society
        if order.soc_id:
            society = self.db.get(Society, order.soc_id)
            if society:
                response_data["societyName"] = society.soc_society_name

        # Currency
        if order.cur_id:
            currency = self.db.get(Currency, order.cur_id)
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # VAT
        if order.vat_id:
            vat = self.db.get(VatRate, order.vat_id)
            if vat:
                response_data["vatRate"] = vat.vat_rate

        # Creator
        if order.usr_creator_id:
            user = self.db.get(User, order.usr_creator_id)
            if user:
                response_data["creatorName"] = f"{user.usr_first_name or ''} {user.usr_name or ''}".strip()

        logger.debug(f"Fetched supplier order detail for sod_id={order_id}")
        return response_data

    def _sync_create_order(self, data: SupplierOrderCreate) -> SupplierOrder:
        """Synchronous create order."""
        now = datetime.now()

        # Generate code if not provided
        code = data.sod_code or self._generate_order_code()

        order = SupplierOrder(
            sod_code=code,
            sod_name=data.sod_name,
            sup_id=data.sup_id,
            sco_id=data.sco_id,
            soc_id=data.soc_id,
            usr_creator_id=data.usr_creator_id,
            pin_id=data.pin_id,
            cur_id=data.cur_id,
            vat_id=data.vat_id,
            sod_inter_comment=data.sod_inter_comment,
            sod_supplier_comment=data.sod_supplier_comment,
            sod_d_creation=now,
            sod_d_update=now,
            sod_d_exp_delivery=data.sod_d_exp_delivery,
            sod_file=data.sod_file,
            sod_discount_amount=data.sod_discount_amount or Decimal("0"),
            sod_total_ht=Decimal("0"),
            sod_total_ttc=Decimal("0"),
            sod_need2pay=Decimal("0"),
            sod_paid=Decimal("0"),
            sod_started=False,
            sod_canceled=False,
        )

        self.db.add(order)
        self.db.flush()

        # Add lines if provided
        if data.lines:
            for idx, line_data in enumerate(data.lines, start=1):
                self._sync_add_line_internal(order, line_data, line_order=idx)

        # Recalculate totals
        self._recalculate_order_totals(order)

        self.db.commit()
        self.db.refresh(order)

        logger.info(f"Created supplier order {order.sod_id} with code {order.sod_code}")
        return order

    def _sync_update_order(self, order_id: int, data: SupplierOrderUpdate) -> SupplierOrder:
        """Synchronous update order."""
        order = self._sync_get_order(order_id, include_lines=False)

        # Check if order can be updated
        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Cannot update a canceled order",
                current_status="canceled",
                target_action="update"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(order, field):
                setattr(order, field, value)

        order.sod_d_update = datetime.now()

        # Recalculate totals if discount changed
        if "sod_discount_amount" in update_data:
            # Reload with lines to recalculate
            order = self._sync_get_order(order_id, include_lines=True)
            self._recalculate_order_totals(order)

        self.db.commit()
        self.db.refresh(order)

        logger.info(f"Updated supplier order {order_id}")
        return order

    def _sync_delete_order(self, order_id: int) -> bool:
        """Synchronous soft delete order (cancel)."""
        order = self._sync_get_order(order_id, include_lines=False)

        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Order is already canceled",
                current_status="canceled",
                target_action="delete"
            )

        order.sod_canceled = True
        order.sod_d_update = datetime.now()

        self.db.commit()
        logger.info(f"Soft deleted (canceled) supplier order {order_id}")
        return True

    def _sync_permanent_delete_order(self, order_id: int) -> bool:
        """Synchronous hard delete order."""
        order = self._sync_get_order(order_id, include_lines=True)

        # Delete lines first (cascade should handle this, but be explicit)
        for line in order.lines:
            self.db.delete(line)

        self.db.delete(order)
        self.db.commit()

        logger.info(f"Permanently deleted supplier order {order_id}")
        return True

    # ==========================================================================
    # Line Methods (Sync Internal)
    # ==========================================================================

    def _sync_add_line_internal(
        self,
        order: SupplierOrder,
        data: SupplierOrderLineCreate,
        line_order: Optional[int] = None
    ) -> SupplierOrderLine:
        """Internal method to add line to an order (no commit)."""
        # Get next line order if not provided
        if line_order is None:
            max_order = 0
            for line in order.lines:
                if line.sol_order and line.sol_order > max_order:
                    max_order = line.sol_order
            line_order = max_order + 1

        # Calculate line totals
        total_crude, price_with_dis, total_price = self._calculate_line_totals(
            data.sol_quantity,
            data.sol_unit_price,
            data.sol_discount_amount or Decimal("0")
        )

        line = SupplierOrderLine(
            sod_id=order.sod_id,
            prd_id=data.prd_id,
            pit_id=data.pit_id,
            pil_id=data.pil_id,
            sol_order=line_order,
            sol_quantity=data.sol_quantity,
            sol_description=data.sol_description,
            sol_unit_price=data.sol_unit_price,
            sol_discount_amount=data.sol_discount_amount or Decimal("0"),
            sol_total_crude_price=total_crude,
            sol_price_with_dis=price_with_dis,
            sol_total_price=total_price,
            vat_id=data.vat_id,
        )

        self.db.add(line)
        order.lines.append(line)
        return line

    def _sync_add_line(self, order_id: int, data: SupplierOrderLineCreate) -> SupplierOrderLine:
        """Synchronous add line to order."""
        order = self._sync_get_order(order_id, include_lines=True)

        # Check if order can be modified
        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Cannot add lines to a canceled order",
                current_status="canceled",
                target_action="add_line"
            )

        line = self._sync_add_line_internal(order, data)
        self.db.flush()

        # Recalculate order totals
        self._recalculate_order_totals(order)
        order.sod_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)

        logger.info(f"Added line {line.sol_id} to supplier order {order_id}")
        return line

    def _sync_update_line(self, order_id: int, line_id: int, data: SupplierOrderLineUpdate) -> SupplierOrderLine:
        """Synchronous update line."""
        order = self._sync_get_order(order_id, include_lines=True)

        # Check if order can be modified
        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Cannot update lines on a canceled order",
                current_status="canceled",
                target_action="update_line"
            )

        # Find the line
        line = None
        for l in order.lines:
            if l.sol_id == line_id:
                line = l
                break

        if not line:
            raise SupplierOrderLineNotFoundError(line_id)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(line, field):
                setattr(line, field, value)

        # Recalculate line totals if pricing fields changed
        if any(f in update_data for f in ["sol_quantity", "sol_unit_price", "sol_discount_amount"]):
            total_crude, price_with_dis, total_price = self._calculate_line_totals(
                line.sol_quantity or 0,
                line.sol_unit_price or Decimal("0"),
                line.sol_discount_amount or Decimal("0")
            )
            line.sol_total_crude_price = total_crude
            line.sol_price_with_dis = price_with_dis
            line.sol_total_price = total_price

        # Recalculate order totals
        self._recalculate_order_totals(order)
        order.sod_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)

        logger.info(f"Updated line {line_id} on supplier order {order_id}")
        return line

    def _sync_delete_line(self, order_id: int, line_id: int) -> bool:
        """Synchronous delete line."""
        order = self._sync_get_order(order_id, include_lines=True)

        # Check if order can be modified
        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Cannot delete lines from a canceled order",
                current_status="canceled",
                target_action="delete_line"
            )

        # Find the line
        line = None
        for l in order.lines:
            if l.sol_id == line_id:
                line = l
                break

        if not line:
            raise SupplierOrderLineNotFoundError(line_id)

        order.lines.remove(line)
        self.db.delete(line)

        # Recalculate order totals
        self._recalculate_order_totals(order)
        order.sod_d_update = datetime.now()

        self.db.commit()

        logger.info(f"Deleted line {line_id} from supplier order {order_id}")
        return True

    # ==========================================================================
    # Status Methods (Sync)
    # ==========================================================================

    def _sync_confirm_order(self, order_id: int, notes: Optional[str] = None) -> SupplierOrder:
        """Synchronous confirm order (mark as started)."""
        order = self._sync_get_order(order_id, include_lines=False)

        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Cannot confirm a canceled order",
                current_status="canceled",
                target_action="confirm"
            )

        if order.sod_started:
            raise SupplierOrderStatusError(
                "Order is already confirmed/started",
                current_status="started",
                target_action="confirm"
            )

        order.sod_started = True
        order.sod_d_update = datetime.now()

        if notes:
            current_comment = order.sod_inter_comment or ""
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            order.sod_inter_comment = f"{current_comment}\n[{timestamp}] Confirmed: {notes}".strip()

        self.db.commit()
        self.db.refresh(order)

        logger.info(f"Confirmed supplier order {order_id}")
        return order

    def _sync_cancel_order(self, order_id: int, reason: str) -> SupplierOrder:
        """Synchronous cancel order."""
        order = self._sync_get_order(order_id, include_lines=False)

        if order.sod_canceled:
            raise SupplierOrderStatusError(
                "Order is already canceled",
                current_status="canceled",
                target_action="cancel"
            )

        order.sod_canceled = True
        order.sod_d_update = datetime.now()

        # Add cancellation reason to internal comment
        current_comment = order.sod_inter_comment or ""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        order.sod_inter_comment = f"{current_comment}\n[{timestamp}] Canceled: {reason}".strip()

        self.db.commit()
        self.db.refresh(order)

        logger.info(f"Canceled supplier order {order_id}: {reason}")
        return order

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_orders(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierOrderSearchParams] = None
    ) -> Tuple[List[SupplierOrder], int]:
        """List supplier orders with pagination and filtering (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_orders, skip, limit, search_params)

    async def get_order(self, order_id: int, include_lines: bool = True) -> SupplierOrder:
        """Get supplier order by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_order, order_id, include_lines)

    async def get_order_detail(self, order_id: int) -> dict:
        """Get supplier order by ID with resolved lookup names (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_order_detail, order_id)

    async def create_order(self, data: SupplierOrderCreate) -> SupplierOrder:
        """Create a new supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_order, data)

    async def update_order(self, order_id: int, data: SupplierOrderUpdate) -> SupplierOrder:
        """Update a supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_order, order_id, data)

    async def delete_order(self, order_id: int) -> bool:
        """Soft delete (cancel) a supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_order, order_id)

    async def permanent_delete_order(self, order_id: int) -> bool:
        """Hard delete a supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_permanent_delete_order, order_id)

    # Line async wrappers
    async def add_line(self, order_id: int, data: SupplierOrderLineCreate) -> SupplierOrderLine:
        """Add line to supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_add_line, order_id, data)

    async def update_line(self, order_id: int, line_id: int, data: SupplierOrderLineUpdate) -> SupplierOrderLine:
        """Update supplier order line (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_line, order_id, line_id, data)

    async def delete_line(self, order_id: int, line_id: int) -> bool:
        """Delete supplier order line (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_line, order_id, line_id)

    # Status async wrappers
    async def confirm_order(self, order_id: int, notes: Optional[str] = None) -> SupplierOrder:
        """Confirm supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_confirm_order, order_id, notes)

    async def cancel_order(self, order_id: int, reason: str) -> SupplierOrder:
        """Cancel supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_cancel_order, order_id, reason)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_supplier_order_service(
    db: Session = Depends(get_db)
) -> SupplierOrderService:
    """
    Dependency to get SupplierOrderService instance.
    """
    return SupplierOrderService(db)

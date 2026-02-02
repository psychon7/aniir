"""
Order Service.

Provides business logic for:
- Order CRUD operations
- Order line management
- Order status management
- Shopify order sync
- Order statistics
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import ClientOrder, ClientOrderLine
from app.models.client import Client
from app.models.society import Society
from app.models.project import Project
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderSearchParams,
    OrderLineCreate, OrderLineUpdate,
    ShopifyOrderWebhook, OrderSyncResult, AddressSchema,
    OrderDetailResponse
)
from loguru import logger


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class OrderServiceError(Exception):
    """Base exception for order service errors."""
    def __init__(self, message: str, code: str = "ORDER_ERROR", details: Optional[Dict] = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class OrderNotFoundError(OrderServiceError):
    """Raised when order is not found."""
    def __init__(self, order_id: int):
        super().__init__(
            f"Order with ID {order_id} not found",
            code="ORDER_NOT_FOUND",
            details={"order_id": order_id}
        )


class OrderLineNotFoundError(OrderServiceError):
    """Raised when order line is not found."""
    def __init__(self, line_id: int):
        super().__init__(
            f"Order line with ID {line_id} not found",
            code="ORDER_LINE_NOT_FOUND",
            details={"line_id": line_id}
        )


class OrderValidationError(OrderServiceError):
    """Raised when order validation fails."""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, code="ORDER_VALIDATION_ERROR", details=details)


class OrderStatusError(OrderServiceError):
    """Raised when order status transition is invalid."""
    def __init__(self, message: str, current_status: str, target_status: str):
        super().__init__(
            message,
            code="ORDER_STATUS_ERROR",
            details={"current_status": current_status, "target_status": target_status}
        )


class ShopifyOrderNotFoundError(OrderServiceError):
    """Raised when Shopify order is not found."""
    def __init__(self, shopify_id: str):
        super().__init__(
            f"Order with Shopify ID {shopify_id} not found",
            code="SHOPIFY_ORDER_NOT_FOUND",
            details={"shopify_id": shopify_id}
        )


# ==========================================================================
# Order Service
# ==========================================================================

class OrderService:
    """Service for managing orders."""

    # Status IDs mapping (assumes these exist in TR_STA_Status table)
    STATUS_DRAFT = 1
    STATUS_PENDING = 2
    STATUS_CONFIRMED = 3
    STATUS_PROCESSING = 4
    STATUS_SHIPPED = 5
    STATUS_DELIVERED = 6
    STATUS_CANCELLED = 7
    STATUS_REFUNDED = 8

    # Default currency ID for EUR
    DEFAULT_CURRENCY_ID = 1

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_reference(self) -> str:
        """Generate unique order reference."""
        year = datetime.now().year
        prefix = f"ORD-{year}-"

        # Get the max reference for this year
        stmt = select(func.max(ClientOrder.ord_reference)).where(
            ClientOrder.ord_reference.like(f"{prefix}%")
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
        discount: Decimal = Decimal("0"),
        tax_rate: Decimal = Decimal("0")
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Calculate line totals: subtotal, vat_amount, line_total."""
        subtotal = quantity * unit_price - discount
        vat_amount = subtotal * tax_rate / 100
        line_total = subtotal + vat_amount
        return subtotal, vat_amount, line_total

    async def _recalculate_order_totals(self, order_id: int) -> None:
        """Recalculate order totals from lines."""
        # Get all lines
        stmt = select(ClientOrderLine).where(
            ClientOrderLine.orl_ord_id == order_id
        )
        result = await self.db.execute(stmt)
        lines = result.scalars().all()

        sub_total = Decimal("0")
        total_vat = Decimal("0")

        for line in lines:
            line_subtotal = line.orl_line_total - line.orl_vat_amount
            sub_total += line_subtotal
            total_vat += line.orl_vat_amount

        # Get order and update
        stmt = select(ClientOrder).where(ClientOrder.ord_id == order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if order:
            order.ord_sub_total = sub_total
            order.ord_total_vat = total_vat

            # Calculate total with shipping and discounts
            total = sub_total + total_vat
            if order.ord_shipping_amount:
                total += order.ord_shipping_amount
            if order.ord_discount:
                total -= order.ord_discount

            order.ord_total_amount = total
            await self.db.flush()

    def _apply_shipping_address(self, order: ClientOrder, address: AddressSchema) -> None:
        """Apply shipping address to order."""
        if address:
            order.ord_shipping_address = address.address
            order.ord_shipping_address2 = address.address2
            order.ord_shipping_city = address.city
            order.ord_shipping_postal_code = address.postal_code
            order.ord_shipping_country_id = address.country_id
            order.ord_shipping_country_code = address.country_code

    def _apply_billing_address(self, order: ClientOrder, address: AddressSchema) -> None:
        """Apply billing address to order."""
        if address:
            order.ord_billing_address = address.address
            order.ord_billing_address2 = address.address2
            order.ord_billing_city = address.city
            order.ord_billing_postal_code = address.postal_code
            order.ord_billing_country_id = address.country_id
            order.ord_billing_country_code = address.country_code

    # ==========================================================================
    # CRUD Operations
    # ==========================================================================

    async def create_order(
        self,
        data: OrderCreate,
        created_by: Optional[int] = None
    ) -> ClientOrder:
        """Create a new order with optional lines."""
        # Generate reference if not provided
        reference = data.ord_reference or await self._generate_reference()

        # Create order
        order = ClientOrder(
            ord_reference=reference,
            ord_cli_id=data.ord_cli_id,
            ord_date=data.ord_date,
            ord_expected_delivery_date=data.ord_expected_delivery_date,
            ord_sta_id=self.STATUS_PENDING,
            ord_cur_id=data.ord_cur_id,
            ord_pay_mode_id=data.ord_pay_mode_id,
            ord_notes=data.ord_notes,
            ord_internal_notes=data.ord_internal_notes,
            ord_bu_id=data.ord_bu_id,
            ord_soc_id=data.ord_soc_id,
            ord_created_by=created_by,

            # Customer info
            ord_customer_email=data.ord_customer_email,
            ord_customer_phone=data.ord_customer_phone,
            ord_customer_first_name=data.ord_customer_first_name,
            ord_customer_last_name=data.ord_customer_last_name,

            # Shopify fields
            ord_shopify_id=data.ord_shopify_id,
            ord_shopify_name=data.ord_shopify_name,
            ord_shopify_created_at=data.ord_shopify_created_at,
            ord_shopify_updated_at=data.ord_shopify_updated_at,
            ord_fulfillment_status=data.ord_fulfillment_status,
            ord_financial_status=data.ord_financial_status,

            # Initial totals
            ord_sub_total=data.ord_sub_total or Decimal("0"),
            ord_total_vat=data.ord_total_vat or Decimal("0"),
            ord_total_amount=data.ord_total_amount or Decimal("0"),
            ord_discount=data.ord_discount or Decimal("0"),
            ord_shipping_amount=data.ord_shipping_amount or Decimal("0"),
            ord_tax_amount=data.ord_tax_amount or Decimal("0"),
        )

        # Apply addresses
        if data.shipping_address:
            self._apply_shipping_address(order, data.shipping_address)
        if data.billing_address:
            self._apply_billing_address(order, data.billing_address)

        self.db.add(order)
        await self.db.flush()

        # Add lines if provided
        if data.lines:
            for idx, line_data in enumerate(data.lines, start=1):
                await self.add_order_line(order.ord_id, line_data, line_number=idx)

        # Recalculate totals if lines were added and totals not provided
        if data.lines and not data.ord_total_amount:
            await self._recalculate_order_totals(order.ord_id)

        await self.db.refresh(order)
        return order

    async def get_order(self, order_id: int, include_lines: bool = True) -> ClientOrder:
        """Get order by ID."""
        if include_lines:
            stmt = select(ClientOrder).options(
                selectinload(ClientOrder.lines)
            ).where(ClientOrder.ord_id == order_id)
        else:
            stmt = select(ClientOrder).where(ClientOrder.ord_id == order_id)

        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise OrderNotFoundError(order_id)

        return order

    async def get_order_by_reference(self, reference: str) -> ClientOrder:
        """Get order by reference."""
        stmt = select(ClientOrder).options(
            selectinload(ClientOrder.lines)
        ).where(ClientOrder.ord_reference == reference)

        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise OrderServiceError(
                f"Order with reference '{reference}' not found",
                code="ORDER_NOT_FOUND"
            )

        return order

    async def get_order_by_shopify_id(self, shopify_id: str) -> Optional[ClientOrder]:
        """Get order by Shopify ID."""
        stmt = select(ClientOrder).options(
            selectinload(ClientOrder.lines)
        ).where(ClientOrder.ord_shopify_id == shopify_id)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_order_detail(self, order_id: int) -> dict:
        """
        Get client order by ID with resolved lookup names.
        Returns a dict suitable for OrderDetailResponse.

        This method fetches the order from TM_COD_Client_Order and enriches it
        with resolved names from lookup tables (client, project, society, etc.).

        Args:
            order_id: The order ID (cod_id)

        Returns:
            dict: Order data with resolved lookup names

        Raises:
            OrderNotFoundError: If order is not found
        """
        # Get the order using cod_id
        stmt = select(ClientOrder).where(ClientOrder.cod_id == order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise OrderNotFoundError(order_id)

        # Build base response from order ORM object
        response_data = OrderDetailResponse.model_validate(order).model_dump()

        # Resolve Client lookup
        if order.cli_id:
            client_stmt = select(Client).where(Client.cli_id == order.cli_id)
            client_result = await self.db.execute(client_stmt)
            client = client_result.scalar_one_or_none()
            if client:
                response_data["clientName"] = client.cli_company_name
                response_data["clientReference"] = client.cli_ref

        # Resolve Society lookup
        if order.soc_id:
            society_stmt = select(Society).where(Society.soc_id == order.soc_id)
            society_result = await self.db.execute(society_stmt)
            society = society_result.scalar_one_or_none()
            if society:
                response_data["societyName"] = society.soc_society_name

        # Resolve Project lookup
        if order.prj_id:
            project_stmt = select(Project).where(Project.prj_id == order.prj_id)
            project_result = await self.db.execute(project_stmt)
            project = project_result.scalar_one_or_none()
            if project:
                response_data["projectName"] = project.prj_name
                response_data["projectCode"] = project.prj_code

        # Resolve Payment Mode lookup
        if order.pmo_id:
            payment_mode_stmt = select(PaymentMode).where(PaymentMode.pmo_id == order.pmo_id)
            payment_mode_result = await self.db.execute(payment_mode_stmt)
            payment_mode = payment_mode_result.scalar_one_or_none()
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Resolve Payment Condition (Term) lookup
        if order.pco_id:
            payment_term_stmt = select(PaymentTerm).where(PaymentTerm.pco_id == order.pco_id)
            payment_term_result = await self.db.execute(payment_term_stmt)
            payment_term = payment_term_result.scalar_one_or_none()
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        logger.debug(f"Fetched order detail for cod_id={order_id}")
        return response_data

    async def update_order(
        self,
        order_id: int,
        data: OrderUpdate
    ) -> ClientOrder:
        """Update an order."""
        order = await self.get_order(order_id, include_lines=False)

        # Check if order can be updated
        if order.ord_is_cancelled:
            raise OrderStatusError(
                "Cannot update a cancelled order",
                current_status="cancelled",
                target_status="updated"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True, exclude={"shipping_address", "billing_address"})
        for field, value in update_data.items():
            if hasattr(order, field) and value is not None:
                setattr(order, field, value)

        # Apply addresses if provided
        if data.shipping_address:
            self._apply_shipping_address(order, data.shipping_address)
        if data.billing_address:
            self._apply_billing_address(order, data.billing_address)

        order.ord_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def delete_order(self, order_id: int) -> None:
        """Delete an order and its lines."""
        order = await self.get_order(order_id, include_lines=False)

        # Only allow deletion of draft orders
        if order.ord_sta_id != self.STATUS_DRAFT:
            raise OrderStatusError(
                "Only draft orders can be deleted",
                current_status=str(order.ord_sta_id),
                target_status="deleted"
            )

        # Delete lines first
        stmt = select(ClientOrderLine).where(
            ClientOrderLine.orl_ord_id == order_id
        )
        result = await self.db.execute(stmt)
        lines = result.scalars().all()
        for line in lines:
            await self.db.delete(line)

        await self.db.delete(order)
        await self.db.flush()

    async def search_orders(self, params: OrderSearchParams) -> Dict[str, Any]:
        """Search orders with filters and pagination."""
        stmt = select(ClientOrder)

        # Apply filters
        conditions = []

        if params.reference:
            conditions.append(ClientOrder.ord_reference.ilike(f"%{params.reference}%"))

        if params.client_id:
            conditions.append(ClientOrder.ord_cli_id == params.client_id)

        if params.status_id:
            conditions.append(ClientOrder.ord_sta_id == params.status_id)

        if params.fulfillment_status:
            conditions.append(ClientOrder.ord_fulfillment_status == params.fulfillment_status)

        if params.financial_status:
            conditions.append(ClientOrder.ord_financial_status == params.financial_status)

        if params.shopify_id:
            conditions.append(ClientOrder.ord_shopify_id == params.shopify_id)

        if params.date_from:
            conditions.append(ClientOrder.ord_date >= params.date_from)

        if params.date_to:
            conditions.append(ClientOrder.ord_date <= params.date_to)

        if params.min_amount:
            conditions.append(ClientOrder.ord_total_amount >= params.min_amount)

        if params.max_amount:
            conditions.append(ClientOrder.ord_total_amount <= params.max_amount)

        if params.currency_id:
            conditions.append(ClientOrder.ord_cur_id == params.currency_id)

        if params.society_id:
            conditions.append(ClientOrder.ord_soc_id == params.society_id)

        if params.bu_id:
            conditions.append(ClientOrder.ord_bu_id == params.bu_id)

        if params.is_cancelled is not None:
            conditions.append(ClientOrder.ord_is_cancelled == params.is_cancelled)

        if params.sync_status:
            conditions.append(ClientOrder.ord_sync_status == params.sync_status)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(ClientOrder, params.sort_by, ClientOrder.ord_created_at)
        if params.sort_order == "desc":
            stmt = stmt.order_by(desc(sort_column))
        else:
            stmt = stmt.order_by(asc(sort_column))

        # Apply pagination
        offset = (params.page - 1) * params.page_size
        stmt = stmt.offset(offset).limit(params.page_size)

        result = await self.db.execute(stmt)
        orders = result.scalars().all()

        total_pages = (total + params.page_size - 1) // params.page_size

        return {
            "items": orders,
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "total_pages": total_pages
        }

    # ==========================================================================
    # Order Line Operations
    # ==========================================================================

    async def add_order_line(
        self,
        order_id: int,
        data: OrderLineCreate,
        line_number: Optional[int] = None
    ) -> ClientOrderLine:
        """Add a line to an order."""
        order = await self.get_order(order_id, include_lines=False)

        # Check order status
        if order.ord_is_cancelled:
            raise OrderStatusError(
                "Cannot add lines to a cancelled order",
                current_status="cancelled",
                target_status="line_added"
            )

        # Get next line number if not provided
        if line_number is None:
            stmt = select(func.max(ClientOrderLine.orl_line_number)).where(
                ClientOrderLine.orl_ord_id == order_id
            )
            result = await self.db.execute(stmt)
            max_line = result.scalar() or 0
            line_number = max_line + 1

        # Calculate totals
        tax_rate = data.orl_tax_rate or Decimal("0")
        subtotal, vat_amount, line_total = await self._calculate_line_totals(
            data.orl_quantity,
            data.orl_unit_price,
            data.orl_discount,
            tax_rate
        )

        line = ClientOrderLine(
            orl_ord_id=order_id,
            orl_line_number=line_number,
            orl_prd_id=data.orl_prd_id,
            orl_sku=data.orl_sku,
            orl_description=data.orl_description,
            orl_variant_title=data.orl_variant_title,
            orl_quantity=data.orl_quantity,
            orl_unit_price=data.orl_unit_price,
            orl_discount=data.orl_discount,
            orl_discount_percent=data.orl_discount_percent,
            orl_vat_id=data.orl_vat_id,
            orl_vat_amount=vat_amount,
            orl_tax_rate=tax_rate,
            orl_taxable=data.orl_taxable,
            orl_line_total=line_total,
            orl_sort_order=data.orl_sort_order,
            orl_notes=data.orl_notes,
            # Shopify fields
            orl_shopify_line_id=data.orl_shopify_line_id,
            orl_shopify_variant_id=data.orl_shopify_variant_id,
            orl_shopify_product_id=data.orl_shopify_product_id,
        )

        self.db.add(line)
        await self.db.flush()

        # Recalculate order totals
        await self._recalculate_order_totals(order_id)

        await self.db.refresh(line)
        return line

    async def update_order_line(
        self,
        line_id: int,
        data: OrderLineUpdate
    ) -> ClientOrderLine:
        """Update an order line."""
        stmt = select(ClientOrderLine).where(ClientOrderLine.orl_id == line_id)
        result = await self.db.execute(stmt)
        line = result.scalar_one_or_none()

        if not line:
            raise OrderLineNotFoundError(line_id)

        # Get order to check status
        order = await self.get_order(line.orl_ord_id, include_lines=False)

        if order.ord_is_cancelled:
            raise OrderStatusError(
                "Cannot update lines on a cancelled order",
                current_status="cancelled",
                target_status="line_updated"
            )

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(line, field):
                setattr(line, field, value)

        # Recalculate line totals if quantity, price, or discount changed
        if any(f in update_data for f in ["orl_quantity", "orl_unit_price", "orl_discount", "orl_tax_rate"]):
            tax_rate = line.orl_tax_rate or Decimal("0")
            subtotal, vat_amount, line_total = await self._calculate_line_totals(
                line.orl_quantity,
                line.orl_unit_price,
                line.orl_discount,
                tax_rate
            )
            line.orl_vat_amount = vat_amount
            line.orl_line_total = line_total

        await self.db.flush()

        # Recalculate order totals
        await self._recalculate_order_totals(line.orl_ord_id)

        await self.db.refresh(line)
        return line

    async def delete_order_line(self, line_id: int) -> None:
        """Delete an order line."""
        stmt = select(ClientOrderLine).where(ClientOrderLine.orl_id == line_id)
        result = await self.db.execute(stmt)
        line = result.scalar_one_or_none()

        if not line:
            raise OrderLineNotFoundError(line_id)

        order_id = line.orl_ord_id

        # Get order to check status
        order = await self.get_order(order_id, include_lines=False)

        if order.ord_is_cancelled:
            raise OrderStatusError(
                "Cannot delete lines from a cancelled order",
                current_status="cancelled",
                target_status="line_deleted"
            )

        await self.db.delete(line)
        await self.db.flush()

        # Recalculate order totals
        await self._recalculate_order_totals(order_id)

    # ==========================================================================
    # Order Actions
    # ==========================================================================

    # Status name mapping for human-readable error messages
    STATUS_NAMES = {
        1: "Draft",
        2: "Pending",
        3: "Confirmed",
        4: "Processing",
        5: "Shipped",
        6: "Delivered",
        7: "Cancelled",
        8: "Refunded",
    }

    # Valid status transitions - defines the order status workflow
    ALLOWED_TRANSITIONS = {
        1: [2, 7],       # Draft -> Pending, Cancelled
        2: [3, 7],       # Pending -> Confirmed, Cancelled
        3: [4, 7],       # Confirmed -> Processing, Cancelled
        4: [5, 7],       # Processing -> Shipped, Cancelled
        5: [6, 8],       # Shipped -> Delivered, Refunded
        6: [8],          # Delivered -> Refunded
        7: [],           # Cancelled (terminal)
        8: [],           # Refunded (terminal)
    }

    def _get_status_name(self, status_id: int) -> str:
        """Get human-readable status name."""
        return self.STATUS_NAMES.get(status_id, f"Unknown({status_id})")

    def _get_allowed_transitions_names(self, current_status: int) -> str:
        """Get comma-separated list of allowed target status names."""
        allowed = self.ALLOWED_TRANSITIONS.get(current_status, [])
        if not allowed:
            return "none (terminal status)"
        return ", ".join(self._get_status_name(s) for s in allowed)

    def _validate_status_transition(self, current_status: int, target_status: int) -> None:
        """
        Validate that an order can move from current_status to target_status.

        Valid transitions:
        - Draft -> Pending, Cancelled
        - Pending -> Confirmed, Cancelled
        - Confirmed -> Processing, Cancelled
        - Processing -> Shipped, Cancelled
        - Shipped -> Delivered, Refunded
        - Delivered -> Refunded
        - Cancelled -> (terminal, no transitions)
        - Refunded -> (terminal, no transitions)

        Raises:
            OrderStatusError: If the transition is not allowed.
        """
        if current_status == target_status:
            return

        current_name = self._get_status_name(current_status)
        target_name = self._get_status_name(target_status)

        if current_status not in self.ALLOWED_TRANSITIONS:
            raise OrderStatusError(
                f"Unknown current status: {current_name}",
                current_status=current_name,
                target_status=target_name
            )

        allowed = self.ALLOWED_TRANSITIONS.get(current_status, [])

        if not allowed:
            raise OrderStatusError(
                f"Order is in terminal status '{current_name}' and cannot be changed",
                current_status=current_name,
                target_status=target_name
            )

        if target_status not in allowed:
            allowed_names = self._get_allowed_transitions_names(current_status)
            raise OrderStatusError(
                f"Cannot transition from '{current_name}' to '{target_name}'. "
                f"Allowed transitions from '{current_name}': {allowed_names}",
                current_status=current_name,
                target_status=target_name
            )

    async def update_status(
        self,
        order_id: int,
        new_status_id: int,
        notes: Optional[str] = None,
        changed_by: Optional[int] = None
    ) -> Tuple[ClientOrder, int]:
        """
        Update the status of an order with transition validation and history tracking.

        Args:
            order_id: The order ID to update.
            new_status_id: The new status ID to set.
            notes: Optional notes for the status change.
            changed_by: Optional user ID who made the change.

        Returns:
            Tuple of (updated order, old status ID).

        Raises:
            OrderNotFoundError: If order does not exist.
            OrderStatusError: If the status transition is not allowed.
        """
        order = await self.get_order(order_id, include_lines=False)
        old_status = order.ord_sta_id

        # Check if order is cancelled (terminal state)
        if order.ord_is_cancelled and new_status_id != self.STATUS_CANCELLED:
            raise OrderStatusError(
                "Cannot update a cancelled order. Cancelled is a terminal status.",
                current_status="Cancelled",
                target_status=self._get_status_name(new_status_id)
            )

        # Validate the status transition
        if new_status_id != old_status:
            self._validate_status_transition(old_status, new_status_id)

        now = datetime.now()

        # Handle cancellation
        if new_status_id == self.STATUS_CANCELLED:
            order.ord_is_cancelled = True
            order.ord_cancelled_at = now
            if notes:
                order.ord_cancel_reason = notes

        # Handle delivery date
        if new_status_id == self.STATUS_DELIVERED and not order.ord_delivery_date:
            order.ord_delivery_date = now

        # Update order status
        order.ord_sta_id = new_status_id
        order.ord_updated_at = now

        # Add to internal notes
        if notes:
            old_status_name = self._get_status_name(old_status)
            new_status_name = self._get_status_name(new_status_id)
            timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
            entry = f"[{timestamp}] Status: {old_status_name} -> {new_status_name}: {notes}"
            if order.ord_internal_notes:
                order.ord_internal_notes = f"{order.ord_internal_notes}\n{entry}"
            else:
                order.ord_internal_notes = entry

        # Note: Status history tracking is logged in internal_notes instead of a separate table

        await self.db.flush()
        await self.db.refresh(order)

        logger.info(
            f"Order {order_id} status updated: "
            f"{self._get_status_name(old_status)} -> {self._get_status_name(new_status_id)}"
        )

        return order, old_status

    async def confirm_order(self, order_id: int) -> ClientOrder:
        """Confirm a pending order."""
        order = await self.get_order(order_id, include_lines=False)

        if order.ord_sta_id != self.STATUS_PENDING:
            raise OrderStatusError(
                "Only pending orders can be confirmed",
                current_status=str(order.ord_sta_id),
                target_status="CONFIRMED"
            )

        order.ord_sta_id = self.STATUS_CONFIRMED
        order.ord_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def cancel_order(self, order_id: int, reason: Optional[str] = None) -> ClientOrder:
        """Cancel an order."""
        order = await self.get_order(order_id, include_lines=False)

        if order.ord_is_cancelled:
            raise OrderStatusError(
                "Order is already cancelled",
                current_status="cancelled",
                target_status="cancelled"
            )

        order.ord_sta_id = self.STATUS_CANCELLED
        order.ord_is_cancelled = True
        order.ord_cancelled_at = datetime.now()
        order.ord_cancel_reason = reason
        order.ord_updated_at = datetime.now()

        await self.db.flush()
        await self.db.refresh(order)
        return order

    # ==========================================================================
    # Shopify Sync Operations
    # ==========================================================================

    async def create_or_update_from_shopify(
        self,
        webhook_data: ShopifyOrderWebhook,
        default_client_id: int,
        default_currency_id: int = 1
    ) -> OrderSyncResult:
        """
        Create or update an order from Shopify webhook data.
        This is the main sync method used by the Celery task.
        """
        shopify_id = str(webhook_data.id)

        try:
            # Check if order already exists
            existing_order = await self.get_order_by_shopify_id(shopify_id)

            if existing_order:
                # Update existing order
                result = await self._update_order_from_shopify(existing_order, webhook_data)
                logger.info(f"Updated order {existing_order.ord_id} from Shopify order {shopify_id}")
                return OrderSyncResult(
                    success=True,
                    order_id=existing_order.ord_id,
                    shopify_id=shopify_id,
                    action="updated",
                    message=f"Order {existing_order.ord_reference} updated successfully"
                )
            else:
                # Create new order
                order = await self._create_order_from_shopify(
                    webhook_data,
                    default_client_id,
                    default_currency_id
                )
                logger.info(f"Created order {order.ord_id} from Shopify order {shopify_id}")
                return OrderSyncResult(
                    success=True,
                    order_id=order.ord_id,
                    shopify_id=shopify_id,
                    action="created",
                    message=f"Order {order.ord_reference} created successfully"
                )

        except Exception as e:
            logger.error(f"Error syncing Shopify order {shopify_id}: {str(e)}")
            return OrderSyncResult(
                success=False,
                order_id=None,
                shopify_id=shopify_id,
                action="error",
                error=str(e)
            )

    async def _create_order_from_shopify(
        self,
        webhook_data: ShopifyOrderWebhook,
        default_client_id: int,
        default_currency_id: int
    ) -> ClientOrder:
        """Create a new order from Shopify webhook data."""
        # Parse dates
        created_at = datetime.fromisoformat(webhook_data.created_at.replace("Z", "+00:00"))
        updated_at = datetime.fromisoformat(webhook_data.updated_at.replace("Z", "+00:00"))

        # Prepare address schemas
        shipping_address = None
        if webhook_data.shipping_address:
            addr = webhook_data.shipping_address
            shipping_address = AddressSchema(
                address=addr.address1,
                address2=addr.address2,
                city=addr.city,
                postal_code=addr.zip,
                country_code=addr.country_code
            )

        billing_address = None
        if webhook_data.billing_address:
            addr = webhook_data.billing_address
            billing_address = AddressSchema(
                address=addr.address1,
                address2=addr.address2,
                city=addr.city,
                postal_code=addr.zip,
                country_code=addr.country_code
            )

        # Prepare line items
        lines = []
        for item in webhook_data.line_items:
            # Calculate discount from discount_allocations
            total_discount = Decimal("0")
            for alloc in item.discount_allocations:
                total_discount += Decimal(str(alloc.get("amount", "0")))

            # Calculate tax rate
            tax_rate = Decimal("0")
            if item.tax_lines:
                for tax in item.tax_lines:
                    tax_rate += Decimal(str(tax.get("rate", "0"))) * 100

            lines.append(OrderLineCreate(
                orl_description=item.title,
                orl_quantity=Decimal(str(item.quantity)),
                orl_unit_price=Decimal(item.price),
                orl_discount=total_discount,
                orl_tax_rate=tax_rate,
                orl_taxable=item.taxable,
                orl_sku=item.sku,
                orl_variant_title=item.variant_title,
                orl_shopify_line_id=str(item.id),
                orl_shopify_variant_id=str(item.variant_id) if item.variant_id else None,
                orl_shopify_product_id=str(item.product_id) if item.product_id else None,
            ))

        # Get shipping amount
        shipping_amount = Decimal("0")
        if webhook_data.total_shipping_price_set:
            shop_money = webhook_data.total_shipping_price_set.get("shop_money", {})
            shipping_amount = Decimal(str(shop_money.get("amount", "0")))

        # Determine customer info
        customer_email = webhook_data.email
        customer_phone = webhook_data.phone
        customer_first_name = None
        customer_last_name = None
        if webhook_data.customer:
            customer_email = customer_email or webhook_data.customer.email
            customer_phone = customer_phone or webhook_data.customer.phone
            customer_first_name = webhook_data.customer.first_name
            customer_last_name = webhook_data.customer.last_name

        # Create order data
        order_data = OrderCreate(
            ord_cli_id=default_client_id,
            ord_date=created_at,
            ord_cur_id=default_currency_id,
            ord_shopify_id=str(webhook_data.id),
            ord_shopify_name=webhook_data.name,
            ord_shopify_created_at=created_at,
            ord_shopify_updated_at=updated_at,
            ord_fulfillment_status=webhook_data.fulfillment_status,
            ord_financial_status=webhook_data.financial_status,
            ord_sub_total=Decimal(webhook_data.subtotal_price),
            ord_total_vat=Decimal(webhook_data.total_tax),
            ord_total_amount=Decimal(webhook_data.total_price),
            ord_discount=Decimal(webhook_data.total_discounts),
            ord_shipping_amount=shipping_amount,
            ord_tax_amount=Decimal(webhook_data.total_tax),
            ord_customer_email=customer_email,
            ord_customer_phone=customer_phone,
            ord_customer_first_name=customer_first_name,
            ord_customer_last_name=customer_last_name,
            ord_notes=webhook_data.note,
            shipping_address=shipping_address,
            billing_address=billing_address,
            lines=lines,
        )

        order = await self.create_order(order_data)

        # Update sync status
        order.ord_synced_at = datetime.now()
        order.ord_sync_status = "synced"

        # Handle cancellation
        if webhook_data.cancelled_at:
            order.ord_is_cancelled = True
            order.ord_cancelled_at = datetime.fromisoformat(
                webhook_data.cancelled_at.replace("Z", "+00:00")
            )
            order.ord_cancel_reason = webhook_data.cancel_reason

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def _update_order_from_shopify(
        self,
        order: ClientOrder,
        webhook_data: ShopifyOrderWebhook
    ) -> ClientOrder:
        """Update an existing order from Shopify webhook data."""
        # Parse updated_at
        updated_at = datetime.fromisoformat(webhook_data.updated_at.replace("Z", "+00:00"))

        # Update fields
        order.ord_shopify_updated_at = updated_at
        order.ord_fulfillment_status = webhook_data.fulfillment_status
        order.ord_financial_status = webhook_data.financial_status
        order.ord_sub_total = Decimal(webhook_data.subtotal_price)
        order.ord_total_vat = Decimal(webhook_data.total_tax)
        order.ord_total_amount = Decimal(webhook_data.total_price)
        order.ord_discount = Decimal(webhook_data.total_discounts)
        order.ord_tax_amount = Decimal(webhook_data.total_tax)

        if webhook_data.note:
            order.ord_notes = webhook_data.note

        # Update shipping amount
        if webhook_data.total_shipping_price_set:
            shop_money = webhook_data.total_shipping_price_set.get("shop_money", {})
            order.ord_shipping_amount = Decimal(str(shop_money.get("amount", "0")))

        # Update addresses
        if webhook_data.shipping_address:
            addr = webhook_data.shipping_address
            order.ord_shipping_address = addr.address1
            order.ord_shipping_address2 = addr.address2
            order.ord_shipping_city = addr.city
            order.ord_shipping_postal_code = addr.zip
            order.ord_shipping_country_code = addr.country_code

        if webhook_data.billing_address:
            addr = webhook_data.billing_address
            order.ord_billing_address = addr.address1
            order.ord_billing_address2 = addr.address2
            order.ord_billing_city = addr.city
            order.ord_billing_postal_code = addr.zip
            order.ord_billing_country_code = addr.country_code

        # Handle cancellation
        if webhook_data.cancelled_at and not order.ord_is_cancelled:
            order.ord_is_cancelled = True
            order.ord_cancelled_at = datetime.fromisoformat(
                webhook_data.cancelled_at.replace("Z", "+00:00")
            )
            order.ord_cancel_reason = webhook_data.cancel_reason
            order.ord_sta_id = self.STATUS_CANCELLED

        # Update sync status
        order.ord_synced_at = datetime.now()
        order.ord_sync_status = "synced"
        order.ord_sync_error = None
        order.ord_updated_at = datetime.now()

        # Update line items - delete existing and recreate
        stmt = select(ClientOrderLine).where(ClientOrderLine.orl_ord_id == order.ord_id)
        result = await self.db.execute(stmt)
        existing_lines = result.scalars().all()
        for line in existing_lines:
            await self.db.delete(line)

        # Add updated lines
        for idx, item in enumerate(webhook_data.line_items, start=1):
            # Calculate discount from discount_allocations
            total_discount = Decimal("0")
            for alloc in item.discount_allocations:
                total_discount += Decimal(str(alloc.get("amount", "0")))

            # Calculate tax rate
            tax_rate = Decimal("0")
            if item.tax_lines:
                for tax in item.tax_lines:
                    tax_rate += Decimal(str(tax.get("rate", "0"))) * 100

            line_data = OrderLineCreate(
                orl_description=item.title,
                orl_quantity=Decimal(str(item.quantity)),
                orl_unit_price=Decimal(item.price),
                orl_discount=total_discount,
                orl_tax_rate=tax_rate,
                orl_taxable=item.taxable,
                orl_sku=item.sku,
                orl_variant_title=item.variant_title,
                orl_shopify_line_id=str(item.id),
                orl_shopify_variant_id=str(item.variant_id) if item.variant_id else None,
                orl_shopify_product_id=str(item.product_id) if item.product_id else None,
            )
            await self.add_order_line(order.ord_id, line_data, line_number=idx)

        await self.db.flush()
        await self.db.refresh(order)
        return order


def get_order_service(db: AsyncSession) -> OrderService:
    """Dependency to get OrderService instance."""
    return OrderService(db)

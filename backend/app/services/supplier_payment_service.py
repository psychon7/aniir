"""
Supplier Order Payment Service Module.

Provides functionality for:
- Listing payment records for a supplier order
- Creating payment records
- Updating payment records
- Deleting payment records
- Calculating total paid for an order

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.supplier_order_payment_record import SupplierOrderPaymentRecord
from app.models.supplier_order import SupplierOrder
from app.schemas.supplier_payment import SupplierPaymentCreate, SupplierPaymentUpdate
from loguru import logger


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SupplierPaymentServiceError(Exception):
    """Base exception for supplier payment service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SupplierPaymentNotFoundError(SupplierPaymentServiceError):
    """Raised when a supplier payment record is not found."""
    def __init__(self, spr_id: int):
        super().__init__(
            code="SUPPLIER_PAYMENT_NOT_FOUND",
            message=f"Supplier payment record with ID {spr_id} not found",
            details={"spr_id": spr_id}
        )


class SupplierOrderNotFoundError(SupplierPaymentServiceError):
    """Raised when the parent supplier order is not found."""
    def __init__(self, sod_id: int):
        super().__init__(
            code="SUPPLIER_ORDER_NOT_FOUND",
            message=f"Supplier order with ID {sod_id} not found",
            details={"sod_id": sod_id}
        )


class SupplierPaymentValidationError(SupplierPaymentServiceError):
    """Raised when payment data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="SUPPLIER_PAYMENT_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


# ==========================================================================
# Supplier Payment Service Class
# ==========================================================================

class SupplierPaymentService:
    """
    Service class for supplier order payment record operations.

    Handles CRUD and aggregation for payment records linked to supplier orders.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_get_order(self, sod_id: int) -> SupplierOrder:
        """Verify that a supplier order exists."""
        order = self.db.get(SupplierOrder, sod_id)
        if not order:
            raise SupplierOrderNotFoundError(sod_id)
        return order

    def _sync_list_payments(self, sod_id: int) -> List[SupplierOrderPaymentRecord]:
        """Synchronous list payment records for a supplier order."""
        self._sync_get_order(sod_id)

        query = (
            select(SupplierOrderPaymentRecord)
            .where(SupplierOrderPaymentRecord.sod_id == sod_id)
            .order_by(SupplierOrderPaymentRecord.spr_d_payment.desc())
        )
        result = self.db.execute(query)
        return list(result.scalars().all())

    def _sync_create_payment(
        self, sod_id: int, data: SupplierPaymentCreate
    ) -> SupplierOrderPaymentRecord:
        """Synchronous create payment record."""
        order = self._sync_get_order(sod_id)

        now = datetime.now()
        payment = SupplierOrderPaymentRecord(
            sod_id=sod_id,
            sol_id=data.sol_id,
            spr_amount=data.spr_amount,
            spr_d_payment=data.spr_d_payment or now,
            spr_d_creation=now,
            spr_comment=data.spr_comment,
            spr_payer=data.spr_payer,
            spr_payment_code=data.spr_payment_code,
            spr_file=data.spr_file,
            spr_guid=uuid4().hex,
        )

        self.db.add(payment)
        self.db.flush()

        # Update the order's paid amount and balance
        self._sync_update_order_paid_totals(order)

        self.db.commit()
        self.db.refresh(payment)

        logger.info(
            f"Created payment record {payment.spr_id} for supplier order {sod_id}, "
            f"amount={payment.spr_amount}"
        )
        return payment

    def _sync_update_payment(
        self, spr_id: int, data: SupplierPaymentUpdate
    ) -> SupplierOrderPaymentRecord:
        """Synchronous update payment record."""
        payment = self.db.get(SupplierOrderPaymentRecord, spr_id)
        if not payment:
            raise SupplierPaymentNotFoundError(spr_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(payment, field):
                setattr(payment, field, value)

        payment.spr_d_update = datetime.now()

        # If amount changed, recalculate order totals
        if "spr_amount" in update_data and payment.sod_id:
            order = self.db.get(SupplierOrder, payment.sod_id)
            if order:
                self._sync_update_order_paid_totals(order)

        self.db.commit()
        self.db.refresh(payment)

        logger.info(f"Updated payment record {spr_id}")
        return payment

    def _sync_delete_payment(self, spr_id: int) -> bool:
        """Synchronous delete payment record."""
        payment = self.db.get(SupplierOrderPaymentRecord, spr_id)
        if not payment:
            raise SupplierPaymentNotFoundError(spr_id)

        sod_id = payment.sod_id

        self.db.delete(payment)
        self.db.flush()

        # Update the order's paid amount and balance
        if sod_id:
            order = self.db.get(SupplierOrder, sod_id)
            if order:
                self._sync_update_order_paid_totals(order)

        self.db.commit()

        logger.info(f"Deleted payment record {spr_id} from supplier order {sod_id}")
        return True

    def _sync_get_total_paid(self, sod_id: int) -> Decimal:
        """Synchronous get total paid amount for a supplier order."""
        self._sync_get_order(sod_id)

        query = select(func.coalesce(func.sum(SupplierOrderPaymentRecord.spr_amount), 0)).where(
            SupplierOrderPaymentRecord.sod_id == sod_id
        )
        result = self.db.execute(query)
        total = result.scalar()
        return Decimal(str(total)) if total else Decimal("0")

    def _sync_update_order_paid_totals(self, order: SupplierOrder) -> None:
        """Recalculate and update the order's sod_paid and sod_need2pay fields."""
        total_paid = self._sync_get_total_paid(order.sod_id)
        order.sod_paid = total_paid
        total_ttc = order.sod_total_ttc or Decimal("0")
        order.sod_need2pay = total_ttc - total_paid
        order.sod_d_update = datetime.now()

        logger.debug(
            f"Updated order {order.sod_id} paid totals: paid={total_paid}, "
            f"need2pay={order.sod_need2pay}"
        )

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_payments(self, sod_id: int) -> List[SupplierOrderPaymentRecord]:
        """List payment records for a supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_payments, sod_id)

    async def create_payment(
        self, sod_id: int, data: SupplierPaymentCreate
    ) -> SupplierOrderPaymentRecord:
        """Create a payment record (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_payment, sod_id, data)

    async def update_payment(
        self, spr_id: int, data: SupplierPaymentUpdate
    ) -> SupplierOrderPaymentRecord:
        """Update a payment record (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_payment, spr_id, data)

    async def delete_payment(self, spr_id: int) -> bool:
        """Delete a payment record (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_payment, spr_id)

    async def get_total_paid(self, sod_id: int) -> Decimal:
        """Get total paid amount for a supplier order (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_total_paid, sod_id)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_supplier_payment_service(
    db: Session = Depends(get_db)
) -> SupplierPaymentService:
    """Dependency to get SupplierPaymentService instance."""
    return SupplierPaymentService(db)

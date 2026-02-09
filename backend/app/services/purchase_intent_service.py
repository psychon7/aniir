"""
Purchase Intent Service Module.

Provides functionality for:
- Purchase Intent CRUD operations
- Purchase Intent Line management
- Search and filtering
- Reference number generation

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from typing import List, Optional, Tuple
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload
from fastapi import Depends

from app.database import get_db
from app.models.purchase_intent import PurchaseIntent, PurchaseIntentLine
from app.models.supplier_order import SupplierOrder, SupplierOrderLine
from app.schemas.purchase_intent import (
    PurchaseIntentCreate, PurchaseIntentUpdate, PurchaseIntentSearchParams,
    PurchaseIntentLineCreate, PurchaseIntentLineUpdate
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class PurchaseIntentServiceError(Exception):
    """Base exception for purchase intent service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class PurchaseIntentNotFoundError(PurchaseIntentServiceError):
    """Raised when purchase intent is not found."""
    def __init__(self, purchase_intent_id: int):
        super().__init__(
            code="PURCHASE_INTENT_NOT_FOUND",
            message=f"Purchase Intent with ID {purchase_intent_id} not found",
            details={"purchase_intent_id": purchase_intent_id}
        )


class PurchaseIntentCodeNotFoundError(PurchaseIntentServiceError):
    """Raised when purchase intent code is not found."""
    def __init__(self, code: str):
        super().__init__(
            code="PURCHASE_INTENT_CODE_NOT_FOUND",
            message=f"Purchase Intent with code '{code}' not found",
            details={"code": code}
        )


class PurchaseIntentValidationError(PurchaseIntentServiceError):
    """Raised when purchase intent data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="PURCHASE_INTENT_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class PurchaseIntentLineNotFoundError(PurchaseIntentServiceError):
    """Raised when purchase intent line is not found."""
    def __init__(self, line_id: int):
        super().__init__(
            code="PURCHASE_INTENT_LINE_NOT_FOUND",
            message=f"Purchase Intent Line with ID {line_id} not found",
            details={"line_id": line_id}
        )


class PurchaseIntentClosedError(PurchaseIntentServiceError):
    """Raised when attempting to convert a closed purchase intent."""
    def __init__(self, purchase_intent_id: int):
        super().__init__(
            code="PURCHASE_INTENT_CLOSED",
            message=f"Purchase Intent with ID {purchase_intent_id} is already closed and cannot be converted",
            details={"purchase_intent_id": purchase_intent_id}
        )


# ==========================================================================
# Purchase Intent Service Class (pymssql + asyncio.to_thread)
# ==========================================================================

class PurchaseIntentService:
    """
    Service class for purchase intent operations.

    Handles CRUD operations, search, and line management for purchase intents.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        """
        Initialize the purchase intent service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_purchase_intents(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[PurchaseIntentSearchParams] = None
    ) -> Tuple[List[PurchaseIntent], int]:
        """Synchronous list purchase intents implementation."""
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        PurchaseIntent.pin_code.ilike(search_term),
                        PurchaseIntent.pin_name.ilike(search_term),
                    )
                )

            if search_params.society_id is not None:
                base_filters.append(PurchaseIntent.soc_id == search_params.society_id)

            if search_params.creator_id is not None:
                base_filters.append(PurchaseIntent.pin_creator_id == search_params.creator_id)

            if search_params.is_closed is not None:
                base_filters.append(PurchaseIntent.pin_closed == search_params.is_closed)

        # Get total count
        count_query = select(func.count(PurchaseIntent.pin_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get purchase intents
        query = (
            select(PurchaseIntent)
            .order_by(PurchaseIntent.pin_d_creation.desc())
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = self.db.execute(query)
        purchase_intents = list(result.scalars().all())

        return purchase_intents, total

    def _sync_get_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Synchronous get purchase intent by ID."""
        result = self.db.get(PurchaseIntent, purchase_intent_id)
        if not result:
            raise PurchaseIntentNotFoundError(purchase_intent_id)
        return result

    def _sync_get_purchase_intent_by_code(self, code: str) -> PurchaseIntent:
        """Synchronous get purchase intent by code."""
        query = select(PurchaseIntent).where(PurchaseIntent.pin_code == code)
        result = self.db.execute(query)
        purchase_intent = result.scalars().first()
        if not purchase_intent:
            raise PurchaseIntentCodeNotFoundError(code)
        return purchase_intent

    def _sync_create_purchase_intent(self, data: PurchaseIntentCreate, user_id: Optional[int] = None) -> PurchaseIntent:
        """Synchronous create purchase intent."""
        now = datetime.now()

        # Extract lines data before creating the main object
        lines_data = data.lines or []
        purchase_intent_data = data.model_dump(exclude_unset=True, exclude={'lines'})

        # Set creator if provided
        if user_id and not purchase_intent_data.get('pin_creator_id'):
            purchase_intent_data['pin_creator_id'] = user_id

        # Set timestamps
        purchase_intent_data['pin_d_creation'] = now
        purchase_intent_data['pin_d_update'] = now

        purchase_intent = PurchaseIntent(**purchase_intent_data)
        self.db.add(purchase_intent)
        self.db.flush()  # Get the ID without committing

        # Create lines
        for idx, line_data in enumerate(lines_data):
            line_dict = line_data.model_dump(exclude_unset=True)
            if 'pil_order' not in line_dict or line_dict['pil_order'] is None:
                line_dict['pil_order'] = idx + 1
            line = PurchaseIntentLine(pin_id=purchase_intent.pin_id, **line_dict)
            self.db.add(line)

        self.db.commit()
        self.db.refresh(purchase_intent)
        return purchase_intent

    def _sync_update_purchase_intent(self, purchase_intent_id: int, data: PurchaseIntentUpdate, user_id: Optional[int] = None) -> PurchaseIntent:
        """Synchronous update purchase intent."""
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)

        update_data = data.model_dump(exclude_unset=True)
        update_data['pin_d_update'] = datetime.now()

        for field, value in update_data.items():
            setattr(purchase_intent, field, value)

        self.db.commit()
        self.db.refresh(purchase_intent)
        return purchase_intent

    def _sync_delete_purchase_intent(self, purchase_intent_id: int) -> bool:
        """Synchronous soft delete purchase intent (set closed = True)."""
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)
        purchase_intent.pin_closed = True
        purchase_intent.pin_d_update = datetime.now()
        self.db.commit()
        return True

    def _sync_permanent_delete_purchase_intent(self, purchase_intent_id: int) -> bool:
        """Synchronous hard delete purchase intent."""
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)
        self.db.delete(purchase_intent)
        self.db.commit()
        return True

    def _sync_close_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Synchronous close purchase intent."""
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)
        purchase_intent.pin_closed = True
        purchase_intent.pin_d_update = datetime.now()
        self.db.commit()
        self.db.refresh(purchase_intent)
        return purchase_intent

    def _sync_reopen_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Synchronous reopen purchase intent."""
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)
        purchase_intent.pin_closed = False
        purchase_intent.pin_d_update = datetime.now()
        self.db.commit()
        self.db.refresh(purchase_intent)
        return purchase_intent

    # ==========================================================================
    # Line Methods (Sync)
    # ==========================================================================

    def _sync_list_lines(self, purchase_intent_id: int) -> List[PurchaseIntentLine]:
        """Synchronous list purchase intent lines."""
        # Verify purchase intent exists
        self._sync_get_purchase_intent(purchase_intent_id)

        query = (
            select(PurchaseIntentLine)
            .where(PurchaseIntentLine.pin_id == purchase_intent_id)
            .order_by(PurchaseIntentLine.pil_order)
        )
        result = self.db.execute(query)
        return list(result.scalars().all())

    def _sync_get_line(self, purchase_intent_id: int, line_id: int) -> PurchaseIntentLine:
        """Synchronous get purchase intent line."""
        # Verify purchase intent exists
        self._sync_get_purchase_intent(purchase_intent_id)

        line = self.db.get(PurchaseIntentLine, line_id)
        if not line or line.pin_id != purchase_intent_id:
            raise PurchaseIntentLineNotFoundError(line_id)
        return line

    def _sync_add_line(self, purchase_intent_id: int, data: PurchaseIntentLineCreate) -> PurchaseIntentLine:
        """Synchronous add line to purchase intent."""
        # Verify purchase intent exists
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)

        line_data = data.model_dump(exclude_unset=True)
        line_data['pin_id'] = purchase_intent_id

        # Auto-set order if not provided
        if 'pil_order' not in line_data or line_data['pil_order'] is None:
            # Get max order
            max_order_query = (
                select(func.max(PurchaseIntentLine.pil_order))
                .where(PurchaseIntentLine.pin_id == purchase_intent_id)
            )
            max_order = self.db.execute(max_order_query).scalar() or 0
            line_data['pil_order'] = max_order + 1

        line = PurchaseIntentLine(**line_data)
        self.db.add(line)

        # Update purchase intent timestamp
        purchase_intent.pin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)
        return line

    def _sync_update_line(self, purchase_intent_id: int, line_id: int, data: PurchaseIntentLineUpdate) -> PurchaseIntentLine:
        """Synchronous update purchase intent line."""
        line = self._sync_get_line(purchase_intent_id, line_id)
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(line, field, value)

        # Update purchase intent timestamp
        purchase_intent.pin_d_update = datetime.now()

        self.db.commit()
        self.db.refresh(line)
        return line

    def _sync_delete_line(self, purchase_intent_id: int, line_id: int) -> bool:
        """Synchronous delete purchase intent line."""
        line = self._sync_get_line(purchase_intent_id, line_id)
        purchase_intent = self._sync_get_purchase_intent(purchase_intent_id)

        self.db.delete(line)

        # Update purchase intent timestamp
        purchase_intent.pin_d_update = datetime.now()

        self.db.commit()
        return True

    # ==========================================================================
    # Conversion Methods (Sync)
    # ==========================================================================

    def _generate_supplier_order_code(self) -> str:
        """Generate unique supplier order code (same pattern as SupplierOrderService)."""
        year = datetime.now().year
        month = datetime.now().month
        prefix = f"SOD-{year}{month:02d}-"

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

    def _sync_convert_to_supplier_order(
        self,
        purchase_intent_id: int,
        supplier_id: int,
        currency_id: int,
        vat_id: int,
        user_id: int,
    ) -> SupplierOrder:
        """
        Synchronous conversion of a PurchaseIntent to a SupplierOrder.

        Loads the PurchaseIntent with lines, validates it is not closed,
        creates a new SupplierOrder with copied lines, generates a reference
        code, marks the PurchaseIntent as closed, and returns the new order.
        """
        # 1. Load PurchaseIntent with lines
        query = (
            select(PurchaseIntent)
            .options(selectinload(PurchaseIntent.lines))
            .where(PurchaseIntent.pin_id == purchase_intent_id)
        )
        result = self.db.execute(query)
        purchase_intent = result.scalars().first()

        if not purchase_intent:
            raise PurchaseIntentNotFoundError(purchase_intent_id)

        # 2. Validate not closed
        if purchase_intent.pin_closed:
            raise PurchaseIntentClosedError(purchase_intent_id)

        # 3. Generate order code and create SupplierOrder
        now = datetime.now()
        order_code = self._generate_supplier_order_code()

        supplier_order = SupplierOrder(
            sod_code=order_code,
            sod_name=purchase_intent.pin_name,
            sup_id=supplier_id,
            soc_id=purchase_intent.soc_id,
            usr_creator_id=user_id,
            pin_id=purchase_intent_id,
            cur_id=currency_id,
            vat_id=vat_id,
            sod_inter_comment=purchase_intent.pin_inter_comment,
            sod_supplier_comment=purchase_intent.pin_supplier_comment,
            sod_d_creation=now,
            sod_d_update=now,
            sod_discount_amount=Decimal("0"),
            sod_total_ht=Decimal("0"),
            sod_total_ttc=Decimal("0"),
            sod_need2pay=Decimal("0"),
            sod_paid=Decimal("0"),
            sod_started=False,
            sod_canceled=False,
        )

        self.db.add(supplier_order)
        self.db.flush()  # Get the sod_id

        # 4. Copy PurchaseIntentLines -> SupplierOrderLines
        for pi_line in purchase_intent.lines:
            sol = SupplierOrderLine(
                sod_id=supplier_order.sod_id,
                prd_id=pi_line.prd_id,
                pit_id=pi_line.pit_id,
                pil_id=pi_line.pil_id,
                sol_order=pi_line.pil_order,
                sol_quantity=pi_line.pil_quantity,
                sol_description=pi_line.pil_description,
                sol_unit_price=Decimal("0"),
                sol_discount_amount=Decimal("0"),
                sol_total_crude_price=Decimal("0"),
                sol_price_with_dis=Decimal("0"),
                sol_total_price=Decimal("0"),
                vat_id=vat_id,
            )
            self.db.add(sol)

        # 5. Mark PurchaseIntent as closed
        purchase_intent.pin_closed = True
        purchase_intent.pin_d_update = now

        self.db.commit()
        self.db.refresh(supplier_order)
        return supplier_order

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_purchase_intents(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[PurchaseIntentSearchParams] = None
    ) -> Tuple[List[PurchaseIntent], int]:
        """List purchase intents with pagination and filtering (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_purchase_intents, skip, limit, search_params)

    async def get_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Get purchase intent by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_purchase_intent, purchase_intent_id)

    async def get_purchase_intent_by_code(self, code: str) -> PurchaseIntent:
        """Get purchase intent by code (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_purchase_intent_by_code, code)

    async def create_purchase_intent(self, data: PurchaseIntentCreate, user_id: Optional[int] = None) -> PurchaseIntent:
        """Create a new purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_purchase_intent, data, user_id)

    async def update_purchase_intent(self, purchase_intent_id: int, data: PurchaseIntentUpdate, user_id: Optional[int] = None) -> PurchaseIntent:
        """Update a purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_purchase_intent, purchase_intent_id, data, user_id)

    async def delete_purchase_intent(self, purchase_intent_id: int) -> bool:
        """Soft delete a purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_purchase_intent, purchase_intent_id)

    async def permanent_delete_purchase_intent(self, purchase_intent_id: int) -> bool:
        """Hard delete a purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_permanent_delete_purchase_intent, purchase_intent_id)

    async def close_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Close a purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_close_purchase_intent, purchase_intent_id)

    async def reopen_purchase_intent(self, purchase_intent_id: int) -> PurchaseIntent:
        """Reopen a purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_reopen_purchase_intent, purchase_intent_id)

    # Conversion async wrapper
    async def convert_to_supplier_order(
        self,
        purchase_intent_id: int,
        supplier_id: int,
        currency_id: int,
        vat_id: int,
        user_id: int,
    ) -> SupplierOrder:
        """Convert a purchase intent to a supplier order (async wrapper)."""
        return await asyncio.to_thread(
            self._sync_convert_to_supplier_order,
            purchase_intent_id,
            supplier_id,
            currency_id,
            vat_id,
            user_id,
        )

    # Line async wrappers
    async def list_lines(self, purchase_intent_id: int) -> List[PurchaseIntentLine]:
        """List purchase intent lines (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_lines, purchase_intent_id)

    async def get_line(self, purchase_intent_id: int, line_id: int) -> PurchaseIntentLine:
        """Get purchase intent line (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_line, purchase_intent_id, line_id)

    async def add_line(self, purchase_intent_id: int, data: PurchaseIntentLineCreate) -> PurchaseIntentLine:
        """Add line to purchase intent (async wrapper)."""
        return await asyncio.to_thread(self._sync_add_line, purchase_intent_id, data)

    async def update_line(self, purchase_intent_id: int, line_id: int, data: PurchaseIntentLineUpdate) -> PurchaseIntentLine:
        """Update purchase intent line (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_line, purchase_intent_id, line_id, data)

    async def delete_line(self, purchase_intent_id: int, line_id: int) -> bool:
        """Delete purchase intent line (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_line, purchase_intent_id, line_id)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_purchase_intent_service(
    db: Session = Depends(get_db)
) -> PurchaseIntentService:
    """
    Dependency to get PurchaseIntentService instance.
    """
    return PurchaseIntentService(db)

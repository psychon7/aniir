"""
Supplier Service Module.

Provides functionality for:
- Supplier CRUD operations
- Supplier search and filtering
- Reference number generation
- CSV export
- Supplier contact management

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import csv
import io
import asyncio
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.supplier import Supplier
from app.models.supplier_contact import SupplierContact
from app.models.society import Society
from app.models.currency import Currency
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierSearchParams,
    SupplierContactCreate, SupplierContactUpdate,
    SupplierDetailResponse
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SupplierServiceError(Exception):
    """Base exception for supplier service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SupplierNotFoundError(SupplierServiceError):
    """Raised when supplier is not found."""
    def __init__(self, supplier_id: int):
        super().__init__(
            code="SUPPLIER_NOT_FOUND",
            message=f"Supplier with ID {supplier_id} not found",
            details={"supplier_id": supplier_id}
        )


class SupplierReferenceNotFoundError(SupplierServiceError):
    """Raised when supplier reference is not found."""
    def __init__(self, reference: str):
        super().__init__(
            code="SUPPLIER_REFERENCE_NOT_FOUND",
            message=f"Supplier with reference '{reference}' not found",
            details={"reference": reference}
        )


class SupplierValidationError(SupplierServiceError):
    """Raised when supplier data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="SUPPLIER_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class DuplicateSupplierError(SupplierServiceError):
    """Raised when supplier already exists."""
    def __init__(self, field: str, value: str):
        super().__init__(
            code="DUPLICATE_SUPPLIER",
            message=f"Supplier with {field} '{value}' already exists",
            details={"field": field, "value": value}
        )


class SupplierContactNotFoundError(SupplierServiceError):
    """Raised when supplier contact is not found."""
    def __init__(self, contact_id: int):
        super().__init__(
            code="SUPPLIER_CONTACT_NOT_FOUND",
            message=f"Supplier contact with ID {contact_id} not found",
            details={"contact_id": contact_id}
        )


# ==========================================================================
# Supplier Service Class (pymssql + asyncio.to_thread)
# ==========================================================================

class SupplierService:
    """
    Service class for supplier operations.

    Handles CRUD operations, search, and reference generation for suppliers.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        """
        Initialize the supplier service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_suppliers(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierSearchParams] = None
    ) -> Tuple[List[Supplier], int]:
        """Synchronous list suppliers implementation."""
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        Supplier.sup_company_name.ilike(search_term),
                        Supplier.sup_ref.ilike(search_term),
                        Supplier.sup_email.ilike(search_term),
                    )
                )

            if search_params.is_active is not None:
                base_filters.append(Supplier.sup_isactive == search_params.is_active)

            if search_params.society_id is not None:
                base_filters.append(Supplier.soc_id == search_params.society_id)

            if search_params.supplier_type_id is not None:
                base_filters.append(Supplier.sty_id == search_params.supplier_type_id)

            if search_params.currency_id is not None:
                base_filters.append(Supplier.cur_id == search_params.currency_id)

        # Get total count
        count_query = select(func.count(Supplier.sup_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get suppliers
        query = (
            select(Supplier)
            .order_by(Supplier.sup_company_name)
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = self.db.execute(query)
        suppliers = list(result.scalars().all())

        return suppliers, total

    def _sync_get_supplier(self, supplier_id: int) -> Supplier:
        """Synchronous get supplier by ID."""
        result = self.db.get(Supplier, supplier_id)
        if not result:
            raise SupplierNotFoundError(supplier_id)
        return result

    def _sync_get_supplier_detail(self, supplier_id: int) -> dict:
        """
        Synchronous get supplier by ID with resolved lookup names.
        Returns a dict suitable for SupplierDetailResponse.
        """
        supplier = self.db.get(Supplier, supplier_id)
        if not supplier:
            raise SupplierNotFoundError(supplier_id)

        # Build base response from supplier ORM object
        response_data = SupplierDetailResponse.model_validate(supplier).model_dump()

        # Resolve lookup names
        # Society
        if supplier.soc_id:
            society = self.db.get(Society, supplier.soc_id)
            if society:
                response_data["societyName"] = society.soc_society_name

        # Currency
        if supplier.cur_id:
            currency = self.db.get(Currency, supplier.cur_id)
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # Payment Mode
        if supplier.pmo_id:
            payment_mode = self.db.get(PaymentMode, supplier.pmo_id)
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Payment Condition (Term)
        if supplier.pco_id:
            payment_term = self.db.get(PaymentTerm, supplier.pco_id)
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation

        return response_data

    def _sync_get_supplier_by_email(self, email: str) -> Optional[Supplier]:
        """Synchronous get supplier by email."""
        query = select(Supplier).where(Supplier.sup_email == email)
        result = self.db.execute(query)
        return result.scalars().first()

    def _sync_get_supplier_by_reference(self, reference: str) -> Supplier:
        """Synchronous get supplier by reference."""
        query = select(Supplier).where(Supplier.sup_ref == reference)
        result = self.db.execute(query)
        supplier = result.scalars().first()
        if not supplier:
            raise SupplierReferenceNotFoundError(reference)
        return supplier

    def _sync_create_supplier(self, data: SupplierCreate, user_id: Optional[int] = None) -> Supplier:
        """Synchronous create supplier."""
        if hasattr(data, 'sup_email') and data.sup_email:
            existing = self._sync_get_supplier_by_email(data.sup_email)
            if existing:
                raise DuplicateSupplierError("email", data.sup_email)

        supplier_data = data.model_dump(exclude_unset=True)
        supplier = Supplier(**supplier_data)

        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def _sync_update_supplier(self, supplier_id: int, data: SupplierUpdate, user_id: Optional[int] = None) -> Supplier:
        """Synchronous update supplier."""
        supplier = self._sync_get_supplier(supplier_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)

        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def _sync_delete_supplier(self, supplier_id: int) -> bool:
        """Synchronous soft delete supplier."""
        supplier = self._sync_get_supplier(supplier_id)
        supplier.sup_isactive = False
        self.db.commit()
        return True

    def _sync_permanent_delete_supplier(self, supplier_id: int) -> bool:
        """Synchronous hard delete supplier."""
        supplier = self._sync_get_supplier(supplier_id)
        self.db.delete(supplier)
        self.db.commit()
        return True

    def _sync_activate_supplier(self, supplier_id: int) -> Supplier:
        """Synchronous activate supplier."""
        supplier = self._sync_get_supplier(supplier_id)
        supplier.sup_isactive = True
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def _sync_deactivate_supplier(self, supplier_id: int) -> Supplier:
        """Synchronous deactivate supplier."""
        supplier = self._sync_get_supplier(supplier_id)
        supplier.sup_isactive = False
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    # ==========================================================================
    # Contact Methods (Sync)
    # ==========================================================================

    def _sync_list_contacts(self, supplier_id: int) -> List[SupplierContact]:
        """Synchronous list supplier contacts."""
        # Verify supplier exists
        self._sync_get_supplier(supplier_id)
        
        query = select(SupplierContact).where(SupplierContact.sup_id == supplier_id)
        result = self.db.execute(query)
        return list(result.scalars().all())

    def _sync_get_contact(self, supplier_id: int, contact_id: int) -> SupplierContact:
        """Synchronous get supplier contact."""
        # Verify supplier exists
        self._sync_get_supplier(supplier_id)
        
        contact = self.db.get(SupplierContact, contact_id)
        if not contact or contact.sup_id != supplier_id:
            raise SupplierContactNotFoundError(contact_id)
        return contact

    def _sync_create_contact(self, supplier_id: int, data: SupplierContactCreate) -> SupplierContact:
        """Synchronous create supplier contact."""
        # Verify supplier exists
        self._sync_get_supplier(supplier_id)
        
        contact_data = data.model_dump(exclude_unset=True)
        contact_data['sup_id'] = supplier_id
        contact = SupplierContact(**contact_data)
        
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def _sync_update_contact(self, supplier_id: int, contact_id: int, data: SupplierContactUpdate) -> SupplierContact:
        """Synchronous update supplier contact."""
        contact = self._sync_get_contact(supplier_id, contact_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def _sync_delete_contact(self, supplier_id: int, contact_id: int) -> bool:
        """Synchronous delete supplier contact."""
        contact = self._sync_get_contact(supplier_id, contact_id)
        self.db.delete(contact)
        self.db.commit()
        return True

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_suppliers(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierSearchParams] = None
    ) -> Tuple[List[Supplier], int]:
        """List suppliers with pagination and filtering (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_suppliers, skip, limit, search_params)

    async def get_supplier(self, supplier_id: int) -> Supplier:
        """Get supplier by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_supplier, supplier_id)

    async def get_supplier_detail(self, supplier_id: int) -> dict:
        """Get supplier by ID with resolved lookup names (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_supplier_detail, supplier_id)

    async def get_supplier_by_email(self, email: str) -> Optional[Supplier]:
        """Get supplier by email (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_supplier_by_email, email)

    async def get_supplier_by_reference(self, reference: str) -> Supplier:
        """Get supplier by reference (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_supplier_by_reference, reference)

    async def create_supplier(self, data: SupplierCreate, user_id: Optional[int] = None) -> Supplier:
        """Create a new supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_supplier, data, user_id)

    async def update_supplier(self, supplier_id: int, data: SupplierUpdate, user_id: Optional[int] = None) -> Supplier:
        """Update a supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_supplier, supplier_id, data, user_id)

    async def delete_supplier(self, supplier_id: int) -> bool:
        """Soft delete a supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_supplier, supplier_id)

    async def permanent_delete_supplier(self, supplier_id: int) -> bool:
        """Hard delete a supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_permanent_delete_supplier, supplier_id)

    async def activate_supplier(self, supplier_id: int) -> Supplier:
        """Activate a supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_activate_supplier, supplier_id)

    async def deactivate_supplier(self, supplier_id: int) -> Supplier:
        """Deactivate a supplier (async wrapper)."""
        return await asyncio.to_thread(self._sync_deactivate_supplier, supplier_id)

    # Contact async wrappers
    async def list_contacts(self, supplier_id: int) -> List[SupplierContact]:
        """List supplier contacts (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_contacts, supplier_id)

    async def get_contact(self, supplier_id: int, contact_id: int) -> SupplierContact:
        """Get supplier contact (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_contact, supplier_id, contact_id)

    async def create_contact(self, supplier_id: int, data: SupplierContactCreate) -> SupplierContact:
        """Create supplier contact (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_contact, supplier_id, data)

    async def update_contact(self, supplier_id: int, contact_id: int, data: SupplierContactUpdate) -> SupplierContact:
        """Update supplier contact (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_contact, supplier_id, contact_id, data)

    async def delete_contact(self, supplier_id: int, contact_id: int) -> bool:
        """Delete supplier contact (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_contact, supplier_id, contact_id)

    async def export_suppliers_csv(
        self,
        search_params: Optional[SupplierSearchParams] = None
    ) -> Tuple[str, int]:
        """Export suppliers to CSV format."""
        suppliers, total = await self.list_suppliers(skip=0, limit=10000, search_params=search_params)

        fieldnames = [
            'sup_id', 'sup_ref', 'sup_company_name', 'sup_email',
            'sup_tel1', 'sup_address1', 'sup_city', 'sup_isactive',
        ]

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=fieldnames,
            delimiter=',',
            quoting=csv.QUOTE_MINIMAL,
            extrasaction='ignore'
        )

        writer.writeheader()

        for supplier in suppliers:
            row = {
                'sup_id': supplier.sup_id,
                'sup_ref': supplier.sup_ref or '',
                'sup_company_name': supplier.sup_company_name or '',
                'sup_email': supplier.sup_email or '',
                'sup_tel1': supplier.sup_tel1 or '',
                'sup_address1': supplier.sup_address1 or '',
                'sup_city': supplier.sup_city or '',
                'sup_isactive': 'true' if supplier.sup_isactive else 'false',
            }
            writer.writerow(row)

        return output.getvalue(), len(suppliers)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_supplier_service(
    db: Session = Depends(get_db)
) -> SupplierService:
    """
    Dependency to get SupplierService instance.
    """
    return SupplierService(db)

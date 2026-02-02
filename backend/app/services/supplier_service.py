"""
Supplier Service Module.

Provides functionality for:
- Supplier CRUD operations
- Supplier search and filtering
- Reference number generation
- CSV export
- Supplier contact management
"""
import csv
import io
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
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
# Supplier Service Class
# ==========================================================================

class SupplierService:
    """
    Service class for supplier operations.

    Handles CRUD operations, search, and reference generation for suppliers.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the supplier service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Reference Generation
    # ==========================================================================

    async def generate_reference(self) -> str:
        """
        Generate a unique supplier reference number.

        Format: SUP-YYYYMMDD-XXXX where XXXX is a sequential number.

        Returns:
            Generated unique reference string.
        """
        today = datetime.now().strftime("%Y%m%d")
        prefix = f"SUP-{today}-"

        # Find the highest existing reference for today
        query = (
            select(Supplier.sup_ref)
            .where(Supplier.sup_ref.like(f"{prefix}%"))
            .order_by(Supplier.sup_ref.desc())
            .limit(1)
        )
        result = await self.db.execute(query)
        last_ref = result.scalar()

        if last_ref:
            # Extract the sequence number and increment
            try:
                seq = int(last_ref.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1

        return f"{prefix}{seq:04d}"

    # ==========================================================================
    # Supplier CRUD Operations
    # ==========================================================================

    async def create_supplier(self, data: SupplierCreate) -> Supplier:
        """
        Create a new supplier.

        Args:
            data: Supplier creation data.

        Returns:
            Created Supplier object.

        Raises:
            DuplicateSupplierError: If a supplier with the same email already exists.
        """
        # Check for duplicate email if provided
        if data.sup_email:
            existing = await self._get_supplier_by_email(data.sup_email)
            if existing:
                raise DuplicateSupplierError("email", data.sup_email)

        # Generate reference
        reference = await self.generate_reference()

        # Create supplier
        supplier_data = data.model_dump()
        supplier = Supplier(
            sup_ref=reference,
            **supplier_data
        )

        self.db.add(supplier)
        await self.db.flush()
        await self.db.refresh(supplier)
        return supplier

    async def get_supplier(self, supplier_id: int) -> Supplier:
        """
        Get supplier by ID.

        Args:
            supplier_id: The supplier ID.

        Returns:
            Supplier object.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        result = await self.db.get(Supplier, supplier_id)
        if not result:
            raise SupplierNotFoundError(supplier_id)
        return result

    async def get_supplier_by_reference(self, reference: str) -> Supplier:
        """
        Get supplier by reference.

        Args:
            reference: The supplier reference string.

        Returns:
            Supplier object.

        Raises:
            SupplierReferenceNotFoundError: If supplier not found.
        """
        query = select(Supplier).where(Supplier.sup_ref == reference)
        result = await self.db.execute(query)
        supplier = result.scalars().first()
        if not supplier:
            raise SupplierReferenceNotFoundError(reference)
        return supplier

    async def get_supplier_detail(self, supplier_id: int) -> dict:
        """
        Get supplier by ID with resolved lookup names.

        Args:
            supplier_id: The supplier ID.

        Returns:
            Dict suitable for SupplierDetailResponse with enriched lookup names.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        supplier = await self.db.get(Supplier, supplier_id)
        if not supplier:
            raise SupplierNotFoundError(supplier_id)

        # Build base response from supplier ORM object
        # Use model_validate with from_attributes to map ORM fields
        response_data = SupplierDetailResponse.model_validate(supplier).model_dump()

        # Resolve lookup names
        # Society
        if supplier.soc_id:
            society = await self.db.get(Society, supplier.soc_id)
            if society:
                response_data["societyName"] = society.soc_society_name

        # Supplier Type - query the table directly since no model exists
        if supplier.sty_id:
            try:
                result = await self.db.execute(
                    text("SELECT sty_designation FROM TR_STY_Supplier_Type WHERE sty_id = :sty_id"),
                    {"sty_id": supplier.sty_id}
                )
                row = result.fetchone()
                if row:
                    response_data["supplierTypeName"] = row[0]
            except Exception:
                # If table doesn't exist or query fails, leave as None
                pass

        # Currency
        if supplier.cur_id:
            currency = await self.db.get(Currency, supplier.cur_id)
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # Payment Mode
        if supplier.pmo_id:
            payment_mode = await self.db.get(PaymentMode, supplier.pmo_id)
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Payment Condition (Term)
        if supplier.pco_id:
            payment_term = await self.db.get(PaymentTerm, supplier.pco_id)
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        return response_data

    async def list_suppliers(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[SupplierSearchParams] = None
    ) -> Tuple[List[Supplier], int]:
        """
        List suppliers with pagination and filtering.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            search_params: Optional search/filter parameters.

        Returns:
            Tuple of (suppliers list, total count).
        """
        # Build base query with filters
        base_filters = []

        if search_params:
            # Text search across multiple fields
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        Supplier.sup_company_name.ilike(search_term),
                        Supplier.sup_ref.ilike(search_term),
                        Supplier.sup_email.ilike(search_term),
                        Supplier.sup_siren.ilike(search_term),
                        Supplier.sup_siret.ilike(search_term)
                    )
                )

            # Exact match filters
            if search_params.society_id is not None:
                base_filters.append(Supplier.soc_id == search_params.society_id)

            if search_params.supplier_type_id is not None:
                base_filters.append(Supplier.sty_id == search_params.supplier_type_id)

            if search_params.payment_condition_id is not None:
                base_filters.append(Supplier.pco_id == search_params.payment_condition_id)

            if search_params.payment_mode_id is not None:
                base_filters.append(Supplier.pmo_id == search_params.payment_mode_id)

            if search_params.currency_id is not None:
                base_filters.append(Supplier.cur_id == search_params.currency_id)

            if search_params.is_active is not None:
                base_filters.append(Supplier.sup_isactive == search_params.is_active)

            if search_params.is_blocked is not None:
                base_filters.append(Supplier.sup_isblocked == search_params.is_blocked)

            if search_params.country:
                base_filters.append(Supplier.sup_country.ilike(f"%{search_params.country}%"))

            if search_params.city:
                base_filters.append(Supplier.sup_city.ilike(f"%{search_params.city}%"))

        # Get total count
        count_query = select(func.count(Supplier.sup_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = await self.db.execute(count_query)
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

        result = await self.db.execute(query)
        suppliers = list(result.scalars().all())

        return suppliers, total

    async def update_supplier(
        self,
        supplier_id: int,
        data: SupplierUpdate
    ) -> Supplier:
        """
        Update a supplier.

        Args:
            supplier_id: The supplier ID.
            data: Update data.

        Returns:
            Updated Supplier object.

        Raises:
            SupplierNotFoundError: If supplier not found.
            DuplicateSupplierError: If new email already exists for another supplier.
        """
        supplier = await self.get_supplier(supplier_id)

        # Check for duplicate email if changing
        update_data = data.model_dump(exclude_unset=True)
        if "sup_email" in update_data and update_data["sup_email"]:
            existing = await self._get_supplier_by_email(update_data["sup_email"])
            if existing and existing.sup_id != supplier_id:
                raise DuplicateSupplierError("email", update_data["sup_email"])

        # Update fields
        for field, value in update_data.items():
            setattr(supplier, field, value)

        await self.db.flush()
        await self.db.refresh(supplier)
        return supplier

    async def delete_supplier(self, supplier_id: int) -> bool:
        """
        Soft delete a supplier (sets is_active to False).

        Args:
            supplier_id: The supplier ID.

        Returns:
            True if deleted successfully.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        supplier = await self.get_supplier(supplier_id)
        supplier.sup_isactive = False
        await self.db.flush()
        return True

    async def hard_delete_supplier(self, supplier_id: int) -> bool:
        """
        Permanently delete a supplier.

        Args:
            supplier_id: The supplier ID.

        Returns:
            True if deleted successfully.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        supplier = await self.get_supplier(supplier_id)

        await self.db.delete(supplier)
        await self.db.flush()
        return True

    async def activate_supplier(self, supplier_id: int) -> Supplier:
        """
        Activate a supplier.

        Args:
            supplier_id: The supplier ID.

        Returns:
            Updated Supplier object.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        supplier = await self.get_supplier(supplier_id)
        supplier.sup_isactive = True
        await self.db.flush()
        await self.db.refresh(supplier)
        return supplier

    async def deactivate_supplier(self, supplier_id: int) -> Supplier:
        """
        Deactivate a supplier.

        Args:
            supplier_id: The supplier ID.

        Returns:
            Updated Supplier object.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        supplier = await self.get_supplier(supplier_id)
        supplier.sup_isactive = False
        await self.db.flush()
        await self.db.refresh(supplier)
        return supplier

    # ==========================================================================
    # Supplier Contact Operations
    # ==========================================================================

    async def create_contact(self, data: SupplierContactCreate) -> SupplierContact:
        """
        Create a new supplier contact.

        Args:
            data: Contact creation data.

        Returns:
            Created SupplierContact object.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        # Verify supplier exists
        await self.get_supplier(data.sco_sup_id)

        # Create contact
        contact = SupplierContact(**data.model_dump())
        self.db.add(contact)
        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def get_contact(self, contact_id: int) -> SupplierContact:
        """
        Get supplier contact by ID.

        Args:
            contact_id: The contact ID.

        Returns:
            SupplierContact object.

        Raises:
            SupplierContactNotFoundError: If contact not found.
        """
        result = await self.db.get(SupplierContact, contact_id)
        if not result:
            raise SupplierContactNotFoundError(contact_id)
        return result

    async def list_contacts(
        self,
        supplier_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[SupplierContact], int]:
        """
        List contacts for a supplier.

        Args:
            supplier_id: The supplier ID.
            skip: Number of records to skip.
            limit: Maximum number of records to return.

        Returns:
            Tuple of (contacts list, total count).

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        # Verify supplier exists
        await self.get_supplier(supplier_id)

        # Get total count
        count_query = (
            select(func.count(SupplierContact.sco_id))
            .where(SupplierContact.sco_sup_id == supplier_id)
        )
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get contacts
        query = (
            select(SupplierContact)
            .where(SupplierContact.sco_sup_id == supplier_id)
            .order_by(SupplierContact.sco_is_primary.desc(), SupplierContact.sco_last_name)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        contacts = list(result.scalars().all())

        return contacts, total

    async def update_contact(
        self,
        contact_id: int,
        data: SupplierContactUpdate
    ) -> SupplierContact:
        """
        Update a supplier contact.

        Args:
            contact_id: The contact ID.
            data: Update data.

        Returns:
            Updated SupplierContact object.

        Raises:
            SupplierContactNotFoundError: If contact not found.
        """
        contact = await self.get_contact(contact_id)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)

        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def delete_contact(self, contact_id: int) -> bool:
        """
        Delete a supplier contact.

        Args:
            contact_id: The contact ID.

        Returns:
            True if deleted successfully.

        Raises:
            SupplierContactNotFoundError: If contact not found.
        """
        contact = await self.get_contact(contact_id)
        await self.db.delete(contact)
        await self.db.flush()
        return True

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    async def _get_supplier_by_email(self, email: str) -> Optional[Supplier]:
        """
        Get supplier by email (internal helper).

        Args:
            email: Supplier email address.

        Returns:
            Supplier object or None.
        """
        query = select(Supplier).where(Supplier.sup_email == email)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_supplier_with_contacts(self, supplier_id: int) -> Supplier:
        """
        Get supplier with contacts loaded.

        Args:
            supplier_id: The supplier ID.

        Returns:
            Supplier object with contacts loaded.

        Raises:
            SupplierNotFoundError: If supplier not found.
        """
        query = (
            select(Supplier)
            .options(selectinload(Supplier.contacts))
            .where(Supplier.sup_id == supplier_id)
        )
        result = await self.db.execute(query)
        supplier = result.scalars().first()
        if not supplier:
            raise SupplierNotFoundError(supplier_id)
        return supplier

    # ==========================================================================
    # Export Methods
    # ==========================================================================

    async def export_suppliers_csv(
        self,
        search_params: Optional[SupplierSearchParams] = None
    ) -> Tuple[str, int]:
        """
        Export suppliers to CSV format.

        Args:
            search_params: Optional search/filter parameters.

        Returns:
            Tuple of (CSV content string, supplier count).
        """
        # Get all suppliers matching the filters (no pagination for export)
        suppliers, total = await self.list_suppliers(
            skip=0,
            limit=10000,  # Reasonable limit for export
            search_params=search_params
        )

        # Define CSV columns
        fieldnames = [
            'sup_id',
            'sup_ref',
            'sup_company_name',
            'sup_email',
            'sup_tel1',
            'sup_tel2',
            'sup_cellphone',
            'sup_fax',
            'sup_address1',
            'sup_address2',
            'sup_postcode',
            'sup_city',
            'sup_country',
            'sup_siren',
            'sup_siret',
            'sup_vat_intra',
            'soc_id',
            'vat_id',
            'pco_id',
            'pmo_id',
            'cur_id',
            'sty_id',
            'sup_free_of_harbor',
            'sup_recieve_newsletter',
            'sup_newsletter_email',
            'sup_comment_for_supplier',
            'sup_comment_for_interne',
            'sup_isactive',
            'sup_isblocked',
            'sup_d_creation',
            'sup_d_update',
        ]

        # Generate CSV content
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=fieldnames,
            delimiter=',',
            quoting=csv.QUOTE_MINIMAL,
            extrasaction='ignore'
        )

        # Write header
        writer.writeheader()

        # Write data rows
        for supplier in suppliers:
            row = {
                'sup_id': supplier.sup_id,
                'sup_ref': supplier.sup_ref or '',
                'sup_company_name': supplier.sup_company_name or '',
                'sup_email': supplier.sup_email or '',
                'sup_tel1': supplier.sup_tel1 or '',
                'sup_tel2': supplier.sup_tel2 or '',
                'sup_cellphone': supplier.sup_cellphone or '',
                'sup_fax': supplier.sup_fax or '',
                'sup_address1': supplier.sup_address1 or '',
                'sup_address2': supplier.sup_address2 or '',
                'sup_postcode': supplier.sup_postcode or '',
                'sup_city': supplier.sup_city or '',
                'sup_country': supplier.sup_country or '',
                'sup_siren': supplier.sup_siren or '',
                'sup_siret': supplier.sup_siret or '',
                'sup_vat_intra': supplier.sup_vat_intra or '',
                'soc_id': supplier.soc_id,
                'vat_id': supplier.vat_id,
                'pco_id': supplier.pco_id,
                'pmo_id': supplier.pmo_id,
                'cur_id': supplier.cur_id,
                'sty_id': supplier.sty_id if supplier.sty_id else '',
                'sup_free_of_harbor': supplier.sup_free_of_harbor if supplier.sup_free_of_harbor else '',
                'sup_recieve_newsletter': 'true' if supplier.sup_recieve_newsletter else 'false',
                'sup_newsletter_email': supplier.sup_newsletter_email or '',
                'sup_comment_for_supplier': supplier.sup_comment_for_supplier or '',
                'sup_comment_for_interne': supplier.sup_comment_for_interne or '',
                'sup_isactive': 'true' if supplier.sup_isactive else 'false',
                'sup_isblocked': 'true' if supplier.sup_isblocked else 'false',
                'sup_d_creation': supplier.sup_d_creation.isoformat() if supplier.sup_d_creation else '',
                'sup_d_update': supplier.sup_d_update.isoformat() if supplier.sup_d_update else '',
            }
            writer.writerow(row)

        return output.getvalue(), len(suppliers)


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_supplier_service(
    db: AsyncSession = Depends(get_db)
) -> SupplierService:
    """
    Dependency to get SupplierService instance.

    Args:
        db: Database session from dependency.

    Returns:
        SupplierService instance.
    """
    return SupplierService(db)

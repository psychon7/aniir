"""
Lookup Service Module.

Provides unified access to all reference/lookup data for dropdowns,
selections, and initial data loading. This service aggregates data
from multiple reference tables into a consistent format for frontend use.

NOTE: Uses synchronous database operations with asyncio.to_thread wrapper
to maintain async interface while using pymssql (synchronous driver).

NOTE: UnitOfMeasure table does not exist in database - returns empty list.
"""
import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.currency import Currency
from app.models.status import Status
from app.models.category import Category
from app.models.client_type import ClientType
# NOTE: UnitOfMeasure model is disabled - table TR_UOM_UnitOfMeasure does not exist
# from app.models.unit_of_measure import UnitOfMeasure
from app.models.vat_rate import VatRate
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.models.warehouse import Warehouse


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class LookupServiceError(Exception):
    """Base exception for lookup service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class LookupNotFoundError(LookupServiceError):
    """Raised when a lookup type is not found or invalid."""
    def __init__(self, lookup_type: str):
        super().__init__(
            code="LOOKUP_TYPE_NOT_FOUND",
            message=f"Lookup type '{lookup_type}' is not valid or not found",
            details={"lookup_type": lookup_type}
        )


# ==========================================================================
# Lookup Service Class
# ==========================================================================

class LookupService:
    """
    Service class for unified lookup operations.

    Provides access to all reference tables used for dropdowns
    and selections across the ERP system.

    Uses sync DB operations internally, wrapped with asyncio.to_thread
    for async interface compatibility with FastAPI.
    """

    def __init__(self, db: Session):
        """
        Initialize the lookup service.

        Args:
            db: Database session for operations (synchronous Session).
        """
        self.db = db

    # ==========================================================================
    # Currency Lookups
    # ==========================================================================

    def _sync_get_currencies(
        self,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Currency]:
        """Synchronous implementation of get_currencies."""
        query = select(Currency).order_by(Currency.cur_designation).limit(limit)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Currency.cur_designation.ilike(search_term)) |
                (Currency.cur_symbol.ilike(search_term))
            )

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_currencies(
        self,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Currency]:
        """
        Get currencies for lookup.

        Args:
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of Currency objects.
        """
        return await asyncio.to_thread(self._sync_get_currencies, search, limit)

    # ==========================================================================
    # Status Lookups
    # ==========================================================================

    def _sync_get_statuses(
        self,
        entity_type: Optional[str] = None,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Status]:
        """Synchronous implementation of get_statuses."""
        # Use actual DB column names (stt_*), not property aliases (sta_*)
        query = select(Status).order_by(Status.stt_order, Status.stt_value).limit(limit)

        filters = []
        if entity_type:
            filters.append(
                (Status.stt_tab_name == entity_type) |
                (Status.stt_tab_name.is_(None))
            )
        if active_only:
            filters.append(Status.stt_actived == True)
        if search:
            search_term = f"%{search}%"
            filters.append(
                (Status.stt_value.ilike(search_term)) |
                (Status.stt_description.ilike(search_term))
            )

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_statuses(
        self,
        entity_type: Optional[str] = None,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Status]:
        """
        Get statuses for lookup.

        Args:
            entity_type: Optional entity type filter (e.g., 'Client', 'Order').
            active_only: If True, only return active statuses.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of Status objects.
        """
        return await asyncio.to_thread(
            self._sync_get_statuses, entity_type, active_only, search, limit
        )

    # ==========================================================================
    # Category Lookups
    # ==========================================================================

    def _sync_get_categories(
        self,
        parent_id: Optional[int] = None,
        root_only: bool = False,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Category]:
        """Synchronous implementation of get_categories."""
        # Use actual DB column names
        query = select(Category).order_by(Category.cat_name).limit(limit)

        filters = []
        if root_only:
            filters.append(Category.cat_parent_cat_id.is_(None))
        elif parent_id is not None:
            filters.append(Category.cat_parent_cat_id == parent_id)
        if active_only:
            filters.append(Category.cat_is_actived == True)
        if search:
            search_term = f"%{search}%"
            # cat_code doesn't exist, search by name only
            filters.append(Category.cat_name.ilike(search_term))

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_categories(
        self,
        parent_id: Optional[int] = None,
        root_only: bool = False,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Category]:
        """
        Get categories for lookup.

        Args:
            parent_id: Optional parent ID to get children of a specific category.
            root_only: If True, only return root/top-level categories.
            active_only: If True, only return active categories.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of Category objects.
        """
        return await asyncio.to_thread(
            self._sync_get_categories, parent_id, root_only, active_only, search, limit
        )

    def _sync_get_category_tree(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """Synchronous implementation of get_category_tree."""
        query = select(Category).order_by(Category.cat_name)
        if active_only:
            query = query.where(Category.cat_is_actived == True)

        result = self.db.execute(query)
        categories = list(result.scalars().all())

        # Build tree structure - use actual column names
        category_map = {}
        for cat in categories:
            category_map[cat.cat_id] = {
                "id": cat.cat_id,
                "code": str(cat.cat_id),  # No code column, use ID
                "name": cat.cat_name,
                "display_name": cat.cat_name,
                "parent_id": cat.cat_parent_cat_id,
                "is_active": cat.cat_is_actived,
                "children": []
            }

        roots = []
        for cat_id, cat_data in category_map.items():
            parent_id = cat_data["parent_id"]
            if parent_id is None:
                roots.append(cat_data)
            elif parent_id in category_map:
                category_map[parent_id]["children"].append(cat_data)

        return roots

    async def get_category_tree(
        self,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get categories as a hierarchical tree structure.

        Args:
            active_only: If True, only return active categories.

        Returns:
            List of category dicts with nested children.
        """
        return await asyncio.to_thread(self._sync_get_category_tree, active_only)

    # ==========================================================================
    # Client Type Lookups
    # ==========================================================================

    def _sync_get_client_types(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[ClientType]:
        """Synchronous implementation of get_client_types."""
        # Use actual DB column names (cty_*, not ct_*)
        # Note: ClientType has no is_active column, so active_only is ignored
        query = select(ClientType).order_by(ClientType.cty_description).limit(limit)

        filters = []
        # ClientType has no active flag column
        if search:
            search_term = f"%{search}%"
            filters.append(ClientType.cty_description.ilike(search_term))

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_client_types(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[ClientType]:
        """
        Get client types for lookup.

        Args:
            active_only: If True, only return active client types.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of ClientType objects.
        """
        return await asyncio.to_thread(
            self._sync_get_client_types, active_only, search, limit
        )

    # ==========================================================================
    # Unit of Measure Lookups - DISABLED
    # ==========================================================================

    async def get_units_of_measure(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List:
        """
        Get units of measure for lookup.

        NOTE: Table TR_UOM_UnitOfMeasure does NOT exist in the database.
        This method returns an empty list.

        To enable: Create the database table and restore the UnitOfMeasure model.

        Args:
            active_only: If True, only return active UOMs.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            Empty list (table does not exist).
        """
        # Table TR_UOM_UnitOfMeasure does not exist in database
        return []

    # ==========================================================================
    # VAT Rate Lookups
    # ==========================================================================

    def _sync_get_vat_rates(
        self,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[VatRate]:
        """Synchronous implementation of get_vat_rates."""
        query = select(VatRate).order_by(VatRate.vat_vat_rate).limit(limit)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                (VatRate.vat_designation.ilike(search_term)) |
                (VatRate.vat_description.ilike(search_term))
            )

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_vat_rates(
        self,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[VatRate]:
        """
        Get VAT rates for lookup.

        Args:
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of VatRate objects.
        """
        return await asyncio.to_thread(self._sync_get_vat_rates, search, limit)

    # ==========================================================================
    # Payment Mode Lookups
    # ==========================================================================

    def _sync_get_payment_modes(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[PaymentMode]:
        """Synchronous implementation of get_payment_modes."""
        query = select(PaymentMode).order_by(PaymentMode.pmo_designation).limit(limit)

        filters = []
        if active_only:
            filters.append(PaymentMode.pmo_isactive == True)
        if search:
            search_term = f"%{search}%"
            filters.append(PaymentMode.pmo_designation.ilike(search_term))

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_payment_modes(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[PaymentMode]:
        """
        Get payment modes for lookup.

        Args:
            active_only: If True, only return active payment modes.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of PaymentMode objects.
        """
        return await asyncio.to_thread(
            self._sync_get_payment_modes, active_only, search, limit
        )

    # ==========================================================================
    # Payment Term Lookups
    # ==========================================================================

    def _sync_get_payment_terms(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[PaymentTerm]:
        """Synchronous implementation of get_payment_terms."""
        # Use actual DB column names (pco_*, not payt_*)
        query = select(PaymentTerm).order_by(PaymentTerm.pco_designation).limit(limit)

        filters = []
        if active_only:
            filters.append(PaymentTerm.pco_active == True)
        if search:
            search_term = f"%{search}%"
            filters.append(PaymentTerm.pco_designation.ilike(search_term))

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_payment_terms(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[PaymentTerm]:
        """
        Get payment terms for lookup.

        Args:
            active_only: If True, only return active payment terms.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of PaymentTerm objects.
        """
        return await asyncio.to_thread(
            self._sync_get_payment_terms, active_only, search, limit
        )

    # ==========================================================================
    # Warehouse Lookups
    # ==========================================================================

    def _sync_get_warehouses(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Warehouse]:
        """Synchronous implementation of get_warehouses."""
        query = select(Warehouse).order_by(Warehouse.whs_name).limit(limit)

        filters = []
        # Note: Using whs_* columns as that's what exists in the model
        if search:
            search_term = f"%{search}%"
            filters.append(
                (Warehouse.whs_code.ilike(search_term)) |
                (Warehouse.whs_name.ilike(search_term))
            )

        if filters:
            query = query.where(*filters)

        result = self.db.execute(query)
        return list(result.scalars().all())

    async def get_warehouses(
        self,
        active_only: bool = True,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Warehouse]:
        """
        Get warehouses for lookup.

        Args:
            active_only: If True, only return active warehouses.
            search: Optional search term for filtering.
            limit: Maximum number of records to return.

        Returns:
            List of Warehouse objects.
        """
        return await asyncio.to_thread(
            self._sync_get_warehouses, active_only, search, limit
        )

    # ==========================================================================
    # Aggregated Lookups
    # ==========================================================================

    async def get_all_lookups(
        self,
        active_only: bool = True
    ) -> Dict[str, Any]:
        """
        Get all lookup data in a single call.

        This is useful for initial application loading to minimize
        the number of API calls required.

        Args:
            active_only: If True, only return active items.

        Returns:
            Dictionary containing all lookup data.
        """
        return {
            "currencies": await self.get_currencies(),
            "statuses": await self.get_statuses(active_only=active_only),
            "categories": await self.get_categories(active_only=active_only),
            "client_types": await self.get_client_types(active_only=active_only),
            "units_of_measure": await self.get_units_of_measure(active_only=active_only),
            "vat_rates": await self.get_vat_rates(),
            "payment_modes": await self.get_payment_modes(active_only=active_only),
            "payment_terms": await self.get_payment_terms(active_only=active_only),
            "warehouses": await self.get_warehouses(active_only=active_only),
        }


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_lookup_service(
    db: Session = Depends(get_db)
) -> LookupService:
    """
    Dependency to get LookupService instance.

    Args:
        db: Database session from dependency (synchronous Session).

    Returns:
        LookupService instance.
    """
    return LookupService(db)

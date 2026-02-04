"""
Consignee Service Module.

Provides functionality for:
- Consignee CRUD operations
- Consignee search and filtering
- Reference code generation (legacy-compatible)
"""
import asyncio
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.core.config import settings
from app.models.consignee import Consignee
from app.schemas.consignee import ConsigneeCreate, ConsigneeUpdate, ConsigneeSearchParams


# =============================================================================
# Custom Exceptions
# =============================================================================

class ConsigneeServiceError(Exception):
    """Base exception for consignee service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ConsigneeNotFoundError(ConsigneeServiceError):
    """Raised when consignee is not found."""
    def __init__(self, consignee_id: int):
        super().__init__(
            code="CONSIGNEE_NOT_FOUND",
            message=f"Consignee with ID {consignee_id} not found",
            details={"con_id": consignee_id}
        )


class ConsigneeValidationError(ConsigneeServiceError):
    """Raised when consignee data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="CONSIGNEE_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


# =============================================================================
# Consignee Service Class (pymssql + asyncio.to_thread)
# =============================================================================

class ConsigneeService:
    """
    Service class for consignee operations.

    Handles CRUD operations, search, and reference generation.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        self.db = db

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------

    def _get_code_type(self) -> int:
        try:
            return int(getattr(settings, "CODE_TYPE", 2))
        except Exception:
            return 2

    def _get_prefix(self, code_type: int) -> str:
        # Legacy: codeType 16 uses CS for code_type 4/5, DS otherwise
        if code_type in (4, 5):
            return "CS"
        return "DS"

    def _build_reference(self, date_value: datetime, prefix: str, last_ref: Optional[str], code_type: int) -> str:
        yy = date_value.strftime("%y")
        mm = date_value.strftime("%m")
        dd = date_value.strftime("%d")

        # Default to legacy type2 (prefix + YYMM + 4 digits).
        if code_type in (4, 5):
            base = f"{prefix}{yy}{mm}{dd}"
        else:
            base = f"{prefix}{yy}{mm}"

        seq = 1
        if last_ref and last_ref.startswith(base):
            try:
                seq = int(last_ref[len(base):]) + 1
            except Exception:
                seq = 1

        return f"{base}{seq:04d}"

    def _sync_get_last_reference(self, soc_id: Optional[int], date_value: datetime) -> Optional[str]:
        query = select(Consignee.con_code)
        filters = []
        if soc_id is not None:
            filters.append(Consignee.soc_id == soc_id)
        filters.append(func.year(Consignee.con_d_creation) == date_value.year)
        filters.append(func.month(Consignee.con_d_creation) == date_value.month)

        if filters:
            query = query.where(and_(*filters))
        query = query.order_by(Consignee.con_code.desc()).limit(1)

        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def _sync_generate_consignee_code(self, soc_id: Optional[int], date_value: datetime) -> str:
        code_type = self._get_code_type()
        prefix = self._get_prefix(code_type)
        last_ref = self._sync_get_last_reference(soc_id, date_value)
        return self._build_reference(date_value, prefix, last_ref, code_type)

    def _resolve_address_title(self, is_delivery: bool, is_invoicing: bool) -> str:
        if is_delivery and is_invoicing:
            return "Adresse Fac & Liv"
        if is_delivery and not is_invoicing:
            return "Adresse Livraison"
        if not is_delivery and is_invoicing:
            return "Adresse Facturation"
        return "Adresse Fac & Liv"

    # ---------------------------------------------------------------------
    # Sync methods (internal)
    # ---------------------------------------------------------------------

    def _sync_list_consignees(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[ConsigneeSearchParams] = None
    ) -> Tuple[List[Consignee], int]:
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        Consignee.con_firstname.ilike(search_term),
                        Consignee.con_lastname.ilike(search_term),
                        Consignee.con_adresse_title.ilike(search_term),
                        Consignee.con_comment.ilike(search_term),
                        Consignee.con_email.ilike(search_term),
                        Consignee.con_postcode.ilike(search_term),
                        Consignee.con_city.ilike(search_term),
                        Consignee.con_tel1.ilike(search_term),
                        Consignee.con_tel2.ilike(search_term),
                        Consignee.con_cellphone.ilike(search_term),
                        Consignee.con_address1.ilike(search_term),
                        Consignee.con_address2.ilike(search_term),
                        Consignee.con_address3.ilike(search_term),
                        Consignee.con_company_name.ilike(search_term),
                    )
                )

            if search_params.soc_id is not None:
                base_filters.append(Consignee.soc_id == search_params.soc_id)
            if search_params.con_firstname:
                term = f"%{search_params.con_firstname}%"
                base_filters.append(
                    or_(
                        Consignee.con_firstname.ilike(term),
                        Consignee.con_lastname.ilike(term),
                        Consignee.con_adresse_title.ilike(term),
                    )
                )
            if search_params.con_comment:
                base_filters.append(Consignee.con_comment.ilike(f"%{search_params.con_comment}%"))
            if search_params.con_email:
                base_filters.append(Consignee.con_email.ilike(f"%{search_params.con_email}%"))
            if search_params.con_postcode:
                base_filters.append(Consignee.con_postcode.ilike(f"%{search_params.con_postcode}%"))
            if search_params.con_city:
                base_filters.append(Consignee.con_city.ilike(f"%{search_params.con_city}%"))
            if search_params.con_address:
                term = f"%{search_params.con_address}%"
                base_filters.append(
                    or_(
                        Consignee.con_address1.ilike(term),
                        Consignee.con_address2.ilike(term),
                        Consignee.con_address3.ilike(term),
                    )
                )
            if search_params.con_company_name:
                base_filters.append(Consignee.con_company_name.ilike(f"%{search_params.con_company_name}%"))
            if search_params.con_tel:
                term = f"%{search_params.con_tel}%"
                base_filters.append(
                    or_(
                        Consignee.con_tel1.ilike(term),
                        Consignee.con_tel2.ilike(term),
                        Consignee.con_cellphone.ilike(term),
                    )
                )
            if search_params.con_is_delivery_adr is not None:
                base_filters.append(Consignee.con_is_delivery_adr == search_params.con_is_delivery_adr)
            if search_params.con_is_invoicing_adr is not None:
                base_filters.append(Consignee.con_is_invoicing_adr == search_params.con_is_invoicing_adr)

        count_query = select(func.count(Consignee.con_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        query = select(Consignee)
        if base_filters:
            query = query.where(*base_filters)

        sort_by = (search_params.sort_by if search_params else None) or "con_firstname"
        sort_order = (search_params.sort_order if search_params else None) or "asc"
        sort_map = {
            "con_firstname": Consignee.con_firstname,
            "con_lastname": Consignee.con_lastname,
            "con_city": Consignee.con_city,
            "con_postcode": Consignee.con_postcode,
            "con_code": Consignee.con_code,
            "con_id": Consignee.con_id,
        }
        sort_col = sort_map.get(sort_by, Consignee.con_firstname)
        if sort_order == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        query = query.offset(skip).limit(limit)
        result = self.db.execute(query)
        consignees = list(result.scalars().all())

        return consignees, total

    def _sync_get_consignee(self, consignee_id: int) -> Consignee:
        consignee = self.db.get(Consignee, consignee_id)
        if not consignee:
            raise ConsigneeNotFoundError(consignee_id)
        return consignee

    def _sync_create_consignee(self, data: ConsigneeCreate, user_id: Optional[int] = None) -> Consignee:
        payload = data.model_dump(exclude_unset=True)
        now = datetime.utcnow()

        if not payload.get("civ_id"):
            payload["civ_id"] = 1

        is_delivery = bool(payload.get("con_is_delivery_adr"))
        is_invoicing = bool(payload.get("con_is_invoicing_adr"))
        if not is_delivery and not is_invoicing:
            is_delivery = True
            is_invoicing = True
        payload["con_is_delivery_adr"] = is_delivery
        payload["con_is_invoicing_adr"] = is_invoicing

        if not payload.get("con_adresse_title"):
            payload["con_adresse_title"] = self._resolve_address_title(is_delivery, is_invoicing)

        payload.setdefault("con_d_creation", now)
        payload["con_d_update"] = now

        if not payload.get("usr_created_by"):
            payload["usr_created_by"] = user_id or 1
        if not payload.get("soc_id"):
            payload["soc_id"] = 1

        if not payload.get("con_code"):
            payload["con_code"] = self._sync_generate_consignee_code(payload.get("soc_id"), now)

        consignee = Consignee(**payload)
        self.db.add(consignee)
        self.db.commit()
        self.db.refresh(consignee)
        return consignee

    def _sync_update_consignee(self, consignee_id: int, data: ConsigneeUpdate, user_id: Optional[int] = None) -> Consignee:
        consignee = self._sync_get_consignee(consignee_id)
        update_data = data.model_dump(exclude_unset=True)

        if "con_is_delivery_adr" in update_data or "con_is_invoicing_adr" in update_data:
            is_delivery = update_data.get("con_is_delivery_adr", consignee.con_is_delivery_adr)
            is_invoicing = update_data.get("con_is_invoicing_adr", consignee.con_is_invoicing_adr)
            if not is_delivery and not is_invoicing:
                is_delivery = True
                is_invoicing = True
            update_data["con_is_delivery_adr"] = is_delivery
            update_data["con_is_invoicing_adr"] = is_invoicing
            if not update_data.get("con_adresse_title"):
                update_data["con_adresse_title"] = self._resolve_address_title(is_delivery, is_invoicing)

        for field, value in update_data.items():
            setattr(consignee, field, value)

        consignee.con_d_update = datetime.utcnow()
        self.db.commit()
        self.db.refresh(consignee)
        return consignee

    def _sync_delete_consignee(self, consignee_id: int) -> bool:
        consignee = self._sync_get_consignee(consignee_id)
        self.db.delete(consignee)
        self.db.commit()
        return True

    # ---------------------------------------------------------------------
    # Async wrappers
    # ---------------------------------------------------------------------

    async def list_consignees(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[ConsigneeSearchParams] = None
    ) -> Tuple[List[Consignee], int]:
        return await asyncio.to_thread(self._sync_list_consignees, skip, limit, search_params)

    async def get_consignee(self, consignee_id: int) -> Consignee:
        return await asyncio.to_thread(self._sync_get_consignee, consignee_id)

    async def create_consignee(self, data: ConsigneeCreate, user_id: Optional[int] = None) -> Consignee:
        return await asyncio.to_thread(self._sync_create_consignee, data, user_id)

    async def update_consignee(self, consignee_id: int, data: ConsigneeUpdate, user_id: Optional[int] = None) -> Consignee:
        return await asyncio.to_thread(self._sync_update_consignee, consignee_id, data, user_id)

    async def delete_consignee(self, consignee_id: int) -> bool:
        return await asyncio.to_thread(self._sync_delete_consignee, consignee_id)


# =============================================================================
# Dependency
# =============================================================================

def get_consignee_service(db: Session = Depends(get_db)) -> ConsigneeService:
    """Dependency to get ConsigneeService."""
    return ConsigneeService(db)

"""
Society Service Module.

Provides functionality for:
- Society (enterprise) CRUD operations
- Default society retrieval

Uses asyncio.to_thread() to wrap synchronous pymssql operations
for compatibility with FastAPI's async endpoints.
"""
import asyncio
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.society import Society
from app.schemas.society import SocietyUpdate


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class SocietyServiceError(Exception):
    """Base exception for society service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class SocietyNotFoundError(SocietyServiceError):
    """Raised when society is not found."""
    def __init__(self, society_id: int):
        super().__init__(
            code="SOCIETY_NOT_FOUND",
            message=f"Society with ID {society_id} not found",
            details={"society_id": society_id}
        )


# ==========================================================================
# Society Service Class (pymssql + asyncio.to_thread)
# ==========================================================================

class SocietyService:
    """
    Service class for society operations.

    Handles CRUD operations for company/legal entity settings.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        """
        Initialize the society service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_get_society(self, soc_id: int) -> Society:
        """Synchronous get society by ID."""
        result = self.db.get(Society, soc_id)
        if not result:
            raise SocietyNotFoundError(soc_id)
        return result

    def _sync_get_all_societies(self) -> List[Society]:
        """Synchronous get all societies."""
        query = select(Society).order_by(Society.soc_society_name)
        result = self.db.execute(query)
        return list(result.scalars().all())

    def _sync_get_default_society(self) -> Optional[Society]:
        """Synchronous get the first active society (default)."""
        query = (
            select(Society)
            .where(Society.soc_is_actived == True)
            .order_by(Society.soc_id)
            .limit(1)
        )
        result = self.db.execute(query)
        return result.scalars().first()

    def _sync_update_society(self, soc_id: int, data: SocietyUpdate) -> Society:
        """Synchronous update society."""
        society = self._sync_get_society(soc_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(society, field, value)

        self.db.commit()
        self.db.refresh(society)
        return society

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def get_society(self, soc_id: int) -> Society:
        """Get society by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_society, soc_id)

    async def get_all_societies(self) -> List[Society]:
        """Get all societies (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_all_societies)

    async def get_default_society(self) -> Optional[Society]:
        """Get the first active society as default (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_default_society)

    async def update_society(self, soc_id: int, data: SocietyUpdate) -> Society:
        """Update a society (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_society, soc_id, data)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_society_service(
    db: Session = Depends(get_db)
) -> SocietyService:
    """
    Dependency to get SocietyService instance.
    """
    return SocietyService(db)

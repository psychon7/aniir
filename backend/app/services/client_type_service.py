"""
ClientType Service Module.

Provides functionality for:
- ClientType CRUD operations
- Client type lookup and listing
"""
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.database import get_db
from app.models.client_type import ClientType
from app.schemas.client_type import (
    ClientTypeCreate, ClientTypeUpdate
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class ClientTypeServiceError(Exception):
    """Base exception for client type service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ClientTypeNotFoundError(ClientTypeServiceError):
    """Raised when client type is not found."""
    def __init__(self, client_type_id: int):
        super().__init__(
            code="CLIENT_TYPE_NOT_FOUND",
            message=f"Client type with ID {client_type_id} not found",
            details={"client_type_id": client_type_id}
        )


class ClientTypeValidationError(ClientTypeServiceError):
    """Raised when client type data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="CLIENT_TYPE_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class DuplicateClientTypeError(ClientTypeServiceError):
    """Raised when client type description already exists."""
    def __init__(self, description: str):
        super().__init__(
            code="DUPLICATE_CLIENT_TYPE",
            message=f"Client type with description '{description}' already exists",
            details={"description": description}
        )


# ==========================================================================
# ClientType Service Class
# ==========================================================================

class ClientTypeService:
    """
    Service class for client type operations.

    Handles CRUD operations for client types.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the client type service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # ClientType CRUD Operations
    # ==========================================================================

    async def create_client_type(self, data: ClientTypeCreate) -> ClientType:
        """
        Create a new client type.

        Args:
            data: Client type creation data.

        Returns:
            Created ClientType object.

        Raises:
            DuplicateClientTypeError: If client type description already exists.
        """
        # Check for duplicate description
        existing = await self._get_client_type_by_description(data.ct_description)
        if existing:
            raise DuplicateClientTypeError(data.ct_description)

        client_type = ClientType(**data.model_dump())
        self.db.add(client_type)
        await self.db.flush()
        await self.db.refresh(client_type)
        return client_type

    async def get_client_type(self, client_type_id: int) -> ClientType:
        """
        Get client type by ID.

        Args:
            client_type_id: The client type ID.

        Returns:
            ClientType object.

        Raises:
            ClientTypeNotFoundError: If client type not found.
        """
        result = await self.db.get(ClientType, client_type_id)
        if not result:
            raise ClientTypeNotFoundError(client_type_id)
        return result

    async def get_client_type_by_description(self, description: str) -> Optional[ClientType]:
        """
        Get client type by description.

        Args:
            description: Client type description (e.g., 'Client', 'Prospect').

        Returns:
            ClientType object or None.
        """
        return await self._get_client_type_by_description(description)

    async def list_client_types(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False
    ) -> Tuple[List[ClientType], int]:
        """
        List client types with pagination.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            active_only: If True, only return active client types.

        Returns:
            Tuple of (client types list, total count).
        """
        # Build base query
        base_filter = []
        if active_only:
            base_filter.append(ClientType.ct_is_active == True)

        # Get total count
        count_query = select(func.count(ClientType.ct_id))
        if base_filter:
            count_query = count_query.where(*base_filter)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get client types
        query = (
            select(ClientType)
            .order_by(ClientType.ct_description)
            .offset(skip)
            .limit(limit)
        )
        if base_filter:
            query = query.where(*base_filter)

        result = await self.db.execute(query)
        client_types = list(result.scalars().all())

        return client_types, total

    async def update_client_type(
        self,
        client_type_id: int,
        data: ClientTypeUpdate
    ) -> ClientType:
        """
        Update a client type.

        Args:
            client_type_id: The client type ID.
            data: Update data.

        Returns:
            Updated ClientType object.

        Raises:
            ClientTypeNotFoundError: If client type not found.
            DuplicateClientTypeError: If new description already exists.
        """
        client_type = await self.get_client_type(client_type_id)

        # Check for duplicate description if changing
        update_data = data.model_dump(exclude_unset=True)
        if "ct_description" in update_data:
            existing = await self._get_client_type_by_description(
                update_data["ct_description"]
            )
            if existing and existing.ct_id != client_type_id:
                raise DuplicateClientTypeError(update_data["ct_description"])

        # Update fields
        for field, value in update_data.items():
            setattr(client_type, field, value)

        await self.db.flush()
        await self.db.refresh(client_type)
        return client_type

    async def delete_client_type(self, client_type_id: int) -> bool:
        """
        Delete a client type.

        Args:
            client_type_id: The client type ID.

        Returns:
            True if deleted successfully.

        Raises:
            ClientTypeNotFoundError: If client type not found.
            ClientTypeValidationError: If client type is in use.
        """
        client_type = await self.get_client_type(client_type_id)

        # Check if client type is in use
        # Note: The relationship will prevent deletion due to FK constraint
        # but we can provide a better error message
        if client_type.clients and len(client_type.clients) > 0:
            raise ClientTypeValidationError(
                f"Cannot delete client type '{client_type.ct_description}' as it is in use by {len(client_type.clients)} client(s)",
                details={
                    "client_type_id": client_type_id,
                    "clients_count": len(client_type.clients)
                }
            )

        await self.db.delete(client_type)
        await self.db.flush()
        return True

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    async def _get_client_type_by_description(
        self,
        description: str
    ) -> Optional[ClientType]:
        """
        Get client type by description (internal helper).

        Args:
            description: Client type description.

        Returns:
            ClientType object or None.
        """
        query = select(ClientType).where(ClientType.ct_description == description)
        result = await self.db.execute(query)
        return result.scalars().first()


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_client_type_service(
    db: AsyncSession = Depends(get_db)
) -> ClientTypeService:
    """
    Dependency to get ClientTypeService instance.

    Args:
        db: Database session from dependency.

    Returns:
        ClientTypeService instance.
    """
    return ClientTypeService(db)

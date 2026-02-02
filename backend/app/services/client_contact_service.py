"""
Client Contact Service Module.

Provides functionality for:
- Client Contact CRUD operations
- Contact search and filtering
"""
from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.database import get_db
from app.models.client import Client
from app.models.client_contact import ClientContact
from app.schemas.client_contact import (
    ClientContactBase, ClientContactCreate, ClientContactUpdate
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class ClientContactServiceError(Exception):
    """Base exception for client contact service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ClientContactNotFoundError(ClientContactServiceError):
    """Raised when client contact is not found."""
    def __init__(self, contact_id: int):
        super().__init__(
            code="CONTACT_NOT_FOUND",
            message=f"Contact with ID {contact_id} not found",
            details={"contact_id": contact_id}
        )


class ClientNotFoundForContactError(ClientContactServiceError):
    """Raised when the parent client is not found."""
    def __init__(self, client_id: int):
        super().__init__(
            code="CLIENT_NOT_FOUND",
            message=f"Client with ID {client_id} not found",
            details={"client_id": client_id}
        )


class ContactValidationError(ClientContactServiceError):
    """Raised when contact data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="CONTACT_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class ContactNotBelongsToClientError(ClientContactServiceError):
    """Raised when contact doesn't belong to the specified client."""
    def __init__(self, contact_id: int, client_id: int):
        super().__init__(
            code="CONTACT_NOT_BELONGS_TO_CLIENT",
            message=f"Contact {contact_id} does not belong to client {client_id}",
            details={"contact_id": contact_id, "client_id": client_id}
        )


# ==========================================================================
# Client Contact Service Class
# ==========================================================================

class ClientContactService:
    """
    Service class for client contact operations.

    Handles CRUD operations and search for client contacts.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the client contact service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Helper Methods
    # ==========================================================================

    async def _verify_client_exists(self, client_id: int) -> Client:
        """
        Verify that a client exists.

        Args:
            client_id: The client ID to verify.

        Returns:
            Client object.

        Raises:
            ClientNotFoundForContactError: If client not found.
        """
        result = await self.db.get(Client, client_id)
        if not result:
            raise ClientNotFoundForContactError(client_id)
        return result

    async def _handle_primary_contact(
        self,
        client_id: int,
        is_primary: bool,
        exclude_contact_id: Optional[int] = None
    ) -> None:
        """
        Handle primary contact logic.

        If setting a contact as primary, unset any existing primary contact.

        Args:
            client_id: The client ID.
            is_primary: Whether the contact is being set as primary.
            exclude_contact_id: Contact ID to exclude from unsetting.
        """
        if not is_primary:
            return

        # Unset existing primary contacts for this client
        query = (
            select(ClientContact)
            .where(
                ClientContact.cco_cli_id == client_id,
                ClientContact.cco_is_primary == True
            )
        )
        if exclude_contact_id:
            query = query.where(ClientContact.cco_id != exclude_contact_id)

        result = await self.db.execute(query)
        existing_primary = result.scalars().all()

        for contact in existing_primary:
            contact.cco_is_primary = False

    # ==========================================================================
    # Contact CRUD Operations
    # ==========================================================================

    async def create_contact(
        self,
        client_id: int,
        data: ClientContactBase
    ) -> ClientContact:
        """
        Create a new contact for a client.

        Args:
            client_id: The client ID to create contact for.
            data: Contact creation data.

        Returns:
            Created ClientContact object.

        Raises:
            ClientNotFoundForContactError: If client not found.
        """
        # Verify client exists
        await self._verify_client_exists(client_id)

        # Handle primary contact logic
        await self._handle_primary_contact(client_id, data.cco_is_primary)

        # Create contact
        contact_data = data.model_dump()
        contact = ClientContact(
            cco_cli_id=client_id,
            **contact_data
        )

        self.db.add(contact)
        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def get_contact(
        self,
        client_id: int,
        contact_id: int
    ) -> ClientContact:
        """
        Get a contact by ID for a specific client.

        Args:
            client_id: The client ID.
            contact_id: The contact ID.

        Returns:
            ClientContact object.

        Raises:
            ClientNotFoundForContactError: If client not found.
            ClientContactNotFoundError: If contact not found.
            ContactNotBelongsToClientError: If contact doesn't belong to client.
        """
        # Verify client exists
        await self._verify_client_exists(client_id)

        # Get contact
        contact = await self.db.get(ClientContact, contact_id)
        if not contact:
            raise ClientContactNotFoundError(contact_id)

        # Verify contact belongs to client
        if contact.cco_cli_id != client_id:
            raise ContactNotBelongsToClientError(contact_id, client_id)

        return contact

    async def list_contacts(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ClientContact], int]:
        """
        List contacts for a client with pagination.

        Args:
            client_id: The client ID.
            skip: Number of records to skip.
            limit: Maximum number of records to return.

        Returns:
            Tuple of (contacts list, total count).

        Raises:
            ClientNotFoundForContactError: If client not found.
        """
        # Verify client exists
        await self._verify_client_exists(client_id)

        # Get total count
        count_query = (
            select(func.count(ClientContact.cco_id))
            .where(ClientContact.cco_cli_id == client_id)
        )
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get contacts
        query = (
            select(ClientContact)
            .where(ClientContact.cco_cli_id == client_id)
            .order_by(
                ClientContact.cco_is_primary.desc(),
                ClientContact.cco_last_name,
                ClientContact.cco_first_name
            )
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(query)
        contacts = list(result.scalars().all())

        return contacts, total

    async def update_contact(
        self,
        client_id: int,
        contact_id: int,
        data: ClientContactUpdate
    ) -> ClientContact:
        """
        Update a contact.

        Args:
            client_id: The client ID.
            contact_id: The contact ID.
            data: Update data.

        Returns:
            Updated ClientContact object.

        Raises:
            ClientNotFoundForContactError: If client not found.
            ClientContactNotFoundError: If contact not found.
            ContactNotBelongsToClientError: If contact doesn't belong to client.
        """
        contact = await self.get_contact(client_id, contact_id)

        # Get update data
        update_data = data.model_dump(exclude_unset=True)

        # Handle primary contact logic
        if "cco_is_primary" in update_data and update_data["cco_is_primary"]:
            await self._handle_primary_contact(
                client_id,
                True,
                exclude_contact_id=contact_id
            )

        # Update fields
        for field, value in update_data.items():
            setattr(contact, field, value)

        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def delete_contact(
        self,
        client_id: int,
        contact_id: int
    ) -> bool:
        """
        Delete a contact.

        Args:
            client_id: The client ID.
            contact_id: The contact ID.

        Returns:
            True if deleted successfully.

        Raises:
            ClientNotFoundForContactError: If client not found.
            ClientContactNotFoundError: If contact not found.
            ContactNotBelongsToClientError: If contact doesn't belong to client.
        """
        contact = await self.get_contact(client_id, contact_id)
        await self.db.delete(contact)
        await self.db.flush()
        return True


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_client_contact_service(
    db: AsyncSession = Depends(get_db)
) -> ClientContactService:
    """
    Dependency to get ClientContactService instance.

    Args:
        db: Database session from dependency.

    Returns:
        ClientContactService instance.
    """
    return ClientContactService(db)

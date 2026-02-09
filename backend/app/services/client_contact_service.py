"""
Client Contact Service Module.

Provides functionality for:
- Client contact CRUD operations
- Invoice/Delivery address flag management
"""

import asyncio
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.client import Client
from app.models.client_contact import ClientContact
from app.schemas.client_contact import ClientContactBase, ClientContactUpdate


class ClientContactServiceError(Exception):
    """Base exception for client contact service."""

    def __init__(self, code: str, message: str, details: Optional[dict] = None):
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
            details={"contact_id": contact_id},
        )


class ClientNotFoundForContactError(ClientContactServiceError):
    """Raised when the parent client is not found."""

    def __init__(self, client_id: int):
        super().__init__(
            code="CLIENT_NOT_FOUND",
            message=f"Client with ID {client_id} not found",
            details={"client_id": client_id},
        )


class ContactValidationError(ClientContactServiceError):
    """Raised when contact data is invalid."""

    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            code="CONTACT_VALIDATION_ERROR",
            message=message,
            details=details or {},
        )


class ContactNotBelongsToClientError(ClientContactServiceError):
    """Raised when contact doesn't belong to the specified client."""

    def __init__(self, contact_id: int, client_id: int):
        super().__init__(
            code="CONTACT_NOT_BELONGS_TO_CLIENT",
            message=f"Contact {contact_id} does not belong to client {client_id}",
            details={"contact_id": contact_id, "client_id": client_id},
        )


class ClientContactService:
    """Service class for client contact operations."""

    def __init__(self, db: Session):
        self.db = db

    # ======================================================================
    # Sync internals
    # ======================================================================

    def _sync_verify_client_exists(self, client_id: int) -> Client:
        client = self.db.get(Client, client_id)
        if not client:
            raise ClientNotFoundForContactError(client_id)
        return client

    def _sync_get_contact_or_raise(self, client_id: int, contact_id: int) -> ClientContact:
        self._sync_verify_client_exists(client_id)
        contact = self.db.get(ClientContact, contact_id)
        if not contact:
            raise ClientContactNotFoundError(contact_id)
        if contact.cli_id != client_id:
            raise ContactNotBelongsToClientError(contact_id, client_id)
        return contact

    def _sync_unset_address_flags(
        self,
        client_id: int,
        set_invoicing: bool,
        set_delivery: bool,
        exclude_contact_id: Optional[int] = None,
    ) -> None:
        if not set_invoicing and not set_delivery:
            return

        query = select(ClientContact).where(ClientContact.cli_id == client_id)
        if exclude_contact_id:
            query = query.where(ClientContact.cco_id != exclude_contact_id)

        contacts = list(self.db.execute(query).scalars().all())
        for c in contacts:
            if set_invoicing and c.cco_is_invoicing_adr:
                c.cco_is_invoicing_adr = False
            if set_delivery and c.cco_is_delivery_adr:
                c.cco_is_delivery_adr = False

    def _sync_create_contact(self, client_id: int, data: ClientContactBase) -> ClientContact:
        self._sync_verify_client_exists(client_id)

        self._sync_unset_address_flags(
            client_id=client_id,
            set_invoicing=bool(data.cco_is_invoicing_adr),
            set_delivery=bool(data.cco_is_delivery_adr),
        )

        payload = data.model_dump(exclude_unset=True)
        now = datetime.utcnow()
        contact = ClientContact(
            cli_id=client_id,
            usr_created_by=1,
            cco_d_creation=now,
            cco_d_update=now,
            **payload,
        )

        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def _sync_get_contact(self, client_id: int, contact_id: int) -> ClientContact:
        return self._sync_get_contact_or_raise(client_id, contact_id)

    def _sync_list_contacts(self, client_id: int, skip: int = 0, limit: int = 100) -> Tuple[List[ClientContact], int]:
        self._sync_verify_client_exists(client_id)

        total = (
            self.db.execute(
                select(func.count(ClientContact.cco_id)).where(ClientContact.cli_id == client_id)
            ).scalar()
            or 0
        )

        query = (
            select(ClientContact)
            .where(ClientContact.cli_id == client_id)
            .order_by(
                ClientContact.cco_is_invoicing_adr.desc(),
                ClientContact.cco_is_delivery_adr.desc(),
                ClientContact.cco_lastname,
                ClientContact.cco_firstname,
            )
            .offset(skip)
            .limit(limit)
        )

        contacts = list(self.db.execute(query).scalars().all())
        return contacts, int(total)

    def _sync_update_contact(self, client_id: int, contact_id: int, data: ClientContactUpdate) -> ClientContact:
        contact = self._sync_get_contact_or_raise(client_id, contact_id)
        update_data = data.model_dump(exclude_unset=True)

        if update_data.get("cco_is_invoicing_adr"):
            self._sync_unset_address_flags(
                client_id=client_id,
                set_invoicing=True,
                set_delivery=False,
                exclude_contact_id=contact_id,
            )
        if update_data.get("cco_is_delivery_adr"):
            self._sync_unset_address_flags(
                client_id=client_id,
                set_invoicing=False,
                set_delivery=True,
                exclude_contact_id=contact_id,
            )

        for field, value in update_data.items():
            setattr(contact, field, value)

        contact.cco_d_update = datetime.utcnow()
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def _sync_delete_contact(self, client_id: int, contact_id: int) -> bool:
        contact = self._sync_get_contact_or_raise(client_id, contact_id)
        self.db.delete(contact)
        self.db.commit()
        return True

    # ======================================================================
    # Async wrappers
    # ======================================================================

    async def create_contact(self, client_id: int, data: ClientContactBase) -> ClientContact:
        return await asyncio.to_thread(self._sync_create_contact, client_id, data)

    async def get_contact(self, client_id: int, contact_id: int) -> ClientContact:
        return await asyncio.to_thread(self._sync_get_contact, client_id, contact_id)

    async def list_contacts(self, client_id: int, skip: int = 0, limit: int = 100) -> Tuple[List[ClientContact], int]:
        return await asyncio.to_thread(self._sync_list_contacts, client_id, skip, limit)

    async def update_contact(self, client_id: int, contact_id: int, data: ClientContactUpdate) -> ClientContact:
        return await asyncio.to_thread(self._sync_update_contact, client_id, contact_id, data)

    async def delete_contact(self, client_id: int, contact_id: int) -> bool:
        return await asyncio.to_thread(self._sync_delete_contact, client_id, contact_id)


def get_client_contact_service(db: Session = Depends(get_db)) -> ClientContactService:
    """Dependency to get ClientContactService instance."""
    return ClientContactService(db)

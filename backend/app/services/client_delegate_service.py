"""
Service layer for Client Delegate operations.

Handles CRUD operations for client delegates - entities that receive
invoices on behalf of clients.
"""
import asyncio
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.client_delegate import ClientDelegate
from app.models.client import Client
from app.schemas.client_delegate import (
    ClientDelegateCreate,
    ClientDelegateUpdate,
    ClientDelegateResponse,
    ClientDelegateListResponse,
)


class ClientDelegateServiceError(Exception):
    """Base exception for client delegate service errors."""
    def __init__(self, message: str, code: str = "DELEGATE_ERROR", details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)


class ClientDelegateNotFoundError(ClientDelegateServiceError):
    """Raised when a delegate is not found."""
    def __init__(self, delegate_id: int):
        super().__init__(
            message=f"Client delegate with ID {delegate_id} not found",
            code="DELEGATE_NOT_FOUND",
            details={"delegate_id": delegate_id}
        )


class ClientDelegateService:
    """Service for managing client delegates."""

    def __init__(self, db: Session):
        self.db = db

    def _sync_list_delegates(
        self,
        client_id: int,
        page: int = 1,
        page_size: int = 20,
        active_only: bool = False,
    ) -> Tuple[List[ClientDelegate], int]:
        """Synchronously list delegates for a client."""
        query = select(ClientDelegate).where(ClientDelegate.cdl_cli_id == client_id)

        if active_only:
            query = query.where(ClientDelegate.cdl_is_active == True)

        # Get total count
        count_query = select(func.count()).select_from(
            query.subquery()
        )
        total = self.db.execute(count_query).scalar() or 0

        # Apply pagination
        query = query.order_by(
            ClientDelegate.cdl_is_primary.desc(),
            ClientDelegate.cdl_d_creation.desc()
        )
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = self.db.execute(query)
        delegates = list(result.scalars().all())

        return delegates, total

    def _sync_get_delegate(self, delegate_id: int) -> Optional[ClientDelegate]:
        """Synchronously get a delegate by ID."""
        query = select(ClientDelegate).where(ClientDelegate.cdl_id == delegate_id)
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def _sync_get_delegate_for_client(self, client_id: int, delegate_id: int) -> Optional[ClientDelegate]:
        """Synchronously get a delegate by ID, verifying client ownership."""
        query = select(ClientDelegate).where(
            ClientDelegate.cdl_id == delegate_id,
            ClientDelegate.cdl_cli_id == client_id
        )
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def _sync_create_delegate(self, client_id: int, data: ClientDelegateCreate) -> ClientDelegate:
        """Synchronously create a new delegate."""
        # If setting as primary, unset other primary delegates
        if data.cdl_is_primary:
            self._sync_unset_primary_delegates(client_id)

        delegate = ClientDelegate(
            cdl_cli_id=client_id,
            cdl_delegate_cli_id=data.cdl_delegate_cli_id,
            cdl_company_name=data.cdl_company_name,
            cdl_contact_name=data.cdl_contact_name,
            cdl_email=data.cdl_email,
            cdl_phone=data.cdl_phone,
            cdl_address1=data.cdl_address1,
            cdl_address2=data.cdl_address2,
            cdl_postcode=data.cdl_postcode,
            cdl_city=data.cdl_city,
            cdl_country=data.cdl_country,
            cdl_vat_number=data.cdl_vat_number,
            cdl_is_active=True,
            cdl_is_primary=data.cdl_is_primary,
            cdl_notes=data.cdl_notes,
            cdl_d_creation=datetime.utcnow(),
            cdl_d_update=datetime.utcnow(),
        )

        self.db.add(delegate)
        self.db.commit()
        self.db.refresh(delegate)

        return delegate

    def _sync_update_delegate(self, delegate_id: int, data: ClientDelegateUpdate) -> ClientDelegate:
        """Synchronously update a delegate."""
        delegate = self._sync_get_delegate(delegate_id)
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        # If setting as primary, unset other primary delegates
        if data.cdl_is_primary and not delegate.cdl_is_primary:
            self._sync_unset_primary_delegates(delegate.cdl_cli_id)

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(delegate, field):
                setattr(delegate, field, value)

        delegate.cdl_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(delegate)

        return delegate

    def _sync_delete_delegate(self, delegate_id: int) -> bool:
        """Synchronously delete a delegate."""
        delegate = self._sync_get_delegate(delegate_id)
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        self.db.delete(delegate)
        self.db.commit()
        return True

    def _sync_unset_primary_delegates(self, client_id: int) -> None:
        """Unset primary flag for all delegates of a client."""
        query = select(ClientDelegate).where(
            ClientDelegate.cdl_cli_id == client_id,
            ClientDelegate.cdl_is_primary == True
        )
        result = self.db.execute(query)
        for delegate in result.scalars().all():
            delegate.cdl_is_primary = False
        self.db.commit()

    def _sync_get_primary_delegate(self, client_id: int) -> Optional[ClientDelegate]:
        """Get the primary delegate for a client."""
        query = select(ClientDelegate).where(
            ClientDelegate.cdl_cli_id == client_id,
            ClientDelegate.cdl_is_primary == True,
            ClientDelegate.cdl_is_active == True
        )
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def _enrich_delegate_response(self, delegate: ClientDelegate) -> ClientDelegateResponse:
        """Enrich delegate with resolved lookup names."""
        response = ClientDelegateResponse.model_validate(delegate)

        # Resolve delegate client name if linked to existing client
        if delegate.cdl_delegate_cli_id:
            delegate_client = self.db.execute(
                select(Client).where(Client.cli_id == delegate.cdl_delegate_cli_id)
            ).scalar_one_or_none()
            if delegate_client:
                response.delegateClientName = delegate_client.cli_company_name

        return response

    # Async wrappers
    async def list_delegates(
        self,
        client_id: int,
        page: int = 1,
        page_size: int = 20,
        active_only: bool = False,
    ) -> ClientDelegateListResponse:
        """List delegates for a client."""
        delegates, total = await asyncio.to_thread(
            self._sync_list_delegates, client_id, page, page_size, active_only
        )

        enriched = [self._enrich_delegate_response(d) for d in delegates]

        return ClientDelegateListResponse(
            data=enriched,
            total=total,
            page=page,
            pageSize=page_size,
            hasNextPage=(page * page_size) < total,
            hasPreviousPage=page > 1,
        )

    async def get_delegate(self, client_id: int, delegate_id: int) -> ClientDelegateResponse:
        """Get a delegate by ID with client ownership verification."""
        delegate = await asyncio.to_thread(
            self._sync_get_delegate_for_client, client_id, delegate_id
        )
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        return self._enrich_delegate_response(delegate)

    async def create_delegate(self, client_id: int, data: ClientDelegateCreate) -> ClientDelegateResponse:
        """Create a new delegate."""
        delegate = await asyncio.to_thread(
            self._sync_create_delegate, client_id, data
        )
        return self._enrich_delegate_response(delegate)

    async def update_delegate(
        self,
        client_id: int,
        delegate_id: int,
        data: ClientDelegateUpdate
    ) -> ClientDelegateResponse:
        """Update a delegate."""
        # Verify ownership first
        delegate = await asyncio.to_thread(
            self._sync_get_delegate_for_client, client_id, delegate_id
        )
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        updated = await asyncio.to_thread(
            self._sync_update_delegate, delegate_id, data
        )
        return self._enrich_delegate_response(updated)

    async def delete_delegate(self, client_id: int, delegate_id: int) -> bool:
        """Delete a delegate."""
        # Verify ownership first
        delegate = await asyncio.to_thread(
            self._sync_get_delegate_for_client, client_id, delegate_id
        )
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        return await asyncio.to_thread(self._sync_delete_delegate, delegate_id)

    async def get_primary_delegate(self, client_id: int) -> Optional[ClientDelegateResponse]:
        """Get the primary delegate for a client."""
        delegate = await asyncio.to_thread(
            self._sync_get_primary_delegate, client_id
        )
        if delegate:
            return self._enrich_delegate_response(delegate)
        return None


def get_client_delegate_service(db: Session = Depends(get_db)) -> ClientDelegateService:
    """Factory function for dependency injection."""
    return ClientDelegateService(db)

"""
Service layer for Client Delegate operations.

Handles CRUD operations for client delegates - entities that receive
invoices on behalf of clients. The TR_CDL_Client_Delegate table is a
junction table; all delegate info is resolved from the linked Client.
"""
import asyncio
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

        # Get total count
        count_query = select(func.count()).select_from(
            query.subquery()
        )
        total = self.db.execute(count_query).scalar() or 0

        # Apply pagination
        query = query.order_by(ClientDelegate.cdl_id.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = self.db.execute(query)
        delegates = list(result.scalars().all())

        return delegates, total

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
        delegate = ClientDelegate(
            cdl_cli_id=client_id,
            cdl_delegate_cli_id=data.cdl_delegate_cli_id,
        )

        self.db.add(delegate)
        self.db.commit()
        self.db.refresh(delegate)

        return delegate

    def _sync_update_delegate(self, delegate_id: int, data: ClientDelegateUpdate) -> ClientDelegate:
        """Synchronously update a delegate."""
        query = select(ClientDelegate).where(ClientDelegate.cdl_id == delegate_id)
        delegate = self.db.execute(query).scalar_one_or_none()
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(delegate, field):
                setattr(delegate, field, value)

        self.db.commit()
        self.db.refresh(delegate)

        return delegate

    def _sync_delete_delegate(self, delegate_id: int) -> bool:
        """Synchronously delete a delegate."""
        query = select(ClientDelegate).where(ClientDelegate.cdl_id == delegate_id)
        delegate = self.db.execute(query).scalar_one_or_none()
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        self.db.delete(delegate)
        self.db.commit()
        return True

    def _enrich_delegate_response(self, delegate: ClientDelegate) -> ClientDelegateResponse:
        """Enrich delegate response with info from the linked Client record."""
        response = ClientDelegateResponse.model_validate(delegate)

        # Resolve delegate client info
        if delegate.cdl_delegate_cli_id:
            delegate_client = self.db.execute(
                select(Client).where(Client.cli_id == delegate.cdl_delegate_cli_id)
            ).scalar_one_or_none()
            if delegate_client:
                response.companyName = delegate_client.cli_company_name
                response.contactName = f"{delegate_client.cli_first_name or ''} {delegate_client.cli_last_name or ''}".strip() or None
                response.email = delegate_client.cli_email
                response.phone = delegate_client.cli_phone
                response.address1 = delegate_client.cli_address1
                response.city = delegate_client.cli_city
                response.country = getattr(delegate_client, 'cli_country_name', None)
                response.vatNumber = delegate_client.cli_vat_number
                response.isActive = bool(getattr(delegate_client, 'cli_isactive', True))

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
        delegate = await asyncio.to_thread(
            self._sync_get_delegate_for_client, client_id, delegate_id
        )
        if not delegate:
            raise ClientDelegateNotFoundError(delegate_id)

        return await asyncio.to_thread(self._sync_delete_delegate, delegate_id)

    async def get_primary_delegate(self, client_id: int) -> Optional[ClientDelegateResponse]:
        """Get the first delegate for a client."""
        delegates, _ = await asyncio.to_thread(
            self._sync_list_delegates, client_id, 1, 1
        )
        if delegates:
            return self._enrich_delegate_response(delegates[0])
        return None


def get_client_delegate_service(db: Session = Depends(get_db)) -> ClientDelegateService:
    """Factory function for dependency injection."""
    return ClientDelegateService(db)

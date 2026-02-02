"""
Client Service Module.

Provides functionality for:
- Client CRUD operations
- Client search and filtering
- Reference number generation
- CSV export

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
from app.models.client import Client
from app.models.society import Society
from app.models.currency import Currency
from app.models.client_type import ClientType
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientSearchParams, ClientDetailResponse
)


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class ClientServiceError(Exception):
    """Base exception for client service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ClientNotFoundError(ClientServiceError):
    """Raised when client is not found."""
    def __init__(self, client_id: int):
        super().__init__(
            code="CLIENT_NOT_FOUND",
            message=f"Client with ID {client_id} not found",
            details={"client_id": client_id}
        )


class ClientReferenceNotFoundError(ClientServiceError):
    """Raised when client reference is not found."""
    def __init__(self, reference: str):
        super().__init__(
            code="CLIENT_REFERENCE_NOT_FOUND",
            message=f"Client with reference '{reference}' not found",
            details={"reference": reference}
        )


class ClientValidationError(ClientServiceError):
    """Raised when client data is invalid."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(
            code="CLIENT_VALIDATION_ERROR",
            message=message,
            details=details or {}
        )


class DuplicateClientError(ClientServiceError):
    """Raised when client already exists."""
    def __init__(self, field: str, value: str):
        super().__init__(
            code="DUPLICATE_CLIENT",
            message=f"Client with {field} '{value}' already exists",
            details={"field": field, "value": value}
        )


# ==========================================================================
# Client Service Class (pymssql + asyncio.to_thread)
# ==========================================================================

class ClientService:
    """
    Service class for client operations.

    Handles CRUD operations, search, and reference generation for clients.
    Uses asyncio.to_thread() to wrap sync pymssql operations for async compatibility.
    """

    def __init__(self, db: Session):
        """
        Initialize the client service.

        Args:
            db: Database session for operations.
        """
        self.db = db

    # ==========================================================================
    # Sync Database Methods (internal)
    # ==========================================================================

    def _sync_list_clients(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[ClientSearchParams] = None
    ) -> Tuple[List[Client], int]:
        """Synchronous list clients implementation."""
        base_filters = []

        if search_params:
            if search_params.search:
                search_term = f"%{search_params.search}%"
                base_filters.append(
                    or_(
                        Client.cli_company_name.ilike(search_term),
                        Client.cli_ref.ilike(search_term),
                        Client.cli_email.ilike(search_term),
                    )
                )

            if search_params.is_active is not None:
                base_filters.append(Client.cli_isactive == search_params.is_active)

        # Get total count
        count_query = select(func.count(Client.cli_id))
        if base_filters:
            count_query = count_query.where(*base_filters)
        total_result = self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get clients
        query = (
            select(Client)
            .order_by(Client.cli_company_name)
            .offset(skip)
            .limit(limit)
        )
        if base_filters:
            query = query.where(*base_filters)

        result = self.db.execute(query)
        clients = list(result.scalars().all())

        return clients, total

    def _sync_get_client(self, client_id: int) -> Client:
        """Synchronous get client by ID."""
        result = self.db.get(Client, client_id)
        if not result:
            raise ClientNotFoundError(client_id)
        return result

    def _sync_get_client_detail(self, client_id: int) -> dict:
        """
        Synchronous get client by ID with resolved lookup names.
        Returns a dict suitable for ClientDetailResponse.
        """
        client = self.db.get(Client, client_id)
        if not client:
            raise ClientNotFoundError(client_id)

        # Build base response from client ORM object
        # Use model_validate with from_attributes to map ORM fields
        response_data = ClientDetailResponse.model_validate(client).model_dump()

        # Resolve lookup names
        # Society
        if client.soc_id:
            society = self.db.get(Society, client.soc_id)
            if society:
                response_data["societyName"] = society.soc_society_name

        # Client Type
        if client.cty_id:
            client_type = self.db.get(ClientType, client.cty_id)
            if client_type:
                response_data["clientTypeName"] = client_type.cty_description

        # Currency
        if client.cur_id:
            currency = self.db.get(Currency, client.cur_id)
            if currency:
                response_data["currencyCode"] = currency.cur_designation
                response_data["currencySymbol"] = currency.cur_symbol

        # Payment Mode
        if client.pmo_id:
            payment_mode = self.db.get(PaymentMode, client.pmo_id)
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Payment Condition (Term)
        if client.pco_id:
            payment_term = self.db.get(PaymentTerm, client.pco_id)
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        return response_data

    def _sync_get_client_by_email(self, email: str) -> Optional[Client]:
        """Synchronous get client by email."""
        query = select(Client).where(Client.cli_email == email)
        result = self.db.execute(query)
        return result.scalars().first()

    def _sync_get_client_by_reference(self, reference: str) -> Client:
        """Synchronous get client by reference."""
        query = select(Client).where(Client.cli_ref == reference)
        result = self.db.execute(query)
        client = result.scalars().first()
        if not client:
            raise ClientReferenceNotFoundError(reference)
        return client

    def _sync_create_client(self, data: ClientCreate, user_id: Optional[int] = None) -> Client:
        """Synchronous create client."""
        if hasattr(data, 'cli_email') and data.cli_email:
            existing = self._sync_get_client_by_email(data.cli_email)
            if existing:
                raise DuplicateClientError("email", data.cli_email)

        client_data = data.model_dump(exclude_unset=True)
        client = Client(**client_data)

        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client

    def _sync_update_client(self, client_id: int, data: ClientUpdate, user_id: Optional[int] = None) -> Client:
        """Synchronous update client."""
        client = self._sync_get_client(client_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)

        self.db.commit()
        self.db.refresh(client)
        return client

    def _sync_delete_client(self, client_id: int) -> bool:
        """Synchronous soft delete client."""
        client = self._sync_get_client(client_id)
        client.cli_isactive = False
        self.db.commit()
        return True

    # ==========================================================================
    # Async Wrapper Methods (for FastAPI endpoints)
    # ==========================================================================

    async def list_clients(
        self,
        skip: int = 0,
        limit: int = 100,
        search_params: Optional[ClientSearchParams] = None
    ) -> Tuple[List[Client], int]:
        """List clients with pagination and filtering (async wrapper)."""
        return await asyncio.to_thread(self._sync_list_clients, skip, limit, search_params)

    async def get_client(self, client_id: int) -> Client:
        """Get client by ID (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_client, client_id)

    async def get_client_detail(self, client_id: int) -> dict:
        """Get client by ID with resolved lookup names (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_client_detail, client_id)

    async def get_client_by_email(self, email: str) -> Optional[Client]:
        """Get client by email (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_client_by_email, email)

    async def get_client_by_reference(self, reference: str) -> Client:
        """Get client by reference (async wrapper)."""
        return await asyncio.to_thread(self._sync_get_client_by_reference, reference)

    async def create_client(self, data: ClientCreate, user_id: Optional[int] = None) -> Client:
        """Create a new client (async wrapper)."""
        return await asyncio.to_thread(self._sync_create_client, data, user_id)

    async def update_client(self, client_id: int, data: ClientUpdate, user_id: Optional[int] = None) -> Client:
        """Update a client (async wrapper)."""
        return await asyncio.to_thread(self._sync_update_client, client_id, data, user_id)

    async def delete_client(self, client_id: int) -> bool:
        """Soft delete a client (async wrapper)."""
        return await asyncio.to_thread(self._sync_delete_client, client_id)

    async def export_clients_csv(
        self,
        search_params: Optional[ClientSearchParams] = None
    ) -> Tuple[str, int]:
        """Export clients to CSV format."""
        clients, total = await self.list_clients(skip=0, limit=10000, search_params=search_params)

        fieldnames = [
            'cli_id', 'cli_ref', 'cli_company_name', 'cli_email',
            'cli_tel1', 'cli_address1', 'cli_city', 'cli_isactive',
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

        for client in clients:
            row = {
                'cli_id': client.cli_id,
                'cli_ref': client.cli_ref or '',
                'cli_company_name': client.cli_company_name or '',
                'cli_email': client.cli_email or '',
                'cli_tel1': client.cli_tel1 or '',
                'cli_address1': client.cli_address1 or '',
                'cli_city': client.cli_city or '',
                'cli_isactive': 'true' if client.cli_isactive else 'false',
            }
            writer.writerow(row)

        return output.getvalue(), len(clients)


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_client_service(
    db: Session = Depends(get_db)
) -> ClientService:
    """
    Dependency to get ClientService instance.
    """
    return ClientService(db)

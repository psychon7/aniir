"""
Client API Router.

Provides REST API endpoints for:
- Client CRUD operations
- Client search and filtering
- Client listing with pagination
- CSV export
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.database import get_db
from app.services.client_service import (
    ClientService,
    get_client_service,
    ClientServiceError,
    ClientNotFoundError,
    ClientReferenceNotFoundError,
    ClientValidationError,
    DuplicateClientError
)
from app.services.client_contact_service import (
    ClientContactService,
    get_client_contact_service,
    ClientContactServiceError,
    ClientContactNotFoundError,
    ClientNotFoundForContactError,
    ContactValidationError,
    ContactNotBelongsToClientError
)
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientListResponse, ClientListPaginatedResponse, ClientDetailResponse,
    ClientAPIResponse, ClientErrorResponse, ClientSearchParams
)
from app.schemas.client_contact import (
    ClientContactBase, ClientContactUpdate, ClientContactResponse,
    ClientContactListResponse, ClientContactListPaginatedResponse
)

router = APIRouter(prefix="/clients", tags=["Clients"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_client_error(error: ClientServiceError) -> HTTPException:
    """Convert ClientServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (ClientNotFoundError, ClientReferenceNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ClientValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DuplicateClientError):
        status_code = status.HTTP_409_CONFLICT

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


def handle_contact_error(error: ClientContactServiceError) -> HTTPException:
    """Convert ClientContactServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (ClientContactNotFoundError, ClientNotFoundForContactError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ContactValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, ContactNotBelongsToClientError):
        status_code = status.HTTP_404_NOT_FOUND

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Client CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new client",
    description="""
    Create a new client in the system.

    A unique reference number will be automatically generated.
    The company name is required, and email must be unique if provided.
    """
)
async def create_client(
    data: ClientCreate,
    service: ClientService = Depends(get_client_service)
):
    """Create a new client."""
    try:
        client = await service.create_client(data)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.get(
    "",
    response_model=ClientListPaginatedResponse,
    summary="List all clients",
    description="""
    Get a paginated list of all clients with optional filtering.

    Supports filtering by:
    - Text search (company name, reference, email, contact name)
    - Status ID
    - Client type ID
    - Country ID
    - Business unit ID
    - Society ID
    - Active status
    """
)
async def list_clients(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    client_type_id: Optional[int] = Query(None, description="Filter by client type ID"),
    country_id: Optional[int] = Query(None, description="Filter by country ID"),
    business_unit_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    service: ClientService = Depends(get_client_service)
):
    """List all clients with pagination and filtering."""
    search_params = ClientSearchParams(
        search=search,
        status_id=status_id,
        client_type_id=client_type_id,
        country_id=country_id,
        business_unit_id=business_unit_id,
        society_id=society_id,
        is_active=is_active
    )

    # Convert page/pageSize to skip/limit
    skip = (page - 1) * pageSize
    limit = pageSize

    clients, total = await service.list_clients(
        skip=skip,
        limit=limit,
        search_params=search_params
    )

    # Calculate pagination info
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1

    return ClientListPaginatedResponse(
        success=True,
        data=[ClientListResponse.model_validate(c) for c in clients],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )


@router.get(
    "/export",
    summary="Export clients to CSV",
    description="""
    Export clients to CSV format.

    Supports the same filtering options as the list endpoint.
    Returns a CSV file download with all matching clients.
    """,
    responses={
        200: {
            "content": {"text/csv": {}},
            "description": "CSV file with client data"
        }
    }
)
async def export_clients_csv(
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    client_type_id: Optional[int] = Query(None, description="Filter by client type ID"),
    country_id: Optional[int] = Query(None, description="Filter by country ID"),
    business_unit_id: Optional[int] = Query(None, description="Filter by business unit ID"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    service: ClientService = Depends(get_client_service)
):
    """Export clients to CSV file."""
    search_params = ClientSearchParams(
        search=search,
        status_id=status_id,
        client_type_id=client_type_id,
        country_id=country_id,
        business_unit_id=business_unit_id,
        society_id=society_id,
        is_active=is_active
    )

    try:
        csv_content, count = await service.export_clients_csv(search_params)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"clients_export_{timestamp}.csv"

        # Return CSV as streaming response
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Total-Count": str(count)
            }
        )
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.get(
    "/{client_id}",
    response_model=ClientDetailResponse,
    summary="Get client by ID",
    description="Get detailed information about a specific client with resolved lookup names."
)
async def get_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Get a specific client by ID with resolved lookup names."""
    try:
        client_detail = await service.get_client_detail(client_id)
        return client_detail
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.get(
    "/by-reference/{reference}",
    response_model=ClientResponse,
    summary="Get client by reference",
    description="Get client by its unique reference number."
)
async def get_client_by_reference(
    reference: str = Path(..., min_length=1, max_length=20, description="Client reference"),
    service: ClientService = Depends(get_client_service)
):
    """Get a specific client by reference."""
    try:
        client = await service.get_client_by_reference(reference)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.put(
    "/{client_id}",
    response_model=ClientResponse,
    summary="Update a client",
    description="Update an existing client's information."
)
async def update_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    data: ClientUpdate = ...,
    service: ClientService = Depends(get_client_service)
):
    """Update an existing client."""
    try:
        client = await service.update_client(client_id, data)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a client (soft delete)",
    description="""
    Soft delete a client by ID.

    This sets the client's is_active flag to False.
    The client record is preserved for historical purposes.
    """
)
async def delete_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Soft delete a client."""
    try:
        await service.delete_client(client_id)
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.delete(
    "/{client_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a client",
    description="""
    Permanently delete a client by ID.

    WARNING: This cannot be undone.
    Will fail if the client has related invoices or payments.
    """
)
async def hard_delete_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Permanently delete a client."""
    try:
        await service.hard_delete_client(client_id)
    except ClientServiceError as e:
        raise handle_client_error(e)


# ==========================================================================
# Additional Client Endpoints
# ==========================================================================

@router.get(
    "/{client_id}/details",
    response_model=ClientResponse,
    summary="Get client with all related data",
    description="Get client with all related data (invoices, payments, etc.) loaded."
)
async def get_client_details(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Get a client with all related data."""
    try:
        client = await service.get_client_with_relations(client_id)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.patch(
    "/{client_id}/activate",
    response_model=ClientResponse,
    summary="Activate a client",
    description="Set a client's is_active flag to True."
)
async def activate_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Activate a client."""
    try:
        update_data = ClientUpdate(cli_is_active=True)
        client = await service.update_client(client_id, update_data)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


@router.patch(
    "/{client_id}/deactivate",
    response_model=ClientResponse,
    summary="Deactivate a client",
    description="Set a client's is_active flag to False."
)
async def deactivate_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service)
):
    """Deactivate a client."""
    try:
        update_data = ClientUpdate(cli_is_active=False)
        client = await service.update_client(client_id, update_data)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


# ==========================================================================
# Client Contact Endpoints
# ==========================================================================

@router.post(
    "/{client_id}/contacts",
    response_model=ClientContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a contact to a client",
    description="""
    Add a new contact to an existing client.

    The contact will be associated with the specified client.
    If is_primary is set to True, any existing primary contact will be unset.
    """
)
async def create_client_contact(
    client_id: int = Path(..., gt=0, description="Client ID"),
    data: ClientContactBase = ...,
    service: ClientContactService = Depends(get_client_contact_service)
):
    """Create a new contact for a client."""
    try:
        contact = await service.create_contact(client_id, data)
        return contact
    except ClientContactServiceError as e:
        raise handle_contact_error(e)


@router.get(
    "/{client_id}/contacts",
    response_model=ClientContactListPaginatedResponse,
    summary="List contacts for a client",
    description="""
    Get a paginated list of all contacts for a specific client.

    Contacts are ordered by primary status (primary first), then by last name and first name.
    """
)
async def list_client_contacts(
    client_id: int = Path(..., gt=0, description="Client ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: ClientContactService = Depends(get_client_contact_service)
):
    """List all contacts for a client."""
    try:
        contacts, total = await service.list_contacts(
            client_id=client_id,
            skip=skip,
            limit=limit
        )
        return ClientContactListPaginatedResponse(
            items=[ClientContactListResponse.model_validate(c) for c in contacts],
            total=total,
            skip=skip,
            limit=limit
        )
    except ClientContactServiceError as e:
        raise handle_contact_error(e)


@router.get(
    "/{client_id}/contacts/{contact_id}",
    response_model=ClientContactResponse,
    summary="Get a specific contact",
    description="Get detailed information about a specific contact for a client."
)
async def get_client_contact(
    client_id: int = Path(..., gt=0, description="Client ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    service: ClientContactService = Depends(get_client_contact_service)
):
    """Get a specific contact for a client."""
    try:
        contact = await service.get_contact(client_id, contact_id)
        return contact
    except ClientContactServiceError as e:
        raise handle_contact_error(e)


@router.put(
    "/{client_id}/contacts/{contact_id}",
    response_model=ClientContactResponse,
    summary="Update a contact",
    description="""
    Update an existing contact for a client.

    If is_primary is set to True, any existing primary contact will be unset.
    """
)
async def update_client_contact(
    client_id: int = Path(..., gt=0, description="Client ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    data: ClientContactUpdate = ...,
    service: ClientContactService = Depends(get_client_contact_service)
):
    """Update a contact for a client."""
    try:
        contact = await service.update_contact(client_id, contact_id, data)
        return contact
    except ClientContactServiceError as e:
        raise handle_contact_error(e)


@router.delete(
    "/{client_id}/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a contact",
    description="Permanently delete a contact from a client."
)
async def delete_client_contact(
    client_id: int = Path(..., gt=0, description="Client ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    service: ClientContactService = Depends(get_client_contact_service)
):
    """Delete a contact from a client."""
    try:
        await service.delete_contact(client_id, contact_id)
    except ClientContactServiceError as e:
        raise handle_contact_error(e)

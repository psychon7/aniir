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
from app.services.cache_service import cache_service, CacheTTL, CacheKeys
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
from app.services.client_product_price_service import (
    ClientProductPriceService,
    get_client_product_price_service,
    ClientProductPriceServiceError,
    ClientProductPriceNotFoundError,
)
from app.services.client_delegate_service import (
    ClientDelegateService,
    get_client_delegate_service,
    ClientDelegateServiceError,
    ClientDelegateNotFoundError,
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
from app.schemas.client_product_price import (
    ClientProductPriceCreate, ClientProductPriceUpdate, ClientProductPriceResponse,
    ClientProductPriceListResponse, ClientProductPriceListPaginatedResponse,
    ClientProductPriceAPIResponse
)
from app.schemas.client_delegate import (
    ClientDelegateCreate, ClientDelegateUpdate, ClientDelegateResponse,
    ClientDelegateListResponse
)
from app.services.client_activity_service import (
    ClientActivityService,
    get_client_activity_service,
)
from app.schemas.client_activity import ActivityResponse

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


def handle_price_error(error: ClientProductPriceServiceError) -> HTTPException:
    """Convert ClientProductPriceServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, ClientProductPriceNotFoundError):
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
        # Invalidate list caches (new record affects all lists)
        await cache_service.invalidate_entity_lists(CacheKeys.CLIENT)
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
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
    service: ClientService = Depends(get_client_service)
):
    """List all clients with pagination and filtering. Cached until data changes."""
    # Build cache params
    cache_params = {
        "page": page,
        "pageSize": pageSize,
        "search": search,
        "status_id": status_id,
        "client_type_id": client_type_id,
        "country_id": country_id,
        "business_unit_id": business_unit_id,
        "society_id": society_id,
        "is_active": is_active
    }

    # Try cache first
    if not bypass_cache:
        cached = await cache_service.get_list(CacheKeys.CLIENT, cache_params)
        if cached is not None:
            return cached

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

    result = ClientListPaginatedResponse(
        success=True,
        data=[ClientListResponse.model_validate(c) for c in clients],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )

    # Cache the result (invalidated when any client changes)
    await cache_service.set_list(CacheKeys.CLIENT, cache_params, result.model_dump())

    return result


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
    description="Get detailed information about a specific client with resolved lookup names. Cached until modified."
)
async def get_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientService = Depends(get_client_service),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
):
    """Get a specific client by ID with resolved lookup names. Cached until modified."""
    # Try cache first (unless bypassing)
    if not bypass_cache:
        cached = await cache_service.get_detail(CacheKeys.CLIENT, client_id)
        if cached is not None:
            return cached

    # Fetch from database
    try:
        client_detail = await service.get_client_detail(client_id)
        # Cache the result (indefinitely until invalidated)
        await cache_service.set_detail(CacheKeys.CLIENT, client_id, client_detail)
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
        # Invalidate cache (detail + all lists)
        await cache_service.invalidate_entity(CacheKeys.CLIENT, client_id)
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
        # Invalidate cache (detail + all lists)
        await cache_service.invalidate_entity(CacheKeys.CLIENT, client_id)
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
        # Invalidate cache (detail + all lists)
        await cache_service.invalidate_entity(CacheKeys.CLIENT, client_id)
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
        # Invalidate cache
        await cache_service.invalidate_entity(CacheKeys.CLIENT, client_id)
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
        # Invalidate cache
        await cache_service.invalidate_entity(CacheKeys.CLIENT, client_id)
        return client
    except ClientServiceError as e:
        raise handle_client_error(e)


# ==========================================================================
# Client Activity Feed
# ==========================================================================

@router.get(
    "/{client_id}/activity",
    response_model=ActivityResponse,
    summary="Get client activity feed",
    description="Get a unified timeline of quotes, orders, deliveries, invoices, and payments for a client."
)
async def get_client_activity(
    client_id: int = Path(..., gt=0, description="Client ID"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    entityType: Optional[str] = Query(None, description="Filter by entity type (quote, order, delivery, invoice, payment)"),
    service: ClientActivityService = Depends(get_client_activity_service),
):
    """Get unified activity timeline for a client."""
    return await service.get_activity(
        client_id=client_id,
        page=page,
        page_size=pageSize,
        entity_type=entityType,
    )


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


# ==========================================================================
# Client Product Price Endpoints
# ==========================================================================

@router.post(
    "/{client_id}/prices",
    response_model=ClientProductPriceAPIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a product price for a client",
    description="""
    Add a custom product price for a specific client.

    This allows setting special pricing for client/product combinations,
    including discounts, quantity-based pricing, and time-limited promotions.
    """
)
async def create_client_price(
    client_id: int = Path(..., gt=0, description="Client ID"),
    data: ClientProductPriceCreate = ...,
    service: ClientProductPriceService = Depends(get_client_product_price_service)
):
    """Create a new product price for a client."""
    try:
        # Ensure client_id matches the data
        if data.cpp_cli_id != client_id:
            data.cpp_cli_id = client_id
        price = await service.create_price(data)
        return ClientProductPriceAPIResponse(success=True, data=price)
    except ClientProductPriceServiceError as e:
        raise handle_price_error(e)


@router.get(
    "/{client_id}/prices",
    response_model=ClientProductPriceListPaginatedResponse,
    summary="List product prices for a client",
    description="""
    Get a paginated list of all custom product prices for a specific client.

    Includes product information and currency details.
    """
)
async def list_client_prices(
    client_id: int = Path(..., gt=0, description="Client ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    active_only: bool = Query(True, description="Only show active prices"),
    service: ClientProductPriceService = Depends(get_client_product_price_service)
):
    """List all product prices for a client."""
    try:
        skip = (page - 1) * pageSize
        prices, total = await service.list_prices(
            client_id=client_id,
            skip=skip,
            limit=pageSize,
            product_id=product_id,
            active_only=active_only
        )

        total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
        return ClientProductPriceListPaginatedResponse(
            success=True,
            data=[ClientProductPriceListResponse(**p) for p in prices],
            page=page,
            pageSize=pageSize,
            totalCount=total,
            totalPages=total_pages,
            hasNextPage=page < total_pages,
            hasPreviousPage=page > 1
        )
    except ClientProductPriceServiceError as e:
        raise handle_price_error(e)


@router.get(
    "/{client_id}/prices/{price_id}",
    response_model=ClientProductPriceAPIResponse,
    summary="Get a specific product price",
    description="Get detailed information about a specific product price for a client."
)
async def get_client_price(
    client_id: int = Path(..., gt=0, description="Client ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    service: ClientProductPriceService = Depends(get_client_product_price_service)
):
    """Get a specific product price for a client."""
    try:
        price = await service.get_price(price_id)
        # Verify the price belongs to this client
        if price.cpp_cli_id != client_id:
            raise ClientProductPriceNotFoundError(price_id)
        return ClientProductPriceAPIResponse(success=True, data=price)
    except ClientProductPriceServiceError as e:
        raise handle_price_error(e)


@router.put(
    "/{client_id}/prices/{price_id}",
    response_model=ClientProductPriceAPIResponse,
    summary="Update a product price",
    description="Update an existing product price for a client."
)
async def update_client_price(
    client_id: int = Path(..., gt=0, description="Client ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    data: ClientProductPriceUpdate = ...,
    service: ClientProductPriceService = Depends(get_client_product_price_service)
):
    """Update a product price for a client."""
    try:
        # Verify the price belongs to this client
        existing = await service.get_price(price_id)
        if existing.cpp_cli_id != client_id:
            raise ClientProductPriceNotFoundError(price_id)
        price = await service.update_price(price_id, data)
        return ClientProductPriceAPIResponse(success=True, data=price)
    except ClientProductPriceServiceError as e:
        raise handle_price_error(e)


@router.delete(
    "/{client_id}/prices/{price_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product price",
    description="Soft delete a product price (sets is_active to False)."
)
async def delete_client_price(
    client_id: int = Path(..., gt=0, description="Client ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    service: ClientProductPriceService = Depends(get_client_product_price_service)
):
    """Delete a product price for a client."""
    try:
        # Verify the price belongs to this client
        existing = await service.get_price(price_id)
        if existing.cpp_cli_id != client_id:
            raise ClientProductPriceNotFoundError(price_id)
        await service.delete_price(price_id)
    except ClientProductPriceServiceError as e:
        raise handle_price_error(e)


# ==========================================================================
# Client Delegate Endpoints
# ==========================================================================

def handle_delegate_error(error: ClientDelegateServiceError) -> HTTPException:
    """Convert ClientDelegateServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, ClientDelegateNotFoundError):
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


@router.post(
    "/{client_id}/delegates",
    response_model=ClientDelegateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a delegate for a client",
    description="""
    Add a billing delegate for a client.

    A delegate is another entity (usually a parent company, billing agent, or
    group headquarters) that receives invoices on behalf of this client.

    You can either link to an existing client as the delegate, or provide
    delegate contact information directly.
    """
)
async def create_client_delegate(
    client_id: int = Path(..., gt=0, description="Client ID"),
    data: ClientDelegateCreate = ...,
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """Create a new delegate for a client."""
    try:
        delegate = await service.create_delegate(client_id, data)
        return delegate
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)


@router.get(
    "/{client_id}/delegates",
    response_model=ClientDelegateListResponse,
    summary="List delegates for a client",
    description="""
    Get a paginated list of all billing delegates for a specific client.

    Delegates are ordered by primary status (primary first), then by creation date.
    """
)
async def list_client_delegates(
    client_id: int = Path(..., gt=0, description="Client ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    active_only: bool = Query(True, description="Only show active delegates"),
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """List all delegates for a client."""
    try:
        result = await service.list_delegates(
            client_id=client_id,
            page=page,
            page_size=pageSize,
            active_only=active_only
        )
        return result
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)


@router.get(
    "/{client_id}/delegates/primary",
    response_model=ClientDelegateResponse,
    summary="Get the primary delegate",
    description="Get the primary billing delegate for a client, if one is set."
)
async def get_primary_delegate(
    client_id: int = Path(..., gt=0, description="Client ID"),
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """Get the primary delegate for a client."""
    try:
        delegate = await service.get_primary_delegate(client_id)
        if not delegate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "NO_PRIMARY_DELEGATE",
                        "message": "No primary delegate set for this client"
                    }
                }
            )
        return delegate
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)


@router.get(
    "/{client_id}/delegates/{delegate_id}",
    response_model=ClientDelegateResponse,
    summary="Get a specific delegate",
    description="Get detailed information about a specific delegate for a client."
)
async def get_client_delegate(
    client_id: int = Path(..., gt=0, description="Client ID"),
    delegate_id: int = Path(..., gt=0, description="Delegate ID"),
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """Get a specific delegate for a client."""
    try:
        delegate = await service.get_delegate(client_id, delegate_id)
        return delegate
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)


@router.put(
    "/{client_id}/delegates/{delegate_id}",
    response_model=ClientDelegateResponse,
    summary="Update a delegate",
    description="""
    Update an existing delegate for a client.

    If is_primary is set to True, any existing primary delegate will be unset.
    """
)
async def update_client_delegate(
    client_id: int = Path(..., gt=0, description="Client ID"),
    delegate_id: int = Path(..., gt=0, description="Delegate ID"),
    data: ClientDelegateUpdate = ...,
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """Update a delegate for a client."""
    try:
        delegate = await service.update_delegate(client_id, delegate_id, data)
        return delegate
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)


@router.delete(
    "/{client_id}/delegates/{delegate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a delegate",
    description="Permanently delete a delegate from a client."
)
async def delete_client_delegate(
    client_id: int = Path(..., gt=0, description="Client ID"),
    delegate_id: int = Path(..., gt=0, description="Delegate ID"),
    service: ClientDelegateService = Depends(get_client_delegate_service)
):
    """Delete a delegate from a client."""
    try:
        await service.delete_delegate(client_id, delegate_id)
    except ClientDelegateServiceError as e:
        raise handle_delegate_error(e)

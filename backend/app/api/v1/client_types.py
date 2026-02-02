"""
ClientType API Router.

Provides REST API endpoints for:
- ClientType CRUD operations
- Client type lookup and listing
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.client_type_service import (
    ClientTypeService,
    get_client_type_service,
    ClientTypeServiceError,
    ClientTypeNotFoundError,
    ClientTypeValidationError,
    DuplicateClientTypeError
)
from app.schemas.client_type import (
    ClientTypeCreate, ClientTypeUpdate, ClientTypeResponse,
    ClientTypeListResponse, ClientTypeListPaginatedResponse,
    ClientTypeAPIResponse, ClientTypeErrorResponse
)

router = APIRouter(prefix="/client-types", tags=["Client Types"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_client_type_error(error: ClientTypeServiceError) -> HTTPException:
    """Convert ClientTypeServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, ClientTypeNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ClientTypeValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DuplicateClientTypeError):
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


# ==========================================================================
# ClientType CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=ClientTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new client type",
    description="""
    Create a new client type definition.

    A client type requires a unique description (e.g., 'Client', 'Prospect').
    """
)
async def create_client_type(
    data: ClientTypeCreate,
    service: ClientTypeService = Depends(get_client_type_service)
):
    """Create a new client type."""
    try:
        client_type = await service.create_client_type(data)
        return client_type
    except ClientTypeServiceError as e:
        raise handle_client_type_error(e)


@router.get(
    "",
    response_model=ClientTypeListPaginatedResponse,
    summary="List all client types",
    description="""
    Get a paginated list of all client types.

    Returns client types ordered by description.
    Can optionally filter to show only active client types.
    """
)
async def list_client_types(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    active_only: bool = Query(False, description="Only return active client types"),
    service: ClientTypeService = Depends(get_client_type_service)
):
    """List all client types with pagination."""
    client_types, total = await service.list_client_types(
        skip=skip,
        limit=limit,
        active_only=active_only
    )
    return ClientTypeListPaginatedResponse(
        items=client_types,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{client_type_id}",
    response_model=ClientTypeResponse,
    summary="Get client type by ID",
    description="Get detailed information about a specific client type."
)
async def get_client_type(
    client_type_id: int = Path(..., gt=0, description="Client type ID"),
    service: ClientTypeService = Depends(get_client_type_service)
):
    """Get a specific client type by ID."""
    try:
        client_type = await service.get_client_type(client_type_id)
        return client_type
    except ClientTypeServiceError as e:
        raise handle_client_type_error(e)


@router.get(
    "/by-description/{description}",
    response_model=ClientTypeResponse,
    summary="Get client type by description",
    description="Get client type by its description (e.g., 'Client', 'Prospect')."
)
async def get_client_type_by_description(
    description: str = Path(..., min_length=1, max_length=100, description="Client type description"),
    service: ClientTypeService = Depends(get_client_type_service)
):
    """Get a specific client type by description."""
    client_type = await service.get_client_type_by_description(description)
    if not client_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "CLIENT_TYPE_NOT_FOUND",
                    "message": f"Client type with description '{description}' not found",
                    "details": {"description": description}
                }
            }
        )
    return client_type


@router.put(
    "/{client_type_id}",
    response_model=ClientTypeResponse,
    summary="Update a client type",
    description="Update an existing client type's information."
)
async def update_client_type(
    client_type_id: int = Path(..., gt=0, description="Client type ID"),
    data: ClientTypeUpdate = ...,
    service: ClientTypeService = Depends(get_client_type_service)
):
    """Update an existing client type."""
    try:
        client_type = await service.update_client_type(client_type_id, data)
        return client_type
    except ClientTypeServiceError as e:
        raise handle_client_type_error(e)


@router.delete(
    "/{client_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a client type",
    description="""
    Delete a client type by ID.

    Note: This will fail if any clients are using this client type.
    """
)
async def delete_client_type(
    client_type_id: int = Path(..., gt=0, description="Client type ID"),
    service: ClientTypeService = Depends(get_client_type_service)
):
    """Delete a client type."""
    try:
        await service.delete_client_type(client_type_id)
    except ClientTypeServiceError as e:
        raise handle_client_type_error(e)

"""
Purchase Intent API Router.

Provides REST API endpoints for:
- Purchase Intent CRUD operations
- Purchase Intent search and filtering
- Purchase Intent listing with pagination
- Purchase Intent Line management
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, MockUser
from app.services.purchase_intent_service import (
    PurchaseIntentService,
    get_purchase_intent_service,
    PurchaseIntentServiceError,
    PurchaseIntentNotFoundError,
    PurchaseIntentCodeNotFoundError,
    PurchaseIntentValidationError,
    PurchaseIntentLineNotFoundError,
    PurchaseIntentClosedError,
)
from app.schemas.purchase_intent import (
    PurchaseIntentCreate, PurchaseIntentUpdate, PurchaseIntentResponse,
    PurchaseIntentListResponse, PurchaseIntentListPaginatedResponse,
    PurchaseIntentWithLinesResponse, PurchaseIntentSearchParams,
    PurchaseIntentLineCreate, PurchaseIntentLineUpdate, PurchaseIntentLineResponse,
    ConvertToSupplierOrderRequest, ConvertToSupplierOrderResponse,
)

router = APIRouter(prefix="/purchase-intents", tags=["Purchase Intents"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_purchase_intent_error(error: PurchaseIntentServiceError) -> HTTPException:
    """Convert PurchaseIntentServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (PurchaseIntentNotFoundError, PurchaseIntentCodeNotFoundError, PurchaseIntentLineNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, PurchaseIntentValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, PurchaseIntentClosedError):
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
# Purchase Intent CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=PurchaseIntentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new purchase intent",
    description="""
    Create a new purchase intent in the system.

    Optionally include lines to create with the purchase intent.
    """
)
async def create_purchase_intent(
    data: PurchaseIntentCreate,
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Create a new purchase intent."""
    try:
        purchase_intent = await service.create_purchase_intent(data)
        return purchase_intent
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.get(
    "",
    response_model=PurchaseIntentListPaginatedResponse,
    summary="List all purchase intents",
    description="""
    Get a paginated list of all purchase intents with optional filtering.

    Supports filtering by:
    - Text search (code, name)
    - Society ID
    - Creator ID
    - Closed status
    """
)
async def list_purchase_intents(
    # Support both page/pageSize (frontend) and skip/limit (legacy)
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    skip: Optional[int] = Query(None, ge=0, description="Number of records to skip (legacy)"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum records to return (legacy)"),
    sortBy: Optional[str] = Query(None, description="Field to sort by"),
    sortOrder: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society ID"),
    creator_id: Optional[int] = Query(None, alias="creatorId", description="Filter by creator user ID"),
    is_closed: Optional[bool] = Query(None, alias="isClosed", description="Filter by closed status"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """List all purchase intents with pagination and filtering."""
    # Convert page/pageSize to skip/limit if not using legacy params
    actual_skip = skip if skip is not None else (page - 1) * pageSize
    actual_limit = limit if limit is not None else pageSize

    search_params = PurchaseIntentSearchParams(
        search=search,
        society_id=society_id,
        creator_id=creator_id,
        is_closed=is_closed
    )

    purchase_intents, total = await service.list_purchase_intents(
        skip=actual_skip,
        limit=actual_limit,
        search_params=search_params
    )

    # Calculate pagination info
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1

    return PurchaseIntentListPaginatedResponse(
        success=True,
        data=[PurchaseIntentListResponse.model_validate(pi) for pi in purchase_intents],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )


@router.get(
    "/{purchase_intent_id}",
    response_model=PurchaseIntentWithLinesResponse,
    summary="Get purchase intent by ID",
    description="Get detailed information about a specific purchase intent including lines."
)
async def get_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Get a specific purchase intent by ID with lines."""
    try:
        purchase_intent = await service.get_purchase_intent(purchase_intent_id)
        lines = await service.list_lines(purchase_intent_id)

        # Build response with lines
        response_data = PurchaseIntentResponse.model_validate(purchase_intent).model_dump()
        response_data['lines'] = [PurchaseIntentLineResponse.model_validate(line) for line in lines]

        return response_data
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.get(
    "/by-code/{code}",
    response_model=PurchaseIntentResponse,
    summary="Get purchase intent by code",
    description="Get purchase intent by its reference code."
)
async def get_purchase_intent_by_code(
    code: str = Path(..., min_length=1, max_length=50, description="Purchase Intent code"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Get a specific purchase intent by code."""
    try:
        purchase_intent = await service.get_purchase_intent_by_code(code)
        return purchase_intent
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.put(
    "/{purchase_intent_id}",
    response_model=PurchaseIntentResponse,
    summary="Update a purchase intent",
    description="Update an existing purchase intent's information."
)
async def update_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    data: PurchaseIntentUpdate = ...,
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Update an existing purchase intent."""
    try:
        purchase_intent = await service.update_purchase_intent(purchase_intent_id, data)
        return purchase_intent
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.delete(
    "/{purchase_intent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a purchase intent (soft delete)",
    description="""
    Soft delete a purchase intent by ID.

    This sets the purchase intent's closed flag to True.
    The record is preserved for historical purposes.
    """
)
async def delete_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Soft delete a purchase intent."""
    try:
        await service.delete_purchase_intent(purchase_intent_id)
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.delete(
    "/{purchase_intent_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a purchase intent",
    description="""
    Permanently delete a purchase intent by ID.

    WARNING: This cannot be undone.
    Will also delete all related lines.
    """
)
async def hard_delete_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Permanently delete a purchase intent."""
    try:
        await service.permanent_delete_purchase_intent(purchase_intent_id)
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


# ==========================================================================
# Additional Purchase Intent Endpoints
# ==========================================================================

@router.patch(
    "/{purchase_intent_id}/close",
    response_model=PurchaseIntentResponse,
    summary="Close a purchase intent",
    description="Set a purchase intent's closed flag to True."
)
async def close_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Close a purchase intent."""
    try:
        purchase_intent = await service.close_purchase_intent(purchase_intent_id)
        return purchase_intent
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.patch(
    "/{purchase_intent_id}/reopen",
    response_model=PurchaseIntentResponse,
    summary="Reopen a purchase intent",
    description="Set a purchase intent's closed flag to False."
)
async def reopen_purchase_intent(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Reopen a purchase intent."""
    try:
        purchase_intent = await service.reopen_purchase_intent(purchase_intent_id)
        return purchase_intent
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


# ==========================================================================
# Purchase Intent Conversion Endpoints
# ==========================================================================

@router.post(
    "/{purchase_intent_id}/convert-to-supplier-order",
    response_model=ConvertToSupplierOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Convert purchase intent to supplier order",
    description="""
    Convert a purchase intent into a new supplier order.

    This will:
    - Create a new supplier order linked to the purchase intent
    - Copy all purchase intent lines to supplier order lines
    - Mark the purchase intent as closed
    - Generate a reference code for the new supplier order

    The purchase intent must not already be closed.
    """
)
async def convert_to_supplier_order(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    request: ConvertToSupplierOrderRequest = ...,
    current_user: MockUser = Depends(get_current_user),
    service: PurchaseIntentService = Depends(get_purchase_intent_service),
):
    """Convert a purchase intent to a supplier order."""
    try:
        supplier_order = await service.convert_to_supplier_order(
            purchase_intent_id=purchase_intent_id,
            supplier_id=request.supplier_id,
            currency_id=request.currency_id,
            vat_id=request.vat_id,
            user_id=current_user.usr_id,
        )
        return ConvertToSupplierOrderResponse(
            supplier_order_id=supplier_order.sod_id,
            supplier_order_code=supplier_order.sod_code,
            message=f"Purchase intent {purchase_intent_id} successfully converted to supplier order {supplier_order.sod_code}",
        )
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


# ==========================================================================
# Purchase Intent Line Endpoints
# ==========================================================================

@router.post(
    "/{purchase_intent_id}/lines",
    response_model=PurchaseIntentLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a line to a purchase intent",
    description="""
    Add a new line to an existing purchase intent.

    The line will be associated with the specified purchase intent.
    If pil_order is not provided, it will be auto-assigned.
    """
)
async def add_line(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    data: PurchaseIntentLineCreate = ...,
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Add a new line to a purchase intent."""
    try:
        line = await service.add_line(purchase_intent_id, data)
        return line
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.get(
    "/{purchase_intent_id}/lines",
    response_model=List[PurchaseIntentLineResponse],
    summary="List lines for a purchase intent",
    description="""
    Get all lines for a specific purchase intent.

    Lines are ordered by pil_order.
    """
)
async def list_lines(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """List all lines for a purchase intent."""
    try:
        lines = await service.list_lines(purchase_intent_id)
        return [PurchaseIntentLineResponse.model_validate(line) for line in lines]
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.get(
    "/{purchase_intent_id}/lines/{line_id}",
    response_model=PurchaseIntentLineResponse,
    summary="Get a specific line",
    description="Get detailed information about a specific line for a purchase intent."
)
async def get_line(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Get a specific line for a purchase intent."""
    try:
        line = await service.get_line(purchase_intent_id, line_id)
        return line
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.put(
    "/{purchase_intent_id}/lines/{line_id}",
    response_model=PurchaseIntentLineResponse,
    summary="Update a line",
    description="Update an existing line for a purchase intent."
)
async def update_line(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: PurchaseIntentLineUpdate = ...,
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Update a line for a purchase intent."""
    try:
        line = await service.update_line(purchase_intent_id, line_id, data)
        return line
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)


@router.delete(
    "/{purchase_intent_id}/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a line",
    description="Permanently delete a line from a purchase intent."
)
async def delete_line(
    purchase_intent_id: int = Path(..., gt=0, description="Purchase Intent ID"),
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: PurchaseIntentService = Depends(get_purchase_intent_service)
):
    """Delete a line from a purchase intent."""
    try:
        await service.delete_line(purchase_intent_id, line_id)
    except PurchaseIntentServiceError as e:
        raise handle_purchase_intent_error(e)

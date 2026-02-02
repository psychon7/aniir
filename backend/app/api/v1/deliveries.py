"""
Delivery API Router.

Provides REST API endpoints for:
- Delivery form CRUD operations
- Delivery form line management
- Delivery status management (ship, deliver)
- Delivery search and lookup
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.delivery_service import (
    DeliveryService,
    DeliveryServiceError,
    DeliveryNotFoundError,
    DeliveryLineNotFoundError,
    DeliveryDuplicateReferenceError,
    DeliveryAlreadyShippedError,
    DeliveryAlreadyDeliveredError,
    DeliveryNotShippedError
)
from app.schemas.delivery import (
    DeliveryFormCreate, DeliveryFormUpdate,
    DeliveryFormLineCreate, DeliveryFormLineUpdate,
    DeliveryFormSearchParams,
    DeliveryFormResponse, DeliveryFormWithLinesResponse,
    DeliveryFormListResponse, DeliveryFormListPaginatedResponse,
    DeliveryFormLineResponse, DeliveryDetailResponse,
    DeliveryShipRequest, DeliveryDeliverRequest,
    DeliveryFormAPIResponse, DeliveryFormLineAPIResponse,
    DeliveryFormErrorResponse
)

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_delivery_service(db: AsyncSession = Depends(get_db)) -> DeliveryService:
    """Get delivery service instance."""
    return DeliveryService(db)


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_delivery_error(error: DeliveryServiceError) -> HTTPException:
    """Convert DeliveryServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "DELIVERY_ERROR"

    if isinstance(error, DeliveryNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "DELIVERY_NOT_FOUND"
    elif isinstance(error, DeliveryLineNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "DELIVERY_LINE_NOT_FOUND"
    elif isinstance(error, DeliveryDuplicateReferenceError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "DELIVERY_DUPLICATE_REFERENCE"
    elif isinstance(error, DeliveryAlreadyShippedError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "DELIVERY_ALREADY_SHIPPED"
    elif isinstance(error, DeliveryAlreadyDeliveredError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "DELIVERY_ALREADY_DELIVERED"
    elif isinstance(error, DeliveryNotShippedError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "DELIVERY_NOT_SHIPPED"

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(error)
            }
        }
    )


# ==========================================================================
# Delivery Form CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=DeliveryFormWithLinesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new delivery form",
    description="""
    Create a new delivery form with optional lines.

    A delivery form requires:
    - Reference number (unique)
    - Order ID
    - Client ID
    - Expected delivery date
    - Status ID

    Optional fields include carrier info, tracking number, shipping address, and lines.
    """
)
async def create_delivery(
    data: DeliveryFormCreate,
    service: DeliveryService = Depends(get_delivery_service)
):
    """Create a new delivery form."""
    try:
        delivery = await service.create_delivery(data)
        return delivery
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.get(
    "",
    response_model=DeliveryFormListPaginatedResponse,
    summary="Search and list delivery forms",
    description="""
    Search delivery forms with optional filters and pagination.

    Supports filtering by:
    - Search term (matches reference, tracking number)
    - Order ID
    - Client ID
    - Status ID
    - Carrier ID
    - Date range
    - Shipped/delivered status
    """
)
async def search_deliveries(
    search: Optional[str] = Query(None, description="Search term"),
    del_ord_id: Optional[int] = Query(None, description="Order ID"),
    del_cli_id: Optional[int] = Query(None, description="Client ID"),
    del_sta_id: Optional[int] = Query(None, description="Status ID"),
    del_car_id: Optional[int] = Query(None, description="Carrier ID"),
    date_from: Optional[datetime] = Query(None, description="Delivery date from"),
    date_to: Optional[datetime] = Query(None, description="Delivery date to"),
    is_shipped: Optional[bool] = Query(None, description="Filter by shipped status"),
    is_delivered: Optional[bool] = Query(None, description="Filter by delivered status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    sort_by: str = Query("del_delivery_date", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Search and list delivery forms with pagination."""
    params = DeliveryFormSearchParams(
        search=search,
        del_ord_id=del_ord_id,
        del_cli_id=del_cli_id,
        del_sta_id=del_sta_id,
        del_car_id=del_car_id,
        date_from=date_from,
        date_to=date_to,
        is_shipped=is_shipped,
        is_delivered=is_delivered,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_deliveries(params)


@router.get(
    "/lookup",
    response_model=List[dict],
    summary="Get delivery forms for lookup/dropdown",
    description="""
    Get a lightweight list of delivery forms for dropdown selection.
    Returns ID, reference, order ID, client ID, delivery date, status ID, and tracking number.
    """
)
async def get_delivery_lookup(
    order_id: Optional[int] = Query(None, description="Order ID filter"),
    client_id: Optional[int] = Query(None, description="Client ID filter"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get delivery forms for lookup/dropdown."""
    return await service.get_delivery_lookup(order_id, client_id, search, limit)


@router.get(
    "/by-order/{order_id}",
    response_model=List[DeliveryFormListResponse],
    summary="Get delivery forms by order",
    description="Get all delivery forms for a specific order."
)
async def get_deliveries_by_order(
    order_id: int = Path(..., gt=0, description="Order ID"),
    skip: int = Query(0, ge=0, description="Number to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum to return"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get all delivery forms for an order."""
    return await service.get_deliveries_by_order(order_id, skip, limit)


@router.get(
    "/by-client/{client_id}",
    response_model=List[DeliveryFormListResponse],
    summary="Get delivery forms by client",
    description="Get all delivery forms for a specific client."
)
async def get_deliveries_by_client(
    client_id: int = Path(..., gt=0, description="Client ID"),
    skip: int = Query(0, ge=0, description="Number to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum to return"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get all delivery forms for a client."""
    return await service.get_deliveries_by_client(client_id, skip, limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Count delivery forms",
    description="Get total count of delivery forms, optionally filtered by order, client, or status."
)
async def count_deliveries(
    order_id: Optional[int] = Query(None, description="Order ID filter"),
    client_id: Optional[int] = Query(None, description="Client ID filter"),
    status_id: Optional[int] = Query(None, description="Status ID filter"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get delivery form count."""
    count = await service.count_deliveries(order_id, client_id, status_id)
    return {"count": count}


@router.get(
    "/{delivery_id}",
    response_model=DeliveryDetailResponse,
    summary="Get delivery form by ID",
    description="Get detailed information about a specific delivery form including its lines and resolved lookup names."
)
async def get_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get a specific delivery form by ID with resolved lookup names."""
    try:
        return await service.get_delivery_detail(delivery_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.get(
    "/by-ref/{reference}",
    response_model=DeliveryFormWithLinesResponse,
    summary="Get delivery form by reference",
    description="Get a delivery form by its reference number."
)
async def get_delivery_by_reference(
    reference: str = Path(..., min_length=1, description="Delivery reference"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get a delivery form by reference code."""
    try:
        return await service.get_delivery_by_reference(reference)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.put(
    "/{delivery_id}",
    response_model=DeliveryFormWithLinesResponse,
    summary="Update a delivery form",
    description="Update an existing delivery form's information."
)
async def update_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    data: DeliveryFormUpdate = ...,
    service: DeliveryService = Depends(get_delivery_service)
):
    """Update an existing delivery form."""
    try:
        return await service.update_delivery(delivery_id, data)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.delete(
    "/{delivery_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a delivery form",
    description="""
    Delete a delivery form and all its lines.

    Note: This will also delete all delivery form lines associated with this delivery.
    """
)
async def delete_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Delete a delivery form."""
    try:
        await service.delete_delivery(delivery_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


# ==========================================================================
# Delivery Status Endpoints
# ==========================================================================

@router.post(
    "/{delivery_id}/ship",
    response_model=DeliveryFormWithLinesResponse,
    summary="Mark delivery as shipped",
    description="""
    Mark a delivery form as shipped.

    Sets the shipped timestamp and optionally updates tracking number and carrier.
    Cannot be called on already shipped deliveries.
    """
)
async def ship_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    data: DeliveryShipRequest = DeliveryShipRequest(),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Mark a delivery as shipped."""
    try:
        return await service.ship_delivery(delivery_id, data)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.post(
    "/{delivery_id}/deliver",
    response_model=DeliveryFormWithLinesResponse,
    summary="Mark delivery as delivered",
    description="""
    Mark a delivery form as delivered.

    Sets the delivered timestamp and optionally records who signed for the delivery.
    Requires the delivery to be shipped first. Cannot be called on already delivered deliveries.
    """
)
async def deliver_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    data: DeliveryDeliverRequest = DeliveryDeliverRequest(),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Mark a delivery as delivered."""
    try:
        return await service.deliver_delivery(delivery_id, data)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


# ==========================================================================
# Delivery Form Line Endpoints
# ==========================================================================

@router.post(
    "/{delivery_id}/lines",
    response_model=DeliveryFormLineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a delivery form line",
    description="""
    Create a new line item for a delivery form.

    Lines represent individual items being delivered, linked to order lines.
    """
)
async def create_line(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    data: DeliveryFormLineCreate = ...,
    service: DeliveryService = Depends(get_delivery_service)
):
    """Create a new delivery form line."""
    try:
        return await service.create_line(delivery_id, data)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.get(
    "/{delivery_id}/lines",
    response_model=List[DeliveryFormLineResponse],
    summary="Get delivery form lines",
    description="Get all lines for a delivery form."
)
async def get_lines_by_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get all lines for a delivery form."""
    try:
        return await service.get_lines_by_delivery(delivery_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.get(
    "/lines/{line_id}",
    response_model=DeliveryFormLineResponse,
    summary="Get line by ID",
    description="Get detailed information about a specific delivery form line."
)
async def get_line(
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Get a specific delivery form line by ID."""
    try:
        return await service.get_line(line_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.put(
    "/lines/{line_id}",
    response_model=DeliveryFormLineResponse,
    summary="Update a delivery form line",
    description="Update an existing delivery form line's information."
)
async def update_line(
    line_id: int = Path(..., gt=0, description="Line ID"),
    data: DeliveryFormLineUpdate = ...,
    service: DeliveryService = Depends(get_delivery_service)
):
    """Update an existing delivery form line."""
    try:
        return await service.update_line(line_id, data)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


@router.delete(
    "/lines/{line_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a delivery form line",
    description="Delete a specific delivery form line."
)
async def delete_line(
    line_id: int = Path(..., gt=0, description="Line ID"),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Delete a delivery form line."""
    try:
        await service.delete_line(line_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)

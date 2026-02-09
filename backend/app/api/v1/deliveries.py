"""
Delivery API Router.

Provides REST API endpoints for:
- Delivery form CRUD operations
- Delivery form line management
- Delivery status management (ship, deliver)
- Delivery search and lookup
"""
import asyncio
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.delivery_form import DeliveryForm
from app.models.client import Client
from app.models.order import ClientOrder
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
# Paginated Response Schema
# ==========================================================================


class DeliveryListPaginatedResponse(BaseModel):
    """Paginated response for delivery list - matches frontend PagedResponse format."""
    success: bool = Field(default=True, description="Whether the operation was successful")
    data: List[DeliveryFormResponse] = Field(default_factory=list, description="List of deliveries")
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    pageSize: int = Field(default=20, ge=1, le=100, description="Items per page")
    totalCount: int = Field(default=0, ge=0, description="Total count of deliveries")
    totalPages: int = Field(default=0, ge=0, description="Total number of pages")
    hasNextPage: bool = Field(default=False, description="Whether there is a next page")
    hasPreviousPage: bool = Field(default=False, description="Whether there is a previous page")


# ==========================================================================
# Sync Database Helper
# ==========================================================================


def _sync_list_deliveries(
    db: Session,
    page: int,
    page_size: int,
    search: Optional[str] = None,
    client_id: Optional[int] = None,
    sort_by: str = "dfo_d_creation",
    sort_order: str = "desc"
):
    """Sync function to list deliveries with pagination, joining Client and Order."""
    query = (
        select(
            DeliveryForm.dfo_id,
            DeliveryForm.dfo_code,
            DeliveryForm.cli_id,
            DeliveryForm.cod_id,
            DeliveryForm.dfo_d_creation,
            DeliveryForm.dfo_d_update,
            DeliveryForm.dfo_d_delivery,
            DeliveryForm.dfo_deliveried,
            DeliveryForm.dfo_dlv_cco_address1,
            DeliveryForm.dfo_dlv_cco_city,
            DeliveryForm.dfo_dlv_cco_postcode,
            DeliveryForm.dfo_dlv_cco_country,
            DeliveryForm.dfo_delivery_comment,
            DeliveryForm.soc_id,
            Client.cli_company_name,
            ClientOrder.cod_code.label("order_code"),
        )
        .outerjoin(Client, DeliveryForm.cli_id == Client.cli_id)
        .outerjoin(ClientOrder, DeliveryForm.cod_id == ClientOrder.cod_id)
    )
    count_query = select(func.count(DeliveryForm.dfo_id))

    conditions = []

    if search:
        search_term = f"%{search}%"
        conditions.append(DeliveryForm.dfo_code.ilike(search_term))

    if client_id:
        conditions.append(DeliveryForm.cli_id == client_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Get total count
    total_result = db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(DeliveryForm, sort_by, DeliveryForm.dfo_d_creation)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    result = db.execute(query)
    rows = list(result.all())

    return rows, total


# ==========================================================================
# Dependency Injection
# ==========================================================================

def get_delivery_service(db: Session = Depends(get_db)) -> DeliveryService:
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
    summary="Search and list delivery forms",
    description="Search delivery forms with optional filters and pagination."
)
async def search_deliveries(
    search: Optional[str] = Query(None, description="Search term"),
    client_id: Optional[int] = Query(None, description="Client ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    sort_by: str = Query("dfo_d_creation", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """Search and list delivery forms with pagination."""
    rows, total = await asyncio.to_thread(
        _sync_list_deliveries, db, page, page_size, search, client_id, sort_by, sort_order
    )

    # Build camelCase response matching frontend DeliveryForm type
    items = []
    for row in rows:
        # Build full address string
        addr_parts = []
        if row.dfo_dlv_cco_address1:
            addr_parts.append(row.dfo_dlv_cco_address1)
        if row.dfo_dlv_cco_city:
            addr_parts.append(row.dfo_dlv_cco_city)
        if row.dfo_dlv_cco_postcode:
            addr_parts.append(row.dfo_dlv_cco_postcode)
        if row.dfo_dlv_cco_country:
            addr_parts.append(row.dfo_dlv_cco_country)
        delivery_address = ", ".join(addr_parts) if addr_parts else None

        items.append({
            "id": row.dfo_id,
            "reference": row.dfo_code or "",
            "clientId": row.cli_id,
            "clientName": row.cli_company_name or "",
            "orderId": row.cod_id,
            "orderReference": row.order_code or "",
            "createdAt": row.dfo_d_creation.isoformat() if row.dfo_d_creation else None,
            "scheduledDate": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery else None,
            "expectedDeliveryDate": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery else None,
            "deliveryDate": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery and row.dfo_deliveried else None,
            "deliveryAddress": delivery_address,
            "statusName": "Delivered" if row.dfo_deliveried else "Pending",
            "isShipped": False,
            "isDelivered": bool(row.dfo_deliveried),
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "success": True,
        "data": items,
        "page": page,
        "pageSize": page_size,
        "totalCount": total,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }


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

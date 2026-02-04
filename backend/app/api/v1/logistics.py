"""
Logistics API Router.

Provides REST API endpoints for:
- Shipment CRUD operations
- Status management
- Tracking information
- Delivery scheduling
- Statistics
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.shipment_service import (
    ShipmentService,
    get_shipment_service,
    ShipmentServiceError,
    ShipmentNotFoundError,
    ShipmentReferenceNotFoundError,
    ShipmentTrackingNotFoundError,
    ShipmentValidationError,
    ShipmentStatusError,
    ShipmentDeleteError
)
from app.schemas.shipment import (
    # Shipment schemas
    ShipmentCreate, ShipmentUpdate, ShipmentResponse, ShipmentDetailResponse,
    ShipmentSearchParams, ShipmentListResponse,
    # Bulk operations
    BulkStatusUpdateRequest, BulkStatusUpdateResponse,
    # Tracking
    TrackingResponse,
    # Carriers
    CarrierListItemResponse, CarrierResponse,
    # Response schemas
    ShipmentAPIResponse, ShipmentErrorResponse
)

router = APIRouter(prefix="/logistics", tags=["Logistics"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_shipment_error(error: ShipmentServiceError) -> HTTPException:
    """Convert ShipmentServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, ShipmentNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ShipmentReferenceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ShipmentTrackingNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ShipmentValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, ShipmentStatusError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(error, ShipmentDeleteError):
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
# Shipment CRUD Endpoints
# ==========================================================================

@router.post(
    "/shipments",
    response_model=ShipmentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new shipment",
    description="""
    Create a new shipment with tracking information.

    The shipment reference is auto-generated if not provided.
    Requires a valid carrier ID and status ID.
    """
)
async def create_shipment(
    data: ShipmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new shipment."""
    service = get_shipment_service(db)

    try:
        shipment = await service.create_shipment(data)
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.get(
    "/shipments",
    response_model=ShipmentListResponse,
    summary="Search shipments",
    description="Search and filter shipments with pagination."
)
async def search_shipments(
    reference: Optional[str] = Query(None, description="Filter by reference (partial match)"),
    carrier_id: Optional[int] = Query(None, description="Filter by carrier ID"),
    status_id: Optional[int] = Query(None, description="Filter by status ID"),
    delivery_form_id: Optional[int] = Query(None, description="Filter by delivery form ID"),
    tracking_number: Optional[str] = Query(None, description="Filter by tracking number (partial match)"),
    origin_city: Optional[str] = Query(None, description="Filter by origin city"),
    destination_city: Optional[str] = Query(None, description="Filter by destination city"),
    origin_country_id: Optional[int] = Query(None, description="Filter by origin country ID"),
    destination_country_id: Optional[int] = Query(None, description="Filter by destination country ID"),
    estimated_delivery_from: Optional[datetime] = Query(None, description="Estimated delivery from date"),
    estimated_delivery_to: Optional[datetime] = Query(None, description="Estimated delivery to date"),
    actual_delivery_from: Optional[datetime] = Query(None, description="Actual delivery from date"),
    actual_delivery_to: Optional[datetime] = Query(None, description="Actual delivery to date"),
    created_from: Optional[datetime] = Query(None, description="Created from date"),
    created_to: Optional[datetime] = Query(None, description="Created to date"),
    min_cost: Optional[Decimal] = Query(None, ge=0, description="Minimum cost"),
    max_cost: Optional[Decimal] = Query(None, ge=0, description="Maximum cost"),
    currency_id: Optional[int] = Query(None, description="Filter by currency ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("shp_created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db)
):
    """Search shipments with filters and pagination."""
    service = get_shipment_service(db)

    params = ShipmentSearchParams(
        reference=reference,
        carrier_id=carrier_id,
        status_id=status_id,
        delivery_form_id=delivery_form_id,
        tracking_number=tracking_number,
        origin_city=origin_city,
        destination_city=destination_city,
        origin_country_id=origin_country_id,
        destination_country_id=destination_country_id,
        estimated_delivery_from=estimated_delivery_from,
        estimated_delivery_to=estimated_delivery_to,
        actual_delivery_from=actual_delivery_from,
        actual_delivery_to=actual_delivery_to,
        created_from=created_from,
        created_to=created_to,
        min_cost=min_cost,
        max_cost=max_cost,
        currency_id=currency_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )

    result = await service.search_shipments(params)
    return result


@router.get(
    "/shipments/{shipment_id}",
    response_model=ShipmentDetailResponse,
    summary="Get shipment details",
    description="Get a shipment by ID with full details.",
    responses={
        200: {"description": "Shipment found"},
        404: {"model": ShipmentErrorResponse, "description": "Shipment not found"}
    }
)
async def get_shipment(
    shipment_id: int = Path(..., description="Shipment ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipment by ID."""
    service = get_shipment_service(db)

    try:
        shipment = await service.get_shipment(shipment_id)
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.get(
    "/shipments/reference/{reference}",
    response_model=ShipmentDetailResponse,
    summary="Get shipment by reference",
    description="Get a shipment by its reference number.",
    responses={
        200: {"description": "Shipment found"},
        404: {"model": ShipmentErrorResponse, "description": "Shipment not found"}
    }
)
async def get_shipment_by_reference(
    reference: str = Path(..., description="Shipment reference"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipment by reference."""
    service = get_shipment_service(db)

    try:
        shipment = await service.get_shipment_by_reference(reference)
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.get(
    "/shipments/by-reference/{reference}",
    response_model=ShipmentDetailResponse,
    summary="Get shipment by reference (alias)",
    description="Get a shipment by its reference number.",
    responses={
        200: {"description": "Shipment found"},
        404: {"model": ShipmentErrorResponse, "description": "Shipment not found"}
    }
)
async def get_shipment_by_reference_alias(
    reference: str = Path(..., description="Shipment reference"),
    db: AsyncSession = Depends(get_db)
):
    """Alias for shipment lookup by reference."""
    return await get_shipment_by_reference(reference=reference, db=db)


@router.put(
    "/shipments/{shipment_id}",
    response_model=ShipmentDetailResponse,
    summary="Update a shipment",
    description="""
    Update shipment details.

    Cannot update cancelled shipments.
    """,
    responses={
        200: {"description": "Shipment updated"},
        404: {"model": ShipmentErrorResponse, "description": "Shipment not found"},
        409: {"model": ShipmentErrorResponse, "description": "Status conflict"}
    }
)
async def update_shipment(
    shipment_id: int = Path(..., description="Shipment ID"),
    data: ShipmentUpdate = ...,
    db: AsyncSession = Depends(get_db)
):
    """Update a shipment."""
    service = get_shipment_service(db)

    try:
        shipment = await service.update_shipment(shipment_id, data)
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.delete(
    "/shipments/{shipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shipment",
    description="""
    Delete a shipment.

    Only pending or cancelled shipments can be deleted.
    """,
    responses={
        204: {"description": "Shipment deleted"},
        404: {"model": ShipmentErrorResponse, "description": "Shipment not found"},
        409: {"model": ShipmentErrorResponse, "description": "Cannot delete shipment"}
    }
)
async def delete_shipment(
    shipment_id: int = Path(..., description="Shipment ID"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a shipment."""
    service = get_shipment_service(db)

    try:
        await service.delete_shipment(shipment_id)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


# ==========================================================================
# Status Management Endpoints
# ==========================================================================

@router.put(
    "/shipments/{shipment_id}/status",
    response_model=ShipmentDetailResponse,
    summary="Update shipment status",
    description="""
    Update the status of a shipment.

    Valid status transitions are enforced:
    - Pending -> In Transit, Cancelled
    - In Transit -> Delivered, Exception, Returned
    - Exception -> In Transit, Returned, Cancelled
    - Returned -> Cancelled
    - Delivered and Cancelled are terminal states
    """
)
@router.patch(
    "/shipments/{shipment_id}/status",
    response_model=ShipmentDetailResponse,
    summary="Update shipment status (alias)",
    description="Update the status of a shipment."
)
async def update_shipment_status(
    shipment_id: int = Path(..., description="Shipment ID"),
    status_id: int = Query(..., description="New status ID"),
    notes: Optional[str] = Query(None, description="Optional status notes"),
    actual_delivery: Optional[datetime] = Query(None, description="Actual delivery date (auto-set for delivered)"),
    db: AsyncSession = Depends(get_db)
):
    """Update shipment status."""
    service = get_shipment_service(db)

    try:
        shipment = await service.update_status(
            shipment_id,
            status_id,
            actual_delivery
        )
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.post(
    "/shipments/{shipment_id}/delivered",
    response_model=ShipmentDetailResponse,
    summary="Mark shipment as delivered",
    description="Mark a shipment as delivered and optionally set the actual delivery date."
)
async def mark_shipment_delivered(
    shipment_id: int = Path(..., description="Shipment ID"),
    actual_delivery: Optional[datetime] = Query(None, description="Actual delivery date"),
    db: AsyncSession = Depends(get_db)
):
    service = get_shipment_service(db)
    try:
        shipment = await service.update_status(shipment_id, ShipmentService.STATUS_DELIVERED, actual_delivery)
        return service._to_detail_response(shipment)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.post(
    "/shipments/bulk-status",
    response_model=BulkStatusUpdateResponse,
    summary="Bulk update shipment status",
    description="Update status for multiple shipments at once."
)
async def bulk_update_status(
    request: BulkStatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Bulk update status for multiple shipments."""
    service = get_shipment_service(db)

    try:
        return await service.bulk_update_status(request)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


# ==========================================================================
# Tracking Endpoints
# ==========================================================================

@router.get(
    "/shipments/{shipment_id}/tracking",
    response_model=TrackingResponse,
    summary="Get tracking information",
    description="Get tracking information and events for a shipment."
)
async def get_tracking_info(
    shipment_id: int = Path(..., description="Shipment ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get tracking information for a shipment."""
    service = get_shipment_service(db)

    try:
        return await service.get_tracking_info(shipment_id)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.get(
    "/track/{tracking_number}",
    response_model=TrackingResponse,
    summary="Track by tracking number",
    description="Get tracking information using the carrier tracking number."
)
async def track_by_tracking_number(
    tracking_number: str = Path(..., description="Carrier tracking number"),
    db: AsyncSession = Depends(get_db)
):
    """Track a shipment by tracking number."""
    service = get_shipment_service(db)

    try:
        return await service.track_by_tracking_number(tracking_number)
    except ShipmentServiceError as e:
        raise handle_shipment_error(e)


@router.get(
    "/tracking/{tracking_number}",
    response_model=TrackingResponse,
    summary="Track by tracking number (alias)",
    description="Get tracking information using the carrier tracking number."
)
async def track_by_tracking_number_alias(
    tracking_number: str = Path(..., description="Carrier tracking number"),
    db: AsyncSession = Depends(get_db)
):
    return await track_by_tracking_number(tracking_number=tracking_number, db=db)


# ==========================================================================
# Delivery Scheduling Endpoints
# ==========================================================================

@router.get(
    "/shipments/by-delivery-form/{delivery_form_id}",
    response_model=List[ShipmentResponse],
    summary="Get shipments by delivery form",
    description="Get all shipments associated with a delivery form."
)
async def get_shipments_by_delivery_form(
    delivery_form_id: int = Path(..., description="Delivery form ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get all shipments for a delivery form."""
    service = get_shipment_service(db)
    shipments = await service.get_shipments_by_delivery_form(delivery_form_id)
    return shipments


@router.get(
    "/shipments/pending-deliveries",
    response_model=List[ShipmentResponse],
    summary="Get pending deliveries",
    description="Get shipments with estimated delivery within the specified number of days."
)
async def get_pending_deliveries(
    days_ahead: int = Query(7, ge=1, le=90, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipments with estimated delivery within the next N days."""
    service = get_shipment_service(db)
    return await service.get_pending_deliveries(days_ahead)


@router.get(
    "/shipments/overdue",
    response_model=List[ShipmentResponse],
    summary="Get overdue shipments",
    description="Get shipments that are past their estimated delivery date but not yet delivered."
)
async def get_overdue_shipments(
    db: AsyncSession = Depends(get_db)
):
    """Get overdue shipments."""
    service = get_shipment_service(db)
    return await service.get_overdue_shipments()


@router.get(
    "/shipments/by-status/{status_id}",
    response_model=List[ShipmentResponse],
    summary="Get shipments by status",
    description="Get shipments filtered by status."
)
async def get_shipments_by_status(
    status_id: int = Path(..., description="Status ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipments by status."""
    service = get_shipment_service(db)
    return await service.get_shipments_by_status(status_id, limit)


# ==========================================================================
# Statistics Endpoints
# ==========================================================================

@router.get(
    "/statistics",
    response_model=dict,
    summary="Get shipment statistics",
    description="Get overall shipment statistics with optional date filters."
)
async def get_statistics(
    from_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    to_date: Optional[datetime] = Query(None, description="End date for statistics"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipment statistics (frontend-friendly)."""
    service = get_shipment_service(db)
    return await service.get_statistics(from_date, to_date)


@router.get(
    "/stats/summary",
    response_model=dict,
    summary="Get shipment statistics (legacy)",
    description="Get overall shipment statistics with optional date filters."
)
async def get_statistics_legacy(
    start_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    end_date: Optional[datetime] = Query(None, description="End date for statistics"),
    db: AsyncSession = Depends(get_db)
):
    """Get shipment statistics (legacy wrapper)."""
    service = get_shipment_service(db)
    stats = await service.get_statistics(start_date, end_date)
    return {
        "success": True,
        "statistics": stats,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }


@router.get(
    "/stats/carrier/{carrier_id}",
    response_model=dict,
    summary="Get carrier statistics",
    description="Get statistics for a specific carrier."
)
async def get_carrier_statistics(
    carrier_id: int = Path(..., description="Carrier ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    end_date: Optional[datetime] = Query(None, description="End date for statistics"),
    db: AsyncSession = Depends(get_db)
):
    """Get carrier statistics."""
    service = get_shipment_service(db)
    stats = await service.get_carrier_statistics(carrier_id, start_date, end_date)
    return {
        "success": True,
        "statistics": stats,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }


# ==========================================================================
# Utility Endpoints
# ==========================================================================

@router.get(
    "/statuses/list",
    response_model=List[dict],
    summary="Get shipment statuses",
    description="Get list of available shipment statuses."
)
async def get_shipment_statuses():
    """Get available shipment statuses."""
    return [
        {"id": 1, "value": "PENDING", "label": "Pending", "description": "Shipment is awaiting pickup"},
        {"id": 2, "value": "IN_TRANSIT", "label": "In Transit", "description": "Shipment is on the way"},
        {"id": 3, "value": "DELIVERED", "label": "Delivered", "description": "Shipment has been delivered"},
        {"id": 4, "value": "EXCEPTION", "label": "Exception", "description": "Delivery exception occurred"},
        {"id": 5, "value": "RETURNED", "label": "Returned", "description": "Shipment was returned"},
        {"id": 6, "value": "CANCELLED", "label": "Cancelled", "description": "Shipment was cancelled"}
    ]


# ==========================================================================
# Carrier Endpoints
# ==========================================================================

@router.get(
    "/carriers",
    response_model=List[CarrierListItemResponse],
    summary="Get carriers",
    description="Get list of available carriers (mapped to suppliers)."
)
async def get_carriers(
    active_only: bool = Query(True, description="Only return active carriers"),
    db: AsyncSession = Depends(get_db)
):
    service = get_shipment_service(db)
    return await service.get_carriers(active_only)


@router.get(
    "/carriers/{carrier_id}",
    response_model=CarrierResponse,
    summary="Get carrier details",
    description="Get carrier details by ID."
)
async def get_carrier(
    carrier_id: int = Path(..., description="Carrier ID"),
    db: AsyncSession = Depends(get_db)
):
    service = get_shipment_service(db)
    return await service.get_carrier(carrier_id)

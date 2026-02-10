"""
Delivery API Router.

Provides REST API endpoints for:
- Delivery form CRUD operations
- Delivery form line management
- Delivery status management (ship, deliver)
- Delivery search and lookup
"""
import asyncio
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, desc, asc
from pydantic import BaseModel, Field, ConfigDict

from app.database import get_db
from app.dependencies import get_current_user
from app.services.cache_service import cache_service, CacheTTL, CacheKeys
from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.models.client import Client
from app.models.order import ClientOrder, ClientOrderLine
from app.schemas.document import SendDocumentRequest, SendDocumentResponse
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
# Create Delivery Request Schema (camelCase from frontend)
# ==========================================================================

class CreateDeliveryLineRequest(BaseModel):
    """Line item for delivery creation from frontend."""
    model_config = ConfigDict(populate_by_name=True)

    order_line_id: Optional[int] = Field(None, alias="orderLineId")
    product_id: Optional[int] = Field(None, alias="productId")
    description: Optional[str] = Field(None)
    quantity: float = Field(0)


class CreateDeliveryRequest(BaseModel):
    """Request to create a new delivery form from frontend."""
    model_config = ConfigDict(populate_by_name=True)

    order_id: int = Field(..., alias="orderId")
    client_id: int = Field(..., alias="clientId")
    society_id: Optional[int] = Field(None, alias="societyId")
    expected_delivery_date: Optional[str] = Field(None, alias="expectedDeliveryDate")
    delivery_address: Optional[str] = Field(None, alias="deliveryAddress")
    delivery_address2: Optional[str] = Field(None, alias="deliveryAddress2")
    delivery_city: Optional[str] = Field(None, alias="deliveryCity")
    delivery_postcode: Optional[str] = Field(None, alias="deliveryPostcode")
    delivery_country: Optional[str] = Field(None, alias="deliveryCountry")
    internal_notes: Optional[str] = Field(None, alias="internalNotes")
    delivery_notes: Optional[str] = Field(None, alias="deliveryNotes")
    lines: List[CreateDeliveryLineRequest] = Field(default_factory=list)


# ==========================================================================
# Sync Database Helpers
# ==========================================================================


def _generate_delivery_code(db: Session) -> str:
    """Generate unique delivery form reference code."""
    year = datetime.utcnow().year
    max_id = db.execute(select(func.max(DeliveryForm.dfo_id))).scalar() or 0
    return f"DFO-{year}-{int(max_id) + 1:05d}"


def _sync_create_delivery(
    db: Session,
    data: CreateDeliveryRequest,
    current_user: Optional[Any] = None,
):
    """Sync helper to create a new delivery form with optional lines."""
    now = datetime.utcnow()
    code = _generate_delivery_code(db)

    # Resolve delivery date
    delivery_date = now
    if data.expected_delivery_date:
        try:
            delivery_date = datetime.fromisoformat(
                data.expected_delivery_date
                .replace("Z", "+00:00")
                .replace("T", " ")
                .split("+")[0]
            )
        except (ValueError, TypeError):
            delivery_date = now

    # Get creator user ID
    creator_id = 1  # default fallback
    if current_user:
        creator_id = (
            getattr(current_user, "usr_id", None)
            or getattr(current_user, "id", None)
            or 1
        )

    # Resolve society_id from order if not provided
    society_id = data.society_id
    if not society_id:
        order = db.get(ClientOrder, data.order_id)
        if order:
            society_id = order.soc_id
        else:
            society_id = 1  # fallback

    delivery = DeliveryForm(
        dfo_code=code,
        dfo_d_creation=now,
        dfo_d_update=now,
        dfo_d_delivery=delivery_date,
        cod_id=data.order_id,
        cli_id=data.client_id,
        soc_id=society_id,
        usr_creator_id=creator_id,
        dfo_deliveried=False,
        dfo_dlv_cco_address1=data.delivery_address,
        dfo_dlv_cco_address2=data.delivery_address2,
        dfo_dlv_cco_city=data.delivery_city,
        dfo_dlv_cco_postcode=data.delivery_postcode,
        dfo_dlv_cco_country=data.delivery_country,
        dfo_inter_comment=data.internal_notes,
        dfo_delivery_comment=data.delivery_notes,
    )
    db.add(delivery)
    db.flush()

    # Create lines if provided
    for line_data in data.lines:
        if line_data.quantity and line_data.quantity > 0:
            line = DeliveryFormLine(
                dfo_id=delivery.dfo_id,
                col_id=line_data.order_line_id,
                dfl_description=line_data.description,
                dfl_quantity=Decimal(str(line_data.quantity)),
            )
            db.add(line)

    db.commit()

    # Return the created delivery using the existing detail function
    return _sync_get_delivery_detail(db, delivery.dfo_id)


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
    status_code=status.HTTP_201_CREATED,
    summary="Create a new delivery form",
    description="""
    Create a new delivery form with optional lines.

    Accepts camelCase fields from frontend:
    - orderId (required): Order ID
    - clientId (required): Client ID
    - societyId (required): Society ID
    - expectedDeliveryDate: Delivery date string
    - deliveryAddress, deliveryCity, etc.: Address fields
    - lines: Array of line items with orderLineId, quantity, description
    """
)
async def create_delivery(
    data: CreateDeliveryRequest,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    """Create a new delivery form."""
    result = await asyncio.to_thread(_sync_create_delivery, db, data, current_user)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create delivery form"
        )
    # Invalidate list caches (new record affects all lists)
    await cache_service.invalidate_entity_lists(CacheKeys.DELIVERY)
    return result


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
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
    db: Session = Depends(get_db)
):
    """Search and list delivery forms with pagination. Cached until data changes."""
    # Build cache params
    cache_params = {
        "page": page, "page_size": page_size, "search": search,
        "client_id": client_id, "sort_by": sort_by, "sort_order": sort_order
    }

    # Try cache first
    if not bypass_cache:
        cached = await cache_service.get_list(CacheKeys.DELIVERY, cache_params)
        if cached is not None:
            return cached

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

    result = {
        "success": True,
        "data": items,
        "page": page,
        "pageSize": page_size,
        "totalCount": total,
        "totalPages": total_pages,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }

    # Cache the result (invalidated when any delivery changes)
    await cache_service.set_list(CacheKeys.DELIVERY, cache_params, result)

    return result


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


def _sync_get_delivery_detail(db: Session, delivery_id: int):
    """Sync helper to get delivery detail with lines, returning camelCase dict."""
    # Fetch delivery header with client + order joins
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
            DeliveryForm.dfo_header_text,
            DeliveryForm.dfo_footer_text,
            DeliveryForm.dfo_delivery_comment,
            DeliveryForm.dfo_dlv_cco_address1,
            DeliveryForm.dfo_dlv_cco_address2,
            DeliveryForm.dfo_dlv_cco_city,
            DeliveryForm.dfo_dlv_cco_postcode,
            DeliveryForm.dfo_dlv_cco_country,
            DeliveryForm.dfo_dlv_cco_firstname,
            DeliveryForm.dfo_dlv_cco_lastname,
            DeliveryForm.dfo_dlv_cco_tel1,
            DeliveryForm.dfo_dlv_cco_email,
            Client.cli_company_name,
            ClientOrder.cod_code.label("order_code"),
        )
        .outerjoin(Client, DeliveryForm.cli_id == Client.cli_id)
        .outerjoin(ClientOrder, DeliveryForm.cod_id == ClientOrder.cod_id)
        .where(DeliveryForm.dfo_id == delivery_id)
    )
    result = db.execute(query)
    row = result.first()
    if not row:
        return None

    # Fetch delivery lines with order line info for product name/qty
    lines_query = (
        select(
            DeliveryFormLine.dfl_id,
            DeliveryFormLine.dfl_description,
            DeliveryFormLine.dfl_quantity,
            DeliveryFormLine.col_id,
            ClientOrderLine.col_prd_name,
            ClientOrderLine.col_ref,
            ClientOrderLine.col_quantity.label("ordered_quantity"),
        )
        .outerjoin(ClientOrderLine, DeliveryFormLine.col_id == ClientOrderLine.col_id)
        .where(DeliveryFormLine.dfo_id == delivery_id)
    )
    lines_result = db.execute(lines_query)
    line_rows = lines_result.all()

    # Build shipping address
    addr_parts = []
    if row.dfo_dlv_cco_address1:
        addr_parts.append(row.dfo_dlv_cco_address1)
    if row.dfo_dlv_cco_address2:
        addr_parts.append(row.dfo_dlv_cco_address2)
    if row.dfo_dlv_cco_postcode:
        addr_parts.append(row.dfo_dlv_cco_postcode)
    if row.dfo_dlv_cco_city:
        addr_parts.append(row.dfo_dlv_cco_city)
    if row.dfo_dlv_cco_country:
        addr_parts.append(row.dfo_dlv_cco_country)
    shipping_address = ", ".join(addr_parts) if addr_parts else None

    # Build lines list
    lines = []
    for l in line_rows:
        lines.append({
            "id": l.dfl_id,
            "productName": l.col_prd_name or l.dfl_description or "",
            "productReference": l.col_ref or "",
            "description": l.dfl_description or "",
            "orderedQuantity": float(l.ordered_quantity or 0),
            "deliveredQuantity": float(l.dfl_quantity or 0),
        })

    return {
        "id": row.dfo_id,
        "reference": row.dfo_code or "",
        "clientId": row.cli_id,
        "clientName": row.cli_company_name or "",
        "orderId": row.cod_id,
        "orderReference": row.order_code or "",
        "scheduledDate": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery else None,
        "deliveryDate": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery and row.dfo_deliveried else None,
        "createdAt": row.dfo_d_creation.isoformat() if row.dfo_d_creation else None,
        "statusName": "Delivered" if row.dfo_deliveried else "Pending",
        "shippingAddress": shipping_address,
        "contactName": " ".join(filter(None, [row.dfo_dlv_cco_firstname, row.dfo_dlv_cco_lastname])) or None,
        "contactPhone": row.dfo_dlv_cco_tel1,
        "contactEmail": row.dfo_dlv_cco_email,
        "carrierName": None,
        "trackingNumber": None,
        "weight": None,
        "packages": None,
        "shippedAt": None,
        "deliveredAt": row.dfo_d_delivery.isoformat() if row.dfo_d_delivery and row.dfo_deliveried else None,
        "comment": row.dfo_delivery_comment or "",
        "headerText": row.dfo_header_text or "",
        "footerText": row.dfo_footer_text or "",
        "lines": lines,
    }


@router.get(
    "/{delivery_id}",
    summary="Get delivery form by ID",
    description="Get detailed information about a specific delivery form including its lines and resolved lookup names. Cached until modified."
)
async def get_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    db: Session = Depends(get_db),
    bypass_cache: bool = Query(False, description="Set to true to bypass cache"),
):
    """Get a specific delivery form by ID with resolved lookup names. Cached until modified."""
    # Try cache first (unless bypassing)
    if not bypass_cache:
        cached = await cache_service.get_detail(CacheKeys.DELIVERY, delivery_id)
        if cached is not None:
            return cached

    # Fetch from database
    result = await asyncio.to_thread(_sync_get_delivery_detail, db, delivery_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Delivery {delivery_id} not found")

    # Cache the result indefinitely (invalidated on update/delete)
    await cache_service.set_detail(CacheKeys.DELIVERY, delivery_id, result)

    return result


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
        result = await service.update_delivery(delivery_id, data)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.DELIVERY, delivery_id)
        return result
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
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.DELIVERY, delivery_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)


# ==========================================================================
# Delivery PDF & Send Endpoints
# ==========================================================================


@router.get(
    "/{delivery_id}/pdf",
    summary="Download delivery PDF",
    description="Generate and download PDF for a delivery form.",
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF file"},
        404: {"description": "Delivery not found"},
    }
)
async def download_delivery_pdf(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    db: Session = Depends(get_db)
):
    """Generate and return PDF for this delivery form."""
    import io
    from fastapi.responses import StreamingResponse
    from app.services.pdf_service import TemplatePDFService

    # Get delivery detail for context
    delivery_data = await asyncio.to_thread(_sync_get_delivery_detail, db, delivery_id)
    if not delivery_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Delivery {delivery_id} not found"
        )

    reference = delivery_data.get("reference", f"delivery-{delivery_id}")
    filename = f"{reference}.pdf"

    # Generate PDF using template service
    template_pdf = TemplatePDFService()
    pdf_content = template_pdf.generate_pdf(
        template_name="deliveries/delivery.html",
        context=delivery_data,
    )

    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_content)),
        }
    )


@router.post(
    "/{delivery_id}/send",
    summary="Send delivery form via email",
    description="Generate PDF and send delivery form via email to the specified recipient.",
    responses={
        200: {"description": "Delivery form sent successfully"},
        404: {"description": "Delivery not found"},
    }
)
async def send_delivery(
    delivery_id: int = Path(..., gt=0, description="Delivery form ID"),
    request: SendDocumentRequest = ...,
    db: Session = Depends(get_db)
):
    """Send delivery form via email with PDF attachment."""
    from app.services.email_service import EmailService
    from app.schemas.email_log import EmailLogCreate

    # Get delivery detail
    delivery_data = await asyncio.to_thread(_sync_get_delivery_detail, db, delivery_id)
    if not delivery_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Delivery {delivery_id} not found"
        )

    reference = delivery_data.get("reference", f"Delivery-{delivery_id}")
    client_name = delivery_data.get("clientName", "")

    # Build email
    subject = request.subject or f"Delivery Note {reference}"
    body = request.body or f"Please find attached delivery note {reference}."

    # Create email log and send
    try:
        email_service = EmailService(db)
        email_log_data = EmailLogCreate(
            recipient_email=request.to_email,
            recipient_name=client_name,
            subject=subject,
            body=body,
            entity_type="DELIVERY",
            entity_id=delivery_id,
        )
        email_log = await asyncio.to_thread(
            email_service.create_email_log, email_log_data
        )
        await asyncio.to_thread(email_service.send_email, email_log)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send delivery email: {e}")

    return SendDocumentResponse(
        success=True,
        message="Delivery note sent successfully",
        document_id=delivery_id,
        document_type="delivery",
        sent_to=request.to_email,
        sent_at=datetime.now(),
    )


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
        result = await service.create_line(delivery_id, data)
        # Invalidate cache (detail + all list caches)
        await cache_service.invalidate_entity(CacheKeys.DELIVERY, delivery_id)
        return result
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
    db: Session = Depends(get_db),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Update an existing delivery form line."""
    try:
        # Get parent delivery_id for cache invalidation
        line = db.get(DeliveryFormLine, line_id)
        delivery_id = line.dfo_id if line else None

        result = await service.update_line(line_id, data)

        # Invalidate cache (detail + all list caches)
        if delivery_id:
            await cache_service.invalidate_entity(CacheKeys.DELIVERY, delivery_id)
        return result
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
    db: Session = Depends(get_db),
    service: DeliveryService = Depends(get_delivery_service)
):
    """Delete a delivery form line."""
    try:
        # Get parent delivery_id before deletion
        line = db.get(DeliveryFormLine, line_id)
        delivery_id = line.dfo_id if line else None

        await service.delete_line(line_id)

        # Invalidate cache (detail + all list caches)
        if delivery_id:
            await cache_service.invalidate_entity(CacheKeys.DELIVERY, delivery_id)
    except DeliveryServiceError as e:
        raise handle_delivery_error(e)

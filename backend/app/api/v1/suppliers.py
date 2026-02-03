"""
Supplier API Router.

Provides REST API endpoints for:
- Supplier CRUD operations
- Supplier search and filtering
- Supplier listing with pagination
- CSV export
- Supplier contact management
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.services.supplier_service import (
    SupplierService,
    get_supplier_service,
    SupplierServiceError,
    SupplierNotFoundError,
    SupplierReferenceNotFoundError,
    SupplierValidationError,
    DuplicateSupplierError,
    SupplierContactNotFoundError
)
from app.services.supplier_product_price_service import (
    SupplierProductPriceService,
    get_supplier_product_price_service,
    SupplierProductPriceServiceError,
    SupplierProductPriceNotFoundError,
    NoBestPriceFoundError,
)
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    SupplierListResponse, SupplierListPaginatedResponse,
    SupplierAPIResponse, SupplierErrorResponse, SupplierSearchParams,
    SupplierWithContactsResponse, SupplierDetailResponse,
    SupplierContactBase, SupplierContactCreate, SupplierContactUpdate,
    SupplierContactResponse, SupplierContactListResponse,
    SupplierContactListPaginatedResponse
)
from app.schemas.supplier_product_price import (
    SupplierProductPriceCreate, SupplierProductPriceUpdate, SupplierProductPriceResponse,
    SupplierProductPriceListResponse, SupplierProductPriceListPaginatedResponse,
    SupplierProductPriceAPIResponse, SupplierProductListPaginatedResponse,
    SupplierProductResponse, BestSupplierPriceResponse
)

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_supplier_error(error: SupplierServiceError) -> HTTPException:
    """Convert SupplierServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, (SupplierNotFoundError, SupplierReferenceNotFoundError, SupplierContactNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, SupplierValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, DuplicateSupplierError):
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


def handle_price_error(error: SupplierProductPriceServiceError) -> HTTPException:
    """Convert SupplierProductPriceServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, SupplierProductPriceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, NoBestPriceFoundError):
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
# Supplier CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier",
    description="""
    Create a new supplier in the system.

    A unique reference number will be automatically generated.
    The company name is required, and email must be unique if provided.
    """
)
async def create_supplier(
    data: SupplierCreate,
    service: SupplierService = Depends(get_supplier_service)
):
    """Create a new supplier."""
    try:
        supplier = await service.create_supplier(data)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.get(
    "",
    response_model=SupplierListPaginatedResponse,
    summary="List all suppliers",
    description="""
    Get a paginated list of all suppliers with optional filtering.

    Supports filtering by:
    - Text search (company name, reference, email, SIREN, SIRET)
    - Society ID
    - Supplier type ID
    - Payment condition ID
    - Payment mode ID
    - Currency ID
    - Active status
    - Blocked status
    - Country
    - City
    """
)
async def list_suppliers(
    # Support both page/pageSize (frontend) and skip/limit (legacy)
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    skip: Optional[int] = Query(None, ge=0, description="Number of records to skip (legacy)"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Maximum records to return (legacy)"),
    sortBy: Optional[str] = Query(None, description="Field to sort by"),
    sortOrder: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    supplier_type_id: Optional[int] = Query(None, description="Filter by supplier type ID"),
    payment_condition_id: Optional[int] = Query(None, description="Filter by payment condition ID"),
    payment_mode_id: Optional[int] = Query(None, description="Filter by payment mode ID"),
    currency_id: Optional[int] = Query(None, description="Filter by currency ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_blocked: Optional[bool] = Query(None, description="Filter by blocked status"),
    country: Optional[str] = Query(None, max_length=200, description="Filter by country"),
    city: Optional[str] = Query(None, max_length=200, description="Filter by city"),
    service: SupplierService = Depends(get_supplier_service)
):
    """List all suppliers with pagination and filtering."""
    # Convert page/pageSize to skip/limit if not using legacy params
    actual_skip = skip if skip is not None else (page - 1) * pageSize
    actual_limit = limit if limit is not None else pageSize
    
    search_params = SupplierSearchParams(
        search=search,
        society_id=society_id,
        supplier_type_id=supplier_type_id,
        payment_condition_id=payment_condition_id,
        payment_mode_id=payment_mode_id,
        currency_id=currency_id,
        is_active=is_active,
        is_blocked=is_blocked,
        country=country,
        city=city
    )

    suppliers, total = await service.list_suppliers(
        skip=actual_skip,
        limit=actual_limit,
        search_params=search_params
    )

    # Calculate pagination info
    total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1

    return SupplierListPaginatedResponse(
        success=True,
        data=[SupplierListResponse.model_validate(s) for s in suppliers],
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=has_next,
        hasPreviousPage=has_previous
    )


@router.get(
    "/export",
    summary="Export suppliers to CSV",
    description="""
    Export suppliers to CSV format.

    Supports the same filtering options as the list endpoint.
    Returns a CSV file download with all matching suppliers.
    """,
    responses={
        200: {
            "content": {"text/csv": {}},
            "description": "CSV file with supplier data"
        }
    }
)
async def export_suppliers_csv(
    search: Optional[str] = Query(None, max_length=100, description="Search term"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    supplier_type_id: Optional[int] = Query(None, description="Filter by supplier type ID"),
    payment_condition_id: Optional[int] = Query(None, description="Filter by payment condition ID"),
    payment_mode_id: Optional[int] = Query(None, description="Filter by payment mode ID"),
    currency_id: Optional[int] = Query(None, description="Filter by currency ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_blocked: Optional[bool] = Query(None, description="Filter by blocked status"),
    country: Optional[str] = Query(None, max_length=200, description="Filter by country"),
    city: Optional[str] = Query(None, max_length=200, description="Filter by city"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Export suppliers to CSV file."""
    search_params = SupplierSearchParams(
        search=search,
        society_id=society_id,
        supplier_type_id=supplier_type_id,
        payment_condition_id=payment_condition_id,
        payment_mode_id=payment_mode_id,
        currency_id=currency_id,
        is_active=is_active,
        is_blocked=is_blocked,
        country=country,
        city=city
    )

    try:
        csv_content, count = await service.export_suppliers_csv(search_params)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"suppliers_export_{timestamp}.csv"

        # Return CSV as streaming response
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Total-Count": str(count)
            }
        )
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.get(
    "/{supplier_id}",
    response_model=SupplierDetailResponse,
    summary="Get supplier by ID",
    description="Get detailed information about a specific supplier with resolved lookup names."
)
async def get_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Get a specific supplier by ID with resolved lookup names."""
    try:
        supplier_detail = await service.get_supplier_detail(supplier_id)
        return supplier_detail
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.get(
    "/by-reference/{reference}",
    response_model=SupplierResponse,
    summary="Get supplier by reference",
    description="Get supplier by its unique reference number."
)
async def get_supplier_by_reference(
    reference: str = Path(..., min_length=1, max_length=50, description="Supplier reference"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Get a specific supplier by reference."""
    try:
        supplier = await service.get_supplier_by_reference(reference)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse,
    summary="Update a supplier",
    description="Update an existing supplier's information."
)
async def update_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    data: SupplierUpdate = ...,
    service: SupplierService = Depends(get_supplier_service)
):
    """Update an existing supplier."""
    try:
        supplier = await service.update_supplier(supplier_id, data)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a supplier (soft delete)",
    description="""
    Soft delete a supplier by ID.

    This sets the supplier's is_active flag to False.
    The supplier record is preserved for historical purposes.
    """
)
async def delete_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Soft delete a supplier."""
    try:
        await service.delete_supplier(supplier_id)
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.delete(
    "/{supplier_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a supplier",
    description="""
    Permanently delete a supplier by ID.

    WARNING: This cannot be undone.
    Will also delete all related contacts.
    """
)
async def hard_delete_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Permanently delete a supplier."""
    try:
        await service.hard_delete_supplier(supplier_id)
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


# ==========================================================================
# Additional Supplier Endpoints
# ==========================================================================

@router.get(
    "/{supplier_id}/details",
    response_model=SupplierWithContactsResponse,
    summary="Get supplier with all related data",
    description="Get supplier with all related data (contacts) loaded."
)
async def get_supplier_details(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Get a supplier with all related data."""
    try:
        supplier = await service.get_supplier_with_contacts(supplier_id)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.patch(
    "/{supplier_id}/activate",
    response_model=SupplierResponse,
    summary="Activate a supplier",
    description="Set a supplier's is_active flag to True."
)
async def activate_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Activate a supplier."""
    try:
        supplier = await service.activate_supplier(supplier_id)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.patch(
    "/{supplier_id}/deactivate",
    response_model=SupplierResponse,
    summary="Deactivate a supplier",
    description="Set a supplier's is_active flag to False."
)
async def deactivate_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Deactivate a supplier."""
    try:
        supplier = await service.deactivate_supplier(supplier_id)
        return supplier
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


# ==========================================================================
# Supplier Contact Endpoints
# ==========================================================================

@router.post(
    "/{supplier_id}/contacts",
    response_model=SupplierContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a contact to a supplier",
    description="""
    Add a new contact to an existing supplier.

    The contact will be associated with the specified supplier.
    """
)
async def create_supplier_contact(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    data: SupplierContactBase = ...,
    service: SupplierService = Depends(get_supplier_service)
):
    """Create a new contact for a supplier."""
    try:
        contact_data = SupplierContactCreate(
            sco_sup_id=supplier_id,
            **data.model_dump()
        )
        contact = await service.create_contact(contact_data)
        return contact
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.get(
    "/{supplier_id}/contacts",
    response_model=SupplierContactListPaginatedResponse,
    summary="List contacts for a supplier",
    description="""
    Get a paginated list of all contacts for a specific supplier.

    Contacts are ordered by primary status (primary first), then by last name.
    """
)
async def list_supplier_contacts(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    service: SupplierService = Depends(get_supplier_service)
):
    """List all contacts for a supplier."""
    try:
        contacts, total = await service.list_contacts(
            supplier_id=supplier_id,
            skip=skip,
            limit=limit
        )
        return SupplierContactListPaginatedResponse(
            items=[SupplierContactListResponse.model_validate(c) for c in contacts],
            total=total,
            skip=skip,
            limit=limit
        )
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.get(
    "/{supplier_id}/contacts/{contact_id}",
    response_model=SupplierContactResponse,
    summary="Get a specific contact",
    description="Get detailed information about a specific contact for a supplier."
)
async def get_supplier_contact(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Get a specific contact for a supplier."""
    try:
        # Verify supplier exists
        await service.get_supplier(supplier_id)
        contact = await service.get_contact(contact_id)
        # Verify contact belongs to supplier
        if contact.sco_sup_id != supplier_id:
            raise SupplierContactNotFoundError(contact_id)
        return contact
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.put(
    "/{supplier_id}/contacts/{contact_id}",
    response_model=SupplierContactResponse,
    summary="Update a contact",
    description="Update an existing contact for a supplier."
)
async def update_supplier_contact(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    data: SupplierContactUpdate = ...,
    service: SupplierService = Depends(get_supplier_service)
):
    """Update a contact for a supplier."""
    try:
        # Verify supplier exists
        await service.get_supplier(supplier_id)
        # Get contact and verify it belongs to supplier
        contact = await service.get_contact(contact_id)
        if contact.sco_sup_id != supplier_id:
            raise SupplierContactNotFoundError(contact_id)
        # Update contact
        contact = await service.update_contact(contact_id, data)
        return contact
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


@router.delete(
    "/{supplier_id}/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a contact",
    description="Permanently delete a contact from a supplier."
)
async def delete_supplier_contact(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    contact_id: int = Path(..., gt=0, description="Contact ID"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Delete a contact from a supplier."""
    try:
        # Verify supplier exists
        await service.get_supplier(supplier_id)
        # Get contact and verify it belongs to supplier
        contact = await service.get_contact(contact_id)
        if contact.sco_sup_id != supplier_id:
            raise SupplierContactNotFoundError(contact_id)
        # Delete contact
        await service.delete_contact(contact_id)
    except SupplierServiceError as e:
        raise handle_supplier_error(e)


# ==========================================================================
# Supplier Product Price Endpoints
# ==========================================================================

@router.post(
    "/{supplier_id}/prices",
    response_model=SupplierProductPriceAPIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a product price for a supplier",
    description="""
    Add a product price entry for a specific supplier.

    This defines the cost of a product from this supplier, including
    supplier's reference, lead time, minimum order quantity, and more.
    """
)
async def create_supplier_price(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    data: SupplierProductPriceCreate = ...,
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Create a new product price for a supplier."""
    try:
        # Ensure supplier_id matches the data
        if data.spp_sup_id != supplier_id:
            data.spp_sup_id = supplier_id
        price = await service.create_price(data)
        return SupplierProductPriceAPIResponse(success=True, data=price)
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.get(
    "/{supplier_id}/prices",
    response_model=SupplierProductPriceListPaginatedResponse,
    summary="List product prices for a supplier",
    description="""
    Get a paginated list of all product prices for a specific supplier.

    Includes product information, currency details, and pricing metadata.
    """
)
async def list_supplier_prices(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    active_only: bool = Query(True, description="Only show active prices"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """List all product prices for a supplier."""
    try:
        skip = (page - 1) * pageSize
        prices, total = await service.list_prices(
            supplier_id=supplier_id,
            skip=skip,
            limit=pageSize,
            product_id=product_id,
            active_only=active_only
        )

        total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
        return SupplierProductPriceListPaginatedResponse(
            success=True,
            data=[SupplierProductPriceListResponse(**p) for p in prices],
            page=page,
            pageSize=pageSize,
            totalCount=total,
            totalPages=total_pages,
            hasNextPage=page < total_pages,
            hasPreviousPage=page > 1
        )
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.get(
    "/{supplier_id}/products",
    response_model=SupplierProductListPaginatedResponse,
    summary="List products supplied by this supplier",
    description="""
    Get a paginated list of all products that this supplier provides.

    This view combines product information with the supplier's pricing details,
    including their reference, cost, lead time, and preferred status.
    """
)
async def list_supplier_products(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search in product name/ref"),
    active_only: bool = Query(True, description="Only show active products"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """List all products supplied by this supplier."""
    try:
        skip = (page - 1) * pageSize
        products, total = await service.list_products(
            supplier_id=supplier_id,
            skip=skip,
            limit=pageSize,
            search=search,
            active_only=active_only
        )

        total_pages = (total + pageSize - 1) // pageSize if pageSize > 0 else 0
        return SupplierProductListPaginatedResponse(
            success=True,
            data=[SupplierProductResponse(**p) for p in products],
            page=page,
            pageSize=pageSize,
            totalCount=total,
            totalPages=total_pages,
            hasNextPage=page < total_pages,
            hasPreviousPage=page > 1
        )
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.get(
    "/{supplier_id}/prices/{price_id}",
    response_model=SupplierProductPriceAPIResponse,
    summary="Get a specific product price",
    description="Get detailed information about a specific product price for a supplier."
)
async def get_supplier_price(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Get a specific product price for a supplier."""
    try:
        price = await service.get_price(price_id)
        # Verify the price belongs to this supplier
        if price.spp_sup_id != supplier_id:
            raise SupplierProductPriceNotFoundError(price_id)
        return SupplierProductPriceAPIResponse(success=True, data=price)
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.put(
    "/{supplier_id}/prices/{price_id}",
    response_model=SupplierProductPriceAPIResponse,
    summary="Update a product price",
    description="Update an existing product price for a supplier."
)
async def update_supplier_price(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    data: SupplierProductPriceUpdate = ...,
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Update a product price for a supplier."""
    try:
        # Verify the price belongs to this supplier
        existing = await service.get_price(price_id)
        if existing.spp_sup_id != supplier_id:
            raise SupplierProductPriceNotFoundError(price_id)
        price = await service.update_price(price_id, data)
        return SupplierProductPriceAPIResponse(success=True, data=price)
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.delete(
    "/{supplier_id}/prices/{price_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product price",
    description="Soft delete a product price (sets is_active to False)."
)
async def delete_supplier_price(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Delete a product price for a supplier."""
    try:
        # Verify the price belongs to this supplier
        existing = await service.get_price(price_id)
        if existing.spp_sup_id != supplier_id:
            raise SupplierProductPriceNotFoundError(price_id)
        await service.delete_price(price_id)
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


@router.patch(
    "/{supplier_id}/prices/{price_id}/preferred",
    response_model=SupplierProductPriceAPIResponse,
    summary="Set as preferred supplier",
    description="""
    Mark this supplier as the preferred supplier for a product.

    This will automatically unset any other preferred supplier for the same product.
    """
)
async def set_preferred_supplier(
    supplier_id: int = Path(..., gt=0, description="Supplier ID"),
    price_id: int = Path(..., gt=0, description="Price ID"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Set a supplier as preferred for a product."""
    try:
        # Verify the price belongs to this supplier
        existing = await service.get_price(price_id)
        if existing.spp_sup_id != supplier_id:
            raise SupplierProductPriceNotFoundError(price_id)
        price = await service.set_preferred(price_id)
        return SupplierProductPriceAPIResponse(success=True, data=price)
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)


# ==========================================================================
# Best Price Endpoint (standalone)
# ==========================================================================

@router.get(
    "/best-price/product/{product_id}",
    response_model=BestSupplierPriceResponse,
    summary="Get best supplier price for a product",
    description="""
    Find the best (preferred or lowest cost) supplier for a specific product.

    Returns the supplier with the best price, considering:
    - Preferred supplier status
    - Priority ranking
    - Unit cost
    - Validity dates
    - Minimum order quantity (if specified)
    """
)
async def get_best_supplier_price(
    product_id: int = Path(..., gt=0, description="Product ID"),
    quantity: Optional[int] = Query(None, ge=1, description="Order quantity for MOQ filtering"),
    service: SupplierProductPriceService = Depends(get_supplier_product_price_service)
):
    """Get the best supplier price for a product."""
    try:
        result = await service.get_best_price(product_id, quantity)
        return result
    except SupplierProductPriceServiceError as e:
        raise handle_price_error(e)

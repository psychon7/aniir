"""
Product API Router.

Provides REST API endpoints for:
- Product CRUD operations
- Product instance management
- Product search and lookup
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.services.product_service import (
    ProductService,
    ProductServiceError,
    ProductNotFoundError,
    ProductInstanceNotFoundError,
    ProductDuplicateReferenceError,
    ProductInstanceDuplicateReferenceError,
    get_product_service
)
from app.schemas.product import (
    ProductCreate, ProductUpdate,
    ProductInstanceCreate, ProductInstanceUpdate,
    ProductSearchParams,
    ProductResponse, ProductWithInstancesResponse,
    ProductDetailResponse,
    ProductListResponse, ProductListPaginatedResponse,
    ProductInstanceResponse, ProductInstanceListResponse,
    ProductAPIResponse, ProductInstanceAPIResponse, ProductErrorResponse
)

router = APIRouter(prefix="/products", tags=["Products"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_product_error(error: ProductServiceError) -> HTTPException:
    """Convert ProductServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "PRODUCT_ERROR"

    if isinstance(error, ProductNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "PRODUCT_NOT_FOUND"
    elif isinstance(error, ProductInstanceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "PRODUCT_INSTANCE_NOT_FOUND"
    elif isinstance(error, ProductDuplicateReferenceError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "PRODUCT_DUPLICATE_REFERENCE"
    elif isinstance(error, ProductInstanceDuplicateReferenceError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "PRODUCT_INSTANCE_DUPLICATE_REFERENCE"

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
# Product CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=ProductWithInstancesResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
    description="""
    Create a new product in the catalog.

    A product requires:
    - Reference code (unique within society)
    - Name
    - Product type ID
    - Society ID

    Optional fields include pricing, dimensions, and specifications.
    """
)
async def create_product(
    data: ProductCreate,
    service: ProductService = Depends(get_product_service)
):
    """Create a new product."""
    try:
        product = await service.create_product(data)
        return product
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.get(
    "",
    response_model=ProductListPaginatedResponse,
    summary="Search and list products",
    description="""
    Search products with optional filters and pagination.

    Supports filtering by:
    - Search term (matches name, reference, code, description)
    - Product type ID
    - Society ID
    - Price range
    """
)
async def search_products(
    search: Optional[str] = Query(None, description="Search term"),
    pty_id: Optional[int] = Query(None, description="Product type ID"),
    soc_id: Optional[int] = Query(None, description="Society ID"),
    categoryId: Optional[int] = Query(None, description="Category ID (unused, reserved)"),
    brandId: Optional[int] = Query(None, description="Brand ID (unused, reserved)"),
    isActive: Optional[bool] = Query(None, description="Active filter (unused, reserved)"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    sortBy: str = Query("name", alias="sortBy", description="Sort field (camelCase)"),
    sortOrder: str = Query("asc", alias="sortOrder", description="Sort order (asc/desc)"),
    service: ProductService = Depends(get_product_service)
):
    """Search and list products with pagination."""
    # Map frontend camelCase sort fields to DB column names
    sort_field_map = {
        "name": "prd_name",
        "reference": "prd_ref",
        "unitPrice": "prd_price",
        "price": "prd_price",
        "code": "prd_code",
        "createdAt": "prd_d_creation",
    }
    db_sort_by = sort_field_map.get(sortBy, sortBy)
    # If the mapped value doesn't start with prd_, it may already be a DB column name
    if not hasattr(Product, db_sort_by):
        db_sort_by = "prd_name"

    skip = (page - 1) * pageSize

    params = ProductSearchParams(
        search=search,
        pty_id=pty_id,
        soc_id=soc_id,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=pageSize,
        sort_by=db_sort_by,
        sort_order=sortOrder
    )

    items, total = await service.search_products(params)

    # items are already enriched ProductListResponse objects from the service
    total_pages = (total + pageSize - 1) // pageSize if total > 0 else 0

    return ProductListPaginatedResponse(
        success=True,
        data=items,
        page=page,
        pageSize=pageSize,
        totalCount=total,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1
    )


@router.get(
    "/lookup",
    response_model=List[dict],
    summary="Get products for lookup/dropdown",
    description="""
    Get a lightweight list of products for dropdown selection.
    Returns ID, reference, name, code, price, and display name.
    """
)
async def get_product_lookup(
    soc_id: int = Query(..., description="Society ID"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: ProductService = Depends(get_product_service)
):
    """Get products for lookup/dropdown."""
    return await service.get_product_lookup(soc_id, search, limit)


@router.get(
    "/by-society/{soc_id}",
    response_model=List[ProductListResponse],
    summary="Get products by society",
    description="Get all products belonging to a specific society."
)
async def get_products_by_society(
    soc_id: int = Path(..., gt=0, description="Society ID"),
    skip: int = Query(0, ge=0, description="Number to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum to return"),
    service: ProductService = Depends(get_product_service)
):
    """Get all products for a society."""
    return await service.get_products_by_society(soc_id, skip, limit)


@router.get(
    "/by-type/{pty_id}",
    response_model=List[ProductListResponse],
    summary="Get products by type",
    description="Get all products of a specific product type."
)
async def get_products_by_type(
    pty_id: int = Path(..., gt=0, description="Product type ID"),
    soc_id: int = Query(..., description="Society ID"),
    skip: int = Query(0, ge=0, description="Number to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum to return"),
    service: ProductService = Depends(get_product_service)
):
    """Get all products of a specific type."""
    return await service.get_products_by_type(pty_id, soc_id, skip, limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Count products",
    description="Get total count of products, optionally filtered by society."
)
async def count_products(
    soc_id: Optional[int] = Query(None, description="Society ID filter"),
    service: ProductService = Depends(get_product_service)
):
    """Get product count."""
    count = await service.count_products(soc_id)
    return {"count": count}


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="Get product by ID",
    description="Get detailed information about a specific product including its instances and resolved lookup names."
)
async def get_product(
    product_id: int = Path(..., gt=0, description="Product ID"),
    service: ProductService = Depends(get_product_service)
):
    """Get a specific product by ID with resolved lookup names."""
    try:
        return await service.get_product_detail(product_id)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.get(
    "/by-ref/{reference}",
    response_model=ProductWithInstancesResponse,
    summary="Get product by reference",
    description="Get a product by its reference code within a society."
)
async def get_product_by_ref(
    reference: str = Path(..., min_length=1, description="Product reference"),
    soc_id: int = Query(..., description="Society ID"),
    service: ProductService = Depends(get_product_service)
):
    """Get a product by reference code."""
    try:
        return await service.get_product_by_ref(reference, soc_id)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.put(
    "/{product_id}",
    response_model=ProductWithInstancesResponse,
    summary="Update a product",
    description="Update an existing product's information."
)
async def update_product(
    product_id: int = Path(..., gt=0, description="Product ID"),
    data: ProductUpdate = ...,
    service: ProductService = Depends(get_product_service)
):
    """Update an existing product."""
    try:
        return await service.update_product(product_id, data)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
    description="""
    Delete a product and all its instances.

    Note: This will also delete all product instances associated with this product.
    """
)
async def delete_product(
    product_id: int = Path(..., gt=0, description="Product ID"),
    service: ProductService = Depends(get_product_service)
):
    """Delete a product."""
    try:
        await service.delete_product(product_id)
    except ProductServiceError as e:
        raise handle_product_error(e)


# ==========================================================================
# Product Instance Endpoints
# ==========================================================================

@router.post(
    "/{product_id}/instances",
    response_model=ProductInstanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product instance",
    description="""
    Create a new instance (variant) for a product.

    Instances represent different configurations of the same product
    (e.g., different colors, sizes).
    """
)
async def create_instance(
    product_id: int = Path(..., gt=0, description="Product ID"),
    data: ProductInstanceCreate = ...,
    service: ProductService = Depends(get_product_service)
):
    """Create a new product instance."""
    data.prd_id = product_id
    try:
        return await service.create_instance(data)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.get(
    "/{product_id}/instances",
    response_model=List[ProductInstanceResponse],
    summary="Get product instances",
    description="Get all instances (variants) for a product."
)
async def get_instances_by_product(
    product_id: int = Path(..., gt=0, description="Product ID"),
    service: ProductService = Depends(get_product_service)
):
    """Get all instances for a product."""
    try:
        return await service.get_instances_by_product(product_id)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.get(
    "/{product_id}/instances/lookup",
    response_model=List[dict],
    summary="Get instances for lookup",
    description="Get a lightweight list of product instances for dropdown selection."
)
async def get_instance_lookup(
    product_id: int = Path(..., gt=0, description="Product ID"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: ProductService = Depends(get_product_service)
):
    """Get product instances for lookup/dropdown."""
    return await service.get_instance_lookup(product_id, search, limit)


@router.get(
    "/instances/{instance_id}",
    response_model=ProductInstanceResponse,
    summary="Get instance by ID",
    description="Get detailed information about a specific product instance."
)
async def get_instance(
    instance_id: int = Path(..., gt=0, description="Instance ID"),
    service: ProductService = Depends(get_product_service)
):
    """Get a specific product instance by ID."""
    try:
        return await service.get_instance(instance_id)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.put(
    "/instances/{instance_id}",
    response_model=ProductInstanceResponse,
    summary="Update a product instance",
    description="Update an existing product instance's information."
)
async def update_instance(
    instance_id: int = Path(..., gt=0, description="Instance ID"),
    data: ProductInstanceUpdate = ...,
    service: ProductService = Depends(get_product_service)
):
    """Update an existing product instance."""
    try:
        return await service.update_instance(instance_id, data)
    except ProductServiceError as e:
        raise handle_product_error(e)


@router.delete(
    "/instances/{instance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product instance",
    description="Delete a specific product instance."
)
async def delete_instance(
    instance_id: int = Path(..., gt=0, description="Instance ID"),
    service: ProductService = Depends(get_product_service)
):
    """Delete a product instance."""
    try:
        await service.delete_instance(instance_id)
    except ProductServiceError as e:
        raise handle_product_error(e)

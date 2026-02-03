"""
Brand API Router.

Provides REST API endpoints for brand management:
- List brands with filtering and pagination
- Get brand by ID
- Create new brand
- Update existing brand
- Delete brand (soft delete)
- Lookup for dropdowns
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.brand_service import (
    BrandService,
    BrandServiceError,
    BrandNotFoundError,
    BrandDuplicateCodeError,
    get_brand_service,
    async_get_brand,
    async_get_brands,
    async_get_lookup,
    async_search_brands,
    async_create_brand,
    async_update_brand,
    async_delete_brand,
)
from app.schemas.brand import (
    BrandCreate,
    BrandUpdate,
    BrandResponse,
    BrandListResponse,
    BrandAPIResponse,
    BrandLookupItem,
)


router = APIRouter(prefix="/brands", tags=["Brands"])


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_brand_error(error: BrandServiceError) -> HTTPException:
    """Convert BrandServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "BRAND_ERROR"

    if isinstance(error, BrandNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "BRAND_NOT_FOUND"
    elif isinstance(error, BrandDuplicateCodeError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "BRAND_DUPLICATE_CODE"

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
# Brand Endpoints
# ==========================================================================

@router.get(
    "",
    response_model=BrandListResponse,
    summary="List all brands",
    description="Get a paginated list of brands with optional filtering."
)
async def list_brands(
    soc_id: Optional[int] = Query(None, description="Filter by society ID"),
    search: Optional[str] = Query(None, description="Search by name or code"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("bra_name", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order (asc/desc)"),
    service: BrandService = Depends(get_brand_service)
):
    """List brands with pagination and filtering."""
    skip = (page - 1) * page_size

    brands, total = await async_get_brands(
        service,
        soc_id=soc_id,
        search=search,
        is_active=is_active,
        skip=skip,
        limit=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return BrandListResponse(
        success=True,
        data=[BrandResponse.model_validate(b) for b in brands],
        page=page,
        pageSize=page_size,
        totalCount=total,
        totalPages=total_pages
    )


@router.get(
    "/lookup",
    response_model=dict,
    summary="Get brands for lookup",
    description="Get active brands for dropdown/select inputs."
)
async def get_brands_lookup(
    soc_id: Optional[int] = Query(None, description="Filter by society ID"),
    service: BrandService = Depends(get_brand_service)
):
    """Get brands for lookup/dropdown."""
    items = await async_get_lookup(service, soc_id)
    return {"success": True, "data": items}


@router.get(
    "/search",
    response_model=dict,
    summary="Search brands",
    description="Search brands by name or code."
)
async def search_brands(
    q: str = Query(..., min_length=1, description="Search query"),
    soc_id: Optional[int] = Query(None, description="Filter by society ID"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    service: BrandService = Depends(get_brand_service)
):
    """Search brands by name or code."""
    brands = await async_search_brands(service, q, soc_id, limit)
    return {
        "success": True,
        "data": [BrandResponse.model_validate(b) for b in brands]
    }


@router.get(
    "/{brand_id}",
    response_model=BrandAPIResponse,
    summary="Get brand by ID",
    description="Get detailed information about a specific brand."
)
async def get_brand(
    brand_id: int = Path(..., gt=0, description="Brand ID"),
    service: BrandService = Depends(get_brand_service)
):
    """Get a specific brand by ID."""
    try:
        brand = await async_get_brand(service, brand_id)
        return BrandAPIResponse(
            success=True,
            data=BrandResponse.model_validate(brand)
        )
    except BrandServiceError as e:
        raise handle_brand_error(e)


@router.post(
    "",
    response_model=BrandAPIResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new brand",
    description="Create a new brand in the system."
)
async def create_brand(
    data: BrandCreate,
    soc_id: int = Query(..., description="Society ID"),
    service: BrandService = Depends(get_brand_service)
):
    """Create a new brand."""
    try:
        brand = await async_create_brand(service, data, soc_id)
        return BrandAPIResponse(
            success=True,
            data=BrandResponse.model_validate(brand)
        )
    except BrandServiceError as e:
        raise handle_brand_error(e)


@router.put(
    "/{brand_id}",
    response_model=BrandAPIResponse,
    summary="Update a brand",
    description="Update an existing brand's information."
)
async def update_brand(
    brand_id: int = Path(..., gt=0, description="Brand ID"),
    data: BrandUpdate = ...,
    service: BrandService = Depends(get_brand_service)
):
    """Update an existing brand."""
    try:
        brand = await async_update_brand(service, brand_id, data)
        return BrandAPIResponse(
            success=True,
            data=BrandResponse.model_validate(brand)
        )
    except BrandServiceError as e:
        raise handle_brand_error(e)


@router.delete(
    "/{brand_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a brand",
    description="Soft delete a brand (sets inactive)."
)
async def delete_brand(
    brand_id: int = Path(..., gt=0, description="Brand ID"),
    service: BrandService = Depends(get_brand_service)
):
    """Delete (deactivate) a brand."""
    try:
        await async_delete_brand(service, brand_id)
    except BrandServiceError as e:
        raise handle_brand_error(e)

"""
Consignee API Router.

Provides REST API endpoints for:
- Consignee CRUD operations
- Consignee search and filtering
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path

from app.services.consignee_service import (
    ConsigneeService,
    get_consignee_service,
    ConsigneeServiceError,
    ConsigneeNotFoundError,
    ConsigneeValidationError,
)
from app.schemas.consignee import (
    ConsigneeCreate,
    ConsigneeUpdate,
    ConsigneeResponse,
    ConsigneeListResponse,
    ConsigneeListPaginatedResponse,
    ConsigneeSearchParams,
)

router = APIRouter(prefix="/consignees", tags=["Consignees"])


# =============================================================================
# Exception Handler Helper
# =============================================================================

def handle_consignee_error(error: ConsigneeServiceError) -> HTTPException:
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, ConsigneeNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ConsigneeValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details,
            }
        },
    )


# =============================================================================
# Consignee CRUD Endpoints
# =============================================================================

@router.post(
    "",
    response_model=ConsigneeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new consignee",
)
async def create_consignee(
    data: ConsigneeCreate,
    service: ConsigneeService = Depends(get_consignee_service),
):
    try:
        return await service.create_consignee(data)
    except ConsigneeServiceError as e:
        raise handle_consignee_error(e)


@router.get(
    "",
    response_model=ConsigneeListPaginatedResponse,
    summary="List consignees",
)
async def list_consignees(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    pageSize: int = Query(20, ge=1, le=500, alias="pageSize", description="Items per page"),
    skip: Optional[int] = Query(None, ge=0, description="Items to skip"),
    limit: Optional[int] = Query(None, ge=1, le=500, description="Max items"),
    search: Optional[str] = Query(None, description="Search term"),
    soc_id: Optional[int] = Query(None, description="Society ID"),
    con_firstname: Optional[str] = Query(None, description="Name filter"),
    con_comment: Optional[str] = Query(None, description="Comment filter"),
    con_email: Optional[str] = Query(None, description="Email filter"),
    con_postcode: Optional[str] = Query(None, description="Postal code filter"),
    con_city: Optional[str] = Query(None, description="City filter"),
    con_address: Optional[str] = Query(None, description="Address filter"),
    con_company_name: Optional[str] = Query(None, description="Company name filter"),
    con_tel: Optional[str] = Query(None, description="Phone filter"),
    con_is_delivery_adr: Optional[bool] = Query(None, description="Delivery address filter"),
    con_is_invoicing_adr: Optional[bool] = Query(None, description="Invoicing address filter"),
    sort_by: Optional[str] = Query("con_firstname", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order"),
    service: ConsigneeService = Depends(get_consignee_service),
):
    if skip is None:
        skip = (page - 1) * pageSize
        limit = pageSize
    elif limit is None:
        limit = pageSize

    page_size = limit or pageSize
    current_page = page if skip is None else (skip // page_size) + 1

    params = ConsigneeSearchParams(
        search=search,
        soc_id=soc_id,
        con_firstname=con_firstname,
        con_comment=con_comment,
        con_email=con_email,
        con_postcode=con_postcode,
        con_city=con_city,
        con_address=con_address,
        con_company_name=con_company_name,
        con_tel=con_tel,
        con_is_delivery_adr=con_is_delivery_adr,
        con_is_invoicing_adr=con_is_invoicing_adr,
        skip=skip,
        limit=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    try:
        items, total = await service.list_consignees(skip=skip, limit=page_size, search_params=params)
        response_items = [ConsigneeListResponse.model_validate(item) for item in items]
        total_pages = max(1, (total + page_size - 1) // page_size) if page_size else 1
        return ConsigneeListPaginatedResponse(
            data=response_items,
            page=current_page,
            pageSize=page_size,
            totalCount=total,
            totalPages=total_pages,
            hasNextPage=current_page < total_pages,
            hasPreviousPage=current_page > 1,
        )
    except ConsigneeServiceError as e:
        raise handle_consignee_error(e)


@router.get(
    "/{consignee_id}",
    response_model=ConsigneeResponse,
    summary="Get consignee by ID",
)
async def get_consignee(
    consignee_id: int = Path(..., gt=0, description="Consignee ID"),
    service: ConsigneeService = Depends(get_consignee_service),
):
    try:
        return await service.get_consignee(consignee_id)
    except ConsigneeServiceError as e:
        raise handle_consignee_error(e)


@router.put(
    "/{consignee_id}",
    response_model=ConsigneeResponse,
    summary="Update consignee",
)
async def update_consignee(
    consignee_id: int = Path(..., gt=0, description="Consignee ID"),
    data: ConsigneeUpdate = ...,
    service: ConsigneeService = Depends(get_consignee_service),
):
    try:
        return await service.update_consignee(consignee_id, data)
    except ConsigneeServiceError as e:
        raise handle_consignee_error(e)


@router.delete(
    "/{consignee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete consignee",
)
async def delete_consignee(
    consignee_id: int = Path(..., gt=0, description="Consignee ID"),
    service: ConsigneeService = Depends(get_consignee_service),
):
    try:
        await service.delete_consignee(consignee_id)
    except ConsigneeServiceError as e:
        raise handle_consignee_error(e)

"""
Sage X3 Mapping API Router.

Provides comprehensive CRUD endpoints for managing mappings between
ERP entities and Sage X3 codes:
- Customer mappings (ERP clients <-> X3 customer codes)
- Product mappings (ERP products <-> X3 product codes)
- Bulk operations for efficient data management
- Mapping validation and statistics
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.integrations.sage_x3 import X3CustomerMap, X3ProductMap
from app.services.x3_export_service import get_x3_export_service


router = APIRouter(prefix="/x3/mappings", tags=["X3 Mappings"])


# ==========================================================================
# Request/Response Schemas
# ==========================================================================

class X3CustomerMappingCreate(BaseModel):
    """Schema for creating an X3 customer mapping."""
    client_id: int = Field(..., description="ERP client ID to map")
    x3_customer_code: str = Field(..., min_length=1, max_length=20, description="Sage X3 customer code")
    sales_site: str = Field(default="FCY1", max_length=10, description="X3 sales site code")
    is_active: bool = Field(default=True, description="Whether the mapping is active")

    class Config:
        json_schema_extra = {
            "example": {
                "client_id": 123,
                "x3_customer_code": "CUST001",
                "sales_site": "FCY1",
                "is_active": True
            }
        }


class X3CustomerMappingUpdate(BaseModel):
    """Schema for updating an X3 customer mapping."""
    x3_customer_code: Optional[str] = Field(None, min_length=1, max_length=20, description="Sage X3 customer code")
    sales_site: Optional[str] = Field(None, max_length=10, description="X3 sales site code")
    is_active: Optional[bool] = Field(None, description="Whether the mapping is active")


class X3CustomerMappingResponse(BaseModel):
    """Response schema for X3 customer mapping."""
    id: int = Field(..., description="Mapping ID")
    client_id: int = Field(..., description="ERP client ID")
    x3_customer_code: str = Field(..., description="Sage X3 customer code")
    sales_site: str = Field(..., description="X3 sales site code")
    is_active: bool = Field(..., description="Whether the mapping is active")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")
    last_exported_at: Optional[str] = Field(None, description="Last export timestamp")


class X3ProductMappingCreate(BaseModel):
    """Schema for creating an X3 product mapping."""
    product_id: int = Field(..., description="ERP product ID to map")
    x3_product_code: str = Field(..., min_length=1, max_length=20, description="Sage X3 product code")
    tax_code: Optional[str] = Field(None, max_length=10, description="X3 tax code for the product")
    is_active: bool = Field(default=True, description="Whether the mapping is active")

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 456,
                "x3_product_code": "PROD001",
                "tax_code": "VAT20",
                "is_active": True
            }
        }


class X3ProductMappingUpdate(BaseModel):
    """Schema for updating an X3 product mapping."""
    x3_product_code: Optional[str] = Field(None, min_length=1, max_length=20, description="Sage X3 product code")
    tax_code: Optional[str] = Field(None, max_length=10, description="X3 tax code for the product")
    is_active: Optional[bool] = Field(None, description="Whether the mapping is active")


class X3ProductMappingResponse(BaseModel):
    """Response schema for X3 product mapping."""
    id: int = Field(..., description="Mapping ID")
    product_id: int = Field(..., description="ERP product ID")
    x3_product_code: str = Field(..., description="Sage X3 product code")
    tax_code: Optional[str] = Field(None, description="X3 tax code")
    is_active: bool = Field(..., description="Whether the mapping is active")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: Optional[str] = Field(None, description="Last update timestamp")


class X3MappingListResponse(BaseModel):
    """Paginated response for mapping lists."""
    success: bool = True
    items: List[dict] = Field(default_factory=list)
    total: int = Field(..., description="Total number of records")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")


class X3MappingStatsResponse(BaseModel):
    """Statistics response for mappings."""
    success: bool = True
    customer_mappings: dict = Field(default_factory=dict)
    product_mappings: dict = Field(default_factory=dict)


class X3BulkMappingCreate(BaseModel):
    """Schema for bulk creating mappings."""
    mappings: List[dict] = Field(..., description="List of mappings to create")

    class Config:
        json_schema_extra = {
            "example": {
                "mappings": [
                    {"client_id": 1, "x3_customer_code": "CUST001"},
                    {"client_id": 2, "x3_customer_code": "CUST002"}
                ]
            }
        }


class X3BulkMappingResponse(BaseModel):
    """Response for bulk mapping operations."""
    success: bool = True
    created: int = Field(..., description="Number of mappings created")
    failed: int = Field(..., description="Number of mappings that failed")
    errors: List[dict] = Field(default_factory=list, description="Details of failed mappings")


class X3ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    message: str
    details: Optional[dict] = None


# ==========================================================================
# Customer Mapping Endpoints
# ==========================================================================

@router.get(
    "/customers",
    response_model=X3MappingListResponse,
    summary="List customer mappings",
    description="Get a paginated list of customer mappings between ERP and Sage X3."
)
async def list_customer_mappings(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by X3 customer code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """List customer mappings with filtering and pagination."""
    conditions = []

    if is_active is not None:
        conditions.append(X3CustomerMap.x3cm_is_active == is_active)

    if search:
        conditions.append(X3CustomerMap.x3cm_x3_customer_code.ilike(f"%{search}%"))

    # Count total
    count_stmt = select(func.count(X3CustomerMap.x3cm_id))
    if conditions:
        count_stmt = count_stmt.where(and_(*conditions))
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Fetch page
    stmt = select(X3CustomerMap)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.order_by(X3CustomerMap.x3cm_created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    mappings = result.scalars().all()

    items = [
        {
            "id": m.x3cm_id,
            "client_id": m.x3cm_cli_id,
            "x3_customer_code": m.x3cm_x3_customer_code,
            "sales_site": m.x3cm_sales_site,
            "is_active": m.x3cm_is_active,
            "created_at": m.x3cm_created_at.isoformat() if m.x3cm_created_at else None,
            "updated_at": m.x3cm_updated_at.isoformat() if m.x3cm_updated_at else None,
            "last_exported_at": m.x3cm_last_exported_at.isoformat() if m.x3cm_last_exported_at else None
        }
        for m in mappings
    ]

    return X3MappingListResponse(
        success=True,
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0
    )


@router.get(
    "/customers/{mapping_id}",
    response_model=X3CustomerMappingResponse,
    responses={
        200: {"description": "Mapping found"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Get customer mapping by ID"
)
async def get_customer_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get a customer mapping by ID."""
    stmt = select(X3CustomerMap).where(X3CustomerMap.x3cm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Customer mapping {mapping_id} not found"}
        )

    return X3CustomerMappingResponse(
        id=mapping.x3cm_id,
        client_id=mapping.x3cm_cli_id,
        x3_customer_code=mapping.x3cm_x3_customer_code,
        sales_site=mapping.x3cm_sales_site,
        is_active=mapping.x3cm_is_active,
        created_at=mapping.x3cm_created_at.isoformat() if mapping.x3cm_created_at else "",
        updated_at=mapping.x3cm_updated_at.isoformat() if mapping.x3cm_updated_at else None,
        last_exported_at=mapping.x3cm_last_exported_at.isoformat() if mapping.x3cm_last_exported_at else None
    )


@router.get(
    "/customers/by-client/{client_id}",
    response_model=X3CustomerMappingResponse,
    responses={
        200: {"description": "Mapping found"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Get customer mapping by client ID"
)
async def get_customer_mapping_by_client(
    client_id: int = Path(..., description="ERP client ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get a customer mapping by ERP client ID."""
    stmt = select(X3CustomerMap).where(X3CustomerMap.x3cm_cli_id == client_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"No mapping found for client {client_id}"}
        )

    return X3CustomerMappingResponse(
        id=mapping.x3cm_id,
        client_id=mapping.x3cm_cli_id,
        x3_customer_code=mapping.x3cm_x3_customer_code,
        sales_site=mapping.x3cm_sales_site,
        is_active=mapping.x3cm_is_active,
        created_at=mapping.x3cm_created_at.isoformat() if mapping.x3cm_created_at else "",
        updated_at=mapping.x3cm_updated_at.isoformat() if mapping.x3cm_updated_at else None,
        last_exported_at=mapping.x3cm_last_exported_at.isoformat() if mapping.x3cm_last_exported_at else None
    )


@router.post(
    "/customers",
    response_model=X3CustomerMappingResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Mapping created successfully"},
        400: {"model": X3ErrorResponse, "description": "Invalid request"},
        409: {"model": X3ErrorResponse, "description": "Mapping already exists"}
    },
    summary="Create customer mapping",
    description="Create a mapping between an ERP client and a Sage X3 customer code."
)
async def create_customer_mapping(
    request: X3CustomerMappingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new customer mapping."""
    # Check for existing mapping
    existing_stmt = select(X3CustomerMap).where(
        or_(
            X3CustomerMap.x3cm_cli_id == request.client_id,
            X3CustomerMap.x3cm_x3_customer_code == request.x3_customer_code
        )
    )
    existing_result = await db.execute(existing_stmt)
    existing = existing_result.scalar_one_or_none()

    if existing:
        if existing.x3cm_cli_id == request.client_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_CLIENT",
                    "message": f"Client {request.client_id} already has a mapping"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_X3_CODE",
                    "message": f"X3 customer code '{request.x3_customer_code}' is already mapped"
                }
            )

    mapping = X3CustomerMap(
        x3cm_cli_id=request.client_id,
        x3cm_x3_customer_code=request.x3_customer_code,
        x3cm_sales_site=request.sales_site,
        x3cm_is_active=request.is_active
    )
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)

    return X3CustomerMappingResponse(
        id=mapping.x3cm_id,
        client_id=mapping.x3cm_cli_id,
        x3_customer_code=mapping.x3cm_x3_customer_code,
        sales_site=mapping.x3cm_sales_site,
        is_active=mapping.x3cm_is_active,
        created_at=mapping.x3cm_created_at.isoformat() if mapping.x3cm_created_at else "",
        updated_at=None,
        last_exported_at=None
    )


@router.patch(
    "/customers/{mapping_id}",
    response_model=X3CustomerMappingResponse,
    responses={
        200: {"description": "Mapping updated successfully"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"},
        409: {"model": X3ErrorResponse, "description": "X3 code already in use"}
    },
    summary="Update customer mapping"
)
async def update_customer_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    request: X3CustomerMappingUpdate = ...,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing customer mapping."""
    stmt = select(X3CustomerMap).where(X3CustomerMap.x3cm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Customer mapping {mapping_id} not found"}
        )

    # Check for duplicate X3 code if updating
    if request.x3_customer_code and request.x3_customer_code != mapping.x3cm_x3_customer_code:
        dup_stmt = select(X3CustomerMap).where(
            X3CustomerMap.x3cm_x3_customer_code == request.x3_customer_code,
            X3CustomerMap.x3cm_id != mapping_id
        )
        dup_result = await db.execute(dup_stmt)
        if dup_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_X3_CODE",
                    "message": f"X3 customer code '{request.x3_customer_code}' is already in use"
                }
            )
        mapping.x3cm_x3_customer_code = request.x3_customer_code

    if request.sales_site is not None:
        mapping.x3cm_sales_site = request.sales_site

    if request.is_active is not None:
        mapping.x3cm_is_active = request.is_active

    await db.commit()
    await db.refresh(mapping)

    return X3CustomerMappingResponse(
        id=mapping.x3cm_id,
        client_id=mapping.x3cm_cli_id,
        x3_customer_code=mapping.x3cm_x3_customer_code,
        sales_site=mapping.x3cm_sales_site,
        is_active=mapping.x3cm_is_active,
        created_at=mapping.x3cm_created_at.isoformat() if mapping.x3cm_created_at else "",
        updated_at=mapping.x3cm_updated_at.isoformat() if mapping.x3cm_updated_at else None,
        last_exported_at=mapping.x3cm_last_exported_at.isoformat() if mapping.x3cm_last_exported_at else None
    )


@router.delete(
    "/customers/{mapping_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Mapping deleted successfully"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Delete customer mapping"
)
async def delete_customer_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a customer mapping."""
    stmt = select(X3CustomerMap).where(X3CustomerMap.x3cm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Customer mapping {mapping_id} not found"}
        )

    await db.delete(mapping)
    await db.commit()


# ==========================================================================
# Product Mapping Endpoints
# ==========================================================================

@router.get(
    "/products",
    response_model=X3MappingListResponse,
    summary="List product mappings",
    description="Get a paginated list of product mappings between ERP and Sage X3."
)
async def list_product_mappings(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by X3 product code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """List product mappings with filtering and pagination."""
    conditions = []

    if is_active is not None:
        conditions.append(X3ProductMap.x3pm_is_active == is_active)

    if search:
        conditions.append(X3ProductMap.x3pm_x3_product_code.ilike(f"%{search}%"))

    # Count total
    count_stmt = select(func.count(X3ProductMap.x3pm_id))
    if conditions:
        count_stmt = count_stmt.where(and_(*conditions))
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Fetch page
    stmt = select(X3ProductMap)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.order_by(X3ProductMap.x3pm_created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    mappings = result.scalars().all()

    items = [
        {
            "id": m.x3pm_id,
            "product_id": m.x3pm_prd_id,
            "x3_product_code": m.x3pm_x3_product_code,
            "tax_code": m.x3pm_tax_code,
            "is_active": m.x3pm_is_active,
            "created_at": m.x3pm_created_at.isoformat() if m.x3pm_created_at else None,
            "updated_at": m.x3pm_updated_at.isoformat() if m.x3pm_updated_at else None
        }
        for m in mappings
    ]

    return X3MappingListResponse(
        success=True,
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0
    )


@router.get(
    "/products/{mapping_id}",
    response_model=X3ProductMappingResponse,
    responses={
        200: {"description": "Mapping found"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Get product mapping by ID"
)
async def get_product_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get a product mapping by ID."""
    stmt = select(X3ProductMap).where(X3ProductMap.x3pm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Product mapping {mapping_id} not found"}
        )

    return X3ProductMappingResponse(
        id=mapping.x3pm_id,
        product_id=mapping.x3pm_prd_id,
        x3_product_code=mapping.x3pm_x3_product_code,
        tax_code=mapping.x3pm_tax_code,
        is_active=mapping.x3pm_is_active,
        created_at=mapping.x3pm_created_at.isoformat() if mapping.x3pm_created_at else "",
        updated_at=mapping.x3pm_updated_at.isoformat() if mapping.x3pm_updated_at else None
    )


@router.get(
    "/products/by-product/{product_id}",
    response_model=X3ProductMappingResponse,
    responses={
        200: {"description": "Mapping found"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Get product mapping by product ID"
)
async def get_product_mapping_by_product(
    product_id: int = Path(..., description="ERP product ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get a product mapping by ERP product ID."""
    stmt = select(X3ProductMap).where(X3ProductMap.x3pm_prd_id == product_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"No mapping found for product {product_id}"}
        )

    return X3ProductMappingResponse(
        id=mapping.x3pm_id,
        product_id=mapping.x3pm_prd_id,
        x3_product_code=mapping.x3pm_x3_product_code,
        tax_code=mapping.x3pm_tax_code,
        is_active=mapping.x3pm_is_active,
        created_at=mapping.x3pm_created_at.isoformat() if mapping.x3pm_created_at else "",
        updated_at=mapping.x3pm_updated_at.isoformat() if mapping.x3pm_updated_at else None
    )


@router.post(
    "/products",
    response_model=X3ProductMappingResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Mapping created successfully"},
        400: {"model": X3ErrorResponse, "description": "Invalid request"},
        409: {"model": X3ErrorResponse, "description": "Mapping already exists"}
    },
    summary="Create product mapping",
    description="Create a mapping between an ERP product and a Sage X3 product code."
)
async def create_product_mapping(
    request: X3ProductMappingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new product mapping."""
    # Check for existing mapping
    existing_stmt = select(X3ProductMap).where(
        or_(
            X3ProductMap.x3pm_prd_id == request.product_id,
            X3ProductMap.x3pm_x3_product_code == request.x3_product_code
        )
    )
    existing_result = await db.execute(existing_stmt)
    existing = existing_result.scalar_one_or_none()

    if existing:
        if existing.x3pm_prd_id == request.product_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_PRODUCT",
                    "message": f"Product {request.product_id} already has a mapping"
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_X3_CODE",
                    "message": f"X3 product code '{request.x3_product_code}' is already mapped"
                }
            )

    mapping = X3ProductMap(
        x3pm_prd_id=request.product_id,
        x3pm_x3_product_code=request.x3_product_code,
        x3pm_tax_code=request.tax_code,
        x3pm_is_active=request.is_active
    )
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)

    return X3ProductMappingResponse(
        id=mapping.x3pm_id,
        product_id=mapping.x3pm_prd_id,
        x3_product_code=mapping.x3pm_x3_product_code,
        tax_code=mapping.x3pm_tax_code,
        is_active=mapping.x3pm_is_active,
        created_at=mapping.x3pm_created_at.isoformat() if mapping.x3pm_created_at else "",
        updated_at=None
    )


@router.patch(
    "/products/{mapping_id}",
    response_model=X3ProductMappingResponse,
    responses={
        200: {"description": "Mapping updated successfully"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"},
        409: {"model": X3ErrorResponse, "description": "X3 code already in use"}
    },
    summary="Update product mapping"
)
async def update_product_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    request: X3ProductMappingUpdate = ...,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing product mapping."""
    stmt = select(X3ProductMap).where(X3ProductMap.x3pm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Product mapping {mapping_id} not found"}
        )

    # Check for duplicate X3 code if updating
    if request.x3_product_code and request.x3_product_code != mapping.x3pm_x3_product_code:
        dup_stmt = select(X3ProductMap).where(
            X3ProductMap.x3pm_x3_product_code == request.x3_product_code,
            X3ProductMap.x3pm_id != mapping_id
        )
        dup_result = await db.execute(dup_stmt)
        if dup_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "success": False,
                    "error": "DUPLICATE_X3_CODE",
                    "message": f"X3 product code '{request.x3_product_code}' is already in use"
                }
            )
        mapping.x3pm_x3_product_code = request.x3_product_code

    if request.tax_code is not None:
        mapping.x3pm_tax_code = request.tax_code

    if request.is_active is not None:
        mapping.x3pm_is_active = request.is_active

    await db.commit()
    await db.refresh(mapping)

    return X3ProductMappingResponse(
        id=mapping.x3pm_id,
        product_id=mapping.x3pm_prd_id,
        x3_product_code=mapping.x3pm_x3_product_code,
        tax_code=mapping.x3pm_tax_code,
        is_active=mapping.x3pm_is_active,
        created_at=mapping.x3pm_created_at.isoformat() if mapping.x3pm_created_at else "",
        updated_at=mapping.x3pm_updated_at.isoformat() if mapping.x3pm_updated_at else None
    )


@router.delete(
    "/products/{mapping_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Mapping deleted successfully"},
        404: {"model": X3ErrorResponse, "description": "Mapping not found"}
    },
    summary="Delete product mapping"
)
async def delete_product_mapping(
    mapping_id: int = Path(..., description="Mapping ID"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product mapping."""
    stmt = select(X3ProductMap).where(X3ProductMap.x3pm_id == mapping_id)
    result = await db.execute(stmt)
    mapping = result.scalar_one_or_none()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "error": "NOT_FOUND", "message": f"Product mapping {mapping_id} not found"}
        )

    await db.delete(mapping)
    await db.commit()


# ==========================================================================
# Bulk Operations
# ==========================================================================

@router.post(
    "/customers/bulk",
    response_model=X3BulkMappingResponse,
    summary="Bulk create customer mappings",
    description="Create multiple customer mappings in a single request. Continues on individual failures."
)
async def bulk_create_customer_mappings(
    request: X3BulkMappingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Bulk create customer mappings."""
    created = 0
    failed = 0
    errors = []

    for idx, mapping_data in enumerate(request.mappings):
        try:
            client_id = mapping_data.get("client_id")
            x3_customer_code = mapping_data.get("x3_customer_code")
            sales_site = mapping_data.get("sales_site", "FCY1")
            is_active = mapping_data.get("is_active", True)

            if not client_id or not x3_customer_code:
                errors.append({
                    "index": idx,
                    "error": "MISSING_FIELDS",
                    "message": "client_id and x3_customer_code are required"
                })
                failed += 1
                continue

            # Check for existing
            existing_stmt = select(X3CustomerMap).where(
                or_(
                    X3CustomerMap.x3cm_cli_id == client_id,
                    X3CustomerMap.x3cm_x3_customer_code == x3_customer_code
                )
            )
            existing_result = await db.execute(existing_stmt)
            if existing_result.scalar_one_or_none():
                errors.append({
                    "index": idx,
                    "client_id": client_id,
                    "error": "DUPLICATE",
                    "message": "Client or X3 code already mapped"
                })
                failed += 1
                continue

            mapping = X3CustomerMap(
                x3cm_cli_id=client_id,
                x3cm_x3_customer_code=x3_customer_code,
                x3cm_sales_site=sales_site,
                x3cm_is_active=is_active
            )
            db.add(mapping)
            created += 1

        except Exception as e:
            errors.append({
                "index": idx,
                "error": "EXCEPTION",
                "message": str(e)
            })
            failed += 1

    if created > 0:
        await db.commit()

    return X3BulkMappingResponse(
        success=failed == 0,
        created=created,
        failed=failed,
        errors=errors
    )


@router.post(
    "/products/bulk",
    response_model=X3BulkMappingResponse,
    summary="Bulk create product mappings",
    description="Create multiple product mappings in a single request. Continues on individual failures."
)
async def bulk_create_product_mappings(
    request: X3BulkMappingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Bulk create product mappings."""
    created = 0
    failed = 0
    errors = []

    for idx, mapping_data in enumerate(request.mappings):
        try:
            product_id = mapping_data.get("product_id")
            x3_product_code = mapping_data.get("x3_product_code")
            tax_code = mapping_data.get("tax_code")
            is_active = mapping_data.get("is_active", True)

            if not product_id or not x3_product_code:
                errors.append({
                    "index": idx,
                    "error": "MISSING_FIELDS",
                    "message": "product_id and x3_product_code are required"
                })
                failed += 1
                continue

            # Check for existing
            existing_stmt = select(X3ProductMap).where(
                or_(
                    X3ProductMap.x3pm_prd_id == product_id,
                    X3ProductMap.x3pm_x3_product_code == x3_product_code
                )
            )
            existing_result = await db.execute(existing_stmt)
            if existing_result.scalar_one_or_none():
                errors.append({
                    "index": idx,
                    "product_id": product_id,
                    "error": "DUPLICATE",
                    "message": "Product or X3 code already mapped"
                })
                failed += 1
                continue

            mapping = X3ProductMap(
                x3pm_prd_id=product_id,
                x3pm_x3_product_code=x3_product_code,
                x3pm_tax_code=tax_code,
                x3pm_is_active=is_active
            )
            db.add(mapping)
            created += 1

        except Exception as e:
            errors.append({
                "index": idx,
                "error": "EXCEPTION",
                "message": str(e)
            })
            failed += 1

    if created > 0:
        await db.commit()

    return X3BulkMappingResponse(
        success=failed == 0,
        created=created,
        failed=failed,
        errors=errors
    )


# ==========================================================================
# Statistics and Validation
# ==========================================================================

@router.get(
    "/stats",
    response_model=X3MappingStatsResponse,
    summary="Get mapping statistics",
    description="Get comprehensive statistics about X3 customer and product mappings."
)
async def get_mapping_statistics(
    db: AsyncSession = Depends(get_db)
):
    """Get statistics about X3 mappings."""
    # Customer mapping stats
    customer_total = await db.execute(select(func.count(X3CustomerMap.x3cm_id)))
    customer_active = await db.execute(
        select(func.count(X3CustomerMap.x3cm_id)).where(X3CustomerMap.x3cm_is_active == True)
    )
    customer_inactive = await db.execute(
        select(func.count(X3CustomerMap.x3cm_id)).where(X3CustomerMap.x3cm_is_active == False)
    )
    customer_exported = await db.execute(
        select(func.count(X3CustomerMap.x3cm_id)).where(X3CustomerMap.x3cm_last_exported_at.isnot(None))
    )

    # Product mapping stats
    product_total = await db.execute(select(func.count(X3ProductMap.x3pm_id)))
    product_active = await db.execute(
        select(func.count(X3ProductMap.x3pm_id)).where(X3ProductMap.x3pm_is_active == True)
    )
    product_inactive = await db.execute(
        select(func.count(X3ProductMap.x3pm_id)).where(X3ProductMap.x3pm_is_active == False)
    )
    product_with_tax = await db.execute(
        select(func.count(X3ProductMap.x3pm_id)).where(X3ProductMap.x3pm_tax_code.isnot(None))
    )

    return X3MappingStatsResponse(
        success=True,
        customer_mappings={
            "total": customer_total.scalar() or 0,
            "active": customer_active.scalar() or 0,
            "inactive": customer_inactive.scalar() or 0,
            "exported": customer_exported.scalar() or 0
        },
        product_mappings={
            "total": product_total.scalar() or 0,
            "active": product_active.scalar() or 0,
            "inactive": product_inactive.scalar() or 0,
            "with_tax_code": product_with_tax.scalar() or 0
        }
    )


@router.get(
    "/unmapped/customers",
    response_model=X3MappingListResponse,
    summary="List unmapped customers",
    description="Get a list of ERP clients that do not have an X3 mapping."
)
async def list_unmapped_customers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """List customers without X3 mappings."""
    # This would need the Client model to be imported
    # For now, return an empty list as placeholder
    return X3MappingListResponse(
        success=True,
        items=[],
        total=0,
        page=page,
        page_size=page_size,
        total_pages=0
    )


@router.get(
    "/unmapped/products",
    response_model=X3MappingListResponse,
    summary="List unmapped products",
    description="Get a list of ERP products that do not have an X3 mapping."
)
async def list_unmapped_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """List products without X3 mappings."""
    # This would need the Product model to be imported
    # For now, return an empty list as placeholder
    return X3MappingListResponse(
        success=True,
        items=[],
        total=0,
        page=page,
        page_size=page_size,
        total_pages=0
    )

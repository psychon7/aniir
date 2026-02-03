"""
Product Attributes API endpoints.

Provides REST API for managing product attribute definitions and values.
"""
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.product_attribute import (
    ProductAttributeCreate, ProductAttributeUpdate, ProductAttributeResponse,
    ProductAttributeListResponse, ProductAttributeValueCreate,
    ProductAttributeValueResponse, ProductAttributeValuesResponse,
    ProductAttributeValuesBatchUpdate, AttributeDataType
)
from app.services.product_attribute_service import (
    ProductAttributeService, get_product_attribute_service,
    ProductAttributeNotFoundError, ProductAttributeValueNotFoundError,
    ProductAttributeValidationError
)

router = APIRouter(prefix="/product-attributes", tags=["product-attributes"])


# =============================================================================
# Error Handler
# =============================================================================


def handle_attribute_error(e: Exception):
    """Convert service exceptions to HTTP exceptions."""
    if isinstance(e, ProductAttributeNotFoundError):
        raise HTTPException(status_code=404, detail=str(e))
    elif isinstance(e, ProductAttributeValueNotFoundError):
        raise HTTPException(status_code=404, detail=str(e))
    elif isinstance(e, ProductAttributeValidationError):
        raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# =============================================================================
# Attribute Definition Endpoints
# =============================================================================


@router.get("", response_model=ProductAttributeListResponse)
async def list_attributes(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society"),
    active_only: bool = Query(True, alias="activeOnly", description="Only active attributes"),
    filterable_only: bool = Query(False, alias="filterableOnly", description="Only filterable attributes"),
    search: Optional[str] = Query(None, description="Search in code/name/description"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of product attribute definitions.

    Supports filtering by:
    - Society
    - Active status
    - Filterable flag (for search/filter attributes)
    - Search term
    """
    try:
        service = get_product_attribute_service(db)
        attributes, total = service.get_attributes(
            page=page,
            page_size=page_size,
            society_id=society_id,
            active_only=active_only,
            filterable_only=filterable_only,
            search=search
        )

        attr_responses = [
            ProductAttributeResponse.model_validate(service.to_response(attr))
            for attr in attributes
        ]

        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return ProductAttributeListResponse(
            data=attr_responses,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
    except Exception as e:
        handle_attribute_error(e)


@router.get("/{attribute_id}", response_model=ProductAttributeResponse)
async def get_attribute(
    attribute_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific product attribute by ID."""
    try:
        service = get_product_attribute_service(db)
        attribute = service.get_attribute_by_id(attribute_id)

        if not attribute:
            raise ProductAttributeNotFoundError(f"Attribute with ID {attribute_id} not found")

        return ProductAttributeResponse.model_validate(service.to_response(attribute))
    except Exception as e:
        handle_attribute_error(e)


@router.get("/code/{code}", response_model=ProductAttributeResponse)
async def get_attribute_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """Get a specific product attribute by code."""
    try:
        service = get_product_attribute_service(db)
        attribute = service.get_attribute_by_code(code)

        if not attribute:
            raise ProductAttributeNotFoundError(f"Attribute with code '{code}' not found")

        return ProductAttributeResponse.model_validate(service.to_response(attribute))
    except Exception as e:
        handle_attribute_error(e)


@router.post("", response_model=ProductAttributeResponse, status_code=201)
async def create_attribute(
    data: ProductAttributeCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new product attribute definition.

    Required fields:
    - code: Unique attribute code (e.g., 'color', 'size', 'wattage')
    - name: Display name
    - societyId: Society ID

    Optional fields:
    - description: Attribute description
    - dataType: text, number, boolean, date, select (default: text)
    - options: Array of options for select type
    - unit: Measurement unit (e.g., 'mm', 'kg', 'W')
    - isRequired: Whether attribute is required
    - isFilterable: Whether attribute can be used in filters
    - isVisible: Whether attribute is visible in UI
    - sortOrder: Display order
    """
    try:
        service = get_product_attribute_service(db)
        attribute = service.create_attribute(data)

        return ProductAttributeResponse.model_validate(service.to_response(attribute))
    except Exception as e:
        handle_attribute_error(e)


@router.put("/{attribute_id}", response_model=ProductAttributeResponse)
async def update_attribute(
    attribute_id: int,
    data: ProductAttributeUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing product attribute."""
    try:
        service = get_product_attribute_service(db)
        attribute = service.update_attribute(attribute_id, data)

        return ProductAttributeResponse.model_validate(service.to_response(attribute))
    except Exception as e:
        handle_attribute_error(e)


@router.delete("/{attribute_id}", status_code=204)
async def delete_attribute(
    attribute_id: int,
    hard_delete: bool = Query(False, alias="hardDelete", description="Permanently delete"),
    db: Session = Depends(get_db)
):
    """
    Delete a product attribute.

    By default performs soft delete (sets isActive to false).
    Use hardDelete=true to permanently remove (will also delete all values).
    """
    try:
        service = get_product_attribute_service(db)
        service.delete_attribute(attribute_id, hard_delete)
    except Exception as e:
        handle_attribute_error(e)


# =============================================================================
# Product Attribute Values Endpoints
# =============================================================================


@router.get("/products/{product_id}/values", response_model=ProductAttributeValuesResponse)
async def get_product_attribute_values(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get all attribute values for a specific product."""
    try:
        service = get_product_attribute_service(db)
        values = service.get_product_attributes(product_id)

        value_responses = [
            ProductAttributeValueResponse.model_validate(service.value_to_response(v))
            for v in values
        ]

        return ProductAttributeValuesResponse(
            product_id=product_id,
            product_name=values[0].product.prd_name if values and values[0].product else None,
            attributes=value_responses
        )
    except Exception as e:
        handle_attribute_error(e)


@router.post("/products/{product_id}/values", response_model=ProductAttributeValueResponse)
async def set_product_attribute_value(
    product_id: int,
    data: ProductAttributeValueCreate,
    db: Session = Depends(get_db)
):
    """
    Set an attribute value for a product.

    Creates the value if it doesn't exist, updates if it does.
    """
    try:
        service = get_product_attribute_service(db)
        value = service.set_product_attribute(
            product_id=product_id,
            attribute_id=data.pat_id,
            value=data.value
        )

        return ProductAttributeValueResponse.model_validate(service.value_to_response(value))
    except Exception as e:
        handle_attribute_error(e)


@router.put("/products/{product_id}/values/batch", response_model=List[ProductAttributeValueResponse])
async def batch_update_product_attribute_values(
    product_id: int,
    data: ProductAttributeValuesBatchUpdate,
    db: Session = Depends(get_db)
):
    """
    Batch update multiple attribute values for a product.

    Useful for updating all attributes at once from an edit form.
    """
    try:
        service = get_product_attribute_service(db)
        values = service.batch_update_product_attributes(product_id, data.values)

        return [
            ProductAttributeValueResponse.model_validate(service.value_to_response(v))
            for v in values
        ]
    except Exception as e:
        handle_attribute_error(e)


@router.delete("/products/{product_id}/values/{attribute_id}", status_code=204)
async def delete_product_attribute_value(
    product_id: int,
    attribute_id: int,
    db: Session = Depends(get_db)
):
    """Delete an attribute value from a product."""
    try:
        service = get_product_attribute_service(db)
        service.delete_product_attribute(product_id, attribute_id)
    except Exception as e:
        handle_attribute_error(e)


# =============================================================================
# Utility Endpoints
# =============================================================================


@router.get("/data-types", response_model=List[dict])
async def get_data_types():
    """Get list of available attribute data types."""
    return [
        {"value": "text", "label": "Text", "description": "Free text input"},
        {"value": "number", "label": "Number", "description": "Numeric value with optional unit"},
        {"value": "boolean", "label": "Boolean", "description": "Yes/No toggle"},
        {"value": "date", "label": "Date", "description": "Date picker"},
        {"value": "select", "label": "Select", "description": "Dropdown from predefined options"},
    ]

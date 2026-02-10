"""Product component relation API router."""

import asyncio
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.product_component import ProductComponent
from app.schemas.product_component import (
    ProductComponentCreate,
    ProductComponentListResponse,
    ProductComponentResponse,
    ProductComponentUpdate,
)


router = APIRouter(prefix="/products", tags=["Product Components"])

_ALLOWED_TYPES = {"DRIVER", "ACCESSORY", "OPTION"}


def _normalize_component_type(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.upper().strip()
    if normalized not in _ALLOWED_TYPES:
        raise ValueError("componentType must be one of DRIVER, ACCESSORY, OPTION")
    return normalized


def _sync_component_response(
    db: Session,
    component: ProductComponent,
    reference: Optional[str] = None,
    name: Optional[str] = None,
) -> ProductComponentResponse:
    if reference is None or name is None:
        row = db.execute(
            select(Product.prd_ref, Product.prd_name).where(Product.prd_id == component.component_prd_id)
        ).first()
        if row:
            reference = row.prd_ref
            name = row.prd_name

    payload = ProductComponentResponse.model_validate(component).model_dump()
    payload["componentReference"] = reference
    payload["componentName"] = name
    return ProductComponentResponse(**payload)


def _sync_list_components(
    db: Session,
    product_id: int,
    component_type: Optional[str],
):
    if not db.get(Product, product_id):
        return None, []

    query = (
        select(ProductComponent, Product.prd_ref, Product.prd_name)
        .join(Product, Product.prd_id == ProductComponent.component_prd_id)
        .where(ProductComponent.prd_id == product_id)
        .order_by(ProductComponent.prc_component_type, ProductComponent.prc_order, ProductComponent.prc_id)
    )
    if component_type:
        query = query.where(ProductComponent.prc_component_type == component_type)

    rows = db.execute(query).all()
    return True, rows


def _sync_create_component(db: Session, product_id: int, data: ProductComponentCreate):
    if not db.get(Product, product_id):
        return None, "PRODUCT_NOT_FOUND"

    payload = data.model_dump(exclude_unset=True)
    component_product_id = payload["component_prd_id"]
    if component_product_id == product_id:
        return None, "SELF_REFERENCE"

    if not db.get(Product, component_product_id):
        return None, "COMPONENT_NOT_FOUND"

    component_type = _normalize_component_type(payload.get("prc_component_type"))

    now = datetime.utcnow()
    component = ProductComponent(
        prd_id=product_id,
        component_prd_id=component_product_id,
        prc_component_type=component_type,
        prc_quantity=payload.get("prc_quantity"),
        prc_is_required=payload.get("prc_is_required", True),
        prc_order=payload.get("prc_order", 0),
        prc_d_creation=now,
        prc_d_update=now,
    )
    db.add(component)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return None, "DUPLICATE"

    db.refresh(component)
    return component, "CREATED"


def _sync_update_component(
    db: Session,
    product_id: int,
    component_id: int,
    data: ProductComponentUpdate,
):
    component = db.get(ProductComponent, component_id)
    if not component or component.prd_id != product_id:
        return None, "NOT_FOUND"

    payload = data.model_dump(exclude_unset=True)

    if "component_prd_id" in payload:
        if payload["component_prd_id"] == product_id:
            return None, "SELF_REFERENCE"
        if not db.get(Product, payload["component_prd_id"]):
            return None, "COMPONENT_NOT_FOUND"

    if "prc_component_type" in payload:
        payload["prc_component_type"] = _normalize_component_type(payload["prc_component_type"])

    for field, value in payload.items():
        setattr(component, field, value)

    component.prc_d_update = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return None, "DUPLICATE"

    db.refresh(component)
    return component, "UPDATED"


def _sync_delete_component(db: Session, product_id: int, component_id: int):
    component = db.get(ProductComponent, component_id)
    if not component or component.prd_id != product_id:
        return False
    db.delete(component)
    db.commit()
    return True


@router.get(
    "/{product_id}/components",
    response_model=ProductComponentListResponse,
    summary="List product components",
)
async def list_product_components(
    product_id: int = Path(..., gt=0),
    component_type: Optional[str] = Query(None, alias="componentType"),
    db: Session = Depends(get_db),
):
    try:
        normalized_type = _normalize_component_type(component_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    found, rows = await asyncio.to_thread(_sync_list_components, db, product_id, normalized_type)
    if found is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    items = []
    for row in rows:
        item = _sync_component_response(
            db,
            row.ProductComponent,
            reference=row.prd_ref,
            name=row.prd_name,
        )
        items.append(item)

    return ProductComponentListResponse(items=items, total=len(items))


@router.post(
    "/{product_id}/components",
    response_model=ProductComponentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product component relation",
)
async def create_product_component(
    product_id: int = Path(..., gt=0),
    data: ProductComponentCreate = ...,
    db: Session = Depends(get_db),
):
    try:
        component, state = await asyncio.to_thread(_sync_create_component, db, product_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    if state == "PRODUCT_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if state == "COMPONENT_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Component product not found")
    if state == "SELF_REFERENCE":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A product cannot reference itself")
    if state == "DUPLICATE":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Component relation already exists")

    return _sync_component_response(db, component)


@router.put(
    "/{product_id}/components/{component_id}",
    response_model=ProductComponentResponse,
    summary="Update product component relation",
)
async def update_product_component(
    product_id: int = Path(..., gt=0),
    component_id: int = Path(..., gt=0),
    data: ProductComponentUpdate = ...,
    db: Session = Depends(get_db),
):
    try:
        component, state = await asyncio.to_thread(_sync_update_component, db, product_id, component_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    if state == "NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Component relation not found")
    if state == "COMPONENT_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Component product not found")
    if state == "SELF_REFERENCE":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A product cannot reference itself")
    if state == "DUPLICATE":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Component relation already exists")

    return _sync_component_response(db, component)


@router.delete(
    "/{product_id}/components/{component_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product component relation",
)
async def delete_product_component(
    product_id: int = Path(..., gt=0),
    component_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    deleted = await asyncio.to_thread(_sync_delete_component, db, product_id, component_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Component relation not found")


"""Category CRUD API router."""

import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListPaginatedResponse,
    CategoryTreeResponse,
    CategoryWithChildrenResponse,
)


router = APIRouter(prefix="/categories", tags=["Categories"])


def _sync_list_categories(
    db: Session,
    skip: int,
    limit: int,
    search: Optional[str],
    parent_id: Optional[int],
    root_only: bool,
    active_only: Optional[bool],
    society_id: Optional[int],
):
    query = select(Category)
    count_query = select(func.count(Category.cat_id))

    filters = []
    if search:
        filters.append(Category.cat_name.ilike(f"%{search}%"))
    if root_only:
        filters.append(Category.cat_parent_cat_id.is_(None))
    elif parent_id is not None:
        filters.append(Category.cat_parent_cat_id == parent_id)
    if active_only is not None:
        filters.append(Category.cat_is_actived == active_only)
    if society_id is not None:
        filters.append(Category.soc_id == society_id)

    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)

    total = int(db.execute(count_query).scalar() or 0)
    items = list(
        db.execute(
            query.order_by(Category.cat_order, Category.cat_name).offset(skip).limit(limit)
        ).scalars().all()
    )
    return items, total


def _sync_build_tree(db: Session, active_only: bool, society_id: Optional[int]):
    query = select(Category).order_by(Category.cat_order, Category.cat_name)
    filters = []
    if active_only:
        filters.append(Category.cat_is_actived == True)
    if society_id is not None:
        filters.append(Category.soc_id == society_id)
    if filters:
        query = query.where(*filters)

    rows = list(db.execute(query).scalars().all())

    by_id: dict[int, dict] = {}
    for cat in rows:
        by_id[cat.cat_id] = {
            "cat_id": cat.cat_id,
            "cat_name": cat.cat_name,
            "cat_sub_name_1": cat.cat_sub_name_1,
            "cat_sub_name_2": cat.cat_sub_name_2,
            "cat_order": cat.cat_order,
            "cat_is_actived": cat.cat_is_actived,
            "cat_image_path": cat.cat_image_path,
            "cat_display_in_menu": cat.cat_display_in_menu,
            "cat_display_in_exhibition": cat.cat_display_in_exhibition,
            "cat_parent_cat_id": cat.cat_parent_cat_id,
            "soc_id": cat.soc_id,
            "cat_description": cat.cat_description,
            "children": [],
        }

    roots = []
    for cat in by_id.values():
        parent_id = cat["cat_parent_cat_id"]
        if parent_id and parent_id in by_id:
            by_id[parent_id]["children"].append(cat)
        else:
            roots.append(cat)

    return roots


def _sync_create_category(db: Session, data: CategoryCreate):
    payload = data.model_dump(exclude_unset=True)
    category = Category(**payload)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def _sync_update_category(db: Session, category_id: int, data: CategoryUpdate):
    category = db.get(Category, category_id)
    if not category:
        return None

    payload = data.model_dump(exclude_unset=True)
    if "cat_parent_cat_id" in payload and payload["cat_parent_cat_id"] == category_id:
        raise ValueError("A category cannot be its own parent")

    for field, value in payload.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


def _sync_delete_category(db: Session, category_id: int):
    category = db.get(Category, category_id)
    if not category:
        return False, "NOT_FOUND"

    has_children = db.execute(
        select(func.count(Category.cat_id)).where(Category.cat_parent_cat_id == category_id)
    ).scalar() or 0
    if has_children > 0:
        return False, "HAS_CHILDREN"

    db.delete(category)
    db.commit()
    return True, "DELETED"


@router.get(
    "",
    response_model=CategoryListPaginatedResponse,
    summary="List categories",
    description="Get paginated categories with optional filters.",
)
async def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    root_only: bool = Query(False),
    active_only: Optional[bool] = Query(None),
    society_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    items, total = await asyncio.to_thread(
        _sync_list_categories,
        db,
        skip,
        limit,
        search,
        parent_id,
        root_only,
        active_only,
        society_id,
    )
    return CategoryListPaginatedResponse(
        items=[CategoryResponse.model_validate(i) for i in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/tree",
    response_model=CategoryTreeResponse,
    summary="Get category tree",
    description="Get hierarchical category tree.",
)
async def get_category_tree(
    active_only: bool = Query(True),
    society_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    roots = await asyncio.to_thread(_sync_build_tree, db, active_only, society_id)
    return CategoryTreeResponse(
        categories=[CategoryWithChildrenResponse.model_validate(r) for r in roots]
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category",
)
async def get_category(
    category_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return CategoryResponse.model_validate(category)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create category",
)
async def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
):
    category = await asyncio.to_thread(_sync_create_category, db, data)
    return CategoryResponse.model_validate(category)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update category",
)
async def update_category(
    category_id: int = Path(..., gt=0),
    data: CategoryUpdate = ...,
    db: Session = Depends(get_db),
):
    try:
        category = await asyncio.to_thread(_sync_update_category, db, category_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return CategoryResponse.model_validate(category)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete category",
)
async def delete_category(
    category_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    deleted, state = await asyncio.to_thread(_sync_delete_category, db, category_id)
    if not deleted and state == "NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if not deleted and state == "HAS_CHILDREN":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete category with child categories",
        )


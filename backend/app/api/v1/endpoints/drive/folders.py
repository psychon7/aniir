"""
Drive Folders API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.drive import (
    DriveFolderCreate,
    DriveFolderUpdate,
    DriveFolderResponse,
    DriveFolderListResponse,
)
from app.services.drive_service import DriveFolderService

router = APIRouter()


@router.get("", response_model=DriveFolderListResponse)
async def list_folders(
    parent_id: Optional[int] = Query(None, description="Parent folder ID (null for root)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search in folder name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List folders with optional parent filter.
    """
    service = DriveFolderService(db)
    result = service.list_folders(
        user_id=current_user.Id,
        parent_id=parent_id,
        page=page,
        page_size=page_size,
        search=search,
    )
    return result


@router.get("/{folder_id}", response_model=DriveFolderResponse)
async def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get folder details by ID.
    """
    service = DriveFolderService(db)
    folder = service.get_folder(folder_id=folder_id, user_id=current_user.Id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    return folder

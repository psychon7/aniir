"""
Drive Files API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.drive import (
    DriveFileResponse,
    DriveFileListResponse,
    DriveFileCreate,
    DriveFileUpdate,
    DriveFileRename,
    DriveFileMoveRequest,
)
from app.services.drive_service import DriveService

router = APIRouter()


@router.get("", response_model=DriveFileListResponse)
async def list_files(
    folder_id: Optional[int] = Query(None, description="Parent folder ID (null for root)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search in file names"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List files in a folder or root directory.
    """
    service = DriveService(db)
    result = service.list_files(
        user_id=current_user.id,
        folder_id=folder_id,
        page=page,
        page_size=page_size,
        search=search,
        file_type=file_type,
    )
    return result


@router.get("/{file_id}", response_model=DriveFileResponse)
async def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get file details by ID.
    """
    service = DriveService(db)
    file = service.get_file(file_id=file_id, user_id=current_user.id)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file


@router.post("", response_model=DriveFileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a new file.
    """
    service = DriveService(db)
    result = service.upload_file(
        file=file,
        user_id=current_user.id,
        folder_id=folder_id,
        description=description,
    )
    return result


@router.put("/{file_id}", response_model=DriveFileResponse)
async def update_file(
    file_id: int,
    file_update: DriveFileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update file metadata.
    """
    service = DriveService(db)
    file = service.update_file(
        file_id=file_id,
        user_id=current_user.id,
        update_data=file_update,
    )
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file


@router.put("/{file_id}/rename", response_model=DriveFileResponse)
async def rename_file(
    file_id: int,
    rename_data: DriveFileRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Rename a file.
    
    Args:
        file_id: The ID of the file to rename
        rename_data: The new name for the file
        
    Returns:
        The updated file with the new name
        
    Raises:
        404: File not found
        400: Invalid file name or name already exists in folder
    """
    service = DriveService(db)
    
    # Validate the new name
    if not rename_data.name or not rename_data.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty"
        )
    
    # Check for invalid characters in filename
    invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
    if any(char in rename_data.name for char in invalid_chars):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File name cannot contain these characters: {' '.join(invalid_chars)}"
        )
    
    result = service.rename_file(
        file_id=file_id,
        user_id=current_user.id,
        new_name=rename_data.name.strip(),
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if isinstance(result, dict) and result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result


@router.put("/{file_id}/move", response_model=DriveFileResponse)
async def move_file(
    file_id: int,
    move_data: DriveFileMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Move a file to a different folder.
    """
    service = DriveService(db)
    file = service.move_file(
        file_id=file_id,
        user_id=current_user.id,
        target_folder_id=move_data.target_folder_id,
    )
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    permanent: bool = Query(False, description="Permanently delete instead of moving to trash"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a file (move to trash or permanent delete).
    """
    service = DriveService(db)
    success = service.delete_file(
        file_id=file_id,
        user_id=current_user.id,
        permanent=permanent,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return None

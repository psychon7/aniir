"""
Drive API endpoints for file management.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.dependencies import get_db, get_current_user
from app.models.drive import DriveFile
from app.schemas.drive import (
    DriveFileResponse,
    DriveFileListResponse,
    EntityType,
)

router = APIRouter(prefix="/api/v1/drive", tags=["drive"])


@router.get("/files", response_model=DriveFileListResponse)
async def list_files(
    entity_type: Optional[str] = Query(
        None,
        description="Filter by entity type (client, supplier, product, quote, order, invoice)"
    ),
    entity_id: Optional[int] = Query(
        None,
        description="Filter by entity ID"
    ),
    folder_id: Optional[int] = Query(
        None,
        description="Filter by folder ID (NULL for root level)"
    ),
    search: Optional[str] = Query(
        None,
        description="Search in file name"
    ),
    file_type: Optional[str] = Query(
        None,
        description="Filter by file type/extension"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    List files with optional filtering by entity type and entity ID.
    
    - **entity_type**: Filter files linked to a specific entity type
    - **entity_id**: Filter files linked to a specific entity (requires entity_type)
    - **folder_id**: Filter files in a specific folder
    - **search**: Search in file names
    - **file_type**: Filter by file extension/type
    """
    # Build base query
    query = db.query(DriveFile).filter(DriveFile.IsDeleted == False)
    
    # Apply entity filters
    if entity_type:
        # Validate entity type
        valid_types = [e.value for e in EntityType]
        if entity_type.lower() not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid entity_type. Must be one of: {', '.join(valid_types)}"
            )
        query = query.filter(DriveFile.EntityType == entity_type.lower())
        
        # If entity_id is provided, filter by it
        if entity_id:
            query = query.filter(DriveFile.EntityId == entity_id)
    elif entity_id:
        # entity_id without entity_type is not allowed
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="entity_type is required when entity_id is provided"
        )
    
    # Apply folder filter
    if folder_id is not None:
        if folder_id == 0:
            # Root level files (no parent folder)
            query = query.filter(DriveFile.FolderId == None)
        else:
            query = query.filter(DriveFile.FolderId == folder_id)
    
    # Apply search filter
    if search:
        query = query.filter(DriveFile.FileName.ilike(f"%{search}%"))
    
    # Apply file type filter
    if file_type:
        query = query.filter(DriveFile.FileType == file_type.lower())
    
    # Get total count before pagination
    total_count = query.count()
    
    # Calculate pagination
    total_pages = (total_count + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    # Apply ordering and pagination
    files = query.order_by(
        DriveFile.CreatedAt.desc()
    ).offset(offset).limit(page_size).all()
    
    # Convert to response format
    file_responses = [
        DriveFileResponse(
            id=f.Id,
            file_name=f.FileName,
            original_name=f.OriginalName,
            file_path=f.FilePath,
            file_type=f.FileType,
            file_size=f.FileSize,
            mime_type=f.MimeType,
            entity_type=f.EntityType,
            entity_id=f.EntityId,
            folder_id=f.FolderId,
            description=f.Description,
            tags=f.Tags.split(',') if f.Tags else [],
            is_public=f.IsPublic,
            download_count=f.DownloadCount or 0,
            created_at=f.CreatedAt,
            created_by=f.CreatedBy,
            updated_at=f.UpdatedAt,
            updated_by=f.UpdatedBy
        )
        for f in files
    ]
    
    return DriveFileListResponse(
        items=file_responses,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/files/{file_id}", response_model=DriveFileResponse)
async def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get a specific file by ID.
    """
    file = db.query(DriveFile).filter(
        DriveFile.Id == file_id,
        DriveFile.IsDeleted == False
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )
    
    return DriveFileResponse(
        id=file.Id,
        file_name=file.FileName,
        original_name=file.OriginalName,
        file_path=file.FilePath,
        file_type=file.FileType,
        file_size=file.FileSize,
        mime_type=file.MimeType,
        entity_type=file.EntityType,
        entity_id=file.EntityId,
        folder_id=file.FolderId,
        description=file.Description,
        tags=file.Tags.split(',') if file.Tags else [],
        is_public=file.IsPublic,
        download_count=file.DownloadCount or 0,
        created_at=file.CreatedAt,
        created_by=file.CreatedBy,
        updated_at=file.UpdatedAt,
        updated_by=file.UpdatedBy
    )

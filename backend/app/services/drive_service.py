"""
Drive service for file management business logic.
"""
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import Depends

from app.database import get_db
from app.models.drive import DriveFile, DriveFolder
from app.schemas.drive import DriveFileCreate, DriveFileUpdate, EntityType


# =============================================================================
# Custom Exceptions
# =============================================================================

class DriveServiceError(Exception):
    """Base exception for drive service errors."""
    pass


class FolderNotFoundError(DriveServiceError):
    """Raised when a folder is not found."""
    pass


class FileNotFoundError(DriveServiceError):
    """Raised when a file is not found."""
    pass


class PermissionDeniedError(DriveServiceError):
    """Raised when permission is denied."""
    pass


class InvalidEntityTypeError(DriveServiceError):
    """Raised when entity type is invalid."""
    pass


class StorageError(DriveServiceError):
    """Raised when there is a storage error."""
    pass


# =============================================================================
# Dependency Function
# =============================================================================

def get_drive_service(db: Session = Depends(get_db)) -> "DriveService":
    """Dependency for getting drive service."""
    return DriveService(db)


class DriveService:
    """Service class for drive file operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_files(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        folder_id: Optional[int] = None,
        search: Optional[str] = None,
        file_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DriveFile], int]:
        """
        Get files with filtering and pagination.
        
        Returns:
            Tuple of (files list, total count)
        """
        query = self.db.query(DriveFile).filter(DriveFile.IsDeleted == False)
        
        # Apply filters
        if entity_type:
            query = query.filter(DriveFile.EntityType == entity_type.lower())
        
        if entity_id:
            query = query.filter(DriveFile.EntityId == entity_id)
        
        if folder_id is not None:
            if folder_id == 0:
                query = query.filter(DriveFile.FolderId == None)
            else:
                query = query.filter(DriveFile.FolderId == folder_id)
        
        if search:
            query = query.filter(DriveFile.FileName.ilike(f"%{search}%"))
        
        if file_type:
            query = query.filter(DriveFile.FileType == file_type.lower())
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        files = query.order_by(DriveFile.CreatedAt.desc()).offset(offset).limit(page_size).all()
        
        return files, total_count
    
    def get_file_by_id(self, file_id: int) -> Optional[DriveFile]:
        """Get a single file by ID."""
        return self.db.query(DriveFile).filter(
            DriveFile.Id == file_id,
            DriveFile.IsDeleted == False
        ).first()
    
    def get_files_by_entity(
        self,
        entity_type: str,
        entity_id: int
    ) -> List[DriveFile]:
        """Get all files associated with a specific entity."""
        return self.db.query(DriveFile).filter(
            DriveFile.EntityType == entity_type.lower(),
            DriveFile.EntityId == entity_id,
            DriveFile.IsDeleted == False
        ).order_by(DriveFile.CreatedAt.desc()).all()
    
    def create_file(
        self,
        file_data: DriveFileCreate,
        file_path: str,
        file_size: int,
        user_id: int
    ) -> DriveFile:
        """Create a new file record."""
        tags_str = ','.join(file_data.tags) if file_data.tags else None
        
        db_file = DriveFile(
            FileName=file_data.file_name,
            OriginalName=file_data.original_name,
            FilePath=file_path,
            FileType=file_data.file_type,
            FileSize=file_size,
            MimeType=file_data.mime_type,
            EntityType=file_data.entity_type,
            EntityId=file_data.entity_id,
            FolderId=file_data.folder_id,
            Description=file_data.description,
            Tags=tags_str,
            IsPublic=file_data.is_public,
            CreatedBy=user_id,
            CreatedAt=datetime.utcnow()
        )
        
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        
        return db_file
    
    def update_file(
        self,
        file_id: int,
        file_data: DriveFileUpdate,
        user_id: int
    ) -> Optional[DriveFile]:
        """Update a file record."""
        db_file = self.get_file_by_id(file_id)
        if not db_file:
            return None
        
        update_data = file_data.model_dump(exclude_unset=True)
        
        # Handle tags conversion
        if 'tags' in update_data and update_data['tags'] is not None:
            update_data['Tags'] = ','.join(update_data.pop('tags'))
        elif 'tags' in update_data:
            update_data.pop('tags')
        
        # Map schema fields to model fields
        field_mapping = {
            'file_name': 'FileName',
            'description': 'Description',
            'folder_id': 'FolderId',
            'is_public': 'IsPublic'
        }
        
        for schema_field, model_field in field_mapping.items():
            if schema_field in update_data:
                setattr(db_file, model_field, update_data[schema_field])
        
        db_file.UpdatedBy = user_id
        db_file.UpdatedAt = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_file)
        
        return db_file
    
    def delete_file(self, file_id: int, user_id: int) -> bool:
        """Soft delete a file."""
        db_file = self.get_file_by_id(file_id)
        if not db_file:
            return False
        
        db_file.IsDeleted = True
        db_file.DeletedAt = datetime.utcnow()
        db_file.DeletedBy = user_id
        
        self.db.commit()
        return True
    
    def increment_download_count(self, file_id: int) -> bool:
        """Increment the download count for a file."""
        db_file = self.get_file_by_id(file_id)
        if not db_file:
            return False
        
        db_file.DownloadCount = (db_file.DownloadCount or 0) + 1
        self.db.commit()
        return True

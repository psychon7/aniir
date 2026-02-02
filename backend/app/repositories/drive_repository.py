"""
Drive repository - Database operations for Drive module
"""
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload

from app.models.drive import DriveFolder, DriveFile


class DriveFolderRepository:
    """Repository for DriveFolder operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, folder_id: int) -> Optional[DriveFolder]:
        """Get folder by ID"""
        return self.db.query(DriveFolder).filter(
            DriveFolder.Id == folder_id,
            DriveFolder.IsActive == True
        ).first()
    
    def get_by_path(self, path: str, society_id: Optional[int] = None) -> Optional[DriveFolder]:
        """Get folder by full path"""
        query = self.db.query(DriveFolder).filter(
            DriveFolder.Path == path,
            DriveFolder.IsActive == True
        )
        if society_id:
            query = query.filter(DriveFolder.SocietyId == society_id)
        return query.first()
    
    def get_children(self, parent_id: Optional[int], society_id: Optional[int] = None) -> List[DriveFolder]:
        """Get child folders of a parent"""
        query = self.db.query(DriveFolder).filter(
            DriveFolder.ParentId == parent_id,
            DriveFolder.IsActive == True
        )
        if society_id:
            query = query.filter(DriveFolder.SocietyId == society_id)
        return query.order_by(DriveFolder.Name).all()
    
    def get_root_folders(self, society_id: Optional[int] = None) -> List[DriveFolder]:
        """Get all root folders (no parent)"""
        return self.get_children(None, society_id)
    
    def list_folders(
        self,
        page: int = 1,
        page_size: int = 20,
        parent_id: Optional[int] = None,
        society_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        search: Optional[str] = None
    ) -> Tuple[List[DriveFolder], int]:
        """List folders with pagination and filters"""
        query = self.db.query(DriveFolder).filter(DriveFolder.IsActive == True)
        
        # Apply filters
        if parent_id is not None:
            query = query.filter(DriveFolder.ParentId == parent_id)
        
        if society_id:
            query = query.filter(DriveFolder.SocietyId == society_id)
        
        if entity_type:
            query = query.filter(DriveFolder.EntityType == entity_type)
        
        if entity_id:
            query = query.filter(DriveFolder.EntityId == entity_id)
        
        if search:
            query = query.filter(DriveFolder.Name.ilike(f"%{search}%"))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        folders = query.order_by(DriveFolder.Name).offset(offset).limit(page_size).all()
        
        return folders, total
    
    def check_name_exists(
        self, 
        name: str, 
        parent_id: Optional[int], 
        society_id: Optional[int] = None,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if folder name already exists in parent"""
        query = self.db.query(DriveFolder).filter(
            DriveFolder.Name == name,
            DriveFolder.ParentId == parent_id,
            DriveFolder.IsActive == True
        )
        if society_id:
            query = query.filter(DriveFolder.SocietyId == society_id)
        if exclude_id:
            query = query.filter(DriveFolder.Id != exclude_id)
        return query.first() is not None
    
    def build_path(self, name: str, parent_id: Optional[int]) -> str:
        """Build full path for a folder"""
        if parent_id is None:
            return f"/{name}"
        
        parent = self.get_by_id(parent_id)
        if parent:
            return f"{parent.Path}/{name}"
        return f"/{name}"
    
    def create(self, folder: DriveFolder) -> DriveFolder:
        """Create a new folder"""
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        return folder
    
    def update(self, folder: DriveFolder) -> DriveFolder:
        """Update an existing folder"""
        folder.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(folder)
        return folder
    
    def soft_delete(self, folder_id: int) -> bool:
        """Soft delete a folder"""
        folder = self.get_by_id(folder_id)
        if folder:
            folder.IsActive = False
            folder.UpdatedAt = datetime.utcnow()
            self.db.commit()
            return True
        return False
    
    def get_children_count(self, folder_id: int) -> int:
        """Get count of child folders"""
        return self.db.query(DriveFolder).filter(
            DriveFolder.ParentId == folder_id,
            DriveFolder.IsActive == True
        ).count()
    
    def get_files_count(self, folder_id: int) -> int:
        """Get count of files in folder"""
        return self.db.query(DriveFile).filter(
            DriveFile.FolderId == folder_id,
            DriveFile.IsActive == True
        ).count()
    
    def get_entity_folders(
        self, 
        entity_type: str, 
        entity_id: int,
        society_id: Optional[int] = None
    ) -> List[DriveFolder]:
        """Get all folders associated with an entity"""
        query = self.db.query(DriveFolder).filter(
            DriveFolder.EntityType == entity_type,
            DriveFolder.EntityId == entity_id,
            DriveFolder.IsActive == True
        )
        if society_id:
            query = query.filter(DriveFolder.SocietyId == society_id)
        return query.order_by(DriveFolder.Path).all()

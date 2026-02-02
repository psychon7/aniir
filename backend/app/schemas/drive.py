"""
Pydantic schemas for Drive module.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


class EntityType(str, Enum):
    """Valid entity types for file associations."""
    CLIENT = "client"
    SUPPLIER = "supplier"
    PRODUCT = "product"
    QUOTE = "quote"
    ORDER = "order"
    INVOICE = "invoice"
    PROJECT = "project"
    TASK = "task"


class DriveFileBase(BaseModel):
    """Base schema for drive files."""
    file_name: str = Field(..., max_length=255, description="Display file name")
    original_name: Optional[str] = Field(None, max_length=255, description="Original uploaded file name")
    file_type: Optional[str] = Field(None, max_length=50, description="File extension/type")
    mime_type: Optional[str] = Field(None, max_length=100, description="MIME type")
    description: Optional[str] = Field(None, max_length=500, description="File description")
    tags: Optional[List[str]] = Field(default=[], description="File tags")
    is_public: bool = Field(default=False, description="Whether file is publicly accessible")


class DriveFileCreate(DriveFileBase):
    """Schema for creating a new file record."""
    entity_type: Optional[str] = Field(None, description="Associated entity type")
    entity_id: Optional[int] = Field(None, description="Associated entity ID")
    folder_id: Optional[int] = Field(None, description="Parent folder ID")


class DriveFileUpdate(BaseModel):
    """Schema for updating a file record."""
    file_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None
    folder_id: Optional[int] = None
    is_public: Optional[bool] = None


class DriveFileResponse(BaseModel):
    """Schema for file response."""
    id: int
    file_name: str
    original_name: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    folder_id: Optional[int] = None
    description: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False
    download_count: int = 0
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


class DriveFileListResponse(BaseModel):
    """Schema for paginated file list response."""
    items: List[DriveFileResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


class DriveFolderBase(BaseModel):
    """Base schema for drive folders."""
    name: str = Field(..., max_length=255, description="Folder name")
    description: Optional[str] = Field(None, max_length=500)
    parent_id: Optional[int] = Field(None, description="Parent folder ID")
    entity_type: Optional[str] = Field(None, description="Associated entity type")
    entity_id: Optional[int] = Field(None, description="Associated entity ID")


class DriveFolderCreate(DriveFolderBase):
    """Schema for creating a folder."""
    pass


class DriveFolderResponse(DriveFolderBase):
    """Schema for folder response."""
    id: int
    path: Optional[str] = None
    file_count: int = 0
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


# =============================================================================
# Folder Schemas (Aliases for compatibility with drive.py router)
# =============================================================================

class FolderCreate(BaseModel):
    """Schema for creating a folder."""
    name: str = Field(..., max_length=255, description="Folder name")
    parent_id: Optional[int] = Field(None, description="Parent folder ID")
    permissions: Optional[dict] = None
    is_hidden: bool = False


class FolderUpdate(BaseModel):
    """Schema for updating a folder."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    is_hidden: Optional[bool] = None


class FolderMove(BaseModel):
    """Schema for moving a folder."""
    new_parent_id: Optional[int] = Field(None, description="New parent folder ID")


class FolderResponse(BaseModel):
    """Response schema for folder."""
    id: int
    name: str
    parent_id: Optional[int] = None
    path: Optional[str] = None
    file_count: int = 0
    folder_count: int = 0
    total_size: int = 0
    is_hidden: bool = False
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None

    # Aliases for different column naming conventions
    fol_id: Optional[int] = None
    fol_name: Optional[str] = None
    fol_path: Optional[str] = None
    fol_parent_id: Optional[int] = None

    class Config:
        from_attributes = True


class FolderTreeItem(BaseModel):
    """Tree item for folder hierarchy."""
    id: int
    name: str
    parent_id: Optional[int] = None
    path: Optional[str] = None
    file_count: int = 0
    children: List["FolderTreeItem"] = []


class FolderContentsResponse(BaseModel):
    """Response for folder contents."""
    folders: List[FolderResponse] = []
    files: List["FileResponse"] = []


# =============================================================================
# File Schemas (for drive router)
# =============================================================================

class FileUploadRequest(BaseModel):
    """Request for file upload URL."""
    folder_id: Optional[int] = None
    file_name: str
    file_size: int
    mime_type: str


class FileUploadResponse(BaseModel):
    """Response with presigned upload URL."""
    upload_url: str
    storage_key: str
    file_id: int
    file_name: str
    method: str = "PUT"
    expires_in: int = 3600
    headers: Optional[dict] = None


class FileConfirmUpload(BaseModel):
    """Confirm file upload completion."""
    content_hash: Optional[str] = None


class FileResponse(BaseModel):
    """File response schema."""
    id: int
    name: Optional[str] = None
    file_name: Optional[str] = None
    original_name: Optional[str] = None
    file_path: Optional[str] = None
    storage_key: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    folder_id: Optional[int] = None
    description: Optional[str] = None
    is_public: bool = False
    download_count: int = 0
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None

    # Aliases for different column naming conventions
    fil_original_name: Optional[str] = None
    fil_mime_type: Optional[str] = None
    fil_size_bytes: Optional[int] = None

    class Config:
        from_attributes = True


class FileRename(BaseModel):
    """Schema for renaming a file."""
    name: str = Field(..., max_length=255)


class FileMove(BaseModel):
    """Schema for moving a file."""
    folder_id: Optional[int] = Field(None, description="Target folder ID")


class FileAttachment(BaseModel):
    """Schema for attaching file to entity."""
    entity_type: str
    entity_id: int


class FileDownloadResponse(BaseModel):
    """Response with presigned download URL."""
    download_url: str
    file_name: str
    mime_type: Optional[str] = None
    size: Optional[int] = None
    expires_in: int = 3600


class FileSearchParams(BaseModel):
    """Search parameters for files."""
    search: Optional[str] = None
    folder_id: Optional[int] = None
    entity_type: Optional[str] = None
    file_type: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class FileListResponse(BaseModel):
    """Paginated file list response."""
    files: List[FileResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 50


class BreadcrumbItem(BaseModel):
    """Breadcrumb navigation item."""
    id: Optional[int] = None
    name: str
    path: Optional[str] = None


class DriveStatsResponse(BaseModel):
    """Drive storage statistics."""
    total_files: int = 0
    total_folders: int = 0
    total_size: int = 0
    storage_used_percent: float = 0.0
    files_by_type: dict = {}
    recent_uploads_count: int = 0


class DriveErrorResponse(BaseModel):
    """Error response for drive operations."""
    success: bool = False
    error: dict


# Update FolderTreeItem to allow recursive children
FolderTreeItem.model_rebuild()

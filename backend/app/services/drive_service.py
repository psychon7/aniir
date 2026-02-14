"""
Drive service for file management business logic.

Provides async methods for file and folder CRUD operations,
entity attachment, search, and storage statistics.
Uses asyncio.to_thread() for DB calls (pymssql compatibility).
Supports MinIO/S3 storage with fallback to local API routes.
"""
import asyncio
import json
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import Depends

from app.database import get_db
from app.models.drive import DriveFile, DriveFolder
from app.schemas.drive import DriveFileCreate, DriveFileUpdate, EntityType
from app.core.logging import get_logger

# Try to import storage service for MinIO support
try:
    from app.services.storage_service import storage_service
except ImportError:
    storage_service = None

logger = get_logger(__name__)


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
    """Service class for drive file and folder operations."""

    def __init__(self, db: Session):
        self.db = db

    # =========================================================================
    # File Operations (synchronous core)
    # =========================================================================

    def _get_file_by_id(self, file_id: int, include_deleted: bool = False) -> Optional[DriveFile]:
        """Get a single file by ID."""
        query = self.db.query(DriveFile).filter(DriveFile.Id == file_id)
        if not include_deleted:
            query = query.filter(DriveFile.IsDeleted == False)
        return query.first()

    def _search_files(
        self,
        query: Optional[str] = None,
        folder_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[DriveFile], int]:
        """Search files with filtering and pagination."""
        q = self.db.query(DriveFile).filter(DriveFile.IsDeleted == False)

        if query:
            q = q.filter(DriveFile.FileName.ilike(f"%{query}%"))

        if folder_id is not None:
            if folder_id == 0:
                q = q.filter(DriveFile.FolderId == None)
            else:
                q = q.filter(DriveFile.FolderId == folder_id)

        if entity_type:
            q = q.filter(DriveFile.EntityType == entity_type.lower())

        total = q.count()
        files = q.order_by(DriveFile.CreatedAt.desc()).offset(offset).limit(limit).all()
        return files, total

    def _get_recent_files(self, limit: int = 20) -> List[DriveFile]:
        """Get recently uploaded/modified files."""
        return (
            self.db.query(DriveFile)
            .filter(DriveFile.IsDeleted == False)
            .order_by(DriveFile.CreatedAt.desc())
            .limit(limit)
            .all()
        )

    def _get_files_by_entity(
        self, entity_type: str, entity_id: int
    ) -> List[DriveFile]:
        """Get all files associated with a specific entity."""
        return (
            self.db.query(DriveFile)
            .filter(
                DriveFile.EntityType == entity_type.lower(),
                DriveFile.EntityId == entity_id,
                DriveFile.IsDeleted == False,
            )
            .order_by(DriveFile.CreatedAt.desc())
            .all()
        )

    def _get_deleted_files(
        self, limit: int = 50, offset: int = 0
    ) -> Tuple[List[DriveFile], int]:
        """Get soft-deleted files (trash)."""
        q = self.db.query(DriveFile).filter(DriveFile.IsDeleted == True)
        total = q.count()
        files = q.order_by(DriveFile.DeletedAt.desc()).offset(offset).limit(limit).all()
        return files, total

    def _create_file_record(
        self,
        file_name: str,
        original_name: Optional[str],
        file_path: Optional[str],
        file_type: Optional[str],
        file_size: Optional[int],
        mime_type: Optional[str],
        storage_key: Optional[str],
        folder_id: Optional[int],
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None,
        is_public: bool = False,
        user_id: Optional[int] = None,
        status: str = "active",
    ) -> DriveFile:
        """Create a new file record."""
        db_file = DriveFile(
            FileName=file_name,
            OriginalName=original_name,
            FilePath=file_path,
            FileType=file_type,
            FileSize=file_size,
            MimeType=mime_type,
            StorageKey=storage_key,
            FolderId=folder_id,
            EntityType=entity_type,
            EntityId=entity_id,
            Description=description,
            Tags=tags,
            IsPublic=is_public,
            CreatedBy=user_id,
            CreatedAt=datetime.utcnow(),
            Status=status,
        )
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _rename_file(self, file_id: int, new_name: str) -> DriveFile:
        """Rename a file."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        db_file.FileName = new_name
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _move_file(self, file_id: int, folder_id: Optional[int]) -> DriveFile:
        """Move a file to a different folder."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        if folder_id is not None:
            folder = self._get_folder_by_id(folder_id)
            if not folder:
                raise FolderNotFoundError(f"Target folder {folder_id} not found")
        db_file.FolderId = folder_id
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _delete_file(self, file_id: int, hard_delete: bool = False) -> bool:
        """Delete a file (soft or hard)."""
        if hard_delete:
            db_file = self._get_file_by_id(file_id, include_deleted=True)
        else:
            db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")

        if hard_delete:
            self.db.delete(db_file)
        else:
            db_file.IsDeleted = True
            db_file.IsActive = False
            db_file.DeletedAt = datetime.utcnow()
        self.db.commit()
        return True

    def _restore_file(self, file_id: int) -> DriveFile:
        """Restore a soft-deleted file."""
        db_file = self._get_file_by_id(file_id, include_deleted=True)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        db_file.IsDeleted = False
        db_file.IsActive = True
        db_file.DeletedAt = None
        db_file.DeletedBy = None
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _attach_file_to_entity(
        self, file_id: int, entity_type: str, entity_id: int
    ) -> DriveFile:
        """Attach a file to a business entity."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        db_file.EntityType = entity_type.lower()
        db_file.EntityId = entity_id
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _detach_file_from_entity(self, file_id: int) -> DriveFile:
        """Detach a file from its business entity."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        db_file.EntityType = None
        db_file.EntityId = None
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _increment_download_count(self, file_id: int) -> bool:
        """Increment the download count for a file."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            return False
        db_file.DownloadCount = (db_file.DownloadCount or 0) + 1
        self.db.commit()
        return True

    # =========================================================================
    # Upload / Download URL Operations (synchronous core)
    # =========================================================================

    def _get_upload_url(
        self,
        folder_id: Optional[int],
        file_name: str,
        file_size: int,
        mime_type: str,
    ) -> Dict[str, Any]:
        """
        Create a pending file record and return upload metadata.
        In a real S3/MinIO setup, this would generate a presigned URL.
        For now, returns a placeholder URL for local/dev use.
        """
        # Validate folder if specified
        if folder_id is not None:
            folder = self._get_folder_by_id(folder_id)
            if not folder:
                raise FolderNotFoundError(f"Folder {folder_id} not found")

        # Derive file extension
        ext = file_name.rsplit(".", 1)[-1] if "." in file_name else None

        # Generate storage key
        import uuid
        storage_key = f"drive/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid.uuid4().hex}/{file_name}"

        # Create pending file record
        db_file = self._create_file_record(
            file_name=file_name,
            original_name=file_name,
            file_path=None,
            file_type=ext,
            file_size=file_size,
            mime_type=mime_type,
            storage_key=storage_key,
            folder_id=folder_id,
            status="pending",
        )

        # Generate upload URL - use MinIO presigned URL when available
        upload_url = f"/api/v1/drive/files/{db_file.Id}/upload"
        
        if storage_service is not None:
            try:
                # Generate presigned PUT URL for direct upload to MinIO
                from datetime import timedelta
                upload_url = storage_service.client.presigned_put_object(
                    storage_service.bucket_name,
                    storage_key,
                    expires=timedelta(hours=1),
                )
                logger.info(f"Generated MinIO presigned upload URL for {storage_key}")
            except Exception as e:
                logger.warning(f"Failed to generate MinIO presigned URL, using API fallback: {e}")

        return {
            "upload_url": upload_url,
            "storage_key": storage_key,
            "file_id": db_file.Id,
            "file_name": file_name,
        }

    def _confirm_upload(
        self, file_id: int, content_hash: Optional[str] = None
    ) -> DriveFile:
        """Confirm that a file upload has completed."""
        db_file = self._get_file_by_id(file_id, include_deleted=False)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")

        db_file.Status = "active"
        if content_hash:
            db_file.ContentHash = content_hash
        db_file.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def _get_download_url(
        self, file_id: int, expires_in: int = 3600
    ) -> str:
        """
        Get a download URL for a file.
        Uses MinIO presigned URL when available, falls back to API route.
        """
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            raise FileNotFoundError(f"File with ID {file_id} not found")

        self._increment_download_count(file_id)

        # Generate presigned URL for MinIO when available
        if storage_service is not None and db_file.StorageKey:
            try:
                expires_hours = expires_in // 3600 if expires_in >= 3600 else 1
                return storage_service.get_presigned_url(db_file.StorageKey, expires_hours)
            except Exception as e:
                logger.warning(f"Failed to generate MinIO presigned URL, using API fallback: {e}")
        
        # Fallback to API route
        return f"/api/v1/drive/files/{file_id}/content"

    # =========================================================================
    # Folder Operations (synchronous core)
    # =========================================================================

    def _get_folder_by_id(self, folder_id: int) -> Optional[DriveFolder]:
        """Get folder by ID."""
        return (
            self.db.query(DriveFolder)
            .filter(DriveFolder.Id == folder_id, DriveFolder.IsActive == True)
            .first()
        )

    def _create_folder(
        self,
        name: str,
        parent_id: Optional[int] = None,
        permissions: Optional[dict] = None,
        is_hidden: bool = False,
    ) -> DriveFolder:
        """Create a new folder."""
        # Validate parent exists
        if parent_id is not None:
            parent = self._get_folder_by_id(parent_id)
            if not parent:
                raise FolderNotFoundError(f"Parent folder {parent_id} not found")

        # Build path
        if parent_id is None:
            path = f"/{name}"
        else:
            parent = self._get_folder_by_id(parent_id)
            path = f"{parent.Path}/{name}" if parent and parent.Path else f"/{name}"

        permissions_str = json.dumps(permissions) if permissions else None

        folder = DriveFolder(
            Name=name,
            Path=path,
            ParentId=parent_id,
            IsHidden=is_hidden,
            Permissions=permissions_str,
            IsActive=True,
            CreatedAt=datetime.utcnow(),
        )
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        return folder

    def _get_folder_contents(
        self,
        folder_id: Optional[int] = None,
        include_hidden: bool = False,
    ) -> Dict[str, Any]:
        """Get subfolders and files in a folder."""
        # Get subfolders
        folder_query = self.db.query(DriveFolder).filter(
            DriveFolder.IsActive == True
        )
        if folder_id is None:
            folder_query = folder_query.filter(DriveFolder.ParentId == None)
        else:
            folder_query = folder_query.filter(DriveFolder.ParentId == folder_id)

        if not include_hidden:
            folder_query = folder_query.filter(DriveFolder.IsHidden == False)

        folders = folder_query.order_by(DriveFolder.Name).all()

        # Get files
        file_query = self.db.query(DriveFile).filter(DriveFile.IsDeleted == False)
        if folder_id is None:
            file_query = file_query.filter(DriveFile.FolderId == None)
        else:
            file_query = file_query.filter(DriveFile.FolderId == folder_id)

        files = file_query.order_by(DriveFile.CreatedAt.desc()).all()

        return {"folders": folders, "files": files}

    def _get_folder_tree(
        self,
        root_folder_id: Optional[int] = None,
        max_depth: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get hierarchical folder tree."""

        def build_tree(parent_id: Optional[int], depth: int) -> List[Dict[str, Any]]:
            if depth <= 0:
                return []
            folders = (
                self.db.query(DriveFolder)
                .filter(
                    DriveFolder.ParentId == parent_id,
                    DriveFolder.IsActive == True,
                )
                .order_by(DriveFolder.Name)
                .all()
            )
            result = []
            for f in folders:
                file_count = (
                    self.db.query(DriveFile)
                    .filter(DriveFile.FolderId == f.Id, DriveFile.IsDeleted == False)
                    .count()
                )
                result.append({
                    "id": f.Id,
                    "name": f.Name,
                    "parent_id": f.ParentId,
                    "path": f.Path,
                    "file_count": file_count,
                    "children": build_tree(f.Id, depth - 1),
                })
            return result

        return build_tree(root_folder_id, max_depth)

    def _rename_folder(self, folder_id: int, new_name: str) -> DriveFolder:
        """Rename a folder."""
        folder = self._get_folder_by_id(folder_id)
        if not folder:
            raise FolderNotFoundError(f"Folder with ID {folder_id} not found")
        folder.Name = new_name
        # Update path
        if folder.ParentId is None:
            folder.Path = f"/{new_name}"
        else:
            parent = self._get_folder_by_id(folder.ParentId)
            if parent and parent.Path:
                folder.Path = f"{parent.Path}/{new_name}"
        folder.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(folder)
        return folder

    def _move_folder(
        self, folder_id: int, new_parent_id: Optional[int]
    ) -> DriveFolder:
        """Move a folder to a new parent."""
        folder = self._get_folder_by_id(folder_id)
        if not folder:
            raise FolderNotFoundError(f"Folder with ID {folder_id} not found")

        if new_parent_id is not None:
            new_parent = self._get_folder_by_id(new_parent_id)
            if not new_parent:
                raise FolderNotFoundError(f"Target parent folder {new_parent_id} not found")
            # Prevent moving a folder into its own subtree
            if new_parent_id == folder_id:
                raise DriveServiceError("Cannot move a folder into itself")

        folder.ParentId = new_parent_id
        # Rebuild path
        if new_parent_id is None:
            folder.Path = f"/{folder.Name}"
        else:
            parent = self._get_folder_by_id(new_parent_id)
            folder.Path = f"{parent.Path}/{folder.Name}" if parent and parent.Path else f"/{folder.Name}"
        folder.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(folder)
        return folder

    def _delete_folder(self, folder_id: int, hard_delete: bool = False) -> bool:
        """Delete a folder (soft or hard)."""
        folder = self._get_folder_by_id(folder_id)
        if not folder:
            raise FolderNotFoundError(f"Folder with ID {folder_id} not found")

        if hard_delete:
            # Hard delete: remove files in folder first
            files = (
                self.db.query(DriveFile)
                .filter(DriveFile.FolderId == folder_id)
                .all()
            )
            for f in files:
                self.db.delete(f)
            # Delete child folders recursively
            children = (
                self.db.query(DriveFolder)
                .filter(DriveFolder.ParentId == folder_id)
                .all()
            )
            for child in children:
                self._delete_folder(child.Id, hard_delete=True)
            self.db.delete(folder)
        else:
            folder.IsActive = False
            folder.UpdatedAt = datetime.utcnow()
            # Soft delete files in folder
            files = (
                self.db.query(DriveFile)
                .filter(DriveFile.FolderId == folder_id, DriveFile.IsDeleted == False)
                .all()
            )
            for f in files:
                f.IsDeleted = True
                f.IsActive = False
                f.DeletedAt = datetime.utcnow()

        self.db.commit()
        return True

    def _restore_folder(self, folder_id: int) -> DriveFolder:
        """Restore a soft-deleted folder."""
        folder = (
            self.db.query(DriveFolder)
            .filter(DriveFolder.Id == folder_id, DriveFolder.IsActive == False)
            .first()
        )
        if not folder:
            raise FolderNotFoundError(f"Folder with ID {folder_id} not found or not deleted")
        folder.IsActive = True
        folder.UpdatedAt = datetime.utcnow()
        self.db.commit()
        self.db.refresh(folder)
        return folder

    def _get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics."""
        total_files = (
            self.db.query(func.count(DriveFile.Id))
            .filter(DriveFile.IsDeleted == False)
            .scalar()
            or 0
        )
        total_folders = (
            self.db.query(func.count(DriveFolder.Id))
            .filter(DriveFolder.IsActive == True)
            .scalar()
            or 0
        )
        total_size = (
            self.db.query(func.sum(DriveFile.FileSize))
            .filter(DriveFile.IsDeleted == False)
            .scalar()
            or 0
        )

        # Files by type
        type_rows = (
            self.db.query(DriveFile.FileType, func.count(DriveFile.Id))
            .filter(DriveFile.IsDeleted == False, DriveFile.FileType != None)
            .group_by(DriveFile.FileType)
            .all()
        )
        files_by_type = {row[0]: row[1] for row in type_rows}

        # Recent uploads (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = (
            self.db.query(func.count(DriveFile.Id))
            .filter(DriveFile.IsDeleted == False, DriveFile.CreatedAt >= week_ago)
            .scalar()
            or 0
        )

        return {
            "total_files": total_files,
            "total_folders": total_folders,
            "total_size": total_size,
            "storage_used_percent": 0.0,  # Would need storage quota config
            "files_by_type": files_by_type,
            "recent_uploads_count": recent_count,
        }

    # =========================================================================
    # Async Public API (called by the router endpoints)
    # =========================================================================

    async def get_file_by_id(self, file_id: int) -> Optional[DriveFile]:
        return await asyncio.to_thread(self._get_file_by_id, file_id)

    async def search_files(
        self,
        query: Optional[str] = None,
        folder_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[DriveFile], int]:
        return await asyncio.to_thread(
            self._search_files, query, folder_id, entity_type, limit, offset
        )

    async def get_recent_files(self, limit: int = 20) -> List[DriveFile]:
        return await asyncio.to_thread(self._get_recent_files, limit)

    async def get_entity_files(
        self, entity_type: str, entity_id: int
    ) -> List[DriveFile]:
        return await asyncio.to_thread(self._get_files_by_entity, entity_type, entity_id)

    async def get_deleted_files(
        self, limit: int = 50, offset: int = 0
    ) -> Tuple[List[DriveFile], int]:
        return await asyncio.to_thread(self._get_deleted_files, limit, offset)

    async def rename_file(self, file_id: int, new_name: str) -> DriveFile:
        return await asyncio.to_thread(self._rename_file, file_id, new_name)

    async def move_file(
        self, file_id: int, folder_id: Optional[int]
    ) -> DriveFile:
        return await asyncio.to_thread(self._move_file, file_id, folder_id)

    async def delete_file(self, file_id: int, hard_delete: bool = False) -> bool:
        return await asyncio.to_thread(self._delete_file, file_id, hard_delete)

    async def restore_file(self, file_id: int) -> DriveFile:
        return await asyncio.to_thread(self._restore_file, file_id)

    async def attach_file_to_entity(
        self, file_id: int, entity_type: str, entity_id: int
    ) -> DriveFile:
        return await asyncio.to_thread(
            self._attach_file_to_entity, file_id, entity_type, entity_id
        )

    async def detach_file_from_entity(self, file_id: int) -> DriveFile:
        return await asyncio.to_thread(self._detach_file_from_entity, file_id)

    async def get_upload_url(
        self,
        folder_id: Optional[int],
        file_name: str,
        file_size: int,
        mime_type: str,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._get_upload_url, folder_id, file_name, file_size, mime_type
        )

    async def confirm_upload(
        self, file_id: int, content_hash: Optional[str] = None
    ) -> DriveFile:
        return await asyncio.to_thread(self._confirm_upload, file_id, content_hash)

    async def get_download_url(
        self, file_id: int, expires_in: int = 3600
    ) -> str:
        return await asyncio.to_thread(self._get_download_url, file_id, expires_in)

    # --- Folder async methods ---

    async def get_folder_by_id(self, folder_id: int) -> Optional[DriveFolder]:
        return await asyncio.to_thread(self._get_folder_by_id, folder_id)

    async def create_folder(
        self,
        name: str,
        parent_id: Optional[int] = None,
        permissions: Optional[dict] = None,
        is_hidden: bool = False,
    ) -> DriveFolder:
        return await asyncio.to_thread(
            self._create_folder, name, parent_id, permissions, is_hidden
        )

    async def get_folder_contents(
        self,
        folder_id: Optional[int] = None,
        include_hidden: bool = False,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._get_folder_contents, folder_id, include_hidden
        )

    async def get_folder_tree(
        self,
        root_folder_id: Optional[int] = None,
        max_depth: int = 10,
    ) -> List[Dict[str, Any]]:
        return await asyncio.to_thread(
            self._get_folder_tree, root_folder_id, max_depth
        )

    async def rename_folder(self, folder_id: int, new_name: str) -> DriveFolder:
        return await asyncio.to_thread(self._rename_folder, folder_id, new_name)

    async def move_folder(
        self, folder_id: int, new_parent_id: Optional[int]
    ) -> DriveFolder:
        return await asyncio.to_thread(self._move_folder, folder_id, new_parent_id)

    async def delete_folder(
        self, folder_id: int, hard_delete: bool = False
    ) -> bool:
        return await asyncio.to_thread(self._delete_folder, folder_id, hard_delete)

    async def restore_folder(self, folder_id: int) -> DriveFolder:
        return await asyncio.to_thread(self._restore_folder, folder_id)

    async def get_storage_stats(self) -> Dict[str, Any]:
        return await asyncio.to_thread(self._get_storage_stats)

    # =========================================================================
    # Legacy sync methods (used by old service code / direct callers)
    # =========================================================================

    def get_files(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        folder_id: Optional[int] = None,
        search: Optional[str] = None,
        file_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[DriveFile], int]:
        """Get files with filtering and pagination (sync, legacy)."""
        query = self.db.query(DriveFile).filter(DriveFile.IsDeleted == False)

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

        total_count = query.count()
        offset = (page - 1) * page_size
        files = query.order_by(DriveFile.CreatedAt.desc()).offset(offset).limit(page_size).all()
        return files, total_count

    def create_file(
        self,
        file_data: DriveFileCreate,
        file_path: str,
        file_size: int,
        user_id: int,
    ) -> DriveFile:
        """Create a new file record (sync, legacy)."""
        tags_str = ",".join(file_data.tags) if file_data.tags else None
        return self._create_file_record(
            file_name=file_data.file_name,
            original_name=file_data.original_name,
            file_path=file_path,
            file_type=file_data.file_type,
            file_size=file_size,
            mime_type=file_data.mime_type,
            storage_key=None,
            folder_id=file_data.folder_id,
            entity_type=file_data.entity_type,
            entity_id=file_data.entity_id,
            description=file_data.description,
            tags=tags_str,
            is_public=file_data.is_public,
            user_id=user_id,
        )

    def update_file(
        self,
        file_id: int,
        file_data: DriveFileUpdate,
        user_id: int,
    ) -> Optional[DriveFile]:
        """Update a file record (sync, legacy)."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            return None

        update_data = file_data.model_dump(exclude_unset=True)

        # Handle tags conversion
        if "tags" in update_data and update_data["tags"] is not None:
            db_file.Tags = ",".join(update_data.pop("tags"))
        elif "tags" in update_data:
            update_data.pop("tags")

        field_mapping = {
            "file_name": "FileName",
            "description": "Description",
            "folder_id": "FolderId",
            "is_public": "IsPublic",
        }
        for schema_field, model_field in field_mapping.items():
            if schema_field in update_data:
                setattr(db_file, model_field, update_data[schema_field])

        db_file.UpdatedBy = user_id
        db_file.UpdatedAt = datetime.utcnow()

        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def delete_file_sync(self, file_id: int, user_id: int) -> bool:
        """Soft delete a file (sync, legacy)."""
        db_file = self._get_file_by_id(file_id)
        if not db_file:
            return False
        db_file.IsDeleted = True
        db_file.DeletedAt = datetime.utcnow()
        db_file.DeletedBy = user_id
        self.db.commit()
        return True

    def increment_download_count(self, file_id: int) -> bool:
        """Increment download count (sync, legacy)."""
        return self._increment_download_count(file_id)

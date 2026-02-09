"""
Drive API Router.

Provides REST API endpoints for:
- File upload via presigned URLs
- File download via presigned URLs
- File CRUD operations
- Folder CRUD operations
- Entity file attachments
- Storage statistics
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.drive_service import (
    DriveService,
    DriveServiceError,
    FolderNotFoundError,
    FileNotFoundError,
    PermissionDeniedError,
    InvalidEntityTypeError,
    StorageError
)
from app.schemas.drive import (
    # Folder schemas
    FolderCreate, FolderUpdate, FolderMove,
    FolderResponse, FolderTreeItem, FolderContentsResponse,
    # File schemas
    FileUploadRequest, FileUploadResponse, FileConfirmUpload,
    FileResponse, FileRename, FileMove, FileAttachment, FileDownloadResponse,
    # Search and stats
    FileSearchParams, FileListResponse, DriveStatsResponse,
    BreadcrumbItem, DriveErrorResponse
)

router = APIRouter(prefix="/drive", tags=["Drive"])


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_drive_service(db: Session = Depends(get_db)) -> DriveService:
    """Get drive service instance."""
    return DriveService(db)


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_drive_error(error: DriveServiceError) -> HTTPException:
    """Convert DriveServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "DRIVE_ERROR"

    if isinstance(error, FolderNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "FOLDER_NOT_FOUND"
    elif isinstance(error, FileNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "FILE_NOT_FOUND"
    elif isinstance(error, PermissionDeniedError):
        status_code = status.HTTP_403_FORBIDDEN
        error_code = "PERMISSION_DENIED"
    elif isinstance(error, InvalidEntityTypeError):
        status_code = status.HTTP_400_BAD_REQUEST
        error_code = "INVALID_ENTITY_TYPE"
    elif isinstance(error, StorageError):
        status_code = status.HTTP_502_BAD_GATEWAY
        error_code = "STORAGE_ERROR"

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(error)
            }
        }
    )


# ==========================================================================
# File Upload Endpoints (Presigned URL)
# ==========================================================================

@router.post(
    "/files/upload-url",
    response_model=FileUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get presigned URL for file upload",
    description="""
    Request a presigned URL for direct file upload to S3/MinIO.

    This endpoint:
    1. Validates the target folder exists (if specified)
    2. Creates a pending file record in the database
    3. Generates a presigned PUT URL for direct upload

    After receiving the response, the client should:
    1. Use the `upload_url` with a PUT request to upload the file directly
    2. Include the Content-Type header matching the `mime_type`
    3. Call the confirm endpoint after successful upload

    The presigned URL expires after 1 hour.
    """
)
async def get_upload_url(
    data: FileUploadRequest,
    service: DriveService = Depends(get_drive_service)
):
    """Get presigned URL for direct file upload."""
    try:
        result = await service.get_upload_url(
            folder_id=data.folder_id,
            file_name=data.file_name,
            file_size=data.file_size,
            mime_type=data.mime_type
        )

        return FileUploadResponse(
            upload_url=result["upload_url"],
            storage_key=result["storage_key"],
            file_id=result["file_id"],
            file_name=result["file_name"],
            method="PUT",
            expires_in=3600,
            headers={"Content-Type": data.mime_type}
        )
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.post(
    "/files/{file_id}/confirm",
    response_model=FileResponse,
    status_code=status.HTTP_200_OK,
    summary="Confirm file upload completed",
    description="""
    Confirm that a file upload has been completed successfully.

    This endpoint:
    1. Verifies the file exists in S3/MinIO storage
    2. Updates the file record with the final URL
    3. Optionally stores the content hash for integrity verification

    Should be called after successfully uploading the file to the presigned URL.
    """
)
async def confirm_upload(
    file_id: int = Path(..., description="File ID from upload-url response"),
    data: Optional[FileConfirmUpload] = None,
    service: DriveService = Depends(get_drive_service)
):
    """Confirm file upload completed."""
    try:
        content_hash = data.content_hash if data else None
        file = await service.confirm_upload(file_id, content_hash=content_hash)
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# File Download Endpoint
# ==========================================================================

@router.get(
    "/files/{file_id}/download",
    response_model=FileDownloadResponse,
    summary="Get presigned URL for file download",
    description="""
    Get a presigned URL for downloading a file.

    The returned URL can be used directly by the client to download the file.
    The URL includes the Content-Disposition header for proper filename handling.
    """
)
async def get_download_url(
    file_id: int = Path(..., description="File ID"),
    expires_in: int = Query(3600, ge=60, le=86400, description="URL expiration in seconds"),
    service: DriveService = Depends(get_drive_service)
):
    """Get presigned URL for file download."""
    try:
        file = await service.get_file_by_id(file_id)
        if not file:
            raise FileNotFoundError(f"File with ID {file_id} not found")

        download_url = await service.get_download_url(file_id, expires_in=expires_in)

        return FileDownloadResponse(
            download_url=download_url,
            file_name=file.fil_original_name,
            mime_type=file.fil_mime_type,
            size=file.fil_size_bytes,
            expires_in=expires_in
        )
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# File CRUD Endpoints
# ==========================================================================

@router.get(
    "/files",
    response_model=FileListResponse,
    summary="Search and list files",
    description="Search files with optional filters and pagination."
)
async def search_files(
    search: Optional[str] = Query(None, description="Search query"),
    folder_id: Optional[int] = Query(None, description="Filter by folder ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    service: DriveService = Depends(get_drive_service)
):
    """Search and list files."""
    try:
        files, total = await service.search_files(
            query=search,
            folder_id=folder_id,
            entity_type=entity_type,
            limit=limit,
            offset=skip
        )

        return FileListResponse(
            files=[FileResponse.model_validate(f) for f in files],
            total=total,
            skip=skip,
            limit=limit
        )
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/files/recent",
    response_model=List[FileResponse],
    summary="Get recent files"
)
async def get_recent_files(
    limit: int = Query(20, ge=1, le=50, description="Maximum files to return"),
    service: DriveService = Depends(get_drive_service)
):
    """Get recently uploaded/modified files."""
    try:
        files = await service.get_recent_files(limit=limit)
        return [FileResponse.model_validate(f) for f in files]
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/files/{file_id}",
    response_model=FileResponse,
    summary="Get file by ID"
)
async def get_file(
    file_id: int = Path(..., description="File ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Get file details by ID."""
    try:
        file = await service.get_file_by_id(file_id)
        if not file:
            raise FileNotFoundError(f"File with ID {file_id} not found")
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.put(
    "/files/{file_id}",
    response_model=FileResponse,
    summary="Rename a file"
)
async def rename_file(
    file_id: int = Path(..., description="File ID"),
    data: FileRename = None,
    service: DriveService = Depends(get_drive_service)
):
    """Rename a file."""
    try:
        file = await service.rename_file(file_id, data.name)
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.put(
    "/files/{file_id}/move",
    response_model=FileResponse,
    summary="Move a file to another folder"
)
async def move_file(
    file_id: int = Path(..., description="File ID"),
    data: FileMove = None,
    service: DriveService = Depends(get_drive_service)
):
    """Move a file to another folder."""
    try:
        file = await service.move_file(file_id, data.folder_id)
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.delete(
    "/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file"
)
async def delete_file(
    file_id: int = Path(..., description="File ID"),
    hard: bool = Query(False, description="Permanently delete from storage"),
    service: DriveService = Depends(get_drive_service)
):
    """Delete a file (soft delete by default)."""
    try:
        await service.delete_file(file_id, hard_delete=hard)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.post(
    "/files/{file_id}/restore",
    response_model=FileResponse,
    summary="Restore a deleted file"
)
async def restore_file(
    file_id: int = Path(..., description="File ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Restore a soft-deleted file."""
    try:
        file = await service.restore_file(file_id)
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# Entity Attachment Endpoints
# ==========================================================================

@router.post(
    "/files/{file_id}/attach",
    response_model=FileResponse,
    summary="Attach file to entity"
)
async def attach_file(
    file_id: int = Path(..., description="File ID"),
    data: FileAttachment = None,
    service: DriveService = Depends(get_drive_service)
):
    """Attach a file to a business entity (Invoice, Quote, etc.)."""
    try:
        file = await service.attach_file_to_entity(
            file_id=file_id,
            entity_type=data.entity_type,
            entity_id=data.entity_id
        )
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.delete(
    "/files/{file_id}/attach",
    response_model=FileResponse,
    summary="Detach file from entity"
)
async def detach_file(
    file_id: int = Path(..., description="File ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Detach a file from its business entity."""
    try:
        file = await service.detach_file_from_entity(file_id)
        return FileResponse.model_validate(file)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/entities/{entity_type}/{entity_id}/files",
    response_model=List[FileResponse],
    summary="Get files attached to entity"
)
async def get_entity_files(
    entity_type: str = Path(..., description="Entity type"),
    entity_id: int = Path(..., description="Entity ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Get all files attached to a specific entity."""
    try:
        files = await service.get_entity_files(entity_type, entity_id)
        return [FileResponse.model_validate(f) for f in files]
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# Folder Endpoints
# ==========================================================================

@router.post(
    "/folders",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new folder"
)
async def create_folder(
    data: FolderCreate,
    service: DriveService = Depends(get_drive_service)
):
    """Create a new folder."""
    try:
        folder = await service.create_folder(
            name=data.name,
            parent_id=data.parent_id,
            permissions=data.permissions,
            is_hidden=data.is_hidden
        )
        return FolderResponse.model_validate(folder)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/folders/tree",
    response_model=List[FolderTreeItem],
    summary="Get folder tree structure"
)
async def get_folder_tree(
    root_id: Optional[int] = Query(None, description="Starting folder ID"),
    max_depth: int = Query(10, ge=1, le=20, description="Maximum tree depth"),
    service: DriveService = Depends(get_drive_service)
):
    """Get hierarchical folder tree structure."""
    try:
        tree = await service.get_folder_tree(root_folder_id=root_id, max_depth=max_depth)
        return tree
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/folders",
    response_model=List[FolderResponse],
    summary="List folders in a parent"
)
async def list_folders(
    parent_id: Optional[int] = Query(None, description="Parent folder ID (null for root)"),
    include_hidden: bool = Query(False, description="Include hidden folders"),
    service: DriveService = Depends(get_drive_service)
):
    """List folders in a specific parent (or root)."""
    try:
        result = await service.get_folder_contents(
            folder_id=parent_id,
            include_hidden=include_hidden
        )
        return [FolderResponse.model_validate(f) for f in result["folders"]]
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/folders/{folder_id}",
    response_model=FolderResponse,
    summary="Get folder by ID"
)
async def get_folder(
    folder_id: int = Path(..., description="Folder ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Get folder details by ID."""
    try:
        folder = await service.get_folder_by_id(folder_id)
        if not folder:
            raise FolderNotFoundError(f"Folder with ID {folder_id} not found")
        return FolderResponse.model_validate(folder)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.get(
    "/folders/{folder_id}/contents",
    response_model=FolderContentsResponse,
    summary="Get folder contents"
)
async def get_folder_contents(
    folder_id: int = Path(..., description="Folder ID (use 0 for root)"),
    include_hidden: bool = Query(False, description="Include hidden items"),
    service: DriveService = Depends(get_drive_service)
):
    """Get subfolders and files in a folder."""
    try:
        # Convert 0 to None for root folder
        actual_folder_id = None if folder_id == 0 else folder_id

        result = await service.get_folder_contents(
            folder_id=actual_folder_id,
            include_hidden=include_hidden
        )
        return FolderContentsResponse(
            folders=[FolderResponse.model_validate(f) for f in result["folders"]],
            files=[FileResponse.model_validate(f) for f in result["files"]]
        )
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.put(
    "/folders/{folder_id}",
    response_model=FolderResponse,
    summary="Rename a folder"
)
async def rename_folder(
    folder_id: int = Path(..., description="Folder ID"),
    data: FolderUpdate = None,
    service: DriveService = Depends(get_drive_service)
):
    """Rename a folder."""
    try:
        folder = await service.rename_folder(folder_id, data.name)
        return FolderResponse.model_validate(folder)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.put(
    "/folders/{folder_id}/move",
    response_model=FolderResponse,
    summary="Move a folder"
)
async def move_folder(
    folder_id: int = Path(..., description="Folder ID"),
    data: FolderMove = None,
    service: DriveService = Depends(get_drive_service)
):
    """Move a folder to a new parent."""
    try:
        folder = await service.move_folder(folder_id, data.new_parent_id)
        return FolderResponse.model_validate(folder)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.delete(
    "/folders/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a folder"
)
async def delete_folder(
    folder_id: int = Path(..., description="Folder ID"),
    hard: bool = Query(False, description="Permanently delete"),
    service: DriveService = Depends(get_drive_service)
):
    """Delete a folder and all its contents."""
    try:
        await service.delete_folder(folder_id, hard_delete=hard)
    except DriveServiceError as e:
        raise handle_drive_error(e)


@router.post(
    "/folders/{folder_id}/restore",
    response_model=FolderResponse,
    summary="Restore a deleted folder"
)
async def restore_folder(
    folder_id: int = Path(..., description="Folder ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Restore a soft-deleted folder."""
    try:
        folder = await service.restore_folder(folder_id)
        return FolderResponse.model_validate(folder)
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# Breadcrumb Endpoint
# ==========================================================================

@router.get(
    "/breadcrumbs",
    response_model=List[BreadcrumbItem],
    summary="Get breadcrumb trail"
)
async def get_breadcrumbs(
    folder_id: Optional[int] = Query(None, description="Target folder ID"),
    service: DriveService = Depends(get_drive_service)
):
    """Get breadcrumb navigation trail for a folder."""
    try:
        breadcrumbs = [BreadcrumbItem(id=None, name="Root", path="/")]

        if folder_id is None:
            return breadcrumbs

        # Build breadcrumb trail by traversing up
        current_id = folder_id
        folder_chain = []

        while current_id is not None:
            folder = await service.get_folder_by_id(current_id)
            if not folder:
                break
            folder_chain.append(BreadcrumbItem(
                id=folder.fol_id,
                name=folder.fol_name,
                path=folder.fol_path
            ))
            current_id = folder.fol_parent_id

        # Reverse to get root-to-current order
        folder_chain.reverse()
        breadcrumbs.extend(folder_chain)

        return breadcrumbs
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# Stats Endpoint
# ==========================================================================

@router.get(
    "/stats",
    response_model=DriveStatsResponse,
    summary="Get drive storage statistics"
)
async def get_stats(
    service: DriveService = Depends(get_drive_service)
):
    """Get storage statistics for the drive."""
    try:
        stats = await service.get_storage_stats()
        return DriveStatsResponse(**stats)
    except DriveServiceError as e:
        raise handle_drive_error(e)


# ==========================================================================
# Trash/Deleted Files Endpoint
# ==========================================================================

@router.get(
    "/trash",
    response_model=FileListResponse,
    summary="Get deleted files (trash)"
)
async def get_trash(
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    service: DriveService = Depends(get_drive_service)
):
    """Get soft-deleted files (trash bin)."""
    try:
        files, total = await service.get_deleted_files(limit=limit, offset=skip)
        return FileListResponse(
            files=[FileResponse.model_validate(f) for f in files],
            total=total,
            skip=skip,
            limit=limit
        )
    except DriveServiceError as e:
        raise handle_drive_error(e)

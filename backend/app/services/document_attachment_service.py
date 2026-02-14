"""
Document Attachment Service
Handles file attachments for invoices, quotes, orders, etc.
Supports MinIO/S3 storage with local filesystem fallback.
"""
import io
import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional, BinaryIO
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import UploadFile, HTTPException

from app.models.document_attachment import DocumentAttachment
from app.schemas.document_attachment import (
    DocumentAttachmentCreate,
    DocumentAttachmentResponse,
    EntityType
)
from app.core.logging import get_logger

# Try to import storage service for MinIO support
try:
    from app.services.storage_service import storage_service
except ImportError:
    storage_service = None

logger = get_logger(__name__)


# Configure upload directory
UPLOAD_BASE_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp',
    '.txt', '.zip', '.rar'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


class DocumentAttachmentService:
    """Service for managing document attachments"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _get_upload_path(self, entity_type: str) -> Path:
        """Get the upload directory path for an entity type"""
        base_path = Path(UPLOAD_BASE_DIR) / entity_type.lower()
        base_path.mkdir(parents=True, exist_ok=True)
        return base_path
    
    def _validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file"""
        # Check file extension
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size (if content-length header is available)
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename to prevent collisions"""
        ext = Path(original_filename).suffix
        unique_id = uuid.uuid4().hex[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = Path(original_filename).stem[:50]  # Limit original name length
        # Remove special characters
        safe_name = "".join(c for c in safe_name if c.isalnum() or c in "._-")
        return f"{safe_name}_{timestamp}_{unique_id}{ext}"
    
    async def upload_attachment(
        self,
        file: UploadFile,
        entity_type: EntityType,
        entity_id: int,
        description: Optional[str] = None,
        uploaded_by: Optional[int] = None
    ) -> DocumentAttachment:
        """Upload a file and create an attachment record.
        
        Uses MinIO storage when available, falls back to local filesystem.
        """
        # Validate file
        self._validate_file(file)
        
        # Generate unique filename
        unique_filename = self._generate_unique_filename(file.filename)
        storage_path = f"attachments/{entity_type.value}/{unique_filename}"
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Try MinIO first, fallback to local filesystem
        if storage_service is not None:
            try:
                file_io = io.BytesIO(file_content)
                url = storage_service.upload_file(
                    file_data=file_io,
                    filename=storage_path,
                    content_type=file.content_type or "application/octet-stream"
                )
                file_path = storage_path  # Use S3 path
                logger.info(f"Uploaded attachment to MinIO: {storage_path}")
            except Exception as e:
                logger.warning(f"MinIO upload failed, falling back to local: {e}")
                file_path = await self._save_to_local(file_content, entity_type, unique_filename)
        else:
            file_path = await self._save_to_local(file_content, entity_type, unique_filename)
        
        # Create database record
        attachment = DocumentAttachment(
            entity_type=entity_type.value,
            entity_id=entity_id,
            file_name=file.filename,
            file_path=str(file_path),
            file_size=file_size,
            file_type=file.content_type,
            description=description,
            uploaded_by=uploaded_by,
            uploaded_at=datetime.utcnow()
        )
        
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        
        return attachment
    
    async def _save_to_local(
        self,
        file_content: bytes,
        entity_type: EntityType,
        unique_filename: str
    ) -> str:
        """Save file to local filesystem."""
        upload_dir = self._get_upload_path(entity_type.value)
        file_path = upload_dir / unique_filename
        
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            logger.info(f"Saved attachment locally: {file_path}")
            return str(file_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
    
    def get_attachments(
        self,
        entity_type: EntityType,
        entity_id: int
    ) -> List[DocumentAttachment]:
        """Get all attachments for an entity"""
        return self.db.query(DocumentAttachment).filter(
            and_(
                DocumentAttachment.entity_type == entity_type.value,
                DocumentAttachment.entity_id == entity_id
            )
        ).order_by(DocumentAttachment.uploaded_at.desc()).all()
    
    def get_attachment_by_id(self, attachment_id: int) -> Optional[DocumentAttachment]:
        """Get a specific attachment by ID"""
        return self.db.query(DocumentAttachment).filter(
            DocumentAttachment.id == attachment_id
        ).first()
    
    def delete_attachment(self, attachment_id: int) -> bool:
        """Delete an attachment and its file from storage."""
        attachment = self.get_attachment_by_id(attachment_id)
        if not attachment:
            return False
        
        # Determine if file is in MinIO or local filesystem
        file_path = attachment.file_path
        
        if file_path.startswith("attachments/") and storage_service is not None:
            # File is in MinIO
            try:
                storage_service.delete_file(file_path)
                logger.info(f"Deleted attachment from MinIO: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete file from MinIO {file_path}: {e}")
        else:
            # File is on local filesystem
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Deleted attachment from local: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete local file {file_path}: {e}")
        
        # Delete database record
        self.db.delete(attachment)
        self.db.commit()
        
        return True
    
    def update_description(
        self,
        attachment_id: int,
        description: str
    ) -> Optional[DocumentAttachment]:
        """Update attachment description"""
        attachment = self.get_attachment_by_id(attachment_id)
        if not attachment:
            return None
        
        attachment.description = description
        self.db.commit()
        self.db.refresh(attachment)
        
        return attachment
    
    def get_file_content(self, attachment: DocumentAttachment) -> Optional[bytes]:
        """Get file content from storage (MinIO or local filesystem)."""
        file_path = attachment.file_path
        
        if file_path.startswith("attachments/") and storage_service is not None:
            # File is in MinIO
            try:
                return storage_service.get_file(file_path)
            except Exception as e:
                logger.error(f"Failed to get file from MinIO {file_path}: {e}")
                return None
        else:
            # File is on local filesystem
            try:
                if os.path.exists(file_path):
                    with open(file_path, "rb") as f:
                        return f.read()
                return None
            except Exception as e:
                logger.error(f"Failed to read local file {file_path}: {e}")
                return None
    
    def get_download_url(self, attachment: DocumentAttachment, base_url: str = "") -> str:
        """Get download URL for attachment (presigned for MinIO, API route for local)."""
        file_path = attachment.file_path
        
        if file_path.startswith("attachments/") and storage_service is not None:
            # Generate presigned URL for MinIO
            try:
                return storage_service.get_presigned_url(file_path, expires_hours=1)
            except Exception as e:
                logger.warning(f"Failed to get presigned URL, using API route: {e}")
        
        # Fallback to API download route
        return f"{base_url}/api/v1/attachments/{attachment.id}/download"

    def to_response(self, attachment: DocumentAttachment, base_url: str = "") -> DocumentAttachmentResponse:
        """Convert attachment model to response schema"""
        uploader_name = None
        if attachment.uploader:
            uploader_name = f"{attachment.uploader.first_name} {attachment.uploader.last_name}".strip()
        
        return DocumentAttachmentResponse(
            id=attachment.id,
            entity_type=attachment.entity_type,
            entity_id=attachment.entity_id,
            file_name=attachment.file_name,
            file_path=attachment.file_path,
            file_size=attachment.file_size,
            file_type=attachment.file_type,
            description=attachment.description,
            uploaded_by=attachment.uploaded_by,
            uploaded_at=attachment.uploaded_at,
            uploader_name=uploader_name,
            download_url=self.get_download_url(attachment, base_url)
        )

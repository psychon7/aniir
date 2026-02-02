"""
Document Attachment Service
Handles file attachments for invoices, quotes, orders, etc.
"""
import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
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
        """Upload a file and create an attachment record"""
        # Validate file
        self._validate_file(file)
        
        # Generate unique filename and path
        unique_filename = self._generate_unique_filename(file.filename)
        upload_dir = self._get_upload_path(entity_type.value)
        file_path = upload_dir / unique_filename
        
        # Save file to disk
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
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
        """Delete an attachment and its file"""
        attachment = self.get_attachment_by_id(attachment_id)
        if not attachment:
            return False
        
        # Delete file from disk
        try:
            if os.path.exists(attachment.file_path):
                os.remove(attachment.file_path)
        except Exception as e:
            # Log error but continue with database deletion
            print(f"Warning: Could not delete file {attachment.file_path}: {e}")
        
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
            download_url=f"{base_url}/api/v1/attachments/{attachment.id}/download"
        )

"""
Document Attachments API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.document_attachment import (
    DocumentAttachmentResponse,
    DocumentAttachmentList,
    EntityType
)
from app.services.document_attachment_service import DocumentAttachmentService

router = APIRouter()


@router.post("/upload", response_model=DocumentAttachmentResponse)
async def upload_attachment(
    request: Request,
    file: UploadFile = File(...),
    entity_type: EntityType = Form(...),
    entity_id: int = Form(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file attachment for an entity (invoice, quote, order, etc.)
    """
    service = DocumentAttachmentService(db)
    
    attachment = await service.upload_attachment(
        file=file,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        uploaded_by=current_user.id if current_user else None
    )
    
    base_url = str(request.base_url).rstrip('/')
    return service.to_response(attachment, base_url)


@router.get("/{entity_type}/{entity_id}", response_model=DocumentAttachmentList)
def get_entity_attachments(
    entity_type: EntityType,
    entity_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all attachments for a specific entity
    """
    service = DocumentAttachmentService(db)
    attachments = service.get_attachments(entity_type, entity_id)
    
    base_url = str(request.base_url).rstrip('/')
    items = [service.to_response(a, base_url) for a in attachments]
    
    return DocumentAttachmentList(items=items, total=len(items))


@router.get("/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download an attachment file
    """
    service = DocumentAttachmentService(db)
    attachment = service.get_attachment_by_id(attachment_id)
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type or "application/octet-stream"
    )


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an attachment
    """
    service = DocumentAttachmentService(db)
    
    if not service.delete_attachment(attachment_id):
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return {"message": "Attachment deleted successfully"}


@router.patch("/{attachment_id}/description")
def update_attachment_description(
    attachment_id: int,
    description: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update attachment description
    """
    service = DocumentAttachmentService(db)
    attachment = service.update_description(attachment_id, description)
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    base_url = str(request.base_url).rstrip('/')
    return service.to_response(attachment, base_url)

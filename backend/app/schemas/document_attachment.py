"""
Document Attachment Schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class EntityType(str, Enum):
    INVOICE = "INVOICE"
    QUOTE = "QUOTE"
    ORDER = "ORDER"
    CLIENT = "CLIENT"
    SUPPLIER = "SUPPLIER"
    PRODUCT = "PRODUCT"


class DocumentAttachmentBase(BaseModel):
    """Base schema for document attachment"""
    entity_type: EntityType
    entity_id: int
    description: Optional[str] = None


class DocumentAttachmentCreate(DocumentAttachmentBase):
    """Schema for creating a document attachment"""
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None


class DocumentAttachmentResponse(BaseModel):
    """Schema for document attachment response"""
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: Optional[int] = None
    uploaded_at: datetime
    uploader_name: Optional[str] = None
    download_url: str
    
    class Config:
        from_attributes = True


class DocumentAttachmentList(BaseModel):
    """Schema for list of document attachments"""
    items: List[DocumentAttachmentResponse]
    total: int


class AttachFileRequest(BaseModel):
    """Request schema for attaching a file"""
    entity_type: EntityType
    entity_id: int
    description: Optional[str] = None

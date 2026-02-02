from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

PDFStatusType = Literal["none", "generating", "ready", "error", "outdated"]
DocumentType = Literal["quote", "order", "invoice", "delivery", "credit"]


class PDFStatusResponse(BaseModel):
    """PDF status for a single document"""
    document_id: int
    document_type: DocumentType
    status: PDFStatusType
    pdf_url: Optional[str] = None
    generated_at: Optional[datetime] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class PDFGenerateResponse(BaseModel):
    """Response after PDF generation"""
    success: bool
    pdf_url: str
    generated_at: datetime
    file_size: int


class PDFViewUrlResponse(BaseModel):
    """Response with presigned URL for viewing"""
    url: str
    expires_at: datetime


class BatchPDFStatusRequest(BaseModel):
    """Request for batch PDF status check"""
    document_ids: List[int]


class BatchPDFStatusResponse(BaseModel):
    """Response for batch PDF status check"""
    statuses: List[PDFStatusResponse]

"""
Shared document schemas for PDF/email operations across document types.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SendDocumentRequest(BaseModel):
    """Request to send a document (quote, order, invoice, delivery) via email."""
    to_email: str = Field(..., description="Recipient email address")
    subject: Optional[str] = Field(None, description="Email subject (auto-generated if not provided)")
    body: Optional[str] = Field(None, description="Email body text")
    cc: Optional[str] = Field(None, description="CC email address")


class SendDocumentResponse(BaseModel):
    """Response after sending a document via email."""
    success: bool = True
    message: str = "Document sent successfully"
    document_id: int
    document_type: str
    sent_to: str
    sent_at: Optional[datetime] = None


class DownloadPdfResponse(BaseModel):
    """Response metadata for PDF download (actual PDF is streamed)."""
    success: bool = True
    message: str = "PDF generated successfully"
    document_id: int
    document_type: str
    filename: str

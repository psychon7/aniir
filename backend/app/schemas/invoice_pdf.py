"""
Pydantic schemas for Invoice PDF generation
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PDFGenerationRequest(BaseModel):
    """Request schema for PDF generation (optional parameters)"""
    include_logo: bool = Field(default=True, description="Include company logo in PDF")
    include_bank_details: bool = Field(default=True, description="Include bank details")
    language: str = Field(default="fr", description="PDF language (fr, en)")


class PDFGenerationResponse(BaseModel):
    """Response schema for PDF generation metadata"""
    invoice_id: int
    reference: str
    filename: str
    generated_at: datetime
    file_size: int
    message: str = "PDF generated successfully"
    
    class Config:
        from_attributes = True


class PDFErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    invoice_id: Optional[int] = None
    error_code: Optional[str] = None

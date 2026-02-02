"""Pydantic schemas for Email Log."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


class EmailLogBase(BaseModel):
    """Base schema for email log."""
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    subject: str
    body: Optional[str] = None
    template_name: Optional[str] = None
    template_data: Optional[str] = None  # JSON string
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


class EmailLogCreate(EmailLogBase):
    """Schema for creating an email log."""
    max_retries: int = Field(default=3, ge=0, le=10)


class EmailLogUpdate(BaseModel):
    """Schema for updating an email log."""
    status: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None
    sent_at: Optional[datetime] = None


class EmailLogResponse(EmailLogBase):
    """Schema for email log response."""
    id: int
    status: str
    error_message: Optional[str] = None
    retry_count: int
    max_retries: int
    sent_at: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmailLogListResponse(BaseModel):
    """Schema for paginated email log list."""
    items: list[EmailLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmailRetryRequest(BaseModel):
    """Schema for retry request (optional body)."""
    force: bool = Field(default=False, description="Force retry even if max retries exceeded")


class EmailRetryResponse(BaseModel):
    """Schema for retry response."""
    success: bool
    message: str
    email_log: EmailLogResponse
    new_retry_count: int

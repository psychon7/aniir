"""
Chat Message Schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    """Base message schema"""
    content: str = Field(..., min_length=1, max_length=4000)
    room_id: int


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    pass


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    """Schema for message response"""
    id: int
    content: str
    room_id: int
    sender_id: int
    sender_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageDeleteRequest(BaseModel):
    """Schema for delete message request via WebSocket"""
    message_id: int
    room_id: int


class MessageDeletedEvent(BaseModel):
    """Schema for message deleted event broadcast"""
    event: str = "message_deleted"
    message_id: int
    room_id: int
    deleted_by: int
    deleted_at: datetime


class MessageListResponse(BaseModel):
    """Schema for paginated message list"""
    items: List[MessageResponse]
    total: int
    page: int
    page_size: int
    has_more: bool

"""
Pydantic schemas for Chat module.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Chat Message Schemas
# ============================================================================

class ChatMessageBase(BaseModel):
    """Base schema for chat messages."""
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: Optional[str] = Field(default="text", pattern="^(text|image|file|system)$")


class ChatMessageCreate(ChatMessageBase):
    """Schema for creating a chat message."""
    room_id: int


class ChatMessageUpdate(BaseModel):
    """Schema for updating a chat message."""
    content: Optional[str] = Field(None, min_length=1, max_length=10000)


class ChatMessageResponse(ChatMessageBase):
    """Schema for chat message response."""
    id: int
    room_id: int
    sender_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool = False
    is_deleted: bool = False
    
    class Config:
        from_attributes = True


class PaginatedChatMessages(BaseModel):
    """Paginated response for chat messages."""
    items: List[ChatMessageResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int


# ============================================================================
# Chat Room Schemas
# ============================================================================

class ChatRoomBase(BaseModel):
    """Base schema for chat rooms."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    room_type: Optional[str] = Field(default="group", pattern="^(direct|group|channel)$")


class ChatRoomCreate(ChatRoomBase):
    """Schema for creating a chat room."""
    member_ids: Optional[List[int]] = None


class ChatRoomResponse(ChatRoomBase):
    """Schema for chat room response."""
    id: int
    created_by_id: int
    created_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True


class ChatRoomWithMessages(ChatRoomResponse):
    """Schema for chat room with recent messages."""
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True


# ============================================================================
# Chat Room Member Schemas
# ============================================================================

class ChatRoomMemberBase(BaseModel):
    """Base schema for chat room members."""
    role: Optional[str] = Field(default="member", pattern="^(owner|admin|member)$")


class ChatRoomMemberCreate(ChatRoomMemberBase):
    """Schema for adding a member to a chat room."""
    user_id: int


class ChatRoomMemberResponse(ChatRoomMemberBase):
    """Schema for chat room member response."""
    id: int
    room_id: int
    user_id: int
    joined_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True

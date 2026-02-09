"""
Pydantic schemas for Chat module.

Supports both:
  - Thread-based chat system (ChatThread, ChatParticipant, thread ChatMessage)
  - Room-based chat system (ChatRoom, ChatRoomMember, room ChatMessage)
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Enums
# ============================================================================

class ThreadType(str, Enum):
    """Thread type enumeration."""
    DIRECT = "direct"
    GROUP = "group"
    ENTITY = "entity"


class MessageType(str, Enum):
    """Message type enumeration."""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"


class SenderType(str, Enum):
    """Sender type enumeration."""
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


# ============================================================================
# Thread-based Chat Schemas (used by ChatService)
# ============================================================================

class ChatParticipantResponse(BaseModel):
    """Schema for chat participant response."""
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    is_admin: bool = False

    class Config:
        from_attributes = True


class ChatThreadCreate(BaseModel):
    """Schema for creating a chat thread."""
    title: Optional[str] = Field(None, max_length=500)
    thread_type: ThreadType = ThreadType.DIRECT
    participant_ids: Optional[List[int]] = None
    initial_message: Optional[str] = None


class ChatThreadResponse(BaseModel):
    """Schema for chat thread response."""
    id: int
    title: Optional[str] = None
    thread_type: ThreadType
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_archived: bool = False
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    participants: List[ChatParticipantResponse] = []
    created_by_id: Optional[int] = None

    class Config:
        from_attributes = True


class ChatThreadListResponse(BaseModel):
    """Paginated response for chat threads."""
    items: List[ChatThreadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChatThreadMessageCreate(BaseModel):
    """Schema for creating a message in a thread (used by ChatService)."""
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[str] = None


class ChatThreadMessageResponse(BaseModel):
    """Schema for thread message response (used by ChatService)."""
    id: int
    thread_id: int
    sender_id: Optional[int] = None
    sender_type: SenderType = SenderType.USER
    sender_name: Optional[str] = None
    content: str
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool = False
    is_deleted: bool = False

    class Config:
        from_attributes = True


class ChatMessageListResponse(BaseModel):
    """Paginated response for chat messages in a thread."""
    items: List[ChatThreadMessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_more: bool = False
    oldest_message_id: Optional[int] = None
    newest_message_id: Optional[int] = None


# ============================================================================
# Room-based Chat Message Schemas (used by endpoints)
# ============================================================================

class ChatMessageBase(BaseModel):
    """Base schema for room chat messages."""
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: Optional[str] = Field(
        default="text", pattern="^(text|image|file|system)$"
    )


class ChatMessageCreate(ChatMessageBase):
    """Schema for creating a room chat message."""
    room_id: int


class ChatMessageUpdate(BaseModel):
    """Schema for updating a room chat message."""
    content: Optional[str] = Field(None, min_length=1, max_length=10000)


class ChatMessageResponse(ChatMessageBase):
    """Schema for room chat message response."""
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
    """Paginated response for room chat messages."""
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
    room_type: Optional[str] = Field(
        default="group", pattern="^(direct|group|channel)$"
    )


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
    role: Optional[str] = Field(
        default="member", pattern="^(owner|admin|member)$"
    )


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

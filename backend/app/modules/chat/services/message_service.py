"""
Chat Message Service
"""
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.modules.chat.models.message import ChatMessage
from app.modules.chat.repositories.message_repository import MessageRepository
from app.modules.chat.repositories.room_repository import RoomRepository
from app.modules.chat.schemas.message import (
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    MessageDeletedEvent,
    MessageListResponse
)
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError


class MessageService:
    """Service for chat message business logic"""

    def __init__(self, db: Session):
        self.db = db
        self.message_repo = MessageRepository(db)
        self.room_repo = RoomRepository(db)

    def get_message(self, message_id: int, user_id: int) -> MessageResponse:
        """Get a single message"""
        message = self.message_repo.get_by_id_with_sender(message_id)
        if not message:
            raise NotFoundError(f"Message {message_id} not found")
        
        # Check if user has access to the room
        if not self.room_repo.is_user_member(message.room_id, user_id):
            raise ForbiddenError("You don't have access to this message")
        
        return self._to_response(message)

    def get_room_messages(
        self,
        room_id: int,
        user_id: int,
        page: int = 1,
        page_size: int = 50
    ) -> MessageListResponse:
        """Get paginated messages for a room"""
        # Check room access
        if not self.room_repo.is_user_member(room_id, user_id):
            raise ForbiddenError("You don't have access to this room")
        
        messages, total = self.message_repo.get_room_messages(
            room_id=room_id,
            page=page,
            page_size=page_size
        )
        
        return MessageListResponse(
            items=[self._to_response(m) for m in messages],
            total=total,
            page=page,
            page_size=page_size,
            has_more=(page * page_size) < total
        )

    def create_message(
        self,
        room_id: int,
        sender_id: int,
        content: str
    ) -> MessageResponse:
        """Create a new message"""
        # Check room access
        if not self.room_repo.is_user_member(room_id, sender_id):
            raise ForbiddenError("You don't have access to this room")
        
        message = self.message_repo.create(
            room_id=room_id,
            sender_id=sender_id,
            content=content
        )
        
        # Reload with sender info
        message = self.message_repo.get_by_id_with_sender(message.id)
        return self._to_response(message)

    def update_message(
        self,
        message_id: int,
        user_id: int,
        content: str
    ) -> MessageResponse:
        """Update a message (only by owner)"""
        message = self.message_repo.get_by_id(message_id)
        if not message:
            raise NotFoundError(f"Message {message_id} not found")
        
        if message.sender_id != user_id:
            raise ForbiddenError("You can only edit your own messages")
        
        if message.is_deleted:
            raise BadRequestError("Cannot edit a deleted message")
        
        updated = self.message_repo.update_content(message_id, content)
        updated = self.message_repo.get_by_id_with_sender(message_id)
        return self._to_response(updated)

    def delete_message(
        self,
        message_id: int,
        user_id: int,
        is_admin: bool = False
    ) -> MessageDeletedEvent:
        """
        Delete a message (soft delete).
        
        Users can only delete their own messages.
        Admins can delete any message.
        
        Returns:
            MessageDeletedEvent for broadcasting to room members
        """
        message = self.message_repo.get_by_id(message_id)
        
        if not message:
            raise NotFoundError(f"Message {message_id} not found")
        
        if message.is_deleted:
            raise BadRequestError("Message is already deleted")
        
        # Check permissions
        if not is_admin and message.sender_id != user_id:
            raise ForbiddenError("You can only delete your own messages")
        
        # Check room membership
        if not self.room_repo.is_user_member(message.room_id, user_id):
            raise ForbiddenError("You don't have access to this room")
        
        # Perform soft delete
        deleted_message = self.message_repo.soft_delete(message_id, user_id)
        
        if not deleted_message:
            raise BadRequestError("Failed to delete message")
        
        return MessageDeletedEvent(
            event="message_deleted",
            message_id=message_id,
            room_id=deleted_message.room_id,
            deleted_by=user_id,
            deleted_at=deleted_message.deleted_at
        )

    def can_delete_message(
        self,
        message_id: int,
        user_id: int,
        is_admin: bool = False
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if user can delete a message.
        
        Returns:
            Tuple of (can_delete, error_message)
        """
        message = self.message_repo.get_by_id(message_id)
        
        if not message:
            return False, "Message not found"
        
        if message.is_deleted:
            return False, "Message is already deleted"
        
        if not is_admin and message.sender_id != user_id:
            return False, "You can only delete your own messages"
        
        if not self.room_repo.is_user_member(message.room_id, user_id):
            return False, "You don't have access to this room"
        
        return True, None

    def get_message_room_id(self, message_id: int) -> Optional[int]:
        """Get the room ID for a message"""
        return self.message_repo.get_message_room_id(message_id)

    def _to_response(self, message: ChatMessage) -> MessageResponse:
        """Convert model to response schema"""
        sender_name = "Unknown"
        if hasattr(message, 'sender') and message.sender:
            sender_name = getattr(message.sender, 'FullName', None) or \
                         getattr(message.sender, 'Username', 'Unknown')
        
        return MessageResponse(
            id=message.id,
            content=message.content if not message.is_deleted else "[Message deleted]",
            room_id=message.room_id,
            sender_id=message.sender_id,
            sender_name=sender_name,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_deleted=message.is_deleted,
            deleted_at=message.deleted_at
        )

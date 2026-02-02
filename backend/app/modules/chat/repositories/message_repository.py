"""
Chat Message Repository
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.modules.chat.models.message import ChatMessage
from app.modules.chat.models.room import ChatRoom


class MessageRepository:
    """Repository for chat message database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, message_id: int) -> Optional[ChatMessage]:
        """Get a message by ID"""
        stmt = select(ChatMessage).where(ChatMessage.Id == message_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_id_with_sender(self, message_id: int) -> Optional[ChatMessage]:
        """Get a message by ID with sender info"""
        stmt = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.sender))
            .where(ChatMessage.Id == message_id)
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_room_messages(
        self,
        room_id: int,
        page: int = 1,
        page_size: int = 50,
        include_deleted: bool = False
    ) -> tuple[List[ChatMessage], int]:
        """Get paginated messages for a room"""
        base_query = select(ChatMessage).where(ChatMessage.RoomId == room_id)
        
        if not include_deleted:
            base_query = base_query.where(ChatMessage.IsDeleted == False)
        
        # Count total
        count_stmt = select(ChatMessage.Id).where(ChatMessage.RoomId == room_id)
        if not include_deleted:
            count_stmt = count_stmt.where(ChatMessage.IsDeleted == False)
        total = len(self.db.execute(count_stmt).scalars().all())
        
        # Get paginated results
        offset = (page - 1) * page_size
        stmt = (
            base_query
            .options(joinedload(ChatMessage.sender))
            .order_by(desc(ChatMessage.CreatedAt))
            .offset(offset)
            .limit(page_size)
        )
        
        result = self.db.execute(stmt)
        messages = result.scalars().all()
        
        return list(messages), total

    def create(self, room_id: int, sender_id: int, content: str) -> ChatMessage:
        """Create a new message"""
        message = ChatMessage(
            RoomId=room_id,
            SenderId=sender_id,
            Content=content,
            CreatedAt=datetime.utcnow(),
            IsDeleted=False
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def update_content(self, message_id: int, content: str) -> Optional[ChatMessage]:
        """Update message content"""
        message = self.get_by_id(message_id)
        if message and not message.IsDeleted:
            message.Content = content
            message.UpdatedAt = datetime.utcnow()
            self.db.commit()
            self.db.refresh(message)
            return message
        return None

    def soft_delete(self, message_id: int, deleted_by: int) -> Optional[ChatMessage]:
        """Soft delete a message"""
        message = self.get_by_id(message_id)
        if message and not message.IsDeleted:
            message.IsDeleted = True
            message.DeletedAt = datetime.utcnow()
            message.DeletedBy = deleted_by
            self.db.commit()
            self.db.refresh(message)
            return message
        return None

    def hard_delete(self, message_id: int) -> bool:
        """Permanently delete a message (admin only)"""
        message = self.get_by_id(message_id)
        if message:
            self.db.delete(message)
            self.db.commit()
            return True
        return False

    def is_user_message_owner(self, message_id: int, user_id: int) -> bool:
        """Check if user owns the message"""
        message = self.get_by_id(message_id)
        return message is not None and message.SenderId == user_id

    def get_message_room_id(self, message_id: int) -> Optional[int]:
        """Get the room ID for a message"""
        message = self.get_by_id(message_id)
        return message.RoomId if message else None

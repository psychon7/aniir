"""
Chat Room Repository
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.modules.chat.models.room import ChatRoom, room_members


class RoomRepository:
    """Repository for chat room database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: int) -> Optional[ChatRoom]:
        """Get a room by ID"""
        stmt = select(ChatRoom).where(ChatRoom.Id == room_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def is_user_member(self, room_id: int, user_id: int) -> bool:
        """Check if user is a member of the room"""
        stmt = select(room_members).where(
            and_(
                room_members.c.RoomId == room_id,
                room_members.c.UserId == user_id,
                room_members.c.IsActive == True
            )
        )
        result = self.db.execute(stmt)
        return result.first() is not None

    def get_room_member_ids(self, room_id: int) -> List[int]:
        """Get all active member IDs for a room"""
        stmt = select(room_members.c.UserId).where(
            and_(
                room_members.c.RoomId == room_id,
                room_members.c.IsActive == True
            )
        )
        result = self.db.execute(stmt)
        return [row[0] for row in result.fetchall()]

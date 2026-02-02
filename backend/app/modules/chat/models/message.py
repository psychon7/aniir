"""
Chat Message SQLAlchemy Model
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatMessage(Base):
    """Chat message model - maps to TM_CHT_Message table"""
    __tablename__ = "TM_CHT_Message"

    Id = Column("Id", Integer, primary_key=True, autoincrement=True)
    RoomId = Column("RoomId", Integer, ForeignKey("TM_CHT_Room.Id"), nullable=False)
    SenderId = Column("SenderId", Integer, ForeignKey("TM_USR_User.Id"), nullable=False)
    Content = Column("Content", Text, nullable=False)
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.utcnow, nullable=False)
    UpdatedAt = Column("UpdatedAt", DateTime, onupdate=datetime.utcnow, nullable=True)
    IsDeleted = Column("IsDeleted", Boolean, default=False, nullable=False)
    DeletedAt = Column("DeletedAt", DateTime, nullable=True)
    DeletedBy = Column("DeletedBy", Integer, ForeignKey("TM_USR_User.Id"), nullable=True)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[SenderId])

    @property
    def id(self) -> int:
        return self.Id

    @property
    def room_id(self) -> int:
        return self.RoomId

    @property
    def sender_id(self) -> int:
        return self.SenderId

    @property
    def content(self) -> str:
        return self.Content

    @property
    def created_at(self) -> datetime:
        return self.CreatedAt

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.UpdatedAt

    @property
    def is_deleted(self) -> bool:
        return self.IsDeleted

    @property
    def deleted_at(self) -> Optional[datetime]:
        return self.DeletedAt

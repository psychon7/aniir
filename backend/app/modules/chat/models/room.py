"""
Chat Room SQLAlchemy Model
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.core.database import Base


# Association table for room members
room_members = Table(
    "TM_CHT_RoomMember",
    Base.metadata,
    Column("RoomId", Integer, ForeignKey("TM_CHT_Room.Id"), primary_key=True),
    Column("UserId", Integer, ForeignKey("TM_USR_User.Id"), primary_key=True),
    Column("JoinedAt", DateTime, default=datetime.utcnow),
    Column("IsActive", Boolean, default=True)
)


class ChatRoom(Base):
    """Chat room model - maps to TM_CHT_Room table"""
    __tablename__ = "TM_CHT_Room"

    Id = Column("Id", Integer, primary_key=True, autoincrement=True)
    Name = Column("Name", String(100), nullable=False)
    Description = Column("Description", String(500), nullable=True)
    IsPrivate = Column("IsPrivate", Boolean, default=False, nullable=False)
    CreatedBy = Column("CreatedBy", Integer, ForeignKey("TM_USR_User.Id"), nullable=False)
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.utcnow, nullable=False)
    UpdatedAt = Column("UpdatedAt", DateTime, onupdate=datetime.utcnow, nullable=True)
    IsActive = Column("IsActive", Boolean, default=True, nullable=False)

    # Relationships
    messages = relationship("ChatMessage", back_populates="room", lazy="dynamic")
    members = relationship("User", secondary=room_members, backref="chat_rooms")
    creator = relationship("User", foreign_keys=[CreatedBy])

    @property
    def id(self) -> int:
        return self.Id

    @property
    def name(self) -> str:
        return self.Name

    @property
    def is_private(self) -> bool:
        return self.IsPrivate

    @property
    def created_by(self) -> int:
        return self.CreatedBy

"""
Chat models for thread-based and room-based messaging.

Thread-based system (TM_CHT_*):
  - ChatThread       - Conversations / threads
  - ChatParticipant  - Users in a thread
  - ChatMessage      - Messages within threads
  - ChatMessageReadReceipt - Read receipts for thread messages

Room-based system (TM_CHAT_*):
  - ChatRoom         - Chat rooms / channels
  - ChatRoomMember   - Room membership
  - ChatRoomMessage  - Messages within rooms
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


# =============================================================================
# Thread-based Chat System (TM_CHT_*)
# =============================================================================


class ChatThread(Base):
    """
    Chat thread model for organizing conversations.

    Maps to TM_CHT_Thread table.
    Threads can be linked to business entities (Invoice, Order, Project, etc.).

    DB schema:
      cht_id: int NOT NULL [PK]
      cht_title: nvarchar(500) NULL
      cht_thread_type: nvarchar(50) NOT NULL DEFAULT 'direct'
      cht_is_archived: bit NOT NULL DEFAULT 0
      cht_last_message_at: datetime NULL
      cht_last_msg_preview: nvarchar(200) NULL
      cht_entity_type: nvarchar(100) NULL
      cht_entity_id: int NULL
      usr_creator_id: int NULL
      soc_id: int NULL
      cht_d_creation: datetime NOT NULL DEFAULT GETDATE()
      cht_d_update: datetime NULL
    """
    __tablename__ = "TM_CHT_Thread"
    __table_args__ = {'extend_existing': True}

    # Primary key
    cht_id: Mapped[int] = mapped_column(
        "cht_id", Integer, primary_key=True, autoincrement=True
    )

    # Thread details
    cht_title: Mapped[Optional[str]] = mapped_column(
        "cht_title", String(500), nullable=True
    )
    cht_thread_type: Mapped[str] = mapped_column(
        "cht_thread_type", String(50), nullable=False, default="direct"
    )
    cht_is_archived: Mapped[bool] = mapped_column(
        "cht_is_archived", Boolean, nullable=False, default=False
    )

    # Last message tracking
    cht_last_message_at: Mapped[Optional[datetime]] = mapped_column(
        "cht_last_message_at", DateTime, nullable=True
    )
    cht_last_msg_preview: Mapped[Optional[str]] = mapped_column(
        "cht_last_msg_preview", String(200), nullable=True
    )

    # Entity linking
    cht_entity_type: Mapped[Optional[str]] = mapped_column(
        "cht_entity_type", String(100), nullable=True
    )
    cht_entity_id: Mapped[Optional[int]] = mapped_column(
        "cht_entity_id", Integer, nullable=True
    )

    # Foreign keys
    usr_creator_id: Mapped[Optional[int]] = mapped_column(
        "usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )
    soc_id: Mapped[Optional[int]] = mapped_column(
        "soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=True
    )

    # Timestamps
    cht_d_creation: Mapped[datetime] = mapped_column(
        "cht_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    cht_d_update: Mapped[Optional[datetime]] = mapped_column(
        "cht_d_update", DateTime, nullable=True
    )

    # Relationships
    participants: Mapped[List["ChatParticipant"]] = relationship(
        "ChatParticipant",
        back_populates="thread",
        lazy="selectin"
    )
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="thread",
        lazy="noload"
    )
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[usr_creator_id],
        lazy="selectin"
    )

    # Property aliases for API compatibility (PascalCase for service/repository)
    @property
    def Id(self) -> int:
        return self.cht_id

    @property
    def Title(self) -> Optional[str]:
        return self.cht_title

    @Title.setter
    def Title(self, value: Optional[str]) -> None:
        self.cht_title = value

    @property
    def ThreadType(self) -> str:
        return self.cht_thread_type

    @ThreadType.setter
    def ThreadType(self, value: str) -> None:
        self.cht_thread_type = value

    @property
    def IsArchived(self) -> bool:
        return self.cht_is_archived

    @IsArchived.setter
    def IsArchived(self, value: bool) -> None:
        self.cht_is_archived = value

    @property
    def LastMessageAt(self) -> Optional[datetime]:
        return self.cht_last_message_at

    @LastMessageAt.setter
    def LastMessageAt(self, value: Optional[datetime]) -> None:
        self.cht_last_message_at = value

    @property
    def LastMessagePreview(self) -> Optional[str]:
        return self.cht_last_msg_preview

    @LastMessagePreview.setter
    def LastMessagePreview(self, value: Optional[str]) -> None:
        self.cht_last_msg_preview = value

    @property
    def CreatedById(self) -> Optional[int]:
        return self.usr_creator_id

    @CreatedById.setter
    def CreatedById(self, value: Optional[int]) -> None:
        self.usr_creator_id = value

    @property
    def CreatedAt(self) -> datetime:
        return self.cht_d_creation

    @CreatedAt.setter
    def CreatedAt(self, value: datetime) -> None:
        self.cht_d_creation = value

    @property
    def UpdatedAt(self) -> Optional[datetime]:
        return self.cht_d_update

    @UpdatedAt.setter
    def UpdatedAt(self, value: Optional[datetime]) -> None:
        self.cht_d_update = value

    # snake_case aliases
    @property
    def id(self) -> int:
        return self.cht_id

    # Repository uses UserId on ChatThread (for single-user thread ownership)
    @property
    def UserId(self) -> Optional[int]:
        return self.usr_creator_id

    def __repr__(self) -> str:
        return f"<ChatThread(cht_id={self.cht_id}, title='{self.cht_title}')>"


class ChatParticipant(Base):
    """
    Chat participant model - tracks users in a thread.

    Maps to TM_CHT_Participant table.

    DB schema:
      prt_id: int NOT NULL [PK]
      prt_thr_id: int NOT NULL -> TM_CHT_Thread.cht_id
      prt_usr_id: int NOT NULL -> TM_USR_User.usr_id
      prt_is_admin: bit NOT NULL DEFAULT 0
      prt_is_active: bit NOT NULL DEFAULT 1
      prt_joined_at: datetime NOT NULL DEFAULT GETDATE()
      prt_last_read_at: datetime NULL
      prt_last_read_msg_id: int NULL
    """
    __tablename__ = "TM_CHT_Participant"
    __table_args__ = {'extend_existing': True}

    # Primary key
    prt_id: Mapped[int] = mapped_column(
        "prt_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    prt_thr_id: Mapped[int] = mapped_column(
        "prt_thr_id", Integer, ForeignKey("TM_CHT_Thread.cht_id"), nullable=False
    )
    prt_usr_id: Mapped[int] = mapped_column(
        "prt_usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False
    )

    # Participant flags
    prt_is_admin: Mapped[bool] = mapped_column(
        "prt_is_admin", Boolean, nullable=False, default=False
    )
    prt_is_active: Mapped[bool] = mapped_column(
        "prt_is_active", Boolean, nullable=False, default=True
    )

    # Timestamps
    prt_joined_at: Mapped[datetime] = mapped_column(
        "prt_joined_at", DateTime, nullable=False, default=datetime.utcnow
    )
    prt_last_read_at: Mapped[Optional[datetime]] = mapped_column(
        "prt_last_read_at", DateTime, nullable=True
    )
    prt_last_read_msg_id: Mapped[Optional[int]] = mapped_column(
        "prt_last_read_msg_id", Integer, nullable=True
    )

    # Relationships
    thread: Mapped["ChatThread"] = relationship(
        "ChatThread",
        back_populates="participants",
        lazy="selectin"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[prt_usr_id],
        lazy="selectin"
    )

    # Property aliases (PascalCase for service)
    @property
    def Id(self) -> int:
        return self.prt_id

    @property
    def ThreadId(self) -> int:
        return self.prt_thr_id

    @ThreadId.setter
    def ThreadId(self, value: int) -> None:
        self.prt_thr_id = value

    @property
    def UserId(self) -> int:
        return self.prt_usr_id

    @UserId.setter
    def UserId(self, value: int) -> None:
        self.prt_usr_id = value

    @property
    def IsAdmin(self) -> bool:
        return self.prt_is_admin

    @IsAdmin.setter
    def IsAdmin(self, value: bool) -> None:
        self.prt_is_admin = value

    @property
    def JoinedAt(self) -> datetime:
        return self.prt_joined_at

    @JoinedAt.setter
    def JoinedAt(self, value: datetime) -> None:
        self.prt_joined_at = value

    @property
    def LastReadAt(self) -> Optional[datetime]:
        return self.prt_last_read_at

    @LastReadAt.setter
    def LastReadAt(self, value: Optional[datetime]) -> None:
        self.prt_last_read_at = value

    def __repr__(self) -> str:
        return f"<ChatParticipant(prt_id={self.prt_id}, thread={self.prt_thr_id}, user={self.prt_usr_id})>"


class ChatMessage(Base):
    """
    Chat message model for thread-based messaging.

    Maps to TM_CHT_Message table.

    DB schema:
      msg_id: int NOT NULL [PK]
      msg_thr_id: int NOT NULL -> TM_CHT_Thread.cht_id
      msg_usr_id: int NULL -> TM_USR_User.usr_id
      msg_sender_type: nvarchar(20) NOT NULL DEFAULT 'user'
      msg_content: nvarchar(max) NOT NULL
      msg_type: nvarchar(50) NOT NULL DEFAULT 'text'
      msg_metadata: nvarchar(max) NULL
      msg_is_edited: bit NOT NULL DEFAULT 0
      msg_is_deleted: bit NOT NULL DEFAULT 0
      msg_d_creation: datetime NOT NULL DEFAULT GETDATE()
      msg_d_update: datetime NULL
      msg_deleted_at: datetime NULL
      msg_deleted_by_id: int NULL
    """
    __tablename__ = "TM_CHT_Message"
    __table_args__ = {'extend_existing': True}

    # Primary key
    msg_id: Mapped[int] = mapped_column(
        "msg_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    msg_thr_id: Mapped[int] = mapped_column(
        "msg_thr_id", Integer, ForeignKey("TM_CHT_Thread.cht_id"), nullable=False
    )
    msg_usr_id: Mapped[Optional[int]] = mapped_column(
        "msg_usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Message fields
    msg_sender_type: Mapped[str] = mapped_column(
        "msg_sender_type", String(20), nullable=False, default="user"
    )
    msg_content: Mapped[str] = mapped_column(
        "msg_content", Text, nullable=False
    )
    msg_type: Mapped[str] = mapped_column(
        "msg_type", String(50), nullable=False, default="text"
    )
    msg_metadata: Mapped[Optional[str]] = mapped_column(
        "msg_metadata", Text, nullable=True
    )

    # Status flags
    msg_is_edited: Mapped[bool] = mapped_column(
        "msg_is_edited", Boolean, nullable=False, default=False
    )
    msg_is_deleted: Mapped[bool] = mapped_column(
        "msg_is_deleted", Boolean, nullable=False, default=False
    )

    # Timestamps
    msg_d_creation: Mapped[datetime] = mapped_column(
        "msg_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    msg_d_update: Mapped[Optional[datetime]] = mapped_column(
        "msg_d_update", DateTime, nullable=True
    )
    msg_deleted_at: Mapped[Optional[datetime]] = mapped_column(
        "msg_deleted_at", DateTime, nullable=True
    )
    msg_deleted_by_id: Mapped[Optional[int]] = mapped_column(
        "msg_deleted_by_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Relationships
    thread: Mapped["ChatThread"] = relationship(
        "ChatThread",
        back_populates="messages",
        lazy="selectin"
    )
    sender: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[msg_usr_id],
        lazy="selectin"
    )
    read_receipts: Mapped[List["ChatMessageReadReceipt"]] = relationship(
        "ChatMessageReadReceipt",
        back_populates="message",
        lazy="noload"
    )

    # Property aliases (PascalCase for service)
    @property
    def Id(self) -> int:
        return self.msg_id

    @property
    def ThreadId(self) -> int:
        return self.msg_thr_id

    @ThreadId.setter
    def ThreadId(self, value: int) -> None:
        self.msg_thr_id = value

    @property
    def SenderId(self) -> Optional[int]:
        return self.msg_usr_id

    @SenderId.setter
    def SenderId(self, value: Optional[int]) -> None:
        self.msg_usr_id = value

    @property
    def SenderType(self) -> str:
        return self.msg_sender_type

    @SenderType.setter
    def SenderType(self, value: str) -> None:
        self.msg_sender_type = value

    @property
    def Content(self) -> str:
        return self.msg_content

    @Content.setter
    def Content(self, value: str) -> None:
        self.msg_content = value

    @property
    def MessageType(self) -> str:
        return self.msg_type

    @MessageType.setter
    def MessageType(self, value: str) -> None:
        self.msg_type = value

    @property
    def Metadata(self) -> Optional[str]:
        return self.msg_metadata

    @Metadata.setter
    def Metadata(self, value: Optional[str]) -> None:
        self.msg_metadata = value

    @property
    def IsEdited(self) -> bool:
        return self.msg_is_edited

    @IsEdited.setter
    def IsEdited(self, value: bool) -> None:
        self.msg_is_edited = value

    @property
    def IsDeleted(self) -> bool:
        return self.msg_is_deleted

    @IsDeleted.setter
    def IsDeleted(self, value: bool) -> None:
        self.msg_is_deleted = value

    @property
    def CreatedAt(self) -> datetime:
        return self.msg_d_creation

    @CreatedAt.setter
    def CreatedAt(self, value: datetime) -> None:
        self.msg_d_creation = value

    @property
    def UpdatedAt(self) -> Optional[datetime]:
        return self.msg_d_update

    @UpdatedAt.setter
    def UpdatedAt(self, value: Optional[datetime]) -> None:
        self.msg_d_update = value

    def __repr__(self) -> str:
        return f"<ChatMessage(msg_id={self.msg_id}, thread={self.msg_thr_id})>"


class ChatMessageReadReceipt(Base):
    """
    Read receipt model for tracking which users have read which messages.

    Maps to TM_CHT_ReadReceipt table.

    DB schema:
      rcpt_id: int NOT NULL [PK]
      rcpt_msg_id: int NOT NULL -> TM_CHT_Message.msg_id
      rcpt_usr_id: int NOT NULL -> TM_USR_User.usr_id
      rcpt_read_at: datetime NOT NULL DEFAULT GETDATE()
    """
    __tablename__ = "TM_CHT_ReadReceipt"
    __table_args__ = {'extend_existing': True}

    # Primary key
    rcpt_id: Mapped[int] = mapped_column(
        "rcpt_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    rcpt_msg_id: Mapped[int] = mapped_column(
        "rcpt_msg_id", Integer, ForeignKey("TM_CHT_Message.msg_id"), nullable=False
    )
    rcpt_usr_id: Mapped[int] = mapped_column(
        "rcpt_usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False
    )

    # Timestamp
    rcpt_read_at: Mapped[datetime] = mapped_column(
        "rcpt_read_at", DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    message: Mapped["ChatMessage"] = relationship(
        "ChatMessage",
        back_populates="read_receipts",
        lazy="selectin"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[rcpt_usr_id],
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ChatMessageReadReceipt(rcpt_id={self.rcpt_id}, msg={self.rcpt_msg_id}, user={self.rcpt_usr_id})>"


# =============================================================================
# Room-based Chat System (TM_CHAT_*)
# =============================================================================


class ChatRoom(Base):
    """
    Chat room model for group conversations.

    Maps to TM_CHAT_Room table.

    DB schema:
      room_id: int NOT NULL [PK]
      room_name: nvarchar(200) NOT NULL
      room_description: nvarchar(1000) NULL
      room_type: nvarchar(50) NOT NULL DEFAULT 'group'
      room_is_active: bit NOT NULL DEFAULT 1
      usr_creator_id: int NULL
      room_d_creation: datetime NOT NULL DEFAULT GETDATE()
      room_d_update: datetime NULL
    """
    __tablename__ = "TM_CHAT_Room"
    __table_args__ = {'extend_existing': True}

    # Primary key
    room_id: Mapped[int] = mapped_column(
        "room_id", Integer, primary_key=True, autoincrement=True
    )

    # Room details
    room_name: Mapped[str] = mapped_column(
        "room_name", String(200), nullable=False
    )
    room_description: Mapped[Optional[str]] = mapped_column(
        "room_description", String(1000), nullable=True
    )
    room_type: Mapped[str] = mapped_column(
        "room_type", String(50), nullable=False, default="group"
    )
    room_is_active: Mapped[bool] = mapped_column(
        "room_is_active", Boolean, nullable=False, default=True
    )

    # Foreign keys
    usr_creator_id: Mapped[Optional[int]] = mapped_column(
        "usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Timestamps
    room_d_creation: Mapped[datetime] = mapped_column(
        "room_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    room_d_update: Mapped[Optional[datetime]] = mapped_column(
        "room_d_update", DateTime, nullable=True
    )

    # Relationships
    members: Mapped[List["ChatRoomMember"]] = relationship(
        "ChatRoomMember",
        back_populates="room",
        lazy="selectin"
    )
    messages: Mapped[List["ChatRoomMessage"]] = relationship(
        "ChatRoomMessage",
        back_populates="room",
        lazy="noload"
    )
    creator_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[usr_creator_id],
        lazy="selectin"
    )

    # Property aliases (snake_case for endpoint/schema compatibility)
    @property
    def id(self) -> int:
        return self.room_id

    @property
    def name(self) -> str:
        return self.room_name

    @name.setter
    def name(self, value: str) -> None:
        self.room_name = value

    @property
    def description(self) -> Optional[str]:
        return self.room_description

    @description.setter
    def description(self, value: Optional[str]) -> None:
        self.room_description = value

    @property
    def is_active(self) -> bool:
        return self.room_is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        self.room_is_active = value

    @property
    def created_by_id(self) -> Optional[int]:
        return self.usr_creator_id

    @created_by_id.setter
    def created_by_id(self, value: Optional[int]) -> None:
        self.usr_creator_id = value

    @property
    def created_at(self) -> datetime:
        return self.room_d_creation

    @created_at.setter
    def created_at(self, value: datetime) -> None:
        self.room_d_creation = value

    def __repr__(self) -> str:
        return f"<ChatRoom(room_id={self.room_id}, name='{self.room_name}')>"


class ChatRoomMember(Base):
    """
    Chat room membership model.

    Maps to TM_CHAT_RoomMember table.

    DB schema:
      mbr_id: int NOT NULL [PK]
      mbr_room_id: int NOT NULL -> TM_CHAT_Room.room_id
      mbr_usr_id: int NOT NULL -> TM_USR_User.usr_id
      mbr_role: nvarchar(20) NOT NULL DEFAULT 'member'
      mbr_is_active: bit NOT NULL DEFAULT 1
      mbr_joined_at: datetime NOT NULL DEFAULT GETDATE()
    """
    __tablename__ = "TM_CHAT_RoomMember"
    __table_args__ = {'extend_existing': True}

    # Primary key
    mbr_id: Mapped[int] = mapped_column(
        "mbr_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    mbr_room_id: Mapped[int] = mapped_column(
        "mbr_room_id", Integer, ForeignKey("TM_CHAT_Room.room_id"), nullable=False
    )
    mbr_usr_id: Mapped[int] = mapped_column(
        "mbr_usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False
    )

    # Member details
    mbr_role: Mapped[str] = mapped_column(
        "mbr_role", String(20), nullable=False, default="member"
    )
    mbr_is_active: Mapped[bool] = mapped_column(
        "mbr_is_active", Boolean, nullable=False, default=True
    )
    mbr_joined_at: Mapped[datetime] = mapped_column(
        "mbr_joined_at", DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    room: Mapped["ChatRoom"] = relationship(
        "ChatRoom",
        back_populates="members",
        lazy="selectin"
    )
    member_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[mbr_usr_id],
        lazy="selectin"
    )

    # Property aliases (snake_case for endpoint/schema compatibility)
    @property
    def id(self) -> int:
        return self.mbr_id

    @property
    def room_id(self) -> int:
        return self.mbr_room_id

    @room_id.setter
    def room_id(self, value: int) -> None:
        self.mbr_room_id = value

    @property
    def user_id(self) -> int:
        return self.mbr_usr_id

    @user_id.setter
    def user_id(self, value: int) -> None:
        self.mbr_usr_id = value

    @property
    def role(self) -> str:
        return self.mbr_role

    @role.setter
    def role(self, value: str) -> None:
        self.mbr_role = value

    @property
    def is_active(self) -> bool:
        return self.mbr_is_active

    @is_active.setter
    def is_active(self, value: bool) -> None:
        self.mbr_is_active = value

    @property
    def joined_at(self) -> datetime:
        return self.mbr_joined_at

    @joined_at.setter
    def joined_at(self, value: datetime) -> None:
        self.mbr_joined_at = value

    def __repr__(self) -> str:
        return f"<ChatRoomMember(mbr_id={self.mbr_id}, room={self.mbr_room_id}, user={self.mbr_usr_id})>"


class ChatRoomMessage(Base):
    """
    Chat room message model for room-based messaging.

    Maps to TM_CHAT_Message table.

    DB schema:
      cmsg_id: int NOT NULL [PK]
      cmsg_room_id: int NOT NULL -> TM_CHAT_Room.room_id
      cmsg_usr_id: int NULL -> TM_USR_User.usr_id
      cmsg_content: nvarchar(max) NOT NULL
      cmsg_type: nvarchar(50) NOT NULL DEFAULT 'text'
      cmsg_is_edited: bit NOT NULL DEFAULT 0
      cmsg_is_deleted: bit NOT NULL DEFAULT 0
      cmsg_d_creation: datetime NOT NULL DEFAULT GETDATE()
      cmsg_d_update: datetime NULL
      cmsg_deleted_at: datetime NULL
      cmsg_deleted_by_id: int NULL
    """
    __tablename__ = "TM_CHAT_Message"
    __table_args__ = {'extend_existing': True}

    # Primary key
    cmsg_id: Mapped[int] = mapped_column(
        "cmsg_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    cmsg_room_id: Mapped[int] = mapped_column(
        "cmsg_room_id", Integer, ForeignKey("TM_CHAT_Room.room_id"), nullable=False
    )
    cmsg_usr_id: Mapped[Optional[int]] = mapped_column(
        "cmsg_usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Message fields
    cmsg_content: Mapped[str] = mapped_column(
        "cmsg_content", Text, nullable=False
    )
    cmsg_type: Mapped[str] = mapped_column(
        "cmsg_type", String(50), nullable=False, default="text"
    )

    # Status flags
    cmsg_is_edited: Mapped[bool] = mapped_column(
        "cmsg_is_edited", Boolean, nullable=False, default=False
    )
    cmsg_is_deleted: Mapped[bool] = mapped_column(
        "cmsg_is_deleted", Boolean, nullable=False, default=False
    )

    # Timestamps
    cmsg_d_creation: Mapped[datetime] = mapped_column(
        "cmsg_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    cmsg_d_update: Mapped[Optional[datetime]] = mapped_column(
        "cmsg_d_update", DateTime, nullable=True
    )
    cmsg_deleted_at: Mapped[Optional[datetime]] = mapped_column(
        "cmsg_deleted_at", DateTime, nullable=True
    )
    cmsg_deleted_by_id: Mapped[Optional[int]] = mapped_column(
        "cmsg_deleted_by_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Relationships
    room: Mapped["ChatRoom"] = relationship(
        "ChatRoom",
        back_populates="messages",
        lazy="selectin"
    )
    sender: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[cmsg_usr_id],
        lazy="selectin"
    )

    # Property aliases (snake_case for endpoint/schema compatibility)
    @property
    def id(self) -> int:
        return self.cmsg_id

    @property
    def room_id(self) -> int:
        return self.cmsg_room_id

    @room_id.setter
    def room_id(self, value: int) -> None:
        self.cmsg_room_id = value

    @property
    def sender_id(self) -> Optional[int]:
        return self.cmsg_usr_id

    @sender_id.setter
    def sender_id(self, value: Optional[int]) -> None:
        self.cmsg_usr_id = value

    @property
    def content(self) -> str:
        return self.cmsg_content

    @content.setter
    def content(self, value: str) -> None:
        self.cmsg_content = value

    @property
    def message_type(self) -> str:
        return self.cmsg_type

    @message_type.setter
    def message_type(self, value: str) -> None:
        self.cmsg_type = value

    @property
    def is_edited(self) -> bool:
        return self.cmsg_is_edited

    @is_edited.setter
    def is_edited(self, value: bool) -> None:
        self.cmsg_is_edited = value

    @property
    def is_deleted(self) -> bool:
        return self.cmsg_is_deleted

    @is_deleted.setter
    def is_deleted(self, value: bool) -> None:
        self.cmsg_is_deleted = value

    @property
    def created_at(self) -> datetime:
        return self.cmsg_d_creation

    @created_at.setter
    def created_at(self, value: datetime) -> None:
        self.cmsg_d_creation = value

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.cmsg_d_update

    @updated_at.setter
    def updated_at(self, value: Optional[datetime]) -> None:
        self.cmsg_d_update = value

    @property
    def deleted_at(self) -> Optional[datetime]:
        return self.cmsg_deleted_at

    @deleted_at.setter
    def deleted_at(self, value: Optional[datetime]) -> None:
        self.cmsg_deleted_at = value

    @property
    def deleted_by_id(self) -> Optional[int]:
        return self.cmsg_deleted_by_id

    @deleted_by_id.setter
    def deleted_by_id(self, value: Optional[int]) -> None:
        self.cmsg_deleted_by_id = value

    def __repr__(self) -> str:
        return f"<ChatRoomMessage(cmsg_id={self.cmsg_id}, room={self.cmsg_room_id})>"

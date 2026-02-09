"""
Chat service for managing chat threads and messages.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import Optional
from datetime import datetime

from app.models.chat import ChatThread, ChatMessage, ChatParticipant
from app.models.user import User
from app.schemas.chat import (
    ChatThreadCreate,
    ChatThreadResponse,
    ChatThreadListResponse,
    ChatThreadMessageCreate,
    ChatThreadMessageResponse,
    ChatMessageListResponse,
    ChatParticipantResponse,
    ThreadType,
    MessageType,
    SenderType,
)


class ChatService:
    """Service for chat operations."""

    def __init__(self, db: Session):
        self.db = db

    def list_threads(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        thread_type: Optional[str] = None,
        is_archived: bool = False
    ) -> ChatThreadListResponse:
        """List chat threads for a user with pagination."""

        # Base query - threads where user is a participant
        query = self.db.query(ChatThread).join(
            ChatParticipant,
            ChatParticipant.prt_thr_id == ChatThread.cht_id
        ).filter(
            ChatParticipant.prt_usr_id == user_id,
            ChatThread.cht_is_archived == is_archived
        )

        # Filter by thread type if specified
        if thread_type:
            query = query.filter(ChatThread.cht_thread_type == thread_type)

        # Get total count
        total = query.count()

        # Order by last message time (most recent first)
        query = query.order_by(
            desc(ChatThread.cht_last_message_at).nullslast(),
            desc(ChatThread.cht_d_creation)
        )

        # Apply pagination
        offset = (page - 1) * page_size
        threads = query.offset(offset).limit(page_size).all()

        # Build response with participant info and unread counts
        items = []
        for thread in threads:
            thread_response = self._build_thread_response(thread, user_id)
            items.append(thread_response)

        total_pages = (total + page_size - 1) // page_size

        return ChatThreadListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    def get_thread(self, thread_id: int, user_id: int) -> Optional[ChatThreadResponse]:
        """Get a specific thread if user is a participant."""

        # Check if user is a participant
        participant = self.db.query(ChatParticipant).filter(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == user_id
        ).first()

        if not participant:
            return None

        thread = self.db.query(ChatThread).filter(
            ChatThread.cht_id == thread_id
        ).first()

        if not thread:
            return None

        return self._build_thread_response(thread, user_id)

    def get_thread_messages(
        self,
        thread_id: int,
        user_id: int,
        page: int = 1,
        page_size: int = 50,
        before_id: Optional[int] = None,
        after_id: Optional[int] = None
    ) -> ChatMessageListResponse:
        """
        Get messages for a thread with pagination.

        Supports cursor-based pagination via before_id/after_id for infinite scroll.
        """

        # Base query
        query = self.db.query(ChatMessage).filter(
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_is_deleted == False
        )

        # Apply cursor-based filtering if provided
        if before_id:
            query = query.filter(ChatMessage.msg_id < before_id)
        elif after_id:
            query = query.filter(ChatMessage.msg_id > after_id)

        # Get total count (without cursor filters for accurate total)
        total_query = self.db.query(ChatMessage).filter(
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_is_deleted == False
        )
        total = total_query.count()

        # Order by ID descending (newest first) for before_id or default
        # Order by ID ascending for after_id (to get messages after a point)
        if after_id:
            query = query.order_by(asc(ChatMessage.msg_id))
        else:
            query = query.order_by(desc(ChatMessage.msg_id))

        # Apply pagination
        offset = (page - 1) * page_size if not (before_id or after_id) else 0
        messages = query.offset(offset).limit(page_size).all()

        # Reverse if we used ascending order (after_id case)
        if after_id:
            messages = list(reversed(messages))

        # Build response items
        items = []
        for message in messages:
            msg_response = self._build_message_response(message)
            items.append(msg_response)

        # Calculate pagination info
        total_pages = (total + page_size - 1) // page_size

        # Determine if there are more messages
        has_more = False
        if items:
            if before_id:
                # Check if there are older messages
                older_count = self.db.query(ChatMessage).filter(
                    ChatMessage.msg_thr_id == thread_id,
                    ChatMessage.msg_is_deleted == False,
                    ChatMessage.msg_id < items[-1].id
                ).count()
                has_more = older_count > 0
            else:
                has_more = (page * page_size) < total

        # Get oldest and newest message IDs for cursor reference
        oldest_id = items[-1].id if items else None
        newest_id = items[0].id if items else None

        return ChatMessageListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_more=has_more,
            oldest_message_id=oldest_id,
            newest_message_id=newest_id
        )

    def mark_messages_as_read(self, thread_id: int, user_id: int) -> None:
        """Mark all messages in a thread as read for a user."""

        participant = self.db.query(ChatParticipant).filter(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == user_id
        ).first()

        if participant:
            participant.prt_last_read_at = datetime.utcnow()
            self.db.commit()

    def create_thread(
        self, thread_data: ChatThreadCreate, creator_id: int
    ) -> ChatThreadResponse:
        """Create a new chat thread."""

        # Create the thread
        thread = ChatThread(
            cht_title=thread_data.title,
            cht_thread_type=thread_data.thread_type.value,
            usr_creator_id=creator_id,
            cht_d_creation=datetime.utcnow(),
            cht_is_archived=False
        )
        self.db.add(thread)
        self.db.flush()  # Get the ID

        # Add creator as participant (and admin for group chats)
        creator_participant = ChatParticipant(
            prt_thr_id=thread.cht_id,
            prt_usr_id=creator_id,
            prt_joined_at=datetime.utcnow(),
            prt_is_admin=thread_data.thread_type == ThreadType.GROUP
        )
        self.db.add(creator_participant)

        # Add other participants for direct/group chats
        if thread_data.participant_ids:
            for participant_id in thread_data.participant_ids:
                if participant_id != creator_id:  # Don't add creator twice
                    participant = ChatParticipant(
                        prt_thr_id=thread.cht_id,
                        prt_usr_id=participant_id,
                        prt_joined_at=datetime.utcnow(),
                        prt_is_admin=False
                    )
                    self.db.add(participant)

        # Send initial message if provided
        if thread_data.initial_message:
            message = ChatMessage(
                msg_thr_id=thread.cht_id,
                msg_usr_id=creator_id,
                msg_sender_type=SenderType.USER.value,
                msg_content=thread_data.initial_message,
                msg_type=MessageType.TEXT.value,
                msg_d_creation=datetime.utcnow()
            )
            self.db.add(message)
            thread.cht_last_message_at = datetime.utcnow()
            thread.cht_last_msg_preview = thread_data.initial_message[:100]

        self.db.commit()
        self.db.refresh(thread)

        return self._build_thread_response(thread, creator_id)

    def send_message(
        self,
        thread_id: int,
        sender_id: int,
        message_data: ChatThreadMessageCreate
    ) -> ChatThreadMessageResponse:
        """Send a message to a thread."""

        message = ChatMessage(
            msg_thr_id=thread_id,
            msg_usr_id=sender_id,
            msg_sender_type=SenderType.USER.value,
            msg_content=message_data.content,
            msg_type=message_data.message_type.value,
            msg_metadata=message_data.metadata,
            msg_d_creation=datetime.utcnow()
        )
        self.db.add(message)

        # Update thread's last message info
        thread = self.db.query(ChatThread).filter(
            ChatThread.cht_id == thread_id
        ).first()
        if thread:
            thread.cht_last_message_at = datetime.utcnow()
            thread.cht_last_msg_preview = message_data.content[:100]
            thread.cht_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(message)

        return self._build_message_response(message)

    def _build_thread_response(
        self, thread: ChatThread, user_id: int
    ) -> ChatThreadResponse:
        """Build a thread response with all related data."""

        # Get participants with user info
        participants = self.db.query(ChatParticipant).filter(
            ChatParticipant.prt_thr_id == thread.cht_id
        ).all()

        participant_responses = []
        user_last_read = None

        for p in participants:
            user = self.db.query(User).filter(
                User.usr_id == p.prt_usr_id
            ).first()
            participant_responses.append(ChatParticipantResponse(
                id=p.prt_id,
                user_id=p.prt_usr_id,
                user_name=user.full_name if user else None,
                user_email=user.email if user else None,
                joined_at=p.prt_joined_at,
                last_read_at=p.prt_last_read_at,
                is_admin=p.prt_is_admin or False
            ))

            if p.prt_usr_id == user_id:
                user_last_read = p.prt_last_read_at

        # Calculate unread count
        unread_count = 0
        if user_last_read:
            unread_count = self.db.query(ChatMessage).filter(
                ChatMessage.msg_thr_id == thread.cht_id,
                ChatMessage.msg_d_creation > user_last_read,
                ChatMessage.msg_usr_id != user_id,
                ChatMessage.msg_is_deleted == False
            ).count()
        else:
            # If never read, count all messages not from this user
            unread_count = self.db.query(ChatMessage).filter(
                ChatMessage.msg_thr_id == thread.cht_id,
                ChatMessage.msg_usr_id != user_id,
                ChatMessage.msg_is_deleted == False
            ).count()

        return ChatThreadResponse(
            id=thread.cht_id,
            title=thread.cht_title,
            thread_type=ThreadType(thread.cht_thread_type),
            created_at=thread.cht_d_creation,
            updated_at=thread.cht_d_update,
            is_archived=thread.cht_is_archived or False,
            last_message_at=thread.cht_last_message_at,
            last_message_preview=thread.cht_last_msg_preview,
            unread_count=unread_count,
            participants=participant_responses,
            created_by_id=thread.usr_creator_id
        )

    def _build_message_response(
        self, message: ChatMessage
    ) -> ChatThreadMessageResponse:
        """Build a message response with sender info."""

        sender_name = None
        if message.msg_usr_id:
            user = self.db.query(User).filter(
                User.usr_id == message.msg_usr_id
            ).first()
            sender_name = user.full_name if user else None
        elif message.msg_sender_type == SenderType.AI.value:
            sender_name = "AI Assistant"
        elif message.msg_sender_type == SenderType.SYSTEM.value:
            sender_name = "System"

        return ChatThreadMessageResponse(
            id=message.msg_id,
            thread_id=message.msg_thr_id,
            sender_id=message.msg_usr_id,
            sender_type=SenderType(message.msg_sender_type),
            sender_name=sender_name,
            content=message.msg_content,
            message_type=MessageType(message.msg_type),
            metadata=message.msg_metadata,
            created_at=message.msg_d_creation,
            updated_at=message.msg_d_update,
            is_edited=message.msg_is_edited or False,
            is_deleted=message.msg_is_deleted or False
        )

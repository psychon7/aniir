"""
Repository for Chat module database operations.
"""
from typing import Optional, List, Tuple
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.chat import ChatThread, ChatMessage, ChatParticipant


class ChatRepository:
    """Repository for chat-related database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_threads_by_user(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        include_archived: bool = False
    ) -> Tuple[List[ChatThread], int]:
        """
        Get paginated list of chat threads for a user.

        Args:
            user_id: The user's ID
            page: Page number (1-indexed)
            page_size: Number of items per page
            include_archived: Whether to include archived threads

        Returns:
            Tuple of (threads list, total count)
        """
        query = self.db.query(ChatThread).join(
            ChatParticipant,
            ChatParticipant.prt_thr_id == ChatThread.cht_id
        ).filter(
            ChatParticipant.prt_usr_id == user_id
        )

        if not include_archived:
            query = query.filter(ChatThread.cht_is_archived == False)

        # Get total count before pagination
        total = query.count()

        # Order by last message time (most recent first), then by creation date
        query = query.order_by(
            desc(ChatThread.cht_last_message_at).nulls_last(),
            desc(ChatThread.cht_d_creation)
        )

        # Apply pagination
        offset = (page - 1) * page_size
        threads = query.offset(offset).limit(page_size).all()

        return threads, total

    def get_thread_by_id(
        self, thread_id: int, user_id: int
    ) -> Optional[ChatThread]:
        """
        Get a specific thread by ID, ensuring the user is a participant.

        Args:
            thread_id: The thread ID
            user_id: The user's ID (for participant verification)

        Returns:
            ChatThread if found and user is participant, None otherwise
        """
        return self.db.query(ChatThread).join(
            ChatParticipant,
            ChatParticipant.prt_thr_id == ChatThread.cht_id
        ).filter(
            ChatThread.cht_id == thread_id,
            ChatParticipant.prt_usr_id == user_id
        ).first()

    def get_last_message_preview(
        self, thread_id: int, max_length: int = 100
    ) -> Optional[str]:
        """
        Get a preview of the last message in a thread.

        Args:
            thread_id: The thread ID
            max_length: Maximum length of preview

        Returns:
            Truncated message content or None
        """
        message = self.db.query(ChatMessage).filter(
            ChatMessage.msg_thr_id == thread_id
        ).order_by(desc(ChatMessage.msg_d_creation)).first()

        if message and message.msg_content:
            content = message.msg_content
            if len(content) > max_length:
                return content[:max_length] + "..."
            return content
        return None

    def count_user_threads(
        self, user_id: int, include_archived: bool = False
    ) -> int:
        """Count total threads for a user."""
        query = self.db.query(func.count(ChatThread.cht_id)).join(
            ChatParticipant,
            ChatParticipant.prt_thr_id == ChatThread.cht_id
        ).filter(
            ChatParticipant.prt_usr_id == user_id
        )
        if not include_archived:
            query = query.filter(ChatThread.cht_is_archived == False)
        return query.scalar() or 0

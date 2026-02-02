"""
Chat service for managing chat threads and messages.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import Optional, List
from datetime import datetime

from app.models.chat import ChatThread, ChatMessage, ChatParticipant
from app.models.user import User
from app.schemas.chat import (
    ChatThreadCreate,
    ChatThreadResponse,
    ChatThreadListResponse,
    ChatMessageCreate,
    ChatMessageResponse,
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
            ChatParticipant.ThreadId == ChatThread.Id
        ).filter(
            ChatParticipant.UserId == user_id,
            ChatThread.IsArchived == is_archived
        )
        
        # Filter by thread type if specified
        if thread_type:
            query = query.filter(ChatThread.ThreadType == thread_type)
        
        # Get total count
        total = query.count()
        
        # Order by last message time (most recent first)
        query = query.order_by(desc(ChatThread.LastMessageAt.nullslast()), desc(ChatThread.CreatedAt))
        
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
            ChatParticipant.ThreadId == thread_id,
            ChatParticipant.UserId == user_id
        ).first()
        
        if not participant:
            return None
        
        thread = self.db.query(ChatThread).filter(ChatThread.Id == thread_id).first()
        
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
            ChatMessage.ThreadId == thread_id,
            ChatMessage.IsDeleted == False
        )
        
        # Apply cursor-based filtering if provided
        if before_id:
            query = query.filter(ChatMessage.Id < before_id)
        elif after_id:
            query = query.filter(ChatMessage.Id > after_id)
        
        # Get total count (without cursor filters for accurate total)
        total_query = self.db.query(ChatMessage).filter(
            ChatMessage.ThreadId == thread_id,
            ChatMessage.IsDeleted == False
        )
        total = total_query.count()
        
        # Order by ID descending (newest first) for before_id or default
        # Order by ID ascending for after_id (to get messages after a point)
        if after_id:
            query = query.order_by(asc(ChatMessage.Id))
        else:
            query = query.order_by(desc(ChatMessage.Id))
        
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
                    ChatMessage.ThreadId == thread_id,
                    ChatMessage.IsDeleted == False,
                    ChatMessage.Id < items[-1].id
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
            ChatParticipant.ThreadId == thread_id,
            ChatParticipant.UserId == user_id
        ).first()
        
        if participant:
            participant.LastReadAt = datetime.utcnow()
            self.db.commit()
    
    def create_thread(self, thread_data: ChatThreadCreate, creator_id: int) -> ChatThreadResponse:
        """Create a new chat thread."""
        
        # Create the thread
        thread = ChatThread(
            Title=thread_data.title,
            ThreadType=thread_data.thread_type.value,
            CreatedById=creator_id,
            CreatedAt=datetime.utcnow(),
            IsArchived=False
        )
        self.db.add(thread)
        self.db.flush()  # Get the ID
        
        # Add creator as participant (and admin for group chats)
        creator_participant = ChatParticipant(
            ThreadId=thread.Id,
            UserId=creator_id,
            JoinedAt=datetime.utcnow(),
            IsAdmin=thread_data.thread_type == ThreadType.GROUP
        )
        self.db.add(creator_participant)
        
        # Add other participants for direct/group chats
        if thread_data.participant_ids:
            for participant_id in thread_data.participant_ids:
                if participant_id != creator_id:  # Don't add creator twice
                    participant = ChatParticipant(
                        ThreadId=thread.Id,
                        UserId=participant_id,
                        JoinedAt=datetime.utcnow(),
                        IsAdmin=False
                    )
                    self.db.add(participant)
        
        # Send initial message if provided
        if thread_data.initial_message:
            message = ChatMessage(
                ThreadId=thread.Id,
                SenderId=creator_id,
                SenderType=SenderType.USER.value,
                Content=thread_data.initial_message,
                MessageType=MessageType.TEXT.value,
                CreatedAt=datetime.utcnow()
            )
            self.db.add(message)
            thread.LastMessageAt = datetime.utcnow()
            thread.LastMessagePreview = thread_data.initial_message[:100]
        
        self.db.commit()
        self.db.refresh(thread)
        
        return self._build_thread_response(thread, creator_id)
    
    def send_message(
        self,
        thread_id: int,
        sender_id: int,
        message_data: ChatMessageCreate
    ) -> ChatMessageResponse:
        """Send a message to a thread."""
        
        message = ChatMessage(
            ThreadId=thread_id,
            SenderId=sender_id,
            SenderType=SenderType.USER.value,
            Content=message_data.content,
            MessageType=message_data.message_type.value,
            Metadata=message_data.metadata,
            CreatedAt=datetime.utcnow()
        )
        self.db.add(message)
        
        # Update thread's last message info
        thread = self.db.query(ChatThread).filter(ChatThread.Id == thread_id).first()
        if thread:
            thread.LastMessageAt = datetime.utcnow()
            thread.LastMessagePreview = message_data.content[:100]
            thread.UpdatedAt = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(message)
        
        return self._build_message_response(message)
    
    def _build_thread_response(self, thread: ChatThread, user_id: int) -> ChatThreadResponse:
        """Build a thread response with all related data."""
        
        # Get participants with user info
        participants = self.db.query(ChatParticipant).filter(
            ChatParticipant.ThreadId == thread.Id
        ).all()
        
        participant_responses = []
        user_last_read = None
        
        for p in participants:
            user = self.db.query(User).filter(User.Id == p.UserId).first()
            participant_responses.append(ChatParticipantResponse(
                id=p.Id,
                user_id=p.UserId,
                user_name=user.FullName if user else None,
                user_email=user.Email if user else None,
                joined_at=p.JoinedAt,
                last_read_at=p.LastReadAt,
                is_admin=p.IsAdmin or False
            ))
            
            if p.UserId == user_id:
                user_last_read = p.LastReadAt
        
        # Calculate unread count
        unread_count = 0
        if user_last_read:
            unread_count = self.db.query(ChatMessage).filter(
                ChatMessage.ThreadId == thread.Id,
                ChatMessage.CreatedAt > user_last_read,
                ChatMessage.SenderId != user_id,
                ChatMessage.IsDeleted == False
            ).count()
        else:
            # If never read, count all messages not from this user
            unread_count = self.db.query(ChatMessage).filter(
                ChatMessage.ThreadId == thread.Id,
                ChatMessage.SenderId != user_id,
                ChatMessage.IsDeleted == False
            ).count()
        
        return ChatThreadResponse(
            id=thread.Id,
            title=thread.Title,
            thread_type=ThreadType(thread.ThreadType),
            created_at=thread.CreatedAt,
            updated_at=thread.UpdatedAt,
            is_archived=thread.IsArchived or False,
            last_message_at=thread.LastMessageAt,
            last_message_preview=thread.LastMessagePreview,
            unread_count=unread_count,
            participants=participant_responses,
            created_by_id=thread.CreatedById
        )
    
    def _build_message_response(self, message: ChatMessage) -> ChatMessageResponse:
        """Build a message response with sender info."""
        
        sender_name = None
        if message.SenderId:
            user = self.db.query(User).filter(User.Id == message.SenderId).first()
            sender_name = user.FullName if user else None
        elif message.SenderType == SenderType.AI.value:
            sender_name = "AI Assistant"
        elif message.SenderType == SenderType.SYSTEM.value:
            sender_name = "System"
        
        return ChatMessageResponse(
            id=message.Id,
            thread_id=message.ThreadId,
            sender_id=message.SenderId,
            sender_type=SenderType(message.SenderType),
            sender_name=sender_name,
            content=message.Content,
            message_type=MessageType(message.MessageType),
            metadata=message.Metadata,
            created_at=message.CreatedAt,
            updated_at=message.UpdatedAt,
            is_edited=message.IsEdited or False,
            is_deleted=message.IsDeleted or False
        )

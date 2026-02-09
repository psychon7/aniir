"""
Chat Threads API endpoints for direct messaging and group conversations.

This module provides endpoints for:
  - Listing user's threads (DMs and groups)
  - Creating new threads/conversations
  - Finding or creating direct message threads
  - Managing thread participants
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import (
    ChatThread,
    ChatParticipant,
    ChatMessage,
    ChatMessageReadReceipt,
)

router = APIRouter(prefix="/chat/threads", tags=["chat-threads"])


# =============================================================================
# Response Models
# =============================================================================

class ParticipantInfo(BaseModel):
    """Participant information in a thread."""
    id: int
    user_id: int
    username: str
    display_name: str
    is_admin: bool = False

    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    """Thread response with metadata."""
    id: int
    title: Optional[str] = None
    thread_type: str  # 'direct', 'group'
    is_archived: bool = False
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    created_by: int
    created_at: datetime
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    participants: List[ParticipantInfo] = []

    class Config:
        from_attributes = True


class CreateThreadRequest(BaseModel):
    """Request to create a new thread."""
    title: Optional[str] = Field(None, max_length=500)
    thread_type: str = Field("group", description="'direct' or 'group'")
    participant_ids: List[int] = Field(..., min_length=1)
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


class CreateDirectMessageRequest(BaseModel):
    """Request to find or create a direct message thread with another user."""
    user_id: int = Field(..., description="The user ID to start a conversation with")


class AddParticipantsRequest(BaseModel):
    """Request to add participants to a thread."""
    user_ids: List[int] = Field(..., min_length=1)


# =============================================================================
# Helper Functions
# =============================================================================

def _find_direct_thread(db: Session, user1_id: int, user2_id: int) -> Optional[ChatThread]:
    """Find an existing direct thread between two users."""
    user1_threads = db.query(ChatParticipant.prt_thr_id).filter(
        and_(
            ChatParticipant.prt_usr_id == user1_id,
            ChatParticipant.prt_is_active == True
        )
    ).subquery()

    user2_threads = db.query(ChatParticipant.prt_thr_id).filter(
        and_(
            ChatParticipant.prt_usr_id == user2_id,
            ChatParticipant.prt_is_active == True
        )
    ).subquery()

    direct_thread = db.query(ChatThread).filter(
        and_(
            ChatThread.cht_id.in_(user1_threads),
            ChatThread.cht_id.in_(user2_threads),
            ChatThread.cht_thread_type == "direct"
        )
    ).first()

    return direct_thread


def _get_thread_response(
    thread: ChatThread,
    current_user_id: int,
    db: Session
) -> ThreadResponse:
    """Build ThreadResponse with unread count and participants."""
    # Get unread count
    read_message_ids = db.query(ChatMessageReadReceipt.rcpt_msg_id).filter(
        ChatMessageReadReceipt.rcpt_usr_id == current_user_id
    ).subquery()

    unread_count = db.query(func.count(ChatMessage.msg_id)).filter(
        and_(
            ChatMessage.msg_thr_id == thread.cht_id,
            ChatMessage.msg_usr_id != current_user_id,
            ChatMessage.msg_deleted_at.is_(None),
            ~ChatMessage.msg_id.in_(read_message_ids)
        )
    ).scalar() or 0

    # Get participants
    participants = []
    for p in thread.participants:
        if p.prt_is_active and p.user:
            display_name = f"{p.user.usr_firstname or ''} {p.user.usr_lastname or ''}".strip()
            participants.append(ParticipantInfo(
                id=p.prt_id,
                user_id=p.prt_usr_id,
                username=p.user.usr_login or "",
                display_name=display_name or p.user.usr_login or "",
                is_admin=p.prt_is_admin
            ))

    return ThreadResponse(
        id=thread.cht_id,
        title=thread.cht_title,
        thread_type=thread.cht_thread_type,
        is_archived=thread.cht_is_archived,
        entity_type=thread.cht_entity_type,
        entity_id=thread.cht_entity_id,
        created_by=thread.usr_creator_id or 0,
        created_at=thread.cht_d_creation,
        last_message_at=thread.cht_last_message_at,
        last_message_preview=thread.cht_last_msg_preview,
        unread_count=unread_count,
        participants=participants
    )


# =============================================================================
# Thread Endpoints
# =============================================================================

@router.get("", response_model=List[ThreadResponse])
async def list_threads(
    thread_type: Optional[str] = Query(None, description="Filter by type: 'direct' or 'group'"),
    include_archived: bool = Query(False, description="Include archived threads"),
    search: Optional[str] = Query(None, max_length=100, description="Search thread titles"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all threads the current user is a participant of."""
    try:
        # Get thread IDs where user is an active participant
        participant_thread_ids = db.query(ChatParticipant.prt_thr_id).filter(
            and_(
                ChatParticipant.prt_usr_id == current_user.id,
                ChatParticipant.prt_is_active == True
            )
        ).subquery()

        query = db.query(ChatThread).filter(
            ChatThread.cht_id.in_(participant_thread_ids)
        )

        if not include_archived:
            query = query.filter(ChatThread.cht_is_archived == False)
        
        if thread_type:
            query = query.filter(ChatThread.cht_thread_type == thread_type)
        
        if search:
            query = query.filter(ChatThread.cht_title.ilike(f"%{search}%"))

        query = query.order_by(
            ChatThread.cht_last_message_at.desc().nullsfirst(),
            ChatThread.cht_d_creation.desc()
        )

        threads = query.offset(offset).limit(limit).all()

        return [_get_thread_response(t, current_user.id, db) for t in threads]
    except Exception as e:
        # Log the error for debugging
        import logging
        logging.error(f"Error listing threads: {e}")
        
        # Check if this is a table-not-found error
        error_msg = str(e).lower()
        if "invalid object name" in error_msg or "does not exist" in error_msg:
            # Chat tables not yet created - return empty list gracefully
            return []
        
        # Re-raise other errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load threads. Please try again later."
        )


@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific thread by ID."""
    participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == current_user.id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this thread"
        )

    thread = db.query(ChatThread).filter(ChatThread.cht_id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )

    return _get_thread_response(thread, current_user.id, db)


@router.post("", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
async def create_thread(
    request: CreateThreadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chat thread (group or direct message)."""
    # Validate participant IDs exist
    valid_users = db.query(User.usr_id).filter(
        User.usr_id.in_(request.participant_ids)
    ).all()
    valid_user_ids = {u[0] for u in valid_users}

    invalid_ids = set(request.participant_ids) - valid_user_ids
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user IDs: {list(invalid_ids)}"
        )

    # For direct messages, check for existing thread
    if request.thread_type == "direct":
        if len(request.participant_ids) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct message threads must have exactly one other participant"
            )
        
        other_user_id = request.participant_ids[0]
        existing_thread = _find_direct_thread(db, current_user.id, other_user_id)
        if existing_thread:
            return _get_thread_response(existing_thread, current_user.id, db)

    # Create the thread
    thread = ChatThread(
        cht_title=request.title,
        cht_thread_type=request.thread_type,
        cht_entity_type=request.entity_type,
        cht_entity_id=request.entity_id,
        usr_creator_id=current_user.id,
        cht_d_creation=datetime.utcnow(),
        cht_is_archived=False
    )
    db.add(thread)
    db.flush()

    # Add current user as admin
    creator_participant = ChatParticipant(
        prt_thr_id=thread.cht_id,
        prt_usr_id=current_user.id,
        prt_is_admin=True,
        prt_is_active=True,
        prt_joined_at=datetime.utcnow()
    )
    db.add(creator_participant)

    # Add other participants
    for user_id in request.participant_ids:
        if user_id != current_user.id:
            participant = ChatParticipant(
                prt_thr_id=thread.cht_id,
                prt_usr_id=user_id,
                prt_is_admin=False,
                prt_is_active=True,
                prt_joined_at=datetime.utcnow()
            )
            db.add(participant)

    db.commit()
    db.refresh(thread)

    return _get_thread_response(thread, current_user.id, db)


@router.post("/direct", response_model=ThreadResponse)
async def find_or_create_direct_thread(
    request: CreateDirectMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find or create a direct message thread with another user."""
    if request.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a direct message thread with yourself"
        )

    try:
        target_user = db.query(User).filter(User.usr_id == request.user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        existing_thread = _find_direct_thread(db, current_user.id, request.user_id)
        if existing_thread:
            return _get_thread_response(existing_thread, current_user.id, db)

        # Create new direct thread
        thread = ChatThread(
            cht_title=None,
            cht_thread_type="direct",
            usr_creator_id=current_user.id,
            cht_d_creation=datetime.utcnow(),
            cht_is_archived=False
        )
        db.add(thread)
        db.flush()

        for user_id in [current_user.id, request.user_id]:
            participant = ChatParticipant(
                prt_thr_id=thread.cht_id,
                prt_usr_id=user_id,
                prt_is_admin=(user_id == current_user.id),
                prt_is_active=True,
                prt_joined_at=datetime.utcnow()
            )
            db.add(participant)

        db.commit()
        db.refresh(thread)

        return _get_thread_response(thread, current_user.id, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import logging
        logging.error(f"Error creating direct thread: {e}")
        
        error_msg = str(e).lower()
        if "invalid object name" in error_msg or "does not exist" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Chat feature is not yet available. Database migration required."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation. Please try again later."
        )


@router.post("/{thread_id}/participants", response_model=ThreadResponse)
async def add_participants(
    thread_id: int,
    request: AddParticipantsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add participants to a group thread. Only admins can add participants."""
    participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == current_user.id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this thread"
        )

    if not participant.prt_is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add participants"
        )

    thread = db.query(ChatThread).filter(ChatThread.cht_id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )

    if thread.cht_thread_type == "direct":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add participants to direct message threads"
        )

    valid_users = db.query(User.usr_id).filter(
        User.usr_id.in_(request.user_ids)
    ).all()
    valid_user_ids = {u[0] for u in valid_users}

    existing_ids = {p[0] for p in db.query(ChatParticipant.prt_usr_id).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_is_active == True
        )
    ).all()}

    for user_id in request.user_ids:
        if user_id in valid_user_ids and user_id not in existing_ids:
            new_participant = ChatParticipant(
                prt_thr_id=thread_id,
                prt_usr_id=user_id,
                prt_is_admin=False,
                prt_is_active=True,
                prt_joined_at=datetime.utcnow()
            )
            db.add(new_participant)

    db.commit()
    db.refresh(thread)

    return _get_thread_response(thread, current_user.id, db)


@router.delete("/{thread_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(
    thread_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a participant from a group thread."""
    current_participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == current_user.id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not current_participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this thread"
        )

    thread = db.query(ChatThread).filter(ChatThread.cht_id == thread_id).first()
    if thread and thread.cht_thread_type == "direct":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove participants from direct message threads"
        )

    is_self = user_id == current_user.id
    is_admin = current_participant.prt_is_admin

    if not is_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove other participants"
        )

    target_participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == user_id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not target_participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )

    target_participant.prt_is_active = False
    db.commit()

    return None


# =============================================================================
# Message Models
# =============================================================================

class SendMessageRequest(BaseModel):
    """Request to send a message to a thread."""
    content: str = Field(..., min_length=1, max_length=10000)
    attachments: Optional[List[int]] = None


class MessageResponse(BaseModel):
    """Message response."""
    id: int
    threadId: int
    senderId: int
    senderName: str
    content: str
    createdAt: str
    attachments: Optional[List[dict]] = None

    class Config:
        from_attributes = True


# =============================================================================
# Message Endpoints
# =============================================================================

@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def get_thread_messages(
    thread_id: int,
    limit: int = Query(50, ge=1, le=200),
    before_id: Optional[int] = Query(None, description="Get messages before this ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get messages in a thread."""
    # Verify user is a participant
    participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == current_user.id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this thread"
        )

    query = db.query(ChatMessage).filter(
        and_(
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_deleted_at.is_(None)
        )
    )

    if before_id:
        query = query.filter(ChatMessage.msg_id < before_id)

    messages = query.order_by(ChatMessage.msg_d_creation.desc()).limit(limit).all()
    messages.reverse()  # Return in chronological order

    result = []
    for msg in messages:
        sender_name = ""
        if msg.sender:
            sender_name = f"{msg.sender.usr_firstname or ''} {msg.sender.usr_lastname or ''}".strip()
            if not sender_name:
                sender_name = msg.sender.usr_login or "Unknown"

        result.append(MessageResponse(
            id=msg.msg_id,
            threadId=msg.msg_thr_id,
            senderId=msg.msg_usr_id,
            senderName=sender_name,
            content=msg.msg_content or "",
            createdAt=msg.msg_d_creation.isoformat() if msg.msg_d_creation else "",
            attachments=[]
        ))

    return result


@router.post("/{thread_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    thread_id: int,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a thread."""
    # Verify user is a participant
    participant = db.query(ChatParticipant).filter(
        and_(
            ChatParticipant.prt_thr_id == thread_id,
            ChatParticipant.prt_usr_id == current_user.id,
            ChatParticipant.prt_is_active == True
        )
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this thread"
        )

    thread = db.query(ChatThread).filter(ChatThread.cht_id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )

    # Create message
    message = ChatMessage(
        msg_thr_id=thread_id,
        msg_usr_id=current_user.id,
        msg_content=request.content,
        msg_d_creation=datetime.utcnow()
    )
    db.add(message)
    db.flush()

    # Update thread's last message info
    preview = request.content[:100] + "..." if len(request.content) > 100 else request.content
    thread.cht_last_message_at = datetime.utcnow()
    thread.cht_last_msg_preview = preview

    db.commit()
    db.refresh(message)

    sender_name = f"{current_user.usr_firstname or ''} {current_user.usr_lastname or ''}".strip()
    if not sender_name:
        sender_name = current_user.usr_login or "Unknown"

    return MessageResponse(
        id=message.msg_id,
        threadId=message.msg_thr_id,
        senderId=message.msg_usr_id,
        senderName=sender_name,
        content=message.msg_content or "",
        createdAt=message.msg_d_creation.isoformat() if message.msg_d_creation else "",
        attachments=[]
    )

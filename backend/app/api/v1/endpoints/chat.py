"""
Chat API endpoints for real-time messaging functionality.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import (
    ChatMessage,
    ChatRoom,
    ChatRoomMember,
    ChatThread,
    ChatParticipant,
    ChatMessageReadReceipt
)
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageUpdate,
    ChatRoomCreate,
    ChatRoomResponse,
    ChatRoomWithMessages,
    PaginatedChatMessages,
)

router = APIRouter(prefix="/chat", tags=["chat"])


# ============================================================================
# Chat Messages Endpoints
# ============================================================================

@router.get("/messages", response_model=PaginatedChatMessages)
async def list_messages(
    room_id: Optional[int] = Query(None, description="Filter by chat room"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List chat messages with pagination.
    Users can only see messages from rooms they are members of.
    """
    # Base query - only non-deleted messages
    query = db.query(ChatMessage).filter(ChatMessage.is_deleted == False)
    
    # Filter by room if specified
    if room_id:
        # Verify user is a member of the room
        membership = db.query(ChatRoomMember).filter(
            and_(
                ChatRoomMember.room_id == room_id,
                ChatRoomMember.user_id == current_user.id,
                ChatRoomMember.is_active == True
            )
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat room"
            )
        
        query = query.filter(ChatMessage.room_id == room_id)
    else:
        # Get all rooms user is a member of
        user_room_ids = db.query(ChatRoomMember.room_id).filter(
            and_(
                ChatRoomMember.user_id == current_user.id,
                ChatRoomMember.is_active == True
            )
        ).subquery()
        
        query = query.filter(ChatMessage.room_id.in_(user_room_ids))
    
    # Get total count
    total_count = query.count()
    
    # Apply pagination (newest first)
    messages = query.order_by(ChatMessage.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return PaginatedChatMessages(
        items=messages,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=(total_count + page_size - 1) // page_size
    )


@router.get("/messages/{message_id}", response_model=ChatMessageResponse)
async def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific chat message by ID.
    """
    message = db.query(ChatMessage).filter(
        and_(
            ChatMessage.id == message_id,
            ChatMessage.is_deleted == False
        )
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify user is a member of the room
    membership = db.query(ChatRoomMember).filter(
        and_(
            ChatRoomMember.room_id == message.room_id,
            ChatRoomMember.user_id == current_user.id,
            ChatRoomMember.is_active == True
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this message"
        )
    
    return message


@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new chat message.
    """
    # Verify user is a member of the room
    membership = db.query(ChatRoomMember).filter(
        and_(
            ChatRoomMember.room_id == message_data.room_id,
            ChatRoomMember.user_id == current_user.id,
            ChatRoomMember.is_active == True
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
    
    # Create the message
    message = ChatMessage(
        room_id=message_data.room_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=message_data.message_type or "text",
        created_at=datetime.utcnow(),
        is_deleted=False
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@router.put("/messages/{message_id}", response_model=ChatMessageResponse)
async def update_message(
    message_id: int,
    message_data: ChatMessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a chat message. Only the sender can update their own messages.
    """
    message = db.query(ChatMessage).filter(
        and_(
            ChatMessage.id == message_id,
            ChatMessage.is_deleted == False
        )
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Only the sender can update their message
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own messages"
        )
    
    # Update the message
    if message_data.content is not None:
        message.content = message_data.content
    
    message.updated_at = datetime.utcnow()
    message.is_edited = True
    
    db.commit()
    db.refresh(message)
    
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a chat message (soft delete).
    
    Only the message sender can delete their own messages.
    Room admins/owners may also delete messages in their rooms.
    
    Args:
        message_id: The ID of the message to delete
        db: Database session
        current_user: The authenticated user making the request
    
    Returns:
        204 No Content on success
    
    Raises:
        404: Message not found
        403: User not authorized to delete this message
    """
    # Find the message
    message = db.query(ChatMessage).filter(
        and_(
            ChatMessage.id == message_id,
            ChatMessage.is_deleted == False
        )
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check authorization: sender can always delete their own messages
    is_sender = message.sender_id == current_user.id
    
    # Check if user is a room admin/owner
    is_room_admin = False
    if not is_sender:
        membership = db.query(ChatRoomMember).filter(
            and_(
                ChatRoomMember.room_id == message.room_id,
                ChatRoomMember.user_id == current_user.id,
                ChatRoomMember.is_active == True
            )
        ).first()
        
        if membership and membership.role in ("admin", "owner"):
            is_room_admin = True
    
    # Authorize the deletion
    if not is_sender and not is_room_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this message"
        )
    
    # Soft delete the message
    message.is_deleted = True
    message.deleted_at = datetime.utcnow()
    message.deleted_by_id = current_user.id
    
    db.commit()
    
    return None


# ============================================================================
# Chat Rooms Endpoints
# ============================================================================

@router.get("/rooms", response_model=List[ChatRoomResponse])
async def list_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all chat rooms the current user is a member of.
    """
    # Get rooms where user is an active member
    rooms = db.query(ChatRoom).join(
        ChatRoomMember,
        and_(
            ChatRoom.id == ChatRoomMember.room_id,
            ChatRoomMember.user_id == current_user.id,
            ChatRoomMember.is_active == True
        )
    ).filter(ChatRoom.is_active == True).all()
    
    return rooms


@router.get("/rooms/{room_id}", response_model=ChatRoomWithMessages)
async def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific chat room with recent messages.
    """
    # Verify membership
    membership = db.query(ChatRoomMember).filter(
        and_(
            ChatRoomMember.room_id == room_id,
            ChatRoomMember.user_id == current_user.id,
            ChatRoomMember.is_active == True
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this chat room"
        )
    
    room = db.query(ChatRoom).filter(
        and_(
            ChatRoom.id == room_id,
            ChatRoom.is_active == True
        )
    ).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )
    
    return room


@router.post("/rooms", response_model=ChatRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: ChatRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new chat room.
    """
    room = ChatRoom(
        name=room_data.name,
        description=room_data.description,
        room_type=room_data.room_type or "group",
        created_by_id=current_user.id,
        created_at=datetime.utcnow(),
        is_active=True
    )
    
    db.add(room)
    db.flush()  # Get the room ID
    
    # Add creator as owner
    owner_membership = ChatRoomMember(
        room_id=room.id,
        user_id=current_user.id,
        role="owner",
        joined_at=datetime.utcnow(),
        is_active=True
    )
    db.add(owner_membership)
    
    # Add other members if specified
    if room_data.member_ids:
        for member_id in room_data.member_ids:
            if member_id != current_user.id:
                member = ChatRoomMember(
                    room_id=room.id,
                    user_id=member_id,
                    role="member",
                    joined_at=datetime.utcnow(),
                    is_active=True
                )
                db.add(member)
    
    db.commit()
    db.refresh(room)

    return room


# ============================================================================
# Read Receipts Endpoints (for Thread-based chat)
# ============================================================================

@router.post("/threads/{thread_id}/messages/{message_id}/read", status_code=status.HTTP_200_OK)
async def mark_message_read(
    thread_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a specific message as read.
    Also marks all messages before this one as read.
    """
    # Verify user is a participant in the thread
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

    # Get the message and verify it exists
    message = db.query(ChatMessage).filter(
        and_(
            ChatMessage.msg_id == message_id,
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_deleted_at.is_(None)
        )
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Don't mark own messages as read
    if message.msg_usr_id == current_user.id:
        return {"message": "Cannot mark own messages as read", "marked_count": 0}

    # Get all unread messages up to and including this one
    messages_to_mark = db.query(ChatMessage).filter(
        and_(
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_id <= message_id,
            ChatMessage.msg_usr_id != current_user.id,
            ChatMessage.msg_deleted_at.is_(None)
        )
    ).all()

    # Get existing read receipts
    existing_receipts = db.query(ChatMessageReadReceipt.rcpt_msg_id).filter(
        and_(
            ChatMessageReadReceipt.rcpt_usr_id == current_user.id,
            ChatMessageReadReceipt.rcpt_msg_id.in_([m.msg_id for m in messages_to_mark])
        )
    ).all()
    existing_msg_ids = {r[0] for r in existing_receipts}

    # Create new read receipts
    read_at = datetime.utcnow()
    marked_count = 0
    for msg in messages_to_mark:
        if msg.msg_id not in existing_msg_ids:
            receipt = ChatMessageReadReceipt(
                rcpt_msg_id=msg.msg_id,
                rcpt_usr_id=current_user.id,
                rcpt_read_at=read_at
            )
            db.add(receipt)
            marked_count += 1

    # Update participant's last read info
    participant.prt_last_read_at = read_at
    participant.prt_last_read_msg_id = message_id

    db.commit()

    return {
        "message": f"Marked {marked_count} messages as read",
        "marked_count": marked_count,
        "read_at": read_at.isoformat()
    }


@router.get("/threads/{thread_id}/unread-count")
async def get_unread_count(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the count of unread messages in a thread for the current user.
    """
    # Verify user is a participant in the thread
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

    # Count messages not sent by user and not read
    # Using a subquery to find read message IDs
    read_message_ids = db.query(ChatMessageReadReceipt.rcpt_msg_id).filter(
        ChatMessageReadReceipt.rcpt_usr_id == current_user.id
    ).subquery()

    unread_count = db.query(func.count(ChatMessage.msg_id)).filter(
        and_(
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_usr_id != current_user.id,
            ChatMessage.msg_deleted_at.is_(None),
            ~ChatMessage.msg_id.in_(read_message_ids)
        )
    ).scalar()

    return {
        "thread_id": thread_id,
        "unread_count": unread_count or 0
    }


@router.get("/threads/{thread_id}/messages/{message_id}/read-receipts")
async def get_message_read_receipts(
    thread_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get read receipts for a specific message.
    Returns list of users who have read the message.
    """
    # Verify user is a participant in the thread
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

    # Verify message exists and belongs to thread
    message = db.query(ChatMessage).filter(
        and_(
            ChatMessage.msg_id == message_id,
            ChatMessage.msg_thr_id == thread_id,
            ChatMessage.msg_deleted_at.is_(None)
        )
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Get read receipts with user info
    receipts = db.query(ChatMessageReadReceipt).filter(
        ChatMessageReadReceipt.rcpt_msg_id == message_id
    ).all()

    # Get user info for each receipt
    read_by = []
    for receipt in receipts:
        user = db.query(User).filter(User.id == receipt.rcpt_usr_id).first()
        if user:
            read_by.append({
                "user_id": user.id,
                "username": user.usr_login if hasattr(user, 'usr_login') else str(user.id),
                "read_at": receipt.rcpt_read_at.isoformat()
            })

    return {
        "message_id": message_id,
        "read_by": read_by,
        "read_count": len(read_by)
    }

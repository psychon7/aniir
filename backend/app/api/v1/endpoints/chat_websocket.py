"""
WebSocket endpoint for real-time chat functionality.
Handles connection lifecycle and message routing.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging

from app.core.websocket_manager import manager
from app.core.database import get_db
from app.core.security import decode_access_token
from app.services.chat_service import ChatService
from app.schemas.chat import MessageCreate

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
) -> Optional[int]:
    """
    Authenticate WebSocket connection using JWT token.
    
    Args:
        websocket: The WebSocket connection
        token: JWT token from query parameter
        
    Returns:
        User ID if authenticated, None otherwise
    """
    if not token:
        return None
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id:
            return int(user_id)
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
    
    return None


@router.websocket("/ws/chat")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Main WebSocket endpoint for chat functionality.
    
    Handles:
    - Connection/disconnection
    - Thread join/leave
    - Message sending
    - Typing indicators
    - Read receipts
    """
    # Authenticate user
    user_id = await get_current_user_ws(websocket, token)
    
    if not user_id:
        await websocket.close(code=4001, reason="Authentication required")
        return
    
    # Accept connection
    await manager.connect(websocket, user_id)
    
    chat_service = ChatService(db)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            event_type = data.get("type")
            
            if event_type == "join_thread":
                await handle_join_thread(
                    user_id=user_id,
                    thread_id=data.get("thread_id"),
                    chat_service=chat_service
                )
            
            elif event_type == "leave_thread":
                await handle_leave_thread(
                    user_id=user_id,
                    thread_id=data.get("thread_id")
                )
            
            elif event_type == "send_message":
                await handle_send_message(
                    user_id=user_id,
                    thread_id=data.get("thread_id"),
                    content=data.get("content"),
                    chat_service=chat_service
                )
            
            elif event_type == "typing_start":
                await handle_typing_indicator(
                    user_id=user_id,
                    thread_id=data.get("thread_id"),
                    is_typing=True
                )
            
            elif event_type == "typing_stop":
                await handle_typing_indicator(
                    user_id=user_id,
                    thread_id=data.get("thread_id"),
                    is_typing=False
                )
            
            elif event_type == "mark_read":
                await handle_mark_read(
                    user_id=user_id,
                    thread_id=data.get("thread_id"),
                    message_id=data.get("message_id"),
                    chat_service=chat_service
                )
            
            elif event_type == "ping":
                # Keep-alive ping
                await manager.send_personal_message(
                    user_id=user_id,
                    message={"type": "pong"}
                )
            
            else:
                logger.warning(f"Unknown event type: {event_type}")
    
    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        await manager.disconnect(user_id)


async def handle_join_thread(
    user_id: int,
    thread_id: int,
    chat_service: ChatService
) -> None:
    """
    Handle the on_join_thread event.
    
    This is the core implementation of the join thread functionality.
    
    Args:
        user_id: The user joining the thread
        thread_id: The thread to join
        chat_service: Chat service for database operations
    """
    if not thread_id:
        await manager.send_personal_message(
            user_id=user_id,
            message={
                "type": "error",
                "error": "thread_id is required"
            }
        )
        return
    
    try:
        # Verify user has access to this thread
        thread = chat_service.get_thread(thread_id)
        
        if not thread:
            await manager.send_personal_message(
                user_id=user_id,
                message={
                    "type": "error",
                    "error": "Thread not found"
                }
            )
            return
        
        # Check if user is a participant
        is_participant = chat_service.is_thread_participant(thread_id, user_id)
        
        if not is_participant:
            await manager.send_personal_message(
                user_id=user_id,
                message={
                    "type": "error",
                    "error": "Access denied to this thread"
                }
            )
            return
        
        # Get user info for notification
        user = chat_service.get_user_info(user_id)
        user_name = user.get("name") if user else None
        
        # Join the thread via connection manager
        result = await manager.join_thread(
            user_id=user_id,
            thread_id=thread_id,
            user_name=user_name
        )
        
        # Update last seen timestamp in database
        chat_service.update_participant_last_seen(thread_id, user_id)
        
        # Get recent messages for the thread
        recent_messages = chat_service.get_thread_messages(
            thread_id=thread_id,
            limit=50
        )
        
        # Send thread history to the joining user
        await manager.send_personal_message(
            user_id=user_id,
            message={
                "type": "thread_history",
                "thread_id": thread_id,
                "messages": [msg.dict() for msg in recent_messages],
                "thread_info": {
                    "id": thread.id,
                    "name": thread.name,
                    "type": thread.type,
                    "created_at": thread.created_at.isoformat() if thread.created_at else None
                }
            }
        )
        
        logger.info(f"User {user_id} successfully joined thread {thread_id}")
        
    except Exception as e:
        logger.error(f"Error in handle_join_thread: {e}")
        await manager.send_personal_message(
            user_id=user_id,
            message={
                "type": "error",
                "error": "Failed to join thread"
            }
        )


async def handle_leave_thread(
    user_id: int,
    thread_id: int
) -> None:
    """
    Handle user leaving a thread.
    
    Args:
        user_id: The user leaving
        thread_id: The thread to leave
    """
    if not thread_id:
        return
    
    result = await manager.leave_thread(user_id, thread_id)
    
    if result.get("success"):
        await manager.send_personal_message(
            user_id=user_id,
            message={
                "type": "thread_left",
                "thread_id": thread_id
            }
        )


async def handle_send_message(
    user_id: int,
    thread_id: int,
    content: str,
    chat_service: ChatService
) -> None:
    """
    Handle sending a new message.
    
    Args:
        user_id: The sender's ID
        thread_id: The target thread
        content: Message content
        chat_service: Chat service for database operations
    """
    if not thread_id or not content:
        return
    
    try:
        # Create message in database
        message = chat_service.create_message(
            thread_id=thread_id,
            sender_id=user_id,
            content=content
        )
        
        if message:
            # Broadcast to all thread members
            await manager.broadcast_to_thread(
                thread_id=thread_id,
                message={
                    "type": "new_message",
                    "thread_id": thread_id,
                    "message": message.dict()
                }
            )
            
            # Clear typing indicator
            if thread_id in manager.typing_users:
                manager.typing_users[thread_id].discard(user_id)
    
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await manager.send_personal_message(
            user_id=user_id,
            message={
                "type": "error",
                "error": "Failed to send message"
            }
        )


async def handle_typing_indicator(
    user_id: int,
    thread_id: int,
    is_typing: bool
) -> None:
    """
    Handle typing indicator updates.
    
    Args:
        user_id: The typing user
        thread_id: The thread
        is_typing: Whether user started or stopped typing
    """
    if not thread_id:
        return
    
    if thread_id not in manager.typing_users:
        manager.typing_users[thread_id] = set()
    
    if is_typing:
        manager.typing_users[thread_id].add(user_id)
    else:
        manager.typing_users[thread_id].discard(user_id)
    
    # Broadcast typing status to thread members
    await manager.broadcast_to_thread(
        thread_id=thread_id,
        message={
            "type": "typing_update",
            "thread_id": thread_id,
            "user_id": user_id,
            "is_typing": is_typing
        },
        exclude_user=user_id
    )


async def handle_mark_read(
    user_id: int,
    thread_id: int,
    message_id: int,
    chat_service: ChatService
) -> None:
    """
    Handle marking messages as read.
    
    Args:
        user_id: The user marking as read
        thread_id: The thread
        message_id: The last read message ID
        chat_service: Chat service for database operations
    """
    if not thread_id or not message_id:
        return
    
    try:
        chat_service.mark_messages_read(
            thread_id=thread_id,
            user_id=user_id,
            up_to_message_id=message_id
        )
        
        # Broadcast read receipt to thread members
        await manager.broadcast_to_thread(
            thread_id=thread_id,
            message={
                "type": "read_receipt",
                "thread_id": thread_id,
                "user_id": user_id,
                "message_id": message_id
            },
            exclude_user=user_id
        )
    
    except Exception as e:
        logger.error(f"Error marking messages read: {e}")

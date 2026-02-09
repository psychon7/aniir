"""
Socket.IO server for real-time chat functionality.

This module implements:
- Real-time messaging via Socket.IO
- Thread-based conversations (per entity or general channels)
- Message persistence to database
- File attachment references
- Basic moderation (delete own messages, admin delete any)
"""

import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

import socketio
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session_maker
from app.models.chat import ChatThread, ChatMessage, ChatMessageReadReceipt, ChatParticipant
from app.models.user import User
from app.services.token_blacklist_service import get_token_blacklist_service

# Configure logging
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()
token_blacklist = get_token_blacklist_service()

# Create Socket.IO server with async mode for ASGI
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=False,  # Reduce noise in logs
    ping_timeout=60,
    ping_interval=25,
)

# Note: ASGIApp is created in main.py where we wrap FastAPI with Socket.IO

# Store connected users: {sid: user_data}
connected_users: Dict[str, Dict[str, Any]] = {}

# Store user sessions: {user_id: [sid1, sid2, ...]} (user can have multiple connections)
user_sessions: Dict[int, List[str]] = {}


async def get_db_session() -> AsyncSession:
    """Get async database session."""
    return async_session_maker()


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and return payload if valid.

    Args:
        token: JWT token string

    Returns:
        Token payload dict if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None


async def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Get user from JWT token.

    Args:
        token: JWT token string

    Returns:
        User data dict if found, None otherwise
    """
    payload = verify_jwt_token(token)
    if not payload:
        return None

    if await token_blacklist.is_blacklisted(token):
        logger.warning("Rejected blacklisted token for websocket connection (user %s)", payload.get("sub"))
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    async with async_session_maker() as session:
        try:
            result = await session.execute(
                select(User).where(User.usr_id == int(user_id))
            )
            user = result.scalar_one_or_none()
            if user:
                return {
                    "user_id": user.usr_id,
                    "username": user.usr_login,
                    "first_name": user.usr_first_name,
                    "last_name": user.usr_last_name,
                    "role_id": user.rol_id,
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return None


@sio.event
async def connect(sid: str, environ: dict, auth: Optional[dict] = None):
    """
    Handle client connection.

    Authenticates user via JWT token in auth data.

    Args:
        sid: Session ID
        environ: WSGI environment dict
        auth: Authentication data containing JWT token
    """
    logger.info(f"Client attempting to connect: {sid}")

    # Get token from auth data
    token = None
    if auth:
        token = auth.get("token")

    # Also check query string for token (fallback)
    if not token:
        query_string = environ.get("QUERY_STRING", "")
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=", 1)[1]
                break

    if not token:
        logger.warning(f"Connection rejected - no token: {sid}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    # Verify token and get user
    user_data = await get_user_from_token(token)
    if not user_data:
        logger.warning(f"Connection rejected - invalid token: {sid}")
        raise socketio.exceptions.ConnectionRefusedError("Invalid token")

    # Add connection timestamp
    user_data["connected_at"] = datetime.utcnow().isoformat()
    connected_users[sid] = user_data

    # Track user sessions
    user_id = user_data["user_id"]
    if user_id not in user_sessions:
        user_sessions[user_id] = []
    user_sessions[user_id].append(sid)

    logger.info(f"Client connected: {sid} (User: {user_data.get('username')})")

    # Notify user of successful connection
    await sio.emit("connection_established", {
        "message": "Connected successfully",
        "user": {
            "id": user_data["user_id"],
            "username": user_data["username"],
            "display_name": f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip() or user_data["username"]
        }
    }, room=sid)


@sio.event
async def disconnect(sid: str):
    """
    Handle client disconnection.

    Args:
        sid: Session ID
    """
    user_data = connected_users.pop(sid, None)

    if user_data:
        user_id = user_data.get("user_id")
        if user_id and user_id in user_sessions:
            if sid in user_sessions[user_id]:
                user_sessions[user_id].remove(sid)
            if not user_sessions[user_id]:
                del user_sessions[user_id]

        logger.info(f"Client disconnected: {sid} (User: {user_data.get('username')})")
    else:
        logger.info(f"Client disconnected: {sid}")


@sio.event
async def join_thread(sid: str, data: dict):
    """
    Join a chat thread room.

    Args:
        sid: Session ID
        data: Dict containing thread_id
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    async with async_session_maker() as session:
        try:
            # Verify thread exists
            result = await session.execute(
                select(ChatThread).where(ChatThread.thr_id == thread_id)
            )
            thread = result.scalar_one_or_none()

            if not thread:
                await sio.emit("error", {"message": "Thread not found"}, room=sid)
                return

            # Join the room
            room_name = f"thread_{thread_id}"
            await sio.enter_room(sid, room_name)

            user_data = connected_users[sid]
            logger.info(f"User {user_data.get('username')} joined thread {thread_id}")

            # Notify room
            await sio.emit("user_joined", {
                "thread_id": thread_id,
                "user": {
                    "id": user_data["user_id"],
                    "username": user_data["username"],
                    "display_name": f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip() or user_data["username"]
                }
            }, room=room_name, skip_sid=sid)

            # Confirm join to user
            await sio.emit("joined_thread", {
                "thread_id": thread_id,
                "thread_name": thread.thr_name,
                "entity_type": thread.thr_entity_type,
                "entity_id": thread.thr_entity_id
            }, room=sid)

        except Exception as e:
            logger.error(f"Error joining thread: {e}")
            await sio.emit("error", {"message": "Failed to join thread"}, room=sid)


@sio.event
async def leave_thread(sid: str, data: dict):
    """
    Leave a chat thread room.

    Args:
        sid: Session ID
        data: Dict containing thread_id
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    room_name = f"thread_{thread_id}"
    await sio.leave_room(sid, room_name)

    user_data = connected_users[sid]
    logger.info(f"User {user_data.get('username')} left thread {thread_id}")

    # Notify room
    await sio.emit("user_left", {
        "thread_id": thread_id,
        "user": {
            "id": user_data["user_id"],
            "username": user_data["username"]
        }
    }, room=room_name)

    # Confirm leave to user
    await sio.emit("left_thread", {"thread_id": thread_id}, room=sid)


@sio.event
async def send_message(sid: str, data: dict):
    """
    Send a message to a chat thread.

    Args:
        sid: Session ID
        data: Dict containing thread_id, content, and optional attachments
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    content = data.get("content", "").strip()
    attachments = data.get("attachments")  # List of file IDs

    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    if not content and not attachments:
        await sio.emit("error", {"message": "Message content or attachments required"}, room=sid)
        return

    user_data = connected_users[sid]

    async with async_session_maker() as session:
        try:
            # Verify thread exists
            result = await session.execute(
                select(ChatThread).where(ChatThread.thr_id == thread_id)
            )
            thread = result.scalar_one_or_none()

            if not thread:
                await sio.emit("error", {"message": "Thread not found"}, room=sid)
                return

            # Create message
            message = ChatMessage(
                msg_thr_id=thread_id,
                msg_usr_id=user_data["user_id"],
                msg_content=content,
                msg_attachments=json.dumps(attachments) if attachments else None
            )
            session.add(message)
            await session.commit()
            await session.refresh(message)

            logger.info(f"Message sent to thread {thread_id} by user {user_data.get('username')}")

            # Broadcast to room
            room_name = f"thread_{thread_id}"
            message_data = {
                "message_id": message.msg_id,
                "thread_id": thread_id,
                "content": content,
                "attachments": attachments,
                "created_at": message.msg_created_at.isoformat() if message.msg_created_at else datetime.utcnow().isoformat(),
                "is_read": False,  # New messages start as unread
                "read_by": [],  # No one has read it yet
                "user": {
                    "id": user_data["user_id"],
                    "username": user_data["username"],
                    "display_name": f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip() or user_data["username"]
                }
            }

            await sio.emit("new_message", message_data, room=room_name)

        except Exception as e:
            logger.error(f"Error sending message: {e}")
            await session.rollback()
            await sio.emit("error", {"message": "Failed to send message"}, room=sid)


@sio.event
async def delete_message(sid: str, data: dict):
    """
    Delete (soft delete) a message.

    Users can delete their own messages.
    Admins (role_id = 1) can delete any message.

    Args:
        sid: Session ID
        data: Dict containing message_id
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    message_id = data.get("message_id")
    if not message_id:
        await sio.emit("error", {"message": "message_id is required"}, room=sid)
        return

    user_data = connected_users[sid]

    async with async_session_maker() as session:
        try:
            # Get message
            result = await session.execute(
                select(ChatMessage).where(
                    ChatMessage.msg_id == message_id,
                    ChatMessage.msg_deleted_at.is_(None)
                )
            )
            message = result.scalar_one_or_none()

            if not message:
                await sio.emit("error", {"message": "Message not found"}, room=sid)
                return

            # Check permissions
            is_owner = message.msg_usr_id == user_data["user_id"]
            is_admin = user_data.get("role_id") == 1  # Assuming role_id 1 is admin

            if not is_owner and not is_admin:
                await sio.emit("error", {"message": "Not authorized to delete this message"}, room=sid)
                return

            # Soft delete
            message.msg_deleted_at = datetime.utcnow()
            await session.commit()

            thread_id = message.msg_thr_id

            logger.info(f"Message {message_id} deleted by user {user_data.get('username')}")

            # Broadcast deletion to room
            room_name = f"thread_{thread_id}"
            await sio.emit("message_deleted", {
                "message_id": message_id,
                "thread_id": thread_id,
                "deleted_by": {
                    "id": user_data["user_id"],
                    "username": user_data["username"]
                }
            }, room=room_name)

        except Exception as e:
            logger.error(f"Error deleting message: {e}")
            await session.rollback()
            await sio.emit("error", {"message": "Failed to delete message"}, room=sid)


@sio.event
async def typing_start(sid: str, data: dict):
    """
    Broadcast typing indicator start.

    Args:
        sid: Session ID
        data: Dict containing thread_id
    """
    if sid not in connected_users:
        return

    thread_id = data.get("thread_id")
    if not thread_id:
        return

    user_data = connected_users[sid]
    room_name = f"thread_{thread_id}"

    await sio.emit("user_typing", {
        "thread_id": thread_id,
        "user": {
            "id": user_data["user_id"],
            "username": user_data["username"],
            "display_name": f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip() or user_data["username"]
        }
    }, room=room_name, skip_sid=sid)


@sio.event
async def typing_stop(sid: str, data: dict):
    """
    Broadcast typing indicator stop.

    Args:
        sid: Session ID
        data: Dict containing thread_id
    """
    if sid not in connected_users:
        return

    thread_id = data.get("thread_id")
    if not thread_id:
        return

    user_data = connected_users[sid]
    room_name = f"thread_{thread_id}"

    await sio.emit("user_stopped_typing", {
        "thread_id": thread_id,
        "user": {
            "id": user_data["user_id"],
            "username": user_data["username"]
        }
    }, room=room_name, skip_sid=sid)


@sio.event
async def get_thread_users(sid: str, data: dict):
    """
    Get list of users currently in a thread.

    Args:
        sid: Session ID
        data: Dict containing thread_id
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    room_name = f"thread_{thread_id}"

    # Get all users in the room
    try:
        room_sids = sio.manager.rooms.get("/", {}).get(room_name, set())
        users = []
        seen_users = set()

        for room_sid in room_sids:
            if room_sid in connected_users:
                user_info = connected_users[room_sid]
                user_id = user_info["user_id"]
                if user_id not in seen_users:
                    seen_users.add(user_id)
                    users.append({
                        "id": user_id,
                        "username": user_info["username"],
                        "display_name": f"{user_info.get('first_name') or ''} {user_info.get('last_name') or ''}".strip() or user_info["username"]
                    })

        await sio.emit("thread_users", {
            "thread_id": thread_id,
            "users": users
        }, room=sid)

    except Exception as e:
        logger.error(f"Error getting thread users: {e}")
        await sio.emit("error", {"message": "Failed to get thread users"}, room=sid)


@sio.event
async def ping(sid: str, data: dict = None):
    """
    Handle ping from client to keep connection alive.

    Args:
        sid: Session ID
        data: Optional ping data
    """
    await sio.emit("pong", {"timestamp": datetime.utcnow().isoformat()}, room=sid)


@sio.event
async def mark_read(sid: str, data: dict):
    """
    Mark messages as read in a thread.

    Args:
        sid: Session ID
        data: Dict containing thread_id and optional message_id (last read message)
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    message_id = data.get("message_id")  # Optional: specific message to mark as read

    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    user_data = connected_users[sid]
    user_id = user_data["user_id"]
    read_at = datetime.utcnow()

    async with async_session_maker() as session:
        try:
            # Get messages to mark as read
            if message_id:
                # Mark specific message and all messages before it as read
                query = select(ChatMessage).where(
                    ChatMessage.msg_thr_id == thread_id,
                    ChatMessage.msg_id <= message_id,
                    ChatMessage.msg_usr_id != user_id,  # Don't mark own messages
                    ChatMessage.msg_deleted_at.is_(None)
                )
            else:
                # Mark all unread messages in thread as read
                query = select(ChatMessage).where(
                    ChatMessage.msg_thr_id == thread_id,
                    ChatMessage.msg_usr_id != user_id,
                    ChatMessage.msg_deleted_at.is_(None)
                )

            result = await session.execute(query)
            messages = result.scalars().all()

            if not messages:
                # No messages to mark as read
                return

            # Get existing read receipts for this user and these messages
            existing_receipts_query = select(ChatMessageReadReceipt.rcpt_msg_id).where(
                ChatMessageReadReceipt.rcpt_usr_id == user_id,
                ChatMessageReadReceipt.rcpt_msg_id.in_([m.msg_id for m in messages])
            )
            existing_result = await session.execute(existing_receipts_query)
            existing_msg_ids = set(r for r in existing_result.scalars().all())

            # Create read receipts for messages not yet read
            new_receipts = []
            marked_message_ids = []
            for msg in messages:
                if msg.msg_id not in existing_msg_ids:
                    receipt = ChatMessageReadReceipt(
                        rcpt_msg_id=msg.msg_id,
                        rcpt_usr_id=user_id,
                        rcpt_read_at=read_at
                    )
                    session.add(receipt)
                    new_receipts.append(receipt)
                    marked_message_ids.append(msg.msg_id)

            # Update participant's last read timestamp
            participant_query = select(ChatParticipant).where(
                ChatParticipant.prt_thr_id == thread_id,
                ChatParticipant.prt_usr_id == user_id
            )
            participant_result = await session.execute(participant_query)
            participant = participant_result.scalar_one_or_none()

            if participant:
                participant.prt_last_read_at = read_at
                if message_id:
                    participant.prt_last_read_msg_id = message_id
                elif messages:
                    participant.prt_last_read_msg_id = max(m.msg_id for m in messages)

            await session.commit()

            if marked_message_ids:
                logger.info(f"User {user_data.get('username')} marked {len(marked_message_ids)} messages as read in thread {thread_id}")

                # Broadcast read receipt to thread (so message senders can see their messages were read)
                room_name = f"thread_{thread_id}"
                await sio.emit("messages_read", {
                    "thread_id": thread_id,
                    "message_ids": marked_message_ids,
                    "read_by": {
                        "id": user_id,
                        "username": user_data["username"],
                        "display_name": f"{user_data.get('first_name') or ''} {user_data.get('last_name') or ''}".strip() or user_data["username"]
                    },
                    "read_at": read_at.isoformat()
                }, room=room_name, skip_sid=sid)

                # Also send confirmation to the user who marked messages as read
                await sio.emit("read_confirmed", {
                    "thread_id": thread_id,
                    "message_ids": marked_message_ids,
                    "read_at": read_at.isoformat()
                }, room=sid)

        except Exception as e:
            logger.error(f"Error marking messages as read: {e}")
            await session.rollback()
            await sio.emit("error", {"message": "Failed to mark messages as read"}, room=sid)


@sio.event
async def get_read_receipts(sid: str, data: dict):
    """
    Get read receipts for messages in a thread.

    Args:
        sid: Session ID
        data: Dict containing thread_id and optional message_ids
    """
    if sid not in connected_users:
        await sio.emit("error", {"message": "Not authenticated"}, room=sid)
        return

    thread_id = data.get("thread_id")
    message_ids = data.get("message_ids")  # Optional: specific messages

    if not thread_id:
        await sio.emit("error", {"message": "thread_id is required"}, room=sid)
        return

    async with async_session_maker() as session:
        try:
            # Build query for read receipts
            if message_ids:
                query = select(ChatMessageReadReceipt).where(
                    ChatMessageReadReceipt.rcpt_msg_id.in_(message_ids)
                )
            else:
                # Get receipts for all messages in thread
                message_ids_query = select(ChatMessage.msg_id).where(
                    ChatMessage.msg_thr_id == thread_id,
                    ChatMessage.msg_deleted_at.is_(None)
                )
                message_ids_result = await session.execute(message_ids_query)
                thread_message_ids = [r for r in message_ids_result.scalars().all()]

                if not thread_message_ids:
                    await sio.emit("read_receipts", {
                        "thread_id": thread_id,
                        "receipts": {}
                    }, room=sid)
                    return

                query = select(ChatMessageReadReceipt).where(
                    ChatMessageReadReceipt.rcpt_msg_id.in_(thread_message_ids)
                )

            result = await session.execute(query)
            receipts = result.scalars().all()

            # Group receipts by message_id
            receipts_by_message = {}
            for receipt in receipts:
                msg_id = receipt.rcpt_msg_id
                if msg_id not in receipts_by_message:
                    receipts_by_message[msg_id] = []
                receipts_by_message[msg_id].append({
                    "user_id": receipt.rcpt_usr_id,
                    "read_at": receipt.rcpt_read_at.isoformat()
                })

            await sio.emit("read_receipts", {
                "thread_id": thread_id,
                "receipts": receipts_by_message
            }, room=sid)

        except Exception as e:
            logger.error(f"Error getting read receipts: {e}")
            await sio.emit("error", {"message": "Failed to get read receipts"}, room=sid)


# Helper function to send notifications to specific users
async def notify_user(user_id: int, event: str, data: dict):
    """
    Send a notification to all connected sessions of a specific user.

    Args:
        user_id: Target user ID
        event: Event name
        data: Event data
    """
    if user_id in user_sessions:
        for sid in user_sessions[user_id]:
            await sio.emit(event, data, room=sid)


# Helper function to broadcast to a thread
async def broadcast_to_thread(thread_id: int, event: str, data: dict, skip_user_id: Optional[int] = None):
    """
    Broadcast an event to all users in a thread.

    Args:
        thread_id: Target thread ID
        event: Event name
        data: Event data
        skip_user_id: Optional user ID to skip
    """
    room_name = f"thread_{thread_id}"

    if skip_user_id and skip_user_id in user_sessions:
        for sid in user_sessions[skip_user_id]:
            await sio.emit(event, data, room=room_name, skip_sid=sid)
    else:
        await sio.emit(event, data, room=room_name)


# Helper function to get online users count
def get_online_users_count() -> int:
    """Get total number of unique online users."""
    return len(user_sessions)


# Helper function to check if a user is online
def is_user_online(user_id: int) -> bool:
    """Check if a user is currently online."""
    return user_id in user_sessions and len(user_sessions[user_id]) > 0

"""
WebSocket Connection Manager for real-time chat functionality.
Handles connection lifecycle, room management, and message broadcasting.
"""

from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time chat.
    
    Features:
    - Connection tracking per user
    - Thread/room-based message broadcasting
    - User presence tracking
    - Typing indicators
    """
    
    def __init__(self):
        # Active connections: user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        
        # Thread subscriptions: thread_id -> Set[user_id]
        self.thread_members: Dict[int, Set[int]] = {}
        
        # User to threads mapping: user_id -> Set[thread_id]
        self.user_threads: Dict[int, Set[int]] = {}
        
        # Online users tracking
        self.online_users: Set[int] = set()
        
        # Typing indicators: thread_id -> Set[user_id]
        self.typing_users: Dict[int, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        """
        Accept a new WebSocket connection and register the user.
        
        Args:
            websocket: The WebSocket connection
            user_id: The authenticated user's ID
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.online_users.add(user_id)
        self.user_threads[user_id] = set()
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Broadcast user online status to all connected users
        await self.broadcast_user_status(user_id, is_online=True)
    
    async def disconnect(self, user_id: int) -> None:
        """
        Handle user disconnection and cleanup.
        
        Args:
            user_id: The disconnecting user's ID
        """
        # Remove from active connections
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Remove from online users
        self.online_users.discard(user_id)
        
        # Leave all threads
        if user_id in self.user_threads:
            for thread_id in list(self.user_threads[user_id]):
                await self.leave_thread(user_id, thread_id, notify=True)
            del self.user_threads[user_id]
        
        # Clear typing indicators
        for thread_id in self.typing_users:
            self.typing_users[thread_id].discard(user_id)
        
        logger.info(f"User {user_id} disconnected from WebSocket")
        
        # Broadcast user offline status
        await self.broadcast_user_status(user_id, is_online=False)
    
    async def join_thread(
        self, 
        user_id: int, 
        thread_id: int,
        user_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle user joining a chat thread.
        
        This is the main on_join_thread implementation.
        
        Args:
            user_id: The user joining the thread
            thread_id: The thread to join
            user_name: Optional user display name for notifications
            
        Returns:
            Dict containing join status and thread info
        """
        # Initialize thread member set if not exists
        if thread_id not in self.thread_members:
            self.thread_members[thread_id] = set()
        
        # Initialize typing set for thread
        if thread_id not in self.typing_users:
            self.typing_users[thread_id] = set()
        
        # Check if user is already in thread
        was_already_member = user_id in self.thread_members[thread_id]
        
        # Add user to thread
        self.thread_members[thread_id].add(user_id)
        
        # Track user's thread membership
        if user_id not in self.user_threads:
            self.user_threads[user_id] = set()
        self.user_threads[user_id].add(thread_id)
        
        logger.info(f"User {user_id} joined thread {thread_id}")
        
        # Get current thread members (online only)
        online_members = [
            uid for uid in self.thread_members[thread_id]
            if uid in self.online_users
        ]
        
        # Notify other thread members about the join (if not already member)
        if not was_already_member:
            await self.broadcast_to_thread(
                thread_id=thread_id,
                message={
                    "type": "user_joined",
                    "thread_id": thread_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "online_members": online_members
                },
                exclude_user=user_id  # Don't send to the joining user
            )
        
        # Send confirmation to the joining user
        await self.send_personal_message(
            user_id=user_id,
            message={
                "type": "thread_joined",
                "thread_id": thread_id,
                "online_members": online_members,
                "typing_users": list(self.typing_users.get(thread_id, set())),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return {
            "success": True,
            "thread_id": thread_id,
            "online_members": online_members,
            "was_already_member": was_already_member
        }
    
    async def leave_thread(
        self, 
        user_id: int, 
        thread_id: int,
        notify: bool = True
    ) -> Dict[str, Any]:
        """
        Handle user leaving a chat thread.
        
        Args:
            user_id: The user leaving the thread
            thread_id: The thread to leave
            notify: Whether to notify other members
            
        Returns:
            Dict containing leave status
        """
        if thread_id not in self.thread_members:
            return {"success": False, "error": "Thread not found"}
        
        if user_id not in self.thread_members[thread_id]:
            return {"success": False, "error": "User not in thread"}
        
        # Remove user from thread
        self.thread_members[thread_id].discard(user_id)
        
        # Remove from user's thread list
        if user_id in self.user_threads:
            self.user_threads[user_id].discard(thread_id)
        
        # Clear typing indicator
        if thread_id in self.typing_users:
            self.typing_users[thread_id].discard(user_id)
        
        logger.info(f"User {user_id} left thread {thread_id}")
        
        # Notify other members
        if notify:
            await self.broadcast_to_thread(
                thread_id=thread_id,
                message={
                    "type": "user_left",
                    "thread_id": thread_id,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        # Cleanup empty threads
        if not self.thread_members[thread_id]:
            del self.thread_members[thread_id]
            if thread_id in self.typing_users:
                del self.typing_users[thread_id]
        
        return {"success": True, "thread_id": thread_id}
    
    async def broadcast_to_thread(
        self,
        thread_id: int,
        message: Dict[str, Any],
        exclude_user: Optional[int] = None
    ) -> None:
        """
        Broadcast a message to all members of a thread.
        
        Args:
            thread_id: The thread to broadcast to
            message: The message payload
            exclude_user: Optional user ID to exclude from broadcast
        """
        if thread_id not in self.thread_members:
            return
        
        for user_id in self.thread_members[thread_id]:
            if exclude_user and user_id == exclude_user:
                continue
            
            await self.send_personal_message(user_id, message)
    
    async def send_personal_message(
        self,
        user_id: int,
        message: Dict[str, Any]
    ) -> bool:
        """
        Send a message to a specific user.
        
        Args:
            user_id: The target user ID
            message: The message payload
            
        Returns:
            True if sent successfully, False otherwise
        """
        if user_id not in self.active_connections:
            return False
        
        try:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
            # Connection might be stale, clean it up
            await self.disconnect(user_id)
            return False
    
    async def broadcast_user_status(
        self,
        user_id: int,
        is_online: bool
    ) -> None:
        """
        Broadcast user online/offline status to relevant users.
        
        Args:
            user_id: The user whose status changed
            is_online: Whether the user is now online
        """
        message = {
            "type": "user_status",
            "user_id": user_id,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to all users in shared threads
        notified_users: Set[int] = set()
        
        if user_id in self.user_threads:
            for thread_id in self.user_threads[user_id]:
                if thread_id in self.thread_members:
                    for member_id in self.thread_members[thread_id]:
                        if member_id != user_id and member_id not in notified_users:
                            await self.send_personal_message(member_id, message)
                            notified_users.add(member_id)
    
    def get_thread_online_members(self, thread_id: int) -> list[int]:
        """
        Get list of online members in a thread.
        
        Args:
            thread_id: The thread ID
            
        Returns:
            List of online user IDs
        """
        if thread_id not in self.thread_members:
            return []
        
        return [
            uid for uid in self.thread_members[thread_id]
            if uid in self.online_users
        ]
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is currently online."""
        return user_id in self.online_users
    
    def get_user_threads(self, user_id: int) -> Set[int]:
        """Get all threads a user has joined."""
        return self.user_threads.get(user_id, set())


# Global connection manager instance
manager = ConnectionManager()

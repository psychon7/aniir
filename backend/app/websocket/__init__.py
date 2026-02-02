"""
WebSocket module for real-time communication.
Contains Socket.IO server implementation for chat functionality.
"""

from app.websocket.chat import sio, socket_app

__all__ = ["sio", "socket_app"]

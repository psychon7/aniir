"""
Chat models - DISABLED.

WARNING: Tables TM_CHT_* and TM_CHAT_* do NOT exist in the database (DEV_ERP_ECOLED).
These models have been converted to disabled placeholders to prevent SQLAlchemy errors.

Disabled tables:
- TM_CHT_Thread
- TM_CHT_Participant
- TM_CHT_Message
- TM_CHT_ReadReceipt
- TM_CHAT_Room
- TM_CHAT_RoomMember
- TM_CHAT_Message

To re-enable: Create the database tables, then restore the SQLAlchemy model definitions.

Disabled on: 2026-02-01
Reason: Database alignment - tables do not exist in production database
"""


class ChatThread:
    """
    DISABLED: Table TM_CHT_Thread does not exist in the database.

    This was a chat thread model for organizing conversations around entities
    (Invoice, Order, Project, etc.).
    """
    __disabled__ = True
    __tablename__ = "TM_CHT_Thread"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatThread model is disabled - table TM_CHT_Thread does not exist in the database. "
            "Create the table first or use an alternative chat solution."
        )


class ChatParticipant:
    """
    DISABLED: Table TM_CHT_Participant does not exist in the database.

    This was a model for tracking users participating in chat threads.
    """
    __disabled__ = True
    __tablename__ = "TM_CHT_Participant"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatParticipant model is disabled - table TM_CHT_Participant does not exist in the database."
        )


class ChatMessage:
    """
    DISABLED: Table TM_CHT_Message does not exist in the database.

    This was a model for messages within chat threads.
    """
    __disabled__ = True
    __tablename__ = "TM_CHT_Message"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatMessage model is disabled - table TM_CHT_Message does not exist in the database."
        )


class ChatMessageReadReceipt:
    """
    DISABLED: Table TM_CHT_ReadReceipt does not exist in the database.

    This was a model for tracking read receipts on chat messages.
    """
    __disabled__ = True
    __tablename__ = "TM_CHT_ReadReceipt"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatMessageReadReceipt model is disabled - table TM_CHT_ReadReceipt does not exist in the database."
        )


class ChatRoom:
    """
    DISABLED: Table TM_CHAT_Room does not exist in the database.

    This was a legacy chat room model for group conversations.
    """
    __disabled__ = True
    __tablename__ = "TM_CHAT_Room"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatRoom model is disabled - table TM_CHAT_Room does not exist in the database."
        )


class ChatRoomMember:
    """
    DISABLED: Table TM_CHAT_RoomMember does not exist in the database.

    This was a model for tracking room membership.
    """
    __disabled__ = True
    __tablename__ = "TM_CHAT_RoomMember"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatRoomMember model is disabled - table TM_CHAT_RoomMember does not exist in the database."
        )


class ChatRoomMessage:
    """
    DISABLED: Table TM_CHAT_Message does not exist in the database.

    This was a legacy model for messages in chat rooms.
    """
    __disabled__ = True
    __tablename__ = "TM_CHAT_Message"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ChatRoomMessage model is disabled - table TM_CHAT_Message does not exist in the database."
        )

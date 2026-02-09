-- ============================================================================
-- MIGRATION V1.0.0.6: Create Chat Tables
-- ============================================================================
-- Description: Creates all chat-related tables for thread-based and room-based
--              messaging systems.
-- Tables:
--   TM_CHT_Thread        - Chat threads (conversations)
--   TM_CHT_Participant   - Thread participants (users in a thread)
--   TM_CHT_Message       - Messages within threads
--   TM_CHT_ReadReceipt   - Read receipts for messages
--   TM_CHAT_Room         - Chat rooms (group conversations)
--   TM_CHAT_RoomMember   - Room membership
--   TM_CHAT_Message      - Messages within rooms
-- ============================================================================

-- ============================================================================
-- Thread-based Chat System (TM_CHT_*)
-- ============================================================================

-- TM_CHT_Thread: Chat threads / conversations
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHT_Thread')
BEGIN
    CREATE TABLE [dbo].[TM_CHT_Thread] (
        [cht_id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [cht_title]             NVARCHAR(500) NULL,
        [cht_thread_type]       NVARCHAR(50) NOT NULL CONSTRAINT [DF_TM_CHT_Thread_Type] DEFAULT ('direct'),
        [cht_is_archived]       BIT NOT NULL CONSTRAINT [DF_TM_CHT_Thread_IsArchived] DEFAULT (0),
        [cht_last_message_at]   DATETIME NULL,
        [cht_last_msg_preview]  NVARCHAR(200) NULL,
        [cht_entity_type]       NVARCHAR(100) NULL,
        [cht_entity_id]         INT NULL,
        [usr_creator_id]        INT NULL,
        [soc_id]                INT NULL,
        [cht_d_creation]        DATETIME NOT NULL CONSTRAINT [DF_TM_CHT_Thread_Creation] DEFAULT (GETDATE()),
        [cht_d_update]          DATETIME NULL,

        CONSTRAINT [FK_TM_CHT_Thread_Creator]
            FOREIGN KEY ([usr_creator_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]),
        CONSTRAINT [FK_TM_CHT_Thread_Society]
            FOREIGN KEY ([soc_id]) REFERENCES [dbo].[TR_SOC_Society]([soc_id])
    );

    CREATE INDEX [IX_TM_CHT_Thread_Creator]
        ON [dbo].[TM_CHT_Thread] ([usr_creator_id]);

    CREATE INDEX [IX_TM_CHT_Thread_Entity]
        ON [dbo].[TM_CHT_Thread] ([cht_entity_type], [cht_entity_id]);

    CREATE INDEX [IX_TM_CHT_Thread_LastMessage]
        ON [dbo].[TM_CHT_Thread] ([cht_last_message_at] DESC);

    PRINT 'Created table TM_CHT_Thread';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_Thread already exists - skipping';
END
GO

-- TM_CHT_Participant: Users participating in a thread
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHT_Participant')
BEGIN
    CREATE TABLE [dbo].[TM_CHT_Participant] (
        [prt_id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [prt_thr_id]            INT NOT NULL,
        [prt_usr_id]            INT NOT NULL,
        [prt_is_admin]          BIT NOT NULL CONSTRAINT [DF_TM_CHT_Participant_IsAdmin] DEFAULT (0),
        [prt_is_active]         BIT NOT NULL CONSTRAINT [DF_TM_CHT_Participant_IsActive] DEFAULT (1),
        [prt_joined_at]         DATETIME NOT NULL CONSTRAINT [DF_TM_CHT_Participant_JoinedAt] DEFAULT (GETDATE()),
        [prt_last_read_at]      DATETIME NULL,
        [prt_last_read_msg_id]  INT NULL,

        CONSTRAINT [FK_TM_CHT_Participant_Thread]
            FOREIGN KEY ([prt_thr_id]) REFERENCES [dbo].[TM_CHT_Thread]([cht_id]),
        CONSTRAINT [FK_TM_CHT_Participant_User]
            FOREIGN KEY ([prt_usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHT_Participant_Thread]
        ON [dbo].[TM_CHT_Participant] ([prt_thr_id]);

    CREATE INDEX [IX_TM_CHT_Participant_User]
        ON [dbo].[TM_CHT_Participant] ([prt_usr_id]);

    CREATE UNIQUE INDEX [IX_TM_CHT_Participant_ThreadUser]
        ON [dbo].[TM_CHT_Participant] ([prt_thr_id], [prt_usr_id]);

    PRINT 'Created table TM_CHT_Participant';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_Participant already exists - skipping';
END
GO

-- TM_CHT_Message: Messages within threads
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHT_Message')
BEGIN
    CREATE TABLE [dbo].[TM_CHT_Message] (
        [msg_id]            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [msg_thr_id]        INT NOT NULL,
        [msg_usr_id]        INT NULL,
        [msg_sender_type]   NVARCHAR(20) NOT NULL CONSTRAINT [DF_TM_CHT_Message_SenderType] DEFAULT ('user'),
        [msg_content]       NVARCHAR(MAX) NOT NULL,
        [msg_type]          NVARCHAR(50) NOT NULL CONSTRAINT [DF_TM_CHT_Message_Type] DEFAULT ('text'),
        [msg_metadata]      NVARCHAR(MAX) NULL,
        [msg_is_edited]     BIT NOT NULL CONSTRAINT [DF_TM_CHT_Message_IsEdited] DEFAULT (0),
        [msg_is_deleted]    BIT NOT NULL CONSTRAINT [DF_TM_CHT_Message_IsDeleted] DEFAULT (0),
        [msg_d_creation]    DATETIME NOT NULL CONSTRAINT [DF_TM_CHT_Message_Creation] DEFAULT (GETDATE()),
        [msg_d_update]      DATETIME NULL,
        [msg_deleted_at]    DATETIME NULL,
        [msg_deleted_by_id] INT NULL,

        CONSTRAINT [FK_TM_CHT_Message_Thread]
            FOREIGN KEY ([msg_thr_id]) REFERENCES [dbo].[TM_CHT_Thread]([cht_id]),
        CONSTRAINT [FK_TM_CHT_Message_User]
            FOREIGN KEY ([msg_usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]),
        CONSTRAINT [FK_TM_CHT_Message_DeletedBy]
            FOREIGN KEY ([msg_deleted_by_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHT_Message_Thread]
        ON [dbo].[TM_CHT_Message] ([msg_thr_id]);

    CREATE INDEX [IX_TM_CHT_Message_User]
        ON [dbo].[TM_CHT_Message] ([msg_usr_id]);

    CREATE INDEX [IX_TM_CHT_Message_ThreadCreation]
        ON [dbo].[TM_CHT_Message] ([msg_thr_id], [msg_d_creation] DESC);

    PRINT 'Created table TM_CHT_Message';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_Message already exists - skipping';
END
GO

-- TM_CHT_ReadReceipt: Read receipts for messages
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHT_ReadReceipt')
BEGIN
    CREATE TABLE [dbo].[TM_CHT_ReadReceipt] (
        [rcpt_id]       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [rcpt_msg_id]   INT NOT NULL,
        [rcpt_usr_id]   INT NOT NULL,
        [rcpt_read_at]  DATETIME NOT NULL CONSTRAINT [DF_TM_CHT_ReadReceipt_ReadAt] DEFAULT (GETDATE()),

        CONSTRAINT [FK_TM_CHT_ReadReceipt_Message]
            FOREIGN KEY ([rcpt_msg_id]) REFERENCES [dbo].[TM_CHT_Message]([msg_id]),
        CONSTRAINT [FK_TM_CHT_ReadReceipt_User]
            FOREIGN KEY ([rcpt_usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHT_ReadReceipt_Message]
        ON [dbo].[TM_CHT_ReadReceipt] ([rcpt_msg_id]);

    CREATE INDEX [IX_TM_CHT_ReadReceipt_User]
        ON [dbo].[TM_CHT_ReadReceipt] ([rcpt_usr_id]);

    CREATE UNIQUE INDEX [IX_TM_CHT_ReadReceipt_MessageUser]
        ON [dbo].[TM_CHT_ReadReceipt] ([rcpt_msg_id], [rcpt_usr_id]);

    PRINT 'Created table TM_CHT_ReadReceipt';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_ReadReceipt already exists - skipping';
END
GO

-- ============================================================================
-- Room-based Chat System (TM_CHAT_*)
-- ============================================================================

-- TM_CHAT_Room: Chat rooms
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHAT_Room')
BEGIN
    CREATE TABLE [dbo].[TM_CHAT_Room] (
        [room_id]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [room_name]         NVARCHAR(200) NOT NULL,
        [room_description]  NVARCHAR(1000) NULL,
        [room_type]         NVARCHAR(50) NOT NULL CONSTRAINT [DF_TM_CHAT_Room_Type] DEFAULT ('group'),
        [room_is_active]    BIT NOT NULL CONSTRAINT [DF_TM_CHAT_Room_IsActive] DEFAULT (1),
        [usr_creator_id]    INT NULL,
        [room_d_creation]   DATETIME NOT NULL CONSTRAINT [DF_TM_CHAT_Room_Creation] DEFAULT (GETDATE()),
        [room_d_update]     DATETIME NULL,

        CONSTRAINT [FK_TM_CHAT_Room_Creator]
            FOREIGN KEY ([usr_creator_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHAT_Room_Creator]
        ON [dbo].[TM_CHAT_Room] ([usr_creator_id]);

    PRINT 'Created table TM_CHAT_Room';
END
ELSE
BEGIN
    PRINT 'Table TM_CHAT_Room already exists - skipping';
END
GO

-- TM_CHAT_RoomMember: Room membership
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHAT_RoomMember')
BEGIN
    CREATE TABLE [dbo].[TM_CHAT_RoomMember] (
        [mbr_id]            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [mbr_room_id]       INT NOT NULL,
        [mbr_usr_id]        INT NOT NULL,
        [mbr_role]          NVARCHAR(20) NOT NULL CONSTRAINT [DF_TM_CHAT_RoomMember_Role] DEFAULT ('member'),
        [mbr_is_active]     BIT NOT NULL CONSTRAINT [DF_TM_CHAT_RoomMember_IsActive] DEFAULT (1),
        [mbr_joined_at]     DATETIME NOT NULL CONSTRAINT [DF_TM_CHAT_RoomMember_JoinedAt] DEFAULT (GETDATE()),

        CONSTRAINT [FK_TM_CHAT_RoomMember_Room]
            FOREIGN KEY ([mbr_room_id]) REFERENCES [dbo].[TM_CHAT_Room]([room_id]),
        CONSTRAINT [FK_TM_CHAT_RoomMember_User]
            FOREIGN KEY ([mbr_usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHAT_RoomMember_Room]
        ON [dbo].[TM_CHAT_RoomMember] ([mbr_room_id]);

    CREATE INDEX [IX_TM_CHAT_RoomMember_User]
        ON [dbo].[TM_CHAT_RoomMember] ([mbr_usr_id]);

    CREATE UNIQUE INDEX [IX_TM_CHAT_RoomMember_RoomUser]
        ON [dbo].[TM_CHAT_RoomMember] ([mbr_room_id], [mbr_usr_id]);

    PRINT 'Created table TM_CHAT_RoomMember';
END
ELSE
BEGIN
    PRINT 'Table TM_CHAT_RoomMember already exists - skipping';
END
GO

-- TM_CHAT_Message: Messages within rooms
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CHAT_Message')
BEGIN
    CREATE TABLE [dbo].[TM_CHAT_Message] (
        [cmsg_id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [cmsg_room_id]          INT NOT NULL,
        [cmsg_usr_id]           INT NULL,
        [cmsg_content]          NVARCHAR(MAX) NOT NULL,
        [cmsg_type]             NVARCHAR(50) NOT NULL CONSTRAINT [DF_TM_CHAT_Message_Type] DEFAULT ('text'),
        [cmsg_is_edited]        BIT NOT NULL CONSTRAINT [DF_TM_CHAT_Message_IsEdited] DEFAULT (0),
        [cmsg_is_deleted]       BIT NOT NULL CONSTRAINT [DF_TM_CHAT_Message_IsDeleted] DEFAULT (0),
        [cmsg_d_creation]       DATETIME NOT NULL CONSTRAINT [DF_TM_CHAT_Message_Creation] DEFAULT (GETDATE()),
        [cmsg_d_update]         DATETIME NULL,
        [cmsg_deleted_at]       DATETIME NULL,
        [cmsg_deleted_by_id]    INT NULL,

        CONSTRAINT [FK_TM_CHAT_Message_Room]
            FOREIGN KEY ([cmsg_room_id]) REFERENCES [dbo].[TM_CHAT_Room]([room_id]),
        CONSTRAINT [FK_TM_CHAT_Message_User]
            FOREIGN KEY ([cmsg_usr_id]) REFERENCES [dbo].[TM_USR_User]([usr_id]),
        CONSTRAINT [FK_TM_CHAT_Message_DeletedBy]
            FOREIGN KEY ([cmsg_deleted_by_id]) REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    CREATE INDEX [IX_TM_CHAT_Message_Room]
        ON [dbo].[TM_CHAT_Message] ([cmsg_room_id]);

    CREATE INDEX [IX_TM_CHAT_Message_User]
        ON [dbo].[TM_CHAT_Message] ([cmsg_usr_id]);

    CREATE INDEX [IX_TM_CHAT_Message_RoomCreation]
        ON [dbo].[TM_CHAT_Message] ([cmsg_room_id], [cmsg_d_creation] DESC);

    PRINT 'Created table TM_CHAT_Message';
END
ELSE
BEGIN
    PRINT 'Table TM_CHAT_Message already exists - skipping';
END
GO

-- ============================================================================
-- Record migration in history
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.6')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory]
        ([version], [description], [filename], [execution_time_ms], [success])
    VALUES
        ('V1.0.0.6', 'Create Chat tables (thread-based and room-based)', 'V1.0.0.6__create_chat_tables.sql', 0, 1);
    PRINT 'Recorded migration V1.0.0.6';
END
GO

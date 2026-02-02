-- =============================================
-- Script: 05-create-chat-tables.sql
-- Description: Create chat tables for real-time messaging
-- Version: 1.0.0.4
-- =============================================

USE ERP_ECOLED;
GO

-- =============================================
-- Chat Threads Table
-- Represents conversation threads that can be:
-- - Linked to an entity (Invoice, Order, Project, etc.)
-- - General channels (no entity link)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_CHT_Thread]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_CHT_Thread] (
        [thr_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Entity linkage (optional)
        [thr_entity_type] NVARCHAR(50) NULL,  -- Invoice, Order, Project, PO, Lot, Shipment
        [thr_entity_id] INT NULL,

        -- Thread info
        [thr_name] NVARCHAR(255) NOT NULL,

        -- Creator
        [thr_created_by] INT NOT NULL,

        -- Timestamps
        [thr_created_at] DATETIME DEFAULT GETDATE(),

        -- Foreign key constraint
        CONSTRAINT [FK_ChatThread_User] FOREIGN KEY ([thr_created_by])
            REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    PRINT 'Created table TM_CHT_Thread';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_Thread already exists';
END
GO

-- Index for entity lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Thread_Entity' AND object_id = OBJECT_ID('TM_CHT_Thread'))
BEGIN
    CREATE INDEX [IX_Thread_Entity] ON [dbo].[TM_CHT_Thread]([thr_entity_type], [thr_entity_id]);
    PRINT 'Created index IX_Thread_Entity';
END
GO

-- Index for creator lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Thread_CreatedBy' AND object_id = OBJECT_ID('TM_CHT_Thread'))
BEGIN
    CREATE INDEX [IX_Thread_CreatedBy] ON [dbo].[TM_CHT_Thread]([thr_created_by]);
    PRINT 'Created index IX_Thread_CreatedBy';
END
GO

-- =============================================
-- Chat Messages Table
-- Stores individual messages in threads
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_CHT_Message]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_CHT_Message] (
        [msg_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Thread reference
        [msg_thr_id] INT NOT NULL,

        -- Author
        [msg_usr_id] INT NOT NULL,

        -- Message content
        [msg_content] NVARCHAR(MAX) NOT NULL,

        -- File attachments (JSON array of file IDs)
        [msg_attachments] NVARCHAR(MAX) NULL,

        -- Timestamps
        [msg_created_at] DATETIME DEFAULT GETDATE(),
        [msg_deleted_at] DATETIME NULL,  -- Soft delete

        -- Foreign key constraints
        CONSTRAINT [FK_ChatMessage_Thread] FOREIGN KEY ([msg_thr_id])
            REFERENCES [dbo].[TM_CHT_Thread]([thr_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChatMessage_User] FOREIGN KEY ([msg_usr_id])
            REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    PRINT 'Created table TM_CHT_Message';
END
ELSE
BEGIN
    PRINT 'Table TM_CHT_Message already exists';
END
GO

-- Index for thread lookups (most common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Message_Thread' AND object_id = OBJECT_ID('TM_CHT_Message'))
BEGIN
    CREATE INDEX [IX_Message_Thread] ON [dbo].[TM_CHT_Message]([msg_thr_id]);
    PRINT 'Created index IX_Message_Thread';
END
GO

-- Index for user message lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Message_User' AND object_id = OBJECT_ID('TM_CHT_Message'))
BEGIN
    CREATE INDEX [IX_Message_User] ON [dbo].[TM_CHT_Message]([msg_usr_id]);
    PRINT 'Created index IX_Message_User';
END
GO

-- Composite index for chronological message queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Message_Thread_Created' AND object_id = OBJECT_ID('TM_CHT_Message'))
BEGIN
    CREATE INDEX [IX_Message_Thread_Created] ON [dbo].[TM_CHT_Message]([msg_thr_id], [msg_created_at]);
    PRINT 'Created index IX_Message_Thread_Created';
END
GO

-- =============================================
-- Seed initial general chat channels (optional)
-- =============================================
-- Uncomment the following to create default channels:
/*
IF NOT EXISTS (SELECT 1 FROM [dbo].[TM_CHT_Thread] WHERE [thr_name] = 'General' AND [thr_entity_type] IS NULL)
BEGIN
    INSERT INTO [dbo].[TM_CHT_Thread] ([thr_entity_type], [thr_entity_id], [thr_name], [thr_created_by])
    VALUES (NULL, NULL, 'General', 1);  -- Assumes user ID 1 exists

    PRINT 'Created General channel';
END
*/

PRINT 'Chat tables creation completed successfully';
GO

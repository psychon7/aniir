-- Migration: Create Drive module tables (TM_DRV_Folder, TM_DRV_File)
-- Description: File management system for storing and organizing files with folder hierarchy,
--              entity attachments, and storage metadata
-- Author: System Migration
-- Date: 2026-02-09

-- =============================================================================
-- Table: TM_DRV_Folder
-- Description: Folder hierarchy for organizing drive files
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_DRV_Folder')
BEGIN
    CREATE TABLE [dbo].[TM_DRV_Folder] (
        -- Primary key
        [drf_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        -- Folder metadata
        [drf_name] NVARCHAR(500) NOT NULL,
        [drf_path] NVARCHAR(2000) NULL,
        [drf_description] NVARCHAR(500) NULL,

        -- Hierarchy
        [drf_parent_id] INT NULL,

        -- Entity association (optional: link folder to a business entity)
        [drf_entity_type] NVARCHAR(100) NULL,
        [drf_entity_id] INT NULL,

        -- Display/visibility
        [drf_is_hidden] BIT NOT NULL CONSTRAINT [DF_TM_DRV_Folder_IsHidden] DEFAULT (0),
        [drf_permissions] NVARCHAR(2000) NULL,

        -- Society/tenant
        [soc_id] INT NULL,

        -- Audit
        [usr_creator_id] INT NULL,
        [drf_is_active] BIT NOT NULL CONSTRAINT [DF_TM_DRV_Folder_IsActive] DEFAULT (1),
        [drf_d_creation] DATETIME NOT NULL CONSTRAINT [DF_TM_DRV_Folder_Creation] DEFAULT (GETDATE()),
        [drf_d_update] DATETIME NULL,

        -- Self-referencing FK for parent folder
        CONSTRAINT [FK_TM_DRV_Folder_Parent]
            FOREIGN KEY ([drf_parent_id]) REFERENCES [dbo].[TM_DRV_Folder]([drf_id])
    );

    -- Indexes
    CREATE INDEX [IX_TM_DRV_Folder_Parent]
        ON [dbo].[TM_DRV_Folder] ([drf_parent_id])
        WHERE [drf_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_Folder_Entity]
        ON [dbo].[TM_DRV_Folder] ([drf_entity_type], [drf_entity_id])
        WHERE [drf_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_Folder_Society]
        ON [dbo].[TM_DRV_Folder] ([soc_id])
        WHERE [drf_is_active] = 1;

    PRINT 'Table TM_DRV_Folder created successfully';
END
ELSE
BEGIN
    PRINT 'Table TM_DRV_Folder already exists';
END
GO

-- =============================================================================
-- Table: TM_DRV_File
-- Description: File metadata and storage information
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_DRV_File')
BEGIN
    CREATE TABLE [dbo].[TM_DRV_File] (
        -- Primary key
        [drv_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        -- File metadata
        [drv_name] NVARCHAR(500) NOT NULL,
        [drv_original_name] NVARCHAR(500) NULL,
        [drv_extension] NVARCHAR(50) NULL,
        [drv_mime_type] NVARCHAR(200) NULL,
        [drv_size] BIGINT NULL,
        [drv_description] NVARCHAR(500) NULL,
        [drv_tags] NVARCHAR(1000) NULL,

        -- Storage
        [drv_path] NVARCHAR(2000) NULL,
        [drv_storage_key] NVARCHAR(500) NULL,

        -- Folder association
        [drf_id] INT NULL,

        -- Entity association (link file to a business entity)
        [drv_entity_type] NVARCHAR(100) NULL,
        [drv_entity_id] INT NULL,

        -- Access control
        [drv_is_public] BIT NOT NULL CONSTRAINT [DF_TM_DRV_File_IsPublic] DEFAULT (0),

        -- Usage tracking
        [drv_download_count] INT NOT NULL CONSTRAINT [DF_TM_DRV_File_DownloadCount] DEFAULT (0),

        -- Upload status
        [drv_status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_TM_DRV_File_Status] DEFAULT ('active'),
        [drv_content_hash] NVARCHAR(128) NULL,

        -- Society/tenant
        [soc_id] INT NULL,

        -- Audit
        [usr_creator_id] INT NULL,
        [usr_updater_id] INT NULL,
        [usr_deleter_id] INT NULL,
        [drv_is_active] BIT NOT NULL CONSTRAINT [DF_TM_DRV_File_IsActive] DEFAULT (1),
        [drv_is_deleted] BIT NOT NULL CONSTRAINT [DF_TM_DRV_File_IsDeleted] DEFAULT (0),
        [drv_d_creation] DATETIME NOT NULL CONSTRAINT [DF_TM_DRV_File_Creation] DEFAULT (GETDATE()),
        [drv_d_update] DATETIME NULL,
        [drv_d_deleted] DATETIME NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_DRV_File_Folder]
            FOREIGN KEY ([drf_id]) REFERENCES [dbo].[TM_DRV_Folder]([drf_id])
    );

    -- Indexes
    CREATE INDEX [IX_TM_DRV_File_Folder]
        ON [dbo].[TM_DRV_File] ([drf_id])
        WHERE [drv_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_File_Entity]
        ON [dbo].[TM_DRV_File] ([drv_entity_type], [drv_entity_id])
        WHERE [drv_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_File_Name]
        ON [dbo].[TM_DRV_File] ([drv_name])
        WHERE [drv_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_File_Society]
        ON [dbo].[TM_DRV_File] ([soc_id])
        WHERE [drv_is_active] = 1;

    CREATE INDEX [IX_TM_DRV_File_Deleted]
        ON [dbo].[TM_DRV_File] ([drv_is_deleted])
        WHERE [drv_is_deleted] = 1;

    PRINT 'Table TM_DRV_File created successfully';
END
ELSE
BEGIN
    PRINT 'Table TM_DRV_File already exists';
END
GO

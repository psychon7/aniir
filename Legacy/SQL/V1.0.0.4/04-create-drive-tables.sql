-- =============================================
-- Script: 04-create-drive-tables.sql
-- Description: Create Drive module tables for file and folder management
-- Version: 1.0.0.4
-- Tables: TM_DRV_Folder, TM_DRV_File
-- =============================================

USE ERP_ECOLED;
GO

-- =============================================
-- Drive Folders Table
-- Represents folder structure for file organization
-- Supports hierarchical folder nesting via fol_parent_id
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_DRV_Folder]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_DRV_Folder] (
        [fol_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Hierarchy
        [fol_parent_id] INT NULL,

        -- Folder info
        [fol_name] NVARCHAR(255) NOT NULL,
        [fol_path] NVARCHAR(1000) NOT NULL,  -- Full path like /Documents/Invoices/2024

        -- Visibility and permissions
        [fol_is_hidden] BIT DEFAULT 0,
        [fol_permissions] NVARCHAR(MAX) NULL,  -- JSON for role-based permissions

        -- Creator
        [fol_created_by] INT NOT NULL,

        -- Timestamps
        [fol_created_at] DATETIME DEFAULT GETDATE(),
        [fol_updated_at] DATETIME DEFAULT GETDATE(),
        [fol_deleted_at] DATETIME NULL,  -- Soft delete

        -- Self-referencing foreign key for parent folder
        CONSTRAINT [FK_Folder_Parent] FOREIGN KEY ([fol_parent_id])
            REFERENCES [dbo].[TM_DRV_Folder]([fol_id]),

        -- Foreign key to user table
        CONSTRAINT [FK_Folder_User] FOREIGN KEY ([fol_created_by])
            REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    PRINT 'Created table TM_DRV_Folder';
END
ELSE
BEGIN
    PRINT 'Table TM_DRV_Folder already exists';
END
GO

-- Index for parent folder lookups (tree navigation)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Folder_Parent' AND object_id = OBJECT_ID('TM_DRV_Folder'))
BEGIN
    CREATE INDEX [IX_Folder_Parent] ON [dbo].[TM_DRV_Folder]([fol_parent_id]);
    PRINT 'Created index IX_Folder_Parent';
END
GO

-- Index for path-based lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Folder_Path' AND object_id = OBJECT_ID('TM_DRV_Folder'))
BEGIN
    CREATE INDEX [IX_Folder_Path] ON [dbo].[TM_DRV_Folder]([fol_path]);
    PRINT 'Created index IX_Folder_Path';
END
GO

-- Index for creator lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Folder_CreatedBy' AND object_id = OBJECT_ID('TM_DRV_Folder'))
BEGIN
    CREATE INDEX [IX_Folder_CreatedBy] ON [dbo].[TM_DRV_Folder]([fol_created_by]);
    PRINT 'Created index IX_Folder_CreatedBy';
END
GO

-- Index for non-deleted folders (commonly queried)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Folder_Active' AND object_id = OBJECT_ID('TM_DRV_Folder'))
BEGIN
    CREATE INDEX [IX_Folder_Active] ON [dbo].[TM_DRV_Folder]([fol_deleted_at]) WHERE [fol_deleted_at] IS NULL;
    PRINT 'Created index IX_Folder_Active';
END
GO

-- =============================================
-- Drive Files Table
-- Stores file metadata with S3/MinIO URL references
-- Supports entity attachment (Invoice, Quote, Order, Product, etc.)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_DRV_File]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_DRV_File] (
        [fil_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Folder reference (nullable for root-level files)
        [fil_fol_id] INT NULL,

        -- File info
        [fil_name] NVARCHAR(255) NOT NULL,
        [fil_original_name] NVARCHAR(255) NOT NULL,  -- Original uploaded filename
        [fil_url] NVARCHAR(1000) NOT NULL,  -- S3/MinIO URL
        [fil_size_bytes] BIGINT NOT NULL,
        [fil_mime_type] NVARCHAR(100) NOT NULL,
        [fil_extension] NVARCHAR(20) NULL,  -- File extension (pdf, jpg, etc.)

        -- Entity attachment (polymorphic reference)
        [fil_entity_type] NVARCHAR(50) NULL,  -- Invoice, Quote, Order, Product, Project, Shipment, PO
        [fil_entity_id] INT NULL,

        -- Visibility and permissions
        [fil_is_hidden] BIT DEFAULT 0,
        [fil_permissions] NVARCHAR(MAX) NULL,  -- JSON for role-based permissions

        -- File hash for deduplication (optional)
        [fil_checksum] NVARCHAR(64) NULL,  -- SHA-256 hash

        -- Creator
        [fil_created_by] INT NOT NULL,

        -- Timestamps
        [fil_created_at] DATETIME DEFAULT GETDATE(),
        [fil_updated_at] DATETIME DEFAULT GETDATE(),
        [fil_deleted_at] DATETIME NULL,  -- Soft delete

        -- Foreign key to folder
        CONSTRAINT [FK_File_Folder] FOREIGN KEY ([fil_fol_id])
            REFERENCES [dbo].[TM_DRV_Folder]([fol_id]),

        -- Foreign key to user table
        CONSTRAINT [FK_File_User] FOREIGN KEY ([fil_created_by])
            REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    PRINT 'Created table TM_DRV_File';
END
ELSE
BEGIN
    PRINT 'Table TM_DRV_File already exists';
END
GO

-- Index for folder lookups (list files in folder)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_Folder' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_Folder] ON [dbo].[TM_DRV_File]([fil_fol_id]);
    PRINT 'Created index IX_File_Folder';
END
GO

-- Index for entity attachment lookups (get files for invoice, order, etc.)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_Entity' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_Entity] ON [dbo].[TM_DRV_File]([fil_entity_type], [fil_entity_id]);
    PRINT 'Created index IX_File_Entity';
END
GO

-- Index for creator lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_CreatedBy' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_CreatedBy] ON [dbo].[TM_DRV_File]([fil_created_by]);
    PRINT 'Created index IX_File_CreatedBy';
END
GO

-- Index for non-deleted files (commonly queried)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_Active' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_Active] ON [dbo].[TM_DRV_File]([fil_deleted_at]) WHERE [fil_deleted_at] IS NULL;
    PRINT 'Created index IX_File_Active';
END
GO

-- Index for MIME type lookups (e.g., list all images, all PDFs)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_MimeType' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_MimeType] ON [dbo].[TM_DRV_File]([fil_mime_type]);
    PRINT 'Created index IX_File_MimeType';
END
GO

-- Composite index for folder + active files (most common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_File_Folder_Active' AND object_id = OBJECT_ID('TM_DRV_File'))
BEGIN
    CREATE INDEX [IX_File_Folder_Active] ON [dbo].[TM_DRV_File]([fil_fol_id], [fil_deleted_at]);
    PRINT 'Created index IX_File_Folder_Active';
END
GO

-- =============================================
-- Create default root folders (optional seed data)
-- =============================================
-- Uncomment the following to create default folders:
/*
IF NOT EXISTS (SELECT 1 FROM [dbo].[TM_DRV_Folder] WHERE [fol_name] = 'Documents' AND [fol_parent_id] IS NULL)
BEGIN
    INSERT INTO [dbo].[TM_DRV_Folder] ([fol_parent_id], [fol_name], [fol_path], [fol_created_by])
    VALUES (NULL, 'Documents', '/Documents', 1);  -- Assumes user ID 1 exists

    PRINT 'Created Documents root folder';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[TM_DRV_Folder] WHERE [fol_name] = 'Invoices' AND [fol_parent_id] IS NULL)
BEGIN
    INSERT INTO [dbo].[TM_DRV_Folder] ([fol_parent_id], [fol_name], [fol_path], [fol_created_by])
    VALUES (NULL, 'Invoices', '/Invoices', 1);  -- Assumes user ID 1 exists

    PRINT 'Created Invoices root folder';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[TM_DRV_Folder] WHERE [fol_name] = 'Products' AND [fol_parent_id] IS NULL)
BEGIN
    INSERT INTO [dbo].[TM_DRV_Folder] ([fol_parent_id], [fol_name], [fol_path], [fol_created_by])
    VALUES (NULL, 'Products', '/Products', 1);  -- Assumes user ID 1 exists

    PRINT 'Created Products root folder';
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[TM_DRV_Folder] WHERE [fol_name] = 'Projects' AND [fol_parent_id] IS NULL)
BEGIN
    INSERT INTO [dbo].[TM_DRV_Folder] ([fol_parent_id], [fol_name], [fol_path], [fol_created_by])
    VALUES (NULL, 'Projects', '/Projects', 1);  -- Assumes user ID 1 exists

    PRINT 'Created Projects root folder';
END
*/

PRINT 'Drive tables creation completed successfully';
GO

-- Migration: Initialize Migration History Table
-- Description: Creates the _MigrationHistory table for tracking applied migrations
-- Author: System Migration
-- Date: 2026-02-04
-- Version: V1.0.0.0 (Bootstrap - runs first)
--
-- This migration is special - it creates the tracking table itself.
-- The migration runner will create this table if it doesn't exist,
-- but this file serves as documentation and manual execution option.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = '_MigrationHistory')
BEGIN
    CREATE TABLE [dbo].[_MigrationHistory] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [version] NVARCHAR(50) NOT NULL UNIQUE,
        [description] NVARCHAR(500) NOT NULL,
        [filename] NVARCHAR(255) NOT NULL,
        [checksum] NVARCHAR(64) NULL,
        [executed_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [executed_by] NVARCHAR(100) NOT NULL DEFAULT SYSTEM_USER,
        [execution_time_ms] INT NULL,
        [success] BIT NOT NULL DEFAULT 1
    );
    
    CREATE INDEX [IX__MigrationHistory_Version] 
        ON [dbo].[_MigrationHistory] ([version]);
    
    PRINT '✅ Migration history table created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Migration history table already exists';
END
GO

-- Record this bootstrap migration
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.0')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [checksum], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.0', 'Initialize Migration History Table', 'V1.0.0.0__init_migration_history.sql', NULL, 0, 1);
    
    PRINT '✅ Bootstrap migration recorded';
END
GO

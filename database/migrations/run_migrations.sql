-- ============================================================================
-- ERP System - Migration Runner Script
-- ============================================================================
-- Description: Runs all pending migrations on the production database
-- Database: DEV_ERP_ECOLED (Development) or ERP_ECOLED (Production)
-- Server: 47.254.130.238
-- Date: 2026-02-04
-- ============================================================================

-- Set context
USE [DEV_ERP_ECOLED];
GO

PRINT '============================================================================';
PRINT 'Starting ERP System Migrations';
PRINT 'Database: ' + DB_NAME();
PRINT 'Server: ' + @@SERVERNAME;
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
GO

-- ============================================================================
-- MIGRATION V1.0.0.0: Create Migration History Table (Bootstrap)
-- ============================================================================
PRINT '';
PRINT '--- Migration V1.0.0.0: Initialize Migration History Table ---';
PRINT 'Description: Creates the tracking table for applied migrations';
GO

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
    
    -- Record this migration
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.0', 'Initialize Migration History Table', 'V1.0.0.0__init_migration_history.sql', 0, 1);
END
ELSE
BEGIN
    PRINT '⚠️ Migration history table already exists - skipping';
END
GO

-- ============================================================================
-- MIGRATION V1.0.0.2: Create TM_CPP_Client_Product_Price Table
-- ============================================================================
PRINT '';
PRINT '--- Migration V1.0.0.2: Create TM_CPP_Client_Product_Price ---';
PRINT 'Description: Stores custom pricing for specific client/product combinations';
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CPP_Client_Product_Price')
BEGIN
    CREATE TABLE [dbo].[TM_CPP_Client_Product_Price] (
        -- Primary key
        [cpp_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        -- Foreign keys
        [cpp_cli_id] INT NOT NULL,
        [cpp_prd_id] INT NOT NULL,
        [cpp_soc_id] INT NULL,

        -- Pricing fields
        [cpp_unit_price] DECIMAL(18, 4) NOT NULL,
        [cpp_discount_percent] DECIMAL(5, 2) NULL,
        [cpp_min_quantity] INT NULL,
        [cpp_max_quantity] INT NULL,

        -- Currency
        [cpp_cur_id] INT NULL,

        -- Validity period
        [cpp_valid_from] DATETIME NULL,
        [cpp_valid_to] DATETIME NULL,

        -- Status
        [cpp_is_active] BIT NOT NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_IsActive] DEFAULT (1),

        -- Notes
        [cpp_notes] NVARCHAR(500) NULL,

        -- Audit fields
        [cpp_d_creation] DATETIME NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_Creation] DEFAULT (GETDATE()),
        [cpp_d_update] DATETIME NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_Update] DEFAULT (GETDATE()),
        [cpp_created_by] INT NULL,
        [cpp_updated_by] INT NULL,

        -- Constraints
        CONSTRAINT [FK_TM_CPP_Client_Product_Price_Client]
            FOREIGN KEY ([cpp_cli_id]) REFERENCES [dbo].[TM_CLI_CLient]([cli_id]),
        CONSTRAINT [FK_TM_CPP_Client_Product_Price_Product]
            FOREIGN KEY ([cpp_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );

    -- Indexes for performance
    CREATE INDEX [IX_TM_CPP_Client_Product_Price_Client]
        ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_cli_id]);

    CREATE INDEX [IX_TM_CPP_Client_Product_Price_Product]
        ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_prd_id]);

    CREATE UNIQUE INDEX [IX_TM_CPP_Client_Product_Price_Unique]
        ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_cli_id], [cpp_prd_id])
        WHERE [cpp_is_active] = 1;

    PRINT '✅ Table TM_CPP_Client_Product_Price created successfully';
END
ELSE
BEGIN
    PRINT '⚠️  Table TM_CPP_Client_Product_Price already exists - skipping';
END
GO

-- Record migration V1.0.0.2 in history
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.2')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.2', 'Create Client Product Price table', 'V1.0.0.2__create_client_product_price.sql', 0, 1);
    PRINT '📝 Recorded migration V1.0.0.2';
END
GO

-- ============================================================================
-- MIGRATION V1.0.0.3: Create TM_SPP_Supplier_Product_Price Table
-- ============================================================================
PRINT '';
PRINT '--- Migration V1.0.0.3: Create TM_SPP_Supplier_Product_Price ---';
PRINT 'Description: Stores pricing information for products from specific suppliers';
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_SPP_Supplier_Product_Price')
BEGIN
    CREATE TABLE [dbo].[TM_SPP_Supplier_Product_Price] (
        -- Primary key
        [spp_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,

        -- Foreign keys
        [spp_sup_id] INT NOT NULL,
        [spp_prd_id] INT NOT NULL,
        [spp_soc_id] INT NULL,

        -- Supplier's product reference
        [spp_supplier_ref] NVARCHAR(100) NULL,
        [spp_supplier_name] NVARCHAR(200) NULL,

        -- Pricing fields
        [spp_unit_cost] DECIMAL(18, 4) NOT NULL,
        [spp_discount_percent] DECIMAL(5, 2) NULL,
        [spp_min_order_qty] INT NULL,
        [spp_lead_time_days] INT NULL,

        -- Currency
        [spp_cur_id] INT NULL,

        -- Validity period
        [spp_valid_from] DATETIME NULL,
        [spp_valid_to] DATETIME NULL,

        -- Priority and preference
        [spp_priority] INT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Priority] DEFAULT (1),
        [spp_is_preferred] BIT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_IsPreferred] DEFAULT (0),

        -- Status
        [spp_is_active] BIT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_IsActive] DEFAULT (1),

        -- Notes
        [spp_notes] NVARCHAR(500) NULL,

        -- Audit fields
        [spp_d_creation] DATETIME NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Creation] DEFAULT (GETDATE()),
        [spp_d_update] DATETIME NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Update] DEFAULT (GETDATE()),
        [spp_created_by] INT NULL,
        [spp_updated_by] INT NULL,

        -- Constraints
        CONSTRAINT [FK_TM_SPP_Supplier_Product_Price_Supplier]
            FOREIGN KEY ([spp_sup_id]) REFERENCES [dbo].[TM_SUP_Supplier]([sup_id]),
        CONSTRAINT [FK_TM_SPP_Supplier_Product_Price_Product]
            FOREIGN KEY ([spp_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );

    -- Indexes for performance
    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Supplier]
        ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_sup_id]);

    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Product]
        ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_prd_id]);

    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Preferred]
        ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_prd_id], [spp_is_preferred])
        WHERE [spp_is_active] = 1;

    PRINT '✅ Table TM_SPP_Supplier_Product_Price created successfully';
END
ELSE
BEGIN
    PRINT '⚠️  Table TM_SPP_Supplier_Product_Price already exists - skipping';
END
GO

-- Record migration V1.0.0.3 in history
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.3')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.3', 'Create Supplier Product Price table', 'V1.0.0.3__create_supplier_product_price.sql', 0, 1);
    PRINT '📝 Recorded migration V1.0.0.3';
END
GO

-- ============================================================================
-- Verification: Check tables exist
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'Migration Verification';
PRINT '============================================================================';
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CPP_Client_Product_Price')
    PRINT '✅ TM_CPP_Client_Product_Price: EXISTS'
ELSE
    PRINT '❌ TM_CPP_Client_Product_Price: MISSING';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_SPP_Supplier_Product_Price')
    PRINT '✅ TM_SPP_Supplier_Product_Price: EXISTS'
ELSE
    PRINT '❌ TM_SPP_Supplier_Product_Price: MISSING';

PRINT '';
PRINT '============================================================================';
PRINT 'Migrations Complete!';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
GO

-- Show migration history
PRINT '';
PRINT '📋 Migration History:';
SELECT 
    [version], 
    [description], 
    CONVERT(VARCHAR, [executed_at], 120) AS executed_at,
    CASE WHEN [success] = 1 THEN '✅' ELSE '❌' END AS status
FROM [dbo].[_MigrationHistory]
ORDER BY [version];
GO

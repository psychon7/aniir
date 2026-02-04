-- Migration: Record Baseline Migrations
-- Description: Records existing migrations that were applied manually before the auto-runner
-- Author: System Migration
-- Date: 2026-02-04
-- Version: V0.0.0.1 (Baseline - runs before main migrations)
--
-- This migration records any migrations that were applied before the automatic
-- migration system was set up. Run this once after setting up the migration runner.

-- Record V1.0.0.2 if tables exist but not recorded
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CPP_Client_Product_Price')
   AND NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.2')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [checksum], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.2', 'Create Client Product Price table (pre-existing)', 'V1.0.0.2__create_client_product_price.sql', 'baseline', 0, 1);
    
    PRINT '✅ Recorded pre-existing migration V1.0.0.2';
END
ELSE IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CPP_Client_Product_Price')
BEGIN
    PRINT '⚠️ Table TM_CPP_Client_Product_Price does not exist - migration will run normally';
END
GO

-- Record V1.0.0.3 if tables exist but not recorded
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_SPP_Supplier_Product_Price')
   AND NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.3')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] 
        ([version], [description], [filename], [checksum], [execution_time_ms], [success])
    VALUES 
        ('V1.0.0.3', 'Create Supplier Product Price table (pre-existing)', 'V1.0.0.3__create_supplier_product_price.sql', 'baseline', 0, 1);
    
    PRINT '✅ Recorded pre-existing migration V1.0.0.3';
END
ELSE IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_SPP_Supplier_Product_Price')
BEGIN
    PRINT '⚠️ Table TM_SPP_Supplier_Product_Price does not exist - migration will run normally';
END
GO

PRINT '';
PRINT '============================================================================';
PRINT 'Baseline migration complete!';
PRINT '============================================================================';
PRINT '';
PRINT 'Current migration history:';

SELECT [version], [description], [executed_at], [success]
FROM [dbo].[_MigrationHistory]
ORDER BY [version];
GO

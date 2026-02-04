#!/bin/bash
# Quick migration runner - One command execution
# Usage: Copy and paste this entire command in Dokploy terminal

sqlcmd -S 47.254.130.238,1433 \
  -U 'iZ9x6t9u0t5n8Z\Administrator' \
  -P '2@24Courtry' \
  -d DEV_ERP_ECOLED \
  -Q "
-- Quick Migration Execution
USE [DEV_ERP_ECOLED];
GO

PRINT 'Running migrations...';

-- V1.0.0.2: Create TM_CPP_Client_Product_Price
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CPP_Client_Product_Price')
BEGIN
    CREATE TABLE [dbo].[TM_CPP_Client_Product_Price] (
        [cpp_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [cpp_cli_id] INT NOT NULL,
        [cpp_prd_id] INT NOT NULL,
        [cpp_soc_id] INT NULL,
        [cpp_unit_price] DECIMAL(18, 4) NOT NULL,
        [cpp_discount_percent] DECIMAL(5, 2) NULL,
        [cpp_min_quantity] INT NULL,
        [cpp_max_quantity] INT NULL,
        [cpp_cur_id] INT NULL,
        [cpp_valid_from] DATETIME NULL,
        [cpp_valid_to] DATETIME NULL,
        [cpp_is_active] BIT NOT NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_IsActive] DEFAULT (1),
        [cpp_notes] NVARCHAR(500) NULL,
        [cpp_d_creation] DATETIME NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_Creation] DEFAULT (GETDATE()),
        [cpp_d_update] DATETIME NULL CONSTRAINT [DF_TM_CPP_Client_Product_Price_Update] DEFAULT (GETDATE()),
        [cpp_created_by] INT NULL,
        [cpp_updated_by] INT NULL,
        CONSTRAINT [FK_TM_CPP_Client_Product_Price_Client] FOREIGN KEY ([cpp_cli_id]) REFERENCES [dbo].[TM_CLI_CLient]([cli_id]),
        CONSTRAINT [FK_TM_CPP_Client_Product_Price_Product] FOREIGN KEY ([cpp_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );
    CREATE INDEX [IX_TM_CPP_Client_Product_Price_Client] ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_cli_id]);
    CREATE INDEX [IX_TM_CPP_Client_Product_Price_Product] ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_prd_id]);
    CREATE UNIQUE INDEX [IX_TM_CPP_Client_Product_Price_Unique] ON [dbo].[TM_CPP_Client_Product_Price] ([cpp_cli_id], [cpp_prd_id]) WHERE [cpp_is_active] = 1;
    PRINT '✅ TM_CPP_Client_Product_Price created';
END
ELSE PRINT '⚠️ TM_CPP_Client_Product_Price exists';

-- V1.0.0.3: Create TM_SPP_Supplier_Product_Price
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_SPP_Supplier_Product_Price')
BEGIN
    CREATE TABLE [dbo].[TM_SPP_Supplier_Product_Price] (
        [spp_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [spp_sup_id] INT NOT NULL,
        [spp_prd_id] INT NOT NULL,
        [spp_soc_id] INT NULL,
        [spp_supplier_ref] NVARCHAR(100) NULL,
        [spp_supplier_name] NVARCHAR(200) NULL,
        [spp_unit_cost] DECIMAL(18, 4) NOT NULL,
        [spp_discount_percent] DECIMAL(5, 2) NULL,
        [spp_min_order_qty] INT NULL,
        [spp_lead_time_days] INT NULL,
        [spp_cur_id] INT NULL,
        [spp_valid_from] DATETIME NULL,
        [spp_valid_to] DATETIME NULL,
        [spp_priority] INT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Priority] DEFAULT (1),
        [spp_is_preferred] BIT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_IsPreferred] DEFAULT (0),
        [spp_is_active] BIT NOT NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_IsActive] DEFAULT (1),
        [spp_notes] NVARCHAR(500) NULL,
        [spp_d_creation] DATETIME NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Creation] DEFAULT (GETDATE()),
        [spp_d_update] DATETIME NULL CONSTRAINT [DF_TM_SPP_Supplier_Product_Price_Update] DEFAULT (GETDATE()),
        [spp_created_by] INT NULL,
        [spp_updated_by] INT NULL,
        CONSTRAINT [FK_TM_SPP_Supplier_Product_Price_Supplier] FOREIGN KEY ([spp_sup_id]) REFERENCES [dbo].[TM_SUP_Supplier]([sup_id]),
        CONSTRAINT [FK_TM_SPP_Supplier_Product_Price_Product] FOREIGN KEY ([spp_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );
    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Supplier] ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_sup_id]);
    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Product] ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_prd_id]);
    CREATE INDEX [IX_TM_SPP_Supplier_Product_Price_Preferred] ON [dbo].[TM_SPP_Supplier_Product_Price] ([spp_prd_id], [spp_is_preferred]) WHERE [spp_is_active] = 1;
    PRINT '✅ TM_SPP_Supplier_Product_Price created';
END
ELSE PRINT '⚠️ TM_SPP_Supplier_Product_Price exists';

PRINT 'Migrations complete!';
" \
  -e

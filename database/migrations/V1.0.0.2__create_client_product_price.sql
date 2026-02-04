-- Migration: Create TM_CPP_Client_Product_Price table
-- Description: Stores custom pricing for specific client/product combinations
-- Author: System Migration
-- Date: 2026-02-04

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

    PRINT 'Table TM_CPP_Client_Product_Price created successfully';
END
ELSE
BEGIN
    PRINT 'Table TM_CPP_Client_Product_Price already exists';
END
GO

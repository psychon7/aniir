-- Migration: Create TM_SPP_Supplier_Product_Price table
-- Description: Stores pricing information for products from specific suppliers
-- Author: System Migration
-- Date: 2026-02-04

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

    PRINT 'Table TM_SPP_Supplier_Product_Price created successfully';
END
ELSE
BEGIN
    PRINT 'Table TM_SPP_Supplier_Product_Price already exists';
END
GO

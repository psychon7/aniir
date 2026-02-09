-- ============================================================================
-- MIGRATION V1.0.0.8: Create Landed Cost Tables
-- ============================================================================
-- Description: Creates tables for supply lot management and landed cost
--              calculation, including reference tables for cost profiles
--              and components, master tables for lots, items, freight costs,
--              and history/log tables for allocation tracking.
-- Date: 2026-02-09
-- ============================================================================

-- ============================================================================
-- 1. TR_LCP_LandedCostProfile (Reference: cost profile templates)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TR_LCP_LandedCostProfile')
BEGIN
    CREATE TABLE [dbo].[TR_LCP_LandedCostProfile] (
        [lcp_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [lcp_code] NVARCHAR(50) NOT NULL,
        [lcp_name] NVARCHAR(200) NOT NULL,
        [lcp_description] NVARCHAR(1000) NULL,
        [lcp_default_strategy] NVARCHAR(20) NULL,
        [lcp_is_active] BIT NOT NULL CONSTRAINT [DF_TR_LCP_LandedCostProfile_IsActive] DEFAULT (1),
        [lcp_soc_id] INT NULL,
        [lcp_created_at] DATETIME NOT NULL CONSTRAINT [DF_TR_LCP_LandedCostProfile_CreatedAt] DEFAULT (GETDATE()),
        [lcp_updated_at] DATETIME NULL,
        [lcp_created_by] INT NULL,
        [lcp_updated_by] INT NULL
    );

    CREATE UNIQUE INDEX [IX_TR_LCP_LandedCostProfile_Code]
        ON [dbo].[TR_LCP_LandedCostProfile] ([lcp_code]);

    PRINT 'Created table TR_LCP_LandedCostProfile';
END
ELSE
BEGIN
    PRINT 'Table TR_LCP_LandedCostProfile already exists - skipping';
END
GO

-- ============================================================================
-- 2. TR_LCC_LandedCostComponent (Reference: cost component types)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TR_LCC_LandedCostComponent')
BEGIN
    CREATE TABLE [dbo].[TR_LCC_LandedCostComponent] (
        [lcc_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [lcc_lcp_id] INT NULL,
        [lcc_code] NVARCHAR(50) NOT NULL,
        [lcc_name] NVARCHAR(200) NOT NULL,
        [lcc_description] NVARCHAR(1000) NULL,
        [lcc_type] NVARCHAR(20) NOT NULL,
        [lcc_default_percent] DECIMAL(5, 2) NULL,
        [lcc_is_active] BIT NOT NULL CONSTRAINT [DF_TR_LCC_LandedCostComponent_IsActive] DEFAULT (1),
        [lcc_sort_order] INT NOT NULL CONSTRAINT [DF_TR_LCC_LandedCostComponent_SortOrder] DEFAULT (0),
        [lcc_created_at] DATETIME NOT NULL CONSTRAINT [DF_TR_LCC_LandedCostComponent_CreatedAt] DEFAULT (GETDATE()),
        [lcc_updated_at] DATETIME NULL,

        CONSTRAINT [FK_TR_LCC_LandedCostComponent_Profile]
            FOREIGN KEY ([lcc_lcp_id]) REFERENCES [dbo].[TR_LCP_LandedCostProfile]([lcp_id])
    );

    CREATE INDEX [IX_TR_LCC_LandedCostComponent_Profile]
        ON [dbo].[TR_LCC_LandedCostComponent] ([lcc_lcp_id]);

    CREATE INDEX [IX_TR_LCC_LandedCostComponent_Type]
        ON [dbo].[TR_LCC_LandedCostComponent] ([lcc_type]);

    PRINT 'Created table TR_LCC_LandedCostComponent';
END
ELSE
BEGIN
    PRINT 'Table TR_LCC_LandedCostComponent already exists - skipping';
END
GO

-- ============================================================================
-- 3. TM_LOT_SupplyLot (Master: supply lots)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_LOT_SupplyLot')
BEGIN
    CREATE TABLE [dbo].[TM_LOT_SupplyLot] (
        [lot_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [lot_reference] NVARCHAR(100) NOT NULL,
        [lot_name] NVARCHAR(200) NULL,
        [lot_description] NVARCHAR(1000) NULL,

        -- Supplier
        [lot_sup_id] INT NULL,

        -- Geography
        [lot_origin_country_id] INT NULL,
        [lot_destination_country_id] INT NULL,

        -- Dates
        [lot_ship_date] DATETIME NULL,
        [lot_eta_date] DATETIME NULL,
        [lot_arrival_date] DATETIME NULL,

        -- Status
        [lot_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_Status] DEFAULT ('DRAFT'),

        -- Currency and organization
        [lot_cur_id] INT NULL,
        [lot_soc_id] INT NULL,
        [lot_bu_id] INT NULL,

        -- Computed totals (items)
        [lot_total_items] INT NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_TotalItems] DEFAULT (0),
        [lot_total_quantity] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_TotalQty] DEFAULT (0),
        [lot_total_weight_kg] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_TotalWeight] DEFAULT (0),
        [lot_total_volume_cbm] DECIMAL(18, 6) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_TotalVolume] DEFAULT (0),
        [lot_total_value] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_TotalValue] DEFAULT (0),

        -- Computed totals (costs)
        [lot_total_freight_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_FreightCost] DEFAULT (0),
        [lot_total_customs_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_CustomsCost] DEFAULT (0),
        [lot_total_insurance_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_InsuranceCost] DEFAULT (0),
        [lot_total_local_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_LocalCost] DEFAULT (0),
        [lot_total_other_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_OtherCost] DEFAULT (0),
        [lot_total_landed_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_LandedCost] DEFAULT (0),

        -- Allocation
        [lot_allocation_strategy] NVARCHAR(20) NULL,
        [lot_allocation_completed] BIT NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_AllocCompleted] DEFAULT (0),
        [lot_allocation_date] DATETIME NULL,

        -- Notes
        [lot_notes] NVARCHAR(4000) NULL,

        -- Audit
        [lot_created_at] DATETIME NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLot_CreatedAt] DEFAULT (GETDATE()),
        [lot_updated_at] DATETIME NULL,
        [lot_created_by] INT NULL,
        [lot_updated_by] INT NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_LOT_SupplyLot_Supplier]
            FOREIGN KEY ([lot_sup_id]) REFERENCES [dbo].[TM_SUP_Supplier]([sup_id])
    );

    CREATE INDEX [IX_TM_LOT_SupplyLot_Reference]
        ON [dbo].[TM_LOT_SupplyLot] ([lot_reference]);

    CREATE INDEX [IX_TM_LOT_SupplyLot_Status]
        ON [dbo].[TM_LOT_SupplyLot] ([lot_status]);

    CREATE INDEX [IX_TM_LOT_SupplyLot_Supplier]
        ON [dbo].[TM_LOT_SupplyLot] ([lot_sup_id]);

    CREATE INDEX [IX_TM_LOT_SupplyLot_Society]
        ON [dbo].[TM_LOT_SupplyLot] ([lot_soc_id]);

    PRINT 'Created table TM_LOT_SupplyLot';
END
ELSE
BEGIN
    PRINT 'Table TM_LOT_SupplyLot already exists - skipping';
END
GO

-- ============================================================================
-- 4. TM_LOT_SupplyLotItem (Line items for supply lots)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_LOT_SupplyLotItem')
BEGIN
    CREATE TABLE [dbo].[TM_LOT_SupplyLotItem] (
        [sli_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [sli_lot_id] INT NOT NULL,
        [sli_prd_id] INT NULL,
        [sli_pit_id] INT NULL,
        [sli_description] NVARCHAR(500) NULL,
        [sli_sku] NVARCHAR(100) NULL,

        -- Quantities and pricing
        [sli_quantity] INT NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_Qty] DEFAULT (1),
        [sli_unit_price] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_UnitPrice] DEFAULT (0),
        [sli_total_price] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_TotalPrice] DEFAULT (0),

        -- Weight and volume
        [sli_weight_kg] DECIMAL(18, 4) NULL,
        [sli_volume_cbm] DECIMAL(18, 6) NULL,
        [sli_unit_weight_kg] DECIMAL(18, 4) NULL,
        [sli_unit_volume_cbm] DECIMAL(18, 6) NULL,

        -- Allocated costs
        [sli_allocated_freight] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_AllocFreight] DEFAULT (0),
        [sli_allocated_customs] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_AllocCustoms] DEFAULT (0),
        [sli_allocated_insurance] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_AllocInsurance] DEFAULT (0),
        [sli_allocated_local] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_AllocLocal] DEFAULT (0),
        [sli_allocated_other] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_AllocOther] DEFAULT (0),
        [sli_total_allocated_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_TotalAlloc] DEFAULT (0),

        -- Landed cost
        [sli_landed_cost_per_unit] DECIMAL(18, 4) NULL,
        [sli_total_landed_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_TotalLanded] DEFAULT (0),

        -- Sort order
        [sli_sort_order] INT NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_SortOrder] DEFAULT (0),

        -- Audit
        [sli_created_at] DATETIME NOT NULL CONSTRAINT [DF_TM_LOT_SupplyLotItem_CreatedAt] DEFAULT (GETDATE()),
        [sli_updated_at] DATETIME NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_LOT_SupplyLotItem_Lot]
            FOREIGN KEY ([sli_lot_id]) REFERENCES [dbo].[TM_LOT_SupplyLot]([lot_id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_TM_LOT_SupplyLotItem_Product]
            FOREIGN KEY ([sli_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );

    CREATE INDEX [IX_TM_LOT_SupplyLotItem_Lot]
        ON [dbo].[TM_LOT_SupplyLotItem] ([sli_lot_id]);

    CREATE INDEX [IX_TM_LOT_SupplyLotItem_Product]
        ON [dbo].[TM_LOT_SupplyLotItem] ([sli_prd_id]);

    PRINT 'Created table TM_LOT_SupplyLotItem';
END
ELSE
BEGIN
    PRINT 'Table TM_LOT_SupplyLotItem already exists - skipping';
END
GO

-- ============================================================================
-- 5. TM_FRC_FreightCost (Freight/customs/insurance costs per lot)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_FRC_FreightCost')
BEGIN
    CREATE TABLE [dbo].[TM_FRC_FreightCost] (
        [frc_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [frc_lot_id] INT NOT NULL,
        [frc_type] NVARCHAR(20) NOT NULL,
        [frc_description] NVARCHAR(500) NULL,

        -- Amount
        [frc_amount] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_FRC_FreightCost_Amount] DEFAULT (0),
        [frc_cur_id] INT NULL,
        [frc_exchange_rate] DECIMAL(18, 6) NOT NULL CONSTRAINT [DF_TM_FRC_FreightCost_ExRate] DEFAULT (1),
        [frc_amount_converted] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_FRC_FreightCost_AmtConverted] DEFAULT (0),

        -- Vendor info
        [frc_vendor_name] NVARCHAR(200) NULL,
        [frc_invoice_ref] NVARCHAR(100) NULL,
        [frc_invoice_date] DATETIME NULL,

        -- Payment status
        [frc_is_paid] BIT NOT NULL CONSTRAINT [DF_TM_FRC_FreightCost_IsPaid] DEFAULT (0),
        [frc_paid_date] DATETIME NULL,

        -- Notes
        [frc_notes] NVARCHAR(2000) NULL,

        -- Audit
        [frc_created_at] DATETIME NOT NULL CONSTRAINT [DF_TM_FRC_FreightCost_CreatedAt] DEFAULT (GETDATE()),
        [frc_updated_at] DATETIME NULL,
        [frc_created_by] INT NULL,
        [frc_updated_by] INT NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_FRC_FreightCost_Lot]
            FOREIGN KEY ([frc_lot_id]) REFERENCES [dbo].[TM_LOT_SupplyLot]([lot_id])
            ON DELETE CASCADE
    );

    CREATE INDEX [IX_TM_FRC_FreightCost_Lot]
        ON [dbo].[TM_FRC_FreightCost] ([frc_lot_id]);

    CREATE INDEX [IX_TM_FRC_FreightCost_Type]
        ON [dbo].[TM_FRC_FreightCost] ([frc_type]);

    PRINT 'Created table TM_FRC_FreightCost';
END
ELSE
BEGIN
    PRINT 'Table TM_FRC_FreightCost already exists - skipping';
END
GO

-- ============================================================================
-- 6. TM_PLC_ProductLandedCost (Computed landed cost per product)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_PLC_ProductLandedCost')
BEGIN
    CREATE TABLE [dbo].[TM_PLC_ProductLandedCost] (
        [plc_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [plc_prd_id] INT NOT NULL,
        [plc_lot_id] INT NULL,
        [plc_sli_id] INT NULL,

        -- Cost breakdown
        [plc_unit_purchase_price] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_UnitPP] DEFAULT (0),
        [plc_allocated_freight] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Freight] DEFAULT (0),
        [plc_allocated_customs] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Customs] DEFAULT (0),
        [plc_allocated_insurance] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Insurance] DEFAULT (0),
        [plc_allocated_other] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Other] DEFAULT (0),
        [plc_total_landed_cost_per_unit] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_TotalLanded] DEFAULT (0),

        -- Quantity and total
        [plc_quantity] INT NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Qty] DEFAULT (1),
        [plc_total_landed_cost] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_Total] DEFAULT (0),

        -- Strategy used
        [plc_strategy] NVARCHAR(20) NULL,

        -- Currency
        [plc_cur_id] INT NULL,

        -- Status
        [plc_is_current] BIT NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_IsCurrent] DEFAULT (1),

        -- Audit
        [plc_calculated_at] DATETIME NOT NULL CONSTRAINT [DF_TM_PLC_ProductLandedCost_CalcAt] DEFAULT (GETDATE()),
        [plc_calculated_by] INT NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_PLC_ProductLandedCost_Product]
            FOREIGN KEY ([plc_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id]),
        CONSTRAINT [FK_TM_PLC_ProductLandedCost_Lot]
            FOREIGN KEY ([plc_lot_id]) REFERENCES [dbo].[TM_LOT_SupplyLot]([lot_id]),
        CONSTRAINT [FK_TM_PLC_ProductLandedCost_Item]
            FOREIGN KEY ([plc_sli_id]) REFERENCES [dbo].[TM_LOT_SupplyLotItem]([sli_id])
    );

    CREATE INDEX [IX_TM_PLC_ProductLandedCost_Product]
        ON [dbo].[TM_PLC_ProductLandedCost] ([plc_prd_id]);

    CREATE INDEX [IX_TM_PLC_ProductLandedCost_Lot]
        ON [dbo].[TM_PLC_ProductLandedCost] ([plc_lot_id]);

    CREATE INDEX [IX_TM_PLC_ProductLandedCost_Current]
        ON [dbo].[TM_PLC_ProductLandedCost] ([plc_prd_id], [plc_is_current])
        WHERE [plc_is_current] = 1;

    PRINT 'Created table TM_PLC_ProductLandedCost';
END
ELSE
BEGIN
    PRINT 'Table TM_PLC_ProductLandedCost already exists - skipping';
END
GO

-- ============================================================================
-- 7. TM_LCH_LandedCostHistory (History of cost calculations)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_LCH_LandedCostHistory')
BEGIN
    CREATE TABLE [dbo].[TM_LCH_LandedCostHistory] (
        [lch_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [lch_lot_id] INT NOT NULL,
        [lch_prd_id] INT NULL,
        [lch_sli_id] INT NULL,

        -- Snapshot of costs at calculation time
        [lch_strategy] NVARCHAR(20) NOT NULL,
        [lch_unit_purchase_price] DECIMAL(18, 4) NULL,
        [lch_allocated_freight] DECIMAL(18, 4) NULL,
        [lch_allocated_customs] DECIMAL(18, 4) NULL,
        [lch_allocated_insurance] DECIMAL(18, 4) NULL,
        [lch_allocated_other] DECIMAL(18, 4) NULL,
        [lch_landed_cost_per_unit] DECIMAL(18, 4) NULL,
        [lch_total_landed_cost] DECIMAL(18, 4) NULL,

        -- Notes
        [lch_notes] NVARCHAR(2000) NULL,

        -- Audit
        [lch_calculated_at] DATETIME NOT NULL CONSTRAINT [DF_TM_LCH_LandedCostHistory_CalcAt] DEFAULT (GETDATE()),
        [lch_calculated_by] INT NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_LCH_LandedCostHistory_Lot]
            FOREIGN KEY ([lch_lot_id]) REFERENCES [dbo].[TM_LOT_SupplyLot]([lot_id]),
        CONSTRAINT [FK_TM_LCH_LandedCostHistory_Product]
            FOREIGN KEY ([lch_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
    );

    CREATE INDEX [IX_TM_LCH_LandedCostHistory_Lot]
        ON [dbo].[TM_LCH_LandedCostHistory] ([lch_lot_id]);

    CREATE INDEX [IX_TM_LCH_LandedCostHistory_Product]
        ON [dbo].[TM_LCH_LandedCostHistory] ([lch_prd_id]);

    PRINT 'Created table TM_LCH_LandedCostHistory';
END
ELSE
BEGIN
    PRINT 'Table TM_LCH_LandedCostHistory already exists - skipping';
END
GO

-- ============================================================================
-- 8. TM_LCL_LandedCostLog (Allocation log entries)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_LCL_LandedCostLog')
BEGIN
    CREATE TABLE [dbo].[TM_LCL_LandedCostLog] (
        [lcl_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [lcl_lot_id] INT NOT NULL,
        [lcl_strategy] NVARCHAR(20) NOT NULL,
        [lcl_status] NVARCHAR(20) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Status] DEFAULT ('PENDING'),

        -- Cost totals at time of allocation
        [lcl_total_freight] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Freight] DEFAULT (0),
        [lcl_total_customs] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Customs] DEFAULT (0),
        [lcl_total_insurance] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Insurance] DEFAULT (0),
        [lcl_total_local] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Local] DEFAULT (0),
        [lcl_total_other] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_Other] DEFAULT (0),
        [lcl_total_allocated] DECIMAL(18, 4) NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_TotalAlloc] DEFAULT (0),

        -- Item count
        [lcl_items_count] INT NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_ItemsCount] DEFAULT (0),

        -- Error tracking
        [lcl_error_message] NVARCHAR(2000) NULL,

        -- Audit
        [lcl_calculated_at] DATETIME NOT NULL CONSTRAINT [DF_TM_LCL_LandedCostLog_CalcAt] DEFAULT (GETDATE()),
        [lcl_calculated_by] INT NULL,

        -- Foreign keys
        CONSTRAINT [FK_TM_LCL_LandedCostLog_Lot]
            FOREIGN KEY ([lcl_lot_id]) REFERENCES [dbo].[TM_LOT_SupplyLot]([lot_id])
            ON DELETE CASCADE
    );

    CREATE INDEX [IX_TM_LCL_LandedCostLog_Lot]
        ON [dbo].[TM_LCL_LandedCostLog] ([lcl_lot_id]);

    PRINT 'Created table TM_LCL_LandedCostLog';
END
ELSE
BEGIN
    PRINT 'Table TM_LCL_LandedCostLog already exists - skipping';
END
GO

-- ============================================================================
-- Record migration in history
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.8')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory]
        ([version], [description], [filename], [execution_time_ms], [success])
    VALUES
        ('V1.0.0.8', 'Create Landed Cost tables (profiles, components, lots, items, freight costs, product landed costs, history, logs)', 'V1.0.0.8__create_landed_cost_tables.sql', 0, 1);
    PRINT 'Recorded migration V1.0.0.8';
END
GO

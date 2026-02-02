-- =============================================
-- Migration: V1.1.1.5 - Stock Movement Tables
-- Description: Create TM_STK_StockMovement and TM_STK_StockMovementLine tables
-- Author: System
-- Date: 2026-01-31
-- =============================================

-- Check if tables exist before creating
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_STK_StockMovement]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_STK_StockMovement] (
        -- Primary Key
        [stm_id] INT IDENTITY(1,1) NOT NULL,

        -- Reference - unique movement number
        [stm_reference] NVARCHAR(50) NOT NULL,

        -- Movement Type: RECEIPT, SHIPMENT, TRANSFER, ADJUSTMENT, RETURN_IN, RETURN_OUT, DAMAGE, DESTROY, LOAN_OUT, LOAN_IN
        [stm_type] NVARCHAR(20) NOT NULL,

        -- Status: DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED, PARTIALLY
        [stm_status] NVARCHAR(20) NOT NULL DEFAULT 'DRAFT',

        -- Movement Date/Time
        [stm_date] DATETIME NOT NULL,

        -- Description/Notes
        [stm_description] NVARCHAR(MAX) NULL,

        -- Warehouse References
        [stm_whs_id] INT NULL,  -- Primary warehouse (source for outbound, destination for inbound)
        [stm_whs_destination_id] INT NULL,  -- Destination warehouse (for transfers)

        -- Client/Supplier Reference
        [stm_cli_id] INT NULL,
        [stm_sup_id] INT NULL,

        -- External party name (when not linked to client/supplier)
        [stm_external_party] NVARCHAR(200) NULL,

        -- Loan/Borrow tracking
        [stm_is_loan] BIT NOT NULL DEFAULT 0,
        [stm_loan_return_date] DATETIME NULL,  -- Expected return date for loans
        [stm_loan_returned] BIT NOT NULL DEFAULT 0,
        [stm_loan_return_actual_date] DATETIME NULL,

        -- Return tracking
        [stm_is_return] BIT NOT NULL DEFAULT 0,
        [stm_return_reason] NVARCHAR(500) NULL,

        -- Damage/Destroy flags
        [stm_is_damage] BIT NOT NULL DEFAULT 0,
        [stm_is_destroy] BIT NOT NULL DEFAULT 0,

        -- Totals
        [stm_total_quantity] DECIMAL(18,4) NOT NULL DEFAULT 0,
        [stm_total_quantity_actual] DECIMAL(18,4) NULL,  -- Actual received/shipped quantity
        [stm_total_value] DECIMAL(18,4) NOT NULL DEFAULT 0,
        [stm_total_lines] INT NOT NULL DEFAULT 0,

        -- Reference Documents
        [stm_source_document] NVARCHAR(100) NULL,  -- e.g., PO number, SO number
        [stm_source_document_id] INT NULL,  -- Generic foreign key to source document

        -- Shipping/Tracking
        [stm_tracking_number] NVARCHAR(100) NULL,
        [stm_carrier] NVARCHAR(100) NULL,

        -- Validation
        [stm_is_valid] BIT NOT NULL DEFAULT 1,
        [stm_validated_at] DATETIME NULL,
        [stm_validated_by] INT NULL,

        -- Organization
        [stm_soc_id] INT NULL,

        -- Notes
        [stm_notes] NVARCHAR(MAX) NULL,

        -- Audit
        [stm_created_by] INT NULL,
        [stm_created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [stm_updated_at] DATETIME NULL,

        -- Constraints
        CONSTRAINT [PK_TM_STK_StockMovement] PRIMARY KEY CLUSTERED ([stm_id] ASC),
        CONSTRAINT [UQ_TM_STK_StockMovement_Reference] UNIQUE ([stm_reference])
    );

    PRINT 'Table TM_STK_StockMovement created successfully.';
END
ELSE
BEGIN
    PRINT 'Table TM_STK_StockMovement already exists.';
END
GO

-- Create indexes for TM_STK_StockMovement
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Type' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Type] ON [dbo].[TM_STK_StockMovement] ([stm_type] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Status' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Status] ON [dbo].[TM_STK_StockMovement] ([stm_status] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Date' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Date] ON [dbo].[TM_STK_StockMovement] ([stm_date] DESC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Warehouse' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Warehouse] ON [dbo].[TM_STK_StockMovement] ([stm_whs_id] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Client' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Client] ON [dbo].[TM_STK_StockMovement] ([stm_cli_id] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovement_Society' AND object_id = OBJECT_ID('TM_STK_StockMovement'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovement_Society] ON [dbo].[TM_STK_StockMovement] ([stm_soc_id] ASC);
END
GO

-- =============================================
-- TM_STK_StockMovementLine Table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_STK_StockMovementLine]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_STK_StockMovementLine] (
        -- Primary Key
        [sml_id] INT IDENTITY(1,1) NOT NULL,

        -- Foreign Key - Parent Movement
        [sml_stm_id] INT NOT NULL,

        -- Product Reference
        [sml_prd_id] INT NULL,
        [sml_pit_id] INT NULL,

        -- Product Details (denormalized for history/audit)
        [sml_prd_ref] NVARCHAR(100) NULL,
        [sml_prd_name] NVARCHAR(200) NULL,
        [sml_description] NVARCHAR(500) NULL,

        -- Quantities
        [sml_quantity] DECIMAL(18,4) NOT NULL,
        [sml_quantity_actual] DECIMAL(18,4) NULL,  -- Actual quantity (may differ from expected)

        -- Unit of Measure
        [sml_uom_id] INT NULL,

        -- Pricing
        [sml_unit_price] DECIMAL(18,4) NULL,
        [sml_total_price] DECIMAL(18,4) NULL,

        -- Cost (for inventory valuation)
        [sml_unit_cost] DECIMAL(18,4) NULL,
        [sml_total_cost] DECIMAL(18,4) NULL,

        -- Location within warehouse
        [sml_location] NVARCHAR(50) NULL,  -- Bin/shelf location

        -- Batch/Serial tracking
        [sml_batch_number] NVARCHAR(50) NULL,
        [sml_serial_number] NVARCHAR(100) NULL,
        [sml_expiry_date] DATETIME NULL,

        -- Inventory Reference (for stock updates)
        [sml_inv_id] INT NULL,  -- Reference to inventory record

        -- Source Document Line References
        [sml_source_line_id] INT NULL,  -- Generic FK to source line (e.g., PO line, SO line)
        [sml_source_line_type] NVARCHAR(20) NULL,  -- Type of source line (POL, SOL, etc.)

        -- Damage/Quality Notes
        [sml_is_damaged] BIT NOT NULL DEFAULT 0,
        [sml_damage_notes] NVARCHAR(500) NULL,

        -- Sort Order
        [sml_sort_order] INT NOT NULL DEFAULT 0,

        -- Audit
        [sml_created_at] DATETIME NOT NULL DEFAULT GETDATE(),
        [sml_updated_at] DATETIME NULL,

        -- Constraints
        CONSTRAINT [PK_TM_STK_StockMovementLine] PRIMARY KEY CLUSTERED ([sml_id] ASC),
        CONSTRAINT [FK_TM_STK_StockMovementLine_Movement] FOREIGN KEY ([sml_stm_id])
            REFERENCES [dbo].[TM_STK_StockMovement] ([stm_id]) ON DELETE CASCADE
    );

    PRINT 'Table TM_STK_StockMovementLine created successfully.';
END
ELSE
BEGIN
    PRINT 'Table TM_STK_StockMovementLine already exists.';
END
GO

-- Create indexes for TM_STK_StockMovementLine
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovementLine_Movement' AND object_id = OBJECT_ID('TM_STK_StockMovementLine'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovementLine_Movement] ON [dbo].[TM_STK_StockMovementLine] ([sml_stm_id] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovementLine_Product' AND object_id = OBJECT_ID('TM_STK_StockMovementLine'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovementLine_Product] ON [dbo].[TM_STK_StockMovementLine] ([sml_prd_id] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovementLine_ProductInstance' AND object_id = OBJECT_ID('TM_STK_StockMovementLine'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovementLine_ProductInstance] ON [dbo].[TM_STK_StockMovementLine] ([sml_pit_id] ASC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_STK_StockMovementLine_Batch' AND object_id = OBJECT_ID('TM_STK_StockMovementLine'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_STK_StockMovementLine_Batch] ON [dbo].[TM_STK_StockMovementLine] ([sml_batch_number] ASC);
END
GO

-- Add foreign key constraints (optional - uncomment if referenced tables exist)
-- Note: These are commented out as the referenced tables may not exist in all environments

/*
-- Foreign Keys for TM_STK_StockMovement
ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_Warehouse]
    FOREIGN KEY ([stm_whs_id]) REFERENCES [dbo].[TR_WHS_Warehouse] ([whs_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_DestWarehouse]
    FOREIGN KEY ([stm_whs_destination_id]) REFERENCES [dbo].[TR_WHS_Warehouse] ([whs_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_Client]
    FOREIGN KEY ([stm_cli_id]) REFERENCES [dbo].[TM_CLI_Client] ([cli_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_Supplier]
    FOREIGN KEY ([stm_sup_id]) REFERENCES [dbo].[TM_SUP_Supplier] ([sup_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_ValidatedBy]
    FOREIGN KEY ([stm_validated_by]) REFERENCES [dbo].[TM_USR_User] ([usr_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_Society]
    FOREIGN KEY ([stm_soc_id]) REFERENCES [dbo].[TR_SOC_Society] ([soc_id]);

ALTER TABLE [dbo].[TM_STK_StockMovement] ADD CONSTRAINT [FK_TM_STK_StockMovement_CreatedBy]
    FOREIGN KEY ([stm_created_by]) REFERENCES [dbo].[TM_USR_User] ([usr_id]);

-- Foreign Keys for TM_STK_StockMovementLine
ALTER TABLE [dbo].[TM_STK_StockMovementLine] ADD CONSTRAINT [FK_TM_STK_StockMovementLine_Product]
    FOREIGN KEY ([sml_prd_id]) REFERENCES [dbo].[TM_PRD_Product] ([prd_id]);

ALTER TABLE [dbo].[TM_STK_StockMovementLine] ADD CONSTRAINT [FK_TM_STK_StockMovementLine_ProductInstance]
    FOREIGN KEY ([sml_pit_id]) REFERENCES [dbo].[TM_PRD_ProductInstance] ([pit_id]);

ALTER TABLE [dbo].[TM_STK_StockMovementLine] ADD CONSTRAINT [FK_TM_STK_StockMovementLine_UOM]
    FOREIGN KEY ([sml_uom_id]) REFERENCES [dbo].[TR_UOM_UnitOfMeasure] ([uom_id]);
*/

PRINT 'Stock Movement tables migration completed successfully.';
GO

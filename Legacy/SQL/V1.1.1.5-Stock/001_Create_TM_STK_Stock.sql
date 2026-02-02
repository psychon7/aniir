-- =============================================
-- Migration: V1.1.1.5 - Create TM_STK_Stock Table
-- Description: Creates the Stock master table for inventory tracking
-- Date: 2026-01-31
-- =============================================

-- Create Stock master table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_STK_Stock]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.TM_STK_Stock
    (
        stk_id                  int identity(1,1)   primary key,
        soc_id                  int                 not null,
        prd_id                  int                 not null,
        pit_id                  int                 null,           -- Product Instance (SKU/variant), nullable for products without variants
        whs_id                  int                 null,           -- Warehouse ID, nullable for default location
        stk_quantity            decimal(18,4)       not null default(0),
        stk_quantity_reserved   decimal(18,4)       not null default(0),
        stk_quantity_available  decimal(18,4)       not null default(0), -- Computed: stk_quantity - stk_quantity_reserved
        stk_min_quantity        decimal(18,4)       null,           -- Reorder point
        stk_max_quantity        decimal(18,4)       null,           -- Maximum stock level
        stk_reorder_quantity    decimal(18,4)       null,           -- Quantity to order when at min level
        stk_location            nvarchar(100)       null,           -- Bin/shelf location code
        stk_unit_cost           decimal(18,4)       null,           -- Average unit cost
        stk_total_value         decimal(18,4)       null,           -- Total value (computed: stk_quantity * stk_unit_cost)
        stk_d_last_count        datetime            null,           -- Last physical inventory count date
        stk_d_last_movement     datetime            null,           -- Last stock movement date
        stk_d_creation          datetime            not null default(getdate()),
        stk_d_update            datetime            not null default(getdate()),
        stk_is_active           bit                 not null default(1),
        stk_notes               nvarchar(2000)      null,

        -- Foreign key constraints
        CONSTRAINT FK_STK_SOC FOREIGN KEY (soc_id) REFERENCES TR_SOC_Society(soc_id),
        CONSTRAINT FK_STK_PRD FOREIGN KEY (prd_id) REFERENCES TM_PRD_Product(prd_id),

        -- Unique constraint for product/warehouse/instance combination
        CONSTRAINT UQ_STK_Product_Warehouse_Instance UNIQUE (soc_id, prd_id, whs_id, pit_id)
    )

    -- Create indexes for common query patterns
    CREATE NONCLUSTERED INDEX IX_STK_SocId ON TM_STK_Stock(soc_id)
    CREATE NONCLUSTERED INDEX IX_STK_PrdId ON TM_STK_Stock(prd_id)
    CREATE NONCLUSTERED INDEX IX_STK_PitId ON TM_STK_Stock(pit_id) WHERE pit_id IS NOT NULL
    CREATE NONCLUSTERED INDEX IX_STK_WhsId ON TM_STK_Stock(whs_id) WHERE whs_id IS NOT NULL
    CREATE NONCLUSTERED INDEX IX_STK_Location ON TM_STK_Stock(stk_location) WHERE stk_location IS NOT NULL
    CREATE NONCLUSTERED INDEX IX_STK_LowStock ON TM_STK_Stock(soc_id, stk_quantity_available, stk_min_quantity)
        WHERE stk_is_active = 1 AND stk_min_quantity IS NOT NULL
    CREATE NONCLUSTERED INDEX IX_STK_Active ON TM_STK_Stock(soc_id, stk_is_active)

    PRINT 'Table TM_STK_Stock created successfully.'
END
ELSE
BEGIN
    PRINT 'Table TM_STK_Stock already exists.'
END
GO

-- Add foreign key to TM_PIT_Product_Instance if the table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_PIT_Product_Instance]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_STK_PIT')
    BEGIN
        ALTER TABLE TM_STK_Stock
        ADD CONSTRAINT FK_STK_PIT FOREIGN KEY (pit_id) REFERENCES TM_PIT_Product_Instance(pit_id)
        PRINT 'Foreign key FK_STK_PIT added successfully.'
    END
END
GO

-- Add foreign key to TM_WHS_Warehouse if the table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_WHS_Warehouse]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_STK_WHS')
    BEGIN
        ALTER TABLE TM_STK_Stock
        ADD CONSTRAINT FK_STK_WHS FOREIGN KEY (whs_id) REFERENCES TM_WHS_Warehouse(whs_id)
        PRINT 'Foreign key FK_STK_WHS added successfully.'
    END
END
GO

-- Create trigger to automatically calculate available quantity and total value
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_STK_CalculateValues')
BEGIN
    DROP TRIGGER TR_STK_CalculateValues
END
GO

CREATE TRIGGER TR_STK_CalculateValues
ON TM_STK_Stock
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Update computed values
    UPDATE s
    SET
        stk_quantity_available = s.stk_quantity - s.stk_quantity_reserved,
        stk_total_value = CASE
            WHEN s.stk_unit_cost IS NOT NULL THEN s.stk_quantity * s.stk_unit_cost
            ELSE NULL
        END,
        stk_d_update = GETDATE()
    FROM TM_STK_Stock s
    INNER JOIN inserted i ON s.stk_id = i.stk_id
END
GO

PRINT 'Trigger TR_STK_CalculateValues created successfully.'
GO

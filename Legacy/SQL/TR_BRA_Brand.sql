-- =============================================
-- Table: TR_BRA_Brand
-- Description: Brand reference table
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_BRA_Brand]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TR_BRA_Brand] (
        [bra_id] INT IDENTITY(1,1) NOT NULL,
        [soc_id] INT NOT NULL,
        [bra_code] NVARCHAR(50) NOT NULL,
        [bra_name] NVARCHAR(100) NOT NULL,
        [bra_description] NVARCHAR(500) NULL,
        [bra_is_actived] BIT NOT NULL DEFAULT(1),
        CONSTRAINT [PK_TR_BRA_Brand] PRIMARY KEY CLUSTERED ([bra_id] ASC),
        CONSTRAINT [FK_TR_BRA_Brand_TM_SOC_Society] FOREIGN KEY ([soc_id]) REFERENCES [dbo].[TM_SOC_Society]([soc_id])
    )

    PRINT 'Table TR_BRA_Brand created successfully'
END
ELSE
BEGIN
    PRINT 'Table TR_BRA_Brand already exists'
END
GO

-- Create index on soc_id for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TR_BRA_Brand_soc_id' AND object_id = OBJECT_ID('TR_BRA_Brand'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TR_BRA_Brand_soc_id] ON [dbo].[TR_BRA_Brand]
    (
        [soc_id] ASC
    )
    PRINT 'Index IX_TR_BRA_Brand_soc_id created successfully'
END
GO

-- Create unique constraint on code within society
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_TR_BRA_Brand_code_soc' AND object_id = OBJECT_ID('TR_BRA_Brand'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_TR_BRA_Brand_code_soc] ON [dbo].[TR_BRA_Brand]
    (
        [soc_id] ASC,
        [bra_code] ASC
    )
    PRINT 'Unique index UQ_TR_BRA_Brand_code_soc created successfully'
END
GO

-- Add foreign key to TM_PRD_Product if bra_id column doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TM_PRD_Product]') AND name = 'bra_id')
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
    ADD [bra_id] INT NULL

    PRINT 'Column bra_id added to TM_PRD_Product'
END
GO

-- Add foreign key constraint
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TM_PRD_Product_TR_BRA_Brand')
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
    ADD CONSTRAINT [FK_TM_PRD_Product_TR_BRA_Brand]
    FOREIGN KEY ([bra_id]) REFERENCES [dbo].[TR_BRA_Brand]([bra_id])

    PRINT 'Foreign key FK_TM_PRD_Product_TR_BRA_Brand created successfully'
END
GO

-- Insert sample data (optional - uncomment if needed)
/*
INSERT INTO [dbo].[TR_BRA_Brand] ([soc_id], [bra_code], [bra_name], [bra_description], [bra_is_actived])
VALUES
(1, 'BRD001', 'Brand A', 'First sample brand', 1),
(1, 'BRD002', 'Brand B', 'Second sample brand', 1),
(1, 'BRD003', 'Brand C', 'Third sample brand', 0);
*/

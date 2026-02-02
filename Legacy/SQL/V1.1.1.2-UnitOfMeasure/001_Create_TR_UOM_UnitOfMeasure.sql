-- =============================================
-- Migration: V1.1.1.2 - Create TR_UOM_UnitOfMeasure Table
-- Description: Creates the Unit of Measure reference table
-- Date: 2026-01-31
-- =============================================

-- Create Unit of Measure reference table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_UOM_UnitOfMeasure]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.TR_UOM_UnitOfMeasure
    (
        uom_id              int identity(1,1)   primary key,
        uom_code            nvarchar(20)        not null,
        uom_designation     nvarchar(200)       not null,
        uom_description     nvarchar(500)       null,
        uom_isactive        bit                 not null default(1),

        CONSTRAINT UQ_UOM_Code UNIQUE (uom_code)
    )

    PRINT 'Table TR_UOM_UnitOfMeasure created successfully.'
END
ELSE
BEGIN
    PRINT 'Table TR_UOM_UnitOfMeasure already exists.'
END
GO

-- Insert default units of measure
IF NOT EXISTS (SELECT * FROM TR_UOM_UnitOfMeasure WHERE uom_code = 'PC')
BEGIN
    INSERT INTO TR_UOM_UnitOfMeasure (uom_code, uom_designation, uom_description, uom_isactive)
    VALUES
        ('PC', 'Piece', 'Individual unit/piece', 1),
        ('KG', 'Kilogram', 'Weight in kilograms', 1),
        ('G', 'Gram', 'Weight in grams', 1),
        ('L', 'Liter', 'Volume in liters', 1),
        ('ML', 'Milliliter', 'Volume in milliliters', 1),
        ('M', 'Meter', 'Length in meters', 1),
        ('CM', 'Centimeter', 'Length in centimeters', 1),
        ('MM', 'Millimeter', 'Length in millimeters', 1),
        ('M2', 'Square Meter', 'Area in square meters', 1),
        ('M3', 'Cubic Meter', 'Volume in cubic meters', 1),
        ('BOX', 'Box', 'Box/carton packaging', 1),
        ('PAL', 'Pallet', 'Pallet packaging', 1),
        ('SET', 'Set', 'Set of items', 1),
        ('ROLL', 'Roll', 'Roll packaging (e.g., LED strips)', 1),
        ('PAIR', 'Pair', 'Pair of items', 1)

    PRINT 'Default units of measure inserted successfully.'
END
ELSE
BEGIN
    PRINT 'Default units of measure already exist.'
END
GO

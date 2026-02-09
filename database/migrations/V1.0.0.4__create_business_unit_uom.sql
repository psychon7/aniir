-- Migration V1.0.0.4: Create BusinessUnit and UnitOfMeasure tables
-- These tables are referenced by lookup service and multi-business features

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TR_BU_BusinessUnit')
CREATE TABLE TR_BU_BusinessUnit (
    bu_id INT IDENTITY(1,1) PRIMARY KEY,
    bu_name NVARCHAR(200) NOT NULL,
    bu_code NVARCHAR(50) NULL,
    bu_description NVARCHAR(500) NULL,
    bu_is_active BIT NOT NULL DEFAULT 1,
    bu_color NVARCHAR(50) NULL,
    bu_d_creation DATETIME DEFAULT GETDATE(),
    bu_d_update DATETIME NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TR_UOM_UnitOfMeasure')
CREATE TABLE TR_UOM_UnitOfMeasure (
    uom_id INT IDENTITY(1,1) PRIMARY KEY,
    uom_name NVARCHAR(100) NOT NULL,
    uom_code NVARCHAR(20) NOT NULL,
    uom_description NVARCHAR(500) NULL,
    uom_is_active BIT NOT NULL DEFAULT 1,
    uom_d_creation DATETIME DEFAULT GETDATE(),
    uom_d_update DATETIME NULL
);

-- Record migration
INSERT INTO migration_history (version, description, applied_at)
VALUES ('V1.0.0.4', 'Create BusinessUnit and UnitOfMeasure tables', GETDATE());

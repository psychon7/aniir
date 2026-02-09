-- ============================================================================
-- Migration: V1.0.0.11
-- Description: Create TM_CON_CONSIGNEE table (legacy table, may already exist)
-- Date: 2026-02-09
-- ============================================================================

-- Create the Consignee table if it does not already exist
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TM_CON_CONSIGNEE')
BEGIN
    CREATE TABLE [dbo].[TM_CON_CONSIGNEE] (
        [con_id]                  INT IDENTITY(1,1) NOT NULL,
        [con_firstname]           NVARCHAR(200)     NULL,
        [con_lastname]            NVARCHAR(200)     NULL,
        [civ_id]                  INT               NOT NULL,
        [con_code]                NVARCHAR(200)     NULL,
        [con_adresse_title]       NVARCHAR(200)     NULL,
        [con_address1]            NVARCHAR(200)     NULL,
        [con_address2]            NVARCHAR(200)     NULL,
        [con_address3]            NVARCHAR(200)     NULL,
        [con_postcode]            NVARCHAR(50)      NULL,
        [con_city]                NVARCHAR(200)     NULL,
        [con_province]            NVARCHAR(200)     NULL,
        [con_country]             NVARCHAR(200)     NULL,
        [con_tel1]                NVARCHAR(100)     NULL,
        [con_tel2]                NVARCHAR(100)     NULL,
        [con_fax]                 NVARCHAR(100)     NULL,
        [con_cellphone]           NVARCHAR(100)     NULL,
        [con_email]               NVARCHAR(200)     NULL,
        [con_recieve_newsletter]  BIT               NOT NULL DEFAULT 0,
        [con_newsletter_email]    NVARCHAR(200)     NULL,
        [con_is_delivery_adr]     BIT               NOT NULL DEFAULT 0,
        [con_is_invoicing_adr]    BIT               NOT NULL DEFAULT 0,
        [usr_created_by]          INT               NOT NULL,
        [soc_id]                  INT               NOT NULL,
        [con_d_creation]          DATETIME          NOT NULL DEFAULT GETDATE(),
        [con_d_update]            DATETIME          NOT NULL DEFAULT GETDATE(),
        [con_comment]             NTEXT             NULL,
        [con_company_name]        NVARCHAR(200)     NULL,

        CONSTRAINT [PK_TM_CON_CONSIGNEE] PRIMARY KEY CLUSTERED ([con_id]),

        CONSTRAINT [FK_CON_CIV] FOREIGN KEY ([civ_id])
            REFERENCES [dbo].[TR_CIV_Civility] ([civ_id]),
        CONSTRAINT [FK_CON_USR] FOREIGN KEY ([usr_created_by])
            REFERENCES [dbo].[TM_USR_User] ([usr_id]),
        CONSTRAINT [FK_CON_SOC] FOREIGN KEY ([soc_id])
            REFERENCES [dbo].[TR_SOC_Society] ([soc_id])
    );

    PRINT 'Created table TM_CON_CONSIGNEE';
END
ELSE
BEGIN
    PRINT 'Table TM_CON_CONSIGNEE already exists - skipping';
END
GO

-- Create indexes if they don't already exist
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CON_SOC' AND object_id = OBJECT_ID('TM_CON_CONSIGNEE'))
BEGIN
    CREATE INDEX [IX_CON_SOC] ON [dbo].[TM_CON_CONSIGNEE] ([soc_id]);
    PRINT 'Created index IX_CON_SOC';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CON_CIV' AND object_id = OBJECT_ID('TM_CON_CONSIGNEE'))
BEGIN
    CREATE INDEX [IX_CON_CIV] ON [dbo].[TM_CON_CONSIGNEE] ([civ_id]);
    PRINT 'Created index IX_CON_CIV';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CON_USR_CREATED' AND object_id = OBJECT_ID('TM_CON_CONSIGNEE'))
BEGIN
    CREATE INDEX [IX_CON_USR_CREATED] ON [dbo].[TM_CON_CONSIGNEE] ([usr_created_by]);
    PRINT 'Created index IX_CON_USR_CREATED';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CON_CITY' AND object_id = OBJECT_ID('TM_CON_CONSIGNEE'))
BEGIN
    CREATE INDEX [IX_CON_CITY] ON [dbo].[TM_CON_CONSIGNEE] ([con_city]);
    PRINT 'Created index IX_CON_CITY';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CON_COMPANY' AND object_id = OBJECT_ID('TM_CON_CONSIGNEE'))
BEGIN
    CREATE INDEX [IX_CON_COMPANY] ON [dbo].[TM_CON_CONSIGNEE] ([con_company_name]);
    PRINT 'Created index IX_CON_COMPANY';
END
GO

-- Record migration in history
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = '_MigrationHistory')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.11')
    BEGIN
        INSERT INTO [dbo].[_MigrationHistory] ([version], [description], [filename], [execution_time_ms], [success])
        VALUES ('V1.0.0.11', 'create consignee table', 'V1.0.0.11__create_consignee_table.sql', 0, 1);
        PRINT 'Recorded migration V1.0.0.11 in history';
    END
END
GO

PRINT '=== Migration V1.0.0.11 complete ===';
GO

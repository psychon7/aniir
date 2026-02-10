-- V1.0.0.12: Add contact role and client bank details
-- Date: 2026-02-10

-- Add role column to client contacts
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CCO_Client_Contact') AND name = 'cco_role'
)
BEGIN
    ALTER TABLE TM_CCO_Client_Contact ADD cco_role NVARCHAR(100) NULL;
END
GO

-- Add bank detail columns to client table
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CLI_CLient') AND name = 'cli_bank_iban'
)
BEGIN
    ALTER TABLE TM_CLI_CLient ADD cli_bank_iban NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CLI_CLient') AND name = 'cli_bank_bic'
)
BEGIN
    ALTER TABLE TM_CLI_CLient ADD cli_bank_bic NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CLI_CLient') AND name = 'cli_bank_name'
)
BEGIN
    ALTER TABLE TM_CLI_CLient ADD cli_bank_name NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CLI_CLient') AND name = 'cli_bank_account_holder'
)
BEGIN
    ALTER TABLE TM_CLI_CLient ADD cli_bank_account_holder NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TM_CLI_CLient') AND name = 'cli_bank_address'
)
BEGIN
    ALTER TABLE TM_CLI_CLient ADD cli_bank_address NVARCHAR(400) NULL;
END
GO

-- Record migration
IF NOT EXISTS (SELECT 1 FROM migration_history WHERE version = 'V1.0.0.12')
BEGIN
    INSERT INTO migration_history (version, description, applied_at)
    VALUES ('V1.0.0.12', 'Add contact role and client bank details', GETDATE());
END
GO

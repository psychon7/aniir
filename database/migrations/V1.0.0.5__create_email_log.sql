-- =============================================================================
-- Migration V1.0.0.5: Create EmailLog table
-- =============================================================================
-- Table: TM_SET_EmailLog
-- Purpose: Track sent emails with status, retry support, and entity linking
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TM_SET_EmailLog')
CREATE TABLE TM_SET_EmailLog (
    eml_id INT IDENTITY(1,1) PRIMARY KEY,
    eml_recipient_email NVARCHAR(500) NULL,
    eml_recipient_name NVARCHAR(500) NULL,
    eml_subject NVARCHAR(500) NULL,
    eml_body NVARCHAR(MAX) NULL,
    eml_template_name NVARCHAR(200) NULL,
    eml_template_data NVARCHAR(MAX) NULL,
    eml_status NVARCHAR(50) NULL DEFAULT 'PENDING',
    eml_error_message NVARCHAR(2000) NULL,
    eml_entity_type NVARCHAR(100) NULL,
    eml_entity_id INT NULL,
    eml_retry_count INT NOT NULL DEFAULT 0,
    eml_max_retries INT NOT NULL DEFAULT 3,
    eml_d_sent DATETIME NULL,
    eml_attachment_count INT NULL DEFAULT 0,
    usr_id INT NULL,
    soc_id INT NULL,
    eml_d_creation DATETIME NOT NULL DEFAULT GETDATE(),
    eml_d_update DATETIME NULL
);

-- Record migration (runner handles this automatically via _record_migration)
IF NOT EXISTS (SELECT 1 FROM [dbo].[_MigrationHistory] WHERE [version] = 'V1.0.0.5')
BEGIN
    INSERT INTO [dbo].[_MigrationHistory] ([version], [description], [filename], [execution_time_ms], [success])
    VALUES ('V1.0.0.5', 'Create EmailLog table', 'V1.0.0.5__create_email_log.sql', 0, 1);
END

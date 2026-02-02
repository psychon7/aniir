-- =============================================
-- Table: TM_EMAIL_Log
-- Description: Stores email sending history
-- Note: Execute this manually in SQL Server
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_EMAIL_Log]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_EMAIL_Log] (
        [log_id] INT IDENTITY(1,1) PRIMARY KEY,
        [log_recipient_email] NVARCHAR(255) NOT NULL,
        [log_recipient_name] NVARCHAR(200) NULL,
        [log_subject] NVARCHAR(500) NOT NULL,
        [log_body] NVARCHAR(MAX) NULL,
        [log_email_type] NVARCHAR(50) NOT NULL,
        [log_related_entity_type] NVARCHAR(50) NULL,
        [log_related_entity_id] INT NULL,
        [log_status] NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        [log_error_message] NVARCHAR(MAX) NULL,
        [log_created_at] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        [log_sent_at] DATETIME NULL,
        [log_created_by_id] INT NULL,
        [log_society_id] INT NULL,
        
        -- Foreign keys (adjust table names if different)
        CONSTRAINT [FK_EmailLog_User] FOREIGN KEY ([log_created_by_id]) 
            REFERENCES [dbo].[TM_USR_User]([usr_id]),
        CONSTRAINT [FK_EmailLog_Society] FOREIGN KEY ([log_society_id]) 
            REFERENCES [dbo].[TR_SOC_Society]([Id])
    );

    -- Create indexes for common queries
    CREATE INDEX [IX_EmailLog_Status] ON [dbo].[TM_EMAIL_Log] ([log_status]);
    CREATE INDEX [IX_EmailLog_EmailType] ON [dbo].[TM_EMAIL_Log] ([log_email_type]);
    CREATE INDEX [IX_EmailLog_CreatedAt] ON [dbo].[TM_EMAIL_Log] ([log_created_at] DESC);
    CREATE INDEX [IX_EmailLog_RecipientEmail] ON [dbo].[TM_EMAIL_Log] ([log_recipient_email]);
    CREATE INDEX [IX_EmailLog_RelatedEntity] ON [dbo].[TM_EMAIL_Log] ([log_related_entity_type], [log_related_entity_id]);
    CREATE INDEX [IX_EmailLog_Society] ON [dbo].[TM_EMAIL_Log] ([log_society_id]);

    PRINT 'Table TM_EMAIL_Log created successfully.';
END
ELSE
BEGIN
    PRINT 'Table TM_EMAIL_Log already exists.';
END
GO

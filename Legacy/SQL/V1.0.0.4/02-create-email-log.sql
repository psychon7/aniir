-- =============================================
-- Email Log Table Creation Script
-- Version: 1.0.0.4
-- Description: Creates TM_EML_EmailLog table for tracking all system emails
-- =============================================

-- =============================================
-- Create Email Status Reference Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TR_EML_EmailStatus')
BEGIN
    CREATE TABLE TR_EML_EmailStatus (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Code NVARCHAR(20) NOT NULL,
        Name NVARCHAR(50) NOT NULL,
        Description NVARCHAR(200) NULL,
        ColorHex NVARCHAR(7) NULL,
        SortOrder INT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT UQ_TR_EML_EmailStatus_Code UNIQUE (Code)
    );

    PRINT 'Created table TR_EML_EmailStatus';

    -- Insert default email statuses
    INSERT INTO TR_EML_EmailStatus (Code, Name, Description, ColorHex, SortOrder) VALUES
        ('PENDING', 'Pending', 'Email queued for sending', '#F59E0B', 1),
        ('SENDING', 'Sending', 'Email is being sent', '#3B82F6', 2),
        ('SENT', 'Sent', 'Email successfully sent', '#10B981', 3),
        ('DELIVERED', 'Delivered', 'Email confirmed delivered', '#059669', 4),
        ('OPENED', 'Opened', 'Email was opened by recipient', '#8B5CF6', 5),
        ('CLICKED', 'Clicked', 'Link in email was clicked', '#6366F1', 6),
        ('BOUNCED', 'Bounced', 'Email bounced back', '#EF4444', 7),
        ('FAILED', 'Failed', 'Email sending failed', '#DC2626', 8),
        ('CANCELLED', 'Cancelled', 'Email was cancelled before sending', '#6B7280', 9);

    PRINT 'Inserted default email statuses';
END
GO

-- =============================================
-- Create Email Type Reference Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TR_EML_EmailType')
BEGIN
    CREATE TABLE TR_EML_EmailType (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Code NVARCHAR(50) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(200) NULL,
        TemplateKey NVARCHAR(100) NULL,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT UQ_TR_EML_EmailType_Code UNIQUE (Code)
    );

    PRINT 'Created table TR_EML_EmailType';

    -- Insert default email types
    INSERT INTO TR_EML_EmailType (Code, Name, Description, TemplateKey) VALUES
        ('INVOICE', 'Invoice Email', 'Invoice sent to client', 'invoice_email'),
        ('INVOICE_REMINDER', 'Invoice Reminder', 'Payment reminder for overdue invoice', 'invoice_reminder'),
        ('INVOICE_OVERDUE', 'Invoice Overdue Notice', 'Overdue invoice notification', 'invoice_overdue'),
        ('QUOTE', 'Quote Email', 'Quote sent to client', 'quote_email'),
        ('ORDER_CONFIRMATION', 'Order Confirmation', 'Order confirmation email', 'order_confirmation'),
        ('SHIPPING_NOTIFICATION', 'Shipping Notification', 'Shipment tracking notification', 'shipping_notification'),
        ('WELCOME', 'Welcome Email', 'New client welcome email', 'welcome_email'),
        ('PASSWORD_RESET', 'Password Reset', 'Password reset request', 'password_reset'),
        ('NOTIFICATION', 'General Notification', 'General system notification', 'notification'),
        ('DAILY_REPORT', 'Daily Report', 'Daily summary report', 'daily_report'),
        ('CUSTOM', 'Custom Email', 'Custom/manual email', NULL);

    PRINT 'Inserted default email types';
END
GO

-- =============================================
-- Create Email Log Table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TM_EML_EmailLog')
BEGIN
    CREATE TABLE TM_EML_EmailLog (
        Id INT PRIMARY KEY IDENTITY(1,1),
        
        -- Reference (auto-generated: EML-20240115-0001)
        Reference NVARCHAR(30) NOT NULL,
        
        -- Email Type and Status
        EmailTypeId INT NOT NULL,
        StatusId INT NOT NULL,
        
        -- Sender Information
        FromEmail NVARCHAR(255) NOT NULL,
        FromName NVARCHAR(100) NULL,
        ReplyTo NVARCHAR(255) NULL,
        
        -- Recipient Information (primary recipient)
        ToEmail NVARCHAR(255) NOT NULL,
        ToName NVARCHAR(100) NULL,
        
        -- CC and BCC (stored as JSON arrays)
        CcEmails NVARCHAR(MAX) NULL,      -- JSON array: ["email1@test.com", "email2@test.com"]
        BccEmails NVARCHAR(MAX) NULL,     -- JSON array
        
        -- Email Content
        Subject NVARCHAR(500) NOT NULL,
        BodyHtml NVARCHAR(MAX) NULL,
        BodyText NVARCHAR(MAX) NULL,
        
        -- Attachments (stored as JSON array)
        Attachments NVARCHAR(MAX) NULL,   -- JSON: [{"name": "invoice.pdf", "path": "/files/...", "size": 12345}]
        AttachmentCount INT DEFAULT 0,
        
        -- Related Entity (polymorphic reference)
        EntityType NVARCHAR(50) NULL,     -- 'Invoice', 'Quote', 'Order', 'Client'
        EntityId INT NULL,                -- ID of the related entity
        EntityReference NVARCHAR(50) NULL, -- Reference of related entity (e.g., INV-2024-0001)
        
        -- Client/Contact Reference
        ClientId INT NULL,
        ContactId INT NULL,
        
        -- Society (multi-company support)
        SocietyId INT NULL,
        
        -- Scheduling
        ScheduledAt DATETIME2 NULL,       -- When email should be sent (NULL = immediate)
        
        -- Timestamps
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        SentAt DATETIME2 NULL,
        DeliveredAt DATETIME2 NULL,
        OpenedAt DATETIME2 NULL,
        ClickedAt DATETIME2 NULL,
        FailedAt DATETIME2 NULL,
        
        -- Tracking
        MessageId NVARCHAR(255) NULL,     -- SMTP Message-ID or provider ID
        TrackingId NVARCHAR(100) NULL,    -- Custom tracking ID for webhooks
        
        -- Error Handling
        ErrorMessage NVARCHAR(MAX) NULL,
        RetryCount INT DEFAULT 0,
        MaxRetries INT DEFAULT 3,
        NextRetryAt DATETIME2 NULL,
        
        -- Metadata
        Headers NVARCHAR(MAX) NULL,       -- JSON: custom email headers
        Metadata NVARCHAR(MAX) NULL,      -- JSON: additional metadata
        
        -- User who triggered the email
        CreatedBy INT NULL,
        
        -- Soft delete
        IsDeleted BIT DEFAULT 0,
        DeletedAt DATETIME2 NULL,
        DeletedBy INT NULL,
        
        -- Constraints
        CONSTRAINT FK_TM_EML_EmailLog_EmailType FOREIGN KEY (EmailTypeId) 
            REFERENCES TR_EML_EmailType(Id),
        CONSTRAINT FK_TM_EML_EmailLog_Status FOREIGN KEY (StatusId) 
            REFERENCES TR_EML_EmailStatus(Id),
        CONSTRAINT FK_TM_EML_EmailLog_Client FOREIGN KEY (ClientId) 
            REFERENCES TM_CLI_Client(Id),
        CONSTRAINT FK_TM_EML_EmailLog_Society FOREIGN KEY (SocietyId) 
            REFERENCES TR_SOC_Society(Id),
        CONSTRAINT UQ_TM_EML_EmailLog_Reference UNIQUE (Reference),
        CONSTRAINT UQ_TM_EML_EmailLog_TrackingId UNIQUE (TrackingId)
    );

    PRINT 'Created table TM_EML_EmailLog';
END
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

-- Index for status-based queries (pending emails, failed emails)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_StatusId')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_StatusId 
    ON TM_EML_EmailLog(StatusId) 
    INCLUDE (EmailTypeId, ToEmail, ScheduledAt, RetryCount);
    
    PRINT 'Created index IX_TM_EML_EmailLog_StatusId';
END
GO

-- Index for email type queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_EmailTypeId')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_EmailTypeId 
    ON TM_EML_EmailLog(EmailTypeId, StatusId);
    
    PRINT 'Created index IX_TM_EML_EmailLog_EmailTypeId';
END
GO

-- Index for entity lookups (find all emails for an invoice, quote, etc.)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_Entity')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_Entity 
    ON TM_EML_EmailLog(EntityType, EntityId) 
    WHERE EntityType IS NOT NULL;
    
    PRINT 'Created index IX_TM_EML_EmailLog_Entity';
END
GO

-- Index for client email history
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_ClientId')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_ClientId 
    ON TM_EML_EmailLog(ClientId, CreatedAt DESC) 
    WHERE ClientId IS NOT NULL;
    
    PRINT 'Created index IX_TM_EML_EmailLog_ClientId';
END
GO

-- Index for scheduled emails (job processing)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_Scheduled')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_Scheduled 
    ON TM_EML_EmailLog(ScheduledAt, StatusId) 
    WHERE ScheduledAt IS NOT NULL AND StatusId = 1; -- PENDING status
    
    PRINT 'Created index IX_TM_EML_EmailLog_Scheduled';
END
GO

-- Index for retry processing
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_Retry')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_Retry 
    ON TM_EML_EmailLog(NextRetryAt, RetryCount) 
    WHERE NextRetryAt IS NOT NULL AND RetryCount < MaxRetries;
    
    PRINT 'Created index IX_TM_EML_EmailLog_Retry';
END
GO

-- Index for date range queries and reporting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_CreatedAt')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_CreatedAt 
    ON TM_EML_EmailLog(CreatedAt DESC) 
    INCLUDE (EmailTypeId, StatusId, ToEmail);
    
    PRINT 'Created index IX_TM_EML_EmailLog_CreatedAt';
END
GO

-- Index for tracking ID lookups (webhook processing)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_MessageId')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_MessageId 
    ON TM_EML_EmailLog(MessageId) 
    WHERE MessageId IS NOT NULL;
    
    PRINT 'Created index IX_TM_EML_EmailLog_MessageId';
END
GO

-- Index for society-based queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TM_EML_EmailLog_SocietyId')
BEGIN
    CREATE INDEX IX_TM_EML_EmailLog_SocietyId 
    ON TM_EML_EmailLog(SocietyId, CreatedAt DESC) 
    WHERE SocietyId IS NOT NULL;
    
    PRINT 'Created index IX_TM_EML_EmailLog_SocietyId';
END
GO

-- =============================================
-- Create View for Email Statistics
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_EML_EmailStatistics')
BEGIN
    DROP VIEW VW_EML_EmailStatistics;
END
GO

CREATE VIEW VW_EML_EmailStatistics AS
SELECT 
    CAST(e.CreatedAt AS DATE) AS EmailDate,
    t.Code AS EmailType,
    s.Code AS Status,
    e.SocietyId,
    COUNT(*) AS EmailCount,
    SUM(CASE WHEN s.Code = 'SENT' THEN 1 ELSE 0 END) AS SentCount,
    SUM(CASE WHEN s.Code = 'DELIVERED' THEN 1 ELSE 0 END) AS DeliveredCount,
    SUM(CASE WHEN s.Code = 'OPENED' THEN 1 ELSE 0 END) AS OpenedCount,
    SUM(CASE WHEN s.Code = 'BOUNCED' THEN 1 ELSE 0 END) AS BouncedCount,
    SUM(CASE WHEN s.Code = 'FAILED' THEN 1 ELSE 0 END) AS FailedCount
FROM TM_EML_EmailLog e
INNER JOIN TR_EML_EmailType t ON e.EmailTypeId = t.Id
INNER JOIN TR_EML_EmailStatus s ON e.StatusId = s.Id
WHERE e.IsDeleted = 0
GROUP BY CAST(e.CreatedAt AS DATE), t.Code, s.Code, e.SocietyId;
GO

PRINT 'Created view VW_EML_EmailStatistics';
GO

-- =============================================
-- Create Stored Procedure for Reference Generation
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_EML_GenerateReference')
BEGIN
    DROP PROCEDURE SP_EML_GenerateReference;
END
GO

CREATE PROCEDURE SP_EML_GenerateReference
    @Reference NVARCHAR(30) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Today DATE = GETDATE();
    DECLARE @DatePart NVARCHAR(8) = FORMAT(@Today, 'yyyyMMdd');
    DECLARE @Prefix NVARCHAR(15) = 'EML-' + @DatePart + '-';
    DECLARE @NextNum INT;
    
    -- Get the next sequence number for today
    SELECT @NextNum = ISNULL(MAX(
        TRY_CAST(RIGHT(Reference, 4) AS INT)
    ), 0) + 1
    FROM TM_EML_EmailLog
    WHERE Reference LIKE @Prefix + '%';
    
    SET @Reference = @Prefix + RIGHT('0000' + CAST(@NextNum AS NVARCHAR(4)), 4);
END
GO

PRINT 'Created procedure SP_EML_GenerateReference';
GO

-- =============================================
-- Create Stored Procedure for Getting Pending Emails
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_EML_GetPendingEmails')
BEGIN
    DROP PROCEDURE SP_EML_GetPendingEmails;
END
GO

CREATE PROCEDURE SP_EML_GetPendingEmails
    @BatchSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PendingStatusId INT;
    SELECT @PendingStatusId = Id FROM TR_EML_EmailStatus WHERE Code = 'PENDING';
    
    SELECT TOP (@BatchSize)
        e.Id,
        e.Reference,
        t.Code AS EmailType,
        e.FromEmail,
        e.FromName,
        e.ReplyTo,
        e.ToEmail,
        e.ToName,
        e.CcEmails,
        e.BccEmails,
        e.Subject,
        e.BodyHtml,
        e.BodyText,
        e.Attachments,
        e.EntityType,
        e.EntityId,
        e.EntityReference,
        e.ScheduledAt,
        e.RetryCount,
        e.Metadata
    FROM TM_EML_EmailLog e
    INNER JOIN TR_EML_EmailType t ON e.EmailTypeId = t.Id
    WHERE e.StatusId = @PendingStatusId
      AND e.IsDeleted = 0
      AND (e.ScheduledAt IS NULL OR e.ScheduledAt <= GETDATE())
      AND e.RetryCount < e.MaxRetries
    ORDER BY e.CreatedAt ASC;
END
GO

PRINT 'Created procedure SP_EML_GetPendingEmails';
GO

-- =============================================
-- Create Stored Procedure for Updating Email Status
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_EML_UpdateStatus')
BEGIN
    DROP PROCEDURE SP_EML_UpdateStatus;
END
GO

CREATE PROCEDURE SP_EML_UpdateStatus
    @EmailId INT,
    @StatusCode NVARCHAR(20),
    @MessageId NVARCHAR(255) = NULL,
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StatusId INT;
    SELECT @StatusId = Id FROM TR_EML_EmailStatus WHERE Code = @StatusCode;
    
    IF @StatusId IS NULL
    BEGIN
        RAISERROR('Invalid status code: %s', 16, 1, @StatusCode);
        RETURN;
    END
    
    UPDATE TM_EML_EmailLog
    SET 
        StatusId = @StatusId,
        MessageId = ISNULL(@MessageId, MessageId),
        ErrorMessage = @ErrorMessage,
        SentAt = CASE WHEN @StatusCode IN ('SENT', 'DELIVERED') THEN GETDATE() ELSE SentAt END,
        DeliveredAt = CASE WHEN @StatusCode = 'DELIVERED' THEN GETDATE() ELSE DeliveredAt END,
        OpenedAt = CASE WHEN @StatusCode = 'OPENED' THEN GETDATE() ELSE OpenedAt END,
        ClickedAt = CASE WHEN @StatusCode = 'CLICKED' THEN GETDATE() ELSE ClickedAt END,
        FailedAt = CASE WHEN @StatusCode IN ('FAILED', 'BOUNCED') THEN GETDATE() ELSE FailedAt END,
        RetryCount = CASE WHEN @StatusCode = 'FAILED' THEN RetryCount + 1 ELSE RetryCount END,
        NextRetryAt = CASE 
            WHEN @StatusCode = 'FAILED' AND RetryCount < MaxRetries 
            THEN DATEADD(MINUTE, POWER(2, RetryCount) * 5, GETDATE()) -- Exponential backoff
            ELSE NULL 
        END
    WHERE Id = @EmailId;
END
GO

PRINT 'Created procedure SP_EML_UpdateStatus';
GO

PRINT '========================================';
PRINT 'Email Log table creation completed';
PRINT '========================================';

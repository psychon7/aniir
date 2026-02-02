-- =============================================
-- Migration: V1.1.1.4 - Create TR_LAN_Language Table
-- Description: Creates the Language reference table for language data
-- Date: 2026-01-31
-- =============================================

-- Create Language reference table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_LAN_Language]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.TR_LAN_Language
    (
        lan_id              int identity(1,1)   primary key,
        lan_label           nvarchar(80)        not null,
        lan_short_label     nvarchar(20)        not null
    )

    PRINT 'Table TR_LAN_Language created successfully.'
END
ELSE
BEGIN
    PRINT 'Table TR_LAN_Language already exists.'
END
GO

-- Insert default languages
IF NOT EXISTS (SELECT * FROM TR_LAN_Language WHERE lan_short_label = 'FR-fr')
BEGIN
    INSERT INTO TR_LAN_Language (lan_label, lan_short_label)
    VALUES
        ('France', 'FR-fr'),
        ('United Kingdom', 'EN-uk'),
        ('United States', 'EN-us'),
        ('Germany', 'DE-de'),
        ('Spain', 'ES-es'),
        ('Italy', 'IT-it'),
        ('China', 'ZH-CN'),
        ('Japan', 'JA-jp'),
        ('Portugal', 'PT-pt'),
        ('Netherlands', 'NL-nl')

    PRINT 'Default languages inserted successfully.'
END
ELSE
BEGIN
    PRINT 'Default languages already exist.'
END
GO

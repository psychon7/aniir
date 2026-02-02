-- =============================================
-- Script: Create ShopifyIntegration Table
-- Version: V1.1.1.1
-- Description: Creates the TR_SHOPIFY_INTEGRATION table for storing Shopify OAuth credentials
-- =============================================

-- Check if table exists and create if not
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_SHOPIFY_INTEGRATION]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TR_SHOPIFY_INTEGRATION](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UserId] [int] NOT NULL,
        [SocietyId] [int] NOT NULL,
        [Shop] [nvarchar](255) NOT NULL,
        [AccessToken] [nvarchar](500) NOT NULL,
        [Scope] [nvarchar](1000) NULL,
        [IsActive] [bit] NOT NULL DEFAULT(1),
        [CreatedAt] [datetime] NOT NULL DEFAULT(GETUTCDATE()),
        [UpdatedAt] [datetime] NOT NULL DEFAULT(GETUTCDATE()),
        [LastUsedAt] [datetime] NULL,
        CONSTRAINT [PK_TR_SHOPIFY_INTEGRATION] PRIMARY KEY CLUSTERED
        (
            [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]

    PRINT 'Table TR_SHOPIFY_INTEGRATION created successfully.'
END
ELSE
BEGIN
    PRINT 'Table TR_SHOPIFY_INTEGRATION already exists.'
END
GO

-- Add foreign key constraints
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TR_SHOPIFY_INTEGRATION_UserId')
BEGIN
    ALTER TABLE [dbo].[TR_SHOPIFY_INTEGRATION]
    ADD CONSTRAINT [FK_TR_SHOPIFY_INTEGRATION_UserId]
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[TR_USR]([Id])

    PRINT 'Foreign key FK_TR_SHOPIFY_INTEGRATION_UserId added.'
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TR_SHOPIFY_INTEGRATION_SocietyId')
BEGIN
    ALTER TABLE [dbo].[TR_SHOPIFY_INTEGRATION]
    ADD CONSTRAINT [FK_TR_SHOPIFY_INTEGRATION_SocietyId]
    FOREIGN KEY ([SocietyId]) REFERENCES [dbo].[TR_SOC]([Id])

    PRINT 'Foreign key FK_TR_SHOPIFY_INTEGRATION_SocietyId added.'
END
GO

-- Create unique index for Shop per Society (one integration per shop per society)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_TR_SHOPIFY_INTEGRATION_SocietyId_Shop')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_TR_SHOPIFY_INTEGRATION_SocietyId_Shop]
    ON [dbo].[TR_SHOPIFY_INTEGRATION] ([SocietyId] ASC, [Shop] ASC)

    PRINT 'Unique index UX_TR_SHOPIFY_INTEGRATION_SocietyId_Shop created.'
END
GO

-- Create index for user lookup
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TR_SHOPIFY_INTEGRATION_UserId')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TR_SHOPIFY_INTEGRATION_UserId]
    ON [dbo].[TR_SHOPIFY_INTEGRATION] ([UserId] ASC)

    PRINT 'Index IX_TR_SHOPIFY_INTEGRATION_UserId created.'
END
GO

PRINT 'ShopifyIntegration table setup complete.'
GO

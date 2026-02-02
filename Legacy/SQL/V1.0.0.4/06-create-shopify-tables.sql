-- =============================================
-- Script: 06-create-shopify-tables.sql
-- Description: Create Shopify integration tables for OAuth, orders, products, and sync tracking
-- Version: 1.0.0.4
-- Tables: TR_SHP_Integration, TM_SHP_Order, TM_SHP_Order_Line, TM_SHP_Product, TM_SHP_Sync_Log
-- =============================================

USE ERP_ECOLED;
GO

-- =============================================
-- Shopify Integration Table
-- Stores OAuth credentials and connection settings for Shopify stores
-- One integration per shop per society
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_SHP_Integration]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TR_SHP_Integration] (
        [shp_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Society and User references
        [soc_id] INT NOT NULL,
        [usr_id] INT NOT NULL,

        -- Shopify store info
        [shp_shop] NVARCHAR(255) NOT NULL,  -- Store domain (e.g., mystore.myshopify.com)
        [shp_access_token] NVARCHAR(500) NOT NULL,  -- Encrypted OAuth access token
        [shp_scope] NVARCHAR(1000) NULL,  -- Granted OAuth scopes

        -- Status
        [shp_is_active] BIT DEFAULT 1 NOT NULL,

        -- Timestamps
        [shp_created_at] DATETIME DEFAULT GETDATE() NOT NULL,
        [shp_updated_at] DATETIME DEFAULT GETDATE() NOT NULL,
        [shp_last_used_at] DATETIME NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SHP_SOC] FOREIGN KEY ([soc_id])
            REFERENCES [dbo].[TR_SOC_Society]([soc_id]),
        CONSTRAINT [FK_SHP_USR] FOREIGN KEY ([usr_id])
            REFERENCES [dbo].[TM_USR_User]([usr_id])
    );

    PRINT 'Created table TR_SHP_Integration';
END
ELSE
BEGIN
    PRINT 'Table TR_SHP_Integration already exists';
END
GO

-- Unique index for one shop per society
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_SHP_Society_Shop' AND object_id = OBJECT_ID('TR_SHP_Integration'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_SHP_Society_Shop]
    ON [dbo].[TR_SHP_Integration]([soc_id], [shp_shop]);
    PRINT 'Created unique index UX_SHP_Society_Shop';
END
GO

-- Index for user lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SHP_User' AND object_id = OBJECT_ID('TR_SHP_Integration'))
BEGIN
    CREATE INDEX [IX_SHP_User] ON [dbo].[TR_SHP_Integration]([usr_id]);
    PRINT 'Created index IX_SHP_User';
END
GO

-- Index for active integrations
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SHP_Active' AND object_id = OBJECT_ID('TR_SHP_Integration'))
BEGIN
    CREATE INDEX [IX_SHP_Active] ON [dbo].[TR_SHP_Integration]([shp_is_active]) WHERE [shp_is_active] = 1;
    PRINT 'Created index IX_SHP_Active';
END
GO

-- =============================================
-- Shopify Products Table
-- Stores synced product data from Shopify
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_SHP_Product]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_SHP_Product] (
        [spr_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Shopify integration reference
        [shp_id] INT NOT NULL,

        -- Shopify product identifiers
        [spr_shopify_id] BIGINT NOT NULL,  -- Shopify product ID
        [spr_shopify_variant_id] BIGINT NULL,  -- Shopify variant ID (if applicable)

        -- Product info
        [spr_title] NVARCHAR(500) NOT NULL,
        [spr_handle] NVARCHAR(255) NULL,  -- URL-friendly name
        [spr_sku] NVARCHAR(100) NULL,
        [spr_barcode] NVARCHAR(100) NULL,
        [spr_vendor] NVARCHAR(255) NULL,
        [spr_product_type] NVARCHAR(255) NULL,

        -- Pricing
        [spr_price] DECIMAL(18,2) NULL,
        [spr_compare_at_price] DECIMAL(18,2) NULL,
        [spr_cost] DECIMAL(18,2) NULL,

        -- Inventory
        [spr_inventory_quantity] INT NULL,
        [spr_inventory_policy] NVARCHAR(50) NULL,  -- deny, continue

        -- Status
        [spr_status] NVARCHAR(50) NULL,  -- active, archived, draft
        [spr_is_synced] BIT DEFAULT 1 NOT NULL,

        -- Link to ERP product (optional)
        [prd_id] INT NULL,  -- Reference to ERP product if linked

        -- Raw Shopify data (JSON)
        [spr_raw_data] NVARCHAR(MAX) NULL,

        -- Timestamps
        [spr_shopify_created_at] DATETIME NULL,
        [spr_shopify_updated_at] DATETIME NULL,
        [spr_created_at] DATETIME DEFAULT GETDATE() NOT NULL,
        [spr_updated_at] DATETIME DEFAULT GETDATE() NOT NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SPR_SHP] FOREIGN KEY ([shp_id])
            REFERENCES [dbo].[TR_SHP_Integration]([shp_id]) ON DELETE CASCADE
    );

    PRINT 'Created table TM_SHP_Product';
END
ELSE
BEGIN
    PRINT 'Table TM_SHP_Product already exists';
END
GO

-- Unique index for Shopify product per integration
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_SPR_Integration_ShopifyId' AND object_id = OBJECT_ID('TM_SHP_Product'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_SPR_Integration_ShopifyId]
    ON [dbo].[TM_SHP_Product]([shp_id], [spr_shopify_id], [spr_shopify_variant_id]);
    PRINT 'Created unique index UX_SPR_Integration_ShopifyId';
END
GO

-- Index for SKU lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SPR_SKU' AND object_id = OBJECT_ID('TM_SHP_Product'))
BEGIN
    CREATE INDEX [IX_SPR_SKU] ON [dbo].[TM_SHP_Product]([spr_sku]);
    PRINT 'Created index IX_SPR_SKU';
END
GO

-- Index for ERP product linkage
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SPR_Product' AND object_id = OBJECT_ID('TM_SHP_Product'))
BEGIN
    CREATE INDEX [IX_SPR_Product] ON [dbo].[TM_SHP_Product]([prd_id]) WHERE [prd_id] IS NOT NULL;
    PRINT 'Created index IX_SPR_Product';
END
GO

-- =============================================
-- Shopify Orders Table
-- Stores synced order data from Shopify
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_SHP_Order]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_SHP_Order] (
        [sor_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Shopify integration reference
        [shp_id] INT NOT NULL,

        -- Shopify order identifiers
        [sor_shopify_id] BIGINT NOT NULL,  -- Shopify order ID
        [sor_order_number] NVARCHAR(50) NOT NULL,  -- Human-readable order number
        [sor_name] NVARCHAR(100) NULL,  -- Order name (#1001, etc.)

        -- Customer info
        [sor_customer_email] NVARCHAR(255) NULL,
        [sor_customer_phone] NVARCHAR(100) NULL,
        [sor_customer_name] NVARCHAR(255) NULL,

        -- Shipping address
        [sor_shipping_name] NVARCHAR(255) NULL,
        [sor_shipping_address1] NVARCHAR(500) NULL,
        [sor_shipping_address2] NVARCHAR(500) NULL,
        [sor_shipping_city] NVARCHAR(255) NULL,
        [sor_shipping_province] NVARCHAR(255) NULL,
        [sor_shipping_country] NVARCHAR(255) NULL,
        [sor_shipping_zip] NVARCHAR(50) NULL,

        -- Billing address
        [sor_billing_name] NVARCHAR(255) NULL,
        [sor_billing_address1] NVARCHAR(500) NULL,
        [sor_billing_address2] NVARCHAR(500) NULL,
        [sor_billing_city] NVARCHAR(255) NULL,
        [sor_billing_province] NVARCHAR(255) NULL,
        [sor_billing_country] NVARCHAR(255) NULL,
        [sor_billing_zip] NVARCHAR(50) NULL,

        -- Financials
        [sor_currency] NVARCHAR(10) NULL,
        [sor_subtotal_price] DECIMAL(18,2) NULL,
        [sor_total_tax] DECIMAL(18,2) NULL,
        [sor_total_discounts] DECIMAL(18,2) NULL,
        [sor_total_shipping] DECIMAL(18,2) NULL,
        [sor_total_price] DECIMAL(18,2) NULL,

        -- Status
        [sor_financial_status] NVARCHAR(50) NULL,  -- pending, paid, refunded, etc.
        [sor_fulfillment_status] NVARCHAR(50) NULL,  -- null, partial, fulfilled
        [sor_cancelled_at] DATETIME NULL,
        [sor_cancel_reason] NVARCHAR(255) NULL,

        -- Processing status
        [sor_is_synced] BIT DEFAULT 1 NOT NULL,
        [sor_is_processed] BIT DEFAULT 0 NOT NULL,  -- Has been converted to ERP order

        -- Link to ERP order (optional)
        [cin_id] INT NULL,  -- Reference to client invoice if converted

        -- Raw Shopify data (JSON)
        [sor_raw_data] NVARCHAR(MAX) NULL,

        -- Timestamps
        [sor_shopify_created_at] DATETIME NULL,
        [sor_shopify_updated_at] DATETIME NULL,
        [sor_created_at] DATETIME DEFAULT GETDATE() NOT NULL,
        [sor_updated_at] DATETIME DEFAULT GETDATE() NOT NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SOR_SHP] FOREIGN KEY ([shp_id])
            REFERENCES [dbo].[TR_SHP_Integration]([shp_id]) ON DELETE CASCADE
    );

    PRINT 'Created table TM_SHP_Order';
END
ELSE
BEGIN
    PRINT 'Table TM_SHP_Order already exists';
END
GO

-- Unique index for Shopify order per integration
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_SOR_Integration_ShopifyId' AND object_id = OBJECT_ID('TM_SHP_Order'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_SOR_Integration_ShopifyId]
    ON [dbo].[TM_SHP_Order]([shp_id], [sor_shopify_id]);
    PRINT 'Created unique index UX_SOR_Integration_ShopifyId';
END
GO

-- Index for order number lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOR_OrderNumber' AND object_id = OBJECT_ID('TM_SHP_Order'))
BEGIN
    CREATE INDEX [IX_SOR_OrderNumber] ON [dbo].[TM_SHP_Order]([sor_order_number]);
    PRINT 'Created index IX_SOR_OrderNumber';
END
GO

-- Index for unprocessed orders (common query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOR_Unprocessed' AND object_id = OBJECT_ID('TM_SHP_Order'))
BEGIN
    CREATE INDEX [IX_SOR_Unprocessed] ON [dbo].[TM_SHP_Order]([shp_id], [sor_is_processed]) WHERE [sor_is_processed] = 0;
    PRINT 'Created index IX_SOR_Unprocessed';
END
GO

-- Index for ERP order linkage
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOR_ClientInvoice' AND object_id = OBJECT_ID('TM_SHP_Order'))
BEGIN
    CREATE INDEX [IX_SOR_ClientInvoice] ON [dbo].[TM_SHP_Order]([cin_id]) WHERE [cin_id] IS NOT NULL;
    PRINT 'Created index IX_SOR_ClientInvoice';
END
GO

-- Index for date-based queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOR_ShopifyCreated' AND object_id = OBJECT_ID('TM_SHP_Order'))
BEGIN
    CREATE INDEX [IX_SOR_ShopifyCreated] ON [dbo].[TM_SHP_Order]([shp_id], [sor_shopify_created_at] DESC);
    PRINT 'Created index IX_SOR_ShopifyCreated';
END
GO

-- =============================================
-- Shopify Order Lines Table
-- Stores individual line items from Shopify orders
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_SHP_Order_Line]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_SHP_Order_Line] (
        [sol_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Order reference
        [sor_id] INT NOT NULL,

        -- Shopify line item identifiers
        [sol_shopify_id] BIGINT NOT NULL,  -- Shopify line item ID
        [sol_shopify_product_id] BIGINT NULL,
        [sol_shopify_variant_id] BIGINT NULL,

        -- Product info
        [sol_title] NVARCHAR(500) NOT NULL,
        [sol_variant_title] NVARCHAR(500) NULL,
        [sol_sku] NVARCHAR(100) NULL,

        -- Quantity and pricing
        [sol_quantity] INT NOT NULL,
        [sol_price] DECIMAL(18,2) NOT NULL,
        [sol_total_discount] DECIMAL(18,2) NULL,

        -- Fulfillment
        [sol_fulfillment_status] NVARCHAR(50) NULL,
        [sol_fulfillable_quantity] INT NULL,

        -- Link to synced product (optional)
        [spr_id] INT NULL,

        -- Timestamps
        [sol_created_at] DATETIME DEFAULT GETDATE() NOT NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SOL_SOR] FOREIGN KEY ([sor_id])
            REFERENCES [dbo].[TM_SHP_Order]([sor_id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SOL_SPR] FOREIGN KEY ([spr_id])
            REFERENCES [dbo].[TM_SHP_Product]([spr_id])
    );

    PRINT 'Created table TM_SHP_Order_Line';
END
ELSE
BEGIN
    PRINT 'Table TM_SHP_Order_Line already exists';
END
GO

-- Index for order line lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOL_Order' AND object_id = OBJECT_ID('TM_SHP_Order_Line'))
BEGIN
    CREATE INDEX [IX_SOL_Order] ON [dbo].[TM_SHP_Order_Line]([sor_id]);
    PRINT 'Created index IX_SOL_Order';
END
GO

-- Index for product lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SOL_Product' AND object_id = OBJECT_ID('TM_SHP_Order_Line'))
BEGIN
    CREATE INDEX [IX_SOL_Product] ON [dbo].[TM_SHP_Order_Line]([spr_id]) WHERE [spr_id] IS NOT NULL;
    PRINT 'Created index IX_SOL_Product';
END
GO

-- =============================================
-- Shopify Sync Log Table
-- Tracks synchronization operations for auditing and debugging
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TM_SHP_Sync_Log]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TM_SHP_Sync_Log] (
        [ssl_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Shopify integration reference
        [shp_id] INT NOT NULL,

        -- Sync operation details
        [ssl_operation] NVARCHAR(50) NOT NULL,  -- products_sync, orders_sync, inventory_sync, webhook_received
        [ssl_direction] NVARCHAR(20) NOT NULL,  -- inbound, outbound
        [ssl_entity_type] NVARCHAR(50) NULL,  -- order, product, inventory, customer
        [ssl_entity_id] NVARCHAR(100) NULL,  -- Shopify entity ID

        -- Status
        [ssl_status] NVARCHAR(20) NOT NULL,  -- started, success, failed, partial
        [ssl_records_processed] INT NULL,
        [ssl_records_failed] INT NULL,

        -- Error details
        [ssl_error_message] NVARCHAR(MAX) NULL,
        [ssl_error_details] NVARCHAR(MAX) NULL,  -- JSON with full error info

        -- Request/Response data for debugging
        [ssl_request_data] NVARCHAR(MAX) NULL,
        [ssl_response_data] NVARCHAR(MAX) NULL,

        -- Timestamps
        [ssl_started_at] DATETIME NOT NULL,
        [ssl_completed_at] DATETIME NULL,
        [ssl_created_at] DATETIME DEFAULT GETDATE() NOT NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SSL_SHP] FOREIGN KEY ([shp_id])
            REFERENCES [dbo].[TR_SHP_Integration]([shp_id]) ON DELETE CASCADE
    );

    PRINT 'Created table TM_SHP_Sync_Log';
END
ELSE
BEGIN
    PRINT 'Table TM_SHP_Sync_Log already exists';
END
GO

-- Index for integration sync history
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SSL_Integration' AND object_id = OBJECT_ID('TM_SHP_Sync_Log'))
BEGIN
    CREATE INDEX [IX_SSL_Integration] ON [dbo].[TM_SHP_Sync_Log]([shp_id], [ssl_created_at] DESC);
    PRINT 'Created index IX_SSL_Integration';
END
GO

-- Index for operation type queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SSL_Operation' AND object_id = OBJECT_ID('TM_SHP_Sync_Log'))
BEGIN
    CREATE INDEX [IX_SSL_Operation] ON [dbo].[TM_SHP_Sync_Log]([ssl_operation], [ssl_status]);
    PRINT 'Created index IX_SSL_Operation';
END
GO

-- Index for failed syncs (for monitoring/alerting)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SSL_Failed' AND object_id = OBJECT_ID('TM_SHP_Sync_Log'))
BEGIN
    CREATE INDEX [IX_SSL_Failed] ON [dbo].[TM_SHP_Sync_Log]([ssl_status], [ssl_created_at] DESC) WHERE [ssl_status] = 'failed';
    PRINT 'Created index IX_SSL_Failed';
END
GO

-- =============================================
-- Shopify Webhook Table
-- Stores registered webhooks for tracking and management
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TR_SHP_Webhook]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TR_SHP_Webhook] (
        [swh_id] INT IDENTITY(1,1) PRIMARY KEY,

        -- Shopify integration reference
        [shp_id] INT NOT NULL,

        -- Webhook details
        [swh_shopify_id] BIGINT NULL,  -- Shopify webhook ID
        [swh_topic] NVARCHAR(100) NOT NULL,  -- orders/create, products/update, etc.
        [swh_address] NVARCHAR(500) NOT NULL,  -- Callback URL
        [swh_format] NVARCHAR(20) DEFAULT 'json' NOT NULL,

        -- Status
        [swh_is_active] BIT DEFAULT 1 NOT NULL,

        -- Timestamps
        [swh_created_at] DATETIME DEFAULT GETDATE() NOT NULL,
        [swh_updated_at] DATETIME DEFAULT GETDATE() NOT NULL,

        -- Foreign key constraints
        CONSTRAINT [FK_SWH_SHP] FOREIGN KEY ([shp_id])
            REFERENCES [dbo].[TR_SHP_Integration]([shp_id]) ON DELETE CASCADE
    );

    PRINT 'Created table TR_SHP_Webhook';
END
ELSE
BEGIN
    PRINT 'Table TR_SHP_Webhook already exists';
END
GO

-- Unique index for webhook topic per integration
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_SWH_Integration_Topic' AND object_id = OBJECT_ID('TR_SHP_Webhook'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_SWH_Integration_Topic]
    ON [dbo].[TR_SHP_Webhook]([shp_id], [swh_topic]);
    PRINT 'Created unique index UX_SWH_Integration_Topic';
END
GO

PRINT 'Shopify tables creation completed successfully';
GO

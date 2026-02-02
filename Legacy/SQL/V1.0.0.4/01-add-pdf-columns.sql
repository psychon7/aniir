-- =============================================
-- Migration: Add PDF columns to TM_INV_ClientInvoice
-- Version: 1.0.0.4
-- Description: Adds inv_pdf_url and inv_pdf_generated_at columns
--              for storing generated invoice PDF information
-- Date: 2024
-- =============================================

USE [ERP2025]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Add inv_pdf_url column if it doesn't exist
-- =============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]') 
    AND name = 'inv_pdf_url'
)
BEGIN
    ALTER TABLE [dbo].[TM_INV_ClientInvoice]
    ADD [inv_pdf_url] NVARCHAR(500) NULL;
    
    PRINT 'Column inv_pdf_url added to TM_INV_ClientInvoice';
END
ELSE
BEGIN
    PRINT 'Column inv_pdf_url already exists in TM_INV_ClientInvoice';
END
GO

-- =============================================
-- Add inv_pdf_generated_at column if it doesn't exist
-- =============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]') 
    AND name = 'inv_pdf_generated_at'
)
BEGIN
    ALTER TABLE [dbo].[TM_INV_ClientInvoice]
    ADD [inv_pdf_generated_at] DATETIME2 NULL;
    
    PRINT 'Column inv_pdf_generated_at added to TM_INV_ClientInvoice';
END
ELSE
BEGIN
    PRINT 'Column inv_pdf_generated_at already exists in TM_INV_ClientInvoice';
END
GO

-- =============================================
-- Add index on inv_pdf_generated_at for querying
-- invoices that need PDF regeneration
-- =============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]') 
    AND name = 'IX_TM_INV_ClientInvoice_PdfGeneratedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_TM_INV_ClientInvoice_PdfGeneratedAt]
    ON [dbo].[TM_INV_ClientInvoice] ([inv_pdf_generated_at] ASC)
    WHERE [inv_pdf_generated_at] IS NOT NULL;
    
    PRINT 'Index IX_TM_INV_ClientInvoice_PdfGeneratedAt created';
END
ELSE
BEGIN
    PRINT 'Index IX_TM_INV_ClientInvoice_PdfGeneratedAt already exists';
END
GO

-- =============================================
-- Add extended properties for documentation
-- =============================================
IF NOT EXISTS (
    SELECT 1 
    FROM sys.extended_properties 
    WHERE major_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]')
    AND minor_id = (
        SELECT column_id 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]') 
        AND name = 'inv_pdf_url'
    )
    AND name = 'MS_Description'
)
BEGIN
    EXEC sys.sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'URL/path to the generated PDF file (e.g., /invoices/2024/INV-2024-0001.pdf)', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'TM_INV_ClientInvoice', 
        @level2type = N'COLUMN', @level2name = N'inv_pdf_url';
    
    PRINT 'Extended property added for inv_pdf_url';
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.extended_properties 
    WHERE major_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]')
    AND minor_id = (
        SELECT column_id 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]') 
        AND name = 'inv_pdf_generated_at'
    )
    AND name = 'MS_Description'
)
BEGIN
    EXEC sys.sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Timestamp when the PDF was last generated (NULL if never generated)', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE', @level1name = N'TM_INV_ClientInvoice', 
        @level2type = N'COLUMN', @level2name = N'inv_pdf_generated_at';
    
    PRINT 'Extended property added for inv_pdf_generated_at';
END
GO

-- =============================================
-- Verification query
-- =============================================
PRINT '';
PRINT '=== Verification ===';
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'[dbo].[TM_INV_ClientInvoice]')
AND c.name IN ('inv_pdf_url', 'inv_pdf_generated_at')
ORDER BY c.name;

PRINT '';
PRINT 'Migration V1.0.0.4/01-add-pdf-columns.sql completed successfully';
GO

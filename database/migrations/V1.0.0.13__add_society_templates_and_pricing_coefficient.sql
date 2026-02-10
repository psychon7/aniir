-- V1.0.0.13: Add document template fields and pricing coefficient to society
-- Date: 2026-02-10

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_quote_header_text'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_quote_header_text NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_quote_footer_text'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_quote_footer_text NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_delivery_conditions_text'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_delivery_conditions_text NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_invoice_penalty_text'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_invoice_penalty_text NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_invoice_early_payment_discount_text'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_invoice_early_payment_discount_text NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_invoice_email_body'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_invoice_email_body NVARCHAR(4000) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('TR_SOC_Society') AND name = 'soc_pricing_coefficient_sod_cin'
)
BEGIN
    ALTER TABLE TR_SOC_Society ADD soc_pricing_coefficient_sod_cin DECIMAL(18,4) NULL;
END
GO

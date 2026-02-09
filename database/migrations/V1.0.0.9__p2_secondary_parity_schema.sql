-- ============================================================================
-- MIGRATION V1.0.0.9: P2 Secondary Parity Schema Completeness
-- ============================================================================
-- Description:
--   - Add document line image snapshot columns
--   - Add product interior dimension columns
--   - Create product component relationship table
--   - Add quote/order dual contact snapshot columns (invoicing + delivery)
--   - Ensure client-contact invoice/delivery flags exist
--   - Ensure society RIB/bank columns exist for settings parity
-- Date: 2026-02-09
-- ============================================================================

-- ==========================================================================
-- 1) Document line image snapshots
-- ==========================================================================
IF COL_LENGTH('TM_CII_ClientInvoice_Line', 'cii_image_url') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_CII_ClientInvoice_Line]
        ADD [cii_image_url] NVARCHAR(2000) NULL;
    PRINT 'Added TM_CII_ClientInvoice_Line.cii_image_url';
END
ELSE
BEGIN
    PRINT 'TM_CII_ClientInvoice_Line.cii_image_url already exists - skipping';
END
GO

IF COL_LENGTH('TM_COL_ClientOrder_Lines', 'col_image_url') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_COL_ClientOrder_Lines]
        ADD [col_image_url] NVARCHAR(2000) NULL;
    PRINT 'Added TM_COL_ClientOrder_Lines.col_image_url';
END
ELSE
BEGIN
    PRINT 'TM_COL_ClientOrder_Lines.col_image_url already exists - skipping';
END
GO

IF COL_LENGTH('TM_CLN_CostPlan_Lines', 'cln_image_url') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_CLN_CostPlan_Lines]
        ADD [cln_image_url] NVARCHAR(2000) NULL;
    PRINT 'Added TM_CLN_CostPlan_Lines.cln_image_url';
END
ELSE
BEGIN
    PRINT 'TM_CLN_CostPlan_Lines.cln_image_url already exists - skipping';
END
GO

-- ==========================================================================
-- 2) Product interior dimensions
-- ==========================================================================
IF COL_LENGTH('TM_PRD_Product', 'prd_interior_length') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
        ADD [prd_interior_length] DECIMAL(18, 4) NULL;
    PRINT 'Added TM_PRD_Product.prd_interior_length';
END
ELSE
BEGIN
    PRINT 'TM_PRD_Product.prd_interior_length already exists - skipping';
END
GO

IF COL_LENGTH('TM_PRD_Product', 'prd_interior_width') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
        ADD [prd_interior_width] DECIMAL(18, 4) NULL;
    PRINT 'Added TM_PRD_Product.prd_interior_width';
END
ELSE
BEGIN
    PRINT 'TM_PRD_Product.prd_interior_width already exists - skipping';
END
GO

IF COL_LENGTH('TM_PRD_Product', 'prd_opening_diameter') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
        ADD [prd_opening_diameter] DECIMAL(18, 4) NULL;
    PRINT 'Added TM_PRD_Product.prd_opening_diameter';
END
ELSE
BEGIN
    PRINT 'TM_PRD_Product.prd_opening_diameter already exists - skipping';
END
GO

IF COL_LENGTH('TM_PRD_Product', 'prd_thickness') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_PRD_Product]
        ADD [prd_thickness] DECIMAL(18, 4) NULL;
    PRINT 'Added TM_PRD_Product.prd_thickness';
END
ELSE
BEGIN
    PRINT 'TM_PRD_Product.prd_thickness already exists - skipping';
END
GO

-- ==========================================================================
-- 3) Product components relation table
-- ==========================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TI_PRC_ProductComponent')
BEGIN
    CREATE TABLE [dbo].[TI_PRC_ProductComponent] (
        [prc_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [prd_id] INT NOT NULL,
        [component_prd_id] INT NOT NULL,
        [prc_component_type] NVARCHAR(20) NOT NULL,
        [prc_quantity] DECIMAL(18, 4) NULL CONSTRAINT [DF_TI_PRC_ProductComponent_Quantity] DEFAULT (1),
        [prc_is_required] BIT NOT NULL CONSTRAINT [DF_TI_PRC_ProductComponent_IsRequired] DEFAULT (1),
        [prc_order] INT NOT NULL CONSTRAINT [DF_TI_PRC_ProductComponent_Order] DEFAULT (0),
        [prc_d_creation] DATETIME NOT NULL CONSTRAINT [DF_TI_PRC_ProductComponent_Creation] DEFAULT (GETDATE()),
        [prc_d_update] DATETIME NULL,

        CONSTRAINT [FK_TI_PRC_ProductComponent_Product]
            FOREIGN KEY ([prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id])
            ON DELETE CASCADE,
        CONSTRAINT [FK_TI_PRC_ProductComponent_Component]
            FOREIGN KEY ([component_prd_id]) REFERENCES [dbo].[TM_PRD_Product]([prd_id]),
        CONSTRAINT [CK_TI_PRC_ProductComponent_Type]
            CHECK ([prc_component_type] IN ('DRIVER', 'ACCESSORY', 'OPTION'))
    );

    CREATE UNIQUE INDEX [UQ_TI_PRC_ProductComponent_Link]
        ON [dbo].[TI_PRC_ProductComponent] ([prd_id], [component_prd_id], [prc_component_type]);

    CREATE INDEX [IX_TI_PRC_ProductComponent_Product]
        ON [dbo].[TI_PRC_ProductComponent] ([prd_id], [prc_component_type], [prc_order]);

    CREATE INDEX [IX_TI_PRC_ProductComponent_Component]
        ON [dbo].[TI_PRC_ProductComponent] ([component_prd_id]);

    PRINT 'Created table TI_PRC_ProductComponent';
END
ELSE
BEGIN
    PRINT 'Table TI_PRC_ProductComponent already exists - skipping';
END
GO

-- ==========================================================================
-- 4) Quote/Order delivery-contact links
-- ==========================================================================
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cco_id_delivery') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_CPL_Cost_Plan]
        ADD [cco_id_delivery] INT NULL;
    PRINT 'Added TM_CPL_Cost_Plan.cco_id_delivery';
END
ELSE
BEGIN
    PRINT 'TM_CPL_Cost_Plan.cco_id_delivery already exists - skipping';
END
GO

IF COL_LENGTH('TM_COD_Client_Order', 'cco_id_delivery') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_COD_Client_Order]
        ADD [cco_id_delivery] INT NULL;
    PRINT 'Added TM_COD_Client_Order.cco_id_delivery';
END
ELSE
BEGIN
    PRINT 'TM_COD_Client_Order.cco_id_delivery already exists - skipping';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TM_CPL_Cost_Plan_DeliveryContact')
BEGIN
    ALTER TABLE [dbo].[TM_CPL_Cost_Plan]
        ADD CONSTRAINT [FK_TM_CPL_Cost_Plan_DeliveryContact]
        FOREIGN KEY ([cco_id_delivery]) REFERENCES [dbo].[TM_CCO_Client_Contact]([cco_id]);
    PRINT 'Added FK FK_TM_CPL_Cost_Plan_DeliveryContact';
END
ELSE
BEGIN
    PRINT 'FK FK_TM_CPL_Cost_Plan_DeliveryContact already exists - skipping';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TM_COD_Client_Order_DeliveryContact')
BEGIN
    ALTER TABLE [dbo].[TM_COD_Client_Order]
        ADD CONSTRAINT [FK_TM_COD_Client_Order_DeliveryContact]
        FOREIGN KEY ([cco_id_delivery]) REFERENCES [dbo].[TM_CCO_Client_Contact]([cco_id]);
    PRINT 'Added FK FK_TM_COD_Client_Order_DeliveryContact';
END
ELSE
BEGIN
    PRINT 'FK FK_TM_COD_Client_Order_DeliveryContact already exists - skipping';
END
GO

-- ==========================================================================
-- 5) Quote/Order contact snapshots (invoicing + delivery)
-- ==========================================================================
-- NOTE: Columns are denormalized snapshots copied from TM_CCO_Client_Contact.

-- ----------------------------
-- TM_CPL_Cost_Plan snapshots
-- ----------------------------
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_ref') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_ref] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_adresse_title') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_adresse_title] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_firstname') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_firstname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_lastname') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_lastname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_address1') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_address1] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_address2') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_address2] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_postcode') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_postcode] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_city') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_city] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_country') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_country] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_tel1') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_tel1] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_tel2') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_tel2] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_fax') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_fax] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_cellphone') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_cellphone] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_inv_cco_email') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_inv_cco_email] NVARCHAR(100) NULL;

IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_ref') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_ref] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_adresse_title') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_adresse_title] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_firstname') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_firstname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_lastname') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_lastname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_address1') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_address1] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_address2') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_address2] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_postcode') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_postcode] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_city') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_city] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_country') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_country] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_tel1') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_tel1] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_tel2') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_tel2] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_fax') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_fax] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_cellphone') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_cellphone] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_CPL_Cost_Plan', 'cpl_dlv_cco_email') IS NULL ALTER TABLE [dbo].[TM_CPL_Cost_Plan] ADD [cpl_dlv_cco_email] NVARCHAR(100) NULL;
PRINT 'Ensured TM_CPL_Cost_Plan contact snapshot columns';
GO

-- ----------------------------
-- TM_COD_Client_Order snapshots
-- ----------------------------
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_ref') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_ref] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_adresse_title') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_adresse_title] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_firstname') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_firstname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_lastname') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_lastname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_address1') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_address1] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_address2') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_address2] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_postcode') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_postcode] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_city') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_city] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_country') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_country] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_tel1') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_tel1] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_tel2') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_tel2] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_fax') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_fax] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_cellphone') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_cellphone] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_inv_cco_email') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_inv_cco_email] NVARCHAR(100) NULL;

IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_ref') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_ref] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_adresse_title') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_adresse_title] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_firstname') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_firstname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_lastname') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_lastname] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_address1') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_address1] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_address2') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_address2] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_postcode') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_postcode] NVARCHAR(50) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_city') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_city] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_country') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_country] NVARCHAR(200) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_tel1') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_tel1] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_tel2') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_tel2] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_fax') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_fax] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_cellphone') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_cellphone] NVARCHAR(100) NULL;
IF COL_LENGTH('TM_COD_Client_Order', 'cod_dlv_cco_email') IS NULL ALTER TABLE [dbo].[TM_COD_Client_Order] ADD [cod_dlv_cco_email] NVARCHAR(100) NULL;
PRINT 'Ensured TM_COD_Client_Order contact snapshot columns';
GO

-- ==========================================================================
-- 6) Client contact invoice/delivery flags (safety guard)
-- ==========================================================================
IF COL_LENGTH('TM_CCO_Client_Contact', 'cco_is_delivery_adr') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_CCO_Client_Contact]
        ADD [cco_is_delivery_adr] BIT NOT NULL CONSTRAINT [DF_TM_CCO_Client_Contact_IsDeliveryAdr] DEFAULT (0);
    PRINT 'Added TM_CCO_Client_Contact.cco_is_delivery_adr';
END
ELSE
BEGIN
    PRINT 'TM_CCO_Client_Contact.cco_is_delivery_adr already exists - skipping';
END
GO

IF COL_LENGTH('TM_CCO_Client_Contact', 'cco_is_invoicing_adr') IS NULL
BEGIN
    ALTER TABLE [dbo].[TM_CCO_Client_Contact]
        ADD [cco_is_invoicing_adr] BIT NOT NULL CONSTRAINT [DF_TM_CCO_Client_Contact_IsInvoicingAdr] DEFAULT (0);
    PRINT 'Added TM_CCO_Client_Contact.cco_is_invoicing_adr';
END
ELSE
BEGIN
    PRINT 'TM_CCO_Client_Contact.cco_is_invoicing_adr already exists - skipping';
END
GO

-- ==========================================================================
-- 7) Society RIB/bank fields (primary + secondary)
-- ==========================================================================
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_name') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_name] NVARCHAR(500) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_address') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_address] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_code_iban') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_code_iban] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_code_bic') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_code_bic] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_bank_code') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_bank_code] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_agence_code') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_agence_code] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_account_number') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_account_number] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_key') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_key] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_domiciliation_agency') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_domiciliation_agency] NVARCHAR(200) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_abbre') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_abbre] NVARCHAR(50) NULL;

IF COL_LENGTH('TR_SOC_Society', 'soc_rib_name_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_name_2] NVARCHAR(500) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_address_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_address_2] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_code_iban_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_code_iban_2] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_code_bic_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_code_bic_2] NVARCHAR(1000) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_bank_code_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_bank_code_2] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_agence_code_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_agence_code_2] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_account_number_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_account_number_2] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_key_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_key_2] NVARCHAR(50) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_domiciliation_agency_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_domiciliation_agency_2] NVARCHAR(200) NULL;
IF COL_LENGTH('TR_SOC_Society', 'soc_rib_abbre_2') IS NULL ALTER TABLE [dbo].[TR_SOC_Society] ADD [soc_rib_abbre_2] NVARCHAR(50) NULL;
PRINT 'Ensured TR_SOC_Society RIB columns';
GO

PRINT 'Migration V1.0.0.9 completed.';
GO

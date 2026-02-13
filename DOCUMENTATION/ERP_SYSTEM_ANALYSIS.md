# ERP System - Complete Analysis & Documentation

## Project Overview

**Project Name:** ERP2025 (ECOLED EUROPE ERP System)  
**Company:** ECOLED EUROPE (LED Lighting Products)  
**Technology Stack (Current):** FastAPI (Python), React (Vite), Tailwind CSS, Socket.IO  
**Technology Stack (Legacy):** ASP.NET WebForms, C#, SQL Server, Entity Framework, jQuery, Bootstrap  
**Database:** ERP_ECOLED (SQL Server 2008)  
**Version:** 1.0.0.1+

---

## Table of Contents

1. [Current Implementation (2025/2026)](#current-implementation-20252026)
2. [Legacy System Reference](#legacy-system-reference)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Core Modules & Features](#core-modules--features)
6. [Project Structure](#project-structure)
7. [Technology Stack Details](#technology-stack-details)
8. [User Interface Components](#user-interface-components)
9. [API & Services](#api--services)

---

## Current Implementation (2025/2026)

### Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                    React SPA (Vite)                          │
│                Tailwind CSS + i18n                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│           FastAPI (REST) + Socket.IO                         │
│        Migrations on startup (new tables only)               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│                SQL Server 2008 (ERP_ECOLED)                  │
└─────────────────────────────────────────────────────────────┘
```

### Module Support Matrix

| Module | Legacy Tables | Current Status |
| --- | --- | --- |
| Clients & Contacts | `TM_CLI_CLient`, `TM_CCO_Client_Contact`, `TR_CTY_Client_Type`, `TR_CDL_Client_Delegate` | Implemented in API/UI; see column diffs in `DOCUMENTATION/db_schema_report.md`. |
| Suppliers | `TM_SUP_Supplier`, `TM_SCO_Supplier_Contact`, `TR_STY_Supplier_Type`, `TR_SPR_Supplier_Product` | Partial: supplier type and pricing tables are not modeled yet. |
| Products & Categories | `TM_PRD_Product`, `TM_PIT_Product_Instance`, `TM_PTY_Product_Type`, `TM_CAT_Category`, `TR_PCA_Product_Category`, `TI_PIM_Product_Image`, `TI_PTI_Product_Instance_Image` | Partial: image/category link tables not modeled; new attribute tables are app-only. |
| Projects | `TM_PRJ_Project` | Implemented. |
| Quotes (Devis) | `TM_CPL_Cost_Plan`, `TM_CLN_CostPlan_Lines`, `TR_CST_CostPlan_Statut` | Implemented using CostPlan; `TM_QUO_Quote` is disabled (no DB table). |
| Orders | `TM_COD_Client_Order`, `TM_COL_ClientOrder_Lines` | Implemented. |
| Deliveries | `TM_DFO_Delivery_Form`, `TM_DFL_DevlieryForm_Line` | Implemented. |
| Invoices & Payments | `TM_CIN_Client_Invoice`, `TM_CII_ClientInvoice_Line`, `TM_CPY_ClientInvoice_Payment` | Implemented (see column diffs). |
| Purchase Intents | `TM_PIN_Purchase_Intent`, `TM_PIL_PurchaseIntent_Lines` | Implemented. |
| Supplier Orders/Invoices | `TM_SOD_Supplier_Order`, `TM_SOL_SupplierOrder_Lines`, `TM_SIN_Supplier_Invoice`, `TM_SIL_SupplierInvoice_Lines` | Implemented. |
| Logistics | `TM_LGS_Logistic`, `TM_LGL_Logistic_Lines`, `TR_LSI_Logistic_SupplierInvoice` | Models exist, but API router is disabled; UI exists. Not wired to legacy DB. |
| Warehouse/Inventory | `TM_WHS_WareHouse`, `TM_SHE_Shelves`, `TM_INV_Inventory`, `TR_PSH_Product_Shelves`, `TI_INVR_INV_Record` | Not aligned: current API uses `TM_STK_*` tables which are not in legacy DB. |
| Users/RBAC | `TM_USR_User`, `TR_ROL_Role`, `TR_RIT_Right`, `TR_SCR_Screen` | Users implemented; RBAC tables not modeled/used. |
| Calendar/Messaging | `TM_CLD_Calendar`, `TI_MSG_Message`, `TH_U*` | Not implemented; new chat tables are app-only. |
| Site/E-commerce | `TS_*` tables | Not implemented in current app. |
| Drive/Files | (none in legacy DB) | New app tables `TM_DRV_*` (app-only). |
| Integrations (Shopify/X3) | (none in legacy DB) | New app tables `TM_INT_*`, `TR_SHP_*` (app-only). |
| Landed Cost/Supply Lots/Tasks | (none in legacy DB) | New app tables `TM_LC*`, `TM_LOT_*`, `TM_TSK_*` (app-only). |

### DB Alignment Summary

- Source of truth: `backend/db_schema.json` (SQL Server extract).
- DB tables: 105; app models: 82.
- DB tables missing in models: 51; app tables missing in DB: 28.
- Column mismatches exist across 20 shared tables.
- Full detail: `DOCUMENTATION/db_schema_report.md` and `DOCUMENTATION/DATABASE_SCHEMA.md`.

### Known Gaps (Impacting Legacy Parity)

- Logistics API is disabled and does not use legacy logistics tables.
- Warehouse/stock APIs use new `TM_STK_*` tables, not legacy inventory tables.
- RBAC tables (`TR_RIT_Right`, `TR_SCR_Screen`) are not modeled or enforced.
- Site/e-commerce (`TS_*`) and messaging/calendar (`TI_MSG_*`, `TM_CLD_Calendar`, `TH_U*`) are not implemented.

## Legacy System Reference

## System Architecture

### Multi-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │   ERP.Web (Admin)    │    │  ERP.SiteNC202310 (Site) │  │
│  │   ASP.NET WebForms   │    │   Public Website         │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  ERP.DataServices    │    │   ERP.SharedServices     │  │
│  │  Business Services   │    │   PDF, Email, Barcode    │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  ERP.Repositories    │    │     ERP.Entities         │  │
│  │  SQL Server Repos    │    │     Domain Models        │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│              SQL Server (ERP_ECOLED Database)                │
└─────────────────────────────────────────────────────────────┘
```

### Project Dependencies

- **ERP.Web** → ERP.DataServices, ERP.Entities, ERP.Repositories, ERP.SharedServices
- **ERP.SiteNC202310** → ERP.DataServices, ERP.Entities, ERP.RefSite, ERP.Repositories, ERP.SharedServices, ERP.Web
- **ERP.DataServices** → ERP.Entities, ERP.Repositories
- **ERP.Repositories** → ERP.Entities
- **ERP.SharedServices** → ERP.Entities, ERP.Repositories

---

## Database Schema

### Core Reference Tables (TR_*)

#### 1. **TR_LNG_Language** - Languages
- `lng_id` (PK)
- `lng_label` - Language name
- `lng_short_label` - Short code

#### 2. **TR_CUR_Currency** - Currencies
- `cur_id` (PK)
- `cur_designation` - Currency name
- `cur_ci_num` - Currency code number
- `cur_symbol` - Currency symbol (€, $, etc.)
- `lng_id` (FK)

#### 3. **TR_SOC_Society** - Company/Society
- `soc_id` (PK)
- `soc_society_name` - Company name
- `soc_is_actived` - Active status
- `cur_id`, `lng_id` (FK)
- Address fields (address1, address2, postcode, city, county)
- Contact info (tel, fax, cellphone, email)
- Legal info (siret, rcs, tva_intra)
- Bank info (rib_name, rib_address, rib_code_iban, rib_code_bic)
- `soc_capital` - Company capital
- `soc_email_auto` - Auto email flag

#### 4. **TR_ROL_Role** - User Roles
- `rol_id` (PK)
- `rol_name` - Role name
- `rol_active` - Active status

#### 5. **TR_SCR_Screen** - Screens/Pages
- `scr_id` (PK)
- `scr_name` - Screen name

#### 6. **TR_RIT_Right** - User Rights/Permissions
- `rit_id` (PK)
- `scr_id`, `rol_id` (FK)
- `rit_read`, `rit_valid`, `rit_modifiy`, `rit_create`, `rit_delete`, `rit_active`, `rit_cancel` - Permission flags

#### 7. **TR_CIV_Civility** - Civility/Titles
- `civ_id` (PK)
- `civ_designation` - Mr., Mrs., Ms., etc.
- `civ_active`

#### 8. **TR_PMO_Payment_Mode** - Payment Methods
- `pmo_id` (PK)
- `pmo_designation` - Cash, Check, Transfer, etc.
- `pmo_isactive`

#### 9. **TR_PCO_Payment_Condition** - Payment Terms
- `pco_id` (PK)
- `pco_designation` - Payment terms description
- `pco_active`
- `pco_numday` - Number of days
- `pco_day_additional` - Additional days
- `pco_end_month` - End of month flag

#### 10. **TR_VAT_Vat** - VAT/Tax Rates
- `vat_id` (PK)
- `vat_designation` - VAT name
- `vat_vat_rate` - Tax rate (20%, 5.5%, etc.)
- `vat_description`

#### 11. **TR_CTY_Client_Type** - Client Types
- `cty_id` (PK)
- `cty_description` - Client/Prospect

#### 12. **TR_ACT_Activity** - Business Activities
- `act_id` (PK)
- `act_designation` - Activity type
- `act_isactive`

#### 13. **TR_COU_Country** - Countries
- `cou_id` (PK)
- `cou_name`, `cou_code`, `cou_iso_code`

#### 14. **TR_REG_Region** - Regions
- `reg_id` (PK)
- `reg_code`, `reg_name`
- `cou_id` (FK)

#### 15. **TR_DEP_Department** - Departments
- `dep_id` (PK)
- `dep_code`, `dep_name`
- `reg_id` (FK)

#### 16. **TR_CMU_Commune** - Communes/Cities
- `cmu_id` (PK)
- `cmu_code`, `cmu_name`, `cmu_postcode`
- Geographic data (longitude, latitude, altitude, superficie, population)
- `dep_id` (FK)

#### 17. **TR_POS_Position** - Job Positions
- `pos_id` (PK)
- `pos_designation`
- `pos_active`

#### 18. **TR_CST_CostPlan_Statut** - Cost Plan Status
- `cst_id` (PK)
- `cst_designation` - Draft, Validated, etc.
- `cst_isactive`

#### 19. **TR_LTP_Line_Type** - Line Types
- `ltp_id` (PK)
- `ltp_name` - Product, Service, Comment, etc.
- `ltp_description`
- `ltp_isactive`

#### 20. **TR_ALB_Album** - Photo Albums
- `alb_id` (PK)
- `alb_name`, `alb_description`
- `alb_d_creation`
- `soc_id` (FK)

#### 21. **TR_PAL_Photo_Album** - Album Photos
- `pal_id` (PK)
- `alb_id` (FK)
- `pal_description`, `pal_path`
- `pal_d_creation`, `pal_d_update`

#### 22. **TR_BAC_Bank_Account** - Bank Accounts
- `bac_id` (PK)
- `bac_bank_name`, `bac_bank_adr`
- `bac_account_number`, `bac_bic`, `bac_iban`
- RIB details (bank_code, agence_code, account_number, key)
- `bac_account_owner`
- `bac_type` - 1:Client, 2:Supplier, 3:Contact Client, 4:Contact Supplier, 5:Enterprise
- `f_id` - Foreign ID reference
- `soc_id` (FK)

#### 23. **TR_STY_Supplier_Type** - Supplier Types
- `sty_id` (PK)
- `sty_description` - Supplier, Freight Forwarder, etc.

#### 24. **TR_DTP_Document_Type** - Document Types
- `dtp_id` (PK)
- `dtp_name`

#### 25. **TR_FRE_File_Recycle** - File Recycle Bin
- `fre_id` (PK)
- `fre_path` - Deleted file path
- `fre_d_create`

#### 26. **TR_THF_Text_Header_Footer** - Header/Footer Templates
- `thf_id` (PK)
- `thf_header`, `thf_footer` - For quotations
- `thf_cin_header`, `thf_cin_footer` - For invoices
- `thf_dlv_footer_condition`, `thf_dlv_footer_law` - For delivery forms
- `thf_cin_penality`, `thf_cin_discount_for_prepayment`

---

### Master Tables (TM_*)

#### 1. **TM_USR_User** - Users
- `usr_id` (PK)
- `rol_id` (FK) - Role
- `usr_login`, `usr_pwd` (encrypted)
- `usr_firstname`, `usr_lastname`, `usr_title`
- `civ_id` (FK)
- Contact info (tel, cellphone, fax, email)
- `usr_code_hr` - HR code
- `usr_d_creation`, `usr_d_update`
- `usr_is_actived`
- `usr_photo_path`
- `soc_id` (FK)
- Address fields
- `usr_super_right` - Super admin flag
- `usr_creator_id` (FK) - Self-reference

#### 2. **TM_CLI_Client** - Clients/Customers
- `cli_id` (PK)
- `cli_ref` - Client reference
- `soc_id` (FK)
- `cli_company_name`
- `vat_id`, `pco_id`, `pmo_id`, `act_id` (FK)
- Legal info (siren, siret, vat_intra)
- `usr_created_by` (FK)
- `cty_id` (FK) - Client type (1:Client, 2:Prospect)
- `cur_id` (FK)
- `cli_isactive`, `cli_isblocked`
- `cli_d_creation`, `cli_d_update`
- Address fields
- `cli_free_of_harbor` - Harbor fees
- Contact info
- `cli_usr_com1`, `cli_usr_com2`, `cli_usr_com3` (FK) - Commercial users
- `cli_recieve_newsletter`, `cli_newsletter_email`
- `cmu_id` (FK) - Commune
- `cli_comment_for_client`, `cli_comment_for_interne`
- `cli_invoice_day`, `cli_invoice_day_is_last_day`

#### 3. **TM_CCO_Client_Contact** - Client Contacts
- `cco_id` (PK)
- `cco_firstname`, `cco_lastname`
- `civ_id` (FK)
- `cco_ref`
- `cco_adresse_title`
- Address fields
- Contact info
- `cco_recieve_newsletter`, `cco_newsletter_email`
- `cco_is_delivery_adr`, `cco_is_invoicing_adr`
- `cli_id` (FK)
- `usr_created_by` (FK)
- `cco_d_creation`, `cco_d_update`
- `cco_comment`
- `cmu_id` (FK)

#### 4. **TM_SUP_Supplier** - Suppliers
- `sup_id` (PK)
- `sup_ref`
- `soc_id` (FK)
- `sup_company_name`
- `vat_id`, `pco_id`, `pmo_id` (FK)
- Legal info (siren, siret, vat_intra)
- `usr_created_by` (FK)
- `cur_id` (FK)
- `sup_isactive`, `sup_isblocked`
- `sup_d_creation`, `sup_d_update`
- Address fields
- `sup_free_of_harbor`
- Contact info
- `sup_recieve_newsletter`, `sup_newsletter_email`
- `sup_comment_for_supplier`, `sup_comment_for_interne`
- `sty_id` (FK) - Supplier type

#### 5. **TM_SCO_Supplier_Contact** - Supplier Contacts
- `sco_id` (PK)
- Similar structure to Client Contact
- `sup_id` (FK)

#### 6. **TM_PTY_Product_Type** - Product Types
- `pty_id` (PK)
- `soc_id` (FK)
- `pty_name` - Type name (LED, DRIVER, ACCESSOIRE, etc.)
- `pty_description`
- `pty_specifications_fields` (XML) - Dynamic fields
- `pty_active`
- `pty_standards` - Product standards/certifications

#### 7. **TM_PTM_Product_Type_Matrix** - Product Type Matrix
- `ptm_id` (PK)
- `pty_id` (FK)
- `ptm_range_X` (XML) - X-axis values
- `ptm_range_Y` (XML) - Y-axis values
- `ptm_range_Z` (XML) - Z-axis values (variables)
- `ptm_matrix` (XML) - Combined matrix with GUIDs

#### 8. **TM_PRD_Product** - Products
- `prd_id` (PK)
- `prd_ref` - Product reference
- `prd_code` - Product code
- `soc_id`, `pty_id` (FK)
- `prd_name`, `prd_sub_name`
- `prd_description`
- `prd_price`, `prd_purchase_price`
- `prd_file_name` - Excel import reference
- `prd_specifications` (XML) - Product specifications
- `prd_d_creation`, `prd_d_update`
- Dimensions:
  - `prd_outside_diameter`, `prd_length`, `prd_width`, `prd_height`
  - `prd_outside_length`, `prd_outside_width`, `prd_outside_height`
  - `prd_hole_lenght`, `prd_hole_width`, `prd_hole_size`, `prd_depth`
  - `prd_weight`
- Unit dimensions:
  - `prd_unit_length`, `prd_unit_width`, `prd_unit_height`, `prd_unit_weight`
- Carton info:
  - `prd_quantity_each_carton`
  - `prd_carton_length`, `prd_carton_width`, `prd_carton_height`, `prd_carton_weight`

#### 9. **TM_PIT_Product_Instance** - Product Variants/Instances
- `pit_id` (PK)
- `prd_id`, `pty_id` (FK)
- `pit_price`, `pit_purchase_price`
- `pit_ref` - Variant reference
- `pit_description`
- `pit_prd_info` (XML) - Variant-specific properties

#### 10. **TM_PCT_Product_Catelogue** - Product Categories
- `pct_id` (PK)
- `pct_name`, `pct_description`
- `pct_level` - Category hierarchy level
- `pct_actived`
- `pct_main_img`, `pct_sec_img` - Category images
- `pct_parent_id` (FK) - Self-reference for hierarchy
- `soc_id` (FK)

#### 11. **TI_PIC_Product_In_Catelogue** - Product-Category Mapping
- `pic_id` (PK)
- `pct_id`, `prd_id` (FK)

#### 12. **TI_PIM_Product_Image** - Product Images
- `pim_id` (PK)
- `prd_id` (FK)
- `pim_path` - Image path
- `pim_order` - Display order
- `pal_id` (FK) - Optional album reference
- `pim_description`

#### 13. **TI_PTI_Product_Instance_Image** - Product Instance Images
- `pti_id` (PK)
- `pit_id` (FK)
- `pti_path`, `pti_order`
- `pal_id` (FK)
- `pti_description`

#### 14. **TR_SPR_Supplier_Product** - Supplier Product Pricing
- `spr_id` (PK)
- `sup_id`, `prd_id` (FK)
- `spr_prd_ref` - Supplier's product reference
- Price tiers:
  - `spr_price_1_100` - 1-100 units
  - `spr_price_100_500` - 100-500 units
  - `spr_price_500_plus` - 500+ units
- `spr_comment`
- `soc_id`, `cur_id` (FK)

#### 15. **TM_PRJ_Project** - Projects
- `prj_id` (PK)
- `prj_code` - Project code
- `prj_name`
- `prj_d_creation`, `prj_d_update`
- `cli_id` (FK)
- `pco_id`, `pmo_id`, `vat_id` (FK)
- `soc_id` (FK)
- `prj_header_text`, `prj_footer_text`
- `prj_client_comment`, `prj_inter_comment`
- `usr_creator_id` (FK)

#### 16. **TM_CPL_Cost_Plan** - Quotations/Devis
- `cpl_id` (PK)
- `cpl_code`, `cpl_name`
- `cpl_d_creation`, `cpl_d_update`
- `cst_id` (FK) - Status
- `cli_id`, `prj_id` (FK)
- `pco_id`, `pmo_id`, `vat_id` (FK)
- `cpl_d_validity` - Valid until date
- `cpl_d_pre_delivery` - Estimated delivery
- `cpl_header_text`, `cpl_footer_text`
- `cco_id_delivery`, `cco_id_invoicing` (FK)
- Delivery contact snapshot:
  - `cpl_dlv_cco_firstname`, `cpl_dlv_cco_lastname`
  - Address and contact fields
- Invoicing contact snapshot:
  - `cpl_inv_cco_firstname`, `cpl_inv_cco_lastname`
  - Address and contact fields
- `cpl_client_comment`, `cpl_inter_comment`
- `usr_creator_id` (FK)
- `soc_id` (FK)
- `cpl_discount_percentage`, `cpl_discount_amount`

#### 17. **TM_CLN_CostPlan_Lines** - Quotation Lines
- `cln_id` (PK)
- `cpl_id` (FK)
- `cln_level1`, `cln_level2` - Hierarchy levels
- `cln_description`
- `prd_id`, `pit_id` (FK)
- `cln_prd_name` - Product name (for non-product lines)
- `cln_purchase_price`, `cln_unit_price`
- `cln_quantity`
- `cln_total_price`, `cln_total_crude_price`
- `vat_id`, `ltp_id` (FK)
- `cln_discount_percentage`, `cln_discount_amount`
- `cln_price_with_discount_ht`
- `cln_margin`

#### 18. **TM_COD_Client_Order** - Client Orders
- `cod_id` (PK)
- `cod_code`, `cod_name`
- `cod_d_creation`, `cod_d_update`
- `cli_id`, `prj_id` (FK)
- `pco_id`, `pmo_id`, `vat_id` (FK)
- `cod_d_pre_delivery_from`, `cod_d_pre_delivery_to`
- `cod_d_end_work` - Work completion date
- `cod_header_text`, `cod_footer_text`
- `cco_id_delivery`, `cco_id_invoicing` (FK)
- Contact snapshots (similar to Cost Plan)
- `cod_client_comment`, `cod_inter_comment`
- `usr_creator_id` (FK)
- `cpl_id` (FK) - Source quotation
- `soc_id` (FK)
- `cod_discount_percentage`, `cod_discount_amount`
- `cod_file` - Scanned order document

#### 19. **TM_COL_ClientOrder_Lines** - Order Lines
- `col_id` (PK)
- `cod_id`, `cln_id` (FK)
- Similar structure to Cost Plan Lines

#### 20. **TM_DFO_Delivery_Form** - Delivery Forms/Bon de Livraison
- `dfo_id` (PK)
- `dfo_code`
- `dfo_d_creation`, `dfo_d_update`, `dfo_d_delivery`
- `cli_id`, `cod_id` (FK)
- `dfo_header_text`, `dfo_footer_text`
- `cco_id_delivery` (FK)
- Delivery contact snapshot
- `dfo_delivery_comment`, `dfo_inter_comment`
- `usr_creator_id` (FK)
- `dfo_file`
- `soc_id` (FK)
- `dfo_deliveried` - Delivery status

#### 21. **TM_DFL_DevlieryForm_Line** - Delivery Form Lines
- `dfl_id` (PK)
- `dfo_id`, `col_id` (FK)
- `dfl_description`
- `dfl_quantity`

#### 22. **TM_CIN_Client_Invoice** - Client Invoices
- `cin_id` (PK)
- `cin_code`, `cin_name`
- `cod_id`, `dfo_id` (FK) - Source order/delivery
- `cli_id`, `prj_id` (FK)
- `cin_d_creation`, `cin_d_update`, `cin_d_invoice`
- `usr_creator_id` (FK)
- Contact snapshots (delivery & invoicing)
- `cin_header_text`, `cin_footer_text`
- `cur_id`, `pco_id`, `pmo_id`, `vat_id` (FK)
- `cin_account` - Accounting flag
- `cin_d_term` - Payment due date
- `cin_isinvoice` - Invoice/Credit note flag
- `cin_discount_percentage`, `cin_discount_amount`
- `cin_file`
- `cin_client_comment`, `cin_inter_comment`
- `soc_id` (FK)
- `cin_rest_to_pay` - Remaining balance
- `cin_d_encaissement` - Payment received date
- `cin_avoir_id` (FK) - Credit note reference

#### 23. **TM_CII_ClientInvoice_Line** - Invoice Lines
- `cii_id` (PK)
- `cin_id`, `dfl_id` (FK)
- Similar structure to Order Lines
- `cii_av_id` (FK) - Credit note line reference

#### 24. **TM_CPY_ClientInvoice_Payment** - Invoice Payments
- `cpy_id` (PK)
- `cin_id` (FK)
- `cpy_amount`
- `cpy_d_create`
- `cpy_file` - Payment proof

#### 25. **TM_PIN_Purchase_Intent** - Purchase Intents
- `pin_id` (PK)
- `pin_code`, `pin_name`
- `pin_inter_comment`, `pin_supplier_comment`
- `soc_id` (FK)
- `pin_d_creation`, `pin_d_update`
- `pin_creator_id` (FK)
- `pin_closed` - Closed status

#### 26. **TM_PIL_PurchaseIntent_Lines** - Purchase Intent Lines
- `pil_id` (PK)
- `pin_id`, `prd_id`, `pit_id` (FK)
- `pil_order`, `pil_quantity`
- `pil_description`

#### 27. **TM_SOD_Supplier_Order** - Supplier Orders
- `sod_id` (PK)
- `sup_id`, `sco_id` (FK)
- `sod_inter_comment`, `sod_supplier_comment`
- `soc_id` (FK)
- `sod_code`, `sod_name`
- `sod_d_creation`, `sod_d_update`
- `usr_creator_id` (FK)
- `sod_file`
- `pin_id` (FK) - Source purchase intent
- `sod_discount_amount`
- `cur_id`, `vat_id` (FK)

#### 28. **TM_SOL_SupplierOrder_Lines** - Supplier Order Lines
- `sol_id` (PK)
- `sod_id`, `prd_id`, `pit_id`, `pil_id` (FK)
- `sol_order`, `sol_description`, `sol_quantity`
- `sol_unit_price`, `sol_discount_amount`
- `sol_total_price`, `sol_total_crude_price`, `sol_price_with_dis`
- `vat_id` (FK)

#### 29. **TM_SIN_Supplier_Invoice** - Supplier Invoices
- `sin_id` (PK)
- `sup_id`, `sco_id`, `sod_id` (FK)
- `sin_inter_comment`, `sin_supplier_comment`
- `soc_id` (FK)
- `sin_code`, `sin_name`
- `sin_d_creation`, `sin_d_update`
- `usr_creator_id` (FK)
- `sin_file`
- `sin_discount_amount`
- `cur_id`, `vat_id` (FK)
- `sin_is_paid`
- `sin_bank_receipt_file`, `sin_bank_receipt_number`
- Production tracking:
  - `sin_start_production`, `sin_d_start_production`
  - `sin_d_complete_production_pre`, `sin_d_complete_production`
  - `sin_complete_production`
- `bac_id` (FK) - Bank account

#### 30. **TM_SIL_SupplierInvoice_Lines** - Supplier Invoice Lines
- `sil_id` (PK)
- `sin_id`, `prd_id`, `pit_id`, `sol_id` (FK)
- Similar structure to Supplier Order Lines

#### 31. **TM_LGS_Logistic** - Logistics/Shipments
- `lgs_id` (PK)
- `lgs_code`, `lgs_name`
- `lgs_is_send` - Sent status
- `sup_id` (FK) - Freight forwarder
- `lgs_d_send`, `lgs_d_arrive_pre`, `lgs_d_arrive`
- `lgs_comment`
- `soc_id` (FK)
- `lgs_file`
- `lgs_guid` - Batch GUID
- `lgs_is_purchase` - Purchase/Delivery flag

#### 32. **TM_LGL_Logistic_Lines** - Logistics Lines
- `lgl_id` (PK)
- `lgl_guid` - Line batch GUID
- `lgs_id`, `prd_id`, `pit_id` (FK)
- `lgs_quantity`, `lgs_unit_price`, `lgs_total_price`
- `lgs_prd_name`, `lgs_prd_ref`, `lgs_description`

#### 33. **TM_WHS_WareHouse** - Warehouses
- `whs_id` (PK)
- `whs_name`, `whs_code`
- Address fields
- `whs_volume`

#### 34. **TM_SHE_Shelves** - Warehouse Shelves
- `she_id` (PK)
- `whs_id` (FK)
- `she_code`
- `she_floor`, `she_line`, `she_row` - Location coordinates

#### 35. **TI_DOC_Document** - Documents
- `doc_id` (PK)
- `dtp_id` (FK)
- `doc_path`, `doc_name`, `doc_description`

---

### Site Tables (TS_*) - Public Website

#### 1. **TS_PRJ_Project** - Site Projects/Realizations
- `prj_id` (PK)
- `prj_name`, `prj_description`
- `prj_date`, `prj_d_create`
- `prj_location`, `prj_client`, `prj_designer`
- `prj_actived`, `prj_recommended`

#### 2. **TS_PIG_Project_Image** - Project Images
- `pig_id` (PK)
- `prj_id` (FK)
- `pig_order`, `pig_path`

#### 3. **TS_PPD_Project_Product** - Project Products
- `ppd_id` (PK)
- `prd_id`, `prj_id` (FK)

#### 4. **TS_TAG_Tags** - Tags
- `tag_id` (PK)
- `tag_tag`

#### 5. **Shopping Cart & Wishlist Tables**
- Shopping cart lines
- Wishlist items
- User orders from website

---

## Core Modules & Features

### 1. **Client Management (CRM)**
**Location:** `ERP.Web/Views/Client/`

**Features:**
- Client creation and management
- Client contacts management
- Client type classification (Client/Prospect)
- Commercial assignment (3 commercial users per client)
- Address management with commune lookup
- Newsletter subscription
- Client pricing
- Client applications
- Search and filtering

**Key Pages:**
- `Client.aspx` - Client details
- `SearchClient.aspx` - Client search
- `ClientPrice.aspx` - Client-specific pricing
- `ClientApplication.aspx` - Client applications

### 2. **Supplier Management**
**Location:** `ERP.Web/Views/Supplier/`

**Features:**
- Supplier creation and management
- Supplier contacts
- Supplier types (Supplier, Freight Forwarder)
- Supplier product catalog with pricing tiers
- Price comparison
- Search and filtering

**Key Pages:**
- `Supplier.aspx` - Supplier details
- `SearchSupplier.aspx` - Supplier search
- `SupplierProduct.aspx` - Supplier products
- `SupplierPrice.aspx` - Supplier pricing
- `SupplierProductSearch.aspx` - Product search

### 3. **Product Management**
**Location:** `ERP.Web/Views/Product/`

**Features:**
- Product catalog management
- Product types (LED, DRIVER, ACCESSOIRE, OPTION)
- Product variants/instances with dynamic attributes
- Product categories (hierarchical)
- Product images (multiple per product)
- Technical specifications (XML-based)
- Dimensions and packaging info
- Pricing (sale & purchase)
- Technical sheet generation (PDF)
- Product attributes matrix
- Recommended products
- Site project products

**Key Pages:**
- `Product.aspx` - Product details
- `SearchProduct.aspx` - Product search
- `ProductAttribute.aspx` - Product attributes
- `ProductExpress.aspx` - Quick product entry
- `RecommandedProduct.aspx` - Featured products
- `SiteProject.aspx` - Website project management
- `SearchAttProduct.aspx` - Attribute search

### 4. **Project & Quotation Management**
**Location:** `ERP.Web/Views/Project/`, `ERP.Web/Views/CostPlan/`

**Features:**
- Project creation and tracking
- Quotation (Devis) creation
- Multi-level line items
- Discount management (percentage & amount)
- Margin calculation
- Header/Footer text templates
- Contact snapshots (delivery & invoicing)
- Validity period
- PDF generation
- Status workflow

**Key Pages:**
- `Project.aspx` - Project details
- `SearchProject.aspx` - Project search
- `ProjectCostPlanList.aspx` - Project quotations
- `ProjectClientOrderList.aspx` - Project orders
- `ProjectClientInvoiceList.aspx` - Project invoices
- `CostPlan.aspx` - Quotation details
- `SearchCostPlan.aspx` - Quotation search

### 5. **Order Management**
**Location:** `ERP.Web/Views/ClientOrder/`

**Features:**
- Client order creation from quotations
- Order line management
- Delivery tracking
- Order status
- PDF generation
- File attachment (scanned orders)

**Key Pages:**
- `ClientOrder.aspx` - Order details
- `SearchClientOrder.aspx` - Order search
- `ClientOrderDeliveryFormList.aspx` - Delivery forms

### 6. **Delivery Management**
**Location:** `ERP.Web/Views/DeliveryForm/`

**Features:**
- Delivery form (Bon de Livraison) creation
- Partial deliveries
- Delivery tracking
- PDF generation

**Key Pages:**
- `DeliveryForm.aspx` - Delivery form details
- `SearchDeliveryForm.aspx` - Delivery search

### 7. **Invoice Management**
**Location:** `ERP.Web/Views/ClientInvoice/`

**Features:**
- Invoice creation from orders/deliveries
- Credit notes (Avoir)
- Payment tracking
- Payment terms
- Accounting integration
- Invoice statements
- PDF generation

**Key Pages:**
- `ClientInvoice.aspx` - Invoice details
- `ClientInvoiceA.aspx` - Credit note
- `SearchClientInvoice.aspx` - Invoice search
- `ClientInvoiceStatment.aspx` - Invoice statements

### 8. **Purchase Management**
**Location:** `ERP.Web/Views/PurchaseIntent/`, `ERP.Web/Views/SupplierOrder/`, `ERP.Web/Views/SupplierInvoice/`

**Features:**
- Purchase intent creation
- Supplier order management
- Supplier invoice processing
- Production tracking
- Payment tracking
- Multi-currency support

**Key Pages:**
- `PurchaseIntent.aspx` - Purchase intent
- `SearchPurchaseIntent.aspx` - Intent search
- `SupplierOrder.aspx` - Supplier order
- `SearchSupplierOrder.aspx` - Order search
- `SupplierOrderStatus.aspx` - Production status
- `SupplierOrderPayment.aspx` - Payment tracking
- `SupplierInvoice.aspx` - Supplier invoice
- `SearchSupplierInvoice.aspx` - Invoice search

### 9. **Logistics & Warehouse**
**Location:** `ERP.Web/Views/Logistics/`, `ERP.Web/Views/Warehouse/`

**Features:**
- Logistics/shipment tracking
- Warehouse management
- Shelf management
- Inventory tracking
- Warehouse vouchers
- Product inventory

**Key Pages:**
- `Logistics.aspx` - Logistics details
- `SearchLogistics.aspx` - Logistics search
- `Warehouse.aspx` - Warehouse management
- `Shelves.aspx` - Shelf management
- `ProductInventory.aspx` - Inventory
- `WarehouseVoucher.aspx` - Vouchers
- `SearchVoucher.aspx` - Voucher search

### 10. **User & Administration**
**Location:** `ERP.Web/Views/User/`, `ERP.Web/Views/Admin/`

**Features:**
- User management
- Role-based access control
- Screen permissions
- Enterprise settings
- Data import

**Key Pages:**
- `Users.aspx` - User management
- `EnterpriseSetting.aspx` - Company settings
- `ImportData.aspx` - Data import

### 11. **Calendar & Messaging**
**Location:** `ERP.Web/Views/Calendar/`, `ERP.Web/Views/Message/`

**Features:**
- Calendar/scheduling
- Event management
- Internal messaging

**Key Pages:**
- `Calendar.aspx` - Calendar view
- `edit.aspx` - Event editor
- `Message.aspx` - Messages

### 12. **Album & Media**
**Location:** `ERP.Web/Views/Album/`

**Features:**
- Photo album management
- Image library
- Product image management

**Key Pages:**
- `Album.aspx` - Album management

### 13. **Category Management**
**Location:** `ERP.Web/Views/Category/`

**Features:**
- Product category hierarchy
- Category images
- Category search

**Key Pages:**
- `Category.aspx` - Category management
- `SearchCategory.aspx` - Category search

### 14. **Consignee Management**
**Location:** `ERP.Web/Views/Consignee/`

**Features:**
- Delivery address management

**Key Pages:**
- `SearchConsignee.aspx` - Consignee search

---

## Public Website Features (ERP.SiteNC202310)

### Pages:
1. **Default.aspx** - Homepage with product categories
2. **ProductList.aspx** - Product catalog
3. **ProductDetail.aspx** - Product details with technical sheet
4. **Cart.aspx** - Shopping cart
5. **Wishlist.aspx** - Wishlist
6. **OrderList.aspx** - User orders
7. **Realisation.aspx** - Project gallery
8. **Realisation_Details.aspx** - Project details
9. **AboutUs.aspx** - About page
10. **Contact.aspx** - Contact form
11. **Download.aspx** - Downloads
12. **LoginRegister.aspx** - User authentication
13. **TechSheet.aspx** - Technical sheet PDF generation

### Features:
- Product browsing by category
- Product search and filtering
- Shopping cart functionality
- User registration and login
- Order placement
- Order history
- Wishlist management
- Project showcase
- Technical sheet download
- Contact form with email/SMS
- Responsive design

---

## Project Structure

### Solution Projects

```
ERP2025/
├── ERP/                          # Main solution folder
│   └── ERP.sln                   # Visual Studio solution
├── ERP.Web/                      # Admin web application
│   ├── Views/                    # ASPX pages organized by module
│   ├── Services/                 # Web services (ASMX)
│   ├── UC/                       # User controls
│   ├── js/                       # JavaScript files
│   ├── css/                      # Stylesheets
│   └── img/                      # Images
├── ERP.SiteNC202310/             # Public website
│   ├── *.aspx                    # Public pages
│   ├── Service/                  # Web services
│   ├── js/Web/                   # JavaScript
│   ├── Styles/                   # CSS
│   └── static/                   # Static assets
├── ERP.DataServices/             # Business logic layer
│   ├── *Services.cs              # Service classes
│   └── Properties/
├── ERP.Repositories/             # Data access layer
│   ├── DataBase/                 # Entity Framework
│   │   └── ERP_DB.edmx           # Entity model
│   ├── SqlServer/                # Repository implementations
│   ├── Shared/                   # Shared utilities
│   └── Extensions/               # Extension methods
├── ERP.Entities/                 # Domain models
│   └── *.cs                      # Entity classes
├── ERP.SharedServices/           # Shared services
│   ├── PDF/                      # PDF generation
│   ├── BarCode/                  # Barcode generation
│   ├── NetMails.cs               # Email service
│   └── LogWriter.cs              # Logging
├── ERP.RefSite/                  # Reference site
├── ERP.App/                      # Desktop application
└── SQL/                          # Database scripts
    ├── V1.0.0.0/                 # Initial version
    ├── V1.0.0.1/                 # Updates
    └── ...                       # Version history
```

---

## Technology Stack Details

### Backend
- **Framework:** ASP.NET 4.8 WebForms
- **Language:** C#
- **ORM:** Entity Framework 4.x
- **Database:** SQL Server (local instance)
- **Web Services:** ASMX (SOAP/JSON)

### Frontend
- **JavaScript Libraries:**
  - jQuery 2.1.0
  - Bootstrap 3.x
  - DataTables
  - Bootbox.js
  - Layui
  - xCharts (D3-based)
  - Flot Charts
- **CSS Frameworks:**
  - Bootstrap
  - Custom Cloud Admin theme
  - Amaze UI
- **Rich Text Editor:** CKEditor

### Third-Party Libraries
- **PDF Generation:** iTextSharp 5.2.0
- **Excel Processing:** NPOI
- **QR Code:** Gma.QrCodeNet.Encoding
- **HTML Parsing:** HtmlAgilityPack
- **JSON:** Newtonsoft.Json 13.0.1
- **AJAX:** AjaxControlToolkit

### File Storage
- Product photos: `D:\SiteFilesFolder\ERP\Files\UpLoadFiles\Product\Photo`
- Product files: `D:\SiteFilesFolder\ERP\Files\UpLoadFiles\Product\File`
- Album photos: `D:\SiteFilesFolder\ERP\Files\UpLoadFiles\Album`
- Email attachments: `D:\SiteFilesFolder\ERP\Files\EmailAttchmt`
- Temp files: `D:\SiteFilesFolder\ERP\Files\UpLoadFiles\TempFile`

---

## API & Services

### ERP.Web Web Services (ERPWebServices.asmx)

**Authentication Required:** Yes (Forms Authentication)

#### Common Services
- `GetClientType()` - Get client types
- `GetAllCommuneNameByPostcode(postcode)` - Commune lookup
- `GetDocumentList(dtpName, forId)` - Get documents

#### Client Services
- Client CRUD operations
- Contact management
- Search and filtering

#### Product Services
- Product CRUD operations
- Product instance management
- Category management
- Image management

#### Project Services
- Project management
- Quotation management
- Order management
- Invoice management

#### Supplier Services
- Supplier management
- Purchase orders
- Supplier invoices

#### Warehouse Services
- Inventory management
- Logistics tracking

### Site Web Services (SiteWebService.asmx)

**Authentication:** Optional (some methods public)

#### Public Methods
- `GetCategory()` - Get product categories
- `GetCategoryFirst()` - Get top-level categories
- `GetPrdByCatid(input)` - Get products by category
- `GetPrdDetail(prdId)` - Get product details
- `GetProjectList()` - Get project gallery
- `SendEmail(email)` - Contact form

#### Authenticated Methods
- `AddCartShopping(prdId, pitId, qty, attr1, attr2, attr3)` - Add to cart
- `DelCartShopping(Id)` - Remove from cart
- `CreateOrder(shpcartList)` - Create order
- `SaveShopCart(shpcartList)` - Save cart
- `AddWishLine(prdId)` - Add to wishlist
- `GetOrderList()` - Get user orders

---

## Database Naming Conventions

### Table Prefixes
- **TR_** - Reference/Lookup tables (Type Reference)
- **TM_** - Master tables (Type Master)
- **TI_** - Intermediate/Junction tables (Type Intermediate)
- **TS_** - Site-specific tables (Type Site)

### Column Prefixes
- **[table_abbr]_id** - Primary key (e.g., `cli_id`, `prd_id`)
- **[table_abbr]_[field]** - Regular columns (e.g., `cli_name`, `prd_ref`)
- **d_** - Date fields (e.g., `d_creation`, `d_update`)
- **is_** - Boolean fields (e.g., `is_active`, `is_blocked`)

### Common Abbreviations
- **cli** - Client
- **sup** - Supplier
- **prd** - Product
- **pit** - Product Instance
- **pty** - Product Type
- **cpl** - Cost Plan (Devis/Quotation)
- **cod** - Client Order
- **cin** - Client Invoice
- **dfo** - Delivery Form
- **sod** - Supplier Order
- **sin** - Supplier Invoice
- **prj** - Project
- **usr** - User
- **soc** - Society/Company
- **cco** - Client Contact
- **sco** - Supplier Contact
- **lgs** - Logistics
- **whs** - Warehouse
- **she** - Shelves

---

## Key Business Workflows

### 1. Sales Process
```
Project Creation
    ↓
Cost Plan (Quotation)
    ↓
Client Order
    ↓
Delivery Form
    ↓
Client Invoice
    ↓
Payment Tracking
```

### 2. Purchase Process
```
Purchase Intent
    ↓
Supplier Order
    ↓
Supplier Invoice
    ↓
Payment
    ↓
Logistics/Shipment
    ↓
Warehouse Receipt
```

### 3. Product Management
```
Product Type Definition
    ↓
Product Creation
    ↓
Product Instances (Variants)
    ↓
Category Assignment
    ↓
Image Upload
    ↓
Supplier Pricing
    ↓
Technical Sheet Generation
```

---

## Configuration Files

### Web.config (ERP.Web)
- Connection String: `ERP_DBEntities`
- Database: `ERP_ECOLED` (or `ERP_DB`)
- File paths for uploads
- Email settings
- Company information

### Web.config (ERP.SiteNC202310)
- Same connection string
- Public site settings
- Technical sheet generation flag
- JavaScript version for cache busting

---

## Security & Authentication

### Authentication
- **Type:** Forms Authentication
- **Cookie Name:** `.ASPXAUTH`
- **Login Page:** `Account/Login.aspx` (Admin), `LoginRegister.aspx` (Site)

### Authorization
- Role-based access control
- Screen-level permissions (Read, Create, Modify, Delete, Validate, Cancel)
- Super user flag for admin override

### Password
- Encrypted storage in database
- Encryption method in `StringCipher` class

---

## Reporting & PDF Generation

### PDF Features
- Technical sheets with product specifications
- Quotations (Devis)
- Orders
- Delivery forms
- Invoices
- Custom headers/footers
- Company logo and certifications (CE, RoHS, WEEE)
- Barcode/QR code generation

### PDF Library
- iTextSharp 5.2.0
- Custom PDF generators in `ERP.SharedServices/PDF/`

---

## Email Functionality

### Email Service
- **Class:** `NetMails.cs`, `WebMails.cs`
- **Features:**
  - SMTP configuration
  - HTML templates
  - Attachments
  - Error logging

### Email Templates
- Located in `HtmlTmp/` folder
- Client contact form
- Diagnostic form
- Order confirmations

---

## Logging

### Log Files
- Application logs: `D:\AppLog\ERPApp\Logs.txt`
- Application errors: `D:\AppLog\ERPApp\AppErrors.txt`
- Export errors: `D:\AppLog\ERPApp\ExportErrors.txt`
- Import errors: `D:\AppLog\ERPApp\ImportErrors.txt`
- Mail errors: `D:\AppLog\ERPApp\MailErrors.txt`

### LogWriter Class
- Located in `ERP.SharedServices/LogWriter.cs`
- Writes timestamped log entries

---

## Recommendations for UI Revamp

### 1. **Technology Migration**
- Consider migrating from WebForms to modern framework:
  - ASP.NET Core MVC/Razor Pages
  - React/Vue.js + Web API
  - Blazor Server/WASM

### 2. **Database**
- Current schema is well-structured
- Consider adding indexes for performance
- Implement soft deletes instead of hard deletes
- Add audit fields (created_by, updated_by, deleted_by)

### 3. **API Layer**
- Replace ASMX with RESTful Web API
- Implement proper API versioning
- Add Swagger/OpenAPI documentation
- Implement JWT authentication

### 4. **Frontend**
- Replace jQuery with modern framework
- Implement responsive design (mobile-first)
- Use component-based architecture
- Implement state management (Redux/Vuex)

### 5. **Code Organization**
- Implement Repository pattern properly
- Add Unit of Work pattern
- Implement CQRS for complex operations
- Add validation layer (FluentValidation)

### 6. **Security**
- Implement HTTPS everywhere
- Add CSRF protection
- Implement rate limiting
- Add input validation and sanitization
- Use parameterized queries (already done with EF)

### 7. **Performance**
- Implement caching (Redis/MemoryCache)
- Add pagination to all lists
- Optimize database queries
- Implement lazy loading for images
- Add CDN for static assets

### 8. **User Experience**
- Implement real-time notifications (SignalR)
- Add search with autocomplete
- Implement drag-and-drop for file uploads
- Add keyboard shortcuts
- Implement undo/redo functionality

---

## Database Diagram Summary

### Core Entities Relationships

```
TR_SOC_Society (Company)
    ├── TM_USR_User (Users)
    ├── TM_CLI_Client (Clients)
    │   ├── TM_CCO_Client_Contact (Contacts)
    │   ├── TM_PRJ_Project (Projects)
    │   │   ├── TM_CPL_Cost_Plan (Quotations)
    │   │   │   └── TM_CLN_CostPlan_Lines
    │   │   ├── TM_COD_Client_Order (Orders)
    │   │   │   └── TM_COL_ClientOrder_Lines
    │   │   └── TM_CIN_Client_Invoice (Invoices)
    │   │       └── TM_CII_ClientInvoice_Line
    │   └── TM_DFO_Delivery_Form
    │       └── TM_DFL_DevlieryForm_Line
    ├── TM_SUP_Supplier (Suppliers)
    │   ├── TM_SCO_Supplier_Contact
    │   ├── TM_SOD_Supplier_Order
    │   │   └── TM_SOL_SupplierOrder_Lines
    │   └── TM_SIN_Supplier_Invoice
    │       └── TM_SIL_SupplierInvoice_Lines
    ├── TM_PTY_Product_Type (Product Types)
    │   ├── TM_PRD_Product (Products)
    │   │   ├── TM_PIT_Product_Instance (Variants)
    │   │   ├── TI_PIM_Product_Image
    │   │   └── TI_PIC_Product_In_Catelogue
    │   └── TM_PTM_Product_Type_Matrix
    ├── TM_PCT_Product_Catelogue (Categories)
    ├── TM_LGS_Logistic (Logistics)
    │   └── TM_LGL_Logistic_Lines
    └── TM_WHS_WareHouse (Warehouses)
        └── TM_SHE_Shelves
```

---

## Next Steps for Revamp

1. **Analysis Phase** ✓
   - Document current system
   - Identify pain points
   - Gather requirements

2. **Design Phase**
   - Create new UI mockups
   - Design new database schema (if needed)
   - Plan API endpoints
   - Choose technology stack

3. **Development Phase**
   - Set up new project structure
   - Implement authentication
   - Migrate core modules
   - Implement new features

4. **Testing Phase**
   - Unit testing
   - Integration testing
   - User acceptance testing
   - Performance testing

5. **Deployment Phase**
   - Data migration
   - Parallel run
   - Training
   - Go-live

---

**Document Version:** 1.0
**Last Updated:** 2026-01-31
**Prepared For:** ERP System UI Revamp Project


# ERP Database Schema - SQL Server 2008 (Aligned)

**Database:** ERP_ECOLED (SQL Server 2008)

**Source of truth:** `backend/db_schema.json` (SQL Server extract)
**Last Updated:** 2026-02-13

## Summary
- Total tables: 105
- TR_ reference tables: 47
- TM_ master tables: 35
- TI_ intermediate tables: 8
- TS_ site tables: 13
- TH_ history/audit tables: 2

Notes:
- Table names preserve legacy spelling/casing from SQL Server (e.g., `TM_CLI_CLient`, `TM_DFL_DevlieryForm_Line`).
- Full column-level schema and foreign keys are in `backend/db_schema.json`.
- For application coverage and gaps, see `DOCUMENTATION/db_schema_report.md`.

## TH_ Tables (2)

### TH_UCT_User_Comment

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| uct_id | int | NO | YES |
| uct_d_creation | datetime | NO |  |
| uct_d_update | datetime | YES |  |
| uct_comment | nvarchar(2000) | YES |  |
| uct_fk_name | nvarchar(100) | YES |  |
| uct_fk_id | int | YES |  |
| usr_id | int | NO |  |

### TH_UFL_User_Flag

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ufl_id | int | NO | YES |
| ufl_d_creation | datetime | NO |  |
| ufl_d_update | datetime | YES |  |
| ufl_comment | nvarchar(2000) | YES |  |
| ufl_fk_name | nvarchar(100) | YES |  |
| ufl_fk_id | int | YES |  |
| usr_id | int | NO |  |

## TI_ Tables (8)

### TI_DOC_Document

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| doc_id | int | NO | YES |
| dtp_id | int | NO |  |
| doc_path | nvarchar(2000) | NO |  |
| doc_name | nvarchar(100) | NO |  |
| doc_description | nvarchar(1000) | YES |  |
| doc_d_update | datetime | NO |  |
| doc_foreign_id | int | YES |  |

### TI_INVR_INV_Record

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| invr_id | int | NO | YES |
| inv_id | int | NO |  |
| invr_d_record | datetime | NO |  |
| invr_quantity | decimal | YES |  |

### TI_MSG_Message

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| msg_id | int | NO | YES |
| msg_d_creation | datetime | NO |  |
| msg_fk_name | nvarchar(100) | YES |  |
| msg_fk_id | int | YES |  |
| msg_content | xml | YES |  |
| usr_id | int | NO |  |
| msg_is_td | bit | NO |  |
| msg_is_memo | bit | NO |  |

### TI_PIM_Product_Image

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pim_id | int | NO | YES |
| prd_id | int | NO |  |
| pim_path | nvarchar(1000) | YES |  |
| pim_order | int | NO |  |
| pal_id | int | YES |  |
| pim_description | nvarchar(1000) | YES |  |

### TI_PIVR_PIN_Record

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pivr_id | int | NO | YES |
| piv_id | int | NO |  |
| pivr_d_record | datetime | NO |  |
| pivr_quantity | decimal | YES |  |

### TI_PIV_PRE_INV_Inventory

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| piv_id | int | NO | YES |
| inv_id | int | NO |  |
| piv_quantity | decimal | YES |  |
| piv_d_update | datetime | NO |  |

### TI_PSR_PRE_Shipping_Receiving_Line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| psr_id | int | NO | YES |
| col_id | int | YES |  |
| lgl_id | int | YES |  |
| psr_time | datetime | NO |  |
| psr_quantity | decimal | YES |  |
| psr_is_done | bit | NO |  |
| psr_time_done | datetime | YES |  |

### TI_PTI_Product_Instance_Image

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pti_id | int | NO | YES |
| pit_id | int | NO |  |
| pti_path | nvarchar(1000) | YES |  |
| pti_order | int | NO |  |
| pal_id | int | YES |  |
| pti_description | nvarchar(1000) | YES |  |

## TM_ Tables (35)

### TM_CAT_Category

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cat_id | int | NO | YES |
| cat_name | nvarchar(200) | NO |  |
| cat_sub_name_1 | nvarchar(200) | YES |  |
| cat_sub_name_2 | nvarchar(200) | YES |  |
| cat_order | int | NO |  |
| cat_is_actived | bit | NO |  |
| cat_image_path | nvarchar(2000) | YES |  |
| cat_display_in_menu | bit | NO |  |
| cat_display_in_exhibition | bit | NO |  |
| cat_parent_cat_id | int | YES |  |
| soc_id | int | NO |  |
| cat_description | nvarchar(2000) | YES |  |

### TM_CCO_Client_Contact

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cco_id | int | NO | YES |
| cco_firstname | nvarchar(200) | NO |  |
| cco_lastname | nvarchar(200) | NO |  |
| civ_id | int | NO |  |
| cco_ref | nvarchar(50) | YES |  |
| cco_adresse_title | nvarchar(200) | YES |  |
| cco_address1 | nvarchar(200) | YES |  |
| cco_address2 | nvarchar(200) | YES |  |
| cco_postcode | nvarchar(50) | YES |  |
| cco_city | nvarchar(200) | YES |  |
| cco_country | nvarchar(200) | YES |  |
| cco_tel1 | nvarchar(100) | YES |  |
| cco_tel2 | nvarchar(100) | YES |  |
| cco_fax | nvarchar(100) | YES |  |
| cco_cellphone | nvarchar(100) | YES |  |
| cco_email | nvarchar(100) | YES |  |
| cco_recieve_newsletter | bit | NO |  |
| cco_newsletter_email | nvarchar(100) | YES |  |
| cco_is_delivery_adr | bit | NO |  |
| cco_is_invoicing_adr | bit | NO |  |
| cli_id | int | NO |  |
| usr_created_by | int | NO |  |
| cco_d_creation | datetime | NO |  |
| cco_d_update | datetime | NO |  |
| cco_comment | ntext | YES |  |
| cmu_id | int | YES |  |

### TM_CII_ClientInvoice_Line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cii_id | int | NO | YES |
| cin_id | int | NO |  |
| cii_level1 | int | YES |  |
| cii_description | nvarchar(4000) | YES |  |
| prd_id | int | YES |  |
| cii_ref | nvarchar(100) | YES |  |
| cii_unit_price | decimal | YES |  |
| cii_quantity | decimal | YES |  |
| cii_total_price | decimal | YES |  |
| vat_id | int | YES |  |
| dfl_id | int | YES |  |
| cii_level2 | int | YES |  |
| cii_purchase_price | decimal | YES |  |
| cii_total_crude_price | decimal | YES |  |
| cii_prd_name | nvarchar(100) | YES |  |
| cii_discount_percentage | decimal | YES |  |
| cii_discount_amount | decimal | YES |  |
| cii_price_with_discount_ht | decimal | YES |  |
| cii_margin | decimal | YES |  |
| pit_id | int | YES |  |
| ltp_id | int | NO |  |
| cii_av_id | int | YES |  |
| cii_prd_des | nvarchar(1000) | YES |  |
| col_id | int | YES |  |
| sol_id | int | YES |  |

### TM_CIN_Client_Invoice

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cin_id | int | NO | YES |
| cin_code | nvarchar(50) | NO |  |
| cod_id | int | YES |  |
| cli_id | int | NO |  |
| cin_d_creation | datetime | NO |  |
| cin_d_update | datetime | YES |  |
| cin_d_invoice | datetime | YES |  |
| usr_creator_id | int | NO |  |
| cin_header_text | ntext | YES |  |
| cin_footer_text | ntext | YES |  |
| cur_id | int | NO |  |
| cin_account | bit | NO |  |
| cin_d_term | datetime | YES |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| cco_id_invoicing | int | YES |  |
| cin_isinvoice | bit | NO |  |
| vat_id | int | NO |  |
| prj_id | int | YES |  |
| dfo_id | int | YES |  |
| soc_id | int | NO |  |
| cin_name | nvarchar(1000) | YES |  |
| cin_inv_cco_firstname | nvarchar(200) | YES |  |
| cin_inv_cco_lastname | nvarchar(200) | YES |  |
| cin_inv_cco_address1 | nvarchar(200) | YES |  |
| cin_inv_cco_address2 | nvarchar(200) | YES |  |
| cin_inv_cco_postcode | nvarchar(50) | YES |  |
| cin_inv_cco_city | nvarchar(200) | YES |  |
| cin_inv_cco_country | nvarchar(200) | YES |  |
| cin_inv_cco_tel1 | nvarchar(100) | YES |  |
| cin_inv_cco_fax | nvarchar(100) | YES |  |
| cin_inv_cco_cellphone | nvarchar(100) | YES |  |
| cin_inv_cco_email | nvarchar(100) | YES |  |
| cin_discount_percentage | decimal | YES |  |
| cin_discount_amount | decimal | YES |  |
| cin_file | nvarchar(2000) | YES |  |
| cin_client_comment | nvarchar(4000) | YES |  |
| cin_inter_comment | nvarchar(4000) | YES |  |
| cin_d_encaissement | datetime | YES |  |
| cin_avoir_id | int | YES |  |
| cin_rest_to_pay | decimal | YES |  |
| cin_is_full_paid | bit | YES |  |
| cin_invoiced | bit | NO |  |
| usr_com_1 | int | YES |  |
| usr_com_2 | int | YES |  |
| usr_com_3 | int | YES |  |
| sod_id | int | YES |  |
| cin_bank | int | YES |  |
| tte_id | int | YES |  |
| cin_margin | decimal | YES |  |
| cin_key_project | bit | YES |  |
| cin_delegator_id | int | YES |  |

### TM_CLD_Calendar

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cld_id | int | NO | YES |
| cld_subject | nvarchar(1000) | YES |  |
| cld_location | nvarchar(1000) | YES |  |
| cld_description | nvarchar(4000) | YES |  |
| cld_d_start | datetime | YES |  |
| cld_d_end | datetime | YES |  |
| cld_is_all_day_event | bit | NO |  |
| cld_color | nvarchar(200) | YES |  |
| cld_recurring_rule | nvarchar(100) | YES |  |
| usr_id | int | NO |  |
| cld_d_create | datetime | NO |  |
| cld_d_update | datetime | YES |  |
| cld_guest | nvarchar(4000) | YES |  |
| sol_id | int | YES |  |
| sod_id | int | YES |  |
| cld_guid | uniqueidentifier | YES |  |
| sol_guid | uniqueidentifier | YES |  |
| cld_action | nvarchar(50) | YES |  |
| cld_isdone | bit | YES |  |
| lgs_id | int | YES |  |

### TM_CLI_CLient

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cli_id | int | NO | YES |
| cli_ref | nvarchar(50) | YES |  |
| soc_id | int | NO |  |
| cli_company_name | nvarchar(250) | NO |  |
| vat_id | int | NO |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| act_id | int | YES |  |
| cli_siren | nvarchar(50) | YES |  |
| cli_siret | nvarchar(50) | YES |  |
| cli_vat_intra | nvarchar(50) | YES |  |
| usr_created_by | int | NO |  |
| cty_id | int | NO |  |
| cur_id | int | NO |  |
| cli_isactive | bit | NO |  |
| cli_isblocked | bit | NO |  |
| cli_d_creation | datetime | NO |  |
| cli_d_update | datetime | NO |  |
| cli_address1 | nvarchar(200) | YES |  |
| cli_address2 | nvarchar(200) | YES |  |
| cli_postcode | nvarchar(50) | YES |  |
| cli_city | nvarchar(200) | YES |  |
| cli_country | nvarchar(200) | YES |  |
| cli_free_of_harbor | int | YES |  |
| cli_tel1 | nvarchar(100) | YES |  |
| cli_tel2 | nvarchar(100) | YES |  |
| cli_fax | nvarchar(100) | YES |  |
| cli_cellphone | nvarchar(100) | YES |  |
| cli_email | nvarchar(100) | YES |  |
| cli_usr_com1 | int | YES |  |
| cli_usr_com2 | int | YES |  |
| cli_usr_com3 | int | YES |  |
| cli_recieve_newsletter | bit | NO |  |
| cli_newsletter_email | nvarchar(100) | YES |  |
| cmu_id | int | YES |  |
| cli_comment_for_client | ntext | YES |  |
| cli_comment_for_interne | ntext | YES |  |
| cli_invoice_day | int | YES |  |
| cli_invoice_day_is_last_day | bit | YES |  |
| cli_accounting_email | nvarchar(200) | YES |  |
| cli_showdetail | bit | YES |  |
| cli_abbreviation | nvarchar(300) | YES |  |
| cli_pdf_version | nvarchar(20) | YES |  |

### TM_CLN_CostPlan_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cln_id | int | NO | YES |
| cpl_id | int | NO |  |
| cln_level1 | int | YES |  |
| cln_level2 | int | YES |  |
| cln_description | nvarchar(4000) | YES |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| cln_purchase_price | decimal | YES |  |
| cln_unit_price | decimal | YES |  |
| cln_quantity | decimal | YES |  |
| cln_total_price | decimal | YES |  |
| cln_total_crude_price | decimal | YES |  |
| vat_id | int | YES |  |
| ltp_id | int | NO |  |
| cln_prd_name | nvarchar(100) | YES |  |
| cln_discount_percentage | decimal | YES |  |
| cln_discount_amount | decimal | YES |  |
| cln_price_with_discount_ht | decimal | YES |  |
| cln_margin | decimal | YES |  |
| cln_prd_des | nvarchar(1000) | YES |  |

### TM_COD_Client_Order

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cod_id | int | NO | YES |
| cod_code | nvarchar(50) | NO |  |
| cod_d_creation | datetime | NO |  |
| cod_d_update | datetime | NO |  |
| cli_id | int | NO |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| cod_d_pre_delivery_from | datetime | YES |  |
| cod_d_pre_delivery_to | datetime | YES |  |
| cod_header_text | ntext | YES |  |
| cod_footer_text | ntext | YES |  |
| cco_id_invoicing | int | YES |  |
| cod_client_comment | nvarchar(4000) | YES |  |
| cod_inter_comment | nvarchar(4000) | YES |  |
| usr_creator_id | int | NO |  |
| cpl_id | int | YES |  |
| vat_id | int | NO |  |
| prj_id | int | NO |  |
| soc_id | int | NO |  |
| cod_name | nvarchar(1000) | YES |  |
| cod_discount_percentage | decimal | YES |  |
| cod_discount_amount | decimal | YES |  |
| cod_d_end_work | datetime | YES |  |
| cod_file | nvarchar(2000) | YES |  |
| usr_com_1 | int | YES |  |
| usr_com_2 | int | YES |  |
| usr_com_3 | int | YES |  |
| cod_key_project | bit | YES |  |

### TM_COL_ClientOrder_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| col_id | int | NO | YES |
| cod_id | int | NO |  |
| cln_id | int | YES |  |
| col_level1 | int | YES |  |
| col_description | nvarchar(4000) | YES |  |
| prd_id | int | YES |  |
| col_ref | nvarchar(100) | YES |  |
| col_unit_price | decimal | YES |  |
| col_quantity | decimal | YES |  |
| col_total_price | decimal | YES |  |
| vat_id | int | YES |  |
| col_level2 | int | YES |  |
| col_purchase_price | decimal | YES |  |
| col_total_crude_price | decimal | YES |  |
| col_prd_name | nvarchar(100) | YES |  |
| col_discount_percentage | decimal | YES |  |
| col_discount_amount | decimal | YES |  |
| col_price_with_discount_ht | decimal | YES |  |
| col_margin | decimal | YES |  |
| pit_id | int | YES |  |
| ltp_id | int | NO |  |
| col_prd_des | nvarchar(1000) | YES |  |

### TM_CON_CONSIGNEE

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| con_id | int | NO | YES |
| con_firstname | nvarchar(200) | YES |  |
| con_lastname | nvarchar(200) | YES |  |
| civ_id | int | NO |  |
| con_code | nvarchar(50) | YES |  |
| con_adresse_title | nvarchar(200) | YES |  |
| con_address1 | nvarchar(200) | YES |  |
| con_address2 | nvarchar(200) | YES |  |
| con_address3 | nvarchar(200) | YES |  |
| con_postcode | nvarchar(50) | YES |  |
| con_city | nvarchar(200) | YES |  |
| con_province | nvarchar(200) | YES |  |
| con_country | nvarchar(200) | YES |  |
| con_tel1 | nvarchar(100) | YES |  |
| con_tel2 | nvarchar(100) | YES |  |
| con_fax | nvarchar(100) | YES |  |
| con_cellphone | nvarchar(100) | YES |  |
| con_email | nvarchar(100) | YES |  |
| con_recieve_newsletter | bit | NO |  |
| con_newsletter_email | nvarchar(100) | YES |  |
| con_is_delivery_adr | bit | NO |  |
| con_is_invoicing_adr | bit | NO |  |
| usr_created_by | int | NO |  |
| soc_id | int | NO |  |
| con_d_creation | datetime | NO |  |
| con_d_update | datetime | NO |  |
| con_comment | nvarchar(1000) | YES |  |
| cmu_id | int | YES |  |
| con_company_name | nvarchar(200) | YES |  |

### TM_CPL_Cost_Plan

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cpl_id | int | NO | YES |
| cpl_code | nvarchar(50) | NO |  |
| cpl_d_creation | datetime | NO |  |
| cpl_d_update | datetime | NO |  |
| cst_id | int | NO |  |
| cli_id | int | NO |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| cpl_d_validity | datetime | NO |  |
| cpl_d_pre_delivery | datetime | YES |  |
| cpl_header_text | ntext | YES |  |
| cpl_footer_text | ntext | YES |  |
| cco_id_invoicing | int | YES |  |
| cpl_client_comment | nvarchar(4000) | YES |  |
| cpl_inter_comment | nvarchar(4000) | YES |  |
| usr_creator_id | int | NO |  |
| vat_id | int | NO |  |
| prj_id | int | NO |  |
| soc_id | int | NO |  |
| cpl_name | nvarchar(1000) | YES |  |
| cpl_discount_percentage | decimal | YES |  |
| cpl_discount_amount | decimal | YES |  |
| usr_commercial1 | int | YES |  |
| usr_commercial2 | int | YES |  |
| usr_commercial3 | int | YES |  |
| cpl_fromsite | bit | YES |  |
| cpl_stripe_chargeid | nvarchar(200) | YES |  |
| cpl_key_project | bit | YES |  |

### TM_CPY_ClientInvoice_Payment

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cpy_id | int | NO | YES |
| cin_id | int | NO |  |
| cpy_amount | decimal | NO |  |
| cpy_d_create | datetime | NO |  |
| cpy_file | nvarchar(1000) | YES |  |
| cpy_comment | nvarchar(400) | YES |  |
| cpy_guid | nvarchar(200) | YES |  |
| cpy_payment_code | nvarchar(200) | YES |  |

### TM_DFL_DevlieryForm_Line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| dfl_id | int | NO | YES |
| dfo_id | int | NO |  |
| col_id | int | YES |  |
| dfl_description | nvarchar(4000) | YES |  |
| dfl_quantity | decimal | YES |  |
| cii_id | int | YES |  |

### TM_DFO_Delivery_Form

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| dfo_id | int | NO | YES |
| dfo_code | nvarchar(50) | NO |  |
| dfo_d_creation | datetime | NO |  |
| dfo_d_update | datetime | NO |  |
| dfo_d_delivery | datetime | NO |  |
| dfo_header_text | ntext | YES |  |
| dfo_footer_text | ntext | YES |  |
| dfo_delivery_comment | nvarchar(4000) | YES |  |
| dfo_inter_comment | nvarchar(4000) | YES |  |
| usr_creator_id | int | NO |  |
| cod_id | int | NO |  |
| dfo_dlv_cco_firstname | nvarchar(200) | YES |  |
| dfo_dlv_cco_lastname | nvarchar(200) | YES |  |
| dfo_dlv_cco_address1 | nvarchar(200) | YES |  |
| dfo_dlv_cco_address2 | nvarchar(200) | YES |  |
| dfo_dlv_cco_postcode | nvarchar(50) | YES |  |
| dfo_dlv_cco_city | nvarchar(200) | YES |  |
| dfo_dlv_cco_country | nvarchar(200) | YES |  |
| dfo_dlv_cco_tel1 | nvarchar(100) | YES |  |
| dfo_dlv_cco_fax | nvarchar(100) | YES |  |
| dfo_dlv_cco_cellphone | nvarchar(100) | YES |  |
| dfo_dlv_cco_email | nvarchar(100) | YES |  |
| dfo_file | nvarchar(2000) | YES |  |
| cli_id | int | NO |  |
| soc_id | int | NO |  |
| dfo_deliveried | bit | NO |  |
| dfo_client_adr | bit | YES |  |
| dfo_import_field | xml | YES |  |
| dfo_gdoc_nb | int | YES |  |

### TM_INV_Inventory

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| inv_id | int | NO | YES |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| prd_name | nvarchar(200) | YES |  |
| prd_ref | nvarchar(200) | YES |  |
| prd_description | nvarchar(1000) | YES |  |
| inv_quantity | decimal | YES |  |
| inv_d_update | datetime | NO |  |
| inv_description | nvarchar(1000) | YES |  |

### TM_LGL_Logistic_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| lgl_id | int | NO | YES |
| lgl_guid | uniqueidentifier | YES |  |
| lgs_id | int | NO |  |
| lgs_quantity | decimal | YES |  |
| lgs_unit_price | decimal | YES |  |
| lgs_total_price | decimal | YES |  |
| lgs_prd_name | nvarchar(200) | YES |  |
| lgs_prd_ref | nvarchar(200) | YES |  |
| lgs_description | nvarchar(1000) | YES |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| sil_id | int | YES |  |
| lgl_prd_des | nvarchar(1000) | YES |  |
| sol_id | int | YES |  |
| cii_id | int | YES |  |
| cgl_id | int | YES |  |

### TM_LGS_Logistic

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| lgs_id | int | NO | YES |
| lgs_code | nvarchar(50) | NO |  |
| lgs_name | nvarchar(1000) | YES |  |
| lgs_is_send | bit | NO |  |
| sup_id | int | YES |  |
| lgs_d_send | datetime | YES |  |
| lgs_d_arrive_pre | datetime | YES |  |
| lgs_d_arrive | datetime | YES |  |
| lgs_comment | nvarchar(4000) | YES |  |
| soc_id | int | NO |  |
| lgs_file | nvarchar(2000) | YES |  |
| lgs_guid | uniqueidentifier | YES |  |
| lgs_is_purchase | bit | NO |  |
| lgs_tracking_number | nvarchar(1000) | YES |  |
| usr_id_creator | int | NO |  |
| lgs_d_creation | datetime | NO |  |
| lgs_d_update | datetime | NO |  |
| lgs_is_received | bit | NO |  |
| lgs_is_stockin | bit | NO |  |
| lgs_d_stockin | datetime | YES |  |
| con_id | int | YES |  |
| sod_id | int | YES |  |

### TM_PIL_PurchaseIntent_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pil_id | int | NO | YES |
| pin_id | int | NO |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| pil_order | int | NO |  |
| pil_quantity | decimal | YES |  |
| pil_client | nvarchar(200) | YES |  |
| pil_power | nvarchar(200) | YES |  |
| pil_driver | nvarchar(200) | YES |  |
| pil_temp_color | nvarchar(200) | YES |  |
| pil_length | decimal | YES |  |
| pil_width | decimal | YES |  |
| pil_height | decimal | YES |  |
| pil_eff_lum | int | YES |  |
| pil_ugr | int | YES |  |
| pil_cri | int | YES |  |
| pil_logistic | nvarchar(50) | YES |  |
| pil_supplier | nvarchar(200) | YES |  |
| pil_description | nvarchar(1000) | YES |  |
| pil_prd_des | nvarchar(1000) | YES |  |
| pil_deadline | datetime | YES |  |
| pil_prd_name | nvarchar(200) | YES |  |
| pil_d_creation | datetime | YES |  |
| pil_d_update | datetime | YES |  |
| usr_id_creator | int | YES |  |
| usr_id_com1 | int | YES |  |
| usr_id_com2 | int | YES |  |
| usr_id_com3 | int | YES |  |
| cln_id | int | YES |  |
| col_id | int | YES |  |
| cii_id | int | YES |  |
| pil_comment | nvarchar(1000) | YES |  |
| pil_feature_code | nvarchar(200) | YES |  |
| sup_id | int | YES |  |

### TM_PIN_Purchase_Intent

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pin_id | int | NO | YES |
| pin_code | nvarchar(50) | NO |  |
| pin_name | nvarchar(1000) | YES |  |
| pin_inter_comment | nvarchar(4000) | YES |  |
| pin_supplier_comment | nvarchar(4000) | YES |  |
| soc_id | int | NO |  |
| pin_d_creation | datetime | NO |  |
| pin_d_update | datetime | NO |  |
| pin_creator_id | int | NO |  |
| pin_closed | bit | NO |  |

### TM_PIT_Product_Instance

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pit_id | int | NO | YES |
| prd_id | int | NO |  |
| pty_id | int | NO |  |
| pit_price | decimal | YES |  |
| pit_ref | nvarchar(200) | YES |  |
| pit_description | nvarchar(4000) | YES |  |
| pit_prd_info | xml | YES |  |
| pit_purchase_price | decimal | YES |  |
| pit_tmp_ref | nvarchar(100) | YES |  |
| pit_inventory_threshold | int | NO |  |

### TM_PRD_Product

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| prd_id | int | NO | YES |
| prd_ref | nvarchar(100) | NO |  |
| soc_id | int | NO |  |
| pty_id | int | NO |  |
| prd_name | nvarchar(200) | NO |  |
| prd_description | nvarchar(4000) | YES |  |
| prd_specifications | xml | YES |  |
| prd_price | decimal | YES |  |
| prd_purchase_price | decimal | YES |  |
| prd_file_name | nvarchar(1000) | YES |  |
| prd_code | nvarchar(10) | YES |  |
| prd_d_creation | datetime | YES |  |
| prd_d_update | datetime | YES |  |
| prd_outside_diameter | decimal | YES |  |
| prd_length | decimal | YES |  |
| prd_width | decimal | YES |  |
| prd_height | decimal | YES |  |
| prd_hole_size | decimal | YES |  |
| prd_depth | decimal | YES |  |
| prd_weight | decimal | YES |  |
| prd_unit_length | decimal | YES |  |
| prd_unit_width | decimal | YES |  |
| prd_unit_height | decimal | YES |  |
| prd_unit_weight | decimal | YES |  |
| prd_quantity_each_carton | int | YES |  |
| prd_carton_length | decimal | YES |  |
| prd_carton_width | decimal | YES |  |
| prd_carton_height | decimal | YES |  |
| prd_carton_weight | decimal | YES |  |
| prd_outside_length | decimal | YES |  |
| prd_outside_width | decimal | YES |  |
| prd_outside_height | decimal | YES |  |
| prd_hole_lenght | decimal | YES |  |
| prd_hole_width | decimal | YES |  |
| prd_tmp_ref | nvarchar(100) | YES |  |
| prd_sup_description | nvarchar(1000) | YES |  |
| prd_sub_name | nvarchar(200) | YES |  |

### TM_PRJ_Project

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| prj_id | int | NO | YES |
| prj_code | nvarchar(50) | NO |  |
| prj_name | nvarchar(1000) | NO |  |
| prj_d_creation | datetime | NO |  |
| prj_d_update | datetime | YES |  |
| cli_id | int | NO |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| vat_id | int | NO |  |
| soc_id | int | NO |  |
| prj_header_text | ntext | YES |  |
| prj_footer_text | ntext | YES |  |
| prj_client_comment | nvarchar(4000) | YES |  |
| prj_inter_comment | nvarchar(4000) | YES |  |
| usr_creator_id | int | NO |  |

### TM_PTM_Product_Type_Matrix

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ptm_id | int | NO | YES |
| pty_id | int | NO |  |
| ptm_range_X | xml | YES |  |
| ptm_range_Y | xml | YES |  |
| ptm_matrix | xml | YES |  |
| ptm_range_Z | xml | YES |  |

### TM_PTY_Product_Type

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pty_id | int | NO | YES |
| soc_id | int | NO |  |
| pty_name | nvarchar(200) | NO |  |
| pty_description | nvarchar(4000) | YES |  |
| pty_specifications_fields | xml | YES |  |
| pty_active | bit | NO |  |
| cor_id | int | YES |  |
| pty_standards | nvarchar(2000) | YES |  |

### TM_SCO_Supplier_Contact

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sco_id | int | NO | YES |
| sco_firstname | nvarchar(200) | NO |  |
| sco_lastname | nvarchar(200) | NO |  |
| civ_id | int | NO |  |
| sco_ref | nvarchar(50) | YES |  |
| sco_adresse_title | nvarchar(200) | YES |  |
| sco_address1 | nvarchar(200) | YES |  |
| sco_address2 | nvarchar(200) | YES |  |
| sco_postcode | nvarchar(50) | YES |  |
| sco_city | nvarchar(200) | YES |  |
| sco_country | nvarchar(200) | YES |  |
| sco_tel1 | nvarchar(100) | YES |  |
| sco_tel2 | nvarchar(100) | YES |  |
| sco_fax | nvarchar(100) | YES |  |
| sco_cellphone | nvarchar(100) | YES |  |
| sco_email | nvarchar(100) | YES |  |
| sco_recieve_newsletter | bit | NO |  |
| sco_newsletter_email | nvarchar(100) | YES |  |
| sup_id | int | NO |  |
| usr_created_by | int | NO |  |
| sco_d_creation | datetime | NO |  |
| sco_d_update | datetime | NO |  |
| sco_comment | ntext | YES |  |

### TM_SHE_Shelves

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| she_id | int | NO | YES |
| whs_id | int | NO |  |
| she_code | nvarchar(100) | YES |  |
| she_floor | int | YES |  |
| she_line | int | YES |  |
| she_row | int | YES |  |
| she_length | decimal | YES |  |
| she_width | decimal | YES |  |
| she_height | decimal | YES |  |
| she_availabel_volume | decimal | YES |  |

### TM_SIL_SupplierInvoice_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sil_id | int | NO | YES |
| sin_id | int | NO |  |
| sil_order | int | NO |  |
| sil_description | nvarchar(4000) | YES |  |
| sil_quantity | decimal | YES |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| sol_id | int | YES |  |
| sil_unit_price | decimal | YES |  |
| sil_discount_amount | decimal | YES |  |
| sil_total_price | decimal | YES |  |
| sil_price_with_dis | decimal | YES |  |
| vat_id | int | YES |  |
| sil_total_crude_price | decimal | YES |  |
| sil_prd_des | nvarchar(1000) | YES |  |

### TM_SIN_Supplier_Invoice

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sin_id | int | NO | YES |
| sup_id | int | NO |  |
| sco_id | int | YES |  |
| sin_inter_comment | nvarchar(4000) | YES |  |
| sin_supplier_comment | nvarchar(4000) | YES |  |
| soc_id | int | NO |  |
| sin_code | nvarchar(50) | NO |  |
| sin_name | nvarchar(1000) | YES |  |
| sin_d_creation | datetime | NO |  |
| sin_d_update | datetime | NO |  |
| usr_creator_id | int | NO |  |
| sin_file | nvarchar(2000) | YES |  |
| sod_id | int | YES |  |
| sin_discount_amount | decimal | YES |  |
| cur_id | int | NO |  |
| sin_is_paid | bit | NO |  |
| sin_bank_receipt_file | nvarchar(2000) | YES |  |
| sin_bank_receipt_number | nvarchar(100) | YES |  |
| sin_start_production | bit | YES |  |
| sin_d_start_production | datetime | YES |  |
| sin_d_complete_production_pre | datetime | YES |  |
| sin_d_complete_production | datetime | YES |  |
| sin_complete_production | bit | YES |  |
| vat_id | int | NO |  |
| bac_id | int | YES |  |
| sin_all_product_stored | bit | NO |  |

### TM_SOD_Supplier_Order

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sod_id | int | NO | YES |
| sup_id | int | NO |  |
| sco_id | int | YES |  |
| sod_inter_comment | nvarchar(4000) | YES |  |
| sod_supplier_comment | nvarchar(4000) | YES |  |
| soc_id | int | NO |  |
| sod_code | nvarchar(50) | NO |  |
| sod_name | nvarchar(1000) | YES |  |
| sod_d_creation | datetime | NO |  |
| sod_d_update | datetime | NO |  |
| usr_creator_id | int | NO |  |
| sod_file | nvarchar(2000) | YES |  |
| pin_id | int | YES |  |
| sod_discount_amount | decimal | YES |  |
| cur_id | int | NO |  |
| vat_id | int | NO |  |
| sod_guid | uniqueidentifier | YES |  |
| sod_need2pay | decimal | YES |  |
| sod_paid | decimal | YES |  |
| sod_total_ht | decimal | YES |  |
| sod_total_ttc | decimal | YES |  |
| sub_sup_id | int | YES |  |
| sod_need_send | bit | YES |  |
| sod_finish | bit | YES |  |
| sod_sup_nbr | nvarchar(100) | YES |  |
| usr_com_id | int | YES |  |
| cin_id | int | YES |  |
| soc_client | nvarchar(100) | YES |  |
| cli_id | int | YES |  |
| sod_started | bit | YES |  |
| sod_started_time | datetime | YES |  |
| sod_canceled | bit | YES |  |
| sod_canceled_time | datetime | YES |  |
| sod_d_exp_delivery | datetime | YES |  |
| stt_id | int | YES |  |

### TM_SOL_SupplierOrder_Lines

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sol_id | int | NO | YES |
| sod_id | int | NO |  |
| sol_order | int | NO |  |
| sol_description | nvarchar(4000) | YES |  |
| sol_quantity | decimal | YES |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| pil_id | int | YES |  |
| sol_unit_price | decimal | YES |  |
| sol_discount_amount | decimal | YES |  |
| sol_total_price | decimal | YES |  |
| sol_price_with_dis | decimal | YES |  |
| vat_id | int | YES |  |
| sol_total_crude_price | decimal | YES |  |
| sol_prd_des | nvarchar(1000) | YES |  |
| sol_power | nvarchar(200) | YES |  |
| sol_driver | nvarchar(200) | YES |  |
| sol_temp_color | nvarchar(200) | YES |  |
| sol_length | decimal | YES |  |
| sol_width | decimal | YES |  |
| sol_height | decimal | YES |  |
| sol_eff_lum | int | YES |  |
| sol_ugr | int | YES |  |
| sol_cri | int | YES |  |
| sol_logistic | nvarchar(50) | YES |  |
| sol_client | nvarchar(200) | YES |  |
| sol_d_creation | datetime | YES |  |
| sol_deadline | datetime | YES |  |
| sol_prd_name | nvarchar(200) | YES |  |
| sol_d_update | datetime | YES |  |
| sol_d_production | datetime | YES |  |
| sol_d_exp_delivery | datetime | YES |  |
| sol_d_delivery | datetime | YES |  |
| sol_feature_code | nvarchar(200) | YES |  |
| sol_d_shipping | datetime | YES |  |
| sol_transporter | nvarchar(100) | YES |  |
| sol_logistics_number | nvarchar(100) | YES |  |
| sol_d_exp_arrival | datetime | YES |  |
| sol_need2pay | decimal | YES |  |
| sol_paid | decimal | YES |  |
| sol_guid | uniqueidentifier | YES |  |
| sol_qty_storage | decimal | YES |  |
| sol_comment | nvarchar(1000) | YES |  |
| sol_finished | bit | YES |  |
| usr_id_com1 | int | YES |  |
| usr_id_com2 | int | YES |  |
| usr_id_com3 | int | YES |  |

### TM_SRL_Shipping_Receiving_Line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| srl_id | int | NO | YES |
| srv_id | int | NO |  |
| lgl_id | int | YES |  |
| dfl_id | int | YES |  |
| srl_quantity | decimal | YES |  |
| srl_unit_price | decimal | YES |  |
| srl_total_price | decimal | YES |  |
| prd_id | int | YES |  |
| pit_id | int | YES |  |
| srl_prd_ref | nvarchar(200) | YES |  |
| srl_prd_name | nvarchar(200) | YES |  |
| srl_prd_des | nvarchar(1000) | YES |  |
| srl_description | nvarchar(1000) | YES |  |
| srl_quantity_real | decimal | YES |  |
| srl_total_price_real | decimal | YES |  |
| whs_id | int | NO |  |
| she_id | int | NO |  |

### TM_SRV_Shipping_Receiving

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| srv_id | int | NO | YES |
| srv_is_rev | bit | NO |  |
| srv_time | datetime | NO |  |
| srv_code | nvarchar(100) | NO |  |
| srv_description | nvarchar(1000) | YES |  |
| usr_creator_id | int | NO |  |
| srv_total_quantity | decimal | YES |  |
| srv_total_real | decimal | YES |  |
| srv_is_lend | bit | NO |  |
| srv_d_lend_return_pre | datetime | YES |  |
| srv_is_return_client | bit | YES |  |
| srv_d_return_client | datetime | YES |  |
| srv_is_destroy | bit | YES |  |
| srv_d_destroy | datetime | YES |  |
| srv_is_return_supplier | bit | YES |  |
| srv_d_return_supplier | datetime | YES |  |
| srv_is_damaged | bit | YES |  |
| srv_d_damaged | datetime | YES |  |
| srv_client | nvarchar(200) | YES |  |
| srv_valid | bit | NO |  |

### TM_SUP_Supplier

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sup_id | int | NO | YES |
| sup_ref | nvarchar(50) | YES |  |
| soc_id | int | NO |  |
| sup_company_name | nvarchar(250) | NO |  |
| vat_id | int | NO |  |
| pco_id | int | NO |  |
| pmo_id | int | NO |  |
| sup_siren | nvarchar(50) | YES |  |
| sup_siret | nvarchar(50) | YES |  |
| sup_vat_intra | nvarchar(50) | YES |  |
| usr_created_by | int | NO |  |
| cur_id | int | NO |  |
| sup_isactive | bit | NO |  |
| sup_isblocked | bit | NO |  |
| sup_d_creation | datetime | NO |  |
| sup_d_update | datetime | NO |  |
| sup_address1 | nvarchar(200) | YES |  |
| sup_address2 | nvarchar(200) | YES |  |
| sup_postcode | nvarchar(50) | YES |  |
| sup_city | nvarchar(200) | YES |  |
| sup_country | nvarchar(200) | YES |  |
| sup_free_of_harbor | int | YES |  |
| sup_tel1 | nvarchar(100) | YES |  |
| sup_tel2 | nvarchar(100) | YES |  |
| sup_fax | nvarchar(100) | YES |  |
| sup_cellphone | nvarchar(100) | YES |  |
| sup_email | nvarchar(100) | YES |  |
| sup_recieve_newsletter | bit | NO |  |
| sup_newsletter_email | nvarchar(100) | YES |  |
| sup_comment_for_supplier | ntext | YES |  |
| sup_comment_for_interne | ntext | YES |  |
| sty_id | int | NO |  |
| sup_abbreviation | nvarchar(100) | YES |  |
| sup_login | nvarchar(500) | YES |  |
| sup_password | nvarchar(2000) | YES |  |

### TM_USR_User

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| usr_id | int | NO | YES |
| rol_id | int | NO |  |
| usr_login | nvarchar(200) | NO |  |
| usr_pwd | nvarchar(2000) | NO |  |
| usr_firstname | nvarchar(200) | YES |  |
| usr_lastname | nvarchar(200) | YES |  |
| usr_title | nvarchar(200) | YES |  |
| civ_id | int | NO |  |
| usr_tel | nvarchar(200) | YES |  |
| usr_cellphone | nvarchar(200) | YES |  |
| usr_fax | nvarchar(200) | YES |  |
| usr_email | nvarchar(200) | YES |  |
| usr_code_hr | nvarchar(200) | YES |  |
| usr_d_creation | datetime | NO |  |
| usr_d_update | datetime | NO |  |
| usr_is_actived | bit | NO |  |
| usr_photo_path | nvarchar(2000) | YES |  |
| soc_id | int | NO |  |
| usr_address1 | nvarchar(400) | YES |  |
| usr_address2 | nvarchar(400) | YES |  |
| usr_postcode | nvarchar(400) | YES |  |
| usr_city | nvarchar(400) | YES |  |
| usr_county | nvarchar(400) | YES |  |
| usr_super_right | bit | NO |  |
| usr_creator_id | int | YES |  |
| usr_comment | nvarchar(1000) | YES |  |
| usr_rcv_purchase_notif | bit | YES |  |

### TM_WHS_WareHouse

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| whs_id | int | NO | YES |
| whs_name | nvarchar(100) | NO |  |
| whs_code | nvarchar(100) | YES |  |
| whs_address1 | nvarchar(200) | YES |  |
| whs_address2 | nvarchar(200) | YES |  |
| whs_postcode | nvarchar(50) | YES |  |
| whs_city | nvarchar(200) | YES |  |
| whs_country | nvarchar(200) | YES |  |
| whs_volume | int | YES |  |

## TR_ Tables (47)

### TR_ACT_Activity

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| act_id | int | NO | YES |
| act_designation | nvarchar(20) | NO |  |
| act_isactive | bit | NO |  |

### TR_ALB_Album

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| alb_id | int | NO | YES |
| alb_name | nvarchar(200) | NO |  |
| alb_description | nvarchar(1000) | YES |  |
| alb_d_creation | datetime | NO |  |
| soc_id | int | NO |  |

### TR_BAC_Bank_Account

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| bac_id | int | NO | YES |
| bac_bank_name | nvarchar(400) | YES |  |
| bac_bank_adr | nvarchar(400) | YES |  |
| bac_account_number | nvarchar(400) | YES |  |
| bac_bic | nvarchar(200) | NO |  |
| bac_iban | nvarchar(400) | YES |  |
| bac_rib_bank_code | nvarchar(400) | YES |  |
| bac_rib_agence_code | nvarchar(400) | YES |  |
| bac_rib_account_number | nvarchar(400) | YES |  |
| bac_rib_key | nvarchar(400) | YES |  |
| bac_account_owner | nvarchar(400) | NO |  |
| bac_type | int | NO |  |
| f_id | int | YES |  |
| soc_id | int | NO |  |
| bac_rib_agency_adr | nvarchar(200) | YES |  |
| bac_title | nvarchar(400) | YES |  |

### TR_CDL_Client_Delegate

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cdl_id | int | NO | YES |
| cli_id | int | NO |  |
| cli_delegate_id | int | NO |  |

### TR_CGS_CIN_LGS

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cgl_id | int | NO | YES |
| cin_id | int | NO |  |
| lgs_id | int | NO |  |
| cin_order | int | NO |  |

### TR_CIV_Civility

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| civ_id | int | NO | YES |
| civ_designation | nvarchar(200) | NO |  |
| civ_active | bit | NO |  |

### TR_CMU_Commune

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cmu_id | int | NO | YES |
| cmu_code | nvarchar(40) | NO |  |
| cmu_name | nvarchar(200) | NO |  |
| cmu_postcode | nvarchar(100) | NO |  |
| cmu_insee | nvarchar(20) | YES |  |
| cmu_code_arrondissement | nvarchar(20) | YES |  |
| cmu_code_canton | nvarchar(20) | YES |  |
| cmu_code_commune | nvarchar(20) | YES |  |
| cmu_statut | nvarchar(100) | YES |  |
| cmu_altitude_moyenne | decimal | YES |  |
| cmu_longitude | decimal | YES |  |
| cmu_latitude | decimal | YES |  |
| cmu_superficie | decimal | YES |  |
| cmu_population | decimal | YES |  |
| cmu_geo_shape | ntext | YES |  |
| cmu_geogla_id | int | YES |  |
| dep_id | int | NO |  |

### TR_COR_Color

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cor_id | int | NO | YES |
| cor_name | nvarchar(200) | NO |  |
| cor_description | nvarchar(2000) | YES |  |
| cor_red | int | NO |  |
| cor_green | int | NO |  |
| cor_blue | int | NO |  |
| soc_id | int | NO |  |

### TR_COU_Country

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cou_id | int | NO | YES |
| cou_name | nvarchar(200) | NO |  |
| cou_code | nvarchar(50) | YES |  |
| cou_iso_code | nvarchar(50) | YES |  |

### TR_CSO_ClientInvoice_SupplierOrder

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cso_id | int | NO | YES |
| cin_id | int | NO |  |
| sod_id | int | NO |  |

### TR_CST_CostPlan_Statut

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cst_id | int | NO | YES |
| cst_designation | nvarchar(50) | NO |  |
| cst_isactive | bit | NO |  |

### TR_CTA_Comment_TAG

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cta_id | int | NO | YES |
| foreign_tag | int | NO |  |
| foreign_id | int | NO |  |
| usr_id | int | NO |  |
| cta_comment | nvarchar(1000) | YES |  |
| cta_tag | nvarchar(100) | YES |  |
| cta_date | datetime | NO |  |
| cta_show_in_pdf | bit | YES |  |

### TR_CTL_ClientTYPE_LIST

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ctl_id | int | NO | YES |
| cli_id | int | NO |  |
| cty_id | int | NO |  |

### TR_CTY_Client_Type

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cty_id | int | NO | YES |
| cty_description | nvarchar(20) | NO |  |

### TR_CUR_Currency

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cur_id | int | NO | YES |
| cur_designation | nvarchar(20) | NO |  |
| cur_ci_num | int | NO |  |
| cur_symbol | nvarchar(10) | NO |  |
| lng_id | int | NO |  |

### TR_DCI_DeliveryForm_ClientInvoice

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| dci_id | int | NO | YES |
| dfo_id | int | NO |  |
| cin_id | int | NO |  |

### TR_DEP_Department

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| dep_id | int | NO | YES |
| dep_code | nvarchar(40) | NO |  |
| dep_name | nvarchar(200) | NO |  |
| reg_id | int | NO |  |

### TR_DTP_Document_Type

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| dtp_id | int | NO | YES |
| dtp_name | nvarchar(200) | NO |  |
| dtp_tab_name | nvarchar(100) | YES |  |
| dtp_foreign_name | nvarchar(50) | YES |  |
| dtp_file_path | nvarchar(200) | YES |  |

### TR_FRE_File_Recycle

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| fre_id | int | NO | YES |
| fre_path | nvarchar(2000) | NO |  |
| fre_d_create | datetime | NO |  |

### TR_LNG_Language

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| lng_id | int | NO | YES |
| lng_label | nvarchar(80) | NO |  |
| lng_short_label | nvarchar(20) | NO |  |

### TR_LSI_Logistic_SupplierInvoice

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| lsi_id | int | NO | YES |
| lgs_id | int | NO |  |
| sin_id | int | NO |  |

### TR_LTP_Line_Type

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ltp_id | int | NO | YES |
| ltp_name | nvarchar(100) | NO |  |
| ltp_description | nvarchar(200) | YES |  |
| ltp_isactive | bit | NO |  |

### TR_MCU_Main_Currency

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| mcu_id | int | NO | YES |
| cur_id | int | NO |  |
| mcu_rate_in | decimal | NO |  |
| mcu_rate_out | decimal | NO |  |
| mcu_rate_date | datetime | NO |  |
| lng_id | int | NO |  |
| cur_id2 | int | NO |  |

### TR_PAL_Photo_Album

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pal_id | int | NO | YES |
| alb_id | int | NO |  |
| pal_description | nvarchar(1000) | YES |  |
| pal_path | nvarchar(1000) | NO |  |
| pal_d_creation | datetime | NO |  |
| pal_d_update | datetime | YES |  |

### TR_PCA_Product_Category

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pca_id | int | NO | YES |
| prd_id | int | NO |  |
| cat_id | int | NO |  |
| pca_description | nvarchar(1000) | YES |  |

### TR_PCO_Payment_Condition

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pco_id | int | NO | YES |
| pco_designation | nvarchar(500) | NO |  |
| pco_active | bit | NO |  |
| pco_numday | int | NO |  |
| pco_day_additional | int | NO |  |
| pco_end_month | bit | NO |  |

### TR_PDA_Product_Driver_Accessory

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pda_id | int | NO | YES |
| prd_id_main | int | NO |  |
| prd_id_ref | int | NO |  |
| pit_id_ref | int | NO |  |
| pda_price | decimal | NO |  |
| pda_type | int | NO |  |

### TR_PMO_Payment_Mode

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pmo_id | int | NO | YES |
| pmo_designation | nvarchar(60) | NO |  |
| pmo_isactive | bit | NO |  |

### TR_POS_Position

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pos_id | int | NO | YES |
| pos_designation | nvarchar(200) | NO |  |
| pos_active | bit | NO |  |

### TR_PSH_Product_Shelves

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| psh_id | int | NO | YES |
| inv_id | int | NO |  |
| whs_id | int | NO |  |
| she_id | int | NO |  |
| psh_quantity | decimal | YES |  |

### TR_REG_Region

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| reg_id | int | NO | YES |
| reg_code | nvarchar(40) | NO |  |
| reg_name | nvarchar(200) | NO |  |
| cou_id | int | NO |  |

### TR_RIT_Right

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| rit_id | int | NO | YES |
| scr_id | int | NO |  |
| rol_id | int | NO |  |
| rit_read | bit | NO |  |
| rit_valid | bit | NO |  |
| rit_modify | bit | NO |  |
| rit_create | bit | NO |  |
| rit_delete | bit | NO |  |
| rit_active | bit | NO |  |
| rit_cancel | bit | NO |  |
| rit_super_right | bit | NO |  |

### TR_RMP_Recommended_Product

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| rmp_id | int | NO | YES |
| cat_id | int | NO |  |
| prd_id | int | NO |  |
| rmp_order | int | NO |  |
| rmp_actived | bit | NO |  |
| soc_id | int | NO |  |

### TR_ROL_Role

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| rol_id | int | NO | YES |
| rol_name | nvarchar(200) | NO |  |
| rol_active | bit | NO |  |
| rol_level | int | NO |  |

### TR_SCR_Screen

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| scr_id | int | NO | YES |
| scr_name | nvarchar(200) | NO |  |
| scr_parent_name | nvarchar(200) | YES |  |

### TR_SDC_Supplier_Order_Document

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sdc_id | int | NO | YES |
| sod_id | int | NO |  |
| sdc_d_creation | datetime | NO |  |
| sdc_comment | nvarchar(200) | YES |  |
| sdc_file | nvarchar(1000) | YES |  |
| sdc_d_update | datetime | YES |  |

### TR_SOC_Society

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| soc_id | int | NO | YES |
| soc_society_name | nvarchar(500) | NO |  |
| soc_is_actived | bit | NO |  |
| cur_id | int | NO |  |
| lng_id | int | NO |  |
| soc_datebegin | datetime | YES |  |
| soc_dateend | datetime | YES |  |
| soc_client_datebegin | datetime | YES |  |
| soc_client_dateend | datetime | YES |  |
| soc_email_auto | bit | YES |  |
| soc_capital | nvarchar(1000) | YES |  |
| soc_short_label | nvarchar(50) | YES |  |
| soc_rib_name | nvarchar(500) | YES |  |
| soc_rib_address | nvarchar(1000) | YES |  |
| soc_rib_code_iban | nvarchar(1000) | YES |  |
| soc_rib_code_bic | nvarchar(1000) | YES |  |
| soc_address1 | nvarchar(400) | YES |  |
| soc_address2 | nvarchar(400) | YES |  |
| soc_postcode | nvarchar(400) | YES |  |
| soc_city | nvarchar(400) | YES |  |
| soc_county | nvarchar(400) | YES |  |
| soc_tel | nvarchar(200) | YES |  |
| soc_siret | nvarchar(100) | YES |  |
| soc_rcs | nvarchar(100) | YES |  |
| soc_cellphone | nvarchar(200) | YES |  |
| soc_email | nvarchar(1000) | YES |  |
| soc_tva_intra | nvarchar(100) | YES |  |
| soc_site | nvarchar(200) | YES |  |
| soc_mask_commission | bit | YES |  |
| soc_fax | nvarchar(100) | YES |  |
| soc_rib_bank_code | nvarchar(50) | YES |  |
| soc_rib_agence_code | nvarchar(50) | YES |  |
| soc_rib_account_number | nvarchar(50) | YES |  |
| soc_rib_key | nvarchar(50) | YES |  |
| soc_rib_domiciliation_agency | nvarchar(200) | YES |  |
| soc_dp_upd | bit | NO |  |
| soc_cnss | nvarchar(200) | YES |  |
| soc_taxe_pro | nvarchar(200) | YES |  |
| soc_is_prd_mandatory | bit | YES |  |
| soc_rib_name_2 | nvarchar(50) | YES |  |
| soc_rib_address_2 | nvarchar(200) | YES |  |
| soc_rib_code_iban_2 | nvarchar(50) | YES |  |
| soc_rib_code_bic_2 | nvarchar(50) | YES |  |
| soc_rib_bank_code_2 | nvarchar(50) | YES |  |
| soc_rib_agence_code_2 | nvarchar(50) | YES |  |
| soc_rib_account_number_2 | nvarchar(50) | YES |  |
| soc_rib_key_2 | nvarchar(50) | YES |  |
| soc_rib_domiciliation_agency_2 | nvarchar(200) | YES |  |
| soc_rib_abbre | nvarchar(50) | YES |  |
| soc_rib_abbre_2 | nvarchar(50) | YES |  |
| soc_show_language_bar | bit | YES |  |
| soc_cin_lgs | bit | YES |  |

### TR_SPR_SupplierOrder_Payment_Record

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| spr_id | int | NO | YES |
| spr_d_creation | datetime | NO |  |
| spr_d_payment | datetime | NO |  |
| spr_amount | decimal | NO |  |
| spr_comment | nvarchar(400) | YES |  |
| sol_id | int | YES |  |
| spr_d_update | datetime | YES |  |
| sod_id | int | YES |  |
| spr_file | nvarchar(1000) | YES |  |
| spr_payer | nvarchar(100) | YES |  |
| spr_payment_code | nvarchar(200) | YES |  |
| spr_guid | nvarchar(100) | YES |  |

### TR_SPR_Supplier_Product

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| spr_id | int | NO | YES |
| sup_id | int | NO |  |
| prd_id | int | NO |  |
| spr_prd_ref | nvarchar(100) | YES |  |
| spr_price_1_100 | decimal | YES |  |
| spr_price_100_500 | decimal | YES |  |
| spr_price_500_plus | decimal | YES |  |
| soc_id | int | NO |  |
| cur_id | int | NO |  |
| spr_comment | nvarchar(2000) | YES |  |
| spr_coef_100_500 | decimal | YES |  |
| spr_coef_500_plus | decimal | YES |  |

### TR_STT_Status

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| stt_id | int | NO | YES |
| stt_order | int | NO |  |
| stt_value | nvarchar(100) | NO |  |
| stt_tab_name | nvarchar(100) | NO |  |
| stt_actived | bit | NO |  |
| stt_description | nvarchar(200) | YES |  |

### TR_STY_Supplier_Type

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sty_id | int | NO | YES |
| sty_description | nvarchar(100) | NO |  |

### TR_THF_Text_Header_Footer

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| thf_id | int | NO | YES |
| thf_header | ntext | YES |  |
| thf_footer | ntext | YES |  |
| thf_cin_header | ntext | YES |  |
| thf_cin_footer | ntext | YES |  |
| thf_dlv_footer_condition | ntext | YES |  |
| thf_dlv_footer_law | ntext | YES |  |
| thf_cin_penality | ntext | YES |  |
| thf_cin_discount_for_prepayment | ntext | YES |  |
| thr_cin_email_footer | ntext | YES |  |

### TR_TTE_TRADE_TERMS

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| tte_id | int | NO | YES |
| tte_name | nvarchar(200) | NO |  |
| tte_description | nvarchar(500) | YES |  |
| tte_actived | bit | NO |  |

### TR_UCL_User_Calendar

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ucd_id | int | NO | YES |
| usr_id | int | NO |  |
| cld_id | int | NO |  |

### TR_UPD_User_Password

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| upd_id | int | NO | YES |
| usr_id | int | NO |  |
| upd_pwd | nvarchar(2000) | NO |  |
| upd_d_creation | datetime | NO |  |
| upd_actived | bit | NO |  |
| upd_d_updated | datetime | YES |  |

### TR_URS_User_Relationship

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| urs_id | int | NO | YES |
| usr_level1_id | int | NO |  |
| usr_level2_id | int | NO |  |
| urs_type | int | NO |  |

### TR_VAT_Vat

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| vat_id | int | NO | YES |
| vat_designation | nvarchar(200) | NO |  |
| vat_vat_rate | decimal | NO |  |
| vat_description | nvarchar(30) | NO |  |

## TS_ Tables (13)

### TS_CPW_Client_Password

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| cpw_id | int | NO | YES |
| cpw_login | nvarchar(2000) | NO |  |
| cpw_pwd | nvarchar(2000) | NO |  |
| scl_id | int | NO |  |
| cpw_d_creation | datetime | NO |  |
| cpw_is_actived | bit | NO |  |

### TS_Mgr_Message_Record

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| mgr_id | int | NO | YES |
| mgr_ip | nvarchar(100) | YES |  |
| mgr_name | nvarchar(100) | YES |  |
| mgr_email | nvarchar(500) | YES |  |
| mgr_tel | nvarchar(100) | YES |  |
| mgr_type | int | YES |  |
| mgr_subject | nvarchar(500) | YES |  |
| mgr_message | nvarchar(4000) | YES |  |
| mgr_d_creation | datetime | NO |  |
| mgr_code | nvarchar(50) | YES |  |
| mgr_last_name | nvarchar(100) | YES |  |
| mgr_address | nvarchar(1000) | YES |  |
| mgr_postcode | nvarchar(100) | YES |  |
| mgr_city | nvarchar(100) | YES |  |
| mgr_how2Know | nvarchar(500) | YES |  |

### TS_PIG_Project_Image

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| pig_id | int | NO | YES |
| prj_id | int | NO |  |
| pig_order | int | NO |  |
| pig_path | nvarchar(2000) | NO |  |

### TS_PPD_Project_Product

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ppd_id | int | NO | YES |
| prd_id | int | NO |  |
| prj_id | int | NO |  |

### TS_PRJ_Project

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| prj_id | int | NO | YES |
| prj_name | nvarchar(500) | NO |  |
| prj_date | datetime | YES |  |
| prj_d_create | datetime | NO |  |
| prj_description | nvarchar(2000) | YES |  |
| prj_location | nvarchar(1000) | YES |  |
| prj_client | nvarchar(1000) | YES |  |
| prj_designer | nvarchar(1000) | YES |  |
| prj_actived | bit | NO |  |
| prj_recommended | bit | NO |  |

### TS_PTG_Project_Tag

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ptg_id | int | NO | YES |
| prj_id | int | NO |  |
| tag_id | int | NO |  |

### TS_SCLN_Shopping_Cart_Line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| scln_id | int | NO | YES |
| sct_id | int | NO |  |
| scln_d_add | datetime | NO |  |
| prd_id | int | NO |  |
| pit_id | int | YES |  |
| scln_prd_name | nvarchar(200) | NO |  |
| scln_qty | int | NO |  |
| scln_comment | nvarchar(400) | YES |  |
| scln_attr1 | nvarchar(500) | YES |  |
| scln_attr2 | nvarchar(500) | YES |  |
| scln_attr3 | nvarchar(500) | YES |  |

### TS_SCL_Site_Client

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| scl_id | int | NO | YES |
| scl_login | nvarchar(200) | NO |  |
| scl_company_name | nvarchar(250) | NO |  |
| scl_firstname | nvarchar(200) | YES |  |
| scl_lastname | nvarchar(200) | YES |  |
| civ_id | int | NO |  |
| scl_siren | nvarchar(50) | YES |  |
| scl_siret | nvarchar(50) | YES |  |
| scl_vat_intra | nvarchar(50) | YES |  |
| scl_is_active | bit | NO |  |
| scl_d_creation | datetime | NO |  |
| scl_d_active | datetime | YES |  |
| scl_address1 | nvarchar(200) | YES |  |
| scl_address2 | nvarchar(200) | YES |  |
| scl_postcode | nvarchar(200) | YES |  |
| scl_city | nvarchar(200) | YES |  |
| scl_country | nvarchar(200) | YES |  |
| scl_tel1 | nvarchar(100) | YES |  |
| scl_tel2 | nvarchar(100) | YES |  |
| scl_fax | nvarchar(100) | YES |  |
| scl_cellphone | nvarchar(100) | YES |  |
| scl_email | nvarchar(100) | YES |  |
| cli_id | int | YES |  |
| cco_id | int | YES |  |
| soc_id | int | NO |  |

### TS_SCT_Shopping_Cart

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| sct_id | int | NO | YES |
| scl_id | int | NO |  |
| sct_d_creation | datetime | NO |  |
| sct_is_actived | bit | NO |  |

### TS_TAG_Tags

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| tag_id | int | NO | YES |
| tag_tag | nvarchar(100) | NO |  |

### TS_ULG_User_Log

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| ulg_id | int | NO | YES |
| ulg_time | datetime | NO |  |
| ulg_ip | nvarchar(100) | YES |  |
| ulg_longtitude | decimal | YES |  |
| ulg_latitude | decimal | YES |  |
| ulg_userAgent | nvarchar(500) | YES |  |
| ulg_appName | nvarchar(500) | YES |  |
| ulg_appVersion | nvarchar(500) | YES |  |
| ulg_cookieEnabled | bit | YES |  |
| ulg_mime | nvarchar(500) | YES |  |
| ulg_platform | nvarchar(500) | YES |  |
| ulg_user_lng | nvarchar(500) | YES |  |
| ulg_system_lng | nvarchar(500) | YES |  |
| ulg_nav_lng | nvarchar(500) | YES |  |
| ulg_javaEnabled | bit | YES |  |
| ulg_scr_height | int | YES |  |
| ulg_scr_width | int | YES |  |
| ulg_scr_colorDepth | int | YES |  |
| ulg_url | nvarchar(1000) | YES |  |
| ulg_ip_status | nvarchar(500) | YES |  |
| ulg_ip_country | nvarchar(500) | YES |  |
| ulg_ip_ulg_ip_countryCode | nvarchar(500) | YES |  |
| ulg_ip_region | nvarchar(500) | YES |  |
| ulg_ip_regionName | nvarchar(500) | YES |  |
| ulg_ip_city | nvarchar(500) | YES |  |
| ulg_ip_zip | nvarchar(500) | YES |  |
| ulg_ip_lat | decimal | YES |  |
| ulg_ip_lon | decimal | YES |  |
| ulg_ip_timezone | nvarchar(500) | YES |  |
| ulg_ip_isp | nvarchar(1000) | YES |  |
| ulg_ip_org | nvarchar(1000) | YES |  |
| ulg_ip_as | nvarchar(500) | YES |  |
| ulg_ip_query | nvarchar(500) | YES |  |
| ulg_ip_2_address | nvarchar(4000) | YES |  |

### TS_WLL_Wishlist_line

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| wll_id | int | NO | YES |
| wls_id | int | NO |  |
| wll_d_add | datetime | NO |  |
| prd_id | int | NO |  |
| pit_id | int | YES |  |
| wll_prd_name | nvarchar(200) | NO |  |
| wll_attr1 | nvarchar(500) | YES |  |
| wll_attr2 | nvarchar(500) | YES |  |
| wll_attr3 | nvarchar(500) | YES |  |

### TS_WLS_Wishlist

| Column | Type | Nullable | PK |
| --- | --- | --- | --- |
| wls_id | int | NO | YES |
| scl_id | int | NO |  |
| wls_d_creation | datetime | NO |  |
| wls_is_actived | bit | NO |  |
| wls_d_update | datetime | NO |  |

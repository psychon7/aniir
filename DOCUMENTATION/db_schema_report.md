# ECOLED DB vs Backend Models Report

Source schema: `/tmp/ecoled_schema.json` (live SQL Server extract).

## Summary
- DB tables: 105
- Model tables parsed: 37
- DB tables missing in models: 89
- Model tables missing in DB: 21
- Tables with column diffs: 8

## Lookup Tables (critical for lookups API)
| Table | In DB | In Models |
| --- | --- | --- |
| TM_CAT_Category | YES | NO |
| TM_WHS_WareHouse | YES | NO |
| TR_CTY_Client_Type | YES | YES |
| TR_CUR_Currency | YES | YES |
| TR_PCO_Payment_Condition | YES | YES |
| TR_PMO_Payment_Mode | YES | YES |
| TR_STT_Status | YES | YES |
| TR_VAT_Vat | YES | YES |

## DB Tables Missing in Models
- TH_UCT_User_Comment
- TH_UFL_User_Flag
- TI_DOC_Document
- TI_INVR_INV_Record
- TI_MSG_Message
- TI_PIM_Product_Image
- TI_PIVR_PIN_Record
- TI_PIV_PRE_INV_Inventory
- TI_PSR_PRE_Shipping_Receiving_Line
- TI_PTI_Product_Instance_Image
- TM_CAT_Category
- TM_CCO_Client_Contact
- TM_CLD_Calendar
- TM_CLN_CostPlan_Lines
- TM_COD_Client_Order
- TM_COL_ClientOrder_Lines
- TM_CON_CONSIGNEE
- TM_CPL_Cost_Plan
- TM_CPY_ClientInvoice_Payment
- TM_DFL_DevlieryForm_Line
- TM_DFO_Delivery_Form
- TM_INV_Inventory
- TM_LGL_Logistic_Lines
- TM_LGS_Logistic
- TM_PIL_PurchaseIntent_Lines
- TM_PIN_Purchase_Intent
- TM_PRD_Product
- TM_PTM_Product_Type_Matrix
- TM_PTY_Product_Type
- TM_SHE_Shelves
- TM_SIL_SupplierInvoice_Lines
- TM_SIN_Supplier_Invoice
- TM_SOD_Supplier_Order
- TM_SOL_SupplierOrder_Lines
- TM_SRL_Shipping_Receiving_Line
- TM_SRV_Shipping_Receiving
- TM_USR_User
- TM_WHS_WareHouse
- TR_ACT_Activity
- TR_ALB_Album
- TR_BAC_Bank_Account
- TR_CDL_Client_Delegate
- TR_CGS_CIN_LGS
- TR_CMU_Commune
- TR_COR_Color
- TR_COU_Country
- TR_CSO_ClientInvoice_SupplierOrder
- TR_CST_CostPlan_Statut
- TR_CTA_Comment_TAG
- TR_CTL_ClientTYPE_LIST
- TR_DCI_DeliveryForm_ClientInvoice
- TR_DEP_Department
- TR_DTP_Document_Type
- TR_FRE_File_Recycle
- TR_LNG_Language
- TR_LSI_Logistic_SupplierInvoice
- TR_LTP_Line_Type
- TR_MCU_Main_Currency
- TR_PAL_Photo_Album
- TR_PCA_Product_Category
- TR_PDA_Product_Driver_Accessory
- TR_POS_Position
- TR_PSH_Product_Shelves
- TR_REG_Region
- TR_RIT_Right
- TR_RMP_Recommended_Product
- TR_SCR_Screen
- TR_SDC_Supplier_Order_Document
- TR_SPR_SupplierOrder_Payment_Record
- TR_SPR_Supplier_Product
- TR_STY_Supplier_Type
- TR_THF_Text_Header_Footer
- TR_TTE_TRADE_TERMS
- TR_UCL_User_Calendar
- TR_UPD_User_Password
- TR_URS_User_Relationship
- TS_CPW_Client_Password
- TS_Mgr_Message_Record
- TS_PIG_Project_Image
- TS_PPD_Project_Product
- TS_PRJ_Project
- TS_PTG_Project_Tag
- TS_SCLN_Shopping_Cart_Line
- TS_SCL_Site_Client
- TS_SCT_Shopping_Cart
- TS_TAG_Tags
- TS_ULG_User_Log
- TS_WLL_Wishlist_line
- TS_WLS_Wishlist

## Model Tables Missing in DB
- TM_CHT_Thread
- TM_CLI_ClientContact
- TM_CLI_Invoice_LEGACY_UNUSED
- TM_CP_CostPlan
- TM_DEL_DeliveryForm
- TM_DOC_DocumentAttachment
- TM_DRV_File
- TM_INL_ClientInvoiceLine
- TM_LOG_Shipment
- TM_LOT_SupplyLot
- TM_PAY_ClientInvoicePayment
- TM_PAY_Payment
- TM_QUO_Quote
- TM_SET_EmailLog
- TM_STK_Stock
- TM_STK_StockMovement
- TM_SUP_SupplyLot
- TR_BU_BusinessUnit
- TR_CAT_Category
- TR_UOM_UnitOfMeasure
- TR_WH_Warehouse

## Column Mismatches
### TM_CLI_CLient
- Model files: backend/app/models/client.py
- Missing in models (43): act_id, cli_abbreviation, cli_accounting_email, cli_address1, cli_address2, cli_cellphone, cli_city, cli_comment_for_client, cli_comment_for_interne, cli_company_name, cli_country, cli_d_creation, cli_d_update, cli_email, cli_fax, cli_free_of_harbor, cli_id, cli_invoice_day, cli_invoice_day_is_last_day, cli_isactive, cli_isblocked, cli_newsletter_email, cli_pdf_version, cli_postcode, cli_recieve_newsletter, cli_ref, cli_showdetail, cli_siren, cli_siret, cli_tel1, cli_tel2, cli_usr_com1, cli_usr_com2, cli_usr_com3, cli_vat_intra, cmu_id, cty_id, cur_id, pco_id, pmo_id, soc_id, usr_created_by, vat_id

### TM_PIT_Product_Instance
- Model files: backend/app/models/product.py
- Missing in models (7): pit_description, pit_inventory_threshold, pit_prd_info, pit_price, pit_purchase_price, pit_ref, pit_tmp_ref
- Extra in models (29): prd_carton_height, prd_carton_length, prd_carton_weight, prd_carton_width, prd_code, prd_d_creation, prd_d_update, prd_depth, prd_description, prd_file_name, prd_height, prd_hole_size, prd_length, prd_name, prd_outside_diameter, prd_price, prd_purchase_price, prd_quantity_each_carton, prd_ref, prd_sub_name, prd_sup_description, prd_tmp_ref, prd_unit_height, prd_unit_length, prd_unit_weight, prd_unit_width, prd_weight, prd_width, soc_id

### TM_PRJ_Project
- Model files: backend/app/models/project.py
- Missing in models (4): prj_client_comment, prj_footer_text, prj_header_text, prj_inter_comment

### TM_SCO_Supplier_Contact
- Model files: backend/app/models/supplier_contact.py
- Missing in models (21): civ_id, sco_address1, sco_address2, sco_adresse_title, sco_cellphone, sco_city, sco_comment, sco_country, sco_d_creation, sco_d_update, sco_fax, sco_firstname, sco_lastname, sco_newsletter_email, sco_postcode, sco_recieve_newsletter, sco_ref, sco_tel1, sco_tel2, sup_id, usr_created_by
- Extra in models (9): sco_department, sco_first_name, sco_is_primary, sco_job_title, sco_last_name, sco_mobile, sco_notes, sco_phone, sco_sup_id

### TM_SUP_Supplier
- Model files: backend/app/models/supplier.py
- Extra in models (2): prd_id, spr_id

### TR_CIV_Civility
- Model files: backend/app/models/user.py
- Missing in models (1): civ_active
- Extra in models (26): rol_id, soc_id, usr_address1, usr_address2, usr_cellphone, usr_city, usr_code_hr, usr_comment, usr_county, usr_creator_id, usr_d_creation, usr_d_update, usr_email, usr_fax, usr_firstname, usr_id, usr_is_actived, usr_lastname, usr_login, usr_photo_path, usr_postcode, usr_pwd, usr_rcv_purchase_notif, usr_super_right, usr_tel, usr_title

### TR_CUR_Currency
- Model files: backend/app/models/currency.py, backend/app/models/reference.py
- Extra in models (14): Code, ColorHex, DecimalPlaces, EntityType, Id, IsActive, Name, SortOrder, Symbol, cur_id2, mcu_id, mcu_rate_date, mcu_rate_in, mcu_rate_out

### TR_SOC_Society
- Model files: backend/app/models/society.py
- Missing in models (25): soc_cin_lgs, soc_cnss, soc_is_prd_mandatory, soc_rib_abbre, soc_rib_abbre_2, soc_rib_account_number, soc_rib_account_number_2, soc_rib_address, soc_rib_address_2, soc_rib_agence_code, soc_rib_agence_code_2, soc_rib_bank_code, soc_rib_bank_code_2, soc_rib_code_bic, soc_rib_code_bic_2, soc_rib_code_iban, soc_rib_code_iban_2, soc_rib_domiciliation_agency, soc_rib_domiciliation_agency_2, soc_rib_key, soc_rib_key_2, soc_rib_name, soc_rib_name_2, soc_show_language_bar, soc_taxe_pro

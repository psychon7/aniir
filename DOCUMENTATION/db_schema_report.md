# DB Schema Alignment Report

Source schema: `backend/db_schema.json` (SQL Server extract).
Model schema: SQLAlchemy metadata from `backend/app/models`.

## Summary
- DB tables: 105
- Model tables: 82
- DB tables missing in models: 51
- Model tables missing in DB: 28
- Tables with column diffs: 20

## DB Tables Missing in Models
- TH_UCT_User_Comment
- TH_UFL_User_Flag
- TI_DOC_Document
- TI_MSG_Message
- TI_PIM_Product_Image
- TI_PIVR_PIN_Record
- TI_PSR_PRE_Shipping_Receiving_Line
- TI_PTI_Product_Instance_Image
- TM_CLD_Calendar
- TM_PTM_Product_Type_Matrix
- TR_ALB_Album
- TR_BAC_Bank_Account
- TR_CGS_CIN_LGS
- TR_CMU_Commune
- TR_COR_Color
- TR_CSO_ClientInvoice_SupplierOrder
- TR_CTA_Comment_TAG
- TR_CTL_ClientTYPE_LIST
- TR_DCI_DeliveryForm_ClientInvoice
- TR_DEP_Department
- TR_DTP_Document_Type
- TR_FRE_File_Recycle
- TR_LTP_Line_Type
- TR_PAL_Photo_Album
- TR_PCA_Product_Category
- TR_PDA_Product_Driver_Accessory
- TR_POS_Position
- TR_REG_Region
- TR_RIT_Right
- TR_RMP_Recommended_Product
- TR_SCR_Screen
- TR_SDC_Supplier_Order_Document
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
- TI_PRC_ProductComponent
- TM_CHAT_Message
- TM_CHAT_Room
- TM_CHAT_RoomMember
- TM_CHT_Message
- TM_CHT_Participant
- TM_CHT_ReadReceipt
- TM_CHT_Thread
- TM_CPP_Client_Product_Price
- TM_DOC_DocumentAttachment
- TM_DRV_File
- TM_DRV_Folder
- TM_FRC_FreightCost
- TM_LCH_LandedCostHistory
- TM_LCL_LandedCostLog
- TM_LOT_SupplyLot
- TM_LOT_SupplyLotItem
- TM_PAT_ProductAttribute
- TM_PAV_ProductAttributeValue
- TM_PLC_ProductLandedCost
- TM_SET_EmailLog
- TM_SPP_Supplier_Product_Price
- TM_TSK_Task
- TR_BRA_Brand
- TR_BU_BusinessUnit
- TR_LCC_LandedCostComponent
- TR_LCP_LandedCostProfile
- TR_UOM_UnitOfMeasure

## Column Mismatches (DB vs Model)
### TM_CCO_Client_Contact
- Missing in models: (none)
- Extra in models: cco_role

### TM_CII_ClientInvoice_Line
- Missing in models: (none)
- Extra in models: cii_image_url

### TM_CLI_CLient
- Missing in models: (none)
- Extra in models: cli_bank_iban, cli_bank_bic, cli_bank_name, cli_bank_account_holder, cli_bank_address

### TM_CLN_CostPlan_Lines
- Missing in models: cln_prd_des
- Extra in models: cln_image_url

### TM_COD_Client_Order
- Missing in models: (none)
- Extra in models: cco_id_delivery, cod_inv_cco_ref, cod_inv_cco_adresse_title, cod_inv_cco_firstname, cod_inv_cco_lastname, cod_inv_cco_address1, cod_inv_cco_address2, cod_inv_cco_postcode, cod_inv_cco_city, cod_inv_cco_country, cod_inv_cco_tel1, cod_inv_cco_tel2, cod_inv_cco_fax, cod_inv_cco_cellphone, cod_inv_cco_email, cod_dlv_cco_ref, cod_dlv_cco_adresse_title, cod_dlv_cco_firstname, cod_dlv_cco_lastname, cod_dlv_cco_address1, cod_dlv_cco_address2, cod_dlv_cco_postcode, cod_dlv_cco_city, cod_dlv_cco_country, cod_dlv_cco_tel1, cod_dlv_cco_tel2, cod_dlv_cco_fax, cod_dlv_cco_cellphone, cod_dlv_cco_email

### TM_COL_ClientOrder_Lines
- Missing in models: (none)
- Extra in models: col_image_url

### TM_CON_CONSIGNEE
- Missing in models: cmu_id
- Extra in models: (none)

### TM_CPL_Cost_Plan
- Missing in models: cpl_fromsite, cpl_stripe_chargeid
- Extra in models: cco_id_delivery, cpl_inv_cco_ref, cpl_inv_cco_adresse_title, cpl_inv_cco_firstname, cpl_inv_cco_lastname, cpl_inv_cco_address1, cpl_inv_cco_address2, cpl_inv_cco_postcode, cpl_inv_cco_city, cpl_inv_cco_country, cpl_inv_cco_tel1, cpl_inv_cco_tel2, cpl_inv_cco_fax, cpl_inv_cco_cellphone, cpl_inv_cco_email, cpl_dlv_cco_ref, cpl_dlv_cco_adresse_title, cpl_dlv_cco_firstname, cpl_dlv_cco_lastname, cpl_dlv_cco_address1, cpl_dlv_cco_address2, cpl_dlv_cco_postcode, cpl_dlv_cco_city, cpl_dlv_cco_country, cpl_dlv_cco_tel1, cpl_dlv_cco_tel2, cpl_dlv_cco_fax, cpl_dlv_cco_cellphone, cpl_dlv_cco_email

### TM_CPY_ClientInvoice_Payment
- Missing in models: cpy_payment_code
- Extra in models: (none)

### TM_PIL_PurchaseIntent_Lines
- Missing in models: pil_client, pil_power, pil_driver, pil_temp_color, pil_length, pil_width, pil_height, pil_eff_lum, pil_ugr, pil_cri, pil_logistic, pil_supplier, pil_prd_des, pil_deadline, pil_prd_name, pil_d_creation, pil_d_update, usr_id_creator, usr_id_com1, usr_id_com2, usr_id_com3, cln_id, col_id, cii_id, pil_comment, pil_feature_code, sup_id
- Extra in models: (none)

### TM_PIT_Product_Instance
- Missing in models: pit_prd_info
- Extra in models: (none)

### TM_PRD_Product
- Missing in models: prd_specifications, prd_outside_length, prd_outside_width, prd_outside_height, prd_hole_lenght, prd_hole_width
- Extra in models: prd_interior_length, prd_interior_width, prd_opening_diameter, prd_thickness

### TM_PTY_Product_Type
- Missing in models: pty_specifications_fields, pty_standards
- Extra in models: (none)

### TM_SIL_SupplierInvoice_Lines
- Missing in models: sil_prd_des
- Extra in models: (none)

### TM_SOD_Supplier_Order
- Missing in models: sod_guid, sub_sup_id, sod_need_send, sod_finish, sod_sup_nbr, usr_com_id, cin_id, soc_client, cli_id, sod_started_time, sod_canceled_time, stt_id
- Extra in models: (none)

### TM_SOL_SupplierOrder_Lines
- Missing in models: sol_prd_des, sol_power, sol_driver, sol_temp_color, sol_length, sol_width, sol_height, sol_eff_lum, sol_ugr, sol_cri, sol_logistic, sol_client, sol_d_creation, sol_deadline, sol_prd_name, sol_d_update, sol_d_production, sol_d_exp_delivery, sol_d_delivery, sol_feature_code, sol_d_shipping, sol_transporter, sol_logistics_number, sol_d_exp_arrival, sol_need2pay, sol_paid, sol_guid, sol_qty_storage, sol_comment, sol_finished, usr_id_com1, usr_id_com2, usr_id_com3
- Extra in models: (none)

### TR_LNG_Language
- Missing in models: lng_short_label
- Extra in models: (none)

### TR_PSH_Product_Shelves
- Missing in models: psh_quantity
- Extra in models: (none)

### TR_SOC_Society
- Missing in models: soc_cnss, soc_taxe_pro, soc_is_prd_mandatory, soc_show_language_bar, soc_cin_lgs
- Extra in models: soc_quote_header_text, soc_quote_footer_text, soc_delivery_conditions_text, soc_invoice_penalty_text, soc_invoice_early_payment_discount_text, soc_invoice_email_body, soc_pricing_coefficient_sod_cin

### TR_SPR_Supplier_Product
- Missing in models: spr_prd_ref, spr_price_1_100, spr_price_100_500, spr_price_500_plus, soc_id, cur_id, spr_comment, spr_coef_100_500, spr_coef_500_plus
- Extra in models: (none)

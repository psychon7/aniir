# Schema Alignment
Generated: 2026-02-04
Scope: Legacy DB schema from `Legacy/ERP.Repositories/DataBase/ERP_DB.edmx` and current backend models in `backend/app/models`.

## Summary
- Legacy tables in EDMX: 106
- Backend model tables: 83
- Legacy tables missing backend models: 52
- Backend models without legacy tables: 29
- Disabled placeholder models without `__tablename__`: 8 (tracked separately below)

## Backend Model Table Mapping
| Table | Model File(s) | Status |
| --- | --- | --- |
| TM_CAT_Category | category.py | active |
| TM_CCO_Client_Contact | client_contact.py | active |
| TM_CHAT_Message | chat.py | disabled |
| TM_CHAT_Room | chat.py | disabled |
| TM_CHAT_RoomMember | chat.py | disabled |
| TM_CHT_Message | chat.py | disabled |
| TM_CHT_Participant | chat.py | disabled |
| TM_CHT_ReadReceipt | chat.py | disabled |
| TM_CHT_Thread | chat.py | disabled |
| TM_CII_ClientInvoice_Line | client_invoice_line.py | active |
| TM_CIN_Client_Invoice | invoice.py | active |
| TM_CLI_CLient | client.py | active |
| TM_CLI_Invoice_LEGACY_UNUSED | client_invoice.py | disabled |
| TM_CLN_CostPlan_Lines | costplan.py | active |
| TM_COD_Client_Order | order.py | active |
| TM_COL_ClientOrder_Lines | order.py | active |
| TM_CPL_Cost_Plan | costplan.py | active |
| TM_CPP_Client_Product_Price | client_product_price.py | active |
| TM_CPY_ClientInvoice_Payment | client_invoice_payment.py | active |
| TM_CON_CONSIGNEE | consignee.py | active |
| TM_DFL_DevlieryForm_Line | delivery_form.py | active |
| TM_DFO_Delivery_Form | delivery_form.py | active |
| TM_DOC_DocumentAttachment | document_attachment.py | disabled |
| TM_DRV_File | drive.py | disabled |
| TM_DRV_Folder | drive.py | disabled |
| TM_PAT_ProductAttribute | product_attribute.py | active |
| TM_PAV_ProductAttributeValue | product_attribute.py | active |
| TM_PIL_PurchaseIntent_Lines | purchase_intent.py | active |
| TM_PIN_Purchase_Intent | purchase_intent.py | active |
| TM_PIT_Product_Instance | product.py | active |
| TM_PRD_Product | product.py | active |
| TM_PRJ_Project | project.py | active |
| TM_PTY_Product_Type | product_type.py | active |
| TM_SCO_Supplier_Contact | supplier_contact.py | active |
| TM_SIL_SupplierInvoice_Lines | supplier_invoice.py | active |
| TM_SIN_Supplier_Invoice | supplier_invoice.py | active |
| TM_LGS_Logistic | logistics.py | active |
| TM_LGL_Logistic_Lines | logistics.py | active |
| TM_SOD_Supplier_Order | supplier_order.py | active |
| TM_SOL_SupplierOrder_Lines | supplier_order.py | active |
| TM_SPP_Supplier_Product_Price | supplier_product_price.py | active |
| TM_SRL_Shipping_Receiving_Line | shipment.py | active |
| TM_SRV_Shipping_Receiving | shipment.py | active |
| TM_SUP_Supplier | supplier.py | active |
| TM_TSK_Task | task.py | active |
| TM_USR_User | user.py | active |
| TM_WHS_WareHouse | warehouse.py | active |
| TR_ACT_Activity | activity.py | active |
| TR_BRA_Brand | brand.py | active |
| TR_CDL_Client_Delegate | client_delegate.py | active |
| TR_CIV_Civility | user.py | active |
| TR_COU_Country | country.py | active |
| TR_CTY_Client_Type | client_type.py | active |
| TR_CUR_Currency | currency.py | active |
| TR_LNG_Language | language.py | active |
| TR_MCU_Main_Currency | currency.py | active |
| TR_PCO_Payment_Condition | payment_term.py | active |
| TR_PMO_Payment_Mode | payment_mode.py | active |
| TR_ROL_Role | role.py | active |
| TR_SOC_Society | society.py | active |
| TR_LSI_Logistic_SupplierInvoice | logistics.py | active |
| TR_SPR_Supplier_Product | supplier.py | active |
| TR_SPR_SupplierOrder_Payment_Record | supplier_order_payment_record.py | active |
| TR_STT_Status | status.py | active |
| TR_VAT_Vat | vat_rate.py | active |
| TI_INVR_INV_Record | inventory.py | active |
| TI_PIV_PRE_INV_Inventory | inventory.py | active |
| TM_INT_ShopifyLocationMap | shopify_location_map.py | disabled |
| TM_INT_ShopifyStore | shopify_store.py | disabled |
| TM_INT_X3CustomerMap | sage_x3.py | disabled |
| TM_INT_X3ExportLog | sage_x3.py | disabled |
| TM_INT_X3ProductMap | sage_x3.py | disabled |
| TM_INV_Inventory | inventory.py | active |
| TM_SHE_Shelves | inventory.py | active |
| TM_SHP_Order | shopify.py | disabled |
| TM_SHP_Order_Line | shopify.py | disabled |
| TM_SHP_Product | shopify.py | disabled |
| TM_SHP_Sync_Log | shopify.py | disabled |
| TR_CST_CostPlan_Statut | cost_plan_status.py | active |
| TR_PSH_Product_Shelves | inventory.py | active |
| TR_SHP_Integration | shopify.py | disabled |
| TR_SHP_OAuth_State | shopify.py | disabled |
| TR_SHP_Webhook | shopify.py | disabled |

## Legacy Tables Missing Backend Models
These tables exist in the legacy DB but have no model in the current backend.

| Table | Notes |
| --- | --- |
| TH_UCT_User_Comment | |
| TH_UFL_User_Flag | |
| TI_DOC_Document | |
| TI_MSG_Message | |
| TI_PIM_Product_Image | |
| TI_PIVR_PIN_Record | |
| TI_PSR_PRE_Shipping_Receiving_Line | |
| TI_PTI_Product_Instance_Image | |
| TM_CLD_Calendar | |
| TM_PTM_Product_Type_Matrix | |
| TR_ALB_Album | |
| TR_BAC_Bank_Account | |
| TR_CGS_CIN_LGS | |
| TR_CMU_Commune | |
| TR_COR_Color | |
| TR_CSO_ClientInvoice_SupplierOrder | |
| TR_CTA_Comment_TAG | |
| TR_CTL_ClientTYPE_LIST | |
| TR_DCI_DeliveryForm_ClientInvoice | |
| TR_DEP_Department | |
| TR_DTP_Document_Type | |
| TR_FRE_File_Recycle | |
| TR_LAN_Language | |
| TR_LTP_Line_Type | |
| TR_PAL_Photo_Album | |
| TR_PCA_Product_Category | |
| TR_PDA_Product_Driver_Accessory | |
| TR_POS_Position | |
| TR_REG_Region | |
| TR_RIT_Right | |
| TR_RMP_Recommended_Product | |
| TR_SCR_Screen | |
| TR_SDC_Supplier_Order_Document | |
| TR_STY_Supplier_Type | |
| TR_THF_Text_Header_Footer | |
| TR_TTE_TRADE_TERMS | |
| TR_UCL_User_Calendar | |
| TR_UPD_User_Password | |
| TR_URS_User_Relationship | |
| TS_CPW_Client_Password | |
| TS_Mgr_Message_Record | |
| TS_PIG_Project_Image | |
| TS_PPD_Project_Product | |
| TS_PRJ_Project | |
| TS_PTG_Project_Tag | |
| TS_SCLN_Shopping_Cart_Line | |
| TS_SCL_Site_Client | |
| TS_SCT_Shopping_Cart | |
| TS_TAG_Tags | |
| TS_ULG_User_Log | |
| TS_WLL_Wishlist_line | |
| TS_WLS_Wishlist | |

## Backend Models Without Legacy Tables
These models map to tables that are not present in the legacy DB. They must be remapped or created via migrations before use.

| Table | Model File(s) |
| --- | --- |
| TM_CHAT_Message | chat.py |
| TM_CHAT_Room | chat.py |
| TM_CHAT_RoomMember | chat.py |
| TM_CHT_Message | chat.py |
| TM_CHT_Participant | chat.py |
| TM_CHT_ReadReceipt | chat.py |
| TM_CHT_Thread | chat.py |
| TM_CLI_Invoice_LEGACY_UNUSED | client_invoice.py |
| TM_CPP_Client_Product_Price | client_product_price.py |
| TM_DOC_DocumentAttachment | document_attachment.py |
| TM_DRV_File | drive.py |
| TM_DRV_Folder | drive.py |
| TM_INT_ShopifyLocationMap | shopify_location_map.py |
| TM_INT_ShopifyStore | shopify_store.py |
| TM_INT_X3CustomerMap | sage_x3.py |
| TM_INT_X3ExportLog | sage_x3.py |
| TM_INT_X3ProductMap | sage_x3.py |
| TM_PAT_ProductAttribute | product_attribute.py |
| TM_PAV_ProductAttributeValue | product_attribute.py |
| TM_SHP_Order | shopify.py |
| TM_SHP_Order_Line | shopify.py |
| TM_SHP_Product | shopify.py |
| TM_SHP_Sync_Log | shopify.py |
| TM_SPP_Supplier_Product_Price | supplier_product_price.py |
| TM_TSK_Task | task.py |
| TR_BRA_Brand | brand.py |
| TR_SHP_Integration | shopify.py |
| TR_SHP_OAuth_State | shopify.py |
| TR_SHP_Webhook | shopify.py |

## Disabled Placeholder Models (No __tablename__)
These placeholders exist in code but are not mapped to any table. They are excluded from the counts above.

| Table | Notes |
| --- | --- |
| TM_QUO_Quote | Placeholder in quote.py (no table mapping) |
| TM_QUO_QuoteLine | Placeholder in quote.py (no table mapping) |
| TM_STK_Stock | Placeholder in stock.py (no table mapping) |
| TM_STK_StockMovement | Placeholder in stock_movement.py (no table mapping) |
| TM_STK_StockMovementLine | Placeholder in stock_movement.py (no table mapping) |
| TM_SUP_SupplyLot | Placeholder in supply_lot.py (no table mapping) |
| TM_SUP_SupplyLotCost | Placeholder in supply_lot.py (no table mapping) |
| TM_SUP_SupplyLotLine | Placeholder in supply_lot.py (no table mapping) |

## Immediate Actions
- Create models for legacy tables listed above (or explicitly add migration scripts to create tables if they are new features).
- For models without legacy tables, either:
  - Add migration scripts under `database/migrations/`, or
  - Remap them to existing legacy tables and adjust repositories/services accordingly.
- Ensure API routers are only mounted when underlying tables exist and services are aligned to real schema.

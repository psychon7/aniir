# Database Tables List (Aligned with SQL Server 2008)

Source of truth: `backend/db_schema.json` (SQL Server extract).
App model coverage: SQLAlchemy metadata from `backend/app/models`.

## Summary
- Total tables: 105
- TR_ reference tables: 47
- TM_ master tables: 35
- TI_ intermediate tables: 8
- TS_ site tables: 13
- TH_ history/audit tables: 2
- DB tables represented in app models: 54
- DB tables missing in app models: 51

## Tables by Prefix

### TH_ Tables (2)
| Table | In App Models |
| --- | --- |
| TH_UCT_User_Comment | No |
| TH_UFL_User_Flag | No |

### TI_ Tables (8)
| Table | In App Models |
| --- | --- |
| TI_DOC_Document | No |
| TI_INVR_INV_Record | Yes |
| TI_MSG_Message | No |
| TI_PIM_Product_Image | No |
| TI_PIVR_PIN_Record | No |
| TI_PIV_PRE_INV_Inventory | Yes |
| TI_PSR_PRE_Shipping_Receiving_Line | No |
| TI_PTI_Product_Instance_Image | No |

### TM_ Tables (35)
| Table | In App Models |
| --- | --- |
| TM_CAT_Category | Yes |
| TM_CCO_Client_Contact | Yes |
| TM_CII_ClientInvoice_Line | Yes |
| TM_CIN_Client_Invoice | Yes |
| TM_CLD_Calendar | No |
| TM_CLI_CLient | Yes |
| TM_CLN_CostPlan_Lines | Yes |
| TM_COD_Client_Order | Yes |
| TM_COL_ClientOrder_Lines | Yes |
| TM_CON_CONSIGNEE | Yes |
| TM_CPL_Cost_Plan | Yes |
| TM_CPY_ClientInvoice_Payment | Yes |
| TM_DFL_DevlieryForm_Line | Yes |
| TM_DFO_Delivery_Form | Yes |
| TM_INV_Inventory | Yes |
| TM_LGL_Logistic_Lines | Yes |
| TM_LGS_Logistic | Yes |
| TM_PIL_PurchaseIntent_Lines | Yes |
| TM_PIN_Purchase_Intent | Yes |
| TM_PIT_Product_Instance | Yes |
| TM_PRD_Product | Yes |
| TM_PRJ_Project | Yes |
| TM_PTM_Product_Type_Matrix | No |
| TM_PTY_Product_Type | Yes |
| TM_SCO_Supplier_Contact | Yes |
| TM_SHE_Shelves | Yes |
| TM_SIL_SupplierInvoice_Lines | Yes |
| TM_SIN_Supplier_Invoice | Yes |
| TM_SOD_Supplier_Order | Yes |
| TM_SOL_SupplierOrder_Lines | Yes |
| TM_SRL_Shipping_Receiving_Line | Yes |
| TM_SRV_Shipping_Receiving | Yes |
| TM_SUP_Supplier | Yes |
| TM_USR_User | Yes |
| TM_WHS_WareHouse | Yes |

### TR_ Tables (47)
| Table | In App Models |
| --- | --- |
| TR_ACT_Activity | Yes |
| TR_ALB_Album | No |
| TR_BAC_Bank_Account | No |
| TR_CDL_Client_Delegate | Yes |
| TR_CGS_CIN_LGS | No |
| TR_CIV_Civility | Yes |
| TR_CMU_Commune | No |
| TR_COR_Color | No |
| TR_COU_Country | Yes |
| TR_CSO_ClientInvoice_SupplierOrder | No |
| TR_CST_CostPlan_Statut | Yes |
| TR_CTA_Comment_TAG | No |
| TR_CTL_ClientTYPE_LIST | No |
| TR_CTY_Client_Type | Yes |
| TR_CUR_Currency | Yes |
| TR_DCI_DeliveryForm_ClientInvoice | No |
| TR_DEP_Department | No |
| TR_DTP_Document_Type | No |
| TR_FRE_File_Recycle | No |
| TR_LNG_Language | Yes |
| TR_LSI_Logistic_SupplierInvoice | Yes |
| TR_LTP_Line_Type | No |
| TR_MCU_Main_Currency | Yes |
| TR_PAL_Photo_Album | No |
| TR_PCA_Product_Category | No |
| TR_PCO_Payment_Condition | Yes |
| TR_PDA_Product_Driver_Accessory | No |
| TR_PMO_Payment_Mode | Yes |
| TR_POS_Position | No |
| TR_PSH_Product_Shelves | Yes |
| TR_REG_Region | No |
| TR_RIT_Right | No |
| TR_RMP_Recommended_Product | No |
| TR_ROL_Role | Yes |
| TR_SCR_Screen | No |
| TR_SDC_Supplier_Order_Document | No |
| TR_SOC_Society | Yes |
| TR_SPR_SupplierOrder_Payment_Record | Yes |
| TR_SPR_Supplier_Product | Yes |
| TR_STT_Status | Yes |
| TR_STY_Supplier_Type | No |
| TR_THF_Text_Header_Footer | No |
| TR_TTE_TRADE_TERMS | No |
| TR_UCL_User_Calendar | No |
| TR_UPD_User_Password | No |
| TR_URS_User_Relationship | No |
| TR_VAT_Vat | Yes |

### TS_ Tables (13)
| Table | In App Models |
| --- | --- |
| TS_CPW_Client_Password | No |
| TS_Mgr_Message_Record | No |
| TS_PIG_Project_Image | No |
| TS_PPD_Project_Product | No |
| TS_PRJ_Project | No |
| TS_PTG_Project_Tag | No |
| TS_SCLN_Shopping_Cart_Line | No |
| TS_SCL_Site_Client | No |
| TS_SCT_Shopping_Cart | No |
| TS_TAG_Tags | No |
| TS_ULG_User_Log | No |
| TS_WLL_Wishlist_line | No |
| TS_WLS_Wishlist | No |

## App Tables Not Present in Legacy DB
These tables exist in the new app models/migrations but are not in the legacy DB extract.

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

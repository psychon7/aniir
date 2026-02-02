----------------------------------------------------------------------
------------------- 2018-02-26  clean database conserve products
----------------------------------------------------------------------

delete from TR_SPR_Supplier_Product
dbcc checkident(TR_SPR_Supplier_Product,reseed,0) 

delete from TI_PIM_Product_Image
dbcc checkident(TI_PIM_Product_Image,reseed,0) 

delete from TR_PAL_Photo_Album
dbcc checkident(TR_PAL_Photo_Album,reseed,0) 

delete from TM_SRL_Shipping_Receiving_Line
dbcc checkident(TM_SRL_Shipping_Receiving_Line,reseed,0) 

delete from TM_SRV_Shipping_Receiving
dbcc checkident(TM_SRV_Shipping_Receiving,reseed,0) 

delete from TI_PSR_PRE_Shipping_Receiving_Line
dbcc checkident(TI_PSR_PRE_Shipping_Receiving_Line,reseed,0) 

delete from TI_PIVR_PIN_Record
dbcc checkident(TI_PIVR_PIN_Record,reseed,0) 

delete from TI_PIV_PRE_INV_Inventory
dbcc checkident(TI_PIV_PRE_INV_Inventory,reseed,0) 

delete from TM_LGL_Logistic_Lines
dbcc checkident(TM_LGL_Logistic_Lines,reseed,0) 

delete from TM_LGS_Logistic
dbcc checkident(TM_LGS_Logistic,reseed,0) 

delete from TM_SIL_SupplierInvoice_Lines
dbcc checkident(TM_SIL_SupplierInvoice_Lines,reseed,0) 

delete from TM_SIN_Supplier_Invoice
dbcc checkident(TM_SIN_Supplier_Invoice,reseed,0) 

delete from TR_BAC_Bank_Account
dbcc checkident(TR_BAC_Bank_Account,reseed,0) 

delete from TR_CSO_ClientInvoice_SupplierOrder
dbcc checkident(TR_CSO_ClientInvoice_SupplierOrder,reseed,0) 

delete from TR_SPR_SupplierOrder_Payment_Record
dbcc checkident(TR_SPR_SupplierOrder_Payment_Record,reseed,0) 


delete from TM_SOL_SupplierOrder_Lines
dbcc checkident(TM_SOL_SupplierOrder_Lines,reseed,0) 

delete from TM_PIL_PurchaseIntent_Lines
dbcc checkident(TM_PIL_PurchaseIntent_Lines,reseed,0) 




delete from TR_SDC_Supplier_Order_Document
dbcc checkident(TR_SDC_Supplier_Order_Document,reseed,0) 

delete from TM_SOD_Supplier_Order
dbcc checkident(TM_SOD_Supplier_Order,reseed,0) 

delete from TM_PIN_Purchase_Intent
dbcc checkident(TM_PIN_Purchase_Intent,reseed,0)

delete from TM_CPY_ClientInvoice_Payment
dbcc checkident(TM_CPY_ClientInvoice_Payment,reseed,0)

delete from TR_DCI_DeliveryForm_ClientInvoice
dbcc checkident(TR_DCI_DeliveryForm_ClientInvoice,reseed,0)

delete from TM_DFL_DevlieryForm_Line
dbcc checkident(TM_DFL_DevlieryForm_Line,reseed,0)

delete from TM_DFO_Delivery_Form
dbcc checkident(TM_DFO_Delivery_Form,reseed,0)

delete from TM_CII_ClientInvoice_Line
dbcc checkident(TM_CII_ClientInvoice_Line,reseed,0)

delete from TM_CIN_Client_Invoice
dbcc checkident(TM_CIN_Client_Invoice,reseed,0)

delete from TM_SCO_Supplier_Contact
dbcc checkident(TM_SCO_Supplier_Contact,reseed,0) 

delete from TM_SUP_Supplier
dbcc checkident(TM_SUP_Supplier,reseed,0) 

delete from ti_psr_pre_shipping_receiving_line
dbcc checkident(ti_psr_pre_shipping_receiving_line,reseed,0)


delete from TM_SRL_Shipping_Receiving_Line
dbcc checkident(TM_SRL_Shipping_Receiving_Line,reseed,0)

delete from TM_SRV_Shipping_Receiving
dbcc checkident(TM_SRV_Shipping_Receiving,reseed,0)



delete from TM_COL_ClientOrder_Lines
dbcc checkident(TM_COL_ClientOrder_Lines,reseed,0)

delete from TM_COD_Client_Order
dbcc checkident(TM_COD_Client_Order,reseed,0)

delete from TM_CLN_CostPlan_Lines
dbcc checkident(TM_CLN_CostPlan_Lines,reseed,0)

delete from TM_CPL_Cost_Plan
dbcc checkident(TM_CPL_Cost_Plan,reseed,0)

delete from TM_PRJ_Project
dbcc checkident(TM_PRJ_Project,reseed,0)

delete from TS_CPW_Client_Password
dbcc checkident(TS_CPW_Client_Password,reseed,0)

delete from TS_WLL_Wishlist_line
dbcc checkident(TS_WLL_Wishlist_line,reseed,0)

delete from TS_WLS_Wishlist
dbcc checkident(TS_WLS_Wishlist,reseed,0)

delete from TS_SCLN_Shopping_Cart_Line
dbcc checkident(TS_SCLN_Shopping_Cart_Line,reseed,0)

delete from TS_SCT_Shopping_Cart
dbcc checkident(TS_SCT_Shopping_Cart,reseed,0)

delete from ts_scl_site_client
dbcc checkident(ts_scl_site_client,reseed,0)

delete from ts_scl_site_client
dbcc checkident(ts_scl_site_client,reseed,0)

delete from TM_CCO_Client_Contact
dbcc checkident(TM_CCO_Client_Contact,reseed,0)

delete from TM_CLI_CLient
dbcc checkident(TM_CLI_CLient,reseed,0)


delete from TR_UCL_User_Calendar
dbcc checkident(TR_UCL_User_Calendar,reseed,0)

delete from TM_CLD_Calendar
dbcc checkident(TM_CLD_Calendar,reseed,0)

delete from TR_URS_User_Relationship
dbcc checkident(TR_URS_User_Relationship,reseed,0)

--delete from TI_PTI_Product_Instance_Image
--dbcc checkident(TI_PTI_Product_Instance_Image,reseed,0)

--delete from TI_PIM_Product_Image
--dbcc checkident(TI_PIM_Product_Image,reseed,0)

--delete from TI_INVR_INV_Record
--dbcc checkident(TI_INVR_INV_Record,reseed,0)

--delete from TI_PIVR_PIN_Record
--dbcc checkident(TI_PIVR_PIN_Record,reseed,0)

--delete from TI_PIV_PRE_INV_Inventory
--dbcc checkident(TI_PIV_PRE_INV_Inventory,reseed,0)

--delete from TM_INV_Inventory
--dbcc checkident(TM_INV_Inventory,reseed,0)

--delete from TM_PIT_Product_Instance
--dbcc checkident(TM_PIT_Product_Instance,reseed,0)

--delete from TR_PCA_Product_Category
--dbcc checkident(TR_PCA_Product_Category,reseed,0)

--delete from TR_RMP_Recommended_Product
--dbcc checkident(TR_RMP_Recommended_Product,reseed,0)

--delete from TM_PRD_Product
--dbcc checkident(TM_PRD_Product,reseed,0)

delete from TR_FRE_File_Recycle
dbcc checkident(TR_FRE_File_Recycle,reseed,0)




----------------------------------------------------------------------
------------------- 2020-10-25 给LEADER 清空 CLIENT 侧表，用于ECOLED 和WAVE中国并表
----------------------------------------------------------------------

delete from TM_CII_ClientInvoice_Line
dbcc checkident(TM_CII_ClientInvoice_Line,reseed,0)

delete from TM_CPY_ClientInvoice_Payment
dbcc checkident(TM_CPY_ClientInvoice_Payment,reseed,0)

delete from TR_DCI_DeliveryForm_ClientInvoice
dbcc checkident(TR_DCI_DeliveryForm_ClientInvoice,reseed,0)


delete from TM_CIN_Client_Invoice
dbcc checkident(TM_CIN_Client_Invoice,reseed,0)

delete from TM_DFL_DevlieryForm_Line
dbcc checkident(TM_DFL_DevlieryForm_Line,reseed,0)

delete from TM_DFO_Delivery_Form
dbcc checkident(TM_DFO_Delivery_Form,reseed,0)


delete from TS_CPW_Client_Password
dbcc checkident(TS_CPW_Client_Password,reseed,0)

delete from ts_scl_site_client
dbcc checkident(ts_scl_site_client,reseed,0)

delete from TI_PSR_PRE_Shipping_Receiving_Line
dbcc checkident(TI_PSR_PRE_Shipping_Receiving_Line,reseed,0)

delete from TM_COL_ClientOrder_Lines
dbcc checkident(TM_COL_ClientOrder_Lines,reseed,0)


delete from TM_COD_Client_Order
dbcc checkident(TM_COD_Client_Order,reseed,0)

delete from TM_CLN_CostPlan_Lines
dbcc checkident(TM_CLN_CostPlan_Lines,reseed,0)

delete from TM_CPL_Cost_Plan
dbcc checkident(TM_CPL_Cost_Plan,reseed,0)


delete from TM_CCO_Client_Contact
dbcc checkident(TM_CCO_Client_Contact,reseed,0)

delete from TM_PRJ_Project
dbcc checkident(TM_PRJ_Project,reseed,0)

delete from TM_CLI_CLient
dbcc checkident(TM_CLI_CLient,reseed,0)

-------------------
----以上代码 20220725 重新调整运行顺序
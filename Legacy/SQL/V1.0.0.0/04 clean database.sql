----------------------------------------------------------------------
------------------- 2016-06-28  clean database for 1 st delivery
----------------------------------------------------------------------

delete from TR_SPR_Supplier_Product
dbcc checkident(TR_SPR_Supplier_Product,reseed,0) 

delete from TI_PIM_Product_Image
dbcc checkident(TI_PIM_Product_Image,reseed,0) 

delete from TR_PAL_Photo_Album
dbcc checkident(TR_PAL_Photo_Album,reseed,0) 

delete from TM_SIL_SupplierInvoice_Lines
dbcc checkident(TM_SIL_SupplierInvoice_Lines,reseed,0) 

delete from TM_SIN_Supplier_Invoice
dbcc checkident(TM_SIN_Supplier_Invoice,reseed,0) 

delete from TR_BAC_Bank_Account
dbcc checkident(TR_BAC_Bank_Account,reseed,0) 

delete from TM_SOL_SupplierOrder_Lines
dbcc checkident(TM_SOL_SupplierOrder_Lines,reseed,0) 

delete from TM_SOD_Supplier_Order
dbcc checkident(TM_SOD_Supplier_Order,reseed,0) 

delete from TM_SCO_Supplier_Contact
dbcc checkident(TM_SCO_Supplier_Contact,reseed,0) 

delete from TM_SUP_Supplier
dbcc checkident(TM_SUP_Supplier,reseed,0) 

delete from TM_PIL_PurchaseIntent_Lines
dbcc checkident(TM_PIL_PurchaseIntent_Lines,reseed,0) 

delete from TM_PIN_Purchase_Intent
dbcc checkident(TM_PIN_Purchase_Intent,reseed,0)

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

delete from TM_CCO_Client_Contact
dbcc checkident(TM_CCO_Client_Contact,reseed,0)

delete from TM_CLI_CLient
dbcc checkident(TM_CLI_CLient,reseed,0)

delete from TI_PTI_Product_Instance_Image
dbcc checkident(TI_PTI_Product_Instance_Image,reseed,0)

delete from TI_PIM_Product_Image
dbcc checkident(TI_PIM_Product_Image,reseed,0)

delete from TM_PIT_Product_Instance
dbcc checkident(TM_PIT_Product_Instance,reseed,0)

delete from TM_PRD_Product
dbcc checkident(TM_PRD_Product,reseed,0)

delete from TR_FRE_File_Recycle
dbcc checkident(TR_FRE_File_Recycle,reseed,0)
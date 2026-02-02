-- 20220427 更改所有Quantity， 变成decimal


--select * from TM_CLN_CostPlan_Lines
alter table TM_CLN_CostPlan_Lines alter column cln_quantity decimal(16,4) null

--select * from TM_COL_ClientOrder_Lines
alter table TM_COL_ClientOrder_Lines alter column col_quantity decimal(16,4) null

--select * from TM_CII_ClientInvoice_Line
alter table TM_CII_ClientInvoice_Line alter column cii_quantity decimal(16,4) null

--select * from TM_DFL_DevlieryForm_Line
alter table TM_DFL_DevlieryForm_Line alter column dfl_quantity decimal(16,4) null

--select * from TM_SOL_SupplierOrder_Lines
alter table TM_SOL_SupplierOrder_Lines alter column sol_quantity decimal(16,4) null
alter table TM_SOL_SupplierOrder_Lines alter column sol_qty_storage decimal(16,4) null


--select * from TM_SIL_SupplierInvoice_Lines
alter table TM_SIL_SupplierInvoice_Lines alter column sil_quantity decimal(16,4) null

--select * from TM_LGL_Logistic_Lines
alter table TM_LGL_Logistic_Lines alter column lgs_quantity decimal(16,4) null

--select * from TM_SRL_Shipping_Receiving_Line
alter table TM_SRL_Shipping_Receiving_Line alter column srl_quantity decimal(16,4) null
alter table TM_SRL_Shipping_Receiving_Line alter column srl_quantity_real decimal(16,4) null

--select * from TI_PSR_PRE_Shipping_Receiving_Line
alter table TI_PSR_PRE_Shipping_Receiving_Line alter column psr_quantity decimal(16,4) null

--select * from TM_PIL_PurchaseIntent_Lines
alter table TM_PIL_PurchaseIntent_Lines alter column pil_quantity decimal(16,4) null

--select * from TM_INV_Inventory
alter table TM_INV_Inventory alter column inv_quantity decimal(16,4) null

--select * from TI_INVR_INV_Record
alter table TI_INVR_INV_Record alter column invr_quantity decimal(16,4) null

--select * from TI_PIV_PRE_INV_Inventory
alter table TI_PIV_PRE_INV_Inventory alter column piv_quantity decimal(16,4) null

--select * from TI_PIVR_PIN_Record
alter table TI_PIVR_PIN_Record alter column pivr_quantity decimal(16,4) null


alter table TM_SRV_Shipping_Receiving  alter column srv_total_quantity decimal(16,4) null
alter table TM_SRV_Shipping_Receiving  alter column srv_total_real decimal(16,4) null

alter table TR_PSH_Product_Shelves alter column psh_quantity decimal(16,4) null
-------------------------- 以上内容已经于20220427在服务器上运行了


alter table TM_CLI_CLient add cli_abbreviation nvarchar(300) null


-------------------------- 以上内容已经在服务器上运行了

alter table TR_CTA_Comment_TAG add cta_show_in_pdf bit null
-------------------------- 以上内容已经于20220815在服务器上运行了


-------- 加入燃料产品的时候出的问题
alter table TM_PIT_Product_Instance alter column pit_description nvarchar(4000) null
-------------------------- 以上内容已经于20221004在服务器上运行了

---- remove foreign key of Devis
alter table tm_cpl_cost_plan
drop constraint FK_CPL_CCO_DEL
go
alter table tm_cpl_cost_plan drop column cco_id_delivery
---- set cco delivery null
alter table tm_cpl_cost_plan alter column cco_id_invoicing int null
---- delete all column no use
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_firstname
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_lastname
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_address1
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_address2
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_postcode
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_city
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_country
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_tel1
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_fax
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_cellphone
alter table tm_cpl_cost_plan drop column 	cpl_inv_cco_email
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_firstname
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_lastname
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_address1
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_address2
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_postcode
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_city
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_country
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_tel1
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_fax
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_cellphone
alter table tm_cpl_cost_plan drop column 	cpl_dlv_cco_email

--- remove foreign key of commande client
alter table TM_COD_Client_Order drop constraint FK_COD_CCO_DEL
--- remove cco_id_delivery
alter table TM_COD_Client_Order drop column cco_id_delivery
--- set cco_id_invoicing nulable
alter table TM_COD_Client_Order alter column cco_id_invoicing int null
--- delete all column no use
alter table TM_COD_Client_Order drop column 	cod_inv_cco_firstname
alter table TM_COD_Client_Order drop column 	cod_inv_cco_lastname
alter table TM_COD_Client_Order drop column 	cod_inv_cco_address1
alter table TM_COD_Client_Order drop column 	cod_inv_cco_address2
alter table TM_COD_Client_Order drop column 	cod_inv_cco_postcode
alter table TM_COD_Client_Order drop column 	cod_inv_cco_city
alter table TM_COD_Client_Order drop column 	cod_inv_cco_country
alter table TM_COD_Client_Order drop column 	cod_inv_cco_tel1
alter table TM_COD_Client_Order drop column 	cod_inv_cco_fax
alter table TM_COD_Client_Order drop column 	cod_inv_cco_cellphone
alter table TM_COD_Client_Order drop column 	cod_inv_cco_email
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_firstname
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_lastname
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_address1
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_address2
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_postcode
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_city
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_country
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_tel1
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_fax
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_cellphone
alter table TM_COD_Client_Order drop column 	cod_dlv_cco_email


--- remove foreign key of delivery 
alter table TM_DFO_Delivery_Form drop constraint FK_DFO_CCO
--- remove cco_id_delivery
alter table TM_DFO_Delivery_Form drop column cco_id_delivery
--- add bit whether address is like client address
alter table TM_DFO_Delivery_Form  add dfo_client_adr bit null


--- remove foreign key of delivery for cin
alter table TM_CIN_Client_Invoice drop constraint FK_CIN_CCO_DEL
--- remove cco_id_delivery
alter table TM_CIN_Client_Invoice drop column cco_id_delivery
--- set cco_id_invoicing nulable
alter table TM_CIN_Client_Invoice alter column cco_id_invoicing int null
--- delete all column no use
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_firstname
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_lastname
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_address1
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_address2
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_postcode
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_city
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_country
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_tel1
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_fax
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_cellphone
alter table TM_CIN_Client_Invoice drop column 	cin_dlv_cco_email


--- add col_id to TM_ClientInvoice_Line
alter table tm_cii_clientinvoice_line add col_id int null constraint FK_CII_COL references TM_COL_ClientOrder_Lines(col_id)



---//////////////// 以上已经在服务器上运行


--- 2019/08/24 update purchase line
alter table TM_PIL_PurchaseIntent_Lines drop constraint FK_PIL_PIN
alter table TM_PIL_PurchaseIntent_Lines drop constraint FK_PIL_PIT
alter table TM_PIL_PurchaseIntent_Lines drop constraint FK_PIL_PRD
alter table TM_PIL_PurchaseIntent_Lines drop constraint FK_PIL_SUP
alter table TM_SOL_SupplierOrder_Lines drop constraint FK_SOL_PIL
drop table TM_PIL_PurchaseIntent_Lines
---------- 新购买意向行
create table TM_PIL_PurchaseIntent_Lines
(
	pil_id					int identity(1,1)	primary key,
	pin_id					int not null		constraint FK_PIL_PIN	references TM_PIN_Purchase_Intent(pin_id),
	prd_id					int	null			constraint FK_PIL_PRD	references TM_PRD_Product(prd_id),
	pit_id					int null			constraint FK_PIL_PIT	references dbo.TM_PIT_Product_Instance(pit_id),
	pil_order				int	not null,
	pil_quantity			int	not null,
	pil_client				nvarchar(200) null,
	pil_power				nvarchar(200)	null,
	pil_driver				nvarchar(200)	null,
	pil_temp_color			nvarchar(200)	null,
	pil_length				decimal(16,4)	null,
	pil_width				decimal(16,4)	null,
	pil_height				decimal(16,4)	null,
	pil_eff_lum				int null,
	pil_ugr					int null,
	pil_cri					int null,
	pil_logistic			nvarchar(50)	null,
	pil_supplier			nvarchar(200)	null,
	pil_description			nvarchar(1000)	null,
	pil_prd_des				nvarchar(1000) null, -- 添加注释此项作为商品描述
	pil_deadline			datetime null,
	pil_prd_name			nvarchar(200) null,
	pil_d_creation			datetime null
)

alter table TM_SOL_SupplierOrder_Lines add constraint FK_SOL_PIL foreign key (pil_id) references TM_PIL_PurchaseIntent_Lines(pil_id)

-----------  更新 Supplier Order Lines
alter table TM_SOL_SupplierOrder_Lines alter column prd_id int null
alter table TM_SOL_SupplierOrder_Lines alter column pit_id int null
alter table TM_SOL_SupplierOrder_Lines alter column vat_id int null
alter table TM_SOL_SupplierOrder_Lines add	sol_power				nvarchar(200)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_driver				nvarchar(200)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_temp_color			nvarchar(200)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_length				decimal(16,4)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_width				decimal(16,4)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_height				decimal(16,4)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_eff_lum				int null
alter table TM_SOL_SupplierOrder_Lines add	sol_ugr					int null
alter table TM_SOL_SupplierOrder_Lines add	sol_cri					int null
alter table TM_SOL_SupplierOrder_Lines add	sol_logistic			nvarchar(50)	null
alter table TM_SOL_SupplierOrder_Lines add	sol_client				nvarchar(200) null
alter table TM_SOL_SupplierOrder_Lines add	sol_d_creation			datetime null
alter table TM_SOL_SupplierOrder_Lines add	sol_deadline			datetime null
--alter table TM_SOL_SupplierOrder_Lines add	constraint FK_SOL_PIT foreign key (pit_id) references TM_PIT_Product_Instance(pit_id)
alter table TM_SOL_SupplierOrder_Lines add	sol_prd_name				nvarchar(200) null
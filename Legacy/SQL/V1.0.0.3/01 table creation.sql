-- 2019-12-12 给sol添加以下列
-- 1. 更新日期
-- 2. 开始生产日期
-- 3. 预计交期
-- 4. 实际交期
-- 5. 支付定金金额 (取消)
-- 6. 支付定金日期 (取消)
-- 7. 支付尾款金额 (取消)
-- 8. 支付尾款日期 (取消)
-- 9. 特征码（用于发货的时候查找，并可安排同批发货），将不同sol行，编成同一个号码，方面运输
-- 10. 发货日期
-- 11. 发货人
-- 12. 物流编号
-- 13. 物流预计到港日

alter table TM_SOL_SupplierOrder_Lines add sol_d_update			datetime null
alter table TM_SOL_SupplierOrder_Lines add sol_d_production		datetime null
alter table TM_SOL_SupplierOrder_Lines add sol_d_exp_delivery	datetime null
alter table TM_SOL_SupplierOrder_Lines add sol_d_delivery		datetime null
--alter table TM_SOL_SupplierOrder_Lines add sol_deposit			decimal(16,4) null
--alter table TM_SOL_SupplierOrder_Lines add sol_d_deposit		datetime null
--alter table TM_SOL_SupplierOrder_Lines add sol_balance			decimal(16,4) null
--alter table TM_SOL_SupplierOrder_Lines add sol_d_balance		datetime null
alter table TM_SOL_SupplierOrder_Lines add sol_feature_code		nvarchar(200) null -- 特征码
alter table TM_SOL_SupplierOrder_Lines add sol_d_shipping		datetime null
alter table TM_SOL_SupplierOrder_Lines add sol_transporter		nvarchar(100) null
alter table TM_SOL_SupplierOrder_Lines add sol_logistics_number	nvarchar(100) null
alter table TM_SOL_SupplierOrder_Lines add sol_d_exp_arrival	datetime null

-- 2019-12-14 添加新项目
alter table TM_SOL_SupplierOrder_Lines add sol_need2pay			decimal(16,4) null
alter table TM_SOL_SupplierOrder_Lines add sol_paid				decimal(16,4) null


-- 支付记录表格
create table TR_SPR_SupplierOrder_Payment_Record
(
	spr_id					int		identity(1,1)	primary key,
	spr_d_creation			datetime				not null,
	spr_d_payment			datetime				not null,
	spr_amount				decimal(16,4)			not null,
	spr_comment				varchar(200)			null,
	sol_id					int						not null	constraint FK_SPR_SOL	references TM_SOL_SupplierOrder_Lines(sol_id),
	spr_d_update			datetime				null
)

-- 2019-12-18

alter table TM_SIL_SupplierInvoice_Lines alter column prd_id int null
alter table TM_SIL_SupplierInvoice_Lines alter column pit_id int null
alter table TM_SIL_SupplierInvoice_Lines alter column vat_id int null

alter table TM_PIL_PurchaseIntent_Lines add pil_d_update		datetime null
alter table TM_PIL_PurchaseIntent_Lines add usr_id_creator		int null constraint FK_PIL_USR_C references TM_USR_USER(usr_id)
alter table TM_PIL_PurchaseIntent_Lines add usr_id_com1			int null constraint FK_PIL_USR_C1 references TM_USR_USER(usr_id)
alter table TM_PIL_PurchaseIntent_Lines add usr_id_com2			int null constraint FK_PIL_USR_C2 references TM_USR_USER(usr_id)
alter table TM_PIL_PurchaseIntent_Lines add usr_id_com3			int null constraint FK_PIL_USR_C3 references TM_USR_USER(usr_id)

-- 2020-01-02 for maroc
alter table TR_SOC_Society add soc_cnss nvarchar(200) null
alter table TR_SOC_Society add soc_taxe_pro nvarchar(200) null

---------------2020-01-04以上内容在ENERGY 和CRSC 上面运行了，其他的没有运行



alter table TR_SPR_SupplierOrder_Payment_Record alter column spr_comment nvarchar(400) null
alter table TR_SPR_SupplierOrder_Payment_Record alter column sol_id int null
alter table TR_SPR_SupplierOrder_Payment_Record add  sod_id int null constraint FK_SPR_SOD references TM_SOD_Supplier_Order(sod_id)

alter table TM_SOL_SupplierOrder_Lines add sol_guid uniqueidentifier null
alter table TM_SOD_Supplier_Order add sod_guid uniqueidentifier null
alter table TM_SOD_Supplier_Order add sod_need2pay decimal(16,4) null
alter table TM_SOD_Supplier_Order add sod_paid decimal(16,4) null
alter table TM_SOD_Supplier_Order add sod_total_ht decimal(16,4) null
alter table TM_SOD_Supplier_Order add sod_total_ttc decimal(16,4) null

alter table TM_CLD_Calendar add sol_id int null
alter table TM_CLD_Calendar add sod_id int null
alter table TM_CLD_Calendar add cld_guid uniqueidentifier null
alter table TM_CLD_Calendar add sol_guid uniqueidentifier null
alter table TM_CLD_Calendar add cld_action nvarchar(50) null

alter table TM_USR_User add usr_rcv_purchase_notif bit null

-- 建立用户日历表
create table TR_UCL_User_Calendar
(
	ucd_id				int		identity(1,1)	primary key,
	usr_id				int		not null constraint FK_UCL_USR references TM_USR_USER(usr_id),
	cld_id				int		not null constraint FK_UCL_CLD references TM_CLD_Calendar(cld_id)
)

alter table TM_CLD_Calendar add cld_isdone bit null

-- 链接物流表及supplier order line 表， 只增加，不链接
alter table TM_LGL_Logistic_Lines add sol_id int null 
-- sol 入库数量
ALTER TABLE tm_sol_supplierorder_lines add sol_qty_storage int null

alter table tr_soc_society add soc_is_prd_mandatory bit null


---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20200117

-- 20200124
alter table TM_PIL_PurchaseIntent_Lines add cln_id int null 
alter table TM_PIL_PurchaseIntent_Lines add col_id int null
alter table TM_PIL_PurchaseIntent_Lines add cii_id int null
alter table TM_PIL_PurchaseIntent_Lines add pil_comment nvarchar(1000) null
alter table TM_SOL_SupplierOrder_Lines add sol_comment nvarchar(1000) null
alter table TM_PIL_PurchaseIntent_Lines add pil_feature_code		nvarchar(200) null -- 特征码
alter table TM_SOL_SupplierOrder_Lines add sol_finished bit null

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20200131


-- 20200202 
alter table TM_SOD_Supplier_Order add sub_sup_id int null constraint FK_SOD_SUB_SUP references TM_SUP_Supplier(sup_id)
alter table TR_SPR_SupplierOrder_Payment_Record add spr_file nvarchar(1000) null

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20200203


--- 20200204

alter table TM_SOL_SupplierOrder_Lines add usr_id_com1			int null constraint FK_SOL_USR_C1 references TM_USR_USER(usr_id)
alter table TM_SOL_SupplierOrder_Lines add usr_id_com2			int null constraint FK_SOL_USR_C2 references TM_USR_USER(usr_id)
alter table TM_SOL_SupplierOrder_Lines add usr_id_com3			int null constraint FK_SOL_USR_C3 references TM_USR_USER(usr_id)

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20200204


--- 2020/02/11
alter table TM_SOD_Supplier_Order add sod_need_send bit null
alter table TM_SOD_Supplier_Order add sod_finish bit null

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20200211



--- 20201002
-- 添加supplier Id
alter table TM_PIL_PurchaseIntent_Lines add sup_id int null constraint FK_PIL_SUP references TM_SUP_Supplier(sup_id)

--- 20201004
-- 添加供货商简称，用于下载supplier order命名
alter table TM_SUP_Supplier add sup_abbreviation nvarchar(100) null
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201004



--- 20201007 更改图片路径
update TR_PAL_Photo_Album
set pal_path = replace(pal_path, 'SiteFilesFolder\ECOLEDERP', 'SiteFilesFolder\ERPs\ERP_ECOLED')

update TI_PIM_Product_Image
set pim_path = replace(pim_path, 'SiteFilesFolder\ECOLEDERP', 'SiteFilesFolder\ERPs\ERP_ECOLED')
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201007

--- 20201015 添加供货商订单号
alter table TM_SOD_Supplier_Order add sod_sup_nbr nvarchar(100) null
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201015


--- 20201021 给SOD添加Commercial
alter table TM_SOD_Supplier_Order add usr_com_id int null constraint FK_SOD_USR_C references TM_USR_USER(usr_id)
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201021


--- 20201021 供货商订单文件
create table TR_SDC_Supplier_Order_Document
(
	sdc_id			int	identity(1,1)	primary key,
	sod_id			int					not null constraint FK_SDC_SOD references TM_SOD_Supplier_Order(sod_id),
	sdc_d_creation	datetime			not null,
	sdc_comment		nvarchar(200)		null,
	sdc_file		nvarchar(1000)		null,
	sdc_d_update	datetime			null
)

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201022

--- 20201023 添加日历和Logistics的关联
alter table TM_CLD_Calendar add lgs_id int null
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201023

--- 20201024 添加支付人
alter table TR_SPR_SupplierOrder_Payment_Record add spr_payer nvarchar(100) null
--- 在cin中添加sod_id，记录从sod转来的cin，但不做关联
alter table TM_CIN_Client_Invoice add sod_id int null
--- 反向也做
alter table TM_SOD_Supplier_Order add cin_id int null
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201025


--- 20201026 给sod 加 client
alter table TM_SOD_Supplier_Order add soc_client nvarchar(100) null

--- 增加新的银行信息
alter table TR_SOC_Society add soc_rib_name_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_address_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_code_iban_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_code_bic_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_bank_code_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_agence_code_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_account_number_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_key_2 nvarchar(50) null
alter table TR_SOC_Society add soc_rib_domiciliation_agency_2 nvarchar(200) null

alter table TR_SOC_Society add soc_rib_abbre nvarchar(50) null
alter table TR_SOC_Society add soc_rib_abbre_2 nvarchar(50) null

alter table TM_CIN_Client_Invoice add cin_bank int null
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201027


--- 新增sod client
alter table tm_sod_supplier_order add cli_id int null constraint FK_SOD_CLI references TM_CLI_CLIENT(cli_id)
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201104


--- 新增 consignee 收货人
create table TM_CON_CONSIGNEE
(
	con_id				int					identity(1,1)	primary key,
	con_firstname		nvarchar(200)		null,
	con_lastname		nvarchar(200)		null,
	civ_id				int					not null constraint FK_CON_CIV references TR_CIV_Civility(civ_id),
	con_code			nvarchar(50)		null,
	con_adresse_title	nvarchar(200)		null,	
	con_address1		nvarchar(200)		null,
	con_address2		nvarchar(200)		null,
	con_address3		nvarchar(200)		null,
	con_postcode		nvarchar(50)		null,
	con_city			nvarchar(200)		null,
	con_province		nvarchar(200)		null,
	con_country			nvarchar(200)		null,
	con_tel1			nvarchar(100)		null,
	con_tel2			nvarchar(100)		null,
	con_fax				nvarchar(100)		null,
	con_cellphone		nvarchar(100)		null,
	con_email			nvarchar(100)		null,
	con_recieve_newsletter	bit				not null,
	con_newsletter_email	nvarchar(100)	null,
	con_is_delivery_adr		bit				not null,
	con_is_invoicing_adr	bit				not null,	
	usr_created_by		int					not null constraint FK_CON_USR_CREATOR references TM_USR_User(usr_id),
	soc_id				int					not null constraint FK_CON_SOC references TR_SOC_SOCIETY(soc_id),
	con_d_creation			datetime		not null,
	con_d_update			datetime		not null,
	con_comment				nvarchar(1000)		null,
	cmu_id					int null constraint FK_CON_CMU references TR_CMU_Commune(cmu_id),
	con_company_name		nvarchar(200) null
)

alter table TM_LGS_Logistic add con_id int null constraint FK_LGS_CON references TM_CON_CONSIGNEE(con_id)

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20201108

-- 20210118 connect cin with sod
create table TR_CSO_ClientInvoice_SupplierOrder
(
	cso_id			int		identity(1,1)	primary key,
	cin_id			int		not null		constraint FK_CSO_CIN	references TM_CIN_CLIENT_INVOICE(cin_id),
	sod_id			int		not null		constraint FK_CSO_SOD	references TM_SOD_SUPPLIER_ORDER(sod_id)
)

-- add value to CSO

create table #tbCso
(
	cin_id int null,
	sod_id int null
)
insert into #tbCso
select cin_id , sod_id from TM_SOD_Supplier_Order
where cin_id is not null
and sod_id  in
(select sod_id from TM_SOD_Supplier_Order)
order by cin_id

insert into #tbCso
select cin_id, sod_id from TM_CIN_Client_Invoice
where sod_id is not null
and sod_id  in
(select sod_id from TM_SOD_Supplier_Order)

create table #tbCsoF
(
	cin_id int null,
	sod_id int null
)

insert into #tbCsoF
select * from #tbCso
group by cin_id,sod_id
order by cin_id

drop table #tbCso

insert into TR_CSO_ClientInvoice_SupplierOrder
select * from #tbCsoF

drop table #tbCsoF

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20210119


-------20210418 修改
alter table tm_sod_supplier_order add sod_started bit null
alter table tm_sod_supplier_order add sod_started_time datetime null
alter table tm_sod_supplier_order add sod_canceled bit null
alter table tm_sod_supplier_order add sod_canceled_time datetime null


-- 注释表，用于添加订单等的注释
create table TR_CTA_Comment_TAG
(
	cta_id			int				identity(1,1)	primary key,
	foreign_tag		int				not null, -- 此项定义是用于什么的注释，sod-1,cps-2,cod-3,cin-4
	foreign_id		int				not null,
	usr_id			int				not null constraint FK_CTA_USR references TM_USR_USER(usr_id),
	cta_comment		nvarchar(1000)	null,
	cta_tag			nvarchar(100)	null,
	cta_date		datetime		not null, -- create time
)


---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20210507

--- 20210520 客户表，添加是否显示详情，该内容将影响查找cin，sod页面显示情况
alter table tm_cli_client add cli_showdetail bit null default 1 
go
update tm_cli_client  set cli_showdetail  = 1
---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20210520

Insert into TR_LNG_Language(lng_label, lng_short_label)
values('CHINA','ZH-CN')

---------------------------------------------------------------------------------
---- 以上内容已经在服务器上运行 20210714
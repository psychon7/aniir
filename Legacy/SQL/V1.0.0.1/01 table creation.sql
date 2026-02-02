create table TR_COR_Color
(
	cor_id				int identity(1,1)	primary key,
	cor_name			nvarchar(200)		not null,
	cor_description		nvarchar(2000)		null,
	cor_red				int					not null,
	cor_green			int					not null,
	cor_blue			int					not null,
	soc_id				int					not null constraint FK_COR_SOC references TR_SOC_Society(soc_id)
)

alter table TM_PTY_Product_Type add cor_id int null constraint FK_PTY_COR references TR_COR_Color(cor_id)
------------------- 2017-07-10 --------------------
alter table TM_PTY_Product_Type add pty_standards nvarchar(2000) null

------------------- 2017-07-17 --------------------
update tr_ltp_line_type
set ltp_isactive = 0
where ltp_id in (1,3,5,6)

------------------- 2017-07-20 ---------------------
alter table TM_CIN_Client_Invoice add cin_is_full_paid bit null

alter table TM_LGS_Logistic add lgs_tracking_number nvarchar(1000) null
alter table TM_LGL_Logistic_Lines add sil_id int null constraint FK_LGL_SIL references TM_SIL_SupplierInvoice_Lines(sil_id) -- 一个批次中，只能还有一次sil
-------------- 物流与供货商发票对应的表 -------------------
create table TR_LSI_Logistic_SupplierInvoice
(
	lsi_id				int identity(1,1) primary key,
	lgs_id				int	not null constraint FK_LSI_LGS references TM_LGS_Logistic(lgs_id),
	sin_id				int	not null constraint FK_LSI_SIN references TM_Sin_Supplier_Invoice(sin_id)
)
alter table TM_LGS_Logistic add usr_id_creator int not null constraint FK_LGS_USR references TM_USR_User(usr_id)
alter table TM_LGS_Logistic add lgs_d_creation datetime not null
alter table TM_LGS_Logistic add lgs_d_update datetime not null


------------------- 2017-07-24 ---------------------------
------------------- 在 PI 表中添加所有商品是否全部入库，如果全部入库，在logistics页面中，将不再查询该PI
alter table TM_SIN_Supplier_Invoice add sin_all_product_stored bit not null default 0

------------------- 2017-07-25 ---------------------------
------------------- 添加client accounting email
alter table TM_CLI_Client add cli_accounting_email nvarchar(200) null

------------------- 2017-08-09 ---------------------------
---------- 添加角色等级
alter table TR_ROL_Role add rol_level int not null default 1

---------- 添加用户关系表
create table TR_URS_User_Relationship
(
	urs_id			int identity	primary key,
	usr_level1_id	int not null	constraint FK_URS_USR1 references TM_USR_USER(usr_id),
	usr_level2_id	int not null	constraint FK_URS_USR2 references TM_USR_USER(usr_id),
	urs_type		int	not null,	-- 1 assistant, 2 commercial, 3 sub manager
)

-------------------- 2017-08-28 ----------------------------
--------- 添加商品属性表
create table TM_CAT_Category
(
	cat_id				int identity(1,1)	primary key,
	cat_name			nvarchar(200)		not null,
	cat_sub_name_1		nvarchar(200)		null,
	cat_sub_name_2		nvarchar(200)		null,
	cat_order			int					not null,
	cat_is_actived		bit					not null,
	cat_image_path		nvarchar(2000)		null,
	cat_display_in_menu	bit					not null,
	cat_display_in_exhibition	bit			not null,
	cat_parent_cat_id	int					null constraint FK_CAT_CAT references TM_CAT_Category(cat_id),
	soc_id				int					not null constraint FK_CAT_SOC references TR_SOC_Society(soc_id),
	cat_description		nvarchar(2000)		null
)

--------- 商品属性中间表
create table TR_PCA_Product_Category
(
	pca_id				int	identity(1,1)	primary key,
	prd_id				int					not null constraint FK_PCA_PRD references TM_PRD_Product(prd_id),
	cat_id				int					not null constraint	FK_PCA_CAT references TM_CAT_Category(cat_id)
)


--------- 删除旧的商品属性表
IF OBJECT_ID('dbo.TI_PIC_Product_In_Catelogue', 'U') IS NOT NULL 
DROP TABLE dbo.TI_PIC_Product_In_Catelogue; 
IF OBJECT_ID('dbo.TM_PCT_Product_Catelogue', 'U') IS NOT NULL 
DROP TABLE dbo.TM_PCT_Product_Catelogue; 

-----////////////////////////////// 以上内容已经在 2017-08-30 执行


-------------- 2017-08-31 
alter table TM_PIL_PurchaseIntent_Lines add sup_id int null constraint FK_PIL_SUP references TM_SUP_Supplier(sup_id)
alter table TM_PIL_PurchaseIntent_Lines add pil_sup_ref nvarchar(100) null 

-------------- 2017-09-01
alter table TM_PIL_PurchaseIntent_Lines add pil_prd_des nvarchar(1000) null -- 添加注释此项作为商品描述
alter table TM_SOL_SupplierOrder_Lines add sol_prd_des nvarchar(1000) null
alter table TM_SIL_SupplierInvoice_Lines add sil_prd_des nvarchar(1000) null

alter table TM_CLN_CostPlan_Lines add cln_prd_des nvarchar(1000) null
alter table TM_COL_ClientOrder_Lines add col_prd_des nvarchar(1000) null
alter table TM_CII_ClientInvoice_Line add cii_prd_des nvarchar(1000) null

----///////////////////////////// 以上内容已经在 2017-09-04 在服务器上

-------------- 2017-09-05
alter table TM_LGL_Logistic_Lines add lgl_prd_des nvarchar(1000) null
-------------- 2017-09-11
alter table TR_PCA_Product_Category add pca_description nvarchar(1000) null


----///////////////////////////// 以上内容已经在 2017-09-14 在服务器上


--------------------------------- 2017-09-20
alter table TM_PRD_Product drop column prd_inside_diameter

alter table TM_PRD_Product add prd_outside_length decimal(16,4) null -- 墙体外的长
alter table TM_PRD_Product add prd_outside_width decimal(16,4) null	 -- 墙体外的宽
alter table TM_PRD_Product add prd_outside_height decimal(16,4) null -- 墙体外的高


alter table TM_PRD_Product add prd_hole_lenght decimal(16,4) null -- 墙体开口的长
alter table TM_PRD_Product add prd_hole_width decimal(16,4) null -- 墙体开口的宽

---------------------------------- 2017-09-21 
------ 删除仓库商品表，重建新表
DROP TABLE TR_PIW_Product_In_WareHouse


alter table TM_LGS_Logistic add lgs_is_received bit not null default 0 -- 是否收货
alter table TM_LGS_Logistic add lgs_is_stockin bit not null default 0 -- 是否入库
alter table TM_LGS_Logistic add lgs_d_stockin datetime null -- 入库时间

alter table tm_she_shelves add she_length decimal(16,4) null -- mm
alter table tm_she_shelves add she_width decimal(16,4) null  -- mm
alter table tm_she_shelves add she_height decimal(16,4) null  -- mm
alter table tm_she_shelves add she_availabel_volume decimal(16,4) null -- m² * m


------ 商品出库入库表
create table TM_SRV_Shipping_Receiving
(
	srv_id					int identity(1,1)	primary key,
	srv_is_rev				bit					not null,	-- 是否是入库，0为出库
	srv_time				datetime			not null,	-- 出入库时间
	srv_code				nvarchar(100)		not null,
	srv_description			nvarchar(1000)		null, -- 出入库备注
	usr_creator_id			int					not null constraint FK_SRV_USR references TM_USR_User(usr_id),
	srv_total_quantity		int					not null,	-- 应收，应出总数
	srv_total_real			int					not null,	-- 实收，实出总数
	srv_is_lend				bit					not null,	-- 物品是否外借，并不是出售，外借出去后，显示已外借
	srv_d_lend_return_pre	datetime			null,		-- 预计归还时间
	srv_is_return_client	bit					null,		-- 如果是外借，客户是否归还，如果是已出库（已销售），此处为是否退货
	srv_d_return_client		datetime			null,		-- 如果是外借，客户归还时间，如果是已出库（已销售），此处为退货时间
	srv_is_destroy			bit					null,		-- 是否销毁
	srv_d_destroy			datetime			null,		-- 销毁时间
	srv_is_return_supplier	bit					null,		-- 是否给供应商退货
	srv_d_return_supplier	datetime			null,		-- 给供应商退货时间
	srv_is_damaged			bit					null,		-- 是否损坏
	srv_d_damaged			datetime			null,		-- 损坏时间
	srv_client				nvarchar(200)		null,		-- 在没有lgl且没有dfl的情况下，需要知道客户
)

------ 商品出入库表列
create table TM_SRL_Shipping_Receiving_Line
(
	srl_id					int identity(1,1)	primary key,
	srv_id					int	not null		constraint FK_SRL_SRV references TM_SRV_Shipping_Receiving(srv_id),
	lgl_id					int	null			constraint FK_SRL_LGL references TM_LGL_Logistic_Lines(lgl_id), -- 入库列，可以在没有lgl或者dfl 的情况下出入库
	dfl_id					int null			constraint FK_SRL_DFL references TM_DFL_DevlieryForm_Line(dfl_id), -- 出库列
	srl_quantity			int	not null,
	srl_unit_price			decimal(16,4) null,
	srl_total_price			decimal(16,4) null,
	prd_id					int	null			constraint FK_SRL_PRD references TM_PRD_Product(prd_id),
	pit_id					int null			constraint FK_SRL_PIT references TM_PIT_Product_Instance(pit_id),
	srl_prd_ref				nvarchar(200)		null,
	srl_prd_name			nvarchar(200)		null,
	srl_prd_des				nvarchar(1000)		null,
	srl_description			nvarchar(1000)		null,
	srl_quantity_real		int					null,
	srl_total_price_real	decimal(16,4)		null,
)

------- 商品库存表
create table TM_INV_Inventory 
(
	inv_id					int identity(1,1)	primary key,
	prd_id					int	null			constraint FK_INV_PRD references TM_PRD_Product(prd_id),
	pit_id					int null			constraint FK_INV_PIT references TM_PIT_Product_Instance(pit_id),
	prd_name				nvarchar(200)		null, -- 如果有prd id或者pit id，此项为商品名，否则按照此项归类商品
	prd_ref					nvarchar(200)		null,
	prd_description			nvarchar(1000)		null,
	inv_quantity			int					not null,
	inv_d_update			datetime			not null,
	inv_description			nvarchar(1000)		null, -- 库存描述
)

--------- 需要写商品对应的货架表
create table TR_PSH_Product_Shelves
(
	psh_id					int	identity(1,1)	primary key,
	inv_id					int	not null		constraint FK_PSH_INV references TM_INV_Inventory(inv_id),
	whs_id					int not null		constraint FK_PSH_WHS references TM_WHS_WareHouse(whs_id),
	she_id					int	not null		constraint FK_PSH_SHE references TM_SHE_Shelves(she_id),
	psh_quantity			int not null
)

------- 商品预出库入库表，对应的是lgs表和cod表
create table TI_PIV_PRE_INV_Inventory
(
	piv_id					int identity(1,1)	primary key,
	inv_id					int					not null constraint FK_PIV_INV references TM_INV_Inventory(inv_id),
	piv_quantity			int					not null,
	piv_d_update			datetime			not null
)

create table TI_PSR_PRE_Shipping_Receiving_Line
(
	psr_id					int identity(1,1)	primary key,
	col_id					int	null			constraint FK_PSR_COL	references TM_COL_ClientOrder_Lines(col_id), -- 建立col的时候，就写入该表
	lgl_id					int	null			constraint FK_PSR_LGL	references TM_LGL_Logistic_Lines(lgl_id), -- 当lgs 为已发送时，将写入该表
	psr_time				datetime			not null,
	psr_quantity			int					not null,
	psr_is_done				bit					not null, 
	-- 操作是否完成，如果完成，将不被计算, 一旦dfo的状态为已发送，或者建立了出货单，此项为done，同时，当lgs的状态为已入库，此项为done
	psr_time_done			datetime			null, -- 操作完成时间
)




----///////////////////////////// 以上内容已经在 2017-09-25 在服务器上





-------------------------- 为网站建的客户表 2017-09-26

create table TS_SCL_Site_Client
(
	scl_id				int identity(1,1)	primary key,
	scl_login			nvarchar(200)		not null,
	scl_company_name	nvarchar(250)		not null,
	scl_firstname		nvarchar(200)		null,
	scl_lastname		nvarchar(200)		null,
	civ_id				int					not null constraint FK_SCL_CIV references TR_CIV_Civility(civ_id),
	scl_siren			nvarchar(50)		null,
	scl_siret			nvarchar(50)		null,
	scl_vat_intra		nvarchar(50)		null,
	scl_is_active		bit					not null,  -- 如果active，这个scl 将会变成client, 但是登录使用这个表
	scl_d_creation		datetime			not null,
	scl_d_active		datetime			null,
	scl_address1		nvarchar(200)		null,
	scl_address2		nvarchar(200)		null,
	scl_postcode		nvarchar(200)		null,
	scl_city			nvarchar(200)		null,
	scl_country			nvarchar(200)		null,
	scl_tel1			nvarchar(100)		null,
	scl_tel2			nvarchar(100)		null,
	scl_fax				nvarchar(100)		null,
	scl_cellphone		nvarchar(100)		null,
	scl_email			nvarchar(100)		null,
	cli_id				int					null constraint FK_SCL_CLI references TM_CLI_Client(cli_id),
	cco_id				int					null constraint FK_SCL_CCO references TM_CCO_Client_Contact(cco_id),
	soc_id				int					not null constraint FK_SCL_SOC references TR_SOC_Society(soc_id)
)


create table TS_CPW_Client_Password
(
	cpw_id				int identity(1,1)	primary key,
	cpw_login			nvarchar(2000)		not null,
	cpw_pwd				nvarchar(2000)		not null,
	scl_id				int					not null constraint FK_CPW_SCL references TS_SCL_Site_Client(scl_id),	
	cpw_d_creation		datetime			not null,	-- 以此项来判断最新的密码
	cpw_is_actived		bit					not null,	-- 密码是否还可用	
)




------------ 2017-09-28 temp reference
alter table tm_prd_product add prd_tmp_ref nvarchar(100) null
alter table tm_pit_product_instance add pit_tmp_ref nvarchar(100) null
alter table tm_prd_product add prd_sup_description nvarchar(1000) null

------------ 2017-09-29 给supplier product 加系数
alter table TR_SPR_Supplier_Product add spr_coef_100_500 decimal null
alter table TR_SPR_Supplier_Product add spr_coef_500_plus decimal null

---- 2017-09-29  清理数据库
   --delete from TR_SPR_Supplier_Product 
   --dbcc checkident(TR_SPR_Supplier_Product,reseed,0) 
   
   
   --delete from TM_SOD_Supplier_Order
   --dbcc checkident(TM_SOD_Supplier_Order,reseed,0) 
   
   --delete from TM_PIL_PurchaseIntent_Lines
   --dbcc checkident(TM_PIL_PurchaseIntent_Lines,reseed,0) 
   
   
   --delete from TM_PIN_Purchase_Intent
   --dbcc checkident(TM_PIN_Purchase_Intent,reseed,0) 
   
   --delete from TM_PIT_Product_Instance
   --dbcc checkident(TM_PIT_Product_Instance,reseed,0) 
   
   
   --delete from TM_PRD_Product
   --dbcc checkident(TM_PRD_Product,reseed,0) 
   
--------------------  以上内容已在2017-10-05 在服务器上运行

------ 2017-10-06 添加 product sub name
alter table tm_prd_product add prd_sub_name nvarchar(200) null 


------- 2017-10-07 修改用户表
alter table tm_usr_user add usr_comment nvarchar(1000) null

create table TR_UPD_User_Password
(
	upd_id			int identity(1,1)	primary key,
	usr_id			int					not null constraint FK_UPD_USR references TM_USR_USER(usr_id),
	upd_pwd			nvarchar(2000)		not null,
	upd_d_creation	datetime			not null,
	upd_actived		bit					not null,
	upd_d_updated	datetime			null	
)


update TR_ROL_Role set rol_level = 99 where rol_name = 'Admin'
update TR_ROL_Role set rol_level = 89 where rol_name = 'Manager'
update TR_ROL_Role set rol_level = 79 where rol_name = 'Assistant'
update TR_ROL_Role set rol_level = 69 where rol_name = 'Comptable'
update TR_ROL_Role set rol_level = 59 where rol_name = 'Commercial'

-------- 以上内容已在2017-10-09 在服务器上运行



--------- 2017-10-10 

alter table TM_CPL_Cost_Plan add usr_commercial1 int null constraint FK_CPL_USR_COM1 references TM_USR_USER(usr_id)
alter table TM_CPL_Cost_Plan add usr_commercial2 int null constraint FK_CPL_USR_COM2 references TM_USR_USER(usr_id)
alter table TM_CPL_Cost_Plan add usr_commercial3 int null constraint FK_CPL_USR_COM3 references TM_USR_USER(usr_id)

--------- 2017-10-12
alter table TM_SRV_Shipping_Receiving add whs_id int not null constraint FK_SRV_WHS references TM_WHS_WareHouse(whs_id) -- 商品入库表对应的库

--------- 2017-10-19
-- 删除入库表对应的库
alter table TM_SRV_Shipping_Receiving drop constraint FK_SRV_WHS
alter table TM_SRV_Shipping_Receiving drop column whs_id

--create table TR_SWH_Shipping_Receiving_WareHouse
--(
--	swh_id			int identity(1,1)	primary key,
--	srv_id			int not null constraint FK_SWH_SRV references TM_SRV_Shipping_Receiving(srv_id),
--	whs_id			int not null constraint FK_SWH_WHS references TM_WHS_WareHouse(whs_id)
--)

alter table TM_SRL_Shipping_Receiving_Line add whs_id int not null constraint FK_SRL_WHS references TM_WHS_WareHouse(whs_id)
alter table TM_SRL_Shipping_Receiving_Line add she_id int not null constraint FK_SRL_SHE references TM_SHE_Shelves(she_id)

----- 上面两行，需要重新在各个dev机器上面运行，除prod 外 2017-10-20



create table TI_PIVR_PIN_Record
(
	pivr_id			int identity(1,1)	primary key,
	piv_id			int	not null constraint FK_PIVR_PIV	references TI_PIV_PRE_INV_Inventory(piv_id),
	pivr_d_record	datetime	not null,
	pivr_quantity	int			not null
)

create table TI_INVR_INV_Record
(
	invr_id			int identity(1,1) primary key,
	inv_id			int not null constraint FK_INVR_INV references TM_INV_Inventory(inv_id),
	invr_d_record	datetime	not null,
	invr_quantity	int			not null
)


alter table TM_PIT_Product_Instance add pit_inventory_threshold int not null default 0


------------------  2017-10-24 以上内容已在服务器上运行
------------ 2017-10-26

create table TI_MSG_Message
(
	msg_id					int identity(1,1)	primary key,
	msg_d_creation			datetime			not null,
	msg_fk_name				nvarchar(100)		null,
	msg_fk_id				int					null,
	msg_content				xml					null,
	usr_id					int					not null constraint FK_MSG_USR references TM_USR_User(usr_id),
	msg_is_td				bit					not null,
	msg_is_memo				bit					not null
)

------------ 2017-10-27
Create table TM_CLD_Calendar
(
	cld_id						int					identity(1,1)		primary key,
	cld_subject					nvarchar(1000)		null,
	cld_location				nvarchar(1000)		null,
	cld_description				nvarchar(4000)		null,
	cld_d_start					datetime			null,
	cld_d_end					datetime			null,
	cld_is_all_day_event		bit					not null,
	cld_color					nvarchar(200)		null,
	cld_recurring_rule			nvarchar(100)		null,
	usr_id						int					not null constraint FK_CLD_USR references TM_USR_User(usr_id),
	cld_d_create				datetime			not null,
	cld_d_update				datetime			null,
	cld_guest					nvarchar(4000)		null
)

insert into TM_CLD_Calendar
values ('test sub','test',null,null,null,0,null,null,1,GETDATE(),null,null);

------------------  2017-10-28 以上内容已在服务器上运行

---------------- 2017-11-02
create table TH_UCT_User_Comment
(
	uct_id				int	identity(1,1)	primary key,
	uct_d_creation		datetime			not null,
	uct_d_update		datetime			null,
	uct_comment			nvarchar(2000)		null,
	uct_fk_name			nvarchar(100)		null,
	uct_fk_id			int					null,
	usr_id				int					not null constraint FK_UCT_USR references TM_USR_User(usr_id)	
)

create table TH_UFL_User_Flag
(
	ufl_id				int	identity(1,1)	primary key,
	ufl_d_creation		datetime			not null,
	ufl_d_update		datetime			null,
	ufl_comment			nvarchar(2000)		null,	-- 颜色
	ufl_fk_name			nvarchar(100)		null,
	ufl_fk_id			int					null,
	usr_id				int					not null constraint FK_UFL_USR references TM_USR_User(usr_id)	
)
------------------  2017-11-03 以上内容已在服务器上运行

---- 2017-11-10 
alter table TM_CIN_Client_Invoice add cin_invoiced bit not null default 0 -- 发票已出票，一旦出票，所有信息不可修改
---- 2017-11-21
alter table TM_SRV_Shipping_Receiving add srv_valid bit not null default 0


----- 以下内容仅用于清理本地数据，不要在！！！！！服务器上面运行
--delete from TR_SPR_Supplier_Product
--where prd_id not in (196,203)

--delete from TM_PIT_Product_Instance
--where pit_id not in (754,922)

--delete from TM_PRD_Product
--where prd_id not in (196,203)
----- 以上内容仅用于清理本地数据，不要在！！！！！服务器上面运行


------------------  2017-11-23 以上内容已在服务器上运行

----- 2017-12-05 推荐商品表
create table TR_RMP_Recommended_Product
(
	rmp_id			int identity(1,1) primary key,
	cat_id			int not null constraint FK_RMP_CAT references TM_CAT_Category(cat_id),
	prd_id			int not null constraint FK_RMP_PRD references TM_PRD_Product(prd_id),
	rmp_order		int not null,
	rmp_actived		bit not null,
	soc_id			int	not null constraint FK_RMP_SOC references TR_SOC_Society(soc_id)
)

----- 2017-12-08 推荐项目
create table TS_PRJ_Project
(
	prj_id			int identity(1,1)	primary key,
	prj_name		nvarchar(500)		not null,
	prj_date		datetime			null,
	prj_d_create	datetime			not null,
	prj_description	nvarchar(2000)		null,
	prj_location	nvarchar(1000)		null,
	prj_client		nvarchar(1000)		null,
	prj_designer	nvarchar(1000)		null,
	prj_actived		bit					not null
)

create table TS_PIG_Project_Image
(
	pig_id			int identity(1,1)	primary key,
	prj_id			int	not null		constraint FK_PIG_PRJ	references TS_PRJ_Project(prj_id),
	pig_order		int	not null,
	pig_path		nvarchar(2000)		not null
)

create table TS_PPD_Project_Product
(
	ppd_id			int identity(1,1)	primary key,
	prd_id			int	not null, -- 弱连接，不需要添加外键
	prj_id			int not null		constraint FK_PPD_PRJ	references TS_PRJ_Project(prj_id)		
)


------------------  2017-12-07 以上内容已在服务器上运行

alter table TS_PRJ_Project add prj_recommended bit not null default 1

create table TS_TAG_Tags
(
	tag_id			int identity(1,1)	primary key,
	tag_tag			nvarchar(100)		not null
)

create table TS_PTG_Project_Tag
(
	ptg_id			int identity(1,1)	primary key,
	prj_id			int not null		constraint FK_PTG_PRJ references TS_PRJ_Project(prj_id),
	tag_id			int not null		constraint FK_PTG_TAG references TS_TAG_Tags(tag_id)
)

------------------  2017-12-26 以上内容已在服务器上运行


------------------ 2018-01-10 -----------------------

EXEC sp_rename 'TR_RIT_Right.[rit_modifiy]', 'rit_modify', 'COLUMN'
alter table TR_RIT_Right add rit_super_right bit not null
alter table TR_SCR_Screen add scr_parent_name nvarchar(200) null

------------- 2018-01-15
alter table TM_PIT_Product_Instance  alter column pit_price decimal(16,4) null
alter table tr_spr_supplier_product alter column spr_coef_100_500 decimal(16,4) null
alter table tr_spr_supplier_product alter column spr_coef_500_plus decimal(16,4) null
 

------------------  2018-01-15 以上内容已在服务器上运行

------------------ 2018-01-18

alter table tm_cod_client_order add usr_com_1 int null constraint FK_COD_COM1 references TM_USR_User(usr_id)
alter table tm_cod_client_order add usr_com_2 int null constraint FK_COD_COM2 references TM_USR_User(usr_id)
alter table tm_cod_client_order add usr_com_3 int null constraint FK_COD_COM3 references TM_USR_User(usr_id)

alter table tm_cin_client_invoice add usr_com_1 int null constraint FK_CIN_COM1 references TM_USR_User(usr_id)
alter table tm_cin_client_invoice add usr_com_2 int null constraint FK_CIN_COM2 references TM_USR_User(usr_id)
alter table tm_cin_client_invoice add usr_com_3 int null constraint FK_CIN_COM3 references TM_USR_User(usr_id)
------------------  2018-01-18 以上内容已在服务器上运行


------------------- 2018-03-27 可以直接创建 Avoir
alter table TM_CIN_Client_Invoice alter column prj_id int null
------------------- 2018-03-27 以上内容已在服务器上运行

------------------- 2018-04-05 多个delivery form 对应一个 client invoice
create table TR_DCI_DeliveryForm_ClientInvoice
(
	dci_id			int	identity(1,1) primary key,
	dfo_id			int	not null constraint FK_DCI_DFO references TM_DFO_Delivery_Form(dfo_id),
	cin_id			int not null constraint FK_DCI_CIN references TM_CIN_Client_Invoice(cin_id)
)
------------------- 2018-04-06 以上内容已在服务器上运行

------------------- 2018-05-16 建立product driver accessory表，用于存储商品和
create table TR_PDA_Product_Driver_Accessory
(
	pda_id			int identity(1,1)	primary key,
	prd_id_main		int not null constraint FK_PDA_PRD_MAIN references TM_PRD_Product(prd_id),
	prd_id_ref		int not null constraint FK_PDA_PRD_REF references TM_PRD_Product(prd_id),
	pit_id_ref		int not null constraint FK_PDA_PIT_REF references TM_PIT_Product_Instance(pit_id),
	pda_price		decimal(16,4) not null,
	pda_type		int	not null, ---------- 1: driver; 2: accessory
)

------------------- 2018-07-19 显示更新日期
alter table TR_SOC_Society add soc_dp_upd bit not null default 1	----- 是否显示更新日期

--***************** 2018-07-23 以上内容已在服务器上运行
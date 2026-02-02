
create table TS_ULG_User_Log
(
ulg_id				int		identity(1,1)		primary key,
ulg_time			datetime					not null,
ulg_ip				nvarchar(100)				null,
ulg_longtitude		decimal(19,15)				null,
ulg_latitude		decimal(19,15)				null,
ulg_userAgent		nvarchar(500)				null,
ulg_appName			nvarchar(500)				null,
ulg_appVersion		nvarchar(500)				null,
ulg_cookieEnabled	bit							null,
ulg_mime			nvarchar(500)				null,
ulg_platform		nvarchar(500)				null,
ulg_user_lng		nvarchar(500)				null,
ulg_system_lng		nvarchar(500)				null,
ulg_nav_lng			nvarchar(500)				null,
ulg_javaEnabled		bit							null,
ulg_scr_height		int							null,
ulg_scr_width		int							null,
ulg_scr_colorDepth	int							null,
ulg_url				nvarchar(1000)				null,
)

alter table TS_ULG_User_Log add ulg_ip_status nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_country nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_ulg_ip_countryCode nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_region nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_regionName nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_city nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_zip nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_lat decimal(19,15) null
alter table TS_ULG_User_Log add ulg_ip_lon decimal(19,15) null
alter table TS_ULG_User_Log add ulg_ip_timezone nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_isp nvarchar(1000) null
alter table TS_ULG_User_Log add ulg_ip_org nvarchar(1000) null
alter table TS_ULG_User_Log add ulg_ip_as nvarchar(500) null
alter table TS_ULG_User_Log add ulg_ip_query nvarchar(500) null


alter table TS_ULG_User_Log add ulg_ip_2_address nvarchar(4000) null


create table TS_Mgr_Message_Record
(
	mgr_id			int identity(1,1)	primary key,
	mgr_ip			nvarchar(100)		null,
	mgr_name		nvarchar(100)		null,
	mgr_email		nvarchar(500)		null,
	mgr_tel			nvarchar(100)		null,
	mgr_type		int					null,
	mgr_subject		nvarchar(500)		null,
	mgr_message		nvarchar(4000)		null,
	mgr_d_creation	datetime			not null
)
alter table TS_Mgr_Message_Record add mgr_code nvarchar(50) null

alter table TS_Mgr_Message_Record add mgr_last_name nvarchar(100) null
alter table TS_Mgr_Message_Record add mgr_address nvarchar(1000) null
alter table TS_Mgr_Message_Record add mgr_postcode nvarchar(100) null
alter table TS_Mgr_Message_Record add mgr_city nvarchar(100) null
alter table TS_Mgr_Message_Record add mgr_how2Know nvarchar(500) null

----///////////////////////////// 以上内容已经在 2017-09-25 在服务器上

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


------ 2017-10-12 货物仓库表
insert into TM_WHS_WareHouse
values 
('Entrepôt France 001','WHFR0000077181001','29-31 Rue de Lagny','','77181','Le Pin','France', 3500);
go

insert into TM_SHE_Shelves
values
(1,'SH00001',0,1,1,2.5,2,1.7,3),
(1,'SH00002',0,1,2,2.5,2,1.7,3),
(1,'SH00003',0,1,3,2.5,2,1.7,3),
(1,'SH00004',0,2,1,2.5,2,2.5,12.5),
(1,'SH00005',0,2,2,2.5,2,2.5,12.5),
(1,'SH00006',0,2,3,2.5,2,2.5,12.5),
(1,'SH00007',0,3,1,2.5,2,2.8,14),
(1,'SH00008',0,3,2,2.5,2,2.8,14),
(1,'SH00009',0,3,3,2.5,2,2.8,14),
(1,'SH00010',0,4,1,2.5,2,1.7,3);
GO



------------------  2017-10-24 以上内容已在服务器上运行

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 1)
    update TM_SHE_Shelves set she_code = 'A01', she_floor = 0, she_line = 0, she_row = 0, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 1
ELSE
insert into TM_SHE_Shelves values (1,'A01',0,0,0,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 2)
    update TM_SHE_Shelves set she_code = 'A02', she_floor = 1, she_line = 0, she_row = 0, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 2
ELSE
insert into TM_SHE_Shelves values (1,'A02',1,0,0,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 3)
    update TM_SHE_Shelves set she_code = 'A03', she_floor = 2, she_line = 0, she_row = 0, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 3
ELSE
insert into TM_SHE_Shelves values (1,'A03',2,0,0,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 4)
    update TM_SHE_Shelves set she_code = 'A04', she_floor = 3, she_line = 0, she_row = 0, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 4
ELSE
insert into TM_SHE_Shelves values (1,'A04',3,0,0,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 5)
    update TM_SHE_Shelves set she_code = 'A05', she_floor = 0, she_line = 0, she_row = 1, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 5
ELSE
insert into TM_SHE_Shelves values (1,'A05',0,0,1,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 6)
    update TM_SHE_Shelves set she_code = 'A06', she_floor = 1, she_line = 0, she_row = 1, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 6
ELSE
insert into TM_SHE_Shelves values (1,'A06',1,0,1,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 7)
    update TM_SHE_Shelves set she_code = 'A07', she_floor = 2, she_line = 0, she_row = 1, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 7
ELSE
insert into TM_SHE_Shelves values (1,'A07',2,0,1,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 8)
    update TM_SHE_Shelves set she_code = 'A08', she_floor = 3, she_line = 0, she_row = 1, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 8
ELSE
insert into TM_SHE_Shelves values (1,'A08',3,0,1,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 9)
    update TM_SHE_Shelves set she_code = 'A09', she_floor = 0, she_line = 0, she_row = 2, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 9
ELSE
insert into TM_SHE_Shelves values (1,'A09',0,0,2,1,1,1,1);

IF EXISTS (SELECT NULL FROM TM_SHE_Shelves WHERE she_id = 10)
    update TM_SHE_Shelves set she_code = 'A10', she_floor = 1, she_line = 0, she_row = 2, she_length = 1, she_width = 1, she_height = 1, she_availabel_volume = 1 where she_id = 10
ELSE
insert into TM_SHE_Shelves values (1,'A10',1,0,2,1,1,1,1);

insert into TM_SHE_Shelves
values
--(1,'A01',0,0,0,1,1,1,1),
--(1,'A02',1,0,0,1,1,1,1),
--(1,'A03',2,0,0,1,1,1,1),
--(1,'A04',3,0,0,1,1,1,1),
--(1,'A05',0,0,1,1,1,1,1),
--(1,'A06',1,0,1,1,1,1,1),
--(1,'A07',2,0,1,1,1,1,1),
--(1,'A08',3,0,1,1,1,1,1),
--(1,'A09',0,0,2,1,1,1,1),
--(1,'A10',1,0,2,1,1,1,1),
(1,'A11',2,0,2,1,1,1,1),
(1,'A12',3,0,2,1,1,1,1),
(1,'A13',0,0,3,1,1,1,1),
(1,'A14',1,0,3,1,1,1,1),
(1,'A15',2,0,3,1,1,1,1),
(1,'A16',3,0,3,1,1,1,1),
(1,'A17',0,0,4,1,1,1,1),
(1,'A18',1,0,4,1,1,1,1),
(1,'A19',2,0,4,1,1,1,1),
(1,'A20',3,0,4,1,1,1,1),
(1,'A21',0,0,5,1,1,1,1),
(1,'A22',1,0,5,1,1,1,1),
(1,'A23',2,0,5,1,1,1,1),
(1,'A24',3,0,5,1,1,1,1),
(1,'A25',0,0,6,1,1,1,1),
(1,'A26',1,0,6,1,1,1,1),
(1,'A27',2,0,6,1,1,1,1),
(1,'A28',3,0,6,1,1,1,1),
(1,'B01',0,1,0,1,1,1,1),
(1,'B02',1,1,0,1,1,1,1),
(1,'B03',2,1,0,1,1,1,1),
(1,'B04',3,1,0,1,1,1,1),
(1,'B05',0,1,1,1,1,1,1),
(1,'B06',1,1,1,1,1,1,1),
(1,'B07',2,1,1,1,1,1,1),
(1,'B08',3,1,1,1,1,1,1),
(1,'B09',0,1,2,1,1,1,1),
(1,'B10',1,1,2,1,1,1,1),
(1,'B11',2,1,2,1,1,1,1),
(1,'B12',3,1,2,1,1,1,1),
(1,'B13',0,1,3,1,1,1,1),
(1,'B14',1,1,3,1,1,1,1),
(1,'B15',2,1,3,1,1,1,1),
(1,'B16',3,1,3,1,1,1,1),
(1,'B17',0,1,4,1,1,1,1),
(1,'B18',1,1,4,1,1,1,1),
(1,'B19',2,1,4,1,1,1,1),
(1,'B20',3,1,4,1,1,1,1),
(1,'B21',0,1,5,1,1,1,1),
(1,'B22',1,1,5,1,1,1,1),
(1,'B23',2,1,5,1,1,1,1),
(1,'B24',3,1,5,1,1,1,1),
(1,'B25',0,1,6,1,1,1,1),
(1,'B26',1,1,6,1,1,1,1),
(1,'B27',2,1,6,1,1,1,1),
(1,'B28',3,1,6,1,1,1,1),
(1,'C01',0,2,0,1,1,1,1),
(1,'C02',1,2,0,1,1,1,1),
(1,'C03',2,2,0,1,1,1,1),
(1,'C04',3,2,0,1,1,1,1),
(1,'C05',0,2,1,1,1,1,1),
(1,'C06',1,2,1,1,1,1,1),
(1,'C07',2,2,1,1,1,1,1),
(1,'C08',3,2,1,1,1,1,1),
(1,'C09',0,2,2,1,1,1,1),
(1,'C10',1,2,2,1,1,1,1),
(1,'C11',2,2,2,1,1,1,1),
(1,'C12',3,2,2,1,1,1,1),
(1,'C13',0,2,3,1,1,1,1),
(1,'C14',1,2,3,1,1,1,1),
(1,'C15',2,2,3,1,1,1,1),
(1,'C16',3,2,3,1,1,1,1),
(1,'C17',0,2,4,1,1,1,1),
(1,'C18',1,2,4,1,1,1,1),
(1,'C19',2,2,4,1,1,1,1),
(1,'C20',3,2,4,1,1,1,1),
(1,'C21',0,2,5,1,1,1,1),
(1,'C22',1,2,5,1,1,1,1),
(1,'C23',2,2,5,1,1,1,1),
(1,'C24',3,2,5,1,1,1,1),
(1,'C25',0,2,6,1,1,1,1),
(1,'C26',1,2,6,1,1,1,1),
(1,'C27',2,2,6,1,1,1,1),
(1,'C28',3,2,6,1,1,1,1);


------------ 2018-01-08


--------------- 2018-01-10
insert into tr_scr_screen	values ('ImportData','Admin'),
	('Album','Album'),
	('Calendar','Calendar'),
	('edit','Calendar'),
	('Category','Category'),
	('SearchCategory','Category'),
	('Client','Client'),
	('ClientApplication','Client'),
	('SearchClient','Client'),
	('ClientInvoice','ClientInvoice'),
	('SearchClientInvoice','ClientInvoice'),
	('ClientOrder','ClientOrder'),
	('ClientOrderDeliveryFormList','ClientOrder'),
	('SearchClientOrder','ClientOrder'),
	('PageDownLoad','Common'),
	('PageForPDF','Common'),
	('CostPlan','CostPlan'),
	('CostPlanClientInvoiceList','CostPlan'),
	('CostPlanClientOrderList','CostPlan'),
	('SearchCostPlan','CostPlan'),
	('DeliveryForm','DeliveryForm'),
	('SearchDeliveryForm','DeliveryForm'),
	('Logistics','Logistics'),
	('SearchLogistics','Logistics'),
	('Message','Message'),
	('Product','Product'),
	('ProductAttribute','Product'),
	('RecommandedProduct','Product'),
	('SearchAttProduct','Product'),
	('SearchProduct','Product'),
	('SiteProject','Product'),
	('Project','Project'),
	('ProjectClientInvoiceList','Project'),
	('ProjectClientOrderList','Project'),
	('ProjectCostPlanList','Project'),
	('SearchProject','Project'),
	('PurchaseIntent','PurchaseIntent'),
	('SearchPurchaseIntent','PurchaseIntent'),
	('SearchSupplier','Supplier'),
	('Supplier','Supplier'),
	('SupplierProduct','Supplier'),
	('SupplierProductSearch','Supplier'),
	('SearchSupplierInvoice','SupplierInvoice'),
	('SupplierInvoice','SupplierInvoice'),
	('SearchSupplierOrder','SupplierInvoice'),
	('SupplierOrder','SupplierOrder'),
	('Users','Users'),
	('ProductInventory','Warehouse'),
	('SearchVoucher','Warehouse'),
	('Shelves','Warehouse'),
	('Warehouse','Warehouse'),
	('WarehouseVoucher','Warehouse'),
	('Default',	NULL	);


------------ 2018-01-10 添加页面及权限
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ImportData' and scr_parent_name = 'Admin'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Album' and scr_parent_name = 'Album'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Calendar' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'edit' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Category' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCategory' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Client' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientApplication' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClient' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrderDeliveryFormList' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageDownLoad' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageForPDF' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientInvoiceList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientOrderList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'DeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchDeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Logistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchLogistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Message' and scr_parent_name = 'Message'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Product' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductAttribute' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'RecommandedProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchAttProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SiteProject' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Project' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientInvoiceList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientOrderList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectCostPlanList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProject' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchPurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Supplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProduct' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProductSearch' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierOrder' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierOrder' and scr_parent_name = 'SupplierOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Users' and scr_parent_name = 'Users'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductInventory' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Shelves' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Warehouse' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'WarehouseVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------

--declare @role nvarchar(250)
--declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Default' and scr_parent_name is NULL
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------

------------------  2018-01-18 以上内容已在服务器上运行

GO
insert into tr_scr_screen	values 	('ClientInvoiceA','ClientInvoice')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoiceA' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
GO
------------------  2018-02-08 以上内容已在服务器上运行


insert into TR_DCI_DeliveryForm_ClientInvoice (dfo_id,cin_id)
select dfo.dfo_id,cin_id  from TM_CIN_Client_Invoice cin
	join TM_DFO_Delivery_Form dfo on dfo.cod_id = cin.cod_id	
where cin_id not in(
select cin_id from TR_DCI_DeliveryForm_ClientInvoice)
------------------  2018-04-06 以上内容已在服务器上运行


------------------  2018-02-13 添加新的角色
insert into TR_ROL_Role
values ('Magasinier',1,39);

declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ImportData' and scr_parent_name = 'Admin'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Album' and scr_parent_name = 'Album'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Calendar' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'edit' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Category' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCategory' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Client' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientApplication' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClient' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrderDeliveryFormList' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageDownLoad' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageForPDF' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientInvoiceList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientOrderList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'DeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 1, 1, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchDeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Logistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchLogistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Message' and scr_parent_name = 'Message'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Product' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductAttribute' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'RecommandedProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchAttProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SiteProject' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Project' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientInvoiceList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientOrderList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectCostPlanList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProject' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchPurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Supplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProduct' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProductSearch' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierOrder' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierOrder' and scr_parent_name = 'SupplierOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Users' and scr_parent_name = 'Users'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 0, 1, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductInventory' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Shelves' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Warehouse' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'WarehouseVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------

select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Default' and scr_parent_name is NULL
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
go

--insert into tr_scr_screen	values 	('ClientInvoiceA','ClientInvoice')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoiceA' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO



insert into tr_scr_screen	values 	('ClientInvoiceStatment','ClientInvoice')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoiceStatment' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO
---------- 2018-02-16 以上内容已经在服务器上面运行



---------- 2018-02-16
insert into tr_scr_screen	values 	('EnterpriseSetting','Admin')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'EnterpriseSetting' and scr_parent_name = 'Admin'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO

alter table TR_SOC_Society add soc_rib_bank_code nvarchar(50) null
alter table TR_SOC_Society add soc_rib_agence_code nvarchar(50) null
alter table TR_SOC_Society add soc_rib_account_number nvarchar(50) null
alter table TR_SOC_Society add soc_rib_key nvarchar(50) null
alter table TR_SOC_Society add soc_rib_domiciliation_agency nvarchar(200) null
---------- 2018-02-19 以上内容已经在服务器上面运行


---------- 2018-02-21
insert into tr_scr_screen	values 	('ClientPrice','Client')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientPrice' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO
---------- 2018-02-21 以上内容已经在服务器上面运行


---------- 2018-02-27
insert into tr_scr_screen	values 	('ProductExpress','Product')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductExpress' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Admin'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Assistant'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Manager'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Comptable'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Commercial'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO

---------- 2018-02-28 以上内容已经在服务器上面运行



---------- 2018-03-01 update delivery form
update TM_DFO_Delivery_Form
set dfo_deliveried = 1
where dfo_id in
(select dfo.dfo_id from TM_CIN_Client_Invoice  cin 
	join TM_DFO_Delivery_Form dfo 
	on cin.dfo_id = dfo.dfo_id
	where dfo.dfo_deliveried is null 
	or
	dfo.dfo_deliveried = 0)

---------- 2018-03-01 以上内容已经在服务器上面运行


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


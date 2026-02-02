-- Créer le tableau Language
CREATE TABLE dbo.TR_LNG_Language
(
lng_id			int identity(1,1)	primary key,
lng_label		nvarchar(80)		not null,
lng_short_label nvarchar(20)		not null,
) 
--Créer le tableau Currency
CREATE TABLE dbo.TR_CUR_Currency
(
cur_id				int identity(1,1)	primary key,
cur_designation		nvarchar(20)		not null,
cur_ci_num			int					not null,
cur_symbol			nvarchar(10)		not null,
lng_id				int					not null constraint FK_CUR_LNG FOREIGN KEY(lng_id) REFERENCES TR_LNG_Language(lng_id),
)


-- Créer le tableau Main Currency (Monnaie Principale) 汇率换算
CREATE TABLE dbo.TR_MCU_Main_Currency
(
mcu_id					int identity	not null,	--PK
cur_id					int				not null,	--FK
mcu_rate_in				decimal(10,5)	not null,
mcu_rate_out			decimal(10,5)	not null,
mcu_rate_date			datetime		not null,
lng_id					int				not null,	-- FK LAN
cur_id2					int				not null,

CONSTRAINT mcu_id PRIMARY KEY CLUSTERED 
(
      mcu_id ASC
)
WITH 
(	PAD_INDEX  = OFF, 
	STATISTICS_NORECOMPUTE  = OFF, 
	IGNORE_DUP_KEY = OFF, 
	ALLOW_ROW_LOCKS  = ON, 
	ALLOW_PAGE_LOCKS  = ON) 
	ON [PRIMARY],
CONSTRAINT FK_MCU_CUR FOREIGN KEY(cur_id) REFERENCES TR_CUR_Currency(cur_id),		
CONSTRAINT FK_MCU_LAN FOREIGN KEY(lng_id) REFERENCES TR_LNG_Language(lng_id),
CONSTRAINT FK_MCU_CUR2 FOREIGN KEY(cur_id2) REFERENCES TR_CUR_Currency(cur_id),
) 
ON [PRIMARY]
GO

-- Créer le tableau Société
CREATE TABLE TR_SOC_Society
(
soc_id					int identity(1,1)	primary key,
soc_society_name		nvarchar(500)	not null,
soc_is_actived			bit				not null,
cur_id					int				not null CONSTRAINT FK_SOC_CUR FOREIGN KEY(cur_id) REFERENCES TR_CUR_Currency(cur_id),
lng_id					int				not null  CONSTRAINT FK_SOC_LNG FOREIGN KEY(lng_id) REFERENCES TR_LNG_Language(lng_id),
soc_datebegin			datetime			null,
soc_dateend				datetime			null,
soc_client_datebegin	datetime			null,
soc_client_dateend		datetime			null,
soc_email_auto			bit					null,
soc_capital				nvarchar(1000)		null,
soc_short_label			nvarchar(50)		null,
soc_rib_name			nvarchar(500)		null,
soc_rib_address			nvarchar(1000)		null,
soc_rib_code_iban		nvarchar(1000)		null,
soc_rib_code_bic		nvarchar(1000)		null,
soc_address1			nvarchar(400)		null,
soc_address2			nvarchar(400)		null,
soc_postcode			nvarchar(400)		null,
soc_city				nvarchar(400)		null,
soc_county				nvarchar(400)		null,
soc_tel					nvarchar(200)		null,
soc_fax					nvarchar(100)		null,
soc_siret				nvarchar(100)		null,
soc_rcs					nvarchar(100)		null,
soc_cellphone			nvarchar(200)		null,
soc_email				nvarchar(1000)		null,
soc_tva_intra			nvarchar(100)		null,
soc_site				nvarchar(200)		null,
soc_mask_commission		bit					null
) 
GO

-------------------------------------------------------------------------------------------

create table TR_ROL_Role
(
	rol_id				int					identity(1,1)	primary key,
	rol_name			nvarchar(200)		not null,
	rol_active			bit					not null
)

create table TR_SCR_Screen
(
	scr_id				int					identity(1,1)	primary key,
	scr_name			nvarchar(200)		not null
)


create table TR_RIT_Right
(
	rit_id				int					identity(1,1) primary key,
	scr_id				int					not null constraint FK_RIT_SCR	references TR_SCR_Screen(scr_id),
	rol_id				int					not null constraint FK_RIT_ROL	references TR_ROL_Role(rol_id),
	rit_read			bit					not null,
	rit_valid			bit					not null,
	rit_modifiy			bit					not null,
	rit_create			bit					not null,
	rit_delete			bit					not null,
	rit_active			bit					not null,
	rit_cancel			bit					not null	
)


CREATE TABLE TR_CIV_Civility
(
	civ_id				int identity(1,1)	primary key,
	civ_designation		nvarchar(200)		not null,
	civ_active			bit					not null
)


CREATE TABLE TM_USR_User
(
	usr_id				int identity(1,1)	primary key,
	rol_id				int					not null constraint FK_USR_ROL references TR_ROL_Role(rol_id),
	usr_login			nvarchar(200)		not null,
	usr_pwd				nvarchar(2000)		not null,  -- 这里要进行加密
	usr_firstname		nvarchar(200)		null,
	usr_lastname		nvarchar(200)		null,	
	usr_title			nvarchar(200)		null,
	civ_id				int					not null constraint FK_USR_CIV references TR_CIV_Civility(civ_id),
	usr_tel				nvarchar(200)		null,
	usr_cellphone		nvarchar(200)		null,
	usr_fax				nvarchar(200)		null,
	usr_email			nvarchar(200)		null,
	usr_code_hr			nvarchar(200)		null,
	usr_d_creation		datetime			not null,
	usr_d_update		datetime			not null,
	usr_is_actived		bit					not null,
	usr_photo_path		nvarchar(2000)		null,
	soc_id				int					not null constraint FK_USR_SOC references TR_SOC_Society(soc_id),
	usr_address1		nvarchar(400)		null,
	usr_address2		nvarchar(400)		null,
	usr_postcode		nvarchar(400)		null,
	usr_city			nvarchar(400)		null,
	usr_county			nvarchar(400)		null,
	usr_super_right		bit					not null
)

alter table tm_usr_user add usr_creator_id	int null constraint FK_USR_USR references TM_USR_User(usr_id)
------------------------------------------------------------------------------------


create table TR_COU_Country
(
	cou_id				int	identity(1,1)	primary key,
	cou_name			nvarchar(200)		not null,
	cou_code			nvarchar(50)		null,
	cou_iso_code		nvarchar(50)		null	
)


create table TR_REG_Region
(
	reg_id			int identity(1,1)	primary key,
	reg_code		nvarchar(40)		not null,
	reg_name		nvarchar(200)		not null,
	cou_id			int					not null constraint FK_REG_COU references TR_COU_Country(cou_id)
)

create table TR_DEP_Department
(
	dep_id			int identity(1,1)	primary key,
	dep_code		nvarchar(40)		not null,
	dep_name		nvarchar(200)		not null,
	reg_id			int					not null constraint FK_DEP_REG references TR_REG_Region(reg_id)
)

create table TR_CMU_Commune
(
	cmu_id						int identity(1,1)	primary key,
	cmu_code					nvarchar(40)		not null,
	cmu_name					nvarchar(200)		not null,
	cmu_postcode				nvarchar(100)		not null,
	cmu_insee					nvarchar(20)		null,
	cmu_code_arrondissement		nvarchar(20)		null,
	cmu_code_canton				nvarchar(20)		null,
	cmu_code_commune			nvarchar(20)		null,
	cmu_statut					nvarchar(100)		null,
	cmu_altitude_moyenne		decimal(10,4)		null,
	cmu_longitude				decimal(19,15)		null,
	cmu_latitude				decimal(19,15)		null,
	cmu_superficie				decimal(20,10)		null,
	cmu_population				decimal(10,4)		null,
	cmu_geo_shape				ntext				null,
	cmu_geogla_id				int					null,
	dep_id						int				not null constraint FK_CMU_DEP references TR_DEP_Department(dep_id)
)




-------------------------------------------------------------------------------------------


--Créer le tableau Payment Mode
CREATE TABLE TR_PMO_Payment_Mode
(
	pmo_id				int identity(1,1)	primary key,
	pmo_designation		nvarchar(60)		not null,
	pmo_isactive		bit					not null
)
GO




CREATE TABLE [TR_PCO_Payment_Condition](
	[pco_id] [int] IDENTITY(1,1) primary key,
	[pco_designation] [nvarchar](500) NOT NULL,
	[pco_active] [bit] NOT NULL,
	[pco_numday] [int] NOT NULL,
	[pco_day_additional] [int] NOT NULL,
	[pco_end_month] [bit] NOT NULL
)
GO
	


CREATE TABLE TR_VAT_Vat
(
	vat_id				int identity(1,1)	primary key,
	vat_designation		nvarchar(200)	not null,
	vat_vat_rate		decimal(16,4)	not null,
	vat_description		nvarchar(30)	not null,
)



--Créer le tableau client type
CREATE TABLE TR_CTY_Client_Type
(
cty_id				int identity		not null,
cty_description		nvarchar(20)		not null,

CONSTRAINT PK_CTY PRIMARY KEY CLUSTERED 
(
      cty_id ASC
)
WITH 
(	PAD_INDEX  = OFF, 
	STATISTICS_NORECOMPUTE  = OFF, 
	IGNORE_DUP_KEY = OFF, 
	ALLOW_ROW_LOCKS  = ON, 
	ALLOW_PAGE_LOCKS  = ON) 
	ON [PRIMARY]
) 
ON [PRIMARY]
GO




--Créer le tableau Activity
CREATE TABLE dbo.TR_ACT_Activity
(
act_id				int identity		not null,	-- NEW PK Type
act_designation		nvarchar(20)		not null,
act_isactive			bit					not null

CONSTRAINT PK_ACT PRIMARY KEY CLUSTERED 
(
      act_id ASC
)
WITH 
(	PAD_INDEX  = OFF, 
	STATISTICS_NORECOMPUTE  = OFF, 
	IGNORE_DUP_KEY = OFF, 
	ALLOW_ROW_LOCKS  = ON, 
	ALLOW_PAGE_LOCKS  = ON) 
	ON [PRIMARY]

) 
ON [PRIMARY]
GO


create table TM_CLI_CLient
(
	cli_id				int identity		not null,
	cli_ref				nvarchar(50)		null,
	soc_id				int					not null,
	cli_company_name	nvarchar(250)		not null,
	vat_id				int					not null,		--FK CTV
	pco_id				int					not null,	--FK PCO
	pmo_id				int					not null,	--FK PMO
	act_id				int					null,		--nvarchar(4)		--FK Activity
	cli_siren			nvarchar(50)		null,
	cli_siret			nvarchar(50)		null,
	cli_vat_intra		nvarchar(50)		null,
	usr_created_by		int					not null constraint FK_CLI_USR_CREATOR references TM_USR_User(usr_id),	--FK USR
	cty_id				int					not null,	--FK (TypeClient)	OK
	cur_id				int					not null, --nvarchar(3)		not null,	--FK CUR
	cli_isactive		bit					not null,
	cli_isblocked		bit					not null,
	cli_d_creation		datetime			not null,
	cli_d_update		datetime			not null,
	cli_address1		nvarchar(200)		null,
	cli_address2		nvarchar(200)		null,
	cli_postcode		nvarchar(50)		null,
	cli_city			nvarchar(200)		null,
	cli_country			nvarchar(200)		null,
	cli_free_of_harbor	int					null, -- 邮费，入港费
	cli_tel1			nvarchar(100)		null,
	cli_tel2			nvarchar(100)		null,
	cli_fax				nvarchar(100)		null,
	cli_cellphone		nvarchar(100)		null,
	cli_email			nvarchar(100)		null,
	cli_usr_com1		int					null	constraint FK_CLI_USR_COM1	references TM_USR_USER(usr_id),
	cli_usr_com2		int					null	constraint FK_CLI_USR_COM2	references TM_USR_USER(usr_id),
	cli_usr_com3		int					null	constraint FK_CLI_USR_COM3	references TM_USR_USER(usr_id),
	cli_recieve_newsletter bit				not null,
	cli_newsletter_email	nvarchar(100)	null
	
CONSTRAINT PK_CLI PRIMARY KEY CLUSTERED 
(
      cli_id ASC
)
WITH 
(	PAD_INDEX  = OFF, 
	STATISTICS_NORECOMPUTE  = OFF, 
	IGNORE_DUP_KEY = OFF, 
	ALLOW_ROW_LOCKS  = ON, 
	ALLOW_PAGE_LOCKS  = ON) 
	ON [PRIMARY],		
CONSTRAINT FK_CLI_SOC		FOREIGN KEY(soc_id)				 REFERENCES TR_SOC_Society(soc_id),
CONSTRAINT FK_CLI_VAT		FOREIGN KEY(vat_id)				 REFERENCES TR_VAT_VAT(vat_id),
CONSTRAINT FK_CLI_PCO		FOREIGN KEY(pco_id)				 REFERENCES TR_PCO_Payment_Condition(pco_id),
CONSTRAINT FK_CLI_PMO		FOREIGN KEY(pmo_id)				 REFERENCES TR_PMO_Payment_Mode(pmo_id),
CONSTRAINT FK_CLI_ACT		FOREIGN KEY(act_id)				 REFERENCES TR_ACT_Activity(act_id),
CONSTRAINT FK_CLI_USR		FOREIGN KEY(usr_created_by)		 REFERENCES TM_USR_User(usr_id),
CONSTRAINT FK_CLI_CUR		FOREIGN KEY(cur_id)				 REFERENCES TR_CUR_Currency(cur_id),
CONSTRAINT FK_CLI_CTY		FOREIGN KEY(cty_id)				 REFERENCES TR_CTY_Client_Type(cty_id),
) 
ON [PRIMARY]
GO





-- 职位
CREATE TABLE TR_POS_Position
(
	pos_id				int identity(1,1)	primary key,
	pos_designation		nvarchar(200)		not null,
	pos_active			bit					not null
)

create table TM_CCO_Client_Contact
(
	cco_id				int identity(1,1)	primary key,
	cco_firstname		nvarchar(200)		not null,
	cco_lastname		nvarchar(200)		not null,
	civ_id				int					not null constraint FK_CCO_CIV references TR_CIV_Civility(civ_id),
	cco_ref				nvarchar(50)		null,
	cco_adresse_title	nvarchar(200)		null,	
	cco_address1		nvarchar(200)		null,
	cco_address2		nvarchar(200)		null,
	cco_postcode		nvarchar(50)		null,
	cco_city			nvarchar(200)		null,
	cco_country			nvarchar(200)		null,
	cco_tel1			nvarchar(100)		null,
	cco_tel2			nvarchar(100)		null,
	cco_fax				nvarchar(100)		null,
	cco_cellphone		nvarchar(100)		null,
	cco_email			nvarchar(100)		null,
	cco_recieve_newsletter	bit				not null,
	cco_newsletter_email	nvarchar(100)	null,
	cco_is_delivery_adr		bit				not null,
	cco_is_invoicing_adr	bit				not null,
	cli_id					int				not null constraint FK_CCO_CLI	references TM_CLI_CLient(cli_id),	
	usr_created_by		int					not null constraint FK_CCO_USR_CREATOR references TM_USR_User(usr_id)	--FK USR
)


create table TR_CST_CostPlan_Statut
(
	cst_id				int identity(1,1)	primary key,
	cst_designation		nvarchar(50)		not null,
	cst_isactive		bit					not null
)


create table TM_CPL_Cost_Plan
(
	cpl_id				int identity(1,1)	primary key,
	cpl_code			nvarchar(50)		not null,
	cpl_d_creation		datetime			not null,
	cpl_d_update		datetime			not null,
	cst_id				int					not null constraint FK_CPL_CST references TR_CST_CostPlan_Statut,
	cli_id				int					not null constraint FK_CPL_CLI references TM_CLI_Client(cli_id),
	pco_id				int					not null constraint FK_CPL_PCO references TR_PCO_Payment_Condition(pco_id),
	pmo_id				int					not null constraint FK_CPL_PMO references TR_PMO_Payment_Mode(pmo_id),
	cpl_d_validity		datetime			not null,  -- 此日期之前有效
	cpl_d_pre_delivery	datetime			null,
	cpl_header_text		ntext				null,
	cpl_footer_text		ntext				null,
	cco_id_delivery		int					not null constraint FK_CPL_CCO_DEL references TM_CCO_Client_Contact(cco_id),
	cco_id_invoicing	int					not null constraint FK_CPL_CCO_INV references TM_CCO_Client_Contact(cco_id),
	cpl_client_comment	nvarchar(4000)		null,		-- 给客户的注释
	cpl_inter_comment	nvarchar(4000)		null,		-- 内部注释
	usr_creator_id		int					not null constraint FK_CPL_USR	references TM_USR_User(usr_id)		
)

----------------------------------------------
---------------- 未完成 ---------------------- 2017-05-24 完成
----------------------------------------------


create table TM_PRD_Product
(
	prd_id				int identity(1,1)	primary key,
	prd_ref				nvarchar(100)		not null
	----------------------------
	--- 需要添加价格，生产厂商等外联表
	----------------------------
)

create table TM_CLN_CostPlan_Lines
(
	cln_id				int identity(1,1)	primary key,	
	cpl_id				int					not null constraint FK_CLN_CPL references TM_CPL_Cost_Plan(cpl_id),
	cln_level			int					null,
	cln_description		nvarchar(4000)		null,
	prd_id				int					null constraint FK_CLN_PRD references TM_PRD_Product(prd_id),
	cln_ref				nvarchar(100)		null,
	cln_unit_price		decimal(16,4)		not null,
	cln_quantity		int					not null,
	cln_total_price		decimal(16,4)		not null,
	vat_id				int					null constraint FK_CLN_VAT references TR_VAT_VAT(vat_id)	
)


---------------------- CLIENT ORDER

create table TM_COD_Client_Order
(
	cod_id				int identity(1,1)	primary key,
	cod_code			nvarchar(50)		not null,
	cod_d_creation		datetime			not null,
	cod_d_update		datetime			not null,
	cli_id				int					not null constraint FK_COD_CLI references TM_CLI_Client(cli_id),
	pco_id				int					not null constraint FK_COD_PCO references TR_PCO_Payment_Condition(pco_id),
	pmo_id				int					not null constraint FK_COD_PMO references TR_PMO_Payment_Mode(pmo_id),	
	cod_d_pre_delivery_from	datetime		null,
	cod_d_pre_delivery_to	datetime		null,
	cod_header_text		ntext				null,
	cod_footer_text		ntext				null,
	cco_id_delivery		int					not null constraint FK_COD_CCO_DEL references TM_CCO_Client_Contact(cco_id),
	cco_id_invoicing	int					not null constraint FK_COD_CCO_INV references TM_CCO_Client_Contact(cco_id),
	cod_client_comment	nvarchar(4000)		null,		-- 给客户的注释
	cod_inter_comment	nvarchar(4000)		null,		-- 内部注释
	usr_creator_id		int					not null constraint FK_cod_USR	references TM_USR_User(usr_id),
	cpl_id				int					null	constraint FK_COD_CPL	references TM_CPL_Cost_Plan(cpl_id)	
)

create table TM_COL_ClientOrder_Lines
(
	col_id				int identity(1,1)	primary key,	
	cod_id				int					not null constraint FK_COL_COD references TM_COD_Client_Order(cod_id),
	cln_id				int					null constraint FK_COL_CLN references TM_CLN_CostPlan_Lines(cln_id),
	col_level			int					null,
	col_description		nvarchar(4000)		null,
	prd_id				int					null constraint FK_COL_PRD references TM_PRD_Product(prd_id),
	col_ref				nvarchar(100)		null,
	col_unit_price		decimal(16,4)		not null,
	col_quantity		int					not null,
	col_total_price		decimal(16,4)		not null,
	vat_id				int					null constraint FK_COL_VAT references TR_VAT_VAT(vat_id)
)


------------------------------  INVOICE


create table TM_CIN_Client_Invoice
(	
	cin_id						int identity(1,1)	primary key,
	cin_code					nvarchar(50)	not null,
	cod_id						int				null constraint FK_CIN_COD references TM_COD_Client_Order(cod_id),
	cli_id						int				not null CONSTRAINT FK_CIN_CLI REFERENCES TM_CLI_Client(cli_id),
	cin_d_creation				datetime		not null,
	cin_d_update				datetime		null,
	cin_d_invoice				datetime		null,
	usr_creator_id				int				not null CONSTRAINT FK_CIN_USR REFERENCES TM_USR_User(usr_id),
	cco_id_fac					int				not null,
	cin_header_text				ntext			null,
	cin_footer_text				ntext			null,
	cur_id						int				not null CONSTRAINT FK_CIN_CUR REFERENCES TR_CUR_Currency(cur_id),
	cin_account					bit				not null,
	cin_d_term					datetime		null,
	pco_id						int				not null CONSTRAINT FK_CIN_PCO REFERENCES TR_PCO_Payment_Condition(pco_id),
	pmo_id						int				not null CONSTRAINT FK_CIN_PMO REFERENCES TR_PMO_Payment_Mode(pmo_id),
	cco_id_delivery				int				not null constraint FK_CIN_CCO_DEL references TM_CCO_Client_Contact(cco_id),
	cco_id_invoicing			int				not null constraint FK_CIN_CCO_INV references TM_CCO_Client_Contact(cco_id),
	cin_isinvoice				bit				not null,
	cin_ref						nvarchar(50)	not null	
)
go



create table TM_CII_ClientInvoice_Line
(
	cii_id				int identity(1,1)	primary key,	
	cin_id				int					not null constraint FK_CII_CIN references TM_CIN_Client_Invoice(cin_id),
	col_id				int					null constraint FK_CII_COL references TM_COL_ClientOrder_Lines(col_id),
	cii_level			int					null,
	cii_description		nvarchar(4000)		null,
	prd_id				int					null constraint FK_CII_PRD references TM_PRD_Product(prd_id),
	cii_ref				nvarchar(100)		null,
	cii_unit_price		decimal(16,4)		not null,
	cii_quantity		int					not null,
	cii_total_price		decimal(16,4)		not null,
	vat_id				int					null constraint FK_CII_VAT references TR_VAT_VAT(vat_id)
)



------------------- update client 2017-01-25 -----------------
alter table TM_CLI_CLient add cmu_id int null constraint FK_CLI_CMU references TR_CMU_Commune(cmu_id)
alter table TM_CLI_CLient add cli_comment_for_client ntext null
alter table TM_CLI_CLient add cli_comment_for_interne ntext null
alter table TM_CCO_Client_Contact add cco_d_creation				datetime		not null
alter table TM_CCO_Client_Contact add cco_d_update				datetime		not null
alter table TM_CCO_Client_Contact add cco_comment				ntext		null

------------------- update client 2017-01-26 -----------------
alter table TM_CCO_Client_Contact add cmu_id int null constraint FK_CCO_CMU references TR_CMU_Commune(cmu_id)


------------------- update client 2017-01-30 ---------------------------
alter table TM_CLI_Client add cli_invoice_day int null
alter table TM_CLI_Client add cli_invoice_day_is_last_day bit null


------------------- create table 2017-02-01 -----------------------------
------------------- 该条注释添加于 2017-04-21 该表为一般商品属性表，同类商品在此表中存储的数据是一致的，但在商品等页面是可以修改的
create table TM_PTY_Product_Type
(
	pty_id						int identity(1,1)	primary key,
	soc_id						int	not null constraint FK_PTY_SOC	references TR_SOC_Society(soc_id),
	pty_name					nvarchar(200)		not null,
	pty_description				nvarchar(4000)		null,
	pty_specifications_fields	xml					null
)

alter table	TM_PRD_Product	add	soc_id				int not null constraint FK_PRD_SOC	references TR_SOC_Society(soc_id)
alter table	TM_PRD_Product	add	pty_id				int not null constraint FK_PRD_PTY	references TM_PTY_Product_Type(pty_id)
alter table	TM_PRD_Product	add	prd_name			nvarchar(200)		not null
alter table	TM_PRD_Product	add	prd_discription		nvarchar(4000)		null	
alter table	TM_PRD_Product	add	prd_weight			decimal(16,4)		null -- 之后删除
alter table	TM_PRD_Product	add	prd_lenght			decimal(16,4)		null -- 之后删除
alter table	TM_PRD_Product	add	prd_width			decimal(16,4)		null -- 之后删除
alter table	TM_PRD_Product	add	prd_height			decimal(16,4)		null -- 之后删除
alter table	TM_PRD_Product	add	prd_garantie		int			
alter table	TM_PRD_Product	add	prd_specifications	xml			

------------------- update client 2017-04-18 ---------------------------
alter table	TM_PTY_Product_Type	add	pty_active	bit	not null default 1

alter table TM_PRD_Product drop column prd_weight
alter table TM_PRD_Product drop column prd_lenght
alter table TM_PRD_Product drop column prd_width
alter table TM_PRD_Product drop column prd_height
alter table TM_PRD_Product drop column prd_garantie



----------------- 2017-04-21 ----------------------------------
----- 此表为存储商品属性矩阵，该矩阵中为二维属性，并同列显示，在商品等其他页面是可以修改的
create table TM_PTM_Product_Type_Matrix
(
	ptm_id			int	identity(1,1)	primary key,
	pty_id			int not null		constraint FK_PTM_PTY references TM_PTY_Product_Type(pty_id),
	ptm_range_X		xml	null,
	ptm_range_Y		xml null,	--- 此项目存放X的条目
	ptm_matrix		xml null	--- 此项目内存放X和Y的合并值，同时存放GUID
)


----------------- 2017-04-26 ------------------------------
alter table TM_PTM_Product_Type_Matrix add ptm_range_Z xml null -- 此条目存放Z列，也就是实际的，需要赋值的variable列，将matrix列转换为y和z的合并值; 注意，这一列是独立于X与Y的



----------------- 2017-04-27 ------------------------------
alter table TM_PRD_Product add prd_price	decimal(16,4) null

create table TM_PIT_Product_Instance
(
	pit_id			int identity(1,1)	primary key,
	prd_id			int					not null	constraint FK_PIT_PRD references TM_PRD_Product(prd_id),
	pty_id			int					not null	constraint FK_PIT_PTY references TM_PTY_Product_Type(pty_id),
	pit_price		decimal				null,
	pit_ref			nvarchar(200)		null,
	pit_description	nvarchar(400)		null,
	pit_prd_info	xml					null
)

---------------- 2017-04-28 -------------------------

alter table TM_PRD_Product add prd_purchase_price	decimal(16,4) null
alter table TM_PIT_Product_Instance add pit_purchase_price decimal(16,4) null

EXEC sp_rename 'TM_PRD_Product.[prd_discription]', 'prd_description', 'COLUMN'

--------------- 2017-05-03 -------------------------
alter table TM_PRD_Product add prd_file_name nvarchar(1000) null --- 这个是为了处理Excel 而建,不在页面显示


--------------- 2017-05-05 -------------------------
alter table TM_CPL_Cost_Plan add vat_id int not null default 1  constraint FK_CPL_VAT	references TR_VAT_Vat(vat_id)


-- 新建 project 表，将 devis 统一到一个project 里面
create table TM_PRJ_Project
(
	prj_id				int identity(1,1)	primary key,
	prj_code			nvarchar(50)		not null,
	prj_name			nvarchar(1000)		not null,
	prj_d_creation		datetime			not null,
	prj_d_update		datetime			null,
	cli_id				int					not null constraint FK_PRJ_CLI references TM_CLI_Client(cli_id),
	pco_id				int					not null constraint FK_PRJ_PCO references TR_PCO_Payment_Condition(pco_id),
	pmo_id				int					not null constraint FK_PRJ_PMO references TR_PMO_Payment_Mode(pmo_id),
	vat_id				int					not null constraint FK_PRJ_VAT references TR_VAT_Vat(vat_id),
	soc_id				int					not null constraint FK_PRJ_SOC references TR_SOC_Society(soc_id),
	prj_header_text		ntext				null,
	prj_footer_text		ntext				null,
	prj_client_comment	nvarchar(4000)		null,		-- 给客户的注释
	prj_inter_comment	nvarchar(4000)		null,		-- 内部注释
	usr_creator_id		int					not null constraint FK_PRJ_USR	references TM_USR_User(usr_id)			
)



alter table TM_PRD_Product add prd_code nvarchar(10) null
alter table TM_PRD_Product add prd_d_creation datetime null
alter table TM_PRD_Product add prd_d_update datetime null


alter table tm_cpl_cost_plan add prj_id int not null constraint FK_CPL_PRJ	references TM_PRJ_Project(prj_id)
alter table tm_cpl_cost_plan add soc_id int not null constraint FK_CPL_SOC references TR_SOC_Society(soc_id)

------------ 2017-05-09 --------------------------------
alter table tm_cpl_cost_plan add cpl_name nvarchar(1000) null

------------ 2017-05-15 --------------------------------
------------ 商品类别表
create table TM_PCT_Product_Catelogue
(
	pct_id				int identity(1,1)	primary key,
	pct_name			nvarchar(1000)		not null,
	pct_description		nvarchar(4000)		null,
	pct_level			int					null, -- 这个是在每次修改后计算好的商品目录等级
	pct_actived			bit					not null,
	pct_main_img		nvarchar(1000)		null, -- 存储该目录的主图位置
	pct_sec_img			nvarchar(1000)		null, -- 存储该目录的副图位置
)
alter table TM_PCT_Product_Catelogue add pct_parent_id	int null constraint FK_PCT_PCT references TM_PCT_Product_Catelogue(pct_id) -- 母目录类别，如果没有或者是本身，便是根目录

--- 商品所在目录表
create table TI_PIC_Product_In_Catelogue
(
	pic_id				int identity(1,1)	primary key,
	pct_id				int not null constraint FK_PIC_PCT references TM_PCT_Product_Catelogue(pct_id),
	prd_id				int not null constraint FK_PIC_PRD references TM_PRD_Product(prd_id)
)

--- 总相册
create table TR_ALB_Album
(
	alb_id				int identity(1,1)	primary key,
	alb_name			nvarchar(200)		not null,
	alb_description		nvarchar(1000)		null,
	alb_d_creation		datetime			not null,  -- 用这个定顺序
)

--- 相册内的图片
create table TR_PAL_Photo_Album
(
	pal_id				int identity(1,1)	primary key,
	alb_id				int					not null constraint FK_PAL_ALB references TR_ALB_Album(alb_id),
	pal_description		nvarchar(1000)		null,
	pal_path			nvarchar(1000)		not null,
	pal_d_creation		datetime			not null,  -- 用这个定顺序
)


--- 商品图片表
create table TI_PIM_Product_Image
(
	pim_id				int identity(1,1)	primary key,
	prd_id				int not null		constraint FK_PIM_PRD references TM_PRD_Product(prd_id),
	pim_path			nvarchar(1000)		null,
	pim_order			int	not null,		-- 用这个定顺序
	pal_id				int null			constraint FK_PIM_PAL references TR_PAL_Photo_Album(pal_id), -------- 如果商品的图片在相册中，就从相册图片选取
)

alter table TM_PCT_Product_Catelogue add soc_id int not null constraint FK_PCT_SOC references TR_SOC_Society(soc_id)
alter table TR_ALB_Album add soc_id int not null constraint FK_ALB_SOC references TR_SOC_Society(soc_id)

----------------- 2017-05-18 ------------------
alter table TR_PAL_Photo_Album add pal_d_update datetime null

----------------- 2017-05-19 ------------------
----- 文件垃圾站
create table TR_FRE_File_Recycle
(
	fre_id			int	identity(1,1)	primary key,
	fre_path		nvarchar(2000)		not null -- 用来存储删除的文件路径，一旦文件被删除，该条数据就被删除
)
alter table TR_FRE_File_Recycle add fre_d_create datetime not null

alter table TI_PIM_Product_Image add pim_description nvarchar(1000) null
----- 商品 instance 图片
create table TI_PTI_Product_Instance_Image
(
	pti_id			int identity(1,1)	primary key,
	pit_id			int	not null constraint FK_PTI_PIT references TM_PIT_Product_Instance(pit_id),
	pti_path		nvarchar(1000),
	pti_order		int not null,
	pal_id			int null constraint FK_PTI_PAL references TR_PAL_Photo_Album(pal_id), -------- 如果商品的图片在相册中，就从相册图片选取
	pti_description	nvarchar(1000) null
)

------------------- 2017-05-23 ----------------------
------- 银行信息
create table TR_BAC_Bank_Account
(
	bac_id					int	identity(1,1)	primary key,
	bac_bank_name			nvarchar(200)		null,		-- domiciliation，只有一行的银行名称
	bac_bank_adr			nvarchar(200)		null,		-- 银行地址，在rib中是多行的
	bac_account_number		nvarchar(200)		null,		-- 有IBAN就存在IBAN里面，没有IBAN的那种银行号码就存在这里	
	bac_bic					nvarchar(50)		not null,	-- swift code
	bac_iban				nvarchar(50)		null,		-- iban 号码，是那个最长的
	bac_rib_bank_code		nvarchar(20)		null,		
	bac_rib_agence_code		nvarchar(20)		null,
	bac_rib_account_number	nvarchar(20)		null,		-- bic 中的N° compte，只有十几位数字的
	bac_rib_key				nvarchar(20)		null,		
	bac_account_owner		nvarchar(100)		not null,	-- 20250216 账户名称
	bac_type				int					not null,  -- 1: client, 2: supplier, 3: contact client, 4: contact supplier, 5: enterprise
	f_id					int					null -- 用来存储外表的id，参见bac_type
)

-------- 供货商
create table TM_SUP_Supplier
(
	sup_id					int identity(1,1)	primary key,
	sup_ref					nvarchar(50)		null,
	soc_id					int					not null constraint FK_SUP_SOC references TR_SOC_Society(soc_id),
	sup_company_name		nvarchar(250)		not null,
	vat_id					int					not null CONSTRAINT FK_SUP_VAT REFERENCES TR_VAT_VAT(vat_id),
	pco_id					int					not null CONSTRAINT FK_SUP_PCO REFERENCES TR_PCO_Payment_Condition(pco_id),	--FK PCO
	pmo_id					int					not null CONSTRAINT FK_SUP_PMO REFERENCES TR_PMO_Payment_Mode(pmo_id),	--FK PMO
	sup_siren				nvarchar(50)		null,
	sup_siret				nvarchar(50)		null,
	sup_vat_intra			nvarchar(50)		null,
	usr_created_by			int					not null constraint FK_SUP_USR_CREATOR references TM_USR_User(usr_id),	--FK USR
	cur_id					int					not null CONSTRAINT FK_SUP_CUR REFERENCES TR_CUR_Currency(cur_id), --nvarchar(3)		not null,	--FK CUR
	sup_isactive			bit					not null,
	sup_isblocked			bit					not null,
	sup_d_creation			datetime			not null,
	sup_d_update			datetime			not null,
	sup_address1			nvarchar(200)		null,
	sup_address2			nvarchar(200)		null,
	sup_postcode			nvarchar(50)		null,
	sup_city				nvarchar(200)		null,
	sup_country				nvarchar(200)		null,
	sup_free_of_harbor		int					null, -- 邮费，入港费
	sup_tel1				nvarchar(100)		null,
	sup_tel2				nvarchar(100)		null,
	sup_fax					nvarchar(100)		null,
	sup_cellphone			nvarchar(100)		null,
	sup_email				nvarchar(100)		null,
	sup_recieve_newsletter	bit					not null,
	sup_newsletter_email	nvarchar(100)		null,
	sup_comment_for_supplier	ntext			null,
	sup_comment_for_interne		ntext			null	
)

----- 供货商联系人
create table TM_SCO_Supplier_Contact
(
	sco_id				int identity(1,1)	primary key,
	sco_firstname		nvarchar(200)		not null,
	sco_lastname		nvarchar(200)		not null,
	civ_id				int					not null constraint FK_SCO_CIV references TR_CIV_Civility(civ_id),
	sco_ref				nvarchar(50)		null,
	sco_adresse_title	nvarchar(200)		null,	
	sco_address1		nvarchar(200)		null,
	sco_address2		nvarchar(200)		null,
	sco_postcode		nvarchar(50)		null,
	sco_city			nvarchar(200)		null,
	sco_country			nvarchar(200)		null,
	sco_tel1			nvarchar(100)		null,
	sco_tel2			nvarchar(100)		null,
	sco_fax				nvarchar(100)		null,
	sco_cellphone		nvarchar(100)		null,
	sco_email			nvarchar(100)		null,
	sco_recieve_newsletter	bit				not null,
	sco_newsletter_email	nvarchar(100)	null,
	sup_id					int				not null constraint FK_SCO_SUP	references TM_SUP_Supplier(sup_id),	
	usr_created_by		int					not null constraint FK_SCO_USR_CREATOR references TM_USR_User(usr_id),	--FK USR
	sco_d_creation		datetime			not null,
	sco_d_update		datetime			not null,
	sco_comment			ntext				null,
)


---------------------- 2017-05-24 完成 costplan
----- 在costplan表中 添加client contact info 
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_firstname			nvarchar(200)		null			
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_lastname			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_address1			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_address2			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_postcode			nvarchar(50)		null		
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_city				nvarchar(200)		null	
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_country				nvarchar(200)		null	
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_tel1				nvarchar(100)		null	
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_fax					nvarchar(100)		null
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_cellphone			nvarchar(100)		null		
alter table TM_CPL_Cost_Plan add 	cpl_inv_cco_email				nvarchar(100)		null	
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_firstname			nvarchar(200)		null			
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_lastname			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_address1			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_address2			nvarchar(200)		null		
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_postcode			nvarchar(50)		null		
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_city				nvarchar(200)		null	
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_country				nvarchar(200)		null	
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_tel1				nvarchar(100)		null	
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_fax					nvarchar(100)		null
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_cellphone			nvarchar(100)		null		
alter table TM_CPL_Cost_Plan add 	cpl_dlv_cco_email				nvarchar(100)		null	

--------------------- 2017-05-25 ----------------
alter table TR_BAC_Bank_Account add soc_id	int not null constraint FK_BAC_SOC references TR_SOC_Society(soc_id)

--- line type for cost plan, order and invoice
create table TR_LTP_Line_Type
(
	ltp_id			int identity(1,1)	primary key,
	ltp_name		nvarchar(100)		not null,
	ltp_description	nvarchar(200)		null,
	ltp_isactive	bit					not null
)
GO

------- 重建并完善 cost plan line 
--- 利用这条语句找到有关TM_CLN_CostPlan_Lines 的外键，删除
SELECT 
    'ALTER TABLE [' +  OBJECT_SCHEMA_NAME(parent_object_id) +
    '].[' + OBJECT_NAME(parent_object_id) + 
    '] DROP CONSTRAINT [' + name + ']'
FROM sys.foreign_keys
WHERE referenced_object_id = object_id('TM_CLN_CostPlan_Lines')
--- 删除外键
ALTER TABLE [dbo].[TM_COL_ClientOrder_Lines] DROP CONSTRAINT [FK_COL_CLN]
--- 删除表
IF OBJECT_ID('dbo.TM_CLN_CostPlan_Lines', 'U') IS NOT NULL 
  DROP TABLE dbo.TM_CLN_CostPlan_Lines; 
--- 重建表
create table TM_CLN_CostPlan_Lines
(
	cln_id					int identity(1,1)	primary key,	
	cpl_id					int					not null constraint FK_CLN_CPL references TM_CPL_Cost_Plan(cpl_id),
	cln_level1				int					null,
	cln_level2				int					null,
	cln_description			nvarchar(4000)		null,
	prd_id					int					null constraint FK_CLN_PRD references TM_PRD_Product(prd_id),
	pit_id					int					null constraint FK_CLN_PIT references TM_PIT_Product_Instance(pit_id),
	cln_purchase_price		decimal(16,4)		null,
	cln_unit_price			decimal(16,4)		null,
	cln_quantity			int					null,
	cln_total_price			decimal(16,4)		null,
	cln_total_crude_price	decimal(16,4)		null,
	vat_id					int					null constraint FK_CLN_VAT references TR_VAT_VAT(vat_id),
	ltp_id					int					not null constraint FK_CLN_LTP references TR_LTP_Line_Type(ltp_id)
)
--- 重建外键
alter table TM_COL_ClientOrder_Lines add constraint FK_COL_CLN foreign key(cln_id) references TM_CLN_CostPlan_Lines(cln_id)


--------  update product instance reference 仅一次使用

--update TM_PIT_Product_Instance
--set pit_ref = pitnewref
--from (
--select
--  pit_id as pit_new_id,pit_prd_info.value('(/PropertyList/Propety/@PropValue)[1]', 'nvarchar(max)') as pitnewref
--from
--  TM_PIT_Product_Instance
--where
--  pit_prd_info.value('(/PropertyList/Propety/@PropGuid)[1]', 'nvarchar(max)') like '65240957-09e1-4a56-864d-2cf350de55d4') rest
-- where pit_id = rest.pit_new_id



----------------- 2017-05-28 -----------------
alter table tm_cln_costplan_lines add cln_prd_name nvarchar(100) null ------------- 在没有prd id 的情况下，可以使用这个作为prd name如 transport

--- 更新商品进价，测试用
--update TM_PIT_Product_Instance
--set pit_purchase_price = 100*RAND()

----------------- 2017-05-29 -----------------
-- for devis and client invoice
Create table TR_THF_Text_Header_Footer
(
	thf_id						int identity(1,1)	primary key,
	thf_header					ntext				null,
	thf_footer					ntext				null,
	thf_cin_header				ntext				null,
	thf_cin_footer				ntext				null
)



----------------- 2017-05-30 ----------------------
alter table TM_CLN_CostPlan_Lines add cln_discount_percentage decimal(16,4) null
alter table TM_CLN_CostPlan_Lines add cln_discount_amount decimal(16,4) null
alter table TM_CLN_CostPlan_Lines add cln_price_with_discount_ht decimal(16,4) null
alter table TM_CLN_CostPlan_Lines add cln_margin decimal(16,4) null

alter table tm_cpl_cost_plan add cpl_discount_percentage decimal(16,4) null
alter table tm_cpl_cost_plan add cpl_discount_amount decimal(16,4) null



--------------- 2017-05-31 -----------------------
create table TR_SPR_Supplier_Product
(
	spr_id					int		identity(1,1)	primary key,
	sup_id					int		not null constraint FK_SPR_SUP references TM_SUP_Supplier(sup_id),
	prd_id					int		not null constraint FK_SPR_PRD references TM_PRD_Product(prd_id),
	spr_prd_ref				nvarchar(100)	null, -- product reference for supplier
	spr_price_1_100			decimal null,
	spr_price_100_500		decimal null,
	spr_price_500_plus		decimal null,
	soc_id int not null constraint FK_SPR_SOC references TR_SOC_Society(soc_id)
)
alter table TR_SPR_Supplier_Product add cur_id	int not null constraint FK_SPR_CUR references TR_CUR_Currency(cur_id)

----- update product, add dimension
alter table TM_PRD_Product add prd_inside_diameter decimal(16,4) null	-- 墙体的直径 !! 需要删除
alter table TM_PRD_Product add prd_outside_diameter decimal(16,4) null  -- 墙外的直径

alter table TM_PRD_Product add prd_length decimal(16,4) null	-- 产品本身的长
alter table TM_PRD_Product add prd_width decimal(16,4) null		-- 产品本身的宽
alter table TM_PRD_Product add prd_height decimal(16,4) null	-- 产品本身的高
alter table TM_PRD_Product add prd_hole_size decimal(16,4) null	-- 墙体开口的直径
alter table TM_PRD_Product add prd_depth decimal(16,4) null		-- 墙体开口的深度
alter table TM_PRD_Product add prd_weight decimal(16,4) null

alter table TM_PRD_Product add prd_unit_length decimal(16,4) null
alter table TM_PRD_Product add prd_unit_width decimal(16,4) null
alter table TM_PRD_Product add prd_unit_height decimal(16,4) null
alter table TM_PRD_Product add prd_unit_weight decimal(16,4) null

alter table TM_PRD_Product add prd_quantity_each_carton int null
alter table TM_PRD_Product add prd_carton_length decimal(16,4) null
alter table TM_PRD_Product add prd_carton_width decimal(16,4) null
alter table TM_PRD_Product add prd_carton_height decimal(16,4) null
alter table TM_PRD_Product add prd_carton_weight decimal(16,4) null



----------------------- 2017-06-01 ----------------------------------------

----- update client order
alter table TM_COD_Client_Order add	vat_id int NOT NULL constraint FK_COD_VAT	references TR_VAT_Vat(vat_id);
alter table TM_COD_Client_Order add	prj_id int NOT NULL constraint FK_COD_PRJ	references TM_PRJ_Project(prj_id);
alter table TM_COD_Client_Order add	soc_id int NOT NULL constraint FK_COD_SOC references TR_SOC_Society(soc_id);
alter table TM_COD_Client_Order add	cod_name nvarchar(1000) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_firstname nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_lastname nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_address1 nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_address2 nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_postcode nvarchar(50) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_city nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_country nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_tel1 nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_fax nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_cellphone nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_inv_cco_email nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_firstname nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_lastname nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_address1 nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_address2 nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_postcode nvarchar(50) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_city nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_country nvarchar(200) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_tel1 nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_fax nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_cellphone nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_dlv_cco_email nvarchar(100) NULL;
alter table TM_COD_Client_Order add	cod_discount_percentage decimal(16,4) NULL;
alter table TM_COD_Client_Order add	cod_discount_amount decimal(16,4) NULL;
alter table TM_COD_Client_Order add	cod_d_end_work	datetime null;
alter table TM_COD_Client_Order add cod_file nvarchar(2000) null; -- 存储客户订单扫描件


------ update client order line
EXEC sp_rename 'TM_COL_ClientOrder_Lines.[col_level]', 'col_level1', 'COLUMN'
alter table TM_COL_ClientOrder_Lines add col_level2 int NULL;
alter table TM_COL_ClientOrder_Lines add pit_id int NULL constraint FK_COL_PIT references TM_PIT_Product_Instance(pit_id);
alter table TM_COL_ClientOrder_Lines add col_purchase_price decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines alter column col_unit_price decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines alter column col_quantity int NULL;
alter table TM_COL_ClientOrder_Lines alter column col_total_price decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines add col_total_crude_price decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines add ltp_id int NOT NULL constraint FK_COL_LTP references TR_LTP_Line_Type(ltp_id);
alter table TM_COL_ClientOrder_Lines add col_prd_name nvarchar(100) NULL;
alter table TM_COL_ClientOrder_Lines add col_discount_percentage decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines add col_discount_amount decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines add col_price_with_discount_ht decimal(16, 4) NULL;
alter table TM_COL_ClientOrder_Lines add col_margin decimal(16, 4) NULL;

GO


--------------------------- 2017-06-06 ---------
create table TM_DFO_Delivery_Form
(
	dfo_id					int identity(1,1)	primary key,
	dfo_code				nvarchar(50)		not null,
	dfo_d_creation			datetime			not null,
	dfo_d_update			datetime			not null,
	dfo_d_delivery			datetime			not null,
	cli_id					int					not null constraint FK_DFO_CLI references TM_CLI_Client(cli_id),
	dfo_header_text			ntext				null,
	dfo_footer_text			ntext				null, 
	cco_id_delivery			int					not null constraint FK_DFO_CCO	references TM_CCO_Client_Contact(cco_id),
	dfo_delivery_comment	nvarchar(4000)		null,
	dfo_inter_comment		nvarchar(4000)		null,
	usr_creator_id			int					not null constraint FK_DFO_USR	references TM_USR_User(usr_id),
	cod_id					int					not null constraint FK_DFO_COD	references TM_COD_Client_Order(cod_id),
	dfo_dlv_cco_firstname	nvarchar(200)		NULL,
	dfo_dlv_cco_lastname	nvarchar(200)		NULL,
	dfo_dlv_cco_address1	nvarchar(200)		NULL,
	dfo_dlv_cco_address2	nvarchar(200)		NULL,
	dfo_dlv_cco_postcode	nvarchar(50)		NULL,
	dfo_dlv_cco_city		nvarchar(200)		NULL,
	dfo_dlv_cco_country		nvarchar(200)		NULL,
	dfo_dlv_cco_tel1		nvarchar(100)		NULL,
	dfo_dlv_cco_fax			nvarchar(100)		NULL,
	dfo_dlv_cco_cellphone	nvarchar(100)		NULL,
	dfo_dlv_cco_email		nvarchar(100)		NULL,
	dfo_file				nvarchar(2000)		null,
	soc_id					int					not null constraint FK_DFO_SOC references TR_SOC_Society(soc_id)
)

create table TM_DFL_DevlieryForm_Line
(
	dfl_id					int identity(1,1)		primary key,
	dfo_id					int						not null constraint FK_DFL_DFO references TM_DFO_Delivery_Form(dfo_id),
	col_id					int						not null constraint FK_DFL_COL references TM_COL_ClientOrder_Lines(col_id),
	dfl_description			nvarchar(4000)			null,
	dfl_quantity			int						not null,
)

alter table TM_DFO_Delivery_Form add dfo_deliveried bit not null

----------------------------- 2017-06-08 ------------------------------
alter table TR_THF_Text_Header_Footer add thf_dlv_footer_condition ntext null
alter table TR_THF_Text_Header_Footer add thf_dlv_footer_law ntext null

------- client invoice
alter table TM_CIN_Client_Invoice drop column cin_ref
alter table TM_CIN_Client_Invoice add	vat_id int NOT NULL constraint FK_CIN_VAT	references TR_VAT_Vat(vat_id);
alter table TM_CIN_Client_Invoice add	prj_id int NOT NULL constraint FK_CIN_PRJ	references TM_PRJ_Project(prj_id);
alter table TM_CIN_Client_Invoice add	dfo_id int NULL constraint FK_CIN_DFO	references TM_DFO_Delivery_Form(dfo_id);
alter table TM_CIN_Client_Invoice add	soc_id int NOT NULL constraint FK_CIN_SOC	references TR_SOC_Society(soc_id);
alter table TM_CIN_Client_Invoice add	cin_name nvarchar(1000) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_firstname nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_lastname nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_address1 nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_address2 nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_postcode nvarchar(50) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_city nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_country nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_tel1 nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_fax nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_cellphone nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_inv_cco_email nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_firstname nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_lastname nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_address1 nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_address2 nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_postcode nvarchar(50) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_city nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_country nvarchar(200) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_tel1 nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_fax nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_cellphone nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_dlv_cco_email nvarchar(100) NULL;
alter table TM_CIN_Client_Invoice add	cin_discount_percentage decimal(16,4) NULL;
alter table TM_CIN_Client_Invoice add	cin_discount_amount decimal(16,4) NULL;
alter table TM_CIN_Client_Invoice add	cin_file nvarchar(2000) null; -- 存储客户订单扫描件
alter table TM_CIN_Client_Invoice add	cin_client_comment	nvarchar(4000)		null;		-- 给客户的注释
alter table TM_CIN_Client_Invoice add	cin_inter_comment	nvarchar(4000)		null;		-- 内部注释

------------ client invoice line
alter table TM_CII_ClientInvoice_Line drop constraint FK_CII_COL
alter table TM_CII_ClientInvoice_Line drop column col_id
EXEC sp_rename 'TM_CII_ClientInvoice_Line.[cii_level]', 'cii_level1', 'COLUMN'
alter table TM_CII_ClientInvoice_Line add dfl_id int null constraint FK_CII_DFL references TM_DFL_DevlieryForm_Line(dfl_id);
alter table TM_CII_ClientInvoice_Line add cii_level2 int NULL;
alter table TM_CII_ClientInvoice_Line add cii_purchase_price decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add cii_total_crude_price decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add cii_prd_name nvarchar(100) NULL;
alter table TM_CII_ClientInvoice_Line add cii_discount_percentage decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add cii_discount_amount decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add cii_price_with_discount_ht decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add cii_margin decimal(16, 4) NULL;
alter table TM_CII_ClientInvoice_Line add pit_id int NULL constraint FK_CII_PIT references TM_PIT_Product_Instance(pit_id);
alter table TM_CII_ClientInvoice_Line add ltp_id int NOT NULL constraint FK_CII_LTP references TR_LTP_Line_Type(ltp_id);
alter table TM_CIN_Client_Invoice drop column cco_id_fac;
alter table TM_CII_ClientInvoice_Line alter column cii_unit_price decimal(16,4) null;
alter table TM_CII_ClientInvoice_Line alter column cii_total_price decimal(16,4) null;

------------------- 2017-06-09 -----------------
alter table TM_CIN_Client_Invoice add	cin_d_encaissement datetime NULL;
alter table TM_CIN_Client_Invoice add	cin_avoir_id	int null constraint FK_CIN_CIN_AV references TM_CIN_Client_Invoice(cin_id);


------------------- 2017-06-13 -----------------
alter table TR_THF_Text_Header_Footer add thf_cin_penality ntext null
alter table TR_THF_Text_Header_Footer add thf_cin_discount_for_prepayment ntext null


------------------- 2017-06-14 -----------------
alter table TM_CII_ClientInvoice_Line add cii_av_id int null constraint FK_CII_CII_AV references TM_CII_ClientInvoice_Line(cii_id)

------------------- 2017-06-15 -----------------
alter table TR_SPR_Supplier_Product add spr_comment nvarchar(2000) null
alter table TR_SPR_Supplier_Product alter column spr_price_1_100			decimal(16,4) null
alter table TR_SPR_Supplier_Product alter column spr_price_100_500			decimal(16,4) null
alter table TR_SPR_Supplier_Product alter column spr_price_500_plus			decimal(16,4) null
	

-------------------  2017-06-16 ----------------
create table TM_CPY_ClientInvoice_Payment
(
	cpy_id					int identity(1,1)	primary key,
	cin_id					int	not null		constraint FK_CPY_CIN	references TM_CIN_Client_Invoice(cin_id),
	cpy_amount				decimal(16,4)		not null,
	cpy_d_create			datetime			not null,
	cpy_file				nvarchar(1000)		null,
)

	
-------------------------------------------------------------------------------
------    库存信息管理       2017-06-16   --------------------------------------
-------------------------------------------------------------------------------

-- 需要使用 bank account 表


---------- 购买意向表
create table TM_PIN_Purchase_Intent
(
	pin_id					int identity (1,1)	primary key,
	pin_code				nvarchar(50)		not null,
	pin_name				nvarchar(1000)		null,
	pin_inter_comment		nvarchar(4000)		null,
	pin_supplier_comment	nvarchar(4000)		null,
	soc_id					int not null		constraint FK_PIN_SOC	references TR_SOC_Society(soc_id),
	pin_d_creation			datetime			not null,
	pin_d_update			datetime			not null,
	pin_creator_id			int	not null		constraint FK_PIN_USR_CREATOR	references TM_USR_User(usr_id),
)

---------- 购买意向行
create table TM_PIL_PurchaseIntent_Lines
(
	pil_id					int identity(1,1)	primary key,
	pin_id					int not null		constraint FK_PIL_PIN	references TM_PIN_Purchase_Intent(pin_id),
	prd_id					int	not null		constraint FK_PIL_PRD	references TM_PRD_Product(prd_id),
	pit_id					int not null		constraint FK_PIL_PIT	references dbo.TM_PIT_Product_Instance(pit_id),
	pil_order				int	not null,
	pil_quantity			int	not null,
	pil_description			nvarchar(1000) null
)

---------- 文件类型
create table TR_DTP_Document_Type
(
	dtp_id					int identity(1,1)	primary key,
	dtp_name				nvarchar(200)		not null
)

---------- 文件存储
create table TI_DOC_Document
(
	doc_id					int	identity(1,1)	primary key,
	dtp_id					int	not null		constraint FK_DOC_DTP references 	TR_DTP_Document_Type(dtp_id),
	doc_path				nvarchar(2000)		not null,
	doc_name				nvarchar(100)		not null,
	doc_description			nvarchar(1000)		null
)



---------- 采购订单
create table TM_SOD_Supplier_Order
(
	sod_id					int	identity(1,1)	primary key,
	sup_id					int	not null		constraint FK_SOD_SUP	references TM_SUP_Supplier(sup_id),
	sco_id					int null			constraint FK_SOD_SCO	references TM_SCO_Supplier_Contact(sco_id),
	sod_inter_comment		nvarchar(4000)		null,
	sod_supplier_comment	nvarchar(4000)		null,
	soc_id					int	not null		constraint FK_SOD_SOC	references TR_SOC_Society(soc_id),
	sod_code				nvarchar(50)		not null,
	sod_name				nvarchar(1000)		null,
	sod_d_creation			datetime			not null,
	sod_d_update			datetime			not null,
	usr_creator_id			int not null		constraint FK_SOD_USR_CREATOR references TM_USR_User(usr_id),
	sod_file				nvarchar(2000)		null,
	pin_id					int null			constraint FK_SOD_PIN	references TM_PIN_Purchase_Intent(pin_id),
	sod_discount_amount		decimal(16,4)		null,
	cur_id					int not null		constraint FK_SOD_CUR	references TR_CUR_Currency(cur_id)
)

---------- 采购订单行
create table TM_SOL_SupplierOrder_Lines
(
	sol_id					int	identity(1,1)	primary key,
	sod_id					int	not null		constraint FK_SOL_SOD	references TM_SOD_Supplier_Order(sod_id),
	sol_order				int	not null,
	sol_description			nvarchar(4000)		null,
	sol_quantity			int	not null,
	prd_id					int	not null		constraint FK_SOL_PRD	references TM_PRD_Product(prd_id),
	pit_id					int not null		constraint FK_SOL_PIT	references TM_PIT_Product_Instance(pit_id),
	pil_id					int null			constraint FK_SOL_PIL	references TM_PIL_PurchaseIntent_Lines(pil_id),
	sol_unit_price			decimal(16,4)		null,
	sol_discount_amount		decimal(16,4)		null,
	sol_total_price			decimal(16,4)		null,
	sol_price_with_dis		decimal(16,4)		null
)

---------- 采购发票
create table TM_SIN_Supplier_Invoice
(
	sin_id					int	identity(1,1)	primary key,
	sup_id					int	not null		constraint FK_SIN_SUP	references TM_SUP_Supplier(sup_id),
	sco_id					int null			constraint FK_SIN_SCO	references TM_SCO_Supplier_Contact(sco_id),
	sin_inter_comment		nvarchar(4000)		null,
	sin_supplier_comment	nvarchar(4000)		null,
	soc_id					int	not null		constraint FK_SIN_SOC	references TR_SOC_Society(soc_id),
	sin_code				nvarchar(50)		not null,
	sin_name				nvarchar(1000)		null,
	sin_d_creation			datetime			not null,
	sin_d_update			datetime			not null,
	usr_creator_id			int not null		constraint FK_SIN_USR_CREATOR references TM_USR_User(usr_id),
	sin_file				nvarchar(2000)		null,
	sod_id					int null			constraint FK_SIN_SOD	references TM_SOD_Supplier_Order(sod_id),
	sin_discount_amount		decimal(16,4)		null,
	cur_id					int not null		constraint FK_SIN_CUR	references TR_CUR_Currency(cur_id),
	sin_is_paid				bit	not null,
	sin_bank_receipt_file	nvarchar(2000)		null,
	sin_bank_receipt_number	nvarchar(100)		null,
	sin_start_production	bit	null,
	sin_d_start_production	datetime			null,
	sin_d_complete_production_pre	datetime	null,
	sin_d_complete_production		datetime	null,
	sin_complete_production	bit	null
)

---------- 采购发票行
create table TM_SIL_SupplierInvoice_Lines
(
	sil_id					int	identity(1,1)	primary key,
	sin_id					int	not null		constraint FK_SIL_SIN	references TM_SIN_Supplier_Invoice(sin_id),
	sil_order				int	not null,
	sil_description			nvarchar(4000)		null,
	sil_quantity			int	not null,
	prd_id					int	not null		constraint FK_SIL_PRD	references TM_PRD_Product(prd_id),
	pit_id					int not null		constraint FK_SIL_PIT	references TM_PIT_Product_Instance(pit_id),
	sol_id					int null			constraint FK_SIL_SOL	references TM_SOL_SupplierOrder_Lines(sol_id),
	sil_unit_price			decimal(16,4)		null,
	sil_discount_amount		decimal(16,4)		null,
	sil_total_price			decimal(16,4)		null,
	sil_price_with_dis		decimal(16,4)		null
)

----------- 将供货商表加添货代进去
create table TR_STY_Supplier_Type
(
	sty_id					int identity(1,1)	primary key,
	sty_description			nvarchar(100)		not null
)
GO

----------------------------------------------------------------------------------------
---------------****************** 调用insert data ***********---------------------------
----------------------------------------------------------------------------------------
alter table TM_SUP_Supplier add sty_id	int not null constraint FK_SUP_STY references TR_STY_Supplier_Type(sty_id) default 1

---------- 物流表 这里包含 从国内进口货物 以及在法国发货 -------
create table TM_LGS_Logistic
(
	lgs_id					int identity(1,1)	primary key,
	lgs_code				nvarchar(50)		not null,
	lgs_name				nvarchar(1000)		null,
	lgs_is_send				bit					not null,
	sup_id					int		 null		constraint FK_LGS_SUP references TM_SUP_Supplier(sup_id), ------ 货代，物流公司，国内，法国， 可以没有物流公司，自己发货
	lgs_d_send				datetime			null,
	lgs_d_arrive_pre		datetime			null,
	lgs_d_arrive			datetime			null,
	lgs_comment				nvarchar(4000)		null,
	soc_id					int	not null		constraint FK_LGS_SOC references TR_SOC_Society(soc_id),
	lgs_file				nvarchar(2000)		null,
	lgs_guid				uniqueidentifier	null,		-- 物流批次,
	lgs_is_purchase			bit					not null,	-- 进货还是送货
)

---------- 物流表行 ------------
create table TM_LGL_Logistic_Lines
(
	lgl_id					int identity(1,1)	primary key,
	lgl_guid				uniqueidentifier	null,	-- 物流行批次
	lgs_id					int not null		constraint FK_LGL_LGS references TM_LGS_Logistic(lgs_id),
	lgs_quantity			int	not null,
	lgs_unit_price			decimal(16,4)		null,
	lgs_total_price			decimal(16,4)		null,
	lgs_prd_name			nvarchar(200)		null,
	lgs_prd_ref				nvarchar(200)		null,
	lgs_description			nvarchar(1000)		null,
	prd_id					int					null	constraint FK_LGL_PRD	references TM_PRD_Product(prd_id),
	pit_id					int					null	constraint FK_LGL_PIT	references TM_PIT_Product_Instance(pit_id)
)


create table TM_WHS_WareHouse
(
	whs_id					int	identity(1,1)	primary key,
	whs_name				nvarchar(100)		not null,
	whs_code				nvarchar(100)		null,
	whs_address1			nvarchar(200)		null,
	whs_address2			nvarchar(200)		null,
	whs_postcode			nvarchar(50)		null,
	whs_city				nvarchar(200)		null,
	whs_country				nvarchar(200)		null,
	whs_volume				int					null
)

create table TM_SHE_Shelves
(
	she_id					int	identity(1,1)	primary key,
	whs_id					int	not null		constraint FK_SHE_WHS	references TM_WHS_WareHouse(whs_id),
	she_code				nvarchar(100)		null,
	she_floor				int	null, -- 仓库中内的所在层
	she_line				int null, -- 仓库内的所在行
	she_row					int null, -- 仓库内的所在列
)


------ 仓库中的商品，一旦物流单入库，将会在该表中建立相应多的行 -- 此表已于2017-09-22删除
create table TR_PIW_Product_In_WareHouse
(
	piw_id					int identity(1,1)	primary key,
	she_id					int					null constraint FK_PIW_SHE references TM_SHE_Shelves(she_id), -- 存放位置
	piw_d_storage			datetime			not	null,	-- 入库时间
	piw_is_library_out		bit					not null,	-- 是否出库，一旦出库，将减去库存
	piw_d_library_out		datetime			null,		-- 出库时间
	prd_name				nvarchar(100)		null,		-- 如果没有对应pit的时候，输入货物名称
	prd_id					int					null constraint FK_PIW_PRD references TM_PRD_product(prd_id),
	pit_id					int					null constraint FK_PIW_PIT references TM_PIT_Product_Instance(pit_id),
	piw_guid				uniqueidentifier	null,		-- 每一个物品所对应一个guid，用来追溯物品，相当于piw_id
	piw_is_lend				bit					null,		-- 物品是否外借，并不是出售，外借出去后，不减去库存，但显示已外借
	piw_d_lend				datetime			null,		-- 外借时间
	piw_d_lend_return_pre	datetime			null,		-- 外借后，预计归还时间
	piw_is_return_client	bit					null,		-- 如果是外借，客户是否归还，如果是已出库（已销售），此处为是否退货
	piw_d_return_client		datetime			null,		-- 如果是外借，客户归还时间，如果是已出库（已销售），此处为退货时间
	piw_is_destroy			int					null,		-- 是否销毁
	piw_d_descroy			int					null,		-- 销毁时间
	piw_is_return_supplier	bit					null,		-- 是否给供应商退货
	piw_d_return_supplier	datetime			null,		-- 给供应商退货时间
	piw_is_damaged			bit					null,		-- 是否损坏
	piw_d_damaged			datetime			null,		-- 损坏时间
)


----------------------- 2017-06-19 ----------------
alter table TM_CIN_Client_Invoice add cin_rest_to_pay decimal(16,4) null

----------------------- 2017-06-22 ----------------
alter table TM_PIN_Purchase_Intent add pin_closed bit not null

----------------------- 2017-06-23 ----------------
alter table TM_SOD_Supplier_Order add vat_id int not null constraint FK_SOD_VAT references TR_VAT_Vat(vat_id) default 1
alter table TM_SOL_SupplierOrder_Lines add vat_id int not null constraint FK_SOL_VAT references TR_VAT_Vat(vat_id)
alter table TM_SIN_Supplier_Invoice add vat_id int not null constraint FK_SIN_VAT references TR_VAT_Vat(vat_id)
alter table TM_SIL_SupplierInvoice_Lines add vat_id int not null constraint FK_SIL_VAT references TR_VAT_Vat(vat_id)
alter table TM_SOL_SupplierOrder_Lines add sol_total_crude_price decimal(16,4) null
alter table TM_SIL_SupplierInvoice_Lines add sil_total_crude_price decimal(16,4) null

---------------------- 2017-06-26 --------------------
alter table TM_SIN_Supplier_Invoice add bac_id		int null constraint FK_SIN_BAC references TR_BAC_Bank_Account(bac_id)



---------------------- 2017-07-05---------------------
---- 删除不用的 TVA
delete from TR_VAT_Vat
where vat_vat_rate = 19.6


alter table TR_BAC_Bank_Account add bac_rib_agency_adr nvarchar(200) null
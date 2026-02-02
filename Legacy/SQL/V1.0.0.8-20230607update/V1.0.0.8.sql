-- 20230607 开会，需要加的内容

alter table TM_SOD_Supplier_Order add sod_d_exp_delivery datetime null -- 订单的预交期

--- 文件类型，加入表名，列明，ID，以及存储位置
alter table TR_DTP_Document_Type add dtp_tab_name nvarchar(100) null -- 对应表名
alter table TR_DTP_Document_Type add dtp_foreign_name nvarchar(50) null  -- 对应外键名称
alter table TR_DTP_Document_Type add dtp_file_path nvarchar(200) null -- 存储位置
alter table TI_DOC_Document add doc_d_update datetime not null  -- 文件更新日期
alter table TI_DOC_Document add doc_foreign_id int null -- 外键
GO

insert into TR_DTP_Document_Type 
values(N'Logistics', N'TM_LGS_Logistic',N'lgs_id',N'LogisticsFile');


-- 状态表，可多表使用
create table TR_STT_Status
(
	stt_id				int				identity(1,1)	primary key,
	stt_order			int				not null,
	stt_value			nvarchar(100)	not null,	-- 内容
	stt_tab_name		nvarchar(100)	not null,
	stt_actived			bit				not null,
	stt_description		nvarchar(200)	null
)

Go

insert into TR_STT_Status
values (1,N'未生产',N'TM_SOD_Supplier_Order',1,null),
(2,N'生产中',N'TM_SOD_Supplier_Order',1,null),
(3,N'等款发货',N'TM_SOD_Supplier_Order',1,null),
(4,N'待发货',N'TM_SOD_Supplier_Order',1,null),
(5,N'运输中',N'TM_SOD_Supplier_Order',1,null),
(6,N'已到港',N'TM_SOD_Supplier_Order',1,null),
(7,N'归档',N'TM_SOD_Supplier_Order',1,null);


alter table TM_SOD_Supplier_Order add stt_id int null constraint FK_SOD_STT references TR_STT_Status(stt_id)


-- 一个循环的例子
--declare   @itemnumber   int    -- 定义需要循环的次数
--declare   @tagint   int   -- 定义标志字段，用于结束循环
--set   @tagint = 1   
--select   @itemnumber   =  1131
--	if ( @itemnumber > 0 )
--	begin
--	while   @tagint <= @itemnumber
--		begin
--			update TM_SOD_Supplier_Order
--			set stt_id = (floor(rand()*6)+1)
--			where sod_id =@tagint
--			set   @tagint = @tagint + 1
--		end
--	end



----- 以上内容于 20230612 在服务器上运行


----- 20230930 插入港币到数据库
insert into TR_CUR_Currency values('HKD',1,'HK$',1);


alter table TM_CIN_Client_Invoice add cin_margin decimal(16,4) null;
----- 以上内容以 20231003 在服务器上运行


---- 20231101 client 表加入pdfversion
alter table tm_cli_client add cli_pdf_version nvarchar(20) null

--- 20231101 以上内容已经在服务器上面运行了


--- 20231124 加入导入dfo xml项目
alter table TM_DFO_Delivery_Form add dfo_import_field xml null
--- 20231125 以上内容已经在服务器上面运行了

--- 20231211 导入dfo 加入行号
alter table TM_DFO_Delivery_Form add dfo_gdoc_nb int null
--- 20231212 以上内容已经在服务器上面运行了


--- 20240705 修改society银行信息
alter table TR_SOC_Society alter column soc_rib_address_2 nvarchar(200) null
--- 20240705 以上内容已经在服务器上面运行了




--- 20240727 active TEXT line type
UPDATE TR_LTP_Line_Type
SET ltp_isactive = 1
WHERE ltp_id = 2 OR LTP_ID = 3

UPDATE TR_LTP_Line_Type
SET ltp_isactive = 0
WHERE ltp_id = 4
GO
--- 20240727 The above content has been run on the server



--- 20240628 add product kit table 
-- this table stock product kit infocreate table TR_PKI_Product_Kit(	pki_id				int identity(1,1)	primary key,	pki_name			nvarchar(300)		not null,	pki_description		nvarchar(2000)		null,	pki_actived			bit					not null,	pki_d_creation		datetime			not null)-- product stock in this table for every product kitcreate table TR_PPK_Product_PKI(	ppk_id				int identity(1,1)	primary key,	pki_id				int not null constraint FK_PPK_PKI,	prd_id				int	not null constraint FK_PPK_PRD,	ppk_order			int not null,	ppk_actived			bit not null)
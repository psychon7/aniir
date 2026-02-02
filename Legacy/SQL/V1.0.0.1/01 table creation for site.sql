
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
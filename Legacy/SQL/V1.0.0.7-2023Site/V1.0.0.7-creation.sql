/**************************************************************************/
/**************************************************************************/
/*		20230216 网站客户在注册后，自动在收藏WLS这个表里面插入一行			  */
/**************************************************************************/
/**************************************************************************/
create table TS_WLS_Wishlist
(
	wls_id			int				identity(1,1)	primary key,
	scl_id			int				not null constraint FK_WLS_SCL references TS_SCL_Site_Client(scl_id),
	wls_d_creation	datetime		not null,
	wls_is_actived	bit				not null,
	wls_d_update	datetime		not null, /* 更新时间，没操作一次，更新一下 */
)

/*	收藏行	*/
create table TS_WLL_Wishlist_line
(
	wll_id			int				identity(1,1)	primary key,
	wls_id			int				not null constraint FK_WLL_WLS references TS_WLS_Wishlist(wls_id),
	wll_d_add		datetime		not null, /* 添加该行的日期 */
	prd_id			int				not null, /* 这个是产品ID，不是外键，放置产品被删除，但是如果产品删除了，该行就显示产品已下架 */
	pit_id			int				not null, /* 同上 */
	wll_prd_name	nvarchar(200)	not null, /* 直接用prd_name 防止一旦产品被删除了，就不知道这个是什么产品了 */
)


/****************************************/
/*			20230216-购物车				*/
/*	用户注册后，直接新建一个空的购物车		*/
/****************************************/
create table TS_SCT_Shopping_Cart
(
	sct_id			int				identity(1,1)	primary key,
	scl_id			int				not null constraint FK_SCT_SCL references TS_SCL_Site_Client(scl_id),
	sct_d_creation	datetime		not null,
	sct_is_actived	bit				not null
)

/*	购物车行		*/
create table TS_SCLN_Shopping_Cart_Line
(	
	scln_id			int				identity(1,1)	primary key,
	sct_id			int				not null constraint FK_SCLN_SCT references TS_SCT_Shopping_Cart(sct_id),
	scln_d_add		datetime		not null, /* 添加该行的日期 */
	prd_id			int				not null, /* 这个是产品ID，不是外键，放置产品被删除，但是如果产品删除了，该行就显示产品已下架 */
	pit_id			int				not null, /* 同上 */
	scln_prd_name	nvarchar(200)	not null, /* 直接用prd_name 防止一旦产品被删除了，就不知道这个是什么产品了 */
	scln_qty		int				not null, /* 数量 */
	scln_comment	nvarchar(400)	null,     /* 注意，这行，在前端的时候，需要加长度限制 */
)

/* 测试数据 */

insert  into TM_CAT_Category( cat_name, cat_order, cat_is_actived, cat_display_in_menu, cat_display_in_exhibition, soc_id )
values('New PRODUCTS',1,1,0,0,1)



insert into TR_PCA_Product_Category(prd_id, cat_id)
values(841,25),
(842,25),
(843,25),
(844,25),
(845,25)


insert  into TM_CAT_Category( cat_name, cat_order, cat_is_actived, cat_display_in_menu, cat_display_in_exhibition, soc_id )
values('MAIN PUB',1,1,0,0,1)



insert into TR_PCA_Product_Category(prd_id, cat_id)
values(841,26),
(842,26),
(843,26),
(844,26),
(845,26)




----- 以上内容于 20230612 在服务器上运行


--- 20231029 更改wishlist line 和 shopping cart line增加三个属性，对于不存在的色温，功率，电源同样可以接受

alter table TS_WLL_Wishlist_line add wll_attr1 nvarchar(500) null -- 色温
alter table TS_WLL_Wishlist_line add wll_attr2 nvarchar(500) null -- 功率
alter table TS_WLL_Wishlist_line add wll_attr3 nvarchar(500) null -- 电源

alter table TS_SCLN_Shopping_Cart_Line add scln_attr1 nvarchar(500) null -- 色温
alter table TS_SCLN_Shopping_Cart_Line add scln_attr2 nvarchar(500) null -- 功率
alter table TS_SCLN_Shopping_Cart_Line add scln_attr3 nvarchar(500) null -- 电源

--- 20231101 以上内容已经在服务器上面运行了



alter table TS_WLL_Wishlist_line ALTER COLUMN pit_id int null
GO
alter table TS_SCLN_Shopping_Cart_Line alter column pit_id int null
GO


-- 给所有没有wishlist 的客户建立一个wishlist ，同时给所有没有购物车的用户，建一个购物车
DECLARE @sclId int 
DECLARE My_Cursor CURSOR --定义游标
FOR (SELECT scl_id FROM dbo.TS_SCL_Site_Client) --查出需要的集合放到游标中
OPEN My_Cursor; --打开游标
FETCH NEXT FROM My_Cursor into @sclId ; --读取第一行数据
WHILE @@FETCH_STATUS = 0
    BEGIN
        --UPDATE dbo.Table SET 字段1 =‘***’ 　WHERE CURRENT OF My_Cursor; --更新
        --DELETE FROM dbo.Table WHERE CURRENT OF My_Cursor; --删除
        select @sclId
        --select scl_id
        
        insert into TS_WLS_Wishlist values (@sclId,GETDATE(),1,GETDATE());
        insert into TS_SCT_Shopping_Cart values (@sclId,GETDATE(),1);
        
        FETCH NEXT FROM My_Cursor; --读取下一行数据
    END
CLOSE My_Cursor; --关闭游标
DEALLOCATE My_Cursor; --释放游标
Go

alter table TM_CPL_Cost_Plan add cpl_fromsite bit null -- 从网站建立的devis
GO
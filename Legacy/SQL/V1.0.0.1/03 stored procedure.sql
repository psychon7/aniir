IF EXISTS (SELECT name FROM sysobjects WHERE name = 'PS_GetPrdByRef' AND type = 'P')   
	DROP PROCEDURE [dbo].PS_GetPrdByRef
GO
/**************************************************/
/**********     2018-02-19 by Chenglin ************/
/**************************************************/
Create Procedure [dbo].[PS_GetPrdByRef]
(
	@searchstr nvarchar(200),
	@easysearch bit
)
as
begin
select distinct top 10
prd_id
from TM_PRD_Product prd
where 
(@easysearch = 0 and 
	(prd.prd_ref like '%'+@searchstr+'%'
	or prd.prd_tmp_ref like '%'+@searchstr+'%'
	or prd.prd_name like '%'+@searchstr+'%'
	or prd.prd_code like '%'+@searchstr+'%'
	or prd.prd_sub_name like '%'+@searchstr+'%'))
or (@easysearch = 1  and prd.prd_ref like @searchstr+'%')

End
GO

---------- 2018-02-19 以上内容已经在服务器上面运行

create nonclustered index idxn_prd_ref
on TM_PRD_Product(prd_ref)




IF EXISTS (SELECT name FROM sysobjects WHERE name = 'PS_GetPrdByRef' AND type = 'P')   
	DROP PROCEDURE [dbo].PS_GetPrdByRef
GO
/**************************************************/
/******** update 2018-03-01 by Chenglin ***********/
/**************************************************/
Create Procedure [dbo].[PS_GetPrdByRef]
(
	@searchstr nvarchar(200),
	@easysearch bit
)
as
begin

declare @res table
(
prd_id int
)

if @easysearch = 1
insert into @res
select distinct top 20
prd_id
from TM_PRD_Product prd
where 
prd.prd_ref like @searchstr+'%'
else
insert into @res
select distinct top 20
prd_id
from TM_PRD_Product prd
where 
	(prd.prd_ref like '%'+@searchstr+'%'
	or prd.prd_tmp_ref like '%'+@searchstr+'%'
	or prd.prd_name like '%'+@searchstr+'%'
	or prd.prd_code like '%'+@searchstr+'%'
	or prd.prd_sub_name like '%'+@searchstr+'%')

select * from @res

End
Go

---------- 2018-03-01 以上内容已经在服务器上面运行



-----------------------------------------------------------
IF EXISTS (SELECT name FROM sysobjects WHERE name = 'PS_DeleteDuplicateClients' AND type = 'P')   
	DROP PROCEDURE [dbo].PS_DeleteDuplicateClients
GO
/**************************************************/
/******** create 2018-05-15 by Chenglin ***********/
/**************************************************/
Create Procedure [dbo].[PS_DeleteDuplicateClients]
(
	@SCliId int,
	@DCliId int,
	@pwd nvarchar(1000)
)
as
begin


--declare @SCliId int = 274
--declare @DCliId int = 236

if @pwd = 'test'
begin
-------- cco
	update TM_CCO_Client_Contact
	set cli_id = @SCliId
	where cli_id = @DCliId

----------- prj
	update TM_PRJ_Project
	set cli_id = @SCliId
	where cli_id = @DCliId


---------- cpl
	update TM_CPL_Cost_Plan
	set cli_id = @SCliId
	where cli_id = @DCliId

----------- cod
	update TM_COD_Client_Order
	set cli_id = @SCliId
	where cli_id = @DCliId

----------- dfo
	update TM_DFO_Delivery_Form
	set cli_id = @SCliId
	where cli_id = @DCliId

------------ cin
	update TM_CIN_Client_Invoice
	set cli_id = @SCliId
	where cli_id = @DCliId

------------- scl
	update TS_SCL_Site_Client
	set cli_id = @SCliId
	where cli_id = @DCliId

	delete from TM_CLI_CLient
	where cli_id = @DCliId
End

End
Go

-----------------------------------------------------------
---------- 2018-05-15 以上内容已经在服务器上面运行
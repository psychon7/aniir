-- delete one invoice 
declare @deleteOnlyInv int = 1
declare @cinCode nvarchar(100) = 'xxxxx'
declare @cinId int, @dfoId int, @cplId int
---------------- cin --------------------
select 
@cinId = cin_id
from
TM_CIN_Client_Invoice
where cin_code = @cinCode

delete from TM_CII_ClientInvoice_Line
where cin_id = @cinId

---------------- end cin --------------------

---------------- dfo --------------------
declare @dfoIds table 
(id int)

insert into @dfoIds
select dfo_id 
from TR_DCI_DeliveryForm_ClientInvoice
where cin_id = @cinId 

insert into @dfoIds
select dfo_id 
from TM_CIN_Client_Invoice
where cin_id = @cinId 

delete from TR_DCI_DeliveryForm_ClientInvoice
where cin_id = @cinId

delete from TM_CIN_Client_Invoice
where cin_id  = @cinId


delete from TR_DCI_DeliveryForm_ClientInvoice
where cin_id = @cinId

delete from TM_DFL_DevlieryForm_Line
where dfo_id in
(select id from @dfoIds) 


---------------- cod --------------------
declare @cplIds table (id int)
declare @codIds table (id int)

insert into @codIds
select cod_id from TM_DFO_Delivery_Form
where dfo_id in
(select id from @dfoIds) 

delete from TM_DFO_Delivery_Form
where dfo_id in 
(select id from @dfoIds) 
---------------- end dfo --------------------


---------------- cod --------------------
insert into @cplIds
select cpl_id from TM_COD_Client_Order
where cod_id in (select * from @codIds)

declare @colIds table (id int)

insert into @colIds
select col_id  from TM_COL_ClientOrder_Lines
where cod_id in (select * from @codIds)

delete from TI_PSR_PRE_Shipping_Receiving_Line
where col_id in (select * from @colIds)


select * from @codIds
--select * from TM_COL_ClientOrder_Lines
--where cod_id in (select * from @codIds)


--select * from TM_COL_ClientOrder_Lines
--where cod_id in (select * from @codIds)

delete from TM_COL_ClientOrder_Lines
where cod_id in (select * from @codIds)

delete from TM_COD_Client_Order
where cod_id in (select * from @codIds)
----------------- end cod ------------------

----------------- cpl ----------------------

delete from TM_CLN_CostPlan_Lines
where cpl_id in (select * from @cplIds)

delete from TM_CPL_Cost_Plan
where cpl_id in (select * from @cplIds)

--select 1/0
----------------- end cpl ------------------

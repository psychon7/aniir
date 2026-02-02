declare @cli_id2delete int  = 0
declare @cli_id_destinaire int = 0


declare @old_ccoids table
(
	cco_id int
)

-- get cco_ids
insert into @old_ccoids
select cco_id from TM_CCO_Client_Contact
where cli_id = @cli_id2delete

-- set new cli_id to cco_id
update TM_CCO_Client_Contact
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- prj
update TM_PRJ_Project
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- costplan
update TM_CPL_Cost_Plan
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- client order
update TM_COD_Client_Order
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- delivery form
update TM_DFO_Delivery_Form
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- cin
update TM_CIN_Client_Invoice
set cli_id = @cli_id_destinaire
where cli_id = @cli_id2delete

-- cpw mot de passe de site
declare @scl_id int
set @scl_id = (select scl_id from TS_SCL_Site_Client where cli_id = @cli_id2delete)

delete TS_CPW_Client_Password
where scl_id = @scl_id

-- scl
delete TS_SCL_Site_Client
where cli_id = @cli_id2delete

-- client
delete TM_CLI_CLient
where cli_id = @cli_id2delete



insert into TR_CST_CostPlan_Statut
values (N'Payé de STRIPE',1),
(N'Annulé et rembourssé de STRIPE',1);

alter table TM_CPL_COST_PLAN add cpl_stripe_chargeid nvarchar(200) null;

-- key project only in X mode
alter table TM_CPL_COST_PLAN add cpl_key_project bit null;
alter table TM_COD_Client_Order add cod_key_project bit null;
alter table TM_CIN_Client_Invoice add cin_key_project bit null;

-- The above content has been executed in all databases on 2024-12-13. Please do not execute it again.


alter table TR_BAC_Bank_Account alter column bac_bank_name nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_bank_adr nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_account_number nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_bic nvarchar(200) not null
alter table TR_BAC_Bank_Account alter column bac_iban nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_rib_bank_code nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_rib_agence_code nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_rib_account_number nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_rib_key nvarchar(400) null
alter table TR_BAC_Bank_Account alter column bac_account_owner nvarchar(400) not null
alter table TR_BAC_Bank_Account add bac_title nvarchar(400) null
GO


insert into TR_BAC_Bank_Account
select 
soc_rib_domiciliation_agency,
soc_rib_address	,
null,
soc_rib_code_bic	,
soc_rib_code_iban	,
soc_rib_bank_code	,
soc_rib_agence_code	,
soc_rib_account_number	,
soc_rib_key	,
soc_rib_name,
5,
soc_id,
soc_id,
null,
soc_rib_abbre
from TR_SOC_Society
GO

insert into TR_BAC_Bank_Account
select 
soc_rib_domiciliation_agency_2,
soc_rib_address_2,
null,
soc_rib_code_bic_2,
soc_rib_code_iban_2,
soc_rib_bank_code_2,
soc_rib_agence_code_2,
soc_rib_account_number_2,
soc_rib_key_2,
soc_rib_name_2,
5,
soc_id,
soc_id,
null,
soc_rib_abbre_2
from TR_SOC_Society
GO


-- The above content has been executed in all databases on 2025-02-16. Please do not execute it again.
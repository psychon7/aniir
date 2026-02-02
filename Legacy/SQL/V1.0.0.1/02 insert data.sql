insert into TR_COR_Color
values
('Rouge','',210,17,27,1),
('Vert','',76,165,50,1),
('Bleu','',16,95,168,1),
('Gris','',144,144,144,1);

declare @norme nvarchar(500)
set @norme = 'NORMES :' + CHAR(13)+CHAR(10) +
'EN 55015 : 2013, EN 61547 : 2009, EN 61000-3-2 : 2006/A1 : 2009/A2 : 2009' + CHAR(13)+CHAR(10) +
'EN 61000-3-3 : 2013, EN 60598-2-1 : 1989' + CHAR(13)+CHAR(10) +
'EN 60598-1 : 2008 + A11 : 2009, EN 62493 : 2010, EN 62471 :  2008 ' + CHAR(13)+CHAR(10) +
'EN 60 695-2-12, EN55015 : 2013, EN61547 : 2009' + CHAR(13)+CHAR(10) +
'EN61000 : 3-2 : 2006 + A1 : 2009 + A2 : 2009' + CHAR(13)+CHAR(10) +
'EN61000 : 3-3 : 2013'

update TM_PTY_Product_Type
set pty_standards= @norme



------------------ 2017-07-29 -----------------

update TR_PCO_Payment_Condition
set pco_day_additional = 0
where pco_id = 4

update TR_PCO_Payment_Condition
set pco_day_additional = 10
where pco_id = 5

update TR_PCO_Payment_Condition
set pco_day_additional = 15
where pco_id = 6

update TR_PCO_Payment_Condition
set pco_day_additional = 0
where pco_id = 7

update TR_PCO_Payment_Condition
set pco_day_additional = 10
where pco_id = 8

update TR_PCO_Payment_Condition
set pco_day_additional = 15
where pco_id = 9

update TR_PCO_Payment_Condition
set pco_end_month = 0
where pco_id = 10


-----////////////////////////////// 以上内容已经在 2017-08-30 执行

------------------- 2017-08-31 update product
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1000TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1001TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1002TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1003TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1004TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1005TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1006TBL'
update TM_PRD_Product set prd_name = 	'TUBELED'	where prd_ref  =	'EV1007TBL'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1008TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1009TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1010TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1011TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1012TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1013TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1014TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1015TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1016TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1017TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1018TBT'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1019TBT'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1050HBB'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1051HBB'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1052HBB'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1053HBB'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1054HBB'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1060HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1061HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1062HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1063HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1064HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1065HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1066HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1067HBH'
update TM_PRD_Product set prd_name = 	'HIGH BAY'	where prd_ref  =	'EV1068HBH'
update TM_PRD_Product set prd_name = 	'RACK LIGHT'	where prd_ref  =	'EV1070HBL'
update TM_PRD_Product set prd_name = 	'RACK LIGHT'	where prd_ref  =	'EV1071HBL'
update TM_PRD_Product set prd_name = 	'RACK LIGHT'	where prd_ref  =	'EV1072HBL'
update TM_PRD_Product set prd_name = 	'RACK LIGHT'	where prd_ref  =	'EV1073HBL'
update TM_PRD_Product set prd_name = 	'RACK LIGHT'	where prd_ref  =	'EV1074HBL'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1100PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1101PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1102PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1103PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1104PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1105PET'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1110PEL'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1011PEL'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1112PEL'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1120PEH'
update TM_PRD_Product set prd_name = 	'PARK ETANCHE'	where prd_ref  =	'EV1130PEH'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1200PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1201PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1202PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1203PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1204PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1205PHP'
update TM_PRD_Product set prd_name = 	'PROJECTEUR HAUT PUISSANCE'	where prd_ref  =	'EV1206PHP'



-----////////////////////////////// 以上内容已经在 2017-08-31 执行


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




update TR_THF_Text_Header_Footer
set thf_header = 'ECOLED EUROPE'  + CHAR(13)+CHAR(10) +
'29-31 Rue de Lagny' + CHAR(13)+CHAR(10) +
'77181 Le Pin' + CHAR(13)+CHAR(10) +
'Tel. 01 70 93 55 55' + CHAR(13)+CHAR(10) +
'www.ecoled-europe.com'

update TR_THF_Text_Header_Footer
set thf_footer = 
'En espérant que cette offre correspond à vos attentes. Nous sommes à votre disposition pour plus de renseignements.'+ CHAR(13)+CHAR(10) +
CHAR(13)+CHAR(10) +
'Sincères salutations,'+ CHAR(13)+CHAR(10) +
 CHAR(13)+CHAR(10) +
'ECOLED EUROPE'+ CHAR(13)+CHAR(10) +
'ecoledeurope@gmail.com'+ CHAR(13)+CHAR(10) +
'01 70 93 55 55'

update TR_THF_Text_Header_Footer
set thf_cin_header = thf_header

update TR_THF_Text_Header_Footer
set thf_cin_footer = 
'Siren N°75198276000025'+ CHAR(13)+CHAR(10) +
'RCS MEAUX : 751 982 760 00025'+ CHAR(13)+CHAR(10) +
'TVA N° FR86751982760'+ CHAR(13)+CHAR(10) +
 CHAR(13)+CHAR(10) +
'ECOLED EUROPE'+ CHAR(13)+CHAR(10) +
'ecoledeurope@gmail.com'+ CHAR(13)+CHAR(10) +
'01 70 93 55 55'


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


update TR_THF_Text_Header_Footer
set thf_dlv_footer_condition = 
'1) Tout retour non justifié fera l''objet d''une retenue de garantie de 30%.'+ CHAR(13)+CHAR(10) +
'2) Merci de contrôler le contenu de votre livraison dans les 48 heures qui ont suivi la livraison, passé ce délai aucune réclamation ne pourra être acceptée.'


insert into TM_PIT_Product_Instance
([prd_id]
,[pty_id]
,[pit_price]
,[pit_ref]
,[pit_description]
,[pit_prd_info]
,[pit_purchase_price]
,[pit_tmp_ref]
,[pit_inventory_threshold])           

select pit.prd_id
,pit.pty_id
,pit_price
,replace(pit_ref,'N','G')
,pit_description
,pit_prd_info
,pit_purchase_price
,pit_tmp_ref
,pit_inventory_threshold
from TM_PIT_Product_Instance pit
		join TM_PRD_Product prd on pit.prd_id = prd.prd_id
where prd_ref in
(
'X1500',
'X1506',
'X1507',
'X1508',
'X1511',
'X1512',
'X1513'
)
and pit_ref like '%N%'



update TM_PIT_Product_Instance
set pit_ref = REPLACE(pit_ref, '60G','00G') 
where pit_ref like '%0g%'

--------------- 2018-01-08 以上内容已经在服务器上面运行

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


------------------ 2018-02-08
update TR_PCO_Payment_Condition set pco_designation = '30 jours fin de mois' where pco_id = 4
update TR_PCO_Payment_Condition set pco_designation = '30 jours fin de mois le 10' where pco_id = 5
update TR_PCO_Payment_Condition set pco_designation = '30 jours fin de mois le 15' where pco_id = 6
update TR_PCO_Payment_Condition set pco_designation = '45 jours fin de mois' where pco_id = 7
update TR_PCO_Payment_Condition set pco_designation = '45 jours fin de mois le 10' where pco_id = 8
update TR_PCO_Payment_Condition set pco_designation = '45 jours fin de mois le 15' where pco_id = 9

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

update TM_PIT_Product_Instance
set pit_ref = SUBSTRING(pit_ref,1,10) + SUBSTRING(pit_ref,12,2)
where LEN(pit_ref) = 13

------------------  2018-02-09 以上内容已在服务器上运行


insert into TR_DCI_DeliveryForm_ClientInvoice (dfo_id,cin_id)
select dfo.dfo_id,cin_id  from TM_CIN_Client_Invoice cin
	join TM_DFO_Delivery_Form dfo on dfo.cod_id = cin.cod_id	
where cin_id not in(
select cin_id from TR_DCI_DeliveryForm_ClientInvoice)
------------------  2018-04-06 以上内容已在服务器上运行
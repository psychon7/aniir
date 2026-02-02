
Insert into TR_LNG_Language 
values 
('France','FR-fr'),
('United Kingdom','EN-uk'),
('United States','EN-us');

insert into TR_CUR_Currency
values 
('EURO',2,'€', 1),
('GBP',2,'£',1),
('USD',2,'$',1),
('CNY',2,'￥',1),
('ROUBLE RUSSE',1,'₽',1);

-----------------------------------------------------------------------
insert into dbo.TR_MCU_Main_Currency
values(1,1.06672,0.93732,'2017-01-21 19:20:00',1,2),
(2,0.93732,1.06672,'2017-01-21 19:20:00',1,1);

-----------------------------------------------------------------------
insert into TR_SOC_Society
values 
('ECOLED EUROPE',1,1,1,'2017-01-01',null,null,null,1,'10000','EcoLed',null,null,null,null,'29-31 Rue de Lagny',null,'77181','Le Pin','France','01 60 27 26 00',
'75198276000025','751982760 RCS BOBIGNY',null,null,'FR86751982760','www.ecoled-europe.com',1);


insert into TR_ROL_Role
values
('Admin',1),
('Assistant',1),
('Commercial',1),
('Comptable',1);


INSERT INTO [TR_CIV_Civility]
VALUES('Monsieur',1),('Madame',1),('Mademoiselle',1),('Maitre',1);


insert into TM_USR_User
values
(1,'cliu','cFfFeXbW26vdKH4kVMmwQsFHgjnidADVRDFlSC0Z+XY3A/fFRMlQ3UXrVCNP3XNfKYzubAnFC6SRxR6yOYBUUn1eSzgjsEy5Ux9wVQnqT20l5TVK9v80YfpaWM4wXz77','Chenglin','LIU','Admin',1,null,'06 09 27 80 19',null,'lcleader@hotmail.com','CLIU','2017-01-01','2017-01-01',1,'',1,'4 allée louise weiss',null,'93360','Neuilly Plaisance','France',0);

----------------------------------------------

insert into tr_cou_country
values ('France','33','FR/FRA');
GO




-----------------------------------------------
------------- insert commune ------------------
-----------------------------------------------
SET IDENTITY_INSERT TR_REG_Region ON
INSERT INTO TR_REG_Region ([reg_id],[reg_code],[reg_name],[cou_id])
SELECT [reg_id],[reg_code],[reg_name],1
  FROM [EurasiaTours].[dbo].[REG_Region]
SET IDENTITY_INSERT TR_REG_Region OFF
GO


SET IDENTITY_INSERT [TR_DEP_Department] ON
INSERT INTO [TR_DEP_Department]([dep_id],[dep_code],[dep_name],[reg_id])
SELECT [dep_id],[dep_code],[dep_name],[reg_id]
  FROM [EurasiaTours].[dbo].[DEP_Department]
SET IDENTITY_INSERT [TR_DEP_Department] OFF
GO


SET IDENTITY_INSERT TR_CMU_Commune ON
INSERT INTO TR_CMU_Commune ([cmu_id],[cmu_code],[cmu_name],[cmu_postcode],[cmu_insee],[cmu_code_arrondissement],[cmu_code_canton],[cmu_code_commune],[cmu_statut],[cmu_altitude_moyenne],[cmu_longitude],[cmu_latitude],[cmu_superficie],[cmu_population],[cmu_geogla_id],[cmu_geo_shape],[dep_id])
SELECT [cmu_id],[cmu_code],[cmu_name],[cmu_postcode],[cmu_insee],[cmu_code_arrondissement],[cmu_code_canton],[cmu_code_commune],[cmu_statut],[cmu_altitude_moyenne],[cmu_longitude],[cmu_latitude],[cmu_superficie],[cmu_population],[cmu_geogla_id],[cmu_geo_shape],[dep_id]  FROM [EurasiaTours].[dbo].[CMU_Commune]
SET IDENTITY_INSERT TR_CMU_Commune OFF
GO


-----------------------------------------------
---------- end insert commune -----------------
-----------------------------------------------



Insert into TR_PMO_Payment_Mode
values 
('Virement',1),
('Cheque',1),
('Espèce',1);


insert into TR_PCO_Payment_Condition
values
('Comptant',1,0,0,0),
('30 jours nets',1,30,0,0),
('45 jours nets',1,45,0,0),
('30 jours Fin',1,30,30,1),
('30 jours Fin le 10',1,30,40,1),
('30 jours Fin le 15',1,30,45,1),
('45 jours Fin',1,45,30,1),
('45 jours Fin le 10',1,45,40,1),
('45 jours Fin le 15',1,45,45,1),
('60 jours nets',1,60,0,1);

---------------------------------------------------


Insert into TR_VAT_Vat
values 
('20%',20,'TVA S/ACHATS'),
('7%',7,'TVA Collectée 7%'),
('5,5%',5.5,'TVA Collectée 5,5'),
('TVA Auto-Liquidée',0,'TVA Auto-Liquidée'),
('10%',10,'TVA Collectée 10%');



insert into TR_CTY_Client_Type
values 
('Client'),
('Prospect');



insert into tr_act_activity values('Administration',1)
insert into tr_act_activity values('Ind agro-alimentaire',1)
insert into tr_act_activity values('Autre industrie',1)
insert into tr_act_activity values('Assurance',1)
insert into tr_act_activity values('Audiovisuel',1)
insert into tr_act_activity values('Automobile (cons)',1)
insert into tr_act_activity values('Automobile (vente)',1)
insert into tr_act_activity values('Banque',1)
insert into tr_act_activity values('Industrie chimique',1)
insert into tr_act_activity values('Collec.territoriale',1)
insert into tr_act_activity values('Distribution',1)
insert into tr_act_activity values('Energie',1)
insert into tr_act_activity values('Ind. high tech',1)
insert into tr_act_activity values('Tourisme Temp Libre',1)
insert into tr_act_activity values('Ministère',1)
insert into tr_act_activity values('Autre',1)
insert into tr_act_activity values('Particulier',1)
insert into tr_act_activity values('Ind. petrolière',1)
insert into tr_act_activity values('Profession libérale',1)
insert into tr_act_activity values('Santé hopitaux',1)
insert into tr_act_activity values('Service - consulting',1)
insert into tr_act_activity values('Transport',1)



insert into tr_pos_position
values
('RESPONSABLE AGENCE',1),
('RESPONSABLE ACHAT',1),
('RESPONSABLE TRAVAUX',1),
('CHARGÉ D''AFFAIRE',1),
('RESPONSABLE EXPLOITATION',1),
('DIRECTEUR',1),
('ASSISTANTE EXPLOITATION',1),
('RESPONSABLE SITE',1),
('RESPONSABLE MAINTENANCE',1),
('RESPONSABLES TRAVAUX',1),
('DIRECTEUR TECHNIQUE',1),
('ASSISTANTE DIRECTION',1),
('RESPONSABLE TECHNIQUE',1),
('RESPONSABLE AGNCE',1),
('CHEF DE SITE',1),
('DIRECTEUR AGENCE',1),
('CHEF D''EXPLOITATION',1),
('DIRECTEUR CENTRE',1),
('INGÉNIEUR COMMERCIAL',1),
('ASSISTANTE ACHAT',1),
('RESPONSABLES TECHNIQUES',1),
('SERVICE MAINTENANCE',1),
('RESPONSABLE MECANIQUE',1),
('DIRECTION ACHAT',1),
('SERVICE ACHAT',1),
('RESPONSABLE SIE',1),
('RESPONSABLE COMMERCIAL',1),
('SERVICE EXPLOITATION',1),
('SERVICE TECHNIQUE',1),
('COMMERCIAL',1),
('RESPONSABLE CENTRE',1),
('INGÉNIEUR',1),
('ASSISTANTE',1),
('GÉRANT',1),
('CONTREMAITRE',1),
('RESPONSABLE EQUIPE',1),
('CHEF DE CENTRE',1),
('ACHETEUR',1),
('CHEF DE SECTEUR',1);





insert into TR_CST_CostPlan_Statut
values('Encours',1),
('Gagné',1),
('Perdu',1),
('Abandonné',1),
('Annulé',1),
('A Valider',1),
('Cloturé',1);


------------------ 2017-05-25 --------------------------
insert into TR_LTP_Line_Type values 
('Lot','',1),
('Vente','',1),
('Text','',1),
('Variante','',1), -- transport etc.,
('Sous-somme','',1),
('Somme','',1);


------------------ 2017-05-29 --------------------------
insert into TR_THF_Text_Header_Footer
values(null,null,null,null);

update TR_THF_Text_Header_Footer
set thf_header = 'ECOLED EUROPE'  + CHAR(13)+CHAR(10) +
'29-31 Rue de Lagny' + CHAR(13)+CHAR(10) +
'77181 Le Pin' + CHAR(13)+CHAR(10) +
'Tel. 01 64 66 21 71' + CHAR(13)+CHAR(10) +
'www.ecoled-europe.com'

update TR_THF_Text_Header_Footer
set thf_footer = 
'En espérant que cette offre correspond à vos attentes. Nous sommes à votre disposition pour plus de renseignements.'+ CHAR(13)+CHAR(10) +
CHAR(13)+CHAR(10) +
'Sincères salutations,'+ CHAR(13)+CHAR(10) +
 CHAR(13)+CHAR(10) +
'ECOLED EUROPE'+ CHAR(13)+CHAR(10) +
'ecoledeurope@gmail.com'+ CHAR(13)+CHAR(10) +
'01 64 66 21 71'

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
'01 64 66 21 71'


---------------------- 2017-05-30 ---------------
update TR_VAT_Vat
set vat_designation = '19.6%',
vat_description = 'TVA Collectée 19.6%',
vat_vat_rate = 19.6
where vat_id = 5

--------------------- 2017-06-08 ----------------
update TR_THF_Text_Header_Footer
set thf_dlv_footer_condition = 
'1) Tout retour non justifié fera l''objet d''une retenue de garantie de 30%.'+ CHAR(13)+CHAR(10) +
'2) Merci de contrôler le contenu de votre colis dans les 48 heures qui ont suivi la livraison, passé ce délai aucune réclamation ne pourra être acceptée.'


update TR_THF_Text_Header_Footer
set thf_dlv_footer_law = 
'RÉSERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu''au complet paiement du prix par l''acheteur.'+ CHAR(13)+CHAR(10) +
'Notre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1980).'



--------------------- 2017-06-13 -------------------

update TR_THF_Text_Header_Footer
set thf_cin_penality = 'Pénalités de retard (taux annuel) : 8,25%'

update TR_THF_Text_Header_Footer
set thf_cin_discount_for_prepayment = 'Escompte pour paiement anticipé (taux mensuel) : 1,50%'

-------------------- 2017-06-16 ------------------
SET IDENTITY_INSERT TR_DTP_Document_Type ON
insert into TR_DTP_Document_Type
values (1,'Project'),
(2,'Cost Plan'),
(3,'Client Order'),
(4,'Client Invoice'),
(5,'Delivery Form'),
(6,'Supplier'),
(7,'Purchase Intent'),
(8,'Supplier Order'),
(9,'Supplier Invoice'),
(10,'Logistics'),
(11,'Warehouse');
SET IDENTITY_INSERT TR_DTP_Document_Type OFF
Go


insert into TR_STY_Supplier_Type
values('Fournisseur'),
('Transporteur'); -- 货代


---------------------- 2017-07-04 --------------------
insert into TR_ROL_Role
values
('Manager',1);



-------------------- update Norme -----------------



select 
prd_specifications.value('(/PropertyList/Propety[@PropGuid="d6f4986f-83d2-46b0-8b09-ffa5d6cea489"]/@PropValue)[1]','nvarchar(max)')
 from TM_PRD_Product
 
declare @norme nvarchar(500)
set @norme = 'NORMES :' + CHAR(13)+CHAR(10) +
'EN 55015 : 2013, EN 61547 : 2009, EN 61000-3-2 : 2006/A1 : 2009/A2 : 2009' + CHAR(13)+CHAR(10) +
'EN 61000-3-3 : 2013, EN 60598-2-1 : 1989' + CHAR(13)+CHAR(10) +
'EN 60598-1 : 2008 + A11 : 2009, EN 62493 : 2010, EN 62471 :  2008 ' + CHAR(13)+CHAR(10) +
'EN 60 695-2-12, EN55015 : 2013, EN61547 : 2009' + CHAR(13)+CHAR(10) +
'EN61000 : 3-2 : 2006 + A1 : 2009 + A2 : 2009' + CHAR(13)+CHAR(10) +
'EN61000 : 3-3 : 2013'

update TM_PRD_Product set
  prd_specifications.modify('replace value of (/PropertyList/Propety[@PropGuid="d6f4986f-83d2-46b0-8b09-ffa5d6cea489"]/@PropValue)[1] with sql:variable("@norme")')
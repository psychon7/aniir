
------------------  2018-02-13 添加新的角色
insert into TR_ROL_Role
values ('Magasinier',1,39);

declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ImportData' and scr_parent_name = 'Admin'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Album' and scr_parent_name = 'Album'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Calendar' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'edit' and scr_parent_name = 'Calendar'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Category' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCategory' and scr_parent_name = 'Category'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Client' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientApplication' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClient' and scr_parent_name = 'Client'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientInvoice' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientOrderDeliveryFormList' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchClientOrder' and scr_parent_name = 'ClientOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageDownLoad' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PageForPDF' and scr_parent_name = 'Common'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientInvoiceList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'CostPlanClientOrderList' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchCostPlan' and scr_parent_name = 'CostPlan'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'DeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 1, 1, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchDeliveryForm' and scr_parent_name = 'DeliveryForm'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Logistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchLogistics' and scr_parent_name = 'Logistics'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Message' and scr_parent_name = 'Message'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Product' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductAttribute' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'RecommandedProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchAttProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProduct' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SiteProject' and scr_parent_name = 'Product'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Project' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientInvoiceList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectClientOrderList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProjectCostPlanList' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchProject' and scr_parent_name = 'Project'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'PurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchPurchaseIntent' and scr_parent_name = 'PurchaseIntent'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Supplier' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProduct' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierProductSearch' and scr_parent_name = 'Supplier'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierInvoice' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchSupplierOrder' and scr_parent_name = 'SupplierInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SupplierOrder' and scr_parent_name = 'SupplierOrder'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Users' and scr_parent_name = 'Users'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 0, 1, 0, 0, 0, 0)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductInventory' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'SearchVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Shelves' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Warehouse' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'WarehouseVoucher' and scr_parent_name = 'Warehouse'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
----------

select @scrId = scr_id from TR_SCR_Screen where scr_name = 'Default' and scr_parent_name is NULL
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 1, 1, 1, 1, 1, 1, 1, 1)
go

--insert into tr_scr_screen	values 	('ClientInvoiceA','ClientInvoice')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoiceA' and scr_parent_name = 'ClientInvoice'
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right ([scr_id],[rol_id],[rit_read],[rit_valid],[rit_modify],[rit_create],[rit_delete],[rit_active],[rit_cancel],[rit_super_right])
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO


-- update product price normal
update TM_PIT_Product_Instance
set pit_purchase_price = 
spr.spr_price_1_100
from TR_SPR_Supplier_Product spr
	join TM_PIT_Product_Instance pit
	on spr.prd_id = pit.prd_id
where substring(pit_ref,8,1) = 'N'	

-- update product price dimmable
update TM_PIT_Product_Instance
set pit_purchase_price = 
spr.spr_coef_100_500
from TR_SPR_Supplier_Product spr
	join TM_PIT_Product_Instance pit
	on spr.prd_id = pit.prd_id
where substring(pit_ref,8,1) = 'D'	


-- update product price dali
update TM_PIT_Product_Instance
set pit_purchase_price = 
spr.spr_coef_500_plus
from TR_SPR_Supplier_Product spr
	join TM_PIT_Product_Instance pit
	on spr.prd_id = pit.prd_id
where substring(pit_ref,8,1) = 'L'	


---------- 2018-02-13 以上内容已经在服务器上面运行



insert into tr_scr_screen	values 	('ClientInvoiceStatment','ClientInvoice')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientInvoiceStatment' and scr_parent_name = 'ClientInvoice'
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
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO
---------- 2018-02-16 以上内容已经在服务器上面运行



---------- 2018-02-16
insert into tr_scr_screen	values 	('EnterpriseSetting','Admin')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'EnterpriseSetting' and scr_parent_name = 'Admin'
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
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO

alter table TR_SOC_Society add soc_rib_bank_code nvarchar(50) null
alter table TR_SOC_Society add soc_rib_agence_code nvarchar(50) null
alter table TR_SOC_Society add soc_rib_account_number nvarchar(50) null
alter table TR_SOC_Society add soc_rib_key nvarchar(50) null
alter table TR_SOC_Society add soc_rib_domiciliation_agency nvarchar(200) null
---------- 2018-02-19 以上内容已经在服务器上面运行


---------- 2018-02-21
insert into tr_scr_screen	values 	('ClientPrice','Client')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ClientPrice' and scr_parent_name = 'Client'
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
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO
---------- 2018-02-21 以上内容已经在服务器上面运行


---------- 2018-02-27
insert into tr_scr_screen	values 	('ProductExpress','Product')
declare @role nvarchar(250)
declare @scrId int
select @scrId = scr_id from TR_SCR_Screen where scr_name = 'ProductExpress' and scr_parent_name = 'Product'
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
select @role = rol_id from TR_ROL_Role where rol_name = 'Magasinier'
INSERT INTO TR_RIT_Right
VALUES ( @scrId,@role, 0, 0, 0, 0, 0, 0, 0, 0)
GO

---------- 2018-02-28 以上内容已经在服务器上面运行



---------- 2018-03-01 update delivery form
update TM_DFO_Delivery_Form
set dfo_deliveried = 1
where dfo_id in
(select dfo.dfo_id from TM_CIN_Client_Invoice  cin 
	join TM_DFO_Delivery_Form dfo 
	on cin.dfo_id = dfo.dfo_id
	where dfo.dfo_deliveried is null 
	or
	dfo.dfo_deliveried = 0)

---------- 2018-03-01 以上内容已经在服务器上面运行
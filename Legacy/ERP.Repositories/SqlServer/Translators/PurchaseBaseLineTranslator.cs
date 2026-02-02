using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class PurchaseBaseLineTranslator
    {
        #region Purchase Intent

        public static Expression<Func<TM_PIL_PurchaseIntent_Lines, PurchaseLineBaseClass>> RepositoryToEntity()
        {
            return o => new PurchaseLineBaseClass
            {
                PilId = o.pil_id,
                PinId = o.pin_id,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                Quantity = o.pil_quantity,
                PrdName = o.pil_prd_name,//o.TM_PRD_Product.prd_ref,
                PrdImgPath = o.prd_id.HasValue ? (o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                    ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                        ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order)
                            .FirstOrDefault()
                            .TR_PAL_Photo_Album.pal_path
                        : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                    : string.Empty) : string.Empty,
                Description = o.pil_description,
                Order = o.pil_order,
                UnitPrice = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_purchase_price : 0,
                DiscountAmount = 0,
                UnitPriceWithDis = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_purchase_price : 0,
                //TotalPrice = o.sol_total_price,
                //TotalCrudePrice = o.sol_total_crude_price,
                VatRate = 0,
                //SupplierRef = o.pil_sup_ref,
                //SupId = o.sup_id,
                //SupplierCompanyName = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_company_name : string.Empty,
                SupplierCompanyName = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_company_name : string.Empty,//o.pil_supplier,
                //_SupplierProdcuts = o.TM_PRD_Product.TR_SPR_Supplier_Product.Select(m => new SupplierProduct
                //{
                //    Id = m.spr_id,
                //    SupId = m.sup_id,
                //    PrdId = m.prd_id,
                //    SprPrdRef = m.spr_prd_ref,
                //    SprComment = m.spr_comment,
                //    PrdName = m.TM_PRD_Product.prd_name,
                //    SupplierName = m.TM_SUP_Supplier.sup_company_name
                //}),
                PrdDescription = o.pil_prd_des,
                Driver = o.pil_driver,
                Power = o.pil_power,
                TempColor = o.pil_temp_color,
                Length = o.pil_length,
                Width = o.pil_width,
                Height = o.pil_height,
                Efflum = o.pil_eff_lum,
                UGR = o.pil_ugr,
                CRI = o.pil_cri,
                Logistic = o.pil_logistic,
                Client = o.pil_client,
                Deadline = o.pil_deadline,
                DateCreation = o.pil_d_creation,
                ClnId = o.cln_id ?? 0,
                CiiId = o.cii_id ?? 0,
                ColId = o.col_id ?? 0,
                SolId = o.TM_SOL_SupplierOrder_Lines.Any() ? 1 : 0,
                Comment = o.pil_comment,
                FeatureCode = o.pil_feature_code,
                PinCode = o.TM_PIN_Purchase_Intent.pin_code,
                PinName = o.TM_PIN_Purchase_Intent.pin_name,
                UsrIdCom1 = o.usr_id_com1,
                UsrIdCom2 = o.usr_id_com2,
                UsrIdCom3 = o.usr_id_com3,
                Commercial1 = o.usr_id_com1.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                Commercial2 = o.usr_id_com2.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                Commercial3 = o.usr_id_com3.HasValue ? (o.TM_USR_User3.usr_firstname + " " + o.TM_USR_User3.usr_lastname) : string.Empty,
                Creator = o.TM_PIN_Purchase_Intent.TM_USR_User.usr_firstname + " " + o.TM_PIN_Purchase_Intent.TM_USR_User.usr_lastname,
                SupId = o.sup_id,
                Supplier1 = o.sup_id.HasValue ? o.TM_SUP_Supplier.sup_company_name : string.Empty
            };
        }

        public static TM_PIL_PurchaseIntent_Lines EntityToRepository(PurchaseLineBaseClass _from, TM_PIL_PurchaseIntent_Lines _to = null, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_PIL_PurchaseIntent_Lines { pin_id = _from.PinId };
                _to.pil_d_creation = DateTime.Now;
            }
            _to.pil_order = _from.Order;
            _to.pil_description = _from.Description;
            _to.prd_id = _from.PrdId == 0 ? (int?)null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? (int?)null : _from.PitId;
            _to.pil_prd_name = _from.PrdName;
            _to.pil_quantity = _from.Quantity;
            //_to.pil_sup_ref = _from.SupplierRef;
            //_to.sup_id = _from.SupId == 0 ? null : _from.SupId;
            _to.pil_prd_des = _from.PrdDescription;
            _to.pil_supplier = _from.SupplierCompanyName;
            _to.pil_client = _from.Client;
            _to.pil_driver = _from.Driver;
            _to.pil_power = _from.Power;
            _to.pil_temp_color = _from.TempColor;
            _to.pil_length = _from.Length;
            _to.pil_width = _from.Width;
            _to.pil_height = _from.Height;
            _to.pil_eff_lum = _from.Efflum;
            _to.pil_ugr = _from.UGR;
            _to.pil_cri = _from.CRI;
            _to.pil_logistic = _from.Logistic;
            _to.pil_deadline = _from.Deadline;
            _to.cii_id = _from.CiiId == 0 ? (int?)null : _from.CiiId;
            _to.col_id = _from.ColId == 0 ? (int?)null : _from.ColId;
            _to.cln_id = _from.ClnId == 0 ? (int?)null : _from.ClnId;
            _to.pil_comment = _from.Comment;
            _to.pil_feature_code = _from.FeatureCode;
            _to.usr_id_com1 = _from.UsrIdCom1.HasValue ? (_from.UsrIdCom1 == 0 ? null : _from.UsrIdCom1) : null;
            _to.usr_id_com2 = _from.UsrIdCom2.HasValue ? (_from.UsrIdCom2 == 0 ? null : _from.UsrIdCom2) : null;
            _to.usr_id_com3 = _from.UsrIdCom3.HasValue ? (_from.UsrIdCom3 == 0 ? null : _from.UsrIdCom3) : null;
            _to.sup_id = _from.SupId == 0 ? (int?)null : _from.SupId;
            return _to;
        }

        #endregion Purchase Intent

        #region Supplier Order

        public static Expression<Func<TM_SOL_SupplierOrder_Lines, PurchaseLineBaseClass>> RepositoryToEntitySol(int lgsId = 0)
        {
            return o => new PurchaseLineBaseClass
            {
                SolId = o.sol_id,
                SodId = o.sod_id,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                // 20210901
                //Quantity = o.sol_quantity,
                Quantity = (lgsId != 0 && o.TM_LGL_Logistic_Lines.FirstOrDefault(l => l.lgs_id == lgsId) != null) ? o.TM_LGL_Logistic_Lines.FirstOrDefault(l => l.lgs_id == lgsId).lgs_quantity : o.sol_quantity,
                PrdName = string.IsNullOrEmpty(o.sol_prd_name) ? (o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : string.Empty) : o.sol_prd_name,
                PrdImgPath = (o.pit_id.HasValue && o.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.Any()
                    ? (o.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pal_id.HasValue
                        ? o.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                        : o.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pti_path)
                :
                    (o.prd_id.HasValue && o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                        ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                        : string.Empty)),
                Description = o.sol_description,
                Order = o.sol_order,
                UnitPrice = o.sol_unit_price ?? 0,
                DiscountAmount = o.sol_discount_amount ?? 0,
                UnitPriceWithDis = o.sol_price_with_dis ?? 0,
                TotalPrice = o.sol_total_price ?? 0,
                TotalCrudePrice = o.sol_total_crude_price ?? 0,
                VatId = o.vat_id,
                VatRate = o.vat_id.HasValue ? o.TR_VAT_Vat.vat_vat_rate : 0,
                PrdDescription = o.sol_prd_des,
                SupplierRef = o.prd_id.HasValue ? o.TM_PRD_Product.TR_SPR_Supplier_Product.Any(l => l.sup_id == o.TM_SOD_Supplier_Order.sup_id) ?
                o.TM_PRD_Product.TR_SPR_Supplier_Product.FirstOrDefault(l => l.sup_id == o.TM_SOD_Supplier_Order.sup_id).spr_prd_ref : string.Empty : string.Empty,
                Driver = o.sol_driver,
                Power = o.sol_power,
                TempColor = o.sol_temp_color,
                Length = o.sol_length,
                Width = o.sol_width,
                Height = o.sol_height,
                Efflum = o.sol_eff_lum,
                UGR = o.sol_ugr,
                CRI = o.sol_cri,
                Logistic = o.sol_logistic,
                Client = o.sol_client,
                Deadline = o.sol_deadline,
                DateCreation = o.sol_d_creation,

                DUpdate = o.sol_d_update,
                DProduction = o.sol_d_production,
                DExpDelivery = o.sol_d_exp_delivery,
                DDelivery = o.sol_d_delivery,
                FeatureCode = o.sol_feature_code,
                DShipping = o.sol_d_shipping,
                Transporter = o.sol_transporter,
                DExpArrival = o.sol_d_exp_arrival,
                LogsNbr = o.sol_logistics_number,

                // begin 支付读取，不在此处赋值
                Need2Pay = o.sol_need2pay,
                Paid = o.sol_paid,
                // end 支付读取，不在此处赋值
                Guid = o.sol_guid,
                Comment = o.sol_comment,

                SodCode = o.TM_SOD_Supplier_Order.sod_code,
                SodName = o.TM_SOD_Supplier_Order.sod_name,
                PilId = o.pil_id ?? 0,
                PinId = o.pil_id.HasValue ? o.TM_PIL_PurchaseIntent_Lines.pin_id : 0,
                Finished = o.sol_finished ?? false,
                QtyStored = o.sol_qty_storage ?? 0,
                //Supplier1 = o.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_abbreviation,
                //Supplier2 = o.TM_SOD_Supplier_Order.sub_sup_id.HasValue ? o.TM_SOD_Supplier_Order.TM_SUP_Supplier_1.sup_abbreviation : string.Empty,
                Supplier1 = o.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_abbreviation ?? o.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_company_name,
                Supplier2 = o.TM_SOD_Supplier_Order.sub_sup_id.HasValue ? (o.TM_SOD_Supplier_Order.TM_SUP_Supplier_1.sup_abbreviation ?? o.TM_SOD_Supplier_Order.TM_SUP_Supplier_1.sup_company_name) : string.Empty,
                UsrIdCom1 = o.usr_id_com1,
                UsrIdCom2 = o.usr_id_com2,
                UsrIdCom3 = o.usr_id_com3,
                Commercial1 = o.usr_id_com1.HasValue ? (o.TM_USR_User.usr_firstname + " " + o.TM_USR_User.usr_lastname) : string.Empty,
                Commercial2 = o.usr_id_com2.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                Commercial3 = o.usr_id_com3.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,

                // 2021-10-17
                DeliveriedQuantity = (o.TM_LGL_Logistic_Lines.Any() ? o.TM_LGL_Logistic_Lines.Sum(l => l.lgs_quantity) : 0) + ((o.TM_CII_ClientInvoice_Line.Any() && o.TM_CII_ClientInvoice_Line.Any(l => l.TM_LGL_Logistic_Lines.Any())) ? (o.TM_CII_ClientInvoice_Line.Sum(l => l.TM_LGL_Logistic_Lines.Sum(k => k.lgs_quantity))) : 0),

                // 2023-06-08
                CurSymbol = o.TM_SOD_Supplier_Order.TR_CUR_Currency.cur_symbol

                //PaymentRecords = o.TR_SPR_SupplierOrder_Payment_Record.Select(l => new KeyValue
                //{
                //    Key = l.spr_id,
                //    DValue = l.spr_d_creation,
                //    DValue2 = l.spr_d_payment,
                //    DcValue = l.spr_amount,
                //    Value = l.spr_comment,
                //    Key2 = l.sol_id,
                //    DValue3 = l.spr_d_update
                //})
            };
        }

        public static TM_SOL_SupplierOrder_Lines EntityToRepositorySol(PurchaseLineBaseClass _from, TM_SOL_SupplierOrder_Lines _to = null, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_SOL_SupplierOrder_Lines { sod_id = _from.SodId };
                _to.sol_d_creation = DateTime.Now;
                _to.sol_guid = Guid.NewGuid();
            }
            _to.sol_d_update = DateTime.Now;
            _to.sol_order = _from.Order;
            _to.sol_description = _from.Description;
            _to.prd_id = _from.PrdId == 0 ? null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? null : _from.PitId;
            _to.sol_quantity = _from.Quantity;
            _to.sol_unit_price = _from.UnitPrice;
            _to.sol_discount_amount = _from.DiscountAmount;
            _to.sol_price_with_dis = _from.UnitPriceWithDis;
            _to.sol_total_price = _from.TotalPrice;
            _to.sol_total_crude_price = _from.TotalCrudePrice;
            _to.vat_id = _from.VatId == 0 ? null : _from.VatId;
            _to.pil_id = _from.PilId == 0 ? (int?)null : _from.PilId;
            _to.sol_prd_des = _from.PrdDescription;
            _to.sol_client = _from.Client;
            _to.sol_driver = _from.Driver;
            _to.sol_power = _from.Power;
            _to.sol_temp_color = _from.TempColor;
            _to.sol_length = _from.Length;
            _to.sol_width = _from.Width;
            _to.sol_height = _from.Height;
            _to.sol_eff_lum = _from.Efflum;
            _to.sol_ugr = _from.UGR;
            _to.sol_cri = _from.CRI;
            _to.sol_logistic = _from.Logistic;
            _to.sol_deadline = _from.Deadline;
            _to.sol_prd_name = _from.PrdName;

            _to.sol_client = _from.Client;
            _to.sol_driver = _from.Driver;
            _to.sol_power = _from.Power;
            _to.sol_temp_color = _from.TempColor;
            _to.sol_length = _from.Length;
            _to.sol_width = _from.Width;
            _to.sol_height = _from.Height;
            _to.sol_eff_lum = _from.Efflum;
            _to.sol_ugr = _from.UGR;
            _to.sol_cri = _from.CRI;
            _to.sol_logistic = _from.Logistic;
            _to.sol_deadline = _from.Deadline;

            _to.sol_d_update = DateTime.Now;
            _to.sol_d_production = _from.DProduction;
            _to.sol_d_exp_delivery = _from.DExpDelivery;
            _to.sol_d_delivery = _from.DDelivery;
            _to.sol_feature_code = _from.FeatureCode;
            _to.sol_d_shipping = _from.DShipping;
            _to.sol_transporter = _from.Transporter;
            _to.sol_d_exp_arrival = _from.DExpArrival;
            _to.sol_logistics_number = _from.LogsNbr;

            _to.sol_comment = _from.Comment;
            _to.sol_finished = _from.Finished;

            _to.usr_id_com1 = _from.UsrIdCom1.HasValue ? (_from.UsrIdCom1 == 0 ? null : _from.UsrIdCom1) : null;
            _to.usr_id_com2 = _from.UsrIdCom2.HasValue ? (_from.UsrIdCom2 == 0 ? null : _from.UsrIdCom2) : null;
            _to.usr_id_com3 = _from.UsrIdCom3.HasValue ? (_from.UsrIdCom3 == 0 ? null : _from.UsrIdCom3) : null;

            return _to;
        }

        #endregion Supplier Order

        #region Supplier Invoice

        public static Expression<Func<TM_SIL_SupplierInvoice_Lines, PurchaseLineBaseClass>> RepositoryToEntitySil(bool forLogistics = false, int lgsId = 0)
        {
            return o => new PurchaseLineBaseClass
            {
                SilId = o.sil_id,
                SinId = o.sin_id,
                SolId = o.sol_id ?? 0,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                PitName = o.TM_PIT_Product_Instance.pit_ref,
                Quantity = o.sil_quantity,
                PrdName = o.TM_PRD_Product.prd_ref,
                PrdImgPath = o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                    ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                        ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                        : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                    : string.Empty,
                Description = o.sil_description,
                Order = o.sil_order,
                UnitPrice = o.sil_unit_price,
                DiscountAmount = o.sil_discount_amount,
                UnitPriceWithDis = o.sil_price_with_dis,
                TotalPrice = o.sil_total_price,
                TotalCrudePrice = o.sil_total_crude_price,
                VatId = o.vat_id,
                DeliveriedQuantity = !forLogistics ? 0 : (o.TM_LGL_Logistic_Lines.Sum(l => l.lgs_quantity)),
                QuantityForLgl = (!forLogistics || lgsId == 0) ? 0 : (o.TM_LGL_Logistic_Lines.FirstOrDefault(m => m.lgs_id == lgsId) != null ? o.TM_LGL_Logistic_Lines.FirstOrDefault(m => m.lgs_id == lgsId).lgs_quantity : 0),
                LglId = (!forLogistics || lgsId == 0) ? 0 : (o.TM_LGL_Logistic_Lines.FirstOrDefault(m => m.lgs_id == lgsId) != null ? o.TM_LGL_Logistic_Lines.FirstOrDefault(m => m.lgs_id == lgsId).lgl_id : 0),
                PrdDescription = o.sil_prd_des
            };
        }

        public static TM_SIL_SupplierInvoice_Lines EntityToRepositorySil(PurchaseLineBaseClass _from, TM_SIL_SupplierInvoice_Lines _to = null, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_SIL_SupplierInvoice_Lines
                {
                    sin_id = _from.SinId,
                    sol_id = _from.SolId == 0 ? (int?)null : _from.SolId,
                };
            }
            _to.sil_order = _from.Order;
            _to.sil_description = _from.Description;
            // todo: to modify type
            //_to.prd_id = _from.PrdId;
            //_to.pit_id = _from.PitId;
            //_to.vat_id = _from.VatId;
            _to.sil_quantity = _from.Quantity;
            _to.sil_unit_price = _from.UnitPrice;
            _to.sil_discount_amount = _from.DiscountAmount;
            _to.sil_price_with_dis = _from.UnitPriceWithDis;
            _to.sil_total_price = _from.TotalPrice;
            _to.sil_total_crude_price = _from.TotalCrudePrice;
            _to.sil_prd_des = _from.PrdDescription;
            return _to;
        }

        #endregion Supplier Invoice
    }
}

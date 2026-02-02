using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ClientInvoiceLineTranslator
    {
        public static Expression<Func<TM_CII_ClientInvoice_Line, ClientInvoiceLine>> RepositoryToEntity(int lgs = 0)
        {
            return o => new ClientInvoiceLine
                        {
                            CiiId = o.cii_id,
                            CinId = o.cin_id,
                            CiiLevel1 = o.cii_level1,
                            CiiLevel2 = o.cii_level2,
                            CiiDescription = o.cii_description ?? string.Empty,
                            PrdId = o.prd_id,
                            //PrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_name : string.Empty,
                            PitId = o.pit_id,
                            PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                            CiiPurchasePrice = o.cii_purchase_price,
                            CiiUnitPrice = o.cii_unit_price,
                            // 20210901
                            //CiiQuantity = o.cii_quantity,
                            CiiQuantity = (lgs != 0 && o.TM_LGL_Logistic_Lines.FirstOrDefault(l => l.lgs_id == lgs) != null) ? o.TM_LGL_Logistic_Lines.FirstOrDefault(l => l.lgs_id == lgs).lgs_quantity : o.cii_quantity,
                            CiiTotalPrice = o.cii_total_price,
                            CiiTotalCrudePrice = o.cii_total_crude_price,
                            VatId = o.vat_id,
                            LtpId = o.ltp_id,
                            LineType = o.TR_LTP_Line_Type.ltp_name,
                            CiiPrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : o.cii_prd_name,
                            //PrdImgPath = o.prd_id.HasValue && o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                            //    ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            //        ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            //        : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                            //    : string.Empty,
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
                            VatLabel = o.TR_VAT_Vat.vat_designation,
                            VatRate = o.TR_VAT_Vat.vat_vat_rate,
                            CiiDiscountAmount = o.cii_discount_amount,
                            CiiDiscountPercentage = o.cii_discount_percentage,
                            CiiPriceWithDiscountHt = o.cii_price_with_discount_ht,
                            CiiMargin = o.cii_margin,
                            CiiAvId = o.cii_av_id,
                            CiiPrdDes = o.cii_prd_des,
                            PtyId = o.prd_id.HasValue ? o.TM_PRD_Product.pty_id : 0,
                            LglQuantity = o.TM_LGL_Logistic_Lines.Any() ?
                            (o.TM_LGL_Logistic_Lines.Sum(l => l.lgs_quantity) + (o.sol_id.HasValue && o.TM_SOL_SupplierOrder_Lines.TM_LGL_Logistic_Lines.Any() ? (o.TM_SOL_SupplierOrder_Lines.TM_LGL_Logistic_Lines.Sum(k => k.lgs_quantity)) : 0)) // 2021-10-17
                            : 0,
                            SolId = o.sol_id ?? 0
                        };
        }

        public static TM_CII_ClientInvoice_Line EntityToRepository(ClientInvoiceLine _from, TM_CII_ClientInvoice_Line _to = null, bool create = false)
        {
            if (create)
            {
                _to = new TM_CII_ClientInvoice_Line();
                _to.cin_id = _from.CinId;
                _to.sol_id = _from.SolId == 0 ? (int?)null : _from.SolId;
            }
            _to.cii_level1 = _from.CiiLevel1;
            _to.cii_level2 = _from.CiiLevel2;
            _to.cii_description = _from.CiiDescription;
            _to.prd_id = _from.PrdId == 0 ? null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? null : _from.PitId;
            _to.cii_purchase_price = _from.CiiPurchasePrice;
            _to.cii_unit_price = _from.CiiUnitPrice;
            _to.cii_quantity = _from.CiiQuantity;
            _to.cii_total_price = _from.CiiTotalPrice;
            _to.cii_total_crude_price = _from.CiiTotalCrudePrice;
            _to.vat_id = _from.VatId == 0 ? null : _from.VatId;
            _to.ltp_id = _from.LtpId;
            _to.cii_prd_name = _from.PrdId == 0 ? _from.CiiPrdName : _from.PrdName;
            _to.cii_discount_amount = (_from.CiiDiscountAmount ?? 0);
            _to.cii_discount_percentage = (_from.CiiDiscountPercentage ?? 0);
            // if null = unit price
            _to.cii_price_with_discount_ht = (_from.CiiPriceWithDiscountHt ?? _from.CiiUnitPrice);
            _to.cii_margin = _from.CiiMargin;
            _to.cii_av_id = _from.CiiAvId == 0 ? null : _from.CiiAvId;
            _to.cii_prd_des = _from.CiiPrdDes;
            return _to;
        }
    }
}

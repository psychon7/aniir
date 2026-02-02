using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class CostPlanLineTranslator
    {
        public static Expression<Func<TM_CLN_CostPlan_Lines, CostPlanLine>> RepositoryToEntity()
        {
            return o => new CostPlanLine
                        {
                            ClnId = o.cln_id,
                            CplId = o.cpl_id,
                            ClnLevel1 = o.cln_level1,
                            ClnLevel2 = o.cln_level2,
                            ClnDescription = o.cln_description ?? string.Empty,
                            PrdId = o.prd_id,
                            //PrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_name : string.Empty,
                            PitId = o.pit_id,
                            PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                            ClnPurchasePrice = o.cln_purchase_price,
                            ClnUnitPrice = o.cln_unit_price,
                            ClnQuantity = o.cln_quantity,
                            ClnTotalPrice = o.cln_total_price,
                            ClnTotalCrudePrice = o.cln_total_crude_price,
                            VatId = o.vat_id,
                            LtpId = o.ltp_id,
                            LineType = o.TR_LTP_Line_Type.ltp_name,
                            ClnPrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : o.cln_prd_name,
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
                            ClnDiscountAmount = o.cln_discount_amount,
                            ClnDiscountPercentage = o.cln_discount_percentage,
                            ClnPriceWithDiscountHt = o.cln_price_with_discount_ht,
                            ClnMargin = o.cln_margin,
                            ClnPrdDes = o.cln_prd_des,
                            PtyId = o.prd_id.HasValue ? o.TM_PRD_Product.pty_id : 0
                        };
        }

        public static Expression<Func<TM_CLN_CostPlan_Lines, CostPlanLine>> RepositoryToEntityLite()
        {
            return o => new CostPlanLine
            {
                ClnId = o.cln_id,
                CplId = o.cpl_id,
                ClnLevel1 = o.cln_level1,
                ClnLevel2 = o.cln_level2,
                ClnDescription = o.cln_description ?? string.Empty,
                PrdId = o.prd_id,
                PitId = o.pit_id,
                PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                ClnQuantity = o.cln_quantity,
                VatId = o.vat_id,
                LtpId = o.ltp_id,
                LineType = o.TR_LTP_Line_Type.ltp_name,
                ClnPrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : o.cln_prd_name,
                PrdImgPath = o.prd_id.HasValue && o.TM_PRD_Product.TI_PIM_Product_Image.Any()
                    ? (o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                        ? o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                        : o.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                    : string.Empty,
                VatLabel = o.TR_VAT_Vat.vat_designation,
                VatRate = o.TR_VAT_Vat.vat_vat_rate,
                ClnPrdDes = o.cln_prd_des,
                PtyId = o.prd_id.HasValue ? o.TM_PRD_Product.pty_id : 0,
                ClnTotalPrice = o.cln_price_with_discount_ht
            };
        }

        public static TM_CLN_CostPlan_Lines EntityToRepository(CostPlanLine _from, TM_CLN_CostPlan_Lines _to = null, bool create = false)
        {
            if (create)
            {
                _to = new TM_CLN_CostPlan_Lines();
                _to.cpl_id = _from.CplId;
            }
            _to.cln_level1 = _from.ClnLevel1;
            _to.cln_level2 = _from.ClnLevel2;
            _to.cln_description = _from.ClnDescription;
            _to.prd_id = _from.PrdId == 0 ? null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? null : _from.PitId;
            _to.cln_purchase_price = _from.ClnPurchasePrice;
            _to.cln_unit_price = _from.ClnUnitPrice;
            _to.cln_quantity = _from.ClnQuantity;
            _to.cln_total_price = _from.ClnTotalPrice;
            _to.cln_total_crude_price = _from.ClnTotalCrudePrice;
            _to.vat_id = _from.VatId == 0 ? null : _from.VatId;
            _to.ltp_id = _from.LtpId;
            _to.cln_prd_name = (_from.PrdId == 0 || _from.PrdId == null) ? _from.ClnPrdName : _from.PrdName;
            _to.cln_discount_amount = (_from.ClnDiscountAmount ?? 0);
            _to.cln_discount_percentage = (_from.ClnDiscountPercentage ?? 0);
            // if null = unit price
            _to.cln_price_with_discount_ht = (_from.ClnPriceWithDiscountHt ?? _from.ClnUnitPrice);
            _to.cln_margin = _from.ClnMargin;
            _to.cln_prd_des = _from.ClnPrdDes;
            return _to;
        }
    }
}

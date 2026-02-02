using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ClientOrderLineTranslator
    {
        public static Expression<Func<TM_COL_ClientOrder_Lines, ClientOrderLine>> RepositoryToEntity()
        {
            return o => new ClientOrderLine
                        {
                            ColId = o.col_id,
                            CodId = o.cod_id,
                            ColLevel1 = o.col_level1,
                            ColLevel2 = o.col_level2,
                            ColDescription = o.col_description ?? string.Empty,
                            PrdId = o.prd_id,
                            PrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : string.Empty,
                            PitId = o.pit_id,
                            PitName = o.pit_id.HasValue ? o.TM_PIT_Product_Instance.pit_ref : string.Empty,
                            ColPurchasePrice = o.col_purchase_price,
                            ColUnitPrice = o.col_unit_price,
                            ColQuantity = o.col_quantity,
                            ColTotalPrice = o.col_total_price,
                            ColTotalCrudePrice = o.col_total_crude_price,
                            VatId = o.vat_id,
                            LtpId = o.ltp_id,
                            LineType = o.TR_LTP_Line_Type.ltp_name,
                            ColPrdName = o.prd_id.HasValue ? o.TM_PRD_Product.prd_ref : o.col_prd_name,
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
                            ColDiscountAmount = o.col_discount_amount,
                            ColDiscountPercentage = o.col_discount_percentage,
                            ColPriceWithDiscountHt = o.col_price_with_discount_ht,
                            ColMargin = o.col_margin,
                            ColPrdDes = o.col_prd_des,
                            PtyId = o.prd_id.HasValue ? o.TM_PRD_Product.pty_id : 0
                        };
        }

        public static TM_COL_ClientOrder_Lines EntityToRepository(ClientOrderLine _from, TM_COL_ClientOrder_Lines _to = null, bool create = false)
        {
            if (create)
            {
                _to = new TM_COL_ClientOrder_Lines();
                _to.cod_id = _from.CodId;
                _to.cln_id = _from.ClnId == 0 ? null : _from.ClnId;
            }
            _to.col_level1 = _from.ColLevel1;
            _to.col_level2 = _from.ColLevel2;
            _to.col_description = _from.ColDescription;
            _to.prd_id = _from.PrdId == 0 ? null : _from.PrdId;
            _to.pit_id = _from.PitId == 0 ? null : _from.PitId;
            _to.col_purchase_price = _from.ColPurchasePrice;
            _to.col_unit_price = _from.ColUnitPrice;
            _to.col_quantity = _from.ColQuantity;
            _to.col_total_price = _from.ColTotalPrice;
            _to.col_total_crude_price = _from.ColTotalCrudePrice;
            _to.vat_id = _from.VatId == 0 ? null : _from.VatId;
            _to.ltp_id = _from.LtpId;
            _to.col_prd_name = _from.PrdId == 0 ? _from.ColPrdName : _from.PrdName;
            _to.col_discount_amount = (_from.ColDiscountAmount ?? 0);
            _to.col_discount_percentage = (_from.ColDiscountPercentage ?? 0);
            // if null = unit price
            _to.col_price_with_discount_ht = (_from.ColPriceWithDiscountHt ?? _from.ColUnitPrice);
            _to.col_margin = _from.ColMargin;
            _to.col_prd_des = _from.ColPrdDes;
            return _to;
        }
    }
}

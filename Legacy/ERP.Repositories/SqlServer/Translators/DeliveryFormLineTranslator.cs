using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class DeliveryFormLineTranslator
    {
        public static Expression<Func<TM_DFL_DevlieryForm_Line, DeliveryFormLine>> RepositoryToEntity()
        {
            return o => new DeliveryFormLine
                        {
                            ColId = o.col_id ?? 0,
                            CiiId = o.cii_id ?? 0,
                            DfoId = o.dfo_id,
                            DflId = o.dfl_id,
                            DflDescription = o.dfl_description,
                            DflQuantity = o.dfl_quantity,
                            // client order line
                            CodId = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.cod_id : 0,
                            CinId = o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cin_id : 0,
                            ColLevel1 = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_level1 : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_level1 : 0),
                            ColLevel2 = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_level2 : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_level2 : 0),
                            ColDescription = o.col_id.HasValue ? (o.TM_COL_ClientOrder_Lines.col_description ?? string.Empty) : (o.cii_id.HasValue ? (o.TM_CII_ClientInvoice_Line1.cii_description ?? string.Empty) : string.Empty),
                            PrdId = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.prd_id : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.prd_id : 0),
                            PrdName = o.col_id.HasValue && o.TM_COL_ClientOrder_Lines.prd_id.HasValue ? o.TM_COL_ClientOrder_Lines.TM_PRD_Product.prd_ref : (o.cii_id.HasValue && o.TM_CII_ClientInvoice_Line1.prd_id.HasValue ? o.TM_CII_ClientInvoice_Line1.TM_PRD_Product.prd_ref : string.Empty),
                            PitId = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.pit_id : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.pit_id : 0),
                            PitName = o.col_id.HasValue && o.TM_COL_ClientOrder_Lines.pit_id.HasValue ? o.TM_COL_ClientOrder_Lines.TM_PIT_Product_Instance.pit_ref : (o.cii_id.HasValue && o.TM_CII_ClientInvoice_Line1.pit_id.HasValue ? o.TM_CII_ClientInvoice_Line1.TM_PIT_Product_Instance.pit_ref : string.Empty),
                            ColPurchasePrice = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_purchase_price : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_purchase_price : 0),
                            ColUnitPrice = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_unit_price : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_unit_price : 0),
                            ColQuantity = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_quantity : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_quantity : 0),
                            ColTotalPrice = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_total_price : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_total_price : 0),
                            ColTotalCrudePrice = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_total_crude_price : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_total_crude_price : 0),
                            VatId = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.vat_id : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.vat_id : 0),
                            LtpId = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.ltp_id : -1,
                            LineType = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.TR_LTP_Line_Type.ltp_name : string.Empty,
                            ColPrdName = o.col_id.HasValue ? (o.TM_COL_ClientOrder_Lines.prd_id.HasValue ? o.TM_COL_ClientOrder_Lines.TM_PRD_Product.prd_ref : o.TM_COL_ClientOrder_Lines.col_prd_name) : (o.cii_id.HasValue && o.TM_CII_ClientInvoice_Line1.prd_id.HasValue ? o.TM_CII_ClientInvoice_Line1.TM_PRD_Product.prd_ref : o.TM_CII_ClientInvoice_Line1.cii_prd_name),
                            VatLabel = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.TR_VAT_Vat.vat_designation : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.TR_VAT_Vat.vat_designation : string.Empty),
                            VatRate = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.TR_VAT_Vat.vat_vat_rate : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.TR_VAT_Vat.vat_vat_rate : 0),
                            ColDiscountAmount = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_discount_amount : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_discount_amount : 0),
                            ColDiscountPercentage = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_discount_percentage : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_discount_percentage : 0),
                            ColPriceWithDiscountHt = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_price_with_discount_ht : 0),
                            ColMargin = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_margin : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_margin : 0),
                            ColPrdDes = o.col_id.HasValue ? o.TM_COL_ClientOrder_Lines.col_prd_des : (o.cii_id.HasValue ? o.TM_CII_ClientInvoice_Line1.cii_prd_des : string.Empty),
                            //PrdImgPath = o.col_id.HasValue && o.TM_COL_ClientOrder_Lines.prd_id.HasValue && o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.Any()
                            //  ? (o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            //      ? o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            //      : o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                            //  : string.Empty,
                            PrdImgPath = (o.col_id.HasValue && o.TM_COL_ClientOrder_Lines.pit_id.HasValue && o.TM_COL_ClientOrder_Lines.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.Any()
                    ? (o.TM_COL_ClientOrder_Lines.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pal_id.HasValue
                        ? o.TM_COL_ClientOrder_Lines.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                        : o.TM_COL_ClientOrder_Lines.TM_PIT_Product_Instance.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pti_path)
                :
                    (o.col_id.HasValue && o.TM_COL_ClientOrder_Lines.prd_id.HasValue && o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.Any()
                        ? (o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            ? o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            : o.TM_COL_ClientOrder_Lines.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                        : string.Empty)),
                        };
        }

        public static TM_DFL_DevlieryForm_Line EntityToRepository(DeliveryFormLine _from, TM_DFL_DevlieryForm_Line _to = null, bool create = false)
        {
            if (create)
            {
                _to = new TM_DFL_DevlieryForm_Line();
                _to.dfo_id = _from.DfoId;
                _to.col_id = _from.ColId == 0 ? (int?)null : _from.ColId;
                _to.cii_id = _from.CiiId == 0 ? (int?)null : _from.CiiId;
            }
            _to.dfl_description = _from.DflDescription;
            _to.dfl_quantity = _from.DflQuantity;
            return _to;
        }
    }
}

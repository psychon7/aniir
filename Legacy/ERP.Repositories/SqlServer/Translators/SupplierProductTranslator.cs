using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class SupplierProductTranslator
    {
        public static Expression<Func<TR_SPR_Supplier_Product, SupplierProduct>> RepositoryToEntity()
        {
            return o => new SupplierProduct
                        {
                            Id = o.spr_id,
                            SupId = o.sup_id,
                            PrdId = o.prd_id,
                            SprPrdRef = o.spr_prd_ref,
                            SocId = o.soc_id,
                            SprPrice_1_100 = o.spr_price_1_100,
                            SprPrice_100_500 = o.spr_price_100_500,
                            SprPrice_500_plus = o.spr_price_500_plus,
                            PrdRef = o.TM_PRD_Product.prd_ref,
                            CurId = o.TM_SUP_Supplier.cur_id,
                            Currency = o.TR_CUR_Currency.cur_designation,
                            PrdType = o.TM_PRD_Product.TM_PTY_Product_Type.pty_name,
                            SprComment = o.spr_comment,
                            PrdName = o.TM_PRD_Product.prd_name,
                            PtyId = o.TM_PRD_Product.pty_id,
                            SupplierName = o.TM_SUP_Supplier.sup_company_name
                        };
        }

        public static TR_SPR_Supplier_Product EntityToRepository(SupplierProduct _from, TR_SPR_Supplier_Product _to, bool create = false)
        {
            if (create)
            {
                _to.soc_id = _from.SocId;
                _to.sup_id = _from.SupId;
                _to.cur_id = _from.CurId;
                _to.prd_id = _from.PrdId;
            }
            _to.spr_prd_ref = _from.SprPrdRef;
            _to.spr_price_1_100 = _from.SprPrice_1_100;
            _to.spr_price_100_500 = _from.SprPrice_100_500;
            _to.spr_price_500_plus = _from.SprPrice_500_plus;
            _to.spr_comment = _from.SprComment;

            return _to;
        }

    }
}

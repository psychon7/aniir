using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class DeliveryFormLineRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// Get all client order line by client order id
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="dfoId"></param>
        /// <returns></returns>
        public List<DeliveryFormLine> GetDflsByDfoId(int socId, int dfoId)
        {
            var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId).Select(DeliveryFormLineTranslator.RepositoryToEntity()).OrderBy(m => m.ColLevel1).ThenBy(m => m.ColLevel2).ToList();
            dfls.ForEach(m =>
            {
                m.ColQuantityDeliveried = CalculateDeliveriedQuantity(m.ColId);
                m.ColQuantityToDelivery = (m.ColQuantity ?? 0) - m.ColQuantityDeliveried;
            });
            return dfls;
        }

        private decimal? CalculateDeliveriedQuantity(int colId)
        {
            var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.col_id == colId).ToList();
            var deliveried = dfls.Sum(m => m.dfl_quantity);
            return deliveried;
        }
        /// <summary>
        /// 添加或更新client order line
        /// </summary>
        /// <param name="dfl"></param>
        /// <returns></returns>
        public int InsertUpdateDfl(DeliveryFormLine dfl)
        {
            bool iscreate = false;
            int dflId = 0;
            if (dfl.DflId != 0 || dfl.ColId != 0 || dfl.CiiId != 0)
            {
                dflId = dfl.DflId;
                if (dfl.ColId != 0)
                {
                    //var checkCol = _db.TM_DFL_DevlieryForm_Line.FirstOrDefault(m => m.col_id == dfl.ColId && m.TM_DFO_Delivery_Form.soc_id == dfl.SocId && m.dfo_id == dfl.DfoId);
                    //if (checkCol != null)
                    //{

                    //}
                    //else
                    //{
                    //    iscreate = true;
                    //}
                    var aDfl = _db.TM_DFL_DevlieryForm_Line.FirstOrDefault(m =>
                        (dfl.ColId == 0 || m.col_id == dfl.ColId)
                        && (dfl.CiiId == 0 || m.cii_id == dfl.CiiId)
                        && m.TM_DFO_Delivery_Form.soc_id == dfl.SocId && m.dfo_id == dfl.DfoId);
                    if (aDfl != null)
                    {
                        aDfl = DeliveryFormLineTranslator.EntityToRepository(dfl, aDfl);
                        _db.TM_DFL_DevlieryForm_Line.ApplyCurrentValues(aDfl);
                        _db.SaveChanges();
                    }
                    else
                    {
                        iscreate = true;
                    }
                }
                else
                {
                    iscreate = true;
                }
            }
            else
            {
                iscreate = true;
            }
            if (iscreate)
            {
                // 在有cod的情况下，新建，如果没有，就不建立
                if (dfl.DfoId != 0 && (dfl.ColId != 0 || dfl.CiiId != 0))
                {
                    try
                    {
                        var aCol = DeliveryFormLineTranslator.EntityToRepository(dfl, create: true);
                        _db.TM_DFL_DevlieryForm_Line.AddObject(aCol);
                        _db.SaveChanges();
                        dflId = aCol.dfl_id;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            return dflId;
        }


        /// <summary>
        /// 添加或更新client order line
        /// </summary>
        /// <param name="dfl"></param>
        /// <returns></returns>
        public int InsertUpdateAllDfl(List<DeliveryFormLine> dfls)
        {
            int dflId = 0;
            foreach (var dfl in dfls)
            {
                dflId = InsertUpdateDfl(dfl);
            }
            return dflId;
        }

        public bool DeleteDfl(int socId, int dfoId, int dflId)
        {
            bool deleted = true;
            var dfl = _db.TM_DFL_DevlieryForm_Line.FirstOrDefault(m => m.dfl_id == dflId && m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId);
            if (dfl != null)
            {
                try
                {
                    _db.TM_DFL_DevlieryForm_Line.DeleteObject(dfl);
                    _db.SaveChanges();

                }
                catch (Exception)
                {
                    deleted = false;
                }
            }
            return deleted;
        }

        public void InsertCiiByDfl(int cinId, List<TM_DFL_DevlieryForm_Line> dfls)
        {
            // 将同一个col的dfl 合并成一行5
            var colIds = dfls.Select(m => m.col_id).Distinct().ToList();
            var dflsMerged = new List<TM_DFL_DevlieryForm_Line>();
            var dflsWithNewQty = new List<TM_DFL_DevlieryForm_Line>();
            foreach (var onecolId in colIds)
            {
                var dflsWithSameCol = dfls.Where(m => m.col_id == onecolId).Distinct().ToList();
                var onedfl = dflsWithSameCol.FirstOrDefault();
                dflsMerged.Add(onedfl);
                var newDfl = new TM_DFL_DevlieryForm_Line();
                //var newDfl = ObjectCopier.DeepCopy(dflsWithSameCol.FirstOrDefault());
                newDfl.col_id = onedfl.col_id;
                newDfl.dfl_quantity = dflsWithSameCol.Sum(l => l.dfl_quantity);
                dflsWithNewQty.Add(newDfl);
            }

            var ciis = dflsMerged.Select(o => new TM_CII_ClientInvoice_Line
            {
                cin_id = cinId,
                dfl_id = o.dfl_id == 0 ? (int?)null : o.dfl_id,
                col_id = o.col_id,
                cii_level1 = o.TM_COL_ClientOrder_Lines.col_level1,
                cii_level2 = o.TM_COL_ClientOrder_Lines.col_level2,
                cii_description = o.TM_COL_ClientOrder_Lines.col_description ?? string.Empty,
                prd_id = o.TM_COL_ClientOrder_Lines.prd_id,
                cii_prd_name = o.TM_COL_ClientOrder_Lines.prd_id.HasValue ? o.TM_COL_ClientOrder_Lines.TM_PRD_Product.prd_name :
                (o.TM_COL_ClientOrder_Lines.cln_id.HasValue ? o.TM_COL_ClientOrder_Lines.TM_CLN_CostPlan_Lines.cln_prd_name : (!string.IsNullOrEmpty(o.TM_COL_ClientOrder_Lines.col_prd_name) ? o.TM_COL_ClientOrder_Lines.col_prd_name : string.Empty)),
                pit_id = o.TM_COL_ClientOrder_Lines.pit_id,
                cii_purchase_price = o.TM_COL_ClientOrder_Lines.col_purchase_price,
                cii_unit_price = o.TM_COL_ClientOrder_Lines.col_unit_price,
                cii_quantity = dflsWithNewQty.FirstOrDefault(l => l.col_id == o.col_id).dfl_quantity,//o.dfl_quantity,
                //cii_total_price = o.TM_COL_ClientOrder_Lines.dfl_total_price,
                // re calculate
                cii_total_price = dflsWithNewQty.FirstOrDefault(l => l.col_id == o.col_id).dfl_quantity * (o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht),
                // re calculate
                cii_total_crude_price = dflsWithNewQty.FirstOrDefault(l => l.col_id == o.col_id).dfl_quantity * (o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht) * (o.TM_COL_ClientOrder_Lines.vat_id.HasValue ? (1 + o.TM_COL_ClientOrder_Lines.TR_VAT_Vat.vat_vat_rate / 100) : 1),
                vat_id = o.TM_COL_ClientOrder_Lines.vat_id,
                ltp_id = o.TM_COL_ClientOrder_Lines.ltp_id,
                cii_discount_percentage = o.TM_COL_ClientOrder_Lines.col_discount_percentage,
                // re calculate
                cii_discount_amount = o.TM_COL_ClientOrder_Lines.col_discount_amount,
                cii_price_with_discount_ht = o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht,
                // re calculate
                cii_margin = dflsWithNewQty.FirstOrDefault(l => l.col_id == o.col_id).dfl_quantity * (o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht - o.TM_COL_ClientOrder_Lines.col_purchase_price),
                cii_prd_des = o.TM_COL_ClientOrder_Lines.col_prd_des
            }).ToList();
            foreach (var oneItem in ciis)
            {
                _db.TM_CII_ClientInvoice_Line.AddObject(oneItem);
                _db.SaveChanges();
            }
        }

        public void InsertCiiByCol(int cinId, int codId)
        {
            var cols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId).ToList();

            var ciis = cols.Select(o => new TM_CII_ClientInvoice_Line
            {
                cin_id = cinId,
                dfl_id = null,
                cii_level1 = o.col_level1,
                cii_level2 = o.col_level2,
                cii_description = o.col_description ?? string.Empty,
                prd_id = o.prd_id,
                cii_prd_name = o.prd_id.HasValue ? o.TM_PRD_Product.prd_name :
                (o.cln_id.HasValue ? o.TM_CLN_CostPlan_Lines.cln_prd_name : (!string.IsNullOrEmpty(o.col_prd_name) ? o.col_prd_name : string.Empty)),
                pit_id = o.pit_id,
                cii_purchase_price = o.col_purchase_price,
                cii_unit_price = o.col_unit_price,
                cii_quantity = o.col_quantity ?? 0,
                //cii_total_price = o.dfl_total_price,
                // re calculate
                cii_total_price = o.col_total_price,
                // re calculate
                cii_total_crude_price = o.col_total_crude_price,
                vat_id = o.vat_id,
                ltp_id = o.ltp_id,
                cii_discount_percentage = o.col_discount_percentage,
                // re calculate
                cii_discount_amount = o.col_discount_amount,
                cii_price_with_discount_ht = o.col_price_with_discount_ht,
                // re calculate
                cii_margin = o.col_margin,
                cii_prd_des = o.col_prd_des
            }).ToList();
            foreach (var oneItem in ciis)
            {
                _db.TM_CII_ClientInvoice_Line.AddObject(oneItem);
                _db.SaveChanges();
            }
        }
    }
}

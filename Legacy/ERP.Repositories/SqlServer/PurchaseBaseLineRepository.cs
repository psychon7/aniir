using System;
using System.Collections.Generic;
using System.Data.Metadata.Edm;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.SqlServer
{
    public class PurchaseBaseLineRepository : BaseSqlServerRepository
    {
        private PurchaseBaseRepository PurchaseBaseRepository = new PurchaseBaseRepository();
        CalendarRepository CalendarRepository = new CalendarRepository();
        private ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();

        #region Purchase Intent

        public int InsertUpdatePil(PurchaseLineBaseClass pil)
        {
            bool iscreate = false;
            int pilId = 0;
            if (pil.PilId != 0)
            {
                pilId = pil.PilId;
                if (pil.PinId != 0)
                {
                    var aPil = _db.TM_PIL_PurchaseIntent_Lines.FirstOrDefault(m => m.pin_id == pil.PinId && m.TM_PIN_Purchase_Intent.soc_id == pil.SocId && m.pil_id == pil.PilId);
                    if (aPil != null)
                    {
                        aPil = PurchaseBaseLineTranslator.EntityToRepository(pil, aPil);
                        _db.TM_PIL_PurchaseIntent_Lines.ApplyCurrentValues(aPil);
                        _db.SaveChanges();

                        var onesup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == aPil.sup_id);
                        if (onesup != null)
                        {
                            aPil.pil_supplier = onesup.sup_company_name;
                            _db.TM_PIL_PurchaseIntent_Lines.ApplyCurrentValues(aPil);
                            _db.SaveChanges();
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
            }
            else
            {
                iscreate = true;
            }
            if (iscreate)
            {
                // 在有pin的情况下，新建，如果没有，就不建立
                if (pil.PinId != 0)
                {
                    try
                    {
                        var aCln = PurchaseBaseLineTranslator.EntityToRepository(pil, create: true);
                        _db.TM_PIL_PurchaseIntent_Lines.AddObject(aCln);
                        _db.SaveChanges();
                        pilId = aCln.pil_id;
                        var onesup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == aCln.sup_id);
                        if (onesup != null)
                        {
                            aCln.pil_supplier = onesup.sup_company_name;
                            _db.TM_PIL_PurchaseIntent_Lines.ApplyCurrentValues(aCln);
                            _db.SaveChanges();
                        }
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            return pilId;
        }

        public List<PurchaseLineBaseClass> LoadPils(int socId, int pinId, int pilId = 0)
        {
            var pils = _db.TM_PIL_PurchaseIntent_Lines.Where(m => m.pin_id == pinId && m.TM_PIN_Purchase_Intent.soc_id == socId
                && (pilId == 0 || m.pil_id == pilId)).Select(PurchaseBaseLineTranslator.RepositoryToEntity()).OrderBy(m => m.Order).ToList();

            pils.ForEach(m =>
            {
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
            });

            return pils;
        }

        public void DeletePil(int socId, int pinId, int pilId)
        {
            var pil = _db.TM_PIL_PurchaseIntent_Lines.FirstOrDefault(m => m.TM_PIN_Purchase_Intent.soc_id == socId && m.pin_id == pinId && m.pil_id == pilId);
            _db.TM_PIL_PurchaseIntent_Lines.DeleteObject(pil);
            _db.SaveChanges();
        }

        public void InsertPilsByExcelLines(int socId, int pinId, List<PurchaseLineBaseClass> lines)
        {
            var sod = _db.TM_PIN_Purchase_Intent.FirstOrDefault(l => l.pin_id == pinId && l.soc_id == socId);
            if (sod != null)
            {
                var solindb = _db.TM_PIL_PurchaseIntent_Lines.Where(l => l.pin_id == sod.pin_id).OrderByDescending(l => l.pil_order).FirstOrDefault();
                var lineorder = solindb != null ? (solindb.pil_order + 1) : 1;
                lines.ForEach(l =>
                {
                    l.Order = lineorder;
                    lineorder++;
                    l.Guid = Guid.NewGuid();
                    l.Finished = false;
                    l.TotalCrudePrice = l.TotalPrice;
                    l.Quantity = l.Quantity * 1;
                    l.PinId = pinId;
                });

                var sol2Insert = lines.Select(l => PurchaseBaseLineTranslator.EntityToRepository(l, create: true)).ToList();
                foreach (var onesol in sol2Insert)
                {
                    _db.TM_PIL_PurchaseIntent_Lines.AddObject(onesol);
                }
                _db.SaveChanges();
            }
        }

        #endregion Purchase Intent

        #region Supplier Order

        public int InsertUpdateSol(PurchaseLineBaseClass sol)
        {
            bool iscreate = false;
            int solId = 0;
            var prdId = 0;
            // check prd
            if (sol.PitId != 0 && sol.PrdId == 0)
            {
                var apit = _db.TM_PIT_Product_Instance.FirstOrDefault(l => l.pit_id == sol.PitId);
                if (apit != null)
                {
                    prdId = apit.prd_id;
                    sol.PrdId = prdId;
                }
            }
            if (sol.SolId != 0)
            {
                solId = sol.SolId;
                if (sol.SodId != 0)
                {
                    var aSol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(m => m.sod_id == sol.SodId && m.TM_SOD_Supplier_Order.soc_id == sol.SocId && m.sol_id == sol.SolId);
                    if (aSol != null)
                    {
                        var samePrice = (sol.UnitPriceWithDis == aSol.sol_price_with_dis);
                        aSol = PurchaseBaseLineTranslator.EntityToRepositorySol(sol, aSol);
                        if (string.IsNullOrEmpty(aSol.sol_client) && !string.IsNullOrEmpty(aSol.TM_SOD_Supplier_Order.soc_client))
                        {
                            aSol.sol_client = aSol.TM_SOD_Supplier_Order.soc_client;
                        }
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(aSol);
                        _db.SaveChanges();
                        // 2021-10-17 根据sol采购价，更新cii成本价
                        if (!samePrice)
                        {
                            var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.sol_id == aSol.sol_id).ToList();
                            foreach (var cii in ciis)
                            {
                                cii.cii_purchase_price = aSol.sol_price_with_dis;
                                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(cii);
                                _db.SaveChanges();
                            }
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
            }
            else
            {
                iscreate = true;
            }
            if (iscreate)
            {
                // 在有 entity 的情况下，新建，如果没有，就不建立
                if (sol.SodId != 0)
                {
                    try
                    {
                        var aSol = PurchaseBaseLineTranslator.EntityToRepositorySol(sol, create: true);
                        _db.TM_SOL_SupplierOrder_Lines.AddObject(aSol);
                        _db.SaveChanges();
                        solId = aSol.sol_id;
                        if (string.IsNullOrEmpty(aSol.sol_client) && !string.IsNullOrEmpty(aSol.TM_SOD_Supplier_Order.soc_client))
                        {
                            aSol.sol_client = aSol.TM_SOD_Supplier_Order.soc_client;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(aSol);
                            _db.SaveChanges();
                        }
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            PurchaseBaseRepository.UpdateSodAmountBySol(sol.SodId);
            // 20231003 更新cin的收益
            ClientInvoiceLineRepository.CalculateCinProfit(0, sol.SodId);
            return solId;
        }

        public List<int> InsertSolExpress(List<PurchaseLineBaseClass> sols, int sodId)
        {
            var result = new List<int>();

            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sod_id == sodId);

            var vats = (from sol in sols
                        join vat in _db.TR_VAT_Vat
                            on sol.VatId equals vat.vat_id
                        select vat).ToList();

            var newsols = sols.Select(m => new TM_SOL_SupplierOrder_Lines
            {
                sod_id = sodId,
                sol_d_creation = DateTime.Now,
                sol_d_update = DateTime.Now,
                sol_order = m.Order,
                sol_description = m.Description,
                sol_prd_name = m.PrdName,
                sol_quantity = m.Quantity,
                sol_unit_price = m.UnitPrice,
                sol_total_price = m.TotalPrice,
                sol_discount_amount = 0,
                sol_price_with_dis = m.UnitPrice,
                sol_total_crude_price = (vats.Any(l => l.vat_id == m.VatId) ? (m.TotalPrice * (1 + vats.FirstOrDefault(l => l.vat_id == m.VatId).vat_vat_rate / 100)) : m.TotalPrice),
                sol_deadline = m.Deadline,
                sol_logistic = m.Logistic,
                sol_feature_code = m.FeatureCode,
                sol_guid = Guid.NewGuid(),
                sol_driver = null,
                sol_power = null,
                sol_temp_color = null,
                vat_id = (vats.Any(l => l.vat_id == m.VatId) ? m.VatId : (int?)null),
                sol_client = string.IsNullOrEmpty(m.Client) ? sod.soc_client : m.Client
            }).ToList();

            foreach (var onesol in newsols)
            {
                _db.TM_SOL_SupplierOrder_Lines.AddObject(onesol);
                _db.SaveChanges();
                result.Add(onesol.sol_id);
            }

            PurchaseBaseRepository.UpdateSodAmountBySol(sodId);

            return result;
        }

        public int UpdateSolLite(PurchaseLineBaseClass sol, out bool isFinished)
        {
            isFinished = false;
            var solId = sol.SolId;
            var aSol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(m => m.TM_SOD_Supplier_Order.soc_id == sol.SocId && m.sol_id == sol.SolId);
            if (aSol != null)
            {
                //bool dp = aSol.sol_d_production == sol.DProduction;
                bool de = aSol.sol_d_exp_delivery == sol.DExpDelivery;
                //bool dd = aSol.sol_d_delivery == sol.DDelivery;
                //bool deadline = aSol.sol_deadline == sol.Deadline;
                bool deta = aSol.sol_d_exp_arrival == sol.DExpArrival;

                aSol.sol_d_update = DateTime.Now;
                aSol.sol_d_production = sol.DProduction;
                aSol.sol_d_exp_delivery = sol.DExpDelivery;
                aSol.sol_d_delivery = sol.DDelivery;
                aSol.sol_feature_code = sol.FeatureCode;
                aSol.sol_d_shipping = sol.DShipping;
                aSol.sol_transporter = sol.Transporter;
                aSol.sol_d_exp_arrival = sol.DExpArrival;
                aSol.sol_logistics_number = sol.LogsNbr;
                //aSol.sol_comment = sol.Comment;
                aSol.sol_deadline = sol.Deadline;
                aSol.sol_client = sol.Client;
                //aSol.sol_comment = sol.Comment;
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(aSol);
                _db.SaveChanges();

                if (sol.UpdateAllSols)
                {
                    var allsols = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == aSol.sod_id && l.sol_id != aSol.sol_id).ToList();
                    foreach (var onesol in allsols)
                    {
                        //if (!dp) { onesol.sol_d_production = sol.DProduction; }
                        if (!de) { onesol.sol_d_exp_delivery = sol.DExpDelivery; }
                        //if (!dd) { onesol.sol_d_delivery = sol.DDelivery; }
                        //if (!deadline) { onesol.sol_deadline = sol.Deadline; }
                        if (!deta) { onesol.sol_d_exp_arrival = sol.DExpArrival; }
                        onesol.sol_client = sol.Client;
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                        _db.SaveChanges();
                    }
                }

                var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sod_id == aSol.sod_id);
                if (sod != null)
                {
                    isFinished = sol.SodFinish;
                    //if (sod.sod_sup_nbr != sol.SodSupNbr)
                    //{
                    sod.sod_sup_nbr = sol.SodSupNbr;
                    sod.sod_finish = sol.SodFinish;
                    _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                    _db.SaveChanges();
                    //}
                    if (sod.sod_finish == true)
                    {
                        CalendarRepository.DeletedAllNotifOfSod(sod.sod_id);
                    }
                }
            }
            return solId;
        }

        public List<PurchaseLineBaseClass> LoadSols(int socId, int sodId, int solId = 0, int lgsId = 0)
        {
            var sols = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.soc_id == socId
                && (solId == 0 || m.sol_id == solId)
                && (lgsId == 0 || m.TM_LGL_Logistic_Lines.Any(l => l.lgs_id == lgsId))
                ).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol(lgsId)).OrderBy(m => m.Order).ToList();

            //var solWithLgl = (from sol in sols
            //                  join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
            //                  select new { sol, lgl }).ToList();

            var solWithLglCil = (from sol in sols
                                 join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
                                 join cil in _db.TM_CII_ClientInvoice_Line on sol.SolId equals cil.sol_id
                                     into leftJ
                                 from lj in leftJ.DefaultIfEmpty()
                                 select new { sol, lgl, lj }).ToList();

            sols.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                //m.LglId = solWithLgl.Any(l => l.sol.SolId == m.SolId) ? 1 : 0;
                //var solLgs = solWithLgl.Where(l => l.sol.SolId == m.SolId).ToList();
                m.LglId = solWithLglCil.Any(l => l.sol.SolId == m.SolId) ? 1 : 0;
                var solLgs = solWithLglCil.Where(l => l.sol.SolId == m.SolId).ToList();
                var lgsinfos = solLgs.Select(sollgl => new KeyValue
                {
                    Key = sollgl.lgl.lgs_id,
                    Value = sollgl.lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                    Value2 = sollgl.lgl.TM_LGS_Logistic.lgs_tracking_number,
                    Value3 = sollgl.lgl.TM_LGS_Logistic.lgs_code,
                    Value4 = StringCipher.EncoderSimple(sollgl.lgl.lgs_id.ToString(), "lgsId"),
                    Key2 = sollgl.lgl.lgs_quantity ?? 0
                }).ToList();
                var ciis = solWithLglCil.Where(l => l.lj != null).Select(l => l.lj).Distinct().ToList();
                var ciiLgsInfo = (from oneCii in ciis
                                  from oneciilgs in oneCii.TM_LGL_Logistic_Lines
                                  select new KeyValue
                                  {
                                      Key = oneciilgs.lgs_id,
                                      Value = oneciilgs.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                                      Value2 = oneciilgs.TM_LGS_Logistic.lgs_tracking_number,
                                      Value3 = "CI-" + oneciilgs.TM_LGS_Logistic.lgs_code,
                                      Value4 = StringCipher.EncoderSimple(oneciilgs.lgs_id.ToString(), "lgsId"),
                                      Key2 = oneciilgs.lgs_quantity ?? 0
                                  }).Distinct().ToList();
                lgsinfos.AddRange(ciiLgsInfo);
                m.LgsInfos = lgsinfos;
                //m.DeliveriedQuantity = solWithLgl.Where(l => l.sol.SolId == m.SolId).Sum(l => l.lgl.lgs_quantity);
                m.DeliveriedQuantity = (solWithLglCil.Where(l => l.sol.SolId == m.SolId).Sum(l => l.lgl.lgs_quantity) + solWithLglCil.Where(l => l.lj != null).Sum(l => l.lj.TM_LGL_Logistic_Lines.Sum(k => k.lgs_quantity)));
            });

            return sols;
        }

        #region 供货商登录

        public List<PurchaseLineBaseClass> LoadSolsSup(int supId, int sodId, int solId = 0)
        {
            var sols = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.sup_id == supId
                && (solId == 0 || m.sol_id == solId)).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(m => m.Order).ToList();

            var solWithLgl = (from sol in sols
                              join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
                              select new { sol, lgl }).ToList();

            sols.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.LglId = solWithLgl.Any(l => l.sol.SolId == m.SolId) ? 1 : 0;
                var solLgs = solWithLgl.Where(l => l.sol.SolId == m.SolId).ToList();
                var lgsinfos = solLgs.Select(sollgl => new KeyValue
                {
                    Key = sollgl.lgl.lgs_id,
                    Value = sollgl.lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                    Value2 = sollgl.lgl.TM_LGS_Logistic.lgs_tracking_number,
                    Value3 = sollgl.lgl.TM_LGS_Logistic.lgs_code,
                    Value4 = StringCipher.EncoderSimple(sollgl.lgl.lgs_id.ToString(), "lgsId"),
                    Key2 = sollgl.lgl.lgs_quantity ?? 0
                }).ToList();
                m.LgsInfos = lgsinfos;
                m.DeliveriedQuantity = solWithLgl.Where(l => l.sol.SolId == m.SolId).Sum(l => l.lgl.lgs_quantity);
            });

            return sols;
        }

        #endregion 供货商登录

        public void DeleteSol(int socId, int sodId, int solId)
        {
            var item = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(m => m.TM_SOD_Supplier_Order.soc_id == socId && m.sod_id == sodId && m.sol_id == solId);
            // 2021-01-05 check exist spr payment
            var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Where(l => l.sol_id == item.sol_id);
            foreach (var onespr in sprs)
            {
                onespr.sol_id = null;
                _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(onespr);
            }
            _db.SaveChanges();

            // 2021-10-17 check cii exist
            var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.sol_id == solId);
            foreach (var cii in ciis)
            {
                cii.sol_id = null;
                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(cii);
            }
            _db.SaveChanges();
            _db.TM_SOL_SupplierOrder_Lines.DeleteObject(item);
            _db.SaveChanges();
            PurchaseBaseRepository.UpdateSodAmountBySol(sodId);
            SolAutoSort(socId, sodId);
        }

        /// <summary>
        /// 20251120 批量删除SOL
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="sodId"></param>
        /// <param name="solId"></param>
        public void DeleteSols(int socId, int sodId, List<int> solIds)
        {
            var sols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                        join solid in solIds on sol.sol_id equals solid
                        where sol.sod_id == sodId && sol.TM_SOD_Supplier_Order.soc_id == socId
                        select sol).ToList();

            var sprs = (from spr in _db.TR_SPR_SupplierOrder_Payment_Record
                        join solid in solIds on spr.sol_id equals solid
                        select spr).ToList();

            foreach (var onespr in sprs)
            {
                onespr.sol_id = null;
                _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(onespr);
            }
            _db.SaveChanges();
            var ciis = (from cii in _db.TM_CII_ClientInvoice_Line
                        join solid in solIds on cii.sol_id equals solid
                        select cii).ToList();

            foreach (var cii in ciis)
            {
                cii.sol_id = null;
                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(cii);
            }
            _db.SaveChanges();
            foreach (var onesol in sols)
            {
                _db.TM_SOL_SupplierOrder_Lines.DeleteObject(onesol);
            }
            _db.SaveChanges();
            PurchaseBaseRepository.UpdateSodAmountBySol(sodId);
            SolAutoSort(socId, sodId);
        }

        /// <summary>
        /// 20251113 删除某行之后，行号自动排序
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="sodId"></param>
        private void SolAutoSort(int socId, int sodId)
        {
            var sols = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == sodId && l.TM_SOD_Supplier_Order.soc_id == socId).OrderBy(l => l.sol_order).ToList();
            int count = 1;
            foreach (var sol in sols)
            {
                sol.sol_order = count;
                count++;
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
            }
            _db.SaveChanges();
        }

        public List<PurchaseLineBaseClass> SearchSolDetail(int socId, string client, string keyword, string sodname,
            string sodcode, string sup, DateTime dFrom, DateTime dTo, int cliId,
            bool nostart = false, bool nofinpr = false, bool noarrpr = false, bool nosend = false, bool finished = false)
        {
            var today = DateTime.Today;
            var sols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                        join sod in _db.TM_SOD_Supplier_Order on sol.sod_id equals sod.sod_id
                        where
                            (
                                //(string.IsNullOrEmpty(client) || sol.sol_client.Contains(client) || (string.IsNullOrEmpty(sod.soc_client) || sod.soc_client.Contains(client)))
                                (cliId == 0 || sod.cli_id == cliId)
                                && (string.IsNullOrEmpty(keyword)
                                    || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.Contains(keyword))
                                    ||
                                    (!string.IsNullOrEmpty(sol.sol_logistics_number) &&
                                     sol.sol_logistics_number.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_sup_nbr) && sod.sod_sup_nbr.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_supplier_comment) && sod.sod_supplier_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_inter_comment) && sod.sod_inter_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.soc_client) && sod.soc_client.Contains(keyword))
                                    )
                                )
                            && (sol.TM_SOD_Supplier_Order.soc_id == socId)
                            && (
                                (string.IsNullOrEmpty(sodname) || sod.sod_name.Contains(sodname))
                                &&
                                (string.IsNullOrEmpty(sodcode) || sod.sod_code.Contains(sodcode) ||
                                 sod.sod_sup_nbr.Contains(sodcode))
                                &&
                                (string.IsNullOrEmpty(sup) || sod.TM_SUP_Supplier.sup_company_name.Contains(sup))
                                )
                            // 未开始生产
                            && (nostart == false || !sol.sol_d_production.HasValue)
                            // 不论是否开始生产，没有预计交期
                            && (nofinpr == false || !sol.sol_d_exp_delivery.HasValue)
                            // 已发货但无预计到港日期
                            && (noarrpr == false || (sol.sol_d_shipping.HasValue && !sol.sol_d_exp_arrival.HasValue))

                            //&& (!sod.sod_finish.HasValue || sod.sod_finish.Value == false)
                            //// 预计已过未完成，或实际交期已过未发货
                            //&& (nosend == false ||
                            //(sol.sol_d_exp_delivery.HasValue && sol.sol_d_exp_delivery.Value.Date <= today && !sol.sol_d_delivery.HasValue) ||
                            //(sol.sol_d_delivery.HasValue && sol.sol_d_delivery.Value.Date <= today && !sol.sol_d_shipping.HasValue))
                            // 创建日期
                            && (sod.sod_d_creation >= dFrom) && (sod.sod_d_creation <= dTo)
                            && (finished || sod.sod_finish != true)
                        select sol).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol())
                .OrderBy(m => m.Order)
                .ToList()
                .Where(m =>
                    (nosend == false) ||
                    (m.DExpDelivery.HasValue && m.DExpDelivery.Value.Date <= today && !m.DDelivery.HasValue) ||
                    (m.DDelivery.HasValue && m.DDelivery.Value.Date <= today && !m.DShipping.HasValue)).ToList();


            var sodids = sols.Select(m => m.SodId).Distinct().ToList();

            var sods = (from sodid in sodids
                        join sod in _db.TM_SOD_Supplier_Order on sodid equals sod.sod_id
                        select sod).ToList();


            var solWithLgl = (from sol in sols
                              join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
                              select new { sol, lgl }).ToList();

            sols.ForEach(m =>
            {
                var onesod = sods.FirstOrDefault(l => l.sod_id == m.SodId);
                if (onesod != null)
                {
                    m.SodName = onesod.sod_name;
                    m.SodCode = onesod.sod_code;
                    m.SupplierCompanyName = onesod.TM_SUP_Supplier != null
                        ? onesod.TM_SUP_Supplier.sup_company_name
                        : string.Empty;
                    m.SodSupNbr = onesod.sod_sup_nbr;
                    m.SodFinish = onesod.sod_finish ?? false;
                    m.Commercial1 = onesod.usr_com_id.HasValue
                        ? (onesod.TM_USR_User_1.usr_firstname + " " + onesod.TM_USR_User_1.usr_lastname)
                        : string.Empty;
                    m.Client = onesod.cli_id.HasValue ? onesod.TM_CLI_CLient.cli_company_name : string.Empty;
                }
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.LglId = solWithLgl.Any(l => l.sol.SolId == m.SolId) ? 1 : 0;
                m.DeliveriedQuantity = solWithLgl.Where(l => l.sol.SolId == m.SolId).Sum(l => l.lgl.lgs_quantity);
                m.SolQuantity = m.Quantity - m.DeliveriedQuantity;
                var solLgs = solWithLgl.Where(l => l.sol.SolId == m.SolId).ToList();
                var lgsinfos = solLgs.Select(sollgl => new KeyValue
                {
                    Key = sollgl.lgl.lgs_id,
                    Value = sollgl.lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                    Value2 = sollgl.lgl.TM_LGS_Logistic.lgs_tracking_number,
                    Value3 = sollgl.lgl.TM_LGS_Logistic.lgs_code,
                    Value4 = StringCipher.EncoderSimple(sollgl.lgl.lgs_id.ToString(), "lgsId"),
                    Key2 = sollgl.lgl.lgs_quantity ?? 0
                }).ToList();
                m.LgsInfos = lgsinfos;

            });
            return sols;
        }


        /// <summary>
        /// 用于下载Payment详情
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="client"></param>
        /// <param name="keyword"></param>
        /// <param name="sodname"></param>
        /// <param name="sodcode"></param>
        /// <param name="sup"></param>
        /// <param name="dFrom"></param>
        /// <param name="dTo"></param>
        /// <param name="nostart"></param>
        /// <param name="nofinpr"></param>
        /// <param name="noarrpr"></param>
        /// <param name="nosend"></param>
        /// <param name="finished"></param>
        /// <returns></returns>
        public List<PurchaseBaseClass> SearchSolDetailForPayment(int socId, string client, string keyword, string sodname, string sodcode, string sup, DateTime dFrom, DateTime dTo, int cliId,
            bool nostart = false, bool nofinpr = false, bool noarrpr = false, bool nosend = false, bool finished = false)
        {
            var today = DateTime.Today;
            var sols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                        join sod in _db.TM_SOD_Supplier_Order on sol.sod_id equals sod.sod_id
                        where
                        (
                            //(string.IsNullOrEmpty(client) || sol.sol_client.Contains(client) || (string.IsNullOrEmpty(sod.soc_client) || sod.soc_client.Contains(client)))
                            (cliId == 0 || sod.cli_id == cliId)
                                && (string.IsNullOrEmpty(keyword)
                                    || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_logistics_number) && sol.sol_logistics_number.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.Contains(keyword))
                                    || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_sup_nbr) && sod.sod_sup_nbr.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_supplier_comment) && sod.sod_supplier_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.sod_inter_comment) && sod.sod_inter_comment.Contains(keyword))
                                    //|| (!string.IsNullOrEmpty(sod.soc_client) && sod.soc_client.Contains(keyword))
                                    )
                                )
                            && (sol.TM_SOD_Supplier_Order.soc_id == socId)
                            && (
                                (string.IsNullOrEmpty(sodname) || sod.sod_name.Contains(sodname))
                                &&
                                (string.IsNullOrEmpty(sodcode) || sod.sod_code.Contains(sodcode) ||
                                 sod.sod_sup_nbr.Contains(sodcode))
                                &&
                                (string.IsNullOrEmpty(sup) || sod.TM_SUP_Supplier.sup_company_name.Contains(sup))
                                )
                            // 未开始生产
                            && (nostart == false || !sol.sol_d_production.HasValue)
                            // 不论是否开始生产，没有预计交期
                            && (nofinpr == false || !sol.sol_d_exp_delivery.HasValue)
                            // 已发货但无预计到港日期
                            && (noarrpr == false || (sol.sol_d_shipping.HasValue && !sol.sol_d_exp_arrival.HasValue))

                            //&& (!sod.sod_finish.HasValue || sod.sod_finish.Value == false)
                            //// 预计已过未完成，或实际交期已过未发货
                            //&& (nosend == false ||
                            //(sol.sol_d_exp_delivery.HasValue && sol.sol_d_exp_delivery.Value.Date <= today && !sol.sol_d_delivery.HasValue) ||
                            //(sol.sol_d_delivery.HasValue && sol.sol_d_delivery.Value.Date <= today && !sol.sol_d_shipping.HasValue))
                            // 创建日期
                            && (sod.sod_d_creation >= dFrom) && (sod.sod_d_creation <= dTo)
                            && (finished || sod.sod_finish != true)
                        select sol)
                //.Select(PurchaseBaseLineTranslator.RepositoryToEntitySol())
                .OrderBy(m => m.sol_order)
                .ToList()
                .Where(m =>
                    (nosend == false) ||
                    (m.sol_d_exp_delivery.HasValue && m.sol_d_exp_delivery.Value.Date <= today &&
                     !m.sol_d_delivery.HasValue) ||
                    (m.sol_d_delivery.HasValue && m.sol_d_delivery.Value.Date <= today && !m.sol_d_shipping.HasValue));

            //var sodids = sols.Select(m => m.SodId).Distinct().ToList();

            var sods = (from sodid in sols
                        join sod in _db.TM_SOD_Supplier_Order on sodid.sod_id equals sod.sod_id
                        select sod).AsQueryable().Distinct().Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();

            return sods;
        }

        public void UpdateSolDetail(int socId, List<PurchaseLineBaseClass> sols2Update)
        {
            var sols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                        join sol2 in sols2Update on sol.sol_id equals sol2.SolId
                        where sol.TM_SOD_Supplier_Order.soc_id == socId
                        select sol).ToList();
            foreach (var onesol in sols)
            {
                var onesol2Up = sols2Update.FirstOrDefault(l => l.SolId == onesol.sol_id);
                if (onesol2Up != null)
                {
                    onesol.sol_d_update = DateTime.Now;
                    onesol.sol_d_production = onesol2Up.DProduction;
                    onesol.sol_d_delivery = onesol2Up.DDelivery;
                    onesol.sol_d_exp_delivery = onesol2Up.DExpDelivery;
                    onesol.sol_feature_code = onesol2Up.FeatureCode;
                    onesol.sol_d_shipping = onesol2Up.DShipping;
                    onesol.sol_transporter = onesol2Up.Transporter;
                    _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                }
            }
            _db.SaveChanges();
            sols2Update.Select(m => m.SodId).Distinct().ToList().ForEach(m => PurchaseBaseRepository.UpdateSodAmountBySol(m));
        }

        #region Payment record

        public int InsertUpdatePaymentRecord(int socId, KeyValue spr)
        {
            int sprId = 0;
            if (spr.Key != 0)
            {
                // update
                var oneSpr = _db.TR_SPR_SupplierOrder_Payment_Record.FirstOrDefault(l => l.spr_id == spr.Key);
                if (oneSpr != null)
                {
                    // Key3 supplier order id
                    if (spr.Key3 > 0 && spr.Key2 == 0)
                    {
                        // update sod payment, then update all 


                    }
                    else
                    {
                        // update sol payment, then update sod payment


                    }
                    // update amount before update record
                    var onesol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(l => l.sol_id == spr.Key2);
                    if (onesol != null)
                    {
                        onesol.sol_paid = onesol.sol_paid - oneSpr.spr_amount;
                        onesol.sol_need2pay = onesol.sol_need2pay + oneSpr.spr_amount;
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                        _db.SaveChanges();
                    }

                    oneSpr.spr_d_payment = spr.DValue2;
                    oneSpr.spr_amount = spr.DcValue;
                    oneSpr.spr_comment = spr.Value;
                    oneSpr.spr_d_update = DateTime.Now;
                    _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(oneSpr);
                    _db.SaveChanges();

                    // update amount after update record
                    onesol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(l => l.sol_id == spr.Key2);
                    if (onesol != null)
                    {
                        onesol.sol_paid = onesol.sol_paid + spr.DcValue;
                        onesol.sol_paid = onesol.sol_paid.HasValue ? Math.Round(onesol.sol_paid.Value, 2) : onesol.sol_paid;
                        onesol.sol_need2pay = onesol.sol_need2pay - spr.DcValue;
                        onesol.sol_need2pay = onesol.sol_need2pay.HasValue ? Math.Round(onesol.sol_need2pay.Value, 2) : onesol.sol_need2pay;
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                        _db.SaveChanges();
                    }
                    sprId = oneSpr.spr_id;
                }
            }
            else
            {
                // insert
                var oneSpr = new TR_SPR_SupplierOrder_Payment_Record
                {
                    spr_d_creation = DateTime.Now,
                    spr_d_payment = spr.DValue2,
                    spr_amount = spr.DcValue,
                    spr_comment = spr.Value,
                    sol_id = Convert.ToInt32(spr.Key2),
                    spr_d_update = DateTime.Now
                };
                _db.TR_SPR_SupplierOrder_Payment_Record.AddObject(oneSpr);
                _db.SaveChanges();

                // update amount after update record
                var onesol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(l => l.sol_id == spr.Key2);
                if (onesol != null)
                {
                    onesol.sol_paid = onesol.sol_paid + spr.DcValue;
                    onesol.sol_need2pay = onesol.sol_need2pay - spr.DcValue;
                    _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                    _db.SaveChanges();
                }
                sprId = oneSpr.spr_id;
            }

            return sprId;
        }

        public List<KeyValue> GetSolPr(int socId, int solId)
        {
            var sprs = (from sod in _db.TM_SOD_Supplier_Order
                        join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                        join spr in _db.TR_SPR_SupplierOrder_Payment_Record on sol.sol_id equals spr.sol_id
                        where sod.soc_id == socId && sol.sol_id == solId
                        select spr).Select(l => new KeyValue
                        {
                            Key = l.spr_id,
                            DValue = l.spr_d_creation,
                            DValue2 = l.spr_d_payment,
                            DcValue = l.spr_amount,
                            Value = l.spr_comment,
                            Key2 = l.sol_id ?? 0,
                            DValue3 = l.spr_d_update,
                            Value2 = l.spr_file
                        }).OrderBy(l => l.DValue2).ToList();

            return sprs;
        }


        #endregion Payment record

        public int DuplicateSol(int socId, int sodId, int solId)
        {
            var sol_id = 0;
            var onesol = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sol_id == solId
                && m.sod_id == sodId
                && m.TM_SOD_Supplier_Order.soc_id == socId).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).FirstOrDefault();
            if (onesol != null)
            {
                var newSol = ObjectCopier.DeepCopy(onesol);
                newSol.SolId = 0;
                //newSol.Order = onesol.Order + 1;
                // calculate order
                newSol.Transporter = null;
                newSol.LogsNbr = null;
                int solsCount = _db.TM_SOL_SupplierOrder_Lines.Count(l => l.sod_id == onesol.SodId);
                newSol.Order = solsCount + 1;
                newSol.DateCreation = DateTime.Now;
                newSol.DUpdate = DateTime.Now;
                var aCln = PurchaseBaseLineTranslator.EntityToRepositorySol(newSol, create: true);
                _db.TM_SOL_SupplierOrder_Lines.AddObject(aCln);
                _db.SaveChanges();
                sol_id = aCln.sol_id;
            }
            return sol_id;
        }

        public List<PurchaseLineBaseClass> LoadSolByPil(int socId, int pilId)
        {
            var sols = (from pil in _db.TM_PIL_PurchaseIntent_Lines
                        join sol in _db.TM_SOL_SupplierOrder_Lines on pil.pil_id equals sol.pil_id
                        where sol.TM_SOD_Supplier_Order.soc_id == socId
                        && sol.pil_id == pilId
                        select sol).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();

            sols.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });

            return sols;
        }

        public List<PurchaseLineBaseClass> GetAllPilSol(int socId, bool displayall)
        {
            var purchaseLine = new List<PurchaseLineBaseClass>();

            var allpil =
                _db.TM_PIL_PurchaseIntent_Lines.Where(l => !l.TM_PIN_Purchase_Intent.pin_closed).Select(PurchaseBaseLineTranslator.RepositoryToEntity()).ToList();

            var allsol =
                _db.TM_SOL_SupplierOrder_Lines.Where(l => !l.TM_SOD_Supplier_Order.sod_finish.HasValue || l.TM_SOD_Supplier_Order.sod_finish.Value == false).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();

            var solIdAdded = new List<int>();

            foreach (var onepil in allpil)
            {
                var pilsol = allsol.Where(l => l.PilId == onepil.PilId).ToList();
                if (pilsol.Any())
                {
                    foreach (var onepilsol in pilsol)
                    {
                        onepilsol.PilId = onepil.PilId;
                        onepilsol.PinCode = onepil.PinCode;
                        onepilsol.PinName = onepil.PinName;


                        solIdAdded.Add(onepilsol.SolId);
                        if (!displayall)
                        {
                            if (onepilsol.Quantity != onepilsol.QtyStored)
                            {
                                purchaseLine.Add(onepilsol);
                            }
                        }
                        else
                        {
                            purchaseLine.Add(onepilsol);
                        }
                    }
                }
                else
                {
                    purchaseLine.Add(onepil);
                }
            }
            var solwithoutPil = allsol.Where(l => !solIdAdded.Contains(l.SolId) && (displayall || (l.Quantity != l.QtyStored))).ToList();
            purchaseLine.AddRange(solwithoutPil);

            purchaseLine.ForEach(l =>
            {
                l.SodFId = l.SodId != 0 ? StringCipher.EncoderSimple(l.SodId.ToString(), "sodId") : "0";
                l.PinFId = l.PinId != 0 ? StringCipher.EncoderSimple(l.PinId.ToString(), "pinId") : "0";
            });

            return purchaseLine;
        }

        public void InsertSolsByExcelLines(int socId, int sodId, List<PurchaseLineBaseClass> lines)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sod_id == sodId && l.soc_id == socId);
            if (sod != null)
            {
                var solindb = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == sod.sod_id).OrderByDescending(l => l.sol_order).FirstOrDefault();
                var vat = sod.TR_VAT_Vat;
                var lineorder = solindb != null ? (solindb.sol_order + 1) : 1;
                lines.ForEach(l =>
                {
                    l.Order = lineorder;
                    lineorder++;
                    l.Guid = Guid.NewGuid();
                    l.Finished = false;
                    l.UnitPrice = Math.Round(l.UnitPrice.HasValue ? l.UnitPrice.Value : 0, 2, MidpointRounding.ToEven);
                    //l.TotalPrice = Math.Round(l.TotalPrice.HasValue ? l.TotalPrice.Value : 0, 2, MidpointRounding.ToEven);
                    l.TotalPrice = l.UnitPrice * l.Quantity;
                    l.TotalCrudePrice = Math.Round((l.TotalPrice * (1 + (vat != null ? vat.vat_vat_rate : 0))).Value, 2, MidpointRounding.ToEven);
                    l.Quantity = l.Quantity * 1;
                    l.SodId = sodId;
                    l.UnitPriceWithDis = l.UnitPrice;
                    l.DiscountAmount = 0;
                    l.VatId = vat != null ? vat.vat_id : (int?)null;
                });

                var sol2Insert = lines.Select(l => PurchaseBaseLineTranslator.EntityToRepositorySol(l, create: true)).ToList();
                foreach (var onesol in sol2Insert)
                {
                    _db.TM_SOL_SupplierOrder_Lines.AddObject(onesol);
                    _db.SaveChanges();
                    //PurchaseBaseRepository.UpdateSodAmountBySol(onesol.sol_id);
                }
                PurchaseBaseRepository.UpdateSodAmountBySol(sodId);
            }
        }

        public void UpdateSolDatesByLogistic(int solId, DateTime dShip, DateTime dExpArr, string tracknum, int usrId, int lgsId, string transportor)
        {
            var oneSol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(l => l.sol_id == solId);
            if (oneSol != null)
            {
                if (oneSol.sol_d_production == null)
                {
                    oneSol.sol_d_production = dShip;
                }
                oneSol.sol_d_delivery = dShip;
                oneSol.sol_d_shipping = dShip;
                oneSol.sol_d_exp_arrival = dExpArr;
                oneSol.sol_transporter = transportor;
                oneSol.sol_logistics_number = tracknum;
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(oneSol);
                _db.SaveChanges();

                // 修改日历
                CalendarRepository.UpdateSolDeliveryDateByLogistic(solId, dExpArr, usrId, lgsId);
            }
        }

        public List<PurchaseLineBaseClass> UpdateSolLogistic(int sodId, int socId, string logId)
        {
            var sols =
                _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == sodId && l.TM_SOD_Supplier_Order.soc_id == socId)
                    .ToList();
            sols.ForEach(l =>
            {
                l.sol_logistic = logId;
            });

            foreach (var onesol in sols)
            {
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                _db.SaveChanges();
            }
            //return sols.AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();

            return LoadSols(socId, sodId);
        }

        public List<PurchaseLineBaseClass> UpdateSolVAT(int sodId, int socId, int vatId)
        {
            var vat = _db.TR_VAT_Vat.FirstOrDefault(l => l.vat_id == vatId);
            if (vat != null)
            {
                var sols =
                    _db.TM_SOL_SupplierOrder_Lines.Where(
                        l => l.sod_id == sodId && l.TM_SOD_Supplier_Order.soc_id == socId)
                        .ToList();
                sols.ForEach(l =>
                {
                    l.vat_id = vat.vat_id;
                    l.sol_total_crude_price = l.sol_total_price * (1 + vat.vat_vat_rate / 100);
                });

                foreach (var onesol in sols)
                {
                    _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                    _db.SaveChanges();
                }
                return LoadSols(socId, sodId);
            }
            else
            {
                return null;
            }
        }

        /// <summary>
        /// 20230209 快速改变SOL的序号
        /// </summary>
        /// <param name="sodId"></param>
        /// <param name="solId"></param>
        /// <param name="upDown">0 向上，1 向下</param>
        /// <param name="socId"></param>
        /// <returns></returns>
        public int ChangeSolPosition(int sodId, int solId, int upDown, int socId)
        {
            var sols = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == sodId && l.TM_SOD_Supplier_Order.soc_id == socId).OrderBy(l => l.sol_order);
            int returnvalue = 0;
            if (sols.Any())
            {
                var thisSol = sols.FirstOrDefault(l => l.sol_id == solId);
                if (thisSol != null)
                {
                    var thissolOrder = thisSol.sol_order;
                    var nearSol = upDown == 0
                        ? sols.Where(l => l.sol_order < thissolOrder).OrderByDescending(l => l.sol_order).FirstOrDefault()
                        : sols.Where(l => l.sol_order > thissolOrder).OrderBy(l => l.sol_order).FirstOrDefault();
                    // 取序号最近的
                    if (nearSol != null)
                    {
                        var nearSolOrder = nearSol.sol_order;
                        nearSol.sol_order = thisSol.sol_order;
                        thisSol.sol_order = nearSolOrder;
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(thisSol);
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(nearSol);
                        _db.SaveChanges();
                        returnvalue = solId;
                    }
                }
            }
            return returnvalue;
        }

        #endregion Supplier Order

        #region Supplier Invoice

        public int InsertUpdateSil(PurchaseLineBaseClass sil)
        {
            bool iscreate = false;
            int silId = 0;
            if (sil.SilId != 0)
            {
                silId = sil.SilId;
                if (sil.SilId != 0)
                {
                    var aSil = _db.TM_SIL_SupplierInvoice_Lines.FirstOrDefault(m => m.sin_id == sil.SinId && m.TM_SIN_Supplier_Invoice.soc_id == sil.SocId && m.sil_id == sil.SilId);
                    if (aSil != null)
                    {
                        aSil = PurchaseBaseLineTranslator.EntityToRepositorySil(sil, aSil);
                        _db.TM_SIL_SupplierInvoice_Lines.ApplyCurrentValues(aSil);
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
                // 在有 entity 的情况下，新建，如果没有，就不建立
                if (sil.SinId != 0)
                {
                    try
                    {
                        var aSil = PurchaseBaseLineTranslator.EntityToRepositorySil(sil, create: true);
                        _db.TM_SIL_SupplierInvoice_Lines.AddObject(aSil);
                        _db.SaveChanges();
                        silId = aSil.sil_id;
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            return silId;
        }

        public List<PurchaseLineBaseClass> LoadSils(int socId, int sinId, int silId = 0)
        {
            var sols = _db.TM_SIL_SupplierInvoice_Lines.Where(m => m.sin_id == sinId && m.TM_SIN_Supplier_Invoice.soc_id == socId
                && (silId == 0 || m.sol_id == silId)).Select(PurchaseBaseLineTranslator.RepositoryToEntitySil()).OrderBy(m => m.Order).ToList();

            sols.ForEach(m =>
            {
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
            });

            return sols;
        }

        public void DeleteSil(int socId, int sinId, int silId)
        {
            var item = _db.TM_SIL_SupplierInvoice_Lines.FirstOrDefault(m => m.TM_SIN_Supplier_Invoice.soc_id == socId && m.sin_id == sinId && m.sil_id == silId);
            _db.TM_SIL_SupplierInvoice_Lines.DeleteObject(item);
            _db.SaveChanges();
        }

        #endregion Supplier Invoice
    }
}

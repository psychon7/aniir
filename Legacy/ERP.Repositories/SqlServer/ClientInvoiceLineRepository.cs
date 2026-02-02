using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.SqlServer
{
    public class ClientInvoiceLineRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// Get all cost plan line by cost plan id
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <param name="lgsId"></param>
        /// <returns></returns>
        public List<ClientInvoiceLine> GetCiisByCinId(int socId, int cinId, int lgsId = 0)
        {
            var ciis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId
                && m.TM_CIN_Client_Invoice.soc_id == socId
                && (lgsId == 0 || m.TM_LGL_Logistic_Lines.Any(l => l.lgs_id == lgsId))
                ).Select(ClientInvoiceLineTranslator.RepositoryToEntity(lgsId)).OrderBy(m => m.CiiLevel1).ThenBy(m => m.CiiLevel2).ToList();
            if (ciis.Any())
            {
                var ptyAccsIds = (from pty in _db.TM_PTY_Product_Type
                                  from ptyAcc in ProductTypeWithOutTSheet
                                  where pty.pty_name.Contains(ptyAcc)
                                  select pty.pty_id).ToList();

                var clnpil = (from cln in ciis
                                  //join pil in _db.TM_PIL_PurchaseIntent_Lines on cln.CiiId equals pil.cii_id
                              join sol in _db.TM_SOL_SupplierOrder_Lines on cln.SolId equals sol.sol_id
                                  into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              select new { lj }).ToList();
                var lglLines = new List<KeyValue>();
                if (lgsId == 0)
                {
                    lglLines = (from cln in ciis
                                join lgl in _db.TM_LGL_Logistic_Lines on cln.CiiId equals lgl.cii_id
                                select new KeyValue
                                {
                                    Key = cln.CiiId,
                                    Key3 = lgl.lgs_id,
                                    Value = lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                                    Value2 = lgl.TM_LGS_Logistic.lgs_tracking_number,
                                    Value3 = lgl.TM_LGS_Logistic.lgs_code,
                                    Value4 = StringCipher.EncoderSimple(lgl.lgs_id.ToString(), "lgsId"),
                                    Key2 = lgl.lgs_quantity ?? 0
                                }).Distinct().ToList();

                    var lglSolLines = (from cln in ciis
                                       join sol in _db.TM_SOL_SupplierOrder_Lines on cln.SolId equals sol.sol_id
                                       join lgl in _db.TM_LGL_Logistic_Lines on sol.sol_id equals lgl.sol_id
                                       select new KeyValue
                                       {
                                           Key = cln.CiiId,
                                           Key3 = lgl.lgs_id,
                                           Value = lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                                           Value2 = lgl.TM_LGS_Logistic.lgs_tracking_number,
                                           Value3 = "SO-" + lgl.TM_LGS_Logistic.lgs_code,
                                           Value4 = StringCipher.EncoderSimple(lgl.lgs_id.ToString(), "lgsId"),
                                           Key2 = lgl.lgs_quantity ?? 0
                                       }).Distinct().ToList();
                    lglLines.AddRange(lglSolLines);
                    lglLines = lglLines.Distinct().ToList();
                }

                ciis.ForEach(m =>
                {
                    m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                    m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                    m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                    m.IsAcc = ptyAccsIds.Any(l => l == m.PtyId);
                    var pil = clnpil.FirstOrDefault(l => l.lj != null && l.lj.sol_id == m.SolId);
                    m.PilId = pil != null && pil.lj.TM_PIL_PurchaseIntent_Lines != null ? pil.lj.TM_PIL_PurchaseIntent_Lines.pil_id : 0;
                    //m.SolId = pil != null && pil.lj != null ? pil.lj.sol_id : 0; //20230608 屏蔽此行
                    m.PinFId = m.PilId != 0 && pil.lj.TM_PIL_PurchaseIntent_Lines != null ? StringCipher.EncoderSimple(pil.lj.TM_PIL_PurchaseIntent_Lines.pin_id.ToString(), "pinId") : string.Empty;
                    m.SodFId = m.SolId != 0 ? StringCipher.EncoderSimple(pil.lj.TM_SOD_Supplier_Order.sod_id.ToString(), "sodId") : string.Empty;
                    m.CiiLglList = lglLines.Where(l => l.Key == m.CiiId).Distinct().ToList();
                });
            }
            return ciis;
        }

        /// <summary>
        /// 添加或更新cost plan line
        /// </summary>
        /// <param name="cln"></param>
        /// <returns></returns>
        public int InsertUpdateCii(ClientInvoiceLine cln, bool forDrv = false)
        {
            bool iscreate = false;
            int ciiId = 0;
            int prdId = 0;
            int pitId = 0;
            CheckPrdAndPit(cln.SocId, cln.PrdId ?? 0, cln.PitId ?? 0, cln.PrdName, cln.PitName, out prdId, out pitId);
            cln.PrdId = prdId;
            cln.PitId = pitId;
            int oldLevel1 = 0;
            int newLevel1;
            if (!forDrv)
            {
                SortCii(ref cln, out oldLevel1, out newLevel1);
            }
            else
            {
                // 为driver 和 accessory 重新排序
                var prdCln = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.TM_CIN_Client_Invoice.soc_id == cln.SocId && m.cin_id == cln.CinId && m.prd_id == cln.PrdId2);
                if (prdCln != null)
                {
                    newLevel1 = prdCln.cii_level1 ?? 0;
                    cln.CiiLevel1 = newLevel1;
                    cln.CiiLevel2 = (prdCln.cii_level2 ?? 0) + 1;
                    if (newLevel1 == 0)
                    {
                        SortCii(ref cln, out oldLevel1, out newLevel1);
                    }
                }
                else
                {
                    SortCii(ref cln, out oldLevel1, out newLevel1);
                }
            }
            if (cln.CiiId != 0)
            {
                ciiId = cln.CiiId;
                if (cln.CinId != 0)
                {
                    var aCii = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.cii_id == cln.CiiId && m.TM_CIN_Client_Invoice.soc_id == cln.SocId && m.cin_id == cln.CinId);
                    if (aCii != null)
                    {
                        aCii = ClientInvoiceLineTranslator.EntityToRepository(cln, aCii);
                        _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(aCii);
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
                // 在有cpl的情况下，新建，如果没有，就不建立
                if (cln.CinId != 0)
                {
                    try
                    {
                        var aCii = ClientInvoiceLineTranslator.EntityToRepository(cln, create: true);
                        _db.TM_CII_ClientInvoice_Line.AddObject(aCii);
                        _db.SaveChanges();
                        ciiId = aCii.cii_id;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            CalculateSubTotalAndTotal(cln.SocId, cln.CinId, oldLevel1, newLevel1);
            _UpdateCinRestToPay(cln.SocId, cln.CinId);
            CalculateCinProfit(cln.CinId, 0);
            return ciiId;
        }

        public void DeleteCii(int socId, int cinId, int clnId)
        {
            var cln = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.cii_id == clnId && m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId);
            if (cln != null)
            {
                int level1 = cln.cii_level1 ?? 0;
                _db.TM_CII_ClientInvoice_Line.DeleteObject(cln);
                _db.SaveChanges();
                ReSortAfterDelete(socId, cinId, level1);
                CalculateSubTotalAndTotal(socId, cinId, level1, 0);
            }
            _UpdateCinRestToPay(socId, cinId);
            CiiAutoSort(socId, cinId);
        }

        /// <summary>
        /// 20251113 删除cii之后重新排序
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        public void CiiAutoSort(int socId, int cinId)
        {
            var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cinId && l.TM_CIN_Client_Invoice.soc_id == socId).OrderBy(l => l.cii_level1).ThenBy(l => l.cii_level2).ToList();
            var countlevel1 = ciis.Select(l => l.cii_level1).Distinct().OrderBy(l => l).ToList();
            int count = 1;
            foreach (var level1 in countlevel1)
            {
                int? curLevel1 = level1;
                var allciis = ciis.Where(l => l.cii_level1 == curLevel1).OrderBy(l => l.cii_level2).ToList();
                int countlevel2 = 1;
                foreach (var item in allciis)
                {
                    item.cii_level1 = count;
                    item.cii_level2 = countlevel2;
                    countlevel2++;
                    _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(item);
                }
                count++;
            }
            _db.SaveChanges();
        }


        /// <summary>
        /// 检查product 和 product instance
        /// </summary>
        /// <returns></returns>
        private void CheckPrdAndPit(int socId, int prdId, int pitId, string prdName, string pitName, out int checkedPrdid, out int checkedPitId)
        {
            var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == pitId && m.prd_id == prdId
                                                                         && m.TM_PRD_Product.soc_id == socId
                                                                         //&& m.TM_PRD_Product.prd_ref.Contains(prdName)
                                                                         //&& m.pit_ref.Contains(pitName)
                                                                         );
            if (onePit != null)
            {
                checkedPitId = onePit.pit_id;
                checkedPrdid = onePit.prd_id;
            }
            else
            {
                checkedPitId = 0;
                checkedPrdid = 0;
            }
        }

        private void SortCii(ref ClientInvoiceLine onecln, out int theOldLevel1, out int theNewLevel1)
        {
            theOldLevel1 = 0;
            theNewLevel1 = 0;
            int cinId = onecln.CinId;
            int clnId = onecln.CiiId;
            int socId = onecln.SocId;
            int targetLevel1 = onecln.CiiLevel1 ?? 1;
            int targetLevel2 = onecln.CiiLevel2 ?? 1;
            var oldCii = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.cin_id == cinId && m.cii_id == clnId && m.TM_CIN_Client_Invoice.soc_id == socId);
            bool create = oldCii == null;
            if (oldCii != null)
            {
                theOldLevel1 = oldCii.cii_level1 ?? 0;
            }
            // add line or update line 
            if (onecln.LtpId == 5 || onecln.LtpId == 6)
            {
                // if this is a total line, check total line existed ?
                if (onecln.LtpId == 5)
                {
                    if (create)
                    {
                        // 查看当前的array里面是否已经有了sub total，如果有，则更新，如果没有，则添加
                        var subTotal = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1 && m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            // update
                            onecln.CiiId = subTotal.cii_id;
                        }
                        else
                        {
                            // create
                            var lineInSameLevel1 = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1).ToList();
                            if (lineInSameLevel1.Any())
                            {
                                int level2 = lineInSameLevel1.Max(m => m.cii_level2) ?? 0;
                                onecln.CiiLevel2 = level2 + 1;
                            }
                            else
                            {
                                // 没有相同的level1，将最大的level1取出来，然后level2=1
                                var maxLevel = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).Max(m => m.cii_level1) ?? 0;
                                onecln.CiiLevel1 = maxLevel + 1;
                                onecln.CiiLevel2 = 1;
                                // 只有sub total 的情况下，将type 设置成 text
                                onecln.LtpId = 3;
                            }
                        }
                    }
                    else
                    {
                        // 需要测试level1是否改变，如果改变要重新排序两个序列
                        var level1changed = oldCii.cii_level1 != onecln.CiiLevel1;
                        if (level1changed)
                        {
                            // 排序两个列
                            int oldLevel1 = oldCii.cii_level1 ?? 1;
                            var oldArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == oldLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCii in oldArray)
                            {
                                tmpCii.cii_level2 = level2Count;
                                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            var newArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.cii_level2).ToList();
                            level2Count = 1;
                            foreach (var tmpCii in normalNewArray)
                            {
                                tmpCii.cii_level2 = level2Count;
                                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecln.CiiLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.cii_id != clnId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_CII_ClientInvoice_Line.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }
                        else
                        {
                            // 排序一个列
                            var newArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.cii_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCii in normalNewArray)
                            {
                                tmpCii.cii_level2 = level2Count;
                                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecln.CiiLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.cii_id != clnId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_CII_ClientInvoice_Line.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }

                    }
                }
                else
                {
                    // 测试是否存在总total，存在测更新，不存在则建立
                    var allTotal = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.ltp_id == 6);
                    if (allTotal != null)
                    {
                        _db.TM_CII_ClientInvoice_Line.DeleteObject(allTotal);
                        _db.SaveChanges();
                    }
                    if (!create)
                    {
                        // 排序原来序列
                        int oldLevel1 = oldCii.cii_level1 ?? 1;
                        var oldArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == oldLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCii in oldArray)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                    }
                    var maxLevel = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).Max(m => m.cii_level1) ?? 0;
                    onecln.CiiLevel1 = maxLevel + 1;
                    onecln.CiiLevel2 = 1;
                }
            }
            else
            {
                if (create)
                {
                    var lineInSameLevel1 = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1).ToList();
                    if (lineInSameLevel1.Any())
                    {
                        var smallerLevel2 = lineInSameLevel1.Where(m => m.cii_level2 < targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cii_level2).ToList();
                        var biggerLevel2 = lineInSameLevel1.Where(m => m.cii_level2 >= targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cii_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCii in smallerLevel2)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        onecln.CiiLevel2 = level2Count;
                        level2Count++;
                        foreach (var tmpCii in biggerLevel2)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var total = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 6);
                        if (total != null)
                        {
                            total.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(total);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 没有相同的level1，将最大的level1取出来，然后level2=1
                        var maxLevel = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).Max(m => m.cii_level1) ?? 0;
                        onecln.CiiLevel1 = maxLevel + 1;
                        onecln.CiiLevel2 = 1;
                    }
                }
                else
                {
                    // 需要测试level1是否改变，如果改变要重新排序两个序列
                    var level1changed = oldCii.cii_level1 != onecln.CiiLevel1;
                    if (level1changed)
                    {
                        // 排序两个列
                        int oldLevel1 = oldCii.cii_level1 ?? 1;
                        var oldArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == oldLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCii in oldArray)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var newArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.cii_level2 < targetLevel2).OrderBy(m => m.cii_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.cii_level2 >= targetLevel2).OrderBy(m => m.cii_level2).ToList();
                        level2Count = 1;
                        foreach (var tmpCii in normalNewArraySmaller)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecln.CiiLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCii in normalNewArrayBigger)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }

                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 排序一个列
                        var newArray = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == targetLevel1 && m.cii_id != clnId).OrderBy(m => m.cii_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.cii_level2 < targetLevel2).OrderBy(m => m.cii_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.cii_level2 >= targetLevel2).OrderBy(m => m.cii_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCii in normalNewArraySmaller)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecln.CiiLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCii in normalNewArrayBigger)
                        {
                            tmpCii.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cii_level2 = level2Count;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                }
            }
            theNewLevel1 = onecln.CiiLevel1 ?? 0;
        }

        private void CalculateSubTotalAndTotal(int socId, int cinId, int oldLevel1, int newLevel1)
        {
            var allCiis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).ToList();
            if (oldLevel1 != 0)
            {
                // update old sub total
                var oldCiis = allCiis.Where(m => m.cii_level1 == oldLevel1).ToList();
                var oldSubTotal = oldCiis.FirstOrDefault(m => m.ltp_id == 5);
                if (oldCiis.Any() && oldSubTotal != null)
                {
                    var totalHt = oldCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_price);
                    var totalTtc = oldCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_crude_price);
                    oldSubTotal.cii_total_price = totalHt;
                    oldSubTotal.cii_total_crude_price = totalTtc;
                    _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(oldSubTotal);
                    _db.SaveChanges();
                }
            }
            if (newLevel1 != 0)
            {
                // update new sub total
                var newCiis = allCiis.Where(m => m.cii_level1 == newLevel1).ToList();
                var newSubTotal = newCiis.FirstOrDefault(m => m.ltp_id == 5);
                if (newCiis.Any() && newSubTotal != null)
                {
                    var totalHt = newCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_price);
                    var totalTtc = newCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_crude_price);
                    newSubTotal.cii_total_price = totalHt;
                    newSubTotal.cii_total_crude_price = totalTtc;
                    _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(newSubTotal);
                    _db.SaveChanges();
                }
            }
            // update total 
            var totalLine = allCiis.FirstOrDefault(m => m.ltp_id == 6);
            if (totalLine != null)
            {
                var totalHt = allCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_price);
                var totalTtc = allCiis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => m.cii_total_crude_price);
                totalLine.cii_total_price = totalHt;
                totalLine.cii_total_crude_price = totalTtc;
                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(totalLine);
                _db.SaveChanges();

            }
        }

        private void ReSortAfterDelete(int socId, int cinId, int oldLevel1)
        {
            var allCiis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cii_level1 == oldLevel1).OrderBy(m => m.cii_level2).ToList();
            int level2Count = 1;
            foreach (var tmpCii in allCiis)
            {
                tmpCii.cii_level2 = level2Count;
                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(tmpCii);
                _db.SaveChanges();
                level2Count++;
            }
        }

        public ClinetInvoiceGeneralInfo GetClinetInvoiceInfo(int socId, int cinId)
        {
            var cplInfo = new ClinetInvoiceGeneralInfo();
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                var ciis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cin.cin_id).ToList();
                var amountHt = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_price ?? 0));
                var amountTtc = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_crude_price ?? 0));
                var totalpurchasePrice = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_purchase_price ?? 0) * m.cii_quantity);
                var totalSalePrice = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_price_with_discount_ht ?? m.cii_unit_price ?? 0) * m.cii_quantity);
                // 20231003 注释掉，直接用cinmargin
                //var totalMargin = totalSalePrice - totalpurchasePrice;
                cplInfo = new ClinetInvoiceGeneralInfo
                {
                    CinId = cin.cin_id,
                    FId = StringCipher.EncoderSimple(cin.cin_id.ToString(), "cinId"),
                    CinDiscountPercentage = cin.cin_discount_percentage ?? 0,
                    CinDiscountAmount = cin.cin_discount_amount ?? 0,
                    TotalAmountHt = amountHt,
                    TotalAmountTtc = amountTtc,
                    TotalMargin = cin.cin_margin ?? 0,
                    TotalPurchasePrice = totalpurchasePrice,
                    TotalSalePrice = totalSalePrice
                };
                var ht = cplInfo.TotalAmountHt - cplInfo.CinDiscountAmount;
                var ttc = ht * (1 + ((cplInfo.TotalAmountTtc - cplInfo.TotalAmountHt) / (cplInfo.TotalAmountHt != 0 ? cplInfo.TotalAmountHt : 1)));

                cplInfo.TotalAmountHt = ht;
                cplInfo.TotalAmountTtc = ttc;
            }
            return cplInfo;
        }

        public ClientInvoicePaymentInfo GetClinetInvoicePaymentInfo(int socId, int cinId)
        {
            var cplInfo = new ClientInvoicePaymentInfo();
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                var ciis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cin.cin_id).ToList();
                var amountHt = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_price ?? 0));
                var amountTtc = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_crude_price ?? 0));
                var totalpurchasePrice = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_purchase_price ?? 0) * m.cii_quantity);
                // 20231002 要考虑汇率问题，已处理
                var totalSalePrice = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_price_with_discount_ht ?? m.cii_unit_price ?? 0) * m.cii_quantity);
                // 20231003 注释掉，直接用cinmargin
                //var totalMargin = totalSalePrice - totalpurchasePrice;
                cplInfo = new ClientInvoicePaymentInfo
                {
                    CinId = cin.cin_id,
                    FId = StringCipher.EncoderSimple(cin.cin_id.ToString(), "cinId"),
                    CinDiscountPercentage = cin.cin_discount_percentage ?? 0,
                    CinDiscountAmount = cin.cin_discount_amount ?? 0,
                    TotalAmountHt = amountHt,
                    TotalAmountTtc = amountTtc,
                    TotalMargin = cin.cin_margin ?? 0,
                    TotalPurchasePrice = totalpurchasePrice,
                    TotalSalePrice = totalSalePrice
                };
                var ht = cplInfo.TotalAmountHt - cplInfo.CinDiscountAmount;
                var ttc = ht * (1 + ((cplInfo.TotalAmountTtc - cplInfo.TotalAmountHt) / (cplInfo.TotalAmountHt != 0 ? cplInfo.TotalAmountHt : 1)));

                cplInfo.TotalAmountHt = ht;
                cplInfo.TotalAmountTtc = ttc;
                cplInfo.CurrencySymbol = cin.TR_CUR_Currency.cur_symbol;
            }
            return cplInfo;
        }

        private ClientInvoicePaymentInfo _GetCinPaymentInfo(int socId, int cinId)
        {
            var cinInfo = GetClinetInvoicePaymentInfo(socId, cinId);
            cinInfo.CinPaymentList = _GetClientInvoicePaymentsList(socId, cinId);
            decimal? paid = cinInfo.CinPaymentList.Sum(m => m.CpyAmount);
            var total2pay = cinInfo.TotalAmountTtc;
            var rest2pay = (total2pay ?? 0) - (paid ?? 0);
            cinInfo.CinTotal2Pay = total2pay ?? 0;
            cinInfo.CinPaid = paid ?? 0;
            cinInfo.CinRest2Pay = rest2pay;
            return cinInfo;
        }

        private List<ClientInvoicePayment> _GetClientInvoicePaymentsList(int socId, int cinId, bool loadFile = false)
        {
            var cpys = _db.TM_CPY_ClientInvoice_Payment.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).Select(m => new ClientInvoicePayment
            {
                CinId = m.cin_id,
                Id = m.cpy_id,
                CpyAmount = m.cpy_amount,
                CpyFile = m.cpy_file,
                CpyDCreation = m.cpy_d_create,
                HasFile = m.cpy_file != null && m.cpy_file != ""
            }).ToList();
            cpys.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "cpyId");
                if (!loadFile)
                {
                    m.CpyFile = string.Empty;
                }
            });
            return cpys;
        }

        /// <summary>
        /// Same as UpdateCinRestToPay in ClientInoiveRepository
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        private void _UpdateCinRestToPay(int socId, int cinId)
        {
            var cininfo = _GetCinPaymentInfo(socId, cinId);
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                cin.cin_rest_to_pay = cininfo.CinRest2Pay;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                _db.SaveChanges();
            }
        }

        public void InsertupdateCiis(List<ClientInvoiceLine> ciis)
        {
            foreach (var cii in ciis)
            {
                InsertUpdateCii(cii, true);
            }
        }


        /// <summary>
        /// 20240507 快速改变CII的序号
        /// </summary>
        /// <param name="cinId"></param>
        /// <param name="ciiId"></param>
        /// <param name="upDown">0 向上，1 向下</param>
        /// <param name="socId"></param>
        /// <returns></returns>
        public int ChangeCiiPosition(int cinId, int ciiId, int upDown, int socId)
        {
            var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cinId && l.TM_CIN_Client_Invoice.soc_id == socId).OrderBy(l => l.cii_level1).ThenBy(l => l.cii_level2);
            int returnvalue = 0;
            if (ciis.Any())
            {
                var thisSol = ciis.FirstOrDefault(l => l.cii_id == ciiId);
                if (thisSol != null)
                {
                    // 确认是调整整数部分还是小数部分
                    // 如果小数部分大于1，则调整小数部分，否则是调整整数部分
                    IQueryable<TM_CII_ClientInvoice_Line> cii2treat;
                    if (thisSol.cii_level2 == 1)
                    {
                        // 调整整数部分
                        cii2treat = ciis.Where(l => l.cii_level2 == 1);
                        var thissolOrder = thisSol.cii_level1;
                        var nearSol = upDown == 0 ? cii2treat.Where(l => l.cii_level1 < thissolOrder).OrderByDescending(l => l.cii_level1).FirstOrDefault() : cii2treat.Where(l => l.cii_level1 > thissolOrder).OrderBy(l => l.cii_level1).FirstOrDefault();
                        // 取序号最近的
                        if (nearSol != null)
                        {
                            var nearSolOrder = nearSol.cii_level1;
                            nearSol.cii_level1 = thisSol.cii_level1;
                            thisSol.cii_level1 = nearSolOrder;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(thisSol);
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(nearSol);
                            _db.SaveChanges();
                            returnvalue = ciiId;
                        }
                    }
                    else
                    {
                        // 调整小数部分
                        cii2treat = ciis.Where(l => l.cii_level1 == thisSol.cii_level1);
                        var thissolOrder = thisSol.cii_level2;
                        var nearSol = upDown == 0 ? cii2treat.Where(l => l.cii_level2 < thissolOrder).OrderByDescending(l => l.cii_level2).FirstOrDefault() : cii2treat.Where(l => l.cii_level2 > thissolOrder).OrderBy(l => l.cii_level2).FirstOrDefault();
                        // 取序号最近的
                        if (nearSol != null)
                        {
                            var nearSolOrder = nearSol.cii_level2;
                            nearSol.cii_level2 = thisSol.cii_level2;
                            thisSol.cii_level2 = nearSolOrder;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(thisSol);
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(nearSol);
                            _db.SaveChanges();
                            returnvalue = ciiId;
                        }
                    }

                }
            }
            return returnvalue;
        }


        /// <summary>
        /// 为创建DFO而重新获取所有Cii，其中包含所有的已经有DFL的信息
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <returns></returns>
        public List<ClientInvoiceLine> GetCiisByCinIdForDfo(int socId, int cinId)
        {
            var ciiswithDfls = (from cii in _db.TM_CII_ClientInvoice_Line
                                join dfl in _db.TM_DFL_DevlieryForm_Line on cii.cii_id equals dfl.cii_id
                                    into leftJ
                                from lj in leftJ.DefaultIfEmpty()
                                where cii.cin_id == cinId && cii.TM_CIN_Client_Invoice.soc_id == socId
                                && !cii.col_id.HasValue
                                select new { cii, lj }).GroupBy(l => l.cii).ToList();
            var result = new List<ClientInvoiceLine>();
            foreach (var oneCii in ciiswithDfls)
            {
                var cii = ClientInvoiceLineTranslator.RepositoryToEntity().Compile().Invoke(oneCii.Key);
                cii.DflQuantity = oneCii.Where(l => l.lj != null).Sum(l => l.lj.dfl_quantity);
                result.Add(cii);
            }
            return result;
        }

        #region 20230930 计算CIN 盈利

        /// <summary>
        /// 20231001 计算CIN收益
        /// </summary>
        /// <param name="cinId"></param>
        /// <param name="sodId"></param>
        /// <returns></returns>
        public decimal CalculateCinProfit(int cinId, int sodId)
        {
            if (cinId == 0)
            {
                // 用 sod 计算
                var cin = _db.TR_CSO_ClientInvoice_SupplierOrder.FirstOrDefault(l => l.sod_id == sodId);
                if (cin != null)
                {
                    calculecinprofile(cin.cin_id);
                }
            }
            else
            {
                calculecinprofile(cinId);
            }
            return 0;
        }

        private void calculecinprofile(int cinId)
        {
            List<TR_CSO_ClientInvoice_SupplierOrder> cinSods = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.cin_id == cinId).ToList();
            if (cinSods.Any())
            {
                // 计算每个cin的售价
                var usdcur = _db.TR_CUR_Currency.FirstOrDefault(l => l.cur_designation == "USD");
                // 以美元作为核算的基础货币，核算所有sod 的总数据
                decimal? allsod_cinSom = 0;
                var oneCinSod = cinSods.FirstOrDefault();
                var onecin = oneCinSod.TM_CIN_Client_Invoice;
                decimal cin_exchange_rate = 1;
                if (onecin.TR_CUR_Currency.cur_designation != "USD")
                {
                    var exchangerate = _db.TR_MCU_Main_Currency.Where(l => l.cur_id == onecin.cur_id && l.cur_id2 == usdcur.cur_id).OrderByDescending(l => l.mcu_rate_date).FirstOrDefault();
                    if (exchangerate != null)
                    {
                        cin_exchange_rate = exchangerate.mcu_rate_in;
                    }
                }
                else
                {
                    cin_exchange_rate = 1;
                }
                //var cinsom = onecin.TM_CII_ClientInvoice_Line.Where(l => l.cii_quantity.HasValue && l.cii_price_with_discount_ht.HasValue).Sum(l => l.cii_quantity * l.cii_price_with_discount_ht);
                var allsod = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.cin_id == onecin.cin_id).ToList();
                decimal sod_ex_rate = 1;
                foreach (var onesod in allsod)
                {
                    var onesodsom = onesod.TM_SOD_Supplier_Order.TM_SOL_SupplierOrder_Lines.Where(l => l.sol_quantity.HasValue && l.sol_price_with_dis.HasValue).Sum(l => l.sol_quantity * l.sol_price_with_dis);
                    // 相对美元核算
                    if (onesod.TM_SOD_Supplier_Order.TR_CUR_Currency.cur_designation != "USD")
                    {
                        var exchangerate = _db.TR_MCU_Main_Currency.Where(l => l.cur_id == onesod.TM_SOD_Supplier_Order.cur_id && l.cur_id2 == usdcur.cur_id).OrderByDescending(l => l.mcu_rate_date).FirstOrDefault();
                        if (exchangerate != null)
                        {
                            onesodsom = onesodsom * exchangerate.mcu_rate_in;
                            sod_ex_rate = exchangerate.mcu_rate_in;
                        }
                    }
                    else
                    {
                        sod_ex_rate = 1;
                    }
                    // 计算sod 对应的 cin 中 cii 的盈利，此时margin是以美元计算，最后要改成cin对应的货币
                    decimal marginsod = 0;
                    foreach (var onesol in onesod.TM_SOD_Supplier_Order.TM_SOL_SupplierOrder_Lines)
                    {
                        decimal purchase = 0;
                        var onecii = onesol.TM_CII_ClientInvoice_Line.FirstOrDefault(l => l.cin_id == onecin.cin_id);
                        decimal sell = 0;
                        if (onecii != null)
                        {
                            sell = (onecii.cii_price_with_discount_ht ?? 0) * (onecii.cii_quantity ?? 0);
                            purchase = (onesol.sol_price_with_dis ?? 0) * (onesol.sol_quantity ?? 0) * (onesol.TM_CII_ClientInvoice_Line.Count > 0 ? 1 : 0);
                            purchase = sod_ex_rate * purchase;
                        }
                        // 计算 cin 对应美元的金额
                        var marginsol = sell * cin_exchange_rate - purchase;
                        marginsod += marginsol;
                    }
                    allsod_cinSom += marginsod;
                }
                // 转成cin货币
                allsod_cinSom = allsod_cinSom / cin_exchange_rate;
                // 计算 cin 中，没有sod 的售价
                var cii_without_sol_ids = onecin.TM_CII_ClientInvoice_Line.Where(l => !l.sol_id.HasValue).ToList();
                decimal cinSomWithoutSol = cii_without_sol_ids.Where(l => l.cii_quantity.HasValue && l.cii_price_with_discount_ht.HasValue).Sum(l => l.cii_quantity.Value * l.cii_price_with_discount_ht.Value);
                // 这里不用考虑汇率问题，直接是cin 对应的货币
                var cinsomtotal = allsod_cinSom + cinSomWithoutSol;
                onecin.cin_margin = cinsomtotal;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(onecin);
                _db.SaveChanges();
            }
        }

        public void UpdateCinMarginOneTime()
        {
            var allcin = _db.TM_CIN_Client_Invoice.Select(l => l.cin_id).ToList();
            foreach (var cinId in allcin)
            {
                calculecinprofile(cinId);
            }
        }

        #endregion

        /// <summary>
        /// 20251126 合并CII行，将数量一致的合并起来
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <param name="CiiIds"></param>
        public void MergeCiiLines(int socId, int cinId, List<int> CiiIds)
        {
            var ciis = (from cii in _db.TM_CII_ClientInvoice_Line
                        join ciiid in CiiIds on cii.cii_id equals ciiid
                        where cii.cin_id == cinId && cii.TM_CIN_Client_Invoice.soc_id == socId
                        select cii).ToList();

            var alldescription = string.Empty;
            var ciiprdname = string.Empty;
            decimal total_totalprice = 0;
            decimal total_unitprice = 0;
            decimal total_purchaseprice = 0;
            decimal total_totalcrudeprice = 0;
            decimal total_discountpercentage = 0;
            decimal total_discountamount = 0;
            decimal total_pricewithdiscountht = 0;
            decimal total_margin = 0;

            if (ciis.Any())
            {
                var defaultCii = ciis.FirstOrDefault();
                ciis.ForEach(l =>
                {
                    ciiprdname += (l.cii_prd_name + " / ");
                    alldescription += (l.cii_description + "\r\n");
                    total_totalprice += (l.cii_total_price ?? 0);
                    total_unitprice += (l.cii_unit_price ?? 0);
                    total_purchaseprice += (l.cii_purchase_price ?? 0);
                    total_totalcrudeprice += (l.cii_total_crude_price ?? 0);
                    //total_discountpercentage += (l.cii_discount_percentage ?? 0);
                    total_discountamount += (l.cii_discount_amount ?? 0);
                    total_pricewithdiscountht += (l.cii_price_with_discount_ht ?? 0);
                    total_margin += (l.cii_margin ?? 0);
                });
                var vat = defaultCii.TR_VAT_Vat.vat_vat_rate / 100;
                // delete other cii lines
                var ciis2delete = ciis.Where(l => l.cii_id != defaultCii.cii_id).ToList();
                defaultCii.cii_prd_name = ciiprdname;
                defaultCii.cii_description = alldescription;
                defaultCii.cii_unit_price = total_unitprice;
                defaultCii.cii_total_price = total_unitprice * defaultCii.cii_quantity;
                defaultCii.cii_purchase_price = total_purchaseprice;
                defaultCii.cii_total_crude_price = defaultCii.cii_total_price * (1 + vat);
                defaultCii.cii_price_with_discount_ht = total_pricewithdiscountht;
                defaultCii.cii_margin = total_margin;
                defaultCii.cii_discount_amount = total_discountamount;
                defaultCii.cii_discount_percentage = defaultCii.cii_discount_amount / defaultCii.cii_total_price;
                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(defaultCii);
                foreach (var tmCiiClientInvoiceLine in ciis2delete)
                {
                    _db.TM_CII_ClientInvoice_Line.DeleteObject(tmCiiClientInvoiceLine);
                }
                _db.SaveChanges();
                //CalculateSubTotalAndTotal(socId, cinId, level1, 0);
                CiiAutoSort(socId, cinId);
            }
        }
    }
}
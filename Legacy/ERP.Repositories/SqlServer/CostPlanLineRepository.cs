using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class CostPlanLineRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// Get all cost plan line by cost plan id
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cplId"></param>
        /// <returns></returns>
        public List<CostPlanLine> GetClnsByCplId(int socId, int cplId)
        {
            var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).Select(CostPlanLineTranslator.RepositoryToEntity()).OrderBy(m => m.ClnLevel1).ThenBy(m => m.ClnLevel2).ToList();
            if (clns.Any())
            {
                var ptyAccsIds = (from pty in _db.TM_PTY_Product_Type
                                  from ptyAcc in ProductTypeWithOutTSheet
                                  where pty.pty_name.Contains(ptyAcc)
                                  select pty.pty_id).ToList();

                var clnpil = (from cln in clns
                              join pil in _db.TM_PIL_PurchaseIntent_Lines on cln.ClnId equals pil.cln_id
                              join sol in _db.TM_SOL_SupplierOrder_Lines on pil.pil_id equals sol.pil_id
                                  into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              select new { pil, lj }).ToList();

                clns.ForEach(m =>
                {
                    m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                    m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                    m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                    m.IsAcc = ptyAccsIds.Any(l => l == m.PtyId);
                    var pil = clnpil.FirstOrDefault(l => l.pil.cln_id == m.ClnId);
                    m.PilId = pil != null ? pil.pil.pil_id : 0;
                    m.SolId = pil != null && pil.lj != null ? pil.lj.sol_id : 0;
                    m.PinFId = m.PilId != 0 ? StringCipher.EncoderSimple(pil.pil.pin_id.ToString(), "pinId") : string.Empty;
                    m.SodFId = m.SolId != 0 ? StringCipher.EncoderSimple(pil.lj.sod_id.ToString(), "sodId") : string.Empty;
                });
            }

            return clns;
        }

        /// <summary>
        /// 添加或更新cost plan line
        /// </summary>
        /// <param name="cln"></param>
        /// <returns></returns>
        public int InsertUpdateCln(CostPlanLine cln, bool forDrv = false)
        {
            bool iscreate = false;
            int clnId = 0;
            int prdId = 0;
            int pitId = 0;
            CheckPrdAndPit(cln.SocId, cln.PrdId ?? 0, cln.PitId ?? 0, cln.PrdName, cln.PitName, out prdId, out pitId);
            cln.PrdId = prdId;
            cln.PitId = pitId;
            //int l1;
            //int l2;
            //decimal totalHt;
            //decimal totalTtc;
            //CheckOrder(cln.CplId, cln.SocId, cln.ClnId, cln.ClnLevel1 ?? 1, cln.ClnLevel2 ?? 1, cln.LtpId, out l1, out l2, out totalHt, out totalTtc);
            //cln.ClnLevel1 = l1;
            //cln.ClnLevel2 = l2;
            int oldLevel1 = 0;
            int newLevel1;
            if (!forDrv)
            {
                SortCln(ref cln, out oldLevel1, out newLevel1);
            }
            else
            {
                // 为driver 和 accessory 重新排序
                var prdCln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.TM_CPL_Cost_Plan.soc_id == cln.SocId && m.cpl_id == cln.CplId && m.prd_id == cln.PrdId2);
                if (prdCln != null)
                {
                    newLevel1 = prdCln.cln_level1 ?? 0;
                    cln.ClnLevel1 = newLevel1;
                    cln.ClnLevel2 = (prdCln.cln_level2 ?? 0) + 1;
                    if (newLevel1 == 0)
                    {
                        SortCln(ref cln, out oldLevel1, out newLevel1);
                    }
                }
                else
                {
                    SortCln(ref cln, out oldLevel1, out newLevel1);
                }
            }
            if (cln.ClnId != 0)
            {
                clnId = cln.ClnId;
                if (cln.CplId != 0)
                {
                    var aCln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cln_id == cln.ClnId && m.TM_CPL_Cost_Plan.soc_id == cln.SocId && m.cpl_id == cln.CplId);
                    if (aCln != null)
                    {
                        aCln = CostPlanLineTranslator.EntityToRepository(cln, aCln);
                        _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(aCln);
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
                if (cln.CplId != 0)
                {
                    try
                    {
                        var aCln = CostPlanLineTranslator.EntityToRepository(cln, create: true);
                        _db.TM_CLN_CostPlan_Lines.AddObject(aCln);
                        _db.SaveChanges();
                        clnId = aCln.cln_id;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            CalculateSubTotalAndTotal(cln.SocId, cln.CplId, oldLevel1, newLevel1);
            return clnId;
        }

        public void DeleteCln(int socId, int cplId, int clnId)
        {
            var cln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cln_id == clnId && m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId);
            if (cln != null)
            {
                int level1 = cln.cln_level1 ?? 0;
                _db.TM_CLN_CostPlan_Lines.DeleteObject(cln);
                _db.SaveChanges();
                ReSortAfterDelete(socId, cplId, level1);
                CalculateSubTotalAndTotal(socId, cplId, level1, 0);
            }
        }

        public void DuplicateCln(int cplId, int clnId)
        {
            var cln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cpl_id == cplId && m.cln_id == clnId);
            if (cln != null)
            {
                var onecln = CostPlanLineTranslator.RepositoryToEntity().Compile().Invoke(cln);
                var newcln = CostPlanLineTranslator.EntityToRepository(onecln, create: true);
                newcln.cln_level2 = newcln.cln_level2 + 1;
                _db.TM_CLN_CostPlan_Lines.AddObject(newcln);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 检查product 和 product instance
        /// </summary>
        /// <returns></returns>
        private void CheckPrdAndPit(int socId, int prdId, int pitId, string prdName, string pitName, out int checkedPrdid, out int checkedPitId)
        {
            var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == pitId && m.prd_id == prdId
                                                                         && m.TM_PRD_Product.soc_id == socId
                //|| (m.TM_PRD_Product.prd_ref.Contains(prdName)
                //&& m.pit_ref.Contains(pitName))
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

        private void CheckOrder(int cplId, int socId, int clnId, int level1, int level2, int ltyId, out int newL1, out int newL2, out decimal totalHt, out decimal totalTtc)
        {
            bool create = false;
            totalHt = 0;
            totalTtc = 0;
            newL1 = level1;
            newL2 = level2;
            var onecln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cln_id == clnId && m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId);
            if (onecln == null)
            {
                create = true;
            }
            if (ltyId == 5 || ltyId == 6)
            {
                if (ltyId == 5)
                {
                    // vente and variant in the same level
                    var sameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1
                        && m.cln_id != clnId && (m.ltp_id == 4 || m.ltp_id == 2)).ToList();
                    totalHt = sameLevel1.Sum(m => m.cln_total_price ?? 0);
                    totalTtc = sameLevel1.Sum(m => m.cln_total_crude_price ?? 0);
                    newL1 = level1;
                    var checkLevel2 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1).Max(m => m.cln_level2);
                    if (create)
                    {
                        newL2 = (checkLevel2 ?? 0) + 1;
                    }
                    else
                    {
                        newL2 = (checkLevel2 ?? 1);
                    }
                }
                else
                {

                }
            }
            else
            {
                if (create)
                // create new line
                {
                    // check same level 1
                    var sameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1).ToList();
                    if (sameLevel1.Any())
                    {
                        var biggerlevel2 = sameLevel1.Where(m => m.cln_level2 >= level2);
                        if (biggerlevel2.Any())
                        {
                            //var allhigher = higherThanLevel2.ToList();
                            int nextLevel2 = level2 + 1;
                            foreach (var cln in biggerlevel2)
                            {
                                cln.cln_level2 = nextLevel2;
                                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                                _db.SaveChanges();
                                nextLevel2++;
                            }
                        }
                        else
                        {
                            // check is there any sub-total
                            var subTotal = sameLevel1.FirstOrDefault(m => m.ltp_id == 5);
                            if (subTotal == null)
                            {
                                level2 = (sameLevel1.Max(m => m.cln_level2) ?? 0) + 1;
                            }
                            else
                            {
                                level2 = subTotal.cln_level2 ?? 1;
                                subTotal.cln_level2 = (subTotal.cln_level2 ?? 1) + 1;
                                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(subTotal);
                                _db.SaveChanges();
                            }
                        }
                        // if any sub-total, re calculate sub-total
                        var oneSubTotal = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1 && m.ltp_id == 5);
                        if (oneSubTotal != null)
                        {
                            // vente and variant in the same level
                            var inSameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1 && m.cln_id != clnId && (m.ltp_id == 4 || m.ltp_id == 2)).ToList();
                            totalHt = inSameLevel1.Sum(m => m.cln_total_price ?? 0);
                            totalTtc = inSameLevel1.Sum(m => m.cln_total_crude_price ?? 0);
                            oneSubTotal.cln_total_price = totalHt;
                            oneSubTotal.cln_total_crude_price = totalTtc;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(oneSubTotal);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        var biggerlevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 > level1).ToList();
                        if (biggerlevel1.Any())
                        {
                            var level1s = biggerlevel1.Select(m => m.cln_level1).Distinct().OrderBy(m => m).ToList();
                            var nextLevel1 = level1 + 1;
                            foreach (var l1 in level1s)
                            {
                                var oneLevel1 = biggerlevel1.Where(m => m.cln_level1 == l1).ToList();
                                foreach (var cln in oneLevel1)
                                {
                                    cln.cln_level1 = nextLevel1;
                                    _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                                    _db.SaveChanges();
                                }
                                nextLevel1++;
                            }

                            level2 = 1;
                        }
                    }
                    newL1 = level1;
                    newL2 = level2;
                }
                else
                // update new line
                {
                    if (!(onecln.cln_level1 == level1 && onecln.cln_level2 == level2))
                    {
                        bool level1Changed = onecln.cln_level1 != level1;
                        // change level2
                        var sameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1 && m.cln_id != onecln.cln_id).ToList();
                        var smallThanLevel2 = sameLevel1.Where(m => m.cln_level2 < level2 && m.cln_id != onecln.cln_id && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cln_level2);
                        var bigThanLevel2 = sameLevel1.Where(m => m.cln_level2 >= level2 && m.cln_id != onecln.cln_id && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cln_level2);
                        int nextlevel2 = 1;
                        foreach (var cln in smallThanLevel2)
                        {
                            cln.cln_level2 = nextlevel2;
                            nextlevel2++;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                            _db.SaveChanges();
                        }
                        onecln.cln_level2 = nextlevel2;
                        _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(onecln);
                        level2 = onecln.cln_level2 ?? 1;
                        _db.SaveChanges();
                        nextlevel2++;
                        foreach (var cln in bigThanLevel2)
                        {
                            cln.cln_level2 = nextlevel2;
                            nextlevel2++;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                            _db.SaveChanges();
                        }
                        var subTotal = sameLevel1.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            // vente and variant in the same level
                            subTotal.cln_level2 = nextlevel2;
                            var inSameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == level1 && m.cln_id != clnId && (m.ltp_id == 4 || m.ltp_id == 2)).ToList();
                            totalHt = inSameLevel1.Sum(m => m.cln_total_price ?? 0);
                            totalTtc = inSameLevel1.Sum(m => m.cln_total_crude_price ?? 0);
                            subTotal.cln_total_price = totalHt;
                            subTotal.cln_total_crude_price = totalTtc;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }

                        if (level1Changed)
                        {
                            var smallerLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 < level1 && m.cln_id != onecln.cln_id).OrderBy(m => m.cln_level1).ToList();
                            int nextLevel1 = 1;
                            var level1s = smallerLevel1.Select(m => m.cln_level1).Distinct().OrderBy(m => m).ToList();
                            foreach (var oneL1 in level1s)
                            {
                                var oneLevel1 = smallerLevel1.Where(m => m.cln_level1 == oneL1).ToList();
                                foreach (var cln in oneLevel1)
                                {
                                    cln.cln_level1 = nextLevel1;
                                    _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                                    _db.SaveChanges();
                                }
                                nextLevel1++;
                            }

                            var biggerLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 > level1 && m.cln_id != onecln.cln_id).OrderBy(m => m.cln_level1).ToList();
                            level1s = biggerLevel1.Select(m => m.cln_level1).Distinct().OrderBy(m => m).ToList();
                            nextLevel1++;
                            foreach (var oneL1 in level1s)
                            {
                                var oneLevel1 = biggerLevel1.Where(m => m.cln_level1 == oneL1).ToList();
                                foreach (var cln in oneLevel1)
                                {
                                    cln.cln_level1 = nextLevel1;
                                    _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(cln);
                                    _db.SaveChanges();
                                }
                                nextLevel1++;
                            }
                        }
                    }

                    newL1 = level1;
                    newL2 = level2;
                }
            }
        }

        private void SortCln(ref CostPlanLine onecln, out int theOldLevel1, out int theNewLevel1)
        {
            theOldLevel1 = 0;
            theNewLevel1 = 0;
            int cplId = onecln.CplId;
            int clnId = onecln.ClnId;
            int socId = onecln.SocId;
            int targetLevel1 = onecln.ClnLevel1 ?? 1;
            int targetLevel2 = onecln.ClnLevel2 ?? 1;
            var oldCln = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cpl_id == cplId && m.cln_id == clnId && m.TM_CPL_Cost_Plan.soc_id == socId);
            bool create = oldCln == null;
            if (oldCln != null)
            {
                theOldLevel1 = oldCln.cln_level1 ?? 0;
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
                        var subTotal = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1 && m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            // update
                            onecln.ClnId = subTotal.cln_id;
                        }
                        else
                        {
                            // create
                            var lineInSameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1).ToList();
                            if (lineInSameLevel1.Any())
                            {
                                int level2 = lineInSameLevel1.Max(m => m.cln_level2) ?? 0;
                                onecln.ClnLevel2 = level2 + 1;
                            }
                            else
                            {
                                // 没有相同的level1，将最大的level1取出来，然后level2=1
                                var maxLevel = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).Max(m => m.cln_level1) ?? 0;
                                onecln.ClnLevel1 = maxLevel + 1;
                                onecln.ClnLevel2 = 1;
                                // 只有sub total 的情况下，将type 设置成 text
                                onecln.LtpId = 3;
                            }
                        }
                    }
                    else
                    {
                        // 需要测试level1是否改变，如果改变要重新排序两个序列
                        var level1changed = oldCln.cln_level1 != onecln.ClnLevel1;
                        if (level1changed)
                        {
                            // 排序两个列
                            int oldLevel1 = oldCln.cln_level1 ?? 1;
                            var oldArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == oldLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCln in oldArray)
                            {
                                tmpCln.cln_level2 = level2Count;
                                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            var newArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.cln_level2).ToList();
                            level2Count = 1;
                            foreach (var tmpCln in normalNewArray)
                            {
                                tmpCln.cln_level2 = level2Count;
                                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecln.ClnLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.cln_id != clnId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_CLN_CostPlan_Lines.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }
                        else
                        {
                            // 排序一个列
                            var newArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.cln_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCln in normalNewArray)
                            {
                                tmpCln.cln_level2 = level2Count;
                                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecln.ClnLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.cln_id != clnId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_CLN_CostPlan_Lines.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }

                    }
                }
                else
                {
                    // 测试是否存在总total，存在测更新，不存在则建立
                    var allTotal = _db.TM_CLN_CostPlan_Lines.FirstOrDefault(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.ltp_id == 6);
                    if (allTotal != null)
                    {
                        _db.TM_CLN_CostPlan_Lines.DeleteObject(allTotal);
                        _db.SaveChanges();
                    }
                    if (!create)
                    {
                        // 排序原来序列
                        int oldLevel1 = oldCln.cln_level1 ?? 1;
                        var oldArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == oldLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCln in oldArray)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                    }
                    var maxLevel = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).Max(m => m.cln_level1) ?? 0;
                    onecln.ClnLevel1 = maxLevel + 1;
                    onecln.ClnLevel2 = 1;
                }
            }
            else
            {
                if (create)
                {
                    var lineInSameLevel1 = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1).ToList();
                    if (lineInSameLevel1.Any())
                    {
                        var smallerLevel2 = lineInSameLevel1.Where(m => m.cln_level2 < targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cln_level2).ToList();
                        var biggerLevel2 = lineInSameLevel1.Where(m => m.cln_level2 >= targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.cln_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCln in smallerLevel2)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        onecln.ClnLevel2 = level2Count;
                        level2Count++;
                        foreach (var tmpCln in biggerLevel2)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var total = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 6);
                        if (total != null)
                        {
                            total.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(total);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 没有相同的level1，将最大的level1取出来，然后level2=1
                        var maxLevel = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).Max(m => m.cln_level1) ?? 0;
                        onecln.ClnLevel1 = maxLevel + 1;
                        onecln.ClnLevel2 = 1;
                    }
                }
                else
                {
                    // 需要测试level1是否改变，如果改变要重新排序两个序列
                    var level1changed = oldCln.cln_level1 != onecln.ClnLevel1;
                    if (level1changed)
                    {
                        // 排序两个列
                        int oldLevel1 = oldCln.cln_level1 ?? 1;
                        var oldArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == oldLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCln in oldArray)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var newArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.cln_level2 < targetLevel2).OrderBy(m => m.cln_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.cln_level2 >= targetLevel2).OrderBy(m => m.cln_level2).ToList();
                        level2Count = 1;
                        foreach (var tmpCln in normalNewArraySmaller)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecln.ClnLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCln in normalNewArrayBigger)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }

                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 排序一个列
                        var newArray = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == targetLevel1 && m.cln_id != clnId).OrderBy(m => m.cln_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.cln_level2 < targetLevel2).OrderBy(m => m.cln_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.cln_level2 >= targetLevel2).OrderBy(m => m.cln_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCln in normalNewArraySmaller)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecln.ClnLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCln in normalNewArrayBigger)
                        {
                            tmpCln.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.cln_level2 = level2Count;
                            _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                }
            }
            theNewLevel1 = onecln.ClnLevel1 ?? 0;
        }

        private void CalculateSubTotalAndTotal(int socId, int cplId, int oldLevel1, int newLevel1)
        {
            var allClns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).ToList();
            if (oldLevel1 != 0)
            {
                // update old sub total
                var oldClns = allClns.Where(m => m.cln_level1 == oldLevel1).ToList();
                var oldSubTotal = oldClns.FirstOrDefault(m => m.ltp_id == 5);
                if (oldClns.Any() && oldSubTotal != null)
                {
                    var totalHt = oldClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_price);
                    var totalTtc = oldClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_crude_price);
                    oldSubTotal.cln_total_price = totalHt;
                    oldSubTotal.cln_total_crude_price = totalTtc;
                    _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(oldSubTotal);
                    _db.SaveChanges();
                }
            }
            if (newLevel1 != 0)
            {
                // update new sub total
                var newClns = allClns.Where(m => m.cln_level1 == newLevel1).ToList();
                var newSubTotal = newClns.FirstOrDefault(m => m.ltp_id == 5);
                if (newClns.Any() && newSubTotal != null)
                {
                    var totalHt = newClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_price);
                    var totalTtc = newClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_crude_price);
                    newSubTotal.cln_total_price = totalHt;
                    newSubTotal.cln_total_crude_price = totalTtc;
                    _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(newSubTotal);
                    _db.SaveChanges();
                }
            }
            // update total 
            var totalLine = allClns.FirstOrDefault(m => m.ltp_id == 6);
            if (totalLine != null)
            {
                var totalHt = allClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_price);
                var totalTtc = allClns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.cln_total_crude_price);
                totalLine.cln_total_price = totalHt;
                totalLine.cln_total_crude_price = totalTtc;
                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(totalLine);
                _db.SaveChanges();

            }
        }

        private void ReSortAfterDelete(int socId, int cplId, int oldLevel1)
        {
            var allClns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId && m.cln_level1 == oldLevel1).OrderBy(m => m.cln_level2).ToList();
            int level2Count = 1;
            foreach (var tmpCln in allClns)
            {
                tmpCln.cln_level2 = level2Count;
                _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(tmpCln);
                _db.SaveChanges();
                level2Count++;
            }
        }

        public CostPlanGeneralInfo GetCostPlanInfo(int socId, int cplId)
        {
            var cplInfo = new CostPlanGeneralInfo();
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == cplId && m.soc_id == socId);
            if (cpl != null)
            {
                var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cpl.cpl_id).ToList();
                var amountHt = clns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.cln_total_price ?? 0));
                var amountTtc = clns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.cln_total_crude_price ?? 0));
                var totalpurchasePrice = clns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.cln_purchase_price ?? 0) * m.cln_quantity);
                var totalSalePrice = clns.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.cln_price_with_discount_ht ?? m.cln_unit_price ?? 0) * m.cln_quantity);
                var totalMargin = totalSalePrice - totalpurchasePrice - (cpl.cpl_discount_amount ?? 0);
                cplInfo = new CostPlanGeneralInfo
                {
                    CplId = cpl.cpl_id,
                    FId = StringCipher.EncoderSimple(cpl.cpl_id.ToString(), "cplId"),
                    CplDiscountPercentage = cpl.cpl_discount_percentage ?? 0,
                    CplDiscountAmount = cpl.cpl_discount_amount ?? 0,
                    TotalAmountHt = amountHt,
                    TotalAmountTtc = amountTtc,
                    TotalMargin = totalMargin,
                    TotalPurchasePrice = totalpurchasePrice,
                    TotalSalePrice = totalSalePrice
                };
                var ht = cplInfo.TotalAmountHt - cplInfo.CplDiscountAmount;
                var ttc = ht * (1 + ((cplInfo.TotalAmountTtc - cplInfo.TotalAmountHt) / (cplInfo.TotalAmountHt != 0 ? cplInfo.TotalAmountHt : 1)));

                cplInfo.TotalAmountHt = ht;
                cplInfo.TotalAmountTtc = ttc;
            }
            return cplInfo;
        }

        public void InserUpdateClns(List<CostPlanLine> clns)
        {
            foreach (var cln in clns)
            {
                InsertUpdateCln(cln, true);
            }
        }

    }
}

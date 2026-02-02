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
    public class ClientOrderLineRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// Get all client order line by client order id
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="codId"></param>
        /// <returns></returns>
        public List<ClientOrderLine> GetColsByCodId(int socId, int codId)
        {
            var cols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).Select(ClientOrderLineTranslator.RepositoryToEntity()).OrderBy(m => m.ColLevel1).ThenBy(m => m.ColLevel2).ToList();
            if (cols.Any())
            {
                var ptyAccsIds = (from pty in _db.TM_PTY_Product_Type
                                  from ptyAcc in ProductTypeWithOutTSheet
                                  where pty.pty_name.Contains(ptyAcc)
                                  select pty.pty_id).ToList();
                
                var colpil = (from cln in cols
                              join pil in _db.TM_PIL_PurchaseIntent_Lines on cln.ColId equals pil.col_id
                              join sol in _db.TM_SOL_SupplierOrder_Lines on pil.pil_id equals sol.pil_id
                                  into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              select new { pil, lj }).ToList();

                cols.ForEach(m =>
                {
                    m.CodFId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                    m.PrdFId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                    m.PitFId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                    m.IsAcc = ptyAccsIds.Any(l => l == m.PtyId);
                    var pil = colpil.FirstOrDefault(l => l.pil.col_id == m.ColId);
                    m.PilId = pil != null ? pil.pil.pil_id : 0;
                    m.SolId = pil != null && pil.lj != null ? pil.lj.sol_id : 0;
                    m.PinFId = m.PilId != 0 ? StringCipher.EncoderSimple(pil.pil.pin_id.ToString(), "pinId") : string.Empty;
                    m.SodFId = m.SolId != 0 ? StringCipher.EncoderSimple(pil.lj.sod_id.ToString(), "sodId") : string.Empty;
                });
            }
            return cols;
        }

        /// <summary>
        /// 添加或更新client order line
        /// </summary>
        /// <param name="col"></param>
        /// <returns></returns>
        public int InsertUpdateCol(ClientOrderLine col, bool forDrv = false)
        {
            bool iscreate = false;
            int colId = 0;
            int prdId = 0;
            int pitId = 0;
            CheckPrdAndPit(col.SocId, col.PrdId ?? 0, col.PitId ?? 0, col.PrdName, col.PitName, out prdId, out pitId);
            col.PrdId = prdId;
            col.PitId = pitId;
            int oldLevel1 = 0;
            int newLevel1;
            if (!forDrv)
            {
                SortCol(ref col, out oldLevel1, out newLevel1);
            }
            else
            {
                // 为driver 和 accessory 重新排序
                var prdCln = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.TM_COD_Client_Order.soc_id == col.SocId && m.cod_id == col.CodId && m.prd_id == col.PrdId2);
                if (prdCln != null)
                {
                    newLevel1 = prdCln.col_level1 ?? 0;
                    col.ColLevel1 = newLevel1;
                    col.ColLevel2 = (prdCln.col_level2 ?? 0) + 1;
                    if (newLevel1 == 0)
                    {
                        SortCol(ref col, out oldLevel1, out newLevel1);
                    }
                }
                else
                {
                    SortCol(ref col, out oldLevel1, out newLevel1);
                }
            }
            if (col.ColId != 0)
            {
                colId = col.ColId;
                if (col.ColId != 0)
                {
                    var aCol = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.col_id == col.ColId && m.TM_COD_Client_Order.soc_id == col.SocId && m.cod_id == col.CodId);
                    if (aCol != null)
                    {
                        aCol = ClientOrderLineTranslator.EntityToRepository(col, aCol);
                        _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(aCol);
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
                if (col.CodId != 0)
                {
                    try
                    {
                        var aCol = ClientOrderLineTranslator.EntityToRepository(col, create: true);
                        _db.TM_COL_ClientOrder_Lines.AddObject(aCol);
                        _db.SaveChanges();
                        colId = aCol.col_id;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            CalculateSubTotalAndTotal(col.SocId, col.CodId, oldLevel1, newLevel1);
            return colId;
        }

        public bool DeleteCol(int socId, int codId, int colId)
        {
            var deleted = false;
            var col = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.col_id == colId && m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId);
            if (col != null)
            {
                var checkCol = _db.TM_DFL_DevlieryForm_Line.Any(m => m.col_id == col.col_id);
                if (!checkCol)
                {
                    try
                    {
                        int level1 = col.col_level1 ?? 0;
                        _db.TM_COL_ClientOrder_Lines.DeleteObject(col);
                        _db.SaveChanges();
                        ReSortAfterDelete(socId, codId, level1);
                        CalculateSubTotalAndTotal(socId, codId, level1, 0);
                        deleted = true;
                    }
                    catch (Exception)
                    {
                    }

                }
            }
            return deleted;
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

        private void SortCol(ref ClientOrderLine onecol, out int theOldLevel1, out int theNewLevel1)
        {
            theOldLevel1 = 0;
            theNewLevel1 = 0;
            int codId = onecol.CodId;
            int colId = onecol.ColId;
            int socId = onecol.SocId;
            int targetLevel1 = onecol.ColLevel1 ?? 1;
            int targetLevel2 = onecol.ColLevel2 ?? 1;
            var oldCol = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.cod_id == codId && m.col_id == colId && m.TM_COD_Client_Order.soc_id == socId);
            bool create = oldCol == null;
            if (oldCol != null)
            {
                theOldLevel1 = oldCol.col_level1 ?? 0;
            }
            // add line or update line 
            if (onecol.LtpId == 5 || onecol.LtpId == 6)
            {
                // if this is a total line, check total line existed ?
                if (onecol.LtpId == 5)
                {
                    if (create)
                    {
                        // 查看当前的array里面是否已经有了sub total，如果有，则更新，如果没有，则添加
                        var subTotal = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.cod_id == codId & m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1 && m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            // update
                            onecol.ColId = subTotal.col_id;
                        }
                        else
                        {
                            // create
                            var lineInSameLevel1 = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1).ToList();
                            if (lineInSameLevel1.Any())
                            {
                                int level2 = lineInSameLevel1.Max(m => m.col_level2) ?? 0;
                                onecol.ColLevel2 = level2 + 1;
                            }
                            else
                            {
                                // 没有相同的level1，将最大的level1取出来，然后level2=1
                                var maxLevel = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).Max(m => m.col_level1) ?? 0;
                                onecol.ColLevel1 = maxLevel + 1;
                                onecol.ColLevel2 = 1;
                                // 只有sub total 的情况下，将type 设置成 text
                                onecol.LtpId = 3;
                            }
                        }
                    }
                    else
                    {
                        // 需要测试level1是否改变，如果改变要重新排序两个序列
                        var level1changed = oldCol.col_level1 != onecol.ColLevel1;
                        if (level1changed)
                        {
                            // 排序两个列
                            int oldLevel1 = oldCol.col_level1 ?? 1;
                            var oldArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == oldLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCol in oldArray)
                            {
                                tmpCol.col_level2 = level2Count;
                                _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            var newArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.col_level2).ToList();
                            level2Count = 1;
                            foreach (var tmpCol in normalNewArray)
                            {
                                tmpCol.col_level2 = level2Count;
                                _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecol.ColLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.col_id != colId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_COL_ClientOrder_Lines.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }
                        else
                        {
                            // 排序一个列
                            var newArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                            var normalNewArray = newArray.Where(m => m.ltp_id != 5).OrderBy(m => m.col_level2).ToList();
                            int level2Count = 1;
                            foreach (var tmpCol in normalNewArray)
                            {
                                tmpCol.col_level2 = level2Count;
                                _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                                _db.SaveChanges();
                                level2Count++;
                            }
                            targetLevel2 = level2Count;
                            onecol.ColLevel2 = targetLevel2;
                            var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5 && m.col_id != colId);
                            if (subTotal != null)
                            {
                                // 如果已存在sub total ，将原来的删除
                                _db.TM_COL_ClientOrder_Lines.DeleteObject(subTotal);
                                _db.SaveChanges();
                            }
                        }

                    }
                }
                else
                {
                    // 测试是否存在总total，存在测更新，不存在则建立
                    var allTotal = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.ltp_id == 6);
                    if (allTotal != null)
                    {
                        _db.TM_COL_ClientOrder_Lines.DeleteObject(allTotal);
                        _db.SaveChanges();
                    }
                    if (!create)
                    {
                        // 排序原来序列
                        int oldLevel1 = oldCol.col_level1 ?? 1;
                        var oldArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == oldLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCol in oldArray)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                    }
                    var maxLevel = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).Max(m => m.col_level1) ?? 0;
                    onecol.ColLevel1 = maxLevel + 1;
                    onecol.ColLevel2 = 1;
                }
            }
            else
            {
                if (create)
                {
                    var lineInSameLevel1 = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1).ToList();
                    if (lineInSameLevel1.Any())
                    {
                        var smallerLevel2 = lineInSameLevel1.Where(m => m.col_level2 < targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.col_level2).ToList();
                        var biggerLevel2 = lineInSameLevel1.Where(m => m.col_level2 >= targetLevel2 && m.ltp_id != 5 && m.ltp_id != 6).OrderBy(m => m.col_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCol in smallerLevel2)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        onecol.ColLevel2 = level2Count;
                        level2Count++;
                        foreach (var tmpCol in biggerLevel2)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var total = lineInSameLevel1.FirstOrDefault(m => m.ltp_id == 6);
                        if (total != null)
                        {
                            total.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(total);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 没有相同的level1，将最大的level1取出来，然后level2=1
                        var maxLevel = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).Max(m => m.col_level1) ?? 0;
                        onecol.ColLevel1 = maxLevel + 1;
                        onecol.ColLevel2 = 1;
                    }
                }
                else
                {
                    // 需要测试level1是否改变，如果改变要重新排序两个序列
                    var level1changed = oldCol.col_level1 != onecol.ColLevel1;
                    if (level1changed)
                    {
                        // 排序两个列
                        int oldLevel1 = oldCol.col_level1 ?? 1;
                        var oldArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == oldLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCol in oldArray)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var newArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.col_level2 < targetLevel2).OrderBy(m => m.col_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.col_level2 >= targetLevel2).OrderBy(m => m.col_level2).ToList();
                        level2Count = 1;
                        foreach (var tmpCol in normalNewArraySmaller)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecol.ColLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCol in normalNewArrayBigger)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }

                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 排序一个列
                        var newArray = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == targetLevel1 && m.col_id != colId).OrderBy(m => m.col_level2).ToList();
                        var normalNewArraySmaller = newArray.Where(m => m.ltp_id != 5 && m.col_level2 < targetLevel2).OrderBy(m => m.col_level2).ToList();
                        var normalNewArrayBigger = newArray.Where(m => m.ltp_id != 5 && m.col_level2 >= targetLevel2).OrderBy(m => m.col_level2).ToList();
                        int level2Count = 1;
                        foreach (var tmpCol in normalNewArraySmaller)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        targetLevel2 = level2Count;
                        onecol.ColLevel2 = targetLevel2;
                        level2Count++;
                        foreach (var tmpCol in normalNewArrayBigger)
                        {
                            tmpCol.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                            _db.SaveChanges();
                            level2Count++;
                        }
                        var subTotal = newArray.FirstOrDefault(m => m.ltp_id == 5);
                        if (subTotal != null)
                        {
                            subTotal.col_level2 = level2Count;
                            _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(subTotal);
                            _db.SaveChanges();
                        }
                    }
                }
            }
            theNewLevel1 = onecol.ColLevel1 ?? 0;
        }

        private void CalculateSubTotalAndTotal(int socId, int codId, int oldLevel1, int newLevel1)
        {
            var allCols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).ToList();
            if (oldLevel1 != 0)
            {
                // update old sub total
                var oldCols = allCols.Where(m => m.col_level1 == oldLevel1).ToList();
                var oldSubTotal = oldCols.FirstOrDefault(m => m.ltp_id == 5);
                if (oldCols.Any() && oldSubTotal != null)
                {
                    var totalHt = oldCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_price);
                    var totalTtc = oldCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_crude_price);
                    oldSubTotal.col_total_price = totalHt;
                    oldSubTotal.col_total_crude_price = totalTtc;
                    _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(oldSubTotal);
                    _db.SaveChanges();
                }
            }
            if (newLevel1 != 0)
            {
                // update new sub total
                var newCols = allCols.Where(m => m.col_level1 == newLevel1).ToList();
                var newSubTotal = newCols.FirstOrDefault(m => m.ltp_id == 5);
                if (newCols.Any() && newSubTotal != null)
                {
                    var totalHt = newCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_price);
                    var totalTtc = newCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_crude_price);
                    newSubTotal.col_total_price = totalHt;
                    newSubTotal.col_total_crude_price = totalTtc;
                    _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(newSubTotal);
                    _db.SaveChanges();
                }
            }
            // update total 
            var totalLine = allCols.FirstOrDefault(m => m.ltp_id == 6);
            if (totalLine != null)
            {
                var totalHt = allCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_price);
                var totalTtc = allCols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => m.col_total_crude_price);
                totalLine.col_total_price = totalHt;
                totalLine.col_total_crude_price = totalTtc;
                _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(totalLine);
                _db.SaveChanges();

            }
        }

        private void ReSortAfterDelete(int socId, int codId, int oldLevel1)
        {
            var allCols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId && m.col_level1 == oldLevel1).OrderBy(m => m.col_level2).ToList();
            int level2Count = 1;
            foreach (var tmpCol in allCols)
            {
                tmpCol.col_level2 = level2Count;
                _db.TM_COL_ClientOrder_Lines.ApplyCurrentValues(tmpCol);
                _db.SaveChanges();
                level2Count++;
            }
        }

        public ClientOrderGeneralInfo GetClientOrderInfo(int socId, int codId)
        {
            var cplInfo = new ClientOrderGeneralInfo();
            var cod = _db.TM_COD_Client_Order.FirstOrDefault(m => m.cod_id == codId && m.soc_id == socId);
            if (cod != null)
            {
                var cols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == cod.cod_id).ToList();
                var amountHt = cols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.col_total_price ?? 0));
                var amountTtc = cols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.col_total_crude_price ?? 0));
                var totalpurchasePrice = cols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.col_purchase_price ?? 0) * m.col_quantity);
                var totalSalePrice = cols.Where(m => m.ltp_id == 2 || m.ltp_id == 4).Sum(m => (m.col_price_with_discount_ht ?? m.col_unit_price ?? 0) * m.col_quantity);
                var totalMargin = totalSalePrice - totalpurchasePrice;
                cplInfo = new ClientOrderGeneralInfo
                {
                    CodId = cod.cod_id,
                    FId = StringCipher.EncoderSimple(cod.cod_id.ToString(), "codId"),
                    CodDiscountPercentage = cod.cod_discount_percentage ?? 0,
                    CodDiscountAmount = cod.cod_discount_amount ?? 0,
                    TotalAmountHt = amountHt,
                    TotalAmountTtc = amountTtc,
                    TotalMargin = totalMargin,
                    TotalPurchasePrice = totalpurchasePrice,
                    TotalSalePrice = totalSalePrice
                };
                var ht = cplInfo.TotalAmountHt - cplInfo.CodDiscountAmount;
                var ttc = ht * (1 + ((cplInfo.TotalAmountTtc - cplInfo.TotalAmountHt) / (cplInfo.TotalAmountHt != 0 ? cplInfo.TotalAmountHt : 1)));

                cplInfo.TotalAmountHt = ht;
                cplInfo.TotalAmountTtc = ttc;
            }
            return cplInfo;
        }

        public void InsertColByCln(int codId, List<TM_CLN_CostPlan_Lines> clns)
        {
            var cols = clns.Select(o => new TM_COL_ClientOrder_Lines
            {
                cln_id = o.cln_id,
                cod_id = codId,
                col_id = 0,
                col_level1 = o.cln_level1,
                col_level2 = o.cln_level2,
                col_description = o.cln_description ?? string.Empty,
                prd_id = o.prd_id,
                col_prd_name = o.prd_id.HasValue ? o.TM_PRD_Product.prd_name : o.cln_prd_name,
                pit_id = o.pit_id,
                col_purchase_price = o.cln_purchase_price,
                col_unit_price = o.cln_unit_price,
                col_quantity = o.cln_quantity,
                col_total_price = o.cln_total_price,
                col_total_crude_price = o.cln_total_crude_price,
                vat_id = o.vat_id,
                ltp_id = o.ltp_id,
                col_discount_amount = o.cln_discount_amount,
                col_discount_percentage = o.cln_discount_percentage,
                col_price_with_discount_ht = o.cln_price_with_discount_ht,
                col_margin = o.cln_margin,
                col_prd_des = o.cln_prd_des
            }).ToList();
            foreach (var oneCol in cols)
            {
                _db.TM_COL_ClientOrder_Lines.AddObject(oneCol);
                _db.SaveChanges();
            }
        }

        public void InsertUpdateCols(List<ClientOrderLine> cols)
        {
            foreach (var col in cols)
            {
                InsertUpdateCol(col, true);
            }
        }

    }
}

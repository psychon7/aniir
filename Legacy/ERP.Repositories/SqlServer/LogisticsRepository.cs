using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Runtime.Remoting.Messaging;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class LogisticsRepository : BaseSqlServerRepository
    {
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private ClientOrderRepository ClientOrderRepository = new ClientOrderRepository();
        private ClientOrderLineRepository ClientOrderLineRepository = new ClientOrderLineRepository();
        //private LogisticsLineRepository LogisticsLineRepository = new LogisticsLineRepository();
        private UserRepository UserRepository = new UserRepository();
        CalendarRepository CalendarRepository = new CalendarRepository();

        public int CreateUpdateLogistics(Logistics oneLogistics)
        {
            bool iscreate = false;
            int lgsId = 0;
            if (oneLogistics.Id != 0)
            {
                var lgs = _db.TM_LGS_Logistic.FirstOrDefault(m => m.lgs_id == oneLogistics.Id && m.soc_id == oneLogistics.SocId);
                if (lgs != null)
                {
                    lgs = LogisticsTranslator.EntityToRepository(oneLogistics, lgs);
                    _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                    _db.SaveChanges();
                    lgsId = lgs.lgs_id;
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
                try
                {
                    var newlgs = new TM_LGS_Logistic();
                    var lastlgs = _db.TM_LGS_Logistic.Where(m => m.soc_id == oneLogistics.SocId
                    && m.lgs_d_creation.Year == oneLogistics.DateCreation.Year
                    && m.lgs_d_creation.Month == oneLogistics.DateCreation.Month).OrderByDescending(m => m.lgs_code).FirstOrDefault();
                    string lastCode = string.Empty;
                    if (lastlgs != null)
                    {
                        lastCode = lastlgs.lgs_code;
                    }
                    string pref = GetCodePref(15);
                    oneLogistics.LgsCode = GetGeneralRefContinuation(oneLogistics.DateCreation, pref, lastCode, _codeType, oneLogistics.SupId ?? 0);
                    newlgs = LogisticsTranslator.EntityToRepository(oneLogistics, newlgs, true);
                    _db.TM_LGS_Logistic.AddObject(newlgs);
                    _db.SaveChanges();
                    lgsId = newlgs.lgs_id;
                }
                catch (Exception)
                {

                }
            }


            // update calendar
            var onelgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.lgs_id == lgsId);
            if (onelgs != null)
            {
                var solids = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == onelgs.lgs_id && l.sol_id.HasValue).Select(l => l.sol_id).ToList();
                int usrId = oneLogistics.UsrCreatorId;
                foreach (var solId in solids)
                {
                    CalendarRepository.UpdateSolDeliveryDateByLogistic(solId.Value, onelgs.lgs_d_arrive_pre, usrId, onelgs.lgs_id, onelgs.TM_SUP_Supplier.sup_company_name, onelgs.lgs_tracking_number);
                }
            }
            return lgsId;
        }

        public Logistics LoadLogisticsById(int lgsId, int socId, bool forPdf = false)
        {
            var lgs = _db.TM_LGS_Logistic.Where(m => m.lgs_id == lgsId && m.soc_id == socId).Select(LogisticsTranslator.RepositoryToEntity()).FirstOrDefault();
            if (lgs != null)
            {
                lgs.FId = StringCipher.EncoderSimple(lgs.Id.ToString(), "lgsId");
                lgs.SupFId = StringCipher.EncoderSimple(lgs.SupId.ToString(), "supId");
                lgs.SodFId = StringCipher.EncoderSimple(lgs.SodId.ToString(), "sodId");
            }
            if (lgs != null && forPdf)
            {
                lgs.AllLgLines = LoadAllLgsLines(socId, lgs.Id).OrderByDescending(l => l.CinId).ThenBy(l => l.SodId).ToList();
                //LogisticsLineRepository LogisticsLineRepository = new LogisticsLineRepository();
                //lgs.LogisticsLines = LogisticsLineRepository.GetClnsBylgsId(socId, lgsId).Where(m => m.LtpId != 6).ToList();
            }
            return lgs;
        }

        public List<int> GetLogisticsCinId(int lgsId, int socId)
        {
            var cinIds = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == lgsId && l.TM_LGS_Logistic.soc_id == socId).Where(l => l.cii_id.HasValue).Select(l => l.TM_CII_ClientInvoice_Line.cin_id).Distinct().ToList();
            return cinIds;
        }

        public List<int> GetLogisticsSodId(int lgsId, int socId)
        {
            var sodIds = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == lgsId && l.TM_LGS_Logistic.soc_id == socId).Where(l => l.sol_id.HasValue).Select(l => l.TM_SOL_SupplierOrder_Lines.sod_id).Distinct().ToList();
            return sodIds;
        }

        /// <summary>
        /// 设置LGS对应的SOD账单
        /// </summary>
        /// <returns></returns>
        public int SetLgsAssSod(int socId, int lgsId, int sodId)
        {
            var lgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.soc_id == socId && l.lgs_id == lgsId);
            if (lgs != null)
            {
                if (_db.TM_SOD_Supplier_Order.Any(l => l.sod_id == sodId))
                {
                    lgs.sod_id = sodId;
                }
                else
                {
                    lgs.sod_id = null;
                }
                _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                _db.SaveChanges();
            }
            return sodId;
        }


        /// <summary>
        /// 获取可以走物流的supplier invoice
        /// </summary>
        /// <returns></returns>
        public List<PurchaseBaseClass> GetSin2Delivery(int socId, int lgsId)
        {
            // 已送货但未入库
            var allSils = (from sin in _db.TM_SIN_Supplier_Invoice
                           join sil in _db.TM_SIL_SupplierInvoice_Lines on sin.sin_id equals sil.sin_id
                           where sin.soc_id == socId
                                 && !sin.sin_all_product_stored
                           select sil);
            var silwithLgl = (from sil in allSils
                              join lgl in _db.TM_LGL_Logistic_Lines on sil.sil_id equals lgl.sil_id
                              select new { sil });

            List<TM_SIL_SupplierInvoice_Lines> silRes = new List<TM_SIL_SupplierInvoice_Lines>();
            // add this 
            var noDeliveried = allSils.Except(silwithLgl.Select(m => m.sil));
            silRes.AddRange(noDeliveried);

            var deliveried = allSils.Except(noDeliveried);
            // 检测哪些是已经添加了但是没有完全添加的
            var sinIds = deliveried.Select(m => m.sin_id).Distinct();
            silRes.AddRange(from oneSinId in sinIds
                            from oneSil in deliveried.Where(m => m.sin_id == oneSinId)
                            let lglQuantitySum = oneSil.TM_LGL_Logistic_Lines.Sum(l => l.lgs_quantity)
                            where lglQuantitySum < oneSil.sil_quantity
                            select oneSil);

            //foreach (var oneSinId in sinIds)
            //{
            //    var silSinDeliveried = deliveried.Where(m => m.sin_id == oneSinId).ToList();
            //    foreach (var oneSil in silSinDeliveried)
            //    {
            //        var lglQuantitySum = oneSil.TM_LGL_Logistic_Lines.Sum(l => l.lgs_quantity);
            //        if (lglQuantitySum < oneSil.sil_quantity)
            //        {
            //            silRes.Add(oneSil);
            //        }
            //    }
            //}

            List<PurchaseBaseClass> result = new List<PurchaseBaseClass>();
            sinIds = silRes.Select(m => m.sin_id).Distinct().AsQueryable();
            foreach (var sinId in sinIds)
            {
                var tmpSil = silRes.FirstOrDefault(m => m.sin_id == sinId);
                if (tmpSil != null)
                {
                    var oneSin = tmpSil.TM_SIN_Supplier_Invoice;
                    var sin = PurchaseBaseTranslator.RepositoryToEntitySin().Compile().Invoke(oneSin);
                    sin.PurchaseLines = silRes.Where(m => m.sin_id == oneSin.sin_id).AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySil(true, lgsId)).ToList();
                    result.Add(sin);
                }
            }
            return result.Distinct().OrderBy(m => m.SinCode).ToList();
        }

        /// <summary>
        /// 获取可以走物流的supplier order
        /// </summary>
        /// <returns></returns>
        public List<PurchaseBaseClass> GetSod2Delivery(int socId, int lgsId)
        {
            // 已送货但未入库
            var allSols = (from sod in _db.TM_SOD_Supplier_Order
                           join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                           where sod.soc_id == socId
                                 && (!sol.sol_qty_storage.HasValue ||
                           sol.sol_qty_storage != sol.sol_quantity)
                            && (!sod.sod_finish.HasValue || sod.sod_finish.Value == false)
                           select sol).ToList();
            var solwithLgl = (from sol in allSols
                              join lgl in _db.TM_LGL_Logistic_Lines on sol.sol_id equals lgl.sol_id
                              join lgs in _db.TM_LGS_Logistic on lgl.lgs_id equals lgs.lgs_id
                              //where !lgs.lgs_is_stockin
                              select new { sol, lgl }).ToList();

            var solRes = new List<TM_SOL_SupplierOrder_Lines>();
            // add this 
            var noDeliveried = allSols.Except(solwithLgl.Select(m => m.sol));
            solRes.AddRange(noDeliveried);

            //var willBeDeliveried = allSols.Except(noDeliveried);
            // 检测哪些是已经添加了但是没有完全添加的
            //var sodIds = willBeDeliveried.Select(m => m.sod_id).Distinct();

            var sols = solwithLgl.Select(m => m.sol).Distinct().ToList();
            Dictionary<int, decimal?> solQty = new Dictionary<int, decimal?>();
            foreach (var onesol in sols)
            {
                var lglsum = solwithLgl.Where(m => m.sol.sol_id == onesol.sol_id).Select(m => m.lgl).Sum(m => m.lgs_quantity);
                if (lglsum < onesol.sol_quantity)
                {
                    if (!solQty.ContainsKey(onesol.sol_id))
                    {
                        solQty.Add(onesol.sol_id, lglsum);
                    }
                    solRes.Add(onesol);
                }
            }

            //solRes.AddRange(from onesol in sols let lglsum = solwithLgl.Where(m => m.sol.sol_id == onesol.sol_id).Select(m => m.lgl).Sum(m => m.lgs_quantity) where lglsum + onesol.sol_qty_storage < onesol.sol_quantity select onesol);


            List<PurchaseBaseClass> result = new List<PurchaseBaseClass>();
            var sodIds = solRes.Select(m => m.sod_id).Distinct().AsQueryable();
            foreach (var sodid in sodIds)
            {
                var tmpsod = solRes.FirstOrDefault(m => m.sod_id == sodid);
                if (tmpsod != null)
                {
                    var onesod = tmpsod.TM_SOD_Supplier_Order;
                    var sod = PurchaseBaseTranslator.RepositoryToEntitySod().Compile().Invoke(onesod);
                    //sod.PurchaseLines = solRes.Where(m => m.sod_id == onesod.sod_id).AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();
                    var solLines = solRes.Where(m => m.sod_id == onesod.sod_id).AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();
                    solLines.ForEach(m =>
                    {
                        var qty = solQty.FirstOrDefault(l => l.Key == m.SolId);
                        m.DeliveriedQuantity = qty.Key != 0 ? qty.Value : 0;
                    });
                    sod.PurchaseLines = solLines.OrderBy(m => m.Order).ToList();
                    result.Add(sod);
                }
            }
            return result.Distinct().OrderBy(m => m.SodCode).ToList();
            //return null;
        }

        public List<Logistics> SearchLogisticss(Logistics logistics)
        {
            var lgss = _db.TM_LGS_Logistic.Where(m => m.soc_id == logistics.SocId
                                                         && (string.IsNullOrEmpty(logistics.LgsName.Trim()) || m.lgs_name.Contains(logistics.LgsName.Trim()))
                                                         && (string.IsNullOrEmpty(logistics.LgsCode.Trim()) || m.lgs_code.Contains(logistics.LgsCode.Trim()))
                                                         && (string.IsNullOrEmpty(logistics.LgsTrackingNumber.Trim()) || m.lgs_tracking_number.Contains(logistics.LgsTrackingNumber.Trim()))
                                                         && (logistics.SupId == 0 || m.sup_id == logistics.SupId)
                //&& (string.IsNullOrEmpty(logistics.SinCode) || m.TM_LGL_Logistic_Lines.Any(l => l.TM_SIL_SupplierInvoice_Lines.TM_SIN_Supplier_Invoice.sin_code.Contains(logistics.SinCode)))
                //&& (logistics.LgsIsSent || (!logistics.LgsIsSent && !m.lgs_is_send))
                                                            && (!logistics.LgsIsSent || (logistics.LgsIsSent && m.lgs_is_send))
                //&& (logistics.LgsIsReceived || (!logistics.LgsIsReceived && !m.lgs_is_received))
                                                            && (!logistics.LgsIsReceived || (logistics.LgsIsReceived && m.lgs_is_received))
                                                         && (logistics.LgsDateArrivePre == null || !m.lgs_d_arrive.HasValue || m.lgs_d_arrive >= logistics.LgsDateArrivePre.Value)
                                                         && (logistics.LgsDateArrive == null || !m.lgs_d_arrive.HasValue || m.lgs_d_arrive <= logistics.LgsDateArrive.Value)
                ).Select(LogisticsTranslator.RepositoryToEntity()).ToList();


            var lgsIds = lgss.Select(l => l.Id).ToList();
            var lgshasfile = (from dtp in _db.TR_DTP_Document_Type
                              join doc in _db.TI_DOC_Document on dtp.dtp_id equals doc.dtp_id
                              where dtp.dtp_name == "Logistics" && !string.IsNullOrEmpty(doc.doc_path) && doc.doc_foreign_id.HasValue
                              select doc);

            lgsIds = lgsIds.Join(lgshasfile, oneId => oneId, hasfile => hasfile.doc_foreign_id, (oneId, hasfile) => oneId).ToList();

            lgss.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "lgsId");
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.AllLgLines = LoadAllLgsLines(logistics.SocId, m.Id);
                m.HasFiles = lgsIds.Any(l => l == m.Id);
            });
            return lgss;
        }

        public int DeleteLogistic(int socId, int lgsId)
        {
            int deletedIndex = 0;
            //todo: 确认llgl是否已经入库，进入库存
            var onelgs = _db.TM_LGS_Logistic.FirstOrDefault(m => m.lgs_id == lgsId && m.soc_id == socId);
            if (onelgs != null)
            {
                var lgls = onelgs.TM_LGL_Logistic_Lines.ToList();
                if (lgls.Any())
                {
                    foreach (var onelgl in lgls)
                    {
                        _db.TM_LGL_Logistic_Lines.DeleteObject(onelgl);
                        _db.SaveChanges();
                    }
                }
                _db.TM_LGS_Logistic.DeleteObject(onelgs);
                _db.SaveChanges();
                deletedIndex = 1;
            }
            return deletedIndex;
        }

        public void UpdateLogisticSendDate(int socId, int lgsId, DateTime sendDate, DateTime arrDate, string tracknum, int usrId)
        {
            var lgs = _db.TM_LGS_Logistic.FirstOrDefault(m => m.soc_id == socId && m.lgs_id == lgsId);
            if (lgs != null)
            {
                sendDate = CreateDateWithTime(sendDate);
                lgs.lgs_is_send = true;
                lgs.lgs_d_send = sendDate;
                lgs.lgs_d_arrive_pre = arrDate;
                lgs.lgs_tracking_number = tracknum;
                lgs.lgs_d_update = DateTime.Now;
                _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                _db.SaveChanges();
                WarehouseRepository WarehouseRepository = new WarehouseRepository();
                WarehouseRepository.CreatePreInventoryFromLgs(socId, lgsId);

                var lgls = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == lgsId);
                var PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                foreach (var onelgl in lgls)
                {
                    if (onelgl.sol_id.HasValue)
                    {
                        PurchaseBaseLineRepository.UpdateSolDatesByLogistic(onelgl.sol_id.Value, sendDate, arrDate, tracknum, usrId, lgsId, lgs.TM_SUP_Supplier.sup_company_name);
                    }
                }
            }
        }

        public List<Logistics> GetLogisticsByKeyword(string keyword, int socId, int usrId, bool superRight, int limited)
        {
            var lgss = (from lgs in _db.TM_LGS_Logistic
                        where (string.IsNullOrEmpty(keyword)
                               || lgs.lgs_code.Contains(keyword)
                               || lgs.lgs_name.Contains(keyword)
                               || lgs.lgs_tracking_number.Contains(keyword)
                               || lgs.lgs_comment.Contains(keyword)
                               || lgs.TM_SUP_Supplier.sup_company_name.Contains(keyword)
                               || lgs.TM_CON_CONSIGNEE.con_company_name.Contains(keyword)
                               || lgs.TM_CON_CONSIGNEE.con_firstname.Contains(keyword)
                               || lgs.TM_CON_CONSIGNEE.con_lastname.Contains(keyword)
                            )
                              && !lgs.lgs_is_send
                              && lgs.soc_id == socId
                        select lgs).Select(LogisticsTranslator.RepositoryToEntity()).ToList().Skip(0).Take(limited).ToList();

            //var lgls = (from lgl in _db.TM_LGL_Logistic_Lines
            //            join lgs in lgss on lgl.lgs_id equals lgs.Id
            //            select lgl).Select(LogisticsTranslator.RepositoryToEntityLgl()).ToList();

            lgss.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "lgsId");
            });
            return lgss;
        }

        /// <summary>
        /// 用Cin来创建或加入一个Logistics
        /// </summary>
        /// <returns></returns>
        public int CreateUpdateLgsFromCin(int cinId, int lgsId, int supId, int creatorId, int socId, List<KeyValue> ciiLines)
        {
            TM_LGS_Logistic onelgs = null;
            int lgs_id = 0;
            var isCreate = false;
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.cin_id == cinId);
            if (cin != null)
            {
                if (lgsId == 0)
                {
                    isCreate = true;
                }
                else
                {
                    onelgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.lgs_id == lgsId);
                    if (onelgs == null)
                    {
                        isCreate = true;
                    }
                    else
                    {
                        var ciiIndb = (from ciiLine in ciiLines
                                       join cii in _db.TM_CII_ClientInvoice_Line on ciiLine.Key equals cii.cii_id
                                       //join lgl in _db.TM_LGL_Logistic_Lines on cii.cii_id equals lgl.cii_id
                                       //    into leftJ
                                       //from lj in leftJ.DefaultIfEmpty()
                                       select new { ciiLine, cii }).ToList();

                        // 确认，在已有的lgs中，是否存在改cin，如果有的话，则不新建cgs_cin_lgs
                        var ciisInLgs = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == lgsId && l.TM_CII_ClientInvoice_Line.cin_id == cinId && l.cgl_id.HasValue).Select(l => l.cgl_id).FirstOrDefault();
                        int cglId = 0;
                        if (ciisInLgs != null)
                        {
                            cglId = ciisInLgs.Value;
                        }
                        else
                        {
                            var oldCgs = _db.TR_CGS_CIN_LGS.Where(l => l.cin_id == cinId).OrderByDescending(l => l.cin_order).FirstOrDefault();
                            var newCgs = new TR_CGS_CIN_LGS
                            {
                                cin_id = cinId,
                                lgs_id = onelgs.lgs_id,
                                cin_order = (oldCgs == null) ? 1 : (oldCgs.cin_order + 1)
                            };
                            _db.AddToTR_CGS_CIN_LGS(newCgs);
                            _db.SaveChanges();
                            cglId = newCgs.cgl_id;
                        }


                        foreach (var oneCii in ciiIndb)
                        {
                            var lgl = oneCii.cii.TM_LGL_Logistic_Lines.FirstOrDefault(l => l.lgs_id == lgsId);
                            if (lgl != null)
                            {
                                lgl.lgs_quantity = oneCii.ciiLine.Key2;
                                _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(lgl);
                            }
                            //if (oneCii.lj != null && oneCii.lj.lgs_id == lgsId)
                            //{
                            //    oneCii.lj.lgs_quantity = oneCii.ciiLine.Key2;
                            //    _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(oneCii.lj);
                            //}
                            else
                            {
                                var oneLgl = new TM_LGL_Logistic_Lines
                                {
                                    lgl_guid = Guid.NewGuid(),
                                    lgs_id = onelgs.lgs_id,
                                    lgs_quantity = oneCii.ciiLine.Key2,
                                    lgs_prd_name = oneCii.cii.cii_prd_name,
                                    lgl_prd_des = oneCii.cii.cii_description,
                                    prd_id = oneCii.cii.prd_id,
                                    pit_id = oneCii.cii.pit_id,
                                    cii_id = oneCii.cii.cii_id,
                                    cgl_id = cglId == 0 ? (int?)null : cglId
                                };
                                _db.AddToTM_LGL_Logistic_Lines(oneLgl);
                            }
                        }
                        _db.SaveChanges();
                        lgs_id = onelgs.lgs_id;
                    }
                }
                if (isCreate)
                {
                    var sup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == supId);
                    if (sup != null)
                    {
                        var newlgs = new Logistics();
                        newlgs.SupId = supId;
                        newlgs.LgsName = string.Format("Auto-creation {0:yyyy-mm-dd}", DateTime.Now);
                        newlgs.UsrCreatorId = creatorId;
                        newlgs.ConId = _db.TM_CON_CONSIGNEE.Any() ? _db.TM_CON_CONSIGNEE.FirstOrDefault().con_id : 0;
                        newlgs.DateCreation = DateTime.Now;
                        newlgs.DateUpdate = DateTime.Now;
                        newlgs.LgsDateSend = null;
                        newlgs.LgsDateArrivePre = null;
                        newlgs.LgsDateArrive = null;
                        newlgs.LgsIsPurchase = false;
                        newlgs.SocId = socId;
                        lgs_id = CreateUpdateLogistics(newlgs);
                        onelgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.lgs_id == lgs_id);
                        var oldCgs = _db.TR_CGS_CIN_LGS.Where(l => l.cin_id == cinId).OrderByDescending(l => l.cin_order).FirstOrDefault();
                        var newCgs = new TR_CGS_CIN_LGS
                        {
                            cin_id = cinId,
                            lgs_id = onelgs.lgs_id,
                            cin_order = (oldCgs == null) ? 1 : (oldCgs.cin_order + 1)
                        };
                        _db.AddToTR_CGS_CIN_LGS(newCgs);
                        _db.SaveChanges();
                        int cglId = newCgs.cgl_id;
                        var ciiIndb = (from ciiLine in ciiLines
                                       join cii in _db.TM_CII_ClientInvoice_Line on ciiLine.Key equals cii.cii_id
                                       select new { ciiLine, cii }).ToList();
                        foreach (var oneCii in ciiIndb)
                        {
                            var oneLgl = new TM_LGL_Logistic_Lines
                            {
                                lgl_guid = Guid.NewGuid(),
                                lgs_id = onelgs.lgs_id,
                                lgs_quantity = oneCii.ciiLine.Key2,
                                lgs_prd_name = oneCii.cii.cii_prd_name,
                                lgl_prd_des = oneCii.cii.cii_prd_des,
                                prd_id = oneCii.cii.prd_id,
                                pit_id = oneCii.cii.pit_id,
                                cii_id = oneCii.cii.cii_id,
                                cgl_id = cglId == 0 ? (int?)null : cglId
                            };
                            _db.AddToTM_LGL_Logistic_Lines(oneLgl);
                        }
                        _db.SaveChanges();
                        lgs_id = onelgs.lgs_id;
                    }
                }
            }
            return lgs_id;
        }

        #region widget

        public List<Logistics> GetLogisticssNoSent(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var lgss = _db.TM_LGS_Logistic.Where(m => m.soc_id == socId && (isAdmin || m.usr_id_creator == usrId) && (!m.lgs_is_send)).Select(LogisticsTranslator.RepositoryToEntity()).ToList();
            lgss.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "lgsId");
            });
            return lgss;
        }

        public List<Logistics> GetLogisticssArriving(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var lgss = _db.TM_LGS_Logistic.Where(m => m.soc_id == socId && (isAdmin || m.usr_id_creator == usrId) && (m.lgs_is_send)).Select(LogisticsTranslator.RepositoryToEntity()).ToList();
            lgss.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.Id.ToString(), "lgsId");
            });
            return lgss;
        }

        #endregion widget

        #region Logistics Lines

        public int AddSolToLgs(int socId, int lgsId, int solId, int qty)
        {
            int lglId = 0;
            var solInLgs = (from lgl in _db.TM_LGL_Logistic_Lines
                            where lgl.sol_id == solId
                            && lgl.lgs_id == lgsId
                            && lgl.TM_LGS_Logistic.soc_id == socId
                            select lgl).ToList();

            if (solInLgs.Any())
            {
                foreach (var onelgl in solInLgs)
                {
                    lglId = onelgl.lgl_id;
                    onelgl.lgs_quantity += qty;
                    _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(onelgl);
                }
                _db.SaveChanges();
            }
            else
            {
                var sol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(m => m.sol_id == solId && m.TM_SOD_Supplier_Order.soc_id == socId);
                var lgs = _db.TM_LGS_Logistic.FirstOrDefault(m => m.lgs_id == lgsId && m.soc_id == socId);
                if (sol != null && lgs != null)
                {
                    var onelgl = new LogisticsLine
                    {
                        LgsId = lgsId,
                        LglQuantity = qty,
                        ProductName = sol.sol_prd_name,
                        PrdDescription = sol.sol_prd_des,
                        //LglDescription = sol.sol_description,
                        PrdId = sol.prd_id,
                        PitId = sol.pit_id,
                        SilId = null,
                        SolId = solId
                    };
                    var algl = LogisticsTranslator.EntityToRepositoryLgl(onelgl, null, true);
                    _db.TM_LGL_Logistic_Lines.AddObject(algl);
                    _db.SaveChanges();
                    lglId = algl.lgl_id;
                }
            }
            return lglId;
        }

        public List<LogisticsLine> CreateUpdateLogisticLines(int socId, int lgsId, List<LogisticsLine> lgls)
        {
            ////var updateLgl = lgls.Where(m => m.Id != 0 && m.LgsId != 0 && m.LglQuantity > 0).ToList();
            //var updateLgl = lgls.Where(m => m.SolId != 0 && m.LglQuantity > 0).ToList();

            //var createLgl = lgls.Where(m => m.LgsId != 0 && m.LglQuantity > 0).Except(updateLgl).ToList();

            //(from lglUp in updateLgl
            // join lgl in _db.TM_LGL_Logistic_Lines on lglUp.SolId equals lgl.sol_id
            // where lgl.lgs_id == lgsId && lgl.TM_LGS_Logistic.soc_id == socId
            // select new
            // {
            //     lgl,
            //     lglUp
            // }).ToList().ForEach(m =>
            // {
            //     m.lglUp.LglQuantity = m.lgl.lgs_quantity + m.lglUp.LglQuantity;
            //     var lgl2update = LogisticsTranslator.EntityToRepositoryLgl(m.lglUp, m.lgl);
            //     _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(lgl2update);
            //     _db.SaveChanges();
            // });

            //createLgl.ForEach(m =>
            //{
            //    var onelgl = LogisticsTranslator.EntityToRepositoryLgl(m, null, true);
            //    _db.TM_LGL_Logistic_Lines.AddObject(onelgl);
            //    _db.SaveChanges();
            //});
            //var alllines = _db.TM_LGL_Logistic_Lines.Where(m => m.lgs_id == lgsId).Select(LogisticsTranslator.RepositoryToEntityLgl()).ToList();
            //return alllines;

            // 确认是否有SOL， 有再确认是更新还是创建
            var lglWithSol = lgls.Where(m => m.SolId != 0).ToList();
            var lglSolId = lglWithSol.Select(m => m.SolId).Distinct().ToList();
            var solInLgs = (from lgl in _db.TM_LGL_Logistic_Lines
                            join solid in lglSolId on lgl.sol_id equals solid
                            where lgl.lgs_id == lgsId && lgl.TM_LGS_Logistic.soc_id == socId
                            select lgl).ToList();
            solInLgs.ForEach(m =>
            {
                var onelgl = lglWithSol.FirstOrDefault(l => l.SolId == m.sol_id);
                if (onelgl != null)
                {
                    m.lgs_quantity += onelgl.LglQuantity;
                    m.lgs_description += onelgl.LglDescription;
                    _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(m);
                }
            });

            var solIds = new List<int>();

            if (solInLgs.Any())
            {
                solInLgs.Select(m => m.sol_id).ToList().ForEach(m => solIds.Add(m ?? 0));
                _db.SaveChanges();
            }
            solIds = solIds.Distinct().ToList();
            var lglDones = (from lgl in lgls
                            join solid in solIds on lgl.SolId equals solid
                            select lgl);
            var newlgl = lgls.Except(lglDones).ToList();

            newlgl.ForEach(m =>
            {
                var onelgl = LogisticsTranslator.EntityToRepositoryLgl(m, null, true);
                _db.TM_LGL_Logistic_Lines.AddObject(onelgl);
                _db.SaveChanges();
            });

            return LoadAllLgsLines(socId, lgsId);
        }

        public List<LogisticsLine> LoadAllLgsLines(int socId, int lgsId)
        {
            var alllines =
                _db.TM_LGL_Logistic_Lines.Where(m => m.lgs_id == lgsId && m.TM_LGS_Logistic.soc_id == socId)
                    .Select(LogisticsTranslator.RepositoryToEntityLgl())
                    .ToList();

            var allwithsol = (from lgl in alllines
                              join sol in _db.TM_SOL_SupplierOrder_Lines on lgl.SolId equals sol.sol_id
                              select new KeyValue
                              {
                                  Key = sol.sol_id,
                                  Key2 = sol.sol_quantity ?? 0,
                                  Key3 = sol.sod_id,
                                  Value = sol.TM_SOD_Supplier_Order.sod_code,
                                  Value2 = sol.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_company_name
                              }).Distinct().ToList();

            var allLineInOtherLgs = (from lgl in _db.TM_LGL_Logistic_Lines
                                     join sol in _db.TM_SOL_SupplierOrder_Lines on lgl.sol_id equals sol.sol_id
                                     where lgl.lgs_id != lgsId
                                     select lgl).Distinct().ToList();

            alllines.ForEach(m =>
            {
                var onesol = allwithsol.FirstOrDefault(l => l.Key == m.SolId);
                if (onesol != null)
                {
                    m.LglQuantityTotal = onesol.Key2;
                    m.SodCode = onesol.Value;
                    m.SodId = Convert.ToInt32(onesol.Key3);
                    m.FId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                    m.Supplier = onesol.Value2;
                    if (allLineInOtherLgs.Any(l => l.sol_id == m.SolId))
                    {
                        m.LglQuantityDeliveried = allLineInOtherLgs.Where(l => l.sol_id == m.SolId).Sum(l => l.lgs_quantity);
                    }
                }
                if (m.CinId.HasValue)
                {
                    // 设定一个SodId 用于前端JS分类
                    m.SodId = -1 * m.CinId.Value;
                    m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                }
            });

            return alllines.OrderByDescending(m => m.SodCode).ToList();
        }

        public LogisticsLine UpdateOneLgLine(int socId, LogisticsLine lgLine)
        {
            var oneline = _db.TM_LGL_Logistic_Lines.FirstOrDefault(m => m.lgl_id == lgLine.Id && m.lgs_id == lgLine.LgsId && m.TM_LGS_Logistic.soc_id == socId);
            if (oneline != null)
            {
                if (lgLine.LglQuantity == 0)
                {
                    // delete
                    _db.TM_LGL_Logistic_Lines.DeleteObject(oneline);
                    _db.SaveChanges();
                }
                else
                {
                    oneline.lgs_description = lgLine.LglDescription;
                    oneline.lgs_quantity = lgLine.LglQuantity;
                    if (!oneline.sil_id.HasValue)
                    {
                        if (lgLine.PrdId != 0)
                        {
                            oneline.prd_id = lgLine.PrdId;
                        }
                        if (lgLine.PitId != 0)
                        {
                            oneline.pit_id = lgLine.PitId;
                        }
                        oneline.lgl_prd_des = lgLine.PrdDescription;
                        oneline.lgs_prd_name = lgLine.ProductName;
                        oneline.lgs_prd_ref = lgLine.ProductRef;
                    }

                    _db.TM_LGL_Logistic_Lines.ApplyCurrentValues(oneline);
                    _db.SaveChanges();
                }
            }
            return lgLine;
        }

        #endregion Logistics Lines
    }
}
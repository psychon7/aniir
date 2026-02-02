using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using ExpressionParser = System.Linq.Dynamic.ExpressionParser;

//using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.SqlServer
{
    public class WarehouseRepository : BaseSqlServerRepository
    {
        public void CreateSrvFromLogisticSeearch(int socId, int lgsId, int usrId, DateTime receiveDate, string comment)
        {
            var lines = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == lgsId).Select(LogisticsTranslator.RepositoryToEntityLgl()).ToList();

            var lgs =
                _db.TM_LGS_Logistic.FirstOrDefault(m => m.soc_id == socId && m.lgs_id == lgsId && !m.lgs_is_received && !m.lgs_is_stockin);
            if (lgs != null)
            {
                var srvForm = new ShippingReceiving
                {
                    SrvDDamaged = null,
                    UsrCreatorId = usrId,
                    SrvDDestroy = null,
                    SrvDLendReturnPre = null,
                    SrvDReturnClient = null,
                    SrvDReturnSupplier = null,
                    SrvDescription = string.Empty,
                    SrvIsDamaged = false,
                    SrvIsDestroy = false,
                    SrvIsLend = false,
                    SrvIsReturnClient = false,
                    SrvIsReturnSupplier = false,
                    SrvIsRev = true,
                    SrvTime = receiveDate,
                    SrvTotalQuantity = 0,
                    SrvTotalReal = 0,
                    SrvValid = true,
                    //WhsId = whsId,
                };
                int srvId = CreateUpdateSrvAndProduct(srvForm, lines);
                var whsIds = lines.Where(m => m.WhsId != 0).Select(m => m.WhsId).Distinct().ToList();
                CreatePreInventoryFromLgs(socId, lgsId, false);
                lgs.lgs_is_received = true;
                lgs.lgs_is_stockin = true;
                lgs.lgs_d_stockin = receiveDate;
                lgs.lgs_d_arrive = receiveDate;
                // 更新Comment
                lgs.lgs_comment = string.IsNullOrEmpty(lgs.lgs_comment)
                    ? comment
                    : (string.Format("{0}\r\n{1}", lgs.lgs_comment, comment));
                lgs.lgs_d_update = DateTime.Now;
                _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                _db.SaveChanges();
                UpdateSolQuantityAfterSrvCreation(lines);
            }
        }



        public void CreateSrvFromLogistic(int socId, int lgsId, int usrId, DateTime receiveDate, List<LogisticsLine> lines)
        {
            var lgs =
                _db.TM_LGS_Logistic.FirstOrDefault(m => m.soc_id == socId && m.lgs_id == lgsId && !m.lgs_is_received && !m.lgs_is_stockin);
            if (lgs != null)
            {
                var srvForm = new ShippingReceiving
                {
                    SrvDDamaged = null,
                    UsrCreatorId = usrId,
                    SrvDDestroy = null,
                    SrvDLendReturnPre = null,
                    SrvDReturnClient = null,
                    SrvDReturnSupplier = null,
                    SrvDescription = string.Empty,
                    SrvIsDamaged = false,
                    SrvIsDestroy = false,
                    SrvIsLend = false,
                    SrvIsReturnClient = false,
                    SrvIsReturnSupplier = false,
                    SrvIsRev = true,
                    SrvTime = receiveDate,
                    SrvTotalQuantity = 0,
                    SrvTotalReal = 0,
                    SrvValid = true,
                    //WhsId = whsId,
                };
                int srvId = CreateUpdateSrvAndProduct(srvForm, lines);
                var whsIds = lines.Where(m => m.WhsId != 0).Select(m => m.WhsId).Distinct().ToList();
                CreatePreInventoryFromLgs(socId, lgsId, false);
                lgs.lgs_is_received = true;
                lgs.lgs_is_stockin = true;
                lgs.lgs_d_stockin = receiveDate;
                lgs.lgs_d_arrive = receiveDate;
                lgs.lgs_d_update = DateTime.Now;
                _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                _db.SaveChanges();
                UpdateSolQuantityAfterSrvCreation(lines);
            }
        }

        public void CreateSrvFromDeliveryForm(int socId, int dfoId, int usrId, DateTime receiveDate, List<DeliveryFormLine> lines)
        {
            int whsId = 0;
            //var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId && !m.dfo_deliveried);
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId);
            if (dfo != null)
            {
                var srvForm = new ShippingReceiving
                {
                    SrvDDamaged = null,
                    UsrCreatorId = usrId,
                    SrvDDestroy = null,
                    SrvDLendReturnPre = null,
                    SrvDReturnClient = null,
                    SrvDReturnSupplier = null,
                    SrvDescription = string.Empty,
                    SrvIsDamaged = false,
                    SrvIsDestroy = false,
                    SrvIsLend = false,
                    SrvIsReturnClient = false,
                    SrvIsReturnSupplier = false,
                    SrvIsRev = false,
                    SrvTime = receiveDate,
                    SrvTotalQuantity = 0,
                    SrvTotalReal = 0,
                    SrvValid = true,
                    //WhsId = whsId,
                };

                // 将每行dfl 获取已存在库存

                #region

                //var dflids = lines.Select(m => m.DflId).Distinct().ToList();
                var dflIds = lines.Select(m => m.DflId).ToList();

                var dfls = (from dfl in _db.TM_DFL_DevlieryForm_Line
                            join id in dflIds on dfl.dfl_id equals id
                            select dfl).ToList();
                var colPits = dfls.Where(m => m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
                var invWithPits = (from onecol in colPits
                                   join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.pit_id equals inv.pit_id
                                   where onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && inv.pit_id.HasValue
                                   select new { onecol, inv }).ToList();
                var colWithName = dfls.Where(m => !m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
                var invWithName = (from onecol in colWithName
                                   join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.col_prd_name equals inv.prd_name
                                   where !onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && !inv.pit_id.HasValue
                                   select new { onecol, inv }).ToList();

                foreach (var invWithPit in invWithPits)
                {
                    var onedfl = lines.FirstOrDefault(m => m.DflId == invWithPit.onecol.dfl_id);
                    if (onedfl != null)
                    {
                        onedfl.InvId = invWithPit.inv.inv_id;
                        var inv = invWithPit.inv.TR_PSH_Product_Shelves.FirstOrDefault();
                        if (inv != null)
                        {
                            onedfl.SheId = inv.she_id;
                            onedfl.WhsId = inv.whs_id;
                        }
                    }
                }

                foreach (var invWithNm in invWithName)
                {
                    var onedfl = lines.FirstOrDefault(m => m.DflId == invWithNm.onecol.dfl_id);
                    if (onedfl != null)
                    {
                        onedfl.InvId = invWithNm.inv.inv_id;
                        var inv = invWithNm.inv.TR_PSH_Product_Shelves.FirstOrDefault();
                        if (inv != null)
                        {
                            onedfl.SheId = inv.she_id;
                            onedfl.WhsId = inv.whs_id;
                        }
                    }
                }

                #endregion


                int srvId = CreateUpdateSrvAndProduct(srvForm, lines);
                //var whsIds = lines.Where(m => m.WhsId != 0).Select(m => m.WhsId).Distinct().ToList();
                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo);
                _db.SaveChanges();
            }
        }

        public void CreateSrvDirect(ShippingReceiving srvForm, List<ShippingReceivingLine> lines)
        {
            // treate form
            if (srvForm.SrvIsRev)
            {
                srvForm.SrvIsLend = false;
                srvForm.SrvDLendReturnPre = null;
                srvForm.SrvIsDestroy = false;
                srvForm.SrvDDestroy = null;
                srvForm.SrvIsReturnSupplier = false;
                srvForm.SrvDReturnSupplier = null;
                srvForm.SrvIsDamaged = false;
                srvForm.SrvDDamaged = null;
                srvForm.SrvValid = true;
            }
            else
            {
                srvForm.SrvIsReturnClient = false;
                srvForm.SrvDReturnClient = null;
            }
            var srvId = CreateUpdateShippingReceiving(srvForm);
            CreateSrvLinesDirect(srvId, srvForm.InvId, lines);
            // update product shelve
            UpdateProductShelveDirect(srvForm.SrvIsRev, lines);
            var quantity = srvForm.SrvIsRev ? srvForm.SrvTotalReal : (srvForm.SrvTotalReal * -1);
            UpdateInventoryDirectly(srvForm.InvId, quantity);
        }

        /// <summary>
        /// 建立进出库单，更新库存
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="srvForm"></param>
        /// <param name="lines"></param>
        /// <returns></returns>
        public int CreateUpdateSrvAndProduct<T>(ShippingReceiving srvForm, List<T> lines = null)
        {
            var srvId = CreateUpdateShippingReceiving(srvForm);
            //List<LogisticsLine> lglLines = new List<LogisticsLine>();
            //List<DeliveryFormLine> dflLines = new List<DeliveryFormLine>();
            if (lines != null && lines.Any())
            {
                if (lines is List<LogisticsLine>)
                {
                    var line = lines.Cast<LogisticsLine>().ToList();
                    CreateSrvLinesFromLogistic(srvId, line);
                }
                if (lines is List<DeliveryFormLine>)
                {
                    var line = lines.Cast<DeliveryFormLine>().ToList();
                    CreateSrvLinesFromDfo(srvId, line);
                }
            }
            UpdateShippingReceivingFormQuantity(srvId);

            // 更新库存
            lines = UpdateInventoryBySrvId(srvId, lines);
            foreach (var line in lines)
            {
                if (line is LogisticsLine)
                {
                    var oneline = line as LogisticsLine;
                    if (oneline.WhsId != 0)
                    {
                        var newQuantity = oneline.LglQuantity * (srvForm.SrvIsRev ? 1 : -1);
                        CreateUpdateProductShelves(oneline.InvId, oneline.WhsId, oneline.SheId, newQuantity);
                    }
                }
                else
                {
                    var oneline = line as DeliveryFormLine;
                    if (oneline != null)
                    {
                        var newQuantity = oneline.DflQuantity * (srvForm.SrvIsRev ? 1 : -1);
                        CreateUpdateProductShelves(oneline.InvId, oneline.WhsId, oneline.SheId, newQuantity);
                    }
                }
            }
            return srvId;
        }

        public int CreateUpdateShippingReceiving(ShippingReceiving srvForm)
        {
            int srvId = 0;
            bool iscreate = false;
            if (srvForm.SrvId == 0)
            {
                iscreate = true;
            }
            else
            {
                var onesrv = _db.TM_SRV_Shipping_Receiving.FirstOrDefault(m => m.srv_id == srvForm.SrvId);
                if (onesrv == null)
                {
                    iscreate = true;
                }
                else
                {
                    // update srv
                    onesrv = ShippingReceivingTranslator.EntityToRepository(srvForm, onesrv);
                    _db.TM_SRV_Shipping_Receiving.ApplyCurrentValues(onesrv);
                    _db.SaveChanges();
                    srvId = onesrv.srv_id;
                }
            }
            if (iscreate)
            {
                srvForm.SrvTime = DateTime.Now;
                var lastcpl = _db.TM_SRV_Shipping_Receiving.Where(m =>
                  m.srv_time.Year == srvForm.SrvTime.Year
                 && m.srv_time.Month == srvForm.SrvTime.Month).OrderByDescending(m => m.srv_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastcpl != null)
                {
                    lastCode = lastcpl.srv_code;
                }
                string pref = GetCodePref(11);
                srvForm.SrvCode = GetGeneralRefContinuation(srvForm.SrvTime, pref, lastCode, _codeType, 0);
                var srv = ShippingReceivingTranslator.EntityToRepository(srvForm, null, true);
                _db.TM_SRV_Shipping_Receiving.AddObject(srv);
                _db.SaveChanges();
                srvId = srv.srv_id;
            }
            return srvId;
        }

        public void UpdateProductShelveDirect(bool isRev, List<ShippingReceivingLine> lines)
        {
            foreach (var oneline in lines)
            {
                var psh = _db.TR_PSH_Product_Shelves.FirstOrDefault(m => m.psh_id == oneline.PshId);
                if (psh != null)
                {
                    var quantity = oneline.SrlQuantityReal;
                    quantity = isRev ? quantity : (quantity * -1);
                    psh.psh_quantity = psh.psh_quantity + quantity;
                    _db.TR_PSH_Product_Shelves.ApplyCurrentValues(psh);
                    _db.SaveChanges();
                }
                else if (oneline.PshId < 0)
                {
                    // create
                    var quantity = oneline.SrlQuantityReal;
                    quantity = isRev ? quantity : (quantity * -1);
                    psh = new TR_PSH_Product_Shelves
                    {
                        psh_quantity = quantity,
                        whs_id = oneline.WhsId,
                        she_id = oneline.SheId,
                        inv_id = oneline.InvId,
                    };
                    _db.TR_PSH_Product_Shelves.AddObject(psh);
                    _db.SaveChanges();
                }
            }
        }


        /// <summary>
        /// 通过logistic 插入表
        /// </summary>
        /// <param name="srvId"></param>
        /// <param name="lgsId"></param>
        /// <param name="lines"></param>
        private void CreateSrvLinesDirect(int srvId, int invId, List<ShippingReceivingLine> lines)
        {
            var inventory = _db.TM_INV_Inventory.FirstOrDefault(m => m.inv_id == invId);
            if (inventory != null)
            {
                var onepit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == inventory.pit_id);
                var srvlines = (from oneline in lines
                                select new TM_SRL_Shipping_Receiving_Line
                                {
                                    srv_id = srvId,
                                    lgl_id = null,
                                    dfl_id = null,
                                    srl_quantity = oneline.SrlQuantityReal,
                                    srl_unit_price = onepit != null ? onepit.pit_price : 0,
                                    prd_id = onepit != null ? onepit.prd_id : (int?)null,
                                    pit_id = onepit != null ? onepit.pit_id : (int?)null,
                                    srl_prd_ref = onepit != null ? onepit.pit_ref : inventory.prd_ref,
                                    srl_prd_name = inventory.prd_name,
                                    srl_prd_des = inventory.prd_description,
                                    srl_description = oneline.SrlDescription,
                                    srl_quantity_real = oneline.SrlQuantityReal,
                                    srl_total_price_real = oneline.SrlQuantityReal * (onepit != null ? onepit.pit_price : 0),
                                    srl_total_price = oneline.SrlQuantityReal * (onepit != null ? onepit.pit_price : 0),
                                    whs_id = oneline.WhsId,
                                    she_id = oneline.SheId
                                }).ToList();
                foreach (var srlline in srvlines)
                {
                    _db.TM_SRL_Shipping_Receiving_Line.AddObject(srlline);
                    _db.SaveChanges();
                }
            }
        }

        /// <summary>
        /// 通过logistic 插入表
        /// </summary>
        /// <param name="srvId"></param>
        /// <param name="lgsId"></param>
        /// <param name="lines"></param>
        private void CreateSrvLinesFromLogistic(int srvId, List<LogisticsLine> lines)
        {
            var lglLines = (from line in lines
                            join lgl in _db.TM_LGL_Logistic_Lines
                                on line.Id equals lgl.lgl_id
                            select lgl).ToList();
            var srvlines = (from logisticsLine in lglLines
                            let oneline = lines.FirstOrDefault(m => m.Id == logisticsLine.lgl_id)
                            select new TM_SRL_Shipping_Receiving_Line()
                            {
                                srv_id = srvId,
                                lgl_id = logisticsLine.lgl_id,
                                dfl_id = null,
                                srl_quantity = logisticsLine.lgs_quantity,
                                srl_unit_price = logisticsLine.lgs_unit_price,
                                prd_id = logisticsLine.prd_id,
                                pit_id = logisticsLine.pit_id,
                                srl_prd_ref = logisticsLine.lgs_prd_ref,
                                srl_prd_name = logisticsLine.lgs_prd_name,
                                srl_prd_des = logisticsLine.lgl_prd_des,
                                srl_description = oneline.LglDescription,
                                srl_quantity_real = oneline.LglQuantity,
                                srl_total_price_real = oneline.LglQuantity * logisticsLine.lgs_unit_price,
                                srl_total_price = logisticsLine.lgs_quantity * logisticsLine.lgs_unit_price,
                                whs_id = oneline.WhsId,
                                she_id = oneline.SheId
                            }).ToList();
            foreach (var srlline in srvlines)
            {
                _db.TM_SRL_Shipping_Receiving_Line.AddObject(srlline);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 通过 delivery form 插入表
        /// </summary>
        /// <param name="srvId"></param>
        /// <param name="dfoId"></param>
        /// <param name="lines"></param>
        private void CreateSrvLinesFromDfo(int srvId, List<DeliveryFormLine> lines)
        {
            var dflLinesDb = (from line in lines
                              join dfl in _db.TM_DFL_DevlieryForm_Line
                                  on line.DflId equals dfl.dfl_id
                              select dfl).ToList();
            var srvlines = (from onedfl in lines
                            let oneline = dflLinesDb.FirstOrDefault(l => l.dfl_id == onedfl.DflId)
                            where oneline != null && onedfl.WhsId != 0 && onedfl.SheId != 0 && onedfl.InvId != 0
                            select new DeliveryFormLine
                                   {
                                       DflId = oneline.dfl_id,
                                       ColUnitPrice = oneline.TM_COL_ClientOrder_Lines.col_unit_price,
                                       ColTotalPrice = oneline.TM_COL_ClientOrder_Lines.col_unit_price * oneline.dfl_quantity,
                                       DflQuantity = onedfl.DflQuantity,
                                       PrdId = oneline.TM_COL_ClientOrder_Lines.prd_id,
                                       PitId = oneline.TM_COL_ClientOrder_Lines.pit_id,
                                       PrdName = oneline.TM_COL_ClientOrder_Lines.col_prd_name,
                                       ColPrdDes = oneline.TM_COL_ClientOrder_Lines.col_prd_des,
                                       ColDescription = oneline.TM_COL_ClientOrder_Lines.col_description,
                                       // only for this part
                                       ColTotalCrudePrice = oneline.TM_COL_ClientOrder_Lines.col_unit_price * onedfl.DflQuantity,
                                       WhsId = onedfl.WhsId,
                                       SheId = onedfl.SheId,
                                       InvId = onedfl.InvId,
                                       // only for this field
                                       ColQuantity = oneline.dfl_quantity
                                   }).ToList().Select(m => new TM_SRL_Shipping_Receiving_Line
                                              {
                                                  srv_id = srvId,
                                                  lgl_id = null,
                                                  dfl_id = m.DflId,
                                                  srl_unit_price = m.ColUnitPrice,
                                                  srl_total_price = m.ColTotalPrice,
                                                  srl_quantity = m.ColQuantity ?? 0,
                                                  prd_id = m.PrdId,
                                                  pit_id = m.PitId,
                                                  srl_prd_name = m.PrdName,
                                                  srl_prd_des = m.ColPrdDes,
                                                  srl_description = m.ColDescription,
                                                  srl_quantity_real = m.DflQuantity,
                                                  srl_total_price_real = m.ColTotalCrudePrice,
                                                  whs_id = m.WhsId,
                                                  she_id = m.SheId
                                              });

            foreach (var srlline in srvlines)
            {
                _db.TM_SRL_Shipping_Receiving_Line.AddObject(srlline);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 更新出入库表数量
        /// </summary>
        /// <param name="srvId"></param>
        private void UpdateShippingReceivingFormQuantity(int srvId)
        {
            var lines = _db.TM_SRL_Shipping_Receiving_Line.Where(m => m.srv_id == srvId).ToList();
            var total_quantity = lines.Sum(m => m.srl_quantity);
            var quantity_real = lines.Sum(m => m.srl_quantity_real);
            var srv = _db.TM_SRV_Shipping_Receiving.FirstOrDefault(m => m.srv_id == srvId);
            if (srv != null)
            {
                srv.srv_total_quantity = total_quantity;
                srv.srv_total_real = quantity_real ?? 0;
                _db.TM_SRV_Shipping_Receiving.ApplyCurrentValues(srv);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 通过SRV更新商品库存, 同时更新SOL状态，如果lgl数量和sol数量相同，则设置sol为finished
        /// </summary>
        public List<T> UpdateInventoryBySrvId<T>(int srvId, List<T> lines)
        {
            List<LogisticsLine> lglLines = (lines is List<LogisticsLine>) ? lines.Cast<LogisticsLine>().ToList() : null;
            List<DeliveryFormLine> dflLines = (lines is List<DeliveryFormLine>) ? lines.Cast<DeliveryFormLine>().ToList() : null;

            var srv = _db.TM_SRV_Shipping_Receiving.FirstOrDefault(m => m.srv_id == srvId);
            if (srv != null)
            {
                var srllines = _db.TM_SRL_Shipping_Receiving_Line.Where(m => m.srv_id == srvId).ToList();
                var srllglId = srllines.Where(l => l.lgl_id.HasValue).Select(l => l.lgl_id.Value).Distinct().ToList();
                var srldflId = srllines.Where(l => l.dfl_id.HasValue).Select(l => l.dfl_id.Value).Distinct().ToList();


                if (lglLines != null && lglLines.Any())
                {
                    var onelgl = lglLines.Where(l => srllglId.Contains(l.Id)).Distinct().ToList();

                    foreach (var logisticsLine in onelgl)
                    {
                        var quantity = logisticsLine.LglQuantity * (srv.srv_is_rev ? 1 : -1);
                        logisticsLine.InvId = UpdateInventoryDirectly(logisticsLine.PrdId ?? 0, logisticsLine.PitId ?? 0, logisticsLine.ProductName, quantity, logisticsLine.InvId);
                    }

                    var lglsols = (from lglline in lglLines
                                   join lgl in _db.TM_LGL_Logistic_Lines on lglline.Id equals lgl.lgl_id
                                   join sol in _db.TM_SOL_SupplierOrder_Lines on lgl.sol_id equals sol.sol_id
                                   select new { lgl, sol }).ToList();

                    foreach (var lglsol in lglsols)
                    {
                        if (lglsol.lgl.lgs_quantity == lglsol.sol.sol_quantity)
                        {
                            lglsol.sol.sol_finished = true;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(lglsol.sol);
                            _db.SaveChanges();
                        }
                    }
                }
                if (dflLines != null && dflLines.Any())
                {
                    var onedfl = dflLines.Where(l => srldflId.Contains(l.DflId)).Distinct().ToList();
                    foreach (var deliveryFormLine in onedfl)
                    {
                        var quantity = deliveryFormLine.DflQuantity * (srv.srv_is_rev ? 1 : -1);
                        int invId = UpdateInventoryDirectly(deliveryFormLine.PrdId ?? 0, deliveryFormLine.PitId ?? 0, deliveryFormLine.PrdName, quantity, deliveryFormLine.InvId);
                        if (deliveryFormLine.InvId == 0 && invId != 0)
                        {
                            deliveryFormLine.InvId = invId;
                        }
                    }
                }
            }
            return lines;
        }

        #region Inventory

        /// <summary>
        /// 直接修改商品库存
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="pitId"></param>
        /// <param name="prdName"></param>
        /// <param name="quantity"></param>
        public int UpdateInventoryDirectly(int prdId, int pitId, string prdName, decimal? quantity, int invId, string des = null)
        {
            //int invId = 0;
            // 1. find inventory, if none, create
            bool createInv = false;
            var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.inv_id == invId);
            if (inv != null)
            {
                inv.inv_quantity = inv.inv_quantity + quantity;
                inv.inv_d_update = DateTime.Now;
                _db.TM_INV_Inventory.ApplyCurrentValues(inv);
                _db.SaveChanges();
                invId = inv.inv_id;
                RecordInv(invId, quantity);
            }
            else
            {
                inv = _db.TM_INV_Inventory.FirstOrDefault(m => (pitId != 0 && m.pit_id == pitId) || (pitId == 0 && m.prd_name == prdName));
                if (inv != null)
                {
                    inv.inv_quantity = inv.inv_quantity + quantity;
                    inv.inv_d_update = DateTime.Now;
                    _db.TM_INV_Inventory.ApplyCurrentValues(inv);
                    _db.SaveChanges();
                    invId = inv.inv_id;
                    RecordInv(invId, quantity);
                }
                else
                {
                    createInv = true;
                }
            }
            if (createInv)
            {
                inv = new TM_INV_Inventory
                      {
                          prd_id = prdId == 0 ? (int?)null : prdId,
                          pit_id = pitId == 0 ? (int?)null : pitId,
                          prd_name = prdName,
                          inv_quantity = quantity < 0 ? 0 : quantity,
                          inv_d_update = DateTime.Now,
                          inv_description = des,
                      };
                _db.TM_INV_Inventory.AddObject(inv);
                _db.SaveChanges();
                invId = inv.inv_id;
                RecordInv(invId, quantity);
            }
            return invId;
        }

        public int UpdateInventoryDirectly(int invId, decimal? quantity)
        {
            var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.inv_id == invId);
            if (inv != null)
            {
                inv.inv_quantity = inv.inv_quantity + quantity;
                inv.inv_d_update = DateTime.Now;
                _db.TM_INV_Inventory.ApplyCurrentValues(inv);
                _db.SaveChanges();
                invId = inv.inv_id;
                RecordInv(invId, quantity);
            }
            return inv != null ? inv.inv_id : 0;
        }

        /// <summary>
        /// 直接修改商品库存
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="pitId"></param>
        /// <param name="prdName"></param>
        /// <param name="quantity"></param>
        public int UpdateInventoryDirectly_Old(int prdId, int pitId, string prdName, int quantity)
        {
            int invId = 0;
            // 1. find inventory, if none, create
            bool createInv = false;
            if (pitId != 0)
            {
                var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.pit_id == pitId);
                if (inv != null)
                {
                    inv.inv_quantity = inv.inv_quantity + quantity;
                    inv.inv_d_update = DateTime.Now;
                    _db.TM_INV_Inventory.ApplyCurrentValues(inv);
                    _db.SaveChanges();
                    invId = inv.inv_id;
                    RecordInv(invId, quantity);
                }
                else
                {
                    createInv = true;
                }
            }
            else
            {
                var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.prd_name == prdName);
                if (inv != null)
                {
                    inv.inv_quantity = inv.inv_quantity + quantity;
                    inv.inv_d_update = DateTime.Now;
                    _db.TM_INV_Inventory.ApplyCurrentValues(inv);
                    _db.SaveChanges();
                    invId = inv.inv_id;
                    RecordInv(invId, quantity);
                }
                else
                {
                    createInv = true;
                }
            }
            if (createInv)
            {
                var inv = new TM_INV_Inventory
                {
                    prd_id = prdId == 0 ? (int?)null : prdId,
                    pit_id = pitId == 0 ? (int?)null : pitId,
                    prd_name = prdName,
                    inv_quantity = quantity,
                    inv_d_update = DateTime.Now
                };
                _db.TM_INV_Inventory.AddObject(inv);
                _db.SaveChanges();
                invId = inv.inv_id;
                RecordInv(invId, quantity);
            }
            return invId;
        }


        #endregion Inventory

        /// <summary>
        /// 创建，更新商品所在货架
        /// </summary>
        public void CreateUpdateProductShelves(int invId, int whsId, int sheId, decimal? quantity)
        {
            if (invId != 0)
            {
                // 任意货架
                bool anyShelve = false;
                // whsId 仓库编号是必须的
                if (sheId == 0)
                {
                    // 没有规定货架的时候，寻找该商品已存在的货架或者空的仓库架
                    var psh = _db.TR_PSH_Product_Shelves.FirstOrDefault(m => m.inv_id == invId);
                    if (psh != null)
                    {
                        // 更新已有的货架
                        var new_quantity = psh.psh_quantity + quantity;
                        new_quantity = new_quantity < 0 ? 0 : new_quantity;
                        psh.psh_quantity = new_quantity;
                        _db.TR_PSH_Product_Shelves.ApplyCurrentValues(psh);
                        _db.SaveChanges();
                    }
                    else
                    {
                        // 寻找空货架
                        var shes = _db.TM_SHE_Shelves.FirstOrDefault(m => m.whs_id == whsId && !m.TR_PSH_Product_Shelves.Any());
                        if (shes != null)
                        {
                            // 有空货架
                            psh = new TR_PSH_Product_Shelves
                            {
                                inv_id = invId,
                                whs_id = shes.whs_id,
                                she_id = shes.she_id,
                                psh_quantity = quantity
                            };
                            _db.TR_PSH_Product_Shelves.AddObject(psh);
                            _db.SaveChanges();
                        }
                        else
                        {
                            // 无空货架，寻找相同供货商的货架，如果都没有，任意可用货架
                            //var supPrds = 
                            var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.inv_id == invId);
                            if (inv != null && inv.prd_id.HasValue)
                            {
                                // 找相同供货商
                                var supprd = _db.TR_SPR_Supplier_Product.Where(m => m.prd_id == inv.prd_id.Value).Select(m => m.prd_id);
                                var invs = _db.TM_INV_Inventory.Where(l => l.prd_id.HasValue && supprd.Contains(l.prd_id.Value));
                                var pshs = _db.TR_PSH_Product_Shelves.FirstOrDefault(m => invs.Select(l => l.inv_id).Contains(m.inv_id));
                                if (pshs != null)
                                {
                                    // 相同供货商有货架
                                    psh = new TR_PSH_Product_Shelves
                                    {
                                        inv_id = invId,
                                        whs_id = pshs.whs_id,
                                        she_id = pshs.she_id,
                                        psh_quantity = quantity
                                    };
                                    _db.TR_PSH_Product_Shelves.AddObject(psh);
                                    _db.SaveChanges();
                                }
                                else
                                {
                                    // 相同供货商无货架
                                    anyShelve = true;
                                }
                            }
                            else
                            {
                                // 任意货架
                                anyShelve = true;
                            }
                        }
                    }

                }
                else
                {
                    // 寻找该物品货架
                    var shes = _db.TM_SHE_Shelves.FirstOrDefault(m => m.whs_id == whsId && m.she_id == sheId);
                    if (shes != null)
                    {
                        // 该货架是否有该商品，如果有，更新数量
                        var psh = _db.TR_PSH_Product_Shelves.FirstOrDefault(m => m.inv_id == invId && m.she_id == sheId);
                        if (psh != null)
                        {
                            // 有货架 有商品
                            psh.psh_quantity = psh.psh_quantity + quantity;
                            _db.TR_PSH_Product_Shelves.ApplyCurrentValues(psh);
                            _db.SaveChanges();
                        }
                        else
                        {
                            // 有货架 无商品
                            psh = new TR_PSH_Product_Shelves
                                                       {
                                                           inv_id = invId,
                                                           whs_id = shes.whs_id,
                                                           she_id = shes.she_id,
                                                           psh_quantity = quantity
                                                       };
                            _db.TR_PSH_Product_Shelves.AddObject(psh);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // 无货架，寻找相同供货商的货架，如果都没有，任意可用货架
                        //var supPrds = 
                        var inv = _db.TM_INV_Inventory.FirstOrDefault(m => m.inv_id == invId);
                        if (inv != null && inv.prd_id.HasValue)
                        {
                            // 找相同供货商
                            var supprd = _db.TR_SPR_Supplier_Product.Where(m => m.prd_id == inv.prd_id.Value).Select(m => m.prd_id);
                            var invs = _db.TM_INV_Inventory.Where(l => l.prd_id.HasValue && supprd.Contains(l.prd_id.Value));
                            var pshs = _db.TR_PSH_Product_Shelves.FirstOrDefault(m => invs.Select(l => l.inv_id).Contains(m.inv_id));
                            if (pshs != null)
                            {
                                // 相同供货商有货架
                                var psh = new TR_PSH_Product_Shelves
                                  {
                                      inv_id = invId,
                                      whs_id = pshs.whs_id,
                                      she_id = pshs.she_id,
                                      psh_quantity = quantity
                                  };
                                _db.TR_PSH_Product_Shelves.AddObject(psh);
                                _db.SaveChanges();
                            }
                            else
                            {
                                // 相同供货商无货架
                                anyShelve = true;
                            }
                        }
                        else
                        {
                            // 任意货架
                            anyShelve = true;
                        }
                    }
                }
                if (anyShelve)
                {
                    var shv = _db.TM_SHE_Shelves.FirstOrDefault(m => m.whs_id == whsId);
                    if (shv != null)
                    {
                        var psh = new TR_PSH_Product_Shelves
                          {
                              inv_id = invId,
                              whs_id = shv.whs_id,
                              she_id = shv.she_id,
                              psh_quantity = quantity
                          };
                        _db.TR_PSH_Product_Shelves.AddObject(psh);
                        _db.SaveChanges();
                    }
                }
            }
        }

        public List<WareHouse> GetWareHousesList()
        {
            var list = new List<WareHouse>();
            try
            {
                list = _db.TM_WHS_WareHouse.Select(m => new WareHouse
                                                        {
                                                            WhsId = m.whs_id,
                                                            WhsAddress1 = m.whs_address1,
                                                            WhsAddress2 = m.whs_address2,
                                                            WhsCity = m.whs_city,
                                                            WhsCode = m.whs_code,
                                                            WhsCountry = m.whs_country,
                                                            WhsName = m.whs_name,
                                                            WhsPostCode = m.whs_postcode,
                                                            WhsVolume = m.whs_volume ?? 0,
                                                            SheCount = m.TM_SHE_Shelves.Any() ? m.TM_SHE_Shelves.Count : 0,
                                                            PrdCount = m.TM_SHE_Shelves.Any() ? (
                                                                    m.TM_SHE_Shelves.Any(l => l.TR_PSH_Product_Shelves.Any())
                                                                        ? m.TM_SHE_Shelves.Sum(l => l.TR_PSH_Product_Shelves.Sum(o => o.psh_quantity))
                                                                        : 0)
                                                                : 0,
                                                        }).ToList();

            }
            catch (Exception)
            {
            }
            return list;
        }

        public int CreateUpdateWarehouse(WareHouse whs)
        {
            bool create = false;
            int whsId = 0;
            if (whs.WhsId != 0)
            {
                var onewhs = _db.TM_WHS_WareHouse.FirstOrDefault(l => l.whs_id == whs.WhsId);
                if (onewhs != null)
                {
                    onewhs.whs_name = whs.WhsName;
                    onewhs.whs_address1 = whs.WhsAddress1;
                    onewhs.whs_address2 = whs.WhsAddress2;
                    onewhs.whs_postcode = whs.WhsPostCode;
                    onewhs.whs_city = whs.WhsCity;
                    onewhs.whs_country = whs.WhsCountry;
                    onewhs.whs_volume = whs.WhsVolume;
                    _db.TM_WHS_WareHouse.ApplyCurrentValues(onewhs);
                    _db.SaveChanges();
                    whsId = onewhs.whs_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                create = true;
            }
            if (create)
            {
                var onewhs = new TM_WHS_WareHouse();
                onewhs.whs_name = whs.WhsName;
                onewhs.whs_address1 = whs.WhsAddress1;
                onewhs.whs_address2 = whs.WhsAddress2;
                onewhs.whs_postcode = whs.WhsPostCode;
                onewhs.whs_city = whs.WhsCity;
                onewhs.whs_country = whs.WhsCountry;
                onewhs.whs_volume = whs.WhsVolume;
                onewhs.whs_code = whs.WhsCode;
                _db.TM_WHS_WareHouse.AddObject(onewhs);
                _db.SaveChanges();
                whsId = onewhs.whs_id;
            }
            return whsId;
        }

        public void DeleteWareHouse(int whsId)
        {
            var whs = _db.TM_WHS_WareHouse.FirstOrDefault(m => m.whs_id == whsId);
            if (whs != null)
            {
                bool inuse = _db.TR_PSH_Product_Shelves.Any(l => l.TM_SHE_Shelves.whs_id == whs.whs_id);
                if (!inuse)
                {
                    var shes = _db.TM_SHE_Shelves.Where(m => m.whs_id == whsId).ToList();
                    foreach (var oneshe in shes)
                    {
                        _db.TM_SHE_Shelves.DeleteObject(oneshe);
                        _db.SaveChanges();
                    }
                }
                _db.TM_WHS_WareHouse.DeleteObject(whs);
                _db.SaveChanges();
            }
        }

        public void UpdateSolQuantityAfterSrvCreation(List<LogisticsLine> lines)
        {
            var lineswithsol = (from line in lines
                                join lgl in _db.TM_LGL_Logistic_Lines on line.Id equals lgl.lgl_id
                                join sol in _db.TM_SOL_SupplierOrder_Lines on lgl.sol_id equals sol.sol_id
                                select new { line, sol }).Distinct().ToList();
            foreach (var lglsol in lineswithsol)
            {
                lglsol.sol.sol_qty_storage = lglsol.line.LglQuantity + (lglsol.sol.sol_qty_storage ?? 0);
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(lglsol.sol);
            }
            _db.SaveChanges();
        }

        #region Pre Inventory

        /// <summary>
        /// after container been sent, if isCreate = false : delete pre inventory
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="lgsId"></param>
        /// <param name="isCreate"></param>
        public void CreatePreInventoryFromLgs(int socId, int lgsId, bool isCreate = true)
        {
            var now = DateTime.Now;
            var lgls = _db.TM_LGL_Logistic_Lines.Where(m => m.lgs_id == lgsId && m.TM_LGS_Logistic.soc_id == socId).ToList();
            if (isCreate)
            {
                var psrs = lgls.Select(m => new TI_PSR_PRE_Shipping_Receiving_Line
                {
                    col_id = null,
                    lgl_id = m.lgl_id,
                    psr_time = now,
                    psr_quantity = m.lgs_quantity,
                    psr_is_done = false,
                    psr_time_done = null
                }).ToList();
                foreach (var onepsr in psrs)
                {
                    _db.TI_PSR_PRE_Shipping_Receiving_Line.AddObject(onepsr);
                    _db.SaveChanges();
                }
            }
            else
            {
                var psrs = (from lgl in lgls join psr in _db.TI_PSR_PRE_Shipping_Receiving_Line on lgl.lgs_id equals psr.lgl_id select psr).ToList();
                foreach (var onepsr in psrs)
                {
                    onepsr.psr_is_done = true;
                    onepsr.psr_time_done = now;
                    _db.TI_PSR_PRE_Shipping_Receiving_Line.ApplyCurrentValues(onepsr);
                    _db.SaveChanges();
                }
            }

            // modify pre inventory
            var lglPits = lgls.Where(m => m.pit_id.HasValue).ToList();
            var invWithPits = (from onelgl in lglPits
                               join inv in _db.TM_INV_Inventory on onelgl.pit_id equals inv.pit_id
                               where onelgl.pit_id.HasValue && inv.pit_id.HasValue
                               select inv).ToList();
            var lglWithName = lgls.Where(m => !m.pit_id.HasValue).ToList();
            var invWithName = (from onelgl in lglWithName
                               join inv in _db.TM_INV_Inventory on onelgl.lgs_prd_name equals inv.prd_name
                               where !onelgl.pit_id.HasValue && !inv.pit_id.HasValue
                               select inv).ToList();
            int coef = isCreate ? 1 : -1;

            foreach (var onelgl in lglPits)
            {
                var oneInv = invWithPits.FirstOrDefault(m => m.pit_id == onelgl.pit_id);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + (onelgl.lgs_quantity * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.lgs_quantity * coef));
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = isCreate ? onelgl.lgs_quantity : 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, isCreate ? onelgl.lgs_quantity : 0);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = onelgl.prd_id,
                        pit_id = onelgl.pit_id,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = isCreate ? onelgl.lgs_quantity : 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, isCreate ? onelgl.lgs_quantity : 0);
                }
            }


            foreach (var onelgl in lglWithName)
            {
                var oneInv = invWithName.FirstOrDefault(m => m.prd_name == onelgl.lgs_prd_name);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + (onelgl.lgs_quantity * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.lgs_quantity * coef));
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = isCreate ? onelgl.lgs_quantity : 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, isCreate ? onelgl.lgs_quantity : 0);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = null,
                        pit_id = null,
                        prd_name = onelgl.lgs_prd_name,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = isCreate ? onelgl.lgs_quantity : 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, isCreate ? onelgl.lgs_quantity : 0);
                }
            }
        }

        public void CreatePreInventoryFromCod(int socId, int codId, bool isCreate = true)
        {
            var now = DateTime.Now;
            var cols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).ToList();
            if (isCreate)
            {
                var psrs = cols.Select(m => new TI_PSR_PRE_Shipping_Receiving_Line
                {
                    col_id = m.col_id,
                    lgl_id = null,
                    psr_time = now,
                    psr_quantity = m.col_quantity ?? 0,
                    psr_is_done = false,
                    psr_time_done = null
                }).ToList();
                foreach (var onepsr in psrs)
                {
                    _db.TI_PSR_PRE_Shipping_Receiving_Line.AddObject(onepsr);
                    _db.SaveChanges();
                }
            }
            else
            {
                var psrs = (from col in cols join psr in _db.TI_PSR_PRE_Shipping_Receiving_Line on col.col_id equals psr.col_id select psr).ToList();
                foreach (var onepsr in psrs)
                {
                    onepsr.psr_is_done = true;
                    onepsr.psr_time_done = now;
                    _db.TI_PSR_PRE_Shipping_Receiving_Line.ApplyCurrentValues(onepsr);
                    _db.SaveChanges();
                }
            }

            // modify pre inventory
            var colPits = cols.Where(m => m.pit_id.HasValue).ToList();
            var invWithPits = (from onecol in colPits
                               join inv in _db.TM_INV_Inventory on onecol.pit_id equals inv.pit_id
                               where onecol.pit_id.HasValue && inv.pit_id.HasValue
                               select inv).ToList();
            var colWithName = cols.Where(m => !m.pit_id.HasValue).ToList();
            var invWithName = (from onecol in colWithName
                               join inv in _db.TM_INV_Inventory on onecol.col_prd_name equals inv.prd_name
                               where !onecol.pit_id.HasValue && !inv.pit_id.HasValue
                               select inv).ToList();
            int coef = isCreate ? -1 : 1;

            foreach (var onelgl in colPits)
            {
                var oneInv = invWithPits.FirstOrDefault(m => m.pit_id == onelgl.pit_id);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.col_quantity ?? 0) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = ((onelgl.col_quantity ?? 0) * coef),
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = onelgl.prd_id,
                        pit_id = onelgl.pit_id,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = ((onelgl.col_quantity ?? 0) * coef),
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                }
            }


            foreach (var onelgl in colWithName)
            {
                var oneInv = invWithName.FirstOrDefault(m => m.prd_name == onelgl.col_prd_name);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.col_quantity ?? 0) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = ((onelgl.col_quantity ?? 0) * coef),
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = null,
                        pit_id = null,
                        prd_name = onelgl.col_prd_name,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = ((onelgl.col_quantity ?? 0) * coef),
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, (onelgl.col_quantity ?? 0) * coef);
                }
            }
        }

        /// <summary>
        /// when delivery form is deliveried, delete pre inventory
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="dfoId"></param>
        public void DeletePreInventoryFromDfo(int socId, int dfoId)
        {
            var now = DateTime.Now;
            var cols = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId).ToList();

            var psrs = (from col in cols join psr in _db.TI_PSR_PRE_Shipping_Receiving_Line on col.col_id equals psr.col_id select psr).ToList();
            foreach (var onepsr in psrs)
            {
                onepsr.psr_is_done = true;
                onepsr.psr_time_done = now;
                _db.TI_PSR_PRE_Shipping_Receiving_Line.ApplyCurrentValues(onepsr);
                _db.SaveChanges();
            }


            // modify pre inventory
            var colPits = cols.Where(m => m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
            var invWithPits = (from onecol in colPits
                               join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.pit_id equals inv.pit_id
                               where onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && inv.pit_id.HasValue
                               select inv).ToList();
            var colWithName = cols.Where(m => !m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
            var invWithName = (from onecol in colWithName
                               join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.col_prd_name equals inv.prd_name
                               where !onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && !inv.pit_id.HasValue
                               select inv).ToList();
            int coef = 1;

            foreach (var onelgl in colPits)
            {
                var oneInv = invWithPits.FirstOrDefault(m => m.pit_id == onelgl.TM_COL_ClientOrder_Lines.pit_id);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.dfl_quantity) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.dfl_quantity) * coef);
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, 0);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = onelgl.TM_COL_ClientOrder_Lines.prd_id,
                        pit_id = onelgl.TM_COL_ClientOrder_Lines.pit_id,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, 0);
                }
            }


            foreach (var onelgl in colWithName)
            {
                var oneInv = invWithName.FirstOrDefault(m => m.prd_name == onelgl.TM_COL_ClientOrder_Lines.col_prd_name);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.dfl_quantity) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, ((onelgl.dfl_quantity) * coef));
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, 0);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = null,
                        pit_id = null,
                        prd_name = onelgl.TM_COL_ClientOrder_Lines.col_prd_name,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, 0);
                }
            }
        }

        /// <summary>
        /// when delivery form is deliveried, delete pre inventory
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="dfoId"></param>
        /// <param name="lines">delivery form lines</param>
        public void DeletePreInventoryFromDfoWithLines(int socId, int dfoId, List<TM_DFL_DevlieryForm_Line> lines)
        {
            var now = DateTime.Now;
            //var cols = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId).ToList();

            var dfls0 = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId).ToList();
            var dfls = (from dfl in dfls0
                        join line in lines on dfl.dfl_id equals line.dfl_id
                        select dfl).ToList();


            var psrs = (from col in dfls join psr in _db.TI_PSR_PRE_Shipping_Receiving_Line on col.col_id equals psr.col_id select psr).ToList();

            foreach (var onepsr in psrs)
            {
                // calculate deliveried quantity
                var deliveriedQty = dfls.Where(m => m.col_id == onepsr.col_id).Sum(l => l.dfl_quantity);
                onepsr.psr_quantity = onepsr.psr_quantity - deliveriedQty;
                if (onepsr.psr_quantity <= 0)
                {
                    onepsr.psr_is_done = true;
                }
                onepsr.psr_time_done = now;
                _db.TI_PSR_PRE_Shipping_Receiving_Line.ApplyCurrentValues(onepsr);
                _db.SaveChanges();
            }

            // modify pre inventory
            var colPits = dfls.Where(m => m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
            var invWithPits = (from onecol in colPits
                               join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.pit_id equals inv.pit_id
                               where onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && inv.pit_id.HasValue
                               select inv).ToList();
            var colWithName = dfls.Where(m => !m.TM_COL_ClientOrder_Lines.pit_id.HasValue).ToList();
            var invWithName = (from onecol in colWithName
                               join inv in _db.TM_INV_Inventory on onecol.TM_COL_ClientOrder_Lines.col_prd_name equals inv.prd_name
                               where !onecol.TM_COL_ClientOrder_Lines.pit_id.HasValue && !inv.pit_id.HasValue
                               select inv).ToList();
            int coef = 1;

            foreach (var onelgl in colPits)
            {
                var oneInv = invWithPits.FirstOrDefault(m => m.pit_id == onelgl.TM_COL_ClientOrder_Lines.pit_id);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.dfl_quantity) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, (onelgl.dfl_quantity) * coef);
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, 0);
                    }


                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = onelgl.TM_COL_ClientOrder_Lines.prd_id,
                        pit_id = onelgl.TM_COL_ClientOrder_Lines.pit_id,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, 0);
                }
            }


            foreach (var onelgl in colWithName)
            {
                var oneInv = invWithName.FirstOrDefault(m => m.prd_name == onelgl.TM_COL_ClientOrder_Lines.col_prd_name);
                if (oneInv != null)
                {
                    var piv = _db.TI_PIV_PRE_INV_Inventory.FirstOrDefault(m => m.inv_id == oneInv.inv_id);
                    if (piv != null)
                    {
                        piv.piv_quantity = piv.piv_quantity + ((onelgl.dfl_quantity) * coef);
                        piv.piv_d_update = now;
                        _db.TI_PIV_PRE_INV_Inventory.ApplyCurrentValues(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, ((onelgl.dfl_quantity) * coef));
                    }
                    else
                    {
                        // no piv create
                        piv = new TI_PIV_PRE_INV_Inventory
                        {
                            inv_id = oneInv.inv_id,
                            piv_quantity = 0,
                            piv_d_update = now
                        };
                        _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                        _db.SaveChanges();
                        RecordPiv(piv.piv_id, 0);
                    }
                }
                else
                {
                    // if inventory is null, create inventory   
                    oneInv = new TM_INV_Inventory
                    {
                        prd_id = null,
                        pit_id = null,
                        prd_name = onelgl.TM_COL_ClientOrder_Lines.col_prd_name,
                        inv_quantity = 0,
                        inv_d_update = now
                    };
                    _db.TM_INV_Inventory.AddObject(oneInv);
                    _db.SaveChanges();
                    RecordInv(oneInv.inv_id, 0);
                    // no piv create
                    var piv = new TI_PIV_PRE_INV_Inventory
                    {
                        inv_id = oneInv.inv_id,
                        piv_quantity = 0,
                        piv_d_update = now
                    };
                    _db.TI_PIV_PRE_INV_Inventory.AddObject(piv);
                    _db.SaveChanges();
                    RecordPiv(piv.piv_id, 0);
                }
            }
        }



        #endregion Pre Inventory

        #region Record

        private void RecordPiv(int pivId, decimal? quantity)
        {
            var record = new TI_PIVR_PIN_Record
            {
                piv_id = pivId,
                pivr_quantity = quantity,
                pivr_d_record = DateTime.Now
            };
            _db.TI_PIVR_PIN_Record.AddObject(record);
            _db.SaveChanges();
        }


        private void RecordInv(int invId, decimal? quantity)
        {
            var record = new TI_INVR_INV_Record
            {
                inv_id = invId,
                invr_quantity = quantity,
                invr_d_record = DateTime.Now
            };
            _db.TI_INVR_INV_Record.AddObject(record);
            _db.SaveChanges();
        }


        #endregion Record

        #region Shelves

        public List<Shelves> GetShelvesInWhsList(int whsId)
        {
            var shes = _db.TM_SHE_Shelves.Where(m => m.whs_id == whsId).Select(m => new Shelves
            {
                SheId = m.she_id,
                WhsId = m.whs_id,
                SheAvailabelVolume = m.she_availabel_volume,
                SheCode = m.she_code,
                SheFloor = m.she_floor ?? 0,
                SheHeight = m.she_height,
                SheLenght = m.she_length,
                SheLine = m.she_line ?? 0,
                SheRow = m.she_row ?? 0,
                SheWidth = m.she_width,
                SumPrd = m.TR_PSH_Product_Shelves.Any() ? m.TR_PSH_Product_Shelves.Sum(l => l.psh_quantity) : 0
            }).ToList();
            return shes;
        }

        public List<Shelves> GetAllShelvesList()
        {
            var shes = _db.TM_SHE_Shelves.Select(m => new Shelves
            {
                SheId = m.she_id,
                WhsId = m.whs_id,
                SheAvailabelVolume = m.she_availabel_volume,
                SheCode = m.she_code,
                SheFloor = m.she_floor ?? 0,
                SheHeight = m.she_height,
                SheLenght = m.she_length,
                SheLine = m.she_line ?? 0,
                SheRow = m.she_row ?? 0,
                SheWidth = m.she_width,
                SumPrd = m.TR_PSH_Product_Shelves.Any() ? m.TR_PSH_Product_Shelves.Sum(l => l.psh_quantity) : 0
            }).ToList();
            return shes;
        }

        public List<ProductInShelves> GetProductInShelves(int sheId)
        {
            var pshs = _db.TR_PSH_Product_Shelves.Where(m => m.she_id == sheId).Select(m => new ProductInShelves
                {
                    PitId = m.TM_INV_Inventory.pit_id ?? 0,
                    PrdId = m.TM_INV_Inventory.prd_id ?? 0,
                    PrdRef = m.TM_INV_Inventory.pit_id.HasValue ? m.TM_INV_Inventory.TM_PIT_Product_Instance.pit_ref : m.TM_INV_Inventory.prd_ref,
                    PrdName = m.TM_INV_Inventory.prd_id.HasValue ? m.TM_INV_Inventory.TM_PRD_Product.prd_name : m.TM_INV_Inventory.prd_name,
                    Quantity = m.psh_quantity,
                    QuantityTotal = m.TM_INV_Inventory.inv_quantity,
                    InvId = m.TM_INV_Inventory.inv_id
                }).ToList();
            pshs.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
            });
            return pshs;
        }

        /// <summary>
        /// get product's shelves
        /// </summary>
        /// <param name="invId"></param>
        /// <returns></returns>
        public List<ProductWithShelves> GetProductShelves(int invId)
        {
            var allPsh = (from inv in _db.TM_INV_Inventory
                          join psh in _db.TR_PSH_Product_Shelves on inv.inv_id equals psh.inv_id
                          where inv.inv_id == invId
                          select psh).Select(m => new ProductWithShelves
                          {
                              WareHouseName = m.TM_WHS_WareHouse.whs_name,
                              SheCode = m.TM_SHE_Shelves.she_code,
                              QuantityTotal = m.psh_quantity,
                              PrdName = m.TM_INV_Inventory.prd_name,
                              PrdId = m.TM_INV_Inventory.pit_id.HasValue ? m.TM_INV_Inventory.TM_PIT_Product_Instance.prd_id : 0,
                              PitId = m.TM_INV_Inventory.pit_id ?? 0,
                              SheId = m.she_id,
                              WhsId = m.whs_id,
                              SheAvailabelVolume = m.TM_SHE_Shelves.she_availabel_volume,
                              SheFloor = m.TM_SHE_Shelves.she_floor ?? 0,
                              SheHeight = m.TM_SHE_Shelves.she_height,
                              SheLenght = m.TM_SHE_Shelves.she_length,
                              SheLine = m.TM_SHE_Shelves.she_line ?? 0,
                              SheRow = m.TM_SHE_Shelves.she_row ?? 0,
                              SheWidth = m.TM_SHE_Shelves.she_width,
                              PshId = m.psh_id,
                              InvId = invId
                          }).ToList();
            return allPsh;
        }

        public int CreateUpdateShelve(Shelves she)
        {
            bool create = false;
            int sheId = 0;
            if (she.WhsId != 0)
            {
                if (she.SheId != 0)
                {
                    var oneshe = _db.TM_SHE_Shelves.FirstOrDefault(m => m.she_id == she.SheId && m.whs_id == she.WhsId);
                    if (oneshe != null)
                    {
                        oneshe.she_code = string.IsNullOrEmpty(she.SheCode) ? "" : she.SheCode;
                        oneshe.she_floor = she.SheFloor * 1;
                        oneshe.she_line = she.SheLine * 1;
                        oneshe.she_row = she.SheRow * 1;
                        oneshe.she_height = she.SheHeight * 1;
                        oneshe.she_length = she.SheLenght * 1;
                        oneshe.she_width = she.SheWidth * 1;
                        oneshe.she_availabel_volume = she.SheAvailabelVolume * 1;
                        _db.TM_SHE_Shelves.ApplyCurrentValues(oneshe);
                        _db.SaveChanges();
                        sheId = oneshe.she_id;
                    }
                    else
                    {
                        create = true;
                    }
                }
                else
                {
                    create = true;
                }
                if (create && she.WhsId != 0)
                {
                    var oneshe = new TM_SHE_Shelves();
                    oneshe.she_code = string.IsNullOrEmpty(she.SheCode) ? "" : she.SheCode;
                    oneshe.she_floor = she.SheFloor * 1;
                    oneshe.she_line = she.SheLine * 1;
                    oneshe.she_row = she.SheRow * 1;
                    oneshe.she_height = she.SheHeight * 1;
                    oneshe.she_length = she.SheLenght * 1;
                    oneshe.she_width = she.SheWidth * 1;
                    oneshe.whs_id = she.WhsId;
                    oneshe.she_availabel_volume = she.SheAvailabelVolume * 1;
                    _db.TM_SHE_Shelves.AddObject(oneshe);
                    _db.SaveChanges();
                    sheId = oneshe.she_id;
                }
            }
            return sheId;
        }


        #endregion Shelves

        #region for Delivery

        public List<ProductWithShelves> GetProductWithShelves(int socId, int dfoId)
        {
            var result = new List<ProductWithShelves>();
            var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId && m.TM_DFO_Delivery_Form.soc_id == socId).ToList();
            foreach (var onedfl in dfls)
            {
                //var onePrd = new ProductWithShelves();
                if (onedfl.TM_COL_ClientOrder_Lines.pit_id.HasValue)
                {
                    var allPsh = (from inv in _db.TM_INV_Inventory
                                  join psh in _db.TR_PSH_Product_Shelves on inv.inv_id equals psh.inv_id
                                  where inv.pit_id == onedfl.TM_COL_ClientOrder_Lines.pit_id
                                  select psh).Select(m => new ProductWithShelves
                        {
                            WareHouseName = m.TM_WHS_WareHouse.whs_name,
                            SheCode = m.TM_SHE_Shelves.she_code,
                            QuantityTotal = m.psh_quantity,
                            PrdName = m.TM_INV_Inventory.pit_id.HasValue ? m.TM_INV_Inventory.TM_PIT_Product_Instance.TM_PRD_Product.prd_name : string.Empty,
                            PrdId = m.TM_INV_Inventory.pit_id.HasValue ? m.TM_INV_Inventory.TM_PIT_Product_Instance.prd_id : 0,
                            PitId = m.TM_INV_Inventory.pit_id ?? 0,
                            WhsId = m.whs_id,
                            SheId = m.she_id,
                            DflId = onedfl.dfl_id,
                            InvId = m.inv_id,
                            PshId = m.psh_id
                        }).ToList();
                    result.AddRange(allPsh);
                }
                else
                {
                    var allPsh = (from inv in _db.TM_INV_Inventory
                                  join psh in _db.TR_PSH_Product_Shelves on inv.inv_id equals psh.inv_id
                                  where inv.prd_name == onedfl.TM_COL_ClientOrder_Lines.col_prd_name
                                  select psh).Select(m => new ProductWithShelves
                                  {
                                      WareHouseName = m.TM_WHS_WareHouse.whs_name,
                                      SheCode = m.TM_SHE_Shelves.she_code,
                                      QuantityTotal = m.psh_quantity,
                                      PrdName = m.TM_INV_Inventory.prd_name,
                                      PrdId = m.TM_INV_Inventory.pit_id.HasValue ? m.TM_INV_Inventory.TM_PIT_Product_Instance.prd_id : 0,
                                      PitId = m.TM_INV_Inventory.pit_id ?? 0,
                                      WhsId = m.whs_id,
                                      SheId = m.she_id,
                                      DflId = onedfl.dfl_id,
                                      InvId = m.inv_id,
                                      PshId = m.psh_id
                                  }).ToList();
                    result.AddRange(allPsh);
                }
            }
            return result;
        }

        #endregion for Delivery

        #region Search Voucher

        public List<ShippingReceiving> SearchVoucher(string client, string produit, int whsId, int sheId, DateTime? from, DateTime? to)
        {
            var result = new List<ShippingReceiving>();
            if (!string.IsNullOrEmpty(produit))
            {
                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where
                                     (string.IsNullOrEmpty(produit) || prd.prd_name.StartsWith(produit)
                                     || prd.prd_ref.StartsWith(produit)
                                     || prd.prd_code.Contains(produit))
                               select pit).Distinct().ToList();
                var pitIds = pitprds.Select(l => l.pit_id).Distinct().ToList();
                var lines = _db.TM_SRL_Shipping_Receiving_Line.Where(m =>
                    ((m.pit_id.HasValue && pitIds.Contains(m.pit_id.Value))
                    || m.srl_prd_name.StartsWith(produit)
                    || m.srl_prd_ref.StartsWith(produit)
                    || m.srl_prd_des.Contains(produit))
                    && (whsId == 0 || m.whs_id == whsId)
                    && (sheId == 0 || m.she_id == sheId)
                    ).ToList();
                var srvIds = lines.Select(m => m.srv_id).Distinct().ToList();
                var srvs = _db.TM_SRV_Shipping_Receiving.Where(m => srvIds.Contains(m.srv_id)
                                                                    && (!from.HasValue || m.srv_time >= from.Value)
                                                                    && (!to.HasValue || m.srv_time <= to.Value)
                                                                    && (string.IsNullOrEmpty(client) || m.srv_client.Contains(client))
                    ).Select(ShippingReceivingTranslator.RepositoryToEntity()).Distinct().ToList();
                result = srvs;
            }
            else
            {
                var lines = _db.TM_SRL_Shipping_Receiving_Line.Where(m =>
                    (m.srl_prd_name.StartsWith(produit)
                    || m.srl_prd_ref.StartsWith(produit)
                    || m.srl_prd_des.Contains(produit))
                    && (whsId == 0 || m.whs_id == whsId)
                    && (sheId == 0 || m.she_id == sheId)
                    ).ToList();
                var srvIds = lines.Select(m => m.srv_id).Distinct().ToList();
                var srvs = _db.TM_SRV_Shipping_Receiving.Where(m => srvIds.Contains(m.srv_id)
                                                                    && (!from.HasValue || m.srv_time >= from.Value)
                                                                    && (!to.HasValue || m.srv_time <= to.Value)
                                                                    && (string.IsNullOrEmpty(client) || m.srv_client.Contains(client))
                    ).Select(ShippingReceivingTranslator.RepositoryToEntity()).Distinct().ToList();
                result = srvs;
            }
            result.ForEach(m =>
            {
                var lines = _db.TM_SRL_Shipping_Receiving_Line.Where(l => l.srv_id == m.SrvId).Select(l => l.TM_WHS_WareHouse.whs_name).Distinct().ToList();
                m.WareHouse = lines.Aggregate(string.Empty, (current, line) => current + (line + "\r\n"));
                m.FId = StringCipher.EncoderSimple(m.SrvId.ToString(), "srvId");
            });
            return result;
        }

        #endregion Search Voucher

        #region Voucher

        public ShippingReceiving LoadShippingReceiving(int srvId)
        {
            var srv = _db.TM_SRV_Shipping_Receiving.FirstOrDefault(m => m.srv_id == srvId);
            if (srv != null)
            {
                var onesrv = ShippingReceivingTranslator.RepositoryToEntity().Compile().Invoke(srv);

                var lines = _db.TM_SRL_Shipping_Receiving_Line.Where(m => m.srv_id == srv.srv_id).ToList();
                var srlLines = lines.Select(m => new ShippingReceivingLine
                {
                    SrvId = m.srv_id,
                    LglId = m.lgl_id ?? 0,
                    DflId = m.dfl_id ?? 0,
                    SrlQuantity = m.srl_quantity,
                    SrlUnitPrice = m.srl_unit_price ?? 0,
                    PrdId = m.prd_id ?? 0,
                    PitId = m.pit_id ?? 0,
                    SrlPrdRef = m.srl_prd_ref,
                    SrlPrdName = m.srl_prd_name,
                    SrlDescription = m.srl_description,
                    SrlPrdDes = m.srl_prd_des,
                    SrlQuantityReal = m.srl_quantity_real ?? 0,
                    SrlTotalPrice = m.srl_total_price ?? 0,
                    SrlTotalPriceReal = m.srl_total_price_real ?? 0,
                    WhsId = m.whs_id,
                    SheId = m.she_id,
                    DfoId = m.dfl_id.HasValue ? m.TM_DFL_DevlieryForm_Line.dfo_id : 0,
                    LgsId = m.lgl_id.HasValue ? m.TM_LGL_Logistic_Lines.lgs_id : 0,
                    LgsCode = m.lgl_id.HasValue ? m.TM_LGL_Logistic_Lines.TM_LGS_Logistic.lgs_code : string.Empty,
                    WhsCode = m.TM_WHS_WareHouse.whs_code,
                    SheCode = m.TM_SHE_Shelves.she_code,

                    SrlId = m.srl_id,
                }).ToList();

                var srllglsol = (from srl in srlLines
                                 join lgl in _db.TM_LGL_Logistic_Lines on srl.LglId equals lgl.lgl_id
                                 join sol in _db.TM_SOL_SupplierOrder_Lines on lgl.sol_id equals sol.sol_id
                                 select new PurchaseLineBaseClass
                                 {
                                     SolId = sol.sol_id,
                                     SodId = sol.sod_id,
                                     SodCode = sol.TM_SOD_Supplier_Order.sod_code,
                                     Quantity = sol.sol_quantity,
                                     LglId = lgl.lgl_id,
                                     QuantityForLgl = lgl.lgs_quantity,
                                     SolQuantity = sol.sol_quantity,
                                     SrlId = srl.SrlId
                                 }).ToList();

                srlLines.ForEach(m =>
                {
                    m.DfoFId = m.DfoId != 0 ? StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId") : string.Empty;
                    m.LgsFId = m.LgsId != 0 ? StringCipher.EncoderSimple(m.LgsId.ToString(), "lgsId") : string.Empty;
                    var onesol = srllglsol.FirstOrDefault(l => l.SrlId == m.SrlId);
                    if (onesol != null)
                    {
                        m.SodCode = onesol.SodCode;
                        m.SodId = onesol.SodId;
                        m.SolId = onesol.SolId;
                        m.SodFId = StringCipher.EncoderSimple(onesol.SodId.ToString(), "sodId");
                        m.QuantityForLgl = onesol.QuantityForLgl;
                        m.SolQuantity = onesol.SolQuantity;
                    }
                });
                onesrv.SrlLines = srlLines;

                return onesrv;
            }
            else
            {
                return null;
            }
        }

        #endregion Voucher
    }
}


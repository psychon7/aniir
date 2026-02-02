using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Odbc;
using System.Diagnostics;
using System.Linq;
//using System.Linq.Dynamic;
using System.Runtime.InteropServices;
using System.Runtime.Remoting.Metadata.W3cXsd2001;
using System.Text;
using System.Text.RegularExpressions;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using Microsoft.Office.Interop.Excel;

//using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.SqlServer
{
    public class PurchaseBaseRepository : BaseSqlServerRepository
    {
        CommonRepository CommonRepository = new CommonRepository();
        private UserRepository UserRepository = new UserRepository();
        CalendarRepository CalendarRepository = new CalendarRepository();
        ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();

        #region Purchase Intent

        public int CreateUpdatePurchaseIntent(PurchaseBaseClass pin)
        {
            var itemId = 0;
            var aPin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.soc_id == pin.SocId && m.pin_id == pin.PinId);
            if (aPin != null)
            {
                aPin = PurchaseBaseTranslator.EntityToRepository(pin, aPin);
                itemId = aPin.pin_id;
                _db.TM_PIN_Purchase_Intent.ApplyCurrentValues(aPin);
                _db.SaveChanges();
            }
            else
            {
                var lastItem = _db.TM_PIN_Purchase_Intent.Where(m => m.soc_id == pin.SocId
                    && m.pin_d_creation.Year == pin.DateCreation.Year
                    && m.pin_d_creation.Month == pin.DateCreation.Month).OrderByDescending(m => m.pin_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastItem != null)
                {
                    lastCode = lastItem.pin_code;
                }

                string pref = GetCodePref(6);
                pin.PinCode = GetGeneralRefContinuation(pin.DateCreation, pref, lastCode, _codeType, 0);
                aPin = PurchaseBaseTranslator.EntityToRepository(pin, aPin, true);
                _db.TM_PIN_Purchase_Intent.AddObject(aPin);
                _db.SaveChanges();
                itemId = aPin.pin_id;
            }
            return itemId;
        }

        public PurchaseBaseClass LoadPurchaseIntent(int socId, int pinId, bool forPdf = false)
        {
            var pin = _db.TM_PIN_Purchase_Intent.Where(m => m.soc_id == socId && m.pin_id == pinId).Select(PurchaseBaseTranslator.RepositoryToEntity()).FirstOrDefault();
            if (pin != null)
            {
                pin.PinFId = StringCipher.EncoderSimple(pin.PinId.ToString(), "pinId");
                pin.SodFId = StringCipher.EncoderSimple(pin.SodId.ToString(), "sodId");
                if (forPdf)
                {
                    PurchaseBaseLineRepository PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    pin.PurchaseLines = PurchaseBaseLineRepository.LoadPils(socId, pinId);
                }
            }
            return pin;
        }

        public List<PurchaseBaseClass> SearchPurchaseIntent(PurchaseBaseClass pin)
        {
            var pins = _db.TM_PIN_Purchase_Intent.Where(m => m.soc_id == pin.SocId
                && (string.IsNullOrEmpty(pin.PinName.Trim()) || m.pin_name.Contains(pin.PinName.Trim()))
                && (string.IsNullOrEmpty(pin.PinCode.Trim()) || m.pin_code.Contains(pin.PinCode.Trim()))
                && (string.IsNullOrEmpty(pin.FeatureCode.Trim()) || m.TM_PIL_PurchaseIntent_Lines.Any(l => l.pil_feature_code.Contains(pin.FeatureCode.Trim())))
                ).Select(PurchaseBaseTranslator.RepositoryToEntity()).ToList();
            pins.ForEach(m =>
            {
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            return pins;
        }

        public List<PurchaseLineBaseClass> GetPurchaseIntentLines(PurchaseBaseClass pin)
        {
            var pils = _db.TM_PIL_PurchaseIntent_Lines.Where(m =>
                (string.IsNullOrEmpty(pin.FeatureCode.Trim()) || m.pil_feature_code.Contains(pin.FeatureCode.Trim()))
                &&
                (string.IsNullOrEmpty(pin.PinName.Trim()) ||
                 m.TM_PIN_Purchase_Intent.pin_name.Contains(pin.PinName.Trim()))
                &&
                (string.IsNullOrEmpty(pin.PinCode.Trim()) ||
                 m.TM_PIN_Purchase_Intent.pin_code.Contains(pin.PinCode.Trim()))
                ).Select(PurchaseBaseLineTranslator.RepositoryToEntity()).ToList();
            pils.ForEach(m =>
            {
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            return pils;
        }

        public int DuplicatePurchaseIntentLine(int socId, int pinId, int pilId)
        {
            var pil_id = 0;
            var onepil = _db.TM_PIL_PurchaseIntent_Lines.Where(m => m.pil_id == pilId
                && m.pin_id == pinId
                && m.TM_PIN_Purchase_Intent.soc_id == socId).Select(PurchaseBaseLineTranslator.RepositoryToEntity()).FirstOrDefault();
            if (onepil != null)
            {
                var newPil = ObjectCopier.DeepCopy(onepil);
                newPil.PilId = 0;
                newPil.Order = onepil.Order + 1;
                newPil.DateCreation = DateTime.Now;
                newPil.DUpdate = DateTime.Now;
                newPil.SupId = onepil.SupId;
                newPil.ClnId = 0;
                newPil.ColId = 0;
                newPil.CiiId = 0;
                var aCln = PurchaseBaseLineTranslator.EntityToRepository(newPil, create: true);
                _db.TM_PIL_PurchaseIntent_Lines.AddObject(aCln);
                _db.SaveChanges();
                pil_id = aCln.pil_id;
            }
            return pil_id;
        }

        public int PassPin2Sod(int socId, int pinId, int supId, int scoId, int usrId)
        {
            int sodId = 0;
            var pin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.soc_id == socId && m.pin_id == pinId);
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_id == supId && m.soc_id == socId);
            var sco = _db.TM_SCO_Supplier_Contact.FirstOrDefault(m => m.sco_id == scoId && m.sup_id == supId && m.TM_SUP_Supplier.soc_id == socId);
            if (pin != null && sup != null && sco != null)
            {
                PurchaseBaseLineRepository PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                var newSod = new PurchaseBaseClass
                {
                    SodName = "Commande Fournisseur pour " + pin.pin_code,
                    InterComment = pin.pin_inter_comment,
                    SupplierComment = pin.pin_supplier_comment,
                    ScoId = sco.sco_id,
                    SupId = sup.sup_id,
                    CurId = sup.cur_id,
                    VatId = sup.vat_id,
                    SocId = socId,
                    UsrId = usrId,
                    PinId = pin.pin_id,
                    DateCreation = DateTime.Now,
                    DateUpdate = DateTime.Now
                };
                sodId = CreateUpdateSupplierOrder(newSod);

                var pils = _db.TM_PIL_PurchaseIntent_Lines.Where(m => m.pin_id == pin.pin_id).ToList();
                foreach (var onepil in pils)
                {
                    var onepil1 = onepil;
                    var sprs = _db.TR_SPR_Supplier_Product.Where(m => m.prd_id == onepil1.prd_id);
                    var spr = sprs.Any(m => m.sup_id == supId) ? sprs.FirstOrDefault(m => m.sup_id == supId) : sprs.FirstOrDefault();

                    var sol = new PurchaseLineBaseClass
                    {
                        SodId = sodId,
                        Order = onepil1.pil_order,
                        Description = onepil1.pil_description,
                        PrdId = onepil1.prd_id,
                        PitId = onepil1.pit_id,
                        Quantity = onepil1.pil_quantity,
                        UnitPrice = spr != null ? (onepil1.pil_quantity < 100 ? spr.spr_price_1_100 :
                        ((onepil1.pil_quantity > 100 && onepil1.pil_quantity < 500) ? spr.spr_price_100_500 : spr.spr_price_500_plus)
                        ) : 0,
                        VatId = sup.vat_id,
                        PilId = onepil1.pil_id,
                        DiscountAmount = 0
                    };
                    sol.TotalPrice = sol.UnitPrice * sol.Quantity;
                    sol.TotalCrudePrice = sol.UnitPrice * sol.Quantity * (1 + sup.TR_VAT_Vat.vat_vat_rate / 100);
                    sol.UnitPriceWithDis = sol.UnitPrice;
                    PurchaseBaseLineRepository.InsertUpdateSol(sol);
                }

                pin.pin_closed = true;
                _db.TM_PIN_Purchase_Intent.ApplyCurrentValues(pin);
                _db.SaveChanges();
            }
            return sodId;
        }

        // todo: Redo this function
        public List<int> PassPin2Sod_New(int socId, int pinId, int usrId)
        {
            List<int> sodIds = new List<int>();
            int sodId = 0;
            var pin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.soc_id == socId && m.pin_id == pinId);
            if (pin != null)
            {
                var pils = _db.TM_PIL_PurchaseIntent_Lines.Where(m => m.pin_id == pin.pin_id).ToList();
                var allSupScoIds = Enumerable.Select(pils.Where(m => m.sup_id.HasValue), m => new KeyValue
                {
                    Key = m.sup_id.Value,
                    Key2 = m.TM_SUP_Supplier.TM_SCO_Supplier_Contact.Any() ? (m.TM_SUP_Supplier.TM_SCO_Supplier_Contact.Any() ? m.TM_SUP_Supplier.TM_SCO_Supplier_Contact.FirstOrDefault().sco_id : 0) : 0,
                    Key3 = m.TM_SUP_Supplier.cur_id,
                    Key4 = m.TM_SUP_Supplier.vat_id,
                    DcValue = m.TM_SUP_Supplier.TR_VAT_Vat.vat_vat_rate
                }).ToList();

                var supScoIds = new List<KeyValue>();
                foreach (var oneSupScoId in allSupScoIds)
                {
                    if (!supScoIds.Any(m => m.Key == oneSupScoId.Key))
                    {
                        supScoIds.Add(oneSupScoId);
                    }
                }




                foreach (var supSco in supScoIds)
                {
                    var supPils = pils.Where(m => m.sup_id == supSco.Key).ToList();

                    PurchaseBaseLineRepository PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    var newSod = new PurchaseBaseClass
                    {
                        SodName = "CF-" + pin.pin_name,
                        InterComment = pin.pin_inter_comment,
                        SupplierComment = pin.pin_supplier_comment,
                        SupId = supSco.Key,
                        SubSupId = supSco.Key,
                        ScoId = Convert.ToInt32(supSco.Key2),
                        CurId = Convert.ToInt32(supSco.Key3),
                        VatId = supSco.Key4,
                        SocId = socId,
                        UsrId = usrId,
                        PinId = pin.pin_id,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                    };
                    sodId = CreateUpdateSupplierOrder(newSod);

                    foreach (var onepil in supPils)
                    {
                        var onepil1 = onepil;
                        var sprs = _db.TR_SPR_Supplier_Product.Where(m => m.prd_id == onepil1.prd_id);
                        var spr = sprs.Any(m => m.sup_id == supSco.Key)
                            ? sprs.FirstOrDefault(m => m.sup_id == supSco.Key)
                            : sprs.FirstOrDefault();

                        var sol = new PurchaseLineBaseClass
                        {
                            SodId = sodId,
                            Order = onepil1.pil_order,
                            Description = onepil1.pil_description,
                            PrdId = onepil1.prd_id,
                            PitId = onepil1.pit_id,
                            Quantity = onepil1.pil_quantity,
                            UnitPrice = spr != null ? (onepil1.pil_quantity < 100 ? spr.spr_price_1_100 : ((onepil1.pil_quantity > 100 && onepil1.pil_quantity < 500) ? spr.spr_price_100_500 : spr.spr_price_500_plus)) : 0,
                            VatId = supSco.Key4,
                            PilId = onepil1.pil_id,
                            DiscountAmount = 0,
                            PrdDescription = onepil1.pil_prd_des,
                            TempColor = onepil1.pil_temp_color,
                            Driver = onepil1.pil_driver,
                            Power = onepil1.pil_power,
                            Efflum = onepil1.pil_eff_lum,
                            UGR = onepil.pil_ugr,
                            LogsNbr = onepil1.pil_logistic,
                            Length = onepil1.pil_length,
                            Width = onepil1.pil_width,
                            Height = onepil1.pil_height,
                            FeatureCode = onepil1.pil_feature_code,
                            CRI = onepil1.pil_cri,
                            UsrIdCom1 = onepil1.usr_id_com1,
                            UsrIdCom2 = onepil1.usr_id_com2,
                            UsrIdCom3 = onepil1.usr_id_com3,
                            Comment = onepil1.pil_comment,
                            Client = onepil1.pil_client,
                            Deadline = onepil1.pil_deadline,
                            PrdName = onepil1.pil_prd_name
                        };
                        sol.TotalPrice = sol.UnitPrice * sol.Quantity;
                        sol.TotalCrudePrice = sol.UnitPrice * sol.Quantity * (1 + supSco.DcValue / 100);
                        sol.UnitPriceWithDis = sol.UnitPrice;
                        PurchaseBaseLineRepository.InsertUpdateSol(sol);
                    }
                    sodIds.Add(sodId);
                }
                pin.pin_closed = true;
                _db.TM_PIN_Purchase_Intent.ApplyCurrentValues(pin);
                _db.SaveChanges();




                // 无supplier 默认成leader
                var onesup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_company_name.Contains("LEADER GENERATION"));
                if (onesup != null)
                {
                    var allPilswithoutSup = Enumerable.Select(pils.Where(l => !l.sup_id.HasValue), m => new KeyValue
                    {
                        Key = onesup.sup_id,
                        Key2 =
                            onesup.TM_SCO_Supplier_Contact.Any()
                                ? (onesup.TM_SCO_Supplier_Contact.Any()
                                    ? onesup.TM_SCO_Supplier_Contact.FirstOrDefault().sco_id
                                    : 0)
                                : 0,
                        Key3 = onesup.cur_id,
                        Key4 = onesup.vat_id,
                        DcValue = onesup.TR_VAT_Vat.vat_vat_rate
                    }).ToList();

                    var supScoIdswithoutSup = new List<KeyValue>();
                    foreach (var oneSupScoId in allPilswithoutSup)
                    {
                        if (!supScoIdswithoutSup.Any(m => m.Key == oneSupScoId.Key))
                        {
                            supScoIdswithoutSup.Add(oneSupScoId);
                        }
                    }



                    foreach (var supSco in supScoIdswithoutSup)
                    {
                        var supPils = pils.Where(m => !m.sup_id.HasValue).ToList();

                        PurchaseBaseLineRepository PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                        var newSod = new PurchaseBaseClass
                        {
                            SodName = "CF-" + pin.pin_name,
                            InterComment = pin.pin_inter_comment,
                            SupplierComment = pin.pin_supplier_comment,
                            SupId = supSco.Key,
                            SubSupId = supSco.Key,
                            ScoId = Convert.ToInt32(supSco.Key2),
                            CurId = Convert.ToInt32(supSco.Key3),
                            VatId = supSco.Key4,
                            SocId = socId,
                            UsrId = usrId,
                            PinId = pin.pin_id,
                            DateCreation = DateTime.Now,
                            DateUpdate = DateTime.Now
                        };
                        sodId = CreateUpdateSupplierOrder(newSod);

                        foreach (var onepil in supPils)
                        {
                            var onepil1 = onepil;
                            var sprs = _db.TR_SPR_Supplier_Product.Where(m => m.prd_id == onepil1.prd_id);
                            var spr = sprs.Any(m => m.sup_id == supSco.Key)
                                ? sprs.FirstOrDefault(m => m.sup_id == supSco.Key)
                                : sprs.FirstOrDefault();

                            var sol = new PurchaseLineBaseClass
                            {
                                SodId = sodId,
                                Order = onepil1.pil_order,
                                Description = onepil1.pil_description,
                                PrdId = onepil1.prd_id,
                                PitId = onepil1.pit_id,
                                Quantity = onepil1.pil_quantity,
                                UnitPrice = spr != null ? (onepil1.pil_quantity < 100 ? spr.spr_price_1_100 : ((onepil1.pil_quantity > 100 && onepil1.pil_quantity < 500) ? spr.spr_price_100_500 : spr.spr_price_500_plus)) : 0,
                                VatId = supSco.Key4,
                                PilId = onepil1.pil_id,
                                DiscountAmount = 0,
                                PrdDescription = onepil1.pil_prd_des,
                                TempColor = onepil1.pil_temp_color,
                                Driver = onepil1.pil_driver,
                                Power = onepil1.pil_power,
                                Efflum = onepil1.pil_eff_lum,
                                UGR = onepil.pil_ugr,
                                LogsNbr = onepil1.pil_logistic,
                                Length = onepil1.pil_length,
                                Width = onepil1.pil_width,
                                Height = onepil1.pil_height,
                                FeatureCode = onepil1.pil_feature_code,
                                CRI = onepil1.pil_cri,
                                UsrIdCom1 = onepil1.usr_id_com1,
                                UsrIdCom2 = onepil1.usr_id_com2,
                                UsrIdCom3 = onepil1.usr_id_com3,
                                Comment = onepil1.pil_comment,
                                Client = onepil1.pil_client,
                                Deadline = onepil1.pil_deadline,
                                PrdName = onepil1.pil_prd_name
                            };
                            sol.TotalPrice = sol.UnitPrice * sol.Quantity;
                            sol.TotalCrudePrice = sol.UnitPrice * sol.Quantity * (1 + supSco.DcValue / 100);
                            sol.UnitPriceWithDis = sol.UnitPrice;
                            PurchaseBaseLineRepository.InsertUpdateSol(sol);
                        }
                        sodIds.Add(sodId);
                    }
                    pin.pin_closed = true;
                    _db.TM_PIN_Purchase_Intent.ApplyCurrentValues(pin);
                    _db.SaveChanges();
                }
            }
            return sodIds;
        }

        public bool DeletePin(int socId, int pinId)
        {
            var deleted = false;
            var pin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.soc_id == socId && m.pin_id == pinId);
            var pinInuse = _db.TM_SOD_Supplier_Order.Any(m => m.pin_id == pinId && m.soc_id == socId);
            pinInuse = pinInuse || (from sin in _db.TM_SIN_Supplier_Invoice
                                    join sod in _db.TM_SOD_Supplier_Order on sin.sod_id equals sod.sod_id
                                    join apin in _db.TM_PIN_Purchase_Intent on sod.pin_id equals apin.pin_id
                                    where apin.pin_id == pinId && apin.soc_id == socId
                                    select sin).Any();
            if (!pinInuse && pin != null)
            {
                var pils = _db.TM_PIL_PurchaseIntent_Lines.Where(m => m.pin_id == pinId && m.TM_PIN_Purchase_Intent.soc_id == socId).ToList();
                foreach (var onepil in pils)
                {
                    _db.TM_PIL_PurchaseIntent_Lines.DeleteObject(onepil);
                }
                _db.SaveChanges();
                _db.TM_PIN_Purchase_Intent.DeleteObject(pin);
                _db.SaveChanges();
                deleted = true;
            }
            return deleted;
        }

        public List<PurchaseBaseClass> GetPinSods(int pinId, int socId)
        {
            var sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId && m.pin_id == pinId).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();
            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                decimal totalHt;
                decimal totalTtc;
                CalculateSodTotal(m.SodId, out totalHt, out totalTtc);
                m.TotalAmountHt = totalHt;
                m.TotalAmountTtc = totalTtc;
            });
            return sods;
        }

        /// <summary>
        /// 在CPL，COD，CIN页面直接通过对应的行来添加PIN，和PIL
        /// 20230923 将CIN中的CII添加到SOD里
        /// </summary>
        /// <param name="usrId"></param>
        /// <param name="socId"></param>
        /// <param name="qty"></param>
        /// <param name="cmt"></param>
        /// <param name="clnId"></param>
        /// <param name="colId"></param>
        /// <param name="ciiId"></param>
        /// <returns></returns>
        public int CreatePinByLine(int usrId, int socId, int qty, string cmt, string featureCode, int clnId, int colId, int ciiId)
        {
            int pilId = 0;

            //var _clnid = 0;
            //var _colid = 0;
            //var _cinid = 0;

            var onecln = (from cln in _db.TM_CLN_CostPlan_Lines
                          join cpl in _db.TM_CLN_CostPlan_Lines on cln.cpl_id equals cpl.cpl_id
                          where cln.cln_id == clnId
                          select cln).FirstOrDefault();

            var onecol = (from col in _db.TM_COL_ClientOrder_Lines
                          join cod in _db.TM_COD_Client_Order on col.cod_id equals cod.cod_id
                          where col.col_id == colId || col.cln_id == clnId
                          select col).FirstOrDefault();

            //var onecin = (from cii in _db.TM_CII_ClientInvoice_Line
            //              join cin in _db.TM_CII_ClientInvoice_Line on cii.cin_id equals cin.cin_id
            //              where cii.cii_id == ciiId || cii.col_id == colId
            //              select cin).FirstOrDefault();

            var onecii = (from cii in _db.TM_CII_ClientInvoice_Line
                          join cin in _db.TM_CII_ClientInvoice_Line on cii.cin_id equals cin.cin_id
                          join col in _db.TM_COL_ClientOrder_Lines on cii.col_id equals col.col_id
                          into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          where cii.cii_id == ciiId || cii.col_id == colId || lj.cln_id == clnId
                          select cii).FirstOrDefault();

            if (onecln == null)
            {
                if (onecol != null)
                {
                    onecln = (from col in _db.TM_COL_ClientOrder_Lines
                              join cod in _db.TM_COD_Client_Order on col.cod_id equals cod.cod_id
                              join cln in _db.TM_CLN_CostPlan_Lines on col.cln_id equals cln.cln_id
                              where col.col_id == colId || col.cln_id == clnId
                              select cln).FirstOrDefault();
                }
                else if (onecii != null)
                {
                    onecln = (from cii in _db.TM_CII_ClientInvoice_Line
                              join cin in _db.TM_CII_ClientInvoice_Line on cii.cin_id equals cin.cin_id
                              join col in _db.TM_COL_ClientOrder_Lines on cii.col_id equals col.col_id
                              into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              join cln in _db.TM_CLN_CostPlan_Lines on lj.cln_id equals cln.cln_id
                              where cii.cii_id == ciiId || cii.col_id == colId || lj.cln_id == clnId
                              select cln).FirstOrDefault();
                }
            }

            if (onecol == null)
            {
                onecol = (from cii in _db.TM_CII_ClientInvoice_Line
                          join cin in _db.TM_CII_ClientInvoice_Line on cii.cin_id equals cin.cin_id
                          join col in _db.TM_COL_ClientOrder_Lines on cii.col_id equals col.col_id
                          into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          where cii.cii_id == ciiId || cii.col_id == colId || lj.cln_id == clnId
                          select lj).FirstOrDefault();
            }


            TM_PIN_Purchase_Intent onePin = null;
            var now = DateTime.Now;
            var pinCodeName = string.Format("IAAT-{0:d4}{1:d2}{2:d2}", now.Year, now.Month, now.Day);

            if (onecln != null || onecol != null || onecii != null)
            {
                // create purchase intent by date
                //onePin.pin_name = pinCodeName;
                onePin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.pin_code == pinCodeName);
                if (onePin == null)
                {
                    onePin = new TM_PIN_Purchase_Intent();
                    onePin.pin_code = pinCodeName;
                    onePin.pin_name = pinCodeName;
                    onePin.soc_id = socId;
                    onePin.pin_creator_id = usrId;
                    onePin.pin_d_creation = now;
                    onePin.pin_d_update = now;
                    onePin.pin_closed = false;
                    _db.TM_PIN_Purchase_Intent.AddObject(onePin);
                    _db.SaveChanges();
                }
                else
                {
                    onePin.pin_closed = false;
                    onePin.pin_d_update = now;
                    _db.TM_PIN_Purchase_Intent.ApplyCurrentValues(onePin);
                    _db.SaveChanges();
                }

                if (clnId != 0)
                {
                    if (onecln != null)
                    {
                        var pil = new TM_PIL_PurchaseIntent_Lines
                        {
                            pin_id = onePin.pin_id,
                            prd_id = onecln.prd_id,
                            pit_id = onecln.pit_id,
                            pil_order = onecln.cln_level1 ?? 1,
                            pil_quantity = qty,
                            pil_description = onecln.cln_description,
                            pil_comment = cmt,
                            pil_prd_des = onecln.cln_prd_des,
                            pil_prd_name = onecln.cln_prd_name,
                            pil_d_creation = now,
                            pil_d_update = now,
                            usr_id_creator = usrId,
                            cln_id = onecln.cln_id,
                            col_id = onecol != null ? onecol.col_id : (int?)null,
                            cii_id = onecii != null ? onecii.cii_id : (int?)null,
                            pil_client = onecln.TM_CPL_Cost_Plan.TM_CLI_CLient.cli_company_name,
                            pil_feature_code = featureCode
                        };
                        _db.TM_PIL_PurchaseIntent_Lines.AddObject(pil);
                        _db.SaveChanges();
                        pilId = pil.pil_id;
                    }
                }
                else if (colId != 0)
                {
                    if (onecol != null)
                    {
                        var pil = new TM_PIL_PurchaseIntent_Lines
                        {
                            pin_id = onePin.pin_id,
                            prd_id = onecol.prd_id,
                            pit_id = onecol.pit_id,
                            pil_order = onecol.col_level1 ?? 1,
                            pil_quantity = qty,
                            pil_description = onecol.col_description,
                            pil_comment = cmt,
                            pil_prd_des = onecol.col_prd_des,
                            pil_prd_name = onecol.col_prd_name,
                            pil_d_creation = now,
                            pil_d_update = now,
                            usr_id_creator = usrId,
                            col_id = onecol.col_id,
                            cln_id = onecln != null ? onecln.cln_id : (int?)null,
                            cii_id = onecii != null ? onecii.cii_id : (int?)null,
                            pil_client = onecol.TM_COD_Client_Order.TM_CLI_CLient.cli_company_name,
                            pil_feature_code = featureCode
                        };
                        _db.TM_PIL_PurchaseIntent_Lines.AddObject(pil);
                        _db.SaveChanges();
                        pilId = pil.pil_id;
                    }
                }
                else if (ciiId != 0)
                {
                    if (onecii != null)
                    {
                        var pil = new TM_PIL_PurchaseIntent_Lines
                        {
                            pin_id = onePin.pin_id,
                            prd_id = onecii.prd_id,
                            pit_id = onecii.pit_id,
                            pil_order = onecii.cii_level1 ?? 1,
                            pil_quantity = qty,
                            pil_description = onecii.cii_description,
                            pil_comment = cmt,
                            pil_prd_des = onecii.cii_prd_des,
                            pil_prd_name = onecii.cii_prd_name,
                            pil_d_creation = now,
                            pil_d_update = now,
                            usr_id_creator = usrId,
                            cii_id = onecii.cii_id,
                            col_id = onecol != null ? onecol.col_id : (int?)null,
                            cln_id = onecln != null ? onecln.cln_id : (int?)null,
                            pil_client = onecii.TM_CIN_Client_Invoice.TM_CLI_CLient.cli_company_name,
                            pil_feature_code = featureCode
                        };
                        _db.TM_PIL_PurchaseIntent_Lines.AddObject(pil);
                        _db.SaveChanges();
                        pilId = pil.pil_id;

                        if (!onecii.sol_id.HasValue)
                        {// 20230923 cii 可以直接建立SOL建立到第一个sod里面
                            var onesod = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.cin_id == onecii.cin_id).Select(l => l.TM_SOD_Supplier_Order).FirstOrDefault();
                            if (onesod != null)
                            {
                                var sol = new TM_SOL_SupplierOrder_Lines
                                {
                                    //pin_id = onePin.pin_id,
                                    sod_id = onesod.sod_id,
                                    prd_id = onecii.prd_id,
                                    pit_id = onecii.pit_id,
                                    sol_order = onecii.cii_level1 ?? 1,
                                    sol_quantity = qty,
                                    sol_description = onecii.cii_description,
                                    sol_unit_price = onecii.cii_purchase_price,
                                    sol_price_with_dis = onecii.cii_purchase_price,
                                    vat_id = onesod.vat_id,
                                    sol_total_price = onecii.cii_quantity * onecii.cii_purchase_price,
                                    sol_total_crude_price = onecii.cii_quantity * onecii.cii_purchase_price * (1 + onesod.TR_VAT_Vat.vat_vat_rate / 100),
                                    sol_comment = cmt,
                                    sol_prd_des = onecii.cii_prd_des,
                                    sol_prd_name = onecii.cii_prd_name,
                                    sol_d_creation = now,
                                    sol_d_update = now,
                                    sol_client = onecii.TM_CIN_Client_Invoice.TM_CLI_CLient.cli_company_name,
                                    sol_feature_code = featureCode,
                                    sol_guid = Guid.NewGuid()
                                };

                                _db.TM_SOL_SupplierOrder_Lines.AddObject(sol);
                                _db.SaveChanges();
                                var solId = sol.sol_id;
                                onecii.sol_id = sol.sol_id;
                                _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(onecii);
                                _db.SaveChanges();
                            }
                        }

                    }
                }
            }
            return pilId;
        }

        #endregion Purchase Intent

        #region Supplier Order

        public int CreateUpdateSupplierOrder(PurchaseBaseClass sod)
        {
            int itemId = 0;
            var aSod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.soc_id == sod.SocId && m.sod_id == sod.SodId);
            if (aSod != null)
            {
                aSod = PurchaseBaseTranslator.EntityToRepository(sod, aSod);
                if (aSod.sub_sup_id == 0 || !aSod.sub_sup_id.HasValue)
                {
                    aSod.sub_sup_id = aSod.sup_id;
                }
                itemId = aSod.sod_id;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(aSod);
                _db.SaveChanges();
                // 下单人改变，所有SOL下单人将改变
                var sols = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == aSod.sod_id).ToList();
                foreach (var asol in sols)
                {
                    asol.usr_id_com1 = aSod.usr_com_id;
                    _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(asol);
                }
                _db.SaveChanges();

            }
            else
            {
                var lastItem = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
                    && m.sod_d_creation.Year == sod.DateCreation.Year
                    && m.sod_d_creation.Month == sod.DateCreation.Month).OrderByDescending(m => m.sod_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastItem != null)
                {
                    lastCode = lastItem.sod_code;
                }
                string pref = GetCodePref(7);
                sod.SodCode = GetGeneralRefContinuation(sod.DateCreation, pref, lastCode, _codeType, sod.SupId);
                aSod = PurchaseBaseTranslator.EntityToRepository(sod, aSod, true);
                if (aSod.sub_sup_id == 0 || !aSod.sub_sup_id.HasValue)
                {
                    aSod.sub_sup_id = aSod.sup_id;
                }
                _db.TM_SOD_Supplier_Order.AddObject(aSod);
                _db.SaveChanges();
                itemId = aSod.sod_id;
            }

            if (aSod.sod_finish == true)
            {
                CalendarRepository.DeletedAllNotifOfSod(aSod.sod_id);
            }
            return itemId;
        }

        public PurchaseBaseClass LoadSupplierOrder(int socId, int sodId, bool forPdf = false, int lgsId = 0)
        {
            var sod = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId && m.sod_id == sodId).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).FirstOrDefault();
            if (sod != null)
            {
                sod.SodFId = StringCipher.EncoderSimple(sod.SodId.ToString(), "sodId");
                sod.PinFId = StringCipher.EncoderSimple(sod.PinId.ToString(), "pinId");
                sod.SinFId = StringCipher.EncoderSimple(sod.SinId.ToString(), "sinId");
                sod.SupFId = StringCipher.EncoderSimple(sod.SupId.ToString(), "supId");
                sod.SubSupFId = StringCipher.EncoderSimple(sod.SubSupId.ToString(), "supId");

                // 20210118 commented out
                //if (sod.CinId.HasValue)
                //{
                //    var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.cin_id == sod.CinId);
                //    if (cin != null)
                //    {
                //        sod.CinCode = cin.cin_code;
                //        sod.CinFId = StringCipher.EncoderSimple(sod.CinId.ToString(), "cinId");
                //    }
                //}

                // 20210118 cso
                var csos = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.sod_id == sod.SodId).ToList();
                sod.CsoList = csos.Select(onecso => new KeyValue()
                {
                    Key = onecso.cin_id,
                    Value = onecso.TM_CIN_Client_Invoice.cin_code,
                    Value2 = StringCipher.EncoderSimple(onecso.cin_id.ToString(), "cinId")
                }).ToList();


                if (forPdf)
                {
                    PurchaseBaseLineRepository PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    sod.PurchaseLines = PurchaseBaseLineRepository.LoadSols(socId, sodId, lgsId: lgsId);
                }
            }
            return sod;
        }

        public List<PurchaseBaseClass> SearchSupplierOrder(PurchaseBaseClass sod)
        {
            var sodname = sod.SodName.Trim();
            var sodcode = sod.SodCode.Trim(); // keyword 用于搜索，对应 Mot cle

            IQueryable<TM_SOL_SupplierOrder_Lines> solwithquantity = new List<TM_SOL_SupplierOrder_Lines>().AsQueryable();

            if (sod.SodDiscountAMount != 0)
            {
                solwithquantity = (from sol in _db.TM_SOL_SupplierOrder_Lines
                                   where sol.sol_quantity == sod.SodDiscountAMount
                                   select sol);
            }

            var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Where(l => !string.IsNullOrEmpty(sod.InterComment) && l.spr_payment_code.Contains(sod.InterComment)).Distinct().ToList();

            var sodIdsWithPayment = sprs.Select(l => l.sod_id).ToList();

            var sodnameList = new List<string>();
            if (!string.IsNullOrEmpty(sodname))
            {
                sodname = sodname.Replace("；", ";");
                sodnameList = sodname.Split(';').Where(l => !string.IsNullOrEmpty(l.Trim())).Distinct().ToList();
            }
            var withName = sodnameList.Any();

            IQueryable<TM_SOD_Supplier_Order> sodPreTreat = new List<TM_SOD_Supplier_Order>().AsQueryable();


            // 针对withname的预处理
            sodPreTreat = (from onesod in _db.TM_SOD_Supplier_Order
                           from onename in sodnameList
                           where (onesod.sod_code.Contains(onename) || onesod.sod_name.Contains(onename))
                           && (!sod.SodFinish || (sod.SodFinish && onesod.sod_need2pay > 0)) // 只看未支付
                           && ((!sod.IsCanceled.Value) || (sod.IsCanceled == true && (!onesod.sod_canceled.HasValue || onesod.sod_canceled.Value != true))) // 20230913 不显示已取消, 下面需要再处理两次
                           select onesod);

            var sods = new List<PurchaseBaseClass>();

            if (withName)
            {
                if (sod.SodDiscountAMount != 0)
                {
                    sods = (from onesod in sodPreTreat
                            join sol in solwithquantity on onesod.sod_id equals sol.sod_id
                            where onesod.soc_id == sod.SocId
                                                        // && (string.IsNullOrEmpty(sodname) || onesod.sod_name.Contains(sodname) || onesod.sod_code.Contains(sodname))
                                                        && (sod.SupId == 0 || onesod.sup_id == sod.SupId) && (sod.CliId == 0 || onesod.cli_id == sod.CliId)
                                                        // Date
                                                        && (onesod.sod_d_creation >= sod.DateCreation) && (onesod.sod_d_creation <= sod.DateUpdate)
                                                        && (sod.SttId == 0 || sod.SttId == onesod.stt_id)
                            select onesod).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();
                }
                else
                {
                    //sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
                    //                                        &&
                    //                                        (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
                    //                                        && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
                    //    // Date
                    //                                        && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate))
                    //.Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                    //.ToList();

                    sods = sodPreTreat.Where(m => m.soc_id == sod.SocId
                                                           //&& (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
                                                           && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
                                                           // Date
                                                           && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate)
                                                        && (sod.SttId == 0 || sod.SttId == m.stt_id))
                   .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                   .ToList();
                }
            }
            else
            {
                if (sod.SodDiscountAMount != 0)
                {
                    sods = (from onesod in _db.TM_SOD_Supplier_Order
                            join sol in solwithquantity on onesod.sod_id equals sol.sod_id
                            where onesod.soc_id == sod.SocId
                                                        && (sod.SupId == 0 || onesod.sup_id == sod.SupId) && (sod.CliId == 0 || onesod.cli_id == sod.CliId)
                                                        // Date
                                                        && (onesod.sod_d_creation >= sod.DateCreation) && (onesod.sod_d_creation <= sod.DateUpdate)
                                                        && (!sod.SodFinish || (sod.SodFinish && onesod.sod_need2pay > 0)) // 只看未支付
                           && ((!sod.IsCanceled.Value) || (sod.IsCanceled == true && (!onesod.sod_canceled.HasValue || onesod.sod_canceled.Value != true))) // 20230913 不显示已取消
                           && (sod.SttId == 0 || sod.SttId == onesod.stt_id)
                            select onesod).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();
                }
                else
                {
                    sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
                                                            //&& (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
                                                            && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
                                                            // Date
                                                            && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate)
                                                            && (!sod.SodFinish || (sod.SodFinish && m.sod_need2pay > 0)) // 只看未支付
                           && ((!sod.IsCanceled.Value) || (sod.IsCanceled == true && (!m.sod_canceled.HasValue || m.sod_canceled.Value != true))) // 20230913 不显示已取消
                           && (sod.SttId == 0 || sod.SttId == m.stt_id)
                                                            )
                    .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                    .ToList();
                }
            }



            //////if (sodnameList.Count == 1)
            //////{
            //////    sodname = sodnameList.FirstOrDefault();
            //////    if (sod.SodDiscountAMount != 0)
            //////    {
            //////        sods = (from onesod in _db.TM_SOD_Supplier_Order
            //////                join sol in solwithquantity on onesod.sod_id equals sol.sod_id
            //////                where onesod.soc_id == sod.SocId
            //////                &&
            //////                (string.IsNullOrEmpty(sodname) || onesod.sod_name.Contains(sodname) || onesod.sod_code.Contains(sodname))
            //////                                            && (sod.SupId == 0 || onesod.sup_id == sod.SupId) && (sod.CliId == 0 || onesod.cli_id == sod.CliId)
            //////                    // Date
            //////                                            && (onesod.sod_d_creation >= sod.DateCreation) && (onesod.sod_d_creation <= sod.DateUpdate)
            //////                select onesod).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();
            //////    }
            //////    else
            //////    {
            //////        sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
            //////                                                &&
            //////                                                (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
            //////                                                && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
            //////            // Date
            //////                                                && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate))
            //////        .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
            //////        .ToList();
            //////    }
            //////}
            //////else
            //////{
            //////    //sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
            //////    //    //&& (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
            //////    //                                            && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
            //////    //    // Date
            //////    //                                            && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate))
            //////    //    .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
            //////    //    .ToList();
            //////    if (sod.SodDiscountAMount != 0)
            //////    {
            //////        sods = (from onesod in _db.TM_SOD_Supplier_Order
            //////                join sol in solwithquantity on onesod.sod_id equals sol.sod_id
            //////                where onesod.soc_id == sod.SocId
            //////                                            && (sod.SupId == 0 || onesod.sup_id == sod.SupId) && (sod.CliId == 0 || onesod.cli_id == sod.CliId)
            //////                    // Date
            //////                                            && (onesod.sod_d_creation >= sod.DateCreation) && (onesod.sod_d_creation <= sod.DateUpdate)
            //////                select onesod).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();
            //////    }
            //////    else
            //////    {
            //////        sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == sod.SocId
            //////            //&& (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
            //////                                                && (sod.SupId == 0 || m.sup_id == sod.SupId) && (sod.CliId == 0 || m.cli_id == sod.CliId)
            //////            // Date
            //////                                                && (m.sod_d_creation >= sod.DateCreation) && (m.sod_d_creation <= sod.DateUpdate))
            //////        .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
            //////        .ToList();
            //////    }

            //////    if (sodnameList.Any())
            //////    {
            //////        var sods2 = new List<PurchaseBaseClass>();
            //////        foreach (var selectsods in sodnameList.Select(onename => sods.Where(l => l.SodName.IndexOf(onename, StringComparison.OrdinalIgnoreCase) >= 0 || l.SodCode.IndexOf(onename, StringComparison.OrdinalIgnoreCase) >= 0)))
            //////        {
            //////            sods2.AddRange(selectsods);
            //////        }
            //////        sods = sods2;
            //////    }
            //////}


            if (!string.IsNullOrEmpty(sod.InterComment))
            {
                sods = (from onesod in sods
                        join sodId in sodIdsWithPayment on onesod.SodId equals sodId
                        select onesod).ToList();
            }

            var sols = new List<PurchaseLineBaseClass>();
            //if (sod.SodDiscountAMount != 0)
            //{
            //    sols = Queryable.Select((from pin in sods
            //                             join sol in solwithquantity on pin.SodId equals sol.sod_id
            //                             where
            //                                 (string.IsNullOrEmpty(sodcode)
            //                                 //|| string.IsNullOrEmpty(sol.sol_description)
            //                                  || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //|| string.IsNullOrEmpty(sol.sol_prd_des)
            //                                  || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //|| string.IsNullOrEmpty(sol.sol_prd_name)
            //                                  || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_feature_code)
            //                                  || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_logistic)
            //                                  || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_logistics_number)
            //                                  || (!string.IsNullOrEmpty(sol.sol_logistics_number) && sol.sol_logistics_number.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_client)
            //                                  || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_power)
            //                                  || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_driver)
            //                                  || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_temp_color)
            //                                  || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_transporter)
            //                                  || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_comment)
            //                                  || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                     )
            //                                 // CurId 在这里借用表示SOL Quantity
            //                                     && (sod.SodDiscountAMount == 0 || sod.SodDiscountAMount == sol.sol_quantity)
            //                             select sol).AsQueryable(), PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(l => l.Order).ToList();
            //}
            //else
            //{
            //    sols = Queryable.Select((from pin in sods
            //                             join sol in _db.TM_SOL_SupplierOrder_Lines on pin.SodId equals sol.sod_id
            //                             where
            //                                 (string.IsNullOrEmpty(sodcode)
            //                                 //|| string.IsNullOrEmpty(sol.sol_description)
            //                                  || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //|| string.IsNullOrEmpty(sol.sol_prd_des)
            //                                  || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //|| string.IsNullOrEmpty(sol.sol_prd_name)
            //                                  || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_feature_code)
            //                                  || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_logistic)
            //                                  || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_logistics_number)
            //                                  || (!string.IsNullOrEmpty(sol.sol_logistics_number) && sol.sol_logistics_number.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_client)
            //                                  || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_power)
            //                                  || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_driver)
            //                                  || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_temp_color)
            //                                  || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_transporter)
            //                                  || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                 //  || string.IsNullOrEmpty(sol.sol_comment)
            //                                  || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
            //                                     )
            //                                 // CurId 在这里借用表示SOL Quantity
            //                                     && (sod.SodDiscountAMount == 0 || sod.SodDiscountAMount == sol.sol_quantity)
            //                             select sol).AsQueryable(), PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(l => l.Order).ToList();
            //}


            sols = Queryable.Select((from pin in sods
                                     join sol in _db.TM_SOL_SupplierOrder_Lines on pin.SodId equals sol.sod_id
                                     where
                                         (string.IsNullOrEmpty(sodcode)
                                          //|| string.IsNullOrEmpty(sol.sol_description)
                                          || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //|| string.IsNullOrEmpty(sol.sol_prd_des)
                                          || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //|| string.IsNullOrEmpty(sol.sol_prd_name)
                                          || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_feature_code)
                                          || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_logistic)
                                          || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_logistics_number)
                                          || (!string.IsNullOrEmpty(sol.sol_logistics_number) && sol.sol_logistics_number.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_client)
                                          || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_power)
                                          || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_driver)
                                          || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_temp_color)
                                          || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_transporter)
                                          || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                          //  || string.IsNullOrEmpty(sol.sol_comment)
                                          || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                             )
                                             // CurId 在这里借用表示SOL Quantity
                                             && (sod.SodDiscountAMount == 0 || sod.SodDiscountAMount == sol.sol_quantity)
                                     select sol).AsQueryable(), PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(l => l.Order).ToList();

            var cins = (from pin in sods
                        join cin in _db.TM_CIN_Client_Invoice on pin.CinId equals cin.cin_id
                        select cin).ToList();


            if (sods.Any() && (!string.IsNullOrEmpty(sodcode) || sod.SodDiscountAMount != 0)) //20210507 注释掉该行, 20210517 重新使用，加入quantity判断
            {
                // 筛选一遍，在intercomment 和 suppliercomment里面含有需要搜索内容的SOD
                var sodsForCmt = sods.Where(l =>
                    (l.InterComment != null && l.InterComment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                    ||
                    (l.SupplierComment != null && l.SupplierComment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                //l.InterComment.Contains(sodcode) || l.SupplierComment.Contains(sodcode)
                ).ToList();

                // 用sol搜索结果过滤一遍sod
                var sodids = Enumerable.Select(sols, l => l.SodId).Distinct().ToList();
                sods = sods.Join(sodids, onesod => onesod.SodId, solid => solid, (onesod, solid) => onesod).ToList();
                sods.AddRange(sodsForCmt);

                sods = sods.DistinctBy(l => l.SodId).ToList();
            }

            //var solWithLgl = (from sol in sols
            //                  join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
            //                  select new { sol, lgl }).ToList();

            var solWithLglCil = (from sol in sols
                                 join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
                                 join cil in _db.TM_CII_ClientInvoice_Line on sol.SolId equals cil.sol_id
                                     into leftJ
                                 from lj in leftJ.DefaultIfEmpty()
                                 select new { sol, lgl, lj }).ToList();

            var csos = (from onesod in sods
                        join cso in _db.TR_CSO_ClientInvoice_SupplierOrder on onesod.SodId equals cso.sod_id
                        select new KeyValue()
                        {
                            Key = cso.cin_id,
                            Key2 = cso.sod_id,
                            Value = string.Format("{0} - {1:n2} {2}", cso.TM_CIN_Client_Invoice.cin_code, (cso.TM_CIN_Client_Invoice.TM_CII_ClientInvoice_Line.Any() ? cso.TM_CIN_Client_Invoice.TM_CII_ClientInvoice_Line.Sum(ii => ii.cii_total_crude_price) : 0), cso.TM_CIN_Client_Invoice.TR_CUR_Currency.cur_symbol),
                            Value2 = StringCipher.EncoderSimple(cso.cin_id.ToString(), "cinId"),
                            // cin 总金额
                            DcValue = (cso.TM_CIN_Client_Invoice.TM_CII_ClientInvoice_Line.Any() ? cso.TM_CIN_Client_Invoice.TM_CII_ClientInvoice_Line.Sum(ii => ii.cii_total_crude_price) : 0) ?? 0,
                            // cin 未支付
                            DcValue2 = (cso.TM_CIN_Client_Invoice != null ? (cso.TM_CIN_Client_Invoice.cin_rest_to_pay ?? 0) : 0),
                            Value3 = (cso.TM_CIN_Client_Invoice != null && cso.TM_CIN_Client_Invoice.TR_CUR_Currency != null ? cso.TM_CIN_Client_Invoice.TR_CUR_Currency.cur_symbol : string.Empty)
                        }).ToList();


            // 如果在查找payment code为空的时候，将选择所有的sods 对应的payment code
            if (string.IsNullOrEmpty(sod.InterComment))
            {
                sprs = (from onesod in sods
                        join spr in _db.TR_SPR_SupplierOrder_Payment_Record on onesod.SodId equals spr.sod_id
                        select spr).Distinct().ToList();
            }

            if (sod.SodHasSin)
            {
                var sodwithcin = (from onesod in sods
                                  join sodId in csos on onesod.SodId equals sodId.Key2
                                  select onesod).ToList();
                sods = sods.Except(sodwithcin).ToList();
            }

            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                decimal totalHt;
                decimal totalTtc;
                // 20200106 已经有了支付环节，这一部分更新了
                // todo: 需要更新，当sol更新的时候
                //CalculateSodTotal(m.SodId, out totalHt, out totalTtc);
                //m.TotalAmountHt = totalHt;
                //m.TotalAmountTtc = totalTtc;
                var solsofsod = sols.Where(l => l.SodId == m.SodId).ToList();
                solsofsod.ForEach(onesol =>
                {
                    onesol.SodFId = StringCipher.EncoderSimple(onesol.SodId.ToString(), "sodId");
                    onesol.PrdFId = StringCipher.EncoderSimple(onesol.PrdId.ToString(), "prdId");
                    onesol.PitFId = StringCipher.EncoderSimple(onesol.PitId.ToString(), "pitId");
                    onesol.PinFId = StringCipher.EncoderSimple(onesol.PinId.ToString(), "pinId");
                    //onesol.LglId = solWithLgl.Any(l => l.sol.SolId == onesol.SolId) ? 1 : 0;
                    //var solLgs = solWithLgl.Where(l => l.sol.SolId == onesol.SolId).ToList();
                    onesol.LglId = solWithLglCil.Any(l => l.sol.SolId == onesol.SolId) ? 1 : 0;
                    var solLgs = solWithLglCil.Where(l => l.sol.SolId == onesol.SolId).ToList();
                    var lgsinfos = solLgs.Select(sollgl => new KeyValue
                    {
                        Key = sollgl.lgl.lgs_id,
                        Value = sollgl.lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                        Value2 = sollgl.lgl.TM_LGS_Logistic.lgs_tracking_number,
                        Value3 = sollgl.lgl.TM_LGS_Logistic.lgs_code,
                        Value4 = StringCipher.EncoderSimple(sollgl.lgl.lgs_id.ToString(), "lgsId"),
                        Key2 = sollgl.lgl.lgs_quantity ?? 0
                    }).ToList();

                    var ciis = solWithLglCil.Where(l => l.sol.SolId == onesol.SolId && l.lj != null).Select(l => l.lj).Distinct().ToList();
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
                    onesol.LgsInfos = lgsinfos;
                    //onesol.DeliveriedQuantity = solWithLgl.Where(l => l.sol.SolId == onesol.SolId).Sum(l => l.lgl.lgs_quantity);
                    onesol.DeliveriedQuantity = (solWithLglCil.Where(l => l.sol.SolId == onesol.SolId).Sum(l => l.lgl.lgs_quantity) + solWithLglCil.Where(l => l.lj != null).Sum(l => l.lj.TM_LGL_Logistic_Lines.Sum(k => k.lgs_quantity)));
                });
                m.CsoList = csos.Where(l => l.Key2 == m.SodId).ToList();
                m.PurchaseLines = solsofsod;//sols.Where(l => l.SodId == m.SodId).ToList();
                var onecin = cins.FirstOrDefault(l => l.cin_id == m.CinId);
                if (onecin != null)
                {
                    m.CinCode = onecin.cin_code;
                    m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                }
                var sodSprs = sprs.Where(l => l.sod_id == m.SodId).Distinct().OrderByDescending(l => l.spr_d_payment).ToList();
                var sodpaymentrecords = sodSprs.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}</br>",
                    oneSpr.spr_d_payment,
                    oneSpr.spr_payment_code,
                    oneSpr.spr_amount,
                    m.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewSprFile('" + m.SodFId + "'," + oneSpr.spr_id + ")\">"),
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                m.SodPaymentRecord = sodpaymentrecords;
                var paymentcmt = sodSprs.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("→ {0:d}-<span style='font-weight:bolder'>{1}</span></br>",
                    oneSpr.spr_d_payment,
                    oneSpr.spr_comment
                    ));
                m.SodPaymentComments = paymentcmt;
            });
            return sods.OrderByDescending(l => l.SodCode).ToList();
        }

        #region 供货商登录

        public List<PurchaseBaseClass> SearchSupplierOrderForSup(PurchaseBaseClass sod)
        {
            var sodname = sod.SodName.Trim();
            var sodcode = sod.SodCode.Trim(); // keyword
            var sods = _db.TM_SOD_Supplier_Order.Where(m => m.sup_id == sod.SupId
                && (string.IsNullOrEmpty(sodname) || m.sod_name.Contains(sodname) || m.sod_code.Contains(sodname))
                && (sod.SupId == 0 || m.sup_id == sod.SupId)
                && (sod.CliId == 0 || m.cli_id == sod.CliId)
                // Date
                && (m.sod_d_creation >= sod.DateCreation)
                && (m.sod_d_creation <= sod.DateUpdate)
                ).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList();

            var sols = Queryable.Select((from pin in sods
                                         join sol in _db.TM_SOL_SupplierOrder_Lines on pin.SodId equals sol.sod_id
                                         where
                                             (string.IsNullOrEmpty(sodcode)
                                              //|| string.IsNullOrEmpty(sol.sol_description)
                                              || (!string.IsNullOrEmpty(sol.sol_description) && sol.sol_description.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //|| string.IsNullOrEmpty(sol.sol_prd_des)
                                              || (!string.IsNullOrEmpty(sol.sol_prd_des) && sol.sol_prd_des.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //|| string.IsNullOrEmpty(sol.sol_prd_name)
                                              || (!string.IsNullOrEmpty(sol.sol_prd_name) && sol.sol_prd_name.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_feature_code)
                                              || (!string.IsNullOrEmpty(sol.sol_feature_code) && sol.sol_feature_code.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_logistic)
                                              || (!string.IsNullOrEmpty(sol.sol_logistic) && sol.sol_logistic.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_logistics_number)
                                              || (!string.IsNullOrEmpty(sol.sol_logistics_number) && sol.sol_logistics_number.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_client)
                                              || (!string.IsNullOrEmpty(sol.sol_client) && sol.sol_client.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_power)
                                              || (!string.IsNullOrEmpty(sol.sol_power) && sol.sol_power.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_driver)
                                              || (!string.IsNullOrEmpty(sol.sol_driver) && sol.sol_driver.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_temp_color)
                                              || (!string.IsNullOrEmpty(sol.sol_temp_color) && sol.sol_temp_color.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_transporter)
                                              || (!string.IsNullOrEmpty(sol.sol_transporter) && sol.sol_transporter.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                              //  || string.IsNullOrEmpty(sol.sol_comment)
                                              || (!string.IsNullOrEmpty(sol.sol_comment) && sol.sol_comment.IndexOf(sodcode, StringComparison.OrdinalIgnoreCase) >= 0)
                                                 )
                                                 // CurId 在这里借用表示SOL Quantity
                                                 && (sod.SodDiscountAMount == 0 || sod.SodDiscountAMount == sol.sol_quantity)
                                         select sol).AsQueryable(), PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(l => l.Order).ToList();

            //var cins = (from pin in sods
            //            join cin in _db.TM_CIN_Client_Invoice on pin.CinId equals cin.cin_id
            //            select cin).ToList();


            if (!string.IsNullOrEmpty(sodcode) || sod.SodDiscountAMount != 0) //20210507 注释掉该行, 20210517 重新使用，加入quantity判断
            {
                // 用sol搜索结果过滤一遍sod
                var sodids = Enumerable.Select(sols, l => l.SodId).Distinct().ToList();
                sods = sods.Join(sodids, onesod => onesod.SodId, solid => solid, (onesod, solid) => onesod).ToList();
            }

            var solWithLgl = (from sol in sols
                              join lgl in _db.TM_LGL_Logistic_Lines on sol.SolId equals lgl.sol_id
                              select new { sol, lgl }).ToList();

            //var csos = (from onesod in sods
            //            join cso in _db.TR_CSO_ClientInvoice_SupplierOrder on onesod.SodId equals cso.sod_id
            //            select new KeyValue()
            //            {
            //                Key = cso.cin_id,
            //                Key2 = cso.sod_id,
            //                Value = cso.TM_CIN_Client_Invoice.cin_code,
            //                Value2 = StringCipher.EncoderSimple(cso.cin_id.ToString(), "cinId"),
            //            }).ToList();

            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                decimal totalHt;
                decimal totalTtc;
                // 20200106 已经有了支付环节，这一部分更新了
                // todo: 需要更新，当sol更新的时候
                //CalculateSodTotal(m.SodId, out totalHt, out totalTtc);
                //m.TotalAmountHt = totalHt;
                //m.TotalAmountTtc = totalTtc;
                var solsofsod = sols.Where(l => l.SodId == m.SodId).ToList();
                solsofsod.ForEach(onesol =>
                {
                    onesol.SodFId = StringCipher.EncoderSimple(onesol.SodId.ToString(), "sodId");
                    onesol.PrdFId = StringCipher.EncoderSimple(onesol.PrdId.ToString(), "prdId");
                    onesol.PitFId = StringCipher.EncoderSimple(onesol.PitId.ToString(), "pitId");
                    onesol.PinFId = StringCipher.EncoderSimple(onesol.PinId.ToString(), "pinId");
                    onesol.LglId = solWithLgl.Any(l => l.sol.SolId == onesol.SolId) ? 1 : 0;
                    var solLgs = solWithLgl.Where(l => l.sol.SolId == onesol.SolId).ToList();
                    var lgsinfos = solLgs.Select(sollgl => new KeyValue
                    {
                        Key = sollgl.lgl.lgs_id,
                        Value = sollgl.lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name,
                        Value2 = sollgl.lgl.TM_LGS_Logistic.lgs_tracking_number,
                        Value3 = sollgl.lgl.TM_LGS_Logistic.lgs_code,
                        Value4 = StringCipher.EncoderSimple(sollgl.lgl.lgs_id.ToString(), "lgsId"),
                        Key2 = sollgl.lgl.lgs_quantity ?? 0
                    }).ToList();
                    onesol.LgsInfos = lgsinfos;
                    onesol.DeliveriedQuantity = solWithLgl.Where(l => l.sol.SolId == onesol.SolId).Sum(l => l.lgl.lgs_quantity);
                });
                //m.CsoList = csos.Where(l => l.Key2 == m.SodId).ToList();
                m.PurchaseLines = solsofsod;//sols.Where(l => l.SodId == m.SodId).ToList();
                //var onecin = cins.FirstOrDefault(l => l.cin_id == m.CinId);
                //if (onecin != null)
                //{
                //    m.CinCode = onecin.cin_code;
                //    m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                //}
            });
            return sods;
        }

        public PurchaseBaseClass LoadSupplierOrderSup(int sodId, int supId)
        {
            var sod = _db.TM_SOD_Supplier_Order.Where(m => m.sup_id == supId && m.sod_id == sodId).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).FirstOrDefault();
            if (sod != null)
            {
                sod.SodFId = StringCipher.EncoderSimple(sod.SodId.ToString(), "sodId");
                sod.PinFId = StringCipher.EncoderSimple(sod.PinId.ToString(), "pinId");
                sod.SinFId = StringCipher.EncoderSimple(sod.SinId.ToString(), "sinId");
                sod.SupFId = StringCipher.EncoderSimple(sod.SupId.ToString(), "supId");
                sod.SubSupFId = StringCipher.EncoderSimple(sod.SubSupId.ToString(), "supId");

                // 20210118 cso
                var csos = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.sod_id == sod.SodId).ToList();
                sod.CsoList = csos.Select(onecso => new KeyValue()
                {
                    Key = onecso.cin_id,
                    Value = onecso.TM_CIN_Client_Invoice.cin_code,
                    Value2 = StringCipher.EncoderSimple(onecso.cin_id.ToString(), "cinId")
                }).ToList();
            }
            return sod;
        }

        public List<KeyValue> GetSodPaymentsListSup(int supId, int sodId)
        {
            var sprs = (from sod in _db.TM_SOD_Supplier_Order
                        join spr in _db.TR_SPR_SupplierOrder_Payment_Record on sod.sod_id equals spr.sod_id
                        where sod.sup_id == supId && sod.sod_id == sodId
                        select spr).Select(l => new KeyValue
                        {
                            Key = l.spr_id,
                            DValue = l.spr_d_creation,
                            DValue2 = l.spr_d_payment,
                            DcValue = l.spr_amount,
                            Value = l.spr_comment,
                            Key2 = l.sol_id ?? 0,
                            DValue3 = l.spr_d_update,
                            Value2 = l.spr_file,
                            KeyStr1 = string.IsNullOrEmpty(l.spr_payer) ? "" : l.spr_payer
                        }).OrderBy(l => l.Key).ToList();

            // get sod balance
            var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sup_id == supId && l.sod_id == sodId);
            if (onesod != null)
            {
                var sodinfo = new KeyValue
                {
                    Key = 0,
                    Key2 = 0,
                    DcValue = onesod.sod_total_ht ?? 0,
                    DcValue2 = onesod.sod_total_ttc ?? 0,
                    DcValue3 = onesod.sod_need2pay ?? 0,
                    DcValue4 = sprs.Sum(k => k.DcValue),
                    Value = onesod.TR_CUR_Currency.cur_symbol
                };
                sprs.Add(sodinfo);
            }
            return sprs;
        }


        #endregion 供货商登录

        private void CalculateSodTotal(int sodId, out decimal totalHt, out decimal totalTtc)
        {
            var totalHtNull = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId).Sum(m => ((
                m.sol_quantity * (m.sol_price_with_dis))));
            totalHt = totalHtNull ?? 0;
            var totalTtcNull = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId).Sum(m => (m.sol_quantity * (m.sol_price_with_dis) * (1 + m.TR_VAT_Vat.vat_vat_rate / 100)));
            totalTtc = totalTtcNull ?? 0;
        }

        public void UpdateSodFile(int socId, int sodId, string filePath)
        {
            var item = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.soc_id == socId && m.sod_id == sodId);
            if (item != null)
            {
                if (!string.IsNullOrEmpty(item.sod_file))
                {
                    CommonRepository.DeleteFile(item.sod_file);
                }
                item.sod_file = filePath;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(item);
                _db.SaveChanges();
            }
        }

        public bool DeleteSod(int socId, int sodId)
        {
            var deleted = false;
            var pin = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.soc_id == socId && m.sod_id == sodId);
            var pinInuse = (from sin in _db.TM_SIN_Supplier_Invoice
                            join sod in _db.TM_SOD_Supplier_Order on sin.sod_id equals sod.sod_id
                            where sod.sod_id == sodId && sod.soc_id == socId
                            select sin).Any();
            if (!pinInuse && pin != null)
            {
                var pils = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.soc_id == socId).ToList();
                foreach (var onepil in pils)
                {
                    _db.TM_SOL_SupplierOrder_Lines.DeleteObject(onepil);
                }
                _db.SaveChanges();
                // 20210118 check cso
                var csos = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.sod_id == pin.sod_id).ToList();
                if (csos.Any())
                {
                    foreach (var onecso in csos)
                    {
                        _db.TR_CSO_ClientInvoice_SupplierOrder.DeleteObject(onecso);
                    }
                    _db.SaveChanges();
                }
                // 20210205 check file and payment records
                UpdateSodFile(socId, sodId, null);
                var sdcs = _db.TR_SDC_Supplier_Order_Document.Where(l => l.sod_id == sodId).ToList();
                foreach (var onesdc in sdcs)
                {
                    var file = onesdc.sdc_file;
                    CommonRepository.DeleteFile(file);
                    _db.TR_SDC_Supplier_Order_Document.DeleteObject(onesdc);
                }
                _db.SaveChanges();

                var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Where(l => l.sod_id == sodId).ToList();

                foreach (var onespr in sprs)
                {
                    var file = onespr.spr_file;
                    CommonRepository.DeleteFile(file);
                    _db.TR_SPR_SupplierOrder_Payment_Record.DeleteObject(onespr);
                }
                _db.SaveChanges();

                // todo: 如果要在已经有CIN的时候，删除SOD，需要确认SOL是否被使用，同时需要删除TR_CSO_ClientInvoice_SupplierOrder中SOD项

                _db.TM_SOD_Supplier_Order.DeleteObject(pin);
                _db.SaveChanges();
                deleted = true;
            }
            return deleted;
        }

        public int PassSod2Sin(int socId, int sodId, int usrId)
        {
            int sinId = 0;
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.soc_id == socId && m.sod_id == sodId);
            if (sod != null && !sod.TM_SIN_Supplier_Invoice.Any())
            {
                var sin = new TM_SIN_Supplier_Invoice
                {
                    sod_id = sod.sod_id,
                    sin_name = "PI pour " + sod.sod_name,
                    sin_inter_comment = sod.sod_inter_comment,
                    sin_supplier_comment = sod.sod_supplier_comment,
                    sco_id = sod.sco_id,
                    soc_id = socId,
                    cur_id = sod.cur_id,
                    sup_id = sod.sup_id,
                    vat_id = sod.vat_id,
                    sin_is_paid = false,
                    usr_creator_id = usrId,
                    sin_d_start_production = null,
                    sin_d_complete_production_pre = null,
                    sin_d_complete_production = null,
                    sin_d_creation = DateTime.Now,
                    sin_d_update = DateTime.Now
                };
                var lastItem = _db.TM_SIN_Supplier_Invoice.Where(m => m.soc_id == socId
                    && m.sin_d_creation.Year == sin.sin_d_creation.Year
                    && m.sin_d_creation.Month == sin.sin_d_creation.Month).OrderByDescending(m => m.sin_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastItem != null)
                {
                    lastCode = lastItem.sin_code;
                }
                string pref = GetCodePref(8);
                sin.sin_code = GetGeneralRefContinuation(sin.sin_d_creation, pref, lastCode, _codeType, sod.sup_id);
                // check bank info
                var bac = _db.TR_BAC_Bank_Account.FirstOrDefault(m => m.soc_id == socId && m.bac_type == 2 && m.f_id == sod.sup_id);
                if (bac != null)
                {
                    sin.bac_id = bac.bac_id;
                }
                _db.TM_SIN_Supplier_Invoice.AddObject(sin);
                _db.SaveChanges();
                sinId = sin.sin_id;

                // lines  
                var sols = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.soc_id == socId).ToList();
                foreach (var sol in sols)
                {
                    var sil = new TM_SIL_SupplierInvoice_Lines
                    {
                        sin_id = sinId,
                        sol_id = sol.sol_id,
                        sil_order = sol.sol_order,
                        sil_description = sol.sol_description,
                        // todo: to modify type
                        //prd_id = sol.prd_id,
                        //pit_id = sol.pit_id,
                        //vat_id = sol.vat_id,
                        sil_quantity = sol.sol_quantity,
                        sil_unit_price = sol.sol_unit_price,
                        sil_discount_amount = sol.sol_discount_amount,
                        sil_price_with_dis = sol.sol_price_with_dis,
                        sil_total_price = sol.sol_total_price,
                        sil_total_crude_price = sol.sol_total_crude_price,
                        sil_prd_des = sol.sol_prd_des
                    };
                    _db.TM_SIL_SupplierInvoice_Lines.AddObject(sil);
                }
                _db.SaveChanges();
            }
            return sinId;
        }

        public int CreateSodByPils(int socId, int supId, int pinId, int sodId, List<int> pilIds, string sodName, int usrId)
        {
            var sod_Id = 0;
            var pin = _db.TM_PIN_Purchase_Intent.FirstOrDefault(m => m.soc_id == socId && m.pin_id == pinId);
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_id == supId);
            if (pin != null && sup != null)
            {
                var pils = (from pil in _db.TM_PIL_PurchaseIntent_Lines
                            join id in pilIds on pil.pil_id equals id
                            where pil.pin_id == pin.pin_id
                            select pil).Select(PurchaseBaseLineTranslator.RepositoryToEntity()).ToList();
                var now = DateTime.Now;

                var onesod = sodId != 0 ? _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId) : null;

                if (onesod != null)
                {
                    onesod.sod_d_update = now;
                    _db.TM_SOD_Supplier_Order.ApplyCurrentValues(onesod);
                    _db.SaveChanges();
                    sod_Id = onesod.sod_id;

                    foreach (var onepil in pils)
                    {
                        onepil.SodId = sod_Id;
                        onepil.DateCreation = now;
                        var aSol = PurchaseBaseLineTranslator.EntityToRepositorySol(onepil, create: true);
                        _db.TM_SOL_SupplierOrder_Lines.AddObject(aSol);
                    }
                    _db.SaveChanges();
                }
                else
                {
                    var lastItem = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId
                                                                        && m.sod_d_creation.Year == now.Year
                                                                        && m.sod_d_creation.Month == now.Month)
                        .OrderByDescending(m => m.sod_code)
                        .FirstOrDefault();
                    string lastCode = string.Empty;
                    if (lastItem != null)
                    {
                        lastCode = lastItem.sod_code;
                    }
                    var sod = new PurchaseBaseClass
                    {
                        SodName = sodName,
                        SupId = sup.sup_id,
                        SubSupId = sup.sup_id,
                        SocId = socId,
                        CurId = sup.cur_id,
                        DateCreation = now,
                        DateUpdate = now,
                        UsrId = usrId,
                        VatId = sup.vat_id,
                        TotalAmountHt = 0,
                        TotalAmountTtc = 0
                    };
                    string pref = GetCodePref(7);
                    sod.SodCode = GetGeneralRefContinuation(sod.DateCreation, pref, lastCode, _codeType, sup.sup_id);
                    var aSod = PurchaseBaseTranslator.EntityToRepository(sod, (TM_SOD_Supplier_Order)null, true);
                    _db.TM_SOD_Supplier_Order.AddObject(aSod);
                    _db.SaveChanges();
                    sod_Id = aSod.sod_id;

                    foreach (var onepil in pils)
                    {
                        onepil.SodId = sod_Id;
                        onepil.DateCreation = now;
                        var aSol = PurchaseBaseLineTranslator.EntityToRepositorySol(onepil, create: true);
                        _db.TM_SOL_SupplierOrder_Lines.AddObject(aSol);
                    }
                    _db.SaveChanges();
                }
            }
            return sod_Id;
        }

        #region Sod Payment

        public List<int> SaveUpdateSodPayment(List<KeyValue> sodPrds)
        {
            var sprIds = new List<int>();

            // update sol payment
            var sol2Update = sodPrds.Where(l => l.Key3 > 0).ToList();
            if (sol2Update.Any())
            {
                var sols = (from sol2up in sol2Update
                            join sol in _db.TM_SOL_SupplierOrder_Lines on sol2up.Key3 equals sol.sol_id
                            select new { sol2up, sol }).ToList();
                foreach (var onesol in sols)
                {
                    if (onesol.sol2up.Key2 > 0)
                    {
                        // update sol payment
                        var oldsolpayment =
                            _db.TR_SPR_SupplierOrder_Payment_Record.FirstOrDefault(
                                l => l.spr_id == onesol.sol2up.Key2 && l.sol_id == onesol.sol2up.Key3);
                        if (oldsolpayment != null)
                        {
                            onesol.sol.sol_paid = (onesol.sol.sol_paid ?? 0) - oldsolpayment.spr_amount + onesol.sol2up.DcValue;
                            onesol.sol.sol_need2pay = (onesol.sol.sol_need2pay ?? (onesol.sol.sol_total_price ?? 0)) + oldsolpayment.spr_amount - onesol.sol2up.DcValue;
                            if (onesol.sol.sol_need2pay < 0)
                            {
                                onesol.sol.sol_need2pay = 0;
                            }
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol.sol);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // insert sol payment
                        onesol.sol.sol_paid = (onesol.sol.sol_paid ?? 0) + onesol.sol2up.DcValue;
                        onesol.sol.sol_need2pay = (onesol.sol.sol_need2pay ?? (onesol.sol.sol_total_price ?? 0)) - onesol.sol2up.DcValue;
                        if (onesol.sol.sol_need2pay < 0)
                        {
                            onesol.sol.sol_need2pay = 0;
                        }
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol.sol);
                        _db.SaveChanges();
                    }
                }
            }

            // to insert
            var newGuid = Guid.NewGuid().ToString();
            var sprsnew = Enumerable.Select(sodPrds.Where(l => l.Key2 == 0), m => new TR_SPR_SupplierOrder_Payment_Record
            {
                spr_d_creation = DateTime.Now,
                spr_d_update = DateTime.Now,
                spr_d_payment = m.DValue,
                spr_amount = m.DcValue,
                sod_id = m.Key,
                sol_id = m.Key3 != 0 ? Convert.ToInt32(m.Key3) : (int?)null,
                spr_comment = m.Value,
                spr_payer = m.KeyStr1,
                spr_payment_code = m.KeyStr2,
                spr_guid = newGuid
            }).ToList();

            var sodsprNew = sodPrds.Where(l => l.Key2 == 0);
            foreach (var onespr in sodsprNew)
            {
                UpdateSodAmountAfterPayment(onespr.Key, onespr.DcValue);
            }
            foreach (var onespr in sprsnew)
            {
                _db.TR_SPR_SupplierOrder_Payment_Record.AddObject(onespr);
                _db.SaveChanges();
                sprIds.Add(onespr.spr_id);
            }

            // to update
            var sprs2Update = Enumerable.Select(sodPrds.Where(l => l.Key2 > 0), m => new TR_SPR_SupplierOrder_Payment_Record
            {
                spr_d_creation = DateTime.Now,
                spr_d_update = DateTime.Now,
                spr_d_payment = m.DValue,
                spr_amount = m.DcValue,
                sod_id = m.Key,
                spr_comment = m.Value,
                sol_id = m.Key3 != 0 ? Convert.ToInt32(m.Key3) : (int?)null,
                spr_id = Convert.ToInt32(m.Key2),
                spr_payer = m.KeyStr1,
                spr_payment_code = m.KeyStr2,
            }).ToList();


            if (sprs2Update.Any())
            {
                var sprwithId = sodPrds.Where(l => l.Key2 > 0);
                var oldspr = (from sprid in sprwithId
                              join sprdb in _db.TR_SPR_SupplierOrder_Payment_Record on sprid.Key2 equals sprdb.spr_id
                              join sol in _db.TM_SOL_SupplierOrder_Lines on sprdb.sol_id equals sol.sol_id
                              into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              select new { sprdb, sprid, lj }).ToList();

                if (oldspr.Any())
                {
                    foreach (var oldsprnewspr in oldspr)
                    {
                        var oldvalue = oldsprnewspr.sprdb.spr_amount;
                        var newvalue = oldsprnewspr.sprid.DcValue;
                        // update sol
                        if (oldsprnewspr.lj != null)
                        {
                            oldsprnewspr.lj.sol_paid = (oldsprnewspr.lj.sol_paid ?? 0) - oldsprnewspr.sprdb.spr_amount +
                                                       oldsprnewspr.sprid.DcValue;
                            oldsprnewspr.lj.sol_need2pay = (oldsprnewspr.lj.sol_need2pay ??
                                                            (oldsprnewspr.lj.sol_total_price ?? 0)) +
                                                           oldsprnewspr.sprdb.spr_amount - oldsprnewspr.sprid.DcValue;
                            if (oldsprnewspr.lj.sol_need2pay < 0)
                            {
                                oldsprnewspr.lj.sol_need2pay = 0;
                            }
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(oldsprnewspr.lj);
                            _db.SaveChanges();
                        }
                        UpdateSodAmountAfterPayment(oldsprnewspr.sprid.Key, oldvalue, newvalue);
                        oldsprnewspr.sprdb.spr_amount = oldsprnewspr.sprid.DcValue;
                        oldsprnewspr.sprdb.spr_d_update = DateTime.Now;
                        oldsprnewspr.sprdb.spr_d_payment = oldsprnewspr.sprid.DValue;
                        oldsprnewspr.sprdb.spr_comment = oldsprnewspr.sprid.Value;
                        oldsprnewspr.sprdb.spr_payer = oldsprnewspr.sprid.KeyStr1;
                        oldsprnewspr.sprdb.spr_payment_code = oldsprnewspr.sprid.KeyStr2;
                        _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(oldsprnewspr.sprdb);
                        _db.SaveChanges();
                        sprIds.Add(oldsprnewspr.sprdb.spr_id);
                    }
                }
            }
            return sprIds.Distinct().ToList();
        }

        public List<KeyValue> GetSodPaymentsList(int socId, int sodId)
        {
            var sprs = (from sod in _db.TM_SOD_Supplier_Order
                        join spr in _db.TR_SPR_SupplierOrder_Payment_Record on sod.sod_id equals spr.sod_id
                        where sod.soc_id == socId && sod.sod_id == sodId
                        select spr).Select(l => new KeyValue
                        {
                            Key = l.spr_id,
                            DValue = l.spr_d_creation,
                            DValue2 = l.spr_d_payment,
                            DcValue = l.spr_amount,
                            Value = l.spr_comment,
                            Key2 = l.sol_id ?? 0,
                            DValue3 = l.spr_d_update,
                            Value2 = l.spr_file,
                            KeyStr1 = string.IsNullOrEmpty(l.spr_payer) ? "" : l.spr_payer,
                            KeyStr2 = string.IsNullOrEmpty(l.spr_payment_code) ? "" : l.spr_payment_code,
                        }).OrderBy(l => l.Key).ToList();

            // get sod balance
            var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (onesod != null)
            {
                var sodinfo = new KeyValue
                {
                    Key = 0,
                    Key2 = 0,
                    DcValue = onesod.sod_total_ht ?? 0,
                    DcValue2 = onesod.sod_total_ttc ?? 0,
                    DcValue3 = onesod.sod_need2pay ?? 0,
                    DcValue4 = sprs.Sum(k => k.DcValue),
                    Value = onesod.TR_CUR_Currency.cur_symbol
                };
                sprs.Add(sodinfo);
            }
            return sprs;
        }

        public void UpdateSodPaymentFile(List<int> sprId, string filePath)
        {
            var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Where(l => sprId.Contains(l.spr_id)).ToList();
            foreach (var onespr in sprs)
            {
                var oldPath = onespr.spr_file;
                CommonRepository.DeleteFile(oldPath);
                onespr.spr_file = filePath;
                _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
        }

        public List<KeyValue> GetSodByPaymentRecord(List<int> sprIds)
        {
            var sodIds =
                _db.TR_SPR_SupplierOrder_Payment_Record.Where(l => sprIds.Contains(l.spr_id) && l.sod_id.HasValue)
                    .Select(l => new KeyValue { Key = l.sod_id.Value, Key2 = l.spr_id })
                    .Distinct()
                    .ToList();
            return sodIds;
        }

        public KeyValue LoadSodePaymentFile(int socId, int sodId, int sprId)
        {
            var cpy = _db.TR_SPR_SupplierOrder_Payment_Record.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.soc_id == socId && m.spr_id == sprId).Select(m => new KeyValue
            {
                Value = m.spr_file,
                Value2 = m.spr_comment
            }).FirstOrDefault();
            return cpy;
        }

        /// <summary>
        /// update HT for supplier order
        /// </summary>
        /// <param name="sodId"></param>
        public void UpdateSodAmountAfterPayment(int sodId, decimal amount)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.sod_id == sodId);
            if (sod != null)
            {
                var solAmtHt = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_price != null).Sum(m => m.sol_total_price);
                var solAmtTTC = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_crude_price != null).Sum(m => m.sol_total_crude_price);
                var hasPaidSum = _db.TR_SPR_SupplierOrder_Payment_Record.Where(m => m.sod_id == sod.sod_id).ToList().Sum(m => m.spr_amount);
                var hasPaid = hasPaidSum + amount;
                var need2Pay = solAmtHt - hasPaidSum - amount;
                sod.sod_paid = Math.Round(hasPaid, 3);
                sod.sod_need2pay = need2Pay.HasValue ? Math.Round(need2Pay.Value, 3) : (decimal?)null;
                sod.sod_total_ht = solAmtHt.HasValue ? Math.Round(solAmtHt.Value, 3) : (decimal?)null;
                sod.sod_total_ttc = solAmtTTC.HasValue ? Math.Round(solAmtTTC.Value, 3) : (decimal?)null;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        public void UpdateSodAmountAfterPayment(int sodId, decimal oldAmount, decimal newAmount)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.sod_id == sodId);
            if (sod != null)
            {
                var solAmtHt = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_price != null).Sum(m => m.sol_total_price);
                var solAmtTTC = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_crude_price != null).Sum(m => m.sol_total_crude_price);
                var hasPaidSum = _db.TR_SPR_SupplierOrder_Payment_Record.Where(m => m.sod_id == sod.sod_id).ToList().Sum(m => m.spr_amount);
                var hasPaid = hasPaidSum - oldAmount + newAmount;
                var need2Pay = solAmtHt - hasPaidSum + oldAmount - newAmount;
                sod.sod_paid = Math.Round(hasPaid, 3);
                sod.sod_need2pay = need2Pay.HasValue ? Math.Round(need2Pay.Value, 3) : (decimal?)null;
                sod.sod_total_ht = solAmtHt.HasValue ? Math.Round(solAmtHt.Value, 3) : (decimal?)null;
                sod.sod_total_ttc = solAmtTTC.HasValue ? Math.Round(solAmtTTC.Value, 3) : (decimal?)null;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// Modify one paiement HT for supplier order
        /// </summary>
        /// <param name="sodId"></param>
        public void ModifySodAmountAfterPayment(int sodId, decimal amount)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.sod_id == sodId);
            if (sod != null)
            {
                var solAmtHt = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_price != null).Sum(m => m.sol_total_price);
                var solAmtTTC = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_crude_price != null).Sum(m => m.sol_total_crude_price);
                var hasPaidSum = _db.TR_SPR_SupplierOrder_Payment_Record.Where(m => m.sod_id == sod.sod_id).ToList().Sum(m => m.spr_amount);
                var hasPaid = hasPaidSum + amount;
                var need2Pay = solAmtHt - hasPaidSum - amount;
                sod.sod_paid = Math.Round(hasPaid, 3);
                sod.sod_need2pay = need2Pay.HasValue ? Math.Round(need2Pay.Value, 3) : (decimal?)null;
                sod.sod_total_ht = solAmtHt.HasValue ? Math.Round(solAmtHt.Value, 3) : (decimal?)null;
                sod.sod_total_ttc = solAmtTTC.HasValue ? Math.Round(solAmtTTC.Value, 3) : (decimal?)null;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        public void UpdateSodAmountBySol(int sodId)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.sod_id == sodId);
            if (sod != null)
            {
                var solAmtHt = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_price != null).Sum(m => m.sol_total_price);
                var solAmtTTC = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id && m.sol_total_crude_price != null).Sum(m => m.sol_total_crude_price);
                var hasPaidSum = _db.TR_SPR_SupplierOrder_Payment_Record.Where(m => m.sod_id == sod.sod_id).ToList().Sum(m => m.spr_amount);
                var hasPaid = hasPaidSum;
                var need2Pay = solAmtHt - hasPaidSum;
                sod.sod_paid = Math.Round(hasPaid, 3);
                sod.sod_need2pay = need2Pay.HasValue ? Math.Round(need2Pay.Value, 3) : (decimal?)null;
                sod.sod_total_ht = solAmtHt.HasValue ? Math.Round(solAmtHt.Value, 3) : (decimal?)null;
                sod.sod_total_ttc = solAmtTTC.HasValue ? Math.Round(solAmtTTC.Value, 3) : (decimal?)null;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        public int UpdateSprFile(int socId, int sodId, int sprId, string filePath)
        {
            int spr_id = 0;
            var onespr = _db.TR_SPR_SupplierOrder_Payment_Record.FirstOrDefault(l => l.sod_id == sodId && l.spr_id == sprId && l.TM_SOD_Supplier_Order.soc_id == socId);
            if (onespr != null)
            {
                spr_id = onespr.spr_id;
                var oldPath = onespr.spr_file;
                CommonRepository.DeleteFile(oldPath);
                onespr.spr_file = filePath;
                _db.TR_SPR_SupplierOrder_Payment_Record.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
            return spr_id;
        }

        public List<KeyValue> GetSupplierPaiment(int socId, bool subSup, bool sod2Pay, int supId, DateTime dFrom, DateTime dTo)
        {
            var allsods = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId
                                                               && (supId == 0 || l.sup_id == supId)
                                                               && (l.sod_d_creation >= dFrom)
                                                               && (l.sod_d_creation <= dTo)
                ).ToList().AsQueryable();
            var allSupIds = allsods.Select(l => l.sup_id).Distinct().ToList();
            var subsupId = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId && l.sub_sup_id.HasValue).Select(l => l.sub_sup_id.Value).Distinct().ToList();

            var allsupIds = new List<int>();
            allsupIds.AddRange(allSupIds);
            allsupIds.AddRange(subsupId);
            allsupIds = allsupIds.Distinct().ToList();

            var allsup = _db.TM_SUP_Supplier.Where(l => allsupIds.Contains(l.sup_id)).ToList();

            var result = new List<KeyValue>();
            if (subSup)
            {
                var supsod = allsods.Where(l => l.sub_sup_id.HasValue && subsupId.Contains(l.sub_sup_id.Value)).ToList();
                foreach (var subid in subsupId)
                {
                    var sods = supsod.Where(l => l.sub_sup_id == subid).ToList();
                    if (sods.Any())
                    {
                        var onesod = new KeyValue();
                        onesod.Key = 0;
                        onesod.Key2 = subid;
                        var sup = allsup.FirstOrDefault(l => l.sup_id == subid);
                        onesod.Value2 = sup != null ? sup.sup_company_name : string.Empty;
                        onesod.DcValue = sods.Where(l => l.sod_total_ht.HasValue).Sum(l => l.sod_total_ht.Value);
                        onesod.DcValue2 = sods.Where(l => l.sod_total_ttc.HasValue).Sum(l => l.sod_total_ttc.Value);
                        onesod.DcValue3 = sods.Where(l => l.sod_paid.HasValue).Sum(l => l.sod_paid.Value);
                        onesod.DcValue4 = sods.Where(l => l.sod_need2pay.HasValue).Sum(l => l.sod_need2pay.Value);
                        result.Add(onesod);
                    }
                }
            }
            else
            {
                var supsod = allsods.Where(l => allSupIds.Contains(l.sup_id)).ToList();
                foreach (var supid in allSupIds)
                {
                    var sods = supsod.Where(l => l.sup_id == supid).ToList();
                    if (sods.Any())
                    {
                        var onesod = new KeyValue();
                        onesod.Key = supid;
                        onesod.Key2 = 0;
                        var sup = allsup.FirstOrDefault(l => l.sup_id == supid);
                        onesod.Value = sup != null ? sup.sup_company_name : string.Empty;
                        onesod.DcValue = sods.Where(l => l.sod_total_ht.HasValue).Sum(l => l.sod_total_ht.Value);
                        onesod.DcValue2 = sods.Where(l => l.sod_total_ttc.HasValue).Sum(l => l.sod_total_ttc.Value);
                        onesod.DcValue3 = sods.Where(l => l.sod_paid.HasValue).Sum(l => l.sod_paid.Value);
                        onesod.DcValue4 = sods.Where(l => l.sod_need2pay.HasValue).Sum(l => l.sod_need2pay.Value);
                        result.Add(onesod);
                    }
                }
            }
            if (sod2Pay)
            {
                result = result.Where(l => l.DcValue4 > 0).ToList();
            }
            result = result.OrderByDescending(l => l.DcValue4).ToList();
            return result;
        }

        public List<PurchaseBaseClass> GetSupplierPaymentDownload(int socId, bool subSup, bool sod2Pay, int supId, DateTime dFrom, DateTime dTo)
        {
            var allsods = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId && (supId == 0 || l.sup_id == supId) && (l.sod_d_creation >= dFrom) && (l.sod_d_creation <= dTo)).ToList().AsQueryable();
            var allSupIds = allsods.Select(l => l.sup_id).Distinct().ToList();
            var subsupId = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId && l.sub_sup_id.HasValue).Select(l => l.sub_sup_id.Value).Distinct().ToList();

            var allsupIds = new List<int>();
            allsupIds.AddRange(allSupIds);
            allsupIds.AddRange(subsupId);
            allsupIds = allsupIds.Distinct().ToList();

            var allsup = _db.TM_SUP_Supplier.Where(l => allsupIds.Contains(l.sup_id)).ToList();

            var result = new List<PurchaseBaseClass>();
            if (subSup)
            {
                //var supsod = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId && l.sub_sup_id.HasValue && subsupId.Contains(l.sub_sup_id.Value)).ToList();
                var supsod = allsods.Where(l => l.sub_sup_id.HasValue && subsupId.Contains(l.sub_sup_id.Value)).ToList();
                foreach (var subid in subsupId)
                {
                    var sods = supsod.Where(l => l.sub_sup_id == subid).ToList();
                    if (sods.Any())
                    {
                        var onesod = new PurchaseBaseClass();
                        onesod.SupId = 0; // sup id
                        onesod.SubSupId = subid; // sub sup id
                        var sup = allsup.FirstOrDefault(l => l.sup_id == subid);
                        onesod.SupplierCompanyName = sup != null ? sup.sup_company_name : string.Empty;
                        onesod.TotalAmountHt = sods.Where(l => l.sod_total_ht.HasValue).Sum(l => l.sod_total_ht.Value);
                        onesod.TotalAmountTtc = sods.Where(l => l.sod_total_ttc.HasValue).Sum(l => l.sod_total_ttc.Value);
                        onesod.Paid = sods.Where(l => l.sod_paid.HasValue).Sum(l => l.sod_paid.Value);
                        onesod.Need2Pay = sods.Where(l => l.sod_need2pay.HasValue).Sum(l => l.sod_need2pay.Value);

                        // Get payment records
                        var sodids = sods.Select(l => l.sod_id).ToList();
                        var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Join(
                            sodids,
                            spr => spr.sod_id,
                            sod => sod,
                            (spr, sod) => spr
                            ).Select(l => new PurchaseLineBaseClass()
                            {
                                SupplierCompanyName = onesod.SupplierCompanyName,
                                SodCode = l.TM_SOD_Supplier_Order.sod_code,
                                SodName = l.TM_SOD_Supplier_Order.sod_name,
                                DateCreation = l.spr_d_payment,
                                TotalPrice = l.spr_amount,
                                Comment = l.spr_comment
                            }).ToList();
                        result.Add(onesod);
                    }
                }
            }
            else
            {
                //var supsod = _db.TM_SOD_Supplier_Order.Where(l => l.soc_id == socId && allSupIds.Contains(l.sup_id)).ToList();
                var supsod = allsods.Where(l => allSupIds.Contains(l.sup_id)).ToList();
                foreach (var supid in allSupIds)
                {
                    var sods = supsod.Where(l => l.sup_id == supid).ToList();
                    if (sods.Any())
                    {
                        var onesod = new PurchaseBaseClass();
                        onesod.SupId = supid;
                        onesod.SubSupId = 0;
                        var sup = allsup.FirstOrDefault(l => l.sup_id == supid);
                        onesod.SupplierCompanyName = sup != null ? sup.sup_company_name : string.Empty;
                        onesod.TotalAmountHt = sods.Where(l => l.sod_total_ht.HasValue).Sum(l => l.sod_total_ht.Value);
                        onesod.TotalAmountTtc = sods.Where(l => l.sod_total_ttc.HasValue).Sum(l => l.sod_total_ttc.Value);
                        onesod.Paid = sods.Where(l => l.sod_paid.HasValue).Sum(l => l.sod_paid.Value);
                        onesod.Need2Pay = sods.Where(l => l.sod_need2pay.HasValue).Sum(l => l.sod_need2pay.Value);

                        // Get payment records
                        var sodids = sods.Select(l => l.sod_id).ToList();
                        //var sprs = _db.TR_SPR_SupplierOrder_Payment_Record.Join(
                        //    sodids,
                        //    spr => spr.sod_id,
                        //    sod => sod,
                        //    (spr, sod) => spr
                        //    ).Select(l => new PurchaseLineBaseClass()
                        //    {
                        //        SupplierCompanyName = onesod.SupplierCompanyName,
                        //        SodCode = l.TM_SOD_Supplier_Order.sod_code,
                        //        SodName = l.TM_SOD_Supplier_Order.sod_name,
                        //        DateCreation = l.spr_d_payment,
                        //        TotalPrice = l.spr_amount,
                        //        Comment = l.spr_comment
                        //    }).ToList();
                        //20200119
                        var sprs = (from sodid in sodids
                                    join spr in _db.TR_SPR_SupplierOrder_Payment_Record
                                        on sodid equals spr.sod_id
                                    select new PurchaseLineBaseClass()
                                    {
                                        SupplierCompanyName = onesod.SupplierCompanyName,
                                        SodCode = spr.TM_SOD_Supplier_Order.sod_code,
                                        SodName = spr.TM_SOD_Supplier_Order.sod_name,
                                        DateCreation = spr.spr_d_payment,
                                        TotalPrice = spr.spr_amount,
                                        Comment = spr.spr_comment
                                    }).ToList();
                        onesod.PurchaseLines = sprs;
                        result.Add(onesod);
                    }
                }
            }
            if (sod2Pay)
            {
                result = result.Where(l => l.Need2Pay > 0).ToList();
            }
            result = result.OrderByDescending(l => l.Need2Pay).ToList();
            return result;

        }

        #endregion Sod Payment

        #region Sod Document

        public List<KeyValue> GetSdcs(List<int> sdcIds)
        {
            var sodIds =
                _db.TR_SDC_Supplier_Order_Document.Where(l => sdcIds.Contains(l.sdc_id))
                    .Select(l => new KeyValue { Key = l.sod_id, Key2 = l.sdc_id })
                    .Distinct()
                    .ToList();
            return sodIds;
        }

        public List<int> SaveUpdateSodDoc(List<KeyValue> sodDocs)
        {
            var sdcIds = new List<int>();

            // to insert
            var sdcnew = Enumerable.Select(sodDocs.Where(l => l.Key2 == 0), m => new TR_SDC_Supplier_Order_Document()
            {
                sdc_d_creation = DateTime.Now,
                sdc_d_update = DateTime.Now,
                sod_id = m.Key,
                sdc_comment = m.Value,
            }).ToList();

            foreach (var onespr in sdcnew)
            {
                _db.TR_SDC_Supplier_Order_Document.AddObject(onespr);
                _db.SaveChanges();
                sdcIds.Add(onespr.sdc_id);
            }

            // to update
            var sprwithId = sodDocs.Where(l => l.Key2 > 0);
            var oldsdc = (from sprid in sprwithId
                          join sprdb in _db.TR_SDC_Supplier_Order_Document on sprid.Key2 equals sprdb.sdc_id
                          select new { sprdb, sprid }).ToList();
            foreach (var onesdc in oldsdc)
            {
                onesdc.sprdb.sdc_comment = onesdc.sprid.Value;
                onesdc.sprdb.sdc_d_update = onesdc.sprid.DValue;
                _db.TR_SDC_Supplier_Order_Document.ApplyCurrentValues(onesdc.sprdb);
                sdcIds.Add(onesdc.sprdb.sdc_id);
            }
            _db.SaveChanges();

            return sdcIds.Distinct().ToList();
        }

        public List<KeyValue> GetSodDocList(int socId, int sodId)
        {
            var sprs = (from sod in _db.TM_SOD_Supplier_Order
                        join spr in _db.TR_SDC_Supplier_Order_Document on sod.sod_id equals spr.sod_id
                        where sod.soc_id == socId && sod.sod_id == sodId
                        select spr).Select(l => new KeyValue
                        {
                            Key = l.sdc_id,
                            DValue = l.sdc_d_creation,
                            Value = l.sdc_comment,
                            DValue2 = l.sdc_d_update ?? l.sdc_d_creation,
                            Value2 = l.sdc_file
                        }).OrderBy(l => l.Key).ToList();
            return sprs;
        }

        public List<KeyValue> GetSodDocListForSup(int supId, int sodId)
        {
            var sprs = (from sod in _db.TM_SOD_Supplier_Order
                        join spr in _db.TR_SDC_Supplier_Order_Document on sod.sod_id equals spr.sod_id
                        where sod.sup_id == supId && sod.sod_id == sodId
                        select spr).Select(l => new KeyValue
                        {
                            Key = l.sdc_id,
                            DValue = l.sdc_d_creation,
                            Value = l.sdc_comment,
                            DValue2 = l.sdc_d_update ?? l.sdc_d_creation,
                            Value2 = l.sdc_file
                        }).OrderBy(l => l.Key).ToList();
            return sprs;
        }


        public void UpdateSodDocFiles(List<int> sdcIds, string filePath)
        {
            var sprs = _db.TR_SDC_Supplier_Order_Document.Where(l => sdcIds.Contains(l.sdc_id)).ToList();
            foreach (var onespr in sprs)
            {
                var oldPath = onespr.sdc_file;
                CommonRepository.DeleteFile(oldPath);
                onespr.sdc_file = filePath;
                _db.TR_SDC_Supplier_Order_Document.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
        }

        public KeyValue LoadSodDocFile(int socId, int sodId, int sdcId)
        {
            var cpy = _db.TR_SDC_Supplier_Order_Document.Where(m => m.sod_id == sodId && m.TM_SOD_Supplier_Order.soc_id == socId && m.sdc_id == sdcId).Select(m => new KeyValue
            {
                Value = m.sdc_file,
                Value2 = m.sdc_comment
            }).FirstOrDefault();
            return cpy;
        }

        public int UpdateSdcFile(int socId, int sodId, int sdcId, string filePath)
        {
            int sdc_id = 0;
            var onespr = _db.TR_SDC_Supplier_Order_Document.FirstOrDefault(l => l.sod_id == sodId && l.sdc_id == sdcId && l.TM_SOD_Supplier_Order.soc_id == socId);
            if (onespr != null)
            {
                sdc_id = onespr.sdc_id;
                var oldPath = onespr.sdc_file;
                CommonRepository.DeleteFile(oldPath);
                onespr.sdc_file = filePath;
                _db.TR_SDC_Supplier_Order_Document.ApplyCurrentValues(onespr);
                _db.SaveChanges();
            }
            return sdc_id;
        }

        #endregion Sod Document

        public List<PurchaseBaseClass> GetSodBySupId(int socId, int supId, bool isSub)
        {
            var sods =
                _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId &&
                    (
                    (!isSub && m.sup_id == supId)
                    ||
                    (isSub && m.sub_sup_id == supId)
                    )
                    )
                    .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                    .ToList();
            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            return sods;
        }

        public List<PurchaseBaseClass> GetSodBySupIdWithDate(int socId, int supId, bool isSub, DateTime DStart, DateTime DEnd)
        {
            var sods =
                _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId &&
                    (
                    (!isSub && m.sup_id == supId)
                    ||
                    (isSub && m.sub_sup_id == supId)
                    )
                    && m.sod_d_creation >= DStart
                    && m.sod_d_creation <= DEnd
                    )
                    .Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                    .ToList();
            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            return sods;
        }


        public List<PurchaseBaseClass> GetSodByKeyword(int socId, string keyword, int sodId, bool withLines = false, int lgsId = 0)
        {
            int supId = 0;
            if (lgsId != 0)
            {
                var lgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.lgs_id == lgsId);
                if (lgs != null) { supId = lgs.sup_id ?? 0; }
            }
            var sodsindb = _db.TM_SOD_Supplier_Order.Where(l =>
                l.soc_id == socId
                && (l.sod_id != sodId)
                && (supId == 0 || l.sup_id == supId)
                &&
                (l.sod_code.Contains(keyword)
                || l.sod_name.Contains(keyword)
                || l.TM_SUP_Supplier.sup_company_name.Contains(keyword)
                || l.TM_SUP_Supplier_1.sup_company_name.Contains(keyword)));


            var sodcin = (from asod in sodsindb
                          join cin in _db.TM_CIN_Client_Invoice on asod.cin_id equals cin.cin_id
                              into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          select new { asod, lj });

            var sods = sodsindb.Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList().Skip(0).Take(20).ToList();

            var alllines = new List<PurchaseLineBaseClass>();
            if (withLines)
            {
                alllines = (from onesod in sods
                            join sol in _db.TM_SOL_SupplierOrder_Lines
                                on onesod.SodId equals sol.sod_id
                            where sol.sol_logistic != "0" // 20230209 不显示不需要运输的行
                            select sol).AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();
            }

            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                m.SodCode = string.Format("{0} | {1} | {2:n2} {3}", m.SodCode, m.SodName, m.TotalAmountHt, m.CurrencySymbol);
                m.Supplier = string.Format("{0}######{1}", m.OneSupplier.CompanyName, m.TwoSupplier.CompanyName);
                var onecin = sodcin.FirstOrDefault(l => l.asod.sod_id == m.SodId);
                if (onecin != null && onecin.lj != null)
                {
                    m.CinId = onecin.lj.cin_id;
                    m.CinCode = onecin.lj.cin_code;
                    m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                }
                if (withLines)
                {
                    m.PurchaseLines = alllines.Where(l => l.SodId == m.SodId).ToList();
                }
                //m.CinId = sodcin.FirstOrDefault(l=>l.asod.sod_id==m.SodId)
            });
            return sods;
        }

        public int ChangeSol2NewSod(int socId, int solId, int newSodId)
        {
            var sodId = 0;
            var oldSodId = 0;
            var onesol =
                _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(
                    l => l.sol_id == solId && l.TM_SOD_Supplier_Order.soc_id == socId);
            if (onesol != null)
            {
                oldSodId = onesol.sod_id;
                var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == newSodId);
                if (onesod != null)
                {
                    // 新的order
                    var sodsolcount = onesod.TM_SOL_SupplierOrder_Lines.Count;
                    onesol.sod_id = onesod.sod_id;
                    onesol.sol_d_update = DateTime.Now;
                    onesol.sol_order = sodsolcount + 1;
                    _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                    _db.SaveChanges();
                    sodId = onesod.sod_id;
                }
                // 20230209 update date amount after sol change
                UpdateSodAmountBySol(oldSodId);
                UpdateSodAmountBySol(sodId);
            }

            return sodId;
        }

        /// <summary>
        /// 20250107 Batch copy and import new SOD
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="solIds"></param>
        /// <param name="newSodId"></param>
        /// <returns></returns>
        public int CopyAndChangeSol2NewSod(int socId, List<int> solIds, int newSodId)
        {
            var sodId = 0;
            var oldSodId = 0;
            var oldSols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                           join solid in solIds on sol.sol_id equals solid
                           where sol.TM_SOD_Supplier_Order.soc_id == socId
                           select sol).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();

            var newSolIds = new List<int>();
            if (oldSols.Any())
            {
                foreach (var oldsol in oldSols)
                {
                    var newSol = ObjectCopier.DeepCopy(oldsol);
                    newSol.SolId = 0;
                    //newSol.Order = onesol.Order + 1;
                    // calculate order
                    newSol.Transporter = null;
                    newSol.LogsNbr = null;
                    int solsCount = _db.TM_SOL_SupplierOrder_Lines.Count(l => l.sod_id == oldsol.SodId);
                    newSol.Order = solsCount + 1;
                    newSol.DateCreation = DateTime.Now;
                    newSol.DUpdate = DateTime.Now;
                    var aCln = PurchaseBaseLineTranslator.EntityToRepositorySol(newSol, create: true);
                    _db.TM_SOL_SupplierOrder_Lines.AddObject(aCln);
                    _db.SaveChanges();
                    int sol_id = aCln.sol_id;
                    newSolIds.Add(sol_id);
                }
            }
            var sols = (from sol in _db.TM_SOL_SupplierOrder_Lines
                        join solid in newSolIds on sol.sol_id equals solid
                        where sol.TM_SOD_Supplier_Order.soc_id == socId
                        select sol).ToList();
            if (sols.Any())
            {
                foreach (var onesol in sols)
                {
                    oldSodId = onesol.sod_id;
                    var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == newSodId);
                    if (onesod != null)
                    {
                        // 新的order
                        var sodsolcount = onesod.TM_SOL_SupplierOrder_Lines.Count;
                        onesol.sod_id = onesod.sod_id;
                        onesol.sol_d_update = DateTime.Now;
                        onesol.sol_order = sodsolcount + 1;
                        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
                        _db.SaveChanges();
                        sodId = onesod.sod_id;
                    }
                }
                // 20230209 update date amount after sol change
                UpdateSodAmountBySol(oldSodId);
                UpdateSodAmountBySol(sodId);
            }

            //if (onesol != null)
            //{
            //    oldSodId = onesol.sod_id;
            //    var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == newSodId);
            //    if (onesod != null)
            //    {
            //        // 新的order
            //        var sodsolcount = onesod.TM_SOL_SupplierOrder_Lines.Count;
            //        onesol.sod_id = onesod.sod_id;
            //        onesol.sol_d_update = DateTime.Now;
            //        onesol.sol_order = sodsolcount + 1;
            //        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(onesol);
            //        _db.SaveChanges();
            //        sodId = onesod.sod_id;
            //    }
            //    // 20230209 update date amount after sol change
            //    UpdateSodAmountBySol(oldSodId);
            //    UpdateSodAmountBySol(sodId);
            //}

            return sodId;
        }

        /// <summary>
        /// 20201025 从Sod 新建 Cin
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="sodId"></param>
        /// <param name="cliId"></param>
        /// <param name="usrId"></param>
        /// <param name="commisionText">Commission的文字</param>
        /// <param name="coefCom">Commssion 占总体的百分比</param> 
        /// <param name="withCom">是否有Com</param> 
        /// <returns></returns>
        public int CreateCinFromSod(int socId, int sodId, int cliId, int usrId, int cinBank, decimal coef, int oldCinId, DateTime? dCreate, string cinCode, string commisionText, decimal coefCom, bool withCom, int curId, string cinName)
        {
            int cinId = 0;
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (sod != null)
            {
                TM_CLI_CLient client;
                var sols = _db.TM_SOL_SupplierOrder_Lines.Where(m => m.sod_id == sod.sod_id).OrderBy(l => l.sol_order).ToList();
                decimal coefsodcin = coef;
                var oldcin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => (l.cin_code == cinCode || l.cin_id == oldCinId) && l.soc_id == socId);
                if (oldcin != null)
                {
                    // 插入已有CIN
                    cinId = oldcin.cin_id;
                    if (!string.IsNullOrEmpty(cinName))
                    {
                        oldcin.cin_name = cinName;
                        _db.TM_CIN_Client_Invoice.ApplyCurrentValues(oldcin);
                        _db.SaveChanges();
                    }
                    client = oldcin.TM_CLI_CLient;
                    // 20210118 commented out for TR_CSO
                    //oldcin.sod_id = sod.sod_id;
                    //_db.TM_CIN_Client_Invoice.ApplyCurrentValues(oldcin);
                    //_db.SaveChanges();
                    var csos =
                        _db.TR_CSO_ClientInvoice_SupplierOrder.FirstOrDefault(
                            l => l.cin_id == oldcin.cin_id && l.sod_id == sod.sod_id);
                    if (csos == null)
                    {
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = oldcin.cin_id, sod_id = sod.sod_id };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }
                }
                else
                {
                    // create cin
                    client = _db.TM_CLI_CLient.FirstOrDefault(l => l.cli_id == cliId);
                    var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(l => l.cli_id == cliId);
                    if (client != null)
                    {
                        var now = DateTime.Now;
                        var onecin = new TM_CIN_Client_Invoice()
                        {
                            cin_code = GenerateCinCode(socId, true, cliId, dCreate),
                            cod_id = null,
                            cli_id = cliId,
                            cin_d_creation = dCreate ?? now,
                            cin_d_update = dCreate ?? now,
                            cin_d_invoice = dCreate ?? now,
                            usr_creator_id = usrId,
                            cur_id = curId,
                            cin_account = false,
                            cin_d_term = now.AddMonths(1),
                            pco_id = client.pco_id,
                            pmo_id = client.pmo_id,
                            cin_isinvoice = true,
                            vat_id = client.vat_id,
                            prj_id = null,
                            dfo_id = null,
                            soc_id = socId,
                            cin_name = string.IsNullOrEmpty(cinName) ? ("FOR " + sod.sod_code) : cinName,
                            cin_discount_amount = 0,
                            cin_discount_percentage = 0,
                            cin_avoir_id = null,
                            cin_invoiced = false,
                            sod_id = sodId,
                            cin_bank = cinBank,
                            // 20210218
                            usr_com_1 = usrId
                        };
                        if (cco != null)
                        {
                            onecin.cin_inv_cco_firstname = cco.cco_firstname;
                            onecin.cin_inv_cco_lastname = cco.cco_lastname;
                            onecin.cin_inv_cco_address1 = cco.cco_address1;
                            onecin.cin_inv_cco_address2 = cco.cco_address2;
                            onecin.cin_inv_cco_postcode = cco.cco_postcode;
                            onecin.cin_inv_cco_city = cco.cco_city;
                            onecin.cin_inv_cco_country = cco.cco_country;
                            onecin.cin_inv_cco_tel1 = cco.cco_tel1;
                            onecin.cin_inv_cco_fax = cco.cco_fax;
                            onecin.cin_inv_cco_cellphone = cco.cco_cellphone;
                            onecin.cin_inv_cco_email = cco.cco_email;
                        }
                        _db.TM_CIN_Client_Invoice.AddObject(onecin);
                        _db.SaveChanges();
                        cinId = onecin.cin_id;

                        // 20210118
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = cinId, sod_id = sod.sod_id };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }
                }

                if (cinId != 0)
                {
                    // create cii
                    var ciilist = new List<ClientInvoiceLine>();
                    var lastcii = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cinId).OrderByDescending(l => l.cii_level1).FirstOrDefault();
                    var lastciiLevel1 = lastcii != null ? (lastcii.cii_level1 + 1) : 1;
                    decimal totalPriceCrudeForCommission = 0;
                    foreach (var onesol in sols)
                    {
                        // 20220815 sol to cii 的时候，将已有的，功率，driver，temp color，长宽高，光效，ugr，cir等信息添加进去
                        var specDescription = string.Empty;
                        if (!string.IsNullOrEmpty(onesol.sol_power) && onesol.sol_power != "0") { specDescription += string.Format("{0} : {1}W\r\n", "Power", onesol.sol_power); }
                        if (!string.IsNullOrEmpty(onesol.sol_driver)) { specDescription += string.Format("{0} : {1}\r\n", "Driver", onesol.sol_driver); }
                        if (!string.IsNullOrEmpty(onesol.sol_temp_color)) { specDescription += string.Format("{0} : {1}K\r\n", "Temp color", onesol.sol_temp_color); }
                        if (onesol.sol_length.HasValue && onesol.sol_length != 0) { specDescription += string.Format("{0} : {1:n0}mm\r\n", "Length", onesol.sol_length); }
                        if (onesol.sol_width.HasValue && onesol.sol_width != 0) { specDescription += string.Format("{0} : {1:n0}mm\r\n", "Width(Diameter)", onesol.sol_width); }
                        if (onesol.sol_height.HasValue && onesol.sol_height != 0) { specDescription += string.Format("{0} : {1:n0}mm\r\n", "Height", onesol.sol_height); }
                        if (onesol.sol_eff_lum.HasValue && onesol.sol_eff_lum != 0) { specDescription += string.Format("{0} ≥ {1:n0}Lum/W\r\n", "Light effect", onesol.sol_eff_lum); }
                        if (onesol.sol_ugr.HasValue && onesol.sol_ugr != 0) { specDescription += string.Format("{0} ≤ {1:n0}\r\n", "UGR", onesol.sol_ugr); }
                        if (onesol.sol_cri.HasValue && onesol.sol_cri != 0) { specDescription += string.Format("{0} ≥ {1:n0}\r\n", "CRI", onesol.sol_cri); }


                        var onecii = new ClientInvoiceLine()
                        {
                            CinId = cinId,
                            CiiLevel1 = lastciiLevel1,//onesol.sol_order,
                            //CiiDescription = onesol.sol_description,
                            CiiDescription = specDescription + onesol.sol_description,
                            PrdId = onesol.prd_id,
                            CiiRef = null,
                            CiiQuantity = onesol.sol_quantity,
                            VatId = client.vat_id,
                            DflId = null,
                            CiiLevel2 = 1,
                            CiiPurchasePrice = onesol.sol_unit_price,
                            CiiPrdName = string.IsNullOrEmpty(onesol.sol_prd_name) ? string.Empty : onesol.sol_prd_name,
                            CiiPrdDes = string.IsNullOrEmpty(onesol.sol_prd_des) ? string.Empty : onesol.sol_prd_des,
                            CiiDiscountAmount = 0,
                            CiiDiscountPercentage = 0,
                            PitId = onesol.pit_id,
                            LtpId = 2,
                            CiiAvId = null,
                            SolId = onesol.sol_id,
                            VatRate = client.TR_VAT_Vat.vat_vat_rate,
                            SocId = socId
                        };
                        onecii.CiiUnitPrice = (onesol.sol_unit_price * coefsodcin).HasValue
                            ? Math.Round((onesol.sol_unit_price * coefsodcin).Value, 3)
                            : 0;
                        onecii.CiiTotalPrice = onecii.CiiUnitPrice * onecii.CiiQuantity;
                        onecii.CiiTotalCrudePrice = onecii.CiiTotalPrice * (1 + client.TR_VAT_Vat.vat_vat_rate / 100);
                        totalPriceCrudeForCommission += onecii.CiiTotalCrudePrice ?? 0;
                        onecii.CiiPriceWithDiscountHt = onecii.CiiUnitPrice;
                        onecii.CiiMargin = (onecii.CiiUnitPrice - onesol.sol_unit_price) * onecii.CiiQuantity;
                        ciilist.Add(onecii);
                        //_db.TM_CII_ClientInvoice_Line.AddObject(onecii);
                        lastciiLevel1++;
                    }


                    // 20220822 添加Commission 行
                    if (withCom)
                    {
                        // 20251119 检查已有的cin 是否有transport 如果有的话，将直接合并
                        var transportline = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cinId && l.ltp_id == 7).FirstOrDefault();
                        if (transportline != null)
                        {
                            //transportline.
                            var comLine = new ClientInvoiceLine()
                            {
                                CinId = cinId,
                                CiiLevel1 = lastciiLevel1,//onesol.sol_order,
                                                          //CiiDescription = onesol.sol_description,
                                CiiDescription = commisionText,
                                PrdId = null,
                                CiiRef = null,
                                CiiQuantity = 1,
                                VatId = client.vat_id,
                                DflId = null,
                                CiiLevel2 = 1,
                                CiiPurchasePrice = 0,
                                CiiPrdName = commisionText,
                                CiiPrdDes = string.Empty,
                                CiiDiscountAmount = 0,
                                CiiDiscountPercentage = 0,
                                PitId = null,
                                LtpId = 7, // 20251119 transport， 方便之后合并
                                CiiAvId = null,
                                SolId = 0,
                                VatRate = client.TR_VAT_Vat.vat_vat_rate,
                                SocId = socId
                            };
                            //comLine.CiiUnitPrice = Math.Round(totalPriceCrudeForCommission * coefCom / 100, 3);
                            // 20251119 改变算法，从*改成/
                            comLine.CiiUnitPrice = Math.Round(totalPriceCrudeForCommission / (1 - coefCom / 100), 3) - totalPriceCrudeForCommission;
                            comLine.CiiTotalPrice = comLine.CiiUnitPrice * comLine.CiiQuantity;
                            comLine.CiiTotalCrudePrice = comLine.CiiTotalPrice;
                            totalPriceCrudeForCommission += comLine.CiiTotalCrudePrice ?? 0;
                            comLine.CiiPriceWithDiscountHt = comLine.CiiUnitPrice;
                            comLine.CiiMargin = comLine.CiiUnitPrice;
                            //
                            transportline.cii_unit_price += comLine.CiiUnitPrice ?? 0;
                            transportline.cii_total_price += comLine.CiiTotalPrice ?? 0;
                            transportline.cii_quantity = 1;
                            transportline.cii_price_with_discount_ht += comLine.CiiUnitPrice ?? 0;
                            transportline.cii_margin += comLine.CiiUnitPrice ?? 0;
                            transportline.cii_total_crude_price += comLine.CiiTotalCrudePrice ?? 0;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(transportline);
                        }
                        else
                        {
                            var comLine = new ClientInvoiceLine()
                            {
                                CinId = cinId,
                                CiiLevel1 = lastciiLevel1,//onesol.sol_order,
                                                          //CiiDescription = onesol.sol_description,
                                CiiDescription = commisionText,
                                PrdId = null,
                                CiiRef = null,
                                CiiQuantity = 1,
                                VatId = client.vat_id,
                                DflId = null,
                                CiiLevel2 = 1,
                                CiiPurchasePrice = 0,
                                CiiPrdName = commisionText,
                                CiiPrdDes = string.Empty,
                                CiiDiscountAmount = 0,
                                CiiDiscountPercentage = 0,
                                PitId = null,
                                LtpId = 7, // 20251119 transport， 方便之后合并
                                CiiAvId = null,
                                SolId = 0,
                                VatRate = client.TR_VAT_Vat.vat_vat_rate,
                                SocId = socId
                            };

                            // 20251119 改变算法，从*改成/
                            //comLine.CiiUnitPrice = Math.Round(totalPriceCrudeForCommission * coefCom / 100, 3);
                            comLine.CiiUnitPrice = Math.Round(totalPriceCrudeForCommission / (1 - coefCom / 100), 3) - totalPriceCrudeForCommission;
                            comLine.CiiTotalPrice = comLine.CiiUnitPrice * comLine.CiiQuantity;
                            comLine.CiiTotalCrudePrice = comLine.CiiTotalPrice;
                            totalPriceCrudeForCommission += comLine.CiiTotalCrudePrice ?? 0;
                            comLine.CiiPriceWithDiscountHt = comLine.CiiUnitPrice;
                            comLine.CiiMargin = comLine.CiiUnitPrice;
                            ciilist.Add(comLine);
                        }
                    }

                    //_db.SaveChanges();
                    if (ciilist.Any())
                    {
                        ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
                        ClientInvoiceLineRepository.InsertupdateCiis(ciilist);
                    }
                    sod.cin_id = cinId;
                    _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                    _db.SaveChanges();

                    // 20251119 将TRANSPORT 行放到最后，然后重新排序
                    var transportline2 = _db.TM_CII_ClientInvoice_Line.FirstOrDefault(l => l.cin_id == cinId && l.ltp_id == 7);
                    if (transportline2 != null)
                    {
                        var ciicount = _db.TM_CII_ClientInvoice_Line.Count(l => l.cin_id == cinId);
                        transportline2.cii_level1 = ciicount + 1;
                        _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(transportline2);
                        _db.SaveChanges();
                        ClientInvoiceLineRepository.CiiAutoSort(socId, cinId);
                    }
                }
            }
            return cinId;
        }

        private string GenerateCinCode(int socId, bool isInvoice, int cliId, DateTime? dCreate)
        {
            var now = DateTime.Now;
            var CinDCreation = dCreate ?? now;
            var lastCin = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && m.cin_isinvoice
            && m.cin_d_creation.Year == CinDCreation.Year
            && m.cin_d_creation.Month == CinDCreation.Month).OrderByDescending(m => m.cin_code).FirstOrDefault();
            var lastAvoir = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && !m.cin_isinvoice
                && m.cin_d_creation.Year == CinDCreation.Year
                && m.cin_d_creation.Month == CinDCreation.Month).OrderByDescending(m => m.cin_code).FirstOrDefault();
            string lastCode = string.Empty;

            var stravNewRule = ConfigurationSettings.AppSettings["AvNewRule"];
            bool avNewRule;
            bool.TryParse(stravNewRule, out avNewRule);
            // 新规则AV单另计数，老规则AV和FA混合计数
            if (avNewRule)
            {
                if (lastCin != null || lastAvoir != null)
                {
                    string cinnumber = "0";
                    string lastCinCode = "0";
                    string lastAvCode = "0";
                    string avoirnumber = "0";
                    if (lastCin != null)
                    {
                        //cinnumber = lastCin.cin_code.Substring(4, 7);
                        cinnumber = lastCin.cin_code.Substring(lastCin.cin_code.Length - 4);
                        lastCinCode = lastCin.cin_code;
                    }
                    if (lastAvoir != null)
                    {
                        //avoirnumber = lastAvoir.cin_code.Substring(4, 7);
                        avoirnumber = lastAvoir.cin_code.Substring(lastAvoir.cin_code.Length - 4);
                        lastAvCode = lastAvoir.cin_code;
                    }
                    int cinnb = Convert.ToInt32(cinnumber);
                    int avnb = Convert.ToInt32(avoirnumber);
                    //lastCode = cinnb > avnb ? lastCinCode : lastAvCode;
                    lastCode = isInvoice ? lastCinCode : lastAvCode;
                }
            }
            else
            {
                if (lastCin != null || lastAvoir != null)
                {
                    string cinnumber = "0";
                    string lastCinCode = "0";
                    string lastAvCode = "0";
                    string avoirnumber = "0";
                    if (lastCin != null)
                    {
                        //cinnumber = lastCin.cin_code.Substring(4, 7);
                        cinnumber = lastCin.cin_code.Substring(lastCin.cin_code.Length - 4);
                        lastCinCode = lastCin.cin_code;
                    }
                    if (lastAvoir != null)
                    {
                        //avoirnumber = lastAvoir.cin_code.Substring(4, 7);
                        avoirnumber = lastAvoir.cin_code.Substring(lastAvoir.cin_code.Length - 4);
                        lastAvCode = lastAvoir.cin_code;
                    }
                    int cinnb = Convert.ToInt32(cinnumber);
                    int avnb = Convert.ToInt32(avoirnumber);
                    lastCode = cinnb > avnb ? lastCinCode : lastAvCode;
                }
            }
            string pref = isInvoice ? GetCodePref(1) : GetCodePref(14);
            var cinCode = GetGeneralRefContinuation(CinDCreation, pref, lastCode, _codeType, cliId);
            return cinCode;
        }

        public List<PurchaseBaseClass> GetSodForCin(int socId, string sodcode, int supId)
        {
            var cins = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId
                && m.sod_code.Contains(sodcode)
                && (supId == 0 || m.sup_id == supId)
                ).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).OrderByDescending(m => m.SodCode).Skip(0).Take(15).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            return cins;
        }

        public void SetSodStart(int socId, int sodId)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (sod != null)
            {
                sod.sod_started = true;
                sod.sod_started_time = DateTime.Now;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        public void SetCancelStart(int socId, int sodId)
        {
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (sod != null)
            {
                sod.sod_canceled = true;
                sod.sod_canceled_time = DateTime.Now;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                _db.SaveChanges();
            }
        }

        public int UpdateSodSatus(int socId, int sodId, int sttId)
        {
            var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (onesod != null)
            {
                onesod.stt_id = sttId == 0 ? (int?)null : sttId;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(onesod);
                _db.SaveChanges();
            }
            return sodId;
        }

        public int CancelSod(int socId, int sodId, int isCancel)
        {
            var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (onesod != null)
            {
                onesod.sod_canceled = isCancel == 1;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(onesod);
                _db.SaveChanges();
            }
            return sodId;
        }

        public int UpdateSodExpDeliveryDate(int socId, int sodId, DateTime? expDeliveryDate)
        {
            var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.soc_id == socId && l.sod_id == sodId);
            if (onesod != null)
            {
                onesod.sod_d_exp_delivery = expDeliveryDate;
                _db.TM_SOD_Supplier_Order.ApplyCurrentValues(onesod);
                _db.SaveChanges();
            }
            return sodId;
        }

        #region Supplir order comment

        public int InsertUpdateSodCmt(KeyValue cta)
        {
            int ctaId = 0;
            if (cta.Key == 0)
            {
                // 新建
                var oneCta = new TR_CTA_Comment_TAG
                {
                    foreign_id = Convert.ToInt32(cta.Key2),
                    usr_id = Convert.ToInt32(cta.Key3),
                    cta_comment = cta.Value,
                    cta_tag = cta.Value2,
                    cta_date = DateTime.Now,
                    foreign_tag = 1,
                    cta_show_in_pdf = cta.Actived
                };
                _db.TR_CTA_Comment_TAG.AddObject(oneCta);
                _db.SaveChanges();
                ctaId = oneCta.cta_id;
            }
            else
            {
                var oneCta = _db.TR_CTA_Comment_TAG.FirstOrDefault(l => l.cta_id == cta.Key);
                if (oneCta != null)
                {
                    oneCta.cta_comment = cta.Value;
                    oneCta.cta_tag = cta.Value2;
                    oneCta.cta_show_in_pdf = cta.Actived;
                    _db.TR_CTA_Comment_TAG.ApplyCurrentValues(oneCta);
                    _db.SaveChanges();
                    ctaId = oneCta.cta_id;
                }
            }
            return ctaId;
        }

        public List<KeyValue> GetAllSodCmt(int sodId)
        {
            var ctaList = _db.TR_CTA_Comment_TAG.Where(l => l.foreign_tag == 1 && l.foreign_id == sodId)
                    .Select(l => new KeyValue
                    {
                        Key = l.cta_id,
                        Key2 = l.foreign_id,
                        Value = l.cta_comment,
                        Value2 = l.cta_tag,
                        DValue2 = l.cta_date,
                        Value3 = l.TM_USR_User.usr_firstname,
                        Actived = l.cta_show_in_pdf ?? false
                    }).OrderByDescending(l => l.DValue2)
                    .ToList();
            return ctaList;
        }

        #endregion Supplir order comment

        /// <summary>
        /// 获得于本Sod关联的Lgs 20211015
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="sodId"></param>
        /// <returns></returns>
        public List<KeyValue> GetRelatedLgs(int socId, int sodId)
        {
            var lgs = _db.TM_LGS_Logistic.Where(l => l.soc_id == socId && l.sod_id == sodId).ToList().Select(l => new KeyValue
            {
                Key = l.lgs_id,
                Value = l.lgs_code,
                Value2 = l.sup_id.HasValue ? l.TM_SUP_Supplier.sup_company_name : string.Empty,
                Key2 = l.sod_id ?? 0,
                Key3 = l.sup_id ?? 0,
                Value3 = StringCipher.EncoderSimple(l.lgs_id.ToString(), "lgsId")
            }).ToList();
            return lgs;
        }

        public List<PurchaseBaseClass> GetSodsForStt(int socId, int cliId, int supId, DateTime dFrom, DateTime dTo, int sttId = 0)
        {
            var sods = (from sod in _db.TM_SOD_Supplier_Order
                        where sod.soc_id == socId
                              && (cliId == 0 || sod.cli_id == cliId)
                              && (supId == 0 || sod.sup_id == supId)
                              && (sod.sod_d_creation >= dFrom) && (sod.sod_d_creation <= dTo)
                              && (sttId == 0 || sod.stt_id == sttId)
                        select sod).OrderByDescending(l => l.sod_code).Select(PurchaseBaseTranslator.RepositoryToEntitySodLite()).ToList();
            sods.ForEach(l => l.SodFId = StringCipher.EncoderSimple(l.SodId.ToString(), "sodId"));
            return sods.OrderByDescending(l => l.SodCode).ToList();
        }

        // 20230623 新增功能，生成支付详情，SOD和CIN一起的支付详情，可以出Apply for payment
        public List<SodCinResult> GetSodWithCinWithPaymentResults(int socId, int supId, int cliId, DateTime dFrom, DateTime dTo, int usrId, string sodcode)
        {
            DateTime createDateFrom = dFrom;
            DateTime createDateTo = dTo;
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);

            var sods = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId
                                                    && (supId == 0 || m.sup_id == supId) && (cliId == 0 || m.cli_id == cliId)
                                                    && (m.sod_d_creation >= createDateFrom) && (m.sod_d_creation <= createDateTo)
                                                    && (string.IsNullOrEmpty(sodcode) || m.sod_code.Contains(sodcode) || m.sod_name.Contains(sodcode))
                                                    )
                                                    .Select(PurchaseBaseTranslator.RepositoryToEntitySod()).ToList()
                                                    .Select(l => AutoCopy<PurchaseBaseClass, SodCinResult>(l))
                                                    .ToList();
            var sprs = (from onesod in sods
                        join onespr in _db.TR_SPR_SupplierOrder_Payment_Record
                            on onesod.SodId equals onespr.sod_id.Value
                        where onespr.sod_id.HasValue
                        select onespr).ToList();

            var sols = new List<PurchaseLineBaseClass>();

            sols = Queryable.Select((from pin in sods
                                     join sol in _db.TM_SOL_SupplierOrder_Lines on pin.SodId equals sol.sod_id
                                     select sol).AsQueryable(), PurchaseBaseLineTranslator.RepositoryToEntitySol()).OrderBy(l => l.Order).ToList();

            var cins = (from pin in sods
                        join cin in _db.TM_CIN_Client_Invoice on pin.CinId equals cin.cin_id
                        select cin).AsQueryable().Select(ClientInvoiceTranslator.RepositoryToEntity()).ToList();

            var cinids = cins.Select(l => l.CinId).Distinct().ToList();

            var ciis = (from cinid in cinids
                        join cii in _db.TM_CII_ClientInvoice_Line on cinid equals cii.cin_id
                        select cii).AsQueryable().Select(ClientInvoiceLineTranslator.RepositoryToEntity()).ToList();

            var cinswithpayment = (from cin in cinids
                                   join cpy in _db.TM_CPY_ClientInvoice_Payment
                                       on cin equals cpy.cin_id
                                   select cpy).ToList();

            cins.ForEach(l =>
            {
                l.FId = StringCipher.EncoderSimple(l.CinId.ToString(), "cinId");
                l.ClientInvoiceLines = ciis.Where(m => m.CinId == l.CinId).OrderBy(m => m.CiiLevel1).ThenBy(m => m.CiiLevel2).ToList();
                var genInfo = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, l.CinId);
                l.CinAmount = genInfo.TotalAmountHt * (l.CinAccount ? -1 : 1);
                l.TotalAmountTtc = genInfo.TotalAmountTtc * (l.CinAccount ? -1 : 1);
                l.CinPaid = cinswithpayment.Where(k => k.cin_id == l.CinId).Sum(k => k.cpy_amount);
                var cpyforcin = cinswithpayment.Where(m => m.cin_id == l.CinId).ToList();
                var paymentRecord = cpyforcin.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}\r\n",
                    oneSpr.cpy_d_create, oneSpr.cpy_comment, oneSpr.cpy_amount, l.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewCpyFile('" + l.FId + "','" + (StringCipher.EncoderSimple(oneSpr.cpy_id.ToString(), "cpyId")) + "')\">"),
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                l.CinPaymentRecord = paymentRecord;
            });

            sods.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                m.PinFId = StringCipher.EncoderSimple(m.PinId.ToString(), "pinId");
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                decimal totalHt;
                decimal totalTtc;
                // 20200106 已经有了支付环节，这一部分更新了
                // todo: 需要更新，当sol更新的时候
                //CalculateSodTotal(m.SodId, out totalHt, out totalTtc);
                //m.TotalAmountHt = totalHt;
                //m.TotalAmountTtc = totalTtc;
                var solsofsod = sols.Where(l => l.SodId == m.SodId).ToList();
                solsofsod.ForEach(onesol =>
                {
                    onesol.SodFId = StringCipher.EncoderSimple(onesol.SodId.ToString(), "sodId");
                    onesol.PrdFId = StringCipher.EncoderSimple(onesol.PrdId.ToString(), "prdId");
                    onesol.PitFId = StringCipher.EncoderSimple(onesol.PitId.ToString(), "pitId");
                    onesol.PinFId = StringCipher.EncoderSimple(onesol.PinId.ToString(), "pinId");
                });
                m.CinInfos = cins.Where(l => l.SodId == m.SodId).OrderBy(l => l.CinCode).ToList();
                m.PurchaseLines = solsofsod;

                var sodSprs = sprs.Where(l => l.sod_id == m.SodId).Distinct().OrderByDescending(l => l.spr_d_payment).ToList();
                var sodpaymentrecords = sodSprs.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}\r\n",
                    oneSpr.spr_d_payment, oneSpr.spr_payment_code, oneSpr.spr_amount, m.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewSprFile('" + m.SodFId + "'," + oneSpr.spr_id + ")\">"),
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                m.SodPaymentRecord = sodpaymentrecords;
            });
            return sods.OrderByDescending(l => l.SodCode).ToList();
        }

        public List<KeyValue> GetSodCode(List<int> sodIds)
        {
            var result = (from sodid in sodIds
                          join sod in _db.TM_SOD_Supplier_Order on sodid equals sod.sod_id
                          select new KeyValue
                          {
                              Key = sod.sod_id,
                              Value = sod.sod_code
                          }).ToList();
            return result;
        }
        /// <summary>
        /// 20241219 duplicate supplier order
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="sodId"></param>
        /// <returns></returns>
        public int DuplicateSupplierOrder(int socId, int sodId)
        {
            int newSodId = 0;
            var onesod = _db.TM_SOD_Supplier_Order.Where(l => l.sod_id == sodId && l.soc_id == socId).Select(PurchaseBaseTranslator.RepositoryToEntitySod()).FirstOrDefault();
            //var onesod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sod_id == sodId && l.soc_id == socId);
            if (onesod != null)
            {
                var newSod = ObjectCopier.DeepCopy(onesod);
                newSod.SodId = 0;
                newSod.DateCreation = DateTime.Now;
                newSod.DateUpdate = DateTime.Now;

                var lastItem = _db.TM_SOD_Supplier_Order.Where(m =>
                //m.sod_id == sodId &&  20250427 correct this part
                m.sod_d_creation.Year == newSod.DateCreation.Year
                    && m.sod_d_creation.Month == newSod.DateCreation.Month).OrderByDescending(m => m.sod_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastItem != null)
                {
                    lastCode = lastItem.sod_code;
                }
                string pref = GetCodePref(7);
                newSod.SodCode = GetGeneralRefContinuation(newSod.DateCreation, pref, lastCode, _codeType, newSod.SupId);
                var _sod = new TM_SOD_Supplier_Order();
                _sod = PurchaseBaseTranslator.EntityToRepository(newSod, _sod, true);
                _db.TM_SOD_Supplier_Order.AddObject(_sod);
                _db.SaveChanges();
                newSodId = _sod.sod_id;
                var sols = _db.TM_SOL_SupplierOrder_Lines.Where(l => l.sod_id == sodId).Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();
                foreach (var item in sols)
                {
                    var newsol = ObjectCopier.DeepCopy(item);
                    newsol.SodId = newSodId;
                    var _sol = new TM_SOL_SupplierOrder_Lines();
                    _sol = PurchaseBaseLineTranslator.EntityToRepositorySol(newsol, _sol, true);
                    _sol.sod_id = newSodId;
                    _db.TM_SOL_SupplierOrder_Lines.AddObject(_sol);
                    _db.SaveChanges();
                }
                UpdateSodAmountBySol(newSodId);
            }
            return newSodId;
        }

        #endregion Supplier Order

        #region Supplier Invoice

        public int CreateUpdateSupplierInvoice(PurchaseBaseClass sin)
        {
            int itemId = 0;
            var aSin = _db.TM_SIN_Supplier_Invoice.FirstOrDefault(m => m.soc_id == sin.SocId && m.sin_id == sin.SinId);
            if (aSin != null)
            {
                aSin = PurchaseBaseTranslator.EntityToRepository(sin, aSin);
                itemId = aSin.sin_id;
                _db.TM_SIN_Supplier_Invoice.ApplyCurrentValues(aSin);
                _db.SaveChanges();
            }
            else
            {
                var lastItem = _db.TM_SIN_Supplier_Invoice.Where(m => m.soc_id == sin.SocId
                    && m.sin_d_creation.Year == sin.DateCreation.Year
                    && m.sin_d_creation.Month == sin.DateCreation.Month).OrderByDescending(m => m.sin_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastItem != null)
                {
                    lastCode = lastItem.sin_code;
                }
                string pref = GetCodePref(8);
                sin.SinCode = GetGeneralRefContinuation(sin.DateCreation, pref, lastCode, _codeType, sin.SupId);
                aSin = PurchaseBaseTranslator.EntityToRepository(sin, aSin, true);
                _db.TM_SIN_Supplier_Invoice.AddObject(aSin);
                _db.SaveChanges();
                itemId = aSin.sin_id;
            }
            return itemId;
        }

        public PurchaseBaseClass LoadSupplierInvoice(int socId, int sinId, bool forPdf = false)
        {
            var sin = _db.TM_SIN_Supplier_Invoice.Where(m => m.soc_id == socId && m.sin_id == sinId).Select(PurchaseBaseTranslator.RepositoryToEntitySin()).FirstOrDefault();
            if (sin != null)
            {
                sin.SinFId = StringCipher.EncoderSimple(sin.SinId.ToString(), "sinId");
                sin.SodFId = StringCipher.EncoderSimple(sin.SodId.ToString(), "sodId");
                sin.SupFId = StringCipher.EncoderSimple(sin.SupId.ToString(), "supId");
            }
            return sin;
        }

        public List<PurchaseBaseClass> SearchSupplierInvoice(PurchaseBaseClass sin)
        {
            var items = _db.TM_SIN_Supplier_Invoice.Where(m => m.soc_id == sin.SocId
                && (string.IsNullOrEmpty(sin.SinName.Trim()) || m.sin_name.Contains(sin.SinName.Trim()))
                && (string.IsNullOrEmpty(sin.SinCode.Trim()) || m.sin_code.Contains(sin.SinCode.Trim()))
                && (sin.SupId == 0 || m.sup_id == sin.SupId)
                ).Select(PurchaseBaseTranslator.RepositoryToEntitySin()).ToList();
            items.ForEach(m =>
            {
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                decimal totalHt;
                decimal totalTtc;
                CalculateSinTotal(m.SinId, out totalHt, out totalTtc);
                m.TotalAmountHt = totalHt;
                m.TotalAmountTtc = totalTtc;
            });
            return items;
        }

        private void CalculateSinTotal(int sinId, out decimal totalHt, out decimal totalTtc)
        {
            var totalHtNull = _db.TM_SIL_SupplierInvoice_Lines.Where(m => m.sin_id == sinId).Sum(m => ((
                m.sil_quantity * (m.sil_price_with_dis))));
            totalHt = totalHtNull ?? 0;
            var totalTtcNull = _db.TM_SIL_SupplierInvoice_Lines.Where(m => m.sin_id == sinId).Sum(m => (m.sil_quantity * (m.sil_price_with_dis) * (1 + m.TR_VAT_Vat.vat_vat_rate / 100)));
            totalTtc = totalTtcNull ?? 0;
        }

        public void UpdateSinFile(int socId, int sinId, string filePath)
        {
            var item = _db.TM_SIN_Supplier_Invoice.FirstOrDefault(m => m.soc_id == socId && m.sin_id == sinId);
            if (item != null)
            {
                if (!string.IsNullOrEmpty(item.sin_file))
                {
                    CommonRepository.DeleteFile(item.sin_file);
                }
                item.sin_file = filePath;
                _db.TM_SIN_Supplier_Invoice.ApplyCurrentValues(item);
                _db.SaveChanges();
            }
        }

        public void UpdateSinBankFile(int socId, int sinId, string filePath)
        {
            var item = _db.TM_SIN_Supplier_Invoice.FirstOrDefault(m => m.soc_id == socId && m.sin_id == sinId);
            if (item != null)
            {
                if (!string.IsNullOrEmpty(item.sin_bank_receipt_file))
                {
                    CommonRepository.DeleteFile(item.sin_bank_receipt_file);
                }
                if (!string.IsNullOrEmpty(filePath))
                {
                    item.sin_is_paid = true;
                }
                item.sin_bank_receipt_file = filePath;
                _db.TM_SIN_Supplier_Invoice.ApplyCurrentValues(item);
                _db.SaveChanges();
            }
        }

        #endregion Supplier Invoice

        #region Widget

        public List<PurchaseBaseClass> GetSupplierInvoiceNoPaid(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var sins = _db.TM_SIN_Supplier_Invoice.Where(m => m.soc_id == socId && m.sin_is_paid == false && (isAdmin || m.usr_creator_id == usrId)).Select(PurchaseBaseTranslator.RepositoryToEntitySin()).ToList();
            sins.ForEach(m =>
            {
                m.SinFId = StringCipher.EncoderSimple(m.SinId.ToString(), "sinId");
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
                decimal totalHt;
                decimal totalTtc;
                CalculateSinTotal(m.SinId, out totalHt, out totalTtc);
                m.TotalAmountHt = totalHt;
                m.TotalAmountTtc = totalTtc;
            });
            return sins;
        }

        #endregion Widget
    }
}

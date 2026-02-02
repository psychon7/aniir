using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Remoting.Messaging;
using System.Text;
using System.Xml;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using System.IO;

namespace ERP.Repositories.SqlServer
{
    public class ClientInvoiceRepository : BaseSqlServerRepository
    {
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private CommonRepository CommonRepository = new CommonRepository();
        private UserRepository UserRepository = new UserRepository();
        ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();

        public int CreateUpdateClientInvoice(ClientInvoice oneClientInvoice, bool isSuperMode = false, bool isAdmin = false)
        {
            bool iscreate = false;
            int cinId = 0;
            //int ccoInvId = 0;
            int ccoDlvId = 0;

            //check client and client contact
            //oneClientInvoice.CliId = CreatClientCcoForClientInvoice(oneClientInvoice, out ccoInvId, out ccoDlvId);
            //oneClientInvoice.CcoIdInvoicing = ccoInvId;
            //oneClientInvoice.CcoIdDelivery = ccoDlvId;
            // create
            if (oneClientInvoice.CinId == 0)
            {
                var lastCin = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == oneClientInvoice.SocId && m.cin_isinvoice
                    && m.cin_d_creation.Year == oneClientInvoice.CinDCreation.Year
                    && m.cin_d_creation.Month == oneClientInvoice.CinDCreation.Month).OrderByDescending(m => m.cin_code).FirstOrDefault();
                var lastAvoir = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == oneClientInvoice.SocId && !m.cin_isinvoice
                    && m.cin_d_creation.Year == oneClientInvoice.CinDCreation.Year
                    && m.cin_d_creation.Month == oneClientInvoice.CinDCreation.Month).OrderByDescending(m => m.cin_code).FirstOrDefault();
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
                        lastCode = oneClientInvoice.CinIsInvoice ? lastCinCode : lastAvCode;
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


                string pref = oneClientInvoice.CinIsInvoice ? GetCodePref(1) : GetCodePref(14);

                oneClientInvoice.CinCode = GetGeneralRefContinuation(oneClientInvoice.CinDCreation, pref, lastCode, _codeType, oneClientInvoice.CliId);
                var newItem = new TM_CIN_Client_Invoice();
                newItem = ClientInvoiceTranslator.EntityToRepository(oneClientInvoice, newItem, true);
                //newItem.cin_d_invoice = DateTime.Now;
                //newItem.cin_d_term = CalculateTermDate(DateTime.Now, newItem.pco_id);

                if (!newItem.cin_d_invoice.HasValue)
                {
                    newItem.cin_d_invoice = newItem.cin_d_creation;
                    newItem.cin_d_term = CalculateTermDate(newItem.cin_d_invoice.Value, newItem.pco_id);
                }

                _db.TM_CIN_Client_Invoice.AddObject(newItem);
                _db.SaveChanges();
                cinId = newItem.cin_id;
                if (!oneClientInvoice.CinIsInvoice && oneClientInvoice.CinAvId.HasValue && oneClientInvoice.CinAvId != 0)
                {
                    // create client invoice lines for avoir
                    CopyClientInvoiceLineForAvoir(oneClientInvoice.SocId, cinId, oneClientInvoice.CinAvId.Value);
                }
                else if (!oneClientInvoice.CinIsInvoice && oneClientInvoice.CodId.HasValue && oneClientInvoice.CodId != 0) // 20241216 允许有COD的，直接复制COD对应的Col
                {
                    CopyColForAvoir(oneClientInvoice.SocId, cinId, oneClientInvoice.CodId.Value);
                }
            }
            else
            {
                // update
                var oneCin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.soc_id == oneClientInvoice.SocId && m.cin_id == oneClientInvoice.CinId);
                if (oneCin != null)
                {
                    oneCin = ClientInvoiceTranslator.EntityToRepository(oneClientInvoice, oneCin);
                    bool clientchanged = false;
                    if (isSuperMode && isAdmin)
                    {
                        clientchanged = (oneCin.cli_id != oneClientInvoice.CliId);
                        oneCin.cli_id = oneClientInvoice.CliId;
                    }
                    _db.TM_CIN_Client_Invoice.ApplyCurrentValues(oneCin);
                    _db.SaveChanges();


                    if (isSuperMode)
                    {
                        // update project, cost plan and order name
                        var prjcplcod = (from prj in _db.TM_PRJ_Project
                                         join cpl in _db.TM_CPL_Cost_Plan on prj.prj_id equals cpl.prj_id
                                         join cod in _db.TM_COD_Client_Order on cpl.cpl_id equals cod.cpl_id
                                         join cin in _db.TM_CIN_Client_Invoice on cod.cod_id equals cin.cod_id
                                         where cin.cin_id == oneCin.cin_id
                                         select new { prj, cpl, cod }).ToList();

                        foreach (var varb in prjcplcod)
                        {
                            if (varb.prj.prj_name != oneClientInvoice.PrjName)
                            {
                                if (isAdmin)
                                {
                                    varb.prj.cli_id = oneClientInvoice.CliId;
                                }
                                varb.prj.prj_name = oneClientInvoice.PrjName;
                                _db.TM_PRJ_Project.ApplyCurrentValues(varb.prj);
                                _db.SaveChanges();
                            }

                            if (varb.cpl.cpl_name != oneClientInvoice.CplName)
                            {
                                if (isAdmin)
                                {
                                    varb.cpl.cli_id = oneClientInvoice.CliId;
                                }
                                varb.cpl.cpl_name = oneClientInvoice.CplName;
                                _db.TM_CPL_Cost_Plan.ApplyCurrentValues(varb.cpl);
                                _db.SaveChanges();
                            }

                            if (varb.cod.cod_name != oneClientInvoice.CodName)
                            {
                                if (isAdmin)
                                {
                                    varb.cod.cli_id = oneClientInvoice.CliId;
                                }
                                varb.cod.cod_name = oneClientInvoice.CodName;
                                _db.TM_COD_Client_Order.ApplyCurrentValues(varb.cod);
                                _db.SaveChanges();
                            }
                        }

                        if (clientchanged)
                        {
                            var onecod = _db.TM_COD_Client_Order.FirstOrDefault(l => l.cod_id == oneCin.cod_id);
                            if (onecod != null)
                            {
                                onecod.cli_id = oneClientInvoice.CliId;
                                _db.TM_COD_Client_Order.ApplyCurrentValues(onecod);
                                _db.SaveChanges();
                                var onecpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(l => l.cpl_id == onecod.cpl_id);
                                if (onecpl != null)
                                {
                                    onecpl.cli_id = oneClientInvoice.CliId;
                                    _db.TM_CPL_Cost_Plan.ApplyCurrentValues(onecpl);
                                    _db.SaveChanges();
                                    var oneprj = _db.TM_PRJ_Project.FirstOrDefault(l => l.prj_id == oneCin.prj_id);
                                    if (oneprj != null)
                                    {
                                        oneprj.cli_id = oneClientInvoice.CliId;
                                        _db.TM_PRJ_Project.ApplyCurrentValues(oneprj);
                                        _db.SaveChanges();
                                    }
                                }
                            }
                            var dfos = _db.TR_DCI_DeliveryForm_ClientInvoice.Where(l => l.cin_id == oneCin.cin_id).ToList();
                            foreach (var dfo in dfos)
                            {
                                dfo.TM_DFO_Delivery_Form.cli_id = oneClientInvoice.CliId;
                                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo.TM_DFO_Delivery_Form);
                                _db.SaveChanges();
                            }

                        }
                    }
                    cinId = oneCin.cin_id;
                }
            }
            return cinId;
        }

        public ClientInvoice LoadClientInvoiceById(int cinId, int socId, int usrId, bool forPdf = false, int lgsId = 0)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cin = _db.TM_CIN_Client_Invoice.Where(m => m.cin_id == cinId && m.soc_id == socId
                // is Admin
                //&& (isAdmin || m.usr_creator_id == usrId)
                ).FilterClientInvoiceUser(isAdmin, usrId, subUser).AsQueryable().Select(ClientInvoiceTranslator.RepositoryToEntity()).FirstOrDefault();

            if (cin != null)
            {
                cin.FId = StringCipher.EncoderSimple(cin.CinId.ToString(), "cinId");
                cin.CodFId = StringCipher.EncoderSimple(cin.CodId.ToString(), "codId");
                cin.CplFId = StringCipher.EncoderSimple(cin.CplId.ToString(), "cplId");
                cin.PrjFId = StringCipher.EncoderSimple(cin.PrjId.ToString(), "prjId");
                cin.CliFId = StringCipher.EncoderSimple(cin.CliId.ToString(), "cliId");
                cin.CanCreateDfo = GetWetherCinCreateDfo(socId, cinId);
                // 20210118 commented out CSO
                //if (cin.SodId.HasValue && cin.SodId != 0)
                //{
                //    var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => l.sod_id == cin.SodId);
                //    if (sod != null)
                //    {
                //        cin.SodCode = sod.sod_code;
                //        cin.SodFId = StringCipher.EncoderSimple(cin.SodId.ToString(), "sodId");
                //    }
                //}

                if (cin.DelegatorId.HasValue)
                {
                    var delegataire = _db.TM_CLI_CLient.Where(l => l.cli_id == cin.DelegatorId).Distinct().Select(o =>
                        new KeyValue()
                        {
                            Key = o.cli_id,
                            Value = o.cli_company_name,
                            Value2 = o.cli_abbreviation,
                            Value3 = o.cli_email,
                        }).FirstOrDefault();
                    if (delegataire != null)
                    {
                        cin.Delegataire = delegataire;
                    }
                }

                var csos = _db.TR_CSO_ClientInvoice_SupplierOrder.Where(l => l.cin_id == cin.CinId).ToList();
                cin.CsoList = csos.Select(onecso => new KeyValue()
                {
                    Key = onecso.sod_id,
                    Value = onecso.TM_SOD_Supplier_Order.sod_code,
                    Value2 = StringCipher.EncoderSimple(onecso.sod_id.ToString(), "sodId"),
                    Value3 = onecso.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_abbreviation
                }).ToList();

                if (cin.CinAvId.HasValue)
                {
                    cin.CinAvFId = StringCipher.EncoderSimple(cin.CinAvId.Value.ToString(), "cinId");
                }
                if (cin.DfoId.HasValue)
                {
                    cin.DfoFId = StringCipher.EncoderSimple(cin.DfoId.Value.ToString(), "dfoId");
                }
                cin.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, cin.CinId).TotalAmountHt * (cin.CinIsInvoice ? 1 : (-1));
            }
            if (forPdf && cin != null)
            {
                cin.ClientInvoiceLines = ClientInvoiceLineRepository.GetCiisByCinId(socId, cinId, lgsId).Where(m => m.LtpId != 6).ToList();
                //cin.DfoList = _db.TM_DFO_Delivery_Form.Where(m => m.cod_id == cin.CodId).Select(m => m.dfo_code).ToList();
                cin.DfoList = (from dci in _db.TR_DCI_DeliveryForm_ClientInvoice
                               join dfo in _db.TM_DFO_Delivery_Form on dci.dfo_id equals dfo.dfo_id
                               where dci.cin_id == cin.CinId
                               select dfo).Select(m => m.dfo_code).Distinct().ToList();
                var bac = _db.TR_BAC_Bank_Account.FirstOrDefault(l => l.soc_id == socId && l.bac_id == cin.CinBank);
                if (bac != null)
                {
                    cin.RibName = bac.bac_account_owner;
                    cin.RibAddress = bac.bac_bank_adr;
                    cin.RibBankCode = bac.bac_rib_bank_code;
                    cin.RibAgenceCode = bac.bac_rib_agence_code;
                    cin.RibAccountNumber = bac.bac_rib_account_number;
                    cin.RibKey = bac.bac_rib_key;
                    cin.RibDomiciliationAgency = bac.bac_rib_agency_adr;
                    cin.RibCodeIban = bac.bac_iban;
                    cin.RibCodeBic = bac.bac_bic;
                    cin.RibBankName = bac.bac_bank_name;
                }
                else
                {
                    var society = _db.TR_SOC_Society.FirstOrDefault(l => l.soc_id == socId);
                    if (society != null)
                    {
                        if (cin.CinBank == 2)
                        {
                            cin.RibName = society.soc_rib_name_2;
                            cin.RibAddress = society.soc_rib_address_2;
                            cin.RibBankCode = society.soc_rib_bank_code_2;
                            cin.RibAgenceCode = society.soc_rib_agence_code_2;
                            cin.RibAccountNumber = society.soc_rib_account_number_2;
                            cin.RibKey = society.soc_rib_key_2;
                            cin.RibDomiciliationAgency = society.soc_rib_domiciliation_agency_2;
                            cin.RibCodeIban = society.soc_rib_code_iban_2;
                            cin.RibCodeBic = society.soc_rib_code_bic_2;
                            cin.RibBankName = society.soc_rib_domiciliation_agency_2;
                        }
                        else
                        {
                            cin.RibName = society.soc_rib_name;
                            cin.RibAddress = society.soc_rib_address;
                            cin.RibBankCode = society.soc_rib_bank_code;
                            cin.RibAgenceCode = society.soc_rib_agence_code;
                            cin.RibAccountNumber = society.soc_rib_account_number;
                            cin.RibKey = society.soc_rib_key;
                            cin.RibDomiciliationAgency = society.soc_rib_domiciliation_agency;
                            cin.RibCodeIban = society.soc_rib_code_iban;
                            cin.RibCodeBic = society.soc_rib_code_bic;
                            cin.RibBankName = society.soc_rib_domiciliation_agency;
                        }
                    }
                }
            }
            if (cin != null && cin.CinAccount && cin.CinAvId.HasValue)
            {
                cin.CinAvoir = GetCinWithAmount(socId, cin.CinAvId.Value);
            }
            return cin;
        }

        public List<ClientInvoice> SearchClientInvoices(ClientInvoice oneCin)
        {
            DateTime createDateFrom;
            if (!DateTime.TryParse(oneCin._CinDCreation, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
            {
                createDateFrom = new DateTime(1900, 1, 1);
            }
            DateTime createDateTo;
            if (!DateTime.TryParse(oneCin._CinDUpdate, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
            {
                createDateTo = new DateTime(2500, 12, 31);
            }
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);

            bool isAdmin = UserRepository.IsAdmin(oneCin.SocId, oneCin.UsrCreatorId);
            var subUser = UserRepository.GetUserSubUsersIds(oneCin.SocId, oneCin.UsrCreatorId);
            var keyword = oneCin.CinInterComment.Trim();
            ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == oneCin.SocId
                                                         && (string.IsNullOrEmpty(oneCin.CinName.Trim()) || m.cin_name.Contains(oneCin.CinName.Trim()))
                                                         && (string.IsNullOrEmpty(oneCin.CinCode.Trim()) || m.cin_code.Contains(oneCin.CinCode.Trim()))
                                                         // client
                                                         && (
                                                         (oneCin.CliId == 0 && (string.IsNullOrEmpty(oneCin.ClientCompanyName.Trim()) || m.TM_CLI_CLient.cli_company_name.Contains(oneCin.ClientCompanyName.Trim())))
                                                         || (oneCin.CliId != 0 && m.TM_CLI_CLient.cli_id == oneCin.CliId))
                                                         //string.IsNullOrEmpty(oneCin.ClientCompanyName.Trim()) || m.TM_CLI_CLient.cli_company_name.Contains(oneCin.ClientCompanyName.Trim()))
                                                         // cco invoicing
                                                         && (
                                                         string.IsNullOrEmpty(oneCin.Inv_CcoFirstname.Trim()) || m.TM_CCO_Client_Contact.cco_firstname.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                             || m.TM_CCO_Client_Contact.cco_lastname.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                             || m.TM_CCO_Client_Contact.cco_adresse_title.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                         // cco delivery
                                                         //|| m.TM_CCO_Client_Contact1.cco_firstname.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                         //|| m.TM_CCO_Client_Contact1.cco_lastname.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                         //|| m.TM_CCO_Client_Contact1.cco_adresse_title.Contains(oneCin.Inv_CcoFirstname.Trim())
                                                         )
                                                         // project
                                                         && (string.IsNullOrEmpty(oneCin.PrjCode.Trim()) || m.TM_PRJ_Project.prj_code.Contains(oneCin.PrjCode.Trim()))
                                                         && (string.IsNullOrEmpty(oneCin.PrjName.Trim()) || m.TM_PRJ_Project.prj_name.Contains(oneCin.PrjName.Trim()))
                                                         && (m.cin_d_creation >= createDateFrom && m.cin_d_creation <= createDateTo)
                // is Admin
                //&& (isAdmin || m.usr_creator_id == oneCin.UsrCreatorId)
                && ((string.IsNullOrEmpty(keyword) || m.cin_client_comment.Contains(keyword))
                || (string.IsNullOrEmpty(keyword) || m.cin_inter_comment.Contains(keyword))
                )
                && (!oneCin.CinKeyProject || m.cin_key_project == true)
                // 20250428 search by supplier
                && (oneCin.PrjId == 0 || m.TR_CSO_ClientInvoice_SupplierOrder.Any(l => l.TM_SOD_Supplier_Order.sup_id == oneCin.PrjId))
               ).FilterClientInvoiceUser(isAdmin, oneCin.UsrCreatorId, subUser).AsQueryable().Select(ClientInvoiceTranslator.RepositoryToEntity4Search()).ToList();

            var allcpys = _db.TM_CPY_ClientInvoice_Payment.Where(l => !string.IsNullOrEmpty(oneCin.PaymentMode) && l.cpy_comment.Contains(oneCin.PaymentMode)).Distinct().ToList();

            // 20231111 keyword
            var cinIds = cins.Select(l => l.CinId).ToList();

            if (!string.IsNullOrEmpty(keyword))
            {
                var cplcheckcln = _db.TM_CII_ClientInvoice_Line.Where(l =>
                    ((string.IsNullOrEmpty(keyword) || l.cii_prd_name.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.cii_prd_des.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.cii_description.Contains(keyword)))
                    &&
                    l.TM_CIN_Client_Invoice.soc_id == oneCin.SocId
                          && (l.TM_CIN_Client_Invoice.cin_d_creation >= createDateFrom && l.TM_CIN_Client_Invoice.cin_d_creation <= createDateTo)
                ).Select(l => l.TM_CIN_Client_Invoice).FilterClientInvoiceUser(isAdmin, oneCin.UsrCreatorId, subUser).AsQueryable().Select(ClientInvoiceTranslator.RepositoryToEntity4Search()).ToList();


                var cplclncplIds = cplcheckcln.Select(l => l.CinId).ToList();

                var cplclnIdsConserve = cplclncplIds.Except(cinIds).ToList();

                var cplcln2conserve = (from cpl in cplcheckcln
                                       join cplId2 in cplclnIdsConserve on cpl.CinId equals cplId2
                                       select cpl).ToList();

                cins.AddRange(cplcln2conserve);
            }




            if (!string.IsNullOrEmpty(oneCin.PaymentMode))
            {
                //var cpys = _db.TM_CPY_ClientInvoice_Payment.Where(l => l.cpy_comment.Contains(oneCin.PaymentMode)).Select(l => l.cin_id).Distinct().ToList();
                cins = (from cpy in allcpys
                        join cin in cins
                            on cpy.cin_id equals cin.CinId
                        select cin).ToList();
            }

            var csos = (from cin in cins
                        join cso in _db.TR_CSO_ClientInvoice_SupplierOrder on cin.CinId equals cso.cin_id
                        select new KeyValue()
                        {
                            Key = cin.CinId,
                            Key2 = cso.sod_id,
                            Value = cso.TM_SOD_Supplier_Order.sod_code,
                            Value2 = StringCipher.EncoderSimple(cso.sod_id.ToString(), "sodId"),
                            Value3 = cso.TM_SOD_Supplier_Order.TM_SUP_Supplier.sup_abbreviation
                        }).ToList();

            //var allcgs = (from cin in cins
            //              join cgs in _db.TR_CGS_CIN_LGS on cin.CinId equals cgs.cin_id
            //              join lgs in _db.TM_LGS_Logistic on cgs.lgs_id equals lgs.lgs_id
            //              select new KeyValue
            //              {
            //                  Key = cin.CinId,
            //                  Key2 = lgs.lgs_id,
            //                  Value = lgs.lgs_code,
            //                  Value2 = StringCipher.EncoderSimple(lgs.lgs_id.ToString(), "lgsId")
            //              }).Distinct().ToList();

            var allcgs = (from cin in cins
                          join cii in _db.TM_CII_ClientInvoice_Line on cin.CinId equals cii.cin_id
                          join lgl in _db.TM_LGL_Logistic_Lines on cii.cii_id equals lgl.cii_id
                          select new KeyValue
                          {
                              Key = cin.CinId,
                              Key2 = lgl.lgs_id,
                              Key3 = lgl.lgs_quantity ?? 0,
                              Value = lgl.TM_LGS_Logistic.lgs_code,
                              Value2 = StringCipher.EncoderSimple(lgl.lgs_id.ToString(), "lgsId"),
                              Value3 = lgl.TM_LGS_Logistic.lgs_tracking_number,
                              Value4 = lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name
                          }).Distinct().ToList();
            var allsolCgs = (from cin in cins
                             join cii in _db.TM_CII_ClientInvoice_Line on cin.CinId equals cii.cin_id
                             join lgl in _db.TM_LGL_Logistic_Lines on cii.sol_id equals lgl.sol_id
                             select new KeyValue
                             {
                                 Key = cin.CinId,
                                 Key2 = lgl.lgs_id,
                                 Key3 = lgl.lgs_quantity ?? 0,
                                 Value = "SO-" + lgl.TM_LGS_Logistic.lgs_code,
                                 Value2 = StringCipher.EncoderSimple(lgl.lgs_id.ToString(), "lgsId"),
                                 Value3 = lgl.TM_LGS_Logistic.lgs_tracking_number,
                                 Value4 = lgl.TM_LGS_Logistic.TM_SUP_Supplier.sup_company_name
                             }).Distinct().ToList();
            allcgs.AddRange(allsolCgs);
            allcgs = allcgs.Distinct().ToList();
            var cinPaymentInfo = (from onecin in cins
                                  join cpy in _db.TM_CPY_ClientInvoice_Payment on oneCin.CinId equals cpy.cin_id
                                  select cpy).ToList();

            if (string.IsNullOrEmpty(oneCin.PaymentMode))
            {
                allcpys = (from onecin in cins
                           join cpy in _db.TM_CPY_ClientInvoice_Payment on onecin.CinId equals cpy.cin_id
                           select cpy).Distinct().ToList();
            }

            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                var genInfo = ClientInvoiceLineRepository.GetClinetInvoiceInfo(oneCin.SocId, m.CinId);
                m.CinAmount = genInfo.TotalAmountHt * (m.CinAccount ? -1 : 1);
                m.TotalAmountTtc = genInfo.TotalAmountTtc * (m.CinAccount ? -1 : 1);
                m.CinPaid = cinPaymentInfo.Where(l => l.cin_id == m.CinId).Sum(l => l.cpy_amount);
                m.CsoList = csos.Where(l => l.Key == m.CinId).DistinctBy(l => l.Key2).ToList();
                m.CgsList = allcgs.Where(l => l.Key == m.CinId).ToList();

                var cpyforcin = allcpys.Where(l => l.cin_id == m.CinId).ToList();
                var paymentRecord = cpyforcin.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}</br>",
                    oneSpr.cpy_d_create, oneSpr.cpy_payment_code, oneSpr.cpy_amount, m.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewCpyFile('" + m.FId + "','" + (StringCipher.EncoderSimple(oneSpr.cpy_id.ToString(), "cpyId")) + "')\">"),
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                m.CinPaymentRecord = paymentRecord;

                var cinPaymentComments = cpyforcin.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("→ {0:d}-<span style='font-weight:bolder;'>{1}</span></br>",
                    oneSpr.cpy_d_create, oneSpr.cpy_comment
                    ));
                m.CinPaymentComments = cinPaymentComments;

            });
            return cins.OrderByDescending(l => l.CinCode).ToList();
        }

        public void AddUpdateDiscount(int socId, int cinId, decimal? discountPercentage, decimal? discountAmount)
        {
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                cin.cin_discount_amount = ((discountAmount ?? 0) == 0 ? null : discountAmount);
                cin.cin_discount_percentage = ((discountPercentage ?? 0) == 0 ? null : discountPercentage);
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                _db.SaveChanges();
                UpdateCinRestToPay(socId, cinId);
            }
        }

        public void UpdateClientInvoiceFile(int socId, int cinId, string filePath)
        {
            var cod = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.soc_id == socId && m.cin_id == cinId);
            if (cod != null)
            {
                if (!string.IsNullOrEmpty(cod.cin_file))
                {
                    CommonRepository.DeleteFile(cod.cin_file);
                }
                cod.cin_file = filePath;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cod);
                _db.SaveChanges();
            }
        }

        public void UpdateCinDocFiles(List<int> cpyIds, string filePath)
        {
            var sprs = _db.TM_CPY_ClientInvoice_Payment.Where(l => cpyIds.Contains(l.cpy_id)).ToList();
            foreach (var onecpy in sprs)
            {
                var oldPath = onecpy.cpy_file;
                CommonRepository.DeleteFile(oldPath);
                onecpy.cpy_file = filePath;
                _db.TM_CPY_ClientInvoice_Payment.ApplyCurrentValues(onecpy);
                _db.SaveChanges();
            }
        }

        public List<ClientInvoice> GetCinForAvoir(int socId)
        {
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && m.cin_isinvoice).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderByDescending(m => m.CinCode).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.CodFId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinIsInvoice ? 1 : (-1));
            });
            return cins;
        }

        /// <summary>
        /// 20200713 加快搜索Avoir速度
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cincode"></param>
        /// <returns></returns>
        public List<ClientInvoice> GetCinForAvoir(int socId, string cincode, int cliId)
        {
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && m.cin_isinvoice
                && m.cin_code.Contains(cincode)
                && (cliId == 0 || m.cli_id == cliId)
                ).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderByDescending(m => m.CinCode).Skip(0).Take(10).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.CodFId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinIsInvoice ? 1 : (-1));
            });
            return cins;
        }

        public ClientInvoice GetCinWithAmount(int socId, int cinId)
        {
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && m.cin_id == cinId).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderByDescending(m => m.CinCode).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinIsInvoice ? 1 : (-1));
            });
            return cins.FirstOrDefault();
        }

        private void CopyClientInvoiceLineForAvoir(int socId, int newCinId, int oldCinId)
        {
            var oldCiis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == oldCinId && m.TM_CIN_Client_Invoice.soc_id == socId).ToList();
            foreach (var onecii in oldCiis)
            {
                var newCii = CopyEntity(onecii);
                newCii.cin_id = newCinId;
                newCii.cii_id = 0;
                newCii.cii_av_id = onecii.cii_id;
                _db.TM_CII_ClientInvoice_Line.AddObject(newCii);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 20241216 通过col 创建 cii 用于avoir
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="newCinId"></param>
        /// <param name="oldCinId"></param>
        private void CopyColForAvoir(int socId, int newCinId, int codId)
        {
            var oldCols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).ToList().Select(l => new TM_CII_ClientInvoice_Line
            {
                cin_id = newCinId,
                col_id = l.col_id,
                cii_av_id = null,
                cii_id = 0,
                cii_level1 = l.col_level1,
                cii_level2 = l.col_level2,
                cii_description = l.col_description,
                prd_id = l.prd_id,
                cii_prd_name = l.prd_id.HasValue ? l.TM_PRD_Product.prd_name : string.Empty,
                pit_id = l.pit_id,
                cii_purchase_price = l.col_purchase_price,
                cii_unit_price = l.col_unit_price,
                cii_quantity = l.col_quantity,
                cii_total_price = l.col_total_price,
                // re calculate
                cii_total_crude_price = l.col_total_crude_price,
                vat_id = l.vat_id,
                ltp_id = l.ltp_id,
                cii_discount_percentage = l.col_discount_percentage,
                // re calculate
                cii_discount_amount = l.col_discount_amount,
                cii_price_with_discount_ht = l.col_price_with_discount_ht,
                // re calculate
                // cii_margin = dflsWithNewQty.FirstOrDefault(l => l.col_id == o.col_id).dfl_quantity * (o.TM_COL_ClientOrder_Lines.col_price_with_discount_ht - o.TM_COL_ClientOrder_Lines.col_purchase_price),
            }).ToList();
            foreach (var onecol in oldCols)
            {
                _db.TM_CII_ClientInvoice_Line.AddObject(onecol);
            }

            if (oldCols.Any())
            {
                _db.SaveChanges();
            }
        }

        private DateTime CalculateTermDate(DateTime invoiceDate, int pcoId)
        {
            var pco = _db.TR_PCO_Payment_Condition.FirstOrDefault(m => m.pco_id == pcoId);
            if (pco != null)
            {
                var termDate = invoiceDate;
                termDate = termDate.AddDays(pco.pco_numday);
                if (pco.pco_end_month)
                {
                    termDate = termDate.AddDays(1 - termDate.Day).AddMonths(1).AddDays(-1);
                }
                termDate = termDate.AddDays(pco.pco_day_additional);
                invoiceDate = termDate;
            }
            return invoiceDate;
        }

        ///// <summary>
        ///// if client or cco no exist, create them for cost plan
        ///// </summary>
        ///// <returns></returns>
        //public int CreatClientCcoForClientInvoice(ClientInvoice oneClientOrder, out int invCcoId, out int dlvCcoId)
        //{
        //    invCcoId = oneClientOrder.CcoIdInvoicing;
        //    dlvCcoId = oneClientOrder.CcoIdDelivery;
        //    int cliId = 0;
        //    cliId = oneClientOrder.CliId;
        //    // check client exist
        //    ContactClientRepository contactClientRepository = new ContactClientRepository();
        //    ClientRepository ClientRepository = new ClientRepository();
        //    if (cliId == 0)
        //    {
        //        var oneClient = new Client
        //        {
        //            SocId = oneClientOrder.SocId,
        //            CompanyName = oneClientOrder.ClientCompanyName,
        //            VatId = oneClientOrder.VatId,
        //            PcoId = oneClientOrder.PcoId,
        //            PmoId = oneClientOrder.PmoId,
        //            UsrCreatedBy = oneClientOrder.UsrCreatorId,
        //            CtyId = 2,
        //            CurId = 1,
        //            Isactive = true,
        //            Isblocked = false,
        //            DateCreation = oneClientOrder.CinDCreation,
        //            DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //            RecieveNewsletter = false
        //        };
        //        cliId = ClientRepository.CreateClientAutomatical(oneClient, false);
        //        if (cliId != 0)
        //        {
        //            var oneCcoInv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Facturation",
        //                CliId = cliId,
        //                SocId = oneClientOrder.SocId,
        //                CcoAddress1 = oneClientOrder.Inv_CcoAddress1,
        //                CcoAddress2 = oneClientOrder.Inv_CcoAddress2,
        //                CcoCellphone = oneClientOrder.Inv_CcoCellphone,
        //                CcoCity = oneClientOrder.Inv_CcoCity,
        //                CcoCountry = oneClientOrder.Inv_CcoCountry,
        //                CcoEmail = oneClientOrder.Inv_CcoEmail,
        //                CcoFax = oneClientOrder.Inv_CcoFax,
        //                CcoFirstname = oneClientOrder.Inv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Inv_CcoLastname,
        //                CcoIsDeliveryAdr = false,
        //                CcoIsInvoicingAdr = true,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneClientOrder.Inv_CcoPostcode,
        //                CcoTel1 = oneClientOrder.Inv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CinDCreation,
        //                DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //                UsrCreatedBy = oneClientOrder.UsrCreatorId
        //            };
        //            invCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoInv).CcoId;
        //            var oneCcoDlv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Livraison",
        //                CliId = cliId,
        //                SocId = oneClientOrder.SocId,
        //                CcoAddress1 = oneClientOrder.Dlv_CcoAddress1,
        //                CcoAddress2 = oneClientOrder.Dlv_CcoAddress2,
        //                CcoCellphone = oneClientOrder.Dlv_CcoCellphone,
        //                CcoCity = oneClientOrder.Dlv_CcoCity,
        //                CcoCountry = oneClientOrder.Dlv_CcoCountry,
        //                CcoEmail = oneClientOrder.Dlv_CcoEmail,
        //                CcoFax = oneClientOrder.Dlv_CcoFax,
        //                CcoFirstname = oneClientOrder.Dlv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Dlv_CcoLastname,
        //                CcoIsDeliveryAdr = true,
        //                CcoIsInvoicingAdr = false,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneClientOrder.Dlv_CcoPostcode,
        //                CcoTel1 = oneClientOrder.Dlv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CinDCreation,
        //                DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //                UsrCreatedBy = oneClientOrder.UsrCreatorId
        //            };
        //            dlvCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoDlv).CcoId;
        //        }
        //    }
        //    //if ((dlvCcoId == 0 || invCcoId == 0) && cliId != 0)
        //    if (cliId != 0)
        //    {
        //        var checkClient = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == cliId && m.soc_id == oneClientOrder.SocId);
        //        if (checkClient == null)
        //        {
        //            // create a client
        //            var oneClient = new Client
        //            {
        //                SocId = oneClientOrder.SocId,
        //                CompanyName = oneClientOrder.ClientCompanyName,
        //                VatId = oneClientOrder.VatId,
        //                PcoId = oneClientOrder.PcoId,
        //                PmoId = oneClientOrder.PmoId,
        //                UsrCreatedBy = oneClientOrder.UsrCreatorId,
        //                CtyId = 1,
        //                CurId = 1,
        //                Isactive = true,
        //                Isblocked = false,
        //                DateCreation = oneClientOrder.CinDCreation,
        //                DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //                RecieveNewsletter = false
        //            };
        //            cliId = ClientRepository.CreateClientAutomatical(oneClient, false);
        //        }
        //        else
        //        {
        //            checkClient.cty_id = 1;
        //            checkClient.cli_d_update = DateTime.Now;
        //            _db.TM_CLI_CLient.ApplyCurrentValues(checkClient);
        //            _db.SaveChanges();
        //        }
        //        if (invCcoId == 0)
        //        {
        //            var oneCcoInv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Facturation",
        //                CliId = cliId,
        //                SocId = oneClientOrder.SocId,
        //                CcoAddress1 = oneClientOrder.Inv_CcoAddress1,
        //                CcoAddress2 = oneClientOrder.Inv_CcoAddress2,
        //                CcoCellphone = oneClientOrder.Inv_CcoCellphone,
        //                CcoCity = oneClientOrder.Inv_CcoCity,
        //                CcoCountry = oneClientOrder.Inv_CcoCountry,
        //                CcoEmail = oneClientOrder.Inv_CcoEmail,
        //                CcoFax = oneClientOrder.Inv_CcoFax,
        //                CcoFirstname = oneClientOrder.Inv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Inv_CcoLastname,
        //                CcoIsDeliveryAdr = false,
        //                CcoIsInvoicingAdr = true,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneClientOrder.Inv_CcoPostcode,
        //                CcoTel1 = oneClientOrder.Inv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CinDCreation,
        //                DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //                UsrCreatedBy = oneClientOrder.UsrCreatorId
        //            };
        //            invCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoInv).CcoId;
        //        }
        //        else
        //        {
        //            var oneCcoInv = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.TM_CLI_CLient.soc_id == oneClientOrder.SocId && m.cco_id == oneClientOrder.CcoIdInvoicing);
        //            if (oneCcoInv != null)
        //            {
        //                var oneCcoInvUpdate = new ContactClient
        //                {
        //                    CcoId = oneCcoInv.cco_id,
        //                    CcoAddress1 = oneClientOrder.Inv_CcoAddress1,
        //                    CcoAddress2 = oneClientOrder.Inv_CcoAddress2,
        //                    CcoCellphone = oneClientOrder.Inv_CcoCellphone,
        //                    CcoCity = oneClientOrder.Inv_CcoCity,
        //                    CcoCountry = oneClientOrder.Inv_CcoCountry,
        //                    CcoEmail = oneClientOrder.Inv_CcoEmail,
        //                    CcoFax = oneClientOrder.Inv_CcoFax,
        //                    CcoFirstname = oneClientOrder.Inv_CcoFirstname,
        //                    CcoLastname = oneClientOrder.Inv_CcoLastname,
        //                    CcoPostcode = oneClientOrder.Inv_CcoPostcode,
        //                    CcoTel1 = oneClientOrder.Inv_CcoTel1,
        //                    SocId = oneClientOrder.SocId
        //                };
        //                contactClientRepository.UpdateContactClientFromPage(oneCcoInvUpdate);
        //            }
        //        }
        //        if (dlvCcoId == 0)
        //        {
        //            var oneCcoDlv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Livraison",
        //                CliId = cliId,
        //                SocId = oneClientOrder.SocId,
        //                CcoAddress1 = oneClientOrder.Dlv_CcoAddress1,
        //                CcoAddress2 = oneClientOrder.Dlv_CcoAddress2,
        //                CcoCellphone = oneClientOrder.Dlv_CcoCellphone,
        //                CcoCity = oneClientOrder.Dlv_CcoCity,
        //                CcoCountry = oneClientOrder.Dlv_CcoCountry,
        //                CcoEmail = oneClientOrder.Dlv_CcoEmail,
        //                CcoFax = oneClientOrder.Dlv_CcoFax,
        //                CcoFirstname = oneClientOrder.Dlv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Dlv_CcoLastname,
        //                CcoIsDeliveryAdr = true,
        //                CcoIsInvoicingAdr = false,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneClientOrder.Dlv_CcoPostcode,
        //                CcoTel1 = oneClientOrder.Dlv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CinDCreation,
        //                DateUpdate = oneClientOrder.CinDUpdate ?? DateTime.Now,
        //                UsrCreatedBy = oneClientOrder.UsrCreatorId
        //            };
        //            dlvCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoDlv).CcoId;
        //        }
        //        else
        //        {
        //            var oneCcoDlv = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.TM_CLI_CLient.soc_id == oneClientOrder.SocId && m.cco_id == oneClientOrder.CcoIdDelivery);
        //            if (oneCcoDlv != null)
        //            {
        //                var oneCcoDlvUpdate = new ContactClient
        //                {
        //                    CcoId = oneCcoDlv.cco_id,
        //                    CcoAddress1 = oneClientOrder.Dlv_CcoAddress1,
        //                    CcoAddress2 = oneClientOrder.Dlv_CcoAddress2,
        //                    CcoCellphone = oneClientOrder.Dlv_CcoCellphone,
        //                    CcoCity = oneClientOrder.Dlv_CcoCity,
        //                    CcoCountry = oneClientOrder.Dlv_CcoCountry,
        //                    CcoEmail = oneClientOrder.Dlv_CcoEmail,
        //                    CcoFax = oneClientOrder.Dlv_CcoFax,
        //                    CcoFirstname = oneClientOrder.Dlv_CcoFirstname,
        //                    CcoLastname = oneClientOrder.Dlv_CcoLastname,
        //                    CcoPostcode = oneClientOrder.Dlv_CcoPostcode,
        //                    CcoTel1 = oneClientOrder.Dlv_CcoTel1,
        //                    SocId = oneClientOrder.SocId
        //                };
        //                contactClientRepository.UpdateContactClientFromPage(oneCcoDlvUpdate);
        //            }
        //        }
        //    }
        //    return cliId;
        //}

        #region Client Invoie Payment

        public int CreateUpdateCinPayment(int socId, int cinId, int cpyId, decimal cpyAmount, string cpyFilePath, string comment = null, bool updateFile = false, string paymentcode = null)
        {
            var cpy = _db.TM_CPY_ClientInvoice_Payment.FirstOrDefault(m => m.TM_CIN_Client_Invoice.soc_id == socId && m.cin_id == cinId && m.cpy_id == cpyId);
            if (cpy != null)
            {
                if (updateFile)
                {
                    var oldPath = cpy.cpy_file;
                    CommonRepository.DeleteFile(oldPath);
                    cpy.cpy_file = cpyFilePath;
                }
                else
                {
                    cpy.cpy_amount = cpyAmount;
                    cpy.cpy_comment = comment;
                    cpy.cpy_payment_code = paymentcode;
                }
                _db.TM_CPY_ClientInvoice_Payment.ApplyCurrentValues(cpy);
                _db.SaveChanges();
            }
            else
            {
                if (!updateFile)
                {
                    cpy = new TM_CPY_ClientInvoice_Payment
                    {
                        cin_id = cinId,
                        cpy_amount = cpyAmount,
                        cpy_d_create = DateTime.Now,
                        cpy_file = cpyFilePath,
                        cpy_comment = comment,
                        cpy_payment_code = paymentcode,
                        cpy_guid = Guid.NewGuid().ToString()
                    };
                    _db.TM_CPY_ClientInvoice_Payment.AddObject(cpy);
                    _db.SaveChanges();
                    cpyId = cpy.cpy_id;
                }
            }
            UpdateCinRestToPay(socId, cinId);
            return cpyId;
        }

        public List<int> CreateCinPaymentsWithOutFile(int socId, List<KeyValue> cincpys)
        {
            var cpyGuid = Guid.NewGuid().ToString();
            var result = new List<int>();
            foreach (var oneCpy in cincpys)
            {
                var cpy = new TM_CPY_ClientInvoice_Payment
                {
                    cin_id = oneCpy.Key,
                    cpy_amount = oneCpy.DcValue,
                    cpy_d_create = DateTime.Now,
                    cpy_file = null,
                    cpy_comment = oneCpy.KeyStr2,
                    cpy_guid = cpyGuid,
                    cpy_payment_code = oneCpy.Value2
                };
                _db.TM_CPY_ClientInvoice_Payment.AddObject(cpy);
                _db.SaveChanges();
                result.Add(cpy.cpy_id);
                UpdateCinRestToPay(socId, oneCpy.Key);
            }

            return result;
        }

        public ClientInvoicePayment LoadClientInvoicePayment(int socId, int cinId, int cpyId)
        {
            var cpy = _db.TM_CPY_ClientInvoice_Payment.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId && m.cpy_id == cpyId).Select(m => new ClientInvoicePayment
            {
                CinId = m.cin_id,
                Id = m.cpy_id,
                CpyAmount = m.cpy_amount,
                CpyFile = m.cpy_file,
                CpyDCreation = m.cpy_d_create,
                CpyPaymentCode = m.cpy_payment_code
            }).FirstOrDefault();
            return cpy;
        }

        public List<ClientInvoicePayment> GetClientInvoicePaymentsList(int socId, int cinId, bool loadFile = false)
        {
            var cpys = _db.TM_CPY_ClientInvoice_Payment.Where(m => m.cin_id == cinId && m.TM_CIN_Client_Invoice.soc_id == socId).Select(m => new ClientInvoicePayment
            {
                CinId = m.cin_id,
                Id = m.cpy_id,
                CpyAmount = m.cpy_amount,
                CpyFile = m.cpy_file,
                CpyDCreation = m.cpy_d_create,
                HasFile = !string.IsNullOrEmpty(m.cpy_file),// m.cpy_file != null && m.cpy_file != "",
                CpyComment = m.cpy_comment,
                CpyGuid = m.cpy_guid,
                CpyPaymentCode = m.cpy_payment_code
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

        public List<KeyValue> GetCinByPaymentRecord(List<int> cpyIds)
        {
            var sodIds = (from cpyid in cpyIds
                          join cpy in _db.TM_CPY_ClientInvoice_Payment on cpyid equals cpy.cpy_id
                          select cpy)
                    .Select(l => new KeyValue { Key = l.cin_id, Key2 = l.cpy_id })
                    .Distinct()
                    .ToList();
            return sodIds;
        }

        public ClientInvoicePaymentInfo GetCinPaymentInfo(int socId, int cinId)
        {
            var cinInfo = ClientInvoiceLineRepository.GetClinetInvoicePaymentInfo(socId, cinId);
            cinInfo.CinPaymentList = GetClientInvoicePaymentsList(socId, cinId);
            decimal? paid = cinInfo.CinPaymentList.Sum(m => m.CpyAmount);
            var total2pay = cinInfo.TotalAmountTtc;
            var rest2pay = (total2pay ?? 0) - (paid ?? 0);
            cinInfo.CinTotal2Pay = total2pay ?? 0;
            cinInfo.CinPaid = paid ?? 0;
            cinInfo.CinRest2Pay = rest2pay;
            return cinInfo;
        }

        #endregion Client Invoie Payment

        public void UpdateCinRestToPay(int socId, int cinId)
        {
            var cininfo = GetCinPaymentInfo(socId, cinId);
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                cin.cin_rest_to_pay = cininfo.CinRest2Pay;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                _db.SaveChanges();
            }
        }

        public List<ClientInvoice> GetClientInvoiceByPrjId(int socId, int prjId)
        {
            ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                         && m.prj_id == prjId
               ).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderBy(m => m.CinDCreation).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinAccount ? -1 : 1);
            });
            return cins;
        }

        public List<ClientInvoice> GetClientInvoiceByCplId(int socId, int cplId)
        {
            ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                         && m.TM_COD_Client_Order.cpl_id == cplId
               ).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderBy(m => m.CinDCreation).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinAccount ? -1 : 1);
            });
            return cins;
        }

        public List<ClientInvoice> GetClientInvoiceByCodId(int socId, int codId)
        {
            ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                         && m.cod_id == codId
               ).Select(ClientInvoiceTranslator.RepositoryToEntity()).OrderBy(m => m.CinDCreation).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinAmount = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId).TotalAmountHt * (m.CinAccount ? -1 : 1);
            });
            return cins;
        }

        public void SetCinInvoiced(int socId, int cinId)
        {
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                cin.cin_invoiced = true;
                cin.cin_d_update = DateTime.Now;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                _db.SaveChanges();
            }
        }

        public void CinFullPaid(int socId, int cinId)
        {
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(m => m.cin_id == cinId && m.soc_id == socId);
            if (cin != null)
            {
                cin.cin_is_full_paid = true;
                cin.cin_d_update = DateTime.Now;
                _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                _db.SaveChanges();
            }
        }

        public List<ClientInvoice> GetClientInvoiceStatmentByClient(int cliId, int usrId, int socId, DateTime month, DateTime? endmonth, int comId, bool forCsv = false)
        {
            var usr = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId);
            bool hasRight = false;
            if (usr != null)
            {
                hasRight = usr.rol_id == 1 || usr.rol_id == 2 || usr.rol_id == 4 || usr.rol_id == 5 || usr.usr_super_right;
            }
            //var firstDayOfMonth = new DateTime(month.Year, month.Month, 1, 0, 0, 0);
            //var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);
            //lastDayOfMonth = new DateTime(lastDayOfMonth.Year, lastDayOfMonth.Month, lastDayOfMonth.Day, 23, 59, 59);
            //var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
            //    && (cliId == 0 || m.cli_id == cliId)
            //    && hasRight
            //    //&& m.cin_d_invoice >= firstDayOfMonth
            //    //&& m.cin_d_invoice <= lastDayOfMonth
            //    && m.cin_d_invoice >= month
            //    && (!endmonth.HasValue || m.cin_d_invoice <= endmonth)
            //    && (comId == 0 || m.usr_com_1 == comId)
            //    ).Distinct().Select(ClientInvoiceTranslator.RepositoryToEntity()).ToList();

            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                            && (cliId == 0 || m.cli_id == cliId)
                                                            && hasRight
                                                            && m.cin_d_invoice >= month
                                                            && (!endmonth.HasValue || m.cin_d_invoice <= endmonth)
                                                            && (comId == 0 || m.usr_com_1 == comId));

            var cinslist = cins.Distinct().Select(ClientInvoiceTranslator.RepositoryToEntity()).ToList();

            if (forCsv)
            {
                // get paiement detail
                //var cinIds = cinslist.Select(l => l.CinId).Distinct().ToList();

                #region Deep require
                //var cpys = (from cpy in _db.TM_CPY_ClientInvoice_Payment
                //            join cinid in cinIds on cpy.cin_id equals cinid
                //            select cpy).ToList();

                //var cpys =
                //    _db.TM_CPY_ClientInvoice_Payment.Join(cinIds, onecpy => onecpy.cin_id, cinId => cinId,
                //        (onecpy, cinId) => onecpy).ToList();

                #endregion Deep require
                //var cpys = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                //&& (cliId == 0 || m.cli_id == cliId)
                //&& hasRight
                //    //&& m.cin_d_invoice >= firstDayOfMonth
                //    //&& m.cin_d_invoice <= lastDayOfMonth
                //&& m.cin_d_invoice >= month
                //&& (!endmonth.HasValue || m.cin_d_invoice <= endmonth)
                //&& (comId == 0 || m.usr_com_1 == comId)
                //).Join(_db.TM_CPY_ClientInvoice_Payment, cin => cin.cin_id, onecpy => onecpy.cin_id, (cin, onecpy) => onecpy).ToList();

                var cpys = cins.Join(_db.TM_CPY_ClientInvoice_Payment, cin => cin.cin_id, onecpy => onecpy.cin_id, (cin, onecpy) => onecpy).ToList();
                cinslist.ForEach(cin =>
                {
                    var paymentlist = cpys.Where(l => l.cin_id == cin.CinId).Select(l => new ClientInvoicePayment
                    {
                        CpyDCreation = l.cpy_d_create,
                        CpyAmount = l.cpy_amount
                    }).ToList();
                    paymentlist = paymentlist.OrderBy(l => l.CpyDCreation).ToList();
                    cin.ClientInvoicePayments = paymentlist;
                });
            }

            var society = _db.TR_SOC_Society.FirstOrDefault(l => l.soc_id == socId);
            var baclist = _db.TR_BAC_Bank_Account.ToList();
            cinslist.ForEach(cin =>
            {
                cin.FId = StringCipher.EncoderSimple(cin.CinId.ToString(), "cinId");
                cin.ClientInvoiceLines = ClientInvoiceLineRepository.GetCiisByCinId(socId, cin.CinId).Where(m => m.LtpId != 6).ToList();
                cin.DfoList = _db.TM_DFO_Delivery_Form.Where(m => m.cod_id == cin.CodId).Select(m => m.dfo_code).ToList();
                var bac = baclist.FirstOrDefault(l => l.soc_id == socId && l.bac_id == cin.CinBank);
                if (bac != null)
                {
                    cin.RibName = bac.bac_account_owner;
                    cin.RibAddress = bac.bac_bank_adr;
                    cin.RibBankCode = bac.bac_rib_bank_code;
                    cin.RibAgenceCode = bac.bac_rib_agence_code;
                    cin.RibAccountNumber = bac.bac_rib_account_number;
                    cin.RibKey = bac.bac_rib_key;
                    cin.RibDomiciliationAgency = bac.bac_rib_agency_adr;
                    cin.RibCodeIban = bac.bac_iban;
                    cin.RibCodeBic = bac.bac_bic;
                    cin.RibBankName = bac.bac_bank_name;
                }
                else
                {
                    if (society != null)
                    {
                        if (cin.CinBank == 2)
                        {
                            cin.RibName = society.soc_rib_name_2;
                            cin.RibAddress = society.soc_rib_address_2;
                            cin.RibBankCode = society.soc_rib_bank_code_2;
                            cin.RibAgenceCode = society.soc_rib_agence_code_2;
                            cin.RibAccountNumber = society.soc_rib_account_number_2;
                            cin.RibKey = society.soc_rib_key_2;
                            cin.RibDomiciliationAgency = society.soc_rib_domiciliation_agency_2;
                            cin.RibCodeIban = society.soc_rib_code_iban_2;
                            cin.RibCodeBic = society.soc_rib_code_bic_2;
                            cin.RibBankName = society.soc_rib_domiciliation_agency_2;
                        }
                        else
                        {
                            cin.RibName = society.soc_rib_name;
                            cin.RibAddress = society.soc_rib_address;
                            cin.RibBankCode = society.soc_rib_bank_code;
                            cin.RibAgenceCode = society.soc_rib_agence_code;
                            cin.RibAccountNumber = society.soc_rib_account_number;
                            cin.RibKey = society.soc_rib_key;
                            cin.RibDomiciliationAgency = society.soc_rib_domiciliation_agency;
                            cin.RibCodeIban = society.soc_rib_code_iban;
                            cin.RibCodeBic = society.soc_rib_code_bic;
                            cin.RibBankName = society.soc_rib_domiciliation_agency;
                        }
                    }
                }
            });
            cinslist = cinslist.OrderBy(m => m.ClientCompanyName).ThenBy(m => m.UsrCommercial1).ToList();
            return cinslist;
        }

        public List<DeliveryForm> GetDfoStatmentFromClientInvoiceByClient(int cliId, int usrId, int socId,
            DateTime month)
        {
            var usr = _db.TM_USR_User.FirstOrDefault(m => m.usr_id == usrId);
            bool hasRight = false;
            if (usr != null)
            {
                hasRight = usr.rol_id == 1 || usr.rol_id == 2 || usr.rol_id == 4 || usr.rol_id == 5 ||
                           usr.usr_super_right;
            }
            var firstDayOfMonth = new DateTime(month.Year, month.Month, 1, 0, 0, 0);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);
            lastDayOfMonth = new DateTime(lastDayOfMonth.Year, lastDayOfMonth.Month, lastDayOfMonth.Day, 23, 59, 59);
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                            && m.cli_id == cliId
                                                            && hasRight
                                                            && m.cin_d_invoice >= firstDayOfMonth
                                                            && m.cin_d_invoice <= lastDayOfMonth
                ).Select(m => m.cin_id);
            var dfos = (from cin in cins
                        join dci in _db.TR_DCI_DeliveryForm_ClientInvoice on cin equals dci.cin_id
                        join dfo in _db.TM_DFO_Delivery_Form on dci.dfo_id equals dfo.dfo_id
                        select dfo).Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
            if (dfos.Any())
            {
                DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
                dfos.ForEach(m =>
                {
                    m.DeliveryFormLines = DeliveryFormLineRepository.GetDflsByDfoId(socId, m.DfoId).ToList();
                });
            }
            return dfos;
        }

        public int CreateSodFromCin(int socId, int cinId, int supId, int usrId, decimal coef, int oldSodId, DateTime? dCreate, string sodCode, int curId)
        {
            int sodId = 0;
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.soc_id == socId && l.cin_id == cinId);
            if (cin != null)
            {
                TM_SUP_Supplier supplier;
                var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cin.cin_id).ToList();
                decimal coefsodcin = coef;
                var oldsod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => (l.sod_id == oldSodId || l.sod_code == sodCode) && l.soc_id == socId);
                if (oldsod != null)
                {
                    sodId = oldsod.sod_id;
                    supplier = oldsod.TM_SUP_Supplier;
                    //oldsod.cin_id = cin.cin_id;
                    //_db.TM_SOD_Supplier_Order.ApplyCurrentValues(oldsod);
                    //_db.SaveChanges();

                    // 20210310
                    var csos =
                       _db.TR_CSO_ClientInvoice_SupplierOrder.FirstOrDefault(
                           l => l.sod_id == oldsod.sod_id && l.cin_id == cin.cin_id);
                    if (csos == null)
                    {
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = cin.cin_id, sod_id = oldsod.sod_id };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }
                }
                else
                {
                    // create sod
                    supplier = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == supId);
                    var sco = _db.TM_SCO_Supplier_Contact.FirstOrDefault(l => l.sup_id == supId);
                    if (supplier != null)
                    {
                        var now = DateTime.Now;
                        var onesod = new TM_SOD_Supplier_Order
                        {
                            sod_code = GenerateSodCode(socId, supId, (dCreate ?? now)),
                            soc_id = socId,
                            sod_name = "FOR " + cin.cin_code,
                            sod_d_creation = dCreate ?? now,
                            sod_d_update = dCreate ?? now,
                            usr_creator_id = usrId,
                            cur_id = curId,
                            vat_id = supplier.vat_id,
                            sod_guid = Guid.NewGuid(),
                            sup_id = supplier.sup_id,
                            sub_sup_id = supplier.sup_id,
                            sod_finish = false,
                            cin_id = cin.cin_id,
                            cli_id = cin.cli_id
                        };
                        if (sco != null)
                        {
                            onesod.sco_id = sco.sco_id;
                        }
                        _db.TM_SOD_Supplier_Order.AddObject(onesod);
                        _db.SaveChanges();
                        sodId = onesod.sod_id;

                        // 20210310
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = cinId, sod_id = sodId };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }

                }

                if (sodId != 0)
                {
                    // create sol
                    var sollist = new List<PurchaseLineBaseClass>();
                    var PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    foreach (var onecii in ciis)
                    {

                        var prddes = string.IsNullOrEmpty(onecii.cii_prd_des) || onecii.cii_prd_des == "null" ? string.Empty : onecii.cii_prd_des;
                        var des = string.IsNullOrEmpty(onecii.cii_description) || onecii.cii_description == "null" ? string.Empty : onecii.cii_description;
                        var description = string.Format("{0}{1}{2}", prddes,
                            (!string.IsNullOrEmpty(des) && !string.IsNullOrEmpty(onecii.cii_description) ? "\r\n" : string.Empty),
                            des);
                        var onesol = new PurchaseLineBaseClass()
                        {
                            SodId = sodId,
                            Order = onecii.cii_level1 ?? 1,
                            Description = onecii.cii_description,
                            Quantity = onecii.cii_quantity,
                            PrdId = onecii.prd_id,
                            PitId = onecii.pit_id,
                            //UnitPrice = onecii.cii_unit_price,
                            //DiscountAmount = onecii.cii_discount_amount,
                            //TotalPrice = onecii.cii_total_price,
                            //UnitPriceWithDis = onecii.cii_price_with_discount_ht,
                            //TotalCrudePrice = onecii.cii_total_crude_price,
                            VatId = onecii.vat_id,
                            PrdDescription = description,
                            //Guid = Guid.NewGuid(),
                            Finished = false,
                            PrdName = onecii.cii_prd_name == "null" ? string.Empty : onecii.cii_prd_name,

                        };
                        onesol.UnitPrice = (onecii.cii_unit_price * coefsodcin).HasValue
                            ? Math.Round((onecii.cii_unit_price * coefsodcin).Value, 2)
                            : 0;
                        onesol.TotalPrice = onesol.UnitPrice * onesol.Quantity;
                        onesol.TotalCrudePrice = onesol.TotalPrice * (1 + supplier.TR_VAT_Vat.vat_vat_rate / 100);
                        onesol.UnitPriceWithDis = onesol.UnitPrice;
                        int sol_id = PurchaseBaseLineRepository.InsertUpdateSol(onesol);
                        if (sol_id != 0)
                        {
                            // 2021-10-17
                            onecii.sol_id = sol_id;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(onecii);
                            _db.SaveChanges();
                        }
                        //sollist.Add(onesol);
                    }
                    //if (sollist.Any())
                    //{
                    //    var PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    //    PurchaseBaseLineRepository.InsertSolExpress(sollist, sodId);
                    //}
                    cin.sod_id = sodId;
                    _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                    _db.SaveChanges();
                }
            }
            return sodId;
        }

        /// <summary>
        /// 通过cii 来创建 sod
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <param name="supId"></param>
        /// <param name="usrId"></param>
        /// <param name="coef"></param>
        /// <param name="oldSodId"></param>
        /// <param name="dCreate"></param>
        /// <param name="sodCode"></param>
        /// <param name="ciiIdList"></param>
        /// <returns></returns>
        public int CreateSodFromCinCii(int socId, int cinId, int supId, int usrId, decimal coef, int oldSodId, DateTime? dCreate, string sodCode, List<int> ciiIdList)
        {
            int sodId = 0;
            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.soc_id == socId && l.cin_id == cinId);
            if (cin != null)
            {
                TM_SUP_Supplier supplier;
                //var ciis = _db.TM_CII_ClientInvoice_Line.Where(l => l.cin_id == cin.cin_id).ToList();
                var ciis = (from cii in _db.TM_CII_ClientInvoice_Line
                            join ciiId in ciiIdList on cii.cii_id equals ciiId
                            where cii.cin_id == cin.cin_id
                            select cii).Distinct().ToList();
                decimal coefsodcin = coef;
                var oldsod = _db.TM_SOD_Supplier_Order.FirstOrDefault(l => (l.sod_id == oldSodId || l.sod_code == sodCode) && l.soc_id == socId);
                if (oldsod != null)
                {
                    sodId = oldsod.sod_id;
                    supplier = oldsod.TM_SUP_Supplier;

                    // 20210310
                    var csos =
                       _db.TR_CSO_ClientInvoice_SupplierOrder.FirstOrDefault(
                           l => l.sod_id == oldsod.sod_id && l.cin_id == cin.cin_id);
                    if (csos == null)
                    {
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = cin.cin_id, sod_id = oldsod.sod_id };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }
                }
                else
                {
                    // create sod
                    supplier = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == supId);
                    var sco = _db.TM_SCO_Supplier_Contact.FirstOrDefault(l => l.sup_id == supId);
                    if (supplier != null)
                    {
                        var now = DateTime.Now;
                        var onesod = new TM_SOD_Supplier_Order()
                        {
                            sod_code = GenerateSodCode(socId, supId, (dCreate ?? now)),
                            soc_id = socId,
                            sod_name = "FOR " + cin.cin_code,
                            sod_d_creation = dCreate ?? now,
                            sod_d_update = dCreate ?? now,
                            usr_creator_id = usrId,
                            cur_id = supplier.cur_id,
                            vat_id = supplier.vat_id,
                            sod_guid = Guid.NewGuid(),
                            sup_id = supplier.sup_id,
                            sub_sup_id = supplier.sup_id,
                            sod_finish = false,
                            cin_id = cin.cin_id,
                            cli_id = cin.cli_id
                        };
                        if (sco != null)
                        {
                            onesod.sco_id = sco.sco_id;
                        }
                        _db.TM_SOD_Supplier_Order.AddObject(onesod);
                        _db.SaveChanges();
                        sodId = onesod.sod_id;

                        // 20210310
                        var newcso = new TR_CSO_ClientInvoice_SupplierOrder() { cin_id = cinId, sod_id = sodId };
                        _db.TR_CSO_ClientInvoice_SupplierOrder.AddObject(newcso);
                        _db.SaveChanges();
                    }

                }

                if (sodId != 0)
                {
                    // create sol
                    var sollist = new List<PurchaseLineBaseClass>();
                    var PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    foreach (var onecii in ciis)
                    {

                        var prddes = string.IsNullOrEmpty(onecii.cii_prd_des) || onecii.cii_prd_des == "null" ? string.Empty : onecii.cii_prd_des;
                        var des = string.IsNullOrEmpty(onecii.cii_description) || onecii.cii_description == "null" ? string.Empty : onecii.cii_description;
                        var description = string.Format("{0}{1}{2}", prddes,
                            (!string.IsNullOrEmpty(des) && !string.IsNullOrEmpty(onecii.cii_description) ? "\r\n" : string.Empty),
                            des);
                        var onesol = new PurchaseLineBaseClass()
                        {
                            SodId = sodId,
                            Order = onecii.cii_level1 ?? 1,
                            Description = onecii.cii_description,
                            Quantity = onecii.cii_quantity,
                            PrdId = onecii.prd_id,
                            PitId = onecii.pit_id,
                            //UnitPrice = onecii.cii_unit_price,
                            //DiscountAmount = onecii.cii_discount_amount,
                            //TotalPrice = onecii.cii_total_price,
                            //UnitPriceWithDis = onecii.cii_price_with_discount_ht,
                            //TotalCrudePrice = onecii.cii_total_crude_price,
                            VatId = onecii.vat_id,
                            PrdDescription = description,
                            //Guid = Guid.NewGuid(),
                            Finished = false,
                            PrdName = onecii.cii_prd_name == "null" ? string.Empty : onecii.cii_prd_name,

                        };
                        onesol.UnitPrice = (onecii.cii_unit_price * coefsodcin).HasValue
                            ? Math.Round((onecii.cii_unit_price * coefsodcin).Value, 2)
                            : 0;
                        onesol.TotalPrice = onesol.UnitPrice * onesol.Quantity;
                        onesol.TotalCrudePrice = onesol.TotalPrice * (1 + supplier.TR_VAT_Vat.vat_vat_rate / 100);
                        onesol.UnitPriceWithDis = onesol.UnitPrice;
                        int sol_id = PurchaseBaseLineRepository.InsertUpdateSol(onesol);
                        if (sol_id != 0)
                        {
                            // 2021-10-17
                            onecii.sol_id = sol_id;
                            _db.TM_CII_ClientInvoice_Line.ApplyCurrentValues(onecii);
                            _db.SaveChanges();
                        }
                        //sollist.Add(onesol);
                    }
                    //if (sollist.Any())
                    //{
                    //    var PurchaseBaseLineRepository = new PurchaseBaseLineRepository();
                    //    PurchaseBaseLineRepository.InsertSolExpress(sollist, sodId);
                    //}
                    cin.sod_id = sodId;
                    _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                    _db.SaveChanges();
                }
            }
            return sodId;
        }

        private string GenerateSodCode(int socId, int supId, DateTime? dCreate)
        {
            var now = DateTime.Now;
            var CinDCreation = dCreate ?? now;
            var lastCin = _db.TM_SOD_Supplier_Order.Where(m => m.soc_id == socId
                                                               && m.sod_d_creation.Year == CinDCreation.Year
                                                               && m.sod_d_creation.Month == CinDCreation.Month)
                .OrderByDescending(m => m.sod_code)
                .FirstOrDefault();
            string lastCode = string.Empty;

            var stravNewRule = ConfigurationSettings.AppSettings["AvNewRule"];
            bool avNewRule;
            bool.TryParse(stravNewRule, out avNewRule);
            // 新规则AV单另计数，老规则AV和FA混合计数
            if (avNewRule)
            {
                if (lastCin != null)
                {
                    string cinnumber = "0";
                    string lastCinCode = "0";
                    cinnumber = lastCin.sod_code.Substring(lastCin.sod_code.Length - 4);
                    lastCinCode = lastCin.sod_code;
                    lastCode = lastCinCode;
                }
            }
            else
            {
                if (lastCin != null)
                {
                    string cinnumber = "0";
                    string lastCinCode = "0";
                    string lastAvCode = "0";
                    string avoirnumber = "0";
                    //cinnumber = lastCin.cin_code.Substring(4, 7);
                    cinnumber = lastCin.sod_code.Substring(lastCin.sod_code.Length - 4);
                    lastCinCode = lastCin.sod_code;
                    int cinnb = Convert.ToInt32(cinnumber);
                    int avnb = Convert.ToInt32(avoirnumber);
                    lastCode = cinnb > avnb ? lastCinCode : lastAvCode;
                }
            }
            string pref = GetCodePref(7);
            var cinCode = GetGeneralRefContinuation(CinDCreation, pref, lastCode, _codeType);
            return cinCode;
        }

        // 20230623 新增功能，生成支付详情，SOD和CIN一起的支付详情，可以出Apply for payment
        public List<CinSodResult> GetCinWithSodWithPaymentResults(int socId, int cliId, DateTime dFrom, DateTime dTo, int usrId, string cincode)
        {
            DateTime createDateFrom = dFrom;
            DateTime createDateTo = dTo;
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);

            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            //ClientInvoiceLineRepository ClientInvoiceLineRepository = new ClientInvoiceLineRepository();
            List<CinSodResult> cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId
                                                         && (m.cin_d_creation >= createDateFrom && m.cin_d_creation <= createDateTo)
                                                         && (cliId == 0 || m.cli_id == cliId)
                                                         && (string.IsNullOrEmpty(cincode) || m.cin_code.Contains(cincode) || m.cin_name.Contains(cincode))
               // is Admin
               ).FilterClientInvoiceUser(isAdmin, usrId, subUser)
               .AsQueryable()
               .Select(ClientInvoiceTranslator.RepositoryToEntity()).ToList()
               .Select(l => AutoCopy<ClientInvoice, CinSodResult>(l)).ToList();

            var cinIds = cins.Select(l => l.CinId).ToList();

            var cinswithpayment = (from cin in cinIds
                                   join cpy in _db.TM_CPY_ClientInvoice_Payment
                                       on cin equals cpy.cin_id
                                   select cpy).ToList();

            var csos = (from cin in cins
                        join cso in _db.TR_CSO_ClientInvoice_SupplierOrder on cin.CinId equals cso.cin_id
                        where cso.TM_SOD_Supplier_Order != null
                        select cso.TM_SOD_Supplier_Order
                        ).AsQueryable().Select(PurchaseBaseTranslator.RepositoryToEntitySod())
                        .ToList();

            var sodIds = csos.Select(l => l.SodId).Distinct().ToList();
            var sols = (from sodid in sodIds
                        join sol in _db.TM_SOL_SupplierOrder_Lines
                            on sodid equals sol.sod_id
                        select sol).AsQueryable().Select(PurchaseBaseLineTranslator.RepositoryToEntitySol()).ToList();

            var sprs = (from sodid in sodIds
                        join onespr in _db.TR_SPR_SupplierOrder_Payment_Record
                            on sodid equals onespr.sod_id.Value
                        where onespr.sod_id.HasValue
                        select onespr).ToList();

            csos.ForEach(l =>
            {
                l.SodFId = StringCipher.EncoderSimple(l.SodId.ToString(), "sodId");
                l.PurchaseLines = sols.Where(m => m.SodId == l.SodId).OrderBy(m => m.Order).ToList();

                var sodSprs = sprs.Where(m => m.sod_id == l.SodId).Distinct().OrderByDescending(m => m.spr_d_payment).ToList();
                var sodpaymentrecords = sodSprs.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}\r\n",
                    oneSpr.spr_d_payment, oneSpr.spr_payment_code, oneSpr.spr_amount, l.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewSprFile('" + l.SodFId + "'," + oneSpr.spr_id + ")\">"),
                    (string.IsNullOrEmpty(oneSpr.spr_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                l.SodPaymentRecord = sodpaymentrecords;
            });

            var ciis = (from onecinId in cinIds
                        join cii in _db.TM_CII_ClientInvoice_Line on onecinId equals cii.cin_id
                        select cii).AsQueryable().Select(ClientInvoiceLineTranslator.RepositoryToEntity()).ToList();

            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                var genInfo = ClientInvoiceLineRepository.GetClinetInvoiceInfo(socId, m.CinId);
                m.CinAmount = genInfo.TotalAmountHt * (m.CinAccount ? -1 : 1);
                m.TotalAmountTtc = genInfo.TotalAmountTtc * (m.CinAccount ? -1 : 1);
                m.CinPaid = cinswithpayment.Where(l => l.cin_id == m.CinId).Sum(l => l.cpy_amount);
                m.SodInfos = csos.Where(l => l.CinId == m.CinId).DistinctBy(l => l.SodId).ToList();
                var cpyforcin = cinswithpayment.Where(l => l.cin_id == m.CinId).ToList();
                var paymentRecord = cpyforcin.Aggregate(string.Empty, (current, oneSpr) =>
                    current + string.Format("{4}→ {0:d}-<span style='background-color:yellow;color:red;'>{1}</span>-{2:n2}{3}{5}\r\n",
                    oneSpr.cpy_d_create, oneSpr.cpy_comment, oneSpr.cpy_amount, m.CurrencySymbol,
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : "<span style='cursor:pointer;font-weight:bolder;' onclick=\"return viewCpyFile('" + m.FId + "','" + (StringCipher.EncoderSimple(oneSpr.cpy_id.ToString(), "cpyId")) + "')\">"),
                    (string.IsNullOrEmpty(oneSpr.cpy_file) ? "" : " <i class='fa fa-file-o'></i></span></br>")
                    ));
                m.CinPaymentRecord = paymentRecord;
                m.ClientInvoiceLines = ciis.Where(l => l.CinId == m.CinId).OrderBy(l => l.CiiLevel1).ThenBy(l => l.CiiLevel2).ToList();
            });
            return cins.OrderByDescending(l => l.CinCode).ToList();
        }

        #region 从Cin建Dfo

        private DateTime LastDayOfMonth(DateTime dt)
        {
            return dt.AddDays(1 - dt.Day).AddMonths(1).AddDays(-1);
        }

        private DateTime CheckDateWithToday(DateTime dt)
        {
            // 处理一下创建日期： 如果在本月之前，在放置到所在月的最后一天，如果在本月，则放置到今天。是为了防止序号错乱。
            var createyear = dt.Year;
            var createmonth = dt.Month;
            var today = DateTime.Now;
            var todayyear = today.Year;
            var todaymonth = today.Month;
            DateTime result;
            if (createyear == todayyear && createmonth == todaymonth)
            {
                result = today;
            }
            else
            {
                result = LastDayOfMonth(dt);
            }
            return result;
        }

        /// <summary>
        /// 从Cin直接建立DFO，这个方法是针对需要先出发票，后出发货单使用的
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <param name="usrId"></param>
        /// <param name="ciiLines">Key : CinId, Key2: CiiId, Key3: Quantity</param>
        /// <param name="createDate"></param>
        /// <param name="deliveryDate"></param>
        /// <param name="ccoId"></param>
        /// <param name="dfoIdExisted">已存在DFOID</param>
        /// <returns></returns>
        public int CreateDfoFromCin(int socId, int cinId, int usrId, int dfoIdExisted, List<KeyValue> ciiLines, DateTime createDate, DateTime deliveryDate, int ccoId)
        {
            // 此方法需要先从Client invoice建立一个空的 client order，如果该cin已经有个cod，则不用建立
            // 然后delivery form line 对应的行，不从col取，而是从cii取
            int dfoId = 0;
            // 处理一下创建日期： 如果在本月之前，在放置到所在月的最后一天，如果在本月，则放置到今天。是为了防止序号错乱。
            var today = DateTime.Now;
            createDate = CheckDateWithToday(createDate);

            var cin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.cin_id == cinId && l.soc_id == socId);
            if (cin != null)
            {
                bool isCreate = false;
                var codId = cin.cod_id;
                if (codId.HasValue)
                {
                    var cod = _db.TM_COD_Client_Order.FirstOrDefault(l => l.cod_id == codId.Value);
                    if (cod == null)
                    {
                        isCreate = true;
                    }
                    else
                    {
                        // update
                        var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(l => l.cod_id == cod.cod_id && l.dfo_id == dfoIdExisted);
                        if (dfo != null)
                        {
                            dfoId = dfo.dfo_id;
                            // 获取已存在DFL 确认是否要更新，还是要新建
                            var dflineToCheck = (from ciiK in ciiLines
                                                 join cii in _db.TM_CII_ClientInvoice_Line on ciiK.Key2 equals cii.cii_id
                                                 join dfl in _db.TM_DFL_DevlieryForm_Line on cii.cii_id equals dfl.cii_id
                                                     into leftJ
                                                 from lj in leftJ.DefaultIfEmpty()
                                                 select new { ciiK, cii, lj }).ToList();

                            // dfl in same dfo
                            var dflOfSameDfo = dflineToCheck.Where(l => l.lj != null && l.lj.dfo_id == dfo.dfo_id).ToList();
                            var newDfls = dflineToCheck.Where(l => l.lj == null).ToList();
                            if (dflOfSameDfo.Any())
                            {
                                foreach (var oneDflCii in dflOfSameDfo)
                                {
                                    // update
                                    oneDflCii.lj.dfl_quantity = oneDflCii.ciiK.Key3;
                                    _db.TM_DFL_DevlieryForm_Line.ApplyCurrentValues(oneDflCii.lj);
                                }
                                _db.SaveChanges();
                            }
                            if (newDfls.Any())
                            {
                                foreach (var newDfl in newDfls)
                                {
                                    var oneDfl = new TM_DFL_DevlieryForm_Line
                                    {
                                        cii_id = newDfl.cii.cii_id,
                                        dfo_id = dfo.dfo_id,
                                        col_id = null,
                                        dfl_quantity = newDfl.ciiK.Key3
                                    };
                                    _db.TM_DFL_DevlieryForm_Line.AddObject(oneDfl);
                                }
                                _db.SaveChanges();
                            }
                        }
                        else
                        {
                            // dfo 不存在，新建一个dfo
                            var ccoDlv =
                                _db.TM_CCO_Client_Contact.Where(l => l.cli_id == cin.cli_id && (l.cco_id == ccoId || l.cco_is_delivery_adr))
                                    .OrderByDescending(l => l.cco_address1)
                                    .FirstOrDefault();

                            var onedfo = new DeliveryForm
                            {
                                DfoDCreation = createDate,
                                DfoDUpdate = today,
                                DfoDDelivery = deliveryDate,
                                UsrCreatorId = usrId,
                                CodId = codId.Value,
                                CliId = cin.cli_id,
                                SocId = socId,
                                DfoDeliveried = true,
                                Dlv_CcoAddress1 = ccoDlv != null ? ccoDlv.cco_address1 : cin.TM_CLI_CLient.cli_address1,
                                Dlv_CcoAddress2 = ccoDlv != null ? ccoDlv.cco_address2 : cin.TM_CLI_CLient.cli_address2,
                                Dlv_CcoPostcode = ccoDlv != null ? ccoDlv.cco_postcode : cin.TM_CLI_CLient.cli_postcode,
                                Dlv_CcoCity = ccoDlv != null ? ccoDlv.cco_city : cin.TM_CLI_CLient.cli_city,
                                Dlv_CcoCountry = ccoDlv != null ? ccoDlv.cco_country : cin.TM_CLI_CLient.cli_country,
                                Dlv_CcoTel1 = ccoDlv != null ? ccoDlv.cco_tel1 : cin.TM_CLI_CLient.cli_tel1,
                                Dlv_CcoFax = ccoDlv != null ? ccoDlv.cco_fax : cin.TM_CLI_CLient.cli_fax,
                                Dlv_CcoCellphone = ccoDlv != null ? ccoDlv.cco_cellphone : cin.TM_CLI_CLient.cli_cellphone,
                                Dlv_CcoEmail = ccoDlv != null ? ccoDlv.cco_email : cin.TM_CLI_CLient.cli_email,
                            };
                            DeliveryFormRepository DeliveryFormRepository = new DeliveryFormRepository();
                            dfoId = DeliveryFormRepository.CreateUpdateDeliveryForm(onedfo);
                            // Key : CinId, Key2: CiiId, Key3: Quantity
                            var dfls = (from ciiK in ciiLines
                                        join cii in _db.TM_CII_ClientInvoice_Line on ciiK.Key2 equals cii.cii_id
                                        join ciiK2 in ciiLines on cii.cin_id equals ciiK2.Key
                                        select new DeliveryFormLine
                                        {
                                            DfoId = dfoId,
                                            ColId = 0,
                                            DflQuantity = ciiK.Key3,
                                            CiiId = Convert.ToInt32(ciiK.Key2)
                                        }
                                ).ToList();
                            DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
                            DeliveryFormLineRepository.InsertUpdateAllDfl(dfls);
                            var dci = new TR_DCI_DeliveryForm_ClientInvoice
                            {
                                dfo_id = dfoId,
                                cin_id = cinId,
                            };
                            _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                            _db.SaveChanges();
                        }
                    }
                }
                else
                {
                    isCreate = true;
                }
                if (isCreate)
                {
                    // create cin
                    // firstly create project
                    var onePrj = new Project
                    {
                        SocId = socId,
                        PrjName = "PRJ-" + cin.cin_name,
                        PrjDCreation = createDate,
                        PrjDUpdate = today,
                        CliId = cin.cli_id,
                        PcoId = cin.pco_id,
                        PmoId = cin.pmo_id,
                        VatId = cin.vat_id,
                        UsrCreatorId = usrId
                    };
                    ProjectRepository ProjectRepository = new ProjectRepository();
                    int prjId = ProjectRepository.CreateUpdateProject(onePrj);
                    // secondly create cod
                    var onecode = new ClientOrder
                    {
                        CodDateCreation = createDate,
                        CodDateUpdate = today,
                        CliId = cin.cli_id,
                        PcoId = cin.pco_id,
                        PmoId = cin.pmo_id,
                        UsrCreatorId = usrId,
                        UsrCom1 = cin.usr_com_1,
                        UsrCom2 = cin.usr_com_2,
                        UsrCom3 = cin.usr_com_3,
                        VatId = cin.vat_id,
                        CplId = 0,
                        PrjId = prjId,
                        SocId = socId,
                        CodName = "ORD-" + cin.cin_name
                    };
                    ClientOrderRepository ClientOrderRepository = new ClientOrderRepository();
                    codId = ClientOrderRepository.CreateUpdateClientOrder(onecode);
                    cin.cod_id = codId;
                    cin.prj_id = prjId;
                    _db.TM_CIN_Client_Invoice.ApplyCurrentValues(cin);
                    _db.SaveChanges();
                    // finally create dfo and insert cii into dfl

                    var ccoDlv =
                        _db.TM_CCO_Client_Contact.Where(l => l.cli_id == cin.cli_id && (l.cco_id == ccoId || l.cco_is_delivery_adr))
                            .OrderByDescending(l => l.cco_address1)
                            .FirstOrDefault();

                    var dfo = new DeliveryForm
                    {
                        DfoDCreation = createDate,
                        DfoDUpdate = today,
                        DfoDDelivery = deliveryDate,
                        UsrCreatorId = usrId,
                        CodId = codId.Value,
                        CliId = cin.cli_id,
                        SocId = socId,
                        DfoDeliveried = true,
                        Dlv_CcoAddress1 = ccoDlv != null ? ccoDlv.cco_address1 : cin.TM_CLI_CLient.cli_address1,
                        Dlv_CcoAddress2 = ccoDlv != null ? ccoDlv.cco_address2 : cin.TM_CLI_CLient.cli_address2,
                        Dlv_CcoPostcode = ccoDlv != null ? ccoDlv.cco_postcode : cin.TM_CLI_CLient.cli_postcode,
                        Dlv_CcoCity = ccoDlv != null ? ccoDlv.cco_city : cin.TM_CLI_CLient.cli_city,
                        Dlv_CcoCountry = ccoDlv != null ? ccoDlv.cco_country : cin.TM_CLI_CLient.cli_country,
                        Dlv_CcoTel1 = ccoDlv != null ? ccoDlv.cco_tel1 : cin.TM_CLI_CLient.cli_tel1,
                        Dlv_CcoFax = ccoDlv != null ? ccoDlv.cco_fax : cin.TM_CLI_CLient.cli_fax,
                        Dlv_CcoCellphone = ccoDlv != null ? ccoDlv.cco_cellphone : cin.TM_CLI_CLient.cli_cellphone,
                        Dlv_CcoEmail = ccoDlv != null ? ccoDlv.cco_email : cin.TM_CLI_CLient.cli_email,
                    };
                    DeliveryFormRepository DeliveryFormRepository = new DeliveryFormRepository();
                    dfoId = DeliveryFormRepository.CreateUpdateDeliveryForm(dfo);

                    // Key : CinId, Key2: CiiId, Key3: Quantity
                    var dfls = (from ciiK in ciiLines
                                join cii in _db.TM_CII_ClientInvoice_Line on ciiK.Key2 equals cii.cii_id
                                join ciiK2 in ciiLines on cii.cin_id equals ciiK2.Key
                                select new DeliveryFormLine
                                {
                                    DfoId = dfoId,
                                    ColId = 0,
                                    DflQuantity = ciiK.Key3,
                                    CiiId = Convert.ToInt32(ciiK.Key2)
                                }
                        ).ToList();

                    DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
                    DeliveryFormLineRepository.InsertUpdateAllDfl(dfls);
                    var dci = new TR_DCI_DeliveryForm_ClientInvoice
                    {
                        dfo_id = dfoId,
                        cin_id = cinId,
                    };
                    _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                    _db.SaveChanges();
                }
            }
            return dfoId;
        }

        /// <summary>
        /// 获得CIN是否有创建DFO的可能，判断条件是：所有的CII都已经有了DFL，且数量相等，此时，则不可创建。
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cinId"></param>
        /// <returns></returns>
        private bool GetWetherCinCreateDfo(int socId, int cinId)
        {

            // 分两种情况，1.如果cin是有dfo来创建的，那么cii里面是有col_id，由于有col_id, 意味着要从cod创建dfo，再从dfo创建cii，对于有col_id 的 cii行，不选取
            // 2. 如果cin是从sod 创建的，那么cii里面是没有col_id 的，此时进行对比
            // 从而，分两种情况分析


            var ciiswithDfls = (from cii in _db.TM_CII_ClientInvoice_Line
                                join dfl in _db.TM_DFL_DevlieryForm_Line on cii.cii_id equals dfl.cii_id
                                    into leftJ
                                from lj in leftJ.DefaultIfEmpty()
                                where cii.cin_id == cinId && cii.TM_CIN_Client_Invoice.soc_id == socId
                                && !cii.col_id.HasValue
                                select new { cii, lj }).GroupBy(l => l.cii).ToList();
            var result = false;
            foreach (var oneCii in ciiswithDfls)
            {
                var dflQuantity = oneCii.Where(l => l.lj != null).Sum(l => l.lj.dfl_quantity);
                result = result || (oneCii.Key.cii_quantity - dflQuantity != 0);
            }
            return result;
        }
        #endregion 从Cin建Dfo

        #region widget

        public List<ClientInvoice> GetClientInvoiceToPay(int socId, int usrId)
        {
            // is manager or admin
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cins = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == socId && m.cin_isinvoice && (m.cin_is_full_paid == null || m.cin_is_full_paid == false)
                //&& (isAdmin || m.usr_creator_id == usrId)
                ).FilterClientInvoiceUser(isAdmin, usrId, subUser).AsQueryable().Select(ClientInvoiceTranslator.RepositoryToEntity()).ToList();
            cins.ForEach(cin =>
            {
                // get client invoice line info
                var ciis = _db.TM_CII_ClientInvoice_Line.Where(m => m.cin_id == cin.CinId).ToList();
                var amountHt = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_price ?? 0));
                var amountTtc = ciis.Where(m => m.ltp_id == 2 || m.ltp_id == 4 || m.ltp_id == 7).Sum(m => (m.cii_total_crude_price ?? 0));
                var ht = amountHt - (cin.CinDiscountAmount ?? 0);
                var ttc = ht * (1 + ((amountTtc - amountHt) / (amountHt != 0 ? amountHt : 1)));
                cin.CinAmount = ttc;

                // get payment info
                decimal hasPaid = _db.TM_CPY_ClientInvoice_Payment.Where(m => m.cin_id == cin.CinId && m.TM_CIN_Client_Invoice.soc_id == socId).Select(m => m.cpy_amount).ToList().Sum();
                cin.CinRestToPay = ttc - hasPaid;
            });
            cins = cins.Where(m => m.CinRestToPay > 0).ToList();
            cins.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
            });
            return cins;
        }

        #endregion widget

        #region Insert CIN

        public void InsertCinWithCii(List<ClientInvoice> cins)
        {

            // treate client

            //var clients = cins.Select(l => l.ClientCompanyName).Distinct().ToList();
            //foreach (var client in clients)
            //{
            //    var oneclient = _db.TM_CLI_CLient.FirstOrDefault(l => l.cli_company_name == client);
            //    if (client == null)
            //    {
            //        // create one client 

            //    }
            //}

            foreach (var onecin in cins)
            {
                // treate client
                int cliId = 0;
                int vatId = 1;
                int pcoId = 1;
                int pmoId = 1;
                int curId = 1;
                int? ccoId = null;
                var client = _db.TM_CLI_CLient.FirstOrDefault(l => l.cli_company_name == onecin.ClientCompanyName);
                if (client != null)
                {
                    cliId = client.cli_id;
                    vatId = client.vat_id;
                    pcoId = client.pco_id;
                    pmoId = client.pmo_id;
                    curId = client.cur_id;
                    ccoId = client.TM_CCO_Client_Contact.Any()
                        ? client.TM_CCO_Client_Contact.FirstOrDefault().cco_id
                        : (int?)null;

                }
                else
                {
                    // create client
                    var newclient = new TM_CLI_CLient();
                    newclient.cli_company_name = onecin.ClientCompanyName;
                    newclient.cmu_id = null;
                    newclient.usr_created_by = 1;
                    newclient.pco_id = 1;
                    newclient.pmo_id = 1;
                    newclient.act_id = null;
                    // check vat
                    var vatrate = onecin.ClientInvoiceLines.FirstOrDefault().VatRate;
                    var onevat = _db.TR_VAT_Vat.FirstOrDefault(l => l.vat_vat_rate == vatrate);
                    if (onevat != null)
                    {
                        newclient.vat_id = onevat.vat_id;
                        vatId = onevat.vat_id;
                    }
                    else
                    {
                        newclient.vat_id = 1;
                        vatId = 1;
                    }
                    newclient.cty_id = 1;
                    newclient.cur_id = 1;
                    newclient.cli_isactive = true;
                    newclient.cli_d_creation = DateTime.Now;
                    newclient.cli_d_update = DateTime.Now;
                    newclient.cli_isblocked = false;
                    newclient.cli_recieve_newsletter = false;
                    newclient.cmu_id = null;
                    newclient.soc_id = 1;
                    _db.TM_CLI_CLient.AddObject(newclient);
                    _db.SaveChanges();
                    cliId = newclient.cli_id;

                    // create cco
                    var newCco = new TM_CCO_Client_Contact();
                    newCco.cli_id = cliId;
                    newCco.civ_id = 1;
                    newCco.cco_firstname = "Default";
                    newCco.cco_lastname = "";
                    newCco.cco_is_delivery_adr = true;
                    newCco.cco_is_invoicing_adr = true;
                    newCco.usr_created_by = 1;
                    newCco.cco_d_creation = DateTime.Now;
                    newCco.cco_d_update = DateTime.Now;
                    newCco.cmu_id = null;
                    _db.TM_CCO_Client_Contact.AddObject(newCco);
                    _db.SaveChanges();
                    ccoId = newCco.cco_id;
                }
                var isinvoice = onecin.CinCode.StartsWith("FA");
                var newcin = new TM_CIN_Client_Invoice();
                newcin.cli_id = cliId;
                newcin.cin_code = onecin.CinCode;
                newcin.cin_d_creation = onecin.CinDCreation;
                newcin.cin_d_update = onecin.CinDUpdate;
                newcin.cin_d_invoice = onecin.CinDInvoice;
                newcin.usr_creator_id = 1;
                newcin.cur_id = curId;
                newcin.cin_account = !isinvoice;
                newcin.cin_d_term = onecin.CinDInvoice;
                newcin.pco_id = pcoId;
                newcin.pmo_id = pmoId;
                newcin.cco_id_invoicing = ccoId;
                newcin.cin_isinvoice = isinvoice;
                newcin.vat_id = vatId;
                newcin.prj_id = null;
                newcin.dfo_id = null;
                newcin.soc_id = 1;
                newcin.cin_invoiced = false;

                _db.TM_CIN_Client_Invoice.AddObject(newcin);
                _db.SaveChanges();
                var cinId = newcin.cin_id;

                // for lines
                foreach (var onecii in onecin.ClientInvoiceLines)
                {
                    var newcii = new TM_CII_ClientInvoice_Line();
                    newcii.cin_id = cinId;
                    newcii.cii_level1 = 1;
                    newcii.cii_level2 = 2;
                    newcii.prd_id = null;
                    newcii.cii_unit_price = onecii.CiiUnitPrice;
                    newcii.cii_quantity = onecii.CiiQuantity;
                    newcii.cii_total_price = onecii.CiiTotalPrice;
                    newcii.vat_id = vatId;
                    newcii.dfl_id = null;
                    newcii.cii_total_crude_price = onecii.CiiTotalCrudePrice;
                    newcii.cii_prd_name = onecii.PrdName;
                    newcii.cii_discount_amount = 0;
                    newcii.cii_discount_percentage = 0;
                    newcii.cii_price_with_discount_ht = onecii.CiiPriceWithDiscountHt;
                    newcii.ltp_id = 2;
                    _db.TM_CII_ClientInvoice_Line.AddObject(newcii);
                    _db.SaveChanges();
                }
            }
        }

        #endregion Insert CIN
    }
}
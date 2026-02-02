using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Runtime.Remoting.Messaging;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class CostPlanRepository : BaseSqlServerRepository
    {
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private ClientOrderRepository ClientOrderRepository = new ClientOrderRepository();
        private ClientOrderLineRepository ClientOrderLineRepository = new ClientOrderLineRepository();
        private CostPlanLineRepository CostPlanLineRepository = new CostPlanLineRepository();
        private UserRepository UserRepository = new UserRepository();

        public int CreateUpdateCostPlan(CostPlan oneCostPlan)
        {
            bool iscreate = false;
            int cplId = 0;
            int ccoInvId = 0;
            int ccoDlvId = 0;

            // check client and client contact
            //oneCostPlan.CliId = CreatClientCcoForCostPlan(oneCostPlan, out ccoInvId, out ccoDlvId);
            //oneCostPlan.CcoIdInvoicing = ccoInvId;

            oneCostPlan.CcoIdInvoicing = oneCostPlan.CcoIdInvoicing == 0 ? null : oneCostPlan.CcoIdInvoicing;
            //oneCostPlan.CcoIdDelivery = ccoDlvId;

            // check project
            var onePrj = new Project
            {
                PrjId = oneCostPlan.PrjId,
                VatId = oneCostPlan.VatId,
                PcoId = oneCostPlan.PcoId,
                PmoId = oneCostPlan.PmoId,
                PrjDUpdate = oneCostPlan.CplDateUpdate,
                PrjDCreation = oneCostPlan.CplDateCreation,
                CliId = oneCostPlan.CliId,
                PrjHeaderText = oneCostPlan.CplHeaderText,
                PrjFooterText = oneCostPlan.CplFooterText,
                PrjClientComment = oneCostPlan.CplClientComment,
                PrjInterComment = oneCostPlan.CplInterComment,
                UsrCreatorId = oneCostPlan.UsrCreatorId,
                SocId = oneCostPlan.SocId,
                PrjName = "Affaire " + oneCostPlan.CplName
            };
            int prjId = ProjectRepository.CheckCreateProject(onePrj);
            oneCostPlan.PrjId = prjId;

            if (oneCostPlan.CplId != 0)
            {
                var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == oneCostPlan.CplId && m.soc_id == oneCostPlan.SocId);
                if (cpl != null)
                {
                    cpl = CostPlanTranslator.EntityToRepository(oneCostPlan, cpl);
                    _db.TM_CPL_Cost_Plan.ApplyCurrentValues(cpl);
                    _db.SaveChanges();
                    cplId = cpl.cpl_id;
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
                    var newCpl = new TM_CPL_Cost_Plan();
                    var lastcpl = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == oneCostPlan.SocId
                    && m.cpl_d_creation.Year == oneCostPlan.CplDateCreation.Year
                    && m.cpl_d_creation.Month == oneCostPlan.CplDateCreation.Month).OrderByDescending(m => m.cpl_code).FirstOrDefault();
                    string lastCode = string.Empty;
                    if (lastcpl != null)
                    {
                        lastCode = lastcpl.cpl_code;
                    }
                    string pref = GetCodePref(3);
                    oneCostPlan.CplCode = GetGeneralRefContinuation(oneCostPlan.CplDateCreation, pref, lastCode, _codeType, oneCostPlan.CliId);
                    if (oneCostPlan.CstId == 8)
                    {
                        oneCostPlan.CstId = 8;
                    }
                    else
                    {
                        oneCostPlan.CstId = (oneCostPlan.CstId == 2) ? oneCostPlan.CstId : 1;
                    }
                    newCpl = CostPlanTranslator.EntityToRepository(oneCostPlan, newCpl, true);
                    _db.TM_CPL_Cost_Plan.AddObject(newCpl);
                    _db.SaveChanges();
                    cplId = newCpl.cpl_id;
                }
                catch (Exception)
                {

                }
            }
            return cplId;
        }

        public CostPlan LoadCostPlanById(int cplId, int socId, int usrId, bool forPdf = false, int loginMode = 0)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cpl = _db.TM_CPL_Cost_Plan.Where(m => m.cpl_id == cplId && m.soc_id == socId).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable()
                .Select(CostPlanTranslator.RepositoryToEntity())
                .FirstOrDefault();
            if (cpl != null)
            {
                cpl.FId = StringCipher.EncoderSimple(cpl.CplId.ToString(), "cplId");
                cpl.PrjFId = StringCipher.EncoderSimple(cpl.PrjId.ToString(), "prjId");
                cpl.CliFId = StringCipher.EncoderSimple(cpl.CliId.ToString(), "cliId");

                var cplinfo = CostPlanLineRepository.GetCostPlanInfo(socId, cpl.CplId);
                cpl.CplAmount = cplinfo.TotalAmountHt;
                cpl.CplAmountTtc = cplinfo.TotalAmountTtc;
                cpl.CplPurchaseAmount = cplinfo.TotalPurchasePrice;
                cpl.CplMarginAmount = cplinfo.TotalMargin;
                if (forPdf)
                {
                    cpl.CostPlanLines = CostPlanLineRepository.GetClnsByCplId(socId, cplId).Where(m => m.LtpId != 6).ToList();
                }
                if (loginMode == 1)
                {
                    var thUctUserComment = _db.TH_UCT_User_Comment.FirstOrDefault(m => m.usr_id == usrId && m.uct_fk_name == "cpl_id" && m.uct_fk_id == cplId);
                    if (thUctUserComment != null)
                    {
                        cpl.UserComment = thUctUserComment.uct_comment;
                    }
                }
            }
            return cpl;
        }

        /// <summary>
        /// if client or cco no exist, create them for cost plan
        /// </summary>
        /// <returns></returns>
        //public int CreatClientCcoForCostPlan(CostPlan oneCostPlan, out int invCcoId, out int dlvCcoId)
        //{
        //    invCcoId = oneCostPlan.CcoIdInvoicing;
        //    dlvCcoId = oneCostPlan.CcoIdDelivery;
        //    int cliId = 0;
        //    cliId = oneCostPlan.CliId;
        //    // check client exist
        //    ContactClientRepository contactClientRepository = new ContactClientRepository();
        //    ClientRepository ClientRepository = new ClientRepository();
        //    if (cliId == 0)
        //    {
        //        var oneClient = new Client
        //        {
        //            SocId = oneCostPlan.SocId,
        //            CompanyName = oneCostPlan.ClientCompanyName,
        //            VatId = oneCostPlan.VatId,
        //            PcoId = oneCostPlan.PcoId,
        //            PmoId = oneCostPlan.PmoId,
        //            UsrCreatedBy = oneCostPlan.UsrCreatorId,
        //            CtyId = 2,
        //            CurId = 1,
        //            Isactive = true,
        //            Isblocked = false,
        //            DateCreation = oneCostPlan.CplDateCreation,
        //            DateUpdate = oneCostPlan.CplDateUpdate,
        //            RecieveNewsletter = false,
        //            #region set client address by client contact
        //            Address1 = oneCostPlan.Inv_CcoAddress1,
        //            Address2 = oneCostPlan.Inv_CcoAddress2,
        //            City = oneCostPlan.Inv_CcoCity,
        //            Postcode = oneCostPlan.Inv_CcoPostcode,
        //            Tel1 = oneCostPlan.Inv_CcoTel1,
        //            Email = oneCostPlan.Inv_CcoEmail,
        //            Fax = oneCostPlan.Inv_CcoFax,
        //            Country = oneCostPlan.Inv_CcoCountry
        //            #endregion set client address by client contact
        //        };
        //        cliId = ClientRepository.CreateClientAutomatical(oneClient, false);
        //        if (cliId != 0)
        //        {
        //            var oneCcoInv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Facturation",
        //                CliId = cliId,
        //                SocId = oneCostPlan.SocId,
        //                CcoAddress1 = oneCostPlan.Inv_CcoAddress1,
        //                CcoAddress2 = oneCostPlan.Inv_CcoAddress2,
        //                CcoCellphone = oneCostPlan.Inv_CcoCellphone,
        //                CcoCity = oneCostPlan.Inv_CcoCity,
        //                CcoCountry = oneCostPlan.Inv_CcoCountry,
        //                CcoEmail = oneCostPlan.Inv_CcoEmail,
        //                CcoFax = oneCostPlan.Inv_CcoFax,
        //                CcoFirstname = oneCostPlan.Inv_CcoFirstname,
        //                CcoLastname = oneCostPlan.Inv_CcoLastname,
        //                CcoIsDeliveryAdr = false,
        //                CcoIsInvoicingAdr = true,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneCostPlan.Inv_CcoPostcode,
        //                CcoTel1 = oneCostPlan.Inv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneCostPlan.CplDateCreation,
        //                DateUpdate = oneCostPlan.CplDateUpdate,
        //                UsrCreatedBy = oneCostPlan.UsrCreatorId
        //            };
        //            invCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoInv).CcoId;
        //            var oneCcoDlv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Livraison",
        //                CliId = cliId,
        //                SocId = oneCostPlan.SocId,
        //                CcoAddress1 = oneCostPlan.Dlv_CcoAddress1,
        //                CcoAddress2 = oneCostPlan.Dlv_CcoAddress2,
        //                CcoCellphone = oneCostPlan.Dlv_CcoCellphone,
        //                CcoCity = oneCostPlan.Dlv_CcoCity,
        //                CcoCountry = oneCostPlan.Dlv_CcoCountry,
        //                CcoEmail = oneCostPlan.Dlv_CcoEmail,
        //                CcoFax = oneCostPlan.Dlv_CcoFax,
        //                CcoFirstname = oneCostPlan.Dlv_CcoFirstname,
        //                CcoLastname = oneCostPlan.Dlv_CcoLastname,
        //                CcoIsDeliveryAdr = true,
        //                CcoIsInvoicingAdr = false,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = oneCostPlan.Dlv_CcoPostcode,
        //                CcoTel1 = oneCostPlan.Dlv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneCostPlan.CplDateCreation,
        //                DateUpdate = oneCostPlan.CplDateUpdate,
        //                UsrCreatedBy = oneCostPlan.UsrCreatorId
        //            };
        //            dlvCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoDlv).CcoId;
        //        }
        //    }
        //    //if ((dlvCcoId == 0 || invCcoId == 0) && cliId != 0)
        //    if (cliId != 0)
        //    {
        //        var checkClient = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == cliId && m.soc_id == oneCostPlan.SocId);
        //        if (checkClient == null)
        //        {
        //            // create a client
        //            var oneClient = new Client
        //            {
        //                SocId = oneCostPlan.SocId,
        //                CompanyName = oneCostPlan.ClientCompanyName,
        //                VatId = oneCostPlan.VatId,
        //                PcoId = oneCostPlan.PcoId,
        //                PmoId = oneCostPlan.PmoId,
        //                UsrCreatedBy = oneCostPlan.UsrCreatorId,
        //                CtyId = 2,
        //                CurId = 1,
        //                Isactive = true,
        //                Isblocked = false,
        //                DateCreation = oneCostPlan.CplDateCreation,
        //                DateUpdate = oneCostPlan.CplDateUpdate,
        //                RecieveNewsletter = false
        //            };
        //            cliId = ClientRepository.CreateClientAutomatical(oneClient, false);
        //        }
        //        if (invCcoId == 0)
        //        {
        //            var oneCcoInv = new ContactClient
        //            {
        //                CcoAdresseTitle = "Contact Facturation",
        //                CliId = cliId,
        //                SocId = oneCostPlan.SocId,
        //                CcoAddress1 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoAddress1)) ? checkClient.cli_address1 : oneCostPlan.Inv_CcoAddress1,
        //                CcoAddress2 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoAddress2)) ? checkClient.cli_address2 : oneCostPlan.Inv_CcoAddress2,
        //                CcoCellphone = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoCellphone)) ? checkClient.cli_cellphone : oneCostPlan.Inv_CcoCellphone,
        //                CcoCity = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoCity)) ? checkClient.cli_city : oneCostPlan.Inv_CcoCity,
        //                CcoCountry = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoCountry)) ? checkClient.cli_country : oneCostPlan.Inv_CcoCountry,
        //                CcoEmail = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoEmail)) ? checkClient.cli_email : oneCostPlan.Inv_CcoEmail,
        //                CcoFax = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoFax)) ? checkClient.cli_fax : oneCostPlan.Inv_CcoFax,
        //                CcoFirstname = oneCostPlan.Inv_CcoFirstname,
        //                CcoLastname = oneCostPlan.Inv_CcoLastname,
        //                CcoIsDeliveryAdr = false,
        //                CcoIsInvoicingAdr = true,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoPostcode)) ? checkClient.cli_postcode : oneCostPlan.Inv_CcoPostcode,
        //                CcoTel1 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Inv_CcoTel1)) ? checkClient.cli_tel1 : oneCostPlan.Inv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneCostPlan.CplDateCreation,
        //                DateUpdate = oneCostPlan.CplDateUpdate,
        //                UsrCreatedBy = oneCostPlan.UsrCreatorId
        //            };
        //            invCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoInv).CcoId;
        //        }
        //        else
        //        {
        //            var oneCcoInv = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.TM_CLI_CLient.soc_id == oneCostPlan.SocId && m.cco_id == oneCostPlan.CcoIdInvoicing);
        //            if (oneCcoInv != null)
        //            {
        //                var oneCcoInvUpdate = new ContactClient
        //                {
        //                    CcoId = oneCcoInv.cco_id,
        //                    CcoAddress1 = oneCostPlan.Inv_CcoAddress1,
        //                    CcoAddress2 = oneCostPlan.Inv_CcoAddress2,
        //                    CcoCellphone = oneCostPlan.Inv_CcoCellphone,
        //                    CcoCity = oneCostPlan.Inv_CcoCity,
        //                    CcoCountry = oneCostPlan.Inv_CcoCountry,
        //                    CcoEmail = oneCostPlan.Inv_CcoEmail,
        //                    CcoFax = oneCostPlan.Inv_CcoFax,
        //                    CcoFirstname = oneCostPlan.Inv_CcoFirstname,
        //                    CcoLastname = oneCostPlan.Inv_CcoLastname,
        //                    CcoPostcode = oneCostPlan.Inv_CcoPostcode,
        //                    CcoTel1 = oneCostPlan.Inv_CcoTel1,
        //                    SocId = oneCostPlan.SocId
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
        //                SocId = oneCostPlan.SocId,
        //                CcoAddress1 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoAddress1)) ? checkClient.cli_address1 : oneCostPlan.Dlv_CcoAddress1,
        //                CcoAddress2 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoAddress2)) ? checkClient.cli_address2 : oneCostPlan.Dlv_CcoAddress2,
        //                CcoCellphone = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoCellphone)) ? checkClient.cli_cellphone : oneCostPlan.Dlv_CcoCellphone,
        //                CcoCity = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoCity)) ? checkClient.cli_city : oneCostPlan.Dlv_CcoCity,
        //                CcoCountry = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoCountry)) ? checkClient.cli_country : oneCostPlan.Dlv_CcoCountry,
        //                CcoEmail = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoEmail)) ? checkClient.cli_email : oneCostPlan.Dlv_CcoEmail,
        //                CcoFax = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoFax)) ? checkClient.cli_fax : oneCostPlan.Dlv_CcoFax,
        //                CcoFirstname = oneCostPlan.Dlv_CcoFirstname,
        //                CcoLastname = oneCostPlan.Dlv_CcoLastname,
        //                CcoIsDeliveryAdr = true,
        //                CcoIsInvoicingAdr = false,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoPostcode)) ? checkClient.cli_postcode : oneCostPlan.Dlv_CcoPostcode,
        //                CcoTel1 = (checkClient != null && string.IsNullOrEmpty(oneCostPlan.Dlv_CcoTel1)) ? checkClient.cli_tel1 : oneCostPlan.Dlv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneCostPlan.CplDateCreation,
        //                DateUpdate = oneCostPlan.CplDateUpdate,
        //                UsrCreatedBy = oneCostPlan.UsrCreatorId
        //            };
        //            dlvCcoId = contactClientRepository.CreateUpdateContactClient(oneCcoDlv).CcoId;
        //        }
        //        else
        //        {
        //            var oneCcoDlv = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.TM_CLI_CLient.soc_id == oneCostPlan.SocId && m.cco_id == oneCostPlan.CcoIdDelivery);
        //            if (oneCcoDlv != null)
        //            {
        //                var oneCcoDlvUpdate = new ContactClient
        //                {
        //                    CcoId = oneCcoDlv.cco_id,
        //                    CcoAddress1 = oneCostPlan.Dlv_CcoAddress1,
        //                    CcoAddress2 = oneCostPlan.Dlv_CcoAddress2,
        //                    CcoCellphone = oneCostPlan.Dlv_CcoCellphone,
        //                    CcoCity = oneCostPlan.Dlv_CcoCity,
        //                    CcoCountry = oneCostPlan.Dlv_CcoCountry,
        //                    CcoEmail = oneCostPlan.Dlv_CcoEmail,
        //                    CcoFax = oneCostPlan.Dlv_CcoFax,
        //                    CcoFirstname = oneCostPlan.Dlv_CcoFirstname,
        //                    CcoLastname = oneCostPlan.Dlv_CcoLastname,
        //                    CcoPostcode = oneCostPlan.Dlv_CcoPostcode,
        //                    CcoTel1 = oneCostPlan.Dlv_CcoTel1,
        //                    SocId = oneCostPlan.SocId
        //                };
        //                contactClientRepository.UpdateContactClientFromPage(oneCcoDlvUpdate);
        //            }
        //        }
        //    }
        //    return cliId;
        //}

        public List<CostPlan> SearchCostPlans(int socId,
            string costplanName,
            string costplanCode,
            string clientCompanyName,
            string ccoName,
            string projectCode,
            string projectName,
            int usrId,
            int cstId,
            bool superRight,
            int loginMode = 0,
            string flag = null,
            string comment = null,
            string _dateFrom = null,
            string _dateTo = null,
            string keyword = null,
            bool fromsite = false,
            bool isKeyprj = false)
        {
            DateTime createDateFrom;
            if (!DateTime.TryParse(_dateFrom, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
            {
                createDateFrom = new DateTime(1900, 1, 1);
            }
            DateTime createDateTo;
            if (!DateTime.TryParse(_dateTo, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
            {
                createDateTo = new DateTime(2500, 12, 31);
            }
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);

            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cpls = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId
                                                         && (string.IsNullOrEmpty(costplanName.Trim()) || m.cpl_name.Contains(costplanName.Trim()))
                                                         && (string.IsNullOrEmpty(costplanCode.Trim()) || m.cpl_code.Contains(costplanCode.Trim()))
                                                         // client
                                                         && (string.IsNullOrEmpty(clientCompanyName.Trim()) || m.TM_CLI_CLient.cli_company_name.Contains(clientCompanyName.Trim()))
                                                         // cco delivery
                                                         && (
                                                         string.IsNullOrEmpty(ccoName.Trim()) || m.TM_CCO_Client_Contact.cco_firstname.Contains(ccoName.Trim())
                                                             || m.TM_CCO_Client_Contact.cco_lastname.Contains(ccoName.Trim())
                                                             || m.TM_CCO_Client_Contact.cco_adresse_title.Contains(ccoName.Trim())

                                                         // cco invoicing
                                                         //|| m.TM_CCO_Client_Contact1.cco_firstname.Contains(ccoName.Trim())
                                                         //|| m.TM_CCO_Client_Contact1.cco_lastname.Contains(ccoName.Trim())
                                                         //|| m.TM_CCO_Client_Contact1.cco_adresse_title.Contains(ccoName.Trim())
                                                         )
                                                         // project
                                                         && (string.IsNullOrEmpty(projectCode.Trim()) || m.TM_PRJ_Project.prj_code.Contains(projectCode.Trim()))
                                                         && (string.IsNullOrEmpty(projectName.Trim()) || m.TM_PRJ_Project.prj_name.Contains(projectName.Trim()))
                                                         // status
                                                         && (cstId == 0 || m.cst_id == cstId)
                                                         && (m.cpl_d_creation >= createDateFrom && m.cpl_d_creation <= createDateTo)
                // is Admin
                //&& (isAdmin || m.usr_creator_id == usrId
                //|| m.usr_commercial1 == usrId
                //|| m.usr_commercial2 == usrId
                //|| m.usr_commercial3 == usrId
                //)
                && (superRight || m.usr_creator_id == usrId || m.usr_commercial1 == usrId || m.usr_commercial2 == usrId || m.usr_commercial3 == usrId)
                // 20231111 加入keyword
                && ((string.IsNullOrEmpty(keyword) || m.cpl_inter_comment.Contains(keyword))
                || (string.IsNullOrEmpty(keyword) || m.cpl_client_comment.Contains(keyword)))
                && (!fromsite || m.cpl_fromsite == true)
                                                         && (!isKeyprj || m.cpl_key_project == true)
                ).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable().Select(CostPlanTranslator.RepositoryToEntity4Search()).ToList();

            var cplsIds = cpls.Select(l => l.CplId).Distinct().ToList();


            if (!string.IsNullOrEmpty(keyword))
            {
                var cplcheckcln = _db.TM_CLN_CostPlan_Lines.Where(l =>
                    ((string.IsNullOrEmpty(keyword) || l.cln_prd_name.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.cln_prd_des.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.cln_description.Contains(keyword)))
                    &&
                    l.TM_CPL_Cost_Plan.soc_id == socId
                          && (cstId == 0 || l.TM_CPL_Cost_Plan.cst_id == cstId)
                                                         && (l.TM_CPL_Cost_Plan.cpl_d_creation >= createDateFrom && l.TM_CPL_Cost_Plan.cpl_d_creation <= createDateTo)
                && (superRight || l.TM_CPL_Cost_Plan.usr_creator_id == usrId || l.TM_CPL_Cost_Plan.usr_commercial1 == usrId || l.TM_CPL_Cost_Plan.usr_commercial2 == usrId || l.TM_CPL_Cost_Plan.usr_commercial3 == usrId)
                && (!fromsite || l.TM_CPL_Cost_Plan.cpl_fromsite == true)
                    ).Select(l => l.TM_CPL_Cost_Plan).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable().Select(CostPlanTranslator.RepositoryToEntity4Search()).ToList();

                var cplclncplIds = cplcheckcln.Select(l => l.CplId).ToList();

                var cplclnIdsConserve = cplclncplIds.Except(cplsIds).ToList();

                var cplcln2conserve = (from cpl in cplcheckcln
                                       join cplId2 in cplclnIdsConserve on cpl.CplId equals cplId2
                                       select cpl).ToList();
                cpls.AddRange(cplcln2conserve);
            }

            if (loginMode == 1)
            {
                var cplIds = cpls.Select(m => m.CplId).ToList();
                var comments = (from cmt in _db.TH_UCT_User_Comment
                                where cmt.usr_id == usrId && cmt.uct_fk_id.HasValue && cplIds.Contains(cmt.uct_fk_id.Value)
                                && (string.IsNullOrEmpty(comment) || cmt.uct_comment.Contains(comment))
                                select cmt).ToList();
                var flags = (from flg in _db.TH_UFL_User_Flag
                             where flg.usr_id == usrId && flg.ufl_fk_id.HasValue && cplIds.Contains(flg.ufl_fk_id.Value)
                                      && (string.IsNullOrEmpty(flag) || flg.ufl_comment.Contains(flag))
                             select flg).ToList();
                if (!string.IsNullOrEmpty(flag))
                {
                    var flagscpl = flags.Where(m => m.ufl_fk_id.HasValue).Select(m => m.ufl_fk_id.Value);
                    cpls = cpls.Where(m => flagscpl.Contains(m.CplId)).ToList();
                }
                if (!string.IsNullOrEmpty(comment))
                {
                    var commentscpl = comments.Where(m => m.uct_fk_id.HasValue).Select(m => m.uct_fk_id.Value);
                    cpls = cpls.Where(m => commentscpl.Contains(m.CplId)).ToList();
                }
                cpls.ForEach(m =>
                {
                    m.FId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                    m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                    m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                    var cplinfo = CostPlanLineRepository.GetCostPlanInfo(socId, m.CplId);
                    m.CplAmount = cplinfo.TotalAmountHt;
                    m.CplAmountTtc = cplinfo.TotalAmountTtc;
                    m.CplPurchaseAmount = cplinfo.TotalPurchasePrice;
                    m.UserComment = comments.Any(l => l.uct_fk_id == m.CplId) ? comments.FirstOrDefault(l => l.uct_fk_id == m.CplId).uct_comment : string.Empty;
                    m.UserFlag = flags.Any(l => l.ufl_fk_id == m.CplId) ? flags.FirstOrDefault(l => l.ufl_fk_id == m.CplId).ufl_comment : string.Empty;
                });

            }
            else
            {
                cpls.ForEach(m =>
                    {
                        m.FId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                        m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                        m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                        var cplinfo = CostPlanLineRepository.GetCostPlanInfo(socId, m.CplId);
                        m.CplAmount = cplinfo.TotalAmountHt;
                        m.CplAmountTtc = cplinfo.TotalAmountTtc;
                        m.CplPurchaseAmount = cplinfo.TotalPurchasePrice;
                    });
            }
            cpls = cpls.OrderByDescending(m => m.CplId).ToList();
            return cpls;
        }

        public void AddUpdateDiscount(int socId, int cplId, decimal? discountPercentage, decimal? discountAmount)
        {
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == cplId && m.soc_id == socId);
            if (cpl != null)
            {
                cpl.cpl_discount_amount = ((discountAmount ?? 0) == 0 ? null : discountAmount);
                cpl.cpl_discount_percentage = ((discountPercentage ?? 0) == 0 ? null : discountPercentage);
                _db.TM_CPL_Cost_Plan.ApplyCurrentValues(cpl);
                _db.SaveChanges();
            }
        }

        public int DuplicateCostPlan(int socId, int cplId, int usrId, bool sameProject)
        {
            int newcplId = 0;
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.soc_id == socId && m.cpl_id == cplId);
            if (cpl != null)
            {
                var newCpl = new TM_CPL_Cost_Plan
                {
                    cpl_id = cpl.cpl_id,
                    soc_id = cpl.soc_id,
                    // check project
                    //prj_id = cpl.prj_id,
                    vat_id = cpl.vat_id,
                    // new code
                    //cpl_code = cpl.cpl_code,
                    cpl_d_creation = DateTime.Now,
                    cpl_d_update = DateTime.Now,
                    cst_id = 1,
                    cli_id = cpl.cli_id,
                    pco_id = cpl.pco_id,
                    pmo_id = cpl.pmo_id,
                    cpl_d_validity = cpl.cpl_d_validity,
                    cpl_d_pre_delivery = cpl.cpl_d_pre_delivery,
                    cpl_header_text = cpl.cpl_header_text,
                    cpl_footer_text = cpl.cpl_footer_text,
                    //cco_id_delivery = cpl.cco_id_delivery,
                    cco_id_invoicing = cpl.cco_id_invoicing,
                    cpl_client_comment = cpl.cpl_client_comment,
                    cpl_inter_comment = cpl.cpl_inter_comment,
                    // creator
                    usr_creator_id = usrId,
                    cpl_name = cpl.cpl_name,
                    //cpl_inv_cco_firstname = cpl.cpl_inv_cco_firstname,
                    //cpl_inv_cco_lastname = cpl.cpl_inv_cco_lastname,
                    //cpl_inv_cco_address1 = cpl.cpl_inv_cco_address1,
                    //cpl_inv_cco_address2 = cpl.cpl_inv_cco_address2,
                    //cpl_inv_cco_postcode = cpl.cpl_inv_cco_postcode,
                    //cpl_inv_cco_city = cpl.cpl_inv_cco_city,
                    //cpl_inv_cco_country = cpl.cpl_inv_cco_country,
                    //cpl_inv_cco_tel1 = cpl.cpl_inv_cco_tel1,
                    //cpl_inv_cco_fax = cpl.cpl_inv_cco_fax,
                    //cpl_inv_cco_cellphone = cpl.cpl_inv_cco_cellphone,
                    //cpl_inv_cco_email = cpl.cpl_inv_cco_email,
                    //cpl_dlv_cco_firstname = cpl.cpl_dlv_cco_firstname,
                    //cpl_dlv_cco_lastname = cpl.cpl_dlv_cco_lastname,
                    //cpl_dlv_cco_address1 = cpl.cpl_dlv_cco_address1,
                    //cpl_dlv_cco_address2 = cpl.cpl_dlv_cco_address2,
                    //cpl_dlv_cco_postcode = cpl.cpl_dlv_cco_postcode,
                    //cpl_dlv_cco_city = cpl.cpl_dlv_cco_city,
                    //cpl_dlv_cco_country = cpl.cpl_dlv_cco_country,
                    //cpl_dlv_cco_tel1 = cpl.cpl_dlv_cco_tel1,
                    //cpl_dlv_cco_fax = cpl.cpl_dlv_cco_fax,
                    //cpl_dlv_cco_cellphone = cpl.cpl_dlv_cco_cellphone,
                    //cpl_dlv_cco_email = cpl.cpl_dlv_cco_email,
                    cpl_discount_amount = cpl.cpl_discount_amount,
                    cpl_discount_percentage = cpl.cpl_discount_percentage,
                    usr_commercial1 = cpl.usr_commercial1,
                    usr_commercial2 = cpl.usr_commercial2,
                    usr_commercial3 = cpl.usr_commercial3,
                    cpl_key_project = cpl.cpl_key_project ?? false,
                };
                if (!sameProject)
                {
                    var onePrj = new Project
                    {
                        PrjId = 0,
                        VatId = newCpl.vat_id,
                        PcoId = newCpl.pco_id,
                        PmoId = newCpl.pmo_id,
                        PrjDUpdate = newCpl.cpl_d_update,
                        PrjDCreation = newCpl.cpl_d_creation,
                        CliId = newCpl.cli_id,
                        PrjHeaderText = newCpl.cpl_header_text,
                        PrjFooterText = newCpl.cpl_footer_text,
                        PrjClientComment = newCpl.cpl_client_comment,
                        PrjInterComment = newCpl.cpl_inter_comment,
                        UsrCreatorId = newCpl.usr_creator_id,
                        SocId = newCpl.soc_id,
                        PrjName = "Affaire " + newCpl.cpl_name
                    };
                    int prjId = ProjectRepository.CheckCreateProject(onePrj);
                    newCpl.prj_id = prjId;
                }
                else
                {
                    newCpl.prj_id = cpl.prj_id;
                }

                var lastcpl = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == newCpl.soc_id
                    && m.cpl_d_creation.Year == newCpl.cpl_d_creation.Year
                    && m.cpl_d_creation.Month == newCpl.cpl_d_creation.Month).OrderByDescending(m => m.cpl_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastcpl != null)
                {
                    lastCode = lastcpl.cpl_code;
                }
                string pref = GetCodePref(3);
                newCpl.cpl_code = GetGeneralRefContinuation(newCpl.cpl_d_creation, pref, lastCode, _codeType, cpl.cli_id);
                _db.TM_CPL_Cost_Plan.AddObject(newCpl);
                _db.SaveChanges();
                newcplId = newCpl.cpl_id;
                DuplicateCostPlanLines(cplId, socId, newcplId);
            }
            return newcplId;
        }

        public void DuplicateCostPlanLines(int cplId, int socId, int newcplId)
        {
            var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId && m.TM_CPL_Cost_Plan.soc_id == socId).ToList();
            List<TM_CLN_CostPlan_Lines> newclnList = new List<TM_CLN_CostPlan_Lines>();
            foreach (var onecln in clns)
            {
                var newcln = new TM_CLN_CostPlan_Lines
                {
                    cpl_id = newcplId,
                    cln_id = onecln.cln_id,
                    cln_level1 = onecln.cln_level1,
                    cln_level2 = onecln.cln_level2,
                    cln_description = onecln.cln_description,
                    prd_id = onecln.prd_id,
                    pit_id = onecln.pit_id,
                    cln_purchase_price = onecln.cln_purchase_price,
                    cln_unit_price = onecln.cln_unit_price,
                    cln_quantity = onecln.cln_quantity,
                    cln_total_price = onecln.cln_total_price,
                    cln_total_crude_price = onecln.cln_total_crude_price,
                    vat_id = onecln.vat_id,
                    ltp_id = onecln.ltp_id,
                    cln_discount_amount = onecln.cln_discount_amount,
                    cln_discount_percentage = onecln.cln_discount_percentage,
                    cln_price_with_discount_ht = onecln.cln_price_with_discount_ht,
                    cln_margin = onecln.cln_margin,
                    cln_prd_name = onecln.cln_prd_name,
                    cln_prd_des = onecln.cln_prd_des
                };
                newclnList.Add(newcln);
            }
            foreach (var cln in newclnList)
            {
                _db.TM_CLN_CostPlan_Lines.AddObject(cln);
                _db.SaveChanges();
            }
        }

        public int DeleteCostPlan(int socId, int cplId)
        {
            int deletedIndex = 0;
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.soc_id == socId && m.cpl_id == cplId);
            if (cpl != null)
            {
                var cod = _db.TM_COD_Client_Order.Any(m => m.cpl_id == cplId && m.soc_id == socId);
                if (cod)
                {
                    deletedIndex = 0;
                }
                else
                {
                    var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cplId).ToList();
                    foreach (var tmClnCostPlanLinese in clns)
                    {
                        _db.TM_CLN_CostPlan_Lines.DeleteObject(tmClnCostPlanLinese);
                        _db.SaveChanges();
                    }
                    _db.TM_CPL_Cost_Plan.DeleteObject(cpl);
                    _db.SaveChanges();
                    deletedIndex = 1;
                }
            }
            return deletedIndex;
        }

        public int PassCostPlan2ClientOrder(int cplId, int socId)
        {
            int codId = 0;
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.soc_id == socId && m.cpl_id == cplId);
            if (cpl != null && cpl.cst_id != 2)
            {
                var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cpl.cpl_id).ToList();
                var cod = new ClientOrder
                {
                    CodId = 0,
                    CplId = cpl.cpl_id,
                    SocId = cpl.soc_id,
                    PrjId = cpl.prj_id,
                    VatId = cpl.vat_id,
                    CplCode = cpl.cpl_code,
                    PrjName = cpl.TM_PRJ_Project.prj_name,
                    PrjCode = cpl.TM_PRJ_Project.prj_code,
                    CodDateCreation = DateTime.Now,
                    CodDateUpdate = DateTime.Now,
                    CliId = cpl.cli_id,
                    ClientCompanyName = cpl.TM_CLI_CLient.cli_company_name,
                    PcoId = cpl.pco_id,
                    PmoId = cpl.pmo_id,
                    PaymentMode = cpl.TR_PMO_Payment_Mode.pmo_designation,
                    PaymentCondition = cpl.TR_PCO_Payment_Condition.pco_designation,
                    CodDatePreDeliveryForm = null,
                    CodDatePreDeliveryTo = null,
                    CodDateEndWork = null,
                    CodHeaderText = cpl.cpl_header_text,
                    CodFooterText = cpl.cpl_footer_text,
                    //CcoIdDelivery = cpl.cco_id_delivery,
                    CcoIdInvoicing = cpl.cco_id_invoicing,
                    CodClientComment = cpl.cpl_client_comment,
                    CodInterComment = cpl.cpl_inter_comment,
                    UsrCreatorId = cpl.usr_creator_id,
                    CodName = cpl.cpl_name,
                    #region cco
                    // invoicing
                    //Inv_CcoFirstname = cpl.cpl_inv_cco_firstname,
                    //Inv_CcoLastname = cpl.cpl_inv_cco_lastname,
                    //Inv_CcoAddress1 = cpl.cpl_inv_cco_address1,
                    //Inv_CcoAddress2 = cpl.cpl_inv_cco_address2,
                    //Inv_CcoPostcode = cpl.cpl_inv_cco_postcode,
                    //Inv_CcoCity = cpl.cpl_inv_cco_city,
                    //Inv_CcoCountry = cpl.cpl_inv_cco_country,
                    //Inv_CcoTel1 = cpl.cpl_inv_cco_tel1,
                    //Inv_CcoFax = cpl.cpl_inv_cco_fax,
                    //Inv_CcoCellphone = cpl.cpl_inv_cco_cellphone,
                    //Inv_CcoEmail = cpl.cpl_inv_cco_email,
                    Inv_CcoRef = cpl.TM_CCO_Client_Contact != null ? cpl.TM_CCO_Client_Contact.cco_ref : string.Empty,
                    // delivery
                    //Dlv_CcoFirstname = cpl.cpl_dlv_cco_firstname,
                    //Dlv_CcoLastname = cpl.cpl_dlv_cco_lastname,
                    //Dlv_CcoAddress1 = cpl.cpl_dlv_cco_address1,
                    //Dlv_CcoAddress2 = cpl.cpl_dlv_cco_address2,
                    //Dlv_CcoPostcode = cpl.cpl_dlv_cco_postcode,
                    //Dlv_CcoCity = cpl.cpl_dlv_cco_city,
                    //Dlv_CcoCountry = cpl.cpl_dlv_cco_country,
                    //Dlv_CcoTel1 = cpl.cpl_dlv_cco_tel1,
                    //Dlv_CcoFax = cpl.cpl_dlv_cco_fax,
                    //Dlv_CcoCellphone = cpl.cpl_dlv_cco_cellphone,
                    //Dlv_CcoEmail = cpl.cpl_dlv_cco_email,
                    //Dlv_CcoRef = cpl.TM_CCO_Client_Contact.cco_ref,
                    #endregion cco
                    CodDiscountAmount = cpl.cpl_discount_amount,
                    CodDiscountPercentage = cpl.cpl_discount_percentage,
                    UsrCom1 = cpl.usr_commercial1,
                    UsrCom2 = cpl.usr_commercial2,
                    UsrCom3 = cpl.usr_commercial3,
                    CodKeyProject = cpl.cpl_key_project ?? false,
                };
                codId = ClientOrderRepository.CreateUpdateClientOrder(cod);
                ClientOrderLineRepository.InsertColByCln(codId, clns);
            }
            return codId;
        }

        public List<CostPlan> GetCostPlansByProjectId(int socId, int prjId)
        {
            var cpls = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId && m.prj_id == prjId).Select(CostPlanTranslator.RepositoryToEntity()).OrderByDescending(m => m.CplDateCreation).ToList();
            cpls.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CplAmount = CostPlanLineRepository.GetCostPlanInfo(socId, m.CplId).TotalAmountHt;
            });

            return cpls;
        }

        public void ChangeCostplanStatus(int socId, List<int> cplIds, int cstId)
        {
            var cpls = (from cpl in _db.TM_CPL_Cost_Plan join cplid in cplIds on cpl.cpl_id equals cplid where cpl.soc_id == socId select cpl).ToList();
            if (cstId == 2)
            {
                foreach (var tmCplCostPlan in cpls.Where(tmCplCostPlan => tmCplCostPlan.TM_CLN_CostPlan_Lines.Any()))
                {
                    PassCostPlan2ClientOrder(tmCplCostPlan.cpl_id, socId);
                }
                //cpls.ForEach(m => PassCostPlan2ClientOrder(m.cpl_id, socId));
            }
            else
            {
                foreach (var tmCplCostPlan in cpls)
                {
                    tmCplCostPlan.cst_id = cstId;
                    tmCplCostPlan.cpl_d_update = DateTime.Now;
                    _db.TM_CPL_Cost_Plan.ApplyCurrentValues(tmCplCostPlan);
                    _db.SaveChanges();
                }
            }
        }

        public void ChangeCommercial(int socId, int usrId, int cplId, int com1, int com2, int com3)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cpl = _db.TM_CPL_Cost_Plan.Where(m => m.cpl_id == cplId && m.soc_id == socId).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable().FirstOrDefault();
            if (cpl != null)
            {
                cpl.usr_commercial1 = com1 != 0 ? com1 : (int?)null;
                cpl.usr_commercial2 = com2 != 0 ? com2 : (int?)null;
                cpl.usr_commercial3 = com3 != 0 ? com3 : (int?)null;
                cpl.cpl_d_update = DateTime.Now;
                _db.TM_CPL_Cost_Plan.ApplyCurrentValues(cpl);
                _db.SaveChanges();
            }
        }

        #region widget
        public List<CostPlan> GetCostPlansInProgress(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cpls = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId && m.cst_id == 1).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable().Select(CostPlanTranslator.RepositoryToEntity()).ToList();
            cpls.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.CplAmount = CostPlanLineRepository.GetCostPlanInfo(socId, m.CplId).TotalAmountHt;
            });

            cpls = cpls.OrderByDescending(m => m.CplId).ToList();
            return cpls;
        }

        public List<CostPlan> GetCostPlansInProgressThisMonthAndLastMonth(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var lastmonth = DateTime.Now.AddDays(1 - DateTime.Now.Day).AddMonths(-1).Date.AddDays(1 - DateTime.Now.Day);
            var cpls = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId && m.cst_id == 1
                && m.cpl_d_creation >= lastmonth
                ).FilterCostPlanUser(isAdmin, usrId, subUser).AsQueryable().Select(CostPlanTranslator.RepositoryToEntity()).ToList();
            cpls.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.CplAmount = CostPlanLineRepository.GetCostPlanInfo(socId, m.CplId).TotalAmountHt;
            });

            cpls = cpls.OrderByDescending(m => m.CplId).ToList();
            return cpls;
        }

        #endregion widget
    }
}
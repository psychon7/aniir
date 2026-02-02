using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Runtime.Remoting.Messaging;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using System.IO;

namespace ERP.Repositories.SqlServer
{
    public class ClientOrderRepository : BaseSqlServerRepository
    {
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private CommonRepository CommonRepository = new CommonRepository();
        ClientOrderLineRepository ClientOrderLineRepository = new ClientOrderLineRepository();
        private UserRepository UserRepository = new UserRepository();

        public int CreateUpdateClientOrder(ClientOrder oneClientOrder)
        {
            bool iscreate = false;
            int codId = 0;
            int ccoInvId = 0;
            int ccoDlvId = 0;

            // check client and client contact
            //oneClientOrder.CliId = CreatClientCcoForClientOrder(oneClientOrder, out ccoInvId, out ccoDlvId);
            oneClientOrder.CcoIdInvoicing = oneClientOrder.CcoIdInvoicing == 0 ? null : oneClientOrder.CcoIdInvoicing;
            //oneClientOrder.CcoIdDelivery = ccoDlvId;
            // create
            if (oneClientOrder.CodId == 0)
            {
                // check devis, if exist, take, not create new devis with new project
                if (oneClientOrder.CplId == 0)
                {
                    oneClientOrder.CplId = CreateCostPlanByClientOrder(oneClientOrder);
                }
                else
                {
                    var oneCpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == oneClientOrder.CplId && m.soc_id == oneClientOrder.SocId);
                    if (oneCpl != null)
                    {
                        if (oneCpl.cst_id == 8)
                        {
                            oneCpl.cst_id = 8;
                        }
                        else
                        {
                            oneCpl.cst_id = 2;
                        }
                        _db.TM_CPL_Cost_Plan.ApplyCurrentValues(oneCpl);
                        _db.SaveChanges();
                    }
                }
                oneClientOrder.PrjId = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == oneClientOrder.SocId && m.cpl_id == oneClientOrder.CplId).Select(m => m.TM_PRJ_Project).FirstOrDefault().prj_id;
                var lastCod = _db.TM_COD_Client_Order.Where(m => m.soc_id == oneClientOrder.SocId
                    && m.cod_d_creation.Year == oneClientOrder.CodDateCreation.Year
                    && m.cod_d_creation.Month == oneClientOrder.CodDateCreation.Month).OrderByDescending(m => m.cod_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastCod != null)
                {
                    lastCode = lastCod.cod_code;
                }

                string pref = GetCodePref(2);
                oneClientOrder.CodCode = GetGeneralRefContinuation(oneClientOrder.CodDateCreation, pref, lastCode, _codeType, oneClientOrder.CliId);
                var newCod = new TM_COD_Client_Order();
                newCod = ClientOrderTranslator.EntityToRepository(oneClientOrder, newCod, true);
                _db.TM_COD_Client_Order.AddObject(newCod);
                _db.SaveChanges();
                codId = newCod.cod_id;
            }
            else
            {
                // update
                var oneCod = _db.TM_COD_Client_Order.FirstOrDefault(m => m.soc_id == oneClientOrder.SocId && m.cod_id == oneClientOrder.CodId);
                if (oneCod != null)
                {
                    oneCod = ClientOrderTranslator.EntityToRepository(oneClientOrder, oneCod);
                    _db.TM_COD_Client_Order.ApplyCurrentValues(oneCod);
                    _db.SaveChanges();
                    codId = oneCod.cod_id;
                }
            }
            return codId;
        }

        public ClientOrder LoadClientOrderById(int codId, int socId, int usrId, bool forPdf = false)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var cpl = _db.TM_COD_Client_Order.Where(m => m.cod_id == codId && m.soc_id == socId
                // is Admin
                //&& (isAdmin
                //|| m.usr_creator_id == usrId
                //|| m.TM_CPL_Cost_Plan.usr_commercial1 == usrId
                //|| m.TM_CPL_Cost_Plan.usr_commercial2 == usrId
                //|| m.TM_CPL_Cost_Plan.usr_commercial3 == usrId
                //|| subUser.Any(l => l == m.usr_creator_id)
                //|| subUser.Any(l => l == m.TM_CPL_Cost_Plan.usr_commercial1)
                //|| subUser.Any(l => l == m.TM_CPL_Cost_Plan.usr_commercial2)
                //|| subUser.Any(l => l == m.TM_CPL_Cost_Plan.usr_commercial3)
                //)
                ).FilterClientOrderUser(isAdmin, isStoreKeeper, usrId, subUser).AsQueryable().Select(ClientOrderTranslator.RepositoryToEntity()).FirstOrDefault();
            if (cpl != null)
            {
                cpl.FId = StringCipher.EncoderSimple(cpl.CplId.ToString(), "codId");
                cpl.CplFId = StringCipher.EncoderSimple(cpl.CplId.ToString(), "cplId");
                cpl.PrjFId = StringCipher.EncoderSimple(cpl.PrjId.ToString(), "prjId");
                cpl.CliFId = StringCipher.EncoderSimple(cpl.CliId.ToString(), "cliId");
            }
            if (forPdf)
            {
                ClientOrderLineRepository ClientOrderLineRepository = new ClientOrderLineRepository();
                cpl.ClientOrderLines = ClientOrderLineRepository.GetColsByCodId(socId, codId).Where(m => m.LtpId != 6).ToList();
            }

            try
            {
                cpl.CcoListForDfo = _db.TM_CCO_Client_Contact.Where(l => l.cli_id == cpl.CliId && l.cco_is_delivery_adr == true)
                    .Select(ContactClientTranslator.RepositoryToEntity()).ToList();
            }
            catch (Exception e)
            {
                //Console.WriteLine(e);
                //throw;
            }
            return cpl;
        }

        ///// <summary>
        ///// if client or cco no exist, create them for cost plan
        ///// </summary>
        ///// <returns></returns>
        //public int CreatClientCcoForClientOrder(ClientOrder oneClientOrder, out int invCcoId, out int dlvCcoId)
        //{
        //    //todo : set error
        //    invCcoId = oneClientOrder.CcoIdInvoicing ?? 0;
        //    dlvCcoId = oneClientOrder.CcoIdDelivery;
        //    int cliId = 0;
        //    cliId = oneClientOrder.CliId;
        //    // check client exist
        //    ContactClientRepository contactClientRepository = new ContactClientRepository();
        //    ClientRepository ClientRepository = new ClientRepository();
        //    if (cliId == 0)
        //    {
        //        var oneClient = new Client
        //           {
        //               SocId = oneClientOrder.SocId,
        //               CompanyName = oneClientOrder.ClientCompanyName,
        //               VatId = oneClientOrder.VatId,
        //               PcoId = oneClientOrder.PcoId,
        //               PmoId = oneClientOrder.PmoId,
        //               UsrCreatedBy = oneClientOrder.UsrCreatorId,
        //               CtyId = 2,
        //               CurId = 1,
        //               Isactive = true,
        //               Isblocked = false,
        //               DateCreation = oneClientOrder.CodDateCreation,
        //               DateUpdate = oneClientOrder.CodDateUpdate,
        //               RecieveNewsletter = false,
        //               #region set client address by client contact
        //               Address1 = oneClientOrder.Inv_CcoAddress1,
        //               Address2 = oneClientOrder.Inv_CcoAddress2,
        //               City = oneClientOrder.Inv_CcoCity,
        //               Postcode = oneClientOrder.Inv_CcoPostcode,
        //               Tel1 = oneClientOrder.Inv_CcoTel1,
        //               Email = oneClientOrder.Inv_CcoEmail,
        //               Fax = oneClientOrder.Inv_CcoFax,
        //               Country = oneClientOrder.Inv_CcoCountry
        //               #endregion set client address by client contact
        //           };
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
        //                DateCreation = oneClientOrder.CodDateCreation,
        //                DateUpdate = oneClientOrder.CodDateUpdate,
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
        //                DateCreation = oneClientOrder.CodDateCreation,
        //                DateUpdate = oneClientOrder.CodDateUpdate,
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
        //                DateCreation = oneClientOrder.CodDateCreation,
        //                DateUpdate = oneClientOrder.CodDateUpdate,
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
        //                CcoAddress1 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoAddress1)) ? checkClient.cli_address1 : oneClientOrder.Inv_CcoAddress1,
        //                CcoAddress2 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoAddress2)) ? checkClient.cli_address2 : oneClientOrder.Inv_CcoAddress2,
        //                CcoCellphone = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoCellphone)) ? checkClient.cli_cellphone : oneClientOrder.Inv_CcoCellphone,
        //                CcoCity = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoCity)) ? checkClient.cli_city : oneClientOrder.Inv_CcoCity,
        //                CcoCountry = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoCountry)) ? checkClient.cli_country : oneClientOrder.Inv_CcoCountry,
        //                CcoEmail = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoEmail)) ? checkClient.cli_email : oneClientOrder.Inv_CcoEmail,
        //                CcoFax = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoFax)) ? checkClient.cli_fax : oneClientOrder.Inv_CcoFax,
        //                CcoFirstname = oneClientOrder.Inv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Inv_CcoLastname,
        //                CcoIsDeliveryAdr = false,
        //                CcoIsInvoicingAdr = true,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoPostcode)) ? checkClient.cli_postcode : oneClientOrder.Inv_CcoPostcode,
        //                CcoTel1 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Inv_CcoTel1)) ? checkClient.cli_tel1 : oneClientOrder.Inv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CodDateCreation,
        //                DateUpdate = oneClientOrder.CodDateUpdate,
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
        //                CcoAddress1 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoAddress1)) ? checkClient.cli_address1 : oneClientOrder.Dlv_CcoAddress1,
        //                CcoAddress2 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoAddress2)) ? checkClient.cli_address2 : oneClientOrder.Dlv_CcoAddress2,
        //                CcoCellphone = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoCellphone)) ? checkClient.cli_cellphone : oneClientOrder.Dlv_CcoCellphone,
        //                CcoCity = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoCity)) ? checkClient.cli_city : oneClientOrder.Dlv_CcoCity,
        //                CcoCountry = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoCountry)) ? checkClient.cli_country : oneClientOrder.Dlv_CcoCountry,
        //                CcoEmail = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoEmail)) ? checkClient.cli_email : oneClientOrder.Dlv_CcoEmail,
        //                CcoFax = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoFax)) ? checkClient.cli_fax : oneClientOrder.Dlv_CcoFax,
        //                CcoFirstname = oneClientOrder.Dlv_CcoFirstname,
        //                CcoLastname = oneClientOrder.Dlv_CcoLastname,
        //                CcoIsDeliveryAdr = true,
        //                CcoIsInvoicingAdr = false,
        //                CcoRecieveNewsletter = false,
        //                CcoPostcode = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoPostcode)) ? checkClient.cli_postcode : oneClientOrder.Dlv_CcoPostcode,
        //                CcoTel1 = (checkClient != null && string.IsNullOrEmpty(oneClientOrder.Dlv_CcoTel1)) ? checkClient.cli_tel1 : oneClientOrder.Dlv_CcoTel1,
        //                CivId = 1,
        //                DateCreation = oneClientOrder.CodDateCreation,
        //                DateUpdate = oneClientOrder.CodDateUpdate,
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

        public List<ClientOrder> SearchClientOrders(ClientOrder oneCod)
        {
            DateTime createDateFrom;
            if (!DateTime.TryParse(oneCod._dCreationString, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
            {
                createDateFrom = new DateTime(1900, 1, 1);
            }
            DateTime createDateTo;
            if (!DateTime.TryParse(oneCod._dUpdateString, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
            {
                createDateTo = new DateTime(2500, 12, 31);
            }
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);

            var keyword = oneCod.CodInterComment.Trim();
            bool isAdmin = UserRepository.IsAdmin(oneCod.SocId, oneCod.UsrCreatorId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(oneCod.SocId, oneCod.UsrCreatorId);
            var subUser = UserRepository.GetUserSubUsersIds(oneCod.SocId, oneCod.UsrCreatorId);
            var cods = _db.TM_COD_Client_Order.Where(m => m.soc_id == oneCod.SocId
                                                         && (string.IsNullOrEmpty(oneCod.CodName.Trim()) || m.cod_name.Contains(oneCod.CodName.Trim()))
                                                         && (string.IsNullOrEmpty(oneCod.CodCode.Trim()) || m.cod_code.Contains(oneCod.CodCode.Trim()))
                                                         // client
                                                         && (string.IsNullOrEmpty(oneCod.ClientCompanyName.Trim()) || m.TM_CLI_CLient.cli_company_name.Contains(oneCod.ClientCompanyName.Trim()))
                                                         //// cco delivery
                                                         //                                         && (

                                                         //                                         string.IsNullOrEmpty(oneCod.Inv_CcoFirstname.Trim()) || m.TM_CCO_Client_Contact.cco_firstname.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //                                             || m.TM_CCO_Client_Contact.cco_lastname.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //                                             || m.TM_CCO_Client_Contact.cco_adresse_title.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //// cco invoicing
                                                         //                                            || m.TM_CCO_Client_Contact1.cco_firstname.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //                                            || m.TM_CCO_Client_Contact1.cco_lastname.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //                                            || m.TM_CCO_Client_Contact1.cco_adresse_title.Contains(oneCod.Inv_CcoFirstname.Trim())
                                                         //                                         )
                                                         // project
                                                         && (string.IsNullOrEmpty(oneCod.PrjCode.Trim()) || m.TM_PRJ_Project.prj_code.Contains(oneCod.PrjCode.Trim()))
                                                         && (string.IsNullOrEmpty(oneCod.PrjName.Trim()) || m.TM_PRJ_Project.prj_name.Contains(oneCod.PrjName.Trim()))
                                                         // devis
                                                         && (string.IsNullOrEmpty(oneCod.CplCode.Trim()) || (!m.cpl_id.HasValue || (m.cpl_id.HasValue && m.TM_CPL_Cost_Plan.cpl_code.Contains(oneCod.CplCode.Trim()))))
                                                         && (string.IsNullOrEmpty(oneCod.CplName.Trim()) || (!m.cpl_id.HasValue || (m.cpl_id.HasValue && m.TM_CPL_Cost_Plan.cpl_name.Contains(oneCod.CplName.Trim()))))

                                                         && (m.cod_d_creation >= createDateFrom && m.cod_d_creation <= createDateTo)
                // is Admin
                //&& (isAdmin || m.usr_creator_id == oneCod.UsrCreatorId)

                && ((string.IsNullOrEmpty(keyword) || m.cod_client_comment.Contains(keyword))
                || (string.IsNullOrEmpty(keyword) || m.cod_client_comment.Contains(keyword))
                )
                                                         && (!oneCod.CodKeyProject || m.cod_key_project == true)
                                                         ).FilterClientOrderUser(isAdmin,
                                                         isStoreKeeper,
                                                         oneCod.UsrCreatorId, subUser).AsQueryable().Select(ClientOrderTranslator.RepositoryToEntity4Search()).ToList();

            // 20231111 keyword
            var codIds = cods.Select(l => l.CodId).ToList();

            if (!string.IsNullOrEmpty(keyword))
            {
                var cplcheckcln = _db.TM_COL_ClientOrder_Lines.Where(l =>
                    ((string.IsNullOrEmpty(keyword) || l.col_prd_name.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.col_prd_des.Contains(keyword))
                    ||
                    (string.IsNullOrEmpty(keyword) || l.col_description.Contains(keyword)))
                    &&
                    l.TM_COD_Client_Order.soc_id == oneCod.SocId
                          && (l.TM_COD_Client_Order.cod_d_creation >= createDateFrom && l.TM_COD_Client_Order.cod_d_creation <= createDateTo)
                ).Select(l => l.TM_COD_Client_Order).FilterClientOrderUser(isAdmin,
                                                         isStoreKeeper,
                                                         oneCod.UsrCreatorId, subUser).AsQueryable().Select(ClientOrderTranslator.RepositoryToEntity4Search()).ToList();

                var cplclncplIds = cplcheckcln.Select(l => l.CodId).ToList();

                var cplclnIdsConserve = cplclncplIds.Except(codIds).ToList();

                var cplcln2conserve = (from cpl in cplcheckcln
                                       join cplId2 in cplclnIdsConserve on cpl.CodId equals cplId2
                                       select cpl).ToList();

                cods.AddRange(cplcln2conserve);
            }



            cods.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CodAmount = ClientOrderLineRepository.GetClientOrderInfo(oneCod.SocId, m.CodId).TotalAmountHt;
            });
            return cods;
        }

        public void AddUpdateDiscount(int socId, int codId, decimal? discountPercentage, decimal? discountAmount)
        {
            var cpl = _db.TM_COD_Client_Order.FirstOrDefault(m => m.cod_id == codId && m.soc_id == socId);
            if (cpl != null)
            {
                cpl.cod_discount_amount = ((discountAmount ?? 0) == 0 ? null : discountAmount);
                cpl.cod_discount_percentage = ((discountPercentage ?? 0) == 0 ? null : discountPercentage);
                _db.TM_COD_Client_Order.ApplyCurrentValues(cpl);
                _db.SaveChanges();
            }
        }

        public int DuplicateClientOrderToCostPlan(int socId, int codId, int usrId, bool sameProject)
        {
            int newcplId = 0;
            var cod = _db.TM_COD_Client_Order.FirstOrDefault(m => m.soc_id == socId && m.cod_id == codId);
            if (cod != null)
            {
                var newCpl = new TM_CPL_Cost_Plan
                {
                    //cpl_id = cod.cpl_id,
                    soc_id = cod.soc_id,
                    // check project
                    //prj_id = cod.prj_id,
                    vat_id = cod.vat_id,
                    // new code
                    //cpl_code = cpl.cpl_code,
                    cpl_d_creation = DateTime.Now,
                    cpl_d_update = DateTime.Now,
                    cst_id = 1,
                    cli_id = cod.cli_id,
                    pco_id = cod.pco_id,
                    pmo_id = cod.pmo_id,
                    cpl_d_validity = DateTime.Now.AddMonths(1),
                    cpl_d_pre_delivery = null,
                    cpl_header_text = cod.cod_header_text,
                    cpl_footer_text = cod.cod_footer_text,
                    //cco_id_delivery = cod.cco_id_delivery,
                    cco_id_invoicing = cod.cco_id_invoicing == 0 ? (int?)null : cod.cco_id_invoicing,
                    cpl_client_comment = cod.cod_client_comment,
                    cpl_inter_comment = cod.cod_inter_comment,
                    // creator
                    usr_creator_id = usrId,
                    cpl_name = cod.cpl_id.HasValue ? (cod.TM_CPL_Cost_Plan.cpl_name + " copy") : string.Empty,
                    //cpl_inv_cco_firstname = cod.cod_inv_cco_firstname,
                    //cpl_inv_cco_lastname = cod.cod_inv_cco_lastname,
                    //cpl_inv_cco_address1 = cod.cod_inv_cco_address1,
                    //cpl_inv_cco_address2 = cod.cod_inv_cco_address2,
                    //cpl_inv_cco_postcode = cod.cod_inv_cco_postcode,
                    //cpl_inv_cco_city = cod.cod_inv_cco_city,
                    //cpl_inv_cco_country = cod.cod_inv_cco_country,
                    //cpl_inv_cco_tel1 = cod.cod_inv_cco_tel1,
                    //cpl_inv_cco_fax = cod.cod_inv_cco_fax,
                    //cpl_inv_cco_cellphone = cod.cod_inv_cco_cellphone,
                    //cpl_inv_cco_email = cod.cod_inv_cco_email,
                    //cpl_dlv_cco_firstname = cod.cod_dlv_cco_firstname,
                    //cpl_dlv_cco_lastname = cod.cod_dlv_cco_lastname,
                    //cpl_dlv_cco_address1 = cod.cod_dlv_cco_address1,
                    //cpl_dlv_cco_address2 = cod.cod_dlv_cco_address2,
                    //cpl_dlv_cco_postcode = cod.cod_dlv_cco_postcode,
                    //cpl_dlv_cco_city = cod.cod_dlv_cco_city,
                    //cpl_dlv_cco_country = cod.cod_dlv_cco_country,
                    //cpl_dlv_cco_tel1 = cod.cod_dlv_cco_tel1,
                    //cpl_dlv_cco_fax = cod.cod_dlv_cco_fax,
                    //cpl_dlv_cco_cellphone = cod.cod_dlv_cco_cellphone,
                    //cpl_dlv_cco_email = cod.cod_dlv_cco_email,
                    cpl_discount_amount = cod.cod_discount_amount,
                    cpl_discount_percentage = cod.cod_discount_percentage,
                    usr_commercial1 = cod.TM_CPL_Cost_Plan.usr_commercial1,
                    usr_commercial2 = cod.TM_CPL_Cost_Plan.usr_commercial2,
                    usr_commercial3 = cod.TM_CPL_Cost_Plan.usr_commercial3,
                    cpl_key_project = cod.cod_key_project
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
                    newCpl.prj_id = cod.prj_id;
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
                newCpl.cpl_code = GetGeneralRefContinuation(newCpl.cpl_d_creation, pref, lastCode, _codeType, cod.cli_id);
                _db.TM_CPL_Cost_Plan.AddObject(newCpl);
                _db.SaveChanges();
                newcplId = newCpl.cpl_id;
                DuplicateClientOrderLines(codId, socId, newcplId);
            }
            return newcplId;
        }

        public void DuplicateClientOrderLines(int codId, int socId, int newcplId)
        {
            var clns = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == codId && m.TM_COD_Client_Order.soc_id == socId).ToList();
            List<TM_CLN_CostPlan_Lines> newclnList = new List<TM_CLN_CostPlan_Lines>();
            foreach (var onecln in clns)
            {
                var newcln = new TM_CLN_CostPlan_Lines
                {
                    cpl_id = newcplId,
                    cln_level1 = onecln.col_level1,
                    cln_level2 = onecln.col_level2,
                    cln_description = onecln.col_description,
                    prd_id = onecln.prd_id,
                    pit_id = onecln.pit_id,
                    cln_purchase_price = onecln.col_purchase_price,
                    cln_unit_price = onecln.col_unit_price,
                    cln_quantity = onecln.col_quantity,
                    cln_total_price = onecln.col_total_price,
                    cln_total_crude_price = onecln.col_total_crude_price,
                    vat_id = onecln.vat_id,
                    ltp_id = onecln.ltp_id,
                    cln_discount_amount = onecln.col_discount_amount,
                    cln_discount_percentage = onecln.col_discount_percentage,
                    cln_price_with_discount_ht = onecln.col_price_with_discount_ht,
                    cln_margin = onecln.col_margin,
                    cln_prd_name = onecln.col_prd_name,
                    cln_prd_des = onecln.col_prd_des
                };
                newclnList.Add(newcln);
            }
            foreach (var cln in newclnList)
            {
                _db.TM_CLN_CostPlan_Lines.AddObject(cln);
                _db.SaveChanges();
            }
        }

        private int CreateCostPlanByClientOrder(ClientOrder cod)
        {
            var oneCpl = new CostPlan
            {
                ClientCompanyName = cod.ClientCompanyName,
                SocId = cod.SocId,
                PrjId = cod.PrjId,
                PrjName = cod.PrjName,
                PrjCode = cod.PrjCode,
                VatId = cod.VatId,
                CplDateCreation = cod.CodDateCreation,
                CplDateUpdate = cod.CodDateUpdate,
                CstId = 2,
                CliId = cod.CliId,
                PcoId = cod.PcoId,
                PmoId = cod.PmoId,
                CplDateValidity = DateTime.Now.AddMonths(1),
                CplHeaderText = cod.CodHeaderText,
                CplFooterText = cod.CodFooterText,
                //CcoIdDelivery = cod.CcoIdDelivery,
                CcoIdInvoicing = cod.CcoIdInvoicing,
                CplClientComment = cod.CodClientComment,
                CplInterComment = cod.CodInterComment,
                UsrCreatorId = cod.UsrCreatorId,
                CplName = "Devis pour " + cod.CodName,
                // infor cco
                //Inv_CcoFirstname = cod.Inv_CcoFirstname,
                //Inv_CcoLastname = cod.Inv_CcoLastname,
                Inv_CcoRef = cod.Inv_CcoRef,
                //Inv_CcoAddress1 = cod.Inv_CcoAddress1,
                //Inv_CcoAddress2 = cod.Inv_CcoAddress2,
                //Inv_CcoPostcode = cod.Inv_CcoPostcode,
                //Inv_CcoCity = cod.Inv_CcoCity,
                //Inv_CcoCountry = cod.Inv_CcoCountry,
                //Inv_CcoTel1 = cod.Inv_CcoTel1,
                //Inv_CcoFax = cod.Inv_CcoFax,
                //Inv_CcoCellphone = cod.Inv_CcoCellphone,
                //Inv_CcoEmail = cod.Inv_CcoEmail,
                //Dlv_CcoFirstname = cod.Dlv_CcoFirstname,
                //Dlv_CcoLastname = cod.Dlv_CcoLastname,
                //Dlv_CcoRef = cod.Dlv_CcoRef,
                //Dlv_CcoAddress1 = cod.Dlv_CcoAddress1,
                //Dlv_CcoAddress2 = cod.Dlv_CcoAddress2,
                //Dlv_CcoPostcode = cod.Dlv_CcoPostcode,
                //Dlv_CcoCity = cod.Dlv_CcoCity,
                //Dlv_CcoCountry = cod.Dlv_CcoCountry,
                //Dlv_CcoTel1 = cod.Dlv_CcoTel1,
                //Dlv_CcoFax = cod.Dlv_CcoFax,
                //Dlv_CcoCellphone = cod.Dlv_CcoCellphone,
                //Dlv_CcoEmail = cod.Dlv_CcoEmail,
                UsrCom1 = cod.UsrCom1,
                UsrCom2 = cod.UsrCom2,
                UsrCom3 = cod.UsrCom3,
                CplKeyProject = cod.CodKeyProject,
            };
            CostPlanRepository CostPlanRepository = new CostPlanRepository();
            var newCpl = CostPlanRepository.CreateUpdateCostPlan(oneCpl);
            return newCpl;
        }

        public void UpdateClientOrderFile(int socId, int codId, string filePath)
        {
            var cod = _db.TM_COD_Client_Order.FirstOrDefault(m => m.soc_id == socId && m.cod_id == codId);
            if (cod != null)
            {
                if (!string.IsNullOrEmpty(cod.cod_file))
                {
                    CommonRepository.DeleteFile(cod.cod_file);
                }
                cod.cod_file = filePath;
                _db.TM_COD_Client_Order.ApplyCurrentValues(cod);
                _db.SaveChanges();
            }
        }

        public List<ClientOrder> GetClientOrderByCplId(int socId, int cplId)
        {
            var cods = _db.TM_COD_Client_Order.Where(m => m.soc_id == socId && m.cpl_id == cplId).Select(ClientOrderTranslator.RepositoryToEntity()).ToList();
            cods.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CodAmount = ClientOrderLineRepository.GetClientOrderInfo(socId, m.CodId).TotalAmountHt;
            });
            return cods;
        }

        public List<ClientOrder> GetClientOrderByPrjId(int socId, int prjId)
        {
            var cods = _db.TM_COD_Client_Order.Where(m => m.soc_id == socId && m.prj_id == prjId).Select(ClientOrderTranslator.RepositoryToEntity()).ToList();
            cods.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CplFId = StringCipher.EncoderSimple(m.CplId.ToString(), "cplId");
                m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CodAmount = ClientOrderLineRepository.GetClientOrderInfo(socId, m.CodId).TotalAmountHt;
            });
            return cods;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="codId"></param>
        /// <returns>0 : all lines deliveried, -2 : has no client order line</returns>
        public int CheckClientOrderLineNotCompleteDeliveried(int socId, int codId)
        {
            int valuereturn = 0;
            // 1. no client order line
            var anyCol = (from cod in _db.TM_COD_Client_Order
                          join col in _db.TM_COL_ClientOrder_Lines on
                              cod.cod_id equals col.cod_id
                          where cod.cod_id == codId && cod.soc_id == socId
                          select col).Any();

            // 2. has client order line and delivery line are all used
            if (anyCol)
            {
                var coldfl = (from cod in _db.TM_COD_Client_Order
                              join col in _db.TM_COL_ClientOrder_Lines on cod.cod_id equals col.cod_id
                              join dfl in _db.TM_DFL_DevlieryForm_Line on col.col_id equals dfl.col_id
                              into leftJ
                              from lj in leftJ.DefaultIfEmpty()
                              where cod.cod_id == codId && cod.soc_id == socId
                              select new { col, lj }).GroupBy(m => m.col).Select(m => new KeyValue
                              {
                                  Key = m.FirstOrDefault().col.col_id,
                                  Key2 = m.FirstOrDefault().col.col_quantity ?? 0,
                                  Key3 = m.Any(l => l.lj != null) ? m.Sum(l => l.lj.dfl_quantity ?? 0) : 0
                              }).ToList();
                var line2delivery = coldfl.Any(m => (m.Key2 - m.Key3) > 0);
                valuereturn = line2delivery ? 1 : 0;
                if (valuereturn == 1)
                {
                    var anyDfo = _db.TM_DFO_Delivery_Form.Any(m => m.soc_id == socId && m.cod_id == codId);
                    if (!anyDfo)
                    {
                        valuereturn = 3;
                    }
                }
            }
            else
            {
                valuereturn = -2;
            }

            return valuereturn;
        }

        #region Widget

        public List<ClientOrderLine> GetClientOrdersNotCompleteDeliveried(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            var subUsers = UserRepository.GetUserSubUsersIds(socId, usrId);

            var coldfl = (from col in _db.TM_COL_ClientOrder_Lines
                          join dfl in _db.TM_DFL_DevlieryForm_Line
                              on col.col_id equals dfl.col_id
                              into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          where col.TM_COD_Client_Order.soc_id == socId
                                && (isAdmin
                                    ||
                                    col.TM_COD_Client_Order.usr_creator_id == usrId
                                    || col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial1 == usrId
                                    || col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial2 == usrId
                                    || col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial3 == usrId
                                    || subUsers.Any(l => l == col.TM_COD_Client_Order.usr_creator_id)
                                    || subUsers.Any(l => l == col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial1)
                                    || subUsers.Any(l => l == col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial2)
                                    || subUsers.Any(l => l == col.TM_COD_Client_Order.TM_CPL_Cost_Plan.usr_commercial3)
                                    )
                          select new { col, lj }).GroupBy(m => m.col).Where(m =>
                    ((m.FirstOrDefault().col.col_quantity ?? 0) -
                     (m.Any(l => l.lj != null) ? m.Sum(l => l.lj.dfl_quantity) : 0)) > 0)
                .Select(m => new ClientOrderLine
                {
                    CodId = m.FirstOrDefault().col.TM_COD_Client_Order.cod_id,
                    CodCode = m.FirstOrDefault().col.TM_COD_Client_Order.cod_code,
                    CodName = m.FirstOrDefault().col.TM_COD_Client_Order.cod_name,
                    PrdName =
                        m.FirstOrDefault().col.prd_id.HasValue
                            ? m.FirstOrDefault().col.TM_PRD_Product.prd_ref
                            : string.Empty,
                    PitName =
                        m.FirstOrDefault().col.pit_id.HasValue
                            ? m.FirstOrDefault().col.TM_PIT_Product_Instance.pit_ref
                            : string.Empty,
                    ColQuantity = m.FirstOrDefault().col.col_quantity ?? 0,
                    ColQuantityToDelivery =
                        ((m.FirstOrDefault().col.col_quantity ?? 0) -
                         (int)(m.Any(l => l.lj != null) ? m.Sum(l => l.lj.dfl_quantity) : 0)),
                    ClientCompanyName = m.FirstOrDefault().col.TM_COD_Client_Order.TM_CLI_CLient.cli_company_name
                }).ToList();
            coldfl.ForEach(m => m.FId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId"));
            return coldfl;
        }

        #endregion Widget

        #region Insert Cod->DFO->CIN

        public void InsertCodDfoCin(List<ClientOrder> codList)
        {
            _codeType = 2;

            #region Client Order with Prj
            foreach (var onecod in codList)
            {
                // treate client
                int cliId = 0;
                int vatId = 1;
                int pcoId = 1;
                int pmoId = 1;
                int curId = 1;
                int? ccoId = null;
                var client = _db.TM_CLI_CLient.FirstOrDefault(l => l.cli_company_name == onecod.ClientCompanyName);
                if (client != null)
                {
                    cliId = client.cli_id;
                    vatId = client.vat_id;
                    pcoId = client.pco_id;
                    pmoId = client.pmo_id;
                    curId = client.cur_id;
                    ccoId = client.TM_CCO_Client_Contact.Any() ? client.TM_CCO_Client_Contact.FirstOrDefault().cco_id : (int?)null;
                }
                else
                {
                    // create client
                    var newclient = new TM_CLI_CLient();
                    newclient.cli_company_name = onecod.ClientCompanyName;
                    newclient.cmu_id = null;
                    newclient.usr_created_by = 1;
                    newclient.pco_id = 1;
                    newclient.pmo_id = 1;
                    newclient.act_id = null;
                    // check vat
                    var vatrate = onecod.ClientOrderLines.FirstOrDefault().VatRate;
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

                #region prj

                int prjId = 0;
                // project
                var oneprj = new TM_PRJ_Project();
                var lastItem = _db.TM_PRJ_Project.Where(m => m.soc_id == onecod.SocId
                 && m.prj_d_creation.Year == onecod.CodDateCreation.Year
                 && m.prj_d_creation.Month == onecod.CodDateCreation.Month).OrderByDescending(m => m.prj_code).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastItem != null)
                {
                    lastRef = lastItem.prj_code;
                }
                string pjpref = GetCodePref(4);
                oneprj.prj_code = GetGeneralRefContinuation(onecod.CodDateCreation, pjpref, lastRef, _codeType, cliId);
                oneprj.prj_name = string.Format("{0}", onecod.CodInterComment);
                oneprj.prj_d_creation = onecod.CodDateCreation;
                oneprj.prj_d_update = onecod.CodDateCreation;
                oneprj.cli_id = cliId;
                oneprj.pco_id = pcoId;
                oneprj.pmo_id = pmoId;
                oneprj.vat_id = vatId;
                oneprj.soc_id = 1;
                oneprj.usr_creator_id = 1;
                _db.TM_PRJ_Project.AddObject(oneprj);
                _db.SaveChanges();
                prjId = oneprj.prj_id;
                // project
                #endregion prj

                #region Cpl

                var onecpl = new TM_CPL_Cost_Plan();
                var lastcpl = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == onecod.SocId
                    && m.cpl_d_creation.Year == onecod.CodDateCreation.Year
                    && m.cpl_d_creation.Month == onecod.CodDateCreation.Month).OrderByDescending(m => m.cpl_code).FirstOrDefault();
                string lastcplCode = string.Empty;
                if (lastcpl != null)
                {
                    lastcplCode = lastcpl.cpl_code;
                }
                string pref = GetCodePref(3);
                onecpl.cpl_code = GetGeneralRefContinuation(onecod.CodDateCreation, pref, lastcplCode, _codeType, onecpl.cpl_id);
                onecpl.cpl_name = onecpl.cpl_code;
                onecpl.cst_id = 2;
                onecpl.cpl_d_creation = onecod.CodDateCreation;
                onecpl.cpl_d_update = onecod.CodDateUpdate;
                onecpl.cli_id = cliId;
                onecpl.pco_id = pcoId;
                onecpl.pmo_id = pmoId;
                onecpl.cpl_d_validity = onecod.CodDateCreation;
                onecpl.cpl_footer_text = onecod.CodFooterText;
                onecpl.usr_creator_id = 1;
                onecpl.vat_id = vatId;
                onecpl.prj_id = prjId;
                onecpl.soc_id = 1;

                _db.TM_CPL_Cost_Plan.AddObject(onecpl);
                _db.SaveChanges();

                int cplId = onecpl.cpl_id;

                #endregion Cpl

                #region Cod

                var newcod = new TM_COD_Client_Order();
                var lastCod = _db.TM_COD_Client_Order.Where(m => m.soc_id == onecod.SocId
                  && m.cod_d_creation.Year == onecod.CodDateCreation.Year
                  && m.cod_d_creation.Month == onecod.CodDateCreation.Month).OrderByDescending(m => m.cod_code).FirstOrDefault();
                string lastCode = string.Empty;
                if (lastCod != null)
                {
                    lastCode = lastCod.cod_code;
                }
                string codpref = GetCodePref(2);
                newcod.cod_code = GetGeneralRefContinuation(onecod.CodDateCreation, codpref, lastCode, _codeType, cliId);
                newcod.cod_name = newcod.cod_code;
                onecod.CliId = cliId;
                newcod.cli_id = cliId;
                newcod.cod_d_creation = onecod.CodDateCreation;
                newcod.cod_d_update = onecod.CodDateUpdate;
                newcod.usr_creator_id = 1;
                newcod.pco_id = pcoId;
                newcod.pmo_id = pmoId;
                newcod.cco_id_invoicing = ccoId;
                newcod.vat_id = vatId;
                newcod.cpl_id = cplId;
                newcod.cod_footer_text = onecod.CodFooterText;


                newcod.prj_id = prjId;
                newcod.soc_id = 1;

                _db.TM_COD_Client_Order.AddObject(newcod);
                _db.SaveChanges();
                var codId = newcod.cod_id;
                onecod.CodId = codId;



                // for lines
                foreach (var onecol in onecod.ClientOrderLines)
                {
                    // for cln

                    var newcln = new TM_CLN_CostPlan_Lines();
                    newcln.cpl_id = cplId;
                    newcln.cln_level1 = 1;
                    newcln.cln_level1 = 2;
                    newcln.prd_id = null;
                    newcln.cln_unit_price = onecol.ColUnitPrice;
                    newcln.cln_quantity = onecol.ColQuantity;
                    newcln.cln_total_price = onecol.ColTotalPrice;
                    newcln.vat_id = vatId;
                    //newcii.dfl_id = null;
                    newcln.cln_total_crude_price = onecol.ColTotalCrudePrice;
                    newcln.cln_prd_name = onecol.PrdName;
                    newcln.cln_discount_amount = 0;
                    newcln.cln_discount_percentage = 0;
                    newcln.cln_price_with_discount_ht = onecol.ColPriceWithDiscountHt;
                    newcln.ltp_id = 2;
                    newcln.cln_description = onecol.ColDescription;
                    _db.TM_CLN_CostPlan_Lines.AddObject(newcln);
                    _db.SaveChanges();


                    // for col
                    var newcol = new TM_COL_ClientOrder_Lines();
                    newcol.cod_id = codId;
                    newcol.col_level1 = 1;
                    newcol.col_level2 = 2;
                    newcol.cln_id = newcln.cln_id;
                    newcol.prd_id = null;
                    newcol.col_unit_price = onecol.ColUnitPrice;
                    newcol.col_quantity = onecol.ColQuantity;
                    newcol.col_total_price = onecol.ColTotalPrice;
                    newcol.vat_id = vatId;
                    //newcii.dfl_id = null;
                    newcol.col_total_crude_price = onecol.ColTotalCrudePrice;
                    newcol.col_prd_name = onecol.PrdName;
                    newcol.col_discount_amount = 0;
                    newcol.col_discount_percentage = 0;
                    newcol.col_price_with_discount_ht = onecol.ColPriceWithDiscountHt;
                    newcol.ltp_id = 2;
                    newcol.col_description = onecol.ColDescription;
                    _db.TM_COL_ClientOrder_Lines.AddObject(newcol);
                    _db.SaveChanges();
                    onecol.ColId = newcol.col_id;
                }

                #endregion cod
            }

            #endregion Client Order with Prj

            #region Dfo

            var dfolist = new List<TM_DFO_Delivery_Form>();

            foreach (var onecod in codList)
            {
                var newdfo = new TM_DFO_Delivery_Form();
                //var lastCod = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == onecod.SocId
                //   && m.dfo_d_creation.Year == onecod.CodDateCreation.Year
                //   && m.dfo_d_creation.Month == onecod.CodDateCreation.Month).OrderByDescending(m => m.dfo_code).FirstOrDefault();
                //string lastCode = string.Empty;
                //bool isFirstBl = !_db.TM_DFO_Delivery_Form.Any(m => m.cod_id == onecod.CodId);
                //if (lastCod != null)
                //{
                //    lastCode = lastCod.dfo_code;
                //}
                //newdfo.dfo_code = GetGeneralRefContinuation(onecod.CodDateCreation, "BL", lastCode, _codeType);
                newdfo.dfo_code = onecod.CodInterComment;
                newdfo.dfo_d_creation = onecod.CodDateCreation;
                newdfo.dfo_d_update = onecod.CodDateCreation;
                newdfo.dfo_d_delivery = onecod.CodDateCreation;
                newdfo.dfo_footer_text = onecod.CodFooterText;
                newdfo.usr_creator_id = 1;
                newdfo.cod_id = onecod.CodId;
                newdfo.cli_id = onecod.CliId;
                newdfo.soc_id = 1;
                newdfo.dfo_deliveried = true;
                _db.TM_DFO_Delivery_Form.AddObject(newdfo);
                _db.SaveChanges();
                int dfoId = newdfo.dfo_id;
                foreach (var onecol in onecod.ClientOrderLines)
                {
                    var onedfl = new TM_DFL_DevlieryForm_Line
                    {
                        dfo_id = dfoId,
                        col_id = onecol.ColId,
                        dfl_quantity = onecol.ColQuantity ?? 0
                    };
                    _db.TM_DFL_DevlieryForm_Line.AddObject(onedfl);
                    _db.SaveChanges();
                }
                dfolist.Add(newdfo);
            }

            #endregion Dfo

            #region Cin

            foreach (var onedfo in dfolist)
            {
                var cin = new TM_CIN_Client_Invoice();
                var lastCin = _db.TM_CIN_Client_Invoice.Where(m => m.soc_id == onedfo.soc_id && m.cin_isinvoice
                    && m.cin_d_creation.Year == onedfo.dfo_d_creation.Year
                    && m.cin_d_creation.Month == onedfo.dfo_d_creation.Month).OrderByDescending(m => m.cin_code).FirstOrDefault();
                var stravNewRule = ConfigurationSettings.AppSettings["AvNewRule"];
                string lastCode = string.Empty;
                bool avNewRule;
                bool.TryParse(stravNewRule, out avNewRule);
                if (avNewRule)
                {
                    if (lastCin != null)
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
                        int cinnb = Convert.ToInt32(cinnumber);
                        int avnb = Convert.ToInt32(avoirnumber);
                        //lastCode = cinnb > avnb ? lastCinCode : lastAvCode;
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
                        if (lastCin != null)
                        {
                            //cinnumber = lastCin.cin_code.Substring(4, 7);
                            cinnumber = lastCin.cin_code.Substring(lastCin.cin_code.Length - 4);
                            lastCinCode = lastCin.cin_code;
                        }
                        int cinnb = Convert.ToInt32(cinnumber);
                        int avnb = Convert.ToInt32(avoirnumber);
                        lastCode = lastCinCode;
                    }
                }
                string pref = GetCodePref(1);
                cin.cin_code = GetGeneralRefContinuation(onedfo.dfo_d_creation, pref, lastCode, _codeType, onedfo.cli_id);
                cin.cin_name = cin.cin_code;
                cin.cli_id = onedfo.cli_id;
                cin.cin_d_creation = onedfo.dfo_d_creation;
                cin.cin_d_update = onedfo.dfo_d_creation;
                cin.cin_d_invoice = onedfo.dfo_d_creation;
                cin.usr_creator_id = 1;
                cin.cin_footer_text = onedfo.dfo_footer_text;
                cin.cur_id = 1;
                cin.cin_account = false;
                cin.cin_d_term = onedfo.dfo_d_creation;
                cin.pco_id = onedfo.TM_COD_Client_Order.pco_id;
                cin.pmo_id = onedfo.TM_COD_Client_Order.pmo_id;
                cin.cco_id_invoicing = null;
                cin.cin_isinvoice = true;
                cin.vat_id = onedfo.TM_COD_Client_Order.vat_id;
                cin.prj_id = onedfo.TM_COD_Client_Order.prj_id;
                cin.cod_id = onedfo.cod_id;
                cin.dfo_id = onedfo.dfo_id;
                cin.soc_id = 1;
                cin.cin_avoir_id = null;
                cin.cin_invoiced = false;
                _db.TM_CIN_Client_Invoice.AddObject(cin);
                _db.SaveChanges();
                int cinid = cin.cin_id;

                var onedci = new TR_DCI_DeliveryForm_ClientInvoice();
                onedci.dfo_id = onedfo.dfo_id;
                onedci.cin_id = cinid;
                _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(onedci);
                _db.SaveChanges();

                if (onedfo.TM_DFL_DevlieryForm_Line.Any())
                {
                    var dfls = onedfo.TM_DFL_DevlieryForm_Line;
                    foreach (var onedfl in dfls)
                    {
                        var onecii = new TM_CII_ClientInvoice_Line
                        {
                            cin_id = cinid,
                            cii_level1 = 1,
                            cii_level2 = 1,
                            cii_description = onedfl.TM_COL_ClientOrder_Lines.col_description,
                            cii_unit_price = onedfl.TM_COL_ClientOrder_Lines.col_unit_price,
                            cii_quantity = onedfl.TM_COL_ClientOrder_Lines.col_quantity ?? 0,
                            vat_id = onedfl.TM_COL_ClientOrder_Lines.vat_id,
                            dfl_id = onedfl.dfl_id,
                            cii_total_crude_price = onedfl.TM_COL_ClientOrder_Lines.col_total_crude_price,
                            cii_total_price = onedfl.TM_COL_ClientOrder_Lines.col_total_price,
                            cii_prd_name = onedfl.TM_COL_ClientOrder_Lines.col_prd_name,
                            cii_discount_percentage = 0,
                            cii_discount_amount = 0,
                            ltp_id = 2,
                            col_id = onedfl.TM_COL_ClientOrder_Lines.col_id
                        };

                        _db.TM_CII_ClientInvoice_Line.AddObject(onecii);
                        _db.SaveChanges();
                    }
                }
            }

            #endregion Cin

        }

        #endregion Insert Cod->DFO->CIN

        #region 导入BL和对应的CIN

        public void InsertBLWithCIN(List<ClientOrder> cods)
        {
            var cincodes = cods.Select(l => l.CodInterComment).Distinct().ToList();
            _codeType = 2;

            foreach (var onecincode in cincodes)
            {
                // 根据cincode 新建prj， cpl 和 cod，然后在建bl，最后将bl统一归到cin里面
                // avoir则是查找cin，然后直接建立avoir ，找到对应的cii，然后直接建立

                //var onecod = cods.Select(l => l.CodInterComment == onecode).ToList();
                if (onecincode.StartsWith("FA"))
                {
                    var allcinwithsamecode = cods.Where(l => l.CodInterComment == onecincode).ToList();

                    // invoice
                    var firstcin = allcinwithsamecode.FirstOrDefault();

                    // treate client
                    int cliId = 0;
                    int vatId = 1;
                    int pcoId = 1;
                    int pmoId = 1;
                    int curId = 1;

                    #region Client
                    int? ccoId = null;
                    var client = _db.TM_CLI_CLient.FirstOrDefault(l => l.cli_company_name == firstcin.ClientCompanyName);
                    if (client != null)
                    {
                        cliId = client.cli_id;
                        vatId = client.vat_id;
                        pcoId = client.pco_id;
                        pmoId = client.pmo_id;
                        curId = client.cur_id;
                        ccoId = client.TM_CCO_Client_Contact.Any() ? client.TM_CCO_Client_Contact.FirstOrDefault().cco_id : (int?)null;

                    }
                    else
                    {
                        // create client
                        var newclient = new TM_CLI_CLient();
                        newclient.cli_company_name = firstcin.ClientCompanyName;
                        newclient.cmu_id = null;
                        newclient.usr_created_by = 1;
                        newclient.pco_id = 1;
                        newclient.pmo_id = 1;
                        newclient.act_id = null;
                        // check vat
                        var vatrate = firstcin.ClientOrderLines.FirstOrDefault().VatRate;
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
                    #endregion Client

                    #region prj

                    int prjId = 0;
                    // project
                    var oneprj = new TM_PRJ_Project();
                    var lastItem = _db.TM_PRJ_Project.Where(m => m.soc_id == firstcin.SocId
                     && m.prj_d_creation.Year == firstcin.CodDateCreation.Year
                     && m.prj_d_creation.Month == firstcin.CodDateCreation.Month).OrderByDescending(m => m.prj_code).FirstOrDefault();
                    string lastRef = string.Empty;
                    if (lastItem != null)
                    {
                        lastRef = lastItem.prj_code;
                    }
                    string pref = GetCodePref(4);
                    oneprj.prj_code = GetGeneralRefContinuation(firstcin.CodDateCreation, pref, lastRef, _codeType, cliId);
                    oneprj.prj_name = string.Format("{0}", firstcin.CodInterComment);
                    oneprj.prj_d_creation = firstcin.CodDateCreation;
                    oneprj.prj_d_update = firstcin.CodDateCreation;
                    oneprj.cli_id = cliId;
                    oneprj.pco_id = pcoId;
                    oneprj.pmo_id = pmoId;
                    oneprj.vat_id = vatId;
                    oneprj.soc_id = 1;
                    oneprj.usr_creator_id = 1;
                    _db.TM_PRJ_Project.AddObject(oneprj);
                    _db.SaveChanges();
                    prjId = oneprj.prj_id;
                    // project
                    #endregion prj

                    #region Cpl

                    var onecpl = new TM_CPL_Cost_Plan();
                    var lastcpl = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == firstcin.SocId
                        && m.cpl_d_creation.Year == firstcin.CodDateCreation.Year
                        && m.cpl_d_creation.Month == firstcin.CodDateCreation.Month).OrderByDescending(m => m.cpl_code).FirstOrDefault();
                    string lastcplCode = string.Empty;
                    if (lastcpl != null)
                    {
                        lastcplCode = lastcpl.cpl_code;
                    }
                    string cplpref = GetCodePref(3);
                    onecpl.cpl_code = GetGeneralRefContinuation(firstcin.CodDateCreation, cplpref, lastcplCode, _codeType, cliId);
                    onecpl.cpl_name = onecpl.cpl_code;
                    onecpl.cst_id = 2;
                    onecpl.cpl_d_creation = firstcin.CodDateCreation;
                    onecpl.cpl_d_update = firstcin.CodDateUpdate;
                    onecpl.cli_id = cliId;
                    onecpl.pco_id = pcoId;
                    onecpl.pmo_id = pmoId;
                    onecpl.cpl_d_validity = firstcin.CodDateCreation;
                    onecpl.cpl_footer_text = firstcin.CodFooterText;
                    onecpl.usr_creator_id = 1;
                    onecpl.vat_id = vatId;
                    onecpl.prj_id = prjId;
                    onecpl.soc_id = 1;

                    _db.TM_CPL_Cost_Plan.AddObject(onecpl);
                    _db.SaveChanges();

                    int cplId = onecpl.cpl_id;

                    #endregion Cpl

                    #region Cod

                    var newcod = new TM_COD_Client_Order();
                    var lastCod = _db.TM_COD_Client_Order.Where(m => m.soc_id == firstcin.SocId
                      && m.cod_d_creation.Year == firstcin.CodDateCreation.Year
                      && m.cod_d_creation.Month == firstcin.CodDateCreation.Month).OrderByDescending(m => m.cod_code).FirstOrDefault();
                    string lastCode = string.Empty;
                    if (lastCod != null)
                    {
                        lastCode = lastCod.cod_code;
                    }
                    string codpref = GetCodePref(2);
                    newcod.cod_code = GetGeneralRefContinuation(firstcin.CodDateCreation, codpref, lastCode, _codeType, cliId);
                    newcod.cod_name = newcod.cod_code;
                    firstcin.CliId = cliId;
                    newcod.cli_id = cliId;
                    newcod.cod_d_creation = firstcin.CodDateCreation;
                    newcod.cod_d_update = firstcin.CodDateUpdate;
                    newcod.usr_creator_id = 1;
                    newcod.pco_id = pcoId;
                    newcod.pmo_id = pmoId;
                    newcod.cco_id_invoicing = ccoId;
                    newcod.vat_id = vatId;
                    newcod.cpl_id = cplId;
                    newcod.cod_footer_text = firstcin.CodFooterText;


                    newcod.prj_id = prjId;
                    newcod.soc_id = 1;

                    _db.TM_COD_Client_Order.AddObject(newcod);
                    _db.SaveChanges();
                    var codId = newcod.cod_id;
                    firstcin.CodId = codId;


                    // 重置每个cod
                    foreach (var clientOrder in allcinwithsamecode)
                    {
                        clientOrder.CodId = codId;
                        clientOrder.CliId = cliId;
                        clientOrder.CplId = cplId;
                    }

                    #region col cod lines

                    foreach (var samecod in allcinwithsamecode)
                    {
                        // for lines
                        foreach (var onecol in samecod.ClientOrderLines)
                        {
                            // for cln

                            var newcln = new TM_CLN_CostPlan_Lines();
                            newcln.cpl_id = cplId;
                            newcln.cln_level1 = 1;
                            newcln.cln_level1 = 2;
                            newcln.prd_id = null;
                            newcln.cln_unit_price = onecol.ColUnitPrice;
                            newcln.cln_quantity = onecol.ColQuantity;
                            newcln.cln_total_price = onecol.ColTotalPrice;
                            newcln.vat_id = vatId;
                            //newcii.dfl_id = null;
                            newcln.cln_total_crude_price = onecol.ColTotalCrudePrice;
                            newcln.cln_prd_name = onecol.PrdName;
                            newcln.cln_discount_amount = 0;
                            newcln.cln_discount_percentage = 0;
                            newcln.cln_price_with_discount_ht = onecol.ColPriceWithDiscountHt;
                            newcln.ltp_id = 2;
                            newcln.cln_description = onecol.ColDescription;
                            _db.TM_CLN_CostPlan_Lines.AddObject(newcln);
                            _db.SaveChanges();


                            // for col
                            var newcol = new TM_COL_ClientOrder_Lines();
                            newcol.cod_id = codId;
                            newcol.col_level1 = 1;
                            newcol.col_level2 = 2;
                            newcol.cln_id = newcln.cln_id;
                            newcol.prd_id = null;
                            newcol.col_unit_price = onecol.ColUnitPrice;
                            newcol.col_quantity = onecol.ColQuantity;
                            newcol.col_total_price = onecol.ColTotalPrice;
                            newcol.vat_id = vatId;
                            //newcii.dfl_id = null;
                            newcol.col_total_crude_price = onecol.ColTotalCrudePrice;
                            newcol.col_prd_name = onecol.PrdName;
                            newcol.col_discount_amount = 0;
                            newcol.col_discount_percentage = 0;
                            newcol.col_price_with_discount_ht = onecol.ColPriceWithDiscountHt;
                            newcol.ltp_id = 2;
                            newcol.col_description = onecol.ColDescription;
                            _db.TM_COL_ClientOrder_Lines.AddObject(newcol);
                            _db.SaveChanges();
                            onecol.ColId = newcol.col_id;
                        }
                    }



                    #endregion col cod lines

                    #endregion cod

                    #region Dfo
                    var dfolist = new List<TM_DFO_Delivery_Form>();

                    var dfocodes = allcinwithsamecode.Select(l => l.CodClientComment).Distinct().ToList();

                    foreach (var dfocode in dfocodes)
                    {
                        var allcinwithsamedfocode = allcinwithsamecode.Where(l => l.CodClientComment == dfocode).ToList();
                        var firstdfo = allcinwithsamedfocode.FirstOrDefault();

                        var newdfo = new TM_DFO_Delivery_Form();
                        newdfo.dfo_code = firstdfo.CodClientComment;
                        newdfo.dfo_d_creation = firstdfo.CodDateCreation;
                        newdfo.dfo_d_update = firstdfo.CodDateCreation;
                        newdfo.dfo_d_delivery = firstdfo.CodDateCreation;
                        newdfo.dfo_footer_text = firstdfo.CodFooterText;
                        newdfo.dfo_inter_comment = firstdfo.CodInterComment; // cin code
                        newdfo.usr_creator_id = 1;
                        newdfo.cod_id = firstdfo.CodId;
                        newdfo.cli_id = firstdfo.CliId;
                        newdfo.soc_id = 1;
                        newdfo.dfo_deliveried = true;
                        _db.TM_DFO_Delivery_Form.AddObject(newdfo);
                        _db.SaveChanges();
                        int dfoId = newdfo.dfo_id;
                        foreach (var clientOrder in allcinwithsamedfocode)
                        {
                            foreach (var onecol in clientOrder.ClientOrderLines)
                            {
                                var onedfl = new TM_DFL_DevlieryForm_Line
                                {
                                    dfo_id = dfoId,
                                    col_id = onecol.ColId,
                                    dfl_quantity = onecol.ColQuantity ?? 0
                                };
                                _db.TM_DFL_DevlieryForm_Line.AddObject(onedfl);
                                _db.SaveChanges();
                                dfolist.Add(newdfo);
                            }
                        }
                    }

                    dfolist = dfolist.Distinct().ToList();
                    #endregion Dfo


                    #region Cin

                    var cin = new TM_CIN_Client_Invoice();

                    cin.cin_code = onecincode;
                    cin.cin_name = cin.cin_code;
                    cin.cli_id = cliId;
                    cin.cin_d_creation = firstcin.CodDateCreation;
                    cin.cin_d_update = firstcin.CodDateCreation;
                    cin.cin_d_invoice = firstcin.CodDateCreation;
                    cin.usr_creator_id = 1;
                    cin.cin_footer_text = string.Empty;
                    cin.cur_id = 1;
                    cin.cin_account = false;
                    cin.cin_d_term = firstcin.CodDateCreation;
                    cin.pco_id = pcoId;
                    cin.pmo_id = pmoId;
                    cin.cco_id_invoicing = null;
                    cin.cin_isinvoice = true;
                    cin.vat_id = vatId;
                    cin.prj_id = prjId;
                    cin.cod_id = codId;
                    //cin.dfo_id = onedfo.dfo_id;
                    cin.soc_id = 1;
                    cin.cin_avoir_id = null;
                    cin.cin_invoiced = false;
                    _db.TM_CIN_Client_Invoice.AddObject(cin);
                    _db.SaveChanges();
                    int cinid = cin.cin_id;

                    foreach (var onedfo in dfolist)
                    {
                        var onedci = new TR_DCI_DeliveryForm_ClientInvoice();
                        onedci.dfo_id = onedfo.dfo_id;
                        onedci.cin_id = cinid;
                        _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(onedci);
                        _db.SaveChanges();

                        if (onedfo.TM_DFL_DevlieryForm_Line.Any())
                        {
                            var dfls = onedfo.TM_DFL_DevlieryForm_Line;
                            foreach (var onedfl in dfls)
                            {
                                var onecii = new TM_CII_ClientInvoice_Line
                                {
                                    cin_id = cinid,
                                    cii_level1 = 1,
                                    cii_level2 = 1,
                                    cii_description = onedfl.TM_COL_ClientOrder_Lines.col_description,
                                    cii_unit_price = onedfl.TM_COL_ClientOrder_Lines.col_unit_price,
                                    cii_quantity = onedfl.TM_COL_ClientOrder_Lines.col_quantity ?? 0,
                                    vat_id = onedfl.TM_COL_ClientOrder_Lines.vat_id,
                                    dfl_id = onedfl.dfl_id,
                                    cii_total_crude_price = onedfl.TM_COL_ClientOrder_Lines.col_total_crude_price,
                                    cii_total_price = onedfl.TM_COL_ClientOrder_Lines.col_total_price,
                                    cii_prd_name = onedfl.TM_COL_ClientOrder_Lines.col_prd_name,
                                    cii_discount_percentage = 0,
                                    cii_discount_amount = 0,
                                    ltp_id = 2,
                                    col_id = onedfl.TM_COL_ClientOrder_Lines.col_id
                                };

                                _db.TM_CII_ClientInvoice_Line.AddObject(onecii);
                                _db.SaveChanges();
                            }
                        }
                    }

                    #endregion Cin

                }
                else
                {
                    // avoir
                    // 新建Avoir 手动添加 avoir line

                    var allavoirwithsameCode = cods.Where(l => l.CodInterComment == onecincode).ToList();
                    var firstavoir = allavoirwithsameCode.FirstOrDefault();
                    var cincode = firstavoir.CodClientComment;
                    var thiscin = _db.TM_CIN_Client_Invoice.FirstOrDefault(l => l.cin_code == cincode);
                    if (thiscin != null)
                    {
                        var oneAvoir = new TM_CIN_Client_Invoice();
                        oneAvoir.cin_code = firstavoir.CodInterComment;
                        oneAvoir.cin_name = oneAvoir.cin_code;
                        oneAvoir.cli_id = thiscin.cli_id;
                        oneAvoir.cin_d_creation = firstavoir.CodDateCreation;
                        oneAvoir.cin_d_update = firstavoir.CodDateCreation;
                        oneAvoir.cin_d_invoice = firstavoir.CodDateCreation;
                        oneAvoir.usr_creator_id = 1;
                        oneAvoir.cin_footer_text = string.Empty;
                        oneAvoir.cur_id = 1;
                        oneAvoir.cin_account = true;
                        oneAvoir.cin_d_term = firstavoir.CodDateCreation;
                        oneAvoir.pco_id = thiscin.pco_id;
                        oneAvoir.pmo_id = thiscin.pmo_id;
                        oneAvoir.cco_id_invoicing = null;
                        oneAvoir.cin_isinvoice = false;
                        oneAvoir.vat_id = thiscin.vat_id;
                        oneAvoir.prj_id = thiscin.prj_id;
                        oneAvoir.cod_id = thiscin.cod_id;
                        //oneAvoir.dfo_id = thiscin.dfo_id;
                        oneAvoir.soc_id = 1;
                        oneAvoir.cin_avoir_id = null;
                        oneAvoir.cin_invoiced = false;
                        _db.TM_CIN_Client_Invoice.AddObject(oneAvoir);
                        _db.SaveChanges();
                        int cinid = oneAvoir.cin_id;

                    }


                }


            }
        }

        #endregion 导入BL和对应的CIN
    }
}

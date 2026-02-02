using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using Microsoft.Office.Interop.Excel;

namespace ERP.Repositories.SqlServer
{
    public class ClientRepository : BaseSqlServerRepository
    {
        public int CreateUpdateClient(Client oneClient, bool createCco = false)
        {
            int cliId = 0;
            bool create = false;
            if (oneClient.CmuId == 0)
            {
                oneClient.CmuId = CheckCommune(oneClient.Postcode, oneClient.City);
            }
            if (oneClient.Id != 0)
            {
                var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == oneClient.Id);
                if (cli != null)
                {
                    cli = ClientTranslator.EntityToRepository(oneClient, cli);
                    _db.TM_CLI_CLient.ApplyCurrentValues(cli);
                    _db.SaveChanges();
                    cliId = cli.cli_id;
                    var ctls = _db.TR_CTL_ClientTYPE_LIST.Where(l => l.cli_id == cliId).ToList();
                    foreach (var onetype in oneClient.ClientTypes)
                    {
                        var checkExsit = ctls.FirstOrDefault(l => l.cty_id == onetype.Key2);
                        if (!onetype.Actived && checkExsit != null)
                        {
                            _db.TR_CTL_ClientTYPE_LIST.DeleteObject(checkExsit);
                        }
                        else if (onetype.Actived && checkExsit == null)
                        {
                            var newCtl = new TR_CTL_ClientTYPE_LIST()
                            {
                                cli_id = cliId,
                                cty_id = onetype.Key2
                            };
                            _db.TR_CTL_ClientTYPE_LIST.AddObject(newCtl);
                        }
                    }
                    _db.SaveChanges();
                    //var ctl2save = oneClient.ClientTypes.Where(l => l.Actived).ToList();
                    //var ctl2delete = oneClient.ClientTypes.Where(l => !l.Actived).ToList();

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
                var newClient = new TM_CLI_CLient();
                var lastclient =
                    _db.TM_CLI_CLient.Where(m => m.soc_id == oneClient.SocId
                    && m.cli_d_creation.Year == oneClient.DateCreation.Year
                    && m.cli_d_creation.Month == oneClient.DateCreation.Month).OrderByDescending(m => m.cli_ref).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastclient != null)
                {
                    lastRef = lastclient.cli_ref;
                }
                string clpref = GetCodePref(9);
                oneClient.Reference = GetGeneralRefContinuation(oneClient.DateCreation, clpref, lastRef, _codeType, 0);
                newClient = ClientTranslator.EntityToRepository(oneClient, newClient, true);
                _db.TM_CLI_CLient.AddObject(newClient);
                _db.SaveChanges();
                cliId = newClient.cli_id;
                foreach (var onetype in oneClient.ClientTypes)
                {
                    if (onetype.Actived)
                    {
                        var newCtl = new TR_CTL_ClientTYPE_LIST()
                        {
                            cli_id = cliId,
                            cty_id = onetype.Key2
                        };
                        _db.TR_CTL_ClientTYPE_LIST.AddObject(newCtl);
                    }
                }
                _db.SaveChanges();


                // create client contact by default
                // create invoice address and delivery address
                if (createCco)
                {
                    ContactClientRepository ContactClientRepository = new ContactClientRepository();
                    var oneCco = new ContactClient
                    {
                        CliId = cliId,
                        CcoAdresseTitle = "Adresse Livraison",
                        CcoFirstname = "",
                        CcoLastname = "",
                        CcoAddress1 = oneClient.Address1,
                        CcoAddress2 = oneClient.Address2,
                        CcoPostcode = oneClient.Postcode,
                        CcoCity = oneClient.City,
                        CivId = 1,
                        CcoCountry = oneClient.Country,
                        CcoTel1 = oneClient.Tel1,
                        CcoTel2 = oneClient.Tel2,
                        SocId = oneClient.SocId,
                        CcoIsDeliveryAdr = true,
                        CcoIsInvoicingAdr = false,
                        CcoRecieveNewsletter = false,
                        UsrCreatedBy = oneClient.UsrCreatedBy,
                        CcoEmail = oneClient.Email,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        CcoFax = oneClient.Fax,
                        CcoCmuId = oneClient.CmuId,
                        CcoCellphone = oneClient.Cellphone,
                    };
                    ContactClientRepository.CreateUpdateContactClient(oneCco);
                    var oneCcoFac = new ContactClient
                    {
                        CliId = cliId,
                        CcoAdresseTitle = "Adresse Facturation",
                        CcoFirstname = "",
                        CcoLastname = "",
                        CcoAddress1 = oneClient.Address1,
                        CcoAddress2 = oneClient.Address2,
                        CcoPostcode = oneClient.Postcode,
                        CcoCity = oneClient.City,
                        CivId = 1,
                        CcoCountry = oneClient.Country,
                        CcoTel1 = oneClient.Tel1,
                        CcoTel2 = oneClient.Tel2,
                        SocId = oneClient.SocId,
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = true,
                        CcoRecieveNewsletter = false,
                        UsrCreatedBy = oneClient.UsrCreatedBy,
                        CcoEmail = oneClient.Email,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        CcoFax = oneClient.Fax,
                        CcoCmuId = oneClient.CmuId,
                        CcoCellphone = oneClient.Cellphone,
                    };
                    ContactClientRepository.CreateUpdateContactClient(oneCcoFac);
                }
            }
            return cliId;
        }

        public int CheckClientExisted(int socId, int cliId, string companyName)
        {
            var oneclient =
                _db.TM_CLI_CLient.FirstOrDefault(
                    m => m.soc_id == socId && m.cli_company_name == companyName && (cliId == 0 || m.cli_id != cliId));
            return oneclient == null ? 0 : 1;
        }

        public Client LoadClientById(int cliId)
        {
            var aclient = _db.TM_CLI_CLient.Where(m => m.cli_id == cliId).Select(ClientTranslator.RepositoryToEntity()).FirstOrDefault();
            if (aclient != null)
            {
                aclient.FId = StringCipher.EncoderSimple(aclient.Id.ToString(), "cliId");
            }
            return aclient;
        }

        public List<Client> SearchClient(Client searchClient)
        {
            var clis = _db.TM_CLI_CLient.Where(m =>
                m.soc_id == searchClient.SocId
                &&
                (string.IsNullOrEmpty(searchClient.CompanyName.Trim()) ||
                 m.cli_company_name.Contains(searchClient.CompanyName.Trim()))
                && (string.IsNullOrEmpty(searchClient.Reference.Trim()) || m.cli_ref.Contains(searchClient.Reference.Trim()))
                && (string.IsNullOrEmpty(searchClient.Email.Trim()) || m.cli_email.Contains(searchClient.Email.Trim()))
                && (string.IsNullOrEmpty(searchClient.Postcode.Trim()) || m.cli_postcode.Contains(searchClient.Postcode.Trim()))
                && (string.IsNullOrEmpty(searchClient.City.Trim()) || m.cli_city.Contains(searchClient.City.Trim()))
                && (string.IsNullOrEmpty(searchClient.Tel1.Trim()) || m.cli_tel1.Contains(searchClient.Tel1.Trim()))
                && (string.IsNullOrEmpty(searchClient.Tel2.Trim()) || m.cli_tel2.Contains(searchClient.Tel2.Trim()))
                && (searchClient.SuperRight || m.usr_created_by == searchClient.UsrCreatedBy || m.cli_usr_com1 == searchClient.UsrCreatedBy || m.cli_usr_com2 == searchClient.UsrCreatedBy || m.cli_usr_com3 == searchClient.UsrCreatedBy)
                && (searchClient.CtyId == 0 || m.TR_CTL_ClientTYPE_LIST.Any(k => k.cty_id == searchClient.CtyId))
                ).Select(ClientTranslator.RepositoryToEntity()).OrderBy(m => m.CompanyName).ToList();


            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "cliId");
            }
            return clis;
        }

        public List<Client> GetAllClient(int socId)
        {
            var clis =
                _db.TM_CLI_CLient.Where(m => m.soc_id == socId)
                    .Select(ClientTranslator.RepositoryToEntity())
                    .OrderBy(m => m.CompanyName)
                    .ToList();
            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "cliId");
            }
            return clis;
        }

        public List<Client> GetAllClientSimple(int socId, int usrId, bool superRight)
        {
            var clis =
                _db.TM_CLI_CLient.Where(m => m.soc_id == socId
                && (superRight || m.usr_created_by == usrId || m.cli_usr_com1 == usrId || m.cli_usr_com2 == usrId || m.cli_usr_com3 == usrId)
                )
                    .Select(ClientTranslator.RepositoryToEntitySimple())
                    .OrderBy(m => m.CompanyName)
                    .ToList();
            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "cliId");
            }
            return clis;
        }

        public List<Client> GetAllClientSimple2(int socId, int usrId, bool superRight)
        {
            var clis =
                _db.TM_CLI_CLient.Where(m => m.soc_id == socId
                && (superRight || m.usr_created_by == usrId || m.cli_usr_com1 == usrId || m.cli_usr_com2 == usrId || m.cli_usr_com3 == usrId)
                )
                    .Select(ClientTranslator.RepositoryToEntitySimple2())
                    .OrderBy(m => m.CompanyName)
                    .ToList();
            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "cliId");
            }
            return clis;
        }

        /// <summary>
        /// 此方法是project, cost plan, client order, order, invoice 等页面自动创建client的功能, 同时自动创建一个默认的联系人，此联系人是invoice和delivery的联系人
        /// </summary>
        /// <returns></returns>
        public int CreateClientAutomatical(Client oneClient, bool createCco = true)
        {
            // create client
            int cliId = CreateUpdateClient(oneClient, createCco);
            //var oneCco = new ContactClient
            //             {
            //                 CcoAdresseTitle = "Default Adresse",
            //                 CliId = cliId,
            //                 SocId = oneClient.SocId,
            //                 CcoAddress1 = oneClient.Address1,
            //                 CcoAddress2 = oneClient.Address2,
            //                 CcoCellphone = oneClient.Cellphone,
            //                 CcoCity = oneClient.City,
            //                 CcoCmuId = oneClient.CmuId,
            //                 CcoCountry = oneClient.Country,
            //                 CcoEmail = oneClient.Email,
            //                 CcoFax = oneClient.Fax,
            //                 CcoFirstname = "",
            //                 CcoLastname = "",
            //                 CcoIsDeliveryAdr = true,
            //                 CcoIsInvoicingAdr = true,
            //                 CcoNewsletterEmail = oneClient.NewsletterEmail,
            //                 CcoRecieveNewsletter = oneClient.RecieveNewsletter,
            //                 CcoPostcode = oneClient.Postcode,
            //                 CcoTel1 = oneClient.Tel1,
            //                 CcoTel2 = oneClient.Tel2,
            //                 CivId = 1,
            //                 DateCreation = oneClient.DateCreation,
            //                 DateUpdate = oneClient.DateUpdate,
            //                 UsrCreatedBy = oneClient.UsrCreatedBy
            //             };
            //if (createCco)
            //{
            //    ContactClientRepository contactClientRepository = new ContactClientRepository();
            //    contactClientRepository.CreateUpdateContactClient(oneCco);
            //}
            return cliId;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="otherId"></param>
        /// <param name="typeId">1 project, 2 cost plan, 3 order, customer order, 4 bon de livraison, delivery form, 5 customer invoice</param>
        /// <param name="socId"></param>
        /// <returns></returns>
        public int GetClientIdByOtherId(int otherId, int typeId, int socId)
        {
            int cliId = 0;
            switch (typeId)
            {
                case 1:
                    {
                        cliId =
                            _db.TM_PRJ_Project.Where(m => m.soc_id == socId && m.prj_id == otherId)
                                .Select(m => m.cli_id)
                                .FirstOrDefault();
                    }
                    break;
                case 2:
                    {
                        cliId =
                            _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId && m.cpl_id == otherId)
                                .Select(m => m.cli_id)
                                .FirstOrDefault();
                    }
                    break;
                case 3:
                    {
                    }
                    break;
                case 4:
                    {
                    }
                    break;
                case 5:
                    {
                    }
                    break;

            }
            return cliId;
        }

        public List<Project> GetClientProjects(int cliId, int socId)
        {
            // 20241216 加上时间限制，现在最近一年的project
            var dStart = DateTime.Now.AddYears(-1).AddDays(-1);
            var prjs = _db.TM_PRJ_Project.Where(m => m.cli_id == cliId && m.soc_id == socId && m.prj_d_creation >= dStart).Select(ProjectTranslator.RepositoryToEntity()).OrderBy(m => m.PrjName).ToList();
            prjs.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId"));
            return prjs;
        }

        public List<CostPlan> GetClientCostPlanInProgress(int cliId, int socId)
        {
            var cpls = _db.TM_CPL_Cost_Plan.Where(m => m.soc_id == socId && m.cli_id == cliId && m.cst_id == 1).Select(CostPlanTranslator.RepositoryToEntity()).ToList();
            cpls.ForEach(cpl =>
            {
                cpl.FId = StringCipher.EncoderSimple(cpl.CplId.ToString(), "cplId");
                cpl.PrjFId = StringCipher.EncoderSimple(cpl.PrjId.ToString(), "prjId");
                cpl.CliFId = StringCipher.EncoderSimple(cpl.CliId.ToString(), "cliId");
            });
            return cpls;
        }

        public bool DeleteClient(int socId, int cliId)
        {
            bool deleted = false;
            var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == cliId && m.soc_id == socId);
            if (cli != null)
            {
                var clientInusr = _db.TM_PRJ_Project.Any(m => m.soc_id == socId && m.cli_id == cliId) ||
                                  _db.TM_CPL_Cost_Plan.Any(m => m.soc_id == socId && m.cli_id == cliId) ||
                                  _db.TM_COD_Client_Order.Any(m => m.soc_id == socId && m.cli_id == cliId) ||
                                  _db.TM_DFO_Delivery_Form.Any(m => m.soc_id == socId && m.cli_id == cliId) ||
                                  _db.TM_CIN_Client_Invoice.Any(m => m.soc_id == socId && m.cli_id == cliId);
                if (!clientInusr)
                {
                    var ctl = _db.TR_CTL_ClientTYPE_LIST.Where(l => l.cli_id == cliId).ToList();
                    try
                    {
                        foreach (var cco in ctl)
                        {
                            _db.TR_CTL_ClientTYPE_LIST.DeleteObject(cco);
                        }
                        _db.SaveChanges();

                    }
                    catch (Exception e)
                    {

                    }

                    var ccos = _db.TM_CCO_Client_Contact.Where(m => m.cli_id == cliId && m.TM_CLI_CLient.soc_id == socId).ToList();

                    try
                    {
                        foreach (var cco in ccos)
                        {
                            _db.TM_CCO_Client_Contact.DeleteObject(cco);
                        }
                        _db.SaveChanges();
                        _db.TM_CLI_CLient.DeleteObject(cli);
                        _db.SaveChanges();

                        deleted = true;
                    }
                    catch (Exception)
                    {
                        deleted = false;
                    }
                }
            }

            return deleted;
        }

        /// <summary>
        /// Search client by company name 20210219
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> SearchClientByName(string client, int socId)
        {
            var clients = _db.TM_CLI_CLient.Where(l => l.cli_company_name.Contains(client)
                && l.TR_CTL_ClientTYPE_LIST.Any(k => k.cty_id == 1) // 20251208 只筛选client
                )
                    .DistinctBy(l => l.cli_id).Select(l => new KeyValue { Key = l.cli_id, Value = l.cli_company_name, Value2 = l.cli_abbreviation })
                    .OrderBy(l => l.Value).Skip(0).Take(20).ToList();
            return clients;
        }

        #region Delegate 20251126

        /// <summary>
        /// Get all delegates of this client
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cliId">client Id</param>
        /// <returns></returns>
        public List<KeyValue> SearchDelegatorOfClient(int socId, int cliId, int delegatorId = 0)
        {
            //var test = _db.TR_CDL_Client_Delegate.Where(l => l.cli_id == cliId).ToList();

            var clis = (from cdl in _db.TR_CDL_Client_Delegate
                        join cli in _db.TM_CLI_CLient
                            on cdl.cli_delegate_id equals cli.cli_id
                        where cdl.cli_id == cliId
                        select cli).Select(l => new KeyValue()
                        {
                            Key = l.cli_id,
                            Value = l.cli_company_name,
                            Value2 = l.cli_abbreviation,
                            Value3 = l.cli_email
                        }).Distinct().OrderBy(m => m.Value).ToList();
            if (!clis.Any(l => l.Key == delegatorId))
            {
                var onedelegator = _db.TM_CLI_CLient.Where(l => l.soc_id == socId && l.cli_id == delegatorId).Select(l => new KeyValue()
                {
                    Key = l.cli_id,
                    Value = l.cli_company_name,
                    Value2 = l.cli_abbreviation,
                    Value3 = l.cli_email
                }).FirstOrDefault();
                if (onedelegator != null)
                {
                    clis.Add(onedelegator);
                    clis = clis.OrderBy(l => l.Value).ToList();
                }
            }
            foreach (var item in clis)
            {
                item.KeyStr1 = StringCipher.EncoderSimple(item.Key.ToString(), "cliId");
            }
            return clis;
        }

        /// <summary>
        /// Get the list of clients represented by this delegate.
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="delgId">delegate Id</param>
        /// <returns></returns>
        public List<KeyValue> SearchClientsOfDelegator(int socId, int delgId)
        {
            var clis = (from cdl in _db.TR_CDL_Client_Delegate
                        join cli in _db.TM_CLI_CLient
                            on cdl.cli_id equals cli.cli_id
                        where cdl.cli_delegate_id == delgId
                        select cdl.TM_CLI_CLient1).Select(l => new KeyValue()
                        {
                            Key = l.cli_id,
                            Value = l.cli_company_name,
                            Value2 = l.cli_abbreviation,
                            Value3 = l.cli_email
                        }).Distinct().OrderBy(m => m.Value).ToList();
            foreach (var item in clis)
            {
                item.KeyStr1 = StringCipher.EncoderSimple(item.Key.ToString(), "cliId");
            }
            return clis;
        }
        /// <summary>
        /// 关联客户与代表
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cliId"></param>
        /// <param name="delgId"></param>
        /// <param name="type">1:add delegate to client; 2: add client to delegate</param>
        /// <returns></returns>
        public List<KeyValue> RelateDeleteClientDelegator(int socId, int cliId, int delgId, int type)
        {
            var client = _db.TM_CLI_CLient.FirstOrDefault(l => l.soc_id == socId && l.cli_id == cliId);
            var delegator = _db.TM_CLI_CLient.FirstOrDefault(l => l.soc_id == socId && l.cli_id == delgId);
            var cdl = _db.TR_CDL_Client_Delegate.FirstOrDefault(l => l.cli_id == cliId && l.cli_delegate_id == delgId);
            if (client != null & delegator != null && cdl == null)
            {
                var newcdl = new TR_CDL_Client_Delegate()
                {
                    cli_id = cliId,
                    cli_delegate_id = delgId
                };
                _db.TR_CDL_Client_Delegate.AddObject(newcdl);
                _db.SaveChanges();
            }
            else if (cdl != null)
            {
                _db.TR_CDL_Client_Delegate.DeleteObject(cdl);
                _db.SaveChanges();
            }
            return (type == 1 ? SearchDelegatorOfClient(socId, cliId) : SearchClientsOfDelegator(socId, delgId));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="cliId"></param>
        /// <param name="type">1 get delegator; 2 get client</param>
        /// <returns></returns>
        public List<KeyValue> GetAllClientsDelegator(int socId, int cliId, int type)
        {
            var clients = (from ctl in _db.TR_CTL_ClientTYPE_LIST
                           join cli in _db.TM_CLI_CLient
                               on ctl.cli_id equals cli.cli_id
                           where ((type == 1 && ctl.cty_id == 3) || (type == 2 && ctl.cty_id != 3))
                               && cli.soc_id == socId
                           select cli).Select(l => new KeyValue()
                           {
                               Key = l.cli_id,
                               Value = l.cli_company_name,
                               Value2 = l.cli_abbreviation,
                               Value3 = l.cli_email,
                               //Actived = l.TR_CDL_Client_Delegate1.Any(),
                               //Key2 = l.TR_CDL_Client_Delegate.Any() ? 1 : 0,
                           }).Distinct().OrderBy(l => l.Value).ToList();

            // 确认该client 是否既是client 又是delegator
            var curclienttype = _db.TR_CTL_ClientTYPE_LIST.Where(l => l.cli_id == cliId).ToList();
            var savecurclient = curclienttype.Any(l => l.cty_id == 1) && curclienttype.Any(l => l.cty_id == 3);
            if (!savecurclient)
            {
                var curClient = clients.Where(l => l.Key == cliId);
                clients = clients.Except(curClient).ToList();
            }


            //var clients = _db.TM_CLI_CLient.Where(l =>
            //    ((type == 1 && l.cty_id == 3) ||
            //     (type == 2 && l.cty_id != 3)) && l.soc_id == socId && l.cli_id != cliId).Select(l => new KeyValue()
            //     {
            //         Key = l.cli_id,
            //         Value = l.cli_company_name,
            //         Value2 = l.cli_abbreviation,
            //         Value3 = l.cli_email,
            //         //Actived = l.TR_CDL_Client_Delegate1.Any(),
            //         //Key2 = l.TR_CDL_Client_Delegate.Any() ? 1 : 0,
            //     }).OrderBy(l => l.Value).ToList();

            var result = new List<KeyValue>();
            if (type == 1)
            {
                var delegators = (from cli in clients
                                  join cdl in _db.TR_CDL_Client_Delegate
                                      on cli.Key equals cdl.cli_delegate_id
                                  where cdl.cli_id == cliId
                                  select cli).AsQueryable();
                result = (from deleg in clients
                          join delegS in delegators
                              on deleg.Key equals delegS.Key
                              into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          select new KeyValue()
                          {
                              Key = deleg.Key,
                              Value = deleg.Value,
                              Value2 = deleg.Value2,
                              Value3 = deleg.Value3,
                              Actived = lj != null
                          }).ToList();
            }
            else
            {
                var delegators = (from cli in clients
                                  join cdl in _db.TR_CDL_Client_Delegate
                                      on cli.Key equals cdl.cli_id
                                  where cdl.cli_delegate_id == cliId
                                  select cli).AsQueryable();
                result = (from deleg in clients
                          join delegS in delegators
                              on deleg.Key equals delegS.Key
                              into leftJ
                          from lj in leftJ.DefaultIfEmpty()
                          select new KeyValue()
                          {
                              Key = deleg.Key,
                              Value = deleg.Value,
                              Value2 = deleg.Value2,
                              Value3 = deleg.Value3,
                              Actived = lj != null
                          }).ToList();

            }
            foreach (var item in result)
            {
                item.KeyStr1 = StringCipher.EncoderSimple(item.Key.ToString(), "cliId");
            }
            return result;
        }

        #endregion Delegate 20251126

        #region Site Client

        public int RegisterClient(SiteClient oneClient)
        {
            int sclId = 0;
            var checkEmailExist = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_email == oneClient.Email || m.scl_login == oneClient.Login);
            if (checkEmailExist != null)
            {
                // 已有该客户
                sclId = -2;
            }
            else
            {
                var newclient = ClientTranslator.EntityToRepositoryScl(oneClient, new TS_SCL_Site_Client(), true);
                _db.TS_SCL_Site_Client.AddObject(newclient);
                _db.SaveChanges();
                sclId = newclient.scl_id;
                // create password

                string password = StringCipher.Encrypt(oneClient.Pwd, oneClient.Login);
                var newPwd = new TS_CPW_Client_Password
                {
                    cpw_login = oneClient.Login,
                    //cpw_pwd = oneClient.Pwd,
                    cpw_pwd = password,
                    scl_id = sclId,
                    cpw_d_creation = DateTime.Now,
                    cpw_is_actived = true
                };
                _db.TS_CPW_Client_Password.AddObject(newPwd);
                _db.SaveChanges();
            }
            return sclId;
        }

        public int ActiveSiteClient(SiteClient client)
        {
            ContactClientRepository ContactClientRepository = new ContactClientRepository();
            int cliId = 0;
            var scl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.soc_id == client.SocId && m.scl_id == client.SclId);
            int ccoId = 0;
            if (scl != null)
            {
                if (client.Id == 0)
                {
                    // create new client
                    var newclient = new Client
                    {
                        CompanyName = client.CompanyName,
                        Address1 = client.Address1,
                        Postcode = client.Postcode,
                        City = client.City,
                        Tel1 = client.Tel1,
                        Fax = client.Fax,
                        Cellphone = client.Cellphone,
                        Email = client.Email,
                        RecieveNewsletter = true,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        Comment4Interne = client.Comment4Interne,
                        CtyId = 1,
                        CurId = 1,
                        PcoId = 1,
                        PmoId = 1,
                        VatId = 1,
                        SocId = 1,
                        ActId = null,
                        Isactive = true,
                        Isblocked = false,
                        VatIntra = client.VatIntra,
                        Siret = client.Siret,
                        InvoiceDay = 30,
                        InvoiceDayIsLastDay = true,
                        CliAccountingEmail = client.Email
                    };
                    cliId = CreateUpdateClient(newclient);
                    var cco = new ContactClient
                    {
                        CcoFirstname = client.FirstName,
                        CcoLastname = client.LastName,
                        CcoAddress1 = client.Address1,
                        CcoPostcode = client.Postcode,
                        CcoAdresseTitle = "Login site",
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = false,
                        CcoCity = client.City,
                        CivId = client.CivId,
                        CcoTel1 = client.Tel1,
                        CcoFax = client.Fax,
                        CcoCellphone = client.Cellphone,
                        CcoEmail = client.Email,
                        CcoRecieveNewsletter = true,
                        CliId = cliId,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        CcoComment = client.Comment4Interne
                    };
                    ccoId = ContactClientRepository.CreateUpdateContactClient(cco).CcoId;
                }
                else
                {
                    cliId = client.Id;
                    // add to client existed
                    var cco = new ContactClient
                    {
                        CcoFirstname = client.FirstName,
                        CcoLastname = client.LastName,
                        CcoAddress1 = client.Address1,
                        CcoPostcode = client.Postcode,
                        CcoAdresseTitle = "Login site",
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = false,
                        CcoCity = client.City,
                        CivId = client.CivId,
                        CcoTel1 = client.Tel1,
                        CcoFax = client.Fax,
                        CcoCellphone = client.Cellphone,
                        CcoEmail = client.Email,
                        CcoRecieveNewsletter = true,
                        CliId = client.Id,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        CcoComment = client.Comment4Interne
                    };
                    ccoId = ContactClientRepository.CreateUpdateContactClient(cco).CcoId;
                }
                if (cliId != 0 && ccoId != 0)
                {
                    scl.cli_id = cliId;
                    scl.cco_id = ccoId;
                    scl.scl_is_active = true;
                    scl.scl_d_active = DateTime.Now;
                    _db.TS_SCL_Site_Client.ApplyCurrentValues(scl);
                    _db.SaveChanges();
                }
            }
            return cliId;
        }

        public SiteClient Login(string login, string pwd)
        {
            SiteClient oneUser = new SiteClient();
            login = login.ToLower();
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_login == login);
            if (onescl != null)
            {
                var lastpwd = _db.TS_CPW_Client_Password.FirstOrDefault(m => m.scl_id == onescl.scl_id && m.cpw_is_actived);
                if (lastpwd != null)
                {
                    string password = StringCipher.Decrypt(lastpwd.cpw_pwd, login);
                    if (password == pwd)
                    {
                        oneUser = ClientTranslator.RepositoryToEntityScl().Compile().Invoke(onescl);
                    }
                    else
                    {
                        oneUser.SclId = -2;
                    }
                }
                else
                {
                    oneUser.SclId = -3;
                }
            }
            else
            {
                oneUser.SclId = -1;
            }
            return oneUser;
        }

        public SiteClient LoginWithId(int sclId, bool withPws = false)
        {
            SiteClient oneUser = null;
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_id == sclId);
            if (onescl != null)
            {
                oneUser = ClientTranslator.RepositoryToEntityScl(withPws).Compile().Invoke(onescl);
            }
            return oneUser;
        }

        public bool GetClientActiveFlag(int sclId)
        {
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_id == sclId);
            return onescl != null && onescl.scl_is_active;
        }

        public int GetCountClientToActive(int socId)
        {
            var scls = _db.TS_SCL_Site_Client.Count(m => m.soc_id == socId && !m.scl_is_active);
            return scls;
        }

        public List<SiteClient> GetClientToActive(int socId, bool all = true)
        {
            var scls = _db.TS_SCL_Site_Client.Where(m => m.soc_id == socId && (all || !m.scl_is_active)).Select(ClientTranslator.RepositoryToEntityScl()).ToList();
            return scls;
        }

        public int CreatSiteClientByContactClient(int socId, int cliId, int ccoId)
        {
            int sclId = 0;
            var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.cco_id == ccoId && m.TM_CLI_CLient.soc_id == socId);
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.soc_id == socId && m.cco_id == ccoId);
            if (cco != null && onescl == null)
            {
                var login = string.Empty;
                var password = string.Empty;
                var firstnamecount = string.IsNullOrEmpty(cco.cco_firstname) ? 0 : cco.cco_firstname.Length;

                var loginvalide = false;
                for (int i = 0; i < firstnamecount; i++)
                {
                    var logincheck = string.Format("{0}{1}", cco.cco_firstname.Substring(0, i + 1), cco.cco_lastname);
                    logincheck = logincheck.Replace(" ", "");
                    var loginNoexiste = !_db.TS_SCL_Site_Client.Any(l => l.scl_login == logincheck && l.soc_id == socId);
                    if (loginNoexiste)
                    {
                        loginvalide = true;
                        login = logincheck;
                        break;
                    }
                }
                var oneguid = Guid.NewGuid();
                if (!loginvalide)
                {
                    var loginnumber = oneguid.ToString().Substring(9, 4);
                    login = string.Format("{0}{2}{1}", cco.cco_lastname, loginnumber, string.IsNullOrEmpty(cco.cco_lastname) ? "" : "_");
                }
                password = oneguid.ToString().Substring(0, 8);

                var scl = new TS_SCL_Site_Client
                {
                    scl_firstname = cco.cco_firstname,
                    scl_lastname = cco.cco_lastname,
                    scl_email = cco.cco_email,
                    scl_is_active = true,
                    soc_id = socId,
                    cli_id = cliId,
                    cco_id = cco.cco_id,
                    civ_id = cco.civ_id,
                    scl_login = login,
                    scl_d_creation = DateTime.Now,
                    scl_d_active = DateTime.Now,
                    scl_company_name = cco.TM_CLI_CLient.cli_company_name,
                    scl_address1 = cco.cco_address1,
                    scl_tel1 = cco.cco_tel1,
                    scl_fax = cco.cco_fax,
                    scl_city = cco.cco_city,
                    scl_cellphone = cco.cco_cellphone,
                    scl_vat_intra = cco.TM_CLI_CLient.cli_vat_intra,
                    scl_siret = cco.TM_CLI_CLient.cli_siret
                };

                _db.TS_SCL_Site_Client.AddObject(scl);
                _db.SaveChanges();
                sclId = scl.scl_id;

                // create password
                password = StringCipher.Encrypt(password, scl.scl_login.ToLower());
                var newPwd = new TS_CPW_Client_Password
                {
                    cpw_login = scl.scl_login,
                    cpw_pwd = password,
                    scl_id = sclId,
                    cpw_d_creation = DateTime.Now,
                    cpw_is_actived = true
                };
                _db.TS_CPW_Client_Password.AddObject(newPwd);
                _db.SaveChanges();
            }
            return sclId;
        }

        #endregion Site Client
    }
}


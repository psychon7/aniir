using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Remoting.Messaging;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;
using System.IO;
using System.Web.UI;

namespace ERP.Repositories.SqlServer
{
    public class DeliveryFormRepository : BaseSqlServerRepository
    {
        private CommonRepository CommonRepository = new CommonRepository();
        ContactClientRepository contactClientRepository = new ContactClientRepository();
        private UserRepository UserRepository = new UserRepository();
        private ClientOrderRepository ClientOrderRepository = new ClientOrderRepository();
        private ClientOrderLineRepository ClientOrderLineRepository = new ClientOrderLineRepository();
        private DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();

        public int CreateUpdateDeliveryForm(DeliveryForm oneDeliveryForm)
        {
            bool iscreate = false;
            int dfoId = 0;
            int ccoInvId = 0;
            int ccoDlvId = 0;


            //var oneCcoDlv = new ContactClient
            //{
            //    //CcoId = oneDeliveryForm.CcoIdDelivery,
            //    CliId = oneDeliveryForm.CliId,
            //    SocId = oneDeliveryForm.SocId,
            //    CcoAddress1 = oneDeliveryForm.Dlv_CcoAddress1,
            //    CcoAddress2 = oneDeliveryForm.Dlv_CcoAddress2,
            //    CcoCellphone = oneDeliveryForm.Dlv_CcoCellphone,
            //    CcoCity = oneDeliveryForm.Dlv_CcoCity,
            //    CcoCountry = oneDeliveryForm.Dlv_CcoCountry,
            //    CcoEmail = oneDeliveryForm.Dlv_CcoEmail,
            //    CcoFax = oneDeliveryForm.Dlv_CcoFax,
            //    CcoFirstname = oneDeliveryForm.Dlv_CcoFirstname,
            //    CcoLastname = oneDeliveryForm.Dlv_CcoLastname,
            //    CcoPostcode = oneDeliveryForm.Dlv_CcoPostcode,
            //    CcoTel1 = oneDeliveryForm.Dlv_CcoTel1,
            //    UsrCreatedBy = oneDeliveryForm.UsrCreatorId,
            //    CcoIsDeliveryAdr = true,
            //    DateUpdate = DateTime.Now
            //};

            //var contactclient = contactClientRepository.CreateUpdateContactClient(oneCcoDlv, true);
            //oneDeliveryForm.CcoIdDelivery = contactclient.CcoId;
            // create
            if (oneDeliveryForm.DfoId == 0)
            {
                var lastCod = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == oneDeliveryForm.SocId
                    && m.dfo_d_creation.Year == oneDeliveryForm.DfoDCreation.Year
                    && m.dfo_d_creation.Month == oneDeliveryForm.DfoDCreation.Month).OrderByDescending(m => m.dfo_code).FirstOrDefault();
                string lastCode = string.Empty;
                bool isFirstBl = !_db.TM_DFO_Delivery_Form.Any(m => m.cod_id == oneDeliveryForm.CodId);
                if (lastCod != null)
                {
                    lastCode = lastCod.dfo_code;
                }
                string pref = GetCodePref(5);
                oneDeliveryForm.DfoCode = GetGeneralRefContinuation(oneDeliveryForm.DfoDCreation, pref, lastCode, _codeType, oneDeliveryForm.CliId);
                var newCod = new TM_DFO_Delivery_Form();
                newCod = DeliveryFormTranslator.EntityToRepository(oneDeliveryForm, newCod, true);
                _db.TM_DFO_Delivery_Form.AddObject(newCod);
                if (isFirstBl)
                {
                    WarehouseRepository WarehouseRepository = new WarehouseRepository();
                    WarehouseRepository.CreatePreInventoryFromCod(oneDeliveryForm.SocId, oneDeliveryForm.CodId);
                }
                try
                {
                    _db.SaveChanges();
                    dfoId = newCod.dfo_id;
                }
                catch (Exception)
                {
                }

            }
            else
            {
                // update
                var oneDfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == oneDeliveryForm.SocId && m.dfo_id == oneDeliveryForm.DfoId);
                if (oneDfo != null)
                {
                    oneDfo = DeliveryFormTranslator.EntityToRepository(oneDeliveryForm, oneDfo);
                    _db.TM_DFO_Delivery_Form.ApplyCurrentValues(oneDfo);
                    _db.SaveChanges();
                    dfoId = oneDfo.dfo_id;
                }
            }
            return dfoId;
        }

        public DeliveryForm LoadDeliveryFormById(int dfoId, int socId, int usrId, bool forPdf = false)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var dfo = _db.TM_DFO_Delivery_Form.Where(m => m.dfo_id == dfoId && m.soc_id == socId
                       //&& (isAdmin || m.usr_creator_id == usrId)
                       ).FilterDfoUser(isAdmin, isStoreKeeper, usrId, subUser).AsQueryable().Select(DeliveryFormTranslator.RepositoryToEntity()).FirstOrDefault();
            if (dfo != null)
            {
                dfo.FId = StringCipher.EncoderSimple(dfo.DfoId.ToString(), "dfoId");
                dfo.CodFId = StringCipher.EncoderSimple(dfo.CodId.ToString(), "codId");
                dfo.CliFId = StringCipher.EncoderSimple(dfo.CliId.ToString(), "cliId");
                dfo.PrjFId = StringCipher.EncoderSimple(dfo.PrjId.ToString(), "prjId");
                dfo.CinFId = StringCipher.EncoderSimple(dfo.CinId.ToString(), "cinId");
                dfo.CodAllDeliveried = CheckCodIsAllDeliveried(dfoId, socId);
                try
                {
                    dfo.CcoListForDfo = _db.TM_CCO_Client_Contact.Where(l => l.cli_id == dfo.CliId && l.cco_is_delivery_adr == true)
                        .Select(ContactClientTranslator.RepositoryToEntity()).ToList();
                }
                catch (Exception e)
                {
                    //Console.WriteLine(e);
                    //throw;
                }
            }
            if (forPdf)
            {
                DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
                dfo.DeliveryFormLines = DeliveryFormLineRepository.GetDflsByDfoId(socId, dfoId).ToList();
            }
            return dfo;
        }

        public List<DeliveryForm> SearchDeliveryForms(DeliveryForm oneDfo)
        {
            DateTime createDateFrom;
            if (!DateTime.TryParse(oneDfo._DfoDCreation, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
            {
                createDateFrom = new DateTime(1900, 1, 1);
            }
            DateTime createDateTo;
            if (!DateTime.TryParse(oneDfo._DfoDUpdate, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
            {
                createDateTo = new DateTime(2500, 12, 31);
            }
            createDateTo = new DateTime(createDateTo.Year, createDateTo.Month, createDateTo.Day, 23, 59, 59);


            bool isAdmin = UserRepository.IsAdmin(oneDfo.SocId, oneDfo.UsrCreatorId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(oneDfo.SocId, oneDfo.UsrCreatorId);
            var subUser = UserRepository.GetUserSubUsersIds(oneDfo.SocId, oneDfo.UsrCreatorId);
            var cpls = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == oneDfo.SocId
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.DfoCode.Trim()) ||
                                                           m.dfo_code.Contains(oneDfo.DfoCode.Trim()))
                                                          // project
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.PrjCode.Trim()) ||
                                                           m.TM_COD_Client_Order.TM_PRJ_Project.prj_code.Contains(oneDfo.PrjCode.Trim()))
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.PrjName.Trim()) ||
                                                           m.TM_COD_Client_Order.TM_PRJ_Project.prj_name.Contains(oneDfo.PrjName.Trim()))
                                                          // devis
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.CplCode.Trim()) ||
                                                           (!m.TM_COD_Client_Order.cpl_id.HasValue ||
                                                            (m.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_code.Contains(oneDfo.CplCode.Trim()))))
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.CplName.Trim()) ||
                                                           (!m.TM_COD_Client_Order.cpl_id.HasValue ||
                                                            (m.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_name.Contains(oneDfo.CplName.Trim()))))
                                                           // client order
                                                           &&
                                                          (string.IsNullOrEmpty(oneDfo.CodCode.Trim()) ||
                                                           m.TM_COD_Client_Order.cod_code.Contains(oneDfo.CodCode.Trim()))
                                                           &&
                                                          (string.IsNullOrEmpty(oneDfo.CodName.Trim()) ||
                                                           m.TM_COD_Client_Order.cod_name.Contains(oneDfo.CodName.Trim()))
                                                          // client
                                                          &&
                                                          (string.IsNullOrEmpty(oneDfo.ClientCompanyName.Trim()) ||
                                                           m.TM_CLI_CLient.cli_company_name.Contains(oneDfo.ClientCompanyName.Trim()))
                                                              // cco delivery
                                                              //&& (
                                                              //    string.IsNullOrEmpty(oneDfo.Dlv_CcoFirstname.Trim()) ||
                                                              //    m.TM_CCO_Client_Contact.cco_firstname.Contains(oneDfo.Dlv_CcoFirstname.Trim())
                                                              //    ||
                                                              //    m.TM_CCO_Client_Contact.cco_lastname.Contains(oneDfo.Dlv_CcoFirstname.Trim())
                                                              //    ||
                                                              //    m.TM_CCO_Client_Contact.cco_adresse_title.Contains(oneDfo.Dlv_CcoFirstname.Trim())
                                                              //    )
                                                              && (m.dfo_d_creation >= createDateFrom && m.dfo_d_creation <= createDateTo)
                // 20231106 只显示已派送和已出发票
                && (!oneDfo.DfoDeliveried || m.dfo_deliveried == true)
                && (!oneDfo.HasClientInvoice || m.TR_DCI_DeliveryForm_ClientInvoice.Any())
                // is Admin
                //&& (isAdmin || m.usr_creator_id == oneDfo.UsrCreatorId)
                ).FilterDfoUser(isAdmin, isStoreKeeper, oneDfo.UsrCreatorId, subUser).AsQueryable().Select(DeliveryFormTranslator.RepositoryToEntity()).OrderByDescending(l => l.DfoCode).ToList();
            cpls.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
            });
            return cpls;
        }

        public void UpdateDeliveryFormFile(int socId, int dfoId, string filePath)
        {
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId);
            if (dfo != null)
            {
                if (!string.IsNullOrEmpty(dfo.dfo_file))
                {
                    CommonRepository.DeleteFile(dfo.dfo_file);
                }
                dfo.dfo_file = filePath;
                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo);
                _db.SaveChanges();
            }
        }

        public List<ClientForDfo> GetClientWithClientOrderLineNoDeliveried(int socId, int usrId, bool superRight)
        {
            var cols = _db.TM_COL_ClientOrder_Lines.Where(m => m.TM_COD_Client_Order.soc_id == socId && (m.ltp_id == 2 || m.ltp_id == 4)
                &&
                (superRight || m.TM_COD_Client_Order.TM_CLI_CLient.usr_created_by == usrId || m.TM_COD_Client_Order.TM_CLI_CLient.cli_usr_com1 == usrId || m.TM_COD_Client_Order.TM_CLI_CLient.cli_usr_com2 == usrId || m.TM_COD_Client_Order.TM_CLI_CLient.cli_usr_com3 == usrId
                 || m.TM_COD_Client_Order.usr_com_1 == usrId || m.TM_COD_Client_Order.usr_com_2 == usrId || m.TM_COD_Client_Order.usr_com_3 == usrId)
                ).Distinct().ToList();
            //var cods = cols.Select(m => m.cod_id).Distinct().ToList();
            var colIds = cols.Select(m => m.col_id).Distinct().ToList();
            var colUsed = _db.TM_DFL_DevlieryForm_Line.Where(m => m.col_id.HasValue && colIds.Contains(m.col_id.Value)).Select(m => m.col_id.Value).Distinct().ToList();
            var colNoUse = colIds.Except(colUsed).ToList();
            var usedCols = cols.Where(m => colUsed.Contains(m.col_id)).Distinct().ToList();
            List<int> colIdsForDfl = (from onecol in usedCols let dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.col_id == onecol.col_id).ToList() let totalQuantity = dfls.Sum(m => m.dfl_quantity) let restQuantity = onecol.col_quantity - totalQuantity where restQuantity > 0 select onecol.col_id).ToList();

            //foreach (var onecol in usedCols)
            //{
            //    var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.col_id == onecol.col_id).ToList();
            //    var totalQuantity = dfls.Sum(m => m.dfl_quantity);
            //    var restQuantity = onecol.col_quantity - totalQuantity;
            //    if (restQuantity > 0)
            //    {
            //        colIdsForDfl.Add(onecol.col_id);
            //    }
            //}

            colIdsForDfl.AddRange(colNoUse);
            var cods = _db.TM_COL_ClientOrder_Lines.Where(m => colIdsForDfl.Contains(m.col_id)).Select(m => m.TM_COD_Client_Order).ToList().Distinct().AsQueryable().Select(ClientOrderTranslator.RepositoryToEntity()).ToList();
            cods.ForEach(m => m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId"));
            cods.ForEach(m => m.FId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId"));
            var codclients = cods.Select(m => new
            {
                m.CliId,
                m.ClientCompanyName,
            }).Distinct().ToList();

            var result = (from codclient in codclients
                          let clientCod = cods.Where(m => m.CliId == codclient.CliId).ToList()
                          select new ClientForDfo
                          {
                              CliId = codclient.CliId,
                              ClientCompanyName = codclient.ClientCompanyName,
                              ClientOrderList = clientCod,
                              //OneClient = codclient.OneClient
                          }).ToList();
            result.ForEach(m => m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId"));

            result = result.OrderBy(m => m.ClientCompanyName).ToList();
            var resultwithClient = (from res in result
                                    join client in _db.TM_CLI_CLient
                                        on res.CliId equals client.cli_id
                                    select new { res, client }
                ).ToList();

            foreach (var resClient in resultwithClient)
            {
                resClient.res.OneClient = new Client
                {
                    Address1 = resClient.client.cli_address1,
                    Address2 = resClient.client.cli_address2,
                    Postcode = resClient.client.cli_postcode,
                    Tel1 = resClient.client.cli_tel1,
                    City = resClient.client.cli_city,
                    Country = resClient.client.cli_country,
                    Email = resClient.client.cli_email,
                    Cellphone = resClient.client.cli_cellphone,
                    Fax = resClient.client.cli_fax,
                };
            }

            //var clients = cods.Select(m => new ClientForDfo
            //                               {
            //                                   CliId = m.CliId,
            //                                   ClientCompanyName = m.ClientCompanyName
            //                               }).Distinct().ToList();
            //clients.ForEach(m =>
            //{
            //    m.ClientOrderList = cods.Where(l => l.CliId == m.CliId).ToList();
            //});
            return result;
        }

        public List<ClientOrderLine> GetClientOrderLinesForDelivery(int socId, int dfoId)
        {
            var cols = (from dfo in _db.TM_DFO_Delivery_Form
                        join col in _db.TM_COL_ClientOrder_Lines on dfo.cod_id equals col.cod_id
                        where dfo.soc_id == socId
                              && dfo.dfo_id == dfoId
                              && (col.ltp_id == 2 || col.ltp_id == 4)
                        select col).Select(ClientOrderLineTranslator.RepositoryToEntity()).ToList();
            cols.ForEach(m =>
            {
                m.ColQuantityDeliveried = CalculateDeliveriedQuantity(m.ColId);
                m.ColQuantityToDelivery = (m.ColQuantity ?? 0) - m.ColQuantityDeliveried;
            });
            return cols;
        }

        private decimal? CalculateDeliveriedQuantity(int colId)
        {
            var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.col_id == colId).ToList();
            var deliveried = dfls.Sum(m => m.dfl_quantity);
            return deliveried;
        }

        public bool DeleteDeliveryForm(int dfoId, int socId)
        {
            bool deleted = false;
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.dfo_id == dfoId && m.soc_id == socId);
            if (dfo != null && !dfo.TM_CIN_Client_Invoice.Any())
            {
                var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfo.dfo_id).ToList();
                // todo: check client invoice line
                if (dfls.Any(m => m.TM_CII_ClientInvoice_Line.Any()))
                {
                    // do nothing
                }
                else
                {
                    foreach (var dfl in dfls)
                    {
                        _db.TM_DFL_DevlieryForm_Line.DeleteObject(dfl);
                        _db.SaveChanges();
                    }
                    _db.TM_DFO_Delivery_Form.DeleteObject(dfo);
                    _db.SaveChanges();
                    deleted = true;
                }
            }
            return deleted;
        }

        /// <summary>
        /// 2018-12-26
        /// 可以为所选的dfo建cin，同一个cod下面可以有多个dfo，多个dfo可以合成一个cin，也就是同一个cod可以有多个cin
        /// </summary>
        /// <param name="dfoIds"></param>
        /// <param name="socId"></param>
        /// <param name="usrId"></param>
        /// <param name="dCreate">如果是NULL，也就是默认的时间，如果有值，则是cin的date de creation，也就是决定cin code 的日期</param>
        /// <param name="bacId">20250216 这个Id 直接是TR_BAC里面的ID，只需要进行SOC_ID 的测试就行</param>
        /// <returns>CinId</returns>
        public int CreateCinForDfoSelected(List<int> dfoIds, int socId, int usrId, DateTime? dCreate, int bacId)
        {
            ClientInvoiceRepository ClientInvoiceRepository = new ClientInvoiceRepository();
            DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
            int cinId = 0;
            var dfos = (from dfoid in dfoIds
                        join dfo in _db.TM_DFO_Delivery_Form on dfoid equals dfo.dfo_id
                        select dfo).ToList();
            if (dfos.Any())
            {
                var dfo = dfos.FirstOrDefault();
                int codId = dfo.cod_id;
                var bankinfo = _db.TR_BAC_Bank_Account.FirstOrDefault(l => l.soc_id == socId && l.bac_id == bacId);
                var oneCin = new ClientInvoice
                {
                    CinId = 0,
                    CodId = dfo.cod_id,
                    PrjId = dfo.TM_COD_Client_Order.prj_id,
                    SocId = dfo.soc_id,
                    VatId = dfo.TM_COD_Client_Order.vat_id,
                    CplId = dfo.TM_COD_Client_Order.cpl_id,
                    CliId = dfo.cli_id,
                    DfoId = null,
                    CinDCreation = dCreate ?? dfo.dfo_d_creation,
                    CinDUpdate = DateTime.Now,
                    CinDInvoice = null,
                    UsrCreatorId = usrId,
                    CinHeaderText = dfo.TM_COD_Client_Order.cod_header_text,
                    CinFooterText = dfo.TM_COD_Client_Order.cod_footer_text,
                    CurId = 1, // euro
                    CinAccount = false,
                    CinDTerm = null,
                    PcoId = dfo.TM_COD_Client_Order.pco_id,
                    PmoId = dfo.TM_COD_Client_Order.pmo_id,
                    CcoIdInvoicing = dfo.TM_COD_Client_Order.cco_id_invoicing,
                    CinIsInvoice = true,
                    //CinName = "Facture pour " + dfo.TM_COD_Client_Order.cod_name,
                    CinName = dfo.TM_COD_Client_Order.cod_name,
                    CinDiscountPercentage = dfo.TM_COD_Client_Order.cod_discount_percentage,
                    //todo: shoul calculate this  CinDiscountAmount 
                    CinClientComment = dfo.TM_COD_Client_Order.cod_client_comment,
                    CinInterComment = dfo.TM_COD_Client_Order.cod_inter_comment,
                    //Inv_CcoFirstname = dfo.TM_COD_Client_Order.cod_inv_cco_firstname,
                    //Inv_CcoLastname = dfo.TM_COD_Client_Order.cod_inv_cco_lastname,
                    Inv_CcoAddress1 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address1,
                    Inv_CcoAddress2 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address2,
                    Inv_CcoPostcode = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_postcode,
                    Inv_CcoCity = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_city,
                    Inv_CcoCountry = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_country,
                    Inv_CcoTel1 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_tel1,
                    Inv_CcoFax = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_fax,
                    Inv_CcoCellphone = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_cellphone,
                    Inv_CcoEmail = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_email,

                    UsrCom1 = dfo.TM_COD_Client_Order.usr_com_1,
                    UsrCom2 = dfo.TM_COD_Client_Order.usr_com_2,
                    UsrCom3 = dfo.TM_COD_Client_Order.usr_com_3,
                    CinKeyProject = dfo.TM_COD_Client_Order.cod_key_project ?? false,
                    CinBank = bankinfo == null ? (int?)null : bacId
                };

                cinId = ClientInvoiceRepository.CreateUpdateClientInvoice(oneCin);

                var dfls = (from adfo in dfos
                            join dfl in _db.TM_DFL_DevlieryForm_Line on adfo.dfo_id equals dfl.dfo_id
                            select dfl).Distinct().ToList();

                DeliveryFormLineRepository.InsertCiiByDfl(cinId, dfls);

                // 20210219 update cin rest to pay
                ClientInvoiceRepository.UpdateCinRestToPay(socId, cinId);

                //DeliveryFormLineRepository.InsertCiiByCol(cinId, codId);
                WarehouseRepository WarehouseRepository = new WarehouseRepository();
                foreach (var onedfo in dfos)
                {
                    onedfo.dfo_deliveried = true;
                    _db.TM_DFO_Delivery_Form.ApplyCurrentValues(onedfo);
                    var dci = new TR_DCI_DeliveryForm_ClientInvoice
                    {
                        dfo_id = onedfo.dfo_id,
                        cin_id = cinId
                    };
                    _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                    _db.SaveChanges();
                    // update pre shipping receiving, pre inventory, inventory
                    var dflsofthisdfo =
                        _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == onedfo.dfo_id).Select(DeliveryFormLineTranslator.RepositoryToEntity()).ToList();
                    //WarehouseRepository.DeletePreInventoryFromDfoWithLines(socId, onedfo.dfo_id, dflsofthisdfo);
                    WarehouseRepository.CreateSrvFromDeliveryForm(socId, onedfo.dfo_id, usrId, onedfo.dfo_d_delivery, dflsofthisdfo);
                }

            }
            return cinId;
        }

        /// <summary>
        /// 20231107
        /// </summary>
        /// <param name="dfoIds"></param>
        /// <param name="socId"></param>
        /// <param name="usrId"></param>
        /// <param name="dCreate"></param>
        /// <param name="mode">1:将有相同order 的dfo合并生成一个cin; 0: 不同的dfo生成不同的cin</param>
        /// <returns></returns>
        public int CreateCinForDfoSelectedWithDifDfo(List<int> dfoIds, int socId, int usrId, DateTime? dCreate, int mode, int bacId)
        {
            ClientInvoiceRepository ClientInvoiceRepository = new ClientInvoiceRepository();
            DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
            int cinId = 0;
            var dfos = (from dfoid in dfoIds
                        join dfo in _db.TM_DFO_Delivery_Form on dfoid equals dfo.dfo_id
                        select dfo).ToList();
            if (dfos.Any())
            {
                var bankinfo = _db.TR_BAC_Bank_Account.FirstOrDefault(l => l.soc_id == socId && l.bac_id == bacId);
                // same order and mode = 1 
                if (mode == 1)
                {
                    var dfocod = dfos.Select(l => l.cod_id).Distinct().ToList();
                    foreach (var onecodId in dfocod)
                    {
                        var dfoOfthisCod = dfos.Where(l => l.cod_id == onecodId).ToList();
                        var dfo = dfoOfthisCod.FirstOrDefault();
                        int codId = dfo.cod_id;
                        // 20231106 check TR_DCI_DeliveryForm_ClientInvoice 是否存在，如果存在，就表示这个dfo 有cin 了，就不建立了
                        if (!dfo.TR_DCI_DeliveryForm_ClientInvoice.Any())
                        {
                            var oneCin = new ClientInvoice
                            {
                                CinId = 0,
                                CodId = dfo.cod_id,
                                PrjId = dfo.TM_COD_Client_Order.prj_id,
                                SocId = dfo.soc_id,
                                VatId = dfo.TM_COD_Client_Order.vat_id,
                                CplId = dfo.TM_COD_Client_Order.cpl_id,
                                CliId = dfo.cli_id,
                                DfoId = null,
                                CinDCreation = DateTime.Now, //dCreate ?? dfo.dfo_d_creation, 20231108 直接用当时时间
                                CinDUpdate = DateTime.Now,
                                CinDInvoice = null,
                                UsrCreatorId = usrId,
                                CinHeaderText = dfo.TM_COD_Client_Order.cod_header_text,
                                CinFooterText = dfo.TM_COD_Client_Order.cod_footer_text,
                                CurId = 1, // euro
                                CinAccount = false,
                                CinDTerm = null,
                                PcoId = dfo.TM_COD_Client_Order.pco_id,
                                PmoId = dfo.TM_COD_Client_Order.pmo_id,
                                CcoIdInvoicing = dfo.TM_COD_Client_Order.cco_id_invoicing,
                                CinIsInvoice = true,
                                //CinName = "Facture pour " + dfo.TM_COD_Client_Order.cod_name,
                                CinName = dfo.TM_COD_Client_Order.cod_name,
                                CinDiscountPercentage = dfo.TM_COD_Client_Order.cod_discount_percentage,
                                //todo: shoul calculate this  CinDiscountAmount 
                                CinClientComment = dfo.TM_COD_Client_Order.cod_client_comment,
                                CinInterComment = dfo.TM_COD_Client_Order.cod_inter_comment,
                                //Inv_CcoFirstname = dfo.TM_COD_Client_Order.cod_inv_cco_firstname,
                                //Inv_CcoLastname = dfo.TM_COD_Client_Order.cod_inv_cco_lastname,
                                Inv_CcoAddress1 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address1,
                                Inv_CcoAddress2 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address2,
                                Inv_CcoPostcode = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_postcode,
                                Inv_CcoCity = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_city,
                                Inv_CcoCountry = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_country,
                                Inv_CcoTel1 = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_tel1,
                                Inv_CcoFax = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_fax,
                                Inv_CcoCellphone = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_cellphone,
                                Inv_CcoEmail = dfo.TM_COD_Client_Order.TM_CLI_CLient.cli_email,

                                UsrCom1 = dfo.TM_COD_Client_Order.usr_com_1,
                                UsrCom2 = dfo.TM_COD_Client_Order.usr_com_2,
                                UsrCom3 = dfo.TM_COD_Client_Order.usr_com_3,
                                CinKeyProject = dfo.TM_COD_Client_Order.cod_key_project ?? false,
                                CinBank = bankinfo == null ? (int?)null : bacId
                            };

                            cinId = ClientInvoiceRepository.CreateUpdateClientInvoice(oneCin);
                            var dfls = (from adfo in dfoOfthisCod
                                        join dfl in _db.TM_DFL_DevlieryForm_Line on adfo.dfo_id equals dfl.dfo_id
                                        select dfl).Distinct().ToList();
                            DeliveryFormLineRepository.InsertCiiByDfl(cinId, dfls);
                            // 20210219 update cin rest to pay
                            ClientInvoiceRepository.UpdateCinRestToPay(socId, cinId);
                            //DeliveryFormLineRepository.InsertCiiByCol(cinId, codId);
                            WarehouseRepository WarehouseRepository = new WarehouseRepository();
                            foreach (var onedfo in dfoOfthisCod)
                            {
                                onedfo.dfo_deliveried = true;
                                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(onedfo);
                                var dci = new TR_DCI_DeliveryForm_ClientInvoice
                                {
                                    dfo_id = onedfo.dfo_id,
                                    cin_id = cinId
                                };
                                _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                                _db.SaveChanges();
                                // update pre shipping receiving, pre inventory, inventory
                                var dflsofthisdfo =
                                    _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == onedfo.dfo_id).Select(DeliveryFormLineTranslator.RepositoryToEntity()).ToList();
                                //WarehouseRepository.DeletePreInventoryFromDfoWithLines(socId, onedfo.dfo_id, dflsofthisdfo);
                                WarehouseRepository.CreateSrvFromDeliveryForm(socId, onedfo.dfo_id, usrId, onedfo.dfo_d_delivery, dflsofthisdfo);
                            }
                        }
                    }
                }
                else
                {
                    foreach (var curdfo in dfos)
                    {
                        //var dfoOfthisCod = dfos.Where(l => l.cod_id == onecodId).ToList();
                        var thisdfo = curdfo;//dfoOfthisCod.FirstOrDefault();
                        int codId = thisdfo.cod_id;
                        // 20231106 check TR_DCI_DeliveryForm_ClientInvoice 是否存在，如果存在，就表示这个dfo 有cin 了，就不建立了
                        if (!thisdfo.TR_DCI_DeliveryForm_ClientInvoice.Any())
                        {
                            var oneCin = new ClientInvoice
                            {
                                CinId = 0,
                                CodId = thisdfo.cod_id,
                                PrjId = thisdfo.TM_COD_Client_Order.prj_id,
                                SocId = thisdfo.soc_id,
                                VatId = thisdfo.TM_COD_Client_Order.vat_id,
                                CplId = thisdfo.TM_COD_Client_Order.cpl_id,
                                CliId = thisdfo.cli_id,
                                DfoId = null,
                                CinDCreation = dCreate ?? thisdfo.dfo_d_creation,
                                CinDUpdate = DateTime.Now,
                                CinDInvoice = null,
                                UsrCreatorId = usrId,
                                CinHeaderText = thisdfo.TM_COD_Client_Order.cod_header_text,
                                CinFooterText = thisdfo.TM_COD_Client_Order.cod_footer_text,
                                CurId = 1, // euro
                                CinAccount = false,
                                CinDTerm = null,
                                PcoId = thisdfo.TM_COD_Client_Order.pco_id,
                                PmoId = thisdfo.TM_COD_Client_Order.pmo_id,
                                CcoIdInvoicing = thisdfo.TM_COD_Client_Order.cco_id_invoicing,
                                CinIsInvoice = true,
                                //CinName = "Facture pour " + dfo.TM_COD_Client_Order.cod_name,
                                CinName = thisdfo.TM_COD_Client_Order.cod_name,
                                CinDiscountPercentage = thisdfo.TM_COD_Client_Order.cod_discount_percentage,
                                //todo: shoul calculate this  CinDiscountAmount 
                                CinClientComment = thisdfo.TM_COD_Client_Order.cod_client_comment,
                                CinInterComment = thisdfo.TM_COD_Client_Order.cod_inter_comment,
                                //Inv_CcoFirstname = dfo.TM_COD_Client_Order.cod_inv_cco_firstname,
                                //Inv_CcoLastname = dfo.TM_COD_Client_Order.cod_inv_cco_lastname,
                                Inv_CcoAddress1 = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address1,
                                Inv_CcoAddress2 = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_address2,
                                Inv_CcoPostcode = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_postcode,
                                Inv_CcoCity = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_city,
                                Inv_CcoCountry = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_country,
                                Inv_CcoTel1 = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_tel1,
                                Inv_CcoFax = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_fax,
                                Inv_CcoCellphone = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_cellphone,
                                Inv_CcoEmail = thisdfo.TM_COD_Client_Order.TM_CLI_CLient.cli_email,

                                UsrCom1 = thisdfo.TM_COD_Client_Order.usr_com_1,
                                UsrCom2 = thisdfo.TM_COD_Client_Order.usr_com_2,
                                UsrCom3 = thisdfo.TM_COD_Client_Order.usr_com_3,
                                CinKeyProject = thisdfo.TM_COD_Client_Order.cod_key_project ?? false,
                                CinBank = bankinfo == null ? (int?)null : bacId
                            };

                            cinId = ClientInvoiceRepository.CreateUpdateClientInvoice(oneCin);
                            var dfls = (from dfl in _db.TM_DFL_DevlieryForm_Line
                                        where thisdfo.dfo_id == dfl.dfo_id
                                        select dfl).Distinct().ToList();
                            DeliveryFormLineRepository.InsertCiiByDfl(cinId, dfls);
                            // 20210219 update cin rest to pay
                            ClientInvoiceRepository.UpdateCinRestToPay(socId, cinId);
                            //DeliveryFormLineRepository.InsertCiiByCol(cinId, codId);
                            WarehouseRepository WarehouseRepository = new WarehouseRepository();
                            //foreach (var onedfo in dfoOfthisCod)
                            //{
                            thisdfo.dfo_deliveried = true;
                            _db.TM_DFO_Delivery_Form.ApplyCurrentValues(thisdfo);
                            var dci = new TR_DCI_DeliveryForm_ClientInvoice
                            {
                                dfo_id = thisdfo.dfo_id,
                                cin_id = cinId
                            };
                            _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                            _db.SaveChanges();
                            // update pre shipping receiving, pre inventory, inventory
                            var dflsofthisdfo =
                                _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == thisdfo.dfo_id).Select(DeliveryFormLineTranslator.RepositoryToEntity()).ToList();
                            //WarehouseRepository.DeletePreInventoryFromDfoWithLines(socId, onedfo.dfo_id, dflsofthisdfo);
                            WarehouseRepository.CreateSrvFromDeliveryForm(socId, thisdfo.dfo_id, usrId, thisdfo.dfo_d_delivery, dflsofthisdfo);
                            //}
                        }
                    }
                }

            }
            return cinId;
        }

        /// <summary>
        /// 2018-04-05 create cin with all dfos
        /// </summary>
        /// <param name="dfoId"></param>
        /// <param name="socId"></param>
        /// <param name="usrId"></param>
        /// <param name="mode">0: normal; 1: date like delivery form</param>
        /// <returns></returns>
        public int CreateCinForCod(int dfoId, int socId, int usrId, int mode)
        {
            ClientInvoiceRepository ClientInvoiceRepository = new ClientInvoiceRepository();
            DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
            int cinId = 0;
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.dfo_id == dfoId && m.soc_id == socId);
            if (dfo != null)
            {
                int codId = dfo.cod_id;
                var oneCin = new ClientInvoice
                {
                    CinId = 0,
                    CodId = dfo.cod_id,
                    PrjId = dfo.TM_COD_Client_Order.prj_id,
                    SocId = dfo.soc_id,
                    VatId = dfo.TM_COD_Client_Order.vat_id,
                    CplId = dfo.TM_COD_Client_Order.cpl_id,

                    CliId = dfo.cli_id,
                    //DfoId = dfo.dfo_id,
                    DfoId = null,
                    CinDCreation = mode == 1 ? dfo.dfo_d_creation : DateTime.Now,
                    CinDUpdate = DateTime.Now,
                    CinDInvoice = null,
                    UsrCreatorId = usrId,
                    CinHeaderText = dfo.TM_COD_Client_Order.cod_header_text,
                    CinFooterText = dfo.TM_COD_Client_Order.cod_footer_text,
                    CurId = 1, // euro
                    CinAccount = false,
                    CinDTerm = null,
                    PcoId = dfo.TM_COD_Client_Order.pco_id,
                    PmoId = dfo.TM_COD_Client_Order.pmo_id,
                    //CcoIdDelivery = dfo.cco_id_delivery,
                    CcoIdInvoicing = dfo.TM_COD_Client_Order.cco_id_invoicing,
                    CinIsInvoice = true,
                    CinName = "Facture pour " + dfo.dfo_code,
                    CinDiscountPercentage = dfo.TM_COD_Client_Order.cod_discount_percentage,
                    //todo: shoul calculate this  CinDiscountAmount 
                    CinClientComment = dfo.TM_COD_Client_Order.cod_client_comment,
                    CinInterComment = dfo.TM_COD_Client_Order.cod_inter_comment,
                    //Inv_CcoFirstname = dfo.TM_COD_Client_Order.cod_inv_cco_firstname,
                    //Inv_CcoLastname = dfo.TM_COD_Client_Order.cod_inv_cco_lastname,
                    //Inv_CcoAddress1 = dfo.TM_COD_Client_Order.cod_inv_cco_address1,
                    //Inv_CcoAddress2 = dfo.TM_COD_Client_Order.cod_inv_cco_address2,
                    //Inv_CcoPostcode = dfo.TM_COD_Client_Order.cod_inv_cco_postcode,
                    //Inv_CcoCity = dfo.TM_COD_Client_Order.cod_inv_cco_city,
                    //Inv_CcoCountry = dfo.TM_COD_Client_Order.cod_inv_cco_country,
                    //Inv_CcoTel1 = dfo.TM_COD_Client_Order.cod_inv_cco_tel1,
                    //Inv_CcoFax = dfo.TM_COD_Client_Order.cod_inv_cco_fax,
                    //Inv_CcoCellphone = dfo.TM_COD_Client_Order.cod_inv_cco_cellphone,
                    //Inv_CcoEmail = dfo.TM_COD_Client_Order.cod_inv_cco_email,

                    // 2018-07-20 corrected
                    // 2018-12-26 remove
                    //Dlv_CcoFirstname = dfo.dfo_dlv_cco_firstname,
                    //Dlv_CcoLastname = dfo.dfo_dlv_cco_lastname,
                    //Dlv_CcoAddress1 = dfo.dfo_dlv_cco_address1,
                    //Dlv_CcoAddress2 = dfo.dfo_dlv_cco_address2,
                    //Dlv_CcoPostcode = dfo.dfo_dlv_cco_postcode,
                    //Dlv_CcoCity = dfo.dfo_dlv_cco_city,
                    //Dlv_CcoCountry = dfo.dfo_dlv_cco_country,
                    //Dlv_CcoTel1 = dfo.dfo_dlv_cco_tel1,
                    //Dlv_CcoFax = dfo.dfo_dlv_cco_fax,
                    //Dlv_CcoCellphone = dfo.dfo_dlv_cco_cellphone,
                    //Dlv_CcoEmail = dfo.dfo_dlv_cco_email,

                    UsrCom1 = dfo.TM_COD_Client_Order.usr_com_1,
                    UsrCom2 = dfo.TM_COD_Client_Order.usr_com_2,
                    UsrCom3 = dfo.TM_COD_Client_Order.usr_com_3,
                    CinKeyProject = dfo.TM_COD_Client_Order.cod_key_project ?? false
                };
                cinId = ClientInvoiceRepository.CreateUpdateClientInvoice(oneCin);
                //var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId).ToList();
                //DeliveryFormLineRepository.InsertCiiByDfl(cinId, dfls);
                DeliveryFormLineRepository.InsertCiiByCol(cinId, codId);


                var alldfo = _db.TM_DFO_Delivery_Form.Where(m => m.cod_id == dfo.cod_id).ToList();
                foreach (var onedfo in alldfo)
                {
                    onedfo.dfo_deliveried = true;
                    _db.TM_DFO_Delivery_Form.ApplyCurrentValues(onedfo);
                    var dci = new TR_DCI_DeliveryForm_ClientInvoice
                    {
                        dfo_id = onedfo.dfo_id,
                        cin_id = cinId
                    };
                    _db.TR_DCI_DeliveryForm_ClientInvoice.AddObject(dci);
                    _db.SaveChanges();
                }
            }
            return cinId;
        }

        #region 不再使用区域

        public void DeliveryDfo(int dfoId, int socId, int usrId)
        {
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId);
            if (dfo != null)
            {
                WarehouseRepository WarehouseRepository = new WarehouseRepository();
                var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId).Select(DeliveryFormLineTranslator.RepositoryToEntity()).ToList();
                WarehouseRepository.CreateSrvFromDeliveryForm(socId, dfoId, usrId, DateTime.Now, dfls);
                WarehouseRepository.DeletePreInventoryFromDfo(socId, dfoId);

                dfo.dfo_deliveried = true;
                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo);
                _db.SaveChanges();
            }
        }

        public int CreateClientInvoiceByDeliveryForm(int dfoId, int socId, int usrId)
        {
            ClientInvoiceRepository ClientInvoiceRepository = new ClientInvoiceRepository();
            DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
            int cinId = 0;
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.dfo_id == dfoId && m.soc_id == socId);
            if (dfo != null)
            {
                dfo.dfo_deliveried = true;
                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo);
                var oneCin = new ClientInvoice
                {
                    CinId = 0,
                    CodId = dfo.cod_id,
                    PrjId = dfo.TM_COD_Client_Order.prj_id,
                    SocId = dfo.soc_id,
                    VatId = dfo.TM_COD_Client_Order.vat_id,
                    CplId = dfo.TM_COD_Client_Order.cpl_id,

                    CliId = dfo.cli_id,
                    DfoId = dfo.dfo_id,
                    CinDCreation = DateTime.Now,
                    CinDUpdate = DateTime.Now,
                    CinDInvoice = null,
                    UsrCreatorId = usrId,
                    CinHeaderText = dfo.TM_COD_Client_Order.cod_header_text,
                    CinFooterText = dfo.TM_COD_Client_Order.cod_footer_text,
                    CurId = 1, // euro
                    CinAccount = false,
                    CinDTerm = null,
                    PcoId = dfo.TM_COD_Client_Order.pco_id,
                    PmoId = dfo.TM_COD_Client_Order.pmo_id,
                    //CcoIdDelivery = dfo.cco_id_delivery,
                    CcoIdInvoicing = dfo.TM_COD_Client_Order.cco_id_invoicing,
                    CinIsInvoice = true,
                    CinName = "Facture pour " + dfo.dfo_code,
                    CinDiscountPercentage = dfo.TM_COD_Client_Order.cod_discount_percentage,
                    //todo: shoul calculate this  CinDiscountAmount 
                    CinClientComment = dfo.TM_COD_Client_Order.cod_client_comment,
                    CinInterComment = dfo.TM_COD_Client_Order.cod_inter_comment,
                    //Inv_CcoFirstname = dfo.TM_COD_Client_Order.cod_inv_cco_firstname,
                    //Inv_CcoLastname = dfo.TM_COD_Client_Order.cod_inv_cco_lastname,
                    //Inv_CcoAddress1 = dfo.TM_COD_Client_Order.cod_inv_cco_address1,
                    //Inv_CcoAddress2 = dfo.TM_COD_Client_Order.cod_inv_cco_address2,
                    //Inv_CcoPostcode = dfo.TM_COD_Client_Order.cod_inv_cco_postcode,
                    //Inv_CcoCity = dfo.TM_COD_Client_Order.cod_inv_cco_city,
                    //Inv_CcoCountry = dfo.TM_COD_Client_Order.cod_inv_cco_country,
                    //Inv_CcoTel1 = dfo.TM_COD_Client_Order.cod_inv_cco_tel1,
                    //Inv_CcoFax = dfo.TM_COD_Client_Order.cod_inv_cco_fax,
                    //Inv_CcoCellphone = dfo.TM_COD_Client_Order.cod_inv_cco_cellphone,
                    //Inv_CcoEmail = dfo.TM_COD_Client_Order.cod_inv_cco_email,
                    //Dlv_CcoFirstname = dfo.TM_COD_Client_Order.cod_dlv_cco_firstname,
                    //Dlv_CcoLastname = dfo.TM_COD_Client_Order.cod_dlv_cco_lastname,
                    //Dlv_CcoAddress1 = dfo.TM_COD_Client_Order.cod_dlv_cco_address1,
                    //Dlv_CcoAddress2 = dfo.TM_COD_Client_Order.cod_dlv_cco_address2,
                    //Dlv_CcoPostcode = dfo.TM_COD_Client_Order.cod_dlv_cco_postcode,
                    //Dlv_CcoCity = dfo.TM_COD_Client_Order.cod_dlv_cco_city,
                    //Dlv_CcoCountry = dfo.TM_COD_Client_Order.cod_dlv_cco_country,
                    //Dlv_CcoTel1 = dfo.TM_COD_Client_Order.cod_dlv_cco_tel1,
                    //Dlv_CcoFax = dfo.TM_COD_Client_Order.cod_dlv_cco_fax,
                    //Dlv_CcoCellphone = dfo.TM_COD_Client_Order.cod_dlv_cco_cellphone,
                    //Dlv_CcoEmail = dfo.TM_COD_Client_Order.cod_dlv_cco_email,
                    UsrCom1 = dfo.TM_COD_Client_Order.usr_com_1,
                    UsrCom2 = dfo.TM_COD_Client_Order.usr_com_2,
                    UsrCom3 = dfo.TM_COD_Client_Order.usr_com_3,
                    CinKeyProject = dfo.TM_COD_Client_Order.cod_key_project ?? false
                };
                cinId = ClientInvoiceRepository.CreateUpdateClientInvoice(oneCin);
                var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId).ToList();
                DeliveryFormLineRepository.InsertCiiByDfl(cinId, dfls);
            }
            return cinId;
        }

        #endregion 不再使用区域

        public void DeliveryDfoWithStockage(int dfoId, int socId, int usrId, List<DeliveryFormLine> lines)
        {
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId);
            if (dfo != null)
            {
                WarehouseRepository WarehouseRepository = new WarehouseRepository();
                var dfls = _db.TM_DFL_DevlieryForm_Line.Where(m => m.dfo_id == dfoId).Select(DeliveryFormLineTranslator.RepositoryToEntity()).ToList();
                lines = lines.Where(m => m.WhsId != 0 && m.SheId != 0 && m.DflQuantity != 0).Distinct().ToList();
                var lines4Stockage = new List<DeliveryFormLine>();

                foreach (var onedfl in lines)
                {
                    var dflLine = dfls.FirstOrDefault(m => m.DflId == onedfl.DflId);
                    if (dflLine != null)
                    {
                        var oneline = ObjectCopier.DeepCopy(dflLine);
                        oneline.WhsId = onedfl.WhsId;
                        onedfl.SheId = onedfl.SheId;
                        onedfl.DflQuantity = onedfl.DflQuantity;
                        onedfl.DflDescription = onedfl.DflDescription;
                        onedfl.InvId = onedfl.InvId;
                        lines4Stockage.Add(onedfl);
                    }
                }
                WarehouseRepository.CreateSrvFromDeliveryForm(socId, dfoId, usrId, DateTime.Now, lines4Stockage);
                WarehouseRepository.DeletePreInventoryFromDfo(socId, dfoId);

                dfo.dfo_deliveried = true;
                _db.TM_DFO_Delivery_Form.ApplyCurrentValues(dfo);
                _db.SaveChanges();
            }
        }

        public bool CheckCodIsAllDeliveried(int dfoId, int socId)
        {
            bool alldeliveried = true;
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.soc_id == socId && m.dfo_id == dfoId);
            if (dfo != null)
            {
                var alldfl = _db.TM_DFL_DevlieryForm_Line.Where(m => m.TM_DFO_Delivery_Form.cod_id == dfo.cod_id).ToList();
                var allcols = _db.TM_COL_ClientOrder_Lines.Where(m => m.cod_id == dfo.cod_id).ToList();
                if (!allcols.Any())
                {
                    alldeliveried = false;
                }
                foreach (var onecol in allcols)
                {
                    var colqty = onecol.col_quantity;
                    var dflqty = alldfl.Where(m => m.col_id == onecol.col_id).ToList().Sum(m => m.dfl_quantity);
                    if (dflqty < colqty)
                    {
                        alldeliveried = false;
                    }
                }
            }
            else
            {
                alldeliveried = false;
            }
            return alldeliveried;
        }

        #region widget

        /// <summary>
        /// get delivery form no deliveried yet
        /// </summary>
        /// <param name="socId"></param>
        /// <returns></returns>
        public List<DeliveryForm> GetDeliveryNoDeliveried(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var dfos = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == socId && !m.dfo_deliveried
                //&& (isAdmin || m.usr_creator_id == usrId)
                ).FilterDfoUser(isAdmin, isStoreKeeper, usrId, subUser).AsQueryable().Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
            dfos.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
            });
            return dfos;
        }

        /// <summary>
        /// get delivery form without invoice
        /// </summary>
        /// <param name="socId"></param>
        /// <returns></returns>
        public List<DeliveryForm> GetDeliveryNoInvoice(int socId, int usrId)
        {
            bool isAdmin = UserRepository.IsAdmin(socId, usrId);
            bool isStoreKeeper = UserRepository.IsStoreKeeper(socId, usrId);
            var subUser = UserRepository.GetUserSubUsersIds(socId, usrId);
            var dfos = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == socId && !m.TM_CIN_Client_Invoice.Any()
                //&& (isAdmin || m.usr_creator_id == usrId)
                ).FilterDfoUser(isAdmin, isStoreKeeper, usrId, subUser).AsQueryable().Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
            dfos.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
            });
            return dfos;
        }

        #endregion widget

        public List<DeliveryForm> GetDeliveryByCodId(int socId, int codId)
        {
            var dfos = _db.TM_DFO_Delivery_Form.Where(m => m.soc_id == socId && m.cod_id == codId).Distinct().Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
            dfos.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId");
                m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                m.CodFId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
            });
            return dfos;
        }

        /// <summary>
        /// 获取那些同一个Cod下面可以用于建立cin的所有dfo
        /// </summary>
        /// <param name="dfoId"></param>
        /// <param name="socId"></param>
        /// <returns></returns>
        public List<DeliveryForm> GetDeliveryFormsForCin(int dfoId, int socId)
        {
            var result = new List<DeliveryForm>();
            var dfo = _db.TM_DFO_Delivery_Form.FirstOrDefault(m => m.dfo_id == dfoId && m.soc_id == socId);
            if (dfo != null)
            {
                var dfoswithsamecod = _db.TM_DFO_Delivery_Form.Where(m => m.cod_id == dfo.cod_id).ToList();
                var dfoswithcin = (from adfo in _db.TM_DFO_Delivery_Form
                                   join dci in _db.TR_DCI_DeliveryForm_ClientInvoice on adfo.dfo_id equals dci.dfo_id
                                   where adfo.cod_id == dfo.cod_id
                                   select adfo).ToList();
                var dfoswithoutcin =
                    dfoswithsamecod.Except(dfoswithcin)
                        .Where(m => m.TM_DFL_DevlieryForm_Line.Sum(l => l.dfl_quantity) > 0)
                        .AsQueryable().Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
                if (dfoswithoutcin.Any())
                {
                    DeliveryFormLineRepository DeliveryFormLineRepository = new DeliveryFormLineRepository();
                    dfoswithoutcin.ForEach(m =>
                    {
                        m.FId = StringCipher.EncoderSimple(m.DfoId.ToString(), "dfoId");
                        m.CodFId = StringCipher.EncoderSimple(m.CodId.ToString(), "codId");
                        m.CliFId = StringCipher.EncoderSimple(m.CliId.ToString(), "cliId");
                        m.PrjFId = StringCipher.EncoderSimple(m.PrjId.ToString(), "prjId");
                        m.CinFId = StringCipher.EncoderSimple(m.CinId.ToString(), "cinId");
                        m.DeliveryFormLines = DeliveryFormLineRepository.GetDflsByDfoId(socId, m.DfoId).ToList();
                    });
                    result = dfoswithoutcin;
                }
            }
            return result;
        }

        /// <summary>
        /// 20210904-用于CIN页面查找DFO
        /// </summary>
        /// <param name="keyword"></param>
        /// <param name="cinId"></param>
        /// <param name="socId"></param>
        /// <returns></returns>
        public List<DeliveryForm> GetDeliverFormsByKeywords(string keyword, int cinId, int socId)
        {
            var dfos = (from dfo in _db.TM_DFO_Delivery_Form
                            //join dci in _db.TR_DCI_DeliveryForm_ClientInvoice on dfo.dfo_id equals dci.dfo_id
                        join cin in _db.TM_CIN_Client_Invoice on dfo.cod_id equals cin.cod_id
                        where dfo.soc_id == socId && (cin.cin_id == cinId)
                              && dfo.dfo_code.Contains(keyword)
                        select dfo).Select(DeliveryFormTranslator.RepositoryToEntity()).ToList();
            return dfos;
        }


        #region 20231017 Suivi Admin

        private List<TM_PIT_Product_Instance> GetCeePrd()
        {
            return _db.TM_PIT_Product_Instance.Where(l => l.TM_PRD_Product.prd_name.Contains("CEE")).ToList();
        }

        public void GenerateClientOrderAndDfo(List<SuiviAdmin> data, User currentUser)
        {
            var produitsList = GetCeePrd();
            //var listCod = new List<Entities.ClientOrder>();
            var clients = _db.TM_CLI_CLient.ToList();//.Where(l => l.cli_company_name == "Polaris Conseil Energie" || l.cli_company_name == "EcoGreen").ToList();

            var vatId = _db.TR_VAT_Vat.FirstOrDefault(l => l.vat_vat_rate == 20).vat_id;
            foreach (var suiviAdmin in data)
            {
                var oneclient = clients.FirstOrDefault(l => l.cli_company_name.Equals(suiviAdmin.Client, StringComparison.OrdinalIgnoreCase));
                var cod = new Entities.ClientOrder
                {
                    CliId = oneclient.cli_id,
                    CplId = 0,
                    CodName = suiviAdmin.CommandeName,
                    VatId = vatId,
                    CodDateCreation = DateTime.Now,
                    CodDateUpdate = DateTime.Now,
                    UsrCom1 = currentUser.Id,
                    SocId = currentUser.Soc_id,
                    PcoId = 1,
                    PmoId = 1,
                    CodInterComment = string.Format("{6}\r\n{0}\r\n{1}\r\n{2} {3}\r\n{4}\r\n{5}", suiviAdmin.Contact, suiviAdmin.Adresse, suiviAdmin.Postcode, suiviAdmin.Ville, suiviAdmin.Portable, suiviAdmin.Email, suiviAdmin.CommandeName),
                    UsrCreatorId = currentUser.Id,
                };
                var codId = ClientOrderRepository.CreateUpdateClientOrder(cod);
                #region client order line
                var listcols = new List<ClientOrderLine>();
                var level = 1;
                if (suiviAdmin.Projecteur_30W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "CEE J-FL009-30W" || l.pit_ref == "PRO30WCE0W" || l.pit_ref == "PRO30WCEE-30PRO30WCE30W" || l.pit_ref.Contains("PRO30W"));
                    var prdqty = suiviAdmin.Projecteur_30W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.Projecteur_50W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "CEE J-FL009-50W" || l.pit_ref == "PRO50WCE0W" || l.pit_ref == "PRO50WCEE-30PRO50WCE50W" || l.pit_ref.Contains("PRO50W"));
                    var prdqty = suiviAdmin.Projecteur_50W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.Projecteur_100W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "CEE J-FL009-100W" || l.pit_ref == "PRO100WCE0W" || l.pit_ref == "PRO100WCEE-30" || l.pit_ref.Contains("PRO100W"));
                    var prdqty = suiviAdmin.Projecteur_100W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.Projecteur_150W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "CEE J-FL009-150W" || l.pit_ref == "PRO150WCE0W" || l.pit_ref == "PRO150WCEE-30PRO150WCE150W" || l.pit_ref.Contains("PRO150W"));
                    var prdqty = suiviAdmin.Projecteur_150W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }


                if (suiviAdmin.Parc_Etanche_1m20 > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "PARK40W-3EE" || l.pit_ref.Contains("PARK40W"));
                    var prdqty = suiviAdmin.Parc_Etanche_1m20;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.Hublot_18W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "CEE CL-300AD" || l.pit_ref == "HUB18WCEAD" || l.pit_ref.Contains("HUB18W"));
                    var prdqty = suiviAdmin.Hublot_18W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.Candelabres_50W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "STLO-50W-CEE" || l.pit_ref.Contains("STLO-50W"));
                    var prdqty = suiviAdmin.Candelabres_50W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }
                if (suiviAdmin.Candelabres_100W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "STLO-100W-CEE00N20EE" || l.pit_ref.Contains("STLO-100W"));
                    var prdqty = suiviAdmin.Candelabres_100W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }


                if (suiviAdmin.Solaire_10W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "PRO10WCEESL-30" || l.pit_ref.Contains("PRO10WCEESL"));
                    var prdqty = suiviAdmin.Solaire_10W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                #endregion client order line

                foreach (var clientOrderLine in listcols)
                {
                    clientOrderLine.ColId = ClientOrderLineRepository.InsertUpdateCol(clientOrderLine);
                }

                var oneDfo = new DeliveryForm
                {
                    CodId = codId,
                    DfoDCreation = DateTime.Now,
                    DfoDeliveryComment = string.Format("{6}\r\n{0}\r\n{1}\r\n{2} {3}\r\n{4}\r\n{5}", suiviAdmin.Contact, suiviAdmin.Adresse, suiviAdmin.Postcode, suiviAdmin.Ville, suiviAdmin.Portable, suiviAdmin.Email, suiviAdmin.CommandeName),
                    UsrCreatorId = currentUser.Id,
                    CliId = cod.CliId,
                    SocId = currentUser.Soc_id,
                    DfoDeliveried = true,
                    DfoClientAdr = true,
                    DfoDDelivery = DateTime.Now,
                    Dlv_CcoAddress1 = oneclient.cli_address1,
                    Dlv_CcoAddress2 = oneclient.cli_address2,
                    Dlv_CcoPostcode = oneclient.cli_postcode,
                    Dlv_CcoCity = oneclient.cli_city,
                    Dlv_CcoCountry = oneclient.cli_country,
                    Dlv_CcoEmail = oneclient.cli_email,
                    Dlv_CcoFax = oneclient.cli_fax,
                    Dlv_CcoCellphone = oneclient.cli_cellphone,
                    Dlv_CcoTel1 = oneclient.cli_tel1,
                    DfoImportField = suiviAdmin.XmlField,
                    DfoGdocNb = suiviAdmin.LineNb
                };
                var dfoId = CreateUpdateDeliveryForm(oneDfo);

                foreach (var clientOrderLine in listcols)
                {
                    var oneDfl = new DeliveryFormLine
                    {
                        ColId = clientOrderLine.ColId,
                        DfoId = dfoId,
                        DflQuantity = clientOrderLine.ColQuantity
                    };
                    var dflId = DeliveryFormLineRepository.InsertUpdateDfl(oneDfl);
                }

            }

            //return listCod;
        }

        public int CreateCommandeLivraison(ClientOrder cod, ClientOrderLine col)
        {
            var codId = ClientOrderRepository.CreateUpdateClientOrder(cod);
            var colId = ClientOrderLineRepository.InsertUpdateCol(col);
            var dfo = new DeliveryForm();
            var dfoId = CreateUpdateDeliveryForm(dfo);
            var dfl = new DeliveryFormLine();
            var dflId = DeliveryFormLineRepository.InsertUpdateDfl(dfl);
            return dflId;
        }

        public List<KeyValue> GetDfoFromGdoclineNb(List<int> linenbr)
        {
            linenbr = linenbr.Where(l => l != 0).ToList();
            var dfos = (from line in linenbr
                        join dfo in _db.TM_DFO_Delivery_Form on line equals dfo.dfo_gdoc_nb
                        select dfo).Select(l => new KeyValue { Key = l.dfo_gdoc_nb ?? 0, Value = l.dfo_code }).ToList();
            return dfos;
        }

        #endregion 20231017 Suivi Admin

        #region Livraison CDL 20251027
        private List<TM_PIT_Product_Instance> GetHighBayPrd()
        {
            return _db.TM_PIT_Product_Instance.Where(l => l.TM_PRD_Product.prd_name.Contains("THAHIGHBAY") || l.TM_PRD_Product.prd_ref.Contains("THAHIGHBAY")).ToList();
        }
        public void GenerateClientOrderAndDfoFromLivraisonCdl(List<LivraisonCdl> data, User currentUser)
        {
            var produitsList = GetHighBayPrd();
            //var clients = _db.TM_CLI_CLient.ToList();//.Where(l => l.cli_company_name == "Polaris Conseil Energie" || l.cli_company_name == "EcoGreen").ToList();

            var companynames = data.Select(l => l.COMPANY.ToLowerInvariant()).Distinct().ToList();
            var clients = (from cop in companynames 
                           join cli in _db.TM_CLI_CLient on cop equals cli.cli_company_name.ToLower()
                           select cli
                           ).ToList();

            var vatId = _db.TR_VAT_Vat.FirstOrDefault(l => l.vat_vat_rate == 20).vat_id;
            foreach (var suiviAdmin in data)
            {
                var oneclient = clients.FirstOrDefault(l => l.cli_company_name.Equals(suiviAdmin.COMPANY, StringComparison.OrdinalIgnoreCase));

                var cod = new Entities.ClientOrder
                {
                    CliId = oneclient.cli_id,
                    CplId = 0,
                    CodName = suiviAdmin.NUMERO_DE_LIGNE.ToString(),
                    VatId = vatId,
                    CodDateCreation = DateTime.Now,
                    CodDateUpdate = DateTime.Now,
                    UsrCom1 = currentUser.Id,
                    SocId = currentUser.Soc_id,
                    PcoId = 1,
                    PmoId = 1,
                    CodInterComment = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}\r\n{4}\r\n{5}", suiviAdmin.CLIENT, suiviAdmin.ADRESSE_DE_LIVRAISON, suiviAdmin.CP_VILLE, suiviAdmin.CONTACT_SUR_PLACE, suiviAdmin.NUMERO_TEL, suiviAdmin.Adresse_MAIL),
                    UsrCreatorId = currentUser.Id,
                };
                var codId = ClientOrderRepository.CreateUpdateClientOrder(cod);
                #region client order line
                var listcols = new List<ClientOrderLine>();
                var level = 1;
                if (suiviAdmin.QUANTITE_HIGHBAY_250W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "THAHIGHBAY250R");
                    var prdqty = suiviAdmin.QUANTITE_HIGHBAY_250W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                if (suiviAdmin.QUANTITE_LINEAR_250W > 0)
                {
                    var pit = produitsList.FirstOrDefault(l => l.pit_ref == "THAHIGHBAY250L");
                    var prdqty = suiviAdmin.QUANTITE_LINEAR_250W;
                    var onecol = new ClientOrderLine
                    {
                        CodId = codId,
                        ColLevel1 = level,
                        ColDescription = pit.pit_description,
                        PrdId = pit.prd_id,
                        ColUnitPrice = pit.TM_PRD_Product.prd_price,
                        ColQuantity = prdqty,
                        ColTotalPrice = prdqty * pit.TM_PRD_Product.prd_price,
                        VatId = vatId,
                        ColPurchasePrice = pit.pit_purchase_price,
                        ColTotalCrudePrice = (prdqty ?? 0) * (pit.TM_PRD_Product.prd_price) * (decimal)1.2,
                        PrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdName = pit.TM_PRD_Product.prd_name,
                        ColPrdDes = null,
                        ColDiscountAmount = 0,
                        ColDiscountPercentage = 0,
                        ColPriceWithDiscountHt = pit.TM_PRD_Product.prd_price,
                        ColMargin = (pit.pit_price - pit.pit_purchase_price) * prdqty,
                        PitId = pit.pit_id,
                        LtpId = 2,
                    };
                    listcols.Add(onecol);
                    level++;
                }

                #endregion client order line

                foreach (var clientOrderLine in listcols)
                {
                    clientOrderLine.ColId = ClientOrderLineRepository.InsertUpdateCol(clientOrderLine);
                }

                var oneDfo = new DeliveryForm
                {
                    CodId = codId,
                    DfoDCreation = DateTime.Now,
                    DfoDeliveryComment = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}\r\n{4}\r\n{5}", suiviAdmin.CLIENT, suiviAdmin.ADRESSE_DE_LIVRAISON, suiviAdmin.CP_VILLE, suiviAdmin.CONTACT_SUR_PLACE, suiviAdmin.NUMERO_TEL, suiviAdmin.Adresse_MAIL),
                    UsrCreatorId = currentUser.Id,
                    CliId = cod.CliId,
                    SocId = currentUser.Soc_id,
                    DfoDeliveried = true,
                    DfoClientAdr = true,
                    DfoDDelivery = DateTime.Now,
                    Dlv_CcoAddress1 = oneclient.cli_address1,
                    Dlv_CcoAddress2 = oneclient.cli_address2,
                    Dlv_CcoPostcode = oneclient.cli_postcode,
                    Dlv_CcoCity = oneclient.cli_city,
                    Dlv_CcoCountry = oneclient.cli_country,
                    Dlv_CcoEmail = oneclient.cli_email,
                    Dlv_CcoFax = oneclient.cli_fax,
                    Dlv_CcoCellphone = oneclient.cli_cellphone,
                    Dlv_CcoTel1 = oneclient.cli_tel1,
                    DfoImportField = suiviAdmin.XmlField,
                    DfoGdocNb = suiviAdmin.NUMERO_DE_LIGNE
                };
                var dfoId = CreateUpdateDeliveryForm(oneDfo);

                foreach (var clientOrderLine in listcols)
                {
                    var oneDfl = new DeliveryFormLine
                    {
                        ColId = clientOrderLine.ColId,
                        DfoId = dfoId,
                        DflQuantity = clientOrderLine.ColQuantity
                    };
                    var dflId = DeliveryFormLineRepository.InsertUpdateDfl(oneDfl);
                }

            }
        }

        #endregion Livraison CDL 20251027
    }
}
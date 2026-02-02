using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class DeliveryFormTranslator
    {
        public static Expression<Func<TM_DFO_Delivery_Form, DeliveryForm>> RepositoryToEntity()
        {
            return o => new DeliveryForm
            {
                DfoId = o.dfo_id,
                DfoDCreation = o.dfo_d_creation,
                DfoDUpdate = o.dfo_d_update,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                DfoHeaderText = o.dfo_header_text,
                DfoFooterText = o.dfo_footer_text,
                //CcoIdDelivery = o.cco_id_delivery,
                DfoDeliveryComment = o.dfo_delivery_comment,
                DfoInterComment = o.dfo_inter_comment,
                UsrCreatorId = o.usr_creator_id,

                #region cco

                // delivery
                Dlv_CcoFirstname = o.dfo_dlv_cco_firstname,
                Dlv_CcoLastname = o.dfo_dlv_cco_lastname,
                Dlv_CcoAddress1 = o.dfo_dlv_cco_address1,
                Dlv_CcoAddress2 = o.dfo_dlv_cco_address2,
                Dlv_CcoPostcode = o.dfo_dlv_cco_postcode,
                Dlv_CcoCity = o.dfo_dlv_cco_city,
                Dlv_CcoCountry = o.dfo_dlv_cco_country,
                Dlv_CcoTel1 = o.dfo_dlv_cco_tel1,
                Dlv_CcoFax = o.dfo_dlv_cco_fax,
                Dlv_CcoCellphone = o.dfo_dlv_cco_cellphone,
                Dlv_CcoEmail = o.dfo_dlv_cco_email,
                //Dlv_CcoRef = o.TM_CCO_Client_Contact.cco_ref,
                //Dlv_Civility = o.TM_CCO_Client_Contact.TR_CIV_Civility != null ? o.TM_CCO_Client_Contact.TR_CIV_Civility.civ_designation : string.Empty,

                #endregion cco
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                DfoCode = o.dfo_code,
                DfoFile = o.dfo_file,
                DfoDDelivery = o.dfo_d_delivery,
                CodId = o.cod_id,
                SocId = o.soc_id,
                DfoDeliveried = o.dfo_deliveried,
                PrjId = o.TM_COD_Client_Order.prj_id,

                #region display
                PrjName = o.TM_COD_Client_Order.TM_PRJ_Project.prj_name,
                CodCode = o.TM_COD_Client_Order.cod_code,
                CodName = o.TM_COD_Client_Order.cod_name,
                #endregion display
                #region Search
                CplName = o.TM_COD_Client_Order.cpl_id.HasValue ? o.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_name : string.Empty,
                #endregion Search
                HasClientInvoice = o.TR_DCI_DeliveryForm_ClientInvoice.Any(),
                //CinId = o.TM_CIN_Client_Invoice.Any() ? o.TM_CIN_Client_Invoice.FirstOrDefault().cin_id : 0,
                //CinCode = o.TM_CIN_Client_Invoice.Any() ? o.TM_CIN_Client_Invoice.FirstOrDefault().cin_code : string.Empty,
                //CinName = o.TM_CIN_Client_Invoice.Any() ? o.TM_CIN_Client_Invoice.FirstOrDefault().cin_name : string.Empty,
                CinId = o.TR_DCI_DeliveryForm_ClientInvoice.Any() ? o.TR_DCI_DeliveryForm_ClientInvoice.FirstOrDefault().TM_CIN_Client_Invoice.cin_id : 0,
                CinCode = o.TR_DCI_DeliveryForm_ClientInvoice.Any() ? o.TR_DCI_DeliveryForm_ClientInvoice.FirstOrDefault().TM_CIN_Client_Invoice.cin_code : string.Empty,
                CinName = o.TR_DCI_DeliveryForm_ClientInvoice.Any() ? o.TR_DCI_DeliveryForm_ClientInvoice.FirstOrDefault().TM_CIN_Client_Invoice.cin_name : string.Empty,
                // 2018-04-05 确认一个client order 只有一个 invoice
                CodInvoiced = o.TM_COD_Client_Order.TM_CIN_Client_Invoice.Any(),
                DfoClientAdr = o.dfo_client_adr,
                #region Client
                OneClient = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    Tel1 = o.TM_CLI_CLient.cli_tel1,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    Email = o.TM_CLI_CLient.cli_email,
                    Cellphone = o.TM_CLI_CLient.cli_cellphone,
                    Fax = o.TM_CLI_CLient.cli_fax,
                    CliPdfVersion = o.TM_CLI_CLient.cli_pdf_version
                },
                #endregion Client
                HasDfl = o.TM_DFL_DevlieryForm_Line.Any() && o.TM_DFL_DevlieryForm_Line.Sum(l => l.dfl_quantity) > 0,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                DfoImportField = o.dfo_import_field,
                DfoGdocNb = o.dfo_gdoc_nb
            };
        }

        public static TM_DFO_Delivery_Form EntityToRepository(DeliveryForm _from, TM_DFO_Delivery_Form _to, bool create = false)
        {
            _to.dfo_d_update = DateTime.Now;
            _to.dfo_d_delivery = _from.DfoDDelivery;
            _to.dfo_header_text = _from.DfoHeaderText;
            _to.dfo_footer_text = _from.DfoFooterText;
            //_to.cco_id_delivery = _from.CcoIdDelivery;
            _to.dfo_delivery_comment = _from.DfoDeliveryComment;
            _to.dfo_inter_comment = _from.DfoInterComment;
            //_to.dfo_file = _from.DfoFile;
            _to.dfo_dlv_cco_firstname = _from.Dlv_CcoFirstname;
            _to.dfo_dlv_cco_lastname = _from.Dlv_CcoLastname;
            _to.dfo_dlv_cco_address1 = _from.Dlv_CcoAddress1;
            _to.dfo_dlv_cco_address2 = _from.Dlv_CcoAddress2;
            _to.dfo_dlv_cco_postcode = _from.Dlv_CcoPostcode;
            _to.dfo_dlv_cco_city = _from.Dlv_CcoCity;
            _to.dfo_dlv_cco_country = _from.Dlv_CcoCountry;
            _to.dfo_dlv_cco_tel1 = _from.Dlv_CcoTel1;
            _to.dfo_dlv_cco_fax = _from.Dlv_CcoFax;
            _to.dfo_dlv_cco_cellphone = _from.Dlv_CcoCellphone;
            _to.dfo_dlv_cco_email = _from.Dlv_CcoEmail;
            _to.dfo_deliveried = _from.DfoDeliveried;
            _to.dfo_client_adr = _from.DfoClientAdr;
            if (!string.IsNullOrEmpty(_from.DfoImportField))
            {
                _to.dfo_import_field = _from.DfoImportField;
                _to.dfo_gdoc_nb = _from.DfoGdocNb;
            }
            if (create)
            {
                _to.cli_id = _from.CliId;
                _to.dfo_code = _from.DfoCode;
                _to.cod_id = _from.CodId;
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.dfo_d_creation = _from.DfoDCreation;
                _to.soc_id = _from.SocId;
            }
            return _to;
        }
    }
}

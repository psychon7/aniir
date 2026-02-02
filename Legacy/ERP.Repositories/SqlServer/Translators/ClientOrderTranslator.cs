using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ClientOrderTranslator
    {
        public static Expression<Func<TM_COD_Client_Order, ClientOrder>> RepositoryToEntity()
        {
            return o => new ClientOrder
            {
                CodId = o.cod_id,
                CplId = o.cpl_id ?? 0,
                SocId = o.soc_id,
                PrjId = o.prj_id,
                VatId = o.vat_id,
                CplCode = o.cpl_id.HasValue ? o.TM_CPL_Cost_Plan.cpl_code : string.Empty,
                CplName = o.cpl_id.HasValue ? o.TM_CPL_Cost_Plan.cpl_name : string.Empty,
                PrjName = o.TM_PRJ_Project.prj_name,
                PrjCode = o.TM_PRJ_Project.prj_code,
                CodDateCreation = o.cod_d_creation,
                CodDateUpdate = o.cod_d_update,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
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
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CodDatePreDeliveryForm = o.cod_d_pre_delivery_from,
                CodDatePreDeliveryTo = o.cod_d_pre_delivery_to,
                CodDateEndWork = o.cod_d_end_work,
                CodHeaderText = o.cod_header_text,
                CodFooterText = o.cod_footer_text,
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                CodClientComment = o.cod_client_comment,
                CodInterComment = o.cod_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CodName = o.cod_name,
                #region cco
                // invoicing
                //Inv_CcoFirstname = o.cod_inv_cco_firstname,
                //Inv_CcoLastname = o.cod_inv_cco_lastname,
                //Inv_CcoAddress1 = o.cod_inv_cco_address1,
                //Inv_CcoAddress2 = o.cod_inv_cco_address2,
                //Inv_CcoPostcode = o.cod_inv_cco_postcode,
                //Inv_CcoCity = o.cod_inv_cco_city,
                //Inv_CcoCountry = o.cod_inv_cco_country,
                //Inv_CcoTel1 = o.cod_inv_cco_tel1,
                //Inv_CcoFax = o.cod_inv_cco_fax,
                //Inv_CcoCellphone = o.cod_inv_cco_cellphone,
                //Inv_CcoEmail = o.cod_inv_cco_email,
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                // delivery
                //Dlv_CcoFirstname = o.cod_dlv_cco_firstname,
                //Dlv_CcoLastname = o.cod_dlv_cco_lastname,
                //Dlv_CcoAddress1 = o.cod_dlv_cco_address1,
                //Dlv_CcoAddress2 = o.cod_dlv_cco_address2,
                //Dlv_CcoPostcode = o.cod_dlv_cco_postcode,
                //Dlv_CcoCity = o.cod_dlv_cco_city,
                //Dlv_CcoCountry = o.cod_dlv_cco_country,
                //Dlv_CcoTel1 = o.cod_dlv_cco_tel1,
                //Dlv_CcoFax = o.cod_dlv_cco_fax,
                //Dlv_CcoCellphone = o.cod_dlv_cco_cellphone,
                //Dlv_CcoEmail = o.cod_dlv_cco_email,
                //Dlv_CcoRef = o.TM_CCO_Client_Contact.cco_ref,
                #endregion cco
                Creator = new User
                {
                    Firstname = o.TM_USR_User3.usr_firstname,
                    Lastname = o.TM_USR_User3.usr_lastname
                },
                CodDiscountAmount = o.cod_discount_amount,
                CodDiscountPercentage = o.cod_discount_percentage,
                CodCode = o.cod_code,
                CodFile = o.cod_file,

                UsrCom1 = o.usr_com_1,
                UsrCom2 = o.usr_com_2,
                UsrCom3 = o.usr_com_3,
                UsrCommercial1 = o.usr_com_1.HasValue ? (o.TM_USR_User.usr_firstname + " " + o.TM_USR_User.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_com_2.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_com_3.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                DflCount = o.TM_DFO_Delivery_Form.Any() ? o.TM_DFO_Delivery_Form.Count : 0,
                CinCount = o.TM_CIN_Client_Invoice.Any() ? o.TM_CIN_Client_Invoice.Count : 0,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CurrencySymbol = o.TM_CLI_CLient.TR_CUR_Currency.cur_symbol,
                CodKeyProject = o.cod_key_project ?? false,
            };
        }

        public static Expression<Func<TM_COD_Client_Order, ClientOrder>> RepositoryToEntity4Search()
        {
            return o => new ClientOrder
            {
                CodId = o.cod_id,
                CplId = o.cpl_id ?? 0,
                SocId = o.soc_id,
                PrjId = o.prj_id,
                VatId = o.vat_id,
                CplCode = o.cpl_id.HasValue ? o.TM_CPL_Cost_Plan.cpl_code : string.Empty,
                CplName = o.cpl_id.HasValue ? o.TM_CPL_Cost_Plan.cpl_name : string.Empty,
                PrjName = o.TM_PRJ_Project.prj_name,
                PrjCode = o.TM_PRJ_Project.prj_code,
                CodDateCreation = o.cod_d_creation,
                CodDateUpdate = o.cod_d_update,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
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
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CodDatePreDeliveryForm = o.cod_d_pre_delivery_from,
                CodDatePreDeliveryTo = o.cod_d_pre_delivery_to,
                CodDateEndWork = o.cod_d_end_work,
                CodHeaderText = o.cod_header_text,
                CodFooterText = o.cod_footer_text,
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                CodClientComment = o.cod_client_comment,
                CodInterComment = o.cod_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CodName = o.cod_name,
                #region cco
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                #endregion cco
                Creator = new User
                {
                    Firstname = o.TM_USR_User3.usr_firstname,
                    Lastname = o.TM_USR_User3.usr_lastname
                },
                CodDiscountAmount = o.cod_discount_amount,
                CodDiscountPercentage = o.cod_discount_percentage,
                CodCode = o.cod_code,
                CodFile = o.cod_file,

                UsrCom1 = o.usr_com_1,
                UsrCom2 = o.usr_com_2,
                UsrCom3 = o.usr_com_3,
                UsrCommercial1 = o.usr_com_1.HasValue ? (o.TM_USR_User.usr_firstname + " " + o.TM_USR_User.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_com_2.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_com_3.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                DflCount = o.TM_DFO_Delivery_Form.Any() ? o.TM_DFO_Delivery_Form.Count : 0,
                CinCount = o.TM_CIN_Client_Invoice.Any() ? o.TM_CIN_Client_Invoice.Count : 0,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CurrencySymbol = o.TM_CLI_CLient.TR_CUR_Currency.cur_symbol,
                CodKeyProject = o.cod_key_project ?? false,
                ClientOrderLines = o.TM_COL_ClientOrder_Lines.Select(l => new ClientOrderLine
                {
                    ColId = l.col_id,
                    CodId = l.cod_id,
                    ColLevel1 = l.col_level1,
                    ColLevel2 = l.col_level2,
                    ColDescription = l.col_description ?? string.Empty,
                    PrdId = l.prd_id,
                    PrdName = l.prd_id.HasValue ? l.TM_PRD_Product.prd_ref : string.Empty,
                    PitId = l.pit_id,
                    PitName = l.pit_id.HasValue ? l.TM_PIT_Product_Instance.pit_ref : string.Empty,
                    ColPurchasePrice = l.col_purchase_price,
                    ColUnitPrice = l.col_unit_price,
                    ColQuantity = l.col_quantity,
                    ColTotalPrice = l.col_total_price,
                    ColTotalCrudePrice = l.col_total_crude_price,
                    VatId = l.vat_id,
                    LtpId = l.ltp_id,
                    LineType = l.TR_LTP_Line_Type.ltp_name,
                    ColPrdName = l.prd_id.HasValue ? l.TM_PRD_Product.prd_ref : l.col_prd_name,
                    PrdImgPath = l.prd_id.HasValue && l.TM_PRD_Product.TI_PIM_Product_Image.Any()
                                ? (l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                                    ? l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                                    : l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                                : string.Empty,
                    VatLabel = l.TR_VAT_Vat.vat_designation,
                    VatRate = l.TR_VAT_Vat.vat_vat_rate,
                    ColDiscountAmount = l.col_discount_amount,
                    ColDiscountPercentage = l.col_discount_percentage,
                    ColPriceWithDiscountHt = l.col_price_with_discount_ht,
                    ColMargin = l.col_margin,
                    ColPrdDes = l.col_prd_des,
                    PtyId = l.prd_id.HasValue ? l.TM_PRD_Product.pty_id : 0
                }).OrderBy(l => l.ColLevel1).ThenBy(l => l.ColLevel2).ToList()
            };
        }


        public static TM_COD_Client_Order EntityToRepository(ClientOrder _from, TM_COD_Client_Order _to, bool create = false)
        {
            _to.vat_id = _from.VatId;
            _to.cod_d_update = DateTime.Now;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.cod_d_pre_delivery_from = _from.CodDatePreDeliveryForm;
            _to.cod_d_pre_delivery_to = _from.CodDatePreDeliveryTo;
            _to.cod_d_end_work = _from.CodDateEndWork;
            _to.cod_header_text = _from.CodHeaderText;
            _to.cod_footer_text = _from.CodFooterText;
            //_to.cco_id_delivery = _from.CcoIdDelivery;
            _to.cco_id_invoicing = _from.CcoIdInvoicing == 0 ? (int?)null : _from.CcoIdInvoicing;
            _to.cod_client_comment = _from.CodClientComment;
            _to.cod_inter_comment = _from.CodInterComment;
            _to.cod_name = _from.CodName;
            //_to.cod_file = _from.CodFile;
            //_to.cod_inv_cco_firstname = _from.Inv_CcoFirstname;
            //_to.cod_inv_cco_lastname = _from.Inv_CcoLastname;
            //_to.cod_inv_cco_address1 = _from.Inv_CcoAddress1;
            //_to.cod_inv_cco_address2 = _from.Inv_CcoAddress2;
            //_to.cod_inv_cco_postcode = _from.Inv_CcoPostcode;
            //_to.cod_inv_cco_city = _from.Inv_CcoCity;
            //_to.cod_inv_cco_country = _from.Inv_CcoCountry;
            //_to.cod_inv_cco_tel1 = _from.Inv_CcoTel1;
            //_to.cod_inv_cco_fax = _from.Inv_CcoFax;
            //_to.cod_inv_cco_cellphone = _from.Inv_CcoCellphone;
            //_to.cod_inv_cco_email = _from.Inv_CcoEmail;
            //_to.cod_dlv_cco_firstname = _from.Dlv_CcoFirstname;
            //_to.cod_dlv_cco_lastname = _from.Dlv_CcoLastname;
            //_to.cod_dlv_cco_address1 = _from.Dlv_CcoAddress1;
            //_to.cod_dlv_cco_address2 = _from.Dlv_CcoAddress2;
            //_to.cod_dlv_cco_postcode = _from.Dlv_CcoPostcode;
            //_to.cod_dlv_cco_city = _from.Dlv_CcoCity;
            //_to.cod_dlv_cco_country = _from.Dlv_CcoCountry;
            //_to.cod_dlv_cco_tel1 = _from.Dlv_CcoTel1;
            //_to.cod_dlv_cco_fax = _from.Dlv_CcoFax;
            //_to.cod_dlv_cco_cellphone = _from.Dlv_CcoCellphone;
            //_to.cod_dlv_cco_email = _from.Dlv_CcoEmail;
            if (create)
            {
                _to.cli_id = _from.CliId;
                _to.prj_id = _from.PrjId;
                _to.cpl_id = _from.CplId == 0 ? (int?)null : _from.CplId;
                _to.cod_code = _from.CodCode;
                _to.soc_id = _from.SocId;
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.cod_d_creation = _from.CodDateCreation;
            }
            _to.cod_discount_amount = (_from.CodDiscountAmount ?? 0) == 0 ? null : _from.CodDiscountAmount;
            _to.cod_discount_percentage = (_from.CodDiscountPercentage ?? 0) == 0 ? null : _from.CodDiscountPercentage;


            // 2018-01-18
            _to.usr_com_1 = _from.UsrCom1 == 0 ? null : _from.UsrCom1;
            _to.usr_com_2 = _from.UsrCom2 == 0 ? null : _from.UsrCom2;
            _to.usr_com_3 = _from.UsrCom3 == 0 ? null : _from.UsrCom3;
            _to.cod_key_project = _from.CodKeyProject;
            return _to;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ClientInvoiceTranslator
    {
        public static Expression<Func<TM_CIN_Client_Invoice, ClientInvoice>> RepositoryToEntity()
        {
            return o => new ClientInvoice
            {
                CinId = o.cin_id,
                CodId = o.cod_id ?? 0,
                SocId = o.soc_id,
                PrjId = o.prj_id ?? 0,
                VatId = o.vat_id,
                CinCode = o.cin_code,
                CinName = o.cin_name,
                PrjName = o.prj_id.HasValue ? o.TM_PRJ_Project.prj_name : string.Empty,
                PrjCode = o.prj_id.HasValue ? o.TM_PRJ_Project.prj_code : string.Empty,
                CinDCreation = o.cin_d_creation,
                CinDUpdate = o.cin_d_update,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CinDTerm = o.cin_d_term,
                CinDInvoice = o.cin_d_invoice,
                CinHeaderText = o.cin_header_text,
                CinFooterText = o.cin_footer_text,
                CinClientComment = o.cin_client_comment,
                CinInterComment = o.cin_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CplId = o.cod_id.HasValue ? o.TM_COD_Client_Order.cpl_id : 0,
                #region cco
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                // invoicing
                Inv_CcoFirstname = o.cin_inv_cco_firstname,
                Inv_CcoLastname = o.cin_inv_cco_lastname,
                Inv_CcoAddress1 = !string.IsNullOrEmpty(o.cin_inv_cco_address1) ? o.cin_inv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                Inv_CcoAddress2 = o.cin_inv_cco_address2, //!string.IsNullOrEmpty(o.cin_inv_cco_address2) ? o.cin_inv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                Inv_CcoPostcode = !string.IsNullOrEmpty(o.cin_inv_cco_postcode) ? o.cin_inv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                Inv_CcoCity = !string.IsNullOrEmpty(o.cin_inv_cco_city) ? o.cin_inv_cco_city : o.TM_CLI_CLient.cli_city,
                Inv_CcoCountry = !string.IsNullOrEmpty(o.cin_inv_cco_country) ? o.cin_inv_cco_country : o.TM_CLI_CLient.cli_country,
                Inv_CcoTel1 = !string.IsNullOrEmpty(o.cin_inv_cco_tel1) ? o.cin_inv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                Inv_CcoFax = !string.IsNullOrEmpty(o.cin_inv_cco_fax) ? o.cin_inv_cco_fax : o.TM_CLI_CLient.cli_fax,
                Inv_CcoCellphone = o.cin_inv_cco_cellphone,
                Inv_CcoEmail = o.cin_inv_cco_email,
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                // delivery 2018-12-26 remove delivery information for cin
                //Dlv_CcoFirstname = o.cin_dlv_cco_firstname,
                //Dlv_CcoLastname = o.cin_dlv_cco_lastname,
                //// 2018-07-20 remove set address by default value
                //Dlv_CcoAddress1 = o.cin_dlv_cco_address1,
                //Dlv_CcoAddress2 = o.cin_dlv_cco_address2,
                //Dlv_CcoPostcode = o.cin_dlv_cco_postcode,
                //Dlv_CcoCity = o.cin_dlv_cco_city,
                //Dlv_CcoCountry = o.cin_dlv_cco_country,
                //Dlv_CcoTel1 = o.cin_dlv_cco_tel1,
                //Dlv_CcoFax = o.cin_dlv_cco_fax,
                //Dlv_CcoCellphone = o.cin_dlv_cco_cellphone,
                //Dlv_CcoEmail = o.cin_dlv_cco_email,
                //Dlv_CcoRef = o.TM_CCO_Client_Contact.cco_ref,
                #endregion cco
                Creator = new User
                {
                    Firstname = o.TM_USR_User3.usr_firstname,
                    Lastname = o.TM_USR_User3.usr_lastname
                },
                CinDiscountAmount = o.cin_discount_amount,
                CinDiscountPercentage = o.cin_discount_percentage,
                CodCode = o.cod_id.HasValue ? o.TM_COD_Client_Order.cod_code : string.Empty,
                CinFile = o.cin_file,
                CinAccount = o.cin_account,
                CinIsInvoice = o.cin_isinvoice,
                CplName = o.cod_id.HasValue && o.TM_COD_Client_Order.cpl_id.HasValue ? o.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_name : string.Empty,
                CodName = o.cod_id.HasValue ? o.TM_COD_Client_Order.cod_name : string.Empty,
                CurId = o.cur_id,
                CplCode = o.cod_id.HasValue && o.TM_COD_Client_Order.cpl_id.HasValue ? o.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_code : string.Empty,
                DfoId = o.dfo_id,
                DfoCode = o.dfo_id.HasValue ? o.TM_DFO_Delivery_Form.dfo_code : string.Empty,
                CinDEncaissement = o.cin_d_encaissement,
                #region invoice for Avoir
                CinAvId = o.cin_avoir_id,
                CinAvCode = o.cin_avoir_id.HasValue ? o.TM_CIN_Client_Invoice2.cin_code : string.Empty,
                #endregion invoice for Avoir
                // for pdf
                ClientForPdf = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    VatIntra = o.TM_CLI_CLient.cli_vat_intra,
                    CliPdfVersion = o.TM_CLI_CLient.cli_pdf_version,
                    Email = o.TM_CLI_CLient.cli_email
                },
                CinIsFullPaid = o.cin_is_full_paid,
                CinIsInvoiced = o.cin_invoiced,

                UsrCom1 = o.usr_com_1,
                UsrCom2 = o.usr_com_2,
                UsrCom3 = o.usr_com_3,
                UsrCommercial1 = o.usr_com_1.HasValue ? (o.TM_USR_User.usr_firstname + " " + o.TM_USR_User.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_com_2.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_com_3.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                CurrencySymbol = o.TR_CUR_Currency.cur_symbol,
                SodId = o.sod_id,
                CinBank = o.cin_bank,
                CinRest2Pay = o.cin_rest_to_pay ?? 0,
                TteId = o.tte_id ?? 0,
                TradeTerms = o.tte_id.HasValue ? o.TR_TTE_TRADE_TERMS.tte_name : string.Empty,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CinKeyProject = o.cin_key_project ?? false,
                DelegatorId = o.cin_delegator_id,
                //Delegataire = new KeyValue()
                //{
                //    Key = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_id : 0,
                //    Value = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_company_name : "",
                //    Value2 = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_abbreviation : "",
                //    Value3 = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_email : "",
                //},
            };
        }

        public static Expression<Func<TM_CIN_Client_Invoice, ClientInvoice>> RepositoryToEntity4Search()
        {
            return o => new ClientInvoice
            {
                CinId = o.cin_id,
                CodId = o.cod_id ?? 0,
                SocId = o.soc_id,
                PrjId = o.prj_id ?? 0,
                VatId = o.vat_id,
                CinCode = o.cin_code,
                CinName = o.cin_name,
                PrjName = o.prj_id.HasValue ? o.TM_PRJ_Project.prj_name : string.Empty,
                PrjCode = o.prj_id.HasValue ? o.TM_PRJ_Project.prj_code : string.Empty,
                CinDCreation = o.cin_d_creation,
                CinDUpdate = o.cin_d_update,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CinDTerm = o.cin_d_term,
                CinDInvoice = o.cin_d_invoice,
                CinHeaderText = o.cin_header_text,
                CinFooterText = o.cin_footer_text,
                CinClientComment = o.cin_client_comment,
                CinInterComment = o.cin_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CplId = o.cod_id.HasValue ? o.TM_COD_Client_Order.cpl_id : 0,
                #region cco
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                // invoicing
                Inv_CcoFirstname = o.cin_inv_cco_firstname,
                Inv_CcoLastname = o.cin_inv_cco_lastname,
                Inv_CcoAddress1 = !string.IsNullOrEmpty(o.cin_inv_cco_address1) ? o.cin_inv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                Inv_CcoAddress2 = o.cin_inv_cco_address2, //!string.IsNullOrEmpty(o.cin_inv_cco_address2) ? o.cin_inv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                Inv_CcoPostcode = !string.IsNullOrEmpty(o.cin_inv_cco_postcode) ? o.cin_inv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                Inv_CcoCity = !string.IsNullOrEmpty(o.cin_inv_cco_city) ? o.cin_inv_cco_city : o.TM_CLI_CLient.cli_city,
                Inv_CcoCountry = !string.IsNullOrEmpty(o.cin_inv_cco_country) ? o.cin_inv_cco_country : o.TM_CLI_CLient.cli_country,
                Inv_CcoTel1 = !string.IsNullOrEmpty(o.cin_inv_cco_tel1) ? o.cin_inv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                Inv_CcoFax = !string.IsNullOrEmpty(o.cin_inv_cco_fax) ? o.cin_inv_cco_fax : o.TM_CLI_CLient.cli_fax,
                Inv_CcoCellphone = o.cin_inv_cco_cellphone,
                Inv_CcoEmail = o.cin_inv_cco_email,
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                #endregion cco
                Creator = new User
                {
                    Firstname = o.TM_USR_User3.usr_firstname,
                    Lastname = o.TM_USR_User3.usr_lastname
                },
                CinDiscountAmount = o.cin_discount_amount,
                CinDiscountPercentage = o.cin_discount_percentage,
                CodCode = o.cod_id.HasValue ? o.TM_COD_Client_Order.cod_code : string.Empty,
                CinFile = o.cin_file,
                CinAccount = o.cin_account,
                CinIsInvoice = o.cin_isinvoice,
                CplName = o.cod_id.HasValue && o.TM_COD_Client_Order.cpl_id.HasValue ? o.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_name : string.Empty,
                CodName = o.cod_id.HasValue ? o.TM_COD_Client_Order.cod_name : string.Empty,
                CurId = o.cur_id,
                CplCode = o.cod_id.HasValue && o.TM_COD_Client_Order.cpl_id.HasValue ? o.TM_COD_Client_Order.TM_CPL_Cost_Plan.cpl_code : string.Empty,
                DfoId = o.dfo_id,
                DfoCode = o.dfo_id.HasValue ? o.TM_DFO_Delivery_Form.dfo_code : string.Empty,
                CinDEncaissement = o.cin_d_encaissement,
                #region invoice for Avoir
                CinAvId = o.cin_avoir_id,
                CinAvCode = o.cin_avoir_id.HasValue ? o.TM_CIN_Client_Invoice2.cin_code : string.Empty,
                #endregion invoice for Avoir
                // for pdf
                ClientForPdf = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    VatIntra = o.TM_CLI_CLient.cli_vat_intra,
                    CliPdfVersion = o.TM_CLI_CLient.cli_pdf_version
                },
                CinIsFullPaid = o.cin_is_full_paid,
                CinIsInvoiced = o.cin_invoiced,

                UsrCom1 = o.usr_com_1,
                UsrCom2 = o.usr_com_2,
                UsrCom3 = o.usr_com_3,
                UsrCommercial1 = o.usr_com_1.HasValue ? (o.TM_USR_User.usr_firstname + " " + o.TM_USR_User.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_com_2.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_com_3.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                CurrencySymbol = o.TR_CUR_Currency.cur_symbol,
                SodId = o.sod_id,
                CinBank = o.cin_bank,
                CinRest2Pay = o.cin_rest_to_pay ?? 0,
                TteId = o.tte_id ?? 0,
                TradeTerms = o.tte_id.HasValue ? o.TR_TTE_TRADE_TERMS.tte_name : string.Empty,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CinKeyProject = o.cin_key_project ?? false,
                DelegatorId = o.cin_delegator_id,
                //Delegataire = new KeyValue()
                //{
                //    Key = o.cin_delegator_id.HasValue?  o.TM_CLI_CLient1.cli_id: 0,
                //    Value = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_company_name : "",
                //    Value2 = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_abbreviation : "",
                //    Value3 = o.cin_delegator_id.HasValue ? o.TM_CLI_CLient1.cli_email : "",
                //},
                ClientInvoiceLines = o.TM_CII_ClientInvoice_Line.Select(l => new ClientInvoiceLine
                {
                    CiiId = l.cii_id,
                    CinId = l.cin_id,
                    CiiLevel1 = l.cii_level1,
                    CiiLevel2 = l.cii_level2,
                    CiiDescription = l.cii_description ?? string.Empty,
                    PrdId = l.prd_id,
                    //PrdName = l.prd_id.HasValue ? l.TM_PRD_Product.prd_name : string.Empty,
                    PitId = l.pit_id,
                    PitName = l.pit_id.HasValue ? l.TM_PIT_Product_Instance.pit_ref : string.Empty,
                    CiiPurchasePrice = l.cii_purchase_price,
                    CiiUnitPrice = l.cii_unit_price,
                    // 20210901
                    //CiiQuantity = l.cii_quantity,
                    CiiQuantity = l.cii_quantity,
                    CiiTotalPrice = l.cii_total_price,
                    CiiTotalCrudePrice = l.cii_total_crude_price,
                    VatId = l.vat_id,
                    LtpId = l.ltp_id,
                    LineType = l.TR_LTP_Line_Type.ltp_name,
                    CiiPrdName = l.prd_id.HasValue ? l.TM_PRD_Product.prd_ref : l.cii_prd_name,
                    PrdImgPath = l.prd_id.HasValue && l.TM_PRD_Product.TI_PIM_Product_Image.Any()
                                ? (l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                                    ? l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                                    : l.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                                : string.Empty,
                    VatLabel = l.TR_VAT_Vat.vat_designation,
                    VatRate = l.TR_VAT_Vat.vat_vat_rate,
                    CiiDiscountAmount = l.cii_discount_amount,
                    CiiDiscountPercentage = l.cii_discount_percentage,
                    CiiPriceWithDiscountHt = l.cii_price_with_discount_ht,
                    CiiMargin = l.cii_margin,
                    CiiAvId = l.cii_av_id,
                    CiiPrdDes = l.cii_prd_des,
                    PtyId = l.prd_id.HasValue ? l.TM_PRD_Product.pty_id : 0,
                    LglQuantity = l.TM_LGL_Logistic_Lines.Any() ?
                            (l.TM_LGL_Logistic_Lines.Sum(f => f.lgs_quantity) + (l.sol_id.HasValue && l.TM_SOL_SupplierOrder_Lines.TM_LGL_Logistic_Lines.Any() ? (l.TM_SOL_SupplierOrder_Lines.TM_LGL_Logistic_Lines.Sum(k => k.lgs_quantity)) : 0)) // 2021-10-17
                            : 0,
                    SolId = l.sol_id ?? 0
                }).ToList()
            };
        }

        public static TM_CIN_Client_Invoice EntityToRepository(ClientInvoice _from, TM_CIN_Client_Invoice _to, bool create = false)
        {
            _to.vat_id = _from.VatId;
            _to.cin_d_update = _from.CinDUpdate;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.cin_d_term = _from.CinDTerm;
            _to.cin_d_invoice = _from.CinDInvoice;
            _to.cin_header_text = _from.CinHeaderText;
            _to.cin_footer_text = _from.CinFooterText;
            //_to.cco_id_delivery = _from.CcoIdDelivery;
            _to.cco_id_invoicing = _from.CcoIdInvoicing == 0 ? (int?)null : _from.CcoIdInvoicing;
            _to.cin_client_comment = _from.CinClientComment;
            _to.cin_inter_comment = _from.CinInterComment;
            _to.cin_name = _from.CinName;
            _to.cin_inv_cco_firstname = _from.Inv_CcoFirstname;
            _to.cin_inv_cco_lastname = _from.Inv_CcoLastname;
            _to.cin_inv_cco_address1 = _from.Inv_CcoAddress1;
            _to.cin_inv_cco_address2 = _from.Inv_CcoAddress2;
            _to.cin_inv_cco_postcode = _from.Inv_CcoPostcode;
            _to.cin_inv_cco_city = _from.Inv_CcoCity;
            _to.cin_inv_cco_country = _from.Inv_CcoCountry;
            _to.cin_inv_cco_tel1 = _from.Inv_CcoTel1;
            _to.cin_inv_cco_fax = _from.Inv_CcoFax;
            _to.cin_inv_cco_cellphone = _from.Inv_CcoCellphone;
            _to.cin_inv_cco_email = _from.Inv_CcoEmail;
            //_to.cin_dlv_cco_firstname = _from.Dlv_CcoFirstname;
            //_to.cin_dlv_cco_lastname = _from.Dlv_CcoLastname;
            //_to.cin_dlv_cco_address1 = _from.Dlv_CcoAddress1;
            //_to.cin_dlv_cco_address2 = _from.Dlv_CcoAddress2;
            //_to.cin_dlv_cco_postcode = _from.Dlv_CcoPostcode;
            //_to.cin_dlv_cco_city = _from.Dlv_CcoCity;
            //_to.cin_dlv_cco_country = _from.Dlv_CcoCountry;
            //_to.cin_dlv_cco_tel1 = _from.Dlv_CcoTel1;
            //_to.cin_dlv_cco_fax = _from.Dlv_CcoFax;
            //_to.cin_dlv_cco_cellphone = _from.Dlv_CcoCellphone;
            //_to.cin_dlv_cco_email = _from.Dlv_CcoEmail;
            _to.cur_id = _from.CurId;
            _to.cin_d_encaissement = _from.CinDEncaissement;
            _to.cin_delegator_id = _from.DelegatorId == 0 ? (int?)null : _from.DelegatorId;
            if (create)
            {
                _to.cli_id = _from.CliId;
                _to.prj_id = _from.PrjId == 0 ? null : _from.PrjId;
                _to.cod_id = _from.CodId == 0 ? null : _from.CodId;
                _to.dfo_id = _from.DfoId == 0 ? null : _from.DfoId;
                _to.cin_code = _from.CinCode;
                _to.soc_id = _from.SocId;
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.cin_d_creation = _from.CinDCreation;
                _to.cin_avoir_id = _from.CinAvId == 0 ? null : _from.CinAvId;
                _to.cin_isinvoice = _from.CinIsInvoice;
                _to.cin_account = !_from.CinIsInvoice;
                _to.cin_invoiced = false;
            }

            //todo: 2017-12-07 don't update discount
            //_to.cin_discount_amount = (_from.CinDiscountAmount ?? 0) == 0 ? null : _from.CinDiscountAmount;
            //_to.cin_discount_percentage = (_from.CinDiscountPercentage ?? 0) == 0 ? null : _from.CinDiscountPercentage;
            _to.cin_is_full_paid = _from.CinIsFullPaid;

            // 2018-01-18
            _to.usr_com_1 = _from.UsrCom1 == 0 ? null : _from.UsrCom1;
            _to.usr_com_2 = _from.UsrCom2 == 0 ? null : _from.UsrCom2;
            _to.usr_com_3 = _from.UsrCom3 == 0 ? null : _from.UsrCom3;
            _to.tte_id = _from.TteId == 0 ? (int?)null : _from.TteId;
            _to.cin_key_project = _from.CinKeyProject;

            _to.cin_bank = _from.CinBank;
            return _to;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class CostPlanTranslator
    {
        public static Expression<Func<TM_CPL_Cost_Plan, CostPlan>> RepositoryToEntity()
        {
            return o => new CostPlan
            {
                CplId = o.cpl_id,
                SocId = o.soc_id,
                PrjId = o.prj_id,
                VatId = o.vat_id,
                CplCode = o.cpl_code,
                PrjName = o.TM_PRJ_Project.prj_name,
                PrjCode = o.TM_PRJ_Project.prj_code,
                CplDateCreation = o.cpl_d_creation,
                CplDateUpdate = o.cpl_d_update,
                CstId = o.cst_id,
                CostPlanStatut = o.TR_CST_CostPlan_Statut.cst_designation,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CplDateValidity = o.cpl_d_validity,
                CplDatePreDelivery = o.cpl_d_pre_delivery,
                CplHeaderText = o.cpl_header_text,
                CplFooterText = o.cpl_footer_text,
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                CplClientComment = o.cpl_client_comment,
                CplInterComment = o.cpl_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CplName = o.cpl_name,
                #region cco
                // invoicing
                //Inv_CcoFirstname = o.cpl_inv_cco_firstname,
                //Inv_CcoLastname = o.cpl_inv_cco_lastname,
                //Inv_CcoAddress1 = !string.IsNullOrEmpty(o.cpl_inv_cco_address1) ? o.cpl_inv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                //Inv_CcoAddress2 = !string.IsNullOrEmpty(o.cpl_inv_cco_address2) ? o.cpl_inv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                //Inv_CcoPostcode = !string.IsNullOrEmpty(o.cpl_inv_cco_postcode) ? o.cpl_inv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                //Inv_CcoCity = !string.IsNullOrEmpty(o.cpl_inv_cco_city) ? o.cpl_inv_cco_city : o.TM_CLI_CLient.cli_city,
                //Inv_CcoCountry = !string.IsNullOrEmpty(o.cpl_inv_cco_country) ? o.cpl_inv_cco_country : o.TM_CLI_CLient.cli_country,
                //Inv_CcoTel1 = !string.IsNullOrEmpty(o.cpl_inv_cco_tel1) ? o.cpl_inv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                //Inv_CcoFax = !string.IsNullOrEmpty(o.cpl_inv_cco_fax) ? o.cpl_inv_cco_fax : o.TM_CLI_CLient.cli_fax,
                //Inv_CcoCellphone = o.cpl_inv_cco_cellphone,
                //Inv_CcoEmail = o.cpl_inv_cco_email,
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                // delivery
                //Dlv_CcoFirstname = o.cpl_dlv_cco_firstname,
                //Dlv_CcoLastname = o.cpl_dlv_cco_lastname,
                //Dlv_CcoAddress1 = !string.IsNullOrEmpty(o.cpl_dlv_cco_address1) ? o.cpl_dlv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                //Dlv_CcoAddress2 = !string.IsNullOrEmpty(o.cpl_dlv_cco_address2) ? o.cpl_dlv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                //Dlv_CcoPostcode = !string.IsNullOrEmpty(o.cpl_dlv_cco_postcode) ? o.cpl_dlv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                //Dlv_CcoCity = !string.IsNullOrEmpty(o.cpl_dlv_cco_city) ? o.cpl_dlv_cco_city : o.TM_CLI_CLient.cli_city,
                //Dlv_CcoCountry = !string.IsNullOrEmpty(o.cpl_dlv_cco_country) ? o.cpl_dlv_cco_country : o.TM_CLI_CLient.cli_country,
                //Dlv_CcoTel1 = !string.IsNullOrEmpty(o.cpl_dlv_cco_tel1) ? o.cpl_dlv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                //Dlv_CcoFax = !string.IsNullOrEmpty(o.cpl_dlv_cco_fax) ? o.cpl_dlv_cco_fax : o.TM_CLI_CLient.cli_fax,
                //Dlv_CcoCellphone = o.cpl_dlv_cco_cellphone,
                //Dlv_CcoEmail = o.cpl_dlv_cco_email,
                //Dlv_CcoRef = o.TM_CCO_Client_Contact.cco_ref,
                #endregion cco
                #region client
                CplClient = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    Tel1 = o.TM_CLI_CLient.cli_tel1,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    Email = o.TM_CLI_CLient.cli_email,
                    Cellphone = o.TM_CLI_CLient.cli_cellphone,
                    CliPdfVersion = o.TM_CLI_CLient.cli_pdf_version
                },
                #endregion client
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                CplDiscountAmount = o.cpl_discount_amount,
                CplDiscountPercentage = o.cpl_discount_percentage,
                UsrCom1 = o.usr_commercial1,
                UsrCom2 = o.usr_commercial2,
                UsrCom3 = o.usr_commercial3,
                UsrCommercial1 = o.usr_commercial1.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_commercial2.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_commercial3.HasValue ? (o.TM_USR_User3.usr_firstname + " " + o.TM_USR_User3.usr_lastname) : string.Empty,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CurrencySymbol = o.TM_CLI_CLient.TR_CUR_Currency.cur_symbol,
                CplFromSite = o.cpl_fromsite ?? false,
                cpl_stripe_chargeid = o.cpl_stripe_chargeid,
                CplKeyProject = o.cpl_key_project ?? false
            };
        }

        /// <summary>
        /// 20231111 用于search
        /// </summary>
        /// <returns></returns>
        public static Expression<Func<TM_CPL_Cost_Plan, CostPlan>> RepositoryToEntity4Search()
        {
            return o => new CostPlan
            {
                CplId = o.cpl_id,
                SocId = o.soc_id,
                PrjId = o.prj_id,
                VatId = o.vat_id,
                CplCode = o.cpl_code,
                PrjName = o.TM_PRJ_Project.prj_name,
                PrjCode = o.TM_PRJ_Project.prj_code,
                CplDateCreation = o.cpl_d_creation,
                CplDateUpdate = o.cpl_d_update,
                CstId = o.cst_id,
                CostPlanStatut = o.TR_CST_CostPlan_Statut.cst_designation,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CplDateValidity = o.cpl_d_validity,
                CplDatePreDelivery = o.cpl_d_pre_delivery,
                CplHeaderText = o.cpl_header_text,
                CplFooterText = o.cpl_footer_text,
                //CcoIdDelivery = o.cco_id_delivery,
                CcoIdInvoicing = o.cco_id_invoicing,
                CplClientComment = o.cpl_client_comment,
                CplInterComment = o.cpl_inter_comment,
                UsrCreatorId = o.usr_creator_id,
                CplName = o.cpl_name,
                #region cco
                // invoicing
                //Inv_CcoFirstname = o.cpl_inv_cco_firstname,
                //Inv_CcoLastname = o.cpl_inv_cco_lastname,
                //Inv_CcoAddress1 = !string.IsNullOrEmpty(o.cpl_inv_cco_address1) ? o.cpl_inv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                //Inv_CcoAddress2 = !string.IsNullOrEmpty(o.cpl_inv_cco_address2) ? o.cpl_inv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                //Inv_CcoPostcode = !string.IsNullOrEmpty(o.cpl_inv_cco_postcode) ? o.cpl_inv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                //Inv_CcoCity = !string.IsNullOrEmpty(o.cpl_inv_cco_city) ? o.cpl_inv_cco_city : o.TM_CLI_CLient.cli_city,
                //Inv_CcoCountry = !string.IsNullOrEmpty(o.cpl_inv_cco_country) ? o.cpl_inv_cco_country : o.TM_CLI_CLient.cli_country,
                //Inv_CcoTel1 = !string.IsNullOrEmpty(o.cpl_inv_cco_tel1) ? o.cpl_inv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                //Inv_CcoFax = !string.IsNullOrEmpty(o.cpl_inv_cco_fax) ? o.cpl_inv_cco_fax : o.TM_CLI_CLient.cli_fax,
                //Inv_CcoCellphone = o.cpl_inv_cco_cellphone,
                //Inv_CcoEmail = o.cpl_inv_cco_email,
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                // delivery
                //Dlv_CcoFirstname = o.cpl_dlv_cco_firstname,
                //Dlv_CcoLastname = o.cpl_dlv_cco_lastname,
                //Dlv_CcoAddress1 = !string.IsNullOrEmpty(o.cpl_dlv_cco_address1) ? o.cpl_dlv_cco_address1 : o.TM_CLI_CLient.cli_address1,
                //Dlv_CcoAddress2 = !string.IsNullOrEmpty(o.cpl_dlv_cco_address2) ? o.cpl_dlv_cco_address2 : o.TM_CLI_CLient.cli_address2,
                //Dlv_CcoPostcode = !string.IsNullOrEmpty(o.cpl_dlv_cco_postcode) ? o.cpl_dlv_cco_postcode : o.TM_CLI_CLient.cli_postcode,
                //Dlv_CcoCity = !string.IsNullOrEmpty(o.cpl_dlv_cco_city) ? o.cpl_dlv_cco_city : o.TM_CLI_CLient.cli_city,
                //Dlv_CcoCountry = !string.IsNullOrEmpty(o.cpl_dlv_cco_country) ? o.cpl_dlv_cco_country : o.TM_CLI_CLient.cli_country,
                //Dlv_CcoTel1 = !string.IsNullOrEmpty(o.cpl_dlv_cco_tel1) ? o.cpl_dlv_cco_tel1 : o.TM_CLI_CLient.cli_tel1,
                //Dlv_CcoFax = !string.IsNullOrEmpty(o.cpl_dlv_cco_fax) ? o.cpl_dlv_cco_fax : o.TM_CLI_CLient.cli_fax,
                //Dlv_CcoCellphone = o.cpl_dlv_cco_cellphone,
                //Dlv_CcoEmail = o.cpl_dlv_cco_email,
                //Dlv_CcoRef = o.TM_CCO_Client_Contact.cco_ref,
                #endregion cco
                #region client
                CplClient = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    Tel1 = o.TM_CLI_CLient.cli_tel1,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    Email = o.TM_CLI_CLient.cli_email,
                    Cellphone = o.TM_CLI_CLient.cli_cellphone,
                    CliPdfVersion = o.TM_CLI_CLient.cli_pdf_version
                },
                #endregion client
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                CplDiscountAmount = o.cpl_discount_amount,
                CplDiscountPercentage = o.cpl_discount_percentage,
                UsrCom1 = o.usr_commercial1,
                UsrCom2 = o.usr_commercial2,
                UsrCom3 = o.usr_commercial3,
                UsrCommercial1 = o.usr_commercial1.HasValue ? (o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname) : string.Empty,
                UsrCommercial2 = o.usr_commercial2.HasValue ? (o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname) : string.Empty,
                UsrCommercial3 = o.usr_commercial3.HasValue ? (o.TM_USR_User3.usr_firstname + " " + o.TM_USR_User3.usr_lastname) : string.Empty,
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CurrencySymbol = o.TM_CLI_CLient.TR_CUR_Currency.cur_symbol,
                CplFromSite = o.cpl_fromsite ?? false,
                CplKeyProject = o.cpl_key_project ?? false,
                CostPlanLines = o.TM_CLN_CostPlan_Lines.OrderBy(l => l.cln_level1).ThenBy(l => l.cln_level2).Select(cln => new CostPlanLine()
                {
                    ClnId = cln.cln_id,
                    CplId = cln.cpl_id,
                    ClnLevel1 = cln.cln_level1,
                    ClnLevel2 = cln.cln_level2,
                    ClnDescription = cln.cln_description ?? string.Empty,
                    PrdId = cln.prd_id,
                    //PrdName = cln.prd_id.HasValue ? cln.TM_PRD_Product.prd_name : string.Empty,
                    PitId = cln.pit_id,
                    PitName = cln.pit_id.HasValue ? cln.TM_PIT_Product_Instance.pit_ref : string.Empty,
                    ClnPurchasePrice = cln.cln_purchase_price,
                    ClnUnitPrice = cln.cln_unit_price,
                    ClnQuantity = cln.cln_quantity,
                    ClnTotalPrice = cln.cln_total_price,
                    ClnTotalCrudePrice = cln.cln_total_crude_price,
                    VatId = cln.vat_id,
                    LtpId = cln.ltp_id,
                    LineType = cln.TR_LTP_Line_Type.ltp_name,
                    ClnPrdName = cln.prd_id.HasValue ? cln.TM_PRD_Product.prd_ref : cln.cln_prd_name,
                    PrdImgPath = cln.prd_id.HasValue && cln.TM_PRD_Product.TI_PIM_Product_Image.Any()
                        ? (cln.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            ? cln.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            : cln.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                        : string.Empty,
                    // 2024-11-29 chenglin, I don't know why this part has problem, I should add this check condition "cln.TR_VAT_Vat != null"
                    VatLabel = cln.TR_VAT_Vat != null ? cln.TR_VAT_Vat.vat_designation : string.Empty,
                    VatRate = cln.TR_VAT_Vat != null ? cln.TR_VAT_Vat.vat_vat_rate : 0,
                    ClnDiscountAmount = cln.cln_discount_amount,
                    ClnDiscountPercentage = cln.cln_discount_percentage,
                    ClnPriceWithDiscountHt = cln.cln_price_with_discount_ht,
                    ClnMargin = cln.cln_margin,
                    ClnPrdDes = cln.cln_prd_des,
                    PtyId = cln.prd_id.HasValue ? cln.TM_PRD_Product.pty_id : 0
                }
                ).ToList()
            };
        }


        /// <summary>
        /// 20231031 用于网站 
        /// </summary>
        /// <returns></returns>
        public static Expression<Func<TM_CPL_Cost_Plan, CostPlan>> RepositoryToEntityLite()
        {
            return o => new CostPlan
            {
                CplId = o.cpl_id,
                CplCode = o.cpl_code,
                CplDateUpdate = o.cpl_d_update,
                CostPlanStatut = o.TR_CST_CostPlan_Statut.cst_designation,
                CplDateCreation = o.cpl_d_creation,
                CliId = o.cli_id,
                ClientCompanyName = o.TM_CLI_CLient.cli_company_name,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                PaymentMode = o.TR_PMO_Payment_Mode.pmo_designation,
                PaymentCondition = o.TR_PCO_Payment_Condition.pco_designation,
                CplDateValidity = o.cpl_d_validity,
                CcoIdInvoicing = o.cco_id_invoicing,
                CplClientComment = o.cpl_client_comment,
                UsrCreatorId = o.usr_creator_id,
                CplName = o.cpl_name,
                #region cco
                Inv_CcoRef = o.TM_CCO_Client_Contact != null ? o.TM_CCO_Client_Contact.cco_ref : string.Empty,
                #endregion cco
                #region client
                CplClient = new Client
                {
                    Address1 = o.TM_CLI_CLient.cli_address1,
                    Address2 = o.TM_CLI_CLient.cli_address2,
                    Postcode = o.TM_CLI_CLient.cli_postcode,
                    Tel1 = o.TM_CLI_CLient.cli_tel1,
                    City = o.TM_CLI_CLient.cli_city,
                    Country = o.TM_CLI_CLient.cli_country,
                    Email = o.TM_CLI_CLient.cli_email,
                    Cellphone = o.TM_CLI_CLient.cli_cellphone
                },
                #endregion client
                CliAbbr = o.TM_CLI_CLient.cli_abbreviation,
                CurrencySymbol = o.TM_CLI_CLient.TR_CUR_Currency.cur_symbol,
                // 这里借用到codcode
                PrjCode = o.TM_COD_Client_Order.Any() ? o.TM_COD_Client_Order.FirstOrDefault().cod_code : null,
                CplFromSite = o.cpl_fromsite ?? false,
                CplKeyProject = o.cpl_key_project ?? false
            };
        }

        public static TM_CPL_Cost_Plan EntityToRepository(CostPlan _from, TM_CPL_Cost_Plan _to, bool create = false)
        {
            _to.prj_id = _from.PrjId;
            _to.vat_id = _from.VatId;
            _to.cpl_stripe_chargeid = _from.cpl_stripe_chargeid;
            //_to.cpl_d_update = _from.CplDateUpdate;
            _to.cpl_d_update = DateTime.Now;
            _to.cli_id = _from.CliId;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.cpl_d_validity = _from.CplDateValidity;
            _to.cpl_d_pre_delivery = _from.CplDatePreDelivery;
            _to.cpl_header_text = _from.CplHeaderText;
            _to.cpl_footer_text = _from.CplFooterText;
            //_to.cco_id_delivery = _from.CcoIdDelivery;
            _to.cco_id_invoicing = _from.CcoIdInvoicing;
            _to.cpl_client_comment = _from.CplClientComment;
            _to.cpl_inter_comment = _from.CplInterComment;
            _to.cpl_name = _from.CplName;
            //_to.cpl_inv_cco_firstname = _from.Inv_CcoFirstname;
            //_to.cpl_inv_cco_lastname = _from.Inv_CcoLastname;
            //_to.cpl_inv_cco_address1 = _from.Inv_CcoAddress1;
            //_to.cpl_inv_cco_address2 = _from.Inv_CcoAddress2;
            //_to.cpl_inv_cco_postcode = _from.Inv_CcoPostcode;
            //_to.cpl_inv_cco_city = _from.Inv_CcoCity;
            //_to.cpl_inv_cco_country = _from.Inv_CcoCountry;
            //_to.cpl_inv_cco_tel1 = _from.Inv_CcoTel1;
            //_to.cpl_inv_cco_fax = _from.Inv_CcoFax;
            //_to.cpl_inv_cco_cellphone = _from.Inv_CcoCellphone;
            //_to.cpl_inv_cco_email = _from.Inv_CcoEmail;
            //_to.cpl_dlv_cco_firstname = _from.Dlv_CcoFirstname;
            //_to.cpl_dlv_cco_lastname = _from.Dlv_CcoLastname;
            //_to.cpl_dlv_cco_address1 = _from.Dlv_CcoAddress1;
            //_to.cpl_dlv_cco_address2 = _from.Dlv_CcoAddress2;
            //_to.cpl_dlv_cco_postcode = _from.Dlv_CcoPostcode;
            //_to.cpl_dlv_cco_city = _from.Dlv_CcoCity;
            //_to.cpl_dlv_cco_country = _from.Dlv_CcoCountry;
            //_to.cpl_dlv_cco_tel1 = _from.Dlv_CcoTel1;
            //_to.cpl_dlv_cco_fax = _from.Dlv_CcoFax;
            //_to.cpl_dlv_cco_cellphone = _from.Dlv_CcoCellphone;
            //_to.cpl_dlv_cco_email = _from.Dlv_CcoEmail;
            _to.cst_id = _from.CstId;
            if (create)
            {
                _to.cpl_code = _from.CplCode;
                _to.soc_id = _from.SocId;
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.cpl_d_creation = _from.CplDateCreation;
                _to.cpl_fromsite = _from.CplFromSite;
            }

            _to.usr_commercial1 = _from.UsrCom1 == 0 ? null : _from.UsrCom1;
            _to.usr_commercial2 = _from.UsrCom2 == 0 ? null : _from.UsrCom2;
            _to.usr_commercial3 = _from.UsrCom3 == 0 ? null : _from.UsrCom3;
            _to.cpl_key_project = _from.CplKeyProject;

            //todo: 2017-12-07 don't update discount
            //_to.cpl_discount_amount = (_from.CplDiscountAmount ?? 0) == 0 ? null : _from.CplDiscountAmount;
            //_to.cpl_discount_percentage = (_from.CplDiscountPercentage ?? 0) == 0 ? null : _from.CplDiscountPercentage;
            return _to;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ClientTranslator
    {
        public static Expression<Func<TM_CLI_CLient, Client>> RepositoryToEntity()
        {
            return o => new Client
            {
                Id = o.cli_id,
                Reference = o.cli_ref,
                SocId = o.soc_id,
                CompanyName = o.cli_company_name,
                VatId = o.vat_id,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                ActId = o.act_id,
                Siren = o.cli_siren,
                Siret = o.cli_siret,
                VatIntra = o.cli_vat_intra,
                UsrCreatedBy = o.usr_created_by,
                CtyId = o.cty_id,
                CurId = o.cur_id,
                Isactive = o.cli_isactive,
                Isblocked = o.cli_isblocked,
                DateCreation = o.cli_d_creation,
                DateUpdate = o.cli_d_update,
                Address1 = o.cli_address1,
                Address2 = o.cli_address2,
                Postcode = o.cli_postcode,
                City = o.cli_city,
                Country = o.cli_country,
                FreeOfHarbor = o.cli_free_of_harbor,
                Tel1 = o.cli_tel1,
                Tel2 = o.cli_tel2,
                Fax = o.cli_fax,
                Cellphone = o.cli_cellphone,
                Email = o.cli_email,
                UsrIdCom1 = o.cli_usr_com1,
                UsrIdCom2 = o.cli_usr_com2,
                UsrIdCom3 = o.cli_usr_com3,
                RecieveNewsletter = o.cli_recieve_newsletter,
                NewsletterEmail = o.cli_newsletter_email,
                ClientType = new KeyValue { Value = o.TR_CTY_Client_Type != null ? o.TR_CTY_Client_Type.cty_description : string.Empty },
                PaymentCondition = new KeyValue { Value = o.TR_PCO_Payment_Condition != null ? o.TR_PCO_Payment_Condition.pco_designation : string.Empty },
                PaymentMode = new KeyValue { Value = o.TR_PMO_Payment_Mode != null ? o.TR_PMO_Payment_Mode.pmo_designation : string.Empty },
                Commercial1 = new KeyValue { Value = o.TM_USR_User1 != null ? o.TM_USR_User1.usr_firstname + " " + o.TM_USR_User1.usr_lastname : string.Empty },
                Commercial2 = new KeyValue { Value = o.TM_USR_User2 != null ? o.TM_USR_User2.usr_firstname + " " + o.TM_USR_User2.usr_lastname : string.Empty },
                Commercial3 = new KeyValue { Value = o.TM_USR_User3 != null ? o.TM_USR_User3.usr_firstname + " " + o.TM_USR_User3.usr_lastname : string.Empty },
                Currency = new KeyValue { Value = o.TR_CUR_Currency != null ? o.TR_CUR_Currency.cur_designation : string.Empty },
                CmuId = o.cmu_id,
                Comment4Client = o.cli_comment_for_client,
                Comment4Interne = o.cli_comment_for_interne,
                InvoiceDay = o.cli_invoice_day,
                InvoiceDayIsLastDay = o.cli_invoice_day_is_last_day,
                CliAccountingEmail = o.cli_accounting_email,
                ShowDetail = o.cli_showdetail ?? false,
                CliAbbr = o.cli_abbreviation,
                CliPdfVersion = o.cli_pdf_version,
                ClientTypes = o.TR_CTL_ClientTYPE_LIST.Select(k => new KeyValueSimple { Key = k.ctl_id, Key2 = k.cty_id, Value = k.TR_CTY_Client_Type.cty_description })
            };
        }

        public static Expression<Func<TM_CLI_CLient, Client>> RepositoryToEntitySimple()
        {
            return o => new Client
            {
                Id = o.cli_id,
                Reference = o.cli_ref,
                SocId = o.soc_id,
                CompanyName = o.cli_company_name,
                VatId = o.vat_id,
                PcoId = o.pco_id,
                PmoId = o.pmo_id,
                CurId = o.cur_id,
                Email = o.cli_email,
                CliAccountingEmail = o.cli_accounting_email,
                Isactive = o.cli_isactive,
                UsrIdCom1 = o.cli_usr_com1,
                UsrIdCom2 = o.cli_usr_com2,
                UsrIdCom3 = o.cli_usr_com3,
                CliAbbr = o.cli_abbreviation
            };
        }

        public static Expression<Func<TM_CLI_CLient, Client>> RepositoryToEntitySimple2()
        {
            return o => new Client
            {
                Id = o.cli_id,
                Reference = o.cli_ref,
                CompanyName = o.cli_company_name,
                Isactive = o.cli_isactive,
                CliAbbr = o.cli_abbreviation,
                CurrencySymbol = o.TR_CUR_Currency.cur_symbol
            };
        }

        public static TM_CLI_CLient EntityToRepository(Client _from, TM_CLI_CLient _to, bool create = false)
        {
            //_to.cli_ref = _from.Reference;
            _to.cli_company_name = _from.CompanyName;
            _to.vat_id = _from.VatId;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.act_id = _from.ActId;
            _to.cli_siren = _from.Siren;
            _to.cli_siret = _from.Siret;
            _to.cli_vat_intra = _from.VatIntra;
            _to.cty_id = _from.CtyId;
            _to.cur_id = _from.CurId;
            _to.cli_isactive = _from.Isactive;
            _to.cli_isblocked = _from.Isblocked;
            _to.cli_d_update = _from.DateUpdate;
            _to.cli_address1 = _from.Address1;
            _to.cli_address2 = _from.Address2;
            _to.cli_country = _from.Country;
            _to.cli_free_of_harbor = _from.FreeOfHarbor;
            _to.cli_tel1 = _from.Tel1;
            _to.cli_tel2 = _from.Tel2;
            _to.cli_fax = _from.Fax;
            _to.cli_cellphone = _from.Cellphone;
            _to.cli_email = _from.Email;
            _to.cli_usr_com1 = _from.UsrIdCom1 == 0 ? (int?)null : _from.UsrIdCom1;
            _to.cli_usr_com2 = _from.UsrIdCom2 == 0 ? (int?)null : _from.UsrIdCom2;
            _to.cli_usr_com3 = _from.UsrIdCom3 == 0 ? (int?)null : _from.UsrIdCom3;
            _to.cli_recieve_newsletter = _from.RecieveNewsletter;
            _to.cli_newsletter_email = _from.NewsletterEmail;

            _to.cli_postcode = _from.Postcode;
            _to.cli_city = _from.City;
            _to.cmu_id = _from.CmuId == 0 ? null : _from.CmuId;
            _to.cli_showdetail = _from.ShowDetail;


            if (create)
            {
                _to.usr_created_by = _from.UsrCreatedBy;
                _to.soc_id = _from.SocId;
                _to.cli_d_creation = _from.DateCreation;
                _to.cli_ref = _from.Reference;
            }
            _to.cli_comment_for_client = _from.Comment4Client;
            _to.cli_comment_for_interne = _from.Comment4Interne;
            _to.cli_invoice_day = _from.InvoiceDay;
            _to.cli_invoice_day_is_last_day = _from.InvoiceDayIsLastDay;
            _to.cli_accounting_email = _from.CliAccountingEmail;
            _to.cli_abbreviation = _from.CliAbbr;
            _to.cli_pdf_version = _from.CliPdfVersion;
            return _to;
        }

        public static Expression<Func<TS_SCL_Site_Client, SiteClient>> RepositoryToEntityScl(bool withPwd = false)
        {
            return o => new SiteClient
            {
                SclId = o.scl_id,
                SocId = o.soc_id,
                CompanyName = o.scl_company_name,
                Siren = o.scl_siren,
                Siret = o.scl_siret,
                VatIntra = o.scl_vat_intra,
                Isactive = o.scl_is_active,
                DateCreation = o.scl_d_creation,
                Address1 = o.scl_address1,
                Address2 = o.scl_address2,
                Postcode = o.scl_postcode,
                City = o.scl_city,
                Country = o.scl_country,
                Tel1 = o.scl_tel1,
                Tel2 = o.scl_tel2,
                Fax = o.scl_fax,
                Cellphone = o.scl_cellphone,
                Email = o.scl_email,
                FirstName = o.scl_firstname,
                LastName = o.scl_lastname,
                Civility = o.TR_CIV_Civility.civ_designation,
                Login = o.scl_login,
                CivId = o.civ_id,
                Pwd = withPwd && o.TS_CPW_Client_Password.FirstOrDefault(m => m.cpw_is_actived) != null ? o.TS_CPW_Client_Password.FirstOrDefault(m => m.cpw_is_actived).cpw_pwd : string.Empty
            };
        }

        public static TS_SCL_Site_Client EntityToRepositoryScl(SiteClient _from, TS_SCL_Site_Client _to, bool create = false)
        {
            //_to.scl_ref = _from.Reference;
            _to.scl_login = _from.Login;
            _to.scl_company_name = _from.CompanyName;
            _to.scl_siren = _from.Siren;
            _to.scl_siret = _from.Siret;
            _to.scl_vat_intra = _from.VatIntra;
            _to.scl_is_active = _from.Isactive;
            _to.scl_address1 = _from.Address1;
            _to.scl_address2 = _from.Address2;
            _to.scl_country = _from.Country;
            _to.scl_tel1 = _from.Tel1;
            _to.scl_tel2 = _from.Tel2;
            _to.scl_fax = _from.Fax;
            _to.scl_cellphone = _from.Cellphone;
            _to.scl_email = _from.Email;
            _to.scl_postcode = _from.Postcode;
            _to.scl_city = _from.City;
            _to.scl_firstname = _from.FirstName;
            _to.scl_lastname = _from.LastName;
            _to.cli_id = null;
            _to.cco_id = null;
            _to.scl_d_active = null;
            _to.civ_id = _from.CivId;
            if (create)
            {
                _to.soc_id = _from.SocId;
                _to.scl_d_creation = DateTime.Now;
            }
            return _to;
        }
    }
}

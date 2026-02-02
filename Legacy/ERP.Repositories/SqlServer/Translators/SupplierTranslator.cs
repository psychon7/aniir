using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class SupplierTranslator
    {
        public static Expression<Func<TM_SUP_Supplier, Supplier>> RepositoryToEntity()
        {
            return o => new Supplier
                        {
                            Id = o.sup_id,
                            Reference = o.sup_ref,
                            SocId = o.soc_id,
                            CompanyName = o.sup_company_name,
                            VatId = o.vat_id,
                            PcoId = o.pco_id,
                            PmoId = o.pmo_id,
                            Siren = o.sup_siren,
                            Siret = o.sup_siret,
                            VatIntra = o.sup_vat_intra,
                            UsrCreatedBy = o.usr_created_by,
                            CurId = o.cur_id,
                            Isactive = o.sup_isactive,
                            Isblocked = o.sup_isblocked,
                            DateCreation = o.sup_d_creation,
                            DateUpdate = o.sup_d_update,
                            Address1 = o.sup_address1,
                            Address2 = o.sup_address2,
                            Postcode = o.sup_postcode,
                            City = o.sup_city,
                            Country = o.sup_country,
                            FreeOfHarbor = o.sup_free_of_harbor,
                            Tel1 = o.sup_tel1,
                            Tel2 = o.sup_tel2,
                            Fax = o.sup_fax,
                            Cellphone = o.sup_cellphone,
                            Email = o.sup_email,
                            RecieveNewsletter = o.sup_recieve_newsletter,
                            NewsletterEmail = o.sup_newsletter_email,
                            PaymentCondition = new KeyValue { Value = o.TR_PCO_Payment_Condition != null ? o.TR_PCO_Payment_Condition.pco_designation : string.Empty },
                            PaymentMode = new KeyValue { Value = o.TR_PMO_Payment_Mode != null ? o.TR_PMO_Payment_Mode.pmo_designation : string.Empty },
                            Currency = new KeyValue { Value = o.TR_CUR_Currency != null ? o.TR_CUR_Currency.cur_designation : string.Empty },
                            Comment4Supplier = o.sup_comment_for_supplier,
                            Comment4Interne = o.sup_comment_for_interne,
                            StyId = o.sty_id,
                            WithSco = o.TM_SCO_Supplier_Contact.Any(),
                            Abbreviation = o.sup_abbreviation,
                            SupLogin = o.sup_login,
                            SocShowLanguageBar = o.TR_SOC_Society.soc_show_language_bar ?? false
                        };
        }

        public static TM_SUP_Supplier EntityToRepository(Supplier _from, TM_SUP_Supplier _to, bool create = false)
        {
            //_to.sup_ref = _from.Reference;
            _to.sup_company_name = _from.CompanyName;
            _to.vat_id = _from.VatId;
            _to.pco_id = _from.PcoId;
            _to.pmo_id = _from.PmoId;
            _to.sup_siren = _from.Siren;
            _to.sup_siret = _from.Siret;
            _to.sup_vat_intra = _from.VatIntra;
            _to.cur_id = _from.CurId;
            _to.sup_isactive = _from.Isactive;
            _to.sup_isblocked = _from.Isblocked;
            _to.sup_d_update = _from.DateUpdate;
            _to.sup_address1 = _from.Address1;
            _to.sup_address2 = _from.Address2;
            _to.sup_country = _from.Country;
            _to.sup_free_of_harbor = _from.FreeOfHarbor;
            _to.sup_tel1 = _from.Tel1;
            _to.sup_tel2 = _from.Tel2;
            _to.sup_fax = _from.Fax;
            _to.sup_cellphone = _from.Cellphone;
            _to.sup_email = _from.Email;
            _to.sup_recieve_newsletter = _from.RecieveNewsletter;
            _to.sup_newsletter_email = _from.NewsletterEmail;

            _to.sup_postcode = _from.Postcode;
            _to.sup_city = _from.City;
            if (create)
            {
                _to.usr_created_by = _from.UsrCreatedBy;
                _to.soc_id = _from.SocId;
                _to.sup_d_creation = _from.DateCreation;
                _to.sup_ref = _from.Reference;
            }
            _to.sty_id = _from.StyId;
            _to.sup_comment_for_supplier = _from.Comment4Supplier;
            _to.sup_comment_for_interne = _from.Comment4Interne;
            _to.sup_abbreviation = _from.Abbreviation;
            //if (_to.sup_login != _from.SupLogin)
            //{
            //    var pwdGuid = Guid.NewGuid().ToString().Substring(0, 8);
            //    _to.sup_password = StringCipher.Encrypt(pwdGuid, _from.SupLogin);
            //}
            //_to.sup_login = _from.SupLogin;
            return _to;
        }
    }
}

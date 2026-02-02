using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ContactClientTranslator
    {
        public static Expression<Func<TM_CCO_Client_Contact, ContactClient>> RepositoryToEntity()
        {
            return o => new ContactClient
            {
                CcoId = o.cco_id,
                CcoFirstname = o.cco_firstname,
                CcoLastname = o.cco_lastname,
                CivId = o.civ_id,
                CcoRef = o.cco_ref,
                CcoAdresseTitle = o.cco_adresse_title,
                CcoAddress1 = o.cco_address1,
                CcoAddress2 = o.cco_address2,
                CcoPostcode = o.cco_postcode,
                CcoCity = o.cco_city,
                CcoCountry = o.cco_country,
                CcoTel1 = o.cco_tel1,
                CcoTel2 = o.cco_tel2,
                CcoFax = o.cco_fax,
                CcoCellphone = o.cco_cellphone,
                CcoEmail = o.cco_email,
                CcoRecieveNewsletter = o.cco_recieve_newsletter,
                CcoNewsletterEmail = o.cco_newsletter_email,
                CcoIsDeliveryAdr = o.cco_is_delivery_adr,
                CcoIsInvoicingAdr = o.cco_is_invoicing_adr,
                CliId = o.cli_id,
                UsrCreatedBy = o.usr_created_by,
                Civility = new KeyValue { Value = o.TR_CIV_Civility != null ? o.TR_CIV_Civility.civ_designation : string.Empty },
                DateCreation = o.cco_d_creation,
                DateUpdate = o.cco_d_update,
                UserCreator = new User
                              {
                                  Firstname = o.TM_USR_User.usr_firstname,
                                  Lastname = o.TM_USR_User.usr_lastname
                              },
                CcoComment = o.cco_comment,
                CcoCmuId = o.cmu_id,
                Login = o.TS_SCL_Site_Client.Any() ? o.TS_SCL_Site_Client.FirstOrDefault().scl_login : string.Empty
            };
        }

        public static TM_CCO_Client_Contact EntityToRepository(ContactClient _from, TM_CCO_Client_Contact _to, bool create = false, bool updateExt = false)
        {
            //_to.cco_id = _from.CcoId;
            _to.cco_firstname = _from.CcoFirstname ?? "";
            _to.cco_lastname = _from.CcoLastname ?? "";
            _to.cco_address1 = _from.CcoAddress1;
            _to.cco_address2 = _from.CcoAddress2;
            _to.cco_postcode = _from.CcoPostcode;
            _to.cco_city = _from.CcoCity;
            _to.cmu_id = _from.CcoCmuId == 0 ? null : _from.CcoCmuId;
            _to.cco_country = _from.CcoCountry;
            _to.cco_tel1 = _from.CcoTel1;
            if (!updateExt)
            {
                if (_from.CivId != 0)
                {
                    _to.civ_id = _from.CivId;
                }
                _to.cco_ref = _from.CcoRef;
                _to.cco_adresse_title = _from.CcoAdresseTitle;
                _to.cco_tel2 = _from.CcoTel2;
                _to.cco_recieve_newsletter = _from.CcoRecieveNewsletter;
                _to.cco_newsletter_email = _from.CcoNewsletterEmail;
                _to.cco_is_delivery_adr = _from.CcoIsDeliveryAdr;
                _to.cco_is_invoicing_adr = _from.CcoIsInvoicingAdr;
                _to.cco_comment = _from.CcoComment;
            }
            else
            {
                //_to.cco_adresse_title = _from.CcoAdresseTitle;
                _to.cco_tel2 = _from.CcoTel2;
                _to.cco_recieve_newsletter = _from.CcoRecieveNewsletter;
                _to.cco_newsletter_email = _from.CcoNewsletterEmail;
                _to.cco_is_delivery_adr = _from.CcoIsDeliveryAdr;
                _to.cco_is_invoicing_adr = _from.CcoIsInvoicingAdr;
                _to.cco_comment = _from.CcoComment;
            }
            _to.cco_fax = _from.CcoFax;
            _to.cco_cellphone = _from.CcoCellphone;
            _to.cco_email = _from.CcoEmail;
            _to.cco_d_update = _from.DateUpdate;
            if (create)
            {
                _to.cli_id = _from.CliId;
                _to.usr_created_by = _from.UsrCreatedBy;
                _to.cco_d_creation = _from.DateCreation;
                _to.cco_ref = _from.CcoRef;
            }
            return _to;
        }

        public static TM_CCO_Client_Contact EntityToRepositoryFromPage(ContactClient _from, TM_CCO_Client_Contact _to)
        {
            _to.cco_firstname = _from.CcoFirstname ?? "";
            _to.cco_lastname = _from.CcoLastname ?? "";
            _to.cco_address1 = _from.CcoAddress1;
            _to.cco_address2 = _from.CcoAddress2;
            _to.cco_postcode = _from.CcoPostcode;
            _to.cco_city = _from.CcoCity;
            _to.cmu_id = _from.CcoCmuId == 0 ? null : _from.CcoCmuId;
            _to.cco_country = _from.CcoCountry;
            _to.cco_tel1 = _from.CcoTel1;
            _to.cco_fax = _from.CcoFax;
            _to.cco_cellphone = _from.CcoCellphone;
            _to.cco_email = _from.CcoEmail;
            _to.cco_d_update = DateTime.Now;
            return _to;
        }
    }
}

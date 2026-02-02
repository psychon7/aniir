using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class SupplierContactTranslator
    {
        public static Expression<Func<TM_SCO_Supplier_Contact, SupplierContact>> RepositoryToEntity()
        {
            return o => new SupplierContact
            {
                ScoId = o.sco_id,
                ScoFirstname = o.sco_firstname,
                ScoLastname = o.sco_lastname,
                CivId = o.civ_id,
                ScoRef = o.sco_ref,
                ScoAdresseTitle = o.sco_adresse_title,
                ScoAddress1 = o.sco_address1,
                ScoAddress2 = o.sco_address2,
                ScoPostcode = o.sco_postcode,
                ScoCity = o.sco_city,
                ScoCountry = o.sco_country,
                ScoTel1 = o.sco_tel1,
                ScoTel2 = o.sco_tel2,
                ScoFax = o.sco_fax,
                ScoCellphone = o.sco_cellphone,
                ScoEmail = o.sco_email,
                ScoRecieveNewsletter = o.sco_recieve_newsletter,
                ScoNewsletterEmail = o.sco_newsletter_email,
                SupId = o.sup_id,
                UsrCreatedBy = o.usr_created_by,
                Civility = new KeyValue { Value = o.TR_CIV_Civility != null ? o.TR_CIV_Civility.civ_designation : string.Empty },
                DateCreation = o.sco_d_creation,
                DateUpdate = o.sco_d_update,
                UserCreator = new User
                              {
                                  Firstname = o.TM_USR_User.usr_firstname,
                                  Lastname = o.TM_USR_User.usr_lastname
                              },
                ScoComment = o.sco_comment,
            };
        }

        public static TM_SCO_Supplier_Contact EntityToRepository(SupplierContact _from, TM_SCO_Supplier_Contact _to, bool create = false)
        {
            _to.sco_id = _from.ScoId;
            _to.sco_firstname = _from.ScoFirstname ?? "";
            _to.sco_lastname = _from.ScoLastname ?? "";
            _to.civ_id = _from.CivId;
            _to.sco_ref = _from.ScoRef;
            _to.sco_adresse_title = _from.ScoAdresseTitle;
            _to.sco_address1 = _from.ScoAddress1;
            _to.sco_address2 = _from.ScoAddress2;

            _to.sco_postcode = _from.ScoPostcode;
            _to.sco_city = _from.ScoCity;

            _to.sco_country = _from.ScoCountry;
            _to.sco_tel1 = _from.ScoTel1;
            _to.sco_tel2 = _from.ScoTel2;
            _to.sco_fax = _from.ScoFax;
            _to.sco_cellphone = _from.ScoCellphone;
            _to.sco_email = _from.ScoEmail;
            _to.sco_recieve_newsletter = _from.ScoRecieveNewsletter;
            _to.sco_newsletter_email = _from.ScoNewsletterEmail;
            _to.sco_d_update = _from.DateUpdate;
            _to.sco_comment = _from.ScoComment;
            if (create)
            {
                _to.sup_id = _from.SupId;
                _to.usr_created_by = _from.UsrCreatedBy;
                _to.sco_d_creation = _from.DateCreation;
                _to.sco_ref = _from.ScoRef;
            }
            return _to;
        }
    }
}

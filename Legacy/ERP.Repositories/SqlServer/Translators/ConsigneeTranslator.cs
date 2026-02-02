using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ConsigneeTranslator
    {
        public static Expression<Func<TM_CON_CONSIGNEE, Consignee>> RepositoryToEntity()
        {
            return o => new Consignee
            {
                ConId = o.con_id,
                ConFirstname = o.con_firstname,
                ConLastname = o.con_lastname,
                CivId = o.civ_id,
                ConCode = o.con_code,
                ConAdresseTitle = o.con_adresse_title,
                ConAddress1 = o.con_address1,
                ConAddress2 = o.con_address2,
                ConAddress3 = o.con_address3,
                ConPostcode = o.con_postcode,
                ConCity = o.con_city,
                ConCountry = o.con_country,
                ConTel1 = o.con_tel1,
                ConTel2 = o.con_tel2,
                ConFax = o.con_fax,
                ConCellphone = o.con_cellphone,
                ConEmail = o.con_email,
                ConRecieveNewsletter = o.con_recieve_newsletter,
                ConNewsletterEmail = o.con_newsletter_email,
                ConIsDeliveryAdr = o.con_is_delivery_adr,
                ConIsInvoicingAdr = o.con_is_invoicing_adr,
                UsrCreatedBy = o.usr_created_by,
                Civility = new KeyValue { Value = o.TR_CIV_Civility != null ? o.TR_CIV_Civility.civ_designation : string.Empty },
                DateCreation = o.con_d_creation,
                DateUpdate = o.con_d_update,
                UserCreator = new User
                              {
                                  Firstname = o.TM_USR_User.usr_firstname,
                                  Lastname = o.TM_USR_User.usr_lastname
                              },
                ConComment = o.con_comment,
                ConCmuId = o.cmu_id,
                ConCompanyname = o.con_company_name
            };
        }

        public static TM_CON_CONSIGNEE EntityToRepository(Consignee _from, TM_CON_CONSIGNEE _to, bool create = false, bool updateExt = false)
        {
            //_to.con_id = _from.ConId;
            _to.con_firstname = _from.ConFirstname ?? "";
            _to.con_lastname = _from.ConLastname ?? "";
            _to.con_address1 = _from.ConAddress1;
            _to.con_address2 = _from.ConAddress2;
            _to.con_address3 = _from.ConAddress3;
            _to.con_postcode = _from.ConPostcode;
            _to.con_city = _from.ConCity;
            _to.cmu_id = _from.ConCmuId == 0 ? null : _from.ConCmuId;
            _to.con_country = _from.ConCountry;
            _to.con_tel1 = _from.ConTel1;
            if (!updateExt)
            {
                if (_from.CivId != 0)
                {
                    _to.civ_id = _from.CivId;
                }
                _to.con_code = _from.ConCode;
                _to.con_adresse_title = _from.ConAdresseTitle;
                _to.con_tel2 = _from.ConTel2;
                _to.con_recieve_newsletter = _from.ConRecieveNewsletter;
                _to.con_newsletter_email = _from.ConNewsletterEmail;
                _to.con_is_delivery_adr = _from.ConIsDeliveryAdr;
                _to.con_is_invoicing_adr = _from.ConIsInvoicingAdr;
                _to.con_comment = _from.ConComment;
            }
            else
            {
                //_to.con_adresse_title = _from.ConAdresseTitle;
                _to.con_tel2 = _from.ConTel2;
                _to.con_recieve_newsletter = _from.ConRecieveNewsletter;
                _to.con_newsletter_email = _from.ConNewsletterEmail;
                _to.con_is_delivery_adr = _from.ConIsDeliveryAdr;
                _to.con_is_invoicing_adr = _from.ConIsInvoicingAdr;
                _to.con_comment = _from.ConComment;
            }
            _to.con_fax = _from.ConFax;
            _to.con_cellphone = _from.ConCellphone;
            _to.con_email = _from.ConEmail;
            _to.con_d_update = _from.DateUpdate;
            if (create)
            {
                _to.usr_created_by = _from.UsrCreatedBy;
                _to.con_d_creation = _from.DateCreation;
                _to.con_code = _from.ConCode;
                _to.soc_id = _from.SocId;
            }
            _to.con_company_name = _from.ConCompanyname;
            return _to;
        }

        public static TM_CON_CONSIGNEE EntityToRepositoryFromPage(Consignee _from, TM_CON_CONSIGNEE _to)
        {
            _to.con_firstname = _from.ConFirstname ?? "";
            _to.con_lastname = _from.ConLastname ?? "";
            _to.con_address1 = _from.ConAddress1;
            _to.con_address2 = _from.ConAddress2;
            _to.con_postcode = _from.ConPostcode;
            _to.con_city = _from.ConCity;
            _to.cmu_id = _from.ConCmuId == 0 ? null : _from.ConCmuId;
            _to.con_country = _from.ConCountry;
            _to.con_tel1 = _from.ConTel1;
            _to.con_fax = _from.ConFax;
            _to.con_cellphone = _from.ConCellphone;
            _to.con_email = _from.ConEmail;
            _to.con_d_update = DateTime.Now;
            _to.con_company_name = _from.ConCompanyname;
            return _to;
        }
    }
}

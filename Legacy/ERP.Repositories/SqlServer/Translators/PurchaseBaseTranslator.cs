using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class PurchaseBaseTranslator
    {

        #region Purchase Intent

        public static Expression<Func<TM_PIN_Purchase_Intent, PurchaseBaseClass>> RepositoryToEntity()
        {
            return o => new PurchaseBaseClass
            {
                PinClosed = o.pin_closed,
                SocId = o.soc_id,
                PinName = o.pin_name,
                PinId = o.pin_id,
                PinCode = o.pin_code,
                InterComment = o.pin_inter_comment,
                SupplierComment = o.pin_supplier_comment,
                DateCreation = o.pin_d_creation,
                DateUpdate = o.pin_d_update,
                UsrId = o.pin_creator_id,
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                PinHasSupplierOrder = o.TM_SOD_Supplier_Order.Any(),
                SodCode = o.TM_SOD_Supplier_Order.Any() ? o.TM_SOD_Supplier_Order.FirstOrDefault().sod_code : string.Empty,
                SodId = o.TM_SOD_Supplier_Order.Any() ? o.TM_SOD_Supplier_Order.FirstOrDefault().sod_id : 0,
            };
        }

        public static TM_PIN_Purchase_Intent EntityToRepository(PurchaseBaseClass _from, TM_PIN_Purchase_Intent _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_PIN_Purchase_Intent();
            }
            _to.pin_name = _from.PinName;
            _to.pin_inter_comment = _from.InterComment;
            _to.pin_supplier_comment = _from.SupplierComment;
            _to.pin_d_update = _from.DateUpdate;
            _to.pin_closed = _from.PinClosed;
            if (create)
            {
                _to.pin_code = _from.PinCode;
                _to.soc_id = _from.SocId;
                _to.pin_creator_id = _from.UsrId;
                _to.pin_d_creation = _from.DateCreation;
            }
            return _to;
        }

        #endregion Purchase Intent

        #region Supplier Order

        public static Expression<Func<TM_SOD_Supplier_Order, PurchaseBaseClass>> RepositoryToEntitySod()
        {
            return o => new PurchaseBaseClass
            {
                SodId = o.sod_id,
                SocId = o.soc_id,
                PinName = o.pin_id.HasValue ? o.TM_PIN_Purchase_Intent.pin_name : string.Empty,
                PinCode = o.pin_id.HasValue ? o.TM_PIN_Purchase_Intent.pin_code : string.Empty,
                PinId = o.pin_id ?? 0,
                InterComment = o.sod_inter_comment,
                SupplierComment = o.sod_supplier_comment,
                DateCreation = o.sod_d_creation,
                DateUpdate = o.sod_d_update,
                UsrId = o.usr_creator_id,
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname,
                    Email = o.TM_USR_User.usr_email,
                    Cellphone = o.TM_USR_User.usr_cellphone,
                    Telephone = o.TM_USR_User.usr_tel
                },
                SodFile = o.sod_file,
                SodDiscountAMount = o.sod_discount_amount,
                ScoId = o.sco_id ?? 0,
                SupId = o.sup_id,
                CurId = o.cur_id,
                SodName = o.sod_name,
                SodCode = o.sod_code,
                VatId = o.vat_id,
                Supplier = o.TM_SUP_Supplier.sup_abbreviation ?? o.TM_SUP_Supplier.sup_company_name,
                Supplier2 = o.sub_sup_id.HasValue ? (o.TM_SUP_Supplier_1.sup_abbreviation ?? o.TM_SUP_Supplier_1.sup_company_name) : string.Empty,
                OneSupplier = new Supplier
                {
                    CompanyName = o.TM_SUP_Supplier.sup_company_name,
                    Reference = o.TM_SUP_Supplier.sup_ref,
                    Address1 = o.TM_SUP_Supplier.sup_address1,
                    Address2 = o.TM_SUP_Supplier.sup_address2,
                    Postcode = o.TM_SUP_Supplier.sup_postcode,
                    City = o.TM_SUP_Supplier.sup_city,
                    Country = o.TM_SUP_Supplier.sup_country,
                    Tel1 = o.TM_SUP_Supplier.sup_tel1,
                    Tel2 = o.TM_SUP_Supplier.sup_tel2,
                    Fax = o.TM_SUP_Supplier.sup_fax,
                    Cellphone = o.TM_SUP_Supplier.sup_cellphone,
                    Email = o.TM_SUP_Supplier.sup_email,
                    Abbreviation = o.TM_SUP_Supplier.sup_abbreviation
                },
                SupplierCompanyName = o.TM_SUP_Supplier.sup_company_name,
                TwoSupplier = new Supplier
                {
                    CompanyName = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_company_name : string.Empty,
                    Reference = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_ref : string.Empty,
                    Address1 = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_address1 : string.Empty,
                    Address2 = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_address2 : string.Empty,
                    Postcode = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_postcode : string.Empty,
                    City = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_city : string.Empty,
                    Country = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_country : string.Empty,
                    Tel1 = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_tel1 : string.Empty,
                    Tel2 = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_tel2 : string.Empty,
                    Fax = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_fax : string.Empty,
                    Cellphone = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_cellphone : string.Empty,
                    Email = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_email : string.Empty,
                    Abbreviation = o.sub_sup_id.HasValue ? o.TM_SUP_Supplier_1.sup_abbreviation : string.Empty,
                },
                SupplierContact = new SupplierContact
                {
                    ScoFirstname = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_firstname : string.Empty,
                    ScoLastname = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_lastname : string.Empty,
                    Civility = new KeyValue
                    {
                        Value = o.TM_SCO_Supplier_Contact != null ? (o.TM_SCO_Supplier_Contact.TR_CIV_Civility != null ? o.TM_SCO_Supplier_Contact.TR_CIV_Civility.civ_designation : string.Empty) : string.Empty
                    },
                    ScoAddress1 = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_address1 : string.Empty,
                    ScoAddress2 = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_address2 : string.Empty,
                    ScoPostcode = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_postcode : string.Empty,
                    ScoCity = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_city : string.Empty,
                    ScoCountry = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_country : string.Empty,
                    ScoTel1 = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_tel1 : string.Empty,
                    ScoTel2 = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_tel2 : string.Empty,
                    ScoFax = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_fax : string.Empty,
                    ScoCellphone = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_cellphone : string.Empty,
                    ScoEmail = o.TM_SCO_Supplier_Contact != null ? o.TM_SCO_Supplier_Contact.sco_email : string.Empty,
                },
                SupplierContact2 = new SupplierContact
                {
                    ScoFirstname =
                    o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_firstname : string.Empty)
                    : string.Empty,
                    ScoLastname =
                    o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_lastname : string.Empty) : string.Empty,
                    Civility = new KeyValue
                    {
                        Value =
                    o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().TR_CIV_Civility != null
                    ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().TR_CIV_Civility.civ_designation : string.Empty)
                    : string.Empty)
                    : string.Empty,
                    },
                    ScoAddress1 = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_address1 : string.Empty) : string.Empty,
                    ScoAddress2 = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_address2 : string.Empty) : string.Empty,
                    ScoPostcode = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_postcode : string.Empty) : string.Empty,
                    ScoCity = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_city : string.Empty) : string.Empty,
                    ScoCountry = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_country : string.Empty) : string.Empty,
                    ScoTel1 = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_tel1 : string.Empty) : string.Empty,
                    ScoTel2 = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_tel2 : string.Empty) : string.Empty,
                    ScoFax = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_fax : string.Empty) : string.Empty,
                    ScoCellphone = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_cellphone : string.Empty) : string.Empty,
                    ScoEmail = o.sub_sup_id.HasValue ?
                    (o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.Any() ? o.TM_SUP_Supplier_1.TM_SCO_Supplier_Contact.FirstOrDefault().sco_email : string.Empty) : string.Empty,
                },
                SodHasSin = o.TM_SIN_Supplier_Invoice.Any(),
                SinCode = o.TM_SIN_Supplier_Invoice.Any() ? o.TM_SIN_Supplier_Invoice.FirstOrDefault().sin_code : string.Empty,
                SinId = o.TM_SIN_Supplier_Invoice.Any() ? o.TM_SIN_Supplier_Invoice.FirstOrDefault().sin_id : 0,
                Guid = o.sod_guid,
                Paid = o.sod_paid ?? 0,
                Need2Pay = o.sod_need2pay ?? 0,
                TotalAmountHt = o.sod_total_ht ?? 0,
                TotalAmountTtc = o.sod_total_ttc ?? 0,
                SubSupId = o.sub_sup_id ?? 0,
                SodNeedSend = o.sod_need_send ?? false,
                SodFinish = o.sod_finish ?? false,
                SodSupNbr = o.sod_sup_nbr,
                UsrComId = o.usr_com_id,
                Commercial = o.usr_com_id.HasValue ? (o.TM_USR_User_1.usr_firstname + " " + o.TM_USR_User_1.usr_lastname) : string.Empty,
                CurrencySymbol = o.TR_CUR_Currency.cur_symbol,
                CinId = o.cin_id,
                SodClient = o.soc_client,
                CliId = o.cli_id,
                Client = o.cli_id.HasValue ? o.TM_CLI_CLient.cli_company_name : string.Empty,
                CliAbbr = o.cli_id.HasValue ? o.TM_CLI_CLient.cli_abbreviation : string.Empty,
                IsStarted = o.sod_started,
                StartTime = o.sod_started_time,
                IsCanceled = o.sod_canceled,
                CanceledTime = o.sod_canceled_time,
                CliShowDetail = o.TM_CLI_CLient.cli_showdetail ?? false,
                DateExpDelivery = o.sod_d_exp_delivery,
                SttId = o.stt_id ?? 0
            };
        }

        public static Expression<Func<TM_SOD_Supplier_Order, PurchaseBaseClass>> RepositoryToEntitySodLite()
        {
            return o => new PurchaseBaseClass
            {
                SodId = o.sod_id,
                SocId = o.soc_id,
                InterComment = o.sod_inter_comment,
                SupplierComment = o.sod_supplier_comment,
                DateCreation = o.sod_d_creation,
                DateUpdate = o.sod_d_update,
                UsrId = o.usr_creator_id,
                ScoId = o.sco_id ?? 0,
                SupId = o.sup_id,
                CurId = o.cur_id,
                SodName = o.sod_name,
                SodCode = o.sod_code,
                VatId = o.vat_id,
                Supplier = o.TM_SUP_Supplier.sup_abbreviation ?? o.TM_SUP_Supplier.sup_company_name,
                Supplier2 = o.sub_sup_id.HasValue ? (o.TM_SUP_Supplier_1.sup_abbreviation ?? o.TM_SUP_Supplier_1.sup_company_name) : string.Empty,
                SupplierCompanyName = o.TM_SUP_Supplier.sup_company_name,
                Guid = o.sod_guid,
                Paid = o.sod_paid ?? 0,
                Need2Pay = o.sod_need2pay ?? 0,
                TotalAmountHt = o.sod_total_ht ?? 0,
                TotalAmountTtc = o.sod_total_ttc ?? 0,
                SubSupId = o.sub_sup_id ?? 0,
                SodSupNbr = o.sod_sup_nbr,
                UsrComId = o.usr_com_id,
                Commercial = o.usr_com_id.HasValue ? (o.TM_USR_User_1.usr_firstname + " " + o.TM_USR_User_1.usr_lastname) : string.Empty,
                CurrencySymbol = o.TR_CUR_Currency.cur_symbol,
                CinId = o.cin_id,
                SodClient = o.soc_client,
                CliId = o.cli_id,
                Client = o.cli_id.HasValue ? o.TM_CLI_CLient.cli_company_name : string.Empty,
                CliAbbr = o.cli_id.HasValue ? o.TM_CLI_CLient.cli_abbreviation : string.Empty,
                SttId = o.stt_id ?? 0
            };
        }

        public static TM_SOD_Supplier_Order EntityToRepository(PurchaseBaseClass _from, TM_SOD_Supplier_Order _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_SOD_Supplier_Order();
            }
            _to.sod_name = _from.SodName;
            _to.sod_inter_comment = _from.InterComment;
            _to.sod_supplier_comment = _from.SupplierComment;
            _to.sod_d_update = _from.DateUpdate;
            _to.sco_id = _from.ScoId <= 0 ? (int?)null : _from.ScoId;
            _to.cur_id = _from.CurId;
            _to.sup_id = _from.SupId;
            _to.vat_id = _from.VatId;
            _to.sub_sup_id = _from.SubSupId <= 0 ? (int?)null : _from.SubSupId;
            if (create)
            {
                _to.sod_code = _from.SodCode;
                _to.soc_id = _from.SocId;
                _to.usr_creator_id = _from.UsrId;
                _to.sod_d_creation = _from.DateCreation;
                _to.pin_id = _from.PinId == 0 ? (int?)null : _from.PinId;
                _to.sod_guid = Guid.NewGuid();
            }
            if (_to.sod_canceled == true && _from.IsCanceled == false)
            {
                _to.sod_canceled = false;
                _to.sod_canceled_time = null;
            }
            else if ((_to.sod_canceled == false || !_to.sod_canceled.HasValue) && _from.IsCanceled == true)
            {
                _to.sod_canceled = true;
                _to.sod_canceled_time = DateTime.Now;
            }
            if (_to.sod_started == true && _from.IsStarted == false)
            {
                _to.sod_started = false;
                _to.sod_started_time = null;
            }
            _to.sod_finish = _from.SodFinish;
            _to.sod_need_send = _from.SodNeedSend;
            _to.sod_sup_nbr = _from.SodSupNbr;
            _to.usr_com_id = _from.UsrComId.HasValue ? (_from.UsrComId == 0 ? null : _from.UsrComId) : null;
            _to.soc_client = _from.SodClient;
            _to.cli_id = _from.CliId == 0 ? (int?)null : _from.CliId;
            _to.sod_d_exp_delivery = _from.DateExpDelivery;
            _to.stt_id = _from.SttId == 0 ? (int?)null : _from.SttId;
            return _to;
        }

        #endregion Supplier Order

        #region Supplier Invoice

        public static Expression<Func<TM_SIN_Supplier_Invoice, PurchaseBaseClass>> RepositoryToEntitySin()
        {
            return o => new PurchaseBaseClass
            {
                SinId = o.sin_id,
                SocId = o.soc_id,
                SodName = o.sod_id.HasValue ? o.TM_SOD_Supplier_Order.sod_name : string.Empty,
                SodCode = o.sod_id.HasValue ? o.TM_SOD_Supplier_Order.sod_code : string.Empty,
                SodId = o.sod_id ?? 0,
                InterComment = o.sin_inter_comment,
                SupplierComment = o.sin_supplier_comment,
                DateCreation = o.sin_d_creation,
                DateUpdate = o.sin_d_update,
                UsrId = o.usr_creator_id,
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                SinFile = o.sin_file,
                SinDiscountAmount = o.sin_discount_amount,
                ScoId = o.sco_id ?? 0,
                SupId = o.sup_id,
                CurId = o.cur_id,
                SinName = o.sin_name,
                SinCode = o.sin_code,
                VatId = o.vat_id,
                //Supplier = o.TM_SUP_Supplier.sup_company_name,
                OneSupplier = new Supplier
                {
                    CompanyName = o.TM_SUP_Supplier.sup_company_name,
                    Reference = o.TM_SUP_Supplier.sup_ref,
                    Address1 = o.TM_SUP_Supplier.sup_address1,
                    Address2 = o.TM_SUP_Supplier.sup_address2,
                    Postcode = o.TM_SUP_Supplier.sup_postcode,
                    City = o.TM_SUP_Supplier.sup_city,
                    Country = o.TM_SUP_Supplier.sup_country,
                    Tel1 = o.TM_SUP_Supplier.sup_tel1,
                    Tel2 = o.TM_SUP_Supplier.sup_tel2,
                    Fax = o.TM_SUP_Supplier.sup_fax,
                    Cellphone = o.TM_SUP_Supplier.sup_cellphone,
                    Email = o.TM_SUP_Supplier.sup_email,
                    Abbreviation = o.TM_SUP_Supplier.sup_abbreviation
                },
                SupplierContact = new SupplierContact
                {
                    ScoFirstname = o.TM_SCO_Supplier_Contact.sco_firstname,
                    ScoLastname = o.TM_SCO_Supplier_Contact.sco_lastname,
                    Civility = new KeyValue { Value = o.TM_SCO_Supplier_Contact.TR_CIV_Civility != null ? o.TM_SCO_Supplier_Contact.TR_CIV_Civility.civ_designation : string.Empty },
                },
                SinDateStartProduction = o.sin_d_start_production,
                SinDateCompleteProductionPlanned = o.sin_d_complete_production_pre,
                SinDateCompleteProduction = o.sin_d_complete_production,
                SinIsPaid = o.sin_is_paid,
                SinBankReceiptFile = o.sin_bank_receipt_file,
                SinBankReceiptNumber = o.sin_bank_receipt_number,
                SinCompleteProduction = o.sin_complete_production,
                SinStartProduction = o.sin_start_production,
                BacId = o.bac_id,
            };
        }

        public static TM_SIN_Supplier_Invoice EntityToRepository(PurchaseBaseClass _from, TM_SIN_Supplier_Invoice _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_SIN_Supplier_Invoice();
            }
            _to.sin_name = _from.SinName;
            _to.sin_inter_comment = _from.InterComment;
            _to.sin_supplier_comment = _from.SupplierComment;
            _to.sin_d_update = _from.DateUpdate;
            _to.sco_id = _from.ScoId;
            _to.cur_id = _from.CurId;
            _to.sup_id = _from.SupId;
            _to.vat_id = _from.VatId;
            //_to.bac_id = _from.BacId;
            _to.bac_id = _from.BacId == 0 ? null : _from.BacId;
            _to.sin_d_start_production = _from.SinDateStartProduction ?? null;
            _to.sin_d_complete_production_pre = _from.SinDateCompleteProductionPlanned ?? null;
            _to.sin_d_complete_production = _from.SinDateCompleteProduction ?? null;
            _to.sin_bank_receipt_number = _from.SinBankReceiptNumber;
            _to.sin_complete_production = _from.SinCompleteProduction;
            _to.sin_is_paid = _from.SinIsPaid;
            _to.sin_start_production = _from.SinStartProduction;
            if (create)
            {
                _to.sin_code = _from.SinCode;
                _to.soc_id = _from.SocId;
                _to.usr_creator_id = _from.UsrId;
                _to.sin_d_creation = _from.DateCreation;
                _to.sod_id = _from.SodId == 0 ? (int?)null : _from.SodId;
            }
            return _to;
        }

        #endregion Supplier Invoice

    }
}

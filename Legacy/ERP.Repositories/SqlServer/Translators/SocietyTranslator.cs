using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class SocietyTranslator
    {
        public static Expression<Func<TR_SOC_Society, Society>> RepositoryToEntity()
        {
            return o => new Society
                        {
                            Id = o.soc_id,
                            Society_Name = o.soc_society_name,
                            Is_Active = o.soc_is_actived,
                            Cur_Id = o.cur_id,
                            Lng_Id = o.lng_id,
                            Currency = new KeyValue
                            {
                                Value = o.TR_CUR_Currency.cur_designation
                            },
                            Language = new KeyValue
                            {
                                Value = o.TR_LNG_Language.lng_label
                            },
                            DateBegin = o.soc_datebegin,
                            DateEnd = o.soc_dateend,
                            DateClientBegin = o.soc_client_datebegin,
                            DateClientEnd = o.soc_client_dateend,
                            //DateOrderBegin = o.soc_date,
                            //DateOrderEnd = o.DateOrderEnd,
                            Email_Auto = o.soc_email_auto,
                            Capital = o.soc_capital,
                            ShortLabel = o.soc_short_label,
                            RibName = o.soc_rib_name,
                            RibAddress = o.soc_rib_address,
                            RibCodeIban = o.soc_rib_code_iban,
                            RibCodeBic = o.soc_rib_code_bic,
                            MaskCommission = o.soc_mask_commission ?? false,
                            Address1 = o.soc_address1,
                            Address2 = o.soc_address2,
                            Telephone = o.soc_tel,
                            Fax = o.soc_fax,
                            PostCode = o.soc_postcode,
                            City = o.soc_city,
                            Country = o.soc_county,
                            Siret = o.soc_siret,
                            RCS = o.soc_rcs,
                            Cellphone = o.soc_cellphone,
                            Email = o.soc_email,
                            TvaIntra = o.soc_tva_intra,
                            Site = o.soc_site,
                            RibBankCode = o.soc_rib_bank_code,
                            RibAgenceCode = o.soc_rib_agence_code,
                            RibAccountNumber = o.soc_rib_account_number,
                            RibKey = o.soc_rib_key,
                            RibDomiciliationAgency = o.soc_rib_domiciliation_agency,
                            DpUpd = o.soc_dp_upd,
                            Cnss = o.soc_cnss,
                            TaxePro = o.soc_taxe_pro,
                            IsPrdMandatory = o.soc_is_prd_mandatory ?? false,
                            RibAbre = o.soc_rib_abbre,
                            RibAbre2 = o.soc_rib_abbre_2,
                            RibName2 = o.soc_rib_name_2,
                            RibAddress2 = o.soc_rib_address_2,
                            RibCodeIban2 = o.soc_rib_code_iban_2,
                            RibCodeBic2 = o.soc_rib_code_bic_2,
                            RibBankCode2 = o.soc_rib_bank_code_2,
                            RibAgenceCode2 = o.soc_rib_agence_code_2,
                            RibAccountNumber2 = o.soc_rib_account_number_2,
                            RibKey2 = o.soc_rib_key_2,
                            RibDomiciliationAgency2 = o.soc_rib_domiciliation_agency_2,
                            ShowLanguageBar = o.soc_show_language_bar ?? false,
                            SocCinLgs = o.soc_cin_lgs ?? false

                        };
        }

        public static TR_SOC_Society EntityToRepository(Society _from, TR_SOC_Society _to, bool create = false)
        {
            _to.soc_society_name = _from.Society_Name;
            _to.cur_id = _from.Cur_Id;
            _to.lng_id = _from.Lng_Id;
            if (false)
            {
                _to.soc_is_actived = _from.Is_Active;
                _to.soc_datebegin = _from.DateBegin;
                _to.soc_dateend = _from.DateEnd;
                _to.soc_client_datebegin = _from.DateClientBegin;
                _to.soc_client_dateend = _from.DateClientEnd;
            }
            _to.soc_mask_commission = _from.MaskCommission;
            _to.soc_email_auto = _from.Email_Auto;
            _to.soc_capital = _from.Capital;
            _to.soc_short_label = _from.ShortLabel;
            _to.soc_rib_name = _from.RibName;
            _to.soc_rib_address = _from.RibAddress;
            _to.soc_rib_code_iban = _from.RibCodeIban;
            _to.soc_rib_code_bic = _from.RibCodeBic;
            _to.soc_address1 = _from.Address1;
            _to.soc_address2 = _from.Address2;
            _to.soc_tel = _from.Telephone;
            _to.soc_fax = _from.Fax;
            _to.soc_postcode = _from.PostCode;
            _to.soc_city = _from.City;
            _to.soc_county = _from.Country;
            _to.soc_siret = _from.Siret;
            _to.soc_rcs = _from.RCS;
            _to.soc_cellphone = _from.Cellphone;
            _to.soc_email = _from.Email;
            _to.soc_tva_intra = _from.TvaIntra;
            _to.soc_site = _from.Site;
            _to.soc_rib_bank_code = _from.RibBankCode;
            _to.soc_rib_agence_code = _from.RibAgenceCode;
            _to.soc_rib_account_number = _from.RibAccountNumber;
            _to.soc_rib_key = _from.RibKey;
            _to.soc_rib_domiciliation_agency = _from.RibDomiciliationAgency;
            _to.soc_cnss = _from.Cnss;
            _to.soc_taxe_pro = _from.TaxePro;
            _to.soc_is_prd_mandatory = _from.IsPrdMandatory;

            _to.soc_rib_abbre = _from.RibAbre;

            _to.soc_rib_abbre_2 = _from.RibAbre2;
            _to.soc_rib_name_2 = _from.RibName2;
            _to.soc_rib_address_2 = _from.RibAddress2;
            _to.soc_rib_code_iban_2 = _from.RibCodeIban2;
            _to.soc_rib_code_bic_2 = _from.RibCodeBic2;
            _to.soc_rib_bank_code_2 = _from.RibBankCode2;
            _to.soc_rib_agence_code_2 = _from.RibAgenceCode2;
            _to.soc_rib_account_number_2 = _from.RibAccountNumber2;
            _to.soc_rib_key_2 = _from.RibKey2;
            _to.soc_rib_domiciliation_agency_2 = _from.RibDomiciliationAgency2;
            _to.soc_show_language_bar = _from.ShowLanguageBar;
            _to.soc_cin_lgs = _from.SocCinLgs;

            return _to;
        }
    }
}

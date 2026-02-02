using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class BankAccountTranslator
    {
        public static Expression<Func<TR_BAC_Bank_Account, BankAccount>> RepositoryToEntity()
        {
            return o => new BankAccount
            {
                Id = o.bac_id,
                FgId = o.f_id,
                BankName = o.bac_bank_name,
                BankAdr = o.bac_bank_adr,
                AccountNumber = o.bac_account_number,
                Bic = o.bac_bic,
                Iban = o.bac_iban,
                RibBankCode = o.bac_rib_bank_code,
                RibAgenceCode = o.bac_rib_agence_code,
                RibAccountNumber = o.bac_rib_account_number,
                RibKey = o.bac_rib_key,
                AccountOwner = o.bac_account_owner,
                SocId = o.soc_id,
                RibAgencyAdr = o.bac_rib_agency_adr,
                RibTitle = o.bac_title
            };
        }

        public static TR_BAC_Bank_Account EntityToRepository(BankAccount _from, TR_BAC_Bank_Account _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TR_BAC_Bank_Account();
            }
            if (create)
            {
                _to.bac_type = _from.TypeId;
                _to.soc_id = _from.SocId;
                _to.f_id = _from.FgId;
            }
            _to.bac_bank_name = _from.BankName;
            _to.bac_bank_adr = _from.BankAdr;
            _to.bac_account_number = _from.AccountNumber;
            _to.bac_bic = _from.Bic;
            _to.bac_iban = _from.Iban;
            _to.bac_rib_bank_code = _from.RibBankCode;
            _to.bac_rib_agence_code = _from.RibAgenceCode;
            _to.bac_rib_account_number = _from.RibAccountNumber;
            _to.bac_rib_key = _from.RibKey;
            _to.bac_account_owner = _from.AccountOwner;
            _to.bac_rib_agency_adr = _from.RibAgencyAdr;
            _to.bac_title = _from.RibTitle;
            return _to;
        }
    }
}

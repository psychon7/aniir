using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class BankAccountRepository : BaseSqlServerRepository
    {
        #region For Supplier
        public int CreateUpdateBankAccount(BankAccount oneBankAccount)
        {
            int _id = 0;
            bool create = false;
            if (oneBankAccount.Id != 0)
            {
                var cli = _db.TR_BAC_Bank_Account.FirstOrDefault(m => m.bac_id == oneBankAccount.Id);
                if (cli != null)
                {
                    cli = BankAccountTranslator.EntityToRepository(oneBankAccount, cli);
                    _db.TR_BAC_Bank_Account.ApplyCurrentValues(cli);
                    _db.SaveChanges();
                    _id = cli.bac_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                create = true;
            }
            if (create)
            {
                var newBankAccount = new TR_BAC_Bank_Account();
                newBankAccount = BankAccountTranslator.EntityToRepository(oneBankAccount, newBankAccount, true);
                _db.TR_BAC_Bank_Account.AddObject(newBankAccount);
                _db.SaveChanges();
                _id = newBankAccount.bac_id;
            }
            return _id;
        }
        public BankAccount LoadBankAccountById(int socId, int bacId)
        {
            var aBankAccount = _db.TR_BAC_Bank_Account.Where(m => m.soc_id == socId && m.bac_id == bacId).Select(BankAccountTranslator.RepositoryToEntity()).FirstOrDefault();
            if (aBankAccount != null)
            {
                aBankAccount.FId = StringCipher.EncoderSimple(aBankAccount.Id.ToString(), "bacId");
            }
            return aBankAccount;
        }
        public List<BankAccount> LoadAllBankAccount(int socId, int typeId, int fId)
        {
            var clis = _db.TR_BAC_Bank_Account.Where(m => m.soc_id == socId && m.bac_type == typeId && m.f_id == fId).Select(BankAccountTranslator.RepositoryToEntity())
                .OrderBy(m => m.BankName).OrderBy(m => m.RibTitle).ToList();
            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "bacId");
            }
            return clis;
        }
        public bool DeleteBankAccount(BankAccount oneBankAccount)
        {
            int socId = oneBankAccount.SocId;
            int typeId = oneBankAccount.TypeId;
            int fId = oneBankAccount.FgId ?? 0;
            int bacId = oneBankAccount.Id;
            bool deleted = false;
            var bac = _db.TR_BAC_Bank_Account.FirstOrDefault(m => m.soc_id == socId && m.bac_type == typeId && m.f_id == fId && m.bac_id == bacId);
            if (bac != null)
            {
                try
                {
                    _db.TR_BAC_Bank_Account.DeleteObject(bac);
                    _db.SaveChanges();
                    deleted = true;
                }
                catch (Exception)
                {
                }
            }
            return deleted;
        }
        #endregion For Supplier
    }
}

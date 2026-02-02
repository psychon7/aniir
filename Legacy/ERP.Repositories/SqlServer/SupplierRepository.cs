using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;
using System.Configuration;

namespace ERP.Repositories.SqlServer
{
    public class SupplierRepository : BaseSqlServerRepository
    {
        public int CreateUpdateSupplier(Supplier oneSupplier)
        {
            int supId = 0;
            bool create = false;
            if (oneSupplier.Id != 0)
            {
                var cli = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_id == oneSupplier.Id);
                if (cli != null)
                {
                    cli = SupplierTranslator.EntityToRepository(oneSupplier, cli);
                    _db.TM_SUP_Supplier.ApplyCurrentValues(cli);
                    _db.SaveChanges();
                    supId = cli.sup_id;
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
                var newSupplier = new TM_SUP_Supplier();
                var lastSupplier = _db.TM_SUP_Supplier.Where(m => m.soc_id == oneSupplier.SocId
                    && m.sup_d_creation.Year == oneSupplier.DateCreation.Year
                    && m.sup_d_creation.Month == oneSupplier.DateCreation.Month).OrderByDescending(m => m.sup_ref).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastSupplier != null)
                {
                    lastRef = lastSupplier.sup_ref;
                }
                string pref = GetCodePref(10);
                // create suplogin and password
                //var aGuid = Guid.NewGuid().ToString().Split('-')[1];
                //oneSupplier.SupLogin = string.Format("ext-{0}", aGuid).ToLower();
                //var pwdGuid = Guid.NewGuid().ToString().Substring(0, 8);
                //oneSupplier.SupPwd = StringCipher.Encrypt(pwdGuid, oneSupplier.SupLogin);
                oneSupplier.Reference = GetGeneralRefContinuation(oneSupplier.DateCreation, pref, lastRef, _codeType, 0);
                newSupplier = SupplierTranslator.EntityToRepository(oneSupplier, newSupplier, true);
                try
                {
                    _db.TM_SUP_Supplier.AddObject(newSupplier);
                    _db.SaveChanges();
                }
                catch (Exception)
                {
                }
                supId = newSupplier.sup_id;
                if (supId > 0)
                {
                    //20201026 create default sco
                    var sco = new SupplierContact()
                    {
                        ScoFirstname = "Default",
                        ScoLastname = "",
                        ScoAdresseTitle = "Default",
                        CivId = 1,
                        ScoAddress1 = newSupplier.sup_address1,
                        ScoAddress2 = newSupplier.sup_address2,
                        ScoPostcode = newSupplier.sup_postcode,
                        ScoCity = newSupplier.sup_city,
                        ScoCountry = newSupplier.sup_country,
                        ScoTel1 = newSupplier.sup_tel1,
                        ScoTel2 = newSupplier.sup_tel2,
                        ScoFax = newSupplier.sup_fax,
                        ScoEmail = newSupplier.sup_email,
                        ScoNewsletterEmail = newSupplier.sup_newsletter_email,
                        SupId = supId,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = newSupplier.usr_created_by
                    };
                    SupplierContactRepository SupplierContactRepository = new SupplierContactRepository();
                    SupplierContactRepository.CreateUpdateSupplierContact(sco);
                }
            }
            return supId;
        }

        public int CheckSupplierExisted(int socId, int supId, string companyName)
        {
            var oneSupplier = _db.TM_SUP_Supplier.FirstOrDefault(m => m.soc_id == socId && m.sup_company_name == companyName && (supId == 0 || m.sup_id != supId));
            return oneSupplier == null ? 0 : 1;
        }

        public Supplier LoadSupplierById(int cliId)
        {
            var aSupplier = _db.TM_SUP_Supplier.Where(m => m.sup_id == cliId).Select(SupplierTranslator.RepositoryToEntity()).FirstOrDefault();
            if (aSupplier != null)
            {
                aSupplier.FId = StringCipher.EncoderSimple(aSupplier.Id.ToString(), "supId");
            }
            return aSupplier;
        }

        public List<Supplier> SearchSupplier(Supplier searchSupplier)
        {
            var clis = _db.TM_SUP_Supplier.Where(m =>
                m.soc_id == searchSupplier.SocId
                && (string.IsNullOrEmpty(searchSupplier.CompanyName.Trim()) || m.sup_company_name.Contains(searchSupplier.CompanyName.Trim()) || m.sup_abbreviation.Contains(searchSupplier.CompanyName.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.Reference.Trim()) || m.sup_ref.Contains(searchSupplier.Reference.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.Email.Trim()) || m.sup_email.Contains(searchSupplier.Email.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.Postcode.Trim()) || m.sup_postcode.Contains(searchSupplier.Postcode.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.City.Trim()) || m.sup_city.Contains(searchSupplier.City.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.Tel1.Trim()) || m.sup_tel1.Contains(searchSupplier.Tel1.Trim()))
                && (string.IsNullOrEmpty(searchSupplier.Tel2.Trim()) || m.sup_tel2.Contains(searchSupplier.Tel2.Trim()))
                && (searchSupplier.SuperRight || m.usr_created_by == searchSupplier.UsrCreatedBy)
                ).Select(SupplierTranslator.RepositoryToEntity()).OrderBy(m => m.CompanyName).ToList();


            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "supId");
            }
            return clis;
        }

        public List<Supplier> GetAllSupplier(int socId, int styId = 0)
        {
            var clis = _db.TM_SUP_Supplier.Where(m => m.soc_id == socId && (styId == 0 || m.sty_id == styId)).Select(SupplierTranslator.RepositoryToEntity()).OrderBy(m => m.CompanyName).ToList();
            foreach (var item in clis)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "supId");
            }
            return clis;
        }

        public bool DeleteSupplier(int socId, int supId)
        {
            bool deleted = false;
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_id == supId && m.soc_id == socId);
            if (sup != null)
            {
                var clientInusr = _db.TM_SOD_Supplier_Order.Any(m => m.soc_id == socId && m.sup_id == supId) ||
                                  _db.TM_SIN_Supplier_Invoice.Any(m => m.soc_id == socId && m.sup_id == supId) ||
                                  _db.TM_LGS_Logistic.Any(m => m.soc_id == socId && m.sup_id == supId) ||
                                  _db.TR_SPR_Supplier_Product.Any(m => m.soc_id == socId && m.sup_id == supId);
                if (!clientInusr)
                {
                    var ccos = _db.TM_SCO_Supplier_Contact.Where(m => m.sup_id == supId && m.TM_SUP_Supplier.soc_id == socId).ToList();

                    try
                    {
                        foreach (var cco in ccos)
                        {
                            _db.TM_SCO_Supplier_Contact.DeleteObject(cco);
                        }
                        _db.SaveChanges();
                        _db.TM_SUP_Supplier.DeleteObject(sup);
                        _db.SaveChanges();

                        deleted = true;
                    }
                    catch (Exception)
                    {
                        deleted = false;
                    }
                }
            }
            return deleted;
        }

        public List<Supplier> GetSupplierByKeyword(int socId, string keyword)
        {
            keyword = keyword.Trim();
            var sups = _db.TM_SUP_Supplier.Where(m =>
                m.soc_id == socId
                &&
                (string.IsNullOrEmpty(keyword) ||
                 m.sup_company_name.Contains(keyword) || m.sup_ref.Contains(keyword)
                 || m.sup_abbreviation.Contains(keyword))
                ).Select(SupplierTranslator.RepositoryToEntity()).OrderBy(m => m.CompanyName).Skip(0).Take(15).ToList();

            foreach (var item in sups)
            {
                item.FId = StringCipher.EncoderSimple(item.Id.ToString(), "supId");
            }
            return sups;
        }

        /// <summary>
        /// 此方法是project, cost plan, Supplier order, order, invoice 等页面自动创建Supplier的功能, 同时自动创建一个默认的联系人，此联系人是invoice和delivery的联系人
        /// </summary>
        /// <returns></returns>
        public int CreateSupplierAutomatical(Supplier oneSupplier)
        {
            // create Supplier
            int supId = CreateUpdateSupplier(oneSupplier);
            var oneSco = new SupplierContact
            {
                ScoAdresseTitle = "Default Contact",
                SupId = supId,
                SocId = oneSupplier.SocId,
                ScoAddress1 = oneSupplier.Address1,
                ScoAddress2 = oneSupplier.Address2,
                ScoCellphone = oneSupplier.Cellphone,
                ScoCity = oneSupplier.City,
                ScoCountry = oneSupplier.Country,
                ScoEmail = oneSupplier.Email,
                ScoFax = oneSupplier.Fax,
                ScoFirstname = "Default",
                ScoLastname = "Contact",
                ScoNewsletterEmail = oneSupplier.NewsletterEmail,
                ScoRecieveNewsletter = oneSupplier.RecieveNewsletter,
                ScoPostcode = oneSupplier.Postcode,
                ScoTel1 = oneSupplier.Tel1,
                ScoTel2 = oneSupplier.Tel2,
                CivId = 1,
                DateCreation = oneSupplier.DateCreation,
                DateUpdate = oneSupplier.DateUpdate,
                UsrCreatedBy = oneSupplier.UsrCreatedBy
            };
            SupplierContactRepository contactSupplierRepository = new SupplierContactRepository();
            contactSupplierRepository.CreateUpdateSupplierContact(oneSco);
            return supId;
        }

        public int CreateSupLogin(int socId, int supId)
        {
            int sup_id = 0;
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == supId && l.soc_id == socId);
            if (sup != null)
            {
                // create suplogin and password
                if (string.IsNullOrEmpty(sup.sup_login))
                {
                    var aGuid = Guid.NewGuid().ToString().Split('-')[1];
                    var login = string.Format("ext-{0}", aGuid).ToLower();
                    sup.sup_login = login;
                    var pwdGuid = Guid.NewGuid().ToString().Substring(0, 8);
                    sup.sup_password = StringCipher.Encrypt(pwdGuid, login);
                    _db.TM_SUP_Supplier.ApplyCurrentValues(sup);
                    _db.SaveChanges();
                }
                sup_id = sup.sup_id;
            }
            return sup_id;
        }

        public string GetSupPwd(int socId, int supId)
        {
            string res = string.Empty;
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(l => l.sup_id == supId && l.soc_id == socId);
            if (sup != null)
            {
                try
                {
                    if (string.IsNullOrEmpty(sup.sup_password))
                    {
                        CreateSupLogin(socId, supId);
                    }
                    res = StringCipher.Decrypt(sup.sup_password, sup.sup_login);
                }
                catch (Exception)
                {

                }
            }
            return res;
        }

        #region Supplier Type

        public List<KeyValue> GetSupplierType()
        {
            var stys = _db.TR_STY_Supplier_Type.Select(m => new KeyValue
                                                            {
                                                                Key = m.sty_id,
                                                                Value = m.sty_description
                                                            }).OrderBy(m => m.Value).ToList();
            return stys;
        }

        #endregion Supplier Type


        public Supplier SupplierLogin(string login, string pwd)
        {
            Supplier oneSupplier = null;
            login = login.Trim().ToLower();
            var usr = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_login == login);
            if (usr != null)
            {
                string password = StringCipher.Decrypt(usr.sup_password, login);
                if (password == pwd)
                {
                    oneSupplier = SupplierTranslator.RepositoryToEntity().Compile().Invoke(usr);
                    oneSupplier.LoginMode = 0;
                }
            }
            return oneSupplier;
        }
    }
}


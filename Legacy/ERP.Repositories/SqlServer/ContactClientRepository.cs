using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class ContactClientRepository : BaseSqlServerRepository
    {
        public ContactClient CreateUpdateContactClient(ContactClient contactClient, bool updateExt = false)
        {
            int ccoId = 0;
            bool create = false;
            if (contactClient.CcoCmuId == 0 || contactClient.CcoCmuId == null)
            {
                contactClient.CcoCmuId = CheckCommune(contactClient.CcoPostcode, contactClient.CcoCity);
            }
            if (contactClient.CcoId != 0)
            {
                var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cco_id == contactClient.CcoId);
                if (cco != null)
                {
                    cco = ContactClientTranslator.EntityToRepository(contactClient, cco, updateExt: updateExt);
                    _db.TM_CCO_Client_Contact.ApplyCurrentValues(cco);
                    _db.SaveChanges();
                    UpdateAllClientContact(contactClient);
                    ccoId = cco.cco_id;
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
                var newcco = new TM_CCO_Client_Contact();
                if (contactClient.DateCreation.Year < 1900)
                {
                    contactClient.DateCreation = DateTime.Now;

                }
                if (contactClient.CivId == 0)
                {
                    contactClient.CivId = 1;
                }
                if (string.IsNullOrEmpty(contactClient.CcoAdresseTitle))
                {
                    //contactClient.CcoAdresseTitle = "Default";
                    contactClient.CcoAdresseTitle = contactClient.CcoIsDeliveryAdr && contactClient.CcoIsInvoicingAdr ? "Adresse Fac & Liv" : (contactClient.CcoIsDeliveryAdr && !contactClient.CcoIsInvoicingAdr ? "Adresse Livraison" : (!contactClient.CcoIsDeliveryAdr && contactClient.CcoIsInvoicingAdr ? "Adresse Facturation" : ""));
                    if (string.IsNullOrEmpty(contactClient.CcoAdresseTitle))
                    {
                        contactClient.CcoIsDeliveryAdr = contactClient.CcoIsInvoicingAdr = true;
                        contactClient.CcoAdresseTitle = "Adresse Fac & Liv";
                    }
                }
                var lastcco = _db.TM_CCO_Client_Contact.Where(m => m.TM_CLI_CLient.soc_id == contactClient.SocId
                    && m.cco_d_creation.Year == contactClient.DateCreation.Year
                    && m.cco_d_creation.Month == contactClient.DateCreation.Month).OrderByDescending(m => m.cco_ref).FirstOrDefault();
                var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == contactClient.CliId);
                string lastRef = string.Empty;
                if (lastcco != null)
                {
                    lastRef = lastcco.cco_ref;
                }
                string pref = GetCodePref(12);
                contactClient.CcoRef = GetGeneralRefContinuation(contactClient.DateCreation, pref, lastRef, _codeType, cli.cli_id);
                newcco = ContactClientTranslator.EntityToRepository(contactClient, newcco, true);
                if (newcco.cmu_id == null)
                {
                    if (newcco.cco_city == cli.cli_city)
                    {
                        newcco.cmu_id = cli.cmu_id;
                    }
                }
                _db.TM_CCO_Client_Contact.AddObject(newcco);

                _db.SaveChanges();

                ccoId = newcco.cco_id;
            }
            contactClient.CcoId = ccoId;
            return contactClient;
        }

        public ContactClient LoadContactClientByCcoId(int ccoId)
        {
            var acco = _db.TM_CCO_Client_Contact.Where(m => m.cco_id == ccoId).Select(ContactClientTranslator.RepositoryToEntity()).FirstOrDefault();
            if (acco != null)
            {
                acco.FCcoId = StringCipher.EncoderSimple(acco.CcoId.ToString(), "ccoId");
                acco.FCliId = StringCipher.EncoderSimple(acco.CliId.ToString(), "cliId");
            }
            return acco;
        }

        public List<ContactClient> LoadContactClientsByCliId(int cliId)
        {
            var ccos = _db.TM_CCO_Client_Contact.Where(m => m.cli_id == cliId).Select(ContactClientTranslator.RepositoryToEntity()).ToList();
            foreach (var contactClient in ccos)
            {
                contactClient.FCcoId = StringCipher.EncoderSimple(contactClient.CcoId.ToString(), "ccoId");
                contactClient.FCliId = StringCipher.EncoderSimple(contactClient.CliId.ToString(), "cliId");
            }
            return ccos.OrderBy(m => m.CcoAdresseTitle).ToList();
        }

        public bool DeleteContactClient(int ccoId, int socId)
        {
            bool deleted = false;
            var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cco_id == ccoId && m.TM_CLI_CLient.soc_id == socId);
            if (cco != null)
            {
                try
                {
                    _db.TM_CCO_Client_Contact.DeleteObject(cco);
                    _db.SaveChanges();
                    deleted = true;
                }
                catch (Exception)
                {
                }
            }
            return deleted;
        }

        /// <summary>
        /// cost plan, purchase order, delivery form, invoice 仅更新，不创建
        /// </summary>
        /// <param name="contactClient"></param>
        /// <returns></returns>
        public ContactClient UpdateContactClientFromPage(ContactClient contactClient)
        {
            int ccoId = 0;
            bool create = false;
            if (contactClient.CcoCmuId == 0 || contactClient.CcoCmuId == null)
            {
                contactClient.CcoCmuId = CheckCommune(contactClient.CcoPostcode, contactClient.CcoCity);
            }
            if (contactClient.CcoId != 0)
            {
                var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cco_id == contactClient.CcoId);
                if (cco != null)
                {
                    cco = ContactClientTranslator.EntityToRepositoryFromPage(contactClient, cco);
                    _db.TM_CCO_Client_Contact.ApplyCurrentValues(cco);
                    _db.SaveChanges();
                    UpdateAllClientContact(contactClient);
                    ccoId = cco.cco_id;
                }
            }
            contactClient.CcoId = ccoId;
            return contactClient;
        }

        private void UpdateAllClientContact(ContactClient contactClient)
        {
            //if (contactClient != null)
            //{
            //    #region Update costplan, client order, delivery form and invoice client contact

            //    #region Cost plan
            //    var cplDlv =
            //        _db.TM_CPL_Cost_Plan.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_delivery == contactClient.CcoId).ToList();
            //    foreach (var onecpl in cplDlv)
            //    {
            //        onecpl.cpl_dlv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cpl_dlv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cpl_dlv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cpl_dlv_cco_city = contactClient.CcoCity;
            //        onecpl.cpl_dlv_cco_country = contactClient.CcoCountry;
            //        onecpl.cpl_dlv_cco_email = contactClient.CcoEmail;
            //        onecpl.cpl_dlv_cco_fax = contactClient.CcoFax;
            //        onecpl.cpl_dlv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cpl_dlv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cpl_dlv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cpl_dlv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_CPL_Cost_Plan.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var cplInv =
            //        _db.TM_CPL_Cost_Plan.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_invoicing == contactClient.CcoId).ToList();
            //    foreach (var onecpl in cplInv)
            //    {
            //        onecpl.cpl_inv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cpl_inv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cpl_inv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cpl_inv_cco_city = contactClient.CcoCity;
            //        onecpl.cpl_inv_cco_country = contactClient.CcoCountry;
            //        onecpl.cpl_inv_cco_email = contactClient.CcoEmail;
            //        onecpl.cpl_inv_cco_fax = contactClient.CcoFax;
            //        onecpl.cpl_inv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cpl_inv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cpl_inv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cpl_inv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_CPL_Cost_Plan.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }

            //    #endregion Cost plan

            //    #region Client Order

            //    var codDlv =
            //        _db.TM_COD_Client_Order.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_delivery == contactClient.CcoId).ToList();
            //    foreach (var onecpl in codDlv)
            //    {
            //        onecpl.cod_dlv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cod_dlv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cod_dlv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cod_dlv_cco_city = contactClient.CcoCity;
            //        onecpl.cod_dlv_cco_country = contactClient.CcoCountry;
            //        onecpl.cod_dlv_cco_email = contactClient.CcoEmail;
            //        onecpl.cod_dlv_cco_fax = contactClient.CcoFax;
            //        onecpl.cod_dlv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cod_dlv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cod_dlv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cod_dlv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_COD_Client_Order.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var codInv =
            //        _db.TM_COD_Client_Order.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_invoicing == contactClient.CcoId).ToList();
            //    foreach (var onecpl in codInv)
            //    {
            //        onecpl.cod_dlv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cod_dlv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cod_dlv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cod_dlv_cco_city = contactClient.CcoCity;
            //        onecpl.cod_dlv_cco_country = contactClient.CcoCountry;
            //        onecpl.cod_dlv_cco_email = contactClient.CcoEmail;
            //        onecpl.cod_dlv_cco_fax = contactClient.CcoFax;
            //        onecpl.cod_dlv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cod_dlv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cod_dlv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cod_dlv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_COD_Client_Order.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }

            //    #endregion Client Order

            //    #region Client Invoice

            //    var cinDlv =
            //        _db.TM_CIN_Client_Invoice.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_delivery == contactClient.CcoId).ToList();
            //    foreach (var onecpl in cinDlv)
            //    {
            //        onecpl.cin_dlv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cin_dlv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cin_dlv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cin_dlv_cco_city = contactClient.CcoCity;
            //        onecpl.cin_dlv_cco_country = contactClient.CcoCountry;
            //        onecpl.cin_dlv_cco_email = contactClient.CcoEmail;
            //        onecpl.cin_dlv_cco_fax = contactClient.CcoFax;
            //        onecpl.cin_dlv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cin_dlv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cin_dlv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cin_dlv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_CIN_Client_Invoice.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var cinInv =
            //        _db.TM_CIN_Client_Invoice.Where(
            //            m => m.soc_id == contactClient.SocId && m.cco_id_invoicing == contactClient.CcoId).ToList();
            //    foreach (var onecpl in cinInv)
            //    {
            //        onecpl.cin_dlv_cco_address1 = contactClient.CcoAddress1;
            //        onecpl.cin_dlv_cco_address2 = contactClient.CcoAddress2;
            //        onecpl.cin_dlv_cco_cellphone = contactClient.CcoCellphone;
            //        onecpl.cin_dlv_cco_city = contactClient.CcoCity;
            //        onecpl.cin_dlv_cco_country = contactClient.CcoCountry;
            //        onecpl.cin_dlv_cco_email = contactClient.CcoEmail;
            //        onecpl.cin_dlv_cco_fax = contactClient.CcoFax;
            //        onecpl.cin_dlv_cco_firstname = contactClient.CcoFirstname;
            //        onecpl.cin_dlv_cco_lastname = contactClient.CcoLastname;
            //        onecpl.cin_dlv_cco_postcode = contactClient.CcoPostcode;
            //        onecpl.cin_dlv_cco_tel1 = contactClient.CcoTel1;
            //        _db.TM_CIN_Client_Invoice.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    #endregion Client Invoice

            //    #endregion Update costplan, client order, delivery form and invoice client contact
            //}
        }

        /// <summary>
        /// 20241213 insert contacts client in client page
        /// </summary>
        /// <param name="CcoList"></param>
        public void CreateCcoFromExcel(List<ContactClient> CcoList)
        {
            foreach (var item in CcoList)
            {
                var contactClient = item;
                var newcco = new TM_CCO_Client_Contact();
                contactClient.DateUpdate = DateTime.Now;
                contactClient.DateCreation = DateTime.Now;
                if (contactClient.CivId == 0)
                {
                    contactClient.CivId = 1;
                }
                if (string.IsNullOrEmpty(contactClient.CcoAdresseTitle))
                {
                    //contactClient.CcoAdresseTitle = "Default";
                    contactClient.CcoAdresseTitle = contactClient.CcoIsDeliveryAdr && contactClient.CcoIsInvoicingAdr ? "Adresse Fac & Liv" : (contactClient.CcoIsDeliveryAdr && !contactClient.CcoIsInvoicingAdr ? "Adresse Livraison" : (!contactClient.CcoIsDeliveryAdr && contactClient.CcoIsInvoicingAdr ? "Adresse Facturation" : ""));
                    if (string.IsNullOrEmpty(contactClient.CcoAdresseTitle))
                    {
                        contactClient.CcoIsDeliveryAdr = contactClient.CcoIsInvoicingAdr = true;
                        contactClient.CcoAdresseTitle = "Adresse Fac & Liv";
                    }
                }
                var lastcco = _db.TM_CCO_Client_Contact.Where(m => m.TM_CLI_CLient.soc_id == contactClient.SocId
                    && m.cco_d_creation.Year == contactClient.DateCreation.Year
                    && m.cco_d_creation.Month == contactClient.DateCreation.Month).OrderByDescending(m => m.cco_ref).FirstOrDefault();
                var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == contactClient.CliId);
                string lastRef = string.Empty;
                if (lastcco != null)
                {
                    lastRef = lastcco.cco_ref;
                }
                string pref = GetCodePref(12);
                contactClient.CcoRef = GetGeneralRefContinuation(contactClient.DateCreation, pref, lastRef, _codeType, cli.cli_id);
                newcco = ContactClientTranslator.EntityToRepository(contactClient, newcco, true);
                if (newcco.cmu_id == null)
                {
                    if (newcco.cco_city == cli.cli_city)
                    {
                        newcco.cmu_id = cli.cmu_id;
                    }
                }
                _db.TM_CCO_Client_Contact.AddObject(newcco);
                _db.SaveChanges();
            }
        }

    }
}

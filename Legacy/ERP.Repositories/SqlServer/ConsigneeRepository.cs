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
    public class ConsigneeRepository : BaseSqlServerRepository
    {
        public Consignee CreateUpdateConsigne(Consignee contactClient, bool updateExt = false)
        {
            int conId = 0;
            bool create = false;
            if (contactClient.ConCmuId == 0 || contactClient.ConCmuId == null)
            {
                contactClient.ConCmuId = CheckCommune(contactClient.ConPostcode, contactClient.ConCity);
            }
            if (contactClient.ConId != 0)
            {
                var con = _db.TM_CON_CONSIGNEE.FirstOrDefault(m => m.con_id == contactClient.ConId);
                if (con != null)
                {
                    con = ConsigneeTranslator.EntityToRepository(contactClient, con, updateExt: updateExt);
                    if (string.IsNullOrEmpty(con.con_code))
                    {
                        var lastcon = _db.TM_CON_CONSIGNEE.Where(m => m.soc_id == contactClient.SocId
                            && m.con_d_creation.Year == contactClient.DateCreation.Year
                            && m.con_d_creation.Month == contactClient.DateCreation.Month).OrderByDescending(m => m.con_code).FirstOrDefault();
                        //var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == contactClient.CliId);
                        string lastRef = string.Empty;
                        if (lastcon != null)
                        {
                            lastRef = lastcon.con_code;
                        }
                        string pref = GetCodePref(16);
                        con.con_code = GetGeneralRefContinuation(contactClient.DateCreation, pref, lastRef, _codeType);
                    }
                    _db.TM_CON_CONSIGNEE.ApplyCurrentValues(con);
                    _db.SaveChanges();


                    //UpdateAllClientContact(contactClient);
                    conId = con.con_id;
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
                var newcon = new TM_CON_CONSIGNEE();
                if (contactClient.DateCreation.Year < 1900)
                {
                    contactClient.DateCreation = DateTime.Now;

                }
                if (contactClient.CivId == 0)
                {
                    contactClient.CivId = 1;
                }
                if (string.IsNullOrEmpty(contactClient.ConAdresseTitle))
                {
                    //contactClient.ConAdresseTitle = "Default";
                    contactClient.ConAdresseTitle = contactClient.ConIsDeliveryAdr && contactClient.ConIsInvoicingAdr ? "Adresse Fac & Liv" : (contactClient.ConIsDeliveryAdr && !contactClient.ConIsInvoicingAdr ? "Adresse Livraison" : (!contactClient.ConIsDeliveryAdr && contactClient.ConIsInvoicingAdr ? "Adresse Facturation" : ""));
                    if (string.IsNullOrEmpty(contactClient.ConAdresseTitle))
                    {
                        contactClient.ConIsDeliveryAdr = contactClient.ConIsInvoicingAdr = true;
                        contactClient.ConAdresseTitle = "Adresse Fac & Liv";
                    }
                }
                var lastcon = _db.TM_CON_CONSIGNEE.Where(m => m.soc_id == contactClient.SocId
                    && m.con_d_creation.Year == contactClient.DateCreation.Year
                    && m.con_d_creation.Month == contactClient.DateCreation.Month).OrderByDescending(m => m.con_code).FirstOrDefault();
                //var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == contactClient.CliId);
                string lastRef = string.Empty;
                if (lastcon != null)
                {
                    lastRef = lastcon.con_code;
                }
                string pref = GetCodePref(16);
                contactClient.ConCode = GetGeneralRefContinuation(contactClient.DateCreation, pref, lastRef, _codeType);
                newcon = ConsigneeTranslator.EntityToRepository(contactClient, newcon, true);
                _db.TM_CON_CONSIGNEE.AddObject(newcon);
                _db.SaveChanges();
                conId = newcon.con_id;
            }
            contactClient.ConId = conId;
            return contactClient;
        }

        public List<Consignee> SearchConsignee(Consignee oneCon)
        {
            var cons = _db.TM_CON_CONSIGNEE.Where(m =>
                m.soc_id == oneCon.SocId
                && (string.IsNullOrEmpty(oneCon.ConFirstname) || m.con_firstname.Contains(oneCon.ConFirstname) || m.con_lastname.Contains(oneCon.ConFirstname) || m.con_adresse_title.Contains(oneCon.ConFirstname))
                && (string.IsNullOrEmpty(oneCon.ConComment) || m.con_comment.Contains(oneCon.ConComment))
                && (string.IsNullOrEmpty(oneCon.ConEmail) || m.con_email.Contains(oneCon.ConEmail))
                && (string.IsNullOrEmpty(oneCon.ConPostcode) || m.con_postcode.Contains(oneCon.ConPostcode))
                && (string.IsNullOrEmpty(oneCon.ConCity) || m.con_city.Contains(oneCon.ConCity))
                && (string.IsNullOrEmpty(oneCon.ConAddress1) || m.con_address1.Contains(oneCon.ConAddress1) || m.con_address2.Contains(oneCon.ConAddress1) || m.con_address3.Contains(oneCon.ConAddress1))
                && (string.IsNullOrEmpty(oneCon.ConCompanyname) || m.con_company_name.Contains(oneCon.ConCompanyname))
                && (string.IsNullOrEmpty(oneCon.ConTel1) || m.con_tel1.Contains(oneCon.ConTel1) || m.con_tel2.Contains(oneCon.ConTel1) || m.con_cellphone.Contains(oneCon.ConTel1))
                //&& (oneCon.SuperRight || m.usr_created_by == oneCon.UsrCreatedBy || m.cli_usr_com1 == oneCon.UsrCreatedBy || m.cli_usr_com2 == oneCon.UsrCreatedBy || m.cli_usr_com3 == oneCon.UsrCreatedBy)
                ).Select(ConsigneeTranslator.RepositoryToEntity()).OrderBy(m => m.ConFirstname).ToList().Skip(0).Take(500);
            foreach (var item in cons)
            {
                item.FConId = StringCipher.EncoderSimple(item.ConId.ToString(), "conId");
            }
            return cons.ToList();
        }

        public List<Consignee> GetConsigneeByKeyword(string keyword, int socId)
        {
            var clis = _db.TM_CON_CONSIGNEE.Where(m =>
            m.soc_id == socId
            && (string.IsNullOrEmpty(keyword)
            || m.con_adresse_title.Contains(keyword)
            || m.con_firstname.Contains(keyword)
            || m.con_lastname.Contains(keyword)
            || m.con_comment.Contains(keyword)
            || m.con_email.Contains(keyword)
            || m.con_postcode.Contains(keyword)
            || m.con_city.Contains(keyword)
            || m.con_tel1.Contains(keyword)
            || m.con_tel2.Contains(keyword)
            || m.con_cellphone.Contains(keyword)
            || m.con_address1.Contains(keyword)
            || m.con_address2.Contains(keyword)
            || m.con_address3.Contains(keyword)
            )
            ).Select(ConsigneeTranslator.RepositoryToEntity()).OrderBy(m => m.ConFirstname).ToList().Skip(0).Take(500);
            //foreach (var item in clis)
            //{
            //    item.FConId = StringCipher.EncoderSimple(item.ConId.ToString(), "conId");
            //}
            return clis.ToList();
        }

        public Consignee LoadConsigneeByConId(int conId)
        {
            var acon = _db.TM_CON_CONSIGNEE.Where(m => m.con_id == conId).Select(ConsigneeTranslator.RepositoryToEntity()).FirstOrDefault();
            if (acon != null)
            {
                acon.FConId = StringCipher.EncoderSimple(acon.ConId.ToString(), "conId");
            }
            return acon;
        }

        //public List<Consignee> LoadConsigneesByCliId(int cliId)
        //{
        //    var cons = _db.TM_CON_CONSIGNEE.Where(m => m.cli_id == cliId).Select(ConsigneeTranslator.RepositoryToEntity()).ToList();
        //    foreach (var contactClient in cons)
        //    {
        //        contactClient.FConId = StringCipher.EncoderSimple(contactClient.ConId.ToString(), "conId");
        //        contactClient.FCliId = StringCipher.EncoderSimple(contactClient.CliId.ToString(), "cliId");
        //    }
        //    return cons.OrderBy(m => m.ConAdresseTitle).ToList();
        //}

        public bool DeleteConsignee(int conId, int socId)
        {
            bool deleted = false;
            var con = _db.TM_CON_CONSIGNEE.FirstOrDefault(m => m.con_id == conId && m.soc_id == socId);
            if (con != null)
            {
                try
                {
                    _db.TM_CON_CONSIGNEE.DeleteObject(con);
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
        public Consignee UpdateConsigneeFromPage(Consignee contactClient)
        {
            int conId = 0;
            bool create = false;
            if (contactClient.ConCmuId == 0 || contactClient.ConCmuId == null)
            {
                contactClient.ConCmuId = CheckCommune(contactClient.ConPostcode, contactClient.ConCity);
            }
            if (contactClient.ConId != 0)
            {
                var con = _db.TM_CON_CONSIGNEE.FirstOrDefault(m => m.con_id == contactClient.ConId);
                if (con != null)
                {
                    con = ConsigneeTranslator.EntityToRepositoryFromPage(contactClient, con);
                    _db.TM_CON_CONSIGNEE.ApplyCurrentValues(con);
                    _db.SaveChanges();
                    //UpdateAllClientContact(contactClient);
                    conId = con.con_id;
                }
            }
            contactClient.ConId = conId;
            return contactClient;
        }

        private void UpdateAllClientContact(Consignee contactClient)
        {
            //if (contactClient != null)
            //{
            //    #region Update costplan, client order, delivery form and invoice client contact

            //    #region Cost plan
            //    var cplDlv =
            //        _db.TM_CPL_Cost_Plan.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_delivery == contactClient.ConId).ToList();
            //    foreach (var onecpl in cplDlv)
            //    {
            //        onecpl.cpl_dlv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cpl_dlv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cpl_dlv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cpl_dlv_con_city = contactClient.ConCity;
            //        onecpl.cpl_dlv_con_country = contactClient.ConCountry;
            //        onecpl.cpl_dlv_con_email = contactClient.ConEmail;
            //        onecpl.cpl_dlv_con_fax = contactClient.ConFax;
            //        onecpl.cpl_dlv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cpl_dlv_con_lastname = contactClient.ConLastname;
            //        onecpl.cpl_dlv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cpl_dlv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_CPL_Cost_Plan.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var cplInv =
            //        _db.TM_CPL_Cost_Plan.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_invoicing == contactClient.ConId).ToList();
            //    foreach (var onecpl in cplInv)
            //    {
            //        onecpl.cpl_inv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cpl_inv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cpl_inv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cpl_inv_con_city = contactClient.ConCity;
            //        onecpl.cpl_inv_con_country = contactClient.ConCountry;
            //        onecpl.cpl_inv_con_email = contactClient.ConEmail;
            //        onecpl.cpl_inv_con_fax = contactClient.ConFax;
            //        onecpl.cpl_inv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cpl_inv_con_lastname = contactClient.ConLastname;
            //        onecpl.cpl_inv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cpl_inv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_CPL_Cost_Plan.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }

            //    #endregion Cost plan

            //    #region Client Order

            //    var codDlv =
            //        _db.TM_COD_Client_Order.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_delivery == contactClient.ConId).ToList();
            //    foreach (var onecpl in codDlv)
            //    {
            //        onecpl.cod_dlv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cod_dlv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cod_dlv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cod_dlv_con_city = contactClient.ConCity;
            //        onecpl.cod_dlv_con_country = contactClient.ConCountry;
            //        onecpl.cod_dlv_con_email = contactClient.ConEmail;
            //        onecpl.cod_dlv_con_fax = contactClient.ConFax;
            //        onecpl.cod_dlv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cod_dlv_con_lastname = contactClient.ConLastname;
            //        onecpl.cod_dlv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cod_dlv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_COD_Client_Order.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var codInv =
            //        _db.TM_COD_Client_Order.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_invoicing == contactClient.ConId).ToList();
            //    foreach (var onecpl in codInv)
            //    {
            //        onecpl.cod_dlv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cod_dlv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cod_dlv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cod_dlv_con_city = contactClient.ConCity;
            //        onecpl.cod_dlv_con_country = contactClient.ConCountry;
            //        onecpl.cod_dlv_con_email = contactClient.ConEmail;
            //        onecpl.cod_dlv_con_fax = contactClient.ConFax;
            //        onecpl.cod_dlv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cod_dlv_con_lastname = contactClient.ConLastname;
            //        onecpl.cod_dlv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cod_dlv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_COD_Client_Order.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }

            //    #endregion Client Order

            //    #region Client Invoice

            //    var cinDlv =
            //        _db.TM_CIN_Client_Invoice.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_delivery == contactClient.ConId).ToList();
            //    foreach (var onecpl in cinDlv)
            //    {
            //        onecpl.cin_dlv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cin_dlv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cin_dlv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cin_dlv_con_city = contactClient.ConCity;
            //        onecpl.cin_dlv_con_country = contactClient.ConCountry;
            //        onecpl.cin_dlv_con_email = contactClient.ConEmail;
            //        onecpl.cin_dlv_con_fax = contactClient.ConFax;
            //        onecpl.cin_dlv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cin_dlv_con_lastname = contactClient.ConLastname;
            //        onecpl.cin_dlv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cin_dlv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_CIN_Client_Invoice.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    var cinInv =
            //        _db.TM_CIN_Client_Invoice.Where(
            //            m => m.soc_id == contactClient.SocId && m.con_id_invoicing == contactClient.ConId).ToList();
            //    foreach (var onecpl in cinInv)
            //    {
            //        onecpl.cin_dlv_con_address1 = contactClient.ConAddress1;
            //        onecpl.cin_dlv_con_address2 = contactClient.ConAddress2;
            //        onecpl.cin_dlv_con_cellphone = contactClient.ConCellphone;
            //        onecpl.cin_dlv_con_city = contactClient.ConCity;
            //        onecpl.cin_dlv_con_country = contactClient.ConCountry;
            //        onecpl.cin_dlv_con_email = contactClient.ConEmail;
            //        onecpl.cin_dlv_con_fax = contactClient.ConFax;
            //        onecpl.cin_dlv_con_firstname = contactClient.ConFirstname;
            //        onecpl.cin_dlv_con_lastname = contactClient.ConLastname;
            //        onecpl.cin_dlv_con_postcode = contactClient.ConPostcode;
            //        onecpl.cin_dlv_con_tel1 = contactClient.ConTel1;
            //        _db.TM_CIN_Client_Invoice.ApplyCurrentValues(onecpl);
            //        _db.SaveChanges();
            //    }
            //    #endregion Client Invoice

            //    #endregion Update costplan, client order, delivery form and invoice client contact
            //}
        }
    }
}

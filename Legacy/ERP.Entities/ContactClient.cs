using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;

namespace ERP.Entities
{
    public class ContactClient
    {
        public int CcoId { get; set; }
        public string FCcoId { get; set; }
        public string FCliId { get; set; }
        public string CcoFirstname { get; set; }
        public string CcoLastname { get; set; }
        public int CivId { get; set; }
        public KeyValue Civility { get; set; }
        public string CcoRef { get; set; }
        public string CcoAdresseTitle { get; set; }
        public string CcoAddress1 { get; set; }
        public string CcoAddress2 { get; set; }
        public string CcoPostcode { get; set; }
        public string CcoCity { get; set; }
        public string CcoCountry { get; set; }
        public string CcoTel1 { get; set; }
        public string CcoTel2 { get; set; }
        public string CcoFax { get; set; }
        public string CcoCellphone { get; set; }
        public string CcoEmail { get; set; }
        public bool CcoRecieveNewsletter { get; set; }
        public string CcoNewsletterEmail { get; set; }
        public bool CcoIsDeliveryAdr { get; set; }
        public bool CcoIsInvoicingAdr { get; set; }
        public int CliId { get; set; }
        //public Client Client { get; set; }
        public int UsrCreatedBy { get; set; }
        public User UserCreator { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }
        public int SocId { get; set; }
        public string CcoComment { get; set; }
        public int? CcoCmuId { get; set; }

        #region Site Client
        public string Login { get; set; }
        #endregion Site Client
    }
}

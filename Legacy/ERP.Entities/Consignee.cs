using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;

namespace ERP.Entities
{
    public class Consignee
    {
        public int ConId { get; set; }
        public string FConId { get; set; }
        public string ConFirstname { get; set; }
        public string ConLastname { get; set; }
        public int CivId { get; set; }
        public KeyValue Civility { get; set; }
        public string ConCode { get; set; }
        public string ConAdresseTitle { get; set; }
        public string ConAddress1 { get; set; }
        public string ConAddress2 { get; set; }
        public string ConAddress3 { get; set; }
        public string ConPostcode { get; set; }
        public string ConCity { get; set; }
        public string ConCountry { get; set; }
        public string ConTel1 { get; set; }
        public string ConTel2 { get; set; }
        public string ConFax { get; set; }
        public string ConCellphone { get; set; }
        public string ConEmail { get; set; }
        public bool ConRecieveNewsletter { get; set; }
        public string ConNewsletterEmail { get; set; }
        public bool ConIsDeliveryAdr { get; set; }
        public bool ConIsInvoicingAdr { get; set; }
        public int UsrCreatedBy { get; set; }
        public User UserCreator { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }
        public int SocId { get; set; }
        public string ConComment { get; set; }
        public int? ConCmuId { get; set; }
        public string ConCompanyname { get; set; }

    }
}

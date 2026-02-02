using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class SupplierContact
    {
        public int ScoId { get; set; }
        public string FScoId { get; set; }
        public string FSupId { get; set; }
        public string ScoFirstname { get; set; }
        public string ScoLastname { get; set; }
        public int CivId { get; set; }
        public KeyValue Civility { get; set; }
        public string ScoRef { get; set; }
        public string ScoAdresseTitle { get; set; }
        public string ScoAddress1 { get; set; }
        public string ScoAddress2 { get; set; }
        public string ScoPostcode { get; set; }
        public string ScoCity { get; set; }
        public string ScoCountry { get; set; }
        public string ScoTel1 { get; set; }
        public string ScoTel2 { get; set; }
        public string ScoFax { get; set; }
        public string ScoCellphone { get; set; }
        public string ScoEmail { get; set; }
        public bool ScoRecieveNewsletter { get; set; }
        public string ScoNewsletterEmail { get; set; }
        public int SupId { get; set; }
        public int UsrCreatedBy { get; set; }
        public User UserCreator { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }
        public int SocId { get; set; }
        public string ScoComment { get; set; }
    }
}

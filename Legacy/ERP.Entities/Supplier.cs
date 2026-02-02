using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class Supplier : BaseClass
    {
        public int Id { get; set; }
        //public string FId { get; set; }
        public string Reference { get; set; }
        public int SocId { get; set; }
        public string CompanyName { get; set; }
        public int VatId { get; set; }
        public int PcoId { get; set; }
        public KeyValue PaymentCondition { get; set; }
        public int PmoId { get; set; }
        public KeyValue PaymentMode { get; set; }
        public string Siren { get; set; }
        public string Siret { get; set; }
        public string VatIntra { get; set; }
        public int UsrCreatedBy { get; set; }
        public int CurId { get; set; }
        public KeyValue Currency { get; set; }
        public bool Isactive { get; set; }
        public bool Isblocked { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string Postcode { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public int? FreeOfHarbor { get; set; }
        public string Tel1 { get; set; }
        public string Tel2 { get; set; }
        public string Fax { get; set; }
        public string Cellphone { get; set; }
        public string Email { get; set; }
        public bool RecieveNewsletter { get; set; }
        public string NewsletterEmail { get; set; }
        public string Comment4Supplier { get; set; }
        public string Comment4Interne { get; set; }
        public int StyId { get; set; }
        public bool WithSco { get; set; }
        public string Abbreviation { get; set; }

        /// <summary>
        /// 供货商登录名，命名规则
        /// </summary>
        public string SupLogin { get; set; }
        /// <summary>
        /// 登陆密码
        /// </summary>
        public string SupPwd { get; set; }


        /// <summary>
        /// TR_SOC 表中的 ShowLanguageBar
        /// </summary>
        public bool SocShowLanguageBar { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Client : BaseClass
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
        public int? ActId { get; set; }
        public string Siren { get; set; }
        public string Siret { get; set; }
        public string VatIntra { get; set; }
        public int UsrCreatedBy { get; set; }
        /// <summary>
        /// client type : 1--> client; 2 --> prospect
        /// </summary>
        public int CtyId { get; set; }
        public KeyValue ClientType { get; set; }
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
        public int? UsrIdCom1 { get; set; }
        public KeyValue Commercial1 { get; set; }
        public int? UsrIdCom2 { get; set; }
        public KeyValue Commercial2 { get; set; }
        public int? UsrIdCom3 { get; set; }
        public KeyValue Commercial3 { get; set; }
        public bool RecieveNewsletter { get; set; }
        public string NewsletterEmail { get; set; }
        public int? CmuId { get; set; }
        public string Comment4Client { get; set; }
        public string Comment4Interne { get; set; }
        public int? InvoiceDay { get; set; }
        public bool? InvoiceDayIsLastDay { get; set; }
        public string CliAccountingEmail { get; set; }
        /// <summary>
        /// 20210520-该项目在search cin 和 search sod 页面作用，显示搜索详情
        /// </summary>
        public bool ShowDetail { get; set; }

        /// <summary>
        /// 20220527-客户简写，用来区分同一个Company Name（需要手动建立）下面的不同客户，针对AX TECH的ECOLED和WAVE的
        /// </summary>
        public string CliAbbr { get; set; }

        /// <summary>
        /// 货币符号
        /// </summary>
        public string CurrencySymbol { get; set; }
        public string CliPdfVersion { get; set; }
        /// <summary>
        /// 20251208 一个client 可对应多个client type
        /// </summary>
        public IEnumerable<KeyValueSimple> ClientTypes { get; set; }
    }

    public class SiteClient : Client
    {
        public string Login { get; set; }
        public int SclId { get; set; }
        public int? CcoId { get; set; }
        public string Pwd { get; set; }
        public bool IsActive { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Civility { get; set; }
        public int CivId { get; set; }
    }

    public class SitClientPassword : BaseClass
    {
        public int Id { get; set; }
        public string Login { get; set; }
        public string Pwd { get; set; }
        public int SclId { get; set; }
        public DateTime DCreation { get; set; }
        public bool IsActived { get; set; }
    }
}

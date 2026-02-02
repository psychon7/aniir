using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;

namespace ERP.Entities
{
    public class BankAccount : BaseClass
    {
        public int Id { get; set; }
        /// <summary>
        /// 银行名称，对应DOMICILIATION 里面的第一行
        /// </summary>
        public string BankName { get; set; }
        /// <summary>
        /// titulaire 拥有者的公司名
        /// </summary>
        public string AccountOwner { get; set; }
        /// <summary>
        /// 银行地址，对应DOMICILIATION 里面除了银行名称之外的内容(可以将银行名称也包含进去)
        /// </summary>
        public string BankAdr { get; set; }
        public string AccountNumber { get; set; }
        /// <summary>
        /// BIC/SWIFT
        /// </summary>
        public string Bic { get; set; }
        public string Iban { get; set; }
        /// <summary>
        /// Rib中 Banque 
        /// </summary>
        public string RibBankCode { get; set; }
        /// <summary>
        /// Rib 中 Guichet
        /// </summary>
        public string RibAgenceCode { get; set; }
        /// <summary>
        /// Rib 中 N compte
        /// </summary>
        public string RibAccountNumber { get; set; }
        public string RibKey { get; set; }
        /// <summary>
        /// 1: client, 2: supplier, 3: contact client, 4: contact supplier, 5: enterprise/society
        /// </summary>
        public int TypeId { get; set; }
        /// <summary>
        /// foreign key
        /// </summary>
        public int? FgId { get; set; }
        public string FgFId { get; set; }
        public int SocId { get; set; }
        /// <summary>
        /// 分行地址，可以不使用
        /// </summary>
        public string RibAgencyAdr { get; set; }
        /// <summary>
        /// Rib的名称
        /// </summary>
        public string RibTitle { get; set; }
    }
}

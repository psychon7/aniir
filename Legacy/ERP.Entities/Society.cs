using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Xml.Serialization;

namespace ERP.Entities
{
    [Serializable]
    /// <summary>
    /// L'entité Society (Société)
    /// </summary>
    public class Society : BaseClass
    {
        /// <summary>
        /// L'id d'entité Society (int)
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// Le raison sociale (nvarchar 20)
        /// </summary>
        public string Society_Name { get; set; }
        /// <summary>
        /// L'indice d'actif (bool)
        /// </summary>
        public bool Is_Active { get; set; }
        /// <summary>
        /// L'ordre d'affichage
        /// </summary>
        public int? Display_Order { get; set; }
        /// <summary>
        /// L'id de Currency
        /// </summary>
        public int Cur_Id { get; set; }
        /// <summary>
        /// L'id d'entité Language (int)
        /// </summary>
        public int Lng_Id { get; set; }
        /// <summary>
        /// L'entité Currency
        /// </summary>
        public KeyValue Currency { get; set; }
        /// <summary>
        /// L'entité Language
        /// </summary>
        public KeyValue Language { get; set; }
        /// <summary>
        /// Date début pour facture fournisseur
        /// </summary>
        public DateTime? DateBegin { get; set; }
        /// <summary>
        /// Date fin pour facture fournisseur
        /// </summary>
        public DateTime? DateEnd { get; set; }
        /// <summary>
        /// Date début pour facture client
        /// </summary>
        public DateTime? DateClientBegin { get; set; }
        /// <summary>
        /// Date fin pour facture client
        /// </summary>
        public DateTime? DateClientEnd { get; set; }
        /// <summary>
        /// Date début pour facture client
        /// </summary>
        public DateTime? DateOrderBegin { get; set; }
        /// <summary>
        /// Date fin pour facture client
        /// </summary>
        public DateTime? DateOrderEnd { get; set; }
        /// <summary>
        /// Email auto
        /// </summary>
        public bool? Email_Auto { get; set; }
        /// <summary>
        /// Capital
        /// </summary>
        public string Capital { get; set; }
        public string ShortLabel { get; set; }
        /// <summary>
        /// Account Owner, titulaire du compte
        /// </summary>
        public string RibName { get; set; }
        /// <summary>
        /// Domiciliation de banque, l'addresse complète
        /// </summary>
        public string RibAddress { get; set; }
        /// <summary>
        /// IBAN
        /// </summary>
        public string RibCodeIban { get; set; }
        /// <summary>
        /// BIC
        /// </summary>
        public string RibCodeBic { get; set; }
        public bool MaskCommission { get; set; }
        /// <summary>
        /// Adresse 1
        /// </summary>
        public string Address1 { get; set; }
        /// <summary>
        /// Adresse 2
        /// </summary>
        public string Address2 { get; set; }
        /// <summary>
        /// téléphone
        /// </summary>
        public string Telephone { get; set; }
        /// <summary>
        /// fax
        /// </summary>
        public string Fax { get; set; }
        public string PostCode { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public string Siret { get; set; }
        public string RCS { get; set; }
        public string Cellphone { get; set; }
        public string Email { get; set; }
        public string TvaIntra { get; set; }
        public string Site { get; set; }

        public string RibBankCode { get; set; }
        public string RibAgenceCode { get; set; }
        public string RibAccountNumber { get; set; }
        public string RibKey { get; set; }
        public string RibDomiciliationAgency { get; set; }
        /// <summary>
        /// Rib Abbreviation rib的简称，用于cin选择
        /// </summary>
        public string RibAbre { get; set; }


        public string RibAbre2 { get; set; }
        public string RibName2 { get; set; }
        public string RibAddress2 { get; set; }
        public string RibCodeIban2 { get; set; }
        public string RibCodeBic2 { get; set; }
        public string RibBankCode2 { get; set; }
        public string RibAgenceCode2 { get; set; }
        public string RibAccountNumber2 { get; set; }
        public string RibKey2 { get; set; }
        public string RibDomiciliationAgency2 { get; set; }

        public string Cnss { get; set; }
        public string TaxePro { get; set; }

        /// <summary>
        /// Display update date
        /// </summary>
        public bool DpUpd { get; set; }

        /// <summary>
        /// 产品是否是必须的，如果是，所有cpl, col, cii都需要有产品
        /// </summary>
        public bool IsPrdMandatory { get; set; }
        /// <summary>
        /// 是否显示语言栏
        /// </summary>
        public bool ShowLanguageBar { get; set; }
        /// <summary>
        /// 判断位，如果true则可以建立cin和lgs 的对应，否则不显示所有有关按键和信息
        /// </summary>
        public bool SocCinLgs { get; set; }
        /// <summary>
        /// 20230930 汇率表
        /// </summary>
        public List<Currencies> CurList { get; set; }
    }
}

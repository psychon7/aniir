using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;

namespace ERP.Entities
{
    public class ClientInvoice : BaseClass
    {
        public string ClientCompanyName { get; set; }
        public int CinId { get; set; }
        public int? CodId { get; set; }
        public string CodFId { get; set; }
        public int CliId { get; set; }
        public string CliFId { get; set; }
        public int VatId { get; set; }
        public int? PrjId { get; set; }
        public string PrjFId { get; set; }
        public int? DfoId { get; set; }
        public string DfoFId { get; set; }
        public string DfoCode { get; set; }
        public int? CplId { get; set; }
        public string CplFId { get; set; }
        public int SocId { get; set; }
        public string CinCode { get; set; }
        public DateTime CinDCreation { get; set; }
        public DateTime? CinDUpdate { get; set; }
        public DateTime? CinDInvoice { get; set; }
        public DateTime? CinDTerm { get; set; }
        /// <summary>
        /// Cashing date
        /// </summary>
        public DateTime? CinDEncaissement { get; set; }

        public string _CinDCreation { get; set; }
        public string _CinDUpdate { get; set; }
        public string _CinDInvoice { get; set; }
        public string _CinDTerm { get; set; }
        public string _CinDEncaissement { get; set; }

        public int UsrCreatorId { get; set; }

        public string CinHeaderText { get; set; }
        public string CinFooterText { get; set; }
        public int CurId { get; set; }
        public bool CinAccount { get; set; }
        public int PcoId { get; set; }
        public int PmoId { get; set; }
        //public int CcoIdDelivery { get; set; }
        public int? CcoIdInvoicing { get; set; }
        public bool CinIsInvoice { get; set; }
        public string CinName { get; set; }
        public decimal? CinDiscountPercentage { get; set; }
        public decimal? CinDiscountAmount { get; set; }
        public string CinFile { get; set; }
        public string CinClientComment { get; set; }
        public string CinInterComment { get; set; }



        public string PaymentMode { get; set; }
        public string PaymentCondition { get; set; }

        #region For Display
        public string CodCode { get; set; }
        public string CodName { get; set; }
        public string PrjName { get; set; }
        #endregion For Display

        #region for Search
        public string PrjCode { get; set; }
        public string CplName { get; set; }
        public string CplCode { get; set; }
        #endregion for Search

        #region Contact client invoicing and delivery

        // invoicing
        public string Inv_CcoFirstname { get; set; }
        public string Inv_CcoLastname { get; set; }
        public string Inv_CcoRef { get; set; }
        public string Inv_CcoAddress1 { get; set; }
        public string Inv_CcoAddress2 { get; set; }
        public string Inv_CcoPostcode { get; set; }
        public string Inv_CcoCity { get; set; }
        public string Inv_CcoCountry { get; set; }
        public string Inv_CcoTel1 { get; set; }
        public string Inv_CcoFax { get; set; }
        public string Inv_CcoCellphone { get; set; }
        public string Inv_CcoEmail { get; set; }
        // delivery
        //public string Dlv_CcoFirstname { get; set; }
        //public string Dlv_CcoLastname { get; set; }
        //public string Dlv_CcoRef { get; set; }
        //public string Dlv_CcoAddress1 { get; set; }
        //public string Dlv_CcoAddress2 { get; set; }
        //public string Dlv_CcoPostcode { get; set; }
        //public string Dlv_CcoCity { get; set; }
        //public string Dlv_CcoCountry { get; set; }
        //public string Dlv_CcoTel1 { get; set; }
        //public string Dlv_CcoFax { get; set; }
        //public string Dlv_CcoCellphone { get; set; }
        //public string Dlv_CcoEmail { get; set; }

        #endregion Contact client invoicing and delivery

        public User Creator { get; set; }

        public List<ClientInvoiceLine> ClientInvoiceLines { get; set; }

        public List<ClientInvoicePayment> ClientInvoicePayments { get; set; }

        #region invoice for Avoir
        public int? CinAvId { get; set; }
        public string CinAvFId { get; set; }
        public string CinAvCode { get; set; }
        #endregion invoice for Avoir

        /// <summary>
        /// Total HT
        /// </summary>
        public decimal? CinAmount { get; set; }
        public decimal? TotalAmountTtc { get; set; }

        // for pdf
        public Client ClientForPdf { get; set; }

        // for avoir, 此项本身是一个client invoice
        public ClientInvoice CinAvoir { get; set; }

        public decimal? CinRestToPay { get; set; }

        public decimal? CinPaid { get; set; }

        /// <summary>
        /// 已经完整支付?
        /// </summary>
        public bool? CinIsFullPaid { get; set; }

        /// <summary>
        /// 2017-11-10 已经出票，不可修改
        /// </summary>
        public bool CinIsInvoiced { get; set; }

        public int? UsrCom1 { get; set; }
        public int? UsrCom2 { get; set; }
        public int? UsrCom3 { get; set; }

        public string UsrCommercial1 { get; set; }
        public string UsrCommercial2 { get; set; }
        public string UsrCommercial3 { get; set; }
        // 2018-04-05 for pdf
        public List<string> DfoList { get; set; }
        // 2020-10-24
        public string CurrencySymbol { get; set; }
        public int? SodId { get; set; }
        public string SodCode { get; set; }
        public string SodFId { get; set; }

        /// <summary>
        /// 这个是确认使用哪个银行信息，如果空或者1或者默认则为默认银行信息
        /// </summary>
        public int? CinBank { get; set; }

        /// <summary>
        /// For client invoice statement
        /// </summary>
        public decimal CinRest2Pay { get; set; }
        /// <summary>
        /// 20210118 CSO
        /// </summary>
        public List<KeyValue> CsoList { get; set; }
        /// <summary>
        /// 20210902 Cin LGS
        /// </summary>
        public List<KeyValue> CgsList { get; set; }
        /// <summary>
        /// 20210905 判断是否可以创建DFO
        /// </summary>
        public bool CanCreateDfo { get; set; }
        /// <summary>
        /// Trade Terms
        /// </summary>
        public int? TteId { get; set; }
        public string TradeTerms { get; set; }
        /// <summary>
        /// cin 支付记录
        /// </summary>
        public string CinPaymentRecord { get; set; }

        /// <summary>
        /// 20251113 仅用于在search页面显示payment comment
        /// </summary>
        public string CinPaymentComments { get; set; }
        /// <summary>
        /// 20220527 client abbreviation
        /// </summary>
        public string CliAbbr { get; set; }
        /// <summary>
        /// 20231002 cin 盈利
        /// </summary>
        public decimal? CinMargin { get; set; }

        /// <summary>
        /// 20241213 key project only for X mode
        /// </summary>
        public bool CinKeyProject { get; set; }
        #region for bankinfo

        /// <summary>
        /// Account Owner, titulaire du compte
        /// </summary>
        public string RibName { get; set; }
        public string RibBankName { get; set; }
        /// <summary>
        /// Domiciliation de banque, l'addresse complète
        /// </summary>
        public string RibAddress { get; set; }
        public string RibBankCode { get; set; }
        public string RibAgenceCode { get; set; }
        public string RibAccountNumber { get; set; }
        public string RibKey { get; set; }
        public string RibDomiciliationAgency { get; set; }
        /// <summary>
        /// IBAN
        /// </summary>
        public string RibCodeIban { get; set; }
        /// <summary>
        /// BIC
        /// </summary>
        public string RibCodeBic { get; set; }

        #endregion for bankinfo

        public int? DelegatorId { get; set; }
        /// <summary>
        /// 20251127 Delegator for client
        /// </summary>
        public KeyValue Delegataire { get; set; }
    }

    public class ClinetInvoiceGeneralInfo : BaseClass
    {
        public int CinId { get; set; }
        public decimal? CinDiscountPercentage { get; set; }
        public decimal? CinDiscountAmount { get; set; }
        public decimal? TotalAmountHt { get; set; }
        public decimal? TotalAmountTtc { get; set; }
        public decimal? TotalMargin { get; set; }
        public decimal? TotalPurchasePrice { get; set; }
        public decimal? TotalSalePrice { get; set; }
        /// <summary>
        /// 2021-01-05
        /// </summary>
        public string CurrencySymbol { get; set; }
    }

    public class ClientInvoicePayment : BaseClass
    {
        public int Id { get; set; }
        public int CinId { get; set; }
        public string CinFId { get; set; }
        public decimal CpyAmount { get; set; }
        public DateTime CpyDCreation { get; set; }
        public string CpyFile { get; set; }
        public bool HasFile { get; set; }
        public string CpyComment { get; set; }
        public string CpyGuid { get; set; }
        public string CpyPaymentCode { get; set; }
    }

    public class ClientInvoicePaymentInfo : ClinetInvoiceGeneralInfo
    {
        public decimal CinPaid { get; set; }
        public decimal CinRest2Pay { get; set; }
        public decimal CinTotal2Pay { get; set; }
        public List<ClientInvoicePayment> CinPaymentList { get; set; }
    }
}

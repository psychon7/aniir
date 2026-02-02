using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;

namespace ERP.Entities
{
    public class ClientOrder : BaseClass
    {
        public int CodId { get; set; }
        public string ClientCompanyName { get; set; }
        public Client OneClient { get; set; }
        public int SocId { get; set; }
        public int PrjId { get; set; }
        public string PrjFId { get; set; }
        public string PrjName { get; set; }
        public string PrjCode { get; set; }
        public int CplId { get; set; }
        public string CplFId { get; set; }
        public string CplCode { get; set; }
        public string CplName { get; set; }
        public int VatId { get; set; }
        public string CodCode { get; set; }
        public DateTime CodDateCreation { get; set; }
        public DateTime CodDateUpdate { get; set; }
        public int CliId { get; set; }
        public string CliFId { get; set; }
        public int PcoId { get; set; }
        public int PmoId { get; set; }
        public DateTime? CodDatePreDeliveryForm { get; set; }
        public DateTime? CodDatePreDeliveryTo { get; set; }
        public DateTime? CodDateEndWork { get; set; }
        public string CodHeaderText { get; set; }
        public string CodFooterText { get; set; }
        //public int CcoIdDelivery { get; set; }
        public int? CcoIdInvoicing { get; set; }
        public string CodClientComment { get; set; }
        public string CodInterComment { get; set; }
        public int UsrCreatorId { get; set; }
        public string CodName { get; set; }
        public string CodFile { get; set; }


        public string _CodDatePreDeliveryForm { get; set; }
        public string _CodDatePreDeliveryTo { get; set; }
        public string _CodDateEndWork { get; set; }
        public string _dCreationString { get; set; }
        public string _dUpdateString { get; set; }


        #region Contact client invoicing and delivery

        // invoicing
        //public string Inv_CcoFirstname { get; set; }
        //public string Inv_CcoLastname { get; set; }
        public string Inv_CcoRef { get; set; }
        //public string Inv_CcoAddress1 { get; set; }
        //public string Inv_CcoAddress2 { get; set; }
        //public string Inv_CcoPostcode { get; set; }
        //public string Inv_CcoCity { get; set; }
        //public string Inv_CcoCountry { get; set; }
        //public string Inv_CcoTel1 { get; set; }
        //public string Inv_CcoFax { get; set; }
        //public string Inv_CcoCellphone { get; set; }
        //public string Inv_CcoEmail { get; set; }
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



        /// <summary>
        /// 计算cost plan 内的amount
        /// </summary>
        public decimal? CodAmount { get; set; }

        /// <summary>
        /// 计算facture 的 amount
        /// </summary>
        public decimal? CodInvoicedAmount { get; set; }

        public List<ClientOrderLine> ClientOrderLines { get; set; }

        public string PaymentMode { get; set; }
        public string PaymentCondition { get; set; }

        public User Creator { get; set; }


        public decimal? CodDiscountPercentage { get; set; }
        public decimal? CodDiscountAmount { get; set; }


        public int? UsrCom1 { get; set; }
        public int? UsrCom2 { get; set; }
        public int? UsrCom3 { get; set; }

        public string UsrCommercial1 { get; set; }
        public string UsrCommercial2 { get; set; }
        public string UsrCommercial3 { get; set; }

        public int DflCount { get; set; }
        public int CinCount { get; set; }
        /// <summary>
        /// 20220527 client abbreviation
        /// </summary>
        public string CliAbbr { get; set; }
        /// <summary>
        /// 20230224 currency symbol
        /// </summary>
        public string CurrencySymbol { get; set; }
        /// <summary>
        /// 20241208 Contact client for delivery form page
        /// </summary>
        public List<ContactClient> CcoListForDfo { get; set; }

        /// <summary>
        /// 20241213 key project only for X mode
        /// </summary>
        public bool CodKeyProject { get; set; }
    }

    public class ClientOrderGeneralInfo : BaseClass
    {
        public int CodId { get; set; }
        public decimal? CodDiscountPercentage { get; set; }
        public decimal? CodDiscountAmount { get; set; }
        public decimal? TotalAmountHt { get; set; }
        public decimal? TotalAmountTtc { get; set; }
        public decimal? TotalMargin { get; set; }
        public decimal? TotalPurchasePrice { get; set; }
        public decimal? TotalSalePrice { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class CostPlan : BaseClass
    {
        public int CplId { get; set; }
        public string ClientCompanyName { get; set; }
        public Client CplClient { get; set; }
        public int SocId { get; set; }
        public int PrjId { get; set; }
        public string PrjFId { get; set; }

        public string cpl_stripe_chargeid { get; set; }
        public string PrjName { get; set; }
        public string PrjCode { get; set; }
        public int VatId { get; set; }
        public string CplCode { get; set; }
        public DateTime CplDateCreation { get; set; }
        public DateTime CplDateUpdate { get; set; }
        /// <summary>
        /// cost plan statut, 1--> encours; 2 --> gagné; 3 --> Perdu; 4 --> Abandonné; 5 --> Annulé; 6 -- > A valider; 7 --> Cloturé
        /// </summary>
        public int CstId { get; set; }
        public string CostPlanStatut { get; set; }
        public int CliId { get; set; }
        public string CliFId { get; set; }
        public int PcoId { get; set; }
        public int PmoId { get; set; }
        public DateTime CplDateValidity { get; set; }
        public DateTime? CplDatePreDelivery { get; set; }
        public string CplHeaderText { get; set; }
        public string CplFooterText { get; set; }
        //public int CcoIdDelivery { get; set; }
        public int? CcoIdInvoicing { get; set; }
        public string CplClientComment { get; set; }
        public string CplInterComment { get; set; }
        public int UsrCreatorId { get; set; }

        public string CplName { get; set; }

        public string _dCreationString { get; set; }
        public string _dUpdateString { get; set; }

        public string _dValidityString { get; set; }
        public string _dPreDeliveryString { get; set; }


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
        /// 计算cost plan 内的amount HT
        /// </summary>
        public decimal? CplAmount { get; set; }


        /// <summary>
        /// 计算cost plan 内的amount TTC
        /// </summary>
        public decimal? CplAmountTtc { get; set; }


        /// <summary>
        /// 计算cost plan 内的purchase amount
        /// </summary>
        public decimal? CplPurchaseAmount { get; set; }

        /// <summary>
        /// 计算cost plan 内的 margin amount
        /// </summary>
        public decimal? CplMarginAmount { get; set; }

        /// <summary>
        /// 计算facture 的 amount
        /// </summary>
        public decimal? CplInvoicedAmount { get; set; }

        public List<CostPlanLine> CostPlanLines { get; set; }

        public string PaymentMode { get; set; }
        public string PaymentCondition { get; set; }

        public User Creator { get; set; }

        public decimal? CplDiscountPercentage { get; set; }
        public decimal? CplDiscountAmount { get; set; }

        public int? UsrCom1 { get; set; }
        public int? UsrCom2 { get; set; }
        public int? UsrCom3 { get; set; }


        public string UsrCommercial1 { get; set; }
        public string UsrCommercial2 { get; set; }
        public string UsrCommercial3 { get; set; }

        public string UserComment { get; set; }
        public string UserFlag { get; set; }
        /// <summary>
        /// 20220527 client abbreviation
        /// </summary>
        public string CliAbbr { get; set; }
        /// <summary>
        /// 20230224 currency symbol
        /// </summary>
        public string CurrencySymbol { get; set; }
        /// <summary>
        /// 20231111 从网站建立的devis
        /// </summary>
        public bool CplFromSite { get; set; }
        /// <summary>
        /// 20241213 key project only for X mode
        /// </summary>
        public bool CplKeyProject { get; set; }
    }

    public class CostPlanGeneralInfo : BaseClass
    {
        public int CplId { get; set; }
        public decimal? CplDiscountPercentage { get; set; }
        public decimal? CplDiscountAmount { get; set; }
        public decimal? TotalAmountHt { get; set; }
        public decimal? TotalAmountTtc { get; set; }
        public decimal? TotalMargin { get; set; }
        public decimal? TotalPurchasePrice { get; set; }
        public decimal? TotalSalePrice { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Linq;
using System.Reflection.Emit;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class PurchaseBaseClass : BaseClass
    {
        #region Purchase Intent
        public int PinId { get; set; }
        public string PinFId { get; set; }
        public string PinCode { get; set; }
        public string PinName { get; set; }
        public bool PinClosed { get; set; }
        public bool PinHasSupplierOrder { get; set; }
        #endregion Purchase Intent

        #region Supplier Order

        public int SodId { get; set; }
        public string SodFId { get; set; }
        public string SodCode { get; set; }
        public string SodName { get; set; }
        public string SodFile { get; set; }
        public decimal? SodDiscountAMount { get; set; }
        public bool SodHasSin { get; set; }
        public bool SodNeedSend { get; set; }
        public bool SodFinish { get; set; }
        public string SodSupNbr { get; set; }
        public int? UsrComId { get; set; }
        public string Commercial { get; set; }
        public string SupplierCompanyName { get; set; }
        public int? CinId { get; set; }
        public string CinCode { get; set; }
        public string CinFId { get; set; }
        public string SodClient { get; set; }
        public int? CliId { get; set; }
        public string Client { get; set; }
        /// <summary>
        /// 20210520- Client 内 ShowDetail
        /// </summary>
        public bool CliShowDetail { get; set; }

        /// <summary>
        /// CSO List 20210118, client invoice supplier order
        /// </summary>
        public List<KeyValue> CsoList { get; set; }

        public bool? IsStarted { get; set; }
        public DateTime? StartTime { get; set; }
        public bool? IsCanceled { get; set; }
        public DateTime? CanceledTime { get; set; }
        /// <summary>
        /// 20220420 支付记录
        /// </summary>
        public string SodPaymentRecord { get; set; }
        /// <summary>
        /// 20251113 仅用于在search页面显示payment comment
        /// </summary>
        public string SodPaymentComments { get; set; }

        /// <summary>
        /// 20220527-客户简写，用来区分同一个Company Name（需要手动建立）下面的不同客户，针对AX TECH的ECOLED和WAVE的
        /// </summary>
        public string CliAbbr { get; set; }
        /// <summary>
        /// 20230607 整个订单的预交期
        /// </summary>
        public DateTime? DateExpDelivery { get; set; }

        /// <summary>
        /// 2023-06-11 订单状态
        /// </summary>
        public int SttId { get; set; }

        #endregion Supplier Order

        #region Supplier Invoice
        public int SinId { get; set; }
        public string SinFId { get; set; }
        public string SinCode { get; set; }
        public string SinName { get; set; }
        public string SinFile { get; set; }
        public decimal? SinDiscountAmount { get; set; }
        public bool SinIsPaid { get; set; }
        /// <summary>
        /// bank file path
        /// </summary>
        public string SinBankReceiptFile { get; set; }
        public string SinBankReceiptNumber { get; set; }
        public bool? SinStartProduction { get; set; }
        public DateTime? SinDateStartProduction { get; set; }
        public DateTime? SinDateCompleteProductionPlanned { get; set; }
        public DateTime? SinDateCompleteProduction { get; set; }
        public string _DateStartProduction { get; set; }
        public string _DateCompleteProductionPlanned { get; set; }
        public string _DateCompleteProduction { get; set; }
        public bool? SinCompleteProduction { get; set; }
        public int? BacId { get; set; }

        public bool SinAllProductStored { get; set; }

        #endregion Supplier Invoice

        public string InterComment { get; set; }
        public string SupplierComment { get; set; }

        public int SupId { get; set; }
        public string SupFId { get; set; }
        public int SubSupId { get; set; }
        public string SubSupFId { get; set; }
        public string Supplier { get; set; }
        public string Supplier2 { get; set; }
        public Supplier OneSupplier { get; set; }
        public Supplier TwoSupplier { get; set; }
        public SupplierContact SupplierContact { get; set; }
        public SupplierContact SupplierContact2 { get; set; }

        public int ScoId { get; set; }
        public int CurId { get; set; }

        public int SocId { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }
        public int UsrId { get; set; }
        public User Creator { get; set; }
        public int VatId { get; set; }
        public decimal TotalAmountHt { get; set; }
        public decimal TotalAmountTtc { get; set; }
        public List<PurchaseLineBaseClass> PurchaseLines { get; set; }
        public Guid? Guid { get; set; }
        public decimal? Need2Pay { get; set; }
        public decimal? Paid { get; set; }
        /// <summary>
        /// for search
        /// </summary>
        public string FeatureCode { get; set; }
        public string CurrencySymbol { get; set; }
    }


    #region 20230623 用于显示支付信息
    public class CinSodResult : ClientInvoice
    {
        public List<PurchaseBaseClass> SodInfos { get; set; }
    }

    public class SodCinResult : PurchaseBaseClass
    {
        public List<ClientInvoice> CinInfos { get; set; }
    }
    #endregion 20230623 用于显示支付信息

}

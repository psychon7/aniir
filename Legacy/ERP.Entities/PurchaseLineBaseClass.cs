using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class PurchaseLineBaseClass : BaseClass
    {
        public int PilId { get; set; }
        public int PinId { get; set; }
        public string PinFId { get; set; }
        public Guid? Guid { get; set; }

        public int SolId { get; set; }
        public int SodId { get; set; }
        public string SodFId { get; set; }

        public int SilId { get; set; }
        public int SinId { get; set; }
        public string SinFId { get; set; }

        public decimal? UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? UnitPriceWithDis { get; set; }
        public decimal? TotalPrice { get; set; }
        public decimal? TotalCrudePrice { get; set; }

        public int? VatId { get; set; }
        public decimal VatRate { get; set; }
        public int SocId { get; set; }
        public int Order { get; set; }
        public decimal? Quantity { get; set; }
        public int? PrdId { get; set; }
        public int? PitId { get; set; }
        public string PrdFId { get; set; }
        public string PitFId { get; set; }
        public string PrdName { get; set; }
        public string PitName { get; set; }
        public string Description { get; set; }
        public string PrdImgPath { get; set; }
        public string SupplierRef { get; set; }
        public string Driver { get; set; }
        public string Power { get; set; }
        public string TempColor { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public int? Efflum { get; set; }
        public int? UGR { get; set; }
        public int? CRI { get; set; }
        public string Logistic { get; set; }
        public string Client { get; set; }
        public DateTime? Deadline { get; set; }
        public DateTime? DateCreation { get; set; }
        public string FeatureCode { get; set; }
        public int? UsrIdCom1 { get; set; }
        public int? UsrIdCom2 { get; set; }
        public int? UsrIdCom3 { get; set; }
        public string Commercial1 { get; set; }
        public string Commercial2 { get; set; }
        public string Commercial3 { get; set; }
        public string Creator { get; set; }
        /// <summary>
        /// 20230609 货币符号
        /// </summary>
        public string CurSymbol { get; set; }

        #region SOL
        public DateTime? DUpdate { get; set; }
        public DateTime? DProduction { get; set; }
        public DateTime? DExpDelivery { get; set; }
        public DateTime? DDelivery { get; set; }

        public DateTime? DShipping { get; set; }
        public string Transporter { get; set; }
        public DateTime? DExpArrival { get; set; }
        public string LogsNbr { get; set; }

        public string _DProduction { get; set; }
        public string _DExpDelivery { get; set; }
        public string _DDelivery { get; set; }
        public string _DShipping { get; set; }
        public string _DExpArrival { get; set; }
        public string _Deadline { get; set; }


        /// <summary>
        /// 在更新支付的时候再更新
        /// </summary>
        public decimal? Need2Pay { get; set; }
        /// <summary>
        /// 在更新支付的时候再更新
        /// </summary>
        public decimal? Paid { get; set; }

        /// <summary>
        /// 此项单独更新
        /// </summary>
        public IEnumerable<KeyValue> PaymentRecords { get; set; }

        public bool Finished { get; set; }

        /// <summary>
        /// 用于读取已经入库的SOL 的数量
        /// </summary>
        public decimal? QtyStored { get; set; }

        /// <summary>
        /// 用于Detail，update一个日期，是否全部日期进行更新
        /// </summary>
        public bool UpdateAllSols { get; set; }

        #region for Sod

        public string SodCode { get; set; }
        public string SodName { get; set; }
        /// <summary>
        /// 供货商订单号
        /// </summary>
        public string SodSupNbr { get; set; }
        public bool SodFinish { get; set; }

        #endregion for Sod

        public List<KeyValue> LgsInfos { get; set; }

        #endregion SOL

        /// <summary>
        /// 此项作为商品描述
        /// </summary>
        public string PrdDescription { get; set; }

        /// <summary>
        /// purchase intent supplier
        /// </summary>
        public int? SupId { get; set; }

        #region Purchase Intent
        /// <summary>
        /// purchase intent 中，当有多个供货商时，该项用于修改 intent line 
        /// </summary>
        public List<SupplierProduct> SupplierProdcuts
        {
            get
            {
                return (_SupplierProdcuts != null ? _SupplierProdcuts.OrderBy(m => m.SupplierName).ToList() : null);
            }
        }
        public IEnumerable<SupplierProduct> _SupplierProdcuts { get; set; }
        public string SupplierCompanyName { get; set; }
        public int ClnId { get; set; }
        public int ColId { get; set; }
        public int CiiId { get; set; }
        public string PinCode { get; set; }
        public string PinName { get; set; }

        #endregion Purchase Intent

        #region for Logistics

        //public int TotalQuantity { get; set; }
        //public int RestQuantity { get; set; }
        public decimal? DeliveriedQuantity { get; set; }
        public decimal? QuantityForLgl { get; set; }
        public int LglId { get; set; }

        /// <summary>
        /// 入库单行，用于显示
        /// </summary>
        public int SrlId { get; set; }
        public decimal? SolQuantity { get; set; }

        #endregion for Logistics

        public string Comment { get; set; }

        public string Supplier1 { get; set; }
        public string Supplier2 { get; set; }
    }
}

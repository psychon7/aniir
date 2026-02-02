using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class ClientOrderLine : BaseClass
    {
        public int ColId { get; set; }
        public int? ClnId { get; set; }
        public int CodId { get; set; }
        public string CodFId { get; set; }
        public int? ColLevel1 { get; set; }
        public int? ColLevel2 { get; set; }
        public string ColDescription { get; set; }
        public int? PrdId { get; set; }
        public string PrdName { get; set; }
        public int? PitId { get; set; }
        public string PitName { get; set; }
        public decimal? ColPurchasePrice { get; set; }
        public decimal? ColUnitPrice { get; set; }
        public decimal? ColQuantity { get; set; }
        public decimal? ColTotalPrice { get; set; }
        public decimal? ColTotalCrudePrice { get; set; }
        public int? VatId { get; set; }
        public string VatLabel { get; set; }
        /// <summary>
        /// -1 是ColId 为空，CiiId有值的时候
        /// </summary>
        public int LtpId { get; set; }
        public string LineType { get; set; }
        /// <summary>
        /// for calculation
        /// </summary>
        public decimal VatRate { get; set; }

        /// <summary>
        /// 为search 使用
        /// </summary>
        public int SocId { get; set; }

        public string PrdFId { get; set; }
        public string PitFId { get; set; }
        public string ColPrdName { get; set; }
        public string PrdImgPath { get; set; }

        public decimal? ColDiscountPercentage { get; set; }
        public decimal? ColDiscountAmount { get; set; }
        public decimal? ColPriceWithDiscountHt { get; set; }
        public decimal? ColMargin { get; set; }

        // for delivery form lines
        public decimal? ColQuantityToDelivery { get; set; }
        public decimal? ColQuantityDeliveried { get; set; }

        public string ColPrdDes { get; set; }

        #region For Widget
        public string CodCode { get; set; }
        public string CodName { get; set; }
        public string ClientCompanyName { get; set; }
        #endregion For Widget
        
        // 20180529 添加prdid 为了让driver和accessory顺利排序，并不保存在数据库中
        public int? PrdId2 { get; set; }
        // 20180625 该产品是否是driver，accessory或option，并不保存在数据库中
        public bool IsAcc { get; set; }
        // 20180626 为了配合IsAcc
        public int PtyId { get; set; }

        /// <summary>
        /// 20200128 for purchase
        /// </summary>
        public int PilId { get; set; }
        /// <summary>
        /// 20200128 for purchase
        /// </summary>
        public int SolId { get; set; }

        public string PinFId { get; set; }
        public string SodFId { get; set; }
    }
}

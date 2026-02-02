using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class CostPlanLine : BaseClass
    {
        public int ClnId { get; set; }
        public int CplId { get; set; }
        public string CplFId { get; set; }
        public int? ClnLevel1 { get; set; }
        public int? ClnLevel2 { get; set; }
        public string ClnDescription { get; set; }
        public int? PrdId { get; set; }
        public string PrdName { get; set; }
        public int? PitId { get; set; }
        public string PitName { get; set; }
        public decimal? ClnPurchasePrice { get; set; }
        public decimal? ClnUnitPrice { get; set; }
        public decimal? ClnQuantity { get; set; }
        public decimal? ClnTotalPrice { get; set; }
        public decimal? ClnTotalCrudePrice { get; set; }
        public int? VatId { get; set; }
        public string VatLabel { get; set; }
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
        public string ClnPrdName { get; set; }
        public string PrdImgPath { get; set; }

        public decimal? ClnDiscountPercentage { get; set; }
        public decimal? ClnDiscountAmount { get; set; }
        public decimal? ClnPriceWithDiscountHt { get; set; }
        public decimal? ClnMargin { get; set; }

        public string ClnPrdDes { get; set; }

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

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class ClientInvoiceLine
    {
        public int CiiId { get; set; }
        public int CinId { get; set; }
        public string CinFId { get; set; }
        public string PrdFId { get; set; }
        public string PitFId { get; set; }
        public int? CiiLevel1 { get; set; }
        public string CiiDescription { get; set; }
        public int? PrdId { get; set; }
        public string CiiRef { get; set; }
        public decimal? CiiUnitPrice { get; set; }
        public decimal? CiiQuantity { get; set; }
        public decimal? CiiTotalPrice { get; set; }
        public int? VatId { get; set; }
        public int? DflId { get; set; }
        public int? CiiLevel2 { get; set; }
        public decimal? CiiPurchasePrice { get; set; }
        public decimal? CiiTotalCrudePrice { get; set; }
        public string CiiPrdName { get; set; }
        public decimal? CiiDiscountPercentage { get; set; }
        public decimal? CiiDiscountAmount { get; set; }
        public decimal? CiiPriceWithDiscountHt { get; set; }
        public decimal? CiiMargin { get; set; }
        public int LtpId { get; set; }
        public int? PitId { get; set; }
        public string PitName { get; set; }
        public string LineType { get; set; }
        public string PrdImgPath { get; set; }
        public string VatLabel { get; set; }
        public decimal VatRate { get; set; }
        public string PrdName { get; set; }

        /// <summary>
        /// 为search 使用
        /// </summary>
        public int SocId { get; set; }
        
        /// <summary>
        /// 如果cin 是avoir,此处为原client invoice line 的id
        /// </summary>
        public int? CiiAvId { get; set; }

        public string CiiPrdDes { get; set; }
        
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

        /// <summary>
        /// 已经发送物流数量 20210901，针对Logistics
        /// </summary>
        public decimal? LglQuantity { get; set; }


        /// <summary>
        /// 已经发货数量 20210904，针对deliveryform
        /// </summary>
        public decimal? DflQuantity { get; set; }

        public List<KeyValue> CiiLglList { get; set; }
    }
}

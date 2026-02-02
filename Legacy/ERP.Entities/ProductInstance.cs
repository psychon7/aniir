using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class ProductInstance : BaseClass
    {
        public int PrdId { get; set; }
        public int PtyId { get; set; }
        public int PitId { get; set; }
        public string PitDescription { get; set; }
        public string PitRef { get; set; }
        public decimal? PitPrice { get; set; }
        public decimal? PitPurchasePrice { get; set; }
        /// <summary>
        /// 这一项是XML 存放商品的其他信息
        /// </summary>
        public string PitPrdInfo { get; set; }
        public List<PropertyValue> PitAllInfo { get; set; }

        public List<KeyValue> PitImages { get; set; }
        /// <summary>
        /// 20240727 default image path
        /// </summary>
        public string PitDefaultImage { get; set; }

        //#region 为JS的冗余内容
        //public string PropGuid { get; set; }
        //public string PropValue { get; set; }
        //public int SocId { get; set; }
        //#endregion 为JS的冗余内容

        // for supplier 
        public IEnumerable<string> ProductSuppliers { get; set; }

        public decimal? PrdOutsideDiameter { get; set; }
        public decimal? PrdLength { get; set; }
        public decimal? PrdWidth { get; set; }
        public decimal? PrdHeight { get; set; }

        #region for Search and Inventory
        public string PrdRef { get; set; }
        public string PrdName { get; set; }
        public string PrdSubName { get; set; }
        public string PrdDescription { get; set; }
        public string PrdCode { get; set; }
        public string ProductType { get; set; }
        #endregion for Search and Inventory

        public string PitTmpRef { get; set; }

        /// <summary>
        /// XML only for display pit info
        /// </summary>
        public string PrdSepcifications { get; set; }
        public int PitInventoryThreshold { get; set; }
        /// <summary>
        /// 产品库存量，仅用于显示
        /// </summary>
        public decimal? PitInventory { get; set; }
        /// <summary>
        /// for inventory
        /// </summary>
        public int InvId { get; set; }
    }
}

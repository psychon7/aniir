using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;

namespace ERP.Entities
{
    public class Product : BaseClass
    {
        //public string FId { get; set; }
        public int SocId { get; set; }
        public int PrdId { get; set; }
        public int PtyId { get; set; }
        /// <summary>
        /// For category
        /// </summary>
        public string ProductType { get; set; }

        public string PrdRef { get; set; }
        public string PrdName { get; set; }
        /// <summary>
        /// 2017-10-06 Produit famille
        /// </summary>
        public string PrdSubName { get; set; }
        public string PrdDescription { get; set; }
        /// <summary>
        /// XML
        /// </summary>
        public string PrdSepcifications { get; set; }
        public List<PropertyValue> PrdGeneralInfoList { get; set; }
        public List<ProductInstance> InstanceList { get; set; }
        public decimal? PrdPurchasePrice { get; set; }
        public decimal? PrdPrice { get; set; }
        public int PrdGarantieMonth { get; set; }
        public string PrdCode { get; set; }

        //#region 为JS的冗余内容
        //public string PropGuid { get; set; }
        //public string PropValue { get; set; }
        //#endregion 为JS的冗余内容


        /// <summary>
        /// 为处理Excel 而建，不在页面显示
        /// </summary>
        public string PrdFileName { get; set; }

        public DateTime? PrdDCreation { get; set; }
        public DateTime? PrdDUpdate { get; set; }

        /// <summary>
        /// 显示一个产品图片，cost plan line, order line 等页面
        /// </summary>
        public string PrdImg { get; set; }

        public List<KeyValue> PrdImgList { get; set; }

        #region Dimension

        //public decimal? PrdInsideDiameter { get; set; }
        /// <summary>
        /// 墙外的直径
        /// </summary>
        public decimal? PrdOutsideDiameter { get; set; }
        public decimal? PrdLength { get; set; }
        public decimal? PrdWidth { get; set; }
        public decimal? PrdHeight { get; set; }
        /// <summary>
        /// 墙体开口的直径
        /// </summary>
        public decimal? PrdHoleSize { get; set; }
        /// <summary>
        /// 墙体开口的深度
        /// </summary>
        public decimal? PrdDepth { get; set; }
        /// <summary>
        /// 墙体开口的长
        /// </summary>
        public decimal? PrdHoleLength { get; set; }
        /// <summary>
        /// 墙体开口的宽
        /// </summary>
        public decimal? PrdHoleWidth { get; set; }

        public decimal? PrdWeight { get; set; }
        public decimal? PrdUnitLength { get; set; }
        public decimal? PrdUnitWidth { get; set; }
        public decimal? PrdUnitHeight { get; set; }
        public decimal? PrdUnitWeight { get; set; }
        public int? PrdQuantityEachCarton { get; set; }
        public decimal? PrdCartonLength { get; set; }
        public decimal? PrdCartonWidth { get; set; }
        public decimal? PrdCartonHeight { get; set; }
        public decimal? PrdCartonWeight { get; set; }
        /// <summary>
        /// 墙体外的长
        /// </summary>
        public decimal? PrdOutsideLength { get; set; }
        /// <summary>
        /// 墙体外的宽
        /// </summary>
        public decimal? PrdOutsideWidth { get; set; }
        /// <summary>
        /// 墙体外的高
        /// </summary>
        public decimal? PrdOutsideHeight { get; set; }





        #endregion Dimension

        public EntityColor EntityColor { get; set; }
        public string PtyStandards { get; set; }


        #region 2017-09-29
        public string PrdTmpRef { get; set; }
        /// <summary>
        ///  this field is only for import from excel and compare the references todo: no use for other purpose
        /// </summary>
        public string PrdNewRef { get; set; }
        public string PrdSupDes { get; set; }

        #endregion 2017-09-29

        #region 2017-11-22
        // for import
        public int? SupId { get; set; }
        // for site
        public int? SubPrdCount { get; set; }
        #endregion 2017-11-22

        public List<KeyValue> ExpressProps { get; set; }

        #region 20230608
        /// <summary>
        /// 用于直接选PIT 的，在SOD页面的SOL里
        /// </summary>
        public int PitId { get; set; }
        #endregion 20230608


        // for supplier 
        public IEnumerable<string> ProductSuppliers { get; set; }
    }

    public class ProductInCategory : BaseClass
    {
        public int Id { get; set; }
        public Product Product { get; set; }
        public Category Category { get; set; }
        public string PcaDescription { get; set; }
    }

    public class RecommandedProduct : Product
    {
        public int CatId { get; set; }
        public int RmpId { get; set; }
        public int RmpOrder { get; set; }
        public bool RmpActived { get; set; }
    }

    public class ProductAndCount : BaseClass
    {
        public int Count { get; set; }
        public List<Product> Product { get; set; }
    }

}

using System.Collections.Generic;
using ERP.Entities;

namespace ERP.Web.Api.Models.DTOs
{
    /// <summary>
    /// Request model for updating an existing product
    /// </summary>
    public class ProductUpdateRequest
    {
        public string PrdRef { get; set; }
        public string PrdName { get; set; }
        public string PrdSubName { get; set; }
        public string PrdDescription { get; set; }
        public int? PtyId { get; set; }
        public decimal? PrdPrice { get; set; }
        public decimal? PrdPurchasePrice { get; set; }
        public int? PrdGarantieMonth { get; set; }
        public string PrdCode { get; set; }

        // Dimension properties
        public decimal? PrdOutsideDiameter { get; set; }
        public decimal? PrdLength { get; set; }
        public decimal? PrdWidth { get; set; }
        public decimal? PrdHeight { get; set; }
        public decimal? PrdHoleSize { get; set; }
        public decimal? PrdDepth { get; set; }
        public decimal? PrdHoleLength { get; set; }
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
        public decimal? PrdOutsideLength { get; set; }
        public decimal? PrdOutsideWidth { get; set; }
        public decimal? PrdOutsideHeight { get; set; }

        // Additional fields
        public string PrdTmpRef { get; set; }
        public string PrdSupDes { get; set; }
        public string PrdFileName { get; set; }

        // General info (specifications stored as XML)
        public List<PropertyValue> PrdGeneralInfoList { get; set; }

        // Product instances (variants)
        public List<ProductInstanceUpdateRequest> InstanceList { get; set; }

        // Activation status
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// Request model for updating a product instance (variant)
    /// </summary>
    public class ProductInstanceUpdateRequest
    {
        public int PitId { get; set; }
        public string PitRef { get; set; }
        public string PitDescription { get; set; }
        public decimal? PitPrice { get; set; }
        public decimal? PitPurchasePrice { get; set; }
        public int? PitInventoryThreshold { get; set; }
        public List<PropertyValue> PitAllInfo { get; set; }
    }
}

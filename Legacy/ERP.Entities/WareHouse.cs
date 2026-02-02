using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace ERP.Entities
{
    public class WareHouse : BaseClass
    {
        public int WhsId { get; set; }
        public string WhsName { get; set; }
        public string WhsCode { get; set; }
        public string WhsAddress1 { get; set; }
        public string WhsAddress2 { get; set; }
        public string WhsPostCode { get; set; }
        public string WhsCity { get; set; }
        public string WhsCountry { get; set; }
        public int WhsVolume { get; set; }
        public int SheCount { get; set; }
        public decimal? PrdCount { get; set; }
    }

    public class Shelves : BaseClass
    {
        public int SheId { get; set; }
        public int WhsId { get; set; }
        public string SheCode { get; set; }
        public int SheFloor { get; set; }
        public int SheLine { get; set; }
        public int SheRow { get; set; }
        public decimal? SheLenght { get; set; }
        public decimal? SheWidth { get; set; }
        public decimal? SheHeight { get; set; }
        public decimal? SheAvailabelVolume { get; set; }
        public decimal? SumPrd { get; set; }
    }

    public class ProductInShelves : ProductInstance
    {
        /// <summary>
        /// 库存表，有些商品没有在商品表中，就用库存表对应
        /// </summary>
        public int InvId { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? QuantityTotal { get; set; }
    }

    /// <summary>
    /// 用于delivery form 派送的时候的选择
    /// </summary>
    public class ProductWithShelves : Shelves
    {
        public int DflId { get; set; }
        public int PitId { get; set; }
        public int PrdId { get; set; }
        public string PrdName { get; set; }
        public decimal? QuantityTotal { get; set; }
        public string WareHouseName { get; set; }
        public int InvId { get; set; }
        public int PshId { get; set; }
    }
}

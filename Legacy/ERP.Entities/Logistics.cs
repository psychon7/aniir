using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Logistics : BaseClass
    {
        public int Id { get; set; }
        public string LgsCode { get; set; }
        public string LgsName { get; set; }
        public bool LgsIsSent { get; set; }
        public int? SupId { get; set; }
        public string SupFId { get; set; }
        public DateTime? LgsDateSend { get; set; }
        public DateTime? LgsDateArrivePre { get; set; }
        public DateTime? LgsDateArrive { get; set; }
        public string LgsComment { get; set; }
        public int SocId { get; set; }
        public string LgsFile { get; set; }
        public Guid LgsGuid { get; set; }

        /// <summary>
        /// 进货还是送货
        /// </summary>
        public bool LgsIsPurchase { get; set; }

        /// <summary>
        /// 物流号码，用于查询
        /// </summary>
        public string LgsTrackingNumber { get; set; }

        public int UsrCreatorId { get; set; }
        public User Creator { get; set; }
        public DateTime DateCreation { get; set; }
        public DateTime DateUpdate { get; set; }

        public string _LgsDateSend { get; set; }
        public string _LgsDateArrivePre { get; set; }
        public string _LgsDateArrive { get; set; }

        public List<LogisticsLine> AllLgLines { get; set; }
        public Supplier Supplier { get; set; }

        // for search
        public string SinCode { get; set; }
        public bool LgsIsReceived { get; set; }
        public bool LgsIsStockIn { get; set; }
        public DateTime? LgsDateStockIn { get; set; }
        /// <summary>
        /// Consignee Id
        /// </summary>
        public int ConId { get; set; }

        public Consignee Consignee { get; set; }
        /// <summary>
        /// 一个/多个LGS 对应一个SOD，该SOD为账单
        /// </summary>
        public int SodId { get; set; }
        public string SodCode { get; set; }
        public string SodFId { get; set; }
        /// <summary>
        /// 2023-06-11 用于搜索页面，确认是否有附件
        /// </summary>
        public bool HasFiles { get; set; }
    }

    public class LogisticsLine : BaseClass
    {
        public int Id { get; set; }
        public Guid LglGuid { get; set; }
        public int LgsId { get; set; }
        public decimal? LglQuantityTotal { get; set; }
        public decimal? LglQuantityDeliveried { get; set; }
        public decimal? LglQuantity { get; set; }
        public decimal? LglUnitPrice { get; set; }
        public decimal? TotalPrice { get; set; }
        public string ProductName { get; set; }
        public string ProductRef { get; set; }
        public string LglDescription { get; set; }
        public int? PrdId { get; set; }
        public int? PitId { get; set; }
        public string PrdFId { get; set; }
        public string PitFId { get; set; }
        /// <summary>
        /// supplier invoice line
        /// </summary>
        public int? SilId { get; set; }
        public int SinId { get; set; }
        public string SinCode { get; set; }
        public string PrdDescription { get; set; }
        public string PrdImage { get; set; }

        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int SheId { get; set; }

        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int InvId { get; set; }

        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int WhsId { get; set; }

        public int? SolId { get; set; }

        public int? SodId { get; set; }
        public string SodCode { get; set; }
        public string Supplier { get; set; }
        /// <summary>
        /// 20210901 添加，用于Cin发物流
        /// </summary>
        public int? CiiId { get; set; }
        public int? CinId { get; set; }
        public string CinFId { get; set; }
        public string CinCode { get; set; }
        public string Client { get; set; }
    }
}

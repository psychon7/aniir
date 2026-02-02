using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class SupplierProduct : BaseClass
    {
        public int Id { get; set; }
        public int SupId { get; set; }
        public string SupFId { get; set; }
        public int PrdId { get; set; }
        public string PrdFId { get; set; }
        public string PrdRef { get; set; }
        public string PrdName { get; set; }
        /// <summary>
        /// supplier's product reference 
        /// </summary>
        public string SprPrdRef { get; set; }
        /// <summary>
        /// price normale
        /// </summary>
        public decimal? SprPrice_1_100 { get; set; }
        /// <summary>
        /// price dimmable
        /// </summary>
        public decimal? SprPrice_100_500 { get; set; }
        /// <summary>
        /// price dali
        /// </summary>
        public decimal? SprPrice_500_plus { get; set; }
        public string SprComment { get; set; }
        // for consult no set
        public int PtyId { get; set; }
        public string PrdType { get; set; }
        public int SocId { get; set; }
        public int CurId { get; set; }
        public string Currency { get; set; }
        public string SupplierName { get; set; }

        public decimal? SprCoef100 { get; set; }
        public decimal? SprCoef500 { get; set; }

    }
}

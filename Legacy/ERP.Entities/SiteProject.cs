using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class SiteProject : BaseClass
    {
        public int PrjId { get; set; }
        public string PrjName { get; set; }
        public DateTime? PrjDate { get; set; }
        public DateTime PrjDCreate { get; set; }
        public string PrjDescription { get; set; }
        public string PrjLocation { get; set; }
        public string PrjClient { get; set; }
        public string PrjDesigner { get; set; }
        public bool PrjActived { get; set; }
        /// <summary>
        /// first image of site project image, order = 1
        /// </summary>
        public string PrjImg { get; set; }
        public bool PrjRecommended { get; set; }
        public IEnumerable<SiteProjectImage> PrjImages { get; set; }
        public IEnumerable<SiteProjectProduct> PrjProducts { get; set; }
        public string PrjTag { get; set; }
        public IEnumerable<KeyValue> PrjTags { get; set; }
    }
    public class SiteProjectImage : BaseClass
    {
        public int PigId { get; set; }
        public int PrjId { get; set; }
        public int PigOrder { get; set; }
        public string PigPath { get; set; }
    }
    public class SiteProjectProduct : BaseClass
    {
        public int PpdId { get; set; }
        public int PrdId { get; set; }
        public int PrjId { get; set; }
        public string PrdRef { get; set; }
        public string PrdName { get; set; }
        public string PrdSubName { get; set; }
        public string PrdImg { get; set; }
    }

}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Category : BaseClass
    {
        public int CatId { get; set; }
        public string CatName { get; set; }
        public string CatSubName1 { get; set; }
        public string CatSubName2 { get; set; }
        public int CatOrder { get; set; }
        public bool CatIsActived { get; set; }
        public string CatImagePath { get; set; }
        public bool CatDisplayInMenu { get; set; }
        public bool CatDisplayInExhibition { get; set; }
        public int? CatParentCatId { get; set; }
        public string CatParentCatName { get; set; }
        public string CatDescription { get; set; }
        public int SocId { get; set; }

        public int PrdCount { get; set; }

        /// <summary>
        /// only for display
        /// </summary>
        public int CatLevel { get; set; }

        public IEnumerable<Category> SubCategories { get; set; }
    }
}

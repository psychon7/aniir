using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    class ECOLECInput
    {
    }
    public class ProInputECOLEC
    {
        public int catId { get; set; }

        public int rows { get; set; }

        public int pages { get; set; }

        public string value { get; set; }

    }
    public class ShoppingECOLEC
    {
        public int Id { get; set; }
        public string ImgUrl { get; set; }
        public string Name { get; set; }
        public string Ref { get; set; }
        public string pit_prd_info { get; set; }
        public int prdId { get; set; }
        public int ptyId { get; set; }
        public int pitId { get; set; }
        public int Qty { get; set; }
        public decimal? price { get; set; }
        public string Couleur { get; set; }
        public string Puissance { get; set; }
        public string Driver { get; set; }
        public string Comment { get; set; }
        public int orderId { get; set; }

    }
 
    public class CatOutECOLEC
    {
        public int CatId { get; set; }

        public string CatName { get; set; }

        public int FId { get; set; }

    }

    public class CatOutListECOLEC
    {
        public int CatId { get; set; }

        public string CatName { get; set; }

        public List<CatOut> CatList { get; set; }
    }

    public class PrdDetailsOutECOLEC
    {
        public int prdId { get; set; }

        public string prdName { get; set; }

        public string prdRef { get; set; }

        public string prdSubName { get; set; }

        public string description { get; set; }

        public decimal? price { get; set; }

        public decimal? weight { get; set; }

        public decimal? height { get; set; }

        public List<ProductInstance> prdPitList { get; set; }

        public List<PropertyValue> prdXmlList { get; set; }

        public List<string> ImgList { get; set; }

        public bool IsWish { get; set; }

    }
 
}

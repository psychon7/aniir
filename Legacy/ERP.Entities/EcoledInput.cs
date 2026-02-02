using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class EcoledInput
    {

    }

    public class ProInput
    {
        public int catId { get; set; }

        public int rows { get; set; }

        public int pages { get; set; }

        public string value { get; set; }

    }
    public class Shopping
    {
        public int Id { get; set; }
        public string ImgUrl { get; set; }
        public string Name { get; set; }
        public string Ref { get; set; }
        public string  pit_prd_info{ get; set; }
        public int prdId { get; set; }
        public int ptyId { get; set; }
        public int pitId { get; set; }
        public int Qty { get; set; }
        public string Couleur { get; set; }
        public string Puissance { get; set; }
        public string Driver { get; set; }
        public string Comment { get; set; }

    }
    public class CartProductDetails
    {
        public int CartId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal? Price { get; set; }
        public decimal? Total { get; set; }
        public string ImgUrl { get; set; }
    }
    public class WishlistOut
    {
        public int wllId { get; set; }
        public int prdId { get; set; }
        public string ImgUrl { get; set; }
        public string prdName { get; set; }
        public string prdRef { get; set; }
        public int ptyId { get; set; }
        public string Attr1 { get; set; }
        public string Attr2 { get; set; }
        public string Attr3 { get; set; }
        public List<ProductInstance> prdPitList { get; set; }
    }
    public class CatOut
    {
        public int CatId { get; set; }

        public string CatName { get; set; }

        public int FId { get; set; }

    }

    public class CatOutList
    {
        public int CatId { get; set; }

        public string CatName { get; set; }

        public List<CatOut> CatList { get; set; }
    }

    public class PrdDetailsOut
    {
        public int prdId { get; set; }

        public string prdName { get; set; }

        public string prdRef { get; set; }

        public string prdSubName { get; set; }

        public string description { get; set; }

        public List<ProductInstance> prdPitList { get; set; }

        public List<PropertyValue> prdXmlList { get; set; }

        public List<string> ImgList { get; set; }

        public bool IsWish { get; set; }

    }

    public class PrjDetaisOut
    {

        public int prjId { get; set; }

        public string firstImg { get; set; }

        public List<string> otherImg { get; set; }

        public string name { get; set; }

        public string date { get; set; }

        public string cateDate { get; set; }

        public string description { get; set; }

        public string tags { get; set; }

        public string loction { get; set; }

        public string client { get; set; }

        public string designer { get; set; }

        public List<KeyValue> prdList { get; set; }

        public List<KeyValue> tagsList { get; set; }


    }
}

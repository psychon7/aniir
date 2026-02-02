using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.Product
{
    public partial class Product : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateProduct(Entities.Product oneProduct)
        {
            ProductServices ProductServices = new ProductServices();
            var FkId = oneProduct.FId;
            string returnvalue = string.Empty;

            int prd_Id = 0;
            if (!string.IsNullOrEmpty(FkId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(FkId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
            }
            oneProduct.PrdId = prd_Id;
            oneProduct.SocId = CurrentUser.Soc_id;
            var values = ProductServices.CreateUpdateProduct(oneProduct);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "prdId");
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string DuplicateProduct(Entities.Product oneProduct)
        {
            string returnvalue = string.Empty;
            ProductServices ProductServices = new ProductServices();
            var FkId = oneProduct.FId;
            int prd_Id = IntTryParse(FkId, "prdId");
            oneProduct.PrdId = prd_Id;
            oneProduct.SocId = CurrentUser.Soc_id;
            var values = ProductServices.DuplicateProduct(oneProduct);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "prdId");
            return returnvalue;
        }
    }
}
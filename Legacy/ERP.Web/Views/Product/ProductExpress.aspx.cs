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
    public partial class ProductExpress : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateProductExpress(Entities.Product oneProduct)
        {
            ProductServices ProductServices = new ProductServices();
            var FkId = oneProduct.FId;
            string returnvalue = string.Empty;
            int prd_Id = IntTryParse(FkId, "prdId");
            oneProduct.PrdId = prd_Id;
            oneProduct.SocId = CurrentUser.Soc_id;
            var values = ProductServices.CreateProductExpress(oneProduct);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "prdId");
            return returnvalue;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.Entities;
using ERP.DataServices;
using ERP.Repositories;

namespace ERP.Web.Views.Product
{
    public partial class ProductAttribute_Old : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateProductAttr(ProductType oneProductType)
        {
            ProductTypeServices productTypeServices = new ProductTypeServices();
            var FkId = oneProductType.FId;
            int pty_id = 0;
            if (!string.IsNullOrEmpty(FkId))
            {
                try
                {
                    var strcliId = StringCipher.DecoderSimple(FkId, "ptyId");
                    pty_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
            }
            oneProductType.SocId = CurrentUser.Soc_id;
            oneProductType.PtyId = pty_id;
            var ptyId = productTypeServices.CreateUpdateProductType(oneProductType);
            string ptycode = StringCipher.EncoderSimple(ptyId.ToString(), "ptyId");
            return ptycode;
        }
    }
}
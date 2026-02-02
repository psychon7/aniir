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

namespace ERP.Web.Views.Supplier
{
    public partial class SupplierProduct : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateSupplierProduct(Entities.SupplierProduct spr)
        {
            SupplierProductServices SupplierProductServices = new SupplierProductServices();
            string returnvalue = string.Empty;
            spr.PrdId = IntTryParse(spr.PrdFId, "prdId");
            spr.SupId = IntTryParse(spr.SupFId, "supId");
            spr.Id = IntTryParse(spr.FId, "sprId");
            spr.SocId = CurrentUser.Soc_id;
            try
            {
                SupplierProductServices.CreateUpdateSupplierProduct(spr);
                returnvalue = StringCipher.EncoderSimple(spr.SupId.ToString(), "supId");
            }
            catch (Exception)
            {
            }
            return returnvalue;
        }
    }
}
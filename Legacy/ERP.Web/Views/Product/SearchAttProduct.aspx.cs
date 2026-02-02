using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Entities;

namespace ERP.Web.Views.Product
{
    public partial class SearchAttProduct : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }



        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string SearchProductAttribute(string ptyName, string ptyDes)
        {
            string returnvalue = string.Empty;
            ProductTypeServices ProductTypeServices = new ProductTypeServices();
            var pty = new ProductType
            {
                SocId = CurrentUser.Soc_id,
                PtyName = ptyName,
                PtyDescription = ptyDes
            };

            var ptys = ProductTypeServices.SearchProductTypes(pty);
            returnvalue = Serialize(ptys);
            return returnvalue;
        }

    }
}
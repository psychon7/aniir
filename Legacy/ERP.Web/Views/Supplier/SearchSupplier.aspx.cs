using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;

namespace ERP.Web.Views.Supplier
{
    public partial class SearchSupplier : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string SearchSupplierWithCriterion(Entities.Supplier searchSupplier)
        {
            string returnvalue = string.Empty;
            SupplierServices supplierServices = new SupplierServices();
            searchSupplier.SocId = CurrentUser.Soc_id;
            searchSupplier.SuperRight = CurrentUser.SuperRight;
            searchSupplier.UsrCreatedBy = CurrentUser.Id;
            var cli = supplierServices.SearchSupplier(searchSupplier);
            returnvalue = Serialize(cli);
            return returnvalue;
        }
    }
}
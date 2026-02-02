using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;

namespace ERP.Web.Views.SupplierOrder
{
    public partial class SupplierOrderSup : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateSupplierOrder(Entities.PurchaseBaseClass item)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            string returnvalue = string.Empty;
            item.SocId = CurrentUser.Soc_id;
            item.UsrId = CurrentUser.Id;
            item.DateUpdate = item.DateCreation > DateTime.Now ? item.DateCreation : DateTime.Now;
            item.SodId = IntTryParse(item.SodFId, "sodId");
            item.SupId = IntTryParse(item.SupFId, "supId");
            item.SubSupId = IntTryParse(item.SubSupFId, "supId");
            var values = PurchaseBaseServices.CreateUpdateSupplierOrder(item);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "sodId");
            return returnvalue;
        }
    }
}
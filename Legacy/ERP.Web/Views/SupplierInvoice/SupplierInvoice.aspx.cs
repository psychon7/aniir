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

namespace ERP.Web.Views.SupplierInvoice
{
    public partial class SupplierInvoice : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateSupplierInvoice(Entities.PurchaseBaseClass item)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            string returnvalue = string.Empty;
            item.SocId = CurrentUser.Soc_id;
            item.UsrId = CurrentUser.Id;
            item.SinId = IntTryParse(item.SinFId, "sinId");
            item.SupId = IntTryParse(item.SupFId, "supId");
            item.DateUpdate = item.DateCreation > DateTime.Now ? item.DateCreation : DateTime.Now;
            item.SinDateStartProduction = GetDateTimeOrNow(item._DateStartProduction, true);
            item.SinDateCompleteProductionPlanned = GetDateTimeOrNow(item._DateCompleteProductionPlanned, true);
            item.SinDateCompleteProduction = GetDateTimeOrNow(item._DateCompleteProduction, true);
            var values = PurchaseBaseServices.CreateUpdateSupplierInvoice(item);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "sinId");
            return returnvalue;
        }
    }
}
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
using ERP.Web.Shared;

namespace ERP.Web.Views.PurchaseIntent
{
    public partial class PurchaseIntent : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        public static string CreateUpdatePurchaseIntent(Entities.PurchaseBaseClass item)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            string returnvalue = string.Empty;
            item.DateUpdate = item.DateCreation > DateTime.Now ? item.DateCreation : DateTime.Now;
            item.SocId = CurrentUser.Soc_id;
            item.UsrId = CurrentUser.Id;
            item.PinId = IntTryParse(item.PinFId, "pinId");
            var values = PurchaseBaseServices.CreateUpdatePurchaseIntent(item);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "pinId");
            return returnvalue;
        }
    }
}
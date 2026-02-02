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

namespace ERP.Web.Views.DeliveryForm
{
    public partial class DeliveryForm : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateDeliveryForm(Entities.DeliveryForm oneDeliveryForm)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
            string returnvalue = string.Empty;
            oneDeliveryForm.SocId = CurrentUser.Soc_id;
            oneDeliveryForm.CodId = IntTryParse(oneDeliveryForm.CodFId, "codId");
            oneDeliveryForm.CliId = IntTryParse(oneDeliveryForm.CliFId, "cliId");
            oneDeliveryForm.DfoId = IntTryParse(oneDeliveryForm.FId, "dfoId");
            //oneDeliveryForm.DfoDCreation = DateTime.Now;
            oneDeliveryForm.DfoDUpdate = DateTime.Now;
            oneDeliveryForm.DfoDDelivery = GetDateTimeOrNow(oneDeliveryForm._DfoDDelivery, false).Value;
            oneDeliveryForm.UsrCreatorId = CurrentUser.Id;
            var values = DeliveryFormServices.CreateUpdateDeliveryForm(oneDeliveryForm);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "dfoId");
            return returnvalue;
        }
    }
}
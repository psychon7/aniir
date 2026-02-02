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

namespace ERP.Web.Views.ClientOrder
{
    public partial class ClientOrder : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        public static string CreateUpdateClientOrder(Entities.ClientOrder oneClientOrder)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            ClientOrderServices ClientOrderServices = new ClientOrderServices();
            string returnvalue = string.Empty;
            oneClientOrder.SocId = CurrentUser.Soc_id;
            oneClientOrder.CplId = IntTryParse(oneClientOrder.CplFId, "cplId");
            oneClientOrder.CodId =  IntTryParse(oneClientOrder.FId, "codId");
            //oneClientOrder.CodDateCreation = oneClientOrder.CodDateCreation;
            oneClientOrder.CodDateUpdate = DateTime.Now;
            oneClientOrder.CodDateEndWork = GetDateTimeOrNow(oneClientOrder._CodDateEndWork, true);
            oneClientOrder.CodDatePreDeliveryForm = GetDateTimeOrNow(oneClientOrder._CodDatePreDeliveryForm, true);
            oneClientOrder.CodDatePreDeliveryTo = GetDateTimeOrNow(oneClientOrder._CodDatePreDeliveryTo, true);
            oneClientOrder.UsrCreatorId = CurrentUser.Id;
            var values = ClientOrderServices.CreateUpdateClientOrder(oneClientOrder);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "codId");
            return returnvalue;
        }
    }
}
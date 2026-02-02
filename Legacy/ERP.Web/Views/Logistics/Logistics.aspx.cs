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

namespace ERP.Web.Views.Logistics
{
    public partial class Logistics : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateLgs(Entities.Logistics oneLgs)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            LogisticsServices LogisticsServices = new LogisticsServices();
            string returnvalue = string.Empty;
            oneLgs.SocId = CurrentUser.Soc_id;
            var FkId = oneLgs.FId;
            int lgs_id = IntTryParse(FkId, "lgsId");
            oneLgs.SupId = IntTryParse(oneLgs.SupFId, "supId");
            oneLgs.LgsDateSend = GetDateTimeOrNow(oneLgs._LgsDateSend, true);
            oneLgs.LgsDateArrivePre = GetDateTimeOrNow(oneLgs._LgsDateArrivePre, true);
            oneLgs.LgsDateArrive = GetDateTimeOrNow(oneLgs._LgsDateArrive, true);
            oneLgs.Id = lgs_id;
            oneLgs.UsrCreatorId = CurrentUser.Id;
            oneLgs.LgsIsPurchase = true;
            if (oneLgs.LgsIsSent && oneLgs.LgsDateSend == null)
            {
                oneLgs.LgsDateSend = DateTime.Now;
            }
            oneLgs.DateUpdate = oneLgs.DateCreation > DateTime.Now ? oneLgs.DateCreation : DateTime.Now;
            var values = LogisticsServices.CreateUpdateLogistics(oneLgs);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "lgsId");
            return returnvalue;
        }
    }
}
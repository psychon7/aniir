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

namespace ERP.Web.Views.CostPlan
{
    public partial class CostPlan : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateCostPlan(Entities.CostPlan oneCostPlan)
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            CostPlanServices CostPlanServices = new CostPlanServices();
            string returnvalue = string.Empty;
            oneCostPlan.SocId = CurrentUser.Soc_id;
            var FkId = oneCostPlan.FId;
            int cpl_id = 0;
            if (!string.IsNullOrEmpty(FkId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(FkId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
            }
            var PrjFId = oneCostPlan.PrjFId;
            int prj_id = 0;
            if (!string.IsNullOrEmpty(PrjFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(PrjFId.UrlDecode2String(), "prjId");
                    prj_id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
            }
            oneCostPlan.CplDateCreation = GetDateTimeOrNow(oneCostPlan._dCreationString).Value;
            oneCostPlan.CplDateUpdate = GetDateTimeOrNow(oneCostPlan._dUpdateString).Value;
            oneCostPlan.CplDatePreDelivery = GetDateTimeOrNow(oneCostPlan._dPreDeliveryString, true);
            oneCostPlan.CplDateValidity = GetDateTimeOrNow(oneCostPlan._dValidityString).Value;
            oneCostPlan.CplId = cpl_id;
            oneCostPlan.PrjId = prj_id;
            oneCostPlan.UsrCreatorId = CurrentUser.Id;
            var values = CostPlanServices.CreateUpdateCostPlan(oneCostPlan);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "cplId");
            return returnvalue;
        }
    }
}
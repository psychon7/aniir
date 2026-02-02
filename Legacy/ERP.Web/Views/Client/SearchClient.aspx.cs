using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;

namespace ERP.Web.Views.Client
{
    public partial class SearchClient : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string SearchClientWithCriterion(Entities.Client searchClient)
        {
            int ResultLimit = Convert.ToInt32(WebConfigurationManager.AppSettings["ResultLimit"]);
            string returnvalue = string.Empty;
            ClientServices clientServices = new ClientServices();
            searchClient.SocId = CurrentUser.Soc_id;
            searchClient.UsrCreatedBy = CurrentUser.Id;
            searchClient.SuperRight = CurrentUser.SuperRight;
            var cli = clientServices.SearchClient(searchClient).Skip(0).Take(ResultLimit);
            returnvalue = Serialize(cli);
            return returnvalue;
        }
    }
}
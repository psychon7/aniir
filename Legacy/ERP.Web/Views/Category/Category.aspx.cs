using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.Category
{
    public partial class Category : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateCategory(Entities.Category oneCategory)
        {
            CategoryServices CategoryServices = new CategoryServices();
            string returnvalue = string.Empty;
            int catId = IntTryParse(oneCategory.FId, "catId");
            oneCategory.CatId = catId;
            oneCategory.SocId = CurrentUser.Soc_id;
            var values = CategoryServices.CreateUpdateCategory(oneCategory);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "catId");
            return returnvalue;
        }
    }
}
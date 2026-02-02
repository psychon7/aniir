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
using ERP.Entities;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.Project
{
    public partial class Project : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateProject(Entities.Project oneProject)
        {

            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            ProjectServices ProjectServices = new ProjectServices();
            string returnvalue = string.Empty;
            oneProject.SocId = CurrentUser.Soc_id;
            var FkId = oneProject.FId;
            int prj_id = IntTryParse(FkId, "prjId");
            try
            {
                //oneProject.PrjDCreation = Convert.ToDateTime(oneProject._dCreationString, culture.DateTimeFormat);
                oneProject.PrjDCreation = DateTime.Parse(oneProject._dCreationString, current);
            }
            catch (Exception)
            {
            }
            oneProject.PrjDUpdate = DateTime.Now;
            //try
            //{
            //    //oneProject.PrjDUpdate = Convert.ToDateTime(oneProject._dUpdateString, culture.DateTimeFormat);
            //    oneProject.PrjDUpdate = DateTime.Parse(oneProject._dUpdateString, current);
            //}
            //catch (Exception)
            //{
            //}
            oneProject.PrjId = prj_id;
            oneProject.UsrCreatorId = CurrentUser.Id;
            var values = ProjectServices.CreateUpdateProject(oneProject);
            returnvalue = StringCipher.EncoderSimple(values.ToString(), "prjId");
            return returnvalue;
        }
    }
}
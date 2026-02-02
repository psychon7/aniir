using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.Services;
using AjaxControlToolkit;
using ERP.DataServices;
using ERP.Entities;

namespace ERP.Web.Views.Album
{
    public partial class Album : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (CurrentUser.RolId != 1)
            {
                ClientScript.RegisterStartupScript(Page.GetType(), "OnLoad", "RightErrorRedirect('../../Default.aspx');", true);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateAlbum(KeyValueSimple oneAlbum)
        {
            AlbumServices AlbumServices = new AlbumServices();
            var albId = AlbumServices.CreateUpdateAlbum(oneAlbum, CurrentUser.Soc_id);
            var oneAlb = AlbumServices.GetOneAlbum(albId, CurrentUser.Soc_id);
            return Serialize(oneAlb);
        }


        protected void OnUploadComplete(object sender, AjaxFileUploadEventArgs e)
        {
            string fileName = Path.GetFileName(e.FileName);
            //AjaxFileUpload11.SaveAs(Server.MapPath("~/" + fileName));
        }

        protected void testtesttest_OnUploadedComplete(object sender, AsyncFileUploadEventArgs e)
        {
            string fileName = Path.GetFileName(e.FileName);
        }

        protected void lbtn_logout_OnClick(object sender, EventArgs e)
        {
            FormsAuthentication.SignOut();
            FormsAuthentication.RedirectToLoginPage();
        }
    }
}
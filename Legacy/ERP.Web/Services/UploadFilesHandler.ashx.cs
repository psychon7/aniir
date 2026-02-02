using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Serialization;
using System.Web.Security;
using ERP.Web.Shared;
using ERP.DataServices;
using ERP.Entities;
using System.Net;
using ERP.Repositories;
using ERP.Repositories.Shared;

namespace ERP.Web.Services
{
    /// <summary>
    /// Summary description for UploadFilesHandler
    /// </summary>
    public class UploadFilesHandler : IHttpHandler
    {
        AlbumServices AlbumServices = new AlbumServices();
        ProductServices ProductServices = new ProductServices();

        public void ProcessRequest(HttpContext context)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                context.Response.ContentType = "text/plain"; //"application/json";

                var r = new System.Collections.Generic.List<ViewDataUploadFilesResult>();
                JavaScriptSerializer js = new JavaScriptSerializer();
                bool hasfile = false;
                foreach (string file in context.Request.Files)
                {
                    HttpPostedFile hpf = context.Request.Files[file] as HttpPostedFile;
                    string albId = WebUtility.HtmlDecode(context.Request.QueryString["albId"]);
                    string prdId = WebUtility.HtmlDecode(context.Request.QueryString["prdId"]);
                    string order = WebUtility.HtmlDecode(context.Request.QueryString["order"]);
                    string pimId = WebUtility.HtmlDecode(context.Request.QueryString["pimId"]);
                    string palId = WebUtility.HtmlDecode(context.Request.QueryString["palId"]);
                    string pitId = WebUtility.HtmlDecode(context.Request.QueryString["pitId"]);
                    string ptiId = WebUtility.HtmlDecode(context.Request.QueryString["ptiId"]);
                    string description = WebUtility.HtmlDecode(context.Request.QueryString["des"]);
                    // TODO: type : 1--> album; 2--> product; 3 --> product instance
                    string type = WebUtility.HtmlDecode(context.Request.QueryString["type"]);
                    string FileName = string.Empty;
                    string browser = HttpContext.Current.Request.Browser.Browser.ToUpper();

                    int prd_id = 0;
                    int.TryParse(StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId"), out prd_id);
                    if (browser == "IE" || browser == "INTERNETEXPLORER")
                    {
                        string[] files = hpf.FileName.Split(new char[] { '\\' });
                        FileName = files[files.Length - 1];
                    }
                    else
                    {
                        FileName = hpf.FileName;
                    }
                    if (hpf.ContentLength == 0)
                    {
                        continue;
                    }
                    else
                    {
                        hasfile = true;
                    }

                    string appSettingPath = string.Empty;
                    string folderId = string.Empty;
                    //if (!string.IsNullOrEmpty(albId) && albId != "0")
                    if (type == "1")
                    {
                        appSettingPath = "UpLoadFilesAlbumPhoto";
                        folderId = albId;
                    }
                    //else if (!string.IsNullOrEmpty(prdId) && prdId != "0")
                    else if (type == "2" || type == "3")
                    {
                        appSettingPath = "UpLoadFilesProductPhoto";
                        if (type == "2")
                        {
                            folderId = prd_id.ToString();
                        }
                        else
                        {
                            folderId = prd_id.ToString() + "\\" + pitId.ToString();
                        }
                    }

                    string tmpPath = WebConfigurationManager.AppSettings[appSettingPath];
                    string prdPath = string.Format(@"{0}\{1}", tmpPath, folderId);

                    if (!Directory.Exists(prdPath))
                    {
                        Directory.CreateDirectory(prdPath);
                    }
                    string savedFileName = FileControl.CheckAndGetNewPath(prdPath + "\\" + FileName);
                    hpf.SaveAs(savedFileName);
                    string url = string.Empty;
                    //if (!string.IsNullOrEmpty(albId) && albId != "0")
                    if (type == "1")
                    {
                        int alb_id = Convert.ToInt32(albId);
                        int pal_id = 0;
                        int.TryParse(palId, out pal_id);
                        AlbumServices.AddUpdateImageToAlbum(alb_id, connectedUser.Soc_id, savedFileName, pal_id, description);
                        url = string.Format("~/Views/Album/Album.aspx?albId={0}", albId);
                    }
                    //else if (!string.IsNullOrEmpty(prdId) && prdId != "0")
                    else if (type == "2" || type == "3")
                    {
                        try
                        {
                            int pal_id = 0;
                            int.TryParse(palId, out pal_id);
                            int pimorder = 0;
                            int.TryParse(order, out pimorder);
                            int pim_id = 0;
                            int.TryParse(pimId, out pim_id);
                            int pit_id = 0;
                            int.TryParse(pitId, out pit_id);
                            int pti_id = 0;
                            int.TryParse(ptiId, out pti_id);
                            if (pit_id == 0)
                            {
                                ProductServices.AddUpdateProductPhoto(prd_id, connectedUser.Soc_id, savedFileName, description, pimorder, pim_id, pal_id);
                            }
                            else
                            {
                                ProductServices.AddUpdatePitPhoto(prd_id, connectedUser.Soc_id, savedFileName, description, pit_id, pimorder, pal_id, pti_id);
                            }
                        }
                        catch (Exception)
                        {
                        }

                        url = string.Format("~/Views/Product/Product.aspx?prdId={0}&mode=view", prdId);
                    }
                    context.Response.Redirect(url);
                }

                if (!hasfile)
                {
                    string url = string.Format("~/Views/Default.aspx");
                    context.Response.Redirect(url);
                }
            }
            else
            {
                string url = string.Format("~/Views/Default.aspx");
                context.Response.Redirect(url);
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
        
        #region PRIVATE
        private bool CheckAuthentication()
        {
            bool checkOK = false;
            var authCookieName = FormsAuthentication.FormsCookieName;
            var authCookie = HttpContext.Current.Request.Cookies[authCookieName];
            if (authCookie != null)
            {
                try
                {
                    FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(authCookie.Value);
                    //var usrData = ticket.UserData.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
                    //var usrId = usrData.ElementAt(0);
                    //var firstname = usrData.ElementAt(1);
                    //var lastname = usrData.ElementAt(2);
                    //var socId = usrData.ElementAt(3);
                    //var rolId = usrData.ElementAt(4);
                    //var isactive = usrData.ElementAt(5);
                    //var photo = usrData.ElementAt(6);
                    //checkOK = true;
                    checkOK = ticket.UserData.DecodeTicket();
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }
        private bool CheckAuthentication(out User connectedUser)
        {
            bool checkOK = false;
            connectedUser = new User();
            var authCookieName = FormsAuthentication.FormsCookieName;
            var authCookie = HttpContext.Current.Request.Cookies[authCookieName];
            if (authCookie != null)
            {
                try
                {
                    FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(authCookie.Value);
                    //var usrData = ticket.UserData.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
                    //var usrId = usrData.ElementAt(0);
                    //var firstname = usrData.ElementAt(1);
                    //var lastname = usrData.ElementAt(2);
                    //var socId = usrData.ElementAt(3);
                    //var rolId = usrData.ElementAt(4);
                    //var isactive = usrData.ElementAt(5);
                    //var photo = usrData.ElementAt(6);
                    //connectedUser.Id = Convert.ToInt32(usrId);
                    //connectedUser.Soc_id = Convert.ToInt32(socId);
                    //connectedUser.Is_Active = Convert.ToBoolean(isactive);
                    //connectedUser.RolId = Convert.ToInt32(rolId);
                    //connectedUser.Firstname = firstname;
                    //connectedUser.Lastname = lastname;
                    //connectedUser.PhotoPath = photo;
                    //checkOK = true;
                    checkOK = ticket.UserData.DecodeTicket(connectedUser);
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }
        private string Serialize<T>(T data)
        {
            JavaScriptSerializer jss = new JavaScriptSerializer();
            string json = jss.Serialize(data);
            return json;
        }
        #endregion PRIVATE

    }

    public class ViewDataUploadFilesResult
    {
        public string Thumbnail_url { get; set; }
        public string Name { get; set; }
        public int Length { get; set; }
        public string Type { get; set; }
        public string FileUrl { get; set; }
    }
}
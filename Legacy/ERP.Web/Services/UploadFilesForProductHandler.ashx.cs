using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Serialization;
using System.Web.Security;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories;
using ERP.Repositories.Shared;
using ERP.Web.Shared;

namespace ERP.Web.Services
{
    /// <summary>
    /// Summary description for UploadFilesForProductHandler
    /// </summary>
    public class UploadFilesForProductHandler : IHttpHandler
    {
        AlbumServices AlbumServices = new AlbumServices();
        ProductServices ProductServices = new ProductServices();

        public void ProcessRequest(HttpContext context)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                context.Response.ContentType = "text/plain"; //"application/json";
                bool hasfile = false;
                foreach (string file in context.Request.Files)
                {
                    HttpPostedFile hpf = context.Request.Files[file] as HttpPostedFile;
                    string prdId = WebUtility.HtmlDecode(context.Request.QueryString["prdId"]);
                    string pitId = WebUtility.HtmlDecode(context.Request.QueryString["pitId"]);
                    string propGuid = WebUtility.HtmlDecode(context.Request.QueryString["propId"]);
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
                    appSettingPath = "UpLoadFilesProductFile";
                    if (pitId == "0")
                    {
                        folderId = prd_id.ToString();
                    }
                    else
                    {
                        folderId = prd_id.ToString() + "\\" + pitId.ToString();
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
                    try
                    {
                        var guid = new Guid(propGuid);
                        int pit_id = 0;
                        int.TryParse(pitId, out pit_id);
                        ProductServices.UploadFileForProductAndPit(prd_id, connectedUser.Soc_id, pit_id, propGuid, savedFileName);
                    }
                    catch (Exception)
                    {
                    }
                    url = string.Format("~/Views/Product/Product.aspx?prdId={0}&mode=view", prdId);

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
}
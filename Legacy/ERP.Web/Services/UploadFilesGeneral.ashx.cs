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
    /// Summary description for UploadFilesGeneral
    /// </summary>
    public class UploadFilesGeneral : IHttpHandler
    {
        ClientOrderServices ClientOrderServices = new ClientOrderServices();
        DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
        ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
        PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
        CategoryServices CategoryServices = new CategoryServices();
        UserServices UserServices = new UserServices();
        SiteProjectServices SiteProjectServices = new SiteProjectServices();
        CommonServices CommonServices = new CommonServices();

        public void ProcessRequest(HttpContext context)
        {
            string responseValue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                context.Response.ContentType = "text/plain";// "text/json"; //"application/json";
                bool hasfile = false;
                foreach (string file in context.Request.Files)
                {
                    HttpPostedFile hpf = context.Request.Files[file] as HttpPostedFile;
                    #region variables

                    // type : 1--> client order; 2 --> delivery form; 3 --> client invoice; 4 --> payment for client invoice; 5 --> supplier order; 9 --> user
                    // 10 --> site project; 11 & 12 sod payment; 13 sod document
                    string type = GetUrlValue(context, "type");
                    string codId = GetUrlValue(context, "codId");
                    string dfoId = GetUrlValue(context, "dfoId");
                    string cinId = GetUrlValue(context, "cinId");
                    string cpyId = GetUrlValue(context, "cpyId");
                    string sodId = GetUrlValue(context, "sodId");
                    string sinId = GetUrlValue(context, "sinId");
                    string catId = GetUrlValue(context, "catId");
                    string usrId = GetUrlValue(context, "usrId");
                    string prjId = GetUrlValue(context, "prjId");
                    string order = GetUrlValue(context, "order");
                    string pigId = GetUrlValue(context, "pigId");
                    string lgsId = GetUrlValue(context, "lgsId");
                    string docId = GetUrlValue(context, "docId");
                    string sprIdstr = GetUrlValue(context, "sprIds");
                    string cpyIdstr = GetUrlValue(context, "cpyIds");
                    string sdcId = GetUrlValue(context, "sdcId");
                    string sdcIdstr = GetUrlValue(context, "sdcIds");
                    var _sprIds = new List<int>();
                    var _sdcIds = new List<int>();
                    var _cpyIds = new List<int>();

                    try
                    {
                        var sprIds = sprIdstr.Split(',').ToList();
                        foreach (var sprId in sprIds)
                        {
                            int onesprid;
                            if (int.TryParse(sprId, out onesprid))
                            {
                                _sprIds.Add(onesprid);
                            }
                        }
                        _sprIds = _sprIds.Distinct().ToList();
                    }
                    catch (Exception)
                    {

                    }

                    try
                    {
                        var sprIds = sdcIdstr.Split(',').ToList();
                        foreach (var sprId in sprIds)
                        {
                            int onesprid;
                            if (int.TryParse(sprId, out onesprid))
                            {
                                _sdcIds.Add(onesprid);
                            }
                        }
                        _sdcIds = _sdcIds.Distinct().ToList();
                    }
                    catch (Exception)
                    {

                    }

                    try
                    {
                        var cpyIds = cpyIdstr.Split(',').ToList();
                        foreach (var sprId in cpyIds)
                        {
                            int onesprid;
                            if (int.TryParse(sprId, out onesprid))
                            {
                                _cpyIds.Add(onesprid);
                            }
                        }
                        _cpyIds = _cpyIds.Distinct().ToList();
                    }
                    catch (Exception)
                    {

                    }

                    int cod_id;
                    int.TryParse(StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId"), out cod_id);
                    int dfo_id;
                    int.TryParse(StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId"), out dfo_id);
                    int cin_id;
                    int.TryParse(StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId"), out cin_id);
                    int cpy_id;
                    if (!int.TryParse(cpyId.UrlDecode2String(), out cpy_id))
                    {
                        int.TryParse(StringCipher.DecoderSimple(cpyId.UrlDecode2String(), "cpyId"), out cpy_id);
                    }
                    int sod_id;
                    int.TryParse(StringCipher.DecoderSimple(sodId.UrlDecode2String(), "sodId"), out sod_id);
                    int sin_id;
                    int.TryParse(StringCipher.DecoderSimple(sinId.UrlDecode2String(), "sinId"), out sin_id);
                    int cat_id;
                    int.TryParse(StringCipher.DecoderSimple(catId.UrlDecode2String(), "catId"), out cat_id);
                    int usr_id;
                    int.TryParse(usrId, out usr_id);
                    int prj_id;
                    int.TryParse(prjId, out prj_id);
                    int _order;
                    int.TryParse(order, out _order);
                    int pig_id;
                    int.TryParse(pigId, out pig_id);
                    int sdc_id;
                    int.TryParse(sdcId, out sdc_id);
                    int lgs_id;
                    int.TryParse(StringCipher.DecoderSimple(lgsId, "lgsId"), out lgs_id);
                    int doc_id;
                    int.TryParse(docId, out doc_id);

                    #endregion variables

                    string fileName = string.Empty;
                    string browser = HttpContext.Current.Request.Browser.Browser.ToUpper();
                    if (browser == "IE" || browser == "INTERNETEXPLORER")
                    {
                        string[] files = hpf.FileName.Split(new char[] { '\\' });
                        fileName = files[files.Length - 1];
                    }
                    else
                    {
                        fileName = hpf.FileName;
                    }

                    // 2017-12-13 rename filename
                    var fileExt = Path.GetExtension(fileName);
                    fileName = Guid.NewGuid() + fileExt;

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


                    appSettingPath = "UpLoadFilesGeneral";
                    string tmpPath = WebConfigurationManager.AppSettings[appSettingPath];
                    string subFolderName = string.Empty;
                    switch (type)
                    {
                        case "1":
                            subFolderName = "ClientOrder";
                            break;
                        case "2":
                            subFolderName = "DeliveryForm";
                            break;
                        case "3":
                            subFolderName = "ClientInvoice";
                            break;
                        case "4":
                            subFolderName = "PayementClientInvoice";
                            break;
                        case "5":
                            subFolderName = "SupplierOrder";
                            break;
                        case "6":
                        case "7":
                            subFolderName = "SupplierInvoice";
                            break;
                        case "8":
                            subFolderName = "Category";
                            break;
                        case "9":
                            subFolderName = "User";
                            break;
                        case "10":
                            subFolderName = "SiteProject";
                            break;
                        case "11":
                            subFolderName = "SodPayment";
                            break;
                        case "12":
                            subFolderName = "SodPayment";
                            break;
                        case "13":
                            subFolderName = "SodDoc";
                            break;
                        case "14":
                            subFolderName = "PayementClientInvoice";
                            break;
                        case "15": // 2023-06-11 增加物流文件
                            subFolderName = CommonServices.GetDocumentSavePath("Logistics");
                            break;
                    }

                    tmpPath = string.Format(@"{0}\{1}", tmpPath, subFolderName);
                    string filePath = string.Empty;

                    if (cod_id != 0 && type == "1")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, cod_id);
                        //responseUrl = string.Format("~/Views/ClientOrder/ClientOrder.aspx?codId={0}&mode=view", codId);
                        responseValue = SaveFile(hpf, filePath, fileName, true);
                        ClientOrderServices.UpdateClientOrderFile(connectedUser.Soc_id, cod_id, responseValue);
                    }
                    else if (dfo_id != 0 && type == "2")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, dfo_id);
                        responseValue = SaveFile(hpf, filePath, fileName, true);
                        DeliveryFormServices.UpdateDeliveryFormFile(connectedUser.Soc_id, dfo_id, responseValue);
                    }
                    else if (cin_id != 0 && type == "3")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, cin_id);
                        responseValue = SaveFile(hpf, filePath, fileName, true);
                        ClientInvoiceServices.UpdateClientInvoiceFile(connectedUser.Soc_id, cin_id, responseValue);
                    }
                    else if (cin_id != 0 && type == "4" && cpy_id != 0)
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, cin_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        ClientInvoiceServices.CreateUpdateCinPayment(connectedUser.Soc_id, cin_id, cpy_id, 0, responseValue, null, true);
                    }
                    else if (sod_id != 0 && type == "5")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        PurchaseBaseServices.UpdateSodFile(connectedUser.Soc_id, sod_id, responseValue);
                    }
                    else if (sin_id != 0 && type == "6")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        PurchaseBaseServices.UpdateSinFile(connectedUser.Soc_id, sin_id, responseValue);
                    }
                    else if (sin_id != 0 && type == "7")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        PurchaseBaseServices.UpdateSinBankFile(connectedUser.Soc_id, sin_id, responseValue);
                    }
                    else if (cat_id != 0 && type == "8")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, cat_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        CategoryServices.UpdateCatFile(connectedUser.Soc_id, cat_id, responseValue);
                    }
                    else if (usr_id != 0 && type == "9")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, usr_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        UserServices.CreateUpdateUserPhoto(connectedUser.Soc_id, usr_id, responseValue);
                        //CategoryServices.UpdateCatFile(connectedUser.Soc_id, cat_id, responseValue);
                    }
                    else if (prj_id != 0 && type == "10")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, prj_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        SiteProjectServices.CreateUpdateDeleteImage(prj_id, pig_id, _order, responseValue);
                    }
                    else if (sod_id != 0 && type == "11")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        //PurchaseBaseServices.UpdateSodFile(connectedUser.Soc_id, sod_id, responseValue);
                    }
                    else if (_sprIds.Any() && type == "12")
                    {
                        var sodSprIds = PurchaseBaseServices.GetSodByPaymentRecord(_sprIds);
                        foreach (var sodspr in sodSprIds)
                        {
                            var onefilePath = string.Format(@"{0}\{1}", tmpPath, sodspr.Key);
                            responseValue = SaveFile(hpf, onefilePath, fileName);
                            PurchaseBaseServices.UpdateSodPaymentFile(new List<int> { Convert.ToInt32(sodspr.Key2) }, responseValue);
                        }
                    }
                    //else if (sod_id != 0 && type == "13")
                    //{
                    //    // 读取上传的excel 文件，导入sod

                    //    //filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                    //    //responseValue = SaveFile(hpf, filePath, fileName);
                    //}
                    else if (sod_id != 0 && type == "13")
                    {
                        var sodSdcIds = PurchaseBaseServices.GetSdcs(_sdcIds);
                        foreach (var sodsdc in sodSdcIds)
                        {
                            filePath = string.Format(@"{0}\{1}", tmpPath, sod_id);
                            responseValue = SaveFile(hpf, filePath, fileName);
                            PurchaseBaseServices.UpdateSodDocFiles(new List<int> { Convert.ToInt32(sodsdc.Key2) }, responseValue);
                        }
                    }
                    else if (_cpyIds.Any() && type == "14")
                    {
                        var cinCpyIds = ClientInvoiceServices.GetCinByPaymentRecord(_cpyIds);
                        foreach (var cinCpy in cinCpyIds)
                        {
                            filePath = string.Format(@"{0}\{1}", tmpPath, cinCpy.Key);
                            responseValue = SaveFile(hpf, filePath, fileName);
                            ClientInvoiceServices.UpdateCinDocFiles(new List<int> { Convert.ToInt32(cinCpy.Key2) }, responseValue);
                        }
                    }
                    // Logistic
                    else if (lgs_id != 0 && type == "15")
                    {
                        filePath = string.Format(@"{0}\{1}", tmpPath, lgs_id);
                        responseValue = SaveFile(hpf, filePath, fileName);
                        CommonServices.UpdateDocumentFile("Logistics", lgs_id, doc_id, responseValue);
                    }

                    context.Response.Write(responseValue);
                }

                if (!hasfile)
                {
                    //context.Response.Redirect(responseUrl);
                    context.Response.Write(responseValue);
                }
            }
            else
            {
                string url = string.Format("~/Views/Default.aspx");
                context.Response.Redirect(url);
            }
        }

        private string GetUrlValue(HttpContext context, string paraName)
        {
            var value = WebUtility.HtmlDecode(context.Request.QueryString[paraName]);
            value = string.IsNullOrEmpty(value) ? string.Empty : value;
            return value;
        }

        private string SaveFile(HttpPostedFile hpf, string filePath, string fileName, bool deleteOldFiles = false)
        {
            if (!Directory.Exists(filePath))
            {
                Directory.CreateDirectory(filePath);
            }
            if (deleteOldFiles)
            {
                try
                {
                    System.IO.DirectoryInfo di = new DirectoryInfo(filePath);
                    foreach (FileInfo file in di.GetFiles())
                    {
                        file.Delete();
                    }
                    foreach (DirectoryInfo dir in di.GetDirectories())
                    {
                        dir.Delete(true);
                    }

                }
                catch (Exception)
                {
                }
            }
            string savedFileName = FileControl.CheckAndGetNewPath(filePath + "\\" + fileName);
            hpf.SaveAs(savedFileName);
            return savedFileName;
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
                    var usrData = ticket.UserData.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
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
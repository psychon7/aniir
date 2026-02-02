using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Script.Services;
using System.Web.Security;
using System.Web.Services;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories;
using ERP.Repositories.Shared;
using ERP.SharedServices;
using ERP.SiteNC202310.Shared;

namespace ERP.SiteNC202310.Service
{
    /// <summary>
    /// Summary description for SiteWebService
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    public class SiteWebService : System.Web.Services.WebService
    {

        [WebMethod]
        public string HelloWorld()
        {
            return "Hello World";
        }

        #region variables
        private EcoledService EcoledService = new EcoledService();
        private SiteCommonServices SiteCommonServices = new SiteCommonServices();
        #endregion variables

        #region 母版页功能
        /// <summary>
        /// 获取母版页中produits下的类别
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCategory()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetCategory();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        #endregion 母版页功能

        #region Index页面功能


        /// <summary>
        /// 获取index 第一层的显示 
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCategoryFirst()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetCategoryFirst();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        /// <summary>
        /// 获取主页广告的显示 
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetMenuViewPub()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetMenuViewPub();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }

        /// <summary>
        /// 获取index New Pro的显示 
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetNewPro()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetNewPro();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }

        /// <summary>
        /// 获取index 项目的显示 
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProject()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetProject();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }


        #endregion Index页面功能

        #region  Product

        /// <summary>
        /// 根据catid获取货物列表
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPrdByCatid(ProInput input)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetPrdByCatid(input);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        /// <summary>
        /// 根据catid获取货物列表
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPrdCount(ProInput input)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetPrdCount(input);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        /// <summary>
        /// 搜索显示货物列表
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchProduct(ProInput input)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.SearchProduct(input);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }

        /// <summary>
        /// 获取produits下的类别
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCategoryForPrd()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetCategoryForPrd();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }

        #endregion Product

        #region Cart Devis
        /// <summary>
        /// 获取Shopping_Cart_Line
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetShopping()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var list = EcoledService.GetShoppingListById(connectedUser.Id);
                    returnvalue = Serialize(list);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 添加Shopping_Cart_Line
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddCartShopping(int prdId, int pitId, int qty, string attr1, string attr2, string attr3)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    EcoledService.AddShoppingLine(prdId, pitId, connectedUser.Id, qty, attr1, attr2, attr3);
                    returnvalue = Serialize("");
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public bool DelCartShopping(int Id)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = EcoledService.DelShoppingLine(Id, connectedUser.Id);
                returnvalue = value;

            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateOrder(List<Shopping> shpcartList)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    returnvalue = EcoledService.CreateOrder(connectedUser.Id, shpcartList);
                    returnvalue = Serialize(returnvalue);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SaveShopCart(List<Shopping> shpcartList)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var list = EcoledService.SaveShopCart(connectedUser.Id, shpcartList);
                    returnvalue = Serialize(list);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }
        
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetUserCostPlans()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var str = EcoledService.GetUserCostPlans(connectedUser.Id);
                    returnvalue = Serialize(str);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Cart Devis

        #region  ProductDetails
        /// <summary>
        /// 根据PrdId获取货物详情
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPrdByPrdId(int prdId)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetPrdByPrdId(prdId);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        /// <summary>
        /// 根据PrdId获取cat列表
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCatbyPrdId(int prdId)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetCatbyPrdId(prdId);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }
        #endregion ProductDetails

        #region Common

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCivility()
        {
            string returnvalue;
            var values = EcoledService.GetCivility();
            returnvalue = Serialize(values);
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void InsertUserLog(Entities.UserLog userlog)
        {
            userlog = userlog.GetIPInfoFromAddress(userlog.Ip);
            decimal? lat = null;
            decimal? lon = null;

            if (userlog.Latitude == userlog.Longtitude && (userlog.Latitude == -1 || userlog.Latitude == 0))
            {
                lat = userlog.ulg_ip_lat;
                lon = userlog.ulg_ip_lon;
            }
            else
            {
                lat = userlog.Latitude;
                lon = userlog.Longtitude;
            }
            userlog = userlog.GetAddressFromLatLon(lat, lon);
            SiteCommonServices.InsertUserLog(userlog);
        }

        #endregion

        #region 注册和登陆

        [WebMethod(EnableSession = true)]
        public string Login(string login, string pwd)
        {
            var client = EcoledService.Login(login, pwd);
            if (client != null && client.SclId > 0)
            {
                string result = UserLogin(client);
                return result;
            }
            else
            {
                return "";
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string Register(SiteClient client)
        {
            client.SocId = 1;
            if (!string.IsNullOrEmpty(client.Login) && !string.IsNullOrEmpty(client.FirstName) && !string.IsNullOrEmpty(client.LastName) && !string.IsNullOrEmpty(client.Pwd))
            {
                var sclId = EcoledService.RegisterClient(client);
                if (sclId > 0)
                {
                    var siteclient = EcoledService.LoginWithId(sclId);
                    UserLogin(siteclient);
                    return Serialize(siteclient);
                }
                else
                {
                    return Serialize(sclId);
                }
            }
            else
            {
                return Serialize(-3);
            }
        }

        [WebMethod(EnableSession = true)]
        private string UserLogin(SiteClient client)
        {
            string returnvalue = string.Empty;
            bool isCookiePersistent = true;
            var usr = client;
            if (usr != null)
            {
                string userinfo = string.Format("{0}#{1}#{2}#{3}#{4}#{5}",
                    usr.SclId,
                    usr.FirstName,
                    usr.LastName,
                    usr.IsActive,
                    usr.Civility,
                    usr.Login
                  );

                FormsAuthenticationTicket authTicket = new FormsAuthenticationTicket(1,
                    usr.Login,
                    DateTime.Now,
                    DateTime.Now.AddMonths(12),
                    isCookiePersistent, userinfo);

                //Encrypt the ticket.
                string encryptedTicket = FormsAuthentication.Encrypt(authTicket);

                //Create a cookie, and then add the encrypted ticket to the cookie as data.
                HttpCookie authCookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);

                if (isCookiePersistent)
                {
                    //authTicket.Expiration = DateTime.Now.AddMonths(12);
                    authCookie.Expires = authTicket.Expiration;
                }
                Context.Response.Cookies.Add(authCookie);
                HttpContext.Current.Response.AppendCookie(authCookie);
                returnvalue = string.Format("{0} {1} {2}", client.Civility, client.FirstName, client.LastName);
            }
            return returnvalue;
        }

        #endregion 注册和登陆

        #region PRIVATE

        /// <summary>
        /// 用于直接确认用户是否登录
        /// </summary>
        /// <returns></returns>
        [WebMethod(EnableSession = true)]
        public bool CheckAuthentication()
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
                    checkOK = ticket.UserData.DecodeTicket_second(connectedUser);
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

        public int IntTryParse(object id, string key)
        {
            int _id = 0;
            try
            {
                var strid = StringCipher.DecoderSimple(id.ToString().UrlDecode2String(), key);
                int.TryParse(strid, out _id);
            }
            catch (Exception)
            {
            }
            return _id;
        }

        private static string ReadFileFrom(string templateName, string path)
        {
            string filePath = path + "/Temps/" + templateName;
            string body = File.ReadAllText(filePath);
            return body;
        }

        public static DateTime? GetDateTimeOrNow(string dateTime, bool isNullable = false)
        {
            CultureInfo culture = new CultureInfo("fr-FR", true);
            try
            {
                return DateTime.Parse(dateTime, culture);
            }
            catch (Exception)
            {
                return isNullable ? (DateTime?)null : DateTime.Now;
            }
        }

        #endregion PRIVATE

        #region Project And ProjectDetails

        /// <summary>
        /// 获取所有Prj
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllPrj()
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetAllPrj();
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }


        /// <summary>
        /// 根据ID获取项目的详细信息
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPrjByPrjId(int prjId)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetPrjByPrjId(prjId);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }

        /// <summary>
        /// 根据tagId获取tag下所属项目
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPrjByTagId(int tagId)
        {
            string returnvalue = string.Empty;
            //User connectedUser;
            //if (CheckAuthentication(out connectedUser))
            //{
            try
            {
                var values = EcoledService.GetPrjByTagId(tagId);
                returnvalue = Serialize(values);
            }
            catch (Exception ex)
            {
                var a = ex.Message;
            }
            //}
            //else
            //{
            //    returnvalue = Serialize("-1");
            //}
            return returnvalue;
        }


        #endregion Project And ProjectDetails

        #region WishList
        /// <summary>
        /// 添加喜欢
        /// </summary>
        /// <param name="prdId"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddWishLine(int prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var str = EcoledService.AddWishlist(prdId, connectedUser.Id, 0, null, null, null);
                    returnvalue = Serialize(str);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddWishLineWithDetail(int prdId, int pitId, string attr1, string attr2, string attr3)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var str = EcoledService.AddWishlist(prdId, connectedUser.Id, pitId, attr1, attr2, attr3);
                    returnvalue = Serialize(str);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 获取当前用户下的喜欢列表
        /// </summary>
        /// <param name="prdId"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetWishlistLineByUserId()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var str = EcoledService.GetWishlistLineByUserId(connectedUser.Id);
                    returnvalue = Serialize(str);
                }
                catch (Exception ex)
                {
                    var a = ex.Message;
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;

        }

        /// <summary>
        /// 删除喜欢行
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteLineById(int wllId)
        {
            string returnvalue = "1";
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                EcoledService.DeleteLineById(wllId);
                returnvalue = "1";

            }
            return "2";
        }
        #endregion WishList

        #region Message

        //[WebMethod]
        //[ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        //public string SendEmail(EntityMessage email)
        //{
        //    string returnvalue = "";
        //    try
        //    {
        //        var mappath = System.Web.HttpContext.Current.Server.MapPath("~");
        //        string filePath = mappath + "HtmlTmp\\";
        //        string smsFilePath = mappath + "HtmlTmp\\";
        //        string filename = "ClientContact.html";
        //        string smsFilename = "sms_contact_tmp.txt";
        //        //string contactype = "Contact";
        //        if (email.IsDirver == "1")
        //        {
        //            filename = "ClientDiagnostic.html";
        //            smsFilename = "sms_diagnostic_tmp.txt";
        //            //contactype = "Diagnostic";
        //        }
        //        var msgcode = SiteCommonServices.RecordMessage(email);
        //        email.Code = msgcode;

        //        #region SMS Email for client
        //        filePath += filename;
        //        smsFilePath += smsFilename;
        //        string readText = File.ReadAllText(filePath);
        //        string title = email.IsDirver == "1" ? "ECOLED EUROPE : VOTRE DEMANDE DE RENDEZ-VOUS POUR UN DIAGNOSTIC GRATUIT A BIEN ÉTÉ ENREGISTRÉE." : "💡 ECOLED EUROPE : VOTRE MESSAGE A BIEN ÉTÉ ENREGISTRÉ.";
        //        string ccs = ConfigurationManager.AppSettings["AdminEmail"];
        //        string pwd = ConfigurationManager.AppSettings["AdminEmailPwd"];
        //        string bodyClient = readText;
        //        bodyClient = ReplaceString(bodyClient, "#Name#", email.Name);
        //        bodyClient = ReplaceString(bodyClient, "#Lastname#", email.Lastname);
        //        bodyClient = ReplaceString(bodyClient, "#Telephone#", email.Telephone);
        //        bodyClient = ReplaceString(bodyClient, "#Email#", email.Email);
        //        bodyClient = ReplaceString(bodyClient, "#Subject#", email.Subject);
        //        bodyClient = ReplaceString(bodyClient, "#Code#", email.Code);
        //        bodyClient = ReplaceString(bodyClient, "#Address#", email.Address);
        //        bodyClient = ReplaceString(bodyClient, "#PostCode#", email.PostCode);
        //        bodyClient = ReplaceString(bodyClient, "#City#", email.City);
        //        bodyClient = ReplaceString(bodyClient, "#Message#", email.Message.Replace("\r\n", "<br/>").Replace("\n", "<br/>"));

        //        string from = ccs;
        //        string smscontent = File.ReadAllText(smsFilePath);
        //        var oneSms = new SMS_Message
        //        {
        //            sms_subject = email.Subject,
        //            sms_telnumber = email.Telephone,
        //            sms_appGuid = ConfigurationManager.AppSettings["smsclientguid"],
        //            sms_content = ReplaceString(smscontent, "#Code#", email.Code),
        //            sms_d_creation = DateTime.Now,
        //            sms_d_send = DateTime.Now
        //        };

        //        SendSms.SendMessage(oneSms);
        //        NetMails.SendMail(title, from, bodyClient, email.Email, pwd, null, true, fromName: "ECOLED EUROPE", hostname: "smtp.1and1.com");
        //        #endregion SMS Email for client

        //        #region SMS Email for contact
        //        string emailIntraPath = mappath + "HtmlTmp\\intra_contact_email.html";
        //        string emailIntraText = File.ReadAllText(emailIntraPath);
        //        string email_title = email.IsDirver == "1" ? "NOUVEAU DIAGNOSTIC" : "💡 NOUVEAU MESSAGE";
        //        string contactEmail = ConfigurationManager.AppSettings["smsContactEmail"];
        //        string contactTelephone = ConfigurationManager.AppSettings["smsContactTel"];

        //        emailIntraText = emailIntraText.Replace("#d_creation#", DateTime.Now.ToLongTimeString());
        //        emailIntraText = ReplaceString(emailIntraText, "#Name#", email.Name);
        //        emailIntraText = ReplaceString(emailIntraText, "#Lastname#", email.Lastname);
        //        emailIntraText = ReplaceString(emailIntraText, "#Telephone#", email.Telephone);
        //        emailIntraText = ReplaceString(emailIntraText, "#Email#", email.Email);
        //        emailIntraText = ReplaceString(emailIntraText, "#Subject#", email.Subject);
        //        emailIntraText = ReplaceString(emailIntraText, "#Code#", email.Code);
        //        emailIntraText = ReplaceString(emailIntraText, "#Address#", email.Address);
        //        emailIntraText = ReplaceString(emailIntraText, "#PostCode#", email.PostCode);
        //        emailIntraText = ReplaceString(emailIntraText, "#City#", email.City);
        //        emailIntraText = ReplaceString(emailIntraText, "#How2Know#", email.How2Know);
        //        emailIntraText = ReplaceString(emailIntraText, "#Message#", email.Message.Replace("\r\n", "<br/>").Replace("\n", "<br/>"));

        //        string contactSmsContent = string.Empty;
        //        if (email.IsDirver == "1")
        //        {
        //            contactSmsContent = string.Format("💡 ECOLED EUROPE\r\nNOUVEAU DIAGNOSTIC\r\n\r\n" +
        //                                              "Subjet : {8}\r\n" +
        //                                              "Code de message : {11}\r\n" +
        //                                              "Prénom : {0}\r\n" +
        //                                              "Nom : {1}\r\n" +
        //                                              "Tel : {2}\r\n" +
        //                                              "Email : {3}\r\n" +
        //                                              "Adresse : {4}\r\n\r\n" +
        //                                              "Code postal : {5}\r\n" +
        //                                              "Ville : {6}\r\n" +
        //                                              "Comment il nous a connu : {7}\r\n" +
        //                                              "Message : {9}\r\n" +
        //                                              "Date : {10}",
        //                email.Name, email.Lastname, email.Telephone, email.Email, email.Address, email.PostCode, email.City, email.How2Know, email.Subject, email.Message,
        //                DateTime.Now, email.Code);
        //        }
        //        else
        //        {
        //            contactSmsContent = string.Format("💡 ECOLED EUROPE\r\nNOUVEAU CONTACT\r\n\r\n" +
        //                                                    "Code de message : {7}\r\n" +
        //                                                    "Prénom : {0}\r\n" +
        //                                                    "Nom : {1}\r\n" +
        //                                                    "Tel : {2}\r\n" +
        //                                                    "Email : {3}\r\n" +
        //                                                    "Subjet : {4}\r\n" +
        //                                                    "Message : {5}\r\n" +
        //                                                    "Date : {6}",
        //                email.Name, email.Lastname, email.Telephone, email.Email, email.Subject, email.Message, DateTime.Now, email.Code);
        //        }


        //        var contactSms = new SMS_Message
        //        {
        //            sms_subject = email.Subject,
        //            sms_telnumber = contactTelephone,
        //            sms_appGuid = ConfigurationManager.AppSettings["smsclientguid"],
        //            sms_content = contactSmsContent,
        //            sms_d_creation = DateTime.Now,
        //            sms_d_send = DateTime.Now
        //        };

        //        SendSms.SendMessage(contactSms);
        //        NetMails.SendMail(email_title, from, emailIntraText, contactEmail, pwd, null, true, fromName: "ECOLED EUROPE", hostname: "smtp.1and1.com");
        //        #endregion SMS Email for contact

        //        // record message

        //    }
        //    catch (Exception ex)
        //    {
        //        returnvalue = ex.Message;
        //    }
        //    return null;
        //}


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SendEmail(EntityMessage email)
        {
            LogWriter.Write("SendEmaill call");
            string returnvalue = "";
            try
            {
                var mappath = System.Web.HttpContext.Current.Server.MapPath("~");
                string filePath = mappath + "HtmlTmp\\";
                string smsFilePath = mappath + "HtmlTmp\\";
                string filename = "ClientContact.html";
                string smsFilename = "sms_contact_tmp.txt";
                //string contactype = "Contact";
                if (email.IsDirver == "1")
                {
                    filename = "ClientDiagnostic.html";
                    smsFilename = "sms_diagnostic_tmp.txt";
                    //contactype = "Diagnostic";
                }
                var msgcode = SiteCommonServices.RecordMessage(email);
                email.Code = msgcode;

                #region SMS Email for client
                filePath += filename;
                smsFilePath += smsFilename;
                string readText = File.ReadAllText(filePath);
                string title = email.IsDirver == "1" ? "ECOLED EUROPE : VOTRE DEMANDE DE RENDEZ-VOUS POUR UN DIAGNOSTIC GRATUIT A BIEN ÉTÉ ENREGISTRÉE." : "💡 ECOLED EUROPE : VOTRE MESSAGE A BIEN ÉTÉ ENREGISTRÉ.";
                string ccs = ConfigurationManager.AppSettings["AdminEmail"];
                string pwd = ConfigurationManager.AppSettings["AdminEmailPwd"];
                string bodyClient = readText;
                bodyClient = ReplaceString(bodyClient, "#Name#", email.Name);
                bodyClient = ReplaceString(bodyClient, "#Lastname#", email.Lastname);
                bodyClient = ReplaceString(bodyClient, "#Telephone#", email.Telephone);
                bodyClient = ReplaceString(bodyClient, "#Email#", email.Email);
                bodyClient = ReplaceString(bodyClient, "#Subject#", email.Subject);
                bodyClient = ReplaceString(bodyClient, "#Code#", email.Code);
                bodyClient = ReplaceString(bodyClient, "#Address#", email.Address);
                bodyClient = ReplaceString(bodyClient, "#PostCode#", email.PostCode);
                bodyClient = ReplaceString(bodyClient, "#City#", email.City);
                bodyClient = ReplaceString(bodyClient, "#Message#", email.Message.Replace("\r\n", "<br/>").Replace("\n", "<br/>"));

                string from = ccs;
                string smscontent = File.ReadAllText(smsFilePath);
                NetMails.SendMail(title, from, bodyClient, email.Email, pwd, null, true, fromName: "ECOLED EUROPE", hostname: "auth.smtp.1and1.fr");
                #endregion SMS Email for client

                #region SMS Email for contact
                string emailIntraPath = mappath + "HtmlTmp\\intra_contact_email.html";
                string emailIntraText = File.ReadAllText(emailIntraPath);
                string email_title = email.IsDirver == "1" ? "NOUVEAU DIAGNOSTIC" : "💡 NOUVEAU MESSAGE";
                string contactEmail = ConfigurationManager.AppSettings["smsContactEmail"];
                string contactTelephone = ConfigurationManager.AppSettings["smsContactTel"];

                emailIntraText = emailIntraText.Replace("#d_creation#", DateTime.Now.ToLongTimeString());
                emailIntraText = ReplaceString(emailIntraText, "#Name#", email.Name);
                emailIntraText = ReplaceString(emailIntraText, "#Lastname#", email.Lastname);
                emailIntraText = ReplaceString(emailIntraText, "#Telephone#", email.Telephone);
                emailIntraText = ReplaceString(emailIntraText, "#Email#", email.Email);
                emailIntraText = ReplaceString(emailIntraText, "#Subject#", email.Subject);
                emailIntraText = ReplaceString(emailIntraText, "#Code#", email.Code);
                emailIntraText = ReplaceString(emailIntraText, "#Address#", email.Address);
                emailIntraText = ReplaceString(emailIntraText, "#PostCode#", email.PostCode);
                emailIntraText = ReplaceString(emailIntraText, "#City#", email.City);
                emailIntraText = ReplaceString(emailIntraText, "#How2Know#", email.How2Know);
                emailIntraText = ReplaceString(emailIntraText, "#Message#", email.Message.Replace("\r\n", "<br/>").Replace("\n", "<br/>"));

                string contactSmsContent = string.Empty;
                if (email.IsDirver == "1")
                {
                    contactSmsContent = string.Format("💡 ECOLED EUROPE\r\nNOUVEAU DIAGNOSTIC\r\n\r\n" +
                                                      "Subjet : {8}\r\n" +
                                                      "Code de message : {11}\r\n" +
                                                      "Prénom : {0}\r\n" +
                                                      "Nom : {1}\r\n" +
                                                      "Tel : {2}\r\n" +
                                                      "Email : {3}\r\n" +
                                                      "Adresse : {4}\r\n\r\n" +
                                                      "Code postal : {5}\r\n" +
                                                      "Ville : {6}\r\n" +
                                                      "Comment il nous a connu : {7}\r\n" +
                                                      "Message : {9}\r\n" +
                                                      "Date : {10}",
                        email.Name, email.Lastname, email.Telephone, email.Email, email.Address, email.PostCode, email.City, email.How2Know, email.Subject, email.Message,
                        DateTime.Now, email.Code);
                }
                else
                {
                    contactSmsContent = string.Format("💡 ECOLED EUROPE\r\nNOUVEAU CONTACT\r\n\r\n" +
                                                            "Code de message : {7}\r\n" +
                                                            "Prénom : {0}\r\n" +
                                                            "Nom : {1}\r\n" +
                                                            "Tel : {2}\r\n" +
                                                            "Email : {3}\r\n" +
                                                            "Subjet : {4}\r\n" +
                                                            "Message : {5}\r\n" +
                                                            "Date : {6}",
                        email.Name, email.Lastname, email.Telephone, email.Email, email.Subject, email.Message, DateTime.Now, email.Code);
                }
                NetMails.SendMail(email_title, from, emailIntraText, contactEmail, pwd, null, true, fromName: "ECOLED EUROPE", hostname: "auth.smtp.1and1.fr");
                #endregion SMS Email for contact

                // record message

            }
            catch (Exception ex)
            {
                returnvalue = ex.Message;
            }

            return null;
        }
        private string ReplaceString(string orgstr, string keystr, string rplstr)
        {
            if (!string.IsNullOrEmpty(orgstr))
            {
                if (orgstr.Contains(keystr) && rplstr != null)
                {
                    orgstr = orgstr.Replace(keystr, rplstr);
                }
            }
            return orgstr;
        }
        #endregion Message

    }
}

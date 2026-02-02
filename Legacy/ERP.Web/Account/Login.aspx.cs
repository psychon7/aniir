using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Web;
using System.Web.Configuration;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories.Shared;
using ERP.Web.Shared;
using HtmlAgilityPack;

namespace ERP.Web.Account
{
    public partial class Login : System.Web.UI.Page
    {
        private UserServices UserServices = new UserServices();
        private SupplierServices SupplierServices = new SupplierServices();
        private static SocietyServices SocietyServices = new SocietyServices();

        protected void Page_Load(object sender, EventArgs e)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (connectedUser.UserLogin.StartsWith("ext-"))
                {
                    Response.Redirect("../Views/SupplierOrder/SearchSupplierOrderSup.aspx");
                }
                else
                {

                    Response.Redirect(FormsAuthentication.GetRedirectUrl(connectedUser.UserLogin, false));
                }
            }
        }

        protected void bnt_login_OnClick(object sender, EventArgs e)
        {
            string login = txb_login.Value;
            string pwd = txb_pwd.Value;
            if (!string.IsNullOrEmpty(login) && !string.IsNullOrEmpty(pwd))
            {
                try
                {
                    new Thread(UpdateCurrencyEx).Start();
                    string msg = string.Format("Update currency");
                    LogWriter.Write(msg, LogType.AppError);
                }
                catch (Exception ex)
                {
                    string msg = ex.InnerException != null ? ex.InnerException.ToString() : "";
                    msg += " || " + ex.Message;
                    LogWriter.Write("Thread error :" + msg, LogType.AppError);
                }
                UserLogin(login, pwd);
            }
        }

        private void UserLogin(string username, string pwd)
        {
            // 20210711 判断是否是supplier
            if (username.StartsWith("ext-"))
            {
                var usr = SupplierServices.SupplierLogin(username, pwd);
                bool isCookiePersistent = cbx_remeberme.Checked;
                if (usr != null)
                {
                    string userinfo = CookieTicket.EncodeTicketSup(usr);
                    FormsAuthenticationTicket authTicket = new FormsAuthenticationTicket(1, usr.SupLogin, DateTime.Now, DateTime.Now.AddMonths(12), isCookiePersistent, userinfo);

                    //Encrypt the ticket.
                    string encryptedTicket = FormsAuthentication.Encrypt(authTicket);

                    //Create a cookie, and then add the encrypted ticket to the cookie as data.
                    HttpCookie authCookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);

                    if (isCookiePersistent)
                    {
                        //authTicket.Expiration = DateTime.Now.AddMonths(12);
                        authTicket.Expiration.AddYears(1);
                        authCookie.Expires = authTicket.Expiration;
                    }

                    //Add the cookie to the outgoing cookies collection.
                    Response.Cookies.Add(authCookie);

                    //You can redirect now.
                    //Response.Redirect(FormsAuthentication.GetRedirectUrl(usr.SupLogin, false));
                    Response.Redirect("../Views/SupplierOrder/SearchSupplierOrderSup.aspx");

                }
                else
                {
                    lb_msg.Text = "Votre Login ou mot de passe est incorrect <br/>您的账户名或者密码有错!";
                }
            }
            else
            {
                var usr = UserServices.LogIn(username, pwd);
                bool isCookiePersistent = cbx_remeberme.Checked;
                if (usr != null)
                {
                    if (usr.Is_Active)
                    {
                        string userinfo = CookieTicket.EncodeTicket(usr);

                        FormsAuthenticationTicket authTicket = new FormsAuthenticationTicket(1, usr.UserLogin, DateTime.Now,
                            DateTime.Now.AddMonths(12), isCookiePersistent, userinfo);

                        //Encrypt the ticket.
                        string encryptedTicket = FormsAuthentication.Encrypt(authTicket);

                        //Create a cookie, and then add the encrypted ticket to the cookie as data.
                        HttpCookie authCookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket);

                        if (isCookiePersistent)
                        {
                            //authTicket.Expiration = DateTime.Now.AddMonths(12);
                            authTicket.Expiration.AddYears(1);
                            authCookie.Expires = authTicket.Expiration;
                        }

                        //Add the cookie to the outgoing cookies collection.
                        Response.Cookies.Add(authCookie);

                        //You can redirect now.
                        Response.Redirect(FormsAuthentication.GetRedirectUrl(usr.UserLogin, false));
                    }
                    else
                    {
                        lb_msg.Text = "Votre compte est verrouillé, veuillez contacter l'administrateur";
                    }
                }
                else
                {
                    lb_msg.Text = "Votre Login ou mot de passe est incorrect !";
                }
            }
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
                    checkOK = ticket.UserData.DecodeTicket(connectedUser);
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }

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
                    checkOK = ticket.UserData.DecodeTicket();
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }

        private static void UpdateCurrencyEx()
        {
            var listCurrency = new List<Currencies>();
            var _ExchangeUrl = "ExchangeUrl";
            string url = WebConfigurationManager.AppSettings[_ExchangeUrl];
            try
            {
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception ex)
            {
            }
            try
            {
                //url = WebConfigurationManager.AppSettings[_ExchangeUrl];
                url = string.Format("{0}index_1.html", url);
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception ex)
            {
            }
            try
            {
                SocietyServices.UpdateCurrency(listCurrency);
            }
            catch (Exception ex)
            {
            }
            //return 0;
        }

        private static void GetCurrencyFromPage(string url, List<Currencies> listCurrency)
        {
            var pagecode = string.Empty;
            using (WebClient client = new WebClient())
            {
                ServicePointManager.Expect100Continue = true;
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
                client.Encoding = System.Text.Encoding.GetEncoding("gbk");
                try
                {
                    pagecode = Encoding.GetEncoding("utf-8").GetString(client.DownloadData(url));
                }
                catch (Exception ex)
                {
                }
                if (!string.IsNullOrEmpty(pagecode))
                {
                    HtmlDocument parser = new HtmlDocument();
                    parser.LoadHtml(pagecode);
                    //var pagetitle = parser.DocumentNode.SelectSingleNode("//title").InnerText;
                    var divLabel = "//div[contains(@class, 'publish')]";
                    var tabLabel = "//table[contains(@align, 'left')]";
                    var curDiv = parser.DocumentNode.SelectNodes(divLabel).FirstOrDefault();
                    if (curDiv != null)
                    {
                        var trDiv = curDiv.SelectNodes(tabLabel).FirstOrDefault();
                        if (trDiv != null)
                        {
                            var allcurrencyTr = curDiv.SelectNodes("//tr");
                            foreach (var oneTr in allcurrencyTr)
                            {
                                if (oneTr.ChildNodes.Count() > 10)
                                {
                                    var oneCur = new Currencies();
                                    oneCur.Name = oneTr.ChildNodes[1].InnerHtml;
                                    oneCur.BuyingRate = DecimalTry(oneTr.ChildNodes[3].InnerHtml.Replace(".", ","));
                                    oneCur.CashBuyingRate = DecimalTry(oneTr.ChildNodes[5].InnerHtml.Replace(".", ","));
                                    oneCur.SellingRate = DecimalTry(oneTr.ChildNodes[7].InnerHtml.Replace(".", ","));
                                    oneCur.CashSellingRate = DecimalTry(oneTr.ChildNodes[9].InnerHtml.Replace(".", ","));
                                    oneCur.MiddleRate = DecimalTry(oneTr.ChildNodes[11].InnerHtml.Replace(".", ","));
                                    listCurrency.Add(oneCur);
                                }
                            }
                        }
                    }
                }
            }
        }

        private static decimal DecimalTry(string str)
        {
            decimal returnValue = 0;
            decimal.TryParse(str, out returnValue);
            return returnValue;
        }

    }
}

using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.Entities;
using ERP.SharedServices;
using ERP.DataServices;
using ERP.RefSite.MyClientService;
using ERP.RefSite.Shared;
using ERP.Repositories;
using System.IO;

namespace ERP.RefSite
{
    public partial class _Default : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (IsPostBack)
            {
                //if (!string.IsNullOrEmpty(txb_email.Text))
                //{
                //    string content = string.Empty;
                //    content += ("Société : " + txb_companyname.Text + "<br/>");
                //    content += ("Prénom : " + txb_firstname.Text + "<br/>");
                //    content += ("Nom du famille : " + txb_lastname.Text + "<br/>");
                //    content += ("Email : " + txb_email.Text + "<br/>");
                //    content += ("Téléphone : <a href='tel:" + txb_tel.Text + "'>" + txb_tel.Text + "</a><br/>");
                //    content += ("Message : " + txb_message.Text.Replace("\r\n", "<br/>"));

                //    var from = WebConfigurationManager.AppSettings["EmailAccount1"];
                //    var fromPwd = WebConfigurationManager.AppSettings["EmailAccount1Pwd"];
                //    var host = WebConfigurationManager.AppSettings["EmailAccount1Host"];
                //    var notif = WebConfigurationManager.AppSettings["EmailDestNotif"];

                //    // send to ecoled
                //    NetMails.SendMailWithAttachement(txb_companyname.Text + " contact", from, content, notif, fromPwd, null, true, null, host);


                //    // send to client
                //    string subject = "MERCI POUR VOTRE PRISE DE CONTACT";
                //    string emailBody = "Bonjour,<br/><br/>" +
                //                       "Merci d’avoir pris contact avec notre service. <br/><br/>" +
                //                       "Votre demande à bien était pris en compte, nous vous contacterons dès que possible.<br/><br/>" +
                //                       "Sincères salutations,<br/><br/>" +
                //                       "ECOLED EUROPE<br/><br/>" +
                //                       "ecoledeurope@gmail.com<br/><br/>" +
                //                       "<a href='tel:0033164662171'>01 64 66 21 71</a> ou <a href='tel:0033663759144'>06 63 75 91 44</a>";
                //    emailBody = emailBody.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
                //    NetMails.SendMailWithAttachement(subject, from, emailBody, txb_email.Text, fromPwd, null, true, null, host);
                //}
            }
        }


        [WebMethod]
        public static int CheckExisted(string prdRef)
        {
            int result = 0;
            ProductServices ProductServices = new ProductServices();
            if (!string.IsNullOrEmpty(prdRef) && !string.IsNullOrEmpty(prdRef.Trim()))
            {
                var oneprd = ProductServices.LoadProductByRef(prdRef, 1);
                if (oneprd != null)
                {
                    result = 1;
                    if (oneprd.InstanceList != null && oneprd.InstanceList.Any(l => l.PitAllInfo.Any(m => m.PropName == "IES" && !string.IsNullOrEmpty(m.PropValue))))
                    {
                        result = 2;
                    }
                }
            }
            return result;
        }



        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string SendEmail(EntityMessage email)
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
                //if (email.IsDirver == "1")
                //{
                //    filename = "ClientDiagnostic.html";
                //    smsFilename = "sms_diagnostic_tmp.txt";
                //    //contactype = "Diagnostic";
                //}
                SiteCommonServices SiteCommonServices = new SiteCommonServices();
                var msgcode = SiteCommonServices.RecordMessage(email);
                email.Code = msgcode;

                #region SMS Email for client
                filePath += filename;
                smsFilePath += smsFilename;
                string readText = File.ReadAllText(filePath);
                string title = "💡 ECOLED EUROPE : VOTRE MESSAGE A BIEN ÉTÉ ENREGISTRÉ.";
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
                var oneSms = new SMS_Message
                {
                    sms_subject = email.Subject,
                    sms_telnumber = email.Telephone,
                    sms_appGuid = ConfigurationManager.AppSettings["smsclientguid"],
                    sms_content = ReplaceString(smscontent, "#Code#", email.Code),
                    sms_d_creation = DateTime.Now,
                    sms_d_send = DateTime.Now
                };

                SendSms.SendMessage(oneSms);
                NetMails.SendMail(title, from, bodyClient, email.Email, pwd, null, true, fromName: ConfigurationManager.AppSettings["CompanyName"], hostname: ConfigurationManager.AppSettings["EmailAccount1Host"]);
                #endregion SMS Email for client

                #region SMS Email for contact
                string emailIntraPath = mappath + "HtmlTmp\\intra_contact_email.html";
                string emailIntraText = File.ReadAllText(emailIntraPath);
                string email_title = "💡 NOUVEAU MESSAGE";
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
                emailIntraText = ReplaceString(emailIntraText, "#CompanyName#", email.CompanyName);
                emailIntraText = ReplaceString(emailIntraText, "#Message#", email.Message.Replace("\r\n", "<br/>").Replace("\n", "<br/>"));

                string contactSmsContent = string.Empty;

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



                var contactSms = new SMS_Message
                {
                    sms_subject = email.Subject,
                    sms_telnumber = contactTelephone,
                    sms_appGuid = ConfigurationManager.AppSettings["smsclientguid"],
                    sms_content = contactSmsContent,
                    sms_d_creation = DateTime.Now,
                    sms_d_send = DateTime.Now
                };

                SendSms.SendMessage(contactSms);
                NetMails.SendMail(email_title, from, emailIntraText, contactEmail, pwd, null, true, fromName: ConfigurationManager.AppSettings["CompanyName"], hostname: ConfigurationManager.AppSettings["EmailAccount1Host"]);
                #endregion SMS Email for contact

                // record message

            }
            catch (Exception ex)
            {
                returnvalue = ex.Message;
            }
            return null;
        }


        private static string ReplaceString(string orgstr, string keystr, string rplstr)
        {
            if (!string.IsNullOrEmpty(orgstr))
            {
                if (orgstr.Contains(keystr))
                {
                    if (string.IsNullOrEmpty(rplstr))
                    {
                        rplstr = "";
                    }
                    orgstr = orgstr.Replace(keystr, rplstr);
                }
            }
            return orgstr;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Serialization;
using System.Web.Script.Services;
using System.Web.Security;
using System.Web.Services;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories;
using ERP.Repositories.Shared;
using ERP.SharedServices;
using ERP.SharedServices.BarCode;
using ERP.Web.MyClientService;
using ERP.Web.Shared;
using Gma.QrCodeNet.Encoding;
using Gma.QrCodeNet.Encoding.Windows.Render;
using HtmlAgilityPack;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.Win32;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Asn1.Ocsp;

namespace ERP.Web.Services
{
    /// <summary>
    /// Summary description for ERPWebServices
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    public class ERPWebServices : System.Web.Services.WebService
    {
        #region variables
        private CommonServices CommonServices = new CommonServices();
        private ClientServices ClientServices = new ClientServices();
        private ContactClientServices ContactClientServices = new ContactClientServices();
        private ProductTypeServices ProductTypeServices = new ProductTypeServices();
        private ProductServices ProductServices = new ProductServices();
        private ProjectServices ProjectServices = new ProjectServices();
        private AlbumServices AlbumServices = new AlbumServices();
        private SupplierServices SupplierServices = new SupplierServices();
        private SupplierContactServices SupplierContactServices = new SupplierContactServices();
        private CostPlanServices CostPlanServices = new CostPlanServices();
        private CostPlanLineServices CostPlanLineServices = new CostPlanLineServices();
        private SupplierProductServices SupplierProductServices = new SupplierProductServices();
        private ClientOrderServices ClientOrderServices = new ClientOrderServices();
        private ClientOrderLineServices ClientOrderLineServices = new ClientOrderLineServices();
        private DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
        private DeliveryFormLineServices DeliveryFormLineServices = new DeliveryFormLineServices();
        private ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
        private ClientInvoiceLineServices ClientInvoiceLineServices = new ClientInvoiceLineServices();
        private PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
        private PurchaseBaseLineServices PurchaseBaseLineServices = new PurchaseBaseLineServices();
        private BankAccountServices BankAccountServices = new BankAccountServices();
        private LogisticsServices LogisticsServices = new LogisticsServices();
        private CategoryServices CategoryServices = new CategoryServices();
        private UserServices UserServices = new UserServices();
        private WarehouseService WarehouseService = new WarehouseService();
        private MessageServices MessageServices = new MessageServices();
        private CalendarServices CalendarServices = new CalendarServices();
        private UserHServices UserHServices = new UserHServices();
        private int ResultLimit = Convert.ToInt32(WebConfigurationManager.AppSettings["ResultLimit"]);
        private SiteProjectServices SiteProjectServices = new SiteProjectServices();
        private SocietyServices SocietyServices = new SocietyServices();
        private ConsigneeServices ConsigneeServices = new ConsigneeServices();
        #endregion variables

        [WebMethod]
        public string HelloWorld()
        {
            var authCookie = FormsAuthentication.FormsCookieName;

            return "Hello World";
        }

        #region Common

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientType()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetClientTypes();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllCommuneNameByPostcode(string postcode)
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllCommuneNameByPostcode(postcode);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllCurrency()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllCurrency();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllLanguage()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllLanguage();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllTVA()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllTVA();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPaymentCondition()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetPaymentCondition();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPaymentMode()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetPaymentMode();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetActivity()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetActivity();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCivility()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetCivility();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetLineType()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllLineType();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllColor()
        {
            string returnvalue;
            User connectUser;
            if (CheckAuthentication(out connectUser))
            {
                var values = CommonServices.GetAllColor(connectUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetHeaderFooterText()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                var values = CommonServices.GetHeaderFooter();
                if (values != null)
                {
                    var user = UserServices.GetOneUser(connectedUser.Soc_id, connectedUser.Id);
                    values.CostPlanFooter = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", values.CostPlanFooter,
                        user.FullName, user.Cellphone, user.Email);
                    values.ClinetInvoiceEmail = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", values.ClinetInvoiceEmail,
                        user.FullName, user.Cellphone, user.Email);
                    values.CurUserEmail = user.Email;
                }
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCplStatus()
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllStatus();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetGeneralStatus()
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetAllGeneralStatus();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllTte()
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                var values = CommonServices.GetTradeTerms();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// for cost plan
        /// </summary>
        /// <param name="oneEmail"></param>
        /// <returns></returns>
        [WebMethod]
        public int SendEmail(EmailClass oneEmail)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var user = UserServices.GetOneUser(connectedUser.Soc_id, connectedUser.Id);
                    var strprdId = StringCipher.DecoderSimple(oneEmail.FId.UrlDecode2String(), "cplId");
                    var society = SocietyServices.LoadSocietyById(user.Soc_id);
                    int cpl_id = 0;
                    int.TryParse(strprdId, out cpl_id);
                    string _path = Server.MapPath("~");
                    var onecpl = CostPlanServices.LoadCostPlanById(cpl_id, connectedUser.Soc_id, connectedUser.Id, true);
                    //var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrl"];
                    // 20241119 Comment out the code, no need fich tech
                    var DownloadTechSheetUrl = string.Empty;
                    var withTechSheet = WebConfigurationManager.AppSettings["WithTechSheet"];
                    bool _withtechsheet;
                    bool.TryParse(withTechSheet, out _withtechsheet);
                    MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDevis(_path, onecpl, DownloadTechSheetUrl, _withtechsheet);

                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society);
                    byte[] newarray = AddLog2Page(newarray0, _path, onecpl.CplCode);
                    byte[] pdfBtyBytes = newarray.ToArray();
                    output.Close();

                    string costplanFilePath = "CostPlanEmail.html";
                    string emailBody = ReadFileFrom(costplanFilePath, _path);
                    emailBody = emailBody.Replace("#CplCode#", onecpl.CplCode);
                    emailBody = emailBody.Replace("#MsgContent#", oneEmail.Body.Replace("\r\n", "<br/>"));
                    string cplLines = string.Empty;
                    decimal total = 0;
                    decimal totalEco = 0;


                    foreach (var oneLine in onecpl.CostPlanLines)
                    {
                        cplLines += "<tr><td width='772' align='center' valign='top'><table width='744' border='0' cellpadding='0' cellspacing='0'><tbody><tr>";
                        cplLines += "<td width='104' height='46' align='left' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" +
                            ((!oneLine.PrdId.HasValue || oneLine.PrdId == 0) ? (oneLine.ClnPrdName) :
                            (string.Format("{0}", string.IsNullOrEmpty(DownloadTechSheetUrl) ? oneLine.ClnPrdName :
                            string.Format("<a href='{0}?p={1}' target='_blank'>{1}</a>", DownloadTechSheetUrl, oneLine.ClnPrdName)))) + "</td>";

                        string allDes = string.IsNullOrEmpty(oneLine.ClnPrdDes)
                            ? oneLine.ClnDescription
                            : (string.IsNullOrEmpty(oneLine.ClnDescription) ? oneLine.ClnPrdDes : (oneLine.ClnPrdDes + "<br/>----------------------<br/>" + oneLine.ClnDescription));
                        allDes = allDes.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
                        cplLines += "<td width='290' height='46' align='left' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + allDes + "</td>";
                        cplLines += "<td width='50' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n0}", oneLine.ClnQuantity) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", oneLine.ClnUnitPrice) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", oneLine.ClnPriceWithDiscountHt) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", (oneLine.ClnQuantity * oneLine.ClnPriceWithDiscountHt)) + "</td>";
                        cplLines += " </tr></tbody></table></td></tr>";
                        total += ((oneLine.ClnQuantity ?? 0) * (oneLine.ClnPriceWithDiscountHt ?? 0));
                        totalEco += ((oneLine.ClnQuantity ?? 0) * (oneLine.ClnDiscountAmount ?? 0));
                    }
                    emailBody = emailBody.Replace("#CostPlanLines#", cplLines);
                    emailBody = emailBody.Replace("#CplTotalHT#", string.Format("{0:n2}", total));
                    emailBody = emailBody.Replace("#CplTotalDiscount#", string.Format("{0:n2}", totalEco));


                    System.Net.Mime.ContentType ct = new System.Net.Mime.ContentType(System.Net.Mime.MediaTypeNames.Application.Pdf);
                    System.Net.Mail.Attachment attach = new System.Net.Mail.Attachment(new MemoryStream(pdfBtyBytes), ct);
                    attach.ContentDisposition.FileName = string.Format("{1}-Devis-{0}.pdf", onecpl.CplCode, onecpl.ClientCompanyName);

                    var from = WebConfigurationManager.AppSettings["EmailAccount1"];
                    var fromPwd = WebConfigurationManager.AppSettings["EmailAccount1Pwd"];
                    var host = WebConfigurationManager.AppSettings["EmailAccount1Host"];
                    var port = WebConfigurationManager.AppSettings["EmailAccount1Port"];
                    int portnum;
                    int.TryParse(port, out portnum);
                    //NetMails.SendMailWithAttachement("Devis EcoLed", "lcleador@gmail.com", emailBody, oneEmail.Tos, "0!0@150898_LCLf", null, true, attach);

                    var companyName = society.Society_Name;//WebConfigurationManager.AppSettings["CompanyName"];
                    string subject = string.Format("{1} DEVIS {0}", onecpl.CplCode, companyName);
                    oneEmail.Tos = string.Format("{0};{1}", oneEmail.Tos, user.Email);
                    returnvalue = NetMails.SendMailWithAttachement(subject, from, emailBody, oneEmail.Tos, fromPwd, null, true, attach, host, portnum) ? 1 : 0;

                    // I guess you know how to send email with an attachment
                    // after sending email
                    //output.Close();

                }
                catch (Exception)
                {
                }

            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        /// <summary>
        /// 在发票页面自动发发票
        /// </summary>
        /// <param name="oneEmail"></param>
        /// <returns></returns>
        [WebMethod]
        public int SendEmailCin(EmailClass oneEmail)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var user = UserServices.GetOneUser(connectedUser.Soc_id, connectedUser.Id);
                    var strprdId = StringCipher.DecoderSimple(oneEmail.FId.UrlDecode2String(), "cinId");
                    var society = SocietyServices.LoadSocietyById(user.Soc_id);
                    int cinId = 0;
                    int.TryParse(strprdId, out cinId);
                    string _path = Server.MapPath("~");
                    var onecin = ClientInvoiceServices.LoadClientInvoiceById(cinId, connectedUser.Soc_id, connectedUser.Id, true);
                    var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrl"];
                    var withTechSheet = WebConfigurationManager.AppSettings["WithTechSheet"];
                    bool _withtechsheet;
                    bool.TryParse(withTechSheet, out _withtechsheet);
                    var PdfVersion = WebConfigurationManager.AppSettings["PdfVersion"];
                    MemoryStream output;
                    if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice_VS001(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                    }
                    else if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfGCinMa(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                    }
                    else if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin_hk(_path, onecin, society,
                            DownloadTechSheetUrl, _withtechsheet);
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin_HK02(_path, onecin, society,
                            DownloadTechSheetUrl, _withtechsheet);
                    }
                    else
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin(_path, onecin, society,
                            DownloadTechSheetUrl, _withtechsheet);
                    }
                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.CinCode, string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase), PdfVersion);
                    byte[] newarray;
                    if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                    {
                        newarray = newarray0;
                    }
                    else
                    {
                        bool hk02 = string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase);
                        string qrname = onecin.CinIsInvoice ? (hk02 ? "商業發票 COMMERCIAL INVOICE" : "商业发票 COMMERCIAL INVOICE") : (hk02 ? "貨記單 CREDIT NOTE" : "贷记单 CREDIT NOTE");
                        newarray = AddLog2Page(newarray0, _path, onecin.CinCode, PdfVersion, society, qrname);
                    }
                    byte[] pdfBtyBytes = newarray.ToArray();
                    output.Close();

                    string costplanFilePath = "CinEmail.html";
                    string emailBody = ReadFileFrom(costplanFilePath, _path);
                    emailBody = emailBody.Replace("#CplCode#", onecin.CinCode);
                    emailBody = emailBody.Replace("#MsgContent#", oneEmail.Body.Replace("\r\n", "<br/>"));
                    string cplLines = string.Empty;
                    decimal? total = 0;
                    decimal? totalEco = 0;
                    decimal? totalTtc = 0;

                    foreach (var oneLine in onecin.ClientInvoiceLines)
                    {
                        cplLines += "<tr><td width='772' align='center' valign='top'><table width='744' border='0' cellpadding='0' cellspacing='0'><tbody><tr>";
                        cplLines += "<td width='104' height='46' align='left' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" +
                            ((!oneLine.PrdId.HasValue || oneLine.PrdId == 0) ? (oneLine.CiiPrdName) :
                            (string.Format("{0}", string.IsNullOrEmpty(DownloadTechSheetUrl) ? oneLine.CiiPrdName :
                            string.Format("<a href='{0}?p={1}' target='_blank'>{1}</a>", DownloadTechSheetUrl, oneLine.CiiPrdName)))) + "</td>";

                        string allDes = string.IsNullOrEmpty(oneLine.CiiPrdDes)
                            ? oneLine.CiiDescription
                            : (string.IsNullOrEmpty(oneLine.CiiDescription) ? oneLine.CiiPrdDes : (oneLine.CiiPrdDes + "<br/>----------------------<br/>" + oneLine.CiiDescription));
                        allDes = allDes.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
                        cplLines += "<td width='290' height='46' align='left' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + allDes + "</td>";
                        cplLines += "<td width='50' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n0}", oneLine.CiiQuantity) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", oneLine.CiiUnitPrice) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", oneLine.CiiPriceWithDiscountHt) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", (oneLine.CiiQuantity * oneLine.CiiPriceWithDiscountHt)) + "</td>";
                        cplLines += "<td width='100' height='46' align='right' valign='middle' style='border-bottom: solid 1px #e5e5e5'>" + string.Format("{0:n2}", (oneLine.CiiQuantity * oneLine.CiiPriceWithDiscountHt * (1 + (oneLine.VatRate / 100)))) + "</td>";
                        cplLines += " </tr></tbody></table></td></tr>";
                        total += ((oneLine.CiiQuantity) * (oneLine.CiiPriceWithDiscountHt ?? 0));
                        totalTtc += ((oneLine.CiiQuantity) * (oneLine.CiiPriceWithDiscountHt ?? 0)) * (1 + (oneLine.VatRate / 100));
                        totalEco += ((oneLine.CiiQuantity) * (oneLine.CiiDiscountAmount ?? 0));
                    }
                    emailBody = emailBody.Replace("#CostPlanLines#", cplLines);
                    emailBody = emailBody.Replace("#CplTotalHT#", string.Format("{0:n2}", total));
                    emailBody = emailBody.Replace("#CplTotalTTC#", string.Format("{0:n2}", totalTtc));
                    emailBody = emailBody.Replace("#CplTotalDiscount#", string.Format("{0:n2}", totalEco));


                    System.Net.Mime.ContentType ct = new System.Net.Mime.ContentType(System.Net.Mime.MediaTypeNames.Application.Pdf);
                    System.Net.Mail.Attachment attach = new System.Net.Mail.Attachment(new MemoryStream(pdfBtyBytes), ct);
                    attach.ContentDisposition.FileName = string.Format("{1}-Facture-{0}.pdf", onecin.CinCode, onecin.ClientCompanyName);

                    var from = WebConfigurationManager.AppSettings["EmailAccount1"];
                    var fromPwd = WebConfigurationManager.AppSettings["EmailAccount1Pwd"];
                    var host = WebConfigurationManager.AppSettings["EmailAccount1Host"];
                    var port = WebConfigurationManager.AppSettings["EmailAccount1Port"];
                    int portnum;
                    int.TryParse(port, out portnum);
                    //NetMails.SendMailWithAttachement("Devis EcoLed", "lcleador@gmail.com", emailBody, oneEmail.Tos, "0!0@150898_LCLf", null, true, attach);

                    var companyName = society.Society_Name;//WebConfigurationManager.AppSettings["CompanyName"];
                    string subject = string.Format("{1} FACTURE {0}", onecin.CinCode, companyName);
                    oneEmail.Tos = string.Format("{0}", oneEmail.Tos);
                    returnvalue = NetMails.SendMailWithAttachement(subject, from, emailBody, oneEmail.Tos, fromPwd, oneEmail.Ccs, true, attach, host, portnum) ? 1 : 0;

                    // I guess you know how to send email with an attachment
                    // after sending email
                    //output.Close();

                }
                catch (Exception)
                {
                }

            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }


        #region Files

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDocumentList(string dtpName, string forId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var key = GetDocumentTypeKey(dtpName);

                var for_Id = IntTryParse(forId.UrlDecode2String(), key);
                var spr = CommonServices.GetDocumentList(dtpName, for_Id);
                returnvalue = Serialize(spr);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SaveUpdateDocuments(string dtpName, List<KeyValue> docs)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var key = GetDocumentTypeKey(dtpName);
                docs.ForEach(l =>
                {
                    if (!string.IsNullOrEmpty(l.Value4))
                    {
                        l.Key2 = IntTryParse(l.Value4, key);
                    }
                    if (!string.IsNullOrEmpty(l.Value3))
                    {
                        l.DValue = GetDateTimeOrNow(l.Value3).Value;
                    }
                });

                var sdcIds = CommonServices.SaveUpdateDocuments(dtpName, docs);
                returnvalue = Serialize(sdcIds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteDocumentFile(string dtpName, string forId, int docId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var key = GetDocumentTypeKey(dtpName);
                var sodid = IntTryParse(forId, key);
                var values = CommonServices.UpdateDocumentFile(dtpName, sodid, docId, null);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        private string GetDocumentTypeKey(string dtpName)
        {
            var key = "";
            switch (dtpName)
            {
                case "Logistics":
                    {
                        key = "lgsId";
                    }
                    break;
            }
            return key;
        }


        #endregion Files

        #endregion Common

        #region Client

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public int CheckClientExisted(string companyName, string cliId)
        {
            int returnvalue = 1;
            User connectedUser;
            int cli_id = 0;
            try
            {
                var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                cli_id = Convert.ToInt32(strcliId);
            }
            catch (Exception)
            {
            }
            if (CheckAuthentication(out connectedUser))
            {
                returnvalue = ClientServices.CheckClientExisted(connectedUser.Soc_id, cli_id, companyName);
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadClientById(string cliId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cli_id != 0)
                {
                    var values = ClientServices.LoadClientById(cli_id);
                    returnvalue = Serialize(values);
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
        public string GetAllClients()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ClientServices.GetAllClientSimple(connectedUser.Soc_id, connectedUser.Id, connectedUser.SuperRight);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllClients2()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ClientServices.GetAllClientSimple2(connectedUser.Soc_id, connectedUser.Id, connectedUser.SuperRight);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteContactClient(int ccoId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                returnvalue = ContactClientServices.DeleteContactClient(ccoId, connectedUser.Soc_id);
            }
            return returnvalue;
        }

        [WebMethod]
        public string GetClientId(string itemId, int typeId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                int otherId = 0;
                try
                {
                    string encodeStr = string.Empty;
                    switch (typeId)
                    {
                        case 1:
                            {
                                encodeStr = "prjId";
                            }
                            break;
                        case 2:
                            {
                                encodeStr = "cplId";
                            }
                            break;
                        case 3:
                            {
                                encodeStr = "codId";
                            }
                            break;
                        case 4:
                            {
                                encodeStr = "dlfId";
                            }
                            break;
                        case 5:
                            {
                                encodeStr = "cinId";
                            }
                            break;
                    }
                    var strptyId = StringCipher.DecoderSimple(itemId.UrlDecode2String(), encodeStr);
                    otherId = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {

                }
                var cliId = ClientServices.GetClientIdByOtherId(otherId, typeId, connectedUser.Soc_id);
                returnvalue = StringCipher.EncoderSimple(cliId.ToString(), "cliId");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeteleClient(string cliId)
        {
            bool deleted = false;
            User connecteduser;
            if (CheckAuthentication(out connecteduser))
            {
                int cli_id = IntTryParse(cliId, "cliId");
                if (cli_id != 0)
                {
                    deleted = ClientServices.DeleteClient(connecteduser.Soc_id, cli_id);
                }
            }
            return deleted;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchClientByName(string client)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ClientServices.SearchClientByName(client, connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientById(int cliId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                var values = ClientServices.LoadClientById(cliId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #region Delegator

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchDelegatorOfClient(string cliId, int delegatorId = 0)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }

                if (cli_id != 0)
                {
                    var values = ClientServices.SearchDelegatorOfClient(connectedUser.Soc_id, cli_id, delegatorId);
                    returnvalue = Serialize(values);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string SearchClientsOfDelegator(string cliId, int delegatorId = 0)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }

                if (cli_id != 0)
                {
                    var values = ClientServices.SearchClientsOfDelegator(connectedUser.Soc_id, cli_id);
                    returnvalue = Serialize(values);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string RelateDeleteClientDelegator(string cliId, string delgId, int type)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                int deleg_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception) { }
                try
                {
                    var strcliId = StringCipher.DecoderSimple(delgId.UrlDecode2String(), "cliId");
                    deleg_id = Convert.ToInt32(strcliId);
                }
                catch (Exception) { }
                if (cli_id != 0 && deleg_id != 0)
                {
                    var values = ClientServices.RelateDeleteClientDelegator(connectedUser.Soc_id, cli_id, deleg_id, type);
                    returnvalue = Serialize(values);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string GetAllClientsDelegator(int cliId, int type)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ClientServices.GetAllClientsDelegator(connectedUser.Soc_id, cliId, type);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Delegator

        #endregion Client

        #region Site Client

        [WebMethod]
        public int GetCountClientToActive()
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    returnvalue = ClientServices.GetCountClientToActive(connectedUser.Soc_id);
                }
                catch (Exception)
                {

                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientToActive()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = ClientServices.GetClientToActive(connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {

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
        public string ActiverSiteClient(SiteClient client)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    client.SocId = connectedUser.Soc_id;
                    client.UsrCreatedBy = connectedUser.Id;
                    client.Id = IntTryParse(client.FId, "cliId");
                    var values = ClientServices.ActiveSiteClient(client);
                    string clientcode = StringCipher.EncoderSimple(values.ToString(), "cliId");
                    returnvalue = Serialize(clientcode);
                }
                catch (Exception)
                {

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
        public string CreatSiteClientByContactClient(string cliId, int ccoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    int cli_id = IntTryParse(cliId, "cliId");
                    var values = ClientServices.CreatSiteClientByContactClient(connectedUser.Soc_id, cli_id, ccoId);
                    if (values > 0)
                    {
                        var siteclient = ClientServices.LoginWithId(values, true);
                        // todo: decode password
                        try
                        {
                            var pwd = StringCipher.Decrypt(siteclient.Pwd, siteclient.Login);
                            siteclient.Pwd = pwd;
                        }
                        catch (Exception)
                        {
                        }
                        if (!string.IsNullOrEmpty(siteclient.Email))
                        {
                            SendEmailForCreateSiteLogin(siteclient);
                        }
                    }
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
                    returnvalue = Serialize("-1");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        private int SendEmailForCreateSiteLogin(SiteClient siteClient)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    int cpl_id = 0;
                    string _path = Server.MapPath("~");

                    string costplanFilePath = "GeneralEmail.html";
                    string emailBody = ReadFileFrom(costplanFilePath, _path);
                    string msgcontent = string.Format("{0}<br/>Login : {1}<br/>Mot de passe : {2}",
                        WebConfigurationManager.AppSettings["MsgContentCreateLogin"],
                        siteClient.Login,
                        siteClient.Pwd);
                    //emailBody = emailBody.Replace("#MsgContent#", "Votre compte ECOLED a été créé<br/>Login : " + siteClient.Login + "<br/>Mot de passe : " + siteClient.Pwd);
                    emailBody = emailBody.Replace("#MsgContent#", msgcontent);
                    string emailtitle = WebConfigurationManager.AppSettings["EmailTitleCreateLogin"];
                    //emailBody = emailBody.Replace("#EmailTitle#", "<span style='color: #0877BA'>ECO</span><span style='color: #14AAE2'>LED</span>&nbsp;COMPTE&nbsp;CRÉÉ");
                    emailBody = emailBody.Replace("#EmailTitle#", emailtitle);

                    //string emailBody = "Votre compte ECOLED est créé<br/>Login : " + siteClient.Login + "<br/>Mot de passe : " + siteClient.Pwd;
                    var from = WebConfigurationManager.AppSettings["EmailAccount1"];
                    var fromPwd = WebConfigurationManager.AppSettings["EmailAccount1Pwd"];
                    var host = WebConfigurationManager.AppSettings["EmailAccount1Host"];
                    string subject = string.Format("{0} COMPTE A ÉTÉ CRÉÉ", WebConfigurationManager.AppSettings["CompanyName"]);
                    returnvalue = NetMails.SendMailWithAttachement(subject, from, emailBody, siteClient.Email, fromPwd, null, true, null, host) ? 1 : 0;

                }
                catch (Exception)
                {
                }

            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        #endregion Site Client

        #region Product

        #region Product Attributes

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadProduitAttributeById(string ptyId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.LoadProduitAttributeById(pty_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 删除商品的一个属性，并不是删除该商品属相
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        public bool DeleteProduitAttributePropertyByIdGuid(string ptyId, string propGuid)
        {
            bool returnvalue = false;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {

                }
                if (pty_id != 0)
                {
                    returnvalue = ProductTypeServices.DeleteOneProperty(pty_id, propGuid);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        public int DeleteProduitAttributById(string ptyId)
        {
            int returnvalue = -1;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {

                }
                if (pty_id != 0)
                {
                    returnvalue = ProductTypeServices.DeleteAttribute(pty_id);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductTypes(int selectedType)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ProductTypeServices.GetProductTypesBySocId(connectedUser.Soc_id, selectedType);
                values.ForEach(l =>
                {
                    l.Value2 = StringCipher.EncoderSimple(l.Key.ToString(), "ptyId");
                });
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetOneProductTypeById(int ptyId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ProductTypeServices.LoadProduitAttributeById(ptyId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateOneProperty(string ptyId, PropertyValue propertyNames)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.CreateUpdateMartrixColumn(pty_id, propertyNames);
                    returnvalue = Serialize(values);
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
        public string GetProductMatrixByPtyId(string ptyId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.GetProductMatrixByPtyId(pty_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteProduitPropertyByIdGuid(string ptyId, string propGuid)
        {
            bool returnvalue = false;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {

                }
                if (pty_id != 0)
                {
                    returnvalue = ProductTypeServices.DeleteOnePropertyByXGuid(pty_id, propGuid);
                }
            }
            return returnvalue;
        }

        /// <summary>
        /// for this function, PropUnit is ptyId
        /// </summary>
        /// <param name="propertyName"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddUpdateOneYItem(PropertyYValue propertyName)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(propertyName.PropUnit.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.AddUpdateOneYItemByXGuid(pty_id, propertyName);
                    returnvalue = Serialize(values);
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
        public string DeleteOneYValue(PropertyYValue propertyName)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(propertyName.PropUnit.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.DeleteOneYValue(pty_id, propertyName);
                    returnvalue = Serialize(values);
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
        public string GetPorpXById(string ptyId, string propGuid)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.GetPropXValueById(pty_id, propGuid);
                    returnvalue = Serialize(values);
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
        public string CreateUpdateZValue(string ptyId, PropertyValue propertyName)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.CreateUpdateZValue(pty_id, propertyName);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteZValueByIdGuid(string ptyId, string propGuid)
        {
            bool returnvalue = false;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {

                }
                if (pty_id != 0)
                {
                    returnvalue = ProductTypeServices.DeleteZValue(pty_id, propGuid);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductMatrixZPtyId(string ptyId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.GetProductMatrixZPtyId(pty_id);
                    returnvalue = Serialize(values);
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
        public string GetPorpZById(string ptyId, string propGuid)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = Serialize(0);
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.GetPropZValueById(pty_id, propGuid);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public string DuplicateProductType(string ptyId, string ptyName)
        {
            string returnvalue = "0";
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int pty_id = 0;
                try
                {
                    var strptyId = StringCipher.DecoderSimple(ptyId.UrlDecode2String(), "ptyId");
                    pty_id = Convert.ToInt32(strptyId);
                }
                catch (Exception)
                {
                    returnvalue = "-1";
                }
                if (pty_id != 0)
                {
                    var values = ProductTypeServices.DuplicateProductType(pty_id, connectedUser.Soc_id, ptyName);
                    returnvalue = StringCipher.EncoderSimple(values.ToString(), "ptyId");
                }
            }
            else
            {
                returnvalue = "-2";
            }
            return returnvalue;
        }

        #endregion Product Attributes

        #region Product Instance

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadProductById(string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    var values = ProductServices.LoadProductById(prd_Id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteProductInstance(string prdId, int pitId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    returnvalue = ProductServices.DeleteProductInstance(prd_Id, pitId, connectedUser.Soc_id);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductInstanceForUpdate(string prdId, int pitId, int ptyId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    var values = ProductServices.GetProductInstance(prd_Id, pitId, ptyId, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string UpdateProductInstance(ProductInstance prdInstance)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdInstance.FId.UrlDecode2String(), "prdId");
                    prdInstance.PrdId = prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    var values = ProductServices.UpdateProductInstance(prdInstance, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string CreateUpdateProductInstance(ProductInstance prdInstance)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = IntTryParse(prdInstance.FId.UrlDecode2String(), "prdId");
                prdInstance.PrdId = prd_Id;
                if (prd_Id != 0)
                {
                    var values = ProductServices.CreateUpdateProductInstance(prdInstance, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteProduct(string prdId)
        {

            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    returnvalue = ProductServices.DeleteProduct(prd_Id, connectedUser.Soc_id);
                }
            }
            return returnvalue;
        }

        /// <summary>
        /// 2024-07-29 Batch insert products
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="lines"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateProductFromExcel(string prdId, List<ProductInstance> lines)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = IntTryParse(prdId, "prdId");
                if (prd_Id != 0)
                {
                    var values = ProductServices.CreateProductFromExcel(connectedUser.Soc_id, prd_Id, lines);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }



        /// <summary>
        /// 2024-12-11 Batch insert products from search product page
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="lines"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateProductFromExcelFromSearchPrd(string ptyId, List<ProductInstance> lines)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int pty_Id = IntTryParse(ptyId, "ptyId");
                if (pty_Id != 0)
                {
                    var values = ProductServices.CreateProductFromExcelFromSearchPrd(connectedUser.Soc_id, pty_Id, lines);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Product Instance

        #region Search Proudct

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPtySearchFields(int ptyId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (ptyId != 0)
                {
                    var values = ProductTypeServices.GetPtySearchFields(ptyId, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string SearchProduct(int ptyId, string prdInfo, List<PropertyValue> searchValues)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                //var values = ProductServices.SearchProduct(ptyId, connectedUser.Soc_id, prdCode.StringTrimSetEmptyIfNull(), prdName.StringTrimSetEmptyIfNull(), prdRef.StringTrimSetEmptyIfNull(), searchValues);
                var values = ProductServices.SearchProduct(ptyId, connectedUser.Soc_id, prdInfo.StringTrimSetEmptyIfNull(), searchValues).Skip(0).Take(ResultLimit);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Search Proudct

        #region Product Photo

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadProductImages(string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = IntTryParse(prdId, "prdId");
                if (prd_Id != 0)
                {
                    var values = ProductServices.LoadProductImages(prd_Id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// Add and update for product image, and add only for product instance photo, no update
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="palId"></param>
        /// <param name="pimId"></param>
        /// <param name="des"></param>
        /// <param name="order"></param>
        /// <param name="pitId"></param>
        /// <param name="ptiId"></param>
        /// <returns></returns>
        [WebMethod]
        public string AddUpdateProductImages(string prdId, int palId, int pimId, string des, int order, int pitId, int ptiId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    if (pitId == 0)
                    {
                        ProductServices.AddUpdateProductPhoto(prd_Id, connectedUser.Soc_id, null, des, order, pimId, palId);
                    }
                    else
                    {
                        ProductServices.AddUpdatePitPhoto(prd_Id, connectedUser.Soc_id, null, des, pitId, order, palId, ptiId);
                    }
                    returnvalue = Serialize(prdId);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public string DeleteProductPhoto(string prdId, int pimId, int ptiId)
        {

            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    if (ptiId == 0)
                    {
                        ProductServices.DeleteProductImages(prd_Id, connectedUser.Soc_id, pimId);
                    }
                    else
                    {
                        ProductServices.DeletePitImages(prd_Id, connectedUser.Soc_id, ptiId);
                    }
                    returnvalue = Serialize(prdId);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Product Photo

        #region Product File

        [WebMethod]
        public string DeleteProductFile(string prdId, int pitId, string propGuid)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_Id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_Id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                if (prd_Id != 0)
                {
                    ProductServices.DeletePrdPitFile(prd_Id, pitId, connectedUser.Soc_id, propGuid);
                    returnvalue = Serialize(prdId);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Product File

        #region Get price

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientSoldProducts(string cliId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = IntTryParse(cliId, "cliId");
                var prds = ProductServices.GetClientSoldProducts(cli_id, connectedUser.Soc_id);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientProducts(string cliId, int pitId, string prdName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = IntTryParse(cliId, "cliId");
                var prds = ProductServices.GetClientProducts(cli_id, connectedUser.Soc_id, pitId, prdName);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetLastSellPriceForClient(KeyValue keyValue)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                // 输入数据顺序
                //cliId : keyValue.Key;
                //prdId : keyValue.Key2; Value2
                //pitId : keyValue.Key3; Value3
                //supId : keyValue.Key4;
                //prdName : keyValue.Value
                //sodFId : keyValue.Value4;

                var prdId = string.IsNullOrEmpty(keyValue.Value2) ? 0 : IntTryParse(keyValue.Value2, "prdId");
                var pitId = string.IsNullOrEmpty(keyValue.Value3) ? 0 : IntTryParse(keyValue.Value3, "pitId");
                var sodId = IntTryParse(keyValue.Value4, "sodId");
                var prds = ProductServices.GetLastSellPriceForClient(keyValue.Key, prdId, pitId, connectedUser.Soc_id, keyValue.Value, keyValue.Key4, sodId);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierSoldProducts(string supId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sup_Id = IntTryParse(supId, "supId");
                var prds = ProductServices.GetSupplierSoldProducts(sup_Id, connectedUser.Soc_id);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierProducts(string supId, int pitId, string prdName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sup_Id = IntTryParse(supId, "supId");
                var prds = ProductServices.GetSupplierProducts(sup_Id, connectedUser.Soc_id, pitId, prdName);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Get price

        [WebMethod(EnableSession = true)]
        public void GenerateProductTchSheetPdf(string prdIds)
        {
            if (!string.IsNullOrEmpty(prdIds))
            {
                Session["PdfTchShtPrdIds"] = prdIds;
            }
            else
            {
                Session["PdfTchShtPrdIds"] = null;
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public bool CheckProductRefExisted(string prdRef)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                returnvalue = ProductServices.CheckProductRefExisted(connectedUser.Soc_id, prdRef);
            }
            return returnvalue;
        }

        #region Driver and Accessory

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDriverAccessory(int status)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var prds = ProductServices.GetDriverAccessory(status, connectedUser.Soc_id);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDrvAcc(int prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var prds = ProductServices.GetDrvAcc(prdId, connectedUser.Soc_id);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateDrvAcc(string prdMainId, int prdRefId, int pitRefId, int type, decimal price)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var prdId = IntTryParse(prdMainId, "prdId");
                var prds = ProductServices.CreateUpdateDrvAcc(prdId, prdRefId, pitRefId, type, price);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteDrvAcc(string prdMainId, int pitRefId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var prdId = IntTryParse(prdMainId, "prdId");
                ProductServices.DeleteDrvAcc(prdId, pitRefId);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductDrvAcc(string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var prd_id = IntTryParse(prdId, "prdId");
                var prds = ProductServices.GetProductDrvAcc(prd_id, connectedUser.Soc_id);
                returnvalue = Serialize(prds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Driver and Accessory

        #endregion Product

        #region Contact Client

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadContactClientsByCliId(string cliId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cli_id != 0)
                {
                    var values = ContactClientServices.LoadContactClientsByCliId(cli_id);
                    returnvalue = Serialize(values);
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
        public string LoadContactClientByCcoId(string ccoId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int cco_id = 0;
                try
                {
                    var strccoId = StringCipher.DecoderSimple(ccoId.UrlDecode2String(), "ccoId");
                    cco_id = Convert.ToInt32(strccoId);
                }
                catch (Exception)
                {
                }
                if (cco_id != 0)
                {
                    var values = ContactClientServices.LoadContactClientByCcoId(cco_id);
                    returnvalue = Serialize(values);
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
        public string CreateCcoFromExcel(List<ContactClient> CcoList)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                try
                {
                    var strccoId = StringCipher.DecoderSimple(CcoList.FirstOrDefault().FCliId, "cliId");
                    cli_id = Convert.ToInt32(strccoId);
                    CcoList.ForEach(l =>
                    {
                        l.CliId = cli_id;
                        l.SocId = connectedUser.Soc_id;
                        l.UsrCreatedBy = connectedUser.Id;
                    });
                }
                catch (Exception)
                {
                }
                if (cli_id != 0 && CcoList.Any())
                {
                    ContactClientServices.CreateCcoFromExcel(CcoList);
                    returnvalue = Serialize("1");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Contact Client

        #region Project

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadProjectById(string prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prj_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(prjId.UrlDecode2String(), "prjId");
                    prj_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (prj_id != 0)
                {
                    var values = ProjectServices.LoadProjectById(prj_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string LoadProjectByIdWithRight(string prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prj_id = IntTryParse(prjId, "prjId");
                //try
                //{
                //    var strcliId = StringCipher.DecoderSimple(prjId.UrlDecode2String(), "prjId");
                //    prj_id = Convert.ToInt32(strcliId);
                //}
                //catch (Exception)
                //{
                //}
                if (prj_id != 0)
                {
                    var values = ProjectServices.LoadProjectById(prj_id, connectedUser.Soc_id, connectedUser.Id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteProject(string prjId)
        {
            var returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prj_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(prjId.UrlDecode2String(), "prjId");
                    prj_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (prj_id != 0)
                {
                    returnvalue = ProjectServices.DeleteProject(prj_id, connectedUser.Soc_id);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchProject(string prjName, string prjCode, string clientName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = ProjectServices.SearchProject(connectedUser.Soc_id,
                        prjName.StringTrimSetEmptyIfNull(),
                        prjCode.StringTrimSetEmptyIfNull(),
                        clientName.StringTrimSetEmptyIfNull(),
                        connectedUser.Id);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
                }

            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Project

        #region Album

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllAlbum()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = AlbumServices.GetAllAlbum(connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string GetImagesInAlbum(string albId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    int alb_id = 0;
                    try
                    {
                        var strcliId = StringCipher.DecoderSimple(albId.UrlDecode2String(), "");
                        alb_id = Convert.ToInt32(strcliId);
                    }
                    catch (Exception)
                    {
                    }

                    var values = AlbumServices.GetImagesInAlbum(alb_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string DeleteOnePhoto(int albId, int palId)
        {
            User connectedUser;
            string returnvalue = string.Empty;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    AlbumServices.DeletePhoto(albId, palId, connectedUser.Soc_id);
                    //var values = AlbumServices.GetImagesInAlbum(albId, connectedUser.Soc_id);
                    returnvalue = Serialize(1);
                }
                catch (Exception)
                {
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteAlbum(int albId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    AlbumServices.DeleteAlbum(albId, connectedUser.Soc_id);
                }
                catch (Exception)
                {
                }
            }
        }

        #endregion Album

        #region Supplier

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public int CheckSupplierExisted(string companyName, string supId)
        {
            int returnvalue = 1;
            User connectedUser;
            int sup_id = 0;
            try
            {
                var strcliId = StringCipher.DecoderSimple(supId.UrlDecode2String(), "supId");
                sup_id = Convert.ToInt32(strcliId);
            }
            catch (Exception)
            {
            }
            if (CheckAuthentication(out connectedUser))
            {
                returnvalue = SupplierServices.CheckSupplierExisted(connectedUser.Soc_id, sup_id, companyName);
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSupplierById(string supId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int sup_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(supId.UrlDecode2String(), "supId");
                    sup_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (sup_id != 0)
                {
                    var values = SupplierServices.LoadSupplierById(sup_id);
                    returnvalue = Serialize(values);
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
        public string GetAllSuppliers()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SupplierServices.GetAllSupplier(connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllTransporter()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SupplierServices.GetAllSupplier(connectedUser.Soc_id, 2);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteSupplierContact(int scoId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                returnvalue = SupplierContactServices.DeleteSupplierContact(scoId, connectedUser.Soc_id);
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierType()
        {
            string returnvalue;
            if (CheckAuthentication())
            {
                var values = SupplierServices.GetSupplierType();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierByKeyword(string keyword)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SupplierServices.GetSupplierByKeyword(connectedUser.Soc_id, keyword);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public bool DeleteSupplier(string supId)
        {
            bool deleted = false;
            User connecteduser;
            if (CheckAuthentication(out connecteduser))
            {
                int sup_id = IntTryParse(supId, "supId");
                if (sup_id != 0)
                {
                    deleted = SupplierServices.DeleteSupplier(connecteduser.Soc_id, sup_id);
                }
            }
            return deleted;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateGetSupLogin(string supId, int mode)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sup_id = IntTryParse(supId, "supId");
                if (sup_id != 0)
                {
                    if (mode == 0)
                    {
                        // create login
                        var values = SupplierServices.CreateSupLogin(connectedUser.Soc_id, sup_id);
                        returnvalue = Serialize(values);
                    }
                    else
                    {
                        // mode == 1 get password
                        var values = SupplierServices.GetSupPwd(connectedUser.Soc_id, sup_id);
                        returnvalue = Serialize(values);
                    }
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Supplier

        #region Supplier Contact

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSupplierContactBySupId(string supId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int sup_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(supId.UrlDecode2String(), "supId");
                    sup_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (sup_id != 0)
                {
                    var values = SupplierContactServices.LoadSupplierContactsBySupId(sup_id);
                    returnvalue = Serialize(values);
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
        public string LoadSupplierContactByScoId(string scoId)
        {
            string returnvalue = string.Empty;
            if (CheckAuthentication())
            {
                int sco_id = 0;
                try
                {
                    var strccoId = StringCipher.DecoderSimple(scoId.UrlDecode2String(), "scoId");
                    sco_id = Convert.ToInt32(strccoId);
                }
                catch (Exception)
                {
                }
                if (sco_id != 0)
                {
                    var values = SupplierContactServices.LoadSupplierContactByScoId(sco_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Supplier Contact

        #region Supplier Product

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SerachSupplierProduct(string companyName, string reference)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SupplierProductServices.SerachSupplierProduct(connectedUser.Soc_id, companyName.StringTrimSetEmptyIfNull(), reference.StringTrimSetEmptyIfNull());
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductsBySupId(string supId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strid = StringCipher.DecoderSimple(supId.UrlDecode2String(), "supId");
                    int.TryParse(strid, out _id);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    var values = SupplierProductServices.GetProductsBySupId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public void DeleteSupplierProduct(string supId, string sprId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sup_id = IntTryParse(supId, "supId");
                int spr_id = IntTryParse(sprId, "sprId");
                SupplierProductServices.DeleteSupplierProduct(connectedUser.Soc_id, sup_id, spr_id);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierProduct(int supId, string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _prdid = IntTryParse(prdId, "prdId");
                if (_prdid != 0)
                {
                    var values = SupplierProductServices.GetSupplierProduct(connectedUser.Soc_id, supId, _prdid);
                    returnvalue = Serialize(values);
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
        public string GetSupplierByProductId(string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _prdid = IntTryParse(prdId, "prdId");
                if (_prdid != 0)
                {
                    var values = SupplierProductServices.GetSupplierByProductId(connectedUser.Soc_id, _prdid);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Supplier Product

        #region Cost Plan

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientProjects(string cliId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cli_id != 0)
                {
                    var values = ClientServices.GetClientProjects(cli_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string LoadCostPlan(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    var values = CostPlanServices.LoadCostPlanById(cpl_id, connectedUser.Soc_id, connectedUser.Id, false, connectedUser.LoginMode);
                    if (values != null)
                    {
                        values.LoginMode = connectedUser.LoginMode;
                    }
                    returnvalue = Serialize(values);
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
        public string SearchCostPlan(string prjName, string prjCode, string clientName, string CplName,
            string CplCode, string CcoName, string flag, int cstId, string comment, string dateFrom, string dateTo, string keyword, bool fromsite, bool isKeyprj)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = CostPlanServices.SearchCostPlans(connectedUser.Soc_id,
                        CplName.StringTrimSetEmptyIfNull(),
                        CplCode.StringTrimSetEmptyIfNull(),
                        clientName.StringTrimSetEmptyIfNull(),
                        CcoName.StringTrimSetEmptyIfNull(),
                        prjCode.StringTrimSetEmptyIfNull(),
                        prjName.StringTrimSetEmptyIfNull(),
                        connectedUser.Id,
                        cstId,
                        connectedUser.SuperRight,
                        connectedUser.LoginMode,
                        flag.StringTrimSetEmptyIfNull(),
                        comment.StringTrimSetEmptyIfNull(),
                        dateFrom,
                        dateTo,
                        keyword,
                        fromsite, isKeyprj);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string GetCostPlanInfo(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    var values = CostPlanLineServices.GetCostPlanInfo(connectedUser.Soc_id, cpl_id);
                    returnvalue = Serialize(values);
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
        public string AddUpdateDiscount(string cplId, decimal discountPercentage, decimal discountAmount)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    CostPlanServices.AddUpdateDiscount(connectedUser.Soc_id, cpl_id, discountPercentage, discountAmount);
                    returnvalue = Serialize(1);
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
        public string DuplicateCostPlan(string cplId, bool sameProject)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    var id = CostPlanServices.DuplicateCostPlan(connectedUser.Soc_id, cpl_id, connectedUser.Id, sameProject);
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "cplId");
                    returnvalue = Serialize(returnvalue);
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
        public string PassCostPlan2ClientOrder(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    var id = CostPlanServices.PassCostPlan2ClientOrder(cpl_id, connectedUser.Soc_id);
                    if (id != 0)
                    {
                        returnvalue = StringCipher.EncoderSimple(id.ToString(), "codId");
                        returnvalue = Serialize(returnvalue);
                    }
                    else
                    {
                        returnvalue = Serialize(0);
                    }
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
        public int DeleteCostPlan(string cplId)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    return CostPlanServices.DeleteCostPlan(connectedUser.Soc_id, cpl_id);
                }
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;

        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCostPlansByProjectId(string prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(prjId.UrlDecode2String(), "prjId");
                    _id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    var values = CostPlanServices.GetCostPlansByProjectId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
                }
                else
                {
                    returnvalue = Serialize("");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void ChangeCostPlanStatus(List<string> cplIds, int cstId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cpl_ids = cplIds.Select(m => Convert.ToInt32(StringCipher.DecoderSimple(m.UrlDecode2String(), "cplId"))).ToList();
                CostPlanServices.ChangeCostplanStatus(connectedUser.Soc_id, cpl_ids, cstId);
            }
        }

        [WebMethod]
        public void UpdateCostPlanCommercial(string cplId, int com1, int com2, int com3)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = IntTryParse(cplId, "cplId");
                if (cpl_id != 0)
                {
                    CostPlanServices.ChangeCommercial(connectedUser.Soc_id, connectedUser.Id, cpl_id, com1, com2, com3);
                }
            }
        }

        [WebMethod(EnableSession = true)]
        public void GenerateCostPlanPdf(string cplIds)
        {
            if (!string.IsNullOrEmpty(cplIds))
            {
                Session["PdfCplIds"] = cplIds;
            }
            else
            {
                Session["PdfCplIds"] = null;
            }
        }


        #endregion Cost Plan

        #region Client Order

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientCostPlanInProgress(string cliId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cli_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cliId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cli_id != 0)
                {
                    var values = ClientServices.GetClientCostPlanInProgress(cli_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string LoadClientOrder(string codId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = IntTryParse(codId, "codId");
                if (cod_id != 0)
                {
                    var values = ClientOrderServices.LoadClientOrderById(cod_id, connectedUser.Soc_id, connectedUser.Id);
                    returnvalue = Serialize(values);
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
        public string GetClientOrderInfo(string codId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    cod_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    var values = ClientOrderLineServices.GetClientOrderInfo(connectedUser.Soc_id, cod_id);
                    returnvalue = Serialize(values);
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
        public string AddUpdateClientOrderDiscount(string codId, decimal discountPercentage, decimal discountAmount)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    cod_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    ClientOrderServices.AddUpdateDiscount(connectedUser.Soc_id, cod_id, discountPercentage, discountAmount);
                    returnvalue = Serialize(1);
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
        public string SearchClientOrder(ClientOrder oneCod)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    oneCod.SocId = connectedUser.Soc_id;
                    oneCod.UsrCreatorId = connectedUser.Id;
                    var values = ClientOrderServices.SearchClientOrders(oneCod);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string DuplicateClientOrder2CostPlan(string codId, bool sameProject)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    cod_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    var id = ClientOrderServices.DuplicateClientOrderToCostPlan(connectedUser.Soc_id, cod_id, connectedUser.Id, sameProject);
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "cplId");
                    returnvalue = Serialize(returnvalue);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteClientOrderFile(string codId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    cod_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    ClientOrderServices.UpdateClientOrderFile(connectedUser.Soc_id, cod_id, null);

                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientOrderByCplId(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    _id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    var values = ClientOrderServices.GetClientOrderByCplId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
                }
                else
                {
                    returnvalue = Serialize("");
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
        public string GetClientOrderByPrjId(string prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(prjId, "prjId");
                if (_id != 0)
                {
                    var values = ClientOrderServices.GetClientOrderByPrjId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public int CheckClientOrderLineNotCompleteDeliveried(string codId)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = IntTryParse(codId, "codId");
                if (cod_id != 0)
                {
                    var values = ClientOrderServices.CheckClientOrderLineNotCompleteDeliveried(connectedUser.Soc_id, cod_id);
                    returnvalue = values;
                }
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        #endregion Client Order

        #region Cost Plan Line

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertUpdateCln(CostPlanLine oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prdId = 0;
                int pitId = 0;
                int cplId = 0;
                try
                {
                    var strprdid = StringCipher.DecoderSimple(oneLine.PrdFId.UrlDecode2String(), "prdId");
                    int.TryParse(strprdid, out prdId);
                    var strpitid = StringCipher.DecoderSimple(oneLine.PitFId.UrlDecode2String(), "pitId");
                    int.TryParse(strpitid, out pitId);
                    var strcplid = StringCipher.DecoderSimple(oneLine.CplFId.UrlDecode2String(), "cplId");
                    int.TryParse(strcplid, out cplId);
                    oneLine.PrdId = prdId;
                    oneLine.PitId = pitId;
                    oneLine.CplId = cplId;
                }
                catch (Exception)
                {
                }
                if (cplId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = CostPlanLineServices.InsertUpdateCln(oneLine);
                    returnvalue = Serialize(values);
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
        public void InsertUpdateClns(List<CostPlanLine> clns)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                clns.ForEach(m =>
                {
                    m.PrdId2 = IntTryParse(m.PrdFId, "prdId");
                    m.CplId = IntTryParse(m.CplFId, "cplId");
                    m.SocId = connectedUser.Soc_id;
                });
                CostPlanLineServices.InserUpdateClns(clns);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllCostPlanLines(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    int.TryParse(strcplid, out cpl_id);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    var values = CostPlanLineServices.GetClnsByCplId(connectedUser.Soc_id, cpl_id);
                    returnvalue = Serialize(values);
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
        public string DeleteCostPlanLine(string cplId, int clnId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    int.TryParse(strcplid, out cpl_id);
                }
                catch (Exception)
                {
                }
                if (cpl_id != 0)
                {
                    CostPlanLineServices.DeleteCln(connectedUser.Soc_id, cpl_id, clnId);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteClientInvoiceFile(string cinId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    _id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    ClientInvoiceServices.UpdateClientInvoiceFile(connectedUser.Soc_id, _id, null);

                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddUpdateClientInvoiceDiscount(string cinId, decimal discountPercentage, decimal discountAmount)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    _id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    ClientInvoiceServices.AddUpdateDiscount(connectedUser.Soc_id, _id, discountPercentage, discountAmount);
                    returnvalue = Serialize(1);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DuplicateCln(string cplId, int clnId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cpl_id = IntTryParse(cplId, "cplId");
                if (cpl_id != 0)
                {
                    CostPlanLineServices.DuplicateCln(cpl_id, clnId);
                }
            }
        }

        #endregion Cost Plan Line

        #region Client Order Line

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertUpdateCol(ClientOrderLine oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prdId = 0;
                int pitId = 0;
                int codId = 0;
                try
                {
                    var strprdid = StringCipher.DecoderSimple(oneLine.PrdFId.UrlDecode2String(), "prdId");
                    int.TryParse(strprdid, out prdId);
                    var strpitid = StringCipher.DecoderSimple(oneLine.PitFId.UrlDecode2String(), "pitId");
                    int.TryParse(strpitid, out pitId);
                    var strcplid = StringCipher.DecoderSimple(oneLine.CodFId.UrlDecode2String(), "codId");
                    int.TryParse(strcplid, out codId);
                    oneLine.PrdId = prdId;
                    oneLine.PitId = pitId;
                    oneLine.CodId = codId;
                }
                catch (Exception)
                {
                }
                if (codId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = ClientOrderLineServices.InsertUpdateCol(oneLine);
                    returnvalue = Serialize(values);
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
        public string GetAllClientOrderLines(string codId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    int.TryParse(strcplid, out cod_id);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    var values = ClientOrderLineServices.GetColsByCodId(connectedUser.Soc_id, cod_id);
                    returnvalue = Serialize(values);
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
        public string DeleteClientOrderLine(string codId, int colId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    int.TryParse(strcplid, out cod_id);
                }
                catch (Exception)
                {
                }
                if (cod_id != 0)
                {
                    var value = ClientOrderLineServices.DeleteCol(connectedUser.Soc_id, cod_id, colId);
                    if (value)
                    {
                        returnvalue = Serialize("1");
                    }
                    else
                    {
                        returnvalue = Serialize("0");
                    }
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public void InsertUpdateCols(List<ClientOrderLine> cols)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                cols.ForEach(m =>
                {
                    m.PrdId2 = IntTryParse(m.PrdFId, "prdId");
                    m.CodId = IntTryParse(m.CodFId, "codId");
                    m.SocId = connectedUser.Soc_id;
                });
                ClientOrderLineServices.InsertUpdateCols(cols);
            }
        }

        #endregion Client Order Line

        #region Delivery Form

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientWithClientOrderLineNoDeliveried()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var clientorders = DeliveryFormServices.GetClientWithClientOrderLineNoDeliveried(connectedUser.Soc_id, connectedUser.Id, connectedUser.SuperRight);
                returnvalue = Serialize(clientorders);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadDeliveryForm(string dfoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
                    int.TryParse(strcplid, out dfo_id);
                }
                catch (Exception)
                {
                }
                if (dfo_id != 0)
                {
                    var values = DeliveryFormServices.LoadDeliveryFormById(dfo_id, connectedUser.Soc_id, connectedUser.Id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteDeliveryFormFile(string dfoId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
                    dfo_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (dfo_id != 0)
                {
                    DeliveryFormServices.UpdateDeliveryFormFile(connectedUser.Soc_id, dfo_id, null);

                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchDeliveryForms(DeliveryForm oneDfo)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    oneDfo.SocId = connectedUser.Soc_id;
                    oneDfo.UsrCreatorId = connectedUser.Id;
                    var values = DeliveryFormServices.SearchDeliveryForms(oneDfo);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string GetDeliveryNoDeliveried()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = DeliveryFormServices.GetDeliveryNoDeliveried(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDeliveryNoInvoice()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = DeliveryFormServices.GetDeliveryNoInvoice(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteDeliveryForm(string dfoId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var _dfoid = IntTryParse(dfoId, "dfoId");

                if (_dfoid != 0)
                {
                    var values = DeliveryFormServices.DeleteDeliveryForm(_dfoid, connectedUser.Soc_id);
                    returnvalue = values;
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDeliveryByCodId(string codId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(codId, "codId");
                if (_id != 0)
                {
                    var values = DeliveryFormServices.GetDeliveryByCodId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string GetProductWithShelves(string dfoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    var values = WarehouseService.GetProductWithShelves(connectedUser.Soc_id, dfo_id);
                    returnvalue = Serialize(values);
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
        public string GetDeliveryFormsForCin(string dfoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    var values = DeliveryFormServices.GetDeliveryFormsForCin(dfo_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
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
        public string CreateCinForDfoSelected(List<int> dfoIds, string dCreate, int bacId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var dcreate = GetDateTimeOrNow(dCreate, true);
                var values = DeliveryFormServices.CreateCinForDfoSelected(dfoIds, connectedUser.Soc_id, connectedUser.Soc_id, dcreate, bacId);
                if (values != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(values.ToString(), "cinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize(0);
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
        public string CreateCinForDfoSelectedWithDifDfo(List<int> dfoIds, string dCreate, int mode, int bacId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var dcreate = GetDateTimeOrNow(dCreate, true);
                var values = DeliveryFormServices.CreateCinForDfoSelectedWithDifDfo(dfoIds, connectedUser.Soc_id, connectedUser.Soc_id, dcreate, mode, bacId);
                if (values != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(values.ToString(), "cinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize(0);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Delivery Form

        #region Devliery Form Line

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientOrderLinesForDelivery(string dfoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    var values = DeliveryFormServices.GetClientOrderLinesForDelivery(connectedUser.Soc_id, dfo_id);
                    returnvalue = Serialize(values);
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
        public string InsertUpdateDfl(DeliveryFormLine oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfoId = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(oneLine.DfoFId.UrlDecode2String(), "dfoId");
                    int.TryParse(strcplid, out dfoId);
                    oneLine.DfoId = dfoId;
                }
                catch (Exception)
                {
                }
                if (dfoId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = DeliveryFormLineServices.InsertUpdateDfl(oneLine);
                    returnvalue = Serialize(values);
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
        public string InsertUpdateAllDfl(List<DeliveryFormLine> dfls)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (dfls != null && dfls.Any())
                {
                    int dfoId = IntTryParse(dfls.FirstOrDefault().DfoFId, "dfoId");
                    if (dfoId != 0)
                    {
                        dfls.ForEach(m =>
                        {
                            m.DfoId = dfoId;
                            m.SocId = connectedUser.Soc_id;
                        });
                        var values = DeliveryFormLineServices.InsertUpdateAllDfl(dfls);
                        returnvalue = Serialize(values);
                    }
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
        public string LoadDflByDfoId(string dfoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    var values = DeliveryFormLineServices.GetDflsByDfoId(connectedUser.Soc_id, dfo_id);
                    returnvalue = Serialize(values);
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
        public int DeleteDfl(string dfoId, int dflId)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
                    int.TryParse(strcplid, out dfo_id);
                }
                catch (Exception)
                {
                }
                if (dfo_id != 0)
                {
                    returnvalue = DeliveryFormLineServices.DeleteDfl(connectedUser.Soc_id, dfo_id, dflId) ? 1 : 0;
                }
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        // 不再使用
        //[WebMethod]
        //public void DeliveryDfo(string dfoId)
        //{
        //    User connectedUser;
        //    if (CheckAuthentication(out connectedUser))
        //    {
        //        int dfo_id = 0;
        //        try
        //        {
        //            var strcplid = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
        //            int.TryParse(strcplid, out dfo_id);
        //        }
        //        catch (Exception)
        //        {
        //        }
        //        if (dfo_id != 0)
        //        {
        //            DeliveryFormServices.DeliveryDfo(dfo_id, connectedUser.Soc_id, connectedUser.Id);
        //        }
        //    }
        //}

        [WebMethod]
        public void DeliveryDfoWithDfls(string dfoId, List<DeliveryFormLine> dfls)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    DeliveryFormServices.DeliveryDfoWithStockage(dfo_id, connectedUser.Soc_id, connectedUser.Id, dfls);
                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateClientInvoiceAndDeliveryDfoWithDfls(string dfoId, List<DeliveryFormLine> dfls)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                if (dfo_id != 0)
                {
                    DeliveryFormServices.DeliveryDfoWithStockage(dfo_id, connectedUser.Soc_id, connectedUser.Id, dfls);
                }
                var id = DeliveryFormServices.CreateClientInvoiceByDeliveryForm(dfo_id, connectedUser.Soc_id, connectedUser.Id);
                if (id != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "cinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize(0);
                }
            }
            return returnvalue;
        }

        /// <summary>
        /// 2018-04-05 建Client invoice 并让所有client order 相关的 dfo 全部deliveried
        /// </summary>
        /// <param name="dfoId"></param>
        /// <param name="mode">0: normal; 1: date like delivery form</param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateClientInvoiceAndDeliveryAllDfos(string dfoId, int mode)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int dfo_id = IntTryParse(dfoId, "dfoId");
                // todo : 不进行库存操作

                var id = DeliveryFormServices.CreateCinForCod(dfo_id, connectedUser.Soc_id, connectedUser.Id, mode);
                if (id != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "cinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize(0);
                }
            }
            return returnvalue;
        }



        #endregion Devliery Form Line

        #region Client Invoice

        // 20200115 不再使用
        //[WebMethod]
        //[ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        //public string CreateClientInvoiceByDeliveryForm(string dfoId)
        //{
        //    string returnvalue = string.Empty;
        //    User connectedUser;
        //    if (CheckAuthentication(out connectedUser))
        //    {
        //        int dfo_id = 0;
        //        try
        //        {
        //            var strcliId = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
        //            dfo_id = Convert.ToInt32(strcliId);
        //        }
        //        catch (Exception)
        //        {
        //        }
        //        if (dfo_id != 0)
        //        {
        //            var id = DeliveryFormServices.CreateClientInvoiceByDeliveryForm(dfo_id, connectedUser.Soc_id, connectedUser.Id);
        //            if (id != 0)
        //            {
        //                returnvalue = StringCipher.EncoderSimple(id.ToString(), "cinId");
        //                returnvalue = Serialize(returnvalue);
        //            }
        //            else
        //            {
        //                returnvalue = Serialize(0);
        //            }
        //        }
        //    }
        //    else
        //    {
        //        returnvalue = Serialize("-1");
        //    }
        //    return returnvalue;
        //}

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadClientInvoice(string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(cinId, "cinId");
                if (_id != 0)
                {
                    var values = ClientInvoiceServices.LoadClientInvoiceById(_id, connectedUser.Soc_id, connectedUser.Id);
                    if (values != null)
                    {
                        values.LoginMode = connectedUser.LoginMode;
                        values.SuperRight = connectedUser.SuperRight;
                    }
                    returnvalue = Serialize(values);
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
        public string GetCinForAvoir()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ClientInvoiceServices.GetCinForAvoir(connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        // 20200713 新功能，加快搜索Avoir速度
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCinForAvoirWithCinCode(string cincode, string cliFId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cliId = IntTryParse(cliFId, "cliId");
                var values = ClientInvoiceServices.GetCinForAvoir(connectedUser.Soc_id, cincode, cliId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchClientInvoices(ClientInvoice oneCin)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    oneCin.SocId = connectedUser.Soc_id;
                    oneCin.UsrCreatorId = connectedUser.Id;
                    var values = ClientInvoiceServices.SearchClientInvoices(oneCin);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
                }

            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public int CreateUpdateCinPayment(string cinId, string cpyId, decimal cpyAmount, string comment, string paymentcode)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cin_id = IntTryParse(cinId, "cinId");
                var cpy_id = IntTryParse(cpyId, "cpyId");
                returnvalue = ClientInvoiceServices.CreateUpdateCinPayment(connectedUser.Soc_id, cin_id, cpy_id, cpyAmount, null, comment, false, paymentcode);
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SaveCinPayments(List<KeyValue> cincpys)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var result = ClientInvoiceServices.CreateCinPaymentsWithOutFile(connectedUser.Soc_id, cincpys);
                returnvalue = Serialize(result);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteCinPaymentFile(string cinId, string cpyId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cin_id = IntTryParse(cinId, "cinId");
                var cpy_id = IntTryParse(cpyId, "cpyId");
                ClientInvoiceServices.CreateUpdateCinPayment(connectedUser.Soc_id, cin_id, cpy_id, 0, null, null, true);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCinPaymentInfo(string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cin_id = IntTryParse(cinId, "cinId");
                var values = ClientInvoiceServices.GetCinPaymentInfo(connectedUser.Soc_id, cin_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientInvoiceByPrjId(string prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(prjId, "prjId");
                if (_id != 0)
                {
                    var values = ClientInvoiceServices.GetClientInvoiceByPrjId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string GetClientInvoiceByCplId(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(cplId, "cplId");
                if (_id != 0)
                {
                    var values = ClientInvoiceServices.GetClientInvoiceByCplId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string GetClientInvoiceByCodId(string codId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(codId, "codId");
                if (_id != 0)
                {
                    var values = ClientInvoiceServices.GetClientInvoiceByCodId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public void SetCinInvoiced(string cinId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cin_id = IntTryParse(cinId, "cinId");
                ClientInvoiceServices.SetCinInvoiced(connectedUser.Soc_id, cin_id);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CinFullPaid(string cinId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cin_id = IntTryParse(cinId, "cinId");
                ClientInvoiceServices.CinFullPaid(connectedUser.Soc_id, cin_id);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientInvoiceStatmentByClient(int cliId, string month, string enddate, int comId, bool forCsv)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                DateTime selectmonth;
                if (!DateTime.TryParse(month, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out selectmonth))
                {
                    var today = DateTime.Today;
                    selectmonth = today.AddMonths(-1);
                }
                DateTime? endmonth = null;
                endmonth = GetDateTimeOrNow(enddate, true);

                var values = ClientInvoiceServices.GetClientInvoiceStatmentByClient(cliId, connectedUser.Id, connectedUser.Soc_id, selectmonth, endmonth, comId, forCsv);
                returnvalue = Serialize(values);

            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateSodFromCin(string cinId, string supId, decimal coef, string sodFId, string dCreate, string sodCode, int curId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                int sup_id = IntTryParse(supId, "supId");
                int sod_id = IntTryParse(sodFId, "sodId");
                var createdate = GetDateTimeOrNow(dCreate, true);
                sodCode = sodCode.Trim();
                var sodId = ClientInvoiceServices.CreateSodFromCin(connectedUser.Soc_id, cin_id, sup_id, connectedUser.Id, coef, sod_id, createdate, sodCode, curId);
                if (sodId != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(sodId.ToString(), "sodId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize("0");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 通过client invoice line 来建立sod
        /// </summary>
        /// <param name="cinId"></param>
        /// <param name="supId"></param>
        /// <param name="coef"></param>
        /// <param name="sodFId"></param>
        /// <param name="dCreate"></param>
        /// <param name="sodCode"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateSodFromCinCii(PurchaseBaseClass aSod)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(aSod.CinFId, "cinId");
                int sup_id = IntTryParse(aSod.SupFId, "supId");
                int sod_id = IntTryParse(aSod.SodFId, "sodId");
                var createdate = GetDateTimeOrNow(aSod._DateStartProduction, true); // 借用_DateStartProduction 做creation date
                var sodCode = aSod.SodCode.Trim();
                var coef = aSod.TotalAmountHt; // 借用 totalamountht 做 Coef
                var ciiList = aSod.CsoList.Select(l => l.Key).Distinct().ToList(); // 借用CsoList 给 ciilist 赋值
                var sodId = ClientInvoiceServices.CreateSodFromCinCii(connectedUser.Soc_id, cin_id, sup_id, connectedUser.Id, coef, sod_id, createdate, sodCode, ciiList);
                if (sodId != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(sodId.ToString(), "sodId");
                }
                else
                {
                    returnvalue = Serialize("0");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #region 通过Cin新建Dfo
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetDeliverFormsByKeywords(string keyword, string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                var dfos = DeliveryFormServices.GetDeliverFormsByKeywords(keyword, cin_id, connectedUser.Soc_id);
                returnvalue = Serialize(dfos);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateDfoFromCin(string cinId, int dfoIdExisted, List<KeyValue> ciiLines, DateTime createDate, DateTime deliveryDate, int ccoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                var dfoId = ClientInvoiceServices.CreateDfoFromCin(connectedUser.Soc_id, cin_id, connectedUser.Id, dfoIdExisted, ciiLines, createDate, deliveryDate, ccoId);
                if (dfoId != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(dfoId.ToString(), "dfoId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string GetCiisByCinIdForDfo(string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                var ciis = ClientInvoiceLineServices.GetCiisByCinIdForDfo(connectedUser.Soc_id, cin_id);
                returnvalue = Serialize(ciis);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }
        #endregion 通过Cin新建Dfo


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCinSodPaymentInfo(string dFrom, string dTo, int cliId, int supId, bool byCin, string code)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                DateTime createDateFrom = GetDateTime1900(dFrom);
                DateTime createDateTo = GetDateTime2500(dTo);
                code = string.IsNullOrEmpty(code) ? code : code.Trim();
                if (byCin)
                {
                    var values = ClientInvoiceServices.GetCinWithSodWithPaymentResults(connectedUser.Soc_id, cliId, createDateFrom, createDateTo, connectedUser.Id, code);
                    returnvalue = Serialize(values);
                }
                else
                {
                    var values = PurchaseBaseServices.GetSodWithCinWithPaymentResults(connectedUser.Soc_id, supId, cliId, createDateFrom, createDateTo, connectedUser.Id, code);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Client Invoice

        #region Client Invoice Lines

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllClientInvoiceLines(string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    int.TryParse(strcplid, out _id);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    var values = ClientInvoiceLineServices.GetCiisByCinId(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string InsertUpdateCii(ClientInvoiceLine oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prdId = 0;
                int pitId = 0;
                int cinId = 0;
                try
                {
                    var strprdid = StringCipher.DecoderSimple(oneLine.PrdFId.UrlDecode2String(), "prdId");
                    int.TryParse(strprdid, out prdId);
                    var strpitid = StringCipher.DecoderSimple(oneLine.PitFId.UrlDecode2String(), "pitId");
                    int.TryParse(strpitid, out pitId);
                    var strcplid = StringCipher.DecoderSimple(oneLine.CinFId.UrlDecode2String(), "cinId");
                    int.TryParse(strcplid, out cinId);
                    oneLine.PrdId = prdId;
                    oneLine.PitId = pitId;
                    oneLine.CinId = cinId;
                }
                catch (Exception)
                {
                }
                if (cinId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = ClientInvoiceLineServices.InsertUpdateCii(oneLine);
                    returnvalue = Serialize(values);
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
        public string DeleteClientInvoiceLine(string cinId, int ciiId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = 0;
                try
                {
                    var strcplid = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    int.TryParse(strcplid, out cin_id);
                }
                catch (Exception)
                {
                }
                if (cin_id != 0)
                {
                    ClientInvoiceLineServices.DeleteCii(connectedUser.Soc_id, cin_id, ciiId);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientInvoiceInfo(string cinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    _id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    var values = ClientInvoiceLineServices.GetClinetInvoiceInfo(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public void InsertUpdateCiis(List<ClientInvoiceLine> ciis)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                ciis.ForEach(m =>
                {
                    m.PrdId2 = IntTryParse(m.PrdFId, "prdId");
                    m.CinId = IntTryParse(m.CinFId, "cinId");
                    m.SocId = connectedUser.Soc_id;
                });
                ClientInvoiceLineServices.InsertupdateCiis(ciis);
            }
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string ChangeCiiPosition(string cinId, int ciiId, int updown)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                var value = ClientInvoiceLineServices.ChangeCiiPosition(cin_id, ciiId, updown, connectedUser.Soc_id);
                try
                {
                    returnvalue = Serialize(value);
                }
                catch (Exception)
                {
                    returnvalue = Serialize("0");
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
        public string MergeCiiLines(int cinId, List<int> ciiIds)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                ClientInvoiceLineServices.MergeCiiLines(connectedUser.Soc_id, cinId, ciiIds);
                returnvalue = Serialize("0");
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Client Invoice Lines

        #region Purchase Intent

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadPin(string itemId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int id = IntTryParse(itemId, "pinId");
                if (id != 0)
                {
                    var values = PurchaseBaseServices.LoadPurchaseIntent(connectedUser.Soc_id, id);
                    returnvalue = Serialize(values);
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
        public string InsertUpdatePil(PurchaseLineBaseClass oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                oneLine.PinId = IntTryParse(oneLine.PinFId, "pinId");
                oneLine.PrdId = IntTryParse(oneLine.PrdFId, "prdId");
                oneLine.PitId = IntTryParse(oneLine.PitFId, "pitId");
                oneLine.SocId = connectedUser.Soc_id;
                if (oneLine.PinId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = PurchaseBaseLineServices.InsertUpdatePil(oneLine);
                    returnvalue = Serialize(values);
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
        public string LoadPils(string pinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(pinId, "pinId");
                if (_pinId != 0)
                {
                    var values = PurchaseBaseLineServices.LoadPils(connectedUser.Soc_id, _pinId);
                    returnvalue = Serialize(values);
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
        public string DeletePil(string pinId, int pilId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(pinId, "pinId");
                if (_pinId != 0)
                {
                    PurchaseBaseLineServices.DeletePil(connectedUser.Soc_id, _pinId, pilId);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchPurchaseIntent(string pinName, string pinCode, string featureCode)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var pin = new PurchaseBaseClass
                {
                    SocId = connectedUser.Soc_id,
                    PinName = pinName,
                    PinCode = pinCode,
                    FeatureCode = featureCode
                };
                var value = PurchaseBaseServices.SearchPurchaseIntent(pin);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string PassPin2Sod(string pinId, string supId, int scoId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(pinId, "pinId");
                int _supId = IntTryParse(supId, "supId");
                if (_pinId != 0 && _supId != 0)
                {
                    var value = PurchaseBaseServices.PassPin2Sod(connectedUser.Soc_id, _pinId, _supId, scoId, connectedUser.Id);
                    returnvalue = StringCipher.EncoderSimple(value.ToString(), "sodId");
                    returnvalue = Serialize(returnvalue);
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
        public int PassPin2Sod_New(string pinId)
        {
            var returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(pinId, "pinId");
                if (_pinId != 0)
                {
                    var value = PurchaseBaseServices.PassPin2Sod_New(connectedUser.Soc_id, _pinId, connectedUser.Id);
                    returnvalue = value.Count;
                }
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPinSods(string pinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int pin_id = IntTryParse(pinId, "pinId");
                if (pin_id != 0)
                {
                    var values = PurchaseBaseServices.GetPinSods(pin_id, connectedUser.Soc_id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeletePin(string pinId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(pinId, "pinId");
                if (_pinId != 0)
                {
                    var value = PurchaseBaseServices.DeletePin(connectedUser.Soc_id, _pinId);
                    returnvalue = value;
                }
            }
            return returnvalue;
        }

        [WebMethod]
        public int CreatePinByLine(int qty, string cmt, string featureCode, int clnId, int colId, int ciiId)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = PurchaseBaseServices.CreatePinByLine(connectedUser.Id, connectedUser.Soc_id, qty, cmt, featureCode, clnId, colId, ciiId);
                returnvalue = value;
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DuplicatePil(string pinId, int pilId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int pin_id = IntTryParse(pinId, "pinId");
                var value = PurchaseBaseServices.DuplicatePurchaseIntentLine(connectedUser.Soc_id, pin_id, pilId);
                returnvalue = value != 0;
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPurchaseIntentLines(string pinName, string pinCode, string featureCode)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var pin = new PurchaseBaseClass
                {
                    SocId = connectedUser.Soc_id,
                    PinName = pinName,
                    PinCode = pinCode,
                    FeatureCode = featureCode
                };
                var value = PurchaseBaseServices.GetPurchaseIntentLines(pin);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertPilsByExcelLines(List<PurchaseLineBaseClass> lines)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var oneline = lines.FirstOrDefault();
                if (oneline != null)
                {
                    int pinid = IntTryParse(oneline.PinFId, "pinId");
                    if (pinid != 0)
                    {
                        PurchaseBaseLineServices.InsertPilsByExcelLines(connectedUser.Soc_id, pinid, lines);
                        returnvalue = Serialize("1");
                    }
                    else
                    {
                        returnvalue = Serialize("0");
                    }
                }
                else
                {
                    returnvalue = Serialize("0");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;

        }

        #endregion Purchase Intent

        #region Supplier Order

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSod(string itemId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int id = IntTryParse(itemId, "sodId");
                if (id != 0)
                {
                    var values = PurchaseBaseServices.LoadSupplierOrder(connectedUser.Soc_id, id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteSodFile(string sodId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                try
                {
                    _id = IntTryParse(sodId, "sodId");
                }
                catch (Exception)
                {
                }
                if (_id != 0)
                {
                    PurchaseBaseServices.UpdateSodFile(connectedUser.Soc_id, _id, null);
                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchSupplierOrder(PurchaseBaseClass sod)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                DateTime createDateFrom = GetDateTime1900(sod._DateStartProduction);
                //if (!DateTime.TryParse(sod._DateStartProduction, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
                //{
                //    createDateFrom = new DateTime(1900, 1, 1);
                //}

                DateTime createDateTo = GetDateTime2500(sod._DateCompleteProduction);
                //if (!DateTime.TryParse(sod._DateCompleteProduction, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
                //{
                //    createDateTo = new DateTime(2500, 12, 31);
                //}
                sod.DateCreation = createDateFrom;
                sod.DateUpdate = createDateTo;
                sod.SocId = connectedUser.Soc_id;
                var values = PurchaseBaseServices.SearchSupplierOrder(sod);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DeleteSod(string sodId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _pinId = IntTryParse(sodId, "sodId");
                if (_pinId != 0)
                {
                    var value = PurchaseBaseServices.DeleteSod(connectedUser.Soc_id, _pinId);
                    string guests;
                    CalendarServices.AddUpdateNotfForSod(_pinId, connectedUser.Id, out guests);
                    returnvalue = value;
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string PassSod2Sin(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                var id = PurchaseBaseServices.PassSod2Sin(connectedUser.Soc_id, sod_id, connectedUser.Id);
                if (id != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "sinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string CreateSodByPils(string pinId, int supId, string sodName, int sodId, List<int> pilIds)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int pin_id = IntTryParse(pinId, "pinId");
                var id = PurchaseBaseServices.CreateSodByPils(connectedUser.Soc_id, supId, pin_id, sodId, pilIds, sodName, connectedUser.Id);
                if (id != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(id.ToString(), "sodId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string CreateCinFromSod(string sodId, string cliId, string cinBank, decimal coef, string cinFId, string dCreate, string cinCode, string commisionText, decimal coefCom, bool withCom, int curId, string cinName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                int cli_id = IntTryParse(cliId, "cliId");
                int cin_id = IntTryParse(cinFId, "cinId");
                int cinbank;
                if (!int.TryParse(cinBank, out cinbank))
                {
                    cinbank = 1;
                }
                var createdate = GetDateTimeOrNow(dCreate, true);
                cinCode = cinCode.Trim();
                var cinId = PurchaseBaseServices.CreateCinFromSod(connectedUser.Soc_id, sod_id, cli_id, connectedUser.Id, cinbank, coef, cin_id, createdate, cinCode, commisionText, coefCom, withCom, curId, cinName);
                if (cinId != 0)
                {
                    returnvalue = StringCipher.EncoderSimple(cinId.ToString(), "cinId");
                    returnvalue = Serialize(returnvalue);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string GetSodForCinWithSodCode(string sodCode, string supFId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var supId = IntTryParse(supFId, "supId");

                var values = PurchaseBaseServices.GetSodForCin(connectedUser.Soc_id, sodCode, supId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #region payment

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SaveSupplierOrderPayment(List<KeyValue> sodprd)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                sodprd.ForEach(l =>
                {
                    if (!string.IsNullOrEmpty(l.Value4) && l.Key < 1)
                    {
                        l.Key = IntTryParse(l.Value4, "sodId");
                    }
                    if (!string.IsNullOrEmpty(l.Value3))
                    {
                        l.DValue = GetDateTimeOrNow(l.Value3).Value;
                    }
                });

                var sprIds = PurchaseBaseServices.SaveUpdateSodPayment(sodprd);
                returnvalue = Serialize(sprIds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierPaiment(bool subSup, bool sod2Pay, string supId, string dFrom, string dTo)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sup_id = IntTryParse(supId, "supId");
                var dfrom = GetDateTime1900(dFrom);
                var dto = GetDateTime2500(dTo);
                var sprIds = PurchaseBaseServices.GetSupplierPaiment(connectedUser.Soc_id, subSup, sod2Pay, sup_id, dfrom, dto);
                returnvalue = Serialize(sprIds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierPaymentDownload(bool subSup, bool sod2Pay, string supId, string dFrom, string dTo)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sup_id = IntTryParse(supId, "supId");
                var dfrom = GetDateTime1900(dFrom);
                var dto = GetDateTime2500(dTo);
                var sprIds = PurchaseBaseServices.GetSupplierPaymentDownload(connectedUser.Soc_id, subSup, sod2Pay, sup_id, dfrom, dto);
                returnvalue = Serialize(sprIds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodPaymentsList(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId.UrlDecode2String(), "sodId");
                var spr = PurchaseBaseServices.GetSodPaymentsList(connectedUser.Soc_id, sodid);
                returnvalue = Serialize(spr);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteSprFile(string sodId, int sprId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId, "sodId");
                var values = PurchaseBaseServices.UpdateSprFile(connectedUser.Soc_id, sodid, sprId, null);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion payment

        #region Sod Documents


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SaveUpdateSodDoc(List<KeyValue> sodsdc)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                sodsdc.ForEach(l =>
                {
                    if (!string.IsNullOrEmpty(l.Value4) && l.Key < 1)
                    {
                        l.Key = IntTryParse(l.Value4, "sodId");
                    }
                    if (!string.IsNullOrEmpty(l.Value3))
                    {
                        l.DValue = GetDateTimeOrNow(l.Value3).Value;
                    }
                });

                var sdcIds = PurchaseBaseServices.SaveUpdateSodDoc(sodsdc);
                returnvalue = Serialize(sdcIds);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodDocList(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId.UrlDecode2String(), "sodId");
                var spr = PurchaseBaseServices.GetSodDocList(connectedUser.Soc_id, sodid);
                returnvalue = Serialize(spr);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Sod Documents

        #region Sod Comment

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertUpdateSodCmt(KeyValue oneCta)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(oneCta.Value4.UrlDecode2String(), "sodId");
                oneCta.Key2 = sodid;
                oneCta.Key3 = connectedUser.Id;
                var values = PurchaseBaseServices.InsertUpdateSodCmt(oneCta);
                var ctaList = PurchaseBaseServices.GetAllSodCmt(sodid);
                returnvalue = Serialize(ctaList);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllSodCmt(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId, "sodId");
                var ctaList = PurchaseBaseServices.GetAllSodCmt(sodid);
                returnvalue = Serialize(ctaList);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Sod Comment

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodBySupId(int supId, bool isSub)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = PurchaseBaseServices.GetSodBySupId(connectedUser.Soc_id, supId, isSub);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodBySupIdWithDate(int supId, bool isSub, string DStart, string DEnd)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var dstart = GetDateTime1900(DStart);
                var dend = GetDateTime2500(DEnd);
                var values = PurchaseBaseServices.GetSodBySupIdWithDate(connectedUser.Soc_id, supId, isSub, dstart, dend);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodByKeyword(string keyword, string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId.UrlDecode2String(), "sodId");
                var values = PurchaseBaseServices.GetSodByKeyword(connectedUser.Soc_id, keyword, sodid);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CopyAndChangeSol2NewSod(string sodId, List<int> solIds)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sodId, "sodId");
                if (_id != 0)
                {
                    var id = PurchaseBaseServices.CopyAndChangeSol2NewSod(connectedUser.Soc_id, solIds, _id);
                    if (id != 0)
                    {
                        returnvalue = StringCipher.EncoderSimple(id.ToString(), "sodId");
                        returnvalue = Serialize(returnvalue);
                    }
                    else
                    {
                        returnvalue = Serialize("0");
                    }
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
        public string DeleteSdcFile(string sodId, int sdcId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var sodid = IntTryParse(sodId, "sodId");
                var values = PurchaseBaseServices.UpdateSdcFile(connectedUser.Soc_id, sodid, sdcId, null);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetRelatedLgs(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                if (sod_id != 0)
                {
                    var values = PurchaseBaseServices.GetRelatedLgs(connectedUser.Soc_id, sod_id);
                    returnvalue = Serialize(values);
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
        public string CancelSod(string sodId, int isCancel)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                if (sod_id != 0)
                {
                    var values = PurchaseBaseServices.CancelSod(connectedUser.Soc_id, sod_id, isCancel);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #region Status
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string UpdateSodSatus(string sodId, int sttId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                if (sod_id != 0)
                {
                    var values = PurchaseBaseServices.UpdateSodSatus(connectedUser.Soc_id, sod_id, sttId);
                    returnvalue = Serialize(values);
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
        public string SearchSodStatus(string dFrom, string dTo, int cliId, int supId, int sttId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                DateTime createDateFrom = GetDateTime1900(dFrom);
                DateTime createDateTo = GetDateTime2500(dTo);
                var values = PurchaseBaseServices.GetSodsForStt(connectedUser.Soc_id, cliId, supId, createDateFrom, createDateTo, sttId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }
        #endregion Status


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DuplicateSupplierOrder(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                if (sod_id != 0)
                {
                    var values = PurchaseBaseServices.DuplicateSupplierOrder(connectedUser.Soc_id, sod_id);
                    if (values == 0)
                    {
                        returnvalue = Serialize("0");
                    }
                    else
                    {
                        returnvalue = StringCipher.EncoderSimple(values.ToString(), "sodId");
                        returnvalue = Serialize(returnvalue);
                    }
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
        public string UpdateSodExpDeliveryDate(string sodId, string expDeliveryDate)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                if (sod_id != 0)
                {
                    var expdate = GetDateTimeOrNow(expDeliveryDate, true);
                    var values = PurchaseBaseServices.UpdateSodExpDeliveryDate(connectedUser.Soc_id, sod_id, expdate);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Supplier Order

        #region Supplier Order Lines

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertUpdateSol(PurchaseLineBaseClass oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                oneLine.SodId = IntTryParse(oneLine.SodFId, "sodId");
                oneLine.PrdId = IntTryParse(oneLine.PrdFId, "prdId");
                oneLine.PitId = IntTryParse(oneLine.PitFId, "pitId");
                if (oneLine.SodId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    oneLine.DProduction = GetDateTimeOrNow(oneLine._DProduction, true);
                    oneLine.DExpDelivery = GetDateTimeOrNow(oneLine._DExpDelivery, true);
                    oneLine.DDelivery = GetDateTimeOrNow(oneLine._DDelivery, true);
                    oneLine.DShipping = GetDateTimeOrNow(oneLine._DShipping, true);
                    oneLine.DExpArrival = GetDateTimeOrNow(oneLine._DExpArrival, true);
                    var values = PurchaseBaseLineServices.InsertUpdateSol(oneLine);
                    string guests;
                    CalendarServices.AddUpdateNotfForSol(values, connectedUser.Id, out guests);
                    returnvalue = Serialize(values);
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
        public string InsertUpdateSolLite(PurchaseLineBaseClass oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                oneLine.SocId = connectedUser.Soc_id;
                //oneLine.DProduction = GetDateTimeOrNow(oneLine._DProduction, true);
                oneLine.DExpDelivery = GetDateTimeOrNow(oneLine._DExpDelivery, true);
                //oneLine.DDelivery = GetDateTimeOrNow(oneLine._DDelivery, true);
                //oneLine.DShipping = GetDateTimeOrNow(oneLine._DShipping, true);
                oneLine.DExpArrival = GetDateTimeOrNow(oneLine._DExpArrival, true);
                //oneLine.Deadline = GetDateTimeOrNow(oneLine._Deadline, true);
                //oneLine.Comment = oneLine.Comment;
                bool isFinished;
                var values = PurchaseBaseLineServices.UpdateSolLite(oneLine, out isFinished);
                string guests;
                if (!isFinished)
                {
                    CalendarServices.AddUpdateNotfForSol(values, connectedUser.Id, out guests);
                }
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSols(string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sodId, "sodId");
                if (_id != 0)
                {
                    var values = PurchaseBaseLineServices.LoadSols(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string DeleteSol(string sodId, int solId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _sodId = IntTryParse(sodId, "sodId");
                if (_sodId != 0)
                {
                    PurchaseBaseLineServices.DeleteSol(connectedUser.Soc_id, _sodId, solId);
                    string guests;
                    CalendarServices.AddUpdateNotfForSol(solId, connectedUser.Id, out guests);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteSols(int sodId, List<int> solIds)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (sodId != 0)
                {
                    PurchaseBaseLineServices.DeleteSols(connectedUser.Soc_id, sodId, solIds);
                    string guests;
                    //CalendarServices.AddUpdateNotfForSol(solId, connectedUser.Id, out guests);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchSolDetail(string client, string keyword, string sodname, string sodcode, string sup,
            bool nostart, bool nofinpr, bool noarrpr, bool nosend, string dFrom, string dTo, bool finished, int cliId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                DateTime createDateFrom = GetDateTime1900(dFrom);
                //if (!DateTime.TryParse(dFrom, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
                //{
                //    createDateFrom = new DateTime(1900, 1, 1);
                //}
                DateTime createDateTo = GetDateTime2500(dTo);
                //if (!DateTime.TryParse(dTo, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
                //{
                //    createDateTo = new DateTime(2500, 12, 31);
                //}
                var values = PurchaseBaseLineServices.SearchSolDetail(connectedUser.Soc_id, client, keyword, sodname, sodcode, sup, createDateFrom, createDateTo, cliId, nostart, nofinpr, noarrpr, nosend, finished);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchSolDetailForPayment(string client, string keyword, string sodname, string sodcode, string sup,
            bool nostart, bool nofinpr, bool noarrpr, bool nosend, string dFrom, string dTo, bool finished, int cliId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                DateTime createDateFrom = GetDateTime1900(dFrom);
                //if (!DateTime.TryParse(dFrom, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateFrom))
                //{
                //    createDateFrom = new DateTime(1900, 1, 1);
                //}
                DateTime createDateTo = GetDateTime2500(dTo);
                //if (!DateTime.TryParse(dTo, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out createDateTo))
                //{
                //    createDateTo = new DateTime(2500, 12, 31);
                //}
                var values = PurchaseBaseLineServices.SearchSolDetailForPayment(connectedUser.Soc_id, client, keyword, sodname, sodcode, sup, createDateFrom, createDateTo, cliId, nostart, nofinpr, noarrpr, nosend, finished);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSolPr(int solId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = PurchaseBaseLineServices.GetSolPr(connectedUser.Soc_id, solId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertSolExpress(List<PurchaseLineBaseClass> line2add, string sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sodId, "sodId");
                if (_id != 0)
                {
                    var solIds = PurchaseBaseLineServices.InsertSolExpress(line2add, _id);
                    foreach (var solId in solIds)
                    {
                        string guests;
                        CalendarServices.AddUpdateNotfForSol(solId, connectedUser.Id, out guests);
                    }
                    returnvalue = Serialize("0");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool DuplicateSol(string sodId, int solId)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                var value = PurchaseBaseLineServices.DuplicateSol(connectedUser.Soc_id, sod_id, solId);
                returnvalue = value != 0;
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSolByPil(int pilId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = PurchaseBaseLineServices.LoadSolByPil(connectedUser.Soc_id, pilId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllPilSol(bool displayall)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = PurchaseBaseLineServices.GetAllPilSol(connectedUser.Soc_id, displayall);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertSolsByExcelLines(List<PurchaseLineBaseClass> lines)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var oneline = lines.FirstOrDefault();
                if (oneline != null)
                {
                    int sodid = IntTryParse(oneline.SodFId, "sodId");
                    if (sodid != 0)
                    {
                        PurchaseBaseLineServices.InsertSolsByExcelLines(connectedUser.Soc_id, sodid, lines);
                        returnvalue = Serialize("1");
                    }
                    else
                    {
                        returnvalue = Serialize("0");
                    }
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string UpdateSolLogistic(string sodId, string logId)
        {
            string returnvalue;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                var value = PurchaseBaseLineServices.UpdateSolLogistic(sod_id, connectedUser.Soc_id, logId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string UpdateSolVAT(string sodId, int vatId)
        {
            string returnvalue;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                var value = PurchaseBaseLineServices.UpdateSolVAT(sod_id, connectedUser.Soc_id, vatId);
                try
                {
                    returnvalue = Serialize(value);
                }
                catch (Exception)
                {
                    returnvalue = Serialize("0");
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
        public string ChangeSolPosition(string sodId, int solId, int updown)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int sod_id = IntTryParse(sodId, "sodId");
                var value = PurchaseBaseLineServices.ChangeSolPosition(sod_id, solId, updown, connectedUser.Soc_id);
                try
                {
                    returnvalue = Serialize(value);
                }
                catch (Exception)
                {
                    returnvalue = Serialize("0");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Supplier Order Lines

        #region Bank Account

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetBankAccountInfo(int type, string fId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = 0;
                switch (type)
                {
                    case 1:
                        _id = IntTryParse(fId, "cliId");
                        break;
                    case 2:
                        _id = IntTryParse(fId, "supId");
                        break;
                    case 3:
                        _id = IntTryParse(fId, "ccoId");
                        break;
                    case 4:
                        _id = IntTryParse(fId, "scoId");
                        break;
                    case 5:
                        _id = connectedUser.Soc_id;
                        break;
                }
                if (_id != 0)
                {
                    var value = BankAccountServices.LoadAllBankAccount(connectedUser.Soc_id, type, _id);
                    returnvalue = Serialize(value);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void CreateUpdateSupplierBankAccount(BankAccount bankAccount)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int type = bankAccount.TypeId;
                string fId = bankAccount.FgFId;
                int _id = 0;
                switch (type)
                {
                    case 1:
                        _id = IntTryParse(fId, "cliId");
                        break;
                    case 2:
                        _id = IntTryParse(fId, "supId");
                        break;
                    case 3:
                        _id = IntTryParse(fId, "ccoId");
                        break;
                    case 4:
                        _id = IntTryParse(fId, "scoId");
                        break;
                    case 5:
                        _id = connectedUser.Soc_id;
                        break;
                }
                bankAccount.FgId = _id;
                bankAccount.Id = IntTryParse(bankAccount.FId, "bacId");
                bankAccount.SocId = connectedUser.Soc_id;
                bankAccount.TypeId = bankAccount.TypeId;
                BankAccountServices.CreateUpdateBankAccount(bankAccount);
            }
        }

        [WebMethod]
        public bool DeleteBankAccount(BankAccount bankAccount)
        {
            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                bankAccount.FgId = IntTryParse(bankAccount.FgFId, "supId");
                //bankAccount.Id = IntTryParse(bankAccount.FId, "bacId");
                bankAccount.SocId = connectedUser.Soc_id;
                bankAccount.TypeId = 2;
                returnvalue = BankAccountServices.DeleteBankAccount(bankAccount);
            }
            return returnvalue;
        }

        #endregion Bank Account

        #region Supplier Invoice

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSin(string itemId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int id = IntTryParse(itemId, "sinId");
                if (id != 0)
                {
                    var values = PurchaseBaseServices.LoadSupplierInvoice(connectedUser.Soc_id, id);
                    returnvalue = Serialize(values);
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteSinFile(string sinId, int type)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sinId, "sinId");
                if (_id != 0)
                {
                    if (type == 6)
                    {
                        PurchaseBaseServices.UpdateSinFile(connectedUser.Soc_id, _id, null);
                    }
                    else if (type == 7)
                    {
                        PurchaseBaseServices.UpdateSinBankFile(connectedUser.Soc_id, _id, null);
                    }
                }
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchSupplierInvoice(PurchaseBaseClass sin)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                sin.SocId = connectedUser.Soc_id;
                var values = PurchaseBaseServices.SearchSupplierInvoice(sin);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Supplier Invoice

        #region Supplier Invoice Line

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string InsertUpdateSil(PurchaseLineBaseClass oneLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                oneLine.SinId = IntTryParse(oneLine.SinFId, "sinId");
                oneLine.PrdId = IntTryParse(oneLine.PrdFId, "prdId");
                oneLine.PitId = IntTryParse(oneLine.PitFId, "pitId");
                if (oneLine.SinId != 0)
                {
                    oneLine.SocId = connectedUser.Soc_id;
                    var values = PurchaseBaseLineServices.InsertUpdateSil(oneLine);
                    returnvalue = Serialize(values);
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
        public string LoadSils(string sinId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sinId, "sinId");
                if (_id != 0)
                {
                    var values = PurchaseBaseLineServices.LoadSils(connectedUser.Soc_id, _id);
                    returnvalue = Serialize(values);
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
        public string DeleteSil(string sinId, int silId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int _id = IntTryParse(sinId, "sinId");
                if (_id != 0)
                {
                    PurchaseBaseLineServices.DeleteSil(connectedUser.Soc_id, _id, silId);
                }
                returnvalue = Serialize(0);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Supplier Invoice Line

        #region AutoComplete Field

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductsByRef(string prdRef)
        {
            string EsaySearch = WebConfigurationManager.AppSettings["EsaySearch"];
            bool easysearch;
            Boolean.TryParse(EsaySearch, out easysearch);
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = ProductServices.GetProductsByRef(prdRef, connectedUser.Soc_id, easysearch);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
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
        public string GetProductsByRefWithSupplierId(string prdRef, int supId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (!string.IsNullOrEmpty(prdRef) && prdRef.Length >= 2)
                {
                    try
                    {
                        var values = ProductServices.GetProductsByRefWithSupplierId(prdRef, supId, connectedUser.Soc_id);
                        returnvalue = Serialize(values);
                    }
                    catch (Exception)
                    {
                    }
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
        public string GetPitByRef(string pitRef, string prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_id = 0;
                int pit_id = 0;
                try
                {
                    var prdIdlist = prdId.Split(new string[] { "###" }, StringSplitOptions.None).ToList();
                    var strcliId = StringCipher.DecoderSimple(prdIdlist[0].UrlDecode2String(), "prdId");
                    if (prdIdlist.Count > 1)
                    {
                        pit_id = Convert.ToInt32(prdIdlist[1]);
                    }
                    prd_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                try
                {
                    if (prd_id != 0)
                    {
                        var values = ProductServices.GetPitByRef(pitRef, prd_id, connectedUser.Soc_id, pit_id);
                        returnvalue = Serialize(values);
                    }
                    else
                    {
                        returnvalue = Serialize("NO_PRD_ID");
                    }
                }
                catch (Exception)
                {
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
        public string GetProductsByRefForSupplier(int ptyId, string prdRef)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                try
                {
                    var values = ProductServices.GetProductsByRef(prdRef, connectedUser.Soc_id, ptyId);
                    returnvalue = Serialize(values);
                }
                catch (Exception)
                {
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion AutoComplete Field

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
                    checkOK = ticket.UserData.DecodeTicket(connectedUser);
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }

        private bool CheckAuthenticationSup(out Supplier connectSup)
        {
            bool checkOK = false;
            connectSup = new Supplier();
            var authCookieName = FormsAuthentication.FormsCookieName;
            var authCookie = HttpContext.Current.Request.Cookies[authCookieName];
            if (authCookie != null)
            {
                try
                {
                    FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(authCookie.Value);
                    checkOK = ticket.UserData.DecodeTicketSup(connectSup);
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
            jss.MaxJsonLength = int.MaxValue;
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
                var date = DateTime.Parse(dateTime, culture);
                date = date.AddHours(23).AddMinutes(59).AddSeconds(59);
                return date;
            }
            catch (Exception)
            {
                return isNullable ? (DateTime?)null : DateTime.Now;
            }
        }

        public static DateTime GetDateTime1900(string dateTime)
        {
            DateTime date;
            if (!DateTime.TryParse(dateTime, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out date))
            {
                date = new DateTime(1900, 1, 1);
            }
            return date;
        }

        public static DateTime GetDateTime2500(string dateTime)
        {
            DateTime date;
            if (!DateTime.TryParse(dateTime, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out date))
            {
                date = new DateTime(2500, 12, 31);
            }
            date = date.AddHours(23).AddMinutes(59).AddSeconds(59);
            return date;
        }

        #endregion PRIVATE

        #region PDF

        public static byte[] AddPageNumbers(byte[] pdf, Society society)
        {
            MemoryStream ms = new MemoryStream();
            ms.Write(pdf, 0, pdf.Length);
            // we create a reader for a certain document
            PdfReader reader = new PdfReader(pdf);
            // we retrieve the total number of pages

            //old code
            //int n = reader.NumberOfPages - 1;
            int n = reader.NumberOfPages;
            // we retrieve the size of the first page
            iTextSharp.text.Rectangle psize = reader.GetPageSize(1);

            // step 1: creation of a document-object
            Document document = new Document(psize, 50, 50, 50, 50);
            // step 2: we create a writer that listens to the document
            PdfWriter writer = PdfWriter.GetInstance(document, ms);
            // step 3: we open the document

            document.Open();
            // step 4: we add content
            PdfContentByte cb = writer.DirectContent;

            int p = 0;
            //Console.WriteLine("There are " + n + " pages in the document.");
            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                document.NewPage();
                p++;

                PdfImportedPage importedPage = writer.GetImportedPage(reader, page);
                cb.AddTemplate(importedPage, 0, 0);

                BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                cb.BeginText();
                cb.SetFontAndSize(bf, 9);
                //string companyInfo = "Entreprise JP MARINO - Siret N°32621314700035 - R.C.S: 326213147 RCS Bobigny - TVA N° FR51326213147";

                string compInfo = society.Society_Name;//WebConfigurationManager.AppSettings["CompanyInfo"];
                string companyInfoSpace = WebConfigurationManager.AppSettings["CompanyInfoSpace"];
                int compInfoSpance;
                int.TryParse(companyInfoSpace, out compInfoSpance);
                compInfoSpance = compInfoSpance == 0 ? 85 : compInfoSpance;
                //string companyInfo = "ECOLED EUROPE - Siret N°75198276000025 - RCS MEAUX : 751982760 - TVA N° FR86751982760";
                string companyInfo = compInfo;
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, companyInfo, compInfoSpance, 15, 0);
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, +p + "/" + n, 560, 15, 0);
                cb.EndText();
            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        public static byte[] AddPageNumbers(byte[] pdf, Society society, string code2Add = null, bool leftside = false, string pdfVersion = null, bool withPageNumber = true, bool leftsideWithPageNumber = false, string PdfVersion = null)
        {
            MemoryStream ms = new MemoryStream();
            ms.Write(pdf, 0, pdf.Length);
            // we create a reader for a certain document
            PdfReader reader = new PdfReader(pdf);
            // we retrieve the total number of pages

            //old code
            //int n = reader.NumberOfPages - 1;
            int allpage = reader.NumberOfPages;
            // we retrieve the size of the first page
            iTextSharp.text.Rectangle psize = reader.GetPageSize(1);

            // step 1: creation of a document-object
            Document document = new Document(psize, 50, 50, 50, 50);
            // step 2: we create a writer that listens to the document
            PdfWriter writer = PdfWriter.GetInstance(document, ms);
            // step 3: we open the document

            document.Open();
            // step 4: we add content
            PdfContentByte cb = writer.DirectContent;

            int curPage = 0;
            //Console.WriteLine("There are " + n + " pages in the document.");
            string compInfo = string.Empty;
            //compInfo = WebConfigurationManager.AppSettings["CompanyInfo"];
            string companyname = society.Society_Name;
            if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
            {
                //compInfo = string.Format("IF {0} - RC {1} - ICE {2} - CNSS {3} - TAXE PRO {4}", society.Siret, society.RCS, society.TvaIntra, society.Cnss, society.TaxePro);
                compInfo = string.Format("{5}{0}{6}{1}{7}{2}{8}{3}{9}{4}", society.Siret, society.RCS, society.TvaIntra, society.Cnss, society.TaxePro,
                    (string.IsNullOrEmpty(society.Siret) ? string.Empty : "IF "), (string.IsNullOrEmpty(society.RCS) ? string.Empty : " - RC "), (string.IsNullOrEmpty(society.TvaIntra) ? string.Empty : " - ICE "),
                    (string.IsNullOrEmpty(society.Cnss) ? string.Empty : " - CNSS "), (string.IsNullOrEmpty(society.TaxePro) ? string.Empty : " - TAXE PRO "));

            }
            else
            {
                //compInfo = string.Format("{0} - SIRET {1} - {2} - TVA {3}", society.Society_Name, society.Siret, society.RCS, society.TvaIntra);
                compInfo = string.Format("{0}{4}{1}{5}{2}{6}{3}", society.Society_Name, society.Siret, society.RCS, society.TvaIntra, (string.IsNullOrEmpty(society.Siret) ? string.Empty : " - Siret "), (string.IsNullOrEmpty(society.RCS) ? string.Empty : " - RCS "), (string.IsNullOrEmpty(society.TvaIntra) ? string.Empty : " - TVA "));
            }
            string companyInfoSpace = WebConfigurationManager.AppSettings["CompanyInfoSpace"];
            string companyInfo = compInfo;
            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                document.NewPage();
                curPage++;

                PdfImportedPage importedPage = writer.GetImportedPage(reader, page);
                cb.AddTemplate(importedPage, 0, 0);

                BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                cb.BeginText();
                if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                {
                    cb.SetFontAndSize(bf, 6);
                }
                else
                {
                    cb.SetFontAndSize(bf, 9);
                }
                //string companyInfo = "Entreprise JP MARINO - Siret N°32621314700035 - R.C.S: 326213147 RCS Bobigny - TVA N° FR51326213147";

                int compInfoSpance;
                int.TryParse(companyInfoSpace, out compInfoSpance);
                //compInfoSpance = compInfoSpance == 0 ? 85 : compInfoSpance;
                //string companyInfo = "ECOLED EUROPE - Siret N°75198276000025 - RCS MEAUX : 751982760 - TVA N° FR86751982760";

                if (withPageNumber)
                {
                    // 页码
                    if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, companyInfo, 20, 5, 0);
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "Page " + curPage + "/" + allpage, 550, 5, 0);
                    }
                    else
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_CENTER, companyInfo, (float)297.5, 15, 0);
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, +curPage + "/" + allpage, 560, 15, 0);
                    }
                }

                if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                {
                    cb.ShowTextAligned(PdfContentByte.ALIGN_CENTER, companyname, (float)297.5, 25, 0);
                }

                // 右下角文字
                if (!string.IsNullOrEmpty(code2Add))
                {
                    var newcode = code2Add;
                    if (!withPageNumber && leftsideWithPageNumber)
                    {
                        newcode = (code2Add + (" - [ " + curPage + "/" + allpage + " ]"));
                    }
                    if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, leftside ? 20 : 520, 25, 0);
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, 20, 12, 0);
                    }
                    else
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, leftside ? 20 : 520, 25, 0);
                    }
                }


                // 右侧面文字
                if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                {
                    cb.SetFontAndSize(bf, 4);
                    var softwareinfo = "CI ENTERPRISE MANAGEMENT SYSTEM";
                    cb.ShowTextAligned(Element.ALIGN_CENTER, softwareinfo, 593, 470, 90);
                }


                cb.EndText();
            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        private static string _imagePath = "/img/logo/logo-Pdf.png";

        public static byte[] AddLog2Page(byte[] pdf, string path, string codeBar = null)
        {
            MemoryStream ms = new MemoryStream();
            ms.Write(pdf, 0, pdf.Length);
            // we create a reader for a certain document
            PdfReader reader = new PdfReader(pdf);
            // we retrieve the total number of pages

            //old code
            //int n = reader.NumberOfPages - 1;
            int n = reader.NumberOfPages;
            // we retrieve the size of the first page
            iTextSharp.text.Rectangle psize = reader.GetPageSize(1);

            // step 1: creation of a document-object
            Document document = new Document(psize, 50, 50, 50, 50);
            // step 2: we create a writer that listens to the document
            PdfWriter writer = PdfWriter.GetInstance(document, ms);
            // step 3: we open the document

            document.Open();
            // step 4: we add content
            PdfContentByte cb = writer.DirectContent;

            int p = 0;
            //Console.WriteLine("There are " + n + " pages in the document.");
            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                document.NewPage();
                p++;

                PdfImportedPage importedPage = writer.GetImportedPage(reader, page);
                cb.AddTemplate(importedPage, 0, 0);

                //BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                //cb.BeginText();
                //cb.SetFontAndSize(bf, 9);
                //string companyInfo = "Entreprise JP MARINO - Siret N°32621314700035 - R.C.S: 326213147 RCS Bobigny - TVA N° FR51326213147";
                //cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, companyInfo, 75, 15, 0);
                //cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, +p + "/" + n, 560, 15, 0);
                //cb.EndText();

                if (page == 1)
                {
                    iTextSharp.text.Image jpg =
                        iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, _imagePath));
                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;


                    // AddImage(Image image, float a, float b, float c, float d, float e, float f);
                    // addImage(image, image_width, 0, 0, image_height, x, y)
                    cb.AddImage(jpg, 104, 0, 0, 46, 30, 765);



                    if (!string.IsNullOrEmpty(codeBar))
                    {
                        var code128 = new Code128();
                        var codebarImg = code128.GetCodeImage(codeBar, Code128.Encode.Code128A);
                        if (codebarImg != null)
                        {
                            var stream = new MemoryStream();
                            codebarImg.Save(stream, ImageFormat.Png);
                            var image = stream.ToArray();
                            stream.Close();
                            //var image = BitmapToByteArray(codebarImg);

                            iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(image);
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(qrJpg, 130, 0, 0, 37, 385, 797);
                        }
                    }
                }

                //jpg.ScaleToFit(250f, 250f);
                //jpg.Alignment = iTextSharp.text.Image.TEXTWRAP | iTextSharp.text.Image.ALIGN_RIGHT;
                //jpg.IndentationLeft = 9f;
                //jpg.SpacingAfter = 9f;
                //jpg.BorderWidthTop = 36f;
                ////jpg.BorderColorTop = Color.WHITE;
                //document.Add(jpg);
                //document.Add(paragraph);

                //tif.ScalePercent(24f);
                //document.Add(jpg);

            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        private static string _imageLogoPath = "/img/logo/logo-Pdf.png";
        private static string _imageSealPath = "/img/logo/logo-seal.png";

        public static byte[] AddLog2Page(byte[] pdf, string path, string codeBar = null, string PdfVersion = null, Society society = null, string qrname = null)
        {
            MemoryStream ms = new MemoryStream();
            ms.Write(pdf, 0, pdf.Length);
            // we create a reader for a certain document
            PdfReader reader = new PdfReader(pdf);
            // we retrieve the total number of pages

            //old code
            //int n = reader.NumberOfPages - 1;
            int n = reader.NumberOfPages;
            // we retrieve the size of the first page
            iTextSharp.text.Rectangle psize = reader.GetPageSize(1);

            // step 1: creation of a document-object
            Document document = new Document(psize, 50, 50, 50, 50);
            // step 2: we create a writer that listens to the document
            PdfWriter writer = PdfWriter.GetInstance(document, ms);
            // step 3: we open the document

            document.Open();
            // step 4: we add content
            PdfContentByte cb = writer.DirectContent;

            int p = 0;
            //Console.WriteLine("There are " + n + " pages in the document.");  
            iTextSharp.text.Image jpg_logo = iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, _imageLogoPath));
            jpg_logo.Alignment = iTextSharp.text.Image.UNDERLYING;


            #region Seal
            iTextSharp.text.Image logoSeal = null;
            if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
            {
                //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距);
                //cb.AddImage(jpg_logo, 129, 0, 0, 129, 15, 737);

                //  seal 印章
                Bitmap b = new Bitmap(string.Format("{0}{1}", path, _imageSealPath));
                b.MakeTransparent(Color.White);
                //var logo_seal = iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, _imageSealPath));
                logoSeal = iTextSharp.text.Image.GetInstance(b, System.Drawing.Imaging.ImageFormat.Png);
                logoSeal.Alignment = iTextSharp.text.Image.UNDEFINED;
                //cb.AddImage(logo_seal, 110, 0, 0, 110, 440, 50);
            }
            else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
            {
                //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距);
                //cb.AddImage(jpg_logo, 80, 0, 0, 80, 495, 768);

                //  seal 印章
                //Bitmap b = new Bitmap(string.Format("{0}{1}", path, _imageSealPath));
                Bitmap b = SetImageOpacity(System.Drawing.Image.FromFile(string.Format("{0}{1}", path, _imageSealPath)), 180);
                b.MakeTransparent(Color.White);
                //var logo_seal = iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, _imageSealPath));
                logoSeal = iTextSharp.text.Image.GetInstance(b, System.Drawing.Imaging.ImageFormat.Png);
                logoSeal.Alignment = iTextSharp.text.Image.UNDEFINED;
                //cb.AddImage(logo_seal, 80, 0, 0, 80, 460, 30);
            }
            else
            {
                logoSeal = null;
                //cb.AddImage(jpg_logo, 129, 0, 0, 129, 15, 720);
            }
            #endregion Seal

            #region Codebar

            iTextSharp.text.Image qrJpg = null;
            if (!string.IsNullOrEmpty(codeBar))
            {
                var code128 = new Code128();
                var codebarImg = code128.GetCodeImage(codeBar, Code128.Encode.Code128A);
                if (codebarImg != null)
                {
                    var stream = new MemoryStream();
                    if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        codebarImg.RotateFlip(RotateFlipType.Rotate90FlipX);
                    }
                    codebarImg.Save(stream, ImageFormat.Png);
                    var image = stream.ToArray();
                    stream.Close();
                    qrJpg = iTextSharp.text.Image.GetInstance(image);
                }
            }

            #endregion Codebar

            #region QrCode

            iTextSharp.text.Image qrCodeJpg = null;
            if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
            {
                QrEncoder qrEncoder = new QrEncoder(Gma.QrCodeNet.Encoding.ErrorCorrectionLevel.H);
                QrCode qrCode = new QrCode();
                string info = string.Format("{0}\r\n{1}\r\n{2}", society.Society_Name, qrname, codeBar);
                qrEncoder.TryEncode(info, out qrCode);

                GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                MemoryStream qrStream = new MemoryStream();
                renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                var qrcodeimage = qrStream.ToArray();
                if (qrcodeimage != null)
                {
                    qrCodeJpg = iTextSharp.text.Image.GetInstance(qrcodeimage);
                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                    //cb.AddImage(qrCodeJpg, 50, 0, 0, 50, 522, 780);

                }
            }
            else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
            {
                // 降低纠错级别
                QrEncoder qrEncoder = new QrEncoder(Gma.QrCodeNet.Encoding.ErrorCorrectionLevel.L);
                QrCode qrCode = new QrCode();
                string info = string.Format("{0}\r\n{1}\r\n{2}", society.Society_Name, qrname, codeBar);
                qrEncoder.TryEncode(info, out qrCode);

                GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                MemoryStream qrStream = new MemoryStream();
                renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                var qrcodeimage = qrStream.ToArray();
                if (qrcodeimage != null)
                {
                    var qrcodeimgopc = SetImageOpacityStream(new MemoryStream(qrcodeimage), 150);
                    MemoryStream newms = new MemoryStream();
                    qrcodeimgopc.Save(newms, System.Drawing.Imaging.ImageFormat.Png);
                    byte[] bytes = newms.GetBuffer();
                    qrCodeJpg = iTextSharp.text.Image.GetInstance(bytes);
                    // addImage(image, 图片宽度, 0, 0, 图片高度, 左边距, 下边距)
                    //cb.AddImage(qrCodeJpg, 40, 0, 0, 40, 20, 785);

                }
            }
            else
            {

            }

            #endregion QrCode

            #region 页面中间logo
            // 只针对HK02
            iTextSharp.text.Image LogoCenter = null;
            if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
            {
                Bitmap b = SetImageOpacity(System.Drawing.Image.FromFile(string.Format("{0}{1}", path, _imageLogoPath)), 70);
                b.MakeTransparent(Color.White);
                LogoCenter = iTextSharp.text.Image.GetInstance(b, System.Drawing.Imaging.ImageFormat.Png);
                LogoCenter.Alignment = iTextSharp.text.Image.UNDEFINED;
                //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距);
                //cb.AddImage(logo_seal, 300, 0, 0, 300, 150, 320);
            }
            #endregion 页面中间logo

            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                document.NewPage();
                p++;

                PdfImportedPage importedPage = writer.GetImportedPage(reader, page);
                cb.AddTemplate(importedPage, 0, 0);


                if (page == 1)
                {
                    // AddImage(Image image, float a, float b, float c, float d, float e, float f);
                    // addImage(image, image_width, 0, 0, image_height, x, y)

                    #region seal 印章

                    if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.AddImage(jpg_logo, 129, 0, 0, 129, 15, 737);
                        cb.AddImage(logoSeal, 110, 0, 0, 110, 440, 50);
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.AddImage(jpg_logo, 80, 0, 0, 80, 495, 768);
                        cb.AddImage(logoSeal, 80, 0, 0, 80, 460, 30);
                    }
                    else
                    {
                        cb.AddImage(jpg_logo, 129, 0, 0, 129, 15, 720);
                    }

                    #endregion seal 印章

                    #region 条形码
                    if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距);
                        if (qrJpg != null)
                        {
                            cb.AddImage(qrJpg, 130, 0, 0, 20, 20, 0);
                        }
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距); 
                        if (qrJpg != null)
                        {
                            cb.AddImage(qrJpg, 15, 0, 0, 220, 0, 300);
                        }
                    }
                    else
                    {
                        if (qrJpg != null)
                        {
                            cb.AddImage(qrJpg, 130, 0, 0, 37, 385, 797);
                        }
                    }

                    #endregion 条形码

                    #region 二维码
                    // qrCode 二维码
                    if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
                    {
                        if (qrCodeJpg != null)
                        {
                            cb.AddImage(qrCodeJpg, 50, 0, 0, 50, 522, 780);
                        }
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
                    {
                        if (qrCodeJpg != null)
                        {
                            cb.AddImage(qrCodeJpg, 40, 0, 0, 40, 20, 785);
                        }

                    }
                    else
                    {

                    }

                    #endregion 二维码

                    #region 页面中间logo
                    // 只针对HK02
                    if (LogoCenter != null)
                    {
                        cb.AddImage(LogoCenter, 300, 0, 0, 300, 150, 320);
                    }

                    #endregion 页面中间logo

                }
                else
                {
                    // HK02 每页均加入logo，印章和侧面条形码
                    // 印章
                    if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        //  seal 印章
                        cb.AddImage(logoSeal, 80, 0, 0, 80, 460, 30);


                        // 条形码
                        if (qrJpg != null)
                        {
                            cb.AddImage(qrJpg, 15, 0, 0, 220, 0, 300);
                        }

                        // 中间logo
                        if (LogoCenter != null)
                        {
                            cb.AddImage(LogoCenter, 300, 0, 0, 300, 150, 320);
                        }
                    }
                }


                // todo : 2018-02-19 add fold line in page 信封折线

                BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                cb.BeginText();
                iTextSharp.text.BaseColor clrgrey = new iTextSharp.text.BaseColor(192, 192, 192);
                cb.SetFontAndSize(bf, 9);
                cb.SetColorFill(clrgrey);

                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "-", 5, 563, 0);
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "-", 588, 563, 0);


                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "-", 5, 250, 0);
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, "-", 588, 250, 0);

                cb.EndText();



                //jpg.ScaleToFit(250f, 250f);
                //jpg.Alignment = iTextSharp.text.Image.TEXTWRAP | iTextSharp.text.Image.ALIGN_RIGHT;
                //jpg.IndentationLeft = 9f;
                //jpg.SpacingAfter = 9f;
                //jpg.BorderWidthTop = 36f;
                ////jpg.BorderColorTop = Color.WHITE;
                //document.Add(jpg);
                //document.Add(paragraph);

                //tif.ScalePercent(24f);
                //document.Add(jpg);

            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }



        #region 图片透明度
        /// <summary>
        ///  图片透明度
        /// </summary>
        /// <param name="srcImage"></param>
        /// <param name="opacity">0-255</param>
        /// <returns></returns>
        private static Bitmap SetImageOpacity(System.Drawing.Image srcImage, int opacity)
        {
            Bitmap pic = new Bitmap(srcImage);
            for (int w = 0; w < pic.Width; w++)
            {
                for (int h = 0; h < pic.Height; h++)
                {
                    Color c = pic.GetPixel(w, h);
                    Color newC;
                    if (!c.Equals(Color.FromArgb(0, 0, 0, 0)))
                    {
                        newC = Color.FromArgb(opacity, c);
                    }
                    else
                    {
                        newC = c;
                    }
                    pic.SetPixel(w, h, newC);
                }
            }
            return pic;
        }

        private static Bitmap SetImageOpacityStream(Stream srcImage, int opacity)
        {
            Bitmap pic = new Bitmap(srcImage);
            for (int w = 0; w < pic.Width; w++)
            {
                for (int h = 0; h < pic.Height; h++)
                {
                    Color c = pic.GetPixel(w, h);
                    Color newC;
                    if (!c.Equals(Color.FromArgb(0, 0, 0, 0)))
                    {
                        newC = Color.FromArgb(opacity, c);
                    }
                    else
                    {
                        newC = c;
                    }
                    pic.SetPixel(w, h, newC);
                }
            }
            return pic;
        }

        private static System.Drawing.Image SetImageOpacity2(System.Drawing.Image srcImage, int opacity)
        {
            Bitmap img = new Bitmap(srcImage);
            using (Bitmap bmp = new Bitmap(img.Width, img.Height, System.Drawing.Imaging.PixelFormat.Format32bppArgb))
            {
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.DrawImage(img, 0, 0);
                    for (int h = 0; h <= img.Height - 1; h++)
                    {
                        for (int w = 0; w <= img.Width - 1; w++)
                        {
                            Color c = img.GetPixel(w, h);
                            if (!c.Equals(Color.FromArgb(0, 0, 0, 0)))
                            {
                                bmp.SetPixel(w, h, Color.FromArgb(opacity, c.R, c.G, c.B));
                            }
                            else
                            {
                                bmp.SetPixel(w, h, Color.FromArgb(c.A, c.R, c.G, c.B));
                            }
                        }
                    }
                }
                return (System.Drawing.Image)bmp.Clone();
            }
        }
        #endregion 图片透明度


        #endregion PDF

        #region Widget

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientInvoiceToPay()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = ClientInvoiceServices.GetClientInvoiceToPay(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSupplierInvoiceNoPaid()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = PurchaseBaseServices.GetSupplierInvoiceNoPaid(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetLogisticssNoSent()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = LogisticsServices.GetLogisticssNoSent(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetLogisticssArriving()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = LogisticsServices.GetLogisticssArriving(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }



        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetClientOrdersNotCompleteDeliveried()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = ClientOrderServices.GetClientOrdersNotCompleteDeliveried(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCostPlansInProgress()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = CostPlanServices.GetCostPlansInProgress(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }



        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCostPlansInProgressThisMonthAndLastMonth()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = CostPlanServices.GetCostPlansInProgressThisMonthAndLastMonth(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Widget

        #region Logistics

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadLgs(string lgsId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var value = LogisticsServices.LoadLogisticsById(lgs_id, connectedUser.Soc_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSin2Delivery(string lgsId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                //var value = LogisticsServices.GetSin2Delivery(connectedUser.Soc_id, lgs_id);
                var value = LogisticsServices.GetSod2Delivery(connectedUser.Soc_id, lgs_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodByKeywordSimple(string keyword)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                keyword = keyword.Trim();
                var value = PurchaseBaseServices.GetSodByKeyword(connectedUser.Soc_id, keyword, 0, true);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 搜索SOD用于Lgs关联
        /// </summary>
        /// <param name="keyword"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodByKeywordForLgsAss(string keyword, string lgsId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var lgs_id = IntTryParse(lgsId, "lgsId");
                var value = PurchaseBaseServices.GetSodByKeyword(connectedUser.Soc_id, keyword, 0, false, lgs_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateLogisticsLines(List<LogisticsLine> lgls)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                if (lgls.Any())
                {
                    int lgs_id = IntTryParse(lgls.FirstOrDefault().FId, "lgsId");
                    lgls.ForEach(m =>
                    {
                        m.LgsId = IntTryParse(m.FId, "lgsId");
                        m.PrdId = m.PrdId == 0 ? IntTryParse(m.PrdFId, "prdId") : m.PrdId;
                        m.PitId = m.PitId == 0 ? IntTryParse(m.PitFId, "pitId") : m.PitId;
                        m.ProductRef = m.PitId == 0 ? string.Empty : m.ProductRef;
                    });

                    var value = LogisticsServices.CreateUpdateLogisticLines(connectedUser.Soc_id, lgs_id, lgls);
                    returnvalue = Serialize(value);
                }
                else
                {
                    returnvalue = Serialize("0");
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
        public string AddSolToLgs(string lgsId, int solId, int qty)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var value = LogisticsServices.AddSolToLgs(connectedUser.Soc_id, lgs_id, solId, qty);
                returnvalue = Serialize(value);

            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadAllLgsLines(string lgsId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var value = LogisticsServices.LoadAllLgsLines(connectedUser.Soc_id, lgs_id).OrderByDescending(l => l.CinId).ThenBy(l => l.SodId).ToList();
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string UpdateOneLgLine(LogisticsLine lgLine)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                lgLine.LgsId = IntTryParse(lgLine.FId, "lgsId");
                lgLine.PrdId = IntTryParse(lgLine.PrdFId, "prdId");
                lgLine.PitId = IntTryParse(lgLine.PitFId, "pitId");
                var value = LogisticsServices.UpdateOneLgLine(connectedUser.Soc_id, lgLine);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchLogisticss(Logistics logistics)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                logistics.SocId = connectedUser.Soc_id;
                logistics.LgsDateArrivePre = GetDateTimeOrNow(logistics._LgsDateArrivePre, false);
                logistics.LgsDateArrive = GetDateTimeOrNow(logistics._LgsDateArrive, false);
                var value = LogisticsServices.SearchLogisticss(logistics);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public int DeleteLogistic(string lgsId)
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var value = LogisticsServices.DeleteLogistic(connectedUser.Soc_id, lgs_id);
                returnvalue = value;
            }
            else
            {
                returnvalue = -1;
            }
            return returnvalue;
        }

        [WebMethod]
        public void UpdateLogisticSendDate(string lgsId, string sendDate, string arrDate, string tracknmb)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var senddate = GetDateTimeOrNow(sendDate).Value;
                var arrdate = GetDateTimeOrNow(arrDate).Value;
                LogisticsServices.UpdateLogisticSendDate(connectedUser.Soc_id, lgs_id, senddate, arrdate, tracknmb, connectedUser.Id);
            }
        }


        [WebMethod]
        public void CreateSrvFromLogisticSeearch(string lgsId, string arrDate, string comment)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var arrdate = GetDateTimeOrNow(arrDate).Value;
                WarehouseService.CreateSrvFromLogisticSeearch(connectedUser.Soc_id, lgs_id, connectedUser.Id, arrdate, comment);
            }
        }



        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetLogisticsByKeyword(string keyword)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = LogisticsServices.GetLogisticsByKeyword(keyword, connectedUser.Soc_id, connectedUser.Id, connectedUser.SuperRight, 10);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateLgsFromCin(string cinId, int lgsId, int supId, List<KeyValue> ciiLines)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cin_id = IntTryParse(cinId, "cinId");
                var value = LogisticsServices.CreateUpdateLgsFromCin(cin_id, lgsId, supId, connectedUser.Id, connectedUser.Soc_id, ciiLines);
                returnvalue = StringCipher.EncoderSimple(value.ToString(), "lgsId");
                returnvalue = Serialize(returnvalue);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 设置LGS对应的SOD账单
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SetLgsAssSod(string lgsId, int sodId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int lgs_id = IntTryParse(lgsId, "lgsId");
                var value = LogisticsServices.SetLgsAssSod(connectedUser.Soc_id, lgs_id, sodId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Logistics

        #region Category

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadOneCategory(string catId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int cod_id = IntTryParse(catId, "catId");
                if (cod_id != 0)
                {
                    var values = CategoryServices.LoadCategoryById(cod_id, connectedUser.Soc_id, true);
                    returnvalue = Serialize(values);
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
        public string GetAllCategory()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = CategoryServices.GetAllCategory(connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchCategory(string catName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cat = new Entities.Category
                {
                    SocId = connectedUser.Soc_id,
                    CatName = catName
                };
                var values = CategoryServices.SearchCategory(cat);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeleteCatFile(string catId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cat_id = IntTryParse(catId, "catId");
                if (cat_id != 0)
                {
                    CategoryServices.UpdateCatFile(connectedUser.Soc_id, cat_id, null);
                }
            }
        }

        [WebMethod]
        public bool DeleteCategory(string catId)
        {

            bool returnvalue = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cat_id = IntTryParse(catId, "catId");
                if (cat_id != 0)
                {
                    CategoryServices.DeleteCategory(cat_id, connectedUser.Soc_id);
                }
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetTopCategory()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = CategoryServices.GetTopCategories(connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Category

        #region Recommanded products


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllProductsInCat(int catId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ProductServices.GetAllProductsInCat(connectedUser.Soc_id, catId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetRecommandedPrd(int catId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ProductServices.GetRecommandedPrd(connectedUser.Soc_id, catId: catId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string AddProductInCat(int catId, int prdId, int order, bool actived)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                order = order > 0 ? order : 1;
                ProductServices.AddProductInCat(connectedUser.Soc_id, catId, prdId, order, actived);
                var values = ProductServices.GetRecommandedPrd(connectedUser.Soc_id, catId: catId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteProductInCat(int catId, int prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                ProductServices.DeleteUpdateProductInCat(connectedUser.Soc_id, catId, prdId, 0, false, true);
                var values = ProductServices.GetRecommandedPrd(connectedUser.Soc_id, catId: catId);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Recommanded products

        #region Product Category

        /// <summary>
        /// 
        /// </summary>
        /// <param name="pcaId"></param>
        /// <param name="prdId"></param>
        /// <param name="catId"></param>
        /// <param name="pcaDes"></param>
        /// <param name="resType">1: get pca for prd, 2: get pca for cat</param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdatePca(int pcaId, string prdId, string catId, string pcaDes, int resType)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_id;
                int.TryParse(prdId, out prd_id);
                int cat_id;
                int.TryParse(catId, out cat_id);
                if (prd_id == 0)
                {
                    prd_id = IntTryParse(prdId, "prdId");
                }
                if (cat_id == 0)
                {
                    cat_id = IntTryParse(catId, "catId");
                }
                CategoryServices.CreateUpdatePca(connectedUser.Soc_id, pcaId, prd_id, cat_id, pcaDes);
                if (resType == 1)
                {
                    var pcalist = CategoryServices.GetPrdCats(connectedUser.Soc_id, 0, 0, prd_id);
                    returnvalue = Serialize(pcalist);
                }
                else
                {
                    var pcalist = CategoryServices.GetPrdCats(connectedUser.Soc_id, 0, cat_id, 0);
                    returnvalue = Serialize(pcalist);
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
        public string GetAllPcas(string prdId, string catId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_id = IntTryParse(prdId, "prdId");
                int cat_id = IntTryParse(catId, "catId");
                var pcalist = CategoryServices.GetPrdCats(connectedUser.Soc_id, 0, cat_id, prd_id);
                returnvalue = Serialize(pcalist);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public void DeletePca(int pcaId, string catId, string prdId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int prd_id = IntTryParse(prdId, "prdId");
                int cat_id = IntTryParse(catId, "catId");
                CategoryServices.DeletePca(pcaId, cat_id, prd_id);
            }
            else
            {
            }
        }


        #endregion Product Category

        #region User

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetUserList()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var userlist = UserServices.GetUserList(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(userlist);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetRoleList()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var userlist = UserServices.GetRoleList(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(userlist);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public int GetUserRole()
        {
            int returnvalue = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var userrole = UserServices.GetUserRole(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = userrole;
            }
            else
            {
                returnvalue = 0;
            }
            return returnvalue;
        }

        [WebMethod]
        public int GetCurrentUser()
        {
            int userId = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                userId = connectedUser.Id;
            }
            return userId;
        }

        [WebMethod]
        public int CreateUpdateUser(User oneUser)
        {
            int userId = 0;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                bool create = oneUser.Id == 0;
                oneUser.UsrCreatorId = connectedUser.Id;
                oneUser.Soc_id = connectedUser.Soc_id;
                userId = UserServices.CreateUpdateUser(oneUser);
                oneUser = UserServices.GetOneUser(oneUser.Soc_id, userId);
                if (create)
                {
                    SendEmailForPasswordChange(oneUser, true);
                }
            }
            return userId;
        }

        [WebMethod]
        public bool CheckLoginExisted(int usrId, string login)
        {
            bool existed = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                existed = UserServices.CheckLoginExisted(connectedUser.Soc_id, usrId, login);
            }
            return existed;
        }

        [WebMethod]
        public void DeleteUserPhoto(int usrId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                UserServices.CreateUpdateUserPhoto(connectedUser.Soc_id, usrId, null);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCurrentUserInfo()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                //connectedUser.Soc_id = 0;
                //connectedUser.Id = 0;
                //connectedUser.RolId = 0;
                //connectedUser.Civ_Id = 0;
                returnvalue = Serialize(connectedUser);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        public bool ChangeUserPassword(int usrId, string pwd)
        {
            bool changed = false;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                changed = UserServices.ChangeUserPassword(connectedUser.Soc_id, usrId, connectedUser.Id, pwd);
                if (changed)
                {
                    var oneusr = UserServices.GetOneUser(connectedUser.Soc_id, usrId);
                    if (oneusr != null && !string.IsNullOrEmpty(oneusr.Email) && EmailIsValid(oneusr.Email))
                    {
                        SendEmailForPasswordChange(oneusr, false);
                    }
                }
            }
            return changed;
        }

        private void SendEmailForPasswordChange(User oneUser, bool create)
        {
            string _path = Server.MapPath("~");
            string costplanFilePath = "GeneralEmail.html";
            string emailBody = ReadFileFrom(costplanFilePath, _path);
            string content = create ? WebConfigurationManager.AppSettings["MsgTitleCreateAccount"] : WebConfigurationManager.AppSettings["MsgTitleChangePassword"];
            string title = create ? WebConfigurationManager.AppSettings["MsgContentCreateAccount"] : WebConfigurationManager.AppSettings["MsgContentChangePassword"];
            emailBody = emailBody.Replace("#MsgContent#", content);
            emailBody = emailBody.Replace("#EmailTitle#", title);

            //string emailBody = "Votre compte ECOLED est créé<br/>Login : " + siteClient.Login + "<br/>Mot de passe : " + siteClient.Pwd;
            var from = WebConfigurationManager.AppSettings["EmailAccount1"];
            var fromPwd = WebConfigurationManager.AppSettings["EmailAccount1Pwd"];
            var host = WebConfigurationManager.AppSettings["EmailAccount1Host"];
            string subject = create ? "VOTRE COMPTE D'ECOLED A ÉTÉ CRÉÉ" : "LE MOT DE PASSE A ÉTÉ MODIFIÉ";
            NetMails.SendMailWithAttachement(subject, from, emailBody, oneUser.Email, fromPwd, null, true, null, host);

            if (!string.IsNullOrEmpty(oneUser.Cellphone))
            {
                var oneSms = new SMS_Message
                {
                    sms_subject = subject,
                    sms_telnumber = oneUser.Cellphone,
                    sms_appGuid = WebConfigurationManager.AppSettings["smsclientguid"],
                    sms_content = content,
                    sms_d_creation = DateTime.Now,
                    sms_d_send = DateTime.Now
                };
                SendSms.SendMessage(oneSms);
            }
        }

        private bool EmailIsValid(string emailaddress)
        {
            try
            {
                MailAddress m = new MailAddress(emailaddress);
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSubCommercial()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = UserServices.GetSubCommercial(connectedUser.Soc_id, connectedUser.Id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetUserPageRight(string pageName, string parentName)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = UserServices.GetPageRight(connectedUser.Id, pageName, parentName);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion User

        #region WareHouse

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetWareHousesList()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.GetWareHousesList();
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetShelvesInWhsList(int whsId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.GetShelvesInWhsList(whsId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllShelvesList()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.GetAllShelvesList();
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductInShelves(int sheId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.GetProductInShelves(sheId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CreateSrvFromLogistic(string lgsId, string receiveTime, List<LogisticsLine> lines)
        {
            User connectedUser;
            int lgs_id = IntTryParse(lgsId, "lgsId");
            var receiveDate = GetDateTimeOrNow(receiveTime).Value;
            if (CheckAuthentication(out connectedUser))
            {
                WarehouseService.CreateSrvFromLogistic(connectedUser.Soc_id, lgs_id, connectedUser.Id, receiveDate, lines);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CreateUpdateWarehouse(WareHouse whs)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                WarehouseService.CreateUpdateWarehouse(whs);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void DeleteWareHouse(int whsId)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                WarehouseService.DeleteWareHouse(whsId);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CreateUpdateShelve(Shelves she)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                WarehouseService.CreateUpdateShelve(she);
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CreateSrvDirectAndChangeInventory(ShippingReceiving srvForm, List<ShippingReceivingLine> lines)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                srvForm.UsrCreatorId = connectedUser.Id;
                WarehouseService.CreateSrvDirect(srvForm, lines);
            }
            else
            {
            }
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchVoucher(string client, string produit, int whsId, int sheId, DateTime? from, DateTime? to)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.SearchVoucher(client, produit, whsId, sheId, from, to);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSrv(string srvId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var srv_id = IntTryParse(srvId, "srvId");
                var value = WarehouseService.LoadShippingReceiving(srv_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion WareHouse

        #region Inventory

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetPitForInventory()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = ProductServices.GetPitForInventory(connectedUser.Soc_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetProductShelves(int invId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = WarehouseService.GetProductShelves(invId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public void CreateInventory(int prdId, int pitId, string prdName, string des)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                WarehouseService.UpdateInventoryDirectly(prdId, pitId, prdName, 0, 0, des);
            }
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchPitForInventory(int ptyId, string prdinfo, bool notZero)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = ProductServices.SearchPitForInventory(connectedUser.Soc_id, ptyId, prdinfo, notZero);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Inventory

        #region Message

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateToDo(MessageItem msgItem)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                msgItem.DCreation = DateTime.Now;
                var oneMsg = new Message
                {
                    IsToDo = true,
                    IsMemo = false,
                    DCreation = DateTime.Now,
                    UsrId = connectedUser.Id,
                    FkName = null,
                    FkId = null,
                    Id = msgItem.MsgId,
                    AllMessages = new List<MessageItem>
                    {
                        msgItem
                    }
                };
                var value = MessageServices.CreateUpdateMessage(oneMsg, false);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string UpdateToDoStatus(MessageItem msgItem)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                msgItem.DCreation = DateTime.Now;
                var oneMsg = new Message
                {
                    IsToDo = true,
                    IsMemo = false,
                    DCreation = DateTime.Now,
                    UsrId = connectedUser.Id,
                    FkName = null,
                    FkId = null,
                    Id = msgItem.MsgId,
                    AllMessages = new List<MessageItem>
                    {
                        msgItem
                    }
                };
                var value = MessageServices.CreateUpdateMessage(oneMsg, true);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteMessage(MessageItem msgItem)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                msgItem.DCreation = DateTime.Now;
                var oneMsg = new Message
                {
                    IsToDo = true,
                    IsMemo = false,
                    DCreation = DateTime.Now,
                    UsrId = connectedUser.Id,
                    FkName = null,
                    FkId = null,
                    Id = msgItem.MsgId,
                    AllMessages = new List<MessageItem>
                    {
                        msgItem
                    }
                };
                var value = MessageServices.DeleteMessage(oneMsg);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetMessage(int type)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = MessageServices.GetMessage(connectedUser.Id, type);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion Message

        #region Calendar

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetComingEvents()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                List<Entities.Calendar> table1 = CalendarServices.GetComingEvents(connectedUser.Id);
                returnvalue = Serialize(table1);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Calendar

        #region User Comment

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateCplUserFlag(string cplId, string flag, bool delete)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cpl_id = IntTryParse(cplId, "cplId");
                var value = UserHServices.CreateUpdateUserFlag(connectedUser.Id, "cpl_id", cpl_id, flag, delete);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetUserCplFlag(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cpl_id = IntTryParse(cplId, "cplId");
                var value = UserHServices.GetCostPlanFlag(connectedUser.Id, cpl_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetUserCplComment(string cplId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cpl_id = IntTryParse(cplId, "cplId");
                var value = UserHServices.GetCostPlanComment(connectedUser.Id, cpl_id);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateCplUserComment(string cplId, string comment, bool delete)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var cpl_id = IntTryParse(cplId, "cplId");
                var value = UserHServices.CreateUpdateUserComment(connectedUser.Id, "cpl_id", cpl_id, comment, delete);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion User Comment

        #region Site Project

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllSiteProjects()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = SiteProjectServices.GetAllSiteProjects(null);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateUpdateSiteProject(SiteProject onePrj)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = SiteProjectServices.CreateUpdateSiteProject(onePrj);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string CreateProjectProduct(int prjId, int prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                SiteProjectServices.CreateProjectProduct(prjId, prdId);
                var value = SiteProjectServices.GetAllSiteProjectProducts(prjId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllSiteProjectProducts(int prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var value = SiteProjectServices.GetAllSiteProjectProducts(prjId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteProjectProduct(int prjId, int prdId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                SiteProjectServices.DeleteProjectProduct(prjId, prdId);
                var value = SiteProjectServices.GetAllSiteProjectProducts(prjId);
                returnvalue = Serialize(value);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSiteProjectImages(int prjId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SiteProjectServices.GetAllSiteProjectImages(prjId).ToList();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string DeleteSiteProjectImages(int prjId, int pigId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = SiteProjectServices.CreateUpdateDeleteImage(prjId, pigId, 0, null, true);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Site Project

        #region Society

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCurrentSociety()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var isAdmin = UserServices.IsAdmin(connectedUser.Soc_id, connectedUser.Id, true);
                if (isAdmin)
                {
                    var society = SocietyServices.LoadSocietyById(connectedUser.Soc_id);
                    returnvalue = Serialize(society);
                }
                else
                {
                    returnvalue = Serialize("-2");
                }
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        /// <summary>
        /// 获得CinLgs
        /// </summary>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSocCinLgs()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var society = SocietyServices.LoadSocietyById(connectedUser.Soc_id);
                returnvalue = Serialize(society.SocCinLgs);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetHeaderFooter()
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var isAdmin = UserServices.IsAdmin(connectedUser.Soc_id, connectedUser.Id, true);
                if (isAdmin)
                {
                    var society = CommonServices.GetHeaderFooter();
                    returnvalue = Serialize(society);
                }
                else
                {
                    returnvalue = Serialize("-2");
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
        public void UpdateSocietyAndHeaderFooter(Society soc, HeaderFooterText headerfooter)
        {
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                soc.Id = connectedUser.Soc_id;
                SocietyServices.CreateUpdateSociety(soc);
                CommonServices.UpdateHeaderFooter(headerfooter);
            }
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetCurrency()
        {
            string returnvalue = string.Empty;
            Entities.User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var society = SocietyServices.GetCurrency(connectedUser.Soc_id);
                returnvalue = Serialize(society);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string UpdateCurrencyEx(decimal usdmad)
        {
            var listCurrency = new List<Currencies>();
            var _ExchangeUrl = "ExchangeUrl";
            string url = WebConfigurationManager.AppSettings[_ExchangeUrl];
            try
            {
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception)
            {
            }
            try
            {
                //url = WebConfigurationManager.AppSettings[_ExchangeUrl];
                url = string.Format("{0}index_1.html", url);
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception)
            {
            }
            if (usdmad > 0)
            {
                var exUsdMad = new Currencies
                {
                    Name = "摩洛哥迪拉姆",
                    SellingRate = usdmad
                };
                listCurrency.Add(exUsdMad);
            }
            try
            {
                SocietyServices.UpdateCurrency(listCurrency);
            }
            catch (Exception)
            {
            }
            return Serialize("0");
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
        #endregion Society

        #region Consignee

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadConsigneById(string conId)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {

                int conid = IntTryParse(conId, "conId");
                if (conid != 0)
                {
                    var values = ConsigneeServices.LoadConsigneeByConId(conid);
                    returnvalue = Serialize(values);
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
        public string CreateUpdateConsignee(Consignee oneConsignee)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                int conid = IntTryParse(oneConsignee.FConId, "conId");
                oneConsignee.ConId = conid;
                oneConsignee.DateCreation = DateTime.Now;
                oneConsignee.UsrCreatedBy = connectedUser.Id;
                oneConsignee.SocId = connectedUser.Soc_id;
                oneConsignee.DateUpdate = DateTime.Now;
                var cco = ConsigneeServices.CreateUpdateConsigne(oneConsignee);
                returnvalue = Serialize(cco);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchConsignee(Consignee oneCon)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                oneCon.SocId = connectedUser.Soc_id;
                var cco = ConsigneeServices.SearchConsignee(oneCon);
                returnvalue = Serialize(cco);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        //[WebMethod]
        //[ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        //public string LoadContactClientByCcoId(string ccoId)
        //{
        //    string returnvalue = string.Empty;
        //    if (CheckAuthentication())
        //    {
        //        int cco_id = 0;
        //        try
        //        {
        //            var strccoId = StringCipher.DecoderSimple(ccoId.UrlDecode2String(), "ccoId");
        //            cco_id = Convert.ToInt32(strccoId);
        //        }
        //        catch (Exception)
        //        {
        //        }
        //        if (cco_id != 0)
        //        {
        //            var values = ContactClientServices.LoadContactClientByCcoId(cco_id);
        //            returnvalue = Serialize(values);
        //        }
        //    }
        //    else
        //    {
        //        returnvalue = Serialize("-1");
        //    }
        //    return returnvalue;
        //}



        // 20200713 新功能，加快搜索Avoir速度
        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetConsigneeByKeyword(string keyword)
        {
            string returnvalue = string.Empty;
            User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                var values = ConsigneeServices.GetConsigneeByKeyword(keyword, connectedUser.Soc_id);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }


        #endregion Consignee

        #region 供货商登录

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string SearchSupplierOrderSup(PurchaseBaseClass sod)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                DateTime createDateFrom = GetDateTime1900(sod._DateStartProduction);
                DateTime createDateTo = GetDateTime2500(sod._DateCompleteProduction);
                sod.DateCreation = createDateFrom;
                sod.DateUpdate = createDateTo;
                sod.SupId = connectedUser.Id;
                var values = PurchaseBaseServices.SearchSupplierOrderForSup(sod);
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllCurrencySup()
        {
            string returnvalue;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                var values = CommonServices.GetAllCurrency();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetAllTVASup()
        {
            string returnvalue;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                var values = CommonServices.GetAllTVA();
                returnvalue = Serialize(values);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSodSup(string itemId)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                int id = IntTryParse(itemId, "sodId");
                if (id != 0)
                {
                    var values = PurchaseBaseServices.LoadSupplierOrderSup(id, connectedUser.Id);
                    returnvalue = Serialize(values);
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
        public string GetSodPaymentsListSup(string sodId)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                var sodid = IntTryParse(sodId.UrlDecode2String(), "sodId");
                var spr = PurchaseBaseServices.GetSodPaymentsListSup(connectedUser.Id, sodid);
                returnvalue = Serialize(spr);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string LoadSolsSup(string sodId)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                int _id = IntTryParse(sodId, "sodId");
                if (_id != 0)
                {
                    var values = PurchaseBaseLineServices.LoadSolsSup(connectedUser.Id, _id);
                    returnvalue = Serialize(values);
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
        public string GetPitByRefSup(string pitRef, string prdId)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                int prd_id = 0;
                try
                {
                    var strcliId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
                try
                {
                    if (prd_id != 0)
                    {
                        var values = ProductServices.GetPitByRefSup(pitRef, prd_id, connectedUser.Id);
                        returnvalue = Serialize(values);
                    }
                    else
                    {
                        returnvalue = Serialize("NO_PRD_ID");
                    }
                }
                catch (Exception)
                {
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
        public string GetCurrentSupplierInfo()
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            returnvalue = CheckAuthenticationSup(out connectedUser) ? Serialize(connectedUser) : Serialize("-1");
            return returnvalue;
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public string GetSodDocListForSup(string sodId)
        {

            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                int _id = IntTryParse(sodId, "sodId");
                if (_id != 0)
                {
                    var sodid = IntTryParse(sodId.UrlDecode2String(), "sodId");
                    var spr = PurchaseBaseServices.GetSodDocListForSup(connectedUser.Id, sodid);
                    returnvalue = Serialize(spr);
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
        public string GetAllSodCmtForSup(string sodId)
        {
            string returnvalue = string.Empty;
            Supplier connectedUser;
            if (CheckAuthenticationSup(out connectedUser))
            {
                var sodid = IntTryParse(sodId, "sodId");
                var ctaList = PurchaseBaseServices.GetAllSodCmt(sodid).Where(l => l.Actived).ToList();
                returnvalue = Serialize(ctaList);
            }
            else
            {
                returnvalue = Serialize("-1");
            }
            return returnvalue;
        }

        #endregion 供货商登录
    }
}
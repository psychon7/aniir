using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web;
using System.Web.Configuration;
using System.Web.Script.Serialization;
using System.Web.Security;
using System.Web.UI;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories;
using ERP.Repositories.Shared;
using ERP.SharedServices.BarCode;
using ERP.Web.Shared;
using Gma.QrCodeNet.Encoding;
using Gma.QrCodeNet.Encoding.Windows.Render;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Image = iTextSharp.text.Image;
using Rectangle = System.Drawing.Rectangle;

namespace ERP.SiteNC202310.BasePage
{
    public class BasePage : Page
    {

        private DataServices.UserServices UserServices { get; set; }
        private SupplierServices SupplierServices { get; set; }
        public static CultureInfo culture = new CultureInfo("fr-FR", true);
        public static string _pdfVersion = WebConfigurationManager.AppSettings["_pdfVersion"];
        public BasePage()
        {
            CultureInfo current = Thread.CurrentThread.CurrentUICulture;
            if (current.TwoLetterISOLanguageName != "fr")
            {
                Thread.CurrentThread.CurrentCulture = culture;
                Thread.CurrentThread.CurrentUICulture = culture;
            }
            if (UserServices != null)
            {
                UserServices = new UserServices();
            }
        }

        #region variable prive
        private static User _currentUser;
        private static Supplier _currentSup;
        private static Society _society;
        #endregion variable prive

        public static User CurrentUser
        {
            get { return _currentUser; }
            set { _currentUser = value; }
        }

        public static Society CurrentSoc
        {
            get { return _society; }
            set { _society = value; }
        }

        public static Supplier CurrentSup
        {
            get { return _currentSup; }
            set { _currentSup = value; }
        }

        protected override void OnInit(EventArgs e)
        {
            SetPreviousUrl(this.Request.Url.AbsoluteUri);
            var authCookie = FormsAuthentication.FormsCookieName;
            if (Request.Cookies[authCookie] != null)
            {
                string cookie = Request.Cookies[authCookie].Value;
                try
                {
                    FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(cookie);
                    var usrData = ticket.UserData.Split(new string[] { "#S#" }, StringSplitOptions.None).ToList();
                    if (usrData.Count > 5)
                    {
                        // User 登录
                        _currentUser = new User();
                        ticket.UserData.DecodeTicket(_currentUser);

                        if (UserServices == null)
                        {
                            UserServices = new UserServices();
                        }

                        if (_currentUser != null)
                        {
                            string[] splitString = this.Request.RawUrl.Split(new char[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                            string url = splitString[splitString.Length - 1].Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries)[0];
                            string parentScreen = string.Empty;
                            if (splitString.Length >= 2)
                            {
                                parentScreen = splitString[splitString.Length - 2];
                            }
                            string url2 = url;
                            try
                            {
                                parentScreen = string.IsNullOrEmpty(parentScreen) ? null : parentScreen;
                                var userRight = UserServices.GetPageRight(_currentUser.Id, url, parentScreen);
                                if (splitString[splitString.Length - 1].Split(new char[] { '.' }).Length > 1)
                                {
                                    if (splitString[splitString.Length - 1].Contains("?"))
                                    {
                                        var paramString = splitString[splitString.Length - 1].Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries)[1].Split(new char[] { '?' }, StringSplitOptions.RemoveEmptyEntries);
                                        string moduleId = string.Empty;
                                        if (paramString.Length > 1)
                                        {
                                            moduleId = paramString[1];
                                            string[] ids = moduleId.Split(new char[] { '&' }, StringSplitOptions.RemoveEmptyEntries);

                                            if (ids.Length > 0)
                                            {
                                                Dictionary<string, string> values = ids.ToDictionary(p => p.Split(new char[] { '=' })[0], o => o.Split(new char[] { '=' })[1]);
                                            }
                                        }
                                    }
                                }

                                if (CurrentSoc == null)
                                {
                                    SocietyServices SocietyServices = new SocietyServices();
                                    _society = SocietyServices.LoadSocietyById(_currentUser.Soc_id);
                                }
                            }
                            catch (Exception ex)
                            {
                                LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                            }
                        }
                        else
                        {
                            Response.Redirect("~/Account/Login.aspx");
                        }
                    }
                    else
                    {
                        // Supplier 登录
                        _currentSup = new Supplier();
                        ticket.UserData.DecodeTicketSup(_currentSup);

                        if (SupplierServices == null)
                        {
                            SupplierServices = new SupplierServices();
                        }
                        if (_currentSup != null)
                        {
                            //string[] splitString = this.Request.RawUrl.Split(new char[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                            //string url = splitString[splitString.Length - 1].Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries)[0];
                            //string parentScreen = string.Empty;
                            //if (splitString.Length >= 2)
                            //{
                            //    parentScreen = splitString[splitString.Length - 2];
                            //}
                            //string url2 = url;
                            //try
                            //{
                            //    parentScreen = string.IsNullOrEmpty(parentScreen) ? null : parentScreen;
                            //    var userRight = UserServices.GetPageRight(_currentUser.Id, url, parentScreen);
                            //    if (splitString[splitString.Length - 1].Split(new char[] { '.' }).Length > 1)
                            //    {
                            //        if (splitString[splitString.Length - 1].Contains("?"))
                            //        {
                            //            var paramString = splitString[splitString.Length - 1].Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries)[1].Split(new char[] { '?' }, StringSplitOptions.RemoveEmptyEntries);
                            //            string moduleId = string.Empty;
                            //            if (paramString.Length > 1)
                            //            {
                            //                moduleId = paramString[1];
                            //                string[] ids = moduleId.Split(new char[] { '&' }, StringSplitOptions.RemoveEmptyEntries);

                            //                if (ids.Length > 0)
                            //                {
                            //                    Dictionary<string, string> values = ids.ToDictionary(p => p.Split(new char[] { '=' })[0], o => o.Split(new char[] { '=' })[1]);
                            //                }
                            //            }
                            //        }
                            //    }
                            //}
                            //catch (Exception ex)
                            //{
                            //    LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                            //}
                        }
                        else
                        {
                            Response.Redirect("~/Account/Login.aspx");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Response.Redirect("~/Account/Login.aspx");
                }
            }
            else
            {
                Response.Redirect("~/Account/Login.aspx");
            }
        }

        /// <summary>
        /// définie l'url précédent
        /// </summary>
        protected void SetPreviousUrl(string requestedUrl)
        {
            if (Session["_currentUrl"] == null && Session["_previousUrl"] == null)
            {
                Session["_currentUrl"] = Session["_previousUrl"] = requestedUrl;
            }
            else
            {
                if (!requestedUrl.Equals(Session["_currentUrl"].ToString().Replace("%20", "+")))
                {
                    Session["_previousUrl"] = Session["_currentUrl"];
                    Session["_currentUrl"] = requestedUrl;
                }
            }
        }

        /// <summary>
        /// récupère l'url précédent
        /// </summary>
        /// <returns>l'url précédent</returns>
        public string GetPreviousUrl()
        {
            return Session["_previousUrl"].ToString();
        }

        public T GetFiledValue<T>(string name)
        {
            var value = Request.Form[name];
            T valuereturn;

            if (typeof(T) == typeof(decimal))
            {
                valuereturn = (T)Convert.ChangeType(value.Replace(".", ",").Replace(" ", ""), typeof(T), culture);
            }
            else if (typeof(T) == typeof(bool))
            {
                valuereturn = (T)Convert.ChangeType(value == "on" || value == "1", typeof(T), culture);
            }
            else
            {
                if (typeof(T) == typeof(Int32))
                {
                    if (string.IsNullOrEmpty(value))
                    {
                        value = "0";
                    }
                }
                valuereturn = (T)Convert.ChangeType(value, typeof(T));
            }
            return valuereturn;
        }

        public T GetFiledValueWithType<T>(string name, T type, Type valueType)
        {
            var value = Request.Form[name];
            T valuereturn;

            if (type is decimal)
            {
                valuereturn = (T)Convert.ChangeType(value.Replace(".", ",").Replace(" ", ""), valueType, culture);
            }
            else if (type is bool)
            {
                valuereturn = (T)Convert.ChangeType(value == "on", valueType, culture);
            }
            else
            {
                if (type is Int32 || type is int)
                {
                    if (string.IsNullOrEmpty(value))
                    {
                        value = "0";
                    }
                }
                if (valueType.IsGenericType && valueType.GetGenericTypeDefinition() == typeof(Nullable<>))
                {
                    if (value == "on")
                    {
                        valuereturn = (T)Convert.ChangeType(value == "on", typeof(bool), culture);
                    }
                    else
                    {
                        TypeConverter conv = TypeDescriptor.GetConverter(valueType);
                        valuereturn = (T)conv.ConvertFrom(null, culture, value);
                    }
                }
                else
                {
                    valuereturn = (T)Convert.ChangeType(value, valueType);
                }
            }
            return valuereturn;
        }

        public static byte[] AddPageNumbers(byte[] pdf, Society society, string code2Add = null, bool leftside = false, string pdfVersion = null, bool withPageNumber = true, bool leftsideWithPageNumber = false)
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
            if (string.Equals(_pdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
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
                if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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
                    if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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

                if (string.Equals(_pdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
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
                    if (string.Equals(_pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, leftside ? 20 : 520, 25, 0);
                    }
                    else if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, 20, 12, 0);
                    }
                    else
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, newcode, leftside ? 20 : 520, 25, 0);
                    }
                }


                // 右侧面文字
                if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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

        public static byte[] AddPageCode(byte[] pdf, Society society, string code2Add, string qrCodestr = null)
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

                int compInfoSpance;

                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, code2Add, 520, 25, 0);

                cb.EndText();
            }


            // qrCode 二维码
            if (string.Equals(_pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(qrCodestr))
            {
                QrEncoder qrEncoder = new QrEncoder(Gma.QrCodeNet.Encoding.ErrorCorrectionLevel.H);
                QrCode qrCode = new QrCode();
                string info = string.Format("{0}\r\n{1}\r\n{2}", society.Society_Name, qrCodestr, code2Add);
                qrEncoder.TryEncode(info, out qrCode);

                GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                MemoryStream qrStream = new MemoryStream();
                renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                var qrcodeimage = qrStream.ToArray();
                if (qrcodeimage != null)
                {
                    iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(qrcodeimage);
                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                    cb.AddImage(qrJpg, 50, 0, 0, 50, 522, 780);

                }
            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        private static string _imageLogoPath = "/img/logo/logo-Pdf.png";
        private static string _imageSealPath = "/img/logo/logo-seal.png";

        public static byte[] AddLog2Page(byte[] pdf, string path, string codeBar = null, string pdfVersion = null, Society society = null, string qrname = null)
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
            if (string.Equals(pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
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
            else if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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
                    if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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
            if (string.Equals(pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
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
            else if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
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
            if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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

                    if (string.Equals(pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        cb.AddImage(jpg_logo, 129, 0, 0, 129, 15, 737);
                        cb.AddImage(logoSeal, 110, 0, 0, 110, 440, 50);
                    }
                    else if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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
                    if (string.Equals(pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        //cb.AddImage(qrJpg, 图像宽度, 0, 0, 图像高度, 左边距, 下边距);
                        if (qrJpg != null)
                        {
                            cb.AddImage(qrJpg, 130, 0, 0, 20, 20, 0);
                        }
                    }
                    else if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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
                    if (string.Equals(pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
                    {
                        if (qrCodeJpg != null)
                        {
                            cb.AddImage(qrCodeJpg, 50, 0, 0, 50, 522, 780);
                        }
                    }
                    else if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase) && society != null && !string.IsNullOrEmpty(codeBar))
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
                    if (string.Equals(pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
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

        #region Property
        // requires object instance, but you can skip specifying T
        public static string GetPropertyName<T>(Expression<Func<T>> exp)
        {
            return (((MemberExpression)(exp.Body)).Member).Name;
        }
        // requires explicit specification of both object type and property type
        public static string GetPropertyName<TObject, TResult>(Expression<Func<TObject, TResult>> exp)
        {
            // extract property name
            return (((MemberExpression)(exp.Body)).Member).Name;
        }
        // requires explicit specification of object type
        public static string GetPropertyName<TObject>(Expression<Func<TObject, object>> exp)
        {
            var body = exp.Body;
            var convertExpression = body as UnaryExpression;
            if (convertExpression != null)
            {
                if (convertExpression.NodeType != ExpressionType.Convert)
                {
                    throw new ArgumentException("Invalid property expression.", "exp");
                }
                body = convertExpression.Operand;
            }
            return ((MemberExpression)body).Member.Name;
        }
        #endregion Property

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

        public static string Serialize<T>(T data)
        {
            JavaScriptSerializer jss = new JavaScriptSerializer();
            string json = jss.Serialize(data);
            return json;
        }

        public static DateTime? GetDateTimeOrNow(string dateTime, bool isNullable = false)
        {
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

        public static int IntTryParse(object id, string key)
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

        public static byte[] ImageToByte(Image img)
        {
            ImageConverter converter = new ImageConverter();
            return (byte[])converter.ConvertTo(img, typeof(byte[]));
        }

        public static byte[] BitmapToByteArray(Bitmap bitmap)
        {
            BitmapData bmpdata = null;
            try
            {
                bmpdata = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height), ImageLockMode.ReadOnly, bitmap.PixelFormat);
                int numbytes = bmpdata.Stride * bitmap.Height;
                byte[] bytedata = new byte[numbytes];
                IntPtr ptr = bmpdata.Scan0;

                Marshal.Copy(ptr, bytedata, 0, numbytes);

                return bytedata;
            }
            finally
            {
                if (bmpdata != null)
                    bitmap.UnlockBits(bmpdata);
            }

        }
    }
}
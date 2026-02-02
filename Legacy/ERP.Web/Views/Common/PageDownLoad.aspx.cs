using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Linq.Dynamic;
using System.Web;
using System.Web.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories;
using ERP.Web.Shared;
using Gma.QrCodeNet.Encoding;
using Gma.QrCodeNet.Encoding.Windows.Render;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace ERP.Web.Views.Common
{
    public partial class PageDownLoad : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            //var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrl"];
            // 20241119 Comment out the code, no need fich tech
            var DownloadTechSheetUrl = string.Empty;
            var PdfVersion = WebConfigurationManager.AppSettings["PdfVersion"];
            // 20231101 PdfVersion，Client表中，加入PdfVersion列，需要在生成的时候，再次加以判断，这样同一个系统就可以输出不同的version
            var propId = Request.QueryString["propId"];
            var pitId = Request.QueryString["pitId"];
            var prdId = Request.QueryString["prdId"];
            var cplId = Request.QueryString["cplId"];
            var codId = Request.QueryString["codId"];
            var dfoId = Request.QueryString["dfoId"];
            var cinId = Request.QueryString["cinId"];
            var sodId = Request.QueryString["sodId"];
            var pinId = Request.QueryString["pinId"];
            var lgsId = Request.QueryString["lgsId"];
            var getbl = Request.QueryString["getbl"];
            var forsup = Request.QueryString["forsup"];
            var type = Request.QueryString["type"];
            var hascplIds = Request.QueryString["hascplIds"];
            var hasprdIds = Request.QueryString["hasprdIds"];
            var cliId = Request.QueryString["cliId"];
            var datetime = Request.QueryString["datetime"];
            var enddate = Request.QueryString["enddate"];
            var comId = Request.QueryString["comId"];
            var SCin = Request.QueryString["SCin"];
            var pi = Request.QueryString["pi"];
            var wp = Request.QueryString["wp"]; // sod without price
            var dfoIds = Request.QueryString["dfoIds"]; // 20231106 同时下载多个BL
            var allcinIds = Request.QueryString["cinIds"]; // 20231106 同时下载多个Cin

            string _path = Server.MapPath("~");
            string filename = string.Empty;

            var withTechSheet = WebConfigurationManager.AppSettings["WithTechSheet"];
            bool _withtechsheet;
            bool.TryParse(withTechSheet, out _withtechsheet);

            SocietyServices SocietyServices = new SocietyServices();
            var society = SocietyServices.LoadSocietyById(CurrentUser.Soc_id);
            #region product instance
            if (!string.IsNullOrEmpty(propId) && (!string.IsNullOrEmpty(pitId) || !string.IsNullOrEmpty(prdId)))
            {
                // 下载商品以及商品instance 文件    
                //DownloadEnterpriseInscription();
                int pit_id = 0;
                int prd_id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(prdId.UrlDecode2String(), "prdId");
                    prd_id = Convert.ToInt32(strprdId);
                }
                catch (Exception)
                {
                }
                int.TryParse(pitId, out pit_id);
                ProductServices ProductServices = new ProductServices();
                string path = ProductServices.GetFilePathForDownLoad(prd_id, pit_id, CurrentUser.Soc_id, propId);
                if (File.Exists(path))
                {
                    DownloadEnterpriseInscription(path);
                }
            }
            #endregion product instance
            #region Tech sheet
            else if (!string.IsNullOrEmpty(prdId) && !string.IsNullOrEmpty(type))
            {
                if (type == "1")
                {
                    int _id = IntTryParse(prdId, "prdId");
                    ProductServices ProductServices = new ProductServices();
                    var oneprd = ProductServices.LoadProductById(_id, CurrentUser.Soc_id);

#if DEBUG
                    //oneprd.EntityColor = new EntityColor
                    //{
                    //    CorName = "Vert",
                    //    CorRed = 76,
                    //    CorGreen = 165,
                    //    CorBlue = 50,
                    //    SocId = 1
                    //};
#endif

                    MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet(_path, oneprd);
                    //MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                    byte[] pdfarray = output.ToArray();
                    //var normes = oneprd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Normes");
                    string normesStr = oneprd.PtyStandards;
                    byte[] newarray0 = AddLEDPageNumbers(pdfarray, society, normesStr);
                    AlbumServices AlbumServices = new AlbumServices();
                    string elaPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "800501-ELA");
                    string bgImg = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "background gradient");
                    //string elaPath = "img\\800501-ELA.png";
                    //string logoPath = "img\\logo-Pdf.png";
                    string color = oneprd.EntityColor != null ? (oneprd.EntityColor.Id == 1 ? "red" : oneprd.EntityColor.Id == 2 ? "green" : oneprd.EntityColor.Id == 3 ? "blue" : "grey") : "red";

#if DEBUG
                    //color = "green";
#endif

                    string logoPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, color, "logos");
                    //string rohsPath = "img\\rohs.png";
                    //string cePath = "img\\CE150_150.png";
                    //string weeePath = "img\\WEEE.png";
                    string rohsPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "Rohs");
                    string cePath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "CE");
                    string weeePath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "WEEE");
                    //string prdImgPath = oneprd.PrdImg;
                    byte[] newarray = AddLEDLogos2Page_V2(newarray0, _path, logoPath, elaPath, rohsPath, cePath, weeePath, bgImg, oneprd.PrdImgList, oneprd);
                    Response.Clear();
                    filename = string.Format("ECOLED Fiche Tech - {0}.pdf", oneprd.PrdRef);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
            }

            #endregion Tech sheet
            #region Tech sheet lots
            else if (!string.IsNullOrEmpty(hasprdIds))
            {
                try
                {
                    var prdIds = (string)Session["PdfTchShtPrdIds"];
                    if (!string.IsNullOrEmpty(prdIds))
                    {
                        List<byte[]> listallArray = new List<byte[]>();
                        var prd_ids = Enumerable.Select(prdIds.Split(',').ToList().Where(m => !string.IsNullOrEmpty(m)), m => Convert.ToInt32(m)).Distinct().ToList();
                        if (prd_ids.Any())
                        {
                            ProductServices ProductServices = new ProductServices();
                            foreach (var prd_id in prd_ids)
                            {
                                var oneprd = ProductServices.LoadProductById(prd_id, CurrentUser.Soc_id);
                                MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                                byte[] pdfarray = output.ToArray();
                                string normesStr = oneprd.PtyStandards;
                                byte[] newarray0 = AddLEDPageNumbers(pdfarray, society, normesStr);
                                AlbumServices AlbumServices = new AlbumServices();
                                string elaPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "800501-ELA");
                                string bgImg = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "background gradient");
                                string color = oneprd.EntityColor != null ? (oneprd.EntityColor.Id == 1 ? "red" : oneprd.EntityColor.Id == 2 ? "green" : oneprd.EntityColor.Id == 3 ? "blue" : "grey") : "red";
                                string logoPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, color, "logos");
                                string rohsPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "Rohs");
                                string cePath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "CE");
                                string weeePath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "WEEE");
                                //string prdImgPath = oneprd.PrdImg;
                                byte[] newarray = AddLEDLogos2Page_V2(newarray0, _path, logoPath, elaPath, rohsPath, cePath, weeePath, bgImg, oneprd.PrdImgList, oneprd);
                                listallArray.Add(newarray);
                            }
                            var allArray = mergePDFFilesNew(listallArray);
                            Response.Clear();
                            filename = string.Format("Lot-Fiche Technique.pdf");
                            string header = string.Format("inline; filename={0}", filename);
                            Response.AddHeader("Content-Length", allArray.Length.ToString());
                            Response.AddHeader("Content-Disposition", header);
                            Response.ContentType = "application/pdf";
                            Response.BinaryWrite(allArray);
                            Response.OutputStream.Flush();
                            Response.OutputStream.Close();
                        }
                    }
                    else
                    {
                        ClientScript.RegisterStartupScript(GetType(), "hwa", "alert('Session Expired');", true);
                    }
                }
                catch (Exception)
                {
                }
            }
            #endregion Tech sheet lots
            #region costplan
            else if (!string.IsNullOrEmpty(cplId))
            {
                // cost plan
                int cpl_id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(cplId.UrlDecode2String(), "cplId");
                    int.TryParse(strprdId, out cpl_id);
                    CostPlanServices CostPlanServices = new CostPlanServices();
                    var onecpl = CostPlanServices.LoadCostPlanById(cpl_id, CurrentUser.Soc_id, CurrentUser.Id, true);
                    var _pdfVs = onecpl.CplClient.CliPdfVersion;
                    if (!string.IsNullOrEmpty(_pdfVs))
                    {
                        PdfVersion = _pdfVs;
                    }
                    MemoryStream output;
                    if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = ERP.SharedServices.PDF.PDFGenerator.PdfCpl_HK02(_path, onecpl, DownloadTechSheetUrl, _withtechsheet);
                    }
                    else
                    {
                        output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDevis(_path, onecpl, DownloadTechSheetUrl, _withtechsheet);
                    }
                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onecpl.CplCode, pdfVersion: PdfVersion);
                    byte[] newarray = AddLog2Page(newarray0, _path, onecpl.CplCode);
                    Response.Clear();
                    var companyname = onecpl.ClientCompanyName;
                    companyname = companyname.Replace(",", "");
                    filename = string.Format("{1}-{0}.pdf", onecpl.CplCode, companyname);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                catch (Exception)
                {
                }
            }

            #endregion costplan
            #region costplan list
            else if (!string.IsNullOrEmpty(hascplIds))
            {
                try
                {
                    var cplIds = (string)Session["PdfCplIds"];
                    if (!string.IsNullOrEmpty(cplIds))
                    {
                        List<byte[]> listallArray = new List<byte[]>();
                        var cpl_ids = Enumerable.Select(cplIds.Split(',').ToList().Where(m => !string.IsNullOrEmpty(m)), m => Convert.ToInt32(m)).Distinct().ToList();
                        if (cpl_ids.Any())
                        {
                            CostPlanServices CostPlanServices = new CostPlanServices();
                            foreach (var cpl_id in cpl_ids)
                            {
                                var onecpl = CostPlanServices.LoadCostPlanById(cpl_id, CurrentUser.Soc_id, CurrentUser.Id, true);
                                MemoryStream output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForDevis(_path, onecpl, DownloadTechSheetUrl);
                                byte[] pdfarray = output.ToArray();
                                byte[] newarray0 = AddPageNumbers(pdfarray, society, onecpl.CplCode, pdfVersion: PdfVersion);
                                byte[] newarray = AddLog2Page(newarray0, _path, onecpl.CplCode);
                                listallArray.Add(newarray);
                            }
                            var allArray = mergePDFFilesNew(listallArray);
                            Response.Clear();
                            filename = string.Format("Export Devis Liste.pdf");
                            string header = string.Format("inline; filename={0}", filename);
                            Response.AddHeader("Content-Length", allArray.Length.ToString());
                            Response.AddHeader("Content-Disposition", header);
                            Response.ContentType = "application/pdf";
                            Response.BinaryWrite(allArray);
                            Response.OutputStream.Flush();
                            Response.OutputStream.Close();
                        }
                    }
                    else
                    {
                        ClientScript.RegisterStartupScript(GetType(), "hwa", "alert('Session Expired');", true);
                    }
                }
                catch (Exception)
                {
                }
            }
            #endregion costplan list
            #region client order
            else if (!string.IsNullOrEmpty(codId))
            {
                // client order
                int cod_id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(codId.UrlDecode2String(), "codId");
                    int.TryParse(strprdId, out cod_id);
                    ClientOrderServices ClientOrderServices = new ClientOrderServices();
                    var onecod = ClientOrderServices.LoadClientOrderById(cod_id, CurrentUser.Soc_id, CurrentUser.Id, true);
                    var _pdfVs = onecod.OneClient.CliPdfVersion;
                    if (!string.IsNullOrEmpty(_pdfVs))
                    {
                        PdfVersion = _pdfVs;
                    }
                    MemoryStream output; // = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientOrder(_path, onecod, DownloadTechSheetUrl, _withtechsheet);
                    if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        // 20230615 hk02新模式
                        output = ERP.SharedServices.PDF.PDFGenerator.PdfCod_HK02(_path, onecod, DownloadTechSheetUrl, _withtechsheet);
                    }
                    else
                    {
                        output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientOrder(_path, onecod, DownloadTechSheetUrl, _withtechsheet, society);
                    }

                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onecod.CodCode, pdfVersion: PdfVersion);
                    byte[] newarray = AddLog2Page(newarray0, _path, onecod.CodCode);
                    Response.Clear();
                    var companyname = onecod.ClientCompanyName;
                    companyname = companyname.Replace(",", "");
                    filename = string.Format("{1}-{0}.pdf", onecod.CodCode, companyname);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                catch (Exception)
                {
                }
            }

            #endregion client order
            #region delivery form
            else if (!string.IsNullOrEmpty(dfoId))
            {
                // delivery form
                int _id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(dfoId.UrlDecode2String(), "dfoId");
                    int.TryParse(strprdId, out _id);
                    DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
                    var onecod = DeliveryFormServices.LoadDeliveryFormById(_id, CurrentUser.Soc_id, CurrentUser.Id, true);
                    var _pdfVs = onecod.OneClient.CliPdfVersion;
                    if (!string.IsNullOrEmpty(_pdfVs))
                    {
                        PdfVersion = _pdfVs;
                    }
                    MemoryStream output;
                    if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm_VS001(_path, onecod);
                    }
                    else
                    {
                        output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm(_path, onecod, society);
                    }

                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onecod.DfoCode, (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase)), pdfVersion: PdfVersion);
                    //byte[] newarray = AddLog2Page(newarray0, _path, onecod.DfoCode);

                    byte[] newarray;
                    if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                    {
                        newarray = newarray0;
                    }
                    else
                    {
                        newarray = AddLog2Page(newarray0, _path, onecod.DfoCode);
                    }
                    Response.Clear();

                    var companyname = onecod.ClientCompanyName;
                    companyname = companyname.Replace(",", "");
                    filename = string.Format("{0}-{1}.pdf", onecod.DfoCode, companyname);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                catch (Exception ex)
                {
                }
            }
            else if (!string.IsNullOrEmpty(dfoIds))
            {
                // delivery form
                int _id = 0;
                try
                {
                    var eachIds = dfoIds.Split(new string[] { "," }, StringSplitOptions.None).AsQueryable().Select(l => l.Trim()).Where(l => !string.IsNullOrEmpty(l)).Select(l => int.Parse(l)).OrderBy(l => l).ToList();
                    DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();

                    if (eachIds.Any())
                    {
                        List<byte[]> listallArray = new List<byte[]>();
                        foreach (var onedfoId in eachIds)
                        {
                            MemoryStream outputDfo = null;
                            //SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice(_path, thiscin, society, DownloadTechSheetUrl, _withtechsheet);

                            var onecod = DeliveryFormServices.LoadDeliveryFormById(onedfoId, CurrentUser.Soc_id, CurrentUser.Id, true);
                            var _pdfVs = onecod.OneClient.CliPdfVersion;
                            if (!string.IsNullOrEmpty(_pdfVs))
                            {
                                PdfVersion = _pdfVs;
                            }
                            MemoryStream output;
                            if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                            {
                                output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm_VS001(_path, onecod);
                            }
                            else
                            {
                                output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm(_path, onecod, society);
                            }

                            byte[] pdfarray = output.ToArray();
                            byte[] newarray0 = AddPageNumbers(pdfarray, society, onecod.DfoCode, (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase)), pdfVersion: PdfVersion);
                            //byte[] newarray = AddLog2Page(newarray0, _path, onecod.DfoCode);

                            byte[] newarray;
                            if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                            {
                                newarray = newarray0;
                            }
                            else
                            {
                                newarray = AddLog2Page(newarray0, _path, onecod.DfoCode);
                            }
                            listallArray.Add(newarray);
                        }

                        var allArray = mergePDFFilesNew(listallArray);
                        //byte[] newarrayCin0 = AddPageNumbers(allArray, society, null, true, pdfVersion: PdfVersion);

                        //byte[] newarray0 = AddPageNumbers(pdfarray, titleBelow, true);
                        //byte[] newarray = AddLog2Page(newarray0, _path);

                        Response.Clear();
                        filename = string.Format("Liste de BL.pdf");
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", allArray.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(allArray);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                }
                catch (Exception ex)
                {
                }
            }

            #endregion delivery form
            #region client invoice
            else if (!string.IsNullOrEmpty(cinId))
            {
                // client invoice
                int _id = 0;
                try
                {
                    MemoryStream output;

                    var strprdId = StringCipher.DecoderSimple(cinId.UrlDecode2String(), "cinId");
                    var lgs_Id = IntTryParse(lgsId, "lgsId");

                    int.TryParse(strprdId, out _id);
                    ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
                    var onecin = ClientInvoiceServices.LoadClientInvoiceById(_id, CurrentUser.Soc_id, CurrentUser.Id, true, lgs_Id);
                    var _pdfVs = onecin.ClientForPdf.CliPdfVersion;
                    if (!string.IsNullOrEmpty(_pdfVs))
                    {
                        PdfVersion = _pdfVs;
                    }
                    if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice_VS001(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                    }
                    else if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfGCinMa(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                    }
                    else if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin_hk(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                    }
                    else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin_HK02(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                    }
                    else
                    {
                        output = SharedServices.PDF.PDFGenerator.PdfCin(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
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

                    Response.Clear();
                    var companyname = onecin.ClientCompanyName;
                    companyname = companyname.Replace(",", "");
                    filename = string.Format("{1}-{0}.pdf", onecin.CinCode, companyname);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                catch (Exception)
                {
                }
            }
            else if (!string.IsNullOrEmpty(allcinIds))
            {
                // client invoice
                int _id = 0;
                try
                {
                    var eachCinIds = allcinIds.Split(new string[] { "," }, StringSplitOptions.None).AsQueryable().Select(l => l.Trim()).Where(l => !string.IsNullOrEmpty(l)).Select(l => int.Parse(l)).OrderBy(l => l).ToList();
                    ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
                    int lgs_Id = 0;
                    if (eachCinIds.Any())
                    {
                        List<byte[]> listallArray = new List<byte[]>();
                        foreach (var oneCinId in eachCinIds)
                        {
                            MemoryStream output;
                            var onecin = ClientInvoiceServices.LoadClientInvoiceById(oneCinId, CurrentUser.Soc_id, CurrentUser.Id, true, lgs_Id);
                            var _pdfVs = onecin.ClientForPdf.CliPdfVersion;
                            if (!string.IsNullOrEmpty(_pdfVs))
                            {
                                PdfVersion = _pdfVs;
                            }
                            if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                            {
                                output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice_VS001(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                            }
                            else if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                            {
                                output = SharedServices.PDF.PDFGenerator.PdfGCinMa(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                            }
                            else if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                            {
                                output = SharedServices.PDF.PDFGenerator.PdfCin_hk(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                            }
                            else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                            {
                                output = SharedServices.PDF.PDFGenerator.PdfCin_HK02(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
                            }
                            else
                            {
                                output = SharedServices.PDF.PDFGenerator.PdfCin(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet, lgs_Id);
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
                            listallArray.Add(newarray);
                        }
                        var allArray = mergePDFFilesNew(listallArray);
                        Response.Clear();
                        filename = string.Format("Liste de facture.pdf");
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", allArray.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(allArray);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }

                }
                catch (Exception)
                {
                }
            }
            #endregion client invoice
            #region supplier order
            else if (!string.IsNullOrEmpty(sodId))
            {
                if (!string.IsNullOrEmpty(forsup))
                {
                    // supplier order without price
                    int _id = 0;
                    try
                    {
                        var strprdId = StringCipher.DecoderSimple(sodId.UrlDecode2String(), "sodId");
                        int.TryParse(strprdId, out _id);
                        PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
                        var onecin = PurchaseBaseServices.LoadSupplierOrder(CurrentUser.Soc_id, _id, true);
                        // 20220815 这里借用CsoList来显示Comment
                        if (onecin != null)
                        {
                            onecin.CsoList = PurchaseBaseServices.GetAllSodCmt(_id).Where(l => l.Actived).ToList();
                        }
                        MemoryStream output;
                        if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_WithoutP_hk(_path, onecin);
                        }
                        else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_WithoutP_hk02(_path, onecin);
                        }
                        else
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForSupplierOrderWithoutPrice(_path, onecin);
                        }
                        byte[] pdfarray = output.ToArray();
                        byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.SodCode);
                        byte[] newarray;//= AddLog2Page(newarray0, _path, onecin.SodCode);
                        if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                        {
                            string qrname = "采购订单 SUPPLIER ORDER";
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode, PdfVersion, society, qrname);
                        }
                        else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                        {
                            string qrname = "採購訂單 SUPPLIER ORDER";
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode, PdfVersion, society, qrname);
                        }
                        else
                        {
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode);
                        }
                        Response.Clear();
                        var abbreviation = onecin.TwoSupplier.Abbreviation;
                        abbreviation = abbreviation.Replace(",", "");
                        filename = string.Format("{0}-{1}-V{2}.pdf", onecin.SodCode, abbreviation, DateTime.Now.ToString("yyyyMMdd#HHmmss"));
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", newarray.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(newarray);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                    catch (Exception)
                    {
                    }
                }
                else
                {
                    // supplier order
                    int _id = 0;
                    try
                    {
                        var strprdId = StringCipher.DecoderSimple(sodId.UrlDecode2String(), "sodId");
                        int.TryParse(strprdId, out _id);
                        var lgs_Id = IntTryParse(lgsId, "lgsId");
                        PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
                        var onecin = PurchaseBaseServices.LoadSupplierOrder(CurrentUser.Soc_id, _id, true, lgs_Id);
                        // 20220815 这里借用CsoList来显示Comment
                        if (onecin != null)
                        {
                            onecin.CsoList = PurchaseBaseServices.GetAllSodCmt(_id).Where(l => l.Actived).ToList();
                        }

                        MemoryStream output;// = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForSupplierOrder(_path, onecin);
                        lgs_Id = (wp == "1") ? -1 : lgs_Id;
                        if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_hk(_path, onecin, lgs_Id == 0);
                        }
                        else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_hk02(_path, onecin, lgs_Id == 0);
                        }
                        else
                        {
                            output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForSupplierOrder(_path, onecin, lgs_Id == 0);
                        }
                        byte[] pdfarray = output.ToArray();
                        byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.SodCode);
                        //byte[] newarray = AddLog2Page(newarray0, _path, onecin.SodCode);
                        byte[] newarray;//= AddLog2Page(newarray0, _path, onecin.SodCode);
                        if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                        {
                            string qrname = "采购订单 SUPPLIER ORDER";
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode, PdfVersion, society, qrname);
                        }
                        else if (string.Equals(PdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                        {
                            string qrname = "採購訂單 SUPPLIER ORDER";
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode, PdfVersion, society, qrname);
                        }
                        else
                        {
                            newarray = AddLog2Page(newarray0, _path, onecin.SodCode);
                        }
                        Response.Clear();
                        //filename = string.Format("{0}-{1}.pdf", onecin.SodCode, onecin.TwoSupplier.Abbreviation);
                        var abbreviation = onecin.TwoSupplier.Abbreviation;
                        abbreviation = abbreviation.Replace(",", "");
                        filename = string.Format("{0}-{1}-V{2}.pdf", onecin.SodCode, abbreviation, DateTime.Now.ToString("yyyyMMdd#HHmmss"));
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", newarray.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(newarray);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                    catch (Exception)
                    {
                    }
                }
            }
            #endregion supplier order
            #region purcharse intent
            else if (!string.IsNullOrEmpty(pinId))
            {
                // purchase intent
                int _id = 0;
                try
                {
                    var strprdId = StringCipher.DecoderSimple(pinId.UrlDecode2String(), "pinId");
                    int.TryParse(strprdId, out _id);
                    PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
                    var onecin = PurchaseBaseServices.LoadPurchaseIntent(CurrentUser.Soc_id, _id, true);
                    MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForPurchaseIntent(_path, onecin);
                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.PinCode);
                    byte[] newarray = AddLog2Page(newarray0, _path, onecin.PinCode);
                    Response.Clear();
                    filename = string.Format("{0}.pdf", onecin.PinCode);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                catch (Exception)
                {
                }
            }
            #endregion purcharse intent
            #region logistic
            else if (!string.IsNullOrEmpty(lgsId))
            {
                var lgs_id = IntTryParse(lgsId, "lgsId");
                LogisticsServices LogisticsServices = new LogisticsServices();
                var onelgs = LogisticsServices.LoadLogisticsById(lgs_id, CurrentUser.Soc_id, true);
                if (pi == "0")
                {
                    MemoryStream output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForLogistics(_path, onelgs);
                    byte[] pdfarray = output.ToArray();
                    byte[] newarray0 = AddPageNumbers(pdfarray, society, onelgs.LgsCode);
                    byte[] newarray = AddLog2Page(newarray0, _path, onelgs.LgsCode);
                    Response.Clear();
                    filename = string.Format("{0}.pdf", onelgs.LgsCode);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", newarray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(newarray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
                else
                {
                    var cinIds = LogisticsServices.GetLogisticsCinId(lgs_id, CurrentUser.Soc_id);
                    var sodIds = LogisticsServices.GetLogisticsSodId(lgs_id, CurrentUser.Soc_id);
                    var finalArray = TreateLgsCinSod(lgs_id, cinIds, sodIds, _path, society, DownloadTechSheetUrl, _withtechsheet, onelgs.LgsCode);

                    filename = string.Format("{0}-DOCS.pdf", onelgs.LgsCode);
                    string header = string.Format("inline; filename={0}", filename);
                    Response.AddHeader("Content-Length", finalArray.Length.ToString());
                    Response.AddHeader("Content-Disposition", header);
                    Response.ContentType = "application/pdf";
                    Response.BinaryWrite(finalArray);
                    Response.OutputStream.Flush();
                    Response.OutputStream.Close();
                }
            }
            #endregion logistic
            #region Client Invoice Statment
            else if (!string.IsNullOrEmpty(cliId) && !string.IsNullOrEmpty(datetime))
            {
                int cli_id = 0;
                if (!int.TryParse(cliId, out cli_id))
                {
                    cli_id = IntTryParse(cliId, "cliId");
                }
                //var 
                DateTime selectmonth;
                if (!DateTime.TryParse(datetime, System.Globalization.CultureInfo.GetCultureInfo("fr-FR"), System.Globalization.DateTimeStyles.None, out selectmonth))
                {
                    var today = DateTime.Today;
                    selectmonth = today.AddMonths(-1);
                }

                if (getbl == "1") // delivery form
                {
                    ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
                    var alldfo = ClientInvoiceServices.GetDfoStatmentFromClientInvoiceByClient(cli_id, CurrentUser.Id,
                        CurrentUser.Soc_id, selectmonth);
                    if (alldfo.Any())
                    {
                        List<byte[]> listallArray = new List<byte[]>();
                        foreach (var onedfo in alldfo)
                        {
                            MemoryStream outputDfo = null;
                            //SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice(_path, thiscin, society, DownloadTechSheetUrl, _withtechsheet);
                            var _pdfVs = onedfo.OneClient.CliPdfVersion;
                            if (!string.IsNullOrEmpty(_pdfVs))
                            {
                                PdfVersion = _pdfVs;
                            }
                            if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                            {
                                outputDfo = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm_VS001(
                                    _path, onedfo);
                                byte[] pdfarrayCin = outputDfo.ToArray();
                                //byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, thiscin.CinCode);
                                //listallArray.Add(newarrayCin);
                                listallArray.Add(pdfarrayCin);
                            }
                            else
                            {
                                outputDfo = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForDliveryForm(_path, onedfo, society);
                                byte[] pdfarrayCin = outputDfo.ToArray();
                                byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, onedfo.DfoCode);
                                listallArray.Add(newarrayCin);
                            }
                        }


                        var allArray = mergePDFFilesNew(listallArray);
                        byte[] newarrayCin0 = AddPageNumbers(allArray, society, null, true, pdfVersion: PdfVersion);

                        //byte[] newarray0 = AddPageNumbers(pdfarray, titleBelow, true);
                        //byte[] newarray = AddLog2Page(newarray0, _path);

                        Response.Clear();
                        filename = string.Format("Les BL pour le relevé de facture-{0:Y}.pdf", selectmonth);
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", newarrayCin0.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(newarrayCin0);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                }
                else // client invoice
                {
                    ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
                    DateTime? endmonth = null;
                    endmonth = GetDateTimeOrNow(enddate, true);
                    int _comId = 0;
                    try
                    {
                        Int32.TryParse(comId, out _comId);
                    }
                    catch (Exception)
                    {
                        _comId = 0;
                    }
                    var allCins = ClientInvoiceServices.GetClientInvoiceStatmentByClient(cli_id, CurrentUser.Id,
                        CurrentUser.Soc_id, selectmonth, endmonth, _comId);
                    if (allCins.Any())
                    {
                        var onecin = allCins.FirstOrDefault();
                        var titleBelow = string.Format("RELEVÉ DE FACTURE DU {0:Y} DE {1}", selectmonth, onecin.ClientCompanyName).ToUpper();
                        MemoryStream output;//= SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoiceStatment(_path, allCins,selectmonth, society);
                        if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                        {
                            output = SharedServices.PDF.PDFGenerator.PdfForCinStatment_hk(_path, allCins, selectmonth, society);
                        }
                        else
                        {
                            output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoiceStatment(_path, allCins, selectmonth, society);
                        }

                        byte[] pdfarray = output.ToArray();
                        List<byte[]> listallArray = new List<byte[]>();
                        //byte[] newarray0 = AddPageNumbers(pdfarray, titleBelow, true);
                        byte[] newarray = AddLog2Page(pdfarray, _path);
                        listallArray.Add(newarray);

                        if (SCin != "1")
                        {
                            foreach (var thiscin in allCins)
                            {
                                //SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice(_path, thiscin, society, DownloadTechSheetUrl, _withtechsheet);

                                MemoryStream outputCin = null;
                                if (string.Equals(PdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                                {
                                    outputCin = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice_VS001(_path,
                                        thiscin, society, DownloadTechSheetUrl, _withtechsheet);
                                    byte[] pdfarrayCin = outputCin.ToArray();
                                    //byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, thiscin.CinCode);
                                    //listallArray.Add(newarrayCin);
                                    byte[] newarray0 = AddPageCode(pdfarrayCin, null, thiscin.CinCode);
                                    listallArray.Add(newarray0);
                                }
                                else if (string.Equals(PdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                                {
                                    outputCin = SharedServices.PDF.PDFGenerator.PdfGCinMa(_path, thiscin,
                                        society, DownloadTechSheetUrl, _withtechsheet);
                                    byte[] pdfarrayCin = outputCin.ToArray();
                                    byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, thiscin.CinCode);
                                    byte[] newarray0 = AddPageCode(newarrayCin, null, thiscin.CinCode);
                                    listallArray.Add(newarray0);
                                }
                                else if (string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                                {
                                    titleBelow = string.Format("该月账单结单 BILLING STATEMENT OF {0:Y} - {1}", selectmonth, onecin.ClientCompanyName).ToUpper();
                                    outputCin = SharedServices.PDF.PDFGenerator.PdfCin_hk(_path, thiscin, society, DownloadTechSheetUrl, _withtechsheet);
                                    byte[] pdfarrayCin = outputCin.ToArray();
                                    byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, thiscin.CinCode);
                                    byte[] newarray0 = AddPageCode(newarrayCin, society, thiscin.CinCode, "商业发票 COMMERCIAL INVOICE");
                                    listallArray.Add(newarray0);
                                }
                                else
                                {
                                    outputCin = SharedServices.PDF.PDFGenerator.PdfCin(_path, thiscin,
                                        society, DownloadTechSheetUrl, _withtechsheet);
                                    byte[] pdfarrayCin = outputCin.ToArray();
                                    byte[] newarrayCin = AddLog2Page(pdfarrayCin, _path, thiscin.CinCode);
                                    byte[] newarray0 = AddPageCode(newarrayCin, null, thiscin.CinCode);
                                    listallArray.Add(newarray0);
                                }
                            }
                        }

                        var allArray = mergePDFFilesNew(listallArray);
                        byte[] newarrayCin0 = AddPageNumbers(allArray, society, titleBelow, true);

                        //byte[] newarray0 = AddPageNumbers(pdfarray, titleBelow, true);
                        //byte[] newarray = AddLog2Page(newarray0, _path);


                        Response.Clear();
                        string filename0 = string.Equals(PdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase)
                            ? "该月账单结单 BILLING STATEMENT"
                            : "Relevé de facture";
                        filename = string.Format("{2}-{0:yyyyMM}-{1}.pdf", selectmonth,
                            onecin.ClientCompanyName, filename0);
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", newarrayCin0.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(newarrayCin0);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                }

            }
            #endregion Client Invoice Statment

        }

        private byte[] TreateLgsCinSod(int lgsId, List<int> cinIds, List<int> sodIds, string _path, Society society, string DownloadTechSheetUrl, bool _withtechsheet, string lgsCode)
        {
            List<byte[]> listallArray = new List<byte[]>();
            ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
            foreach (var cinId in cinIds)
            {
                MemoryStream output;
                var onecin = ClientInvoiceServices.LoadClientInvoiceById(cinId, CurrentUser.Soc_id, CurrentUser.Id, true, lgsId);
                var _pdfVs = onecin.ClientForPdf.CliPdfVersion;
                if (!string.IsNullOrEmpty(_pdfVs))
                {
                    _pdfVersion = _pdfVs;
                }
                if (string.Equals(_pdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = SharedServices.PDF.PDFGenerator.NewGeneratePdfForClientInvoice_VS001(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                }
                else if (string.Equals(_pdfVersion, "ma", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = SharedServices.PDF.PDFGenerator.PdfGCinMa(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                }
                else if (string.Equals(_pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = SharedServices.PDF.PDFGenerator.PdfCin_hk(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                }
                else if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = SharedServices.PDF.PDFGenerator.PdfCin_HK02(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                }
                else
                {
                    output = SharedServices.PDF.PDFGenerator.PdfCin(_path, onecin, society, DownloadTechSheetUrl, _withtechsheet);
                }
                byte[] pdfarray = output.ToArray();
                byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.CinCode, string.Equals(_pdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase));
                byte[] newarray;
                if (string.Equals(_pdfVersion, "vs001", StringComparison.CurrentCultureIgnoreCase))
                {
                    newarray = newarray0;
                }
                else
                {
                    bool hk02 = string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase);
                    string qrname = onecin.CinIsInvoice ? (hk02 ? "商業發票 COMMERCIAL INVOICE" : "商业发票 COMMERCIAL INVOICE") : (hk02 ? "貨記單 CREDIT NOTE" : "贷记单 CREDIT NOTE");
                    newarray = AddLog2Page(newarray0, _path, onecin.CinCode, _pdfVersion, society, qrname);
                }
                listallArray.Add(newarray);
            }

            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            foreach (var sodId in sodIds)
            {
                var onecin = PurchaseBaseServices.LoadSupplierOrder(CurrentUser.Soc_id, sodId, true, lgsId);
                // 20220815 这里借用CsoList来显示Comment
                if (onecin != null)
                {
                    onecin.CsoList = PurchaseBaseServices.GetAllSodCmt(sodId).Where(l => l.Actived).ToList();
                }
                MemoryStream output;
                if (string.Equals(_pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_hk(_path, onecin, false);
                }
                else if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                {
                    output = ERP.SharedServices.PDF.PDFGenerator.PdfSod_hk02(_path, onecin, false);
                }
                else
                {
                    output = ERP.SharedServices.PDF.PDFGenerator.NewGeneratePdfForSupplierOrder(_path, onecin, false);
                }
                byte[] pdfarray = output.ToArray();
                byte[] newarray0 = AddPageNumbers(pdfarray, society, onecin.SodCode);
                byte[] newarray;//= AddLog2Page(newarray0, _path, onecin.SodCode);
                if (string.Equals(_pdfVersion, "hk", StringComparison.CurrentCultureIgnoreCase))
                {
                    string qrname = "采购订单 SUPPLIER ORDER";
                    newarray = AddLog2Page(newarray0, _path, onecin.SodCode, _pdfVersion, society, qrname);
                }
                else if (string.Equals(_pdfVersion, "hk02", StringComparison.CurrentCultureIgnoreCase))
                {
                    string qrname = "採購訂單 SUPPLIER ORDER";
                    newarray = AddLog2Page(newarray0, _path, onecin.SodCode, _pdfVersion, society, qrname);
                }
                else
                {
                    newarray = AddLog2Page(newarray0, _path, onecin.SodCode);
                }
                listallArray.Add(newarray);
            }
            var allArray = mergePDFFilesNew(listallArray);
            var titleBelow = string.Format("{0}", lgsCode);
            byte[] newarrayCin0 = AddPageNumbers(allArray, society, titleBelow, true, withPageNumber: false, leftsideWithPageNumber: true);
            return newarrayCin0;
        }

        private void DownloadEnterpriseInscription(string filePath)
        {
            //var mappath = System.Web.HttpContext.Current.Server.MapPath("~");
            //var filepath = mappath + "App_Data\\Enterprise Inscription.xlsx";
            FileInfo file = new FileInfo(filePath);
            Response.Clear();
            Response.ClearHeaders();
            Response.ClearContent();
            Response.AddHeader("Content-Disposition", "attachment; filename=" + file.Name);
            Response.AddHeader("Content-Length", file.Length.ToString());
            Response.ContentType = "text/plain";
            Response.Flush();
            Response.TransmitFile(file.FullName);
            Response.End();
        }

        public static byte[] AddLEDLogos2Page(byte[] pdf,
            string path,
            string logoPath,
            string elaPath,
            string rohsPath,
            string cePath,
            string weeePath,
            string bgImg = null,
            List<Entities.KeyValue> listPrdImgs = null,
            Entities.Product oneProduct = null)
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

                //PdfStamper stamper = new PdfStamper(reader, ms);
                if (page == 1)
                {
                    bool hasDiaLux = false;

                    // 标题背景图片
                    //if (!string.IsNullOrEmpty(bgImg))
                    //{
                    //    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(bgImg);
                    //    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                    //    //jpg.SetAbsolutePosition(50, 633);
                    //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                    //    //cb.AddImage(jpg, 600, 0, 0, 400, 263, (float)633.6);
                    //    cb.AddImage(jpg, 600, 0, 0, 400, 283, (float)633.6);

                    //    //var canvas = stamper.GetUnderContent(1);
                    //    ////var onepage = stamper.GetImportedPage(reader, 1);
                    //    //canvas.AddImage(jpg);
                    //    //stamper.Close();
                    //}

                    if (listPrdImgs != null && listPrdImgs.Any())
                    {
                        var prdImgOrder1 = listPrdImgs.FirstOrDefault(m => m.Key == 1);
                        var prdImgOrder2 = listPrdImgs.FirstOrDefault(m => m.Key == 2);
                        var prdImgOrder3 = listPrdImgs.FirstOrDefault(m => m.Key == 3);
                        var prdImgOrder4 = listPrdImgs.FirstOrDefault(m => m.Key == 4);
                        var prdImgOrder5 = listPrdImgs.FirstOrDefault(m => m.Key == 5);

                        // 商品图片一，标题图片
                        if (prdImgOrder1 != null && !string.IsNullOrEmpty(prdImgOrder1.Value) && File.Exists(prdImgOrder1.Value))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder1.Value);
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, 240, 0, 0, 180, 330, 655);
                        }
                        //// 商品图片二，标题图片 2017-11-30 仅保留一张照片
                        //if (prdImgOrder2 != null && !string.IsNullOrEmpty(prdImgOrder2.Value))
                        //{
                        //    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder2.Value);
                        //    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        //    cb.AddImage(jpg, 130, 0, 0, 130, 450, 670);
                        //}

                        // 商品图片二，下方图片
                        if (prdImgOrder2 != null && !string.IsNullOrEmpty(prdImgOrder2.Value) && File.Exists(prdImgOrder2.Value))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder2.Value);
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            //cb.AddImage(jpg, 130, 0, 0, 130, 30, 160);
                            cb.AddImage(jpg, 130, 0, 0, 130, 190, 160);
                        }

                        //// 商品图片三，下方图片
                        //if (prdImgOrder3 != null && !string.IsNullOrEmpty(prdImgOrder3.Value))
                        //{
                        //    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder3.Value);
                        //    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        //    cb.AddImage(jpg, 130, 0, 0, 130, 190, 160);
                        //}

                        // 商品图片三，照射图
                        if (prdImgOrder3 != null && !string.IsNullOrEmpty(prdImgOrder3.Value) && File.Exists(prdImgOrder3.Value))
                        {
                            hasDiaLux = true;
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder3.Value);
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, 180, 0, 0, 180, 375, 445);
                        }
                    }
                    if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", logoPath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 140, 0, 0, 40, 30, 765);
                    }
                    if (!string.IsNullOrEmpty(elaPath) && File.Exists(elaPath))
                    {
                        //iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, elaPath));
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(elaPath);
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 60, 0, 0, 100, 30, 40);
                    }
                    if (!string.IsNullOrEmpty(rohsPath) && File.Exists(rohsPath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", rohsPath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 30, 0, 0, 20, 100, 40);
                    }
                    if (!string.IsNullOrEmpty(cePath) && File.Exists(cePath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", cePath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 20, 0, 0, 15, 142, 40);
                    }
                    if (!string.IsNullOrEmpty(weeePath) && File.Exists(weeePath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", weeePath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 20, 0, 0, 30, 180, 40);
                    }
                    //stamper.Close();

                    #region little Logos


                    if (oneProduct != null)
                    {
                        AlbumServices AlbumServices = new AlbumServices();

                        string albColor = oneProduct.EntityColor != null ?
                            (oneProduct.EntityColor.Id == 1 ? "red" : oneProduct.EntityColor.Id == 2 ? "green" : oneProduct.EntityColor.Id == 3 ? "blue" : "grey")
                            : "red";
#if DEBUG
                        //albColor = "green";
#endif

                        albColor += " icons";
                        // garanti


                        string propNameWithValue = "baseproduct";
                        string baseproduct = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);

                        propNameWithValue = GetProductPropForIcons(oneProduct, "Garantie");
                        string garantie = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "Durée de vie");
                        string lifeTime = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "UGR");
                        string UGR = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "Température d'utilisation");
                        string OperatingTemperature = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Indice de rendu");
                        //string RenderingIndex = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Transformateur");
                        //string Transformer = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Tension");
                        //string TensionPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Electrical Class");
                        //string ElectricalClass = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);


                        string IP = GetProductPropForIcons(oneProduct, "Protection IP");
                        string IPPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, IP, albColor);
                        string IK = GetProductPropForIcons(oneProduct, "Protection IK");
                        string IKPath = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, IK, albColor);





                        float startHeight = hasDiaLux ? 380 : 550; // 小图，大图模式 起始位置
                        float widthHeight = hasDiaLux ? 50 : 70; // 图片高度和宽度
                        float lineSpace = 5;

                        float leftside = 375;

                        if (!string.IsNullOrEmpty(baseproduct))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", baseproduct));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }


                        if (!string.IsNullOrEmpty(garantie))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", garantie));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }


                        if (!string.IsNullOrEmpty(lifeTime))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", lifeTime));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }

                        if (!string.IsNullOrEmpty(OperatingTemperature))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", OperatingTemperature));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }
                        if (!string.IsNullOrEmpty(UGR))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", UGR));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }

                        if (!string.IsNullOrEmpty(IPPath))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", IPPath));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                        }

                        if (!string.IsNullOrEmpty(IKPath))
                        {
                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", IKPath));
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, leftside, startHeight);
                            startHeight -= (widthHeight + lineSpace);
                            //if (!string.IsNullOrEmpty(IPPath))
                            //{
                            //    cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, 355 + widthHeight + lineSpace, startHeight + widthHeight + lineSpace);
                            //}
                            //else
                            //{
                            //    cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, 355, startHeight);
                            //}
                            //startHeight -= (widthHeight + lineSpace);
                        }
                        //if (!string.IsNullOrEmpty(TensionPath))
                        //{
                        //    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", TensionPath));
                        //    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        //    cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, 355, startHeight);
                        //    startHeight -= (widthHeight + lineSpace);
                        //}


                        //if (!string.IsNullOrEmpty(ElectricalClass))
                        //{
                        //    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", ElectricalClass));
                        //    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        //    cb.AddImage(jpg, widthHeight, 0, 0, widthHeight, 355, startHeight);
                        //    startHeight -= (widthHeight + lineSpace);
                        //}


                        //BarCodeDrawing qrCode = new BarCodeDrawing();
                        //string qrText = "123456789";
                        //var image = qrCode.GetCodeImageByte(qrText, ERP.Web.Shared.BarCodeDrawing.BarCodeDrawingModel.BarCodeDrawingNormal, false);
                        //if (image != null)
                        //{
                        //    iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(image);
                        //    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        //    cb.AddImage(qrJpg, 100, 0, 0, widthHeight, 450, 340);

                        //}


                        #region Additionnal options with Dali and Dimmable
                        // additionnal options
                        var additionnalOpts = GetProductPropForIcons(oneProduct, "Option disponible");
                        var hasDali = oneProduct.InstanceList.Any(m => m.PitAllInfo.Any(l => l.PropName == "Opération" && l.PropValue == "DALI"));
                        var hasDimmable = oneProduct.InstanceList.Any(m => m.PitAllInfo.Any(l => l.PropName == "Opération" && l.PropValue == "DIMMABLE"));

                        if (!string.IsNullOrEmpty(additionnalOpts) || hasDali || hasDimmable)
                        {
                            additionnalOpts = additionnalOpts.Replace("Option disponible_", "");
                            var options = Enumerable.Select(additionnalOpts.Split(';').Where(m => !string.IsNullOrEmpty(m)), m => m.ToString()).ToList();
                            //var options2Display = additionnalOpts.Split(';').Where(m => !string.IsNullOrEmpty(m)).Select(m => m.ToString()).ToList();
                            var antivandale = options.Any(m => m.Contains("antivandale"));
                            var detecteur = options.Any(m => m.Contains("détecteur"));
                            var transparent = options.Any(m => m.Contains("transparent"));
                            var opale = options.Any(m => m.Contains("opale"));
                            var microprismatique = options.Any(m => m.Contains("microprismatique"));
                            //options2Display.Remove("antivandale");
                            //options2Display.Remove("détecteur");
                            //options2Display.Remove("transparent");
                            //options2Display.Remove("opale");
                            //options2Display.Remove("microprismatique");

                            if (antivandale || detecteur || transparent || opale || microprismatique || hasDali || hasDimmable)
                            {

                                float optstartHeight = hasDiaLux ? 380 : 550; // 小图，大图模式 起始位置
                                float optwidthHeight = hasDiaLux ? 50 : 70; // 图片高度和宽度
                                float optlineSpace = 5;

                                string dalipath = hasDali ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "dali", albColor) : string.Empty;
                                string dimmalbepath = hasDimmable ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "dimmable", albColor) : string.Empty;

                                string optiondisponible = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "optiondisponible", albColor);
                                string antivandalePath = antivandale ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "antivandale", albColor) : string.Empty;
                                string detecteurPath = detecteur ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "détecteur", albColor) : string.Empty;
                                string transparentPath = transparent ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "transparent", albColor) : string.Empty;
                                string opalePath = opale ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "opale", albColor) : string.Empty;
                                string microPath = microprismatique ? AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, "microprismatique", albColor) : string.Empty;

                                var leftspace = 355 + widthHeight * 2;


                                if (!string.IsNullOrEmpty(optiondisponible))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", optiondisponible));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(dalipath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", dalipath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(dimmalbepath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", dimmalbepath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }


                                if (!string.IsNullOrEmpty(antivandalePath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", antivandalePath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }


                                if (!string.IsNullOrEmpty(detecteurPath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", detecteurPath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(transparentPath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", transparentPath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(opalePath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", opalePath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(microPath))
                                {
                                    iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", microPath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }
                            }

                            if (options.Any())
                            {
                                // display OPTION DISPONIBLE
                                string optionDispo = "Option disponible : " + options.Aggregate(string.Empty, (current, str) => current + (str + ";"));

                                BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);

                                cb.BeginText();
                                cb.SetFontAndSize(bf, 9);
                                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, optionDispo.ToUpper(), 28, 145, 0);
                                cb.EndText();

                            }
                        }

                        #endregion Additionnal options

                        //string garantie = AlbumServices.GetImagePathFromAlbum(CurrentUser.Soc_id, propNameWithValue, albColor);




                        var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrl"];

                        if (!string.IsNullOrEmpty(DownloadTechSheetUrl))
                        {
                            QrEncoder qrEncoder = new QrEncoder(ErrorCorrectionLevel.H);
                            QrCode qrCode = new QrCode();
                            qrEncoder.TryEncode(
                                string.Format("{0}?p=", DownloadTechSheetUrl) + (oneProduct != null ? oneProduct.PrdRef : string.Empty),
                                out qrCode);

                            GraphicsRenderer renderer =
                                new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                            MemoryStream qrStream = new MemoryStream();
                            renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                            var image = qrStream.ToArray();
                            if (image != null)
                            {
                                iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(image);
                                // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                cb.AddImage(qrJpg, 50, 0, 0, 50, 522, 40);

                            }
                        }
                        //if (hasDiaLux)
                        //{
                        //    // 小图模式
                        //    if (!string.IsNullOrEmpty(garantie))
                        //    {

                        //    }

                        //}
                        //else
                        //{
                        //    // 大图模式

                        //}
                    }

                    #endregion little Logos
                }
            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }


        public static byte[] AddLEDLogos2Page_V2(byte[] pdf,
            string path,
            string logoPath,
            string elaPath,
            string rohsPath,
            string cePath,
            string weeePath,
            string bgImg = null,
            List<Entities.KeyValue> listPrdImgs = null,
            Entities.Product oneProduct = null)
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

                //PdfStamper stamper = new PdfStamper(reader, ms);
                if (page == 1)
                {
                    bool hasDiaLux = false;

                    if (listPrdImgs != null && listPrdImgs.Any())
                    {
                        var prdImgOrder1 = listPrdImgs.FirstOrDefault(m => m.Key == 1);
                        var prdImgOrder2 = listPrdImgs.FirstOrDefault(m => m.Key == 2);
                        var prdImgOrder3 = listPrdImgs.FirstOrDefault(m => m.Key == 3);
                        var prdImgOrder4 = listPrdImgs.FirstOrDefault(m => m.Key == 4);
                        var prdImgOrder5 = listPrdImgs.FirstOrDefault(m => m.Key == 5);

                        var firstImage = 0;
                        var secondeImage = 0;
                        var thirdImage = 0;

                        // 有一张照片，就放中间，两张照片，分两边，三张，均分
                        bool has1img = false;
                        bool has2img = false;
                        bool has3img = false;
                        string img1path = string.Empty;
                        string img2path = string.Empty;
                        string img3path = string.Empty;
                        int imgCount = 0;



                        // 商品图片一，标题图片
                        if (prdImgOrder1 != null && !string.IsNullOrEmpty(prdImgOrder1.Value) && File.Exists(prdImgOrder1.Value))
                        {
                            has1img = true;
                            img1path = prdImgOrder1.Value;
                            imgCount++;
                            //iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder1.Value);
                            //jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            //// addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            //cb.AddImage(jpg, 173, 0, 0, 130, 10, 665);
                        }

                        // 商品图片二，下方图片
                        if (prdImgOrder2 != null && !string.IsNullOrEmpty(prdImgOrder2.Value) && File.Exists(prdImgOrder2.Value))
                        {
                            has2img = true;
                            img2path = prdImgOrder2.Value;
                            imgCount++;
                            //iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder2.Value);
                            //jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            //// addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            ////cb.AddImage(jpg, 130, 0, 0, 130, 30, 160);
                            //cb.AddImage(jpg, 173, 0, 0, 130, 183, 665);
                        }

                        // 商品图片三，照射图
                        if (prdImgOrder3 != null && !string.IsNullOrEmpty(prdImgOrder3.Value) && File.Exists(prdImgOrder3.Value))
                        {
                            has3img = true;
                            img3path = prdImgOrder3.Value;
                            imgCount++;
                            hasDiaLux = true;
                            //iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder3.Value);
                            //jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            //// addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            //cb.AddImage(jpg, 173, 0, 0, 130, 366, 665);
                            //cb.AddImage(jpg, 180, 0, 0, 180, 375, 50);
                            //cb.AddImage(jpg, 120, 0, 0, 120, 190, 125);
                        }


                        if (has1img && has2img && has3img)
                        {
                            iTextSharp.text.Image jpg1 = iTextSharp.text.Image.GetInstance(img1path);
                            jpg1.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg1, 180, 0, 0, 130, 10, 665);

                            iTextSharp.text.Image jpg2 = iTextSharp.text.Image.GetInstance(img2path);
                            jpg2.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg2, 180, 0, 0, 130, 208, 665);

                            iTextSharp.text.Image jpg3 = iTextSharp.text.Image.GetInstance(img3path);
                            jpg3.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg3, 180, 0, 0, 130, 406, 665);

                        }
                        else
                        {
                            if (imgCount == 1)
                            {
                                // only one image
                                var imagePath = has1img ? img1path : (has2img ? img2path : img3path);
                                iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(imagePath);
                                jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                cb.AddImage(jpg, 180, 0, 0, 130, 208, 665);
                            }
                            else if (imgCount == 2)
                            {
                                // two image
                                var image1Path = has1img ? img1path : img2path;
                                var image2Path = has3img ? img3path : img2path;
                                iTextSharp.text.Image jpg1 = iTextSharp.text.Image.GetInstance(image1Path);
                                jpg1.Alignment = iTextSharp.text.Image.UNDERLYING;
                                // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                cb.AddImage(jpg1, 180, 0, 0, 130, 59, 665);

                                iTextSharp.text.Image jpg2 = iTextSharp.text.Image.GetInstance(image2Path);
                                jpg2.Alignment = iTextSharp.text.Image.UNDERLYING;
                                // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                cb.AddImage(jpg2, 180, 0, 0, 130, 357, 665);
                            }
                        }


                        if (prdImgOrder4 != null && !string.IsNullOrEmpty(prdImgOrder4.Value) && File.Exists(prdImgOrder4.Value))
                        {

                            iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(prdImgOrder4.Value);
                            jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(jpg, 150, 0, 0, 150, 345, 30);
                        }
                    }



                    if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", logoPath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 105, 0, 0, 30, 20, 795);
                    }
                    if (!string.IsNullOrEmpty(elaPath) && File.Exists(elaPath))
                    {
                        //iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}{1}", path, elaPath));
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(elaPath);
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 60, 0, 0, 100, 30, 40);
                    }
                    if (!string.IsNullOrEmpty(rohsPath) && File.Exists(rohsPath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", rohsPath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 30, 0, 0, 20, 100, 40);
                    }
                    if (!string.IsNullOrEmpty(cePath) && File.Exists(cePath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", cePath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 20, 0, 0, 15, 142, 40);
                    }
                    if (!string.IsNullOrEmpty(weeePath) && File.Exists(weeePath))
                    {
                        iTextSharp.text.Image jpg = iTextSharp.text.Image.GetInstance(string.Format("{0}", weeePath));
                        jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                        // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                        cb.AddImage(jpg, 20, 0, 0, 30, 180, 40);
                    }
                    #region little Logos



                    var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrlSite"];

                    if (!string.IsNullOrEmpty(DownloadTechSheetUrl))
                    {
                        QrEncoder qrEncoder = new QrEncoder(ErrorCorrectionLevel.H);
                        QrCode qrCode = new QrCode();
                        var prodlink = string.Format("{0}", oneProduct != null ? string.Format("/Product.aspx?prdId={0}", oneProduct.FId) : string.Empty);
                        var link = string.Format("{0}{1}", DownloadTechSheetUrl, prodlink);
                        qrEncoder.TryEncode(link, out qrCode);

                        GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                        MemoryStream qrStream = new MemoryStream();
                        renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                        var image = qrStream.ToArray();
                        if (image != null)
                        {
                            iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(image);
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(qrJpg, 50, 0, 0, 50, 523, 25);

                        }
                    }
                    #endregion little Logos
                }
            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        public static byte[] AddLEDPageNumbers(byte[] pdf, Society society, string Normes)
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

            string compInfo = string.Empty;
            //compInfo = WebConfigurationManager.AppSettings["CompanyInfo"];
            //compInfo = string.Format("{0} - Siret {1} - RCS {2} - TVA {3}", society.Society_Name, society.Siret, society.RCS, society.TvaIntra);
            compInfo = string.Format("{0}{4}{1}{5}{2}{6}{3}", society.Society_Name, society.Siret, society.RCS, society.TvaIntra, (string.IsNullOrEmpty(society.Siret) ? string.Empty : " - Siret "), (string.IsNullOrEmpty(society.RCS) ? string.Empty : " - RCS "), (string.IsNullOrEmpty(society.TvaIntra) ? string.Empty : " - TVA "));
            string companyInfoSpace = WebConfigurationManager.AppSettings["CompanyInfoSpace"];
            string companyInfo = compInfo;
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
                int.TryParse(companyInfoSpace, out compInfoSpance);
                compInfoSpance = compInfoSpance == 0 ? 85 : compInfoSpance;
                //string companyInfo = "ECOLED EUROPE - Siret N°75198276000025 - RCS MEAUX : 751982760 - TVA N° FR86751982760";
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, companyInfo, compInfoSpance, 15, 0);
                cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, +p + "/" + n, 560, 15, 0);

                cb.EndText();


                cb.BeginText();
                cb.SetFontAndSize(bf, 6);

                if (!string.IsNullOrEmpty(Normes))
                {
                    string newline = Normes.Contains("\r\n") ? "\r\n" : "\n";
                    var normesLines = Normes.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int lineHeigh = 0;
                    foreach (var oneline in normesLines)
                    {
                        cb.ShowTextAligned(PdfContentByte.ALIGN_LEFT, oneline, 100, 130 - lineHeigh, 0);
                        lineHeigh += 10;
                    }
                }
                cb.EndText();

            }
            // step 5: we close the document
            document.Close();
            return ms.ToArray();
        }

        public static string GetProductPropForIcons(Entities.Product onePrd, string propName)
        {
            string returvalue = string.Empty;
            if (onePrd != null && onePrd.PrdGeneralInfoList.Any())
            {
                var oneprop = onePrd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName);
                if (oneprop != null)
                {
                    returvalue = string.Format("{0}_{1}", oneprop.PropName, oneprop.PropValue);
                }
            }
            return returvalue;
        }

        public static string GetProductPropIPForIcons(Entities.Product onePrd, string propName)
        {
            //string returvalue = string.Empty;
            //if (onePrd != null && onePrd.PrdGeneralInfoList.Any())
            //{
            //    var oneprop = onePrd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName);
            //    if (oneprop != null)
            //    {
            //        var ip = oneprop.PropValue.Split('/').ToList().FirstOrDefault();
            //        if (isIP)
            //        {
            //            if (!string.IsNullOrEmpty(ip))
            //            {
            //                returvalue = ip.ToUpper();
            //            }
            //        }
            //        else // IK
            //        {
            //            var ik = oneprop.PropValue.Split('/').ToList().FirstOrDefault(m => m.StartsWith("IK"));
            //            if (!string.IsNullOrEmpty(ip))
            //            {
            //                returvalue = ik.ToUpper();
            //            }
            //        }
            //    }
            //}
            //return returvalue;

            string returvalue = string.Empty;
            if (onePrd != null && onePrd.PrdGeneralInfoList.Any())
            {
                var oneprop = onePrd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName);
                if (oneprop != null)
                {
                    var ip = oneprop.PropValue;
                    if (!string.IsNullOrEmpty(ip))
                    {
                        returvalue = ip.ToUpper();
                    }
                }
            }
            return returvalue;
        }
        public static string GetProductPropIKForIcons(Entities.Product onePrd, string propName)
        {
            string returvalue = string.Empty;
            if (onePrd != null && onePrd.PrdGeneralInfoList.Any())
            {
                var oneprop = onePrd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName);
                if (oneprop != null)
                {
                    var ik = oneprop.PropValue;
                    if (!string.IsNullOrEmpty(ik))
                    {
                        returvalue = ik.ToUpper();
                    }
                }
            }
            return returvalue;
        }

        private byte[] mergePDFFilesNew(List<byte[]> files)
        {
            byte[] result;
            using (MemoryStream ms = new MemoryStream())
            {
                Document doc = new Document();
                PdfSmartCopy pdfCopy = new PdfSmartCopy(doc, ms);
                doc.Open();
                foreach (var percorsoFilePdf in files)
                {
                    PdfReader reader = new PdfReader(percorsoFilePdf);
                    int numpagine = reader.NumberOfPages;
                    for (int I = 1; I <= numpagine; I++)
                    {
                        doc.SetPageSize(reader.GetPageSizeWithRotation(1));
                        PdfImportedPage page = pdfCopy.GetImportedPage(reader, I);
                        pdfCopy.AddPage(page);
                    }
                    //Clean up
                    //pdfCopy.FreeReader(reader);
                    reader.Close();
                }
                //Clean up
                doc.Close();
                result = ms.ToArray();
                return result;
            }
        }

    }
}
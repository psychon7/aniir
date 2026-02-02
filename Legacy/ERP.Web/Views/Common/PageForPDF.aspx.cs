using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace ERP.Web.Views.Common
{
    public partial class PageForPDF : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // type : 1--> client order; 2 --> delivery form; 3 --> client invoice; 4 --> payment for client invoice; 5 --> supplier order
            // 6, 7 --> supplier invoice
            var type = Request.QueryString["type"];
            switch (type)
            {
                case "1":
                    {
                        EditPDF();
                    }
                    break;
                case "2":
                    {
                        EditPDFDfo();
                    }
                    break;
                case "3":
                    {
                        EditPDFCin();
                    }
                    break;
                case "4":
                    {
                        EditPDFCinPayment();
                    }
                    break;
                case "5":
                    {
                        EditPDFSupplierOrder();
                    }
                    break;
                case "6":
                    {
                        EditPDFSupplierInvoice(false);
                    }
                    break;
                case "7":
                    {
                        EditPDFSupplierInvoice(true);
                    }
                    break;
                case "8":
                    {
                        // show payment pdf file
                        EditPdfSodPayment();
                    }
                    break;
                case "9":
                    {
                        EditPdfSodDoc();
                    }
                    break;
                case "15":
                    {
                        // Logistics 文件
                        ShowDocumentPdf("Logistics");
                    }
                    break;
                case "16":
                    {
                        // Logistics 文件,下载该LGS所有文件
                        ShowAllDocumentPdf("Logistics");
                    }
                    break;
                default:
                    {
                    }
                    break;
            }
        }


        /// <summary>
        /// Pdf edition
        /// </summary>
        private void EditPDF()
        {
            ClientOrderServices ClientOrderServices = new ClientOrderServices();
            var codId = Request.QueryString["codId"];

            if (!string.IsNullOrEmpty(codId))
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
                    var values = ClientOrderServices.LoadClientOrderById(cod_id, CurrentUser.Soc_id, CurrentUser.Id);
                    string filePath = values.CodFile;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        //FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.CodCode);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }
        /// <summary>
        /// Pdf edition
        /// </summary>
        private void EditPDFDfo()
        {
            DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
            var dfoId = Request.QueryString["dfoId"];

            if (!string.IsNullOrEmpty(dfoId))
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
                    var values = DeliveryFormServices.LoadDeliveryFormById(dfo_id, CurrentUser.Soc_id, CurrentUser.Id);
                    string filePath = values.DfoFile;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        //FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.DfoCode);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }
        /// <summary>
        /// Pdf edition
        /// </summary>
        private void EditPDFCin()
        {
            ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
            var cinId = Request.QueryString["cinId"];

            if (!string.IsNullOrEmpty(cinId))
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
                    var values = ClientInvoiceServices.LoadClientInvoiceById(_id, CurrentUser.Soc_id, CurrentUser.Id);
                    string filePath = values.CinFile;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        //FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.CinCode);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        private void EditPDFCinPayment()
        {
            ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
            var cinId = Request.QueryString["cinId"];
            var cpyId = Request.QueryString["cpyId"];
            if (!string.IsNullOrEmpty(cinId) && !string.IsNullOrEmpty(cpyId))
            {
                int _cinid = IntTryParse(cinId, "cinId");
                int _cpyid = IntTryParse(cpyId, "cpyId");
                if (_cinid != 0 && _cpyid != 0)
                {
                    var values = ClientInvoiceServices.LoadClientInvoicePayment(CurrentUser.Soc_id, _cinid, _cpyid);
                    string filePath = values.CpyFile;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.CpyComment);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        private void EditPdfSodPayment()
        {
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            var sodId = Request.QueryString["sodId"];
            var sprId = Request.QueryString["sprId"];
            if (!string.IsNullOrEmpty(sodId) && !string.IsNullOrEmpty(sprId))
            {
                int _sodId = IntTryParse(sodId, "sodId");
                int _sprId = 0;
                int.TryParse(sprId, out _sprId);
                if (_sodId != 0 && _sprId != 0)
                {
                    var values = PurchaseBaseServices.LoadSodePaymentFile(CurrentUser.Soc_id, _sodId, _sprId);
                    string filePath = values.Value;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.Value2);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        private void EditPdfSodDoc()
        {
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            var sodId = Request.QueryString["sodId"];
            var sdcId = Request.QueryString["sdcId"];
            if (!string.IsNullOrEmpty(sodId) && !string.IsNullOrEmpty(sdcId))
            {
                int _sodId = IntTryParse(sodId, "sodId");
                int _sprId = 0;
                int.TryParse(sdcId, out _sprId);
                if (_sodId != 0 && _sprId != 0)
                {
                    var values = PurchaseBaseServices.LoadSodDocFile(CurrentUser.Soc_id, _sodId, _sprId);
                    string filePath = values.Value;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.Value2);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        private void ShowDocumentPdf(string dtpName)
        {
            CommonServices CommonServices = new CommonServices();
            var foreignId = Request.QueryString["foreignId"];
            var docId = Request.QueryString["docId"];
            if (!string.IsNullOrEmpty(foreignId) && !string.IsNullOrEmpty(docId))
            {
                var key = GetDocumentTypeKey(dtpName);
                int _foreignId = IntTryParse(foreignId, key);
                int _docId = 0;
                int.TryParse(docId, out _docId);
                if (_foreignId != 0 && _docId != 0)
                {
                    var values = CommonServices.LoadDocumentFile(_foreignId, _docId);
                    string filePath = values.Value;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.Value2);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        private void ShowAllDocumentPdf(string dtpName)
        {
            CommonServices CommonServices = new CommonServices();
            var foreignId = Request.QueryString["foreignId"];
            if (!string.IsNullOrEmpty(foreignId))
            {
                var key = GetDocumentTypeKey(dtpName);
                int _foreignId = IntTryParse(foreignId, key);
                if (_foreignId != 0)
                {
                    var values = CommonServices.GetDocumentList(dtpName, _foreignId).Where(l => !string.IsNullOrEmpty(l.Value2)).Select(l => l.Value2).ToList();
                    List<byte[]> listallArray = new List<byte[]>();
                    foreach (var onepath in values)
                    {
                        using (FileStream fs = File.OpenRead(onepath))
                        {
                            int length = (int)fs.Length;
                            byte[] data = new byte[length];
                            fs.Position = 0;
                            fs.Read(data, 0, length);
                            MemoryStream ms = new MemoryStream(data);
                            listallArray.Add(ms.ToArray());
                        }
                    }

                    if (listallArray.Any())
                    {
                        var allArray = mergePDFFilesNew(listallArray);
                        Response.Clear();
                        var filename = string.Format("LogisticsFiles");
                        string header = string.Format("inline; filename={0}", filename);
                        Response.AddHeader("Content-Length", allArray.Length.ToString());
                        Response.AddHeader("Content-Disposition", header);
                        Response.ContentType = "application/pdf";
                        Response.BinaryWrite(allArray);
                        Response.OutputStream.Flush();
                        Response.OutputStream.Close();
                    }
                }
            }
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


        private void EditPDFSupplierOrder()
        {
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            if (CurrentUser != null)
            {
                var sodId = Request.QueryString["sodId"];
                if (!string.IsNullOrEmpty(sodId))
                {
                    int _sodId = IntTryParse(sodId, "sodId");
                    if (_sodId != 0)
                    {
                        var values = PurchaseBaseServices.LoadSupplierOrder(CurrentUser.Soc_id, _sodId);
                        string filePath = values.SodFile;
                        if (!string.IsNullOrEmpty(filePath))
                        {
                            var PDFPath = filePath;
                            string path = PDFPath.Replace("//", "/");
                            try
                            {
                                using (
                                    FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                                {
                                    ViewPdf(MyFileStream, values.SodCode);
                                }
                            }
                            catch (Exception ex)
                            {
                                LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                            }
                        }
                    }
                }
            }
        }

        private void EditPDFSupplierInvoice(bool bank)
        {
            PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
            var sinId = Request.QueryString["sinId"];
            if (!string.IsNullOrEmpty(sinId))
            {
                int _id = IntTryParse(sinId, "sinId");
                if (_id != 0)
                {
                    var values = PurchaseBaseServices.LoadSupplierInvoice(CurrentUser.Soc_id, _id);
                    string filePath = bank ? values.SinBankReceiptFile : values.SinFile;
                    if (!string.IsNullOrEmpty(filePath))
                    {
                        var PDFPath = filePath;
                        string path = PDFPath.Replace("//", "/");
                        try
                        {
                            using (FileStream MyFileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                            {
                                ViewPdf(MyFileStream, values.SinCode);
                            }
                        }
                        catch (Exception ex)
                        {
                            LogWriter.Write(Path.GetFileName(Request.Url.AbsolutePath) + " : " + ex.Message);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// 显示pdf
        /// </summary>
        /// <param name="fs"></param>
        private void ViewPdf(Stream fs, string filename)
        {
            byte[] buffer = new byte[fs.Length];
            fs.Position = 0;
            fs.Read(buffer, 0, (int)fs.Length);

            Response.Clear();
            string header = string.Format("inline; filename={0}", filename);
            Response.AddHeader("Content-Length", fs.Length.ToString());
            Response.ContentType = "application/pdf";
            //Response.AddHeader("Content-Disposition", "inline;FileName=out.pdf");
            Response.AddHeader("Content-Disposition", header);
            fs.Close();
            Response.BinaryWrite(buffer);
            Response.OutputStream.Flush();
            Response.OutputStream.Close();
            //Response.Write(iftest);
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
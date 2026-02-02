using System;
using System.Collections.Generic;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Entities;
using ERP.RefSite.Shared;
using ERP.Repositories;
using Gma.QrCodeNet.Encoding;
using Gma.QrCodeNet.Encoding.Windows.Render;
using iTextSharp.text;
using iTextSharp.text.pdf;
using ErrorCorrectionLevel = iTextSharp.text.pdf.qrcode.ErrorCorrectionLevel;

namespace ERP.RefSite
{
    public partial class TechSheet : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            var prdRef = Request.QueryString["p"];
            var type = Request.QueryString["type"];
            if (!string.IsNullOrEmpty(prdRef) && !string.IsNullOrEmpty(prdRef.Trim()))
            {
                if (type == "1")
                {
                    DownloadTchSheet(prdRef);
                }
                else if (type == "2")
                {
                    GetIES(prdRef);
                }
            }
        }

        public void GetIES(string prdRef)
        {
            ProductServices ProductServices = new ProductServices();
            var oneprd = ProductServices.LoadProductByRef(prdRef, 1);
            if (oneprd != null)
            {
                var pits = oneprd.InstanceList.Where(m => m.PitAllInfo.Any(l => l.PropName == "IES" && !string.IsNullOrEmpty(l.PropValue))).ToList();
                if (pits.Any())
                {
                    string filepath = string.Empty;
                    var onepit = pits.Where(m => (m.PitRef == prdRef || m.PitTmpRef == prdRef)).ToList();
                    filepath = onepit.Any()
                        ? onepit.FirstOrDefault().PitAllInfo.FirstOrDefault(m => m.PropName == "IES").PropValue
                        : pits.FirstOrDefault().PitAllInfo.FirstOrDefault(m => m.PropName == "IES").PropValue;


                    string path = filepath;
                    System.IO.FileInfo file = new System.IO.FileInfo(path);
                    if (file.Exists)
                    {
                        Response.Clear();
                        Response.AddHeader("Content-Disposition", "attachment; filename=" + "IES-" + file.Name);
                        Response.AddHeader("Content-Length", file.Length.ToString());
                        Response.ContentType = "application/octet-stream";
                        Response.WriteFile(path);
                        Response.End();
                    }
                }
                else
                {

                }
            }
        }

        public void DownloadTchSheet(string prdRef)
        {
            string _path = Server.MapPath("~");
            string filename = string.Empty;
            //int _id = IntTryParse(prdId, "prdId");
            ProductServices ProductServices = new ProductServices();
            var oneprd = ProductServices.LoadProductByRef(prdRef, 1);
            SocietyServices SocietyServices = new SocietyServices();
            var society = SocietyServices.LoadSocietyById(1);
            if (oneprd != null)
            {
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
                var techsheetV = WebConfigurationManager.AppSettings["TechShettVersion"];
                MemoryStream output;
                switch (techsheetV)
                {
                    case "1":
                    case "2":
                        output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                        break;
                    case "3":
                        // todo: Subitcha new function GPdfTechSheet_V3
                        output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                        break;
                    default:
                        output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                        break;
                }
                //output = ERP.SharedServices.PDF.PDFGenerator.GPdfTechSheet_V2(_path, oneprd);
                byte[] pdfarray = output.ToArray();
                //var normes = oneprd.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Normes");
                string normesStr = oneprd.PtyStandards;
                byte[] newarray0 = AddLEDPageNumbers(pdfarray, society, normesStr);
                AlbumServices AlbumServices = new AlbumServices();
                string elaPath = AlbumServices.GetImagePathFromAlbum(1, "800501-ELA");
                string bgImg = AlbumServices.GetImagePathFromAlbum(1, "background gradient");
                //string elaPath = "img\\800501-ELA.png";
                //string logoPath = "img\\logo-Pdf.png";
                string color = oneprd.EntityColor != null
                    ? (oneprd.EntityColor.Id == 1
                        ? "red"
                        : oneprd.EntityColor.Id == 2 ? "green" : oneprd.EntityColor.Id == 3 ? "blue" : "grey")
                    : "red";

#if DEBUG
                //color = "green";
#endif

                string logoPath = AlbumServices.GetImagePathFromAlbum(1, color, "logos");
                //string rohsPath = "img\\rohs.png";
                //string cePath = "img\\CE150_150.png";
                //string weeePath = "img\\WEEE.png";
                string rohsPath = AlbumServices.GetImagePathFromAlbum(1, "Rohs");
                string cePath = AlbumServices.GetImagePathFromAlbum(1, "CE");
                string weeePath = AlbumServices.GetImagePathFromAlbum(1, "WEEE");
                //string prdImgPath = oneprd.PrdImg;
                byte[] newarray = AddLEDLogos2Page_V2(newarray0, _path, logoPath, elaPath, rohsPath, cePath, weeePath,
                    bgImg, oneprd.PrdImgList, oneprd);
                Response.Clear();
                filename = string.Format("Fiche Tech - {0}.pdf", oneprd.PrdRef);
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
                lb_status.Text = "Erreur X012150 : veuillez contacter l'administrateur !";
            }
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
                        if (prdImgOrder1 != null && !string.IsNullOrEmpty(prdImgOrder1.Value) &&
                            File.Exists(prdImgOrder1.Value))
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
                        if (prdImgOrder2 != null && !string.IsNullOrEmpty(prdImgOrder2.Value) &&
                            File.Exists(prdImgOrder2.Value))
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
                        if (prdImgOrder3 != null && !string.IsNullOrEmpty(prdImgOrder3.Value) &&
                            File.Exists(prdImgOrder3.Value))
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

                        string albColor = oneProduct.EntityColor != null
                            ? (oneProduct.EntityColor.Id == 1
                                ? "red"
                                : oneProduct.EntityColor.Id == 2
                                    ? "green"
                                    : oneProduct.EntityColor.Id == 3 ? "blue" : "grey")
                            : "red";
#if DEBUG
                        //albColor = "green";
#endif

                        albColor += " icons";
                        // garanti


                        string propNameWithValue = "baseproduct";
                        string baseproduct = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);

                        propNameWithValue = GetProductPropForIcons(oneProduct, "Garantie");
                        string garantie = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "Durée de vie");
                        string lifeTime = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "UGR");
                        string UGR = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        propNameWithValue = GetProductPropForIcons(oneProduct, "Température d'utilisation");
                        string OperatingTemperature = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Indice de rendu");
                        //string RenderingIndex = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Transformateur");
                        //string Transformer = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Tension");
                        //string TensionPath = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);
                        //propNameWithValue = GetProductPropForIcons(oneProduct, "Electrical Class");
                        //string ElectricalClass = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);


                        string IP = GetProductPropForIcons(oneProduct, "Protection IP");
                        string IPPath = AlbumServices.GetImagePathFromAlbum(1, IP, albColor);
                        string IK = GetProductPropForIcons(oneProduct, "Protection IK");
                        string IKPath = AlbumServices.GetImagePathFromAlbum(1, IK, albColor);





                        float startHeight = hasDiaLux ? 380 : 550; // 小图，大图模式 起始位置
                        float widthHeight = hasDiaLux ? 50 : 70; // 图片高度和宽度
                        float lineSpace = 5;

                        float leftside = 375;

                        if (!string.IsNullOrEmpty(baseproduct))
                        {
                            iTextSharp.text.Image jpg =
                                iTextSharp.text.Image.GetInstance(string.Format("{0}", baseproduct));
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
                            iTextSharp.text.Image jpg =
                                iTextSharp.text.Image.GetInstance(string.Format("{0}", OperatingTemperature));
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
                        var hasDali =
                            oneProduct.InstanceList.Any(
                                m => m.PitAllInfo.Any(l => l.PropName == "Opération" && l.PropValue == "DALI"));
                        var hasDimmable =
                            oneProduct.InstanceList.Any(
                                m => m.PitAllInfo.Any(l => l.PropName == "Opération" && l.PropValue == "DIMMABLE"));

                        if (!string.IsNullOrEmpty(additionnalOpts) || hasDali || hasDimmable)
                        {
                            additionnalOpts = additionnalOpts.Replace("Option disponible_", "");
                            var options =
                                additionnalOpts.Split(';')
                                    .Where(m => !string.IsNullOrEmpty(m))
                                    .Select(m => m.ToString())
                                    .ToList();
                            var antivandale = options.Any(m => m.Contains("antivandale"));
                            var detecteur = options.Any(m => m.Contains("détecteur"));
                            var transparent = options.Any(m => m.Contains("transparent"));
                            var opale = options.Any(m => m.Contains("opale"));
                            var microprismatique = options.Any(m => m.Contains("microprismatique"));

                            if (antivandale || detecteur || transparent || opale || microprismatique || hasDali ||
                                hasDimmable)
                            {

                                float optstartHeight = hasDiaLux ? 380 : 550; // 小图，大图模式 起始位置
                                float optwidthHeight = hasDiaLux ? 50 : 70; // 图片高度和宽度
                                float optlineSpace = 5;

                                string dalipath = hasDali
                                    ? AlbumServices.GetImagePathFromAlbum(1, "dali", albColor)
                                    : string.Empty;
                                string dimmalbepath = hasDimmable
                                    ? AlbumServices.GetImagePathFromAlbum(1, "dimmable", albColor)
                                    : string.Empty;

                                string optiondisponible = AlbumServices.GetImagePathFromAlbum(1, "optiondisponible",
                                    albColor);
                                string antivandalePath = antivandale
                                    ? AlbumServices.GetImagePathFromAlbum(1, "antivandale", albColor)
                                    : string.Empty;
                                string detecteurPath = detecteur
                                    ? AlbumServices.GetImagePathFromAlbum(1, "détecteur", albColor)
                                    : string.Empty;
                                string transparentPath = transparent
                                    ? AlbumServices.GetImagePathFromAlbum(1, "transparent", albColor)
                                    : string.Empty;
                                string opalePath = opale
                                    ? AlbumServices.GetImagePathFromAlbum(1, "opale", albColor)
                                    : string.Empty;
                                string microPath = microprismatique
                                    ? AlbumServices.GetImagePathFromAlbum(1, "microprismatique", albColor)
                                    : string.Empty;

                                var leftspace = 355 + widthHeight * 2;


                                if (!string.IsNullOrEmpty(optiondisponible))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", optiondisponible));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(dalipath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", dalipath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(dimmalbepath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", dimmalbepath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }


                                if (!string.IsNullOrEmpty(antivandalePath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", antivandalePath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }


                                if (!string.IsNullOrEmpty(detecteurPath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", detecteurPath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(transparentPath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", transparentPath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(opalePath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", opalePath));
                                    jpg.Alignment = iTextSharp.text.Image.UNDERLYING;
                                    // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                                    cb.AddImage(jpg, optwidthHeight, 0, 0, optwidthHeight, leftspace, optstartHeight);
                                    optstartHeight -= (widthHeight + lineSpace);
                                }

                                if (!string.IsNullOrEmpty(microPath))
                                {
                                    iTextSharp.text.Image jpg =
                                        iTextSharp.text.Image.GetInstance(string.Format("{0}", microPath));
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

                        //string garantie = AlbumServices.GetImagePathFromAlbum(1, propNameWithValue, albColor);




                        QrEncoder qrEncoder = new QrEncoder(Gma.QrCodeNet.Encoding.ErrorCorrectionLevel.H);
                        QrCode qrCode = new QrCode();
                        var DownloadTechSheetUrl = WebConfigurationManager.AppSettings["DownloadTechSheetUrl"];
                        qrEncoder.TryEncode(DownloadTechSheetUrl + "?p=" + (oneProduct != null ? oneProduct.PrdRef : string.Empty), out qrCode);

                        GraphicsRenderer renderer = new GraphicsRenderer(new FixedModuleSize(12, QuietZoneModules.Two));
                        MemoryStream qrStream = new MemoryStream();
                        renderer.WriteToStream(qrCode.Matrix, ImageFormat.Png, qrStream);
                        var image = qrStream.ToArray();
                        if (image != null)
                        {
                            iTextSharp.text.Image qrJpg = iTextSharp.text.Image.GetInstance(image);
                            // addImage(image, image_width, 0, 0, image_height, 左边距, 下边距)
                            cb.AddImage(qrJpg, 50, 0, 0, 50, 522, 40);

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
                        QrEncoder qrEncoder = new QrEncoder(Gma.QrCodeNet.Encoding.ErrorCorrectionLevel.H);
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
            compInfo = string.Format("{0} - Siret {1} - RCS {2} - TVA {3}", society.Society_Name, society.Siret, society.RCS, society.TvaIntra);
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

    }
}
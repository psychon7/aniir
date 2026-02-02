using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using ERP.DataServices;
using ERP.Entities;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace ERP.SharedServices.PDF
{
    public static partial class PDFGenerator
    {

        #region Devis

        public static MemoryStream PdfCpl_HK02(string path, CostPlan devis, string DownloadTechSheetUrl, bool withTechSheet = false)
        {
            CommonServices CommonServices = new CommonServices();
            var avoirCoef = 1;
            //CommissionServices CommissionServices = new CommissionServices();
            doc = new Document(iTextSharp.text.PageSize.A4, 10, 10, 15, 15);
            landscape = false;
            spacing = 0;
            cellAdded = false;
            _title = new StringBuilder();
            pageSize = doc.PageSize.Height;
            var output = new MemoryStream();
            writer = PdfWriter.GetInstance(doc, output);
            doc.Open();

            _path = path;

            //float[] defineWidths = new float[] { 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, };
            float[] defineWidths = new float[]
            {
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
            };
            int nbColumns = 50;
            repeateHeaderTable = false;

            PdfPTable headerTable = CreateTable(1);

            _headerTable = CreateTable(1, 0);
            finalTable = CreateTable(1, 0);
            middleTable = CreateTable(1, 0);

            table = CreateTable(nbColumns, 0, defineWidths);

            float leading = 1;

            #region Set space white

            string textSpace = " ";

            var HeaderFooter = CommonServices.GetHeaderFooter();

            #region Header

            string title = "詢價單 QUOTATION";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, devis.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, devis.CplCode, "");

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

            // 给LOGO让18格 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 30, fontST14B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);



            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 48, fontST11B, false, Alignement.Center, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            #endregion Header


            #endregion Set space white

            #region header

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += devis.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(devis.CplClient.Address1) ? "" : ("\r\n" + devis.CplClient.Address1));
            clientinfor += (string.IsNullOrEmpty(devis.CplClient.Address2) ? "" : ("\r\n" + devis.CplClient.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               devis.CplClient.Postcode,
               devis.CplClient.City,
               !string.IsNullOrEmpty(devis.CplClient.Postcode) && !string.IsNullOrEmpty(devis.CplClient.City) ? " / " : "",
                (!string.IsNullOrEmpty(devis.CplClient.Postcode) || !string.IsNullOrEmpty(devis.CplClient.City)) && !string.IsNullOrEmpty(devis.CplClient.Country) ? " " : "",
               devis.CplClient.Country);

            clientinfor += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 23, bodyFont1st, false, Alignement.Left, true, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 22, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // 客户地址及标题
            var cincodeCn = string.Format("單號");
            var cincodeFr = string.Format("Quotation NO. : {0}", devis.CplCode);
            var cindateCn = string.Format("創建日期");
            var cindateFr = string.Format("Creation Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", devis.CplDateCreation).ToUpper());
            var cinnameCn = string.Format("名稱");
            var cinnameFr = string.Format("Quotation Name : {0}", devis.CplName);
            var cindateVCn = string.Format("有效期至");
            var cindateVFr = string.Format("Validity Date To : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", devis.CplDateValidity).ToUpper());

            var cininfoCn = string.Format("{0}\r\n{2}\r\n{1}\r\n{3}", cincodeCn, cindateCn, cinnameCn, cindateVCn);
            var cininfoFr = string.Format("{0}\r\n{2}\r\n{1}\r\n{3}", cincodeFr, cindateFr, cinnameFr, cindateVFr);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, fontST13B, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(clientinfor, BaseColor.WHITE, 20, fontST13B, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(cininfo, BaseColor.WHITE, 22, fontST10, false, Alignement.Left, false, false, leading, spaceLogo);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(cininfoCn, BaseColor.WHITE, 5, fontST10, false, Alignement.JUSTIFIED_ALL, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(cininfoFr, BaseColor.WHITE, 17, fontST10, false, Alignement.Left, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 23, bodyFont1st, true, Alignement.Left, true, true, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 22, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address Field

            #endregion header

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Dear customer\r\nHere is our price offer for your request."), BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            if (!string.IsNullOrEmpty(devis.CplHeaderText))
            {
                string newline = devis.CplHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(oneLine, BaseColor.WHITE, 46, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);
            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("NO.", BaseColor.WHITE, 3, fontST08B, true, Alignement.Left, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REF.", BaseColor.WHITE, 8, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("图像 IMG.", BaseColor.WHITE, 4, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DES.", BaseColor.WHITE, 17, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("單價 U.P.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("折后价 DIS. P.", BaseColor.WHITE, 7, fontST08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅總價 TOTAL", BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("稅額 VAT", BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int devisLineCount = devis.CostPlanLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < devisLineCount; index++)
            {
                var cil = devis.CostPlanLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : !string.IsNullOrEmpty(cil.PrdName) ? cil.PrdName : cil.ClnPrdName;

                string Description = cil.ClnDescription;
                string PrdDescription = cil.ClnPrdDes;
                Description = !string.IsNullOrEmpty(Description)
                    ? (Description.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>").Replace("<br/>", "\r\n"))
                    : Description;

                PrdDescription = !string.IsNullOrEmpty(PrdDescription)
                    ? (PrdDescription.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>").Replace("<br/>", "\r\n"))
                    : PrdDescription;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "<br/>----------------------<br/>" + Description));
                allDes = allDes.Replace("<br/>", "\r\n");

                if (allDes.Length > 600)
                {
                    allDes = string.Format("{0} ... ...", allDes.Substring(0, 600));
                }

                //if (cil.PrdId != null && cil.PrdId != 0)
                //{
                //    if (!string.IsNullOrEmpty(DownloadTechSheetUrl) && withTechSheet && !cil.IsAcc)
                //    {
                //        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.CiiPrdName, DownloadTechSheetUrl);
                //    }
                //}

                string order = string.Format("{0:n0}.{1:n0}", cil.ClnLevel1, cil.ClnLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ClnQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ClnUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.ClnTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ClnPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * avoirCoef) : string.Empty;

                string clnUPriceDisplay = (cil.LtpId == 2 || cil.LtpId == 4) ? (((cil.ClnDiscountAmount ?? 0) == 0) ? ClnPriceWithDiscount : string.Format("{0:n3}\r\n{1}{2:n3}\r\n= {3:n3}", cil.ClnUnitPrice * avoirCoef, (avoirCoef < 0 ? "+" : "-"), (cil.ClnDiscountAmount ?? 0), (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * avoirCoef)) : string.Empty;


                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * cil.ClnQuantity * avoirCoef) : string.Empty;
                string tvaString = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}\r\n{1:n2}%", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * cil.ClnQuantity * avoirCoef * cil.VatRate / 100, cil.VatRate) : string.Empty;


                cell = CreateHeaderCellHK(order, BaseColor.WHITE, 3, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 8, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    //string prdImagePath = cil.PrdImgPath;
                    //if (File.Exists(prdImagePath))
                    //{
                    //    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                    //    // Load the image
                    //    iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);

                    //    float fixedImageHeight = 30f;

                    //    float originalWidth = prdImage.ScaledWidth;
                    //    float originalHeight = prdImage.ScaledHeight;
                    //    float aspectRatio = originalWidth / originalHeight;
                    //    float fixedImageWidth = fixedImageHeight * aspectRatio;

                    //    prdImage.ScaleToFit(fixedImageWidth, fixedImageHeight);

                    //    PdfPCell imageCell = new PdfPCell(prdImage, true)
                    //    {
                    //        VerticalAlignment = Element.ALIGN_MIDDLE,
                    //        HorizontalAlignment = Element.ALIGN_CENTER,
                    //        Colspan = 4,
                    //        BorderWidthBottom = 0,
                    //        BorderWidthLeft = 0f,
                    //        BorderWidthTop = 0f,
                    //        BorderWidthRight = 0f,
                    //        FixedHeight = fixedImageHeight,
                    //        PaddingTop = 5f,
                    //        PaddingBottom = 5f,
                    //        PaddingLeft = 5f,
                    //        PaddingRight = 5f
                    //    };

                    //    table.AddCell(imageCell);
                    //}
                    //else
                    //{
                    //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //    table.AddCell(cell);
                    //}
                    cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 17, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 5, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(ClnUnitPrice, BaseColor.WHITE, 7, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(clnUPriceDisplay, BaseColor.WHITE, 5, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(ClnTotalPrice, BaseColor.WHITE, 6, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(tvaString, BaseColor.WHITE, 4, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 39, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: false, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);

                // new line for more space
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 17, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < devisLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("NO.", BaseColor.WHITE, 3, fontST08B, true, Alignement.Left, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REF.", BaseColor.WHITE, 8, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("图像 IMG.", BaseColor.WHITE, 4, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DES.", BaseColor.WHITE, 17, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("單價 U.P.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("折后价 DIS. P.", BaseColor.WHITE, 7, fontST08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("未稅總價 TOTAL", BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("稅額 VAT", BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == devisLineCount - 1 && cil.LtpId != 3)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 17, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            // total line title
            var allLines = devis.CostPlanLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (devis.CplDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHTWithoutDis = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnUnitPrice) * m.ClnQuantity) * avoirCoef;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = devis.CplDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;
            var totalQty = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnQuantity);


            //if (LastLineTotalHeight > 710)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //}

            var cildis = devis.CostPlanLines.Sum(l => l.ClnDiscountAmount * l.ClnQuantity);
            var cindis = devis.CplDiscountAmount ?? 0;
            if (cildis > 0 || cindis > 0)
            {
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK("總價 TOTAL", gray808080, 41, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, devis.CurrencySymbol), gray808080, 7, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("原價未稅", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("ORIGINAL TOTAL", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 2, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n0}", totalQty), gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTWithoutDis), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), gray808080, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折扣金額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("DISCOUNT AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", (cildis + cindis) * -1), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折後未稅總價", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TAX AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);



                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總價", gray808080, 5, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, devis.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }
            else
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("未稅總價 EX-TAX TOTAL", gray808080, 39, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總價", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("EX-TAX TOTAL", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 2, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n0}", totalQty), gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 5, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TAX AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("含稅總價 TOTAL AMOUNT", gray808080, 39, fontST08B, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總價", gray808080, 5, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, devis.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }



            // add table to check the end of page

            for (int i = 0; i < 2; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(devis.CplFooterText))
            {
                string newline = devis.CplFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(oneLine, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = devis.CplClientComment;


            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            content = HeaderFooter != null ? HeaderFooter.CostPlanFooter : string.Empty;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfCpl_HK02WithImg(string path, CostPlan devis, string DownloadTechSheetUrl, bool withTechSheet = false)
        {
            CommonServices CommonServices = new CommonServices();
            var avoirCoef = 1;
            //CommissionServices CommissionServices = new CommissionServices();
            doc = new Document(iTextSharp.text.PageSize.A4, 10, 10, 15, 15);
            landscape = false;
            spacing = 0;
            cellAdded = false;
            _title = new StringBuilder();
            pageSize = doc.PageSize.Height;
            var output = new MemoryStream();
            writer = PdfWriter.GetInstance(doc, output);
            doc.Open();

            _path = path;

            //float[] defineWidths = new float[] { 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, };
            float[] defineWidths = new float[]
            {
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
                0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F, 0.2F,
            };
            int nbColumns = 50;
            repeateHeaderTable = false;

            PdfPTable headerTable = CreateTable(1);

            _headerTable = CreateTable(1, 0);
            finalTable = CreateTable(1, 0);
            middleTable = CreateTable(1, 0);

            table = CreateTable(nbColumns, 0, defineWidths);

            float leading = 1;

            #region Set space white

            string textSpace = " ";

            var HeaderFooter = CommonServices.GetHeaderFooter();

            #region Header

            string title = "詢價單 QUOTATION";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, devis.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, devis.CplCode, "");

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

            // 给LOGO让18格 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 30, fontST14B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);



            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 48, fontST11B, false, Alignement.Center, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            #endregion Header


            #endregion Set space white

            #region header

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += devis.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(devis.CplClient.Address1) ? "" : ("\r\n" + devis.CplClient.Address1));
            clientinfor += (string.IsNullOrEmpty(devis.CplClient.Address2) ? "" : ("\r\n" + devis.CplClient.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               devis.CplClient.Postcode,
               devis.CplClient.City,
               !string.IsNullOrEmpty(devis.CplClient.Postcode) && !string.IsNullOrEmpty(devis.CplClient.City) ? " / " : "",
                (!string.IsNullOrEmpty(devis.CplClient.Postcode) || !string.IsNullOrEmpty(devis.CplClient.City)) && !string.IsNullOrEmpty(devis.CplClient.Country) ? " " : "",
               devis.CplClient.Country);

            clientinfor += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 23, bodyFont1st, false, Alignement.Left, true, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 22, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // 客户地址及标题
            var cincodeCn = string.Format("單號");
            var cincodeFr = string.Format("Quotation NO. : {0}", devis.CplCode);
            var cindateCn = string.Format("創建日期");
            var cindateFr = string.Format("Creation Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", devis.CplDateCreation).ToUpper());
            var cinnameCn = string.Format("名稱");
            var cinnameFr = string.Format("Quotation Name : {0}", devis.CplName);
            var cindateVCn = string.Format("有效期至");
            var cindateVFr = string.Format("Validity Date To : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", devis.CplDateValidity).ToUpper());

            var cininfoCn = string.Format("{0}\r\n{2}\r\n{1}\r\n{3}", cincodeCn, cindateCn, cinnameCn, cindateVCn);
            var cininfoFr = string.Format("{0}\r\n{2}\r\n{1}\r\n{3}", cincodeFr, cindateFr, cinnameFr, cindateVFr);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, fontST13B, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(clientinfor, BaseColor.WHITE, 20, fontST13B, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(cininfo, BaseColor.WHITE, 22, fontST10, false, Alignement.Left, false, false, leading, spaceLogo);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(cininfoCn, BaseColor.WHITE, 5, fontST10, false, Alignement.JUSTIFIED_ALL, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(cininfoFr, BaseColor.WHITE, 17, fontST10, false, Alignement.Left, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 23, bodyFont1st, true, Alignement.Left, true, true, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 22, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address Field

            #endregion header

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Dear customer\r\nHere is our price offer for your request."), BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            if (!string.IsNullOrEmpty(devis.CplHeaderText))
            {
                string newline = devis.CplHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(oneLine, BaseColor.WHITE, 46, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);
            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("NO.", BaseColor.WHITE, 3, fontST08B, true, Alignement.Left, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REF.", BaseColor.WHITE, 6, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("图像 IMG.", BaseColor.WHITE, 4, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DES.", BaseColor.WHITE, 15, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("單價 U.P.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("折后价 DIS. P.", BaseColor.WHITE, 7, fontST08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅總價 TOTAL", BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("稅額 VAT", BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int devisLineCount = devis.CostPlanLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < devisLineCount; index++)
            {
                var cil = devis.CostPlanLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : !string.IsNullOrEmpty(cil.PrdName) ? cil.PrdName : cil.ClnPrdName;

                string Description = cil.ClnDescription;
                string PrdDescription = cil.ClnPrdDes;
                Description = !string.IsNullOrEmpty(Description)
                    ? (Description.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>").Replace("<br/>", "\r\n"))
                    : Description;

                PrdDescription = !string.IsNullOrEmpty(PrdDescription)
                    ? (PrdDescription.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>").Replace("<br/>", "\r\n"))
                    : PrdDescription;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "<br/>----------------------<br/>" + Description));
                allDes = allDes.Replace("<br/>", "\r\n");
                //if (cil.PrdId != null && cil.PrdId != 0)
                //{
                //    if (!string.IsNullOrEmpty(DownloadTechSheetUrl) && withTechSheet && !cil.IsAcc)
                //    {
                //        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.CiiPrdName, DownloadTechSheetUrl);
                //    }
                //}

                string order = string.Format("{0:n0}.{1:n0}", cil.ClnLevel1, cil.ClnLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ClnQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ClnUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.ClnTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ClnPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * avoirCoef) : string.Empty;

                string clnUPriceDisplay = (cil.LtpId == 2 || cil.LtpId == 4) ? (((cil.ClnDiscountAmount ?? 0) == 0) ? ClnPriceWithDiscount : string.Format("{0:n3}\r\n{1}{2:n3}\r\n= {3:n3}", cil.ClnUnitPrice * avoirCoef, (avoirCoef < 0 ? "+" : "-"), (cil.ClnDiscountAmount ?? 0), (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * avoirCoef)) : string.Empty;


                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * cil.ClnQuantity * avoirCoef) : string.Empty;
                string tvaString = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}\r\n{1:n2}%", (cil.ClnUnitPrice - (cil.ClnDiscountAmount ?? 0)) * cil.ClnQuantity * avoirCoef * cil.VatRate / 100, cil.VatRate) : string.Empty;


                cell = CreateHeaderCellHK(order, BaseColor.WHITE, 3, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 6, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    string prdImagePath = cil.PrdImgPath;
                    if (File.Exists(prdImagePath))
                    {
                        //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                        // Load the image
                        iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);

                        float fixedImageHeight = 30f;

                        float originalWidth = prdImage.ScaledWidth;
                        float originalHeight = prdImage.ScaledHeight;
                        float aspectRatio = originalWidth / originalHeight;
                        float fixedImageWidth = fixedImageHeight * aspectRatio;

                        prdImage.ScaleToFit(fixedImageWidth, fixedImageHeight);

                        PdfPCell imageCell = new PdfPCell(prdImage, true)
                        {
                            VerticalAlignment = Element.ALIGN_MIDDLE,
                            HorizontalAlignment = Element.ALIGN_CENTER,
                            Colspan = 4,
                            BorderWidthBottom = 0,
                            BorderWidthLeft = 0f,
                            BorderWidthTop = 0f,
                            BorderWidthRight = 0f,
                            FixedHeight = fixedImageHeight,
                            PaddingTop = 5f,
                            PaddingBottom = 5f,
                            PaddingLeft = 5f,
                            PaddingRight = 5f
                        };

                        table.AddCell(imageCell);
                    }
                    else
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                        table.AddCell(cell);
                    }
                    cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 15, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 5, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(ClnUnitPrice, BaseColor.WHITE, 7, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(clnUPriceDisplay, BaseColor.WHITE, 5, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(ClnTotalPrice, BaseColor.WHITE, 6, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(tvaString, BaseColor.WHITE, 4, fontST08, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 39, fontST08, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: false, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);

                // new line for more space
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 15, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < devisLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("NO.", BaseColor.WHITE, 3, fontST08B, true, Alignement.Left, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REF.", BaseColor.WHITE, 6, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("图像 IMG.", BaseColor.WHITE, 4, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DES.", BaseColor.WHITE, 15, fontST08B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("單價 U.P.", BaseColor.WHITE, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("折后价 DIS. P.", BaseColor.WHITE, 7, fontST08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("未稅總價 TOTAL", BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("稅額 VAT", BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == devisLineCount - 1 && cil.LtpId != 3)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            // total line title
            var allLines = devis.CostPlanLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (devis.CplDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHTWithoutDis = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnUnitPrice) * m.ClnQuantity) * avoirCoef;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = devis.CplDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;
            var totalQty = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnQuantity);


            //if (LastLineTotalHeight > 710)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //}

            var cildis = devis.CostPlanLines.Sum(l => l.ClnDiscountAmount * l.ClnQuantity);
            var cindis = devis.CplDiscountAmount ?? 0;
            if (cildis > 0 || cindis > 0)
            {
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK("總價 TOTAL", gray808080, 41, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, devis.CurrencySymbol), gray808080, 7, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("原價未稅", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("ORIGINAL TOTAL", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 2, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n0}", totalQty), gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTWithoutDis), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), gray808080, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折扣金額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("DISCOUNT AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", (cildis + cindis) * -1), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折後未稅總價", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TAX AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);



                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總價", gray808080, 5, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, devis.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }
            else
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("未稅總價 EX-TAX TOTAL", gray808080, 39, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總價", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("EX-TAX TOTAL", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: false, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 2, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n0}", totalQty), gray808080, 5, fontST08B, true, Alignement.Right, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 5, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額", gray808080, 5, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TAX AMOUNT", gray808080, 7, fontST08, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTvaNet), BaseColor.WHITE, 4, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("含稅總價 TOTAL AMOUNT", gray808080, 39, fontST08B, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 14, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總價", gray808080, 5, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("TOTAL AMOUNT", gray808080, 7, fontST08B, true, Alignement.JUSTIFIED_ALL, false, false, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, gray808080, 12, bodyFont1st, true, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, devis.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }



            // add table to check the end of page

            for (int i = 0; i < 2; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(devis.CplFooterText))
            {
                string newline = devis.CplFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(oneLine, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = devis.CplClientComment;


            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            content = HeaderFooter != null ? HeaderFooter.CostPlanFooter : string.Empty;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        #endregion Devis

    }
}

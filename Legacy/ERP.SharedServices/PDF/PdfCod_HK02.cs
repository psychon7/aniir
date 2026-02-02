using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using iTextSharp.text;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;
using System.Text;
using ERP.DataServices;
using ERP.Entities;

namespace ERP.SharedServices.PDF
{
    public static partial class PDFGenerator
    {
        public static MemoryStream PdfCod_HK02(string path, ClientOrder clientorder, string DownloadTechSheetUrl, bool withTechSheet = false)
        {
            int avoirCoef = 1;
            CommonServices CommonServices = new CommonServices();
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

            string title = "銷售訂單 SALES ORDER";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, clientorder.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, clientorder.CodCode, "");

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //    table.AddCell(cell);
            //}

            // 给LOGO让18格 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 30, fontST14B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
            //    table.AddCell(cell);
            //}


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


            //發票號 發票號和客户同一行
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 30, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);

            #endregion Header


            #endregion Set space white

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += clientorder.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(clientorder.OneClient.Address1) ? "" : ("\r\n" + clientorder.OneClient.Address1));
            clientinfor += (string.IsNullOrEmpty(clientorder.OneClient.Address2) ? "" : ("\r\n" + clientorder.OneClient.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               clientorder.OneClient.Postcode,
               clientorder.OneClient.City,
               !string.IsNullOrEmpty(clientorder.OneClient.Postcode) && !string.IsNullOrEmpty(clientorder.OneClient.City) ? " / " : "",
                (!string.IsNullOrEmpty(clientorder.OneClient.Postcode) || !string.IsNullOrEmpty(clientorder.OneClient.City)) && !string.IsNullOrEmpty(clientorder.OneClient.Country) ? " " : "",
               clientorder.OneClient.Country);

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
            var cincodeCn = string.Format("訂單號");
            var cincodeFr = string.Format("Sales Order NO. : {0}", clientorder.CodCode);
            var cindateCn = string.Format("創建日期");
            var cindateFr = string.Format("Creation Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", clientorder.CodDateCreation).ToUpper());
            var cinnameCn = string.Format("訂單名稱");
            var cinnameFr = string.Format("Sales Order Name : {0}", clientorder.CodName);

            var cininfoCn = string.Format("{0}\r\n{2}\r\n{1}", cincodeCn, cindateCn, cinnameCn);
            var cininfoFr = string.Format("{0}\r\n{2}\r\n{1}", cincodeFr, cindateFr, cinnameFr);

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



            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            if (!string.IsNullOrEmpty(clientorder.CodHeaderText))
            {
                string newline = clientorder.CodHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientorder.CodHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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

            int clientorderLineCount = clientorder.ClientOrderLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < clientorderLineCount; index++)
            {
                var cil = clientorder.ClientOrderLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : !string.IsNullOrEmpty(cil.PrdName) ? cil.PrdName : cil.ColPrdName;

                string Description = cil.ColDescription;
                string PrdDescription = cil.ColPrdDes;
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

                string order = string.Format("{0:n0}.{1:n0}", cil.ColLevel1, cil.ColLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ColQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ColUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.ColTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ColPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * avoirCoef) : string.Empty;

                string clnUPriceDisplay = (cil.LtpId == 2 || cil.LtpId == 4) ? (((cil.ColDiscountAmount ?? 0) == 0) ? ClnPriceWithDiscount : string.Format("{0:n3}\r\n{1}{2:n3}\r\n= {3:n3}", cil.ColUnitPrice * avoirCoef, (avoirCoef < 0 ? "+" : "-"), (cil.ColDiscountAmount ?? 0), (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * avoirCoef)) : string.Empty;


                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * cil.ColQuantity * avoirCoef) : string.Empty;
                string tvaString = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}\r\n{1:n2}%", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * cil.ColQuantity * avoirCoef * cil.VatRate / 100, cil.VatRate) : string.Empty;


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

                    if (index < clientorderLineCount - 1)
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
                    if (index == clientorderLineCount - 1 && cil.LtpId != 3)
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
            var allLines = clientorder.ClientOrderLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientorder.CodDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHTWithoutDis = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ColUnitPrice) * m.ColQuantity) * avoirCoef;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientorder.CodDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;
            var totalQty = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ColQuantity);


            //if (LastLineTotalHeight > 710)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //}

            var cildis = clientorder.ClientOrderLines.Sum(l => l.ColDiscountAmount * l.ColQuantity);
            var cindis = clientorder.CodDiscountAmount ?? 0;
            if (cildis > 0 || cindis > 0)
            {
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK("總價 TOTAL", gray808080, 41, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, clientorder.CurrencySymbol), gray808080, 7, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, clientorder.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
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
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, clientorder.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
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

            if (!string.IsNullOrEmpty(clientorder.CodFooterText))
            {
                string newline = clientorder.CodFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientorder.CodFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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

            var comment = clientorder.CodClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            //if (clientorder.DfoList.Any())
            //{
            //    var dfos = clientorder.DfoList.Aggregate("發貨單號 Delivery Form : ", (current, onedfo) => current + (onedfo + "\r\n"));
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCellHK(dfos, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);



            // total line end

            // reserve de propriete


            // add bank information, rib and iban


            #region Footer Text

            #region RIB IBAN

            //var ribContent = "\r\nBank Information:";

            //if (!clientorder.CinBank.HasValue || clientorder.CinBank == 1 || clientorder.CinBank == 0)
            //{
            //    ribContent += (string.IsNullOrEmpty(society.RibAddress) ? string.Empty : (string.Format("\r\nBank Name : {0}", society.RibAddress)));
            //    ribContent += (string.IsNullOrEmpty(society.RibName) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : {0}", society.RibName)));
            //    ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency) ? string.Empty : (string.Format("\r\nBank Address : {0}", society.RibDomiciliationAgency)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeIban) ? string.Empty : (string.Format("\r\nAccount number : {0}", society.RibCodeIban)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeBic) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic)));
            //    ribContent += (string.IsNullOrEmpty(society.RibBankCode) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : {0}", society.RibBankCode)));
            //    ribContent += (string.IsNullOrEmpty(society.RibAgenceCode) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : {0}", society.RibAgenceCode)));
            //    ribContent += "\r\n ";
            //}
            //else
            //{
            //    ribContent += (string.IsNullOrEmpty(society.RibAddress2) ? string.Empty : (string.Format("\r\nBank Name : {0}", society.RibAddress2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibName2) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : {0}", society.RibName2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency2) ? string.Empty : (string.Format("\r\nBank Address : {0}", society.RibDomiciliationAgency2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeIban2) ? string.Empty : (string.Format("\r\nAccount number : {0}", society.RibCodeIban2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeBic2) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibBankCode2) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : {0}", society.RibBankCode2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibAgenceCode2) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : {0}", society.RibAgenceCode2)));
            //    ribContent += "\r\n ";
            //}


            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST08, true, Alignement.Left, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(ribContent, BaseColor.WHITE, 47, fontST08B, true, Alignement.Left, false, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //table.AddCell(cell);


            #endregion RIB IBAN


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);




            #endregion Footer Text


            //middleTable.AddCell(table);


            #region Penality
            //// add table to check the end of page
            //// 20180112 add pageHeight Chenglin
            //var pageHeight = 790;
            //pageHeight = 1200;
            //if (LastLineTotalHeight > pageHeight)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    AddTable(middleTable, table, addNewPage: true);
            //}

            //for (int i = 0; i < 1000; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 800)
            //    {
            //        break;
            //    }
            //}

            //table = CreateTable(nbColumns, 0, defineWidths);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            ////table.AddCell(cell);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            ////table.AddCell(cell);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            ////table.AddCell(cell);

            //// total line end

            //// reserve de propriete

            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);

            ////string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            //string penality = string.Format("{0}{2}{1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment, ((!string.IsNullOrEmpty(HeaderFooter.ClientInvoiceDiscountForPrepayment) || !string.IsNullOrEmpty(HeaderFooter.clientorderPenality)) ? " - " : ""));
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(penality, BaseColor.WHITE, 48, fontST06, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //string reserveText = HeaderFooter.DeliveryFooterLaw;
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reserveText, BaseColor.WHITE, 48, fontST06, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }


        public static MemoryStream PdfCod_HK02WithImg(string path, ClientOrder clientorder, string DownloadTechSheetUrl, bool withTechSheet = false)
        {
            int avoirCoef = 1;
            CommonServices CommonServices = new CommonServices();
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

            string title = "銷售訂單 SALES ORDER";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, clientorder.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, clientorder.CodCode, "");

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //    table.AddCell(cell);
            //}

            // 给LOGO让18格 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 30, fontST14B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
            //    table.AddCell(cell);
            //}


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


            //發票號 發票號和客户同一行
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 30, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);

            #endregion Header


            #endregion Set space white

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += clientorder.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(clientorder.OneClient.Address1) ? "" : ("\r\n" + clientorder.OneClient.Address1));
            clientinfor += (string.IsNullOrEmpty(clientorder.OneClient.Address2) ? "" : ("\r\n" + clientorder.OneClient.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               clientorder.OneClient.Postcode,
               clientorder.OneClient.City,
               !string.IsNullOrEmpty(clientorder.OneClient.Postcode) && !string.IsNullOrEmpty(clientorder.OneClient.City) ? " / " : "",
                (!string.IsNullOrEmpty(clientorder.OneClient.Postcode) || !string.IsNullOrEmpty(clientorder.OneClient.City)) && !string.IsNullOrEmpty(clientorder.OneClient.Country) ? " " : "",
               clientorder.OneClient.Country);

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
            var cincodeCn = string.Format("訂單號");
            var cincodeFr = string.Format("Sales Order NO. : {0}", clientorder.CodCode);
            var cindateCn = string.Format("創建日期");
            var cindateFr = string.Format("Creation Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", clientorder.CodDateCreation).ToUpper());
            var cinnameCn = string.Format("訂單名稱");
            var cinnameFr = string.Format("Sales Order Name : {0}", clientorder.CodName);

            var cininfoCn = string.Format("{0}\r\n{2}\r\n{1}", cincodeCn, cindateCn, cinnameCn);
            var cininfoFr = string.Format("{0}\r\n{2}\r\n{1}", cincodeFr, cindateFr, cinnameFr);

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



            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            if (!string.IsNullOrEmpty(clientorder.CodHeaderText))
            {
                string newline = clientorder.CodHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientorder.CodHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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

            int clientorderLineCount = clientorder.ClientOrderLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < clientorderLineCount; index++)
            {
                var cil = clientorder.ClientOrderLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : !string.IsNullOrEmpty(cil.PrdName) ? cil.PrdName : cil.ColPrdName;

                string Description = cil.ColDescription;
                string PrdDescription = cil.ColPrdDes;
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

                string order = string.Format("{0:n0}.{1:n0}", cil.ColLevel1, cil.ColLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ColQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ColUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.ColTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.ColPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * avoirCoef) : string.Empty;

                string clnUPriceDisplay = (cil.LtpId == 2 || cil.LtpId == 4) ? (((cil.ColDiscountAmount ?? 0) == 0) ? ClnPriceWithDiscount : string.Format("{0:n3}\r\n{1}{2:n3}\r\n= {3:n3}", cil.ColUnitPrice * avoirCoef, (avoirCoef < 0 ? "+" : "-"), (cil.ColDiscountAmount ?? 0), (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * avoirCoef)) : string.Empty;


                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * cil.ColQuantity * avoirCoef) : string.Empty;
                string tvaString = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}\r\n{1:n2}%", (cil.ColUnitPrice - (cil.ColDiscountAmount ?? 0)) * cil.ColQuantity * avoirCoef * cil.VatRate / 100, cil.VatRate) : string.Empty;


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

                    if (index < clientorderLineCount - 1)
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
                    if (index == clientorderLineCount - 1 && cil.LtpId != 3)
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
            var allLines = clientorder.ClientOrderLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientorder.CodDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHTWithoutDis = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ColUnitPrice) * m.ColQuantity) * avoirCoef;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientorder.CodDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ColPriceWithDiscountHt ?? m.ColUnitPrice) * m.ColQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;
            var totalQty = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ColQuantity);


            //if (LastLineTotalHeight > 710)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //}

            var cildis = clientorder.ClientOrderLines.Sum(l => l.ColDiscountAmount * l.ColQuantity);
            var cindis = clientorder.CodDiscountAmount ?? 0;
            if (cildis > 0 || cindis > 0)
            {
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK("總價 TOTAL", gray808080, 41, fontST08, true, Alignement.Center, false, true, leading, withTopBorder: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, clientorder.CurrencySymbol), gray808080, 7, fontST08B, true, Alignement.Right, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, clientorder.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
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
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTtc, clientorder.CurrencySymbol), gray808080, 10, fontST09B, true, Alignement.Right, true, false, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 15);
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

            if (!string.IsNullOrEmpty(clientorder.CodFooterText))
            {
                string newline = clientorder.CodFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientorder.CodFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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

            var comment = clientorder.CodClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            //if (clientorder.DfoList.Any())
            //{
            //    var dfos = clientorder.DfoList.Aggregate("發貨單號 Delivery Form : ", (current, onedfo) => current + (onedfo + "\r\n"));
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCellHK(dfos, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);



            // total line end

            // reserve de propriete


            // add bank information, rib and iban


            #region Footer Text

            #region RIB IBAN

            //var ribContent = "\r\nBank Information:";

            //if (!clientorder.CinBank.HasValue || clientorder.CinBank == 1 || clientorder.CinBank == 0)
            //{
            //    ribContent += (string.IsNullOrEmpty(society.RibAddress) ? string.Empty : (string.Format("\r\nBank Name : {0}", society.RibAddress)));
            //    ribContent += (string.IsNullOrEmpty(society.RibName) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : {0}", society.RibName)));
            //    ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency) ? string.Empty : (string.Format("\r\nBank Address : {0}", society.RibDomiciliationAgency)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeIban) ? string.Empty : (string.Format("\r\nAccount number : {0}", society.RibCodeIban)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeBic) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic)));
            //    ribContent += (string.IsNullOrEmpty(society.RibBankCode) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : {0}", society.RibBankCode)));
            //    ribContent += (string.IsNullOrEmpty(society.RibAgenceCode) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : {0}", society.RibAgenceCode)));
            //    ribContent += "\r\n ";
            //}
            //else
            //{
            //    ribContent += (string.IsNullOrEmpty(society.RibAddress2) ? string.Empty : (string.Format("\r\nBank Name : {0}", society.RibAddress2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibName2) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : {0}", society.RibName2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency2) ? string.Empty : (string.Format("\r\nBank Address : {0}", society.RibDomiciliationAgency2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeIban2) ? string.Empty : (string.Format("\r\nAccount number : {0}", society.RibCodeIban2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeBic2) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibBankCode2) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : {0}", society.RibBankCode2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibAgenceCode2) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : {0}", society.RibAgenceCode2)));
            //    ribContent += "\r\n ";
            //}


            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST08, true, Alignement.Left, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(ribContent, BaseColor.WHITE, 47, fontST08B, true, Alignement.Left, false, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //table.AddCell(cell);


            #endregion RIB IBAN


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 48, fontST08, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);




            #endregion Footer Text


            //middleTable.AddCell(table);


            #region Penality
            //// add table to check the end of page
            //// 20180112 add pageHeight Chenglin
            //var pageHeight = 790;
            //pageHeight = 1200;
            //if (LastLineTotalHeight > pageHeight)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    AddTable(middleTable, table, addNewPage: true);
            //}

            //for (int i = 0; i < 1000; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 800)
            //    {
            //        break;
            //    }
            //}

            //table = CreateTable(nbColumns, 0, defineWidths);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            ////table.AddCell(cell);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            ////table.AddCell(cell);
            ////cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            ////table.AddCell(cell);

            //// total line end

            //// reserve de propriete

            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);

            ////string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            //string penality = string.Format("{0}{2}{1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment, ((!string.IsNullOrEmpty(HeaderFooter.ClientInvoiceDiscountForPrepayment) || !string.IsNullOrEmpty(HeaderFooter.clientorderPenality)) ? " - " : ""));
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(penality, BaseColor.WHITE, 48, fontST06, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //string reserveText = HeaderFooter.DeliveryFooterLaw;
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reserveText, BaseColor.WHITE, 48, fontST06, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }


    }
}
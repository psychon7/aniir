using System;
using System.Collections.Generic;
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

        public static MemoryStream PdfCin_hk(string path, ClientInvoice clientinvoice, Society society, string DownloadTechSheetUrl, bool withTechSheet = false, int lgsId = 0)
        {
            int avoirCoef = clientinvoice.CinAccount ? -1 : 1;
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

            string title = clientinvoice.CinIsInvoice ? "商业发票 COMMERCIAL INVOICE" : "贷记单 CREDIT NOTE";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, clientinvoice.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, clientinvoice.CinCode, (lgsId != 0 ? "-EXP" : ""));

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //    table.AddCell(cell);
            //}

            // 给LOGO让18格 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 30, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            //发票号 发票号和客户同一行
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 30, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);

            #endregion Header


            #endregion Set space white

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += clientinvoice.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(clientinvoice.Inv_CcoAddress1) ? "" : ("\r\n" + clientinvoice.Inv_CcoAddress1));
            clientinfor += (string.IsNullOrEmpty(clientinvoice.Inv_CcoAddress2) ? "" : ("\r\n" + clientinvoice.Inv_CcoAddress2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               clientinvoice.Inv_CcoPostcode,
               clientinvoice.Inv_CcoCity,
               !string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity) ? " / " : "",
                (!string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCountry) ? " " : "",
               clientinvoice.Inv_CcoCountry);

            clientinfor += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 27, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 20, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 26, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinfor, greenC4FFC4, 20, fontKT11B, false, Alignement.Left, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 27, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 20, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address Field



            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            if (!string.IsNullOrEmpty(clientinvoice.CinHeaderText))
            {
                string newline = clientinvoice.CinHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 46, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("发票号 Client Invoice NO. : {0}", clientinvoice.CinCode), BaseColor.WHITE, 24, fontKT11B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("发票日期 Invoice Date : {0}", string.Format("{0:yyyy-MMM-dd}", clientinvoice.CinDInvoice).ToUpper()), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            if (clientinvoice.TteId.HasValue && clientinvoice.TteId != 0)
            {
                cell = CreateHeaderCell(string.Format("发票名 Invoice Name : {0}", clientinvoice.CinName), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("贸易条款 Trade Terms : {0}", clientinvoice.TradeTerms), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }
            else
            {
                cell = CreateHeaderCell(string.Format("发票名 Invoice Name : {0}", clientinvoice.CinName), BaseColor.WHITE, 48, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }


            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("NO.", BaseColor.WHITE, 3, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.WHITE, 8, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("图像 IMG.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.WHITE, 14, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY.", BaseColor.WHITE, 5, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("单价 U.P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("折后价 DIS. P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = clientinvoice.ClientInvoiceLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = clientinvoice.ClientInvoiceLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.CiiPrdName;

                string Description = cil.CiiDescription;
                string PrdDescription = cil.CiiPrdDes;
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

                string order = string.Format("{0:n0}.{1:n0}", cil.CiiLevel1, cil.CiiLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n3}", cil.CiiUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.CiiTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.CiiPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n3}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5 || cil.LtpId == 7) ? string.Format("{0:n3}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;

                cell = CreateHeaderCell(order, BaseColor.WHITE, 3, fontKT10, false, Alignement.Left, true, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 8, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
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
                    //        Colspan = 6,
                    //        BorderWidthBottom = 0,
                    //        BorderWidthLeft = 0f,
                    //        BorderWidthTop = 0.5f,
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
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //    table.AddCell(cell);
                    //}
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 14, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCell(allDes, BaseColor.WHITE, 13, fontKT10, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 5, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnTotalPrice, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 39, fontKT10, false, Alignement.Left, false, true, leading, 5, forContent: true, withTopBorder: true, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);


                // new line for more space
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 14, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 14, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("NO.", BaseColor.WHITE, 3, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.WHITE, 8, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("图像 IMG.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.WHITE, 14, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY.", BaseColor.WHITE, 5, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("单价 U.P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("折后价 DIS. P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("总价 TOTAL", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 14, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            // total line title
            var allLines = clientinvoice.ClientInvoiceLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientinvoice.CinDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientinvoice.CinDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;


            if (LastLineTotalHeight > 710)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
                table.AddCell(cell);
                AddTable(middleTable, table);
            }


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", greenC4FFC4, 41, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, clientinvoice.CurrencySymbol), greenC4FFC4, 7, fontKT10, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            // add table to check the end of page

            for (int i = 0; i < 2; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(clientinvoice.CinFooterText))
            {
                string newline = clientinvoice.CinFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = clientinvoice.CinClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            if (clientinvoice.DfoList.Any())
            {
                var dfos = clientinvoice.DfoList.Aggregate("发货单号 Delivery Form : ", (current, onedfo) => current + (onedfo + "\r\n"));
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(dfos, BaseColor.WHITE, 48, fontKT10, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);



            // total line end

            // reserve de propriete


            // add bank information, rib and iban


            #region Footer Text

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(content, BaseColor.WHITE, 25, fontKT10, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);


            #region RIB IBAN



            var ribContent = "\r\nBank Information:";

            //if (!clientinvoice.CinBank.HasValue || clientinvoice.CinBank == 1 || clientinvoice.CinBank == 0)
            //{
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibAddress) ? string.Empty : (string.Format("\r\nBank Name : \r\n{0}", clientinvoice.RibAddress)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibName) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : \r\n{0}", clientinvoice.RibName)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibDomiciliationAgency) ? string.Empty : (string.Format("\r\nBank Address : \r\n{0}", clientinvoice.RibDomiciliationAgency)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibCodeIban) ? string.Empty : (string.Format("\r\nAccount number : \r\n{0}", clientinvoice.RibCodeIban)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibCodeBic) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", clientinvoice.RibCodeBic)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibBankCode) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : \r\n{0}", clientinvoice.RibBankCode)));
                ribContent += (string.IsNullOrEmpty(clientinvoice.RibAgenceCode) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : \r\n{0}", clientinvoice.RibAgenceCode)));
                ribContent += "\r\n ";
            //}
            //else
            //{
            //    ribContent += (string.IsNullOrEmpty(society.RibAddress2) ? string.Empty : (string.Format("\r\nBank Name : \r\n{0}", society.RibAddress2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibName2) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : \r\n{0}", society.RibName2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency2) ? string.Empty : (string.Format("\r\nBank Address : \r\n{0}", society.RibDomiciliationAgency2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeIban2) ? string.Empty : (string.Format("\r\nAccount number : \r\n{0}", society.RibCodeIban2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibCodeBic2) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibBankCode2) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : \r\n{0}", society.RibBankCode2)));
            //    ribContent += (string.IsNullOrEmpty(society.RibAgenceCode2) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : \r\n{0}", society.RibAgenceCode2)));
            //    ribContent += "\r\n ";
            //}

            cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 20, fontKT10, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);


            #endregion RIB IBAN


            #endregion Footer Text


            middleTable.AddCell(table);


            #region Penality
            // add table to check the end of page
            // 20180112 add pageHeight Chenglin
            var pageHeight = 790;
            pageHeight = 1200;
            if (LastLineTotalHeight > pageHeight)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            for (int i = 0; i < 500; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 790)
                {
                    break;
                }
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            //string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            string penality = string.Format("{0}{2}{1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment, ((!string.IsNullOrEmpty(HeaderFooter.ClientInvoiceDiscountForPrepayment) || !string.IsNullOrEmpty(HeaderFooter.ClientInvoicePenality)) ? " - " : ""));
            cell = CreateHeaderCell(penality, BaseColor.WHITE, 50, fontKT08, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            string reserveText = HeaderFooter.DeliveryFooterLaw;
            cell = CreateHeaderCell(reserveText, BaseColor.WHITE, 50, fontKT08, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }
        public static MemoryStream PdfCin_hkWithImg(string path, ClientInvoice clientinvoice, Society society, string DownloadTechSheetUrl, bool withTechSheet = false, int lgsId = 0)
        {
            int avoirCoef = clientinvoice.CinAccount ? -1 : 1;
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

            string title = clientinvoice.CinIsInvoice ? "商业发票 COMMERCIAL INVOICE" : "贷记单 CREDIT NOTE";

            //string reportTitle = string.Format("{0}\r\nNO. : {1}", title, clientinvoice.CinCode);
            string reportTitle = string.Format("{0}\r\nN° : {1}{2}", title, clientinvoice.CinCode, (lgsId != 0 ? "-EXP" : ""));

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;

            //for (int i = 0; i < 2; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //    table.AddCell(cell);
            //}

            // 给LOGO让18格 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 30, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            //发票号 发票号和客户同一行
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 30, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);

            #endregion Header


            #endregion Set space white

            #region Address Field

            float spaceLogo = 10;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            var clientinfor = string.Empty;
            clientinfor += clientinvoice.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(clientinvoice.Inv_CcoAddress1) ? "" : ("\r\n" + clientinvoice.Inv_CcoAddress1));
            clientinfor += (string.IsNullOrEmpty(clientinvoice.Inv_CcoAddress2) ? "" : ("\r\n" + clientinvoice.Inv_CcoAddress2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               clientinvoice.Inv_CcoPostcode,
               clientinvoice.Inv_CcoCity,
               !string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity) ? " / " : "",
                (!string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCountry) ? " " : "",
               clientinvoice.Inv_CcoCountry);

            clientinfor += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 27, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 20, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 26, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinfor, greenC4FFC4, 20, fontKT11B, false, Alignement.Left, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 27, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 20, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address Field



            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            if (!string.IsNullOrEmpty(clientinvoice.CinHeaderText))
            {
                string newline = clientinvoice.CinHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 46, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("发票号 Client Invoice NO. : {0}", clientinvoice.CinCode), BaseColor.WHITE, 24, fontKT11B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("发票日期 Invoice Date : {0}", string.Format("{0:yyyy-MMM-dd}", clientinvoice.CinDInvoice).ToUpper()), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            if (clientinvoice.TteId.HasValue && clientinvoice.TteId != 0)
            {
                cell = CreateHeaderCell(string.Format("发票名 Invoice Name : {0}", clientinvoice.CinName), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("贸易条款 Trade Terms : {0}", clientinvoice.TradeTerms), BaseColor.WHITE, 24, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }
            else
            {
                cell = CreateHeaderCell(string.Format("发票名 Invoice Name : {0}", clientinvoice.CinName), BaseColor.WHITE, 48, fontKT11, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }


            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("NO.", BaseColor.WHITE, 3, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("图像 IMG.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.WHITE, 10, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY.", BaseColor.WHITE, 5, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("单价 U.P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("折后价 DIS. P.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = clientinvoice.ClientInvoiceLines.Count;
            bool withTopBorder = true;

            float minheight = 13;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = clientinvoice.ClientInvoiceLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.CiiPrdName;

                string Description = cil.CiiDescription;
                string PrdDescription = cil.CiiPrdDes;
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

                string order = string.Format("{0:n0}.{1:n0}", cil.CiiLevel1, cil.CiiLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n3}", cil.CiiUnitPrice * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n3}", cil.CiiTotalPrice * avoirCoef) : string.Empty;
                //string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n3}", cil.CiiPriceWithDiscountHt * avoirCoef) : string.Empty;

                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n3}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5 || cil.LtpId == 7) ? string.Format("{0:n3}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;

                cell = CreateHeaderCell(order, BaseColor.WHITE, 3, fontKT10, false, Alignement.Left, true, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 6, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
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
                            Colspan = 6,
                            BorderWidthBottom = 0,
                            BorderWidthLeft = 0f,
                            BorderWidthTop = 0.5f,
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
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                        table.AddCell(cell);
                    }
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 10, fontKT10, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCell(allDes, BaseColor.WHITE, 13, fontKT10, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 5, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnTotalPrice, BaseColor.WHITE, 6, fontKT10, false, Alignement.Right, false, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 39, fontKT10, false, Alignement.Left, false, true, leading, 5, forContent: true, withTopBorder: true, footerTop: 0, minHeight: minheight);
                    //cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 13, fontST08, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                table.AddCell(cell);


                // new line for more space
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("NO.", BaseColor.WHITE, 3, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("图像 IMG.", BaseColor.WHITE, 6, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.WHITE, 10, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY.", BaseColor.WHITE, 5, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("单价 U.P.", BaseColor.WHITE, 7, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("折后价 DIS. P.", BaseColor.WHITE, 7, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("总价 TOTAL", BaseColor.WHITE, 7, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            // total line title
            var allLines = clientinvoice.ClientInvoiceLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientinvoice.CinDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientinvoice.CinDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;


            if (LastLineTotalHeight > 710)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 0);
                table.AddCell(cell);
                AddTable(middleTable, table);
            }


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", greenC4FFC4, 41, fontKT10, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, clientinvoice.CurrencySymbol), greenC4FFC4, 7, fontKT10, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            // add table to check the end of page

            for (int i = 0; i < 2; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(clientinvoice.CinFooterText))
            {
                string newline = clientinvoice.CinFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = clientinvoice.CinClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(comment, BaseColor.WHITE, 48, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            if (clientinvoice.DfoList.Any())
            {
                var dfos = clientinvoice.DfoList.Aggregate("发货单号 Delivery Form : ", (current, onedfo) => current + (onedfo + "\r\n"));
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(dfos, BaseColor.WHITE, 48, fontKT10, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);



            // total line end

            // reserve de propriete


            // add bank information, rib and iban


            #region Footer Text

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(content, BaseColor.WHITE, 25, fontKT10, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);


            #region RIB IBAN



            var ribContent = "\r\nBank Information:";

            if (!clientinvoice.CinBank.HasValue || clientinvoice.CinBank == 1 || clientinvoice.CinBank == 0)
            {
                ribContent += (string.IsNullOrEmpty(society.RibAddress) ? string.Empty : (string.Format("\r\nBank Name : \r\n{0}", society.RibAddress)));
                ribContent += (string.IsNullOrEmpty(society.RibName) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : \r\n{0}", society.RibName)));
                ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency) ? string.Empty : (string.Format("\r\nBank Address : \r\n{0}", society.RibDomiciliationAgency)));
                ribContent += (string.IsNullOrEmpty(society.RibCodeIban) ? string.Empty : (string.Format("\r\nAccount number : \r\n{0}", society.RibCodeIban)));
                ribContent += (string.IsNullOrEmpty(society.RibCodeBic) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic)));
                ribContent += (string.IsNullOrEmpty(society.RibBankCode) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : \r\n{0}", society.RibBankCode)));
                ribContent += (string.IsNullOrEmpty(society.RibAgenceCode) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : \r\n{0}", society.RibAgenceCode)));
                ribContent += "\r\n ";
            }
            else
            {
                ribContent += (string.IsNullOrEmpty(society.RibAddress2) ? string.Empty : (string.Format("\r\nBank Name : \r\n{0}", society.RibAddress2)));
                ribContent += (string.IsNullOrEmpty(society.RibName2) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : \r\n{0}", society.RibName2)));
                ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency2) ? string.Empty : (string.Format("\r\nBank Address : \r\n{0}", society.RibDomiciliationAgency2)));
                ribContent += (string.IsNullOrEmpty(society.RibCodeIban2) ? string.Empty : (string.Format("\r\nAccount number : \r\n{0}", society.RibCodeIban2)));
                ribContent += (string.IsNullOrEmpty(society.RibCodeBic2) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic2)));
                ribContent += (string.IsNullOrEmpty(society.RibBankCode2) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : \r\n{0}", society.RibBankCode2)));
                ribContent += (string.IsNullOrEmpty(society.RibAgenceCode2) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : \r\n{0}", society.RibAgenceCode2)));
                ribContent += "\r\n ";
            }

            cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 20, fontKT10, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);


            #endregion RIB IBAN


            #endregion Footer Text


            middleTable.AddCell(table);


            #region Penality
            // add table to check the end of page
            // 20180112 add pageHeight Chenglin
            var pageHeight = 790;
            pageHeight = 1200;
            if (LastLineTotalHeight > pageHeight)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            for (int i = 0; i < 500; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 790)
                {
                    break;
                }
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            //string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            string penality = string.Format("{0}{2}{1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment, ((!string.IsNullOrEmpty(HeaderFooter.ClientInvoiceDiscountForPrepayment) || !string.IsNullOrEmpty(HeaderFooter.ClientInvoicePenality)) ? " - " : ""));
            cell = CreateHeaderCell(penality, BaseColor.WHITE, 50, fontKT08, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            string reserveText = HeaderFooter.DeliveryFooterLaw;
            cell = CreateHeaderCell(reserveText, BaseColor.WHITE, 50, fontKT08, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }
    }
}
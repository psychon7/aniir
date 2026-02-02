using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Mime;
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

        public static MemoryStream PdfSod_hk02(string path, PurchaseBaseClass supplierOrder, bool withPaymentInfo)
        {
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
            float[] defineWidths = new float[] { 0.5F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 0.5F };
            int nbColumns = 19;
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

            string reportTitle = string.Format("採購訂單 SUPPLIER ORDER \r\nN° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 13, fontST13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            // company info
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 13, fontST11B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 9, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            var supInfo = string.Empty;
            supInfo += supplierOrder.OneSupplier.CompanyName.ToUpper();
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address1) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address1));
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address2) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               supplierOrder.OneSupplier.Postcode,
               supplierOrder.OneSupplier.City,
               !string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.City) ? " / " : "",
                (!string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) || !string.IsNullOrEmpty(supplierOrder.OneSupplier.City)) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.Country) ? " " : "",
               supplierOrder.OneSupplier.Country);
            supInfo += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST11B, false, Alignement.Left, true, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(supInfo, BaseColor.WHITE, 6, fontST11B, false, Alignement.Left, false, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);


            var ordercode = string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode);
            var orderdate = string.Format("下單日期 Order Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation)
                    .ToUpper());
            var ordername = string.Format("訂單名 Order Name : {0}", supplierOrder.SodName);
            var todaydate = string.Format("打印日期 Print Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper());

            var sodinfo = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", orderdate, todaydate, ordercode, ordername);


            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(sodinfo, BaseColor.WHITE, 8, fontST09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 8, fontST13B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("图像 IMG.", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("總價 TOTAL", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("稅額 TAX.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line


            decimal? totalQty = 0;
            decimal? totalHTcalBeforeDis = 0;
            decimal? totalHTcalAfterDis = 0;
            decimal? totalTVAamount = 0;
            decimal? totalTTCcal = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            bool withDiscount = false;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                var discountAmount = cil.DiscountAmount ?? 0;
                var tvaamount = cil.UnitPriceWithDis * cil.Quantity * cil.VatRate / 100;
                totalTVAamount += tvaamount ?? 0;
                var tvaamountstr = string.Format("{0:n3}\r\n{1:n2}%", tvaamount, cil.VatRate);
                string PriceUnit = discountAmount > 0 ? string.Format("{0:n3}\r\n{1:n3}\r\n--------\r\n{2:n3}", cil.UnitPrice, discountAmount * -1, cil.UnitPriceWithDis) : string.Format("{0:n3}", cil.UnitPriceWithDis);
                //string TotalPrice = string.Format("{0:n3}", cil.TotalCrudePrice);
                string TotalPrice = string.Format("{0:n3}", cil.Quantity * cil.UnitPriceWithDis);
                totalHTcalBeforeDis += (cil.Quantity * (cil.UnitPrice ?? 0));
                totalHTcalAfterDis += (cil.TotalPrice ?? 0);
                totalTTCcal += (cil.TotalCrudePrice ?? 0);
                string solComment = cil.Comment;
                int order = cil.Order;
                totalQty += cil.Quantity;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                allDes = string.IsNullOrEmpty(solComment) ?
                allDes :
                (string.IsNullOrEmpty(allDes) ? solComment : (allDes + "\r\n----------------------\r\n" + solComment));

                // product description
                string productInfo = (cil.Power != "null" && cil.Power != "0" && !string.IsNullOrEmpty(cil.Power)) ? ("功率/Power: " + cil.Power + "W\r\n") : string.Empty;
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("電源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色溫/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("長/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("寬(直徑)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快遞或最快的飛機/Fastest plane/Express" : cil.Logistic == "2" ? "經濟飛機/Cheapest plane" : "船運/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征碼/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;


                allDes = string.IsNullOrEmpty(productInfo) ? allDes : (allDes + "\r\n----------------------\r\n" + productInfo);

                withDiscount = withDiscount || (cil.DiscountAmount > 0);

                cell = CreateHeaderCellHK(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontST07, false, Alignement.Center, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //string prdImagePath = cil.PrdImgPath;
                //if (File.Exists(prdImagePath))
                //{
                //    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);                  
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
                //        Colspan = 1,
                //        BorderWidthBottom = 0f,
                //        BorderWidthLeft = 0f,
                //        BorderWidthRight = 0f,
                //        BorderWidthTop = 0f,
                //        FixedHeight = fixedImageHeight,
                //        PaddingTop = 5f,
                //        PaddingBottom = 5f,
                //        PaddingLeft = 5f,
                //        PaddingRight = 5f
                //    };
                //    var pdfCustomCellBorder = new PdfCustomCellBorderTop();
                //    imageCell.CellEvent = pdfCustomCellBorder;
                //    table.AddCell(imageCell);
                //}
                //else
                //{
                //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //    table.AddCell(cell);
                //}
                //cell = CreateHeaderCellHK(supPrdName, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 6, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(PriceUnit, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(TotalPrice, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(tvaamountstr, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("图像 IMG.", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("未稅单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("稅額 TAX.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }



            // total line title
            var allLines = supplierOrder.PurchaseLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;


            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalWithoutDis = allLines.Sum(m => (m.UnitPrice) * m.Quantity);
            var totalHT = allLines.Sum(m => ((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity));
            var totalTtc = allLines.Sum(m => (((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity)) * (1 + m.VatRate / 100));
            var discount = allLines.Sum(m => m.DiscountAmount * m.Quantity);
            var netHt = totalHT;
            var totalTva = allLines.Sum(m => (((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity)) * (m.VatRate / 100));
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;


            if (withDiscount)
            {

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總計 TOTAL", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTcalBeforeDis), BaseColor.WHITE, 2, fontST09, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折扣 DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", discount * -1), BaseColor.WHITE, 2, fontST09, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅折後總計 TOTAL EX-TAX WITH DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", (totalHTcalBeforeDis - discount)), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額 TAX AMOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTva), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅折後總計 TOTAL INC-TAX WITH DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTTCcal), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }
            else
            // total quantity
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總計 TOTAL EX-TAX", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("總計 TOTAL", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTcalBeforeDis), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTVAamount), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額 TAX AMOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTVAamount), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總計 TOTAL INC-TAX", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTTCcal), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅 | EX-TAX", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (totalHTcalBeforeDis - discount), supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK("稅額 | VAT", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTVAamount, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK("總價 |  TOTAL", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTTCcal, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            if (withPaymentInfo)
            {
                // 新的一行
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("已付 |   PAID", lightgreen, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                // 新的一行
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未付 | TO PAY", BaseColor.PINK, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (totalTTCcal - supplierOrder.Paid), supplierOrder.CurrencySymbol), BaseColor.PINK, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            //cell = CreateHeaderCellHK("詳情|DETAL", BaseColor.LIGHT_GRAY, 6, fontST09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            ////cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            ////table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //var paidamount = 

            //for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    if (lineIndex < tvaCount)
            //    {
            //        var oneTva = tvaUsed.ElementAt(lineIndex);
            //        var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice)) * m.Quantity);
            //        var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
            //        var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => (((m.UnitPriceWithDis ?? m.UnitPrice)) * m.Quantity) * (m.VatRate / 100));
            //        var ttcamount = baseHt + tvaamount;
            //        bool withBottom = lineIndex == tvaCount - 1;
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "折扣 | DISCOUNT";
            //            fieldValue = (discount ?? 0) * -1;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "未稅總價 | TT. E.TAX";
            //                fieldValue = totalWithoutDis ?? 0;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "稅額 | TT. VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "含稅總價 | TT. I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "待支付 | TT. TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        if (lineIdxForCalculate == 3)
            //        {

            //            if (withPaymentInfo)
            //            {
            //                if (supplierOrder.Paid > 0)
            //                {
            //                    cell = CreateHeaderCellHK("已支付 | PAID", lightgreen, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);

            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                }
            //                cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //            }
            //        }
            //        else
            //        {
            //            cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //        }

            //    }
            //    else
            //    {
            //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 11, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "折扣 | DISCOUNT";
            //            fieldValue = (discount ?? 0) * -1;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "未稅總價 | TT. E.TAX";
            //                fieldValue = totalWithoutDis ?? 0;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "稅額 | TT. VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "含稅總價 | TT. I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "待支付 | TT. TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        if (lineIdxForCalculate == 3)
            //        {
            //            if (withPaymentInfo)
            //            {
            //                if (supplierOrder.Paid > 0)
            //                {
            //                    cell = CreateHeaderCellHK("已支付 | PAID", lightgreen, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);

            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                }
            //                cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //            }
            //        }
            //        else
            //        {
            //            cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //        }
            //    }
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);

            //}

            // total line end

            // reserve de propriete


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息
            var contactinfo = "如果有任何問題，請您聯係以下聯絡人\r\nIf you have any question, please contact the following contact";
            //var creatorinfo = string.Format("{4}\r\n聯絡人Contact: {0} {1}\r\nEMAIL: {2}\r\n手提電話Cellphone: {3}", supplierOrder.Creator.Firstname,
            //    supplierOrder.Creator.Lastname, supplierOrder.Creator.Email, supplierOrder.Creator.Cellphone, contactinfo);

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format(CultureInfo.CreateSpecificCulture("en-US"), "# {0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            contactinfo += ("\r\n" + SodCreatorInfo(supplierOrder));
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = contactinfo;

            if (!string.IsNullOrEmpty(content))
            {
                //if (content.Contains("\r\n"))
                //{
                //    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                //    int count = lines.Count;
                //    for (int i = 0; i < count; i++)
                //    {
                //        var anitem = lines.ElementAt(i);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(anitem, BaseColor.WHITE, 17, fontKT08, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //    }
                //}
                //else
                //{
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(content, BaseColor.WHITE, 17, fontST07, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                //}
            }



            #endregion end part Other footer
            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_WithoutP_hk02(string path, PurchaseBaseClass supplierOrder)
        {
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
            float[] defineWidths = new float[] { 0.5F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 0.5F };
            int nbColumns = 19;
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

            string reportTitle = string.Format("採購訂單 SUPPLIER ORDER \r\nN° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 13, fontST13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            // company info
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 13, fontST11B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 9, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            var supInfo = string.Empty;
            supInfo += supplierOrder.OneSupplier.CompanyName.ToUpper();
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address1) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address1));
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address2) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               supplierOrder.OneSupplier.Postcode,
               supplierOrder.OneSupplier.City,
               !string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.City) ? " / " : "",
                (!string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) || !string.IsNullOrEmpty(supplierOrder.OneSupplier.City)) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.Country) ? " " : "",
               supplierOrder.OneSupplier.Country);
            supInfo += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST11B, false, Alignement.Left, true, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(supInfo, BaseColor.WHITE, 6, fontST11B, false, Alignement.Left, false, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);


            var ordercode = string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode);
            var orderdate = string.Format("下單日期 Order Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation)
                    .ToUpper());
            var ordername = string.Format("訂單名 Order Name : {0}", supplierOrder.SodName);
            var todaydate = string.Format("打印日期 Print Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper());

            var sodinfo = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", orderdate, todaydate, ordercode, ordername);


            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(sodinfo, BaseColor.WHITE, 8, fontST09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 8, fontST13B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontST09B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("下單日期 Order Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation).ToUpper()), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("訂單名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("出單日期 Today's Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper()), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCellHK(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REFERENCE", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("图像 IMAGE", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DESCRIPTION", BaseColor.LIGHT_GRAY, 11, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            decimal? totalQty = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                string PriceUnit = string.Format("{0:n3}", cil.UnitPriceWithDis);
                string TotalPrice = string.Format("{0:n3}", cil.TotalPrice);
                string solComment = cil.Comment;
                int order = cil.Order;
                totalQty += cil.Quantity;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                allDes = string.IsNullOrEmpty(solComment) ?
                allDes :
                (string.IsNullOrEmpty(allDes) ? solComment : (allDes + "\r\n----------------------\r\n" + solComment));



                // product description
                string productInfo = (cil.Power != "null" && cil.Power != "0" && !string.IsNullOrEmpty(cil.Power)) ? ("功率/Power: " + cil.Power + "W\r\n") : string.Empty;
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("電源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色溫/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("長/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("寬(直徑)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快遞或最快的飛機/Fastest plane/Express" : cil.Logistic == "2" ? "經濟飛機/Cheapest plane" : "船運/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征碼/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCellHK(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontST07, false, Alignement.Center, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 3, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(supPrdName, BaseColor.WHITE, 3, fontST07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //string prdImagePath = cil.PrdImgPath;
                //if (File.Exists(prdImagePath))
                //{
                //    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);                  
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
                //        Colspan = 2,
                //        BorderWidthBottom = 0f,
                //        BorderWidthLeft = 0f,
                //        BorderWidthRight = 0f,
                //        BorderWidthTop = 0f,
                //        FixedHeight = fixedImageHeight,
                //        PaddingTop = 5f,
                //        PaddingBottom = 5f,
                //        PaddingLeft = 5f,
                //        PaddingRight = 5f
                //    };
                //    var pdfCustomCellBorder = new PdfCustomCellBorderTop();
                //    imageCell.CellEvent = pdfCustomCellBorder;
                //    table.AddCell(imageCell);
                //}
                //else
                //{
                //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //    table.AddCell(cell);
                //}
                cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 11, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(PriceUnit, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(TotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 11, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REFERENCE", BaseColor.LIGHT_GRAY, 3, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("图像 IMAGE", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 3, fontST09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DESCRIPTION", BaseColor.LIGHT_GRAY, 11, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 11, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }
            // total quantity
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("總數量 TOTAL QUANTITY", BaseColor.LIGHT_GRAY, 15, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }



            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            // reserve de propriete
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息
            var contactinfo = "如果有任何問題，請您聯係以下聯絡人\r\nIf you have any question, please contact the following contact";
            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format(CultureInfo.CreateSpecificCulture("en-US"), "# {0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            contactinfo += ("\r\n" + SodCreatorInfo(supplierOrder));
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = contactinfo;
            if (!string.IsNullOrEmpty(content))
            {
                //if (content.Contains("\r\n"))
                //{
                //    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                //    int count = lines.Count;
                //    for (int i = 0; i < count; i++)
                //    {
                //        var anitem = lines.ElementAt(i);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(anitem, BaseColor.WHITE, 17, fontKT08, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //    }
                //}
                //else
                //{
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(content, BaseColor.WHITE, 17, fontST07, false, Alignement.Left, false, false, leading, forContent: false, fontColor: BaseColor.BLACK);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                //}
            }



            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_hk02WithImg(string path, PurchaseBaseClass supplierOrder, bool withPaymentInfo)
        {
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
            float[] defineWidths = new float[] { 0.5F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 0.5F };
            int nbColumns = 19;
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

            string reportTitle = string.Format("採購訂單 SUPPLIER ORDER \r\nN° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 13, fontST13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            // company info
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 13, fontST11B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 9, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            var supInfo = string.Empty;
            supInfo += supplierOrder.OneSupplier.CompanyName.ToUpper();
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address1) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address1));
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address2) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               supplierOrder.OneSupplier.Postcode,
               supplierOrder.OneSupplier.City,
               !string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.City) ? " / " : "",
                (!string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) || !string.IsNullOrEmpty(supplierOrder.OneSupplier.City)) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.Country) ? " " : "",
               supplierOrder.OneSupplier.Country);
            supInfo += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST11B, false, Alignement.Left, true, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(supInfo, BaseColor.WHITE, 6, fontST11B, false, Alignement.Left, false, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);


            var ordercode = string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode);
            var orderdate = string.Format("下單日期 Order Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation)
                    .ToUpper());
            var ordername = string.Format("訂單名 Order Name : {0}", supplierOrder.SodName);
            var todaydate = string.Format("打印日期 Print Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper());

            var sodinfo = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", orderdate, todaydate, ordercode, ordername);


            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(sodinfo, BaseColor.WHITE, 8, fontST09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 8, fontST13B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("图像 IMG.", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("總價 TOTAL", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("稅額 TAX.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line


            decimal? totalQty = 0;
            decimal? totalHTcalBeforeDis = 0;
            decimal? totalHTcalAfterDis = 0;
            decimal? totalTVAamount = 0;
            decimal? totalTTCcal = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            bool withDiscount = false;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                var discountAmount = cil.DiscountAmount ?? 0;
                var tvaamount = cil.UnitPriceWithDis * cil.Quantity * cil.VatRate / 100;
                totalTVAamount += tvaamount ?? 0;
                var tvaamountstr = string.Format("{0:n3}\r\n{1:n2}%", tvaamount, cil.VatRate);
                string PriceUnit = discountAmount > 0 ? string.Format("{0:n3}\r\n{1:n3}\r\n--------\r\n{2:n3}", cil.UnitPrice, discountAmount * -1, cil.UnitPriceWithDis) : string.Format("{0:n3}", cil.UnitPriceWithDis);
                //string TotalPrice = string.Format("{0:n3}", cil.TotalCrudePrice);
                string TotalPrice = string.Format("{0:n3}", cil.Quantity * cil.UnitPriceWithDis);
                totalHTcalBeforeDis += (cil.Quantity * (cil.UnitPrice ?? 0));
                totalHTcalAfterDis += (cil.TotalPrice ?? 0);
                totalTTCcal += (cil.TotalCrudePrice ?? 0);
                string solComment = cil.Comment;
                int order = cil.Order;
                totalQty += cil.Quantity;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                allDes = string.IsNullOrEmpty(solComment) ?
                allDes :
                (string.IsNullOrEmpty(allDes) ? solComment : (allDes + "\r\n----------------------\r\n" + solComment));

                // product description
                string productInfo = (cil.Power != "null" && cil.Power != "0" && !string.IsNullOrEmpty(cil.Power)) ? ("功率/Power: " + cil.Power + "W\r\n") : string.Empty;
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("電源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色溫/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("長/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("寬(直徑)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快遞或最快的飛機/Fastest plane/Express" : cil.Logistic == "2" ? "經濟飛機/Cheapest plane" : "船運/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征碼/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;


                allDes = string.IsNullOrEmpty(productInfo) ? allDes : (allDes + "\r\n----------------------\r\n" + productInfo);

                withDiscount = withDiscount || (cil.DiscountAmount > 0);
                
                cell = CreateHeaderCellHK(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontST07, false, Alignement.Center, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                string prdImagePath = cil.PrdImgPath;
                if (File.Exists(prdImagePath))
                {
                    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);                  
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
                        Colspan = 1,
                        BorderWidthBottom = 0f,
                        BorderWidthLeft = 0f,                        
                        BorderWidthRight = 0f,
                        BorderWidthTop= 0f,
                        FixedHeight = fixedImageHeight,
                        PaddingTop = 5f,
                        PaddingBottom = 5f,
                        PaddingLeft = 5f,
                        PaddingRight = 5f
                    };
                    var pdfCustomCellBorder = new PdfCustomCellBorderTop();
                    imageCell.CellEvent = pdfCustomCellBorder;
                    table.AddCell(imageCell);
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                //cell = CreateHeaderCellHK(supPrdName, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 4, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(PriceUnit, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(TotalPrice, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(tvaamountstr, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("图像 IMG.", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("未稅单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("稅額 TAX.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }



            // total line title
            var allLines = supplierOrder.PurchaseLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;


            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalWithoutDis = allLines.Sum(m => (m.UnitPrice) * m.Quantity);
            var totalHT = allLines.Sum(m => ((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity));
            var totalTtc = allLines.Sum(m => (((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity)) * (1 + m.VatRate / 100));
            var discount = allLines.Sum(m => m.DiscountAmount * m.Quantity);
            var netHt = totalHT;
            var totalTva = allLines.Sum(m => (((m.UnitPriceWithDis ?? (m.UnitPrice - m.DiscountAmount ?? 0)) * m.Quantity)) * (m.VatRate / 100));
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;


            if (withDiscount)
            {

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總計 TOTAL", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTcalBeforeDis), BaseColor.WHITE, 2, fontST09, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("折扣 DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", discount * -1), BaseColor.WHITE, 2, fontST09, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅折後總計 TOTAL EX-TAX WITH DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", (totalHTcalBeforeDis - discount)), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額 TAX AMOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTva), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅折後總計 TOTAL INC-TAX WITH DISCOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTTCcal), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }
            else
            // total quantity
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未稅總計 TOTAL EX-TAX", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK("總計 TOTAL", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalHTcalBeforeDis), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTVAamount), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("稅額 TAX AMOUNT", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTVAamount), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("含稅總計 TOTAL INC-TAX", BaseColor.WHITE, 9, fontST09B, true, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3}", totalTTCcal), BaseColor.WHITE, 2, fontST09B, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("未稅 | EX-TAX", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (totalHTcalBeforeDis - discount), supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK("稅額 | VAT", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTVAamount, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK("總價 |  TOTAL", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalTTCcal, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            if (withPaymentInfo)
            {
                // 新的一行
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("已付 |   PAID", lightgreen, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                // 新的一行
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK("未付 | TO PAY", BaseColor.PINK, 3, fontST09B, true, Alignement.JUSTIFIED_ALL, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (totalTTCcal - supplierOrder.Paid), supplierOrder.CurrencySymbol), BaseColor.PINK, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }


            //cell = CreateHeaderCellHK("詳情|DETAL", BaseColor.LIGHT_GRAY, 6, fontST09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            ////cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", totalHT, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontST09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            ////table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //var paidamount = 

            //for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    if (lineIndex < tvaCount)
            //    {
            //        var oneTva = tvaUsed.ElementAt(lineIndex);
            //        var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice)) * m.Quantity);
            //        var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
            //        var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => (((m.UnitPriceWithDis ?? m.UnitPrice)) * m.Quantity) * (m.VatRate / 100));
            //        var ttcamount = baseHt + tvaamount;
            //        bool withBottom = lineIndex == tvaCount - 1;
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, fontST09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "折扣 | DISCOUNT";
            //            fieldValue = (discount ?? 0) * -1;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "未稅總價 | TT. E.TAX";
            //                fieldValue = totalWithoutDis ?? 0;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "稅額 | TT. VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "含稅總價 | TT. I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "待支付 | TT. TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        if (lineIdxForCalculate == 3)
            //        {

            //            if (withPaymentInfo)
            //            {
            //                if (supplierOrder.Paid > 0)
            //                {
            //                    cell = CreateHeaderCellHK("已支付 | PAID", lightgreen, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);

            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                }
            //                cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //            }
            //        }
            //        else
            //        {
            //            cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //        }

            //    }
            //    else
            //    {
            //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 11, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "折扣 | DISCOUNT";
            //            fieldValue = (discount ?? 0) * -1;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "未稅總價 | TT. E.TAX";
            //                fieldValue = totalWithoutDis ?? 0;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "稅額 | TT. VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "含稅總價 | TT. I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "待支付 | TT. TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        if (lineIdxForCalculate == 3)
            //        {
            //            if (withPaymentInfo)
            //            {
            //                if (supplierOrder.Paid > 0)
            //                {
            //                    cell = CreateHeaderCellHK("已支付 | PAID", lightgreen, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);

            //                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                    table.AddCell(cell);
            //                }
            //                cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);
            //            }
            //        }
            //        else
            //        {
            //            cell = CreateHeaderCellHK(fieldName, basecolor, 3, fontST09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCellHK(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);
            //        }
            //    }
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);

            //}

            // total line end

            // reserve de propriete


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息
            var contactinfo = "如果有任何問題，請您聯係以下聯絡人\r\nIf you have any question, please contact the following contact";
            //var creatorinfo = string.Format("{4}\r\n聯絡人Contact: {0} {1}\r\nEMAIL: {2}\r\n手提電話Cellphone: {3}", supplierOrder.Creator.Firstname,
            //    supplierOrder.Creator.Lastname, supplierOrder.Creator.Email, supplierOrder.Creator.Cellphone, contactinfo);

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format(CultureInfo.CreateSpecificCulture("en-US"), "# {0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            contactinfo += ("\r\n" + SodCreatorInfo(supplierOrder));
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = contactinfo;

            if (!string.IsNullOrEmpty(content))
            {
                //if (content.Contains("\r\n"))
                //{
                //    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                //    int count = lines.Count;
                //    for (int i = 0; i < count; i++)
                //    {
                //        var anitem = lines.ElementAt(i);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(anitem, BaseColor.WHITE, 17, fontKT08, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //    }
                //}
                //else
                //{
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(content, BaseColor.WHITE, 17, fontST07, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                //}
            }



            #endregion end part Other footer
            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_WithoutP_hk02WithImg(string path, PurchaseBaseClass supplierOrder)
        {
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
            float[] defineWidths = new float[] { 0.5F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 0.5F };
            int nbColumns = 19;
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

            string reportTitle = string.Format("採購訂單 SUPPLIER ORDER \r\nN° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCellHK(content, BaseColor.WHITE, 13, fontST13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            // company info
            cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 13, fontST11B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 9, fontST12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            var supInfo = string.Empty;
            supInfo += supplierOrder.OneSupplier.CompanyName.ToUpper();
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address1) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address1));
            supInfo += (string.IsNullOrEmpty(supplierOrder.OneSupplier.Address2) ? "" : ("\r\n" + supplierOrder.OneSupplier.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               supplierOrder.OneSupplier.Postcode,
               supplierOrder.OneSupplier.City,
               !string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.City) ? " / " : "",
                (!string.IsNullOrEmpty(supplierOrder.OneSupplier.Postcode) || !string.IsNullOrEmpty(supplierOrder.OneSupplier.City)) && !string.IsNullOrEmpty(supplierOrder.OneSupplier.Country) ? " " : "",
               supplierOrder.OneSupplier.Country);
            supInfo += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1, withTopBorder: true);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, fontST11B, false, Alignement.Left, true, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(supInfo, BaseColor.WHITE, 6, fontST11B, false, Alignement.Left, false, false, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);


            var ordercode = string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode);
            var orderdate = string.Format("下單日期 Order Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation)
                    .ToUpper());
            var ordername = string.Format("訂單名 Order Name : {0}", supplierOrder.SodName);
            var todaydate = string.Format("打印日期 Print Date : {0}",
                string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper());

            var sodinfo = string.Format("{0}\r\n{1}\r\n{2}\r\n{3}", orderdate, todaydate, ordercode, ordername);


            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(sodinfo, BaseColor.WHITE, 8, fontST09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(reportTitle, BaseColor.WHITE, 8, fontST13B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, true, false, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, true, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            #endregion Address

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);



            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("訂單號 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontST09B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("下單日期 Order Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", supplierOrder.DateCreation).ToUpper()), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("訂單名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(string.Format("出單日期 Today's Date : {0}", string.Format(CultureInfo.CreateSpecificCulture("en-US"), "{0:yyyy-MMM-dd}", DateTime.Now).ToUpper()), BaseColor.WHITE, 9, fontST09, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCellHK(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("型號 REFERENCE", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("图像 IMAGE", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 3, fontST09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK("描述 DESCRIPTION", BaseColor.LIGHT_GRAY, 9, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("數量 QTY.", BaseColor.LIGHT_GRAY, 2, fontST09B, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            decimal? totalQty = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                string PriceUnit = string.Format("{0:n3}", cil.UnitPriceWithDis);
                string TotalPrice = string.Format("{0:n3}", cil.TotalPrice);
                string solComment = cil.Comment;
                int order = cil.Order;
                totalQty += cil.Quantity;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                allDes = string.IsNullOrEmpty(solComment) ?
                allDes :
                (string.IsNullOrEmpty(allDes) ? solComment : (allDes + "\r\n----------------------\r\n" + solComment));



                // product description
                string productInfo = (cil.Power != "null" && cil.Power != "0" && !string.IsNullOrEmpty(cil.Power)) ? ("功率/Power: " + cil.Power + "W\r\n") : string.Empty;
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("電源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色溫/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("長/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("寬(直徑)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快遞或最快的飛機/Fastest plane/Express" : cil.Logistic == "2" ? "經濟飛機/Cheapest plane" : "船運/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征碼/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCellHK(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontST07, false, Alignement.Center, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(prdName, BaseColor.WHITE, 3, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(supPrdName, BaseColor.WHITE, 3, fontST07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                string prdImagePath = cil.PrdImgPath;
                if (File.Exists(prdImagePath))
                {
                    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);                  
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
                        Colspan = 2,
                        BorderWidthBottom = 0f,
                        BorderWidthLeft = 0f,                        
                        BorderWidthRight = 0f,
                        BorderWidthTop=0f,
                        FixedHeight = fixedImageHeight,
                        PaddingTop = 5f,
                        PaddingBottom = 5f,
                        PaddingLeft = 5f,
                        PaddingRight = 5f                       
                    };                   
                    var pdfCustomCellBorder = new PdfCustomCellBorderTop();
                    imageCell.CellEvent = pdfCustomCellBorder;
                    table.AddCell(imageCell);
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCellHK(allDes, BaseColor.WHITE, 9, fontST07, false, Alignement.Left, false, false, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(Quantity, BaseColor.WHITE, 2, fontST07, false, Alignement.Right, false, false, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(PriceUnit, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(TotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 790)
                {
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 9, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 820);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("N°", BaseColor.LIGHT_GRAY, 1, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("型號 REFERENCE", BaseColor.LIGHT_GRAY, 3, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);                        
                        cell = CreateHeaderCellHK("图像 IMAGE", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("商家型號 REF.", BaseColor.LIGHT_GRAY, 3, fontST09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK("描述 DESCRIPTION", BaseColor.LIGHT_GRAY, 9, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK("數量 QTY.", BaseColor.LIGHT_GRAY, 2, fontST09, true, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 9, bodyFont1st, true, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }
            // total quantity
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCellHK("總數量 TOTAL QUANTITY", BaseColor.LIGHT_GRAY, 15, fontST09B, true, Alignement.Left, false, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(string.Format("{0:n2}", totalQty), BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Right, true, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCellHK(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }



            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCellHK("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            // reserve de propriete
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息
            var contactinfo = "如果有任何問題，請您聯係以下聯絡人\r\nIf you have any question, please contact the following contact";
            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format(CultureInfo.CreateSpecificCulture("en-US"), "# {0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            contactinfo += ("\r\n" + SodCreatorInfo(supplierOrder));
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = contactinfo;
            if (!string.IsNullOrEmpty(content))
            {
                //if (content.Contains("\r\n"))
                //{
                //    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                //    int count = lines.Count;
                //    for (int i = 0; i < count; i++)
                //    {
                //        var anitem = lines.ElementAt(i);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(anitem, BaseColor.WHITE, 17, fontKT08, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                //        table.AddCell(cell);
                //        cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                //        table.AddCell(cell);
                //    }
                //}
                //else
                //{
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(content, BaseColor.WHITE, 17, fontST07, false, Alignement.Left, false, false, leading, forContent: false, fontColor: BaseColor.BLACK);
                table.AddCell(cell);
                cell = CreateHeaderCellHK(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
                //}
            }



            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }
    }
}
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

        public static MemoryStream PdfSod_hk(string path, PurchaseBaseClass supplierOrder, bool withPaymentInfo)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            //发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT08B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 7, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line


            decimal? totalQty = 0;
            decimal? totalHTcal = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                string PriceUnit = string.Format("{0:n3}", cil.UnitPriceWithDis);
                //string TotalPrice = string.Format("{0:n3}", cil.TotalPrice);
                string TotalPrice = string.Format("{0:n3}", cil.Quantity * cil.UnitPriceWithDis);
                //totalHTcal += (cil.TotalPrice ?? 0);
                totalHTcal += (cil.Quantity * cil.UnitPriceWithDis ?? 0);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;


                allDes = string.IsNullOrEmpty(productInfo) ? allDes : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                string prdImagePath = cil.PrdImgPath;
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
                //        Colspan = 3,
                //        BorderWidthBottom = 0,
                //        BorderWidthLeft = 0.5f,
                //        BorderWidthTop = 0.5f,
                //        BorderWidthRight = 0.5f,
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
                //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //    table.AddCell(cell);
                //}
                //cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 2, fontKT08, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 7, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                // new line
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 7, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }


            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 11, fontKT09B, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3}", totalHTcal), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            var comment = supplierOrder.SupplierComment;
            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont9BRed, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5, fontColor: BaseColor.RED);
            table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            // add blank space

            //for (int i = 0; i < 100; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 720)
            //    {
            //        break;
            //    }
            //}


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            // total line title
            var allLines = supplierOrder.PurchaseLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = false;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            var discount = 0;
            var netHt = totalHT - discount;
            var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("BASE E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT %|税率", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT AMNT.|税", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("I.TAX AMNT.|含税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("TT. E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3} {1}", totalHT, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                if (lineIndex < tvaCount)
                {
                    var oneTva = tvaUsed.ElementAt(lineIndex);
                    var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
                    var ttcamount = baseHt + tvaamount;
                    bool withBottom = lineIndex == tvaCount - 1;
                    cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);

                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT08, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT08, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT08, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT08, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true,
                            leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol),
                            basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading,
                            withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            var creatorinfo = SodCreatorInfo(supplierOrder);
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = creatorinfo;

            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }




            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_WithoutP_hk(string path, PurchaseBaseClass supplierOrder)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 6, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 8, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 6, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //string prdImagePath = cil.PrdImgPath;
                //if (!File.Exists(prdImagePath))
                //{
                //    prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                //}
                //iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);
                //PdfPCell imageCell = new PdfPCell(prdImage, true)
                //{
                //    VerticalAlignment = Element.ALIGN_MIDDLE,
                //    PaddingLeft = 10f,
                //    PaddingRight = 10f,
                //    Colspan = 3,
                //    //MinimumHeight = 15,
                //    BorderWidthBottom = 0,
                //    FixedHeight = 5f
                //};
                //table.AddCell(imageCell);
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
                //        Colspan = 3,
                //        BorderWidthBottom = 0,
                //        BorderWidthLeft = 0.5f,
                //        BorderWidthTop = 0.5f,
                //        BorderWidthRight = 0.5f,
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
                //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //    table.AddCell(cell);
                //}
                //cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 3, fontKT08, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 8, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 6, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 8, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }
            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 15, fontKT09B, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }



            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            #region Total 弃用
            //// total line 
            //// total line title
            //var allLines = supplierOrder.PurchaseLines;
            //var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            //int tvaCount = tvaUsed.Count;

            //bool withDiscount = false;
            //int totalFieldLineCount = withDiscount ? 5 : 4;
            //var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            //var discount = 0;
            //var netHt = totalHT - discount;
            //var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            //var totalTtcNet = netHt + totalTvaNet;
            //int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("BASE E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT RATE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT AMNT.", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("I.TAX AMNT.", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("Total E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    if (lineIndex < tvaCount)
            //    {
            //        var oneTva = tvaUsed.ElementAt(lineIndex);
            //        var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //        var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
            //        var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //        var ttcamount = baseHt + tvaamount;
            //        bool withBottom = lineIndex == tvaCount - 1;
            //        cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //    }
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);

            //}

            //// total line end

            #endregion Total 弃用

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            var creatorinfo = SodCreatorInfo(supplierOrder);
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = creatorinfo;

            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false, fontColor: BaseColor.BLACK);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false, fontColor: BaseColor.BLACK);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }


            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_hkWithImg(string path, PurchaseBaseClass supplierOrder, bool withPaymentInfo)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            //发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT08B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT08, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line


            decimal? totalQty = 0;
            decimal? totalHTcal = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                string PriceUnit = string.Format("{0:n3}", cil.UnitPriceWithDis);
                //string TotalPrice = string.Format("{0:n3}", cil.TotalPrice);
                string TotalPrice = string.Format("{0:n3}", cil.Quantity * cil.UnitPriceWithDis);
                //totalHTcal += (cil.TotalPrice ?? 0);
                totalHTcal += (cil.Quantity * cil.UnitPriceWithDis ?? 0);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;


                allDes = string.IsNullOrEmpty(productInfo) ? allDes : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
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
                        Colspan = 3,
                        BorderWidthBottom = 0,
                        BorderWidthLeft = 0.5f,
                        BorderWidthTop = 0.5f,
                        BorderWidthRight = 0.5f,
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                //cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 2, fontKT08, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 5, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                // new line
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }


            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 11, fontKT09B, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3}", totalHTcal), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            var comment = supplierOrder.SupplierComment;
            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont9BRed, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5, fontColor: BaseColor.RED);
            table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            // add blank space

            //for (int i = 0; i < 100; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 720)
            //    {
            //        break;
            //    }
            //}


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            // total line title
            var allLines = supplierOrder.PurchaseLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = false;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            var discount = 0;
            var netHt = totalHT - discount;
            var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("BASE E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT %|税率", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT AMNT.|税", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("I.TAX AMNT.|含税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("TT. E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3} {1}", totalHT, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                if (lineIndex < tvaCount)
                {
                    var oneTva = tvaUsed.ElementAt(lineIndex);
                    var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
                    var ttcamount = baseHt + tvaamount;
                    bool withBottom = lineIndex == tvaCount - 1;
                    cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, fontKT08, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);

                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT08, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT08, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT08, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT08, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09B, true, Alignement.Left, true, true,
                            leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol),
                            basecolormontant, 3, fontKT09B, true, Alignement.Right, true, true, leading,
                            withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            var creatorinfo = SodCreatorInfo(supplierOrder);
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = creatorinfo;

            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }




            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_WithoutP_hkWithImg(string path, PurchaseBaseClass supplierOrder)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 5, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT08, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 5, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //string prdImagePath = cil.PrdImgPath;
                //if (!File.Exists(prdImagePath))
                //{
                //    prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                //}
                //iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);
                //PdfPCell imageCell = new PdfPCell(prdImage, true)
                //{
                //    VerticalAlignment = Element.ALIGN_MIDDLE,
                //    PaddingLeft = 10f,
                //    PaddingRight = 10f,
                //    Colspan = 3,
                //    //MinimumHeight = 15,
                //    BorderWidthBottom = 0,
                //    FixedHeight = 5f
                //};
                //table.AddCell(imageCell);
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
                        Colspan = 3,
                        BorderWidthBottom = 0,
                        BorderWidthLeft = 0.5f,
                        BorderWidthTop = 0.5f,
                        BorderWidthRight = 0.5f,
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                //cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 3, fontKT08, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 6, fontKT07, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT08, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 5, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT08, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 3, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09B, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }
            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 15, fontKT09B, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, fontKT09B, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }



            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            #region Total 弃用
            //// total line 
            //// total line title
            //var allLines = supplierOrder.PurchaseLines;
            //var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            //int tvaCount = tvaUsed.Count;

            //bool withDiscount = false;
            //int totalFieldLineCount = withDiscount ? 5 : 4;
            //var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            //var discount = 0;
            //var netHt = totalHT - discount;
            //var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            //var totalTtcNet = netHt + totalTvaNet;
            //int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("BASE E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT RATE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT AMNT.", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("I.TAX AMNT.", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("Total E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    if (lineIndex < tvaCount)
            //    {
            //        var oneTva = tvaUsed.ElementAt(lineIndex);
            //        var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //        var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
            //        var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //        var ttcamount = baseHt + tvaamount;
            //        bool withBottom = lineIndex == tvaCount - 1;
            //        cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //    }
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);

            //}

            //// total line end

            #endregion Total 弃用

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 20220815 添加SOD里面comment 的信息
            if (supplierOrder.CsoList.Any())
            {
                foreach (var oneCmt in supplierOrder.CsoList)
                {
                    if (!string.IsNullOrEmpty(oneCmt.Value.Trim()))
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:yyyy-MMM-dd} : {1}", oneCmt.DValue2, oneCmt.Value), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                table.AddCell(cell);
            }

            // 添加Creator 信息
            var creatorinfo = SodCreatorInfo(supplierOrder);
            //content = HeaderFooter != null ? creatorinfo : string.Empty;
            content = creatorinfo;

            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false, fontColor: BaseColor.BLACK);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false, fontColor: BaseColor.BLACK);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }


            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }


        #region 20220722之前版本，含供货商型号列，不再使用

        public static MemoryStream PdfSod_hk_org(string path, PurchaseBaseClass supplierOrder, bool withPaymentInfo)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);


            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            //发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line


            decimal? totalQty = 0;
            decimal? totalHTcal = 0;
            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string PrdDescription = cil.PrdDescription;
                string PriceUnit = string.Format("{0:n3}", cil.UnitPriceWithDis);
                //string TotalPrice = string.Format("{0:n3}", cil.TotalPrice);
                string TotalPrice = string.Format("{0:n3}", cil.Quantity * cil.UnitPriceWithDis);
                //totalHTcal += (cil.TotalPrice ?? 0);
                totalHTcal += (cil.Quantity * cil.UnitPriceWithDis ?? 0);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;


                allDes = string.IsNullOrEmpty(productInfo) ? allDes : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 2, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 6, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 6, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("未税单价 U.P.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("总价 TOTAL", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }


            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 11, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3}", totalHTcal), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            var comment = supplierOrder.SupplierComment;
            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont9BRed, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5, fontColor: BaseColor.RED);
            table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            // add blank space

            //for (int i = 0; i < 100; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 720)
            //    {
            //        break;
            //    }
            //}


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            // total line title
            var allLines = supplierOrder.PurchaseLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = false;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            var discount = 0;
            var netHt = totalHT - discount;
            var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            var totalTtcNet = netHt + totalTvaNet;
            int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("BASE E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT %|税率", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("VAT AMNT.|税", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("I.TAX AMNT.|含税总价", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("TT. E.TAX|未税总价", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n3} {1}", totalHT, supplierOrder.CurrencySymbol), BaseColor.WHITE, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                if (lineIndex < tvaCount)
                {
                    var oneTva = tvaUsed.ElementAt(lineIndex);
                    var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
                    var ttcamount = baseHt + tvaamount;
                    bool withBottom = lineIndex == tvaCount - 1;
                    cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, fontKT09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, fontKT09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, fontKT09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, fontKT09, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontST09B, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);

                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    var basecolor = BaseColor.LIGHT_GRAY;
                    var basecolormontant = BaseColor.WHITE;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "DISCOUNT|折扣";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "TT. E.TAX|未税总价";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "TT. VAT AMNT.|税";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "TT. I.TAX|含税总价";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "TT. TO PAY|需支付";
                            fieldValue = totalTtcNet;
                            basecolor = BaseColor.PINK;
                            basecolormontant = BaseColor.PINK;
                        }
                    }
                    //cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    //table.AddCell(cell);
                    if (lineIdxForCalculate == 3)
                    {
                        if (withPaymentInfo)
                        {
                            if (supplierOrder.Paid > 0)
                            {
                                cell = CreateHeaderCell("已支付 | PAID", lightgreen, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(string.Format("{0:n3} {1}", supplierOrder.Paid * -1, supplierOrder.CurrencySymbol), lightgreen, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 12, fontST09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                                table.AddCell(cell);
                            }
                            cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(string.Format("{0:n3} {1}", (fieldValue - supplierOrder.Paid), supplierOrder.CurrencySymbol), basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                            table.AddCell(cell);
                        }
                    }
                    else
                    {
                        cell = CreateHeaderCell(fieldName, basecolor, 3, fontKT09, true, Alignement.Left, true, true,
                            leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", fieldValue, supplierOrder.CurrencySymbol),
                            basecolormontant, 3, fontKT09, true, Alignement.Right, true, true, leading,
                            withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息

            var creatorinfo = string.Format("Contact: {0} {1}\r\nEmail:{2}\r\nCellphone:{3}\r\nTel:{4}", supplierOrder.Creator.Firstname,
                supplierOrder.Creator.Lastname, supplierOrder.Creator.Email, supplierOrder.Creator.Cellphone, supplierOrder.Creator.Telephone);


            content = HeaderFooter != null ? creatorinfo : string.Empty;
            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }


            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfSod_WithoutP_hk_org(string path, PurchaseBaseClass supplierOrder)
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

            string reportTitle = string.Format("采购订单 SUPPLIER ORDER N° : {0}", supplierOrder.SodCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;



            // 给LOGO让18格
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Right, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // company info
            cell = CreateHeaderCell(content, BaseColor.WHITE, 9, fontKT13B, false, Alignement.Center, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1, forContent: false);
            table.AddCell(cell);

            // NEW LINE

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            ////发票号
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 9, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            //table.AddCell(cell);


            #endregion Header


            //for (int i = 0; i < 1; i++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            //    table.AddCell(cell);
            //}
            #endregion Set space white

            #region Address

            float spaceLogo = 0;
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supInfo, BaseColor.WHITE, 7, fontKT11B, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单号 Order Code : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, fontKT09B, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("下单日期 Order Date : {0:yyyy-MMM-dd}", supplierOrder.DateCreation), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("订单名 Order Name : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("打印日期 Print Date : {0:yyyy-MMM-dd}", DateTime.Now), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 8, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
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
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("电源/Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("色温/Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("长/Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("宽(直径)/Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("高/Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("光效/Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                if (cil.Logistic != "0")
                    productInfo += "物流/Logistics: " + (cil.Logistic == "1" ? "快递或最快的飞机/Fastest plane/Express" : cil.Logistic == "2" ? "经济飞机/Cheapest plane" : "船运/Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("特征码/Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);


                cell = CreateHeaderCell(string.Format("{0:n0}", order), BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 3, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 8, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCell(PriceUnit, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(TotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);


                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);

                        // title
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("商家型号 REF.", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 8, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("UNIT PRICE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("TOTAL E.TAX", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }
            // total quantity
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("总计 TOTAL", BaseColor.WHITE, 15, fontKT09, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalQty), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);


            //var comment = supplierOrder.SupplierComment;
            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }



            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            #region Total 弃用
            //// total line 
            //// total line title
            //var allLines = supplierOrder.PurchaseLines;
            //var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            //int tvaCount = tvaUsed.Count;

            //bool withDiscount = false;
            //int totalFieldLineCount = withDiscount ? 5 : 4;
            //var totalHT = allLines.Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //var totalTtc = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (1 + m.VatRate / 100));
            //var discount = 0;
            //var netHt = totalHT - discount;
            //var totalTva = allLines.Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //var totalTvaNet = netHt * (totalTva / (totalHT == 0 ? 1 : totalHT));
            //var totalTtcNet = netHt + totalTvaNet;
            //int lineCount = tvaCount > totalFieldLineCount ? tvaCount : totalFieldLineCount;

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("BASE E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT RATE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("VAT AMNT.", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("I.TAX AMNT.", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("Total E.TAX", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("{0:n3}", totalHT), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    if (lineIndex < tvaCount)
            //    {
            //        var oneTva = tvaUsed.ElementAt(lineIndex);
            //        var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
            //        var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
            //        var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
            //        var ttcamount = baseHt + tvaamount;
            //        bool withBottom = lineIndex == tvaCount - 1;
            //        cell = CreateHeaderCell(string.Format("{0:n3}", baseHt), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvarate), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", tvaamount), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", ttcamount), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        var fieldName = "";
            //        var fieldValue = netHt;
            //        int lineIdxForCalculate = lineIndex;
            //        lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
            //        var basecolor = BaseColor.LIGHT_GRAY;
            //        var basecolormontant = BaseColor.WHITE;
            //        if (lineIdxForCalculate == -1 && withDiscount)
            //        {
            //            fieldName = "DISCOUNT";
            //            fieldValue = discount;
            //        }
            //        else
            //        {
            //            if (lineIdxForCalculate == 0)
            //            {
            //                fieldName = "TOTAL E.TAX";
            //                fieldValue = netHt;
            //            }
            //            if (lineIdxForCalculate == 1)
            //            {
            //                fieldName = "TOTAL VAT AMNT.";
            //                fieldValue = totalTvaNet;
            //            }
            //            if (lineIdxForCalculate == 2)
            //            {
            //                fieldName = "TOTAL I.TAX";
            //                fieldValue = totalTtcNet;
            //            }
            //            if (lineIdxForCalculate == 3)
            //            {
            //                fieldName = "TOTAL TO PAY";
            //                fieldValue = totalTtcNet;
            //                basecolor = BaseColor.PINK;
            //                basecolormontant = BaseColor.PINK;
            //            }
            //        }
            //        cell = CreateHeaderCell(fieldName, basecolor, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(string.Format("{0:n3}", fieldValue), basecolormontant, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);
            //    }
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);

            //}

            //// total line end

            #endregion Total 弃用

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);


            // begin Comment supplier 
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);

            cell = CreateHeaderCell(supplierOrder.SupplierComment, BaseColor.WHITE, 17, bodyFont9BRed, false, Alignement.Left, false, false, leading, forContent: false, withTopBorder: false, footerTop: 0, minHeight: 10, fontColor: BaseColor.RED);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            // end Comment supplier 

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            #region end part Other footer

            // 添加Creator 信息

            var creatorinfo = string.Format("Contact: {0} {1}\r\nEmail:{2}\r\nCellphone:{3}\r\nTel:{4}", supplierOrder.Creator.Firstname,
                supplierOrder.Creator.Lastname, supplierOrder.Creator.Email, supplierOrder.Creator.Cellphone, supplierOrder.Creator.Telephone);


            content = HeaderFooter != null ? creatorinfo : string.Empty;
            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\r\n"))
                {
                    var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
                    int count = lines.Count;
                    for (int i = 0; i < count; i++)
                    {
                        var anitem = lines.ElementAt(i);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false, fontColor: BaseColor.BLACK);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false, fontColor: BaseColor.BLACK);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }


            //content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
            //if (!string.IsNullOrEmpty(content))
            //{
            //    if (content.Contains("\r\n"))
            //    {
            //        var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
            //        int count = lines.Count;
            //        for (int i = 0; i < count; i++)
            //        {
            //            var anitem = lines.ElementAt(i);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //            table.AddCell(cell);
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            //        table.AddCell(cell);
            //    }
            //}

            #endregion end part Other footer

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        #endregion 20220722之前版本，含供货商型号列，不再使用

    }
}
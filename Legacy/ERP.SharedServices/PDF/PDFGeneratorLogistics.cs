using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using iTextSharp.text;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;
using System.Text;
using ERP.DataServices;
using ERP.Entities;
using iTextSharp.text.pdf.events;

namespace ERP.SharedServices.PDF
{

    public static partial class PDFGenerator
    {
        #region logistics

        public static MemoryStream NewGeneratePdfForLogistics(string path, Logistics logistics)
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

            string reportTitle = string.Format("物流单 LOGISTICS N° : \r\n{0}", logistics.LgsCode);

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
            supInfo += logistics.Supplier.CompanyName.ToUpper();
            supInfo += (string.IsNullOrEmpty(logistics.Supplier.Address1) ? "" : ("\r\n" + logistics.Supplier.Address1));
            supInfo += (string.IsNullOrEmpty(logistics.Supplier.Address2) ? "" : ("\r\n" + logistics.Supplier.Address2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               logistics.Supplier.Postcode,
               logistics.Supplier.City,
               !string.IsNullOrEmpty(logistics.Supplier.Postcode) && !string.IsNullOrEmpty(logistics.Supplier.City) ? " / " : "",
                (!string.IsNullOrEmpty(logistics.Supplier.Postcode) || !string.IsNullOrEmpty(logistics.Supplier.City)) && !string.IsNullOrEmpty(logistics.Supplier.Country) ? " " : "",
               logistics.Supplier.Country);
            supInfo += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));



            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell("货代 Freight forwarder", BaseColor.WHITE, 7, fontKT07, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
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

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("发货数量 "), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("创建日期 Creation date : {0:dd-MMM-yyyy}", logistics.DateCreation), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("发货日期 Dispatched Date : {0:dd-MMM-yyyy}", logistics.LgsDateSend), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("遇到到达日期 Expected arrival date : {0:dd-MMM-yyyy}", logistics.LgsDateArrivePre), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("实际到达日期 Actual arrival date : {0:dd-MMM-yyyy}", logistics.LgsDateArrive), BaseColor.WHITE, 9, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("订单号 PI/CI", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("数量 QTY.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int lgLines = logistics.AllLgLines.Count;

            logistics.AllLgLines = logistics.AllLgLines.OrderByDescending(m => m.SinCode).ToList();
            string lastSin = string.Empty;

            for (int index = 0; index < lgLines; index++)
            {
                var oneLine = logistics.AllLgLines.ElementAt(index);
                string prdName = !string.IsNullOrEmpty(oneLine.ProductRef) ? oneLine.ProductRef : oneLine.ProductName;
                string Description = oneLine.LglDescription;
                string PrdDescription = oneLine.PrdDescription;
                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                string Quantity = string.Format("{0:n2}", oneLine.LglQuantity);
                string sinCode = string.IsNullOrEmpty(oneLine.SodCode) ? (string.IsNullOrEmpty(oneLine.CinCode) ? "" : oneLine.CinCode) : oneLine.SodCode;
                //lastSin = oneLine.SinCode;
                bool newSin = lastSin != sinCode;
                lastSin = sinCode;
                var isLastLine = index == lgLines - 1;


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(!newSin ? string.Empty : sinCode, BaseColor.WHITE, 3, fontKT09, isLastLine, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15, withTopBorder: newSin);
                table.AddCell(cell);
                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 5, fontKT09, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15, withTopBorder: newSin);
                table.AddCell(cell);
                string prdImagePath = oneLine.PrdImage;               
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, fontKT09, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15, withTopBorder: newSin);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 5, fontKT09, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15, withTopBorder: newSin);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, fontKT09, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15, withTopBorder: newSin);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < lgLines - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("订单号 PI/CI", BaseColor.LIGHT_GRAY, 3, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("型号 REF.", BaseColor.LIGHT_GRAY, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("图像 IMG.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("描述 DES.", BaseColor.LIGHT_GRAY, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("数量 QTY.", BaseColor.LIGHT_GRAY, 2, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    //if (index == lgLines - 1)
                    //{
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    //    table.AddCell(cell);
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //    table.AddCell(cell);
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //    table.AddCell(cell);
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    //    table.AddCell(cell);
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //    table.AddCell(cell);
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    //    table.AddCell(cell);

                    //    AddTable(middleTable, table);
                    //}
                }
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            if (!string.IsNullOrEmpty(logistics.LgsComment))
            {
                string newline = logistics.LgsComment.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = logistics.LgsComment.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 17, fontKT09, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }


            // add table to check the end of page

            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Remarque : {0}", logistics.Creator.FullName), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        #endregion logistics
    }
}
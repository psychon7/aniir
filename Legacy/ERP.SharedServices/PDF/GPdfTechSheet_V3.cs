using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Web;
using iTextSharp.text;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;

using System.Text;
using ERP.DataServices;
using ERP.Entities;
using System.Configuration;
using System.Linq.Expressions;
using ERP.Repositories.Extensions;

namespace ERP.SharedServices.PDF
{
    public static partial class PDFGenerator
    {
        public static MemoryStream GPdfTechSheet_V3(string path, Entities.Product oneProduct)
        {
            //CommonServices CommonServices = new CommonServices();
            doc = new Document(iTextSharp.text.PageSize.A4, 10, 10, 15, 15);
            landscape = false;
            spacing = 0;
            cellAdded = false;
            _title = new StringBuilder();
            pageSize = doc.PageSize.Height;
            var output = new MemoryStream();
            writer = PdfWriter.GetInstance(doc, output);
            doc.Open();
            
            string prdImageOrder1 = "";
            string prdImageOrder2 = "";
            string prdImageOrder3 = "";
            string prdImageOrder4 = "";
            AlbumServices AlbumServices = new AlbumServices();
            string cePath = AlbumServices.GetImagePathFromAlbum(1, "CE");
            string rohsPath = AlbumServices.GetImagePathFromAlbum(1, "Rohs");
            string recyclepath = "img\\1.jpg";
            string dispose = "img\\1.jpg";

            string protectipimg = AlbumServices.GetImagePathFromAlbum(1, "protection IK_08");



            if (oneProduct.PrdImgList.Any())
            {
                prdImageOrder1 = (oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 1)) != null ? oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 1).Value : null;
                prdImageOrder2 = (oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 2)) != null ? oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 2).Value : null;
                prdImageOrder3 = (oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 3)) != null ? oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 3).Value : null;
                prdImageOrder4 = (oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 4)) != null ? oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 4).Value : null;
            }
            // Path to the image file
            string imagePath = "img\\back.jpg";
            //prdImageOrder1 = "img\\1.jpg";
            //prdImageOrder2 = "img\\2.jpg";
            //prdImageOrder3 = "img\\3.jpg";
            //prdImageOrder4 = "img\\back.jpg";

            string logo = "img\\logo.png";
                          
            #region dimension
            var listDim = new List<PropertyValue>();
            string dimensionsValue = "";
            if (oneProduct.PrdLength > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Longueur",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdLength)

                });
            }
            if (oneProduct.PrdWidth > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Largeur",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdWidth)
                });
            }
            if (oneProduct.PrdHeight > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Hauteur",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdHeight)
                });
            }

            if (oneProduct.PrdOutsideDiameter > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Diamètre ext.",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdOutsideDiameter)
                });
            }
            if (oneProduct.PrdDepth > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Profondeur",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdDepth)
                });
            }


            if (oneProduct.PrdHoleSize > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Diamètre int.",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdHoleSize)
                });
            }


            if (oneProduct.PrdHoleLength > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Longueur int.",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdHoleLength)
                });
            }

            if (oneProduct.PrdHoleWidth > 0)
            {
                listDim.Add(new PropertyValue
                {
                    PropName = "Largeur int.",
                    PropValue = string.Format("{0:n0} mm", oneProduct.PrdHoleWidth)
                });
            }

            var dimCount = listDim.Count;
            for (int i = 0; i < dimCount; i++)
            {
                var onespec = listDim.ElementAt(i);
                var remainder = i % 2;
                if (remainder == 0)
                {
                    dimensionsValue += string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) + " X ";
                }
            }
            dimensionsValue = dimensionsValue.TrimEnd(' ', 'X');

            #endregion dimension

            #region generate Product Info


            string tension = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Tension");
            string Frequence = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Fréquence");
            string code = oneProduct.PrdCode;
            string Fluxlumnience = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Flux lumineux");
            string UGR = GetPrdInformation(oneProduct.PrdGeneralInfoList, "UGR");
            string teinte = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Couleur");
            string typesource = GetPrdInformation(oneProduct.PrdGeneralInfoList, "LED");
            string control = GetPrdInformation(oneProduct.PrdGeneralInfoList, "OPERATION");
            string material = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Matériaux");            
            string indice = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Indice de rendu");
            string duree = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Durée de vie");
            string temperature = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Température d'utilisation");
            string classe = GetPrdInformation(oneProduct.PrdGeneralInfoList, "Classe");
            string ProtectIP = "IP "+GetPrdInformation(oneProduct.PrdGeneralInfoList, "Protection IP");
            string ProtectIk = "IK "+GetPrdInformation(oneProduct.PrdGeneralInfoList, "Protection IK");
            string garanty =  GetPrdInformation(oneProduct.PrdGeneralInfoList, "Garantie");
            string OptionsText = "OPTIONS :" + GetPrdInformation(oneProduct.PrdGeneralInfoList, "Option disponible");

            #endregion generate Product Info


            #region load background image

            // Load the image
            
            //if(imagePath != null)
            iTextSharp.text.Image backImg = iTextSharp.text.Image.GetInstance(imagePath);
            float backgroundHeight = (pageSize / 2) - 40; // desired height in points
            backImg.ScaleAbsolute(doc.PageSize.Width, backgroundHeight);
            //// position the image at the top of the page
            backImg.SetAbsolutePosition(0, pageSize - backgroundHeight);
            doc.Add(backImg);
            
            #endregion load background image

            #region overlay image1
             //if(File.Exists(prdImageOrder1))
             //{
                iTextSharp.text.Image overlayImage = iTextSharp.text.Image.GetInstance(prdImageOrder1);
                float overlayScaleFactor = (overlayImage.ScaledHeight / 2) / overlayImage.Height;
                overlayImage.ScalePercent(overlayScaleFactor * 100);
                float overlayWidth = 220; // desired width in points
                float overlayHeight = 190; // desired height in points
                overlayImage.ScaleAbsolute(overlayWidth, overlayHeight);
                // Position the overlay image at the center of the background image
                float overlayX = ((pageSize - backImg.ScaledWidth) / 6) + (backImg.ScaledWidth - overlayImage.ScaledWidth) / 6;
                float overlayY = (pageSize / 2) + (backImg.ScaledHeight - backImg.ScaledHeight) / 2;
                overlayImage.SetAbsolutePosition(overlayX, overlayY + 80);
                doc.Add(overlayImage);
                //}
            #endregion overlay image1

            #region overlay image2
            //image in hexagon shape
            // Load the hexagon image
            if (prdImageOrder2 != null && File.Exists(prdImageOrder2))
            {
                iTextSharp.text.Image hexagonImage = iTextSharp.text.Image.GetInstance(prdImageOrder2);
                // Set desired size for the hexagon image
                float hexagonWidth = 115; // desired width in points
                float hexagonHeight = 115; // desired height in points
                hexagonImage.ScaleAbsolute(hexagonWidth, hexagonHeight);
                // Position the hexagon image to the right of the overlay image
                float hexagonX = overlayX + 270;
                float hexagonY = overlayY;
                hexagonImage.SetAbsolutePosition(hexagonX, hexagonY + 80);
                doc.Add(hexagonImage);
            }
            #endregion  overlay image2

            #region Text- Product Name
            // Create a PdfContentByte object
            PdfContentByte cb = writer.DirectContent;
            // Define the text to be added
            string prdName = oneProduct.PrdName;
            string prdSubName = oneProduct.PrdSubName;
            // Define a font
            BaseFont bf = BaseFont.CreateFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            cb.SetFontAndSize(bf, 20);
            // Begin text
            cb.BeginText();
            // Set the text position in the top left corner
            cb.SetTextMatrix(40, pageSize - 20); // 36 points = 0.5 inches margin
            cb.SetColorFill(BaseColor.WHITE);
            // Show the text
            cb.ShowText(prdName);
            // Define the text to be added            
            cb.SetFontAndSize(bf, 15);
            // Set the text position in the top left corner
            cb.SetTextMatrix(45, pageSize - 40); // 36 points = 0.5 inches margin
            cb.SetColorFill(BaseColor.WHITE);
            // Show the text
            cb.ShowText(prdSubName);            
            var puissance = oneProduct.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Puissance");
            string puissanceStr = puissance.PropValue + " W";
            cb.SetFontAndSize(bf, 10);
            // Set the text position in the top left corner
            cb.SetTextMatrix(45, pageSize - 60); // 36 points = 0.5 inches margin
            cb.SetColorFill(BaseColor.WHITE);
            // Show the text
            cb.ShowText(puissanceStr);
            cb.SetFontAndSize(bf, 10);
            // Set the text position in the top left corner
            cb.SetTextMatrix(45, pageSize - 80); // 36 points = 0.5 inches margin
            cb.SetColorFill(BaseColor.WHITE);
            // Show the text
            cb.ShowText(dimensionsValue);
            cb.EndText();

            #endregion  Text- Product Name
                        
            #region draw hexagon with text

            float radius = 20; // Radius of the hexagon
            float yStart1 = pageSize - 30; // y-coordinate for the first row of hexagons in the first column
            float yStart2 = pageSize - 80; // y-coordinate for the first row of hexagons in the second column
            float xStart = 330; // x--coordinate for the top hexagon

            // Generate text for hexagons
            string[] texts1 = { puissanceStr, Fluxlumnience, "LED", "classe\r\n"+classe, ProtectIk };
            string[] texts2 = { ProtectIP, temperature, duree, tension,garanty  };
            int flag = 0;
            // Draw first column of hexagons
            for (int i = 0; i < texts1.Length; i++)
            {
                DrawHexagonWithText(writer, xStart + (i * (radius * 2 + 10)), yStart1, radius, texts1[i],flag);
            }

            // Draw second column of hexagons
            for (int i = 0; i < texts2.Length; i++)
            {
                if(texts2[i].Equals(garanty))
                {
                    flag=1;
                }
                DrawHexagonWithText(writer, xStart + (i * (radius * 2 + 10)), yStart2, radius, texts2[i],flag);
            }

            #endregion draw hexagon with text

            #region rectangle on top left with Category name          
            float xLeft = 0; // x-coordinate for the left side of the rectangle
            float yTop = pageSize - 5; // y-coordinate for the top side of the rectangle (page height minus margin)
            float width = 30; // width of the rectangle
            float height = 100; // height of the rectangle

            Rectangle rect = new Rectangle(xLeft, yTop - height, xLeft + width, yTop);

            // Set the background color of the rectangle
            rect.BackgroundColor = BaseColor.BLUE;
            cb.Rectangle(rect);
            cb.Fill();
            // Add text inside the rectangle
            cb.BeginText();
            BaseFont baseFont = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            cb.SetFontAndSize(baseFont, 12);
            cb.SetColorFill(BaseColor.WHITE);
            cb.ShowTextAligned(Element.ALIGN_CENTER, oneProduct.ProductType, xLeft + (width / 2), yTop - (height / 2), 90);
            cb.EndText();

            #endregion rectangle on top left with Category name

            #region horizontal line below the rectangle
            // Define the horizontal line position and size
            float lineX1 = xLeft; // x-coordinate for the start of the line (same as the left side of the rectangle)
            float lineY1 = yTop - height; // y-coordinate for the line (10 points below the bottom of the rectangle)
            float lineX2 = xLeft + 800; // x-coordinate for the end of the line

            // Set the color of the line
            cb.SetColorStroke(BaseColor.BLUE);

            // Draw the line
            cb.MoveTo(lineX1, lineY1);
            cb.LineTo(lineX2, lineY1);
            cb.Stroke();

            #endregion horizontal line below the rectangle

            # region table creation

            Font headerFont = FontFactory.GetFont("Arial", 12, Font.BOLD, BaseColor.BLACK);
            Font cellFont = FontFactory.GetFont("Arial", 10, BaseColor.BLACK);
            // Create a table with 2 columns
            PdfPTable table = new PdfPTable(2);
            table.WidthPercentage = 10;
            table.SetWidths(new float[] { 0.5f, 1f }); // Set column widths
            // Add header cell
            PdfPCell header = new PdfPCell(new Phrase("CARACTÉRISTIQUES", headerFont));
            header.Colspan = 2;
            header.HorizontalAlignment = Element.ALIGN_LEFT;
            header.BorderWidthBottom = 0f;
            header.BorderWidthLeft = 0f;
            header.BorderWidthRight = 0f;
            header.BorderWidthTop = 0f;
            table.AddCell(header);

            // Add data cells
            AddTableCell(table, "Références", code, cellFont);
            AddTableCell(table, "Type de source", "LED -" + typesource,cellFont);
            AddTableCell(table, "Angle", "", cellFont);
            AddTableCell(table, "Flux lumineux", Fluxlumnience, cellFont);
            AddTableCell(table, "Teinte", teinte, cellFont);
            AddTableCell(table, "Protection", ProtectIP + "-" + ProtectIk, cellFont);
            AddTableCell(table, "Classe", classe, cellFont);
            AddTableCell(table, "IRC", indice, cellFont);
            AddTableCell(table, "UGR", UGR, cellFont);
            AddTableCell(table, "MacAdam", "", cellFont);
            AddTableCell(table, "Mode de contrôle", control, cellFont);
            AddTableCell(table, "Durée de vie", duree, cellFont);
            AddTableCell(table, "Température ambiante", temperature, cellFont);
            AddTableCell(table, "Humidité ambiante", "/", cellFont);
            AddTableCell(table, "Matériaux", material, cellFont);
            table.CompleteRow();
            // Add table to document
            
            // Calculate the height of the table
            table.TotalWidth = 350;
            table.LockedWidth = true;
            float tableHeight = table.TotalHeight;

            // Calculate the starting position (half of the page height)
            float pageHeight = pageSize;
            float startY = pageHeight / 2 - 200;

            // Get the content byte layer and place the table in the second half
            //PdfContentByte cb = writer.DirectContent;
            table.WriteSelectedRows(0, -1, doc.LeftMargin, startY + tableHeight, cb);

            #endregion table

            #region Dimensions

            string Dimensiontext = "Dimensions";

            cb.SetFontAndSize(bf, 10);
            // Begin text
            cb.BeginText();

            // Set the text position in the top left corner
            cb.SetTextMatrix(doc.LeftMargin + 400, startY + tableHeight - 10); // 36 points = 0.5 inches margin

            cb.SetColorFill(BaseColor.BLACK);
            // Show the text
            cb.ShowText(Dimensiontext);
            cb.SetTextMatrix(doc.LeftMargin + 400, startY + tableHeight - 25); // 36 points = 0.5 inches margin

            cb.ShowText(dimensionsValue);
            // End text
            cb.EndText();

            #endregion Dimensions

            #region line below dimension
            // Define the horizontal line position and size                            
            // Set the color of the line
            cb.SetColorStroke(BaseColor.BLACK);

            // Draw the line
            cb.MoveTo(doc.LeftMargin + 400, startY + tableHeight - 15);
            cb.LineTo(doc.LeftMargin + 800, startY + tableHeight - 15);
            cb.Stroke();

            #endregion line below dimension

            #region Alimentation

            PdfPTable tableAlimentation = new PdfPTable(2);
            tableAlimentation.WidthPercentage = 10;
            tableAlimentation.SetWidths(new float[] { 0.5f, 1f }); // Set column widths

            // Add header cell
            PdfPCell headerAlimentation = new PdfPCell(new Phrase("Alimentation", headerFont));
            headerAlimentation.Colspan = 2;
            headerAlimentation.HorizontalAlignment = Element.ALIGN_LEFT;
            headerAlimentation.BorderWidthBottom = 0f;
            headerAlimentation.BorderWidthTop = 0f;
            headerAlimentation.BorderWidthRight = 0f;
            headerAlimentation.BorderWidthLeft = 0f;
            tableAlimentation.AddCell(headerAlimentation);

            // Add data cells
            AddTableCell(tableAlimentation, "Puissance", puissanceStr, cellFont);
            AddTableCell(tableAlimentation, "Tension d'entree", tension, cellFont);
            AddTableCell(tableAlimentation, "Frequence", Frequence, cellFont);

            tableAlimentation.CompleteRow();         
            tableAlimentation.TotalWidth = 350;
            tableAlimentation.LockedWidth = true;            
            float startAlimentation = pageHeight / 2 - 450;

            tableAlimentation.WriteSelectedRows(0, -1, doc.LeftMargin, startAlimentation + tableHeight, cb);
            
            #endregion Alimentation

            #region Options
            
            cb.SetFontAndSize(bf, 10);          
             OptionsText += "Technologie Zigbee/Detecteur de presence/ Detecteur de luminosite/Dali/Dimmable";
            
            ColumnText ct = new ColumnText(cb);
            ct.SetSimpleColumn(
                new Phrase(OptionsText, new Font(bf, 10)),
                doc.LeftMargin,
                pageHeight / 2 - 310, // Adjust 40 as needed for height
                350,
                 pageHeight / 2 - 280,
                15,
                Element.ALIGN_LEFT
            );

            // Add the ColumnText to the document
            ct.Go();           
            cb.SetFontAndSize(bf, 15);            
            cb.BeginText();
            cb.SetTextMatrix(doc.LeftMargin, pageHeight / 2 - 350);
            cb.SetColorFill(BaseColor.BLACK);
            cb.ShowText("GARANTIE " + garanty);
            cb.EndText();

            #endregion Options

            #region horizontal line below the garanty
            
            float lineX = doc.Left; 
            float lineY = doc.BottomMargin + 50;
            float lineXpt = xLeft + 500;
            
            cb.SetColorStroke(BaseColor.BLACK);
            
            cb.MoveTo(lineX, lineY);
            cb.LineTo(lineXpt, lineY);
            cb.Stroke();

            #endregion horizontal line below the garanty

            #region product image
            if (prdImageOrder3 != null)
            {
                iTextSharp.text.Image prdimagedesc = iTextSharp.text.Image.GetInstance(prdImageOrder3);
                float prddescwidth = 100; // desired width in points
                float prddescheight = 80; // desired height in points
                prdimagedesc.ScaleAbsolute(prddescwidth, prddescheight);
                prdimagedesc.SetAbsolutePosition(doc.LeftMargin + 400, doc.BottomMargin + 300);
                doc.Add(prdimagedesc);
            }
            if (prdImageOrder4 != null)
            {
                iTextSharp.text.Image prdimagedesc2 = iTextSharp.text.Image.GetInstance(imagePath);
                float prddesc2width = 150; // desired width in points
                float prddesc2height = 100; // desired height in points
                prdimagedesc2.ScaleAbsolute(prddesc2width, prddesc2height);
                prdimagedesc2.SetAbsolutePosition(doc.LeftMargin + 400, doc.BottomMargin + 150);
                doc.Add(prdimagedesc2);
            }
            #endregion product images

            #region LOGO image

            iTextSharp.text.Image Logoimage = iTextSharp.text.Image.GetInstance(logo);
            float logowidth = 100; // desired width in points
            float logoheight = 50; // desired height in points   
            Logoimage.ScaleAbsolute(logowidth, logoheight);
            Logoimage.SetAbsolutePosition(doc.LeftMargin + 400, doc.BottomMargin);
            doc.Add(Logoimage);

            #endregion LOGO images

            #region normes
            iTextSharp.text.Image ceimage = iTextSharp.text.Image.GetInstance(cePath);
            float cewidth = 30; // desired width in points
            float ceheight = 30; // desired height in points   
            ceimage.ScaleAbsolute(cewidth, ceheight);
            ceimage.SetAbsolutePosition(doc.LeftMargin + 390, doc.BottomMargin +60);
            doc.Add(ceimage);

            iTextSharp.text.Image recycle = iTextSharp.text.Image.GetInstance(recyclepath);
            float recyclewidth = 30; // desired width in points
            float recycleheight = 30; // desired height in points   
            recycle.ScaleAbsolute(recyclewidth, recycleheight);
            recycle.SetAbsolutePosition(doc.LeftMargin + 430, doc.BottomMargin + 60);
            doc.Add(recycle); 

            iTextSharp.text.Image rohs = iTextSharp.text.Image.GetInstance(rohsPath);
            float rohswidth = 30; // desired width in points
            float rohsheight = 30; // desired height in points   
            rohs.ScaleAbsolute(rohswidth, rohsheight);
            rohs.SetAbsolutePosition(doc.LeftMargin + 470, doc.BottomMargin + 60);
            doc.Add(rohs);

            iTextSharp.text.Image disposeimg = iTextSharp.text.Image.GetInstance(dispose);
            float disposewidth = 30; // desired width in points
            float disposeheight = 30; // desired height in points   
            disposeimg.ScaleAbsolute(disposewidth, disposeheight);
            disposeimg.SetAbsolutePosition(doc.LeftMargin + 520, doc.BottomMargin + 60);
            doc.Add(disposeimg);

            #endregion normes

            #region CompanyDetails

            string contact = "Tel. +33 (0)172 99 57 49                                     14 rue du Poteau";
            string contact1 = "www.ecoled-europe.com                                   77181 Country - France";
            cb.SetFontAndSize(bf, 10);
            // Begin text
            cb.BeginText();

            // Set the text position in the top left corner
            cb.SetTextMatrix(doc.LeftMargin + 10, doc.BottomMargin +15); 

            cb.SetColorFill(BaseColor.BLACK);
            // Show the text
            cb.ShowText(contact);
            cb.SetTextMatrix(doc.LeftMargin + 10, doc.BottomMargin + 5);

            cb.ShowText(contact1);
            // End text
            cb.EndText();

            #endregion Dimensions
            doc.Close();
            return output;

        }
        // Method to draw hexagon and add text
        static void DrawHexagonWithText(PdfWriter writer, float xCenter, float yCenter, float radius, string text,int flag)
        {
            // Get the direct content of the writer
            PdfContentByte canvas = writer.DirectContent;
            BaseFont baseFont = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            // Calculate hexagon vertices
            float[] xPoints = new float[6];
            float[] yPoints = new float[6];
            for (int i = 0; i < 6; i++)
            {
                xPoints[i] = (float)(xCenter + radius * Math.Cos(i * Math.PI / 3));
                yPoints[i] = (float)(yCenter + radius * Math.Sin(i * Math.PI / 3));
            }
            
            // Draw the hexagon
            if (flag.Equals(1))
            {
                canvas.SetColorFill(BaseColor.BLUE);
            }
            else
            {
                canvas.SetColorFill(BaseColor.WHITE);
            }
            canvas.MoveTo(xPoints[0], yPoints[0]);
            for (int i = 1; i < 6; i++)
            {
                canvas.LineTo(xPoints[i] + 1, yPoints[i]);
            }
            canvas.LineTo(xPoints[0], yPoints[0]);

            canvas.SetColorStroke(BaseColor.WHITE);
            canvas.Fill();


            canvas.Stroke();

            // Add text inside the hexagon
            canvas.BeginText();
            canvas.SetFontAndSize(baseFont, 8);
            canvas.SetColorFill(BaseColor.BLACK);
            canvas.ShowTextAligned(Element.ALIGN_CENTER, text, xCenter, yCenter, 0);
            canvas.EndText();
        }
        private static void AddTableCell(PdfPTable table, string headerText, string cellText, Font font)
        {
            PdfPCell cell = new PdfPCell(new Phrase(headerText, font));            
            cell.CellEvent = new DottedCellBorder();
            cell.BorderWidthTop = 0f;
            cell.BorderWidthBottom = 0f;
            cell.BorderWidthRight = 0f;
            cell.BorderWidthLeft = 0f;
            table.AddCell(cell);

            cell = new PdfPCell(new Phrase(cellText, font));
            cell.CellEvent = new DottedCellBorder();           

            table.AddCell(cell);
        }
        static string GetPrdInformation(List<PropertyValue> PrdGeneralInfoList, string propname)
        {

            var value = PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propname && !string.IsNullOrEmpty(m.PropValue));

            string prdinfo = "";

            if (value != null)
            {
                prdinfo = value.PropValue + "" + value.PropUnit;
            }
            return prdinfo;
        }

    }
    public class DottedCellBorder : IPdfPCellEvent
    {
        public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
        {
            PdfContentByte canvas = canvases[PdfPTable.LINECANVAS];
            canvas.SetLineDash(2f, 3f); // Define the dash pattern (3 units on, 3 units off)            
            canvas.Rectangle(position.Left, position.Bottom, position.Width, position.Height);
            canvas.Stroke();
        }
    }
}

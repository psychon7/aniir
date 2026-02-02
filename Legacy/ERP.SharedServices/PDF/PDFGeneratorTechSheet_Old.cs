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

namespace ERP.SharedServices.PDF
{
    public static partial class PDFGenerator
    {
        public static iTextSharp.text.Font GetTahoma_old()
        {
            var fontName = "Tahoma";
            if (!FontFactory.IsRegistered(fontName))
            {
                var fontPath = Environment.GetEnvironmentVariable("SystemRoot") + "\\fonts\\tahoma.ttf";
                FontFactory.Register(fontPath);
            }
            return FontFactory.GetFont(fontName, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        }
        public static MemoryStream GPdfTechSheet_old(string path, Entities.Product oneProduct)
        {
            int avoirCoef = 1;
            CommonServices CommonServices = new CommonServices();
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


            #region Define Color


            BaseColor _BaseColor = oneProduct.EntityColor != null ? new BaseColor(oneProduct.EntityColor.CorRed, oneProduct.EntityColor.CorGreen, oneProduct.EntityColor.CorBlue) : BaseColor.BLACK;

            var fontName = ConfigurationManager.AppSettings["FontForPdf"];
            if (string.IsNullOrEmpty(fontName))
            {
                fontName = "Arial";
            }
            if (!FontFactory.IsRegistered(fontName))
            {
                var fontPath = Environment.GetEnvironmentVariable("SystemRoot") + "\\fonts\\" + fontName + ".ttf";
                FontFactory.Register(fontPath);
            }

            Font TchStTitle1B = FontFactory.GetFont(fontName, 30, Font.BOLD, _BaseColor);
            Font TchStTitle2 = FontFactory.GetFont(fontName, 22, _BaseColor);
            Font TchStTitle2B = FontFactory.GetFont(fontName, 22, Font.BOLD, _BaseColor);
            Font TchStTitle3B = FontFactory.GetFont(fontName, 15, Font.BOLD, _BaseColor);
            Font TchStNomalB = FontFactory.GetFont(fontName, 9, Font.BOLD, BaseColor.BLACK);
            Font TchStNomal = FontFactory.GetFont(fontName, 9, BaseColor.BLACK);

            #endregion

            string textSpace = " ";

            var HeaderFooter = CommonServices.GetHeaderFooter();

            for (int i = 0; i < 8; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);
            }
            #endregion Set space white


            #region Product Name, title, reference, puissance


            // Name

            string productName = string.IsNullOrEmpty(oneProduct.PrdName) ? " " : oneProduct.PrdName;
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(productName, BaseColor.WHITE, 18, TchStTitle1B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // Puissance
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            string puissanceStr = oneProduct.PrdSubName + " ";
            var puissance = oneProduct.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Puissance");
            if (puissance != null)
            {
                puissanceStr = puissance.PropValue + "W";
            }

            cell = CreateHeaderCell(puissanceStr, BaseColor.WHITE, 18, TchStTitle2B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // empty line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            table.AddCell(cell);
            // product reference
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(oneProduct.PrdRef, BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // empty lines
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            table.AddCell(cell);

            // line with underline
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, true, Alignement.Left, false, false, leading, lineNormalBottomBorder: true, bottomBorderColor: _BaseColor, bottomBorderFloat: 2);
            table.AddCell(cell);


            #endregion Product Name, title, reference

            // empty line before description
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
            table.AddCell(cell);

            #region Tech content

            // reference and flux title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Référence", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Flux lumineux", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // reference content
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            var pitTempColors = string.Empty;
            var pitRefContents = string.Empty;
            var pitFluxContents = string.Empty;
            var hasPits = oneProduct.InstanceList.Any();
            var capacitiesTitles = string.Empty;
            var capacitiesContents = string.Empty;
            var specificitiesTitles = string.Empty;
            var specificitiesContents = string.Empty;
            var resistanceTitles = string.Empty;
            var resistanceContents = string.Empty;
            var dimensionsTitles = string.Empty;
            var dimensionsContents = string.Empty;


            #region Generate Pit Info
            if (hasPits)
            {
                var allPits = oneProduct.InstanceList;
                var temperatures = allPits.Select(m => m.PitAllInfo.Where(l => l.PropName == "Température de couleur").Select(l => l.PropValue).FirstOrDefault()).Distinct().OrderBy(m => m).ToList();
                foreach (var temp in temperatures)
                {
                    var onePit = allPits.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == temp));
                    if (onePit != null)
                    {
                        var propTemp = onePit.PitAllInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                        if (propTemp != null)
                        {
                            int checkNbr;
                            var propValue = temp + (int.TryParse(temp, out checkNbr) ? propTemp.PropUnit : "");
                            if (!string.IsNullOrEmpty(propValue))
                            {
                                pitTempColors += propValue + ": \r\n";
                            }
                        }
                        pitRefContents += onePit.PitRef + "\r\n";
                        var propFlux = onePit.PitAllInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                        if (propFlux != null)
                        {
                            int checkNbr;
                            int.TryParse(propFlux.PropValue, out checkNbr);
                            var propValue = checkNbr > 0 ? (propFlux.PropValue + propFlux.PropUnit) : "";
                            if (!string.IsNullOrEmpty(propValue))
                            {
                                pitFluxContents += propValue + "\r\n";
                            }
                        }
                    }
                }
            }
            #endregion Generate Pit Info

            #region Generate Product Info

            // capacité
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Rendement", ref capacitiesTitles, ref capacitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Puissance", ref capacitiesTitles, ref capacitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Tension", ref capacitiesTitles, ref capacitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Indice de rendu", ref capacitiesTitles, ref capacitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Fréquence", ref capacitiesTitles, ref capacitiesContents);
            // spécificité
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Matériaux", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Diffuseur", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "LED", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Lampe", ref specificitiesTitles, ref specificitiesContents);

            if (oneProduct.PrdWeight > 0)
            {
                specificitiesTitles += "Poids:";
                specificitiesContents += string.Format("{0:n2} Kg", oneProduct.PrdWeight);
            }
            // résistance
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Protection", ref resistanceTitles, ref resistanceContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Classe", ref resistanceTitles, ref resistanceContents);

            // diemnsions

            if (oneProduct.PrdLength > 0)
            {
                dimensionsTitles += "Longueur:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdLength);
            }
            if (oneProduct.PrdWidth > 0)
            {
                dimensionsTitles += "Largeur:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdWidth);
            }
            if (oneProduct.PrdHeight > 0)
            {
                dimensionsTitles += "Hauteur:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdHeight);
            }

            //if (oneProduct.PrdInsideDiameter > 0)
            //{
            //    dimensionsTitles += "Diamètre int:\r\n";
            //    dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdInsideDiameter);
            //}
            if (oneProduct.PrdOutsideDiameter > 0)
            {
                dimensionsTitles += "Diamètre ext:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdOutsideDiameter);
            }
            if (oneProduct.PrdDepth > 0)
            {
                dimensionsTitles += "Profondeur:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdDepth);
            }


            #endregion Generate Product Info

            // reference and flux content
            cell = CreateHeaderCell(pitTempColors, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(pitRefContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(pitTempColors, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(pitFluxContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);


            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // capacité and spécificité title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Capacité", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Spécificité", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // capacité and spécificité content
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(capacitiesTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(capacitiesContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(specificitiesTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(specificitiesContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);


            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // résistance and dimensions title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Résistance", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dimensions", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // résistance and dimensions content
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(resistanceTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(resistanceContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(dimensionsTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(dimensionsContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);


            var currentheigh = table.CalculateHeights();
            var heighLimit = currentheigh > 1100 ? 1350 : currentheigh < 1000 ? 1100 : 1400;

            #endregion Tech content

            #region empty line with right border

            while (table.CalculateHeights() < heighLimit)
            {

                // empty line with right border
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }


            #endregion empty line with right border

            middleTable.AddCell(table);
            doc.Add(middleTable);
            doc.Close();
            return output;
        }

        private static void GetPrdInfo_old(List<PropertyValue> PrdGeneralInfoList, string propName, ref string title, ref string content)
        {
            var oneProp = PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName);
            if (oneProp != null)
            {
                title += oneProp.PropName + ":\r\n";
                content += oneProp.PropValue + "\r\n";
            }
        }
    }
}
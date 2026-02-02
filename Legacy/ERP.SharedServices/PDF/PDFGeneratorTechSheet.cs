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
        public static iTextSharp.text.Font GetTahoma()
        {
            var fontName = "Tahoma";
            if (!FontFactory.IsRegistered(fontName))
            {
                var fontPath = Environment.GetEnvironmentVariable("SystemRoot") + "\\fonts\\tahoma.ttf";
                FontFactory.Register(fontPath);
            }
            return FontFactory.GetFont(fontName, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        }
        public static MemoryStream GPdfTechSheet(string path, Entities.Product oneProduct)
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

            //Font TchStTitle1B = FontFactory.GetFont(fontName, 30, Font.BOLD, _BaseColor);
            Font TchStTitle1B = FontFactory.GetFont("Segoe UI Black", 40, Font.BOLD, _BaseColor);
            Font TchStTitle2 = FontFactory.GetFont(fontName, 22, _BaseColor);
            Font TchStTitle2B = FontFactory.GetFont(fontName, 22, Font.BOLD, _BaseColor);
            //Font TchStTitle2B20 = FontFactory.GetFont(fontName, 20, Font.BOLD, _BaseColor);
            Font TchStTitle2B20 = FontFactory.GetFont("Segoe UI Black", 20, Font.BOLD, _BaseColor);
            Font TchStTitle3B = FontFactory.GetFont(fontName, 15, Font.BOLD, _BaseColor);
            Font TchStNomalB = FontFactory.GetFont(fontName, 9, Font.BOLD, BaseColor.BLACK);
            Font TchStNomal8 = FontFactory.GetFont(fontName, (float)8.6, BaseColor.BLACK);
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

            string prdFamily = string.IsNullOrEmpty(oneProduct.PrdSubName) ? " " : oneProduct.PrdSubName;
            string productName = string.IsNullOrEmpty(oneProduct.PrdName) ? " " : oneProduct.PrdName;
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(productName, BaseColor.WHITE, 18, TchStTitle1B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // Puissance
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            string puissanceStr = prdFamily + " ";
            // delete 20221022
            //var puissance = oneProduct.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Puissance");
            //if (puissance != null)
            //{
            //    puissanceStr += puissance.PropValue + "W";
            //}

            cell = CreateHeaderCell(puissanceStr, BaseColor.WHITE, 18, TchStTitle2B20, false, Alignement.Left, false, false, leading);
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

            cell = CreateHeaderCell("Référence", BaseColor.WHITE, 10, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);

            //cell = CreateHeaderCell("Flux lumineux", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            //table.AddCell(cell);

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

            List<ProductInstance> pitRefList = new List<ProductInstance>();

            if (hasPits)
            {
                var allPits = oneProduct.InstanceList;
                var temperatures = allPits.Select(m => m.PitAllInfo.Where(l => l.PropName == "Température de couleur").Select(l => l.PropValue).FirstOrDefault()).Distinct().OrderBy(m => m).ToList();
                foreach (var temp in temperatures)
                {
                    var onePit = allPits.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == temp));
                    var pitwithTempColor = allPits.Where(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == temp)).Distinct().ToList();

                    var allref = pitwithTempColor.Select(m => m.PitRef.Substring(0, 10)).Distinct().ToList();
                    var baseRef = allref.FirstOrDefault().Substring(0, 7);
                    var listPits = new List<ProductInstance>();

                    foreach (var oneRefWithIP in allref)
                    {
                        var refwithIpIk = oneRefWithIP.Replace(baseRef, "");
                        var opr = refwithIpIk.StartsWith("N") ? "Basic" : (refwithIpIk.StartsWith("D") ? "Dimmable" : ((refwithIpIk.StartsWith("L") ? "Dali" : "")));
                        var refPit = allPits.FirstOrDefault(m => m.PitRef.StartsWith(oneRefWithIP));
                        if (refPit != null)
                        {
                            refPit.ProductType = opr;
                            pitRefList.Add(refPit);
                        }

                    }


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
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Norme de durée de vie", ref capacitiesTitles, ref capacitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Couleur", ref capacitiesTitles, ref capacitiesContents);

            // spécificité
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Matériaux", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Diffuseur", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "LED", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "UGR", ref specificitiesTitles, ref specificitiesContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Lampe", ref specificitiesTitles, ref specificitiesContents);
            
            var productcolors = oneProduct.InstanceList.Select(m => m.PitAllInfo.Where(l => l.PropName == "Couleur de produit").Select(l => l.PropValue).Distinct().ToList()).ToList();
            var productcolorlist = productcolors.SelectMany(productcolor => productcolor).Distinct().ToList();
            var productColorString = productcolorlist.Aggregate(string.Empty, (current, onecolor) => current + (onecolor + "\r\n"));
            specificitiesTitles += "Couleur:";
            specificitiesContents += productColorString;

            if (oneProduct.PrdWeight > 0)
            {
                specificitiesTitles += "Poids:";
                specificitiesContents += string.Format("{0:n2} Kg", oneProduct.PrdWeight);
            }
            // résistance
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Classe", ref resistanceTitles, ref resistanceContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Protection IP", ref resistanceTitles, ref resistanceContents);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Protection IK", ref resistanceTitles, ref resistanceContents);

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


            if (oneProduct.PrdHoleSize > 0)
            {
                dimensionsTitles += "Dismètre int.:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdHoleSize);
            }


            if (oneProduct.PrdHoleLength > 0)
            {
                dimensionsTitles += "Longueur int.:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdHoleLength);
            }

            if (oneProduct.PrdHoleWidth > 0)
            {
                dimensionsTitles += "Largeur int.:\r\n";
                dimensionsContents += string.Format("{0:n0} mm\r\n", oneProduct.PrdHoleWidth);
            }



            #endregion Generate Product Info

            // colors
            var colors = pitRefList.Select(m => m.PitAllInfo.Where(l => l.PropName == "Température de couleur").Distinct().ToList()).ToList();
            var colorList = new List<PropertyValue>();
            foreach (var color in colors)
            {
                colorList.AddRange(color);
            }
            colorList = colorList.DistinctBy(m => m.PropValue).OrderBy(m => m.PropValue).ToList();


            // reference 
            #region Reference
            cell = CreateHeaderCell("Basic", BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dimmable", BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dali", BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // basic
            foreach (var oneTempCol in colorList)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                int testTemp;
                string colorString = oneTempCol.PropValue;
                if (int.TryParse(oneTempCol.PropValue, out testTemp))
                {
                    colorString += oneTempCol.PropUnit;
                }
                // basic
                var basicPrd = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue) && m.ProductType == "Basic");
                var basicRef = basicPrd != null ? basicPrd.PitRef.Substring(0, 11) : "-";
                cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(basicRef, BaseColor.WHITE, 2, TchStNomal8, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                // Dimmable

                var dimPrd = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue) && m.ProductType == "Dimmable");
                var dimRef = dimPrd != null ? dimPrd.PitRef.Substring(0, 11) : "-";
                cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(dimRef, BaseColor.WHITE, 2, TchStNomal8, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                // Dali
                var daliPrd = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue) && m.ProductType == "Dali");
                var daliRef = daliPrd != null ? daliPrd.PitRef.Substring(0, 11) : "-";
                cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(daliRef, BaseColor.WHITE, 2, TchStNomal8, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            #endregion Reference

            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // flux lumineux and spécificité
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Flux lumineux", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, false, leading);
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

            // flux lumineux and spécificité content
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            //var colorFluxList = "";pitRefList.Select(m => m.PitAllInfo.Where(l => l.PropName == "Température de couleur" && colorList.Any(j => j.PropValue == l.PropValue))).ToList();

            Dictionary<PropertyValue, PropertyValue> fluxLumx = new Dictionary<PropertyValue, PropertyValue>();
            foreach (var pit in pitRefList)
            {
                var pitwithcolor = pit.PitAllInfo.Any(m => m.PropName == "Température de couleur" && colorList.Any(l => l.PropValue == m.PropValue));
                if (pitwithcolor)
                {
                    var flux = pit.PitAllInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                    if (flux != null)
                    {
                        //fluxLumx .Add(flux);
                        // add couleur 
                        var oneColor = pit.PitAllInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                        if (!fluxLumx.Any(m => m.Key.PropValue == oneColor.PropValue))
                        {
                            fluxLumx.Add(oneColor, flux);
                        }
                    }
                }
            }

            var colorTitlestring = string.Empty;
            var colorContentstring = string.Empty;
            foreach (var propertyValue in fluxLumx)
            {
                int testTemp;
                string colorString = propertyValue.Key.PropValue;
                if (int.TryParse(colorString, out testTemp))
                {
                    colorTitlestring += colorString + propertyValue.Key.PropUnit + ":\r\n";
                }
                else
                {
                    colorTitlestring += colorString + ":\r\n";
                }
                colorContentstring += propertyValue.Value.PropValue + propertyValue.Value.PropUnit + "\r\n";
            }

            //cell = CreateHeaderCell(capacitiesTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(capacitiesContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);


            cell = CreateHeaderCell(colorTitlestring, BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(colorContentstring, BaseColor.WHITE, 2, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(specificitiesTitles, BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(specificitiesContents, BaseColor.WHITE, 2, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);


            // capacité and spécificité content
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(capacitiesTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(capacitiesContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(specificitiesTitles, BaseColor.WHITE, 2, TchStNomalB, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(specificitiesContents, BaseColor.WHITE, 3, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            //table.AddCell(cell);


            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // résistance and capacité title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Résistance", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Capacité", BaseColor.WHITE, 5, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
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
            cell = CreateHeaderCell(resistanceTitles, BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(resistanceContents, BaseColor.WHITE, 2, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(capacitiesTitles, BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(capacitiesContents, BaseColor.WHITE, 2, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            if (oneProduct.PrdImgList.Any(m => m.Key == 2))
            {
                // empty line with right border
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                // empty line with right border
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                // empty line with right border
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }

            // dimensions and empty space for Image
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dimensions", BaseColor.WHITE, 10, TchStTitle3B, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
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
            cell = CreateHeaderCell(dimensionsTitles, BaseColor.WHITE, 3, TchStNomalB, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(dimensionsContents, BaseColor.WHITE, 2, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, TchStNomal, false, Alignement.Left, false, true, leading, rightBorderColor: _BaseColor, rightBorderFloat: 1);
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

        private static void GetPrdInfo(List<PropertyValue> PrdGeneralInfoList, string propName, ref string title, ref string content)
        {
            var oneProp = PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName && !string.IsNullOrEmpty(m.PropValue));
            if (oneProp != null)
            {
                if (propName == "Norme de durée de vie")
                {
                    title += "Norme:\r\n";
                }
                else
                {
                    title += oneProp.PropName + ":\r\n";
                }
                content += oneProp.PropValue + oneProp.PropUnit + "\r\n";
            }
        }

        private static void GetPrdInfo(List<PropertyValue> PrdGeneralInfoList, string propName, ref List<PropertyValue> propList)
        {
            var oneProp = PrdGeneralInfoList.FirstOrDefault(m => m.PropName == propName && !string.IsNullOrEmpty(m.PropValue));
            if (oneProp != null)
            {
                propList.Add(oneProp);
                //if (propName == "Norme de durée de vie")
                //{
                //    title += "Norme:\r\n";
                //}
                //else
                //{
                //    title += oneProp.PropName + ":\r\n";
                //}
                //content += oneProp.PropValue + oneProp.PropUnit + "\r\n";


            }
        }
    }
}
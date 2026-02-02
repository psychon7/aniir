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

        public static MemoryStream GPdfTechSheet_V2(string path, Entities.Product oneProduct)
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
            Font TchStTitle2B20 = FontFactory.GetFont(fontName, 20, Font.BOLD, _BaseColor);
            Font TchStTitle3B = FontFactory.GetFont(fontName, 15, Font.BOLD, _BaseColor);
            Font TchStNomalB = FontFactory.GetFont(fontName, 9, Font.BOLD, BaseColor.BLACK);
            Font TchStNomalB_C = FontFactory.GetFont(fontName, 9, Font.BOLD, _BaseColor);
            Font TchStNomal8 = FontFactory.GetFont(fontName, (float)8.6, BaseColor.BLACK);
            Font TchStNomal = FontFactory.GetFont(fontName, 9, BaseColor.BLACK);

            #endregion
            
            string textSpace = " ";
            #endregion Set space white


            #region Product Name, title, reference, puissance

            // style 1 with image
            bool style1 = false;


            if (oneProduct.PrdImgList.Any())
            {
                var prdImgOrder1 = oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 1);
                var prdImgOrder2 = oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 2);
                var prdImgOrder3 = oneProduct.PrdImgList.FirstOrDefault(m => m.Key == 3);
                if ((prdImgOrder1 != null && !string.IsNullOrEmpty(prdImgOrder1.Value) && File.Exists(prdImgOrder1.Value))
                    ||
                    (prdImgOrder2 != null && !string.IsNullOrEmpty(prdImgOrder2.Value) && File.Exists(prdImgOrder2.Value))
                    ||
                    (prdImgOrder3 != null && !string.IsNullOrEmpty(prdImgOrder3.Value) && File.Exists(prdImgOrder3.Value))
                    )
                {
                    style1 = true;
                }
                else
                {
                    style1 = false;
                }
            }
            else
            {
                style1 = false;
            }




            // Name
            string prdFamily = string.IsNullOrEmpty(oneProduct.PrdSubName) ? " " : oneProduct.PrdSubName;
            string productName = string.IsNullOrEmpty(oneProduct.PrdName) ? " " : oneProduct.PrdName;
            // Puissance
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            string puissanceStr = prdFamily + " ";
            var puissance = oneProduct.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Puissance");
            if (puissance != null)
            {
                puissanceStr += puissance.PropValue + "W";
            }

            if (style1)
            {
                // with image
                string productInfo = string.Format("{0} - {1}", productName, puissanceStr);
                cell = CreateHeaderCell(productInfo, BaseColor.WHITE, 14, TchStTitle2B20, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);

                for (int i = 0; i < 11; i++)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                    table.AddCell(cell);
                }
                // line with underline
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, true, Alignement.Left, false, false, leading, lineNormalBottomBorder: true, bottomBorderColor: _BaseColor, bottomBorderFloat: 2);
                table.AddCell(cell);
            }
            else
            {
                // without image
                for (int i = 0; i < 4; i++)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                    table.AddCell(cell);
                }

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(productName, BaseColor.WHITE, 18, TchStTitle1B, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                // Puissance
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);

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
            }




            #endregion Product Name, title, reference

            #region Tech content

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            // reference and flux title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            cell = CreateHeaderCell("Référence", BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading, rightBorderFloat: 1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);

            // reference content
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            var pitTempColors = string.Empty;
            var pitRefContents = string.Empty;
            var pitFluxContents = string.Empty;
            var hasPits = oneProduct.InstanceList.Any();

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
                    var allref = new List<string>();
                    try
                    {
                        allref = pitwithTempColor.Select(m => m.PitRef.Substring(0, 10)).Distinct().ToList();
                    }
                    catch (Exception)
                    {
                        allref = pitwithTempColor.Select(l => l.PitRef).ToList();
                    }

                    //var allref = pitwithTempColor.Select(m => m.PitRef.Substring(0, 10)).Distinct().ToList();
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
                            else
                            {
                                pitTempColors += "3000/4000/6000K: \r\n";
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

            var listCap = new List<PropertyValue>();
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Rendement", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Puissance", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Tension", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Indice de rendu", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Fréquence", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Norme de durée de vie", ref listCap);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Couleur", ref listCap);

            var listSpec = new List<PropertyValue>();
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Matériaux", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Diffuseur", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "LED", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "UGR", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Lampe", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Durée de vie", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Garantie", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Température d'utilisation", ref listSpec);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Option disponible", ref listSpec);


            var productcolors = oneProduct.InstanceList.Select(m => m.PitAllInfo.Where(l => l.PropName == "Couleur de produit").Select(l => l.PropValue).Distinct().ToList()).ToList();
            var productcolorlist = productcolors.SelectMany(productcolor => productcolor).Distinct().ToList();
            var productColorString2 = productcolorlist.Aggregate(string.Empty, (current, onecolor) => current + (!string.IsNullOrEmpty(onecolor) ? (onecolor + " | ") : (onecolor)));
            if (productColorString2.Length > 3)
            {
                productColorString2 = productColorString2.Substring(0, productColorString2.Length - 3);
            }
            listSpec.Add(new PropertyValue { PropName = "Couleur de produit", PropValue = productColorString2 });

            var listRes = new List<PropertyValue>();
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Classe", ref listRes);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Protection IP", ref listRes);
            GetPrdInfo(oneProduct.PrdGeneralInfoList, "Protection IK", ref listRes);

            // diemnsions
            var listDim = new List<PropertyValue>();

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



            #endregion Generate Product Info

            // colors
            var colors = pitRefList.Select(m => m.PitAllInfo.Where(l => l.PropName == "Température de couleur").Distinct().ToList()).ToList();
            var colorList = new List<PropertyValue>();
            foreach (var color in colors)
            {
                colorList.AddRange(color);
            }
            colorList = colorList.DistinctBy(m => m.PropValue).OrderBy(m => m.PropValue).ToList();


            var minHeight = 13;

            // reference 
            #region Reference
            cell = CreateHeaderCell("Basic", BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dimmable", BaseColor.WHITE, 5, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dali", BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("Flux lumineux", BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);


            // 20220405 对于新的编号，没有区分basic dimmable dali 等
            if (colorList.Count == 1 && string.IsNullOrEmpty(colorList.FirstOrDefault().PropValue))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
                cell = CreateHeaderCell(oneProduct.PrdRef, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                //table.AddCell(cell);
                cell = CreateHeaderCell(oneProduct.PrdRef, BaseColor.WHITE, 5, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                //table.AddCell(cell);
                cell = CreateHeaderCell(oneProduct.PrdRef, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                //table.AddCell(cell);

                var flux = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == colorList.FirstOrDefault().PropValue)).PitAllInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                string fluxstr = flux != null ? (flux.PropValue + flux.PropUnit) : "-";
                cell = CreateHeaderCell(fluxstr, BaseColor.WHITE, 4, TchStNomal, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, false, leading);
                table.AddCell(cell);
            }
            else
            {
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
                    cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(basicRef, BaseColor.WHITE, 3, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    // Dimmable

                    var dimPrd = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue) && m.ProductType == "Dimmable");
                    var dimRef = dimPrd != null ? dimPrd.PitRef.Substring(0, 11) : "-";
                    cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(dimRef, BaseColor.WHITE, 4, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);

                    // Dali
                    var daliPrd = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue) && m.ProductType == "Dali");
                    var daliRef = daliPrd != null ? daliPrd.PitRef.Substring(0, 11) : "-";
                    cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(daliRef, BaseColor.WHITE, 3, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(colorString, BaseColor.WHITE, 1, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var flux = pitRefList.FirstOrDefault(m => m.PitAllInfo.Any(l => l.PropName == "Température de couleur" && l.PropValue == oneTempCol.PropValue)).PitAllInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                    string fluxstr = flux != null ? (flux.PropValue + flux.PropUnit) : "-";
                    cell = CreateHeaderCell(fluxstr, BaseColor.WHITE, 3, TchStNomal, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, TchStNomal, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);

                }
            }

            #endregion Reference

            // empty line with right border

            // flux lumineux and spécificité content
            #region Specificité

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // flux lumineux and spécificité
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Spécificité", BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);

            var specCount = listSpec.Count;
            listSpec = listSpec.OrderBy(m => m.PropName).ToList();
            for (int i = 0; i < specCount; i++)
            {
                var onespec = listSpec.ElementAt(i);
                var remainder = i % 2;
                if (remainder == 0)
                {
                    // new line
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 5, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                }
                else if (remainder == 1)
                {
                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 4, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);
                    // same line
                }

                if (i == specCount - 1)
                {
                    // replace all fileds
                    int linespan = 0;
                    if (remainder == 0)
                    {
                        linespan = 8;
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, linespan, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                        table.AddCell(cell);
                    }
                }
            }

            #endregion Specificité

            #region Capacité

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // flux lumineux and spécificité
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Capacité", BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);

            var capCount = listCap.Count;
            listCap = listCap.OrderBy(m => m.PropName).ToList();
            for (int i = 0; i < capCount; i++)
            {
                var onespec = listCap.ElementAt(i);
                var remainder = i % 2;
                if (remainder == 0)
                {
                    // new line
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 5, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                }
                else if (remainder == 1)
                {
                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 4, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);
                    // same line
                }

                if (i == capCount - 1)
                {
                    // replace all fileds
                    int linespan = 0;
                    if (remainder == 0)
                    {
                        linespan = 8;
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, linespan, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                        table.AddCell(cell);
                    }
                }
            }

            #endregion Capacité

            #region Résistance

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // flux lumineux and spécificité
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Résistance", BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);

            var resCount = listRes.Count;
            for (int i = 0; i < resCount; i++)
            {
                var onespec = listRes.ElementAt(i);
                var remainder = i % 2;
                if (remainder == 0)
                {
                    // new line
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 5, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                }
                else if (remainder == 1)
                {
                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 4, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);
                    // same line
                }

                if (i == resCount - 1)
                {
                    // replace all fileds
                    int linespan = 0;
                    if (remainder == 0)
                    {
                        linespan = 8;
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, linespan, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                        table.AddCell(cell);
                    }
                }
            }

            #endregion Résistance


            #region Dimension


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
            table.AddCell(cell);
            cell = CreateHeaderCell("Dimensions", BaseColor.WHITE, 18, TchStTitle3B, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);
            // empty line with right border
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
            table.AddCell(cell);

            var dimCount = listDim.Count;
            for (int i = 0; i < dimCount; i++)
            {
                var onespec = listDim.ElementAt(i);
                var remainder = i % 2;
                if (remainder == 0)
                {
                    // new line
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 5, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                }
                else if (remainder == 1)
                {
                    cell = CreateHeaderCell(onespec.PropName, BaseColor.WHITE, 4, TchStNomalB, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    var value = onespec.PropIsUnitRightSide ? string.Format("{0}{1}", onespec.PropValue, onespec.PropUnit) : string.Format("{0}{1}", onespec.PropUnit, onespec.PropValue);
                    cell = CreateHeaderCell(value, BaseColor.WHITE, 4, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                    table.AddCell(cell);
                    // same line
                }

                if (i == dimCount - 1)
                {
                    // replace all fileds
                    int linespan = 0;
                    if (remainder == 0)
                    {
                        linespan = 8;
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, linespan, TchStNomal8, true, Alignement.Left, false, false, leading, forContent: true, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading);
                        table.AddCell(cell);
                    }
                }
            }

            #endregion Dimension

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

    }
}
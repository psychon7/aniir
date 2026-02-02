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
        public static MemoryStream NewGeneratePdfForPurchaseIntent(string path, PurchaseBaseClass purchaseIntent)
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

            string reportTitle = string.Format("INTANTION D'ACHAT N° : {0}", purchaseIntent.PinCode);

            string content = HeaderFooter != null ? HeaderFooter.OtherHeader : string.Empty;

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }

            if (!string.IsNullOrEmpty(content))
            {
                if (content.Contains("\n"))
                {
                    List<string> listContent = content.Split('\n').ToList();
                    int contentCount = listContent.Count();

                    for (int index = 0; index < contentCount; index++)
                    {
                        string conS = listContent.ElementAt(index);
                        cell = CreateHeaderCell(conS, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 140, forContent: false);
                        table.AddCell(cell);
                        if (index == 0)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 1)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 2)
                        {
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 3)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                        table.AddCell(cell);
                    }
                    if (contentCount < 4)
                    {
                        if (contentCount == 1)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 140, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                        }
                        else if (contentCount == 2)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (contentCount == 3)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                    }
                }
                else
                {
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 140);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                }
            }
            else
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

            }

            #endregion Header


            for (int i = 0; i < 5; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);
            }
            #endregion Set space white

            #region Address

            float spaceLogo = 0;

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// fac
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// fac
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(purchaseIntent.OneSupplier.CompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, footerTop: 0);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// fac
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(purchaseIntent.SupplierContact.ScoFirstname + " " + purchaseIntent.SupplierContact.ScoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// fac
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("{0}{1}", purchaseIntent.SupplierContact.ScoAddress1, (string.IsNullOrEmpty(purchaseIntent.SupplierContact.ScoAddress2) ? "" : ("\n" + purchaseIntent.SupplierContact.ScoAddress2))), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //// fac
            //string cpvilleCountry = string.Format("{0} {2} {1}{3}",
            //    purchaseIntent.SupplierContact.ScoPostcode,
            //    purchaseIntent.SupplierContact.ScoCity,
            //    (!string.IsNullOrEmpty(purchaseIntent.SupplierContact.ScoPostcode) && !string.IsNullOrEmpty(purchaseIntent.SupplierContact.ScoCity) ? "/" : ""),
            //    (!string.IsNullOrEmpty(purchaseIntent.SupplierContact.ScoCountry) ? ("\n" + purchaseIntent.SupplierContact.ScoCountry) : ""));
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(cpvilleCountry, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);


            //// white
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            #endregion Address


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date du jour : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom : {0}", purchaseIntent.PinName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", purchaseIntent.DateCreation), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Code : {0}", purchaseIntent.PinCode), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell("RÉF ECOLED", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("FOURNISSEUR", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("RÉF", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("QUANTITÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = purchaseIntent.PurchaseLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = purchaseIntent.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string PrdDescription = cil.PrdDescription;
                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n----------------------\r\n" + Description));

                string solComment = cil.Comment;
                allDes = string.IsNullOrEmpty(solComment) ?
                allDes :
                (string.IsNullOrEmpty(allDes) ? solComment : (allDes + "\r\n----------------------\r\n" + solComment));


                // product description
                string productInfo = (cil.Power != "null" && cil.Power != "0" && !string.IsNullOrEmpty(cil.Power)) ? ("Power: " + cil.Power + "W\r\n") : string.Empty;
                productInfo += (cil.Driver != "null" && cil.Driver != "0" && !string.IsNullOrEmpty(cil.Driver)) ? ("Driver: " + cil.Driver + "\r\n") : string.Empty;
                productInfo += (cil.TempColor != "null" && cil.TempColor != "0" && !string.IsNullOrEmpty(cil.TempColor)) ? ("Col. Tmp.: " + cil.TempColor + "K\r\n") : string.Empty;
                productInfo += (cil.Length.HasValue && cil.Length != 0) ? ("Length: " + cil.Length.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Width.HasValue && cil.Width != 0) ? ("Width: " + cil.Width.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Height.HasValue && cil.Height != 0) ? ("Hight: " + cil.Height.Value.ToString("0.##") + "mm\r\n") : string.Empty;
                productInfo += (cil.Efflum.HasValue && cil.Efflum != 0) ? ("Light Effect>= " + cil.Efflum + "LUM/W\r\n") : string.Empty;
                productInfo += (cil.UGR.HasValue && cil.UGR != 0) ? ("UGR<= " + cil.UGR + "\r\n") : string.Empty;
                productInfo += (cil.CRI.HasValue && cil.CRI != 0) ? ("CRI>= " + cil.CRI + "\r\n") : string.Empty;
                productInfo += "Logistics: " + (cil.Logistic == "1" ? "Fastest plane/Express" : cil.Logistic == "2" ? "Cheapest plane" : "Ship") + "\r\n";
                productInfo += (cil.FeatureCode != "null" && cil.FeatureCode != "0" && !string.IsNullOrEmpty(cil.FeatureCode)) ? ("Feature Code: " + cil.FeatureCode + "\r\n") : string.Empty;

                allDes = string.IsNullOrEmpty(allDes) ? productInfo : (allDes + "\r\n----------------------\r\n" + productInfo);

                string Quantity = string.Format("{0:n2}", cil.Quantity);
                string supplir = cil.SupplierCompanyName;

                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
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
                        BorderWidthLeft = 0,
                        BorderWidthTop = 0.5f,
                        BorderWidthRight = 0,
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(supplir, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                //cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                //table.AddCell(cell);
                cell = CreateHeaderCell(allDes, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
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
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("RÉF ECOLED", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("FOURNISSEUR", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("RÉF", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("QUANTITÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            var comment = purchaseIntent.SupplierComment;
            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
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


            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            content = purchaseIntent.SupplierComment;
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

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
                table.AddCell(cell);
            }


            content = !string.IsNullOrEmpty(purchaseIntent.InterComment) ? purchaseIntent.InterComment : string.Empty;
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

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
                table.AddCell(cell);
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

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }
    }
}
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using iTextSharp.text;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;
using System.Text;
using AjaxControlToolkit;
using ERP.DataServices;
using ERP.Entities;

namespace ERP.RefSite.Shared
{
    public static partial class PDFGenerator
    {
        public static MemoryStream NewGeneratePdfForSupplierOrder(string path, PurchaseBaseClass supplierOrder)
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

            string reportTitle = string.Format("COMMANDE FOURNISSEUR N° : {0}", supplierOrder.SodCode);

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


            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);
            }
            #endregion Set space white

            #region Address

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supplierOrder.OneSupplier.CompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(supplierOrder.SupplierContact.ScoFirstname + " " + supplierOrder.SupplierContact.ScoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0}{1}", supplierOrder.SupplierContact.ScoAddress1, (string.IsNullOrEmpty(supplierOrder.SupplierContact.ScoAddress2) ? "" : ("\n" + supplierOrder.SupplierContact.ScoAddress2))), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            string cpvilleCountry = string.Format("{0} {2} {1}{3}",
                supplierOrder.SupplierContact.ScoPostcode,
                supplierOrder.SupplierContact.ScoCity,
                (!string.IsNullOrEmpty(supplierOrder.SupplierContact.ScoPostcode) && !string.IsNullOrEmpty(supplierOrder.SupplierContact.ScoCity) ? "/" : ""),
                (!string.IsNullOrEmpty(supplierOrder.SupplierContact.ScoCountry) ? ("\n" + supplierOrder.SupplierContact.ScoCountry) : ""));
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(cpvilleCountry, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
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
            cell = CreateHeaderCell(string.Format("Date : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom de Commande : {0}", supplierOrder.SodName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", supplierOrder.DateCreation), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Code de Commande : {0}", supplierOrder.SodCode), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell("RÉF ECOLED", BaseColor.LIGHT_GRAY, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("RÉF", BaseColor.LIGHT_GRAY, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("QUANTITÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = supplierOrder.PurchaseLines.Count;

            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = supplierOrder.PurchaseLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.PrdName;
                string supPrdName = !string.IsNullOrEmpty(cil.SupplierRef) ? cil.SupplierRef : string.Empty;
                string Description = cil.Description;
                string Quantity = string.Format("{0:n0}", cil.Quantity);

                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(supPrdName, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Description, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
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
                        cell = CreateHeaderCell("RÉF ECOLED", BaseColor.LIGHT_GRAY, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("RÉF", BaseColor.LIGHT_GRAY, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
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

            var comment = supplierOrder.SupplierComment;
            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);


            if (LastLineTotalHeight > 710)
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
            cell = CreateHeaderCell("BASE HT", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("TAUX TVA", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT. TVA", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT. TTC", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("Total HT", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("{0:n2}", totalHT), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            for (int lineIndex = 0; lineIndex < lineCount; lineIndex++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                if (lineIndex < tvaCount)
                {
                    var oneTva = tvaUsed.ElementAt(lineIndex);
                    var baseHt = allLines.Where(m => m.VatId == oneTva).Distinct().Sum(m => (m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva).Sum(m => ((m.UnitPriceWithDis ?? m.UnitPrice) * m.Quantity) * (m.VatRate / 100));
                    var ttcamount = baseHt + tvaamount;
                    bool withBottom = lineIndex == tvaCount - 1;
                    cell = CreateHeaderCell(string.Format("{0:n2}", baseHt), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", tvarate), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", tvaamount), BaseColor.WHITE, 2, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", ttcamount), BaseColor.WHITE, 3, bodyFont1st, withBottom, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "Remise";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "Net HT";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "Total TVA";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "Total TTC";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "NET À PAYER";
                            fieldValue = totalTtcNet;
                        }
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", fieldValue), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    var fieldName = "";
                    var fieldValue = netHt;
                    int lineIdxForCalculate = lineIndex;
                    lineIdxForCalculate = withDiscount ? lineIdxForCalculate - 1 : lineIdxForCalculate;
                    if (lineIdxForCalculate == -1 && withDiscount)
                    {
                        fieldName = "Remise";
                        fieldValue = discount;
                    }
                    else
                    {
                        if (lineIdxForCalculate == 0)
                        {
                            fieldName = "Net HT";
                            fieldValue = netHt;
                        }
                        if (lineIdxForCalculate == 1)
                        {
                            fieldName = "Total TVA";
                            fieldValue = totalTvaNet;
                        }
                        if (lineIdxForCalculate == 2)
                        {
                            fieldName = "Total TTC";
                            fieldValue = totalTtcNet;
                        }
                        if (lineIdxForCalculate == 3)
                        {
                            fieldName = "NET À PAYER";
                            fieldValue = totalTtcNet;
                        }
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", fieldValue), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;
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

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }
    }
}
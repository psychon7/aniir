using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using ERP.DataServices;
using ERP.Entities;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace ERP.SharedServices.PDF
{
    public static partial class PDFGenerator
    {

        #region Client Invoice Statment

        public static MemoryStream NewGeneratePdfForClientInvoiceStatment(string path, List<ClientInvoice> clientInvoices, DateTime selectedMonth, Society society)
        {
            CommonServices CommonServices = new CommonServices();
            //CommissionServices CommissionServices = new CommissionServices();
            doc = new Document(iTextSharp.text.PageSize.A4, 0, 0, 15, 45);
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

            //PdfPTable headerTable = CreateTable(1);

            //_headerTable = CreateTable(1, 0);
            finalTable = CreateTable(1, 0);
            middleTable = CreateTable(1, 0);

            table = CreateTable(nbColumns, 0, defineWidths);

            float leading = 1;

            #region Set space white

            string textSpace = " ";

            var HeaderFooter = CommonServices.GetHeaderFooter();

            #region Header

            string reportTitle = string.Format("RELEVÉ DE FACTURE DU {0:Y}", selectedMonth).ToUpper();

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
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
                        cell = CreateHeaderCell(conS, BaseColor.WHITE, 25, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 140, forContent: false);
                        table.AddCell(cell);
                        if (index == 0)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 1)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 2)
                        {
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 24, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (index == 3)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                        table.AddCell(cell);
                    }
                    if (contentCount < 4)
                    {
                        if (contentCount == 1)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 140, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 24, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                        }
                        else if (contentCount == 2)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 24, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);

                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                        else if (contentCount == 3)
                        {
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                            table.AddCell(cell);
                        }
                    }
                }
                else
                {
                    cell = CreateHeaderCell(content, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 140);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 24, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                    table.AddCell(cell);
                }
            }
            else
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 24, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 25, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 24, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
                table.AddCell(cell);

            }

            #endregion Header


            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);
            }
            #endregion Set space white


            for (int i = 0; i < 3; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Objet : {0}", reportTitle), BaseColor.WHITE, 48, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Madame, Monsieur"), BaseColor.WHITE, 48, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Voici la liste des factures en attente de règlement."), BaseColor.WHITE, 48, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //AddTableCinStt(middleTable, table);
            //table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            float minHeight = 13;
            cell = CreateHeaderCell("R. SOCIALE", BaseColor.WHITE, 7, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("N° FAC.", BaseColor.WHITE, 6, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("D. FAC.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("D. ÉCH.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT. HT", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT. TTC", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("PAYÉ", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("A PAYER", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);
            cell = CreateHeaderCell("COM.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            //middleTable.AddCell(table);
            //table = CreateTable(nbColumns, 0, defineWidths);

            // client invoice line

            int clientInvoiceLineCount = clientInvoices.Count;
            bool withTopBorder = true;

            decimal totalHt = 0;
            decimal totalTtc = 0;
            decimal totalpaid = 0;
            decimal totalrest = 0;
            int pagecount = 0;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var oneclientInvoice = clientInvoices.ElementAt(index);

                string cincode = oneclientInvoice.CinCode;
                var company = oneclientInvoice.ClientCompanyName;
                var cinDInvoice = oneclientInvoice.CinDInvoice;
                var cinDTerm = oneclientInvoice.CinDTerm;
                decimal amountHt = 0;
                decimal amountTtc = 0;

                foreach (var clientInvoiceLine in oneclientInvoice.ClientInvoiceLines)
                {
                    amountHt += (clientInvoiceLine.CiiTotalPrice ?? 0) * (oneclientInvoice.CinIsInvoice ? 1 : -1);
                    amountTtc += (clientInvoiceLine.CiiTotalCrudePrice ?? 0) * (oneclientInvoice.CinIsInvoice ? 1 : -1);
                }

                totalHt += amountHt;
                totalTtc += amountTtc;
                totalrest += oneclientInvoice.CinRest2Pay;
                totalpaid += (amountTtc - oneclientInvoice.CinRest2Pay);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(company, BaseColor.WHITE, 7, bodyFont7, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(cincode, BaseColor.WHITE, 6, bodyFont7, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(string.Format("{0:n2}", middleTable.TotalHeight), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                cell = CreateHeaderCell(string.Format("{0:d}", cinDInvoice), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(string.Format("{0:n2}", LastLineTotalHeight), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                cell = CreateHeaderCell(string.Format("{0:d}", cinDTerm), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n2}", amountHt), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n2}", amountTtc), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n2}", (amountTtc - oneclientInvoice.CinRest2Pay)), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n2}", oneclientInvoice.CinRest2Pay), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format(oneclientInvoice.UsrCommercial1), BaseColor.WHITE, 5, bodyFont7, true, Alignement.Left, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);


                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight );
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont7, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont7, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont7, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont7, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont7, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight );
                //table.AddCell(cell);

                if (index == clientInvoiceLineCount - 1)
                {
                    // last line add total
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell("TOTAL RESTANT DÛ", BaseColor.WHITE, 23, bodyFont9B, true, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", totalHt), BaseColor.WHITE, 5, bodyFont9B, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", totalTtc), BaseColor.WHITE, 5, bodyFont9B, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", totalpaid), BaseColor.WHITE, 5, bodyFont9BGreen, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", totalrest), BaseColor.WHITE, 5, bodyFont9BRed, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format(""), BaseColor.WHITE, 5, bodyFont9B, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                    table.AddCell(cell);
                }

                var addnewpage = pagecount != 0 ? middleTable.TotalHeight > 640 : middleTable.TotalHeight > 710;
                middleTable.AddCell(table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (addnewpage)
                {
                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTableCinStt(middleTable, table, addNewPage: true);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("R. SOCIALE", BaseColor.WHITE, 7, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("N° FAC.", BaseColor.WHITE, 6, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("D. FAC.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("D. ÉCH.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("MNT. HT", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("MNT. TTC", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("PAYÉ", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("A PAYER", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("COM.", BaseColor.WHITE, 5, bodyFont7, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont7, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);

                    }
                    pagecount++;
                }
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // add table to check the end of page

            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTableCinStt(middleTable, table, addNewPage: true);
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            content = "Restant à votre disposition pour tout renseignement complémentaire, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos sentiments distingués.";
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

                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 48, bodyFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                        table.AddCell(cell);

                    }
                }
                else
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(content, BaseColor.WHITE, 48, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
                    table.AddCell(cell);
                }
            }

            for (int i = 0; i < 3; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Left, false, false, leading, -1, minHeight: 10);
                table.AddCell(cell);
            }



            if (!string.IsNullOrEmpty(society.RibBankCode)
                && !string.IsNullOrEmpty(society.RibAgenceCode)
                && !string.IsNullOrEmpty(society.RibAgenceCode)
                && !string.IsNullOrEmpty(society.RibAccountNumber)
                && !string.IsNullOrEmpty(society.RibKey)
                )
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                var hasDomiciliation = !string.IsNullOrEmpty(society.RibAddress);

                var accountOwner = string.Format("Titulaire du compte (Account Owner)\r\n{0}", society.RibName);
                accountOwner = accountOwner.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
                accountOwner += "<br/>";
                cell = CreateHeaderCell(accountOwner, BaseColor.WHITE, (hasDomiciliation ? 21 : 42), bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, isDescription: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                if (hasDomiciliation)
                {
                    var accountDomiciliation = string.Format("Domiciliation\r\n{0}", society.RibAddress);
                    accountDomiciliation = accountDomiciliation.Replace("\r\n", "<br/>").Replace("\n", "<br/>");
                    accountDomiciliation += "<br/>";
                    cell = CreateHeaderCell(accountDomiciliation, BaseColor.WHITE, 21, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, isDescription: true, forContent: true, footerTop: 0, minHeight: 10);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);

                // ---- new line
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell("Code Banque", BaseColor.WHITE, 6, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell("Code Agence", BaseColor.WHITE, 6, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell("Numéro de compte", BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell("Clé", BaseColor.WHITE, 6, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell("Domiciliation", BaseColor.WHITE, 15, bodyFont, false, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 10);
                table.AddCell(cell);

                // ---- new line
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell("RIB", BaseColor.WHITE, 3, bodyFont, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibBankCode, BaseColor.WHITE, 6, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibAgenceCode, BaseColor.WHITE, 6, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibAccountNumber, BaseColor.WHITE, 9, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibKey, BaseColor.WHITE, 6, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibDomiciliationAgency, BaseColor.WHITE, 15, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: false, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);

                if (string.IsNullOrEmpty(society.RibCodeIban))
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
                    table.AddCell(cell);
                }
            }
            if (!string.IsNullOrEmpty(society.RibCodeIban))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell("IBAN", BaseColor.WHITE, 3, bodyFont, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibCodeIban, BaseColor.WHITE, 21, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell("BIC", BaseColor.WHITE, 6, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(society.RibCodeBic, BaseColor.WHITE, 15, bodyFont, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, bodyFont, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 50, bodyFont, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
                table.AddCell(cell);
            }

            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfForCinStatment_hk(string path, List<ClientInvoice> clientInvoices, DateTime selectedMonth, Society society)
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

            string reportTitle = string.Format("该月账单结单 BILLING STATEMENT OF {0:Y}", selectedMonth).ToUpper();

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

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
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 13, fontKT12B, false, Alignement.Center, false, false, leading, borderLeft: -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: -1);
            table.AddCell(cell);

            #endregion Header


            for (int i = 0; i < 2; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, borderLeft: 140);
                table.AddCell(cell);
            }
            #endregion Set space white

            #region header

            var oneCin = clientInvoices.FirstOrDefault();

            float spaceLogo = 10;
            var clientinfor = string.Empty;
            clientinfor += oneCin.ClientCompanyName.ToUpper();
            clientinfor += (string.IsNullOrEmpty(oneCin.Inv_CcoAddress1) ? "" : ("\r\n" + oneCin.Inv_CcoAddress1));
            clientinfor += (string.IsNullOrEmpty(oneCin.Inv_CcoAddress2) ? "" : ("\r\n" + oneCin.Inv_CcoAddress2));

            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
               oneCin.Inv_CcoPostcode,
               oneCin.Inv_CcoCity,
               !string.IsNullOrEmpty(oneCin.Inv_CcoPostcode) && !string.IsNullOrEmpty(oneCin.Inv_CcoCity) ? " / " : "",
                (!string.IsNullOrEmpty(oneCin.Inv_CcoPostcode) || !string.IsNullOrEmpty(oneCin.Inv_CcoCity)) && !string.IsNullOrEmpty(oneCin.Inv_CcoCountry) ? " " : "",
               oneCin.Inv_CcoCountry);

            clientinfor += (string.IsNullOrEmpty(cpvilleInv) ? "" : ("\r\n" + cpvilleInv));


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1, withTopBorder: false);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 8, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0, withTopBorder: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 26, fontKT13B, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(clientinfor, greenC4FFC4, 8, fontKT11B, false, Alignement.Left, false, false, leading, spaceLogo);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, greenC4FFC4, 8, headerTextFont, false, Alignement.Left, false, false, leading, spaceLogo, forFooter: false, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            #endregion header


            for (int i = 0; i < 1; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
                table.AddCell(cell);
            }


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("主题 Subject : {0}", reportTitle), BaseColor.WHITE, 18, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("您好 How are you?"), BaseColor.WHITE, 18, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("这是等待付款的发票清单。Here is the list of invoices awaiting payment."), BaseColor.WHITE, 18, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // références, client invocie line
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            AddTable(middleTable, table);
            table = CreateTable(nbColumns, 0, defineWidths);

            // title
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("发票号 CI N°", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("发票日期 CI Date", BaseColor.WHITE, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("D. ÉCHÉANCE", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("未税总价 AMT E. TOTAL", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("含税总价 AMT I. TOTAL", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = clientInvoices.Count;
            bool withTopBorder = true;

            decimal totalHt = 0;
            decimal totalTtc = 0;
            float minHeight = 20;

            var symbols = clientInvoices.Select(l => l.CurrencySymbol).Distinct().ToList();
            var symbolsTotal = symbols.Select(onesym => new KeyValue
            {
                Value = onesym,
                DcValue = 0,
                DcValue2 = 0
            }).ToList();

            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var oneclientInvoice = clientInvoices.ElementAt(index);

                string cincode = oneclientInvoice.CinCode;
                var cinDInvoice = oneclientInvoice.CinDInvoice;
                var cinDTerm = oneclientInvoice.CinDTerm;
                decimal amountHt = 0;
                decimal amountTtc = 0;



                foreach (var clientInvoiceLine in oneclientInvoice.ClientInvoiceLines)
                {
                    amountHt += (clientInvoiceLine.CiiTotalPrice ?? 0) * (oneclientInvoice.CinIsInvoice ? 1 : -1);
                    amountTtc += (clientInvoiceLine.CiiTotalCrudePrice ?? 0) * (oneclientInvoice.CinIsInvoice ? 1 : -1);
                }

                var thisamount = symbolsTotal.FirstOrDefault(l => l.Value == oneclientInvoice.CurrencySymbol);
                if (thisamount != null)
                {
                    thisamount.DcValue += amountHt;
                    thisamount.DcValue2 += amountTtc;
                }

                totalHt += amountHt;
                totalTtc += amountTtc;

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(cincode, BaseColor.WHITE, 4, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:d}", cinDInvoice), BaseColor.WHITE, 5, fontKT09, false, Alignement.Right, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                //cell = CreateHeaderCell(string.Format("{0:d}", cinDTerm), BaseColor.WHITE, 4, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                //table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n3}", amountHt), BaseColor.WHITE, 4, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(string.Format("{0:n3} {1}", amountTtc, oneclientInvoice.CurrencySymbol), BaseColor.WHITE, 4, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                table.AddCell(cell);


                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight );
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT09, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, fontKT09, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, fontKT09, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                //table.AddCell(cell);
                //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight );
                //table.AddCell(cell);

                if (index == clientInvoiceLineCount - 1)
                {
                    foreach (var keyValue in symbolsTotal)
                    {
                        // last line add total
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("应付总额 TOTAL REMAINING DUE " + keyValue.Value, greenC4FFC4, 9, fontKT09B, true, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", keyValue.DcValue, keyValue.Value), greenC4FFC4, 4, headerTextFont2, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(string.Format("{0:n3} {1}", keyValue.DcValue2, keyValue.Value), greenC4FFC4, 4, headerTextFont2, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                        table.AddCell(cell);
                    }

                    //// last line add total
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell("应付总额 TOTAL REMAINING DUE", greenC4FFC4, 9, fontKT09B, true, Alignement.Center, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", totalHt, oneCin.CurrencySymbol), greenC4FFC4, 4, headerTextFont2, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(string.Format("{0:n3} {1}", totalTtc, oneCin.CurrencySymbol), greenC4FFC4, 4, headerTextFont2, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minHeight);
                    //table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minHeight);
                    //table.AddCell(cell);


                }


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, fontKT09, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, fontKT09, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, fontKT09, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);

                    AddTable(middleTable, table);
                    table = CreateTable(nbColumns, 0, defineWidths);

                    if (index < clientInvoiceLineCount - 1)
                    {
                        AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);
                        table = CreateTable(nbColumns, 0, defineWidths);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("发票号 CI N°", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("发票日期 CI Date", BaseColor.WHITE, 5, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("D. ÉCHÉANCE", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("未税总价 AMT E. TOTAL", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("含税总价 AMT I. TOTAL", BaseColor.WHITE, 4, fontKT09, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, fontKT09, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
            }



            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // add table to check the end of page

            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            content = "希望您在收到本通知后一周内向我公司支付剩余款项，如因特殊原因不能及时支付，请您及时与我公司取得联系，谢谢。 I hope you will pay the remaining amount to our company within one week after receiving this notice. If you cannot pay in time due to special reasons, please contact our company in time, thank you.";
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

                        cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, fontKT09, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
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

            for (int i = 0; i < 3; i++)
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, fontKT09, false, Alignement.Left, false, false, leading, -1, minHeight: 10);
                table.AddCell(cell);
            }


            var ribContent = "\r\nBank Information:";
            ribContent += (string.IsNullOrEmpty(society.RibAddress) ? string.Empty : (string.Format("\r\nBank Name : \r\n{0}", society.RibAddress)));
            ribContent += (string.IsNullOrEmpty(society.RibName) ? string.Empty : (string.Format("\r\nBeneficiary Account Name : \r\n{0}", society.RibName)));
            ribContent += (string.IsNullOrEmpty(society.RibDomiciliationAgency) ? string.Empty : (string.Format("\r\nBank Address : \r\n{0}", society.RibDomiciliationAgency)));
            ribContent += (string.IsNullOrEmpty(society.RibCodeIban) ? string.Empty : (string.Format("\r\nAccount number : \r\n{0}", society.RibCodeIban)));
            ribContent += (string.IsNullOrEmpty(society.RibCodeBic) ? string.Empty : (string.Format("\r\nSWIFT Code : {0}", society.RibCodeBic)));
            ribContent += (string.IsNullOrEmpty(society.RibBankCode) ? string.Empty : (string.Format("\r\nBank Code (If paying from Hong Kong banks) : \r\n{0}", society.RibBankCode)));
            ribContent += (string.IsNullOrEmpty(society.RibAgenceCode) ? string.Empty : (string.Format("\r\nBranch Code (If paying from Hong Kong banks) : \r\n{0}", society.RibAgenceCode)));
            ribContent += "\r\n ";
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 17, fontKT09, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);




            middleTable.AddCell(table);

            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        #endregion Client Invoice Statment

    }
}

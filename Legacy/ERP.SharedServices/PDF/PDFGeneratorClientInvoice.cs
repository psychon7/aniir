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
        public static MemoryStream PdfCin(string path, ClientInvoice clientinvoice, Society society, string DownloadTechSheetUrl, bool withTechSheet = false, int lgsId = 0)
        {
            int avoirCoef = clientinvoice.CinAccount ? -1 : 1;
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

            string title = clientinvoice.CinIsInvoice ? "FACTURE" : "AVOIR";

            //string reportTitle = string.Format("{0} N° : {1}", title, clientinvoice.CinCode);
            string reportTitle = string.Format("{0} N° : {1}{2}", title, clientinvoice.CinCode, (lgsId != 0 ? "-EXP" : ""));

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

            #region Address Field

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Center, true, true, leading, -1, withTopBorder: true);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("ADRESSE DE LIVRAISON"), BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.ClientCompanyName.ToUpper(), BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Inv_CcoFirstname + " " + clientinvoice.Inv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell("SERVICE COMPTABILITÉ", BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Dlv_CcoAddress1, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.Inv_CcoAddress1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Dlv_CcoAddress2, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.Inv_CcoAddress2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //string cpvilleDlv = string.Format("{0}{2}{1}{3}{4}",
            //    clientinvoice.Dlv_CcoPostcode,
            //    clientinvoice.Dlv_CcoCity,
            //    !string.IsNullOrEmpty(clientinvoice.Dlv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCity) ? " / " : "",
            //      (!string.IsNullOrEmpty(clientinvoice.Dlv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCountry) ? " " : "",
            //    clientinvoice.Dlv_CcoCountry);
            //cell = CreateHeaderCell(cpvilleDlv, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
                clientinvoice.Inv_CcoPostcode,
                clientinvoice.Inv_CcoCity,
                !string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity) ? " / " : "",
                 (!string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCountry) ? " " : "",
                clientinvoice.Inv_CcoCountry);
            cell = CreateHeaderCell(cpvilleInv, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address Field

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            if (!string.IsNullOrEmpty(clientinvoice.CinHeaderText))
            {
                string newline = clientinvoice.CinHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }



            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Date du jour : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", society.TvaIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format(""), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de facture : {0:dd-MMM-yyyy}", clientinvoice.CinDInvoice), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", society.TvaIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date d'échéance : {0:dd-MMM-yyyy}", clientinvoice.CinDTerm), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("V/Id CEE : {0}", clientinvoice.ClientForPdf.VatIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Condition de règlement : {0}", clientinvoice.PaymentCondition), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom d'Affaire : {0}", clientinvoice.PrjName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Mode de règlement : {0}", clientinvoice.PaymentMode), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            string relatedInvoice = clientinvoice.CinIsInvoice ? textSpace : string.Format("Facture N° : {0}", clientinvoice.CinAvCode);
            cell = CreateHeaderCell(relatedInvoice, BaseColor.WHITE, 18, headerTextFont2, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Fiche Technique (cliquer):"), BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("http://t.e-c-o.com?i={0}", clientinvoice.FId), BaseColor.WHITE, 14, bodyFont1stLink, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

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
            //cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            //cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 6, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = clientinvoice.ClientInvoiceLines.Count;
            bool withTopBorder = true;

            float minheight = 10;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = clientinvoice.ClientInvoiceLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.CiiPrdName;

                string Description = cil.CiiDescription;
                string PrdDescription = cil.CiiPrdDes;
                Description = !string.IsNullOrEmpty(Description)
                    ? (Description.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>"))
                    : Description;

                PrdDescription = !string.IsNullOrEmpty(PrdDescription)
                    ? (PrdDescription.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>"))
                    : PrdDescription;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "<br/>----------------------<br/>" + Description));
                if (cil.PrdId != null && cil.PrdId != 0)
                {
                    if (!string.IsNullOrEmpty(DownloadTechSheetUrl) && withTechSheet && !cil.IsAcc)
                    {
                        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.CiiPrdName, DownloadTechSheetUrl);
                    }
                }

                string order = string.Format("{0:n0}.{1:n0}", cil.CiiLevel1, cil.CiiLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiUnitPrice * avoirCoef) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;
                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5 || cil.LtpId == 7) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;
                string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0}", cil.VatLabel) : string.Empty;

                if (!string.IsNullOrEmpty(allDes) && allDes.Length > 600)
                {
                    allDes = allDes.Substring(0, 600) + "... ...";
                }

                //cell = CreateHeaderCell(order, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                //table.AddCell(cell);

                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    //string prdImagePath = cil.PrdImgPath;
                    //if (File.Exists(prdImagePath))
                    //{
                    //    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                    //    // Load the image
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
                    //        BorderWidthBottom = 0,
                    //        BorderWidthLeft = 0.5f,
                    //        BorderWidthTop = 0f,
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
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    //    table.AddCell(cell);
                    //}
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", ClnTotalPrice, clientinvoice.CurrencySymbol), BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);               
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }

                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 6, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1 && cil.LtpId != 3)
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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

            for (int i = 0; i < 5; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(clientinvoice.CinFooterText))
            {
                string newline = clientinvoice.CinFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = clientinvoice.CinClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(comment, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            if (clientinvoice.DfoList.Any())
            {
                var dfos = clientinvoice.DfoList.Aggregate("Bon de livraison : \r\n", (current, onedfo) => current + (onedfo + "\r\n"));
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(dfos, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //for (int i = 0; i < 10; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 600)
            //    {
            //        break;
            //    }
            //}


            // add table to check the end of page

            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            // total line title
            var allLines = clientinvoice.ClientInvoiceLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientinvoice.CinDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientinvoice.CinDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
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
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    var baseHt = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7)).Distinct().Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate * avoirCoef;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7)).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
                    var ttcamount = (baseHt + tvaamount);
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
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // add bank information, rib and iban


            #region Footer Text

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCell(content, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);



            #region RIB IBAN

            //if (!string.IsNullOrEmpty(society.RibBankCode)
            //    && !string.IsNullOrEmpty(society.RibAgenceCode)
            //    && !string.IsNullOrEmpty(society.RibAccountNumber)
            //    && !string.IsNullOrEmpty(society.RibKey)
            //    )
            //if (!clientinvoice.CinBank.HasValue || clientinvoice.CinBank == 1 || clientinvoice.CinBank == 0)
            //{
            var hasDomiciliation = !string.IsNullOrEmpty(clientinvoice.RibAddress);
            var ribContent = "<table border='1' rules='all' >" +
                             "<tr>" +
                             "<th style='font-size:7pt;text-align:left;' colspan='" + (hasDomiciliation ? 3 : 6) + "'>Titulaire du compte (Account Owner)<br/>" + clientinvoice.RibName.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" +
                             (hasDomiciliation ? "<th style='font-size:7pt;text-align:left;' colspan='3'>Domiciliation<br/>" + clientinvoice.RibAddress.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" : "") +
                             "</tr>" +
                             "<tr>" +
                             "<th style='font-size:7pt;text-align:center;' colspan='6'>RIB</th>" +
                             "</tr>" +
                             "<tr>" +
                             "<th style='font-size:7pt;text-align:center;'>Code Banque</th>" +
                             "<th style='font-size:7pt;text-align:center;'>Code Agence</th>" +
                             "<th style='font-size:7pt;text-align:center;'>N° compte</th>" +
                             "<th style='font-size:7pt;text-align:center;'>Clé</th>" +
                             "<th style='font-size:7pt;text-align:center;' colspan='2'>Domiciliation</th>" +
                             "</tr>" +
                             "<tr>" +
                             "<td style='font-size:7pt;text-align:center;'>" + clientinvoice.RibBankCode + "</td>" +
                             "<td style='font-size:7pt;text-align:center;'>" + clientinvoice.RibAgenceCode + "</td>" +
                             "<td style='font-size:7pt;text-align:center;'>" + clientinvoice.RibAccountNumber + "</td>" +
                             "<td style='font-size:7pt;text-align:center;'>" + clientinvoice.RibKey + "</td>" +
                             "<td style='font-size:7pt;text-align:center;' colspan='2'>" + clientinvoice.RibBankName +
                             "</td>" +
                             "</tr>" +
                             "<tr>" +
                             "<td style='font-size:7pt;text-align:center;' colspan='3'>IBAN:" + clientinvoice.RibCodeIban + "</td>" +
                             "<td style='font-size:7pt;text-align:center;' colspan='3'>BIC:" + clientinvoice.RibCodeBic + "</td>" +
                             "</td>" +
                             "</tr>" +
                             "</table>";


            cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, false, false, leading, withTopBorder: false, forContent: true, isDescription: true, footerTop: 0, minHeight: 10);
            table.AddCell(cell);
            //}
            //else
            //{
            //    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, false, false, leading, withTopBorder: false, forContent: true, isDescription: true, footerTop: 0, minHeight: 10);
            //    //table.AddCell(cell);
            //    var hasDomiciliation = !string.IsNullOrEmpty(society.RibAddress2);
            //    var ribContent = "<table border='1' rules='all' >" +
            //                     "<tr>" +
            //                     "<th style='font-size:7pt;text-align:left;' colspan='" + (hasDomiciliation ? 3 : 6) + "'>Titulaire du compte (Account Owner)<br/>" + society.RibName2.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" +
            //                     (hasDomiciliation ? "<th style='font-size:7pt;text-align:left;' colspan='3'>Domiciliation<br/>" + society.RibAddress2.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" : "") +
            //                     "</tr>" +
            //                     "<tr>" +
            //                     "<th style='font-size:7pt;text-align:center;' colspan='6'>RIB</th>" +
            //                     "</tr>" +
            //                     "<tr>" +
            //                     "<th style='font-size:7pt;text-align:center;'>Code Banque</th>" +
            //                     "<th style='font-size:7pt;text-align:center;'>Code Agence</th>" +
            //                     "<th style='font-size:7pt;text-align:center;'>N° compte</th>" +
            //                     "<th style='font-size:7pt;text-align:center;'>Clé</th>" +
            //                     "<th style='font-size:7pt;text-align:center;' colspan='2'>Domiciliation</th>" +
            //                     "</tr>" +
            //                     "<tr>" +
            //                     "<td style='font-size:7pt;text-align:center;'>" + society.RibBankCode2 + "</td>" +
            //                     "<td style='font-size:7pt;text-align:center;'>" + society.RibAgenceCode2 + "</td>" +
            //                     "<td style='font-size:7pt;text-align:center;'>" + society.RibAccountNumber2 + "</td>" +
            //                     "<td style='font-size:7pt;text-align:center;'>" + society.RibKey2 + "</td>" +
            //                     "<td style='font-size:7pt;text-align:center;' colspan='2'>" + society.RibDomiciliationAgency2 +
            //                     "</td>" +
            //                     "</tr>" +
            //                     "<tr>" +
            //                     "<td style='font-size:7pt;text-align:center;' colspan='3'>IBAN:" + society.RibCodeIban2 + "</td>" +
            //                     "<td style='font-size:7pt;text-align:center;' colspan='3'>BIC:" + society.RibCodeBic2 + "</td>" +
            //                     "</td>" +
            //                     "</tr>" +
            //                     "</table>";


            //    cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, false, false, leading, withTopBorder: false, forContent: true, isDescription: true, footerTop: 0, minHeight: 10);
            //    table.AddCell(cell);
            //}

            #endregion RIB IBAN

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            #endregion Footer Text


            middleTable.AddCell(table);


            #region Penality
            // add table to check the end of page
            // 20180112 add pageHeight Chenglin
            var pageHeight = 790;
            pageHeight = 1200;
            if (LastLineTotalHeight > pageHeight)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            for (int i = 0; i < 500; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 790)
                {
                    break;
                }
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            //string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            string penality = string.Format("{0} - {1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment);
            cell = CreateHeaderCell(penality, BaseColor.WHITE, 19, bodyFont7, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            string reserveText = HeaderFooter.DeliveryFooterLaw;
            cell = CreateHeaderCell(reserveText, BaseColor.WHITE, 19, bodyFont7, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }

        public static MemoryStream PdfCinWithImg(string path, ClientInvoice clientinvoice, Society society, string DownloadTechSheetUrl, bool withTechSheet = false, int lgsId = 0)
        {
            int avoirCoef = clientinvoice.CinAccount ? -1 : 1;
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

            string title = clientinvoice.CinIsInvoice ? "FACTURE" : "AVOIR";

            //string reportTitle = string.Format("{0} N° : {1}", title, clientinvoice.CinCode);
            string reportTitle = string.Format("{0} N° : {1}{2}", title, clientinvoice.CinCode, (lgsId != 0 ? "-EXP" : ""));

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

            #region Address Field

            float spaceLogo = 0;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Center, true, true, leading, -1, withTopBorder: true);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("ADRESSE DE LIVRAISON"), BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.ClientCompanyName.ToUpper(), BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Inv_CcoFirstname + " " + clientinvoice.Inv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell("SERVICE COMPTABILITÉ", BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Dlv_CcoAddress1, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.Inv_CcoAddress1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(clientinvoice.Dlv_CcoAddress2, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(clientinvoice.Inv_CcoAddress2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //string cpvilleDlv = string.Format("{0}{2}{1}{3}{4}",
            //    clientinvoice.Dlv_CcoPostcode,
            //    clientinvoice.Dlv_CcoCity,
            //    !string.IsNullOrEmpty(clientinvoice.Dlv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCity) ? " / " : "",
            //      (!string.IsNullOrEmpty(clientinvoice.Dlv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Dlv_CcoCountry) ? " " : "",
            //    clientinvoice.Dlv_CcoCountry);
            //cell = CreateHeaderCell(cpvilleDlv, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, 10);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            string cpvilleInv = string.Format("{0}{2}{1}{3}{4}",
                clientinvoice.Inv_CcoPostcode,
                clientinvoice.Inv_CcoCity,
                !string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity) ? " / " : "",
                 (!string.IsNullOrEmpty(clientinvoice.Inv_CcoPostcode) || !string.IsNullOrEmpty(clientinvoice.Inv_CcoCity)) && !string.IsNullOrEmpty(clientinvoice.Inv_CcoCountry) ? " " : "",
                clientinvoice.Inv_CcoCountry);
            cell = CreateHeaderCell(cpvilleInv, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // liv
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            #endregion Address Field

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            if (!string.IsNullOrEmpty(clientinvoice.CinHeaderText))
            {
                string newline = clientinvoice.CinHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }



            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Date du jour : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", society.TvaIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format(""), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de facture : {0:dd-MMM-yyyy}", clientinvoice.CinDInvoice), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", society.TvaIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date d'échéance : {0:dd-MMM-yyyy}", clientinvoice.CinDTerm), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("V/Id CEE : {0}", clientinvoice.ClientForPdf.VatIntra), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Condition de règlement : {0}", clientinvoice.PaymentCondition), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom d'Affaire : {0}", clientinvoice.PrjName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Mode de règlement : {0}", clientinvoice.PaymentMode), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            string relatedInvoice = clientinvoice.CinIsInvoice ? textSpace : string.Format("Facture N° : {0}", clientinvoice.CinAvCode);
            cell = CreateHeaderCell(relatedInvoice, BaseColor.WHITE, 18, headerTextFont2, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Fiche Technique (cliquer):"), BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("http://t.e-c-o.com?i={0}", clientinvoice.FId), BaseColor.WHITE, 14, bodyFont1stLink, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);

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
            //cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 5, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);

            middleTable.AddCell(table);


            table = CreateTable(nbColumns, 0, defineWidths);
            // client invoice line

            int clientInvoiceLineCount = clientinvoice.ClientInvoiceLines.Count;
            bool withTopBorder = true;

            float minheight = 10;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = clientinvoice.ClientInvoiceLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.CiiPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.CiiPrdName;

                string Description = cil.CiiDescription;
                string PrdDescription = cil.CiiPrdDes;
                Description = !string.IsNullOrEmpty(Description)
                    ? (Description.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>"))
                    : Description;

                PrdDescription = !string.IsNullOrEmpty(PrdDescription)
                    ? (PrdDescription.Replace("\r\n", "<br/>").Replace("\n", "<br/>").Replace("\r", "<br/>"))
                    : PrdDescription;

                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "<br/>----------------------<br/>" + Description));
                if (cil.PrdId != null && cil.PrdId != 0)
                {
                    if (!string.IsNullOrEmpty(DownloadTechSheetUrl) && withTechSheet && !cil.IsAcc)
                    {
                        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.CiiPrdName, DownloadTechSheetUrl);
                    }
                }

                if (allDes.Length > 600)
                {
                    allDes = string.Format("{0} ... ...", allDes.Substring(0, 600));
                }


                string order = string.Format("{0:n0}.{1:n0}", cil.CiiLevel1, cil.CiiLevel2);
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", cil.CiiUnitPrice * avoirCoef) : string.Empty;
                //string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                //string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;
                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * avoirCoef) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5 || cil.LtpId == 7) ? string.Format("{0:n2}", (cil.CiiUnitPrice - (cil.CiiDiscountAmount ?? 0)) * cil.CiiQuantity * avoirCoef) : string.Empty;
                string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 7) ? string.Format("{0}", cil.VatLabel) : string.Empty;

                if (!string.IsNullOrEmpty(allDes) && allDes.Length > 600)
                {
                    allDes = allDes.Substring(0, 600) + "... ...";
                }

                //cell = CreateHeaderCell(order, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                //table.AddCell(cell);

                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    string prdImagePath = cil.PrdImgPath;
                    if (File.Exists(prdImagePath))
                    {
                        //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                        // Load the image
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
                            BorderWidthTop = 0f,
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
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                        table.AddCell(cell);
                    }
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", ClnTotalPrice, clientinvoice.CurrencySymbol), BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);

                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, true, true, leading, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);               
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);

                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }
                else
                {
                    cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, true, true, leading, 5, isDescription: true, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: minheight);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }

                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell("N°", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 5, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                }
                else
                {
                    if (index == clientInvoiceLineCount - 1 && cil.LtpId != 3)
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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

            for (int i = 0; i < 5; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 400)
                {
                    break;
                }
            }

            if (!string.IsNullOrEmpty(clientinvoice.CinFooterText))
            {
                string newline = clientinvoice.CinFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = clientinvoice.CinFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
                table.AddCell(cell);
            }

            var comment = clientinvoice.CinClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(comment, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            if (clientinvoice.DfoList.Any())
            {
                var dfos = clientinvoice.DfoList.Aggregate("Bon de livraison : \r\n", (current, onedfo) => current + (onedfo + "\r\n"));
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(dfos, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
            }

            //table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(comment, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //for (int i = 0; i < 10; i++)
            //{
            //    table = CreateTable(nbColumns, 0, defineWidths);
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    AddTable(middleTable, table);
            //    if (LastLineTotalHeight >= 600)
            //    {
            //        break;
            //    }
            //}


            // add table to check the end of page

            if (LastLineTotalHeight > 710 && LastLineTotalHeight < 780)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }


            table = CreateTable(nbColumns, 0, defineWidths);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // total line 

            // total line title
            var allLines = clientinvoice.ClientInvoiceLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (clientinvoice.CinDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 5 : 4;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (1 + m.VatRate / 100)) * avoirCoef;
            var discount = clientinvoice.CinDiscountAmount ?? 0;
            var netHt = (totalHT - discount);
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
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
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    var baseHt = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7)).Distinct().Sum(m => (m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * avoirCoef;
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate * avoirCoef;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2 || m.LtpId == 7)).Sum(m => ((m.CiiPriceWithDiscountHt ?? m.CiiUnitPrice) * m.CiiQuantity) * (m.VatRate / 100)) * avoirCoef;
                    var ttcamount = (baseHt + tvaamount);
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
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, clientinvoice.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            // add bank information, rib and iban


            #region Footer Text

            content = HeaderFooter != null ? HeaderFooter.OtherFooter : string.Empty;

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            cell = CreateHeaderCell(content, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);



            #region RIB IBAN

            if (!string.IsNullOrEmpty(society.RibBankCode)
                && !string.IsNullOrEmpty(society.RibAgenceCode)
                && !string.IsNullOrEmpty(society.RibAccountNumber)
                && !string.IsNullOrEmpty(society.RibKey)
                )
            {
                var hasDomiciliation = !string.IsNullOrEmpty(society.RibAddress);
                var ribContent = "<table border='1' rules='all' >" +
                                 "<tr>" +
                                 "<th style='font-size:7pt;text-align:left;' colspan='" + (hasDomiciliation ? 3 : 6) + "'>Titulaire du compte (Account Owner)<br/>" + society.RibName.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" +
                                 (hasDomiciliation ? "<th style='font-size:7pt;text-align:left;' colspan='3'>Domiciliation<br/>" + society.RibAddress.Replace("\r\n", "<br/>").Replace("\n", "<br/>") + "</th>" : "") +
                                 "</tr>" +
                                 "<tr>" +
                                 "<th style='font-size:7pt;text-align:center;' colspan='6'>RIB</th>" +
                                 "</tr>" +
                                 "<tr>" +
                                 "<th style='font-size:7pt;text-align:center;'>Code Banque</th>" +
                                 "<th style='font-size:7pt;text-align:center;'>Code Agence</th>" +
                                 "<th style='font-size:7pt;text-align:center;'>N° compte</th>" +
                                 "<th style='font-size:7pt;text-align:center;'>Clé</th>" +
                                 "<th style='font-size:7pt;text-align:center;' colspan='2'>Domiciliation</th>" +
                                 "</tr>" +
                                 "<tr>" +
                                 "<td style='font-size:7pt;text-align:center;'>" + society.RibBankCode + "</td>" +
                                 "<td style='font-size:7pt;text-align:center;'>" + society.RibAgenceCode + "</td>" +
                                 "<td style='font-size:7pt;text-align:center;'>" + society.RibAccountNumber + "</td>" +
                                 "<td style='font-size:7pt;text-align:center;'>" + society.RibKey + "</td>" +
                                 "<td style='font-size:7pt;text-align:center;' colspan='2'>" + society.RibDomiciliationAgency +
                                 "</td>" +
                                 "</tr>" +
                                 "<tr>" +
                                 "<td style='font-size:7pt;text-align:center;' colspan='3'>IBAN:" + society.RibCodeIban + "</td>" +
                                 "<td style='font-size:7pt;text-align:center;' colspan='3'>BIC:" + society.RibCodeBic + "</td>" +
                                 "</td>" +
                                 "</tr>" +
                                 "</table>";


                cell = CreateHeaderCell(ribContent, BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, false, false, leading, withTopBorder: false, forContent: true, isDescription: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
            }
            else
            {
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 9, bodyFont, false, Alignement.Center, false, false, leading, withTopBorder: false, forContent: true, isDescription: true, footerTop: 0, minHeight: 10);
                table.AddCell(cell);
            }

            #endregion RIB IBAN

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
            table.AddCell(cell);

            #endregion Footer Text


            middleTable.AddCell(table);


            #region Penality
            // add table to check the end of page
            // 20180112 add pageHeight Chenglin
            var pageHeight = 790;
            pageHeight = 1200;
            if (LastLineTotalHeight > pageHeight)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                AddTable(middleTable, table, addNewPage: true);
            }

            for (int i = 0; i < 500; i++)
            {
                table = CreateTable(nbColumns, 0, defineWidths);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 30);
                table.AddCell(cell);
                AddTable(middleTable, table);
                if (LastLineTotalHeight >= 790)
                {
                    break;
                }
            }

            table = CreateTable(nbColumns, 0, defineWidths);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, 8, withTopBorder: false, forContent: true, footerTop: 0, minHeight: 20);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 10);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            //string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";
            string penality = string.Format("{0} - {1}", HeaderFooter.ClientInvoicePenality, HeaderFooter.ClientInvoiceDiscountForPrepayment);
            cell = CreateHeaderCell(penality, BaseColor.WHITE, 19, bodyFont7, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);
            string reserveText = HeaderFooter.DeliveryFooterLaw;
            cell = CreateHeaderCell(reserveText, BaseColor.WHITE, 19, bodyFont7, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            table.AddCell(cell);

            #endregion Penality

            middleTable.AddCell(table);



            doc.Add(middleTable);

            doc.Close();
            return output;
        }
    }
}